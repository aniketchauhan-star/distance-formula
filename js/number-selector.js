/* =============================================================
   Number selector — a left arrow, one number on a track, a right
   arrow, and Check.

   Self-contained: it owns its markup and its styles, exposes the same
   small surface the game already used (mount / show / hide / reset /
   set / setRange / markCorrect / markWrong / lock / onChange /
   onCheck), and knows nothing about what any answer should be — the
   game tells it whether a guess was right, it does not work that out.

   Only the selected value is drawn. The neighbours are gone: three
   numbers side by side made the child read all three to find the one
   that counted, where one number in the middle of a track says what
   is chosen and nothing else. The markers on the track carry the
   sense of position the neighbours used to.

   All of the look and all of the feedback live in CSS classes; this
   file only sets values and toggles state.
   ============================================================= */
window.NumberSelector = (function () {
  'use strict';

  /* It opens on 0: nothing has been measured yet, so the control says
     nothing has been measured yet. The back arrow is disabled there,
     which is the truth — there is nothing below no distance at all. */
  const MIN = 0, MAX = 8, START = 0;

  const DOTS = 4;           // markers on the track, two either side
  const OUT_MS = 90;        // the digit leaving
  const IN_MS = 140;        // the one arriving

  function mount(parent, opts) {
    opts = opts || {};

    let min = opts.min != null ? opts.min : MIN;
    let max = opts.max != null ? opts.max : MAX;
    let startAt = opts.start != null ? opts.start : START;
    let current = startAt;
    let onChange = null, onCheck = null;

    const root = document.createElement('div');
    root.classList.add('number-mechanic');
    root.id = opts.id || 'numberSelector';
    if (opts.x !== undefined) root.style.left = opts.x + 'px';
    if (opts.y !== undefined) root.style.top = opts.y + 'px';
    if (opts.scale) root.style.setProperty('--k', opts.scale);
    if (opts.hidden) root.classList.add('hidden');

    const mk = function (tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    };

    const row = mk('div', 'selector-area');

    const left = mk('button', 'arrow-button previous');
    left.type = 'button';
    left.setAttribute('aria-label', 'Previous number');
    left.appendChild(mk('span', 'arrow-left'));

    const track = mk('div', 'number-track');
    const dots = [];
    const card = mk('div', 'number-card');
    const digit = mk('span', 'selected-number');
    const tick = mk('span', 'yes-tick', '✓');
    card.appendChild(digit);
    card.appendChild(tick);
    /* Half the markers, then the number, then the rest — so the card
       sits in the middle of the track whatever the value is. */
    for (let i = 0; i < DOTS; i++) {
      const d = mk('span', 'dot');
      dots.push(d);
      if (i === DOTS / 2) track.appendChild(card);
      track.appendChild(d);
    }

    const right = mk('button', 'arrow-button next');
    right.type = 'button';
    right.setAttribute('aria-label', 'Next number');
    right.appendChild(mk('span', 'arrow-right'));

    row.appendChild(left); row.appendChild(track); row.appendChild(right);

    const check = mk('button', 'check-button', 'Check');
    check.type = 'button';
    check.setAttribute('aria-label', 'Check answer');
    check.appendChild(mk('span', 'check-icon', '✓'));

    root.appendChild(row);
    root.appendChild(check);
    parent.appendChild(root);

    /* The selected number is announced, not just drawn: the markers are
       decoration, so a screen reader hears one value. */
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');

    /* The markers fill from the left in proportion to how far along the
       range the value has come. They are not one-per-value — there are
       four of them and nine values — they only say roughly where in the
       run the child is. */
    function paintDots() {
      const span = Math.max(1, max - min);
      const lit = Math.round((current - min) / span * DOTS);
      dots.forEach(function (d, i) { d.classList.toggle('lit', i < lit); });
    }

    function paint() {
      digit.textContent = String(current);
      left.disabled = current <= min;
      right.disabled = current >= max;
      paintDots();
    }

    /* A press that shows on the button however it was triggered —
       :active only covers the mouse, and these are reachable by
       keyboard too. */
    function press(btn) {
      btn.classList.add('is-pressed');
      setTimeout(function () { btn.classList.remove('is-pressed'); }, 120);
    }

    let verdict = null;
    function clearVerdict() {
      clearTimeout(verdict);
      root.classList.remove('is-correct', 'is-wrong');
    }

    /* The digit leaves the way the row is travelling and the next one
       arrives from the other side. Two steps, not one: the value is
       only written into the card once the old one is out of the way,
       so the two are never on screen together. */
    let swap = null;
    function show(dir) {
      clearTimeout(swap);
      digit.classList.remove('slide-left', 'slide-right', 'enter-left', 'enter-right');
      if (!dir) { paint(); return; }
      void digit.offsetWidth;
      digit.classList.add(dir > 0 ? 'slide-left' : 'slide-right');
      swap = setTimeout(function () {
        digit.classList.remove('slide-left', 'slide-right');
        paint();
        void digit.offsetWidth;
        digit.classList.add(dir > 0 ? 'enter-right' : 'enter-left');
      }, OUT_MS);
    }

    function set(v, tell) {
      v = Math.min(max, Math.max(min, Math.round(v)));
      if (v === current) return;
      const dir = v > current ? 1 : -1;
      current = v;

      clearVerdict();          // a new guess clears the verdict on the last
      show(dir);

      if (window.Audio8 && window.Audio8.blip) window.Audio8.blip();
      if (tell !== false && onChange) onChange(current);
    }

    left.addEventListener('click', function (e) {
      e.stopPropagation(); press(left); set(current - 1);
    });
    right.addEventListener('click', function (e) {
      e.stopPropagation(); press(right); set(current + 1);
    });
    check.addEventListener('click', function (e) {
      e.stopPropagation();
      press(check);
      if (onCheck) onCheck(current);
    });
    // taps inside the panel are its own; they must not skip the screen
    root.addEventListener('click', function (e) { e.stopPropagation(); });

    paint();

    return {
      el: root,
      get value() { return current; },
      set: set,

      /* A screen can widen the range — the worked-out answers reach
         past 8 — without the component knowing what any of them mean. */
      setRange: function (lo, hi, start) {
        min = lo; max = hi;
        startAt = Math.min(max, Math.max(min, start != null ? start : START));
        current = Math.min(max, Math.max(min, current));
        paint();
      },

      reset: function () {
        clearTimeout(swap);
        digit.classList.remove('slide-left', 'slide-right', 'enter-left', 'enter-right');
        current = startAt;
        clearVerdict();
        root.classList.remove('locked');
        left.disabled = right.disabled = check.disabled = false;
        paint();
      },

      /* The game decides what is right; these only show it. */
      markCorrect: function () {
        clearVerdict();
        void card.offsetWidth;
        root.classList.add('is-correct');
      },
      markWrong: function () {
        clearVerdict();
        void card.offsetWidth;
        root.classList.add('is-wrong');
        // back to the ordinary golden card once the shake is done
        verdict = setTimeout(function () { root.classList.remove('is-wrong'); }, 300);
      },

      /* Once the answer is right there is nothing left to choose, so
         the arrows and Check stop taking input rather than sitting
         there looking live. */
      lock: function () {
        root.classList.add('locked');
        left.disabled = right.disabled = check.disabled = true;
      },

      /* `rising` is for the moment it takes the space Swifty has just
         flown out of: it comes up from below rather than appearing, so
         it is visibly settled by the time she lands on it. */
      show: function (rising) {
        root.classList.remove('hidden', 'rising');
        if (rising) { void root.offsetWidth; root.classList.add('rising'); }
      },
      hide: function () { root.classList.add('hidden'); },

      onChange: function (fn) { onChange = fn; },
      onCheck: function (fn) { onCheck = fn; }
    };
  }

  return { mount: mount, MIN: MIN, MAX: MAX, START: START };
})();

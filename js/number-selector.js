/* =============================================================
   Number selector — a left arrow, three numbers with the selected
   one in the middle, a right arrow, and Check.

   Self-contained: it owns its markup and its styles, exposes the same
   small surface the game already used for the slider it replaces
   (mount / show / hide / reset / onChange / onCheck), and knows
   nothing about what any answer should be — the game tells it whether
   a guess was right, it does not work that out.

   All of the look and all of the feedback live in CSS classes; this
   file only sets values and toggles state.
   ============================================================= */
window.NumberSelector = (function () {
  'use strict';

  /* It opens on 0: nothing has been measured yet, so the control says
     nothing has been measured yet. The slot to its left stays empty and
     the back arrow is disabled, which is the truth — there is nothing
     below no distance at all. */
  const MIN = 0, MAX = 8, START = 0;

  function mount(parent, opts) {
    opts = opts || {};

    let min = opts.min != null ? opts.min : MIN;
    let max = opts.max != null ? opts.max : MAX;
    let startAt = opts.start != null ? opts.start : START;
    let current = startAt;
    let onChange = null, onCheck = null;

    const root = document.createElement('div');
    root.classList.add('nsel');
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

    const row = mk('div', 'selector-row');

    const left = mk('button', 'arrow-btn left-arrow', '◀');
    left.type = 'button';
    left.setAttribute('aria-label', 'Previous number');

    const win = mk('div', 'number-window');
    const prev = mk('div', 'number previous');
    const active = mk('div', 'number active');
    const next = mk('div', 'number next');
    /* The tile's digit is its own element so the tick can be a sibling
       inside the tile — writing textContent on the tile itself would
       take the tick out with it every time the number changed. */
    const digit = mk('span', 'num-digit');
    const tick = mk('span', 'yes-tick', '✓');
    active.appendChild(digit);
    active.appendChild(tick);
    win.appendChild(prev); win.appendChild(active); win.appendChild(next);

    const right = mk('button', 'arrow-btn right-arrow', '▶');
    right.type = 'button';
    right.setAttribute('aria-label', 'Next number');

    row.appendChild(left); row.appendChild(win); row.appendChild(right);

    const check = mk('button', 'check-btn', 'Check ✓');
    check.type = 'button';
    check.setAttribute('aria-label', 'Check answer');

    root.appendChild(row);
    root.appendChild(check);
    parent.appendChild(root);

    /* The selected number is announced, not just drawn: the two
       neighbours are decoration, so a screen reader hears one value. */
    active.setAttribute('role', 'status');
    active.setAttribute('aria-live', 'polite');

    /* Past either end there is no number to show. The slot is kept and
       left blank rather than removed, so the selected number stays
       exactly in the middle at either end too. */
    function paint() {
      const lo = current - 1, hi = current + 1;
      prev.textContent = lo >= min ? String(lo) : '';
      next.textContent = hi <= max ? String(hi) : '';
      prev.classList.toggle('blank', lo < min);
      next.classList.toggle('blank', hi > max);
      digit.textContent = String(current);
      left.disabled = current <= min;
      right.disabled = current >= max;
    }

    /* A press that shows on the button however it was triggered —
       :active only covers the mouse, and these are reachable by
       keyboard too. */
    function press(btn) {
      btn.classList.add('is-pressed');
      setTimeout(function () { btn.classList.remove('is-pressed'); }, 110);
    }

    let verdict = null;
    function clearVerdict() {
      clearTimeout(verdict);
      root.classList.remove('is-correct', 'is-wrong');
    }

    let sliding = null;
    function set(v, tell) {
      v = Math.min(max, Math.max(min, Math.round(v)));
      if (v === current) return;
      const dir = v > current ? 'right' : 'left';
      current = v;

      clearVerdict();          // a new guess clears the verdict on the last

      /* Lean the way it is going, then let it settle: the class comes
         off a frame later so the transition plays back to rest, and the
         tile that lands overshoots a little on the way. */
      clearTimeout(sliding);
      root.classList.remove('is-moving-left', 'is-moving-right');
      active.classList.remove('is-landing');
      void root.offsetWidth;
      root.classList.add('is-moving-' + dir);
      paint();
      sliding = setTimeout(function () {
        root.classList.remove('is-moving-left', 'is-moving-right');
        void active.offsetWidth;
        active.classList.add('is-landing');
      }, 30);

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
        current = startAt;
        clearVerdict();
        root.classList.remove('locked');
        active.classList.remove('is-landing');
        left.disabled = right.disabled = check.disabled = false;
        paint();
      },

      /* The game decides what is right; these only show it. */
      markCorrect: function () {
        clearVerdict();
        void active.offsetWidth;
        root.classList.add('is-correct');
      },
      markWrong: function () {
        clearVerdict();
        void active.offsetWidth;
        root.classList.add('is-wrong');
        // back to the ordinary selected state once the shake is done
        verdict = setTimeout(function () { root.classList.remove('is-wrong'); }, 320);
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

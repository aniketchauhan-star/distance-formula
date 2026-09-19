/* =============================================================
   Distance slider — a ruler, and Check under it.

   The reel is a control for DIGITS: you set tens and units and the
   answer feels like a combination. This is a control for MAGNITUDE —
   you push a value along a number line and watch it approach, which is
   the right instrument for a question that means "how far?". It is
   also where estimation and calculation meet: a child who can see the
   line is a bit longer than twelve has a check on their own
   arithmetic.

   It exposes the same small surface the number reel does — mount /
   show / hide / reset / set / setRange / markCorrect / markWrong /
   lock / moveTo / onChange / onCheck — so the game can use either
   without knowing which it has. Like the reel, it knows nothing about
   what any answer should be.

   Whole numbers only: a slider that can land on 12.7 makes Check a
   lottery. And it answers to arrow keys and to a tap on the track, not
   only to a drag — a control you can only answer by dragging is a
   control some children cannot answer at all.
   ============================================================= */
window.DistanceSlider = (function () {
  'use strict';

  const MIN = 0, MAX = 15, START = 0;

  function mount(parent, opts) {
    opts = opts || {};

    let min = opts.min != null ? opts.min : MIN;
    let max = opts.max != null ? opts.max : MAX;
    let startAt = opts.start != null ? opts.start : START;
    let current = startAt;
    let onChange = null, onCheck = null;
    let locked = false;

    const root = document.createElement('div');
    root.className = 'distance-slider';
    root.id = opts.id || 'distanceSlider';
    if (opts.x !== undefined) root.style.left = opts.x + 'px';
    if (opts.y !== undefined) root.style.top = opts.y + 'px';
    if (opts.scale) root.style.setProperty('--k', opts.scale);
    root.classList.add('hidden');

    const mk = function (tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    };

    const row = mk('div', 'ds-row');

    /* The track. A real range input underneath does the dragging, the
       keys and the tap for us — everything a hand-rolled one would
       have to reimplement, including the bits assistive technology
       relies on — and the marks and the knob are drawn over it. */
    const track = mk('div', 'ds-track');
    const rail = mk('div', 'ds-rail');
    const ticks = mk('div', 'ds-ticks');
    const nums = mk('div', 'ds-nums');
    const knob = mk('div', 'ds-knob');
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'ds-input';
    input.step = '1';
    input.setAttribute('aria-label', 'distance in units');
    track.appendChild(rail);
    track.appendChild(ticks);
    track.appendChild(knob);
    track.appendChild(input);
    row.appendChild(track);
    row.appendChild(nums);

    const readout = mk('div', 'ds-readout');
    const value = mk('div', 'ds-value', String(current));
    readout.appendChild(value);
    readout.appendChild(mk('div', 'ds-units', 'units'));

    const top = mk('div', 'ds-top');
    top.appendChild(row);
    top.appendChild(readout);
    root.appendChild(top);

    const check = mk('button', 'ds-check', 'Check');
    check.type = 'button';
    root.appendChild(check);

    /* ---------------- painting ---------------- */
    const at = function (v) {
      return max === min ? 0 : (v - min) / (max - min);
    };

    /* Ticks at every unit, numbers only where the axis would carry
       one — the track is marked the way the board is, so the two can
       be compared by eye. */
    const rule = function () {
      ticks.textContent = '';
      nums.textContent = '';
      const span = max - min;
      const every = span > 24 ? 10 : (span > 10 ? 5 : 1);
      for (let v = min; v <= max; v++) {
        const t = mk('i', 'ds-tick');
        if (v % every === 0) t.classList.add('big');
        t.style.left = (at(v) * 100) + '%';
        ticks.appendChild(t);
        if (v % every === 0) {
          const n = mk('span', 'ds-num', String(v));
          n.style.left = (at(v) * 100) + '%';
          nums.appendChild(n);
        }
      }
    };

    const paint = function () {
      input.min = min; input.max = max; input.value = current;
      input.setAttribute('aria-valuetext', current + ' units');
      knob.style.left = (at(current) * 100) + '%';
      rail.style.setProperty('--fill', (at(current) * 100) + '%');
      value.textContent = String(current);
    };

    const set = function (v, quiet) {
      const n = Math.round(Math.min(max, Math.max(min, v)));
      if (n === current) { paint(); return; }
      current = n;
      paint();
      if (!quiet && onChange) onChange(current);
    };

    input.addEventListener('input', function () {
      if (locked) { paint(); return; }
      set(+input.value);
    });
    check.addEventListener('click', function (e) {
      e.stopPropagation();
      if (locked) return;
      if (onCheck) onCheck(current);
    });
    // taps inside the control are its own; they must not skip the screen
    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    let verdict = null;
    const clearVerdict = function () {
      clearTimeout(verdict);
      root.classList.remove('is-correct', 'is-wrong');
    };

    parent.appendChild(root);
      /* And taken off again when it lands. `fsRise` is filled (`both`),
         so while the class is on, the animation's own last frame is
         what the panel's transform IS — the base rule underneath can
         never apply, and the whole subtree measures and paints against
         a held frame. Left on, this kind of held frame flattened the
         substitution panel's formula next door. */
    let landing = null;
    const land = function () {
      clearTimeout(landing);
      landing = setTimeout(function () { root.classList.remove('rising'); }, 620);
    };
    root.addEventListener('animationend', function (e) {
      if (e.animationName === 'dsRise') { clearTimeout(landing); root.classList.remove('rising'); }
    });

    rule();
    paint();

    return {
      el: root,
      get value() { return current; },
      set: function (v) { set(v, true); },

      setRange: function (lo, hi, start) {
        min = lo; max = hi;
        startAt = Math.min(max, Math.max(min, start != null ? start : START));
        current = Math.min(max, Math.max(min, current));
        rule();
        paint();
      },

      reset: function () {
        locked = false;
        current = startAt;
        clearVerdict();
        root.classList.remove('locked');
        input.disabled = check.disabled = false;
        paint();
      },

      /* The game decides what is right; these only show it. */
      markCorrect: function () {
        clearVerdict();
        void root.offsetWidth;
        root.classList.add('is-correct');
      },
      markWrong: function () {
        clearVerdict();
        void root.offsetWidth;
        root.classList.add('is-wrong');
        verdict = setTimeout(function () { root.classList.remove('is-wrong'); }, 360);
      },

      lock: function () {
        locked = true;
        root.classList.add('locked');
        input.disabled = check.disabled = true;
      },

      moveTo: function (x, y) { root.style.left = x + 'px'; root.style.top = y + 'px'; },
      show: function (rising) {
        root.classList.remove('hidden', 'rising');
        if (rising) { void root.offsetWidth; root.classList.add('rising'); land(); }
      },
      hide: function () { root.classList.add('hidden'); },

      onChange: function (fn) { onChange = fn; },
      onCheck: function (fn) { onCheck = fn; }
    };
  }

  return { mount: mount, MIN: MIN, MAX: MAX };
})();

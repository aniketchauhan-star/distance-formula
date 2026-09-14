/* =============================================================
   Number selector — a left arrow, three numbers with the selected
   one in the middle, a right arrow, and Check.

   Self-contained: it owns its markup and its styles, exposes the same
   small surface the game already used for the slider it replaces
   (mount / show / hide / reset / onChange / onCheck), and knows
   nothing about what any answer should be.
   ============================================================= */
window.NumberSelector = (function () {
  'use strict';

  const MIN = 1, MAX = 8;

  function mount(parent, opts) {
    opts = opts || {};

    let min = opts.min != null ? opts.min : MIN;
    let max = opts.max != null ? opts.max : MAX;
    let current = min;
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
       exactly in the middle at 1 and at 8 too. */
    function paint() {
      const lo = current - 1, hi = current + 1;
      prev.textContent = lo >= min ? String(lo) : '';
      next.textContent = hi <= max ? String(hi) : '';
      prev.classList.toggle('blank', lo < min);
      next.classList.toggle('blank', hi > max);
      active.textContent = String(current);
      left.disabled = current <= min;
      right.disabled = current >= max;
    }

    let sliding = null;
    function set(v, tell) {
      v = Math.min(max, Math.max(min, Math.round(v)));
      if (v === current) return;
      const dir = v > current ? 'right' : 'left';
      current = v;

      /* Lean the way it is going, then settle — the class comes off on
         the next frame so the transition plays back to rest. */
      clearTimeout(sliding);
      root.classList.remove('slide-left', 'slide-right');
      void root.offsetWidth;
      root.classList.add('slide-' + dir);
      paint();
      sliding = setTimeout(function () {
        root.classList.remove('slide-left', 'slide-right');
      }, 20);

      if (window.Audio8 && window.Audio8.blip) window.Audio8.blip();
      if (tell !== false && onChange) onChange(current);
    }

    left.addEventListener('click', function (e) { e.stopPropagation(); set(current - 1); });
    right.addEventListener('click', function (e) { e.stopPropagation(); set(current + 1); });
    check.addEventListener('click', function (e) {
      e.stopPropagation();
      if (onCheck) onCheck(current);
    });
    // taps inside the panel are its own; they must not skip the screen
    root.addEventListener('click', function (e) { e.stopPropagation(); });

    paint();

    return {
      el: root,
      get value() { return current; },
      set: set,

      /* A screen can widen the range — the typed answers reach past 8 —
         without the component knowing what any of them mean. */
      setRange: function (lo, hi) {
        min = lo; max = hi;
        current = Math.min(max, Math.max(min, current));
        paint();
      },

      reset: function () {
        current = min;
        root.classList.remove('locked');
        paint();
      },

      /* Once the answer is right there is nothing left to choose, so
         the arrows and Check stop taking input rather than sitting
         there looking live. */
      lock: function () {
        root.classList.add('locked');
        left.disabled = right.disabled = check.disabled = true;
      },

      show: function () {
        root.classList.remove('hidden');
      },
      hide: function () { root.classList.add('hidden'); },

      onChange: function (fn) { onChange = fn; },
      onCheck: function (fn) { onCheck = fn; }
    };
  }

  return { mount: mount, MIN: MIN, MAX: MAX };
})();

/* =============================================================
   Distance selector panel — self-contained component.

   Builds its own DOM, owns its own state, and touches nothing
   else in the game. Mount it anywhere:

       const panel = DistancePanel.mount(parent, { x, y });

   and reposition later by changing that one call, or by moving
   CFG.BOARD.distance.pos.
   ============================================================= */
window.DistancePanel = (function () {
  'use strict';

  const MIN = 1, MAX = 8;
  const TRACK_W = 490;     // must match .dtrack-wrap / .drange in the CSS
  const THUMB_W = 48;      // must match ::-webkit-slider-thumb

  /* Where the knob's centre sits for a given value. A native range
     insets its travel by half a thumb at each end, so the ticks and
     number boxes have to follow that same inset or they drift out of
     line with the knob. */
  function tickX(v) {
    const span = TRACK_W - THUMB_W;
    return THUMB_W / 2 + ((v - MIN) / (MAX - MIN)) * span;
  }

  function mount(parent, opts) {
    opts = opts || {};

    const root = document.createElement('div');
    root.classList.add('dpanel');
    root.id = opts.id || 'distancePanel';
    if (opts.x !== undefined) root.style.left = opts.x + 'px';
    if (opts.y !== undefined) root.style.top = opts.y + 'px';
    if (opts.hidden) root.classList.add('hidden');

    const mk = function (tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.classList.add(cls);
      if (text !== undefined) n.textContent = text;
      return n;
    };

    const inner  = mk('div', 'dpanel-inner');
    const area   = mk('div', 'dslider-area');
    const wrap   = mk('div', 'dtrack-wrap');
    const ticks  = mk('div', 'dticks');
    const range  = mk('input', 'drange');
    range.type = 'range';
    range.min = MIN; range.max = MAX; range.step = 1; range.value = MIN;
    range.setAttribute('aria-label', 'Distance in units');
    const nums   = mk('div', 'dnumbers');

    const answer = mk('div', 'danswer');
    const value  = mk('span', 'dvalue', String(MIN));
    answer.appendChild(mk('span', 'dlabel', 'Distance ='));
    answer.appendChild(value);
    answer.appendChild(mk('span', 'dunits', 'units'));

    wrap.appendChild(ticks);
    wrap.appendChild(range);
    area.appendChild(wrap);
    area.appendChild(nums);
    inner.appendChild(area);
    inner.appendChild(answer);
    root.appendChild(inner);

    const boxes = [];

    for (let v = MIN; v <= MAX; v++) {
      const x = tickX(v);

      const t = mk('div', 'dtick');
      t.style.left = x + 'px';
      ticks.appendChild(t);

      const b = mk('div', 'dnum', String(v));
      b.style.left = (x - 21) + 'px';      // 42px box, centred on its tick
      b.dataset.v = v;
      nums.appendChild(b);
      boxes.push(b);
    }

    let current = MIN;
    let onChange = null;

    function paint(v, bump) {
      current = v;
      value.textContent = v;
      boxes.forEach(function (b) { b.classList.toggle('on', Number(b.dataset.v) === v); });
      if (bump) {
        value.classList.remove('bump');
        void value.offsetWidth;            // restart the nudge
        value.classList.add('bump');
        setTimeout(function () { value.classList.remove('bump'); }, 190);
      }
      if (onChange) onChange(v);
    }

    function set(v, bump) {
      v = Math.min(MAX, Math.max(MIN, Math.round(v)));
      if (v === current && !bump) return;
      range.value = v;
      paint(v, bump !== false);
    }

    range.addEventListener('input', function () { paint(Number(range.value), true); });

    // a number box is a shortcut to that value
    nums.addEventListener('click', function (e) {
      const b = e.target && e.target.classList &&
                e.target.classList.contains('dnum') ? e.target : null;
      if (!b) return;
      e.stopPropagation();                 // never let it reach the scene
      set(Number(b.dataset.v));
    });
    // dragging the knob must not count as a tap on the scene either
    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    parent.appendChild(root);
    paint(MIN, false);

    return {
      el: root,
      get value() { return current; },
      set: set,
      reset: function () { set(MIN, false); },
      show: function () { root.classList.remove('hidden'); },
      hide: function () { root.classList.add('hidden'); },
      onChange: function (fn) { onChange = fn; }
    };
  }

  return { mount: mount, MIN: MIN, MAX: MAX };
})();

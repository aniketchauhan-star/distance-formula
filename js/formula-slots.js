/* =============================================================
   Formula slots — the distance formula with its numbers taken out,
   and the four numbers underneath as chips to put back in.

   This is the diagnosis screen. Every other wrong answer in this game
   ends with a worked solution, which answers an arithmetic slip and
   says nothing at all to a child who paired x with y — and pairing x
   with y is the mistake people actually make with this formula. So
   before anything is calculated, the child says where the numbers go,
   and what they get wrong there is the thing that was wrong all along.

   Self-contained: it owns its markup and its styles and knows nothing
   about what any answer should be. The game sets the pair, is told
   when a filling is offered, and decides.
   ============================================================= */
window.FormulaSlots = (function () {
  'use strict';

  const NBSP = ' ';

  function mount(parent, opts) {
    opts = opts || {};

    const root = document.createElement('div');
    root.className = 'formula-slots';
    root.id = opts.id || 'formulaSlots';
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

    /* d² = (□ − □)² + (□ − □)² — the squared form, which is the
       one the rest of this lesson writes: every working on the board
       says AB² = 4² + 3² and then takes the root. The root is screen
       53's job, so it is not asked for here, and leaving it out makes
       the row short enough that the slots can be big enough to hit.

       One flat grid, every symbol its own column. Nested inline boxes
       resolved this row to about half of what its pieces add up to and
       drew the four slots on top of each other; a grid track is sized
       from the one item in it and cannot be argued down. */
    const line = mk('div', 'fs-line');
    line.appendChild(mk('span', 'fs-d', 'd\u00B2'));
    line.appendChild(mk('span', 'fs-eq', '='));

    const slots = [];
    [0, 1].forEach(function (n) {
      if (n) line.appendChild(mk('span', 'fs-plus', '+'));
      line.appendChild(mk('span', 'fs-paren', '('));
      [0, 1].forEach(function (k) {
        if (k) line.appendChild(mk('span', 'fs-minus', '\u2212'));
        /* A span, not a button: a slot is a piece of a line of algebra
           and has to sit in the line like one. Keyboard reach below. */
        const s = mk('span', 'fs-slot');
        s.dataset.slot = n * 2 + k;
        s.setAttribute('role', 'button');
        s.setAttribute('tabindex', '0');
        s.setAttribute('aria-label', 'slot ' + (n * 2 + k + 1) + ', empty');
        line.appendChild(s);
        slots.push(s);
      });
      line.appendChild(mk('span', 'fs-close', ')\u00B2'));
    });

    root.appendChild(line);

    const tray = mk('div', 'fs-tray');
    root.appendChild(tray);

    const check = mk('button', 'fs-check', 'Check');
    check.type = 'button';
    root.appendChild(check);

    /* ---------------- state ---------------- */
    let chips = [];          // { el, value, axis, from, used }
    let filled = [null, null, null, null];
    let held = null;         // the chip waiting for a slot
    let locked = false;
    let onOffer = null;

    const say = function (s, txt) {
      s.setAttribute('aria-label', 'slot ' + (+s.dataset.slot + 1) +
                     (txt === '' ? ', empty' : ', ' + txt));
    };

    /* The formula is the one thing in this panel whose width is not the
       author's to choose: it is however wide `d = √((□ − □)² + (□ − □)²)`
       comes out in this face at this size, and it has to sit on one row
       inside a column that is 520 wide. So rather than guess a type
       size that fits and hope, it is measured and scaled to fit — which
       also means nothing a slot is filled with can ever push a piece of
       it off the panel. */
    const fit = function () {
      line.style.setProperty('--fit', 1);
      const room = root.clientWidth - 52;         // the panel's own padding
      const want = line.scrollWidth;
      if (room > 0 && want > room) {
        line.style.setProperty('--fit', String(Math.max(0.5, room / want)));
      }
    };

    const paint = function () {
      slots.forEach(function (s, i) {
        const f = filled[i];
        s.textContent = f ? f.text : '';
        /* `taken`, not `full`: the game has a global `.full` for the
           full-frame artwork — position absolute, 1920 by 1080 — and a
           slot wearing it became a screen-sized layer pinned to the
           panel's corner. Every class this component sets is its own. */
        s.classList.toggle('taken', !!f);
        s.classList.toggle('open', !f && !!held);
        s.dataset.from = f ? f.from : '';
        s.setAttribute('tabindex', locked ? '-1' : '0');
        say(s, f ? f.text : '');
      });
      chips.forEach(function (ch) {
        ch.el.classList.toggle('used', ch.used);
        ch.el.classList.toggle('held', ch === held);
        ch.el.disabled = ch.used || locked;
      });
      check.disabled = locked || filled.some(function (f) { return !f; });
      fit();
    };

    const takeBack = function (i) {
      const f = filled[i];
      if (!f) return;
      f.chip.used = false;
      filled[i] = null;
      paint();
    };

    const place = function (i) {
      if (!held) return;
      if (filled[i]) takeBack(i);
      filled[i] = { text: held.text, value: held.value, axis: held.axis,
                    from: held.from, chip: held };
      held.used = true;
      held = null;
      paint();
    };

    slots.forEach(function (s, i) {
      const hit = function (e) {
        e.stopPropagation();
        if (locked) return;
        if (held) place(i);
        else takeBack(i);
      };
      s.addEventListener('click', hit);
      /* What a button would have given for free. */
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault(); hit(e);
        }
      });
    });

    check.addEventListener('click', function (e) {
      e.stopPropagation();
      if (locked || filled.some(function (f) { return !f; })) return;
      if (onOffer) onOffer(filled.map(function (f) {
        return { value: f.value, axis: f.axis, from: f.from };
      }));
    });

    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    /* The four numbers of a pair, as chips. Each carries which point it
       came from — so the two halves of A look like each other and the
       two halves of B look like each other — and which axis it is,
       which the panel keeps to itself: colour says WHICH POINT, never
       which axis, so "one of each colour in a bracket" is visible and
       "x with x" is still the child's to work out. */
    const setPair = function (a, b) {
      tray.textContent = '';
      chips = [];
      filled = [null, null, null, null];
      held = null;
      [[a, 'a'], [b, 'b']].forEach(function (pr) {
        const p = pr[0], from = pr[1];
        [['x', p.x], ['y', p.y]].forEach(function (ax) {
          const el = mk('button', 'fs-chip', String(ax[1]).replace('-', '−'));
          el.type = 'button';
          el.dataset.from = from;
          el.setAttribute('aria-label', String(ax[1]) + ', from point ' +
                          (from === 'a' ? 'A' : 'B'));
          const ch = { el: el, text: el.textContent, value: ax[1],
                       axis: ax[0], from: from, used: false };
          el.addEventListener('click', function (e) {
            e.stopPropagation();
            if (locked || ch.used) return;
            held = (held === ch) ? null : ch;
            paint();
          });
          tray.appendChild(el);
          chips.push(ch);
        });
      });
      paint();
    };

      /* And taken off again when it lands. `fsRise` is filled (`both`),
         so while the class is on, the animation's own last frame is
         what the panel's transform IS — the base rule underneath can
         never apply, and the whole subtree measures and paints against
         a held frame. Left on, this row of slots reported every one of
         its boxes at offset 0 and drew them in a heap. */
    let landing = null;
    const land = function () {
      clearTimeout(landing);
      landing = setTimeout(function () { root.classList.remove('rising'); fit(); }, 620);
    };
    root.addEventListener('animationend', function (e) {
      if (e.animationName === 'fsRise') { clearTimeout(landing); root.classList.remove('rising'); fit(); }
    });

    parent.appendChild(root);

    return {
      el: root,
      setPair: setPair,

      /* What is in the slots, in order, or null where one is empty. */
      get filling() {
        return filled.map(function (f) { return f ? f.value : null; });
      },

      reset: function () {
        locked = false;
        root.classList.remove('locked', 'is-wrong');
        filled = [null, null, null, null];
        held = null;
        chips.forEach(function (ch) { ch.used = false; });
        paint();
      },

      markWrong: function () {
        root.classList.remove('is-wrong');
        void root.offsetWidth;
        root.classList.add('is-wrong');
      },

      /* Nobody got it, so the chips walk in by themselves — one at a
         time, in reading order, because the order is half of what is
         being shown. `order` is the four chips' indices. */
      fillIn: function (order, step, done) {
        locked = true;
        let n = 0;
        const go = function () {
          if (n >= order.length) {
            paint();
            if (done) done();
            return;
          }
          const ch = chips[order[n]];
          filled[n] = { text: ch.text, value: ch.value, axis: ch.axis,
                        from: ch.from, chip: ch };
          ch.used = true;
          paint();
          slots[n].classList.remove('landed');
          void slots[n].offsetWidth;
          slots[n].classList.add('landed');
          n++;
          setTimeout(go, step || 620);
        };
        go();
      },

      lock: function () {
        locked = true;
        root.classList.add('locked');
        paint();
      },

      moveTo: function (x, y) { root.style.left = x + 'px'; root.style.top = y + 'px'; },
      show: function (rising) {
        root.classList.remove('hidden', 'rising');
        /* Measured now it is on the frame: a hidden panel has no width
           to fit anything to. */
        fit();
        if (rising) { void root.offsetWidth; root.classList.add('rising'); land(); }
      },
      hide: function () { root.classList.add('hidden'); },
      onOffer: function (fn) { onOffer = fn; }
    };
  }

  return { mount: mount, NBSP: NBSP };
})();

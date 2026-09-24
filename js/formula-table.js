/* =============================================================
   The formula table. A panel that opens out of the board's right
   edge, wearing the board's own frame so it reads as the grid panel
   extended, with the working set out as a table: every row hung from
   one column of equals signs, each term in a column of its own, so a
   row lines up under the one above it.

   It holds no numbers of its own to begin with. A row comes in as its
   skeleton — brackets, squares, equals and plus signs — with an empty
   slot wherever something is going to land, and the game fills each
   slot as the copy flown in from the triangle arrives (`land`). What
   was worked out rather than read off the drawing is written in place
   (`write`). The table only lays out and reveals; where things come
   from, and when, is the game's.
   ============================================================= */
window.FormulaTable = (function () {
  'use strict';

  /* '=' and '+' belong to the skeleton; everything else is a term. */
  function isOp(t) { const s = (t || '').trim(); return s === '=' || s === '+'; }

  /* "(AB)²" is a bracket, a name and a square; "4" is only the name.
     The slot is the name — the brackets and the square are the shape
     it goes into, so they are drawn with the skeleton. */
  function split(t) {
    const m = String(t || '').match(/^(\s*\(?)([^()²³]*?)(\)?[²³]?\s*)$/);
    return m ? { pre: m[1], inner: m[2], post: m[3] } : { pre: '', inner: t, post: '' };
  }

  function mount(parent, opts) {
    opts = opts || {};
    const root = document.createElement('div');
    root.id = opts.id || 'formulaTable';
    root.className = 'formula-table hidden';
    parent.insertBefore(root, opts.before || null);
    const grid = document.createElement('div');
    grid.className = 'ft-grid';
    root.appendChild(grid);

    let rows = [];
    let colours = { h: '#E07B12', v: '#2F8F6F', ab: '#1F6FD0' };

    const mk = function (tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };

    return {
      el: root,

      setColours: function (c) { colours = Object.assign({}, colours, c || {}); },

      /* Rows and cells, all hidden. Columns: 0 the left-hand side, 1
         the equals sign, then term, operator, term... in the order the
         line gives them. */
      build: function (formula) {
        grid.innerHTML = '';
        rows = [];
        (formula || []).forEach(function (line, r) {
          const cells = [];
          /* An INLINE row: one expression rather than terms in columns
             — "d = √((x2 - x1)² + (y2 - y1)²)" has no terms that line up
             from row to row, so everything after its equals sign sits in
             one cell, written as it reads, with a slot wherever a piece
             is carried in. The left-hand side and the equals sign keep
             their columns, so the rows still hang from one = . */
          if (line.inline) {
            const lhs = mk('span', 'ft-cell ft-col0');
            const eq = mk('span', 'ft-cell ft-col1 ft-is-op', '=');
            const rhs = mk('span', 'ft-cell ft-col2 ft-inline');
            [lhs, eq, rhs].forEach(function (c) { c.style.gridRow = String(r + 1); });
            lhs.style.gridColumn = '1'; eq.style.gridColumn = '2'; rhs.style.gridColumn = '3 / -1';
            let side = lhs, seenEq = false;
            (line.parts || []).forEach(function (p, k) {
              const t = p.t || '';
              if (!seenEq && t.trim() === '=') { seenEq = true; side = rhs; cells[k] = { kind: 'op', el: eq }; return; }
              const colour = p.lit ? colours[p.lit] : null;
              if (p.from) {
                const slot = mk('span', 'ft-slot');
                const fill = mk('span', 'ft-fill', t.trim());
                if (colour) fill.style.color = colour;
                slot.appendChild(fill);
                side.appendChild(slot);
                cells[k] = { kind: 'slot', el: slot, fill: fill };
              } else {
                const sp = mk('span', 'ft-text', t);
                if (colour) sp.style.color = colour;
                side.appendChild(sp);
                cells[k] = { kind: 'text', el: sp };
              }
            });
            [lhs, eq, rhs].forEach(function (c) { grid.appendChild(c); });
            rows.push({ cells: cells, boxes: [lhs, eq, rhs] });
            return;
          }
          let col = 0, next = 0;
          (line.parts || []).forEach(function (p, k) {
            const t = p.t || '';
            if (t.trim() === '=' && next < 2) { col = 1; next = 2; }
            else if (next < 2) col = 0;
            else col = next++;
            const cell = mk('span', 'ft-cell ft-col' + col);
            cell.style.gridRow = String(r + 1);
            cell.style.gridColumn = String(col + 1);
            const colour = p.lit ? colours[p.lit] : null;
            let kind, fill = null;
            if (isOp(t)) {
              kind = 'op';
              cell.textContent = t.trim();
            } else if (p.offer) {
              /* A blank the child fills: the number in the part is the
                 right one, `offer` is the two tiles in the order they
                 drop down. Whatever wraps the number — brackets and
                 square, or " units" — is the shape it goes into, drawn
                 with the skeleton. The box is held open at the width
                 of the widest tile so nothing moves when it fills. */
              kind = 'pick';
              const m = t.match(/-?\d+(?:\.\d+)?/);
              const at = m ? m.index : 0, num = m ? m[0] : '';
              const pre = t.slice(0, at).trim(), post = t.slice(at + num.length).replace(/^\s+/, ' ');
              if (pre) cell.appendChild(mk('span', 'ft-frame', pre));
              const box = mk('span', 'ft-pick');
              const wide = p.offer.map(String).reduce(function (a, b) { return b.length > a.length ? b : a; }, num);
              box.appendChild(mk('span', 'ft-sizer', wide));
              const shown = mk('span', 'ft-num');
              if (colour) shown.style.color = colour;
              box.appendChild(shown);
              cell.appendChild(box);
              if (post.trim()) cell.appendChild(mk('span', 'ft-frame', post));
              cells[k] = { kind: kind, el: cell, box: box, num: shown,
                           answer: parseFloat(num), offer: p.offer.slice() };
              cell.classList.add('ft-pick-cell');
              grid.appendChild(cell);
              return;
            } else if (p.from) {
              /* Brackets and square with the skeleton; the name in a
                 slot that holds its width while it waits, so nothing
                 in the row moves when it lands. */
              kind = 'slot';
              const s = split(t);
              if (s.pre) cell.appendChild(mk('span', 'ft-frame', s.pre.trim()));
              const slot = mk('span', 'ft-slot');
              fill = mk('span', 'ft-fill', s.inner.replace(/ /g, ' '));
              if (colour) fill.style.color = colour;
              slot.appendChild(fill);
              cell.appendChild(slot);
              if (s.post) cell.appendChild(mk('span', 'ft-frame', s.post.trim()));
            } else {
              kind = 'write';
              cell.textContent = t.trim();
              if (colour) cell.style.color = colour;
            }
            /* The cell's KIND, under a prefix of its own. It was
               `'ft-' + kind`, which for a slot is `ft-slot` — the very
               class of the slot inside it — so every slot cell also
               drew the slot's dashed underline, across the whole term,
               and nothing ever took it away: the line stayed under
               "(AB)²" and "(4)²" after their numbers had landed. */
            cell.classList.add('ft-is-' + kind);
            grid.appendChild(cell);
            cells[k] = { kind: kind, el: cell, fill: fill };
          });
          rows.push({ cells: cells });
        });
      },

      /* Where it sits on the stage. Its height follows what is in it,
         and it is centred on `cy`. */
      place: function (box) {
        root.style.left = box.x + 'px';
        root.style.width = box.w + 'px';
        root.style.top = box.cy + 'px';
      },

      /* Out of the board's edge, like a drawer. */
      open: function () {
        root.classList.remove('hidden');
        root.classList.remove('settled');
        void root.offsetWidth;
        root.classList.add('open');
        /* The drawer's clip is only for the opening; kept after it, a
           scroller dropping from the last row would be cut off at the
           table's edge. */
        clearTimeout(root._settle);
        root._settle = setTimeout(function () { root.classList.add('settled'); }, 760);
      },

      /* A row's skeleton: its signs, its brackets and its empty slots. */
      showRow: function (r) {
        const row = rows[r];
        if (!row) return;
        (row.boxes || []).forEach(function (b) { b.classList.add('in'); });
        row.cells.forEach(function (c) {
          if (c && c.kind !== 'write') c.el.classList.add('in');
        });
      },

      /* The node a copy flies to — the slot's name, laid out but not
         yet shown, so its box is exactly where the copy must land. */
      target: function (r, k) {
        const c = rows[r] && rows[r].cells[k];
        return c ? (c.fill || c.el) : null;
      },

      /* A copy has arrived: the slot holds it now. */
      land: function (r, k) {
        const c = rows[r] && rows[r].cells[k];
        if (!c) return;
        c.el.classList.add('in');
        if (c.fill) c.fill.parentNode.classList.add('landed');
      },

      /* A row written in whole — the theorem, which is given. */
      writeRow: function (r) {
        const row = rows[r];
        if (!row) return;
        (row.boxes || []).forEach(function (b) { b.classList.add('in'); });
        row.cells.forEach(function (c) { if (c) c.el.classList.add('in', 'landed'); });
      },

      /* Every blank the child fills, in reading order, as [row, part]. */
      blanks: function () {
        const out = [];
        rows.forEach(function (row, r) {
          row.cells.forEach(function (c, k) { if (c && c.kind === 'pick') out.push([r, k]); });
        });
        return out;
      },

      /* The blank the child fills next. It breathes and carries a small
         chevron; tapped, it drops a short scroller of two tiles, and a
         tapped tile is handed to `onPick(value, tile)` — the game
         decides whether it was right. Only this blank takes a tap. */
      activate: function (r, k, onPick) {
        const c = rows[r] && rows[r].cells[k];
        if (!c || c.kind !== 'pick') return false;
        c.el.classList.add('in');
        c.box.classList.add('active');
        const open = function () {
          if (c.drop) return;
          const drop = mk('span', 'ft-drop');
          c.offer.forEach(function (v) {
            const tile = mk('button', 'ft-tile', String(v));
            tile.type = 'button';
            tile.setAttribute('aria-label', String(v));
            tile.addEventListener('click', function (e) {
              e.stopPropagation();
              if (tile.disabled) return;
              onPick(v, tile);
            });
            drop.appendChild(tile);
          });
          c.box.appendChild(drop);
          c.drop = drop;
          void drop.offsetWidth;
          drop.classList.add('open');
          c.box.classList.add('opened');
        };
        c.box.onclick = function (e) { e.stopPropagation(); open(); };
        c.open = open;
        return true;
      },

      /* Right: the scroller folds back into the blank and the number
         settles there, in its colour. */
      fill: function (r, k, v) {
        const c = rows[r] && rows[r].cells[k];
        if (!c) return;
        c.box.onclick = null;
        c.box.classList.remove('active', 'opened');
        if (c.drop) {
          const d = c.drop;
          c.drop = null;
          d.classList.remove('open');
          d.classList.add('fold');
          setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 380);
        }
        c.num.textContent = String(v);
        c.box.classList.add('filled');
      },

      /* Wrong: that tile shakes and goes; the other stays to be taken. */
      reject: function (tile) {
        if (!tile) return;
        tile.disabled = true;
        tile.classList.add('gone');
      },

      /* Worked out, not read off: written where it stands. */
      write: function (r, k) {
        const c = rows[r] && rows[r].cells[k];
        if (c) c.el.classList.add('in', 'landed');
      },

      hide: function () {
        clearTimeout(root._settle);
        root.classList.remove('open', 'settled');
        root.classList.add('hidden');
        grid.innerHTML = '';
        rows = [];
      }
    };
  }

  return { mount: mount, isOp: isOp, split: split };
})();

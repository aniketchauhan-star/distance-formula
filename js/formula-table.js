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
            cell.classList.add('ft-' + kind);
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
        void root.offsetWidth;
        root.classList.add('open');
      },

      /* A row's skeleton: its signs, its brackets and its empty slots. */
      showRow: function (r) {
        const row = rows[r];
        if (row) row.cells.forEach(function (c) {
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

      /* Worked out, not read off: written where it stands. */
      write: function (r, k) {
        const c = rows[r] && rows[r].cells[k];
        if (c) c.el.classList.add('in', 'landed');
      },

      hide: function () {
        root.classList.remove('open');
        root.classList.add('hidden');
        grid.innerHTML = '';
        rows = [];
      }
    };
  }

  return { mount: mount, isOp: isOp, split: split };
})();

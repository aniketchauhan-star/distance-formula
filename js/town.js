/* =============================================================
   The town — self-contained.

   Buildings and their name pills, drawn in CSS over the board on the
   closing beat. It knows three things and nothing else: which places
   there are, where the board is putting them, and whether it is on.

   It does NOT draw the dots or the coordinate labels. Those are
   measured things and belong to the board, which already writes them
   the same way on every other screen; a second kind of coordinate
   label on the last screen of the game would be one kind too many.

   Mount it once and hand it a position function whenever the board
   moves:

       const town = TownMap.mount(parent);
       town.set(places);
       town.place(function (gx, gy) { ... }, cellW, cellH);
       town.show();

   Nothing here takes a tap: the layer sits over a board whose points
   are tappable, so it is `pointer-events: none` throughout.
   ============================================================= */
window.TownMap = (function () {
  'use strict';

  function mount(parent) {
    const root = document.createElement('div');
    root.id = 'townLayer';
    root.className = 'town-layer';
    parent.appendChild(root);

    let places = [];
    let built = '';
    const nodes = [];

    /* One building, in shapes. A cafe is a striped awning over a shop
       front with a cup on its board; a house is a pitched roof over a
       door. Deliberately simple — these are markers on a grid, and a
       storybook drawn at a cell and a half would swamp the ruling the
       child is meant to be counting on. */
    function draw(p) {
      const wrap = document.createElement('div');
      wrap.className = 'town-place town-' + p.kind;
      wrap.dataset.tone = p.tone || 'teal';

      const pill = document.createElement('div');
      pill.className = 'town-pill';
      pill.textContent = p.name;

      const b = document.createElement('div');
      b.className = 'town-build';
      /* Roof, then the face under it. The cafe's roof is the awning and
         carries its stripes; the house's is a pitch. */
      b.innerHTML =
        '<div class="t-roof"></div>' +
        (p.kind === 'cafe' ? '<div class="t-sign"></div>' : '') +
        '<div class="t-body">' +
          '<div class="t-win"></div>' +
          '<div class="t-door"></div>' +
          '<div class="t-win"></div>' +
        '</div>';

      wrap.appendChild(pill);
      wrap.appendChild(b);
      root.appendChild(wrap);
      return wrap;
    }

    function build(list) {
      const key = (list || []).map(function (p) {
        return p.key + ':' + p.x + ',' + p.y;
      }).join('|');
      if (key === built) return;
      built = key;
      while (root.firstChild) root.removeChild(root.firstChild);
      nodes.length = 0;
      places = list || [];
      places.forEach(function (p) { nodes.push(draw(p)); });
    }

    return {
      set: function (list) { build(list); },

      /* Where the board is putting them. `at(gx, gy)` gives the stage
         point of a coordinate and `cw`/`ch` are what one cell measures
         there, so the town grows and shrinks with the board rather
         than with the stage — and a place stays on its coordinate
         whenever the panel moves. */
      place: function (at, cw, ch) {
        const T = window.CFG.TOWN;
        places.forEach(function (p, i) {
          const n = nodes[i];
          if (!n) return;
          const s = at(p.x, p.y);
          n.style.left = s.x + 'px';
          /* Its foot sits a little above the dot, so neither the dot
             nor the coordinates written under it are ever covered. */
          n.style.top = (s.y - T.liftCells * ch) + 'px';
          n.style.setProperty('--w', (T.wCells * cw) + 'px');
          n.style.setProperty('--h', (T.hCells * ch) + 'px');
          n.style.setProperty('--cell', ch + 'px');
        });
      },

      show: function () { root.classList.add('on'); },
      hide: function () { root.classList.remove('on'); },
      get shown() { return root.classList.contains('on'); }
    };
  }

  return { mount: mount };
})();

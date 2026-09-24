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
    /* What the places cover, refreshed on every re-place. */
    let room$ = [];

    /* One place: its name pill, and a crop of the town sheet under it.

       These used to be drawn here in CSS — an awning of repeating
       stripes, a roof clipped out of a triangle, windows and a door
       per building. That is gone: one picture, cut by the rect its
       kind names. Deliberately still simple at the size it is shown —
       these are markers on a grid, and a storybook drawn at a cell and
       a half would swamp the ruling the child is meant to be counting
       on. */
    function draw(p) {
      const wrap = document.createElement('div');
      wrap.className = 'town-place town-' + p.kind;
      wrap.dataset.tone = p.tone || 'teal';

      const pill = document.createElement('div');
      pill.className = 'town-pill';
      pill.textContent = p.name;

      const b = document.createElement('div');
      b.className = 'town-build';
      b.style.backgroundImage = 'url("' + window.CFG.TOWN.sheet.src + '")';

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
        const room = [];
        places.forEach(function (p, i) {
          const n = nodes[i];
          if (!n) return;
          const s = at(p.x, p.y);
          n.style.left = s.x + 'px';
          /* Its foot sits a little above the dot, so neither the dot
             nor the coordinates written under it are ever covered. */
          n.style.top = (s.y - T.liftCells * ch) + 'px';
          /* Sized by its own height in cells, with its width taken
             from its own drawing so nothing is squashed — and the
             sheet behind it scaled so exactly that drawing fills the
             box. */
          const sp = (T.sprites || {})[p.kind];
          const sheet = T.sheet;
          if (sp && sheet) {
            const bh = (sp.tall != null ? sp.tall : T.hCells) * ch;
            const bw = bh * (sp.w / sp.h);
            const k = bh / sp.h;
            n.style.setProperty('--w', bw + 'px');
            n.style.setProperty('--h', bh + 'px');
            const b = n.querySelector('.town-build');
            if (b) {
              b.style.backgroundSize = (sheet.w * k) + 'px ' + (sheet.h * k) + 'px';
              b.style.backgroundPosition = (-sp.x * k) + 'px ' + (-sp.y * k) + 'px';
            }
          } else {
            n.style.setProperty('--w', (T.wCells * cw) + 'px');
            n.style.setProperty('--h', (T.hCells * ch) + 'px');
          }
          n.style.setProperty('--cell', ch + 'px');

          /* How much of the paper this place covers, in the panel's own
             pixels, so the board can keep its coordinate labels off it.

             The lift above already leaves room UNDER a building for the
             coordinate that belongs to it — but the board chooses which
             side of a dot to write on, and it was choosing blind: it
             knows about the axis numbers, the lines and the other
             labels, and knew nothing about the five pictures standing
             on top of them. So Cafe A's (5, 4) went up into the cafe
             and the park's (-3, 2) into the trees.

             Measured rather than worked out, because a name pill is as
             wide as its name — "Maya's House" is wider than the house —
             and only the layout knows that. The wrap is centred on the
             point and hangs upwards from its foot, which is where the
             translate(-50%, -100%) puts it. */
          const pill = n.querySelector('.town-pill');
          const foot = s.y - T.liftCells * ch;
          const wide = Math.max(n.offsetWidth || 0, pill ? pill.offsetWidth : 0);
          const tall = n.offsetHeight || 0;
          if (wide && tall) {
            room.push({ l: s.x - wide / 2, t: foot - tall,
                        r: s.x + wide / 2, b: foot,
                        what: p.name || p.kind });
          }
        });
        room$ = room;
      },

      /* The places, as boxes on the paper. Panel pixels — the board
         turns them into its own units, which is the only place that
         knows the two scales. */
      boxes: function () { return room$.slice(); },

      show: function () { root.classList.add('on'); },
      hide: function () { root.classList.remove('on'); },
      get shown() { return root.classList.contains('on'); }
    };
  }

  return { mount: mount };
})();

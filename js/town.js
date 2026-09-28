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

      /* Its door, if its kind has one: laid exactly over the door in
         the picture. Shut, it shows nothing of its own — the drawing is
         the door. Opening, the doorway behind it goes dark and a leaf
         cut from the same sheet swings in on its hinge, so someone can
         come out of it, or go in (Maya, 46). */
      const sp = (window.CFG.TOWN.sprites || {})[p.kind];
      if (sp && sp.door) {
        const door = document.createElement('div');
        door.className = 'town-door';
        const leaf = document.createElement('div');
        leaf.className = 'town-door-leaf';
        leaf.style.backgroundImage = b.style.backgroundImage;
        door.appendChild(leaf);
        b.appendChild(door);
      }

      wrap.appendChild(pill);
      wrap.appendChild(b);
      root.appendChild(wrap);
      return wrap;
    }

    /* Open or shut, swinging. Ajar is the doorway dark with the leaf
       over it, still shut: the moment the drawing hands over to the
       leaf, which looks like nothing happening at all. */
    function swing(d, open) {
      clearTimeout(d.swingT);
      if (open) {
        d.classList.add('ajar');
        void d.offsetWidth;                 // the leaf starts shut, then turns
        d.classList.add('open');
      } else if (d.classList.contains('ajar')) {
        d.classList.remove('open');
        d.swingT = setTimeout(function () { d.classList.remove('ajar'); },
                              window.CFG.TOWN.doorMs || 320);
      }
    }
    function shut(d) {
      clearTimeout(d.swingT);
      d.classList.remove('open', 'ajar');
    }

    /* The last place() — so a door, or a coordinate, can be asked
       where it is now — and how many there have been. */
    let atLast = null, cellLast = null, placedN = 0;

    function build(list) {
      const key = (list || []).map(function (p) {
        return p.key + ':' + p.x + ',' + p.y;
      }).join('|');
      if (key === built) return;
      built = key;
      /* The places only: anyone walking among them stays. */
      nodes.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
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
          /* Its foot sits a little above the dot, so neither the dot
             nor the coordinates written under it are ever covered.

             Or it HANGS from the point (`hang`) — a tower whose top is
             the point, with its name above: at the top of the paper a
             tower standing on its point would stand off the edge, and a
             side leaving the point downwards would run through it. */
          n.classList.toggle('hang', !!p.hang);
          /* Or it stands in the corner of the first quadrant beside its
             point (`corner`): the station is AT the origin, and standing
             on it, centred, it covered the point, the first unit counted
             out of it and both axes where they cross. */
          n.classList.toggle('q1', !!p.corner);
          /* Or its name beside the picture instead of over it (`tag:
             'right'`), for a place near the top of the paper. */
          n.classList.toggle('tag-right', p.tag === 'right');
          const lift = T.liftCells * ch;
          n.style.top = (p.hang ? (s.y + lift) : (s.y - lift)) + 'px';
          n.style.left = (p.corner ? (s.x + lift * 1.6) : s.x) + 'px';
          /* Sized by its own height in cells, with its width taken
             from its own drawing so nothing is squashed — and the
             sheet behind it scaled so exactly that drawing fills the
             box. */
          const sp = (T.sprites || {})[p.kind];
          const sheet = T.sheet;
          if (sp && sheet) {
            /* A place can be drawn bigger than its kind's default — on
               the wide board a cell is a third of the size. */
            const bh = (p.tall != null ? p.tall : (sp.tall != null ? sp.tall : T.hCells)) * ch;
            const bw = bh * (sp.w / sp.h);
            const k = bh / sp.h;
            n.style.setProperty('--w', bw + 'px');
            n.style.setProperty('--h', bh + 'px');
            const b = n.querySelector('.town-build');
            if (b) {
              b.style.backgroundSize = (sheet.w * k) + 'px ' + (sheet.h * k) + 'px';
              b.style.backgroundPosition = (-sp.x * k) + 'px ' + (-sp.y * k) + 'px';
            }
            /* The door over the drawing's door, and its leaf showing
               exactly the pixels it covers. */
            const d = n.querySelector('.town-door');
            if (d && sp.door) {
              const D = sp.door;
              d.style.left = (D.x * k) + 'px';
              d.style.top = (D.y * k) + 'px';
              d.style.width = (D.w * k) + 'px';
              d.style.height = (D.h * k) + 'px';
              d.style.setProperty('--door-p', (D.w * k * 3) + 'px');
              d.style.setProperty('--door-ms', (T.doorMs || 320) + 'ms');
              const leaf = d.firstChild;
              leaf.style.backgroundSize = (sheet.w * k) + 'px ' + (sheet.h * k) + 'px';
              leaf.style.backgroundPosition = (-(sp.x + D.x) * k) + 'px ' + (-(sp.y + D.y) * k) + 'px';
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
          if (wide && tall && p.hang) {
            /* Hung: the picture just under the point, its name under the
               picture — nothing over the point or its coordinates. */
            const lift = T.liftCells * ch;
            room.push({ l: s.x - wide / 2, t: s.y + lift,
                        r: s.x + wide / 2, b: s.y + lift + tall,
                        what: p.name || p.kind });
          } else if (wide && tall && p.corner) {
            const lift = T.liftCells * ch;
            room.push({ l: s.x + lift * 1.6, t: foot - tall,
                        r: s.x + lift * 1.6 + wide, b: foot,
                        what: p.name || p.kind });
          } else if (wide && tall && p.tag === 'right') {
            /* The picture on its point, its name out to the right. */
            const bw = n.offsetWidth || 0, gap = 0.1 * ch;
            room.push({ l: s.x - bw / 2, t: foot - tall,
                        r: s.x + bw / 2 + gap + (pill ? pill.offsetWidth : 0), b: foot,
                        what: p.name || p.kind });
          } else if (wide && tall) {
            room.push({ l: s.x - wide / 2, t: foot - tall,
                        r: s.x + wide / 2, b: foot,
                        what: p.name || p.kind });
          }
        });
        room$ = room;
        atLast = at; cellLast = { w: cw, h: ch }; placedN++;
      },

      /* Where a coordinate is in this layer, one cell's size there, and
         how many times the places have been put down — something moving
         over them measures again when that changes. */
      spot: function (gx, gy) { return atLast ? atLast(gx, gy) : null; },
      cell: function () { return cellLast; },
      get placed() { return placedN; },

      /* The door of the place standing on (gx, gy), if it has one:
         the middle of its foot (its threshold), how wide and tall it
         is — all in this layer's pixels, read off the layout, so it is
         right whichever way the place is drawn — and a way to open it,
         shut it swinging, or shut it at once. */
      door: function (gx, gy) {
        let i = -1;
        places.forEach(function (p, j) { if (i < 0 && p.x === gx && p.y === gy && nodes[j] && nodes[j].querySelector('.town-door')) i = j; });
        if (i < 0) return null;
        const d = nodes[i].querySelector('.town-door');
        const rr = root.getBoundingClientRect(), dr = d.getBoundingClientRect();
        /* The stage may be drawn scaled; the layer's own pixels are
           what anything placed in it is placed in. */
        const kx = (rr.width / (root.offsetWidth || 1)) || 1;
        const ky = (rr.height / (root.offsetHeight || 1)) || 1;
        return {
          x: (dr.left + dr.width / 2 - rr.left) / kx,
          y: (dr.bottom - rr.top) / ky,
          w: dr.width / kx, h: dr.height / ky,
          open: function (on) { swing(d, on !== false); },
          shut: function () { shut(d); }
        };
      },

      /* Someone out among the places, over all of them: a strip of
         `frames` frames, each fw x fh, walked by whoever holds it —
         feet at (x, y) in this layer's pixels, `s` times its size,
         frame `f`, turned round or not, faded to `o`. */
      walker: function (src, fw, fh, frames) {
        const w = document.createElement('div');
        w.className = 'town-walker';
        const fig = document.createElement('div');
        fig.className = 'town-walker-fig';
        fig.style.backgroundImage = 'url("' + src + '")';
        w.appendChild(fig);
        root.appendChild(w);
        let W = 0, H = 0, feet = 1;
        return {
          size: function (width, height, feetAt) {
            W = width; H = height; feet = feetAt;
            w.style.width = W + 'px';
            w.style.height = H + 'px';
            w.style.transformOrigin = (W / 2) + 'px ' + (H * feet) + 'px';
            fig.style.backgroundSize = (W * frames) + 'px ' + H + 'px';
          },
          at: function (x, y, s, f, turned, o) {
            w.style.transform = 'translate(' + (x - W / 2).toFixed(2) + 'px,' + (y - H * feet).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
            fig.style.backgroundPosition = (-f * W).toFixed(2) + 'px 0';
            fig.style.transform = turned ? 'scaleX(-1)' : '';
            w.style.opacity = o.toFixed(3);
          },
          remove: function () { if (w.parentNode) w.parentNode.removeChild(w); }
        };
      },

      /* The places, as boxes on the paper. Panel pixels — the board
         turns them into its own units, which is the only place that
         knows the two scales. */
      boxes: function () { return room$.slice(); },

      /* The places a screen is not about step back (`keys`), and
         come forward again with an empty list. */
      focus: function (keys) {
        places.forEach(function (p, i) {
          if (nodes[i]) nodes[i].classList.toggle('dim', (keys || []).indexOf(p.key) >= 0);
        });
      },

      show: function () { root.classList.add('on'); },
      hide: function () { root.classList.remove('on'); },
      get shown() { return root.classList.contains('on'); }
    };
  }

  return { mount: mount };
})();

/* =============================================================
   Distance Formula — screen flow
   ============================================================= */
(function () {
  'use strict';
  const C = window.CFG, SFX = window.Audio8, FX = window.FX;
  const $ = function (s) { return document.querySelector(s); };

  /* ---------------- element handles ---------------- */
  const el = {};
  ['viewport', 'stage', 'loader', 'loaderBar', 'loaderPct',
   'startScreen', 'playBtn', 'playImg', 'scene', 'skyLayer',
   'charGroup', 'shadow', 'birdRig', 'birdFlip', 'birdWin', 'flySheet', 'talkSheet',
   'bubble', 'bubbleShape', 'bubbleBody', 'bubbleSheen',
   'bubbleText', 'bubbleLine', 'nav', 'nextBtn', 'backBtn',
   'gridPanel', 'gridImg', 'gridAxes', 'standSwifty',
   'formulaBoard', 'leafLayer', 'fxLayer', 'sceneArt', 'startArt',
   'startBird', 'startBirdWin', 'startFly', 'startTalk', 'startShadow', 'startSky'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  /* Every number the board writes, with a real MINUS SIGN in front of
     it rather than a hyphen.

     `String(-6)` gives "-6", and the hyphen-minus is a word-joining
     dash: short, sitting low, and cut to the width of a letter. Beside
     a 32px numeral it reads as a speck of dirt rather than as part of
     the number, which is what made the negative numbering look wrong
     along the bottom of the board. U+2212 is the arithmetic sign — the
     width of a digit, on the same line as the bar of a plus, which is
     what the eye is looking for. The subtraction the board writes
     already uses it; this brings the numbers themselves into line. */
  const numText = function (v) { return String(v).replace('-', '\u2212'); };

  /* ---------------- responsive stage ---------------- */
  function fitStage() {
    const s = Math.min(window.innerWidth / C.STAGE_W, window.innerHeight / C.STAGE_H);
    el.stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);

  /* ---------------- sprite player ---------------- */
  /* Built per rig rather than as a singleton: the title screen runs its
     own Swifty, at its own size, on elements of its own — the game's rig
     lives inside #scene, which is still hidden while that plays. */
  function makeSprite() {
   return {
    sheet: 'talk', frame: 0, playing: false, acc: 0, last: 0, loop: true,
    scale: 1,
    win: null,
    img: {},

    /* Any number of sheets, each with its own image, its own pixel
       size and its own scale factor. It was exactly two of one size
       once; both of hers are that size again, and the generality is
       kept because it costs nothing and a sheet that states its own
       dimensions is the honest way round. */
    setup: function (win, imgs, scale) {
      this.win = win;
      this.img = imgs || {};
      this.setScale(scale);
    },

    /* Screens draw her at different sizes — small in the field, full
       size beside the board — so the sheet is rescaled per screen. */
    setScale: function (S) {
      this.scale = S;
      const self = this;
      Object.keys(this.img).forEach(function (name) {
        const im = self.img[name], sh = C.SHEETS[name];
        if (!im || !sh) return;
        im.style.width = (sh.sw || C.SHEET_W) * S * (sh.k || 1) + 'px';
        im.style.height = (sh.sh || C.SHEET_H) * S * (sh.k || 1) + 'px';
      });
      this.show(this.sheet, this.frame);
    },

    /* Seats one pose so its belly anchor lands on the rig origin.
       Every pose has its own opaque bounds and its own anchor, so
       all six numbers are recomputed per frame. */
    show: function (sheet, i) {
      const spec = C.SHEETS[sheet];
      const im = this.img[sheet];
      if (!spec || !im) return;                 // a rig without this sheet
      const S = this.scale * (spec.k || 1);
      const f = spec.frames[i];
      this.sheet = sheet; this.frame = i;

      this.win.style.left = -(f.ax - f.x) * S + 'px';
      this.win.style.top = -(f.ay - f.y) * S + 'px';
      this.win.style.width = f.w * S + 'px';
      this.win.style.height = f.h * S + 'px';

      im.style.left = -f.x * S + 'px';
      im.style.top = -f.y * S + 'px';
      im.style.visibility = 'visible';
      const self = this;
      Object.keys(this.img).forEach(function (n) {
        if (n !== sheet && self.img[n]) self.img[n].style.visibility = 'hidden';
      });
    },

    play: function (sheet, loop) {
      this.sheet = sheet;
      this.loop = loop !== false;
      this.playing = true;
      this.acc = 0;
      this.show(sheet, 0);
    },

    stopAt: function (sheet, i) {
      this.playing = false;
      this.show(sheet, i || 0);
    },

    tick: function (dt) {
      if (!this.playing) return;
      const def = C.SHEETS[this.sheet];
      this.acc += dt;
      const step = 1000 / def.fps;
      while (this.acc >= step) {
        this.acc -= step;
        let n = this.frame + 1;
        if (n >= def.frames.length) {
          if (!this.loop) { this.playing = false; n = def.frames.length - 1; }
          else n = 0;
        }
        this.show(this.sheet, n);
      }
    }
   };
  }
  const Sprite = makeSprite();        // the game's rig, inside #scene
  const StartSprite = makeSprite();   // the title screen's, bigger

  let lastT = 0;
  function loop(t) {
    const dt = lastT ? Math.min(t - lastT, 60) : 16;
    lastT = t;
    Sprite.tick(dt);
    StartSprite.tick(dt);
    requestAnimationFrame(loop);
  }

  /* ---------------- layout of positioned art ---------------- */
  const REF_W = C.SHEETS.talk.frames[0].w;
  /* One control answers every screen that has a number for an answer —
     the distance questions and the two worked-out ones alike. It
     replaced a slider and a typed keypad that did the same job in two
     different shapes. */
  /* `Sel` is whichever numeric control the screen on show is using.
     Both are mounted once and both answer to the same small surface —
     show / hide / reset / set / setRange / markCorrect / markWrong /
     lock / onCheck — so everything that drives an answer can go on
     saying `Sel` without knowing which one is up. A screen picks with
     `control: 'slider'`; everything else gets the reel. */
  let Lock  = null;             // the combination reel
  let Slide = null;             // the ruler
  let Sel  = null;              // whichever of the two this screen wants
  let Slots = null;             // the substitution panel
  let Opts = null;              // the triangle-type answer panel
  let Jump = null;              // the screen picker beside Next
  let Hints = null;             // the "Need a hint?" row inside it
  let Town = null;              // the closing beat's map, drawn over the board

  /* Where the character, her shadow and her bubble sit on a given
     screen. Screens 1-4 use the small field pose; screen 5 puts her
     full size on the left of the board in the standing artwork. */
  /* The x-axis and y-axis cases are the same screen with the axes
     swapped, so they share a code path and differ only in config. */
  function axisOf(entry) {
    if (entry.layout === 'xaxis') return C.XAXIS;
    if (entry.layout === 'yaxis') return C.YAXIS;
    return null;
  }

  /* Her rig for a given standing spot. Two screens' worth of geometry
     used to be written out twice; they differ only in where she is. */
  function standGeom(S, extra) {
    const g = {
      stand: true,
      scale: S.charScale,
      standBox: { x: S.pos.x, y: S.pos.y, w: S.w, h: S.h },
      anchor: { x: S.pos.x + S.belly.x,   y: S.pos.y + S.belly.y },
      aim:    { x: S.pos.x + S.headTop.x, y: S.pos.y + S.headTop.y },
      feetY:  S.pos.y + S.feet.y,
      feetCx: S.pos.x + S.feet.cx,
      inkW:   S.inkW,
      bubble: C.GRID.bubbleDown,
      bubbleScale: 1
    };
    if (extra) Object.keys(extra).forEach(function (k) { g[k] = extra[k]; });
    return g;
  }

  function geomFor(i) {
    const entry = C.SCRIPT[i] || {};
    const AX = axisOf(entry);
    if (AX) {
      /* Board top right, the working under it, and her in her own
         column saying what the case is — the same rig as every other
         screen she speaks on. */
      return standGeom(C.BOARD.stand, {
        panelBox: { x: AX.grid.x, y: AX.grid.y, w: AX.grid.w, h: AX.grid.h }
      });
    }
    if (entry.layout === 'recap') {
      // the result stated on its own: board to one side, nobody in shot
      const R = C.RECAP;
      return { stand: false, bare: true, scale: C.CHAR_SCALE, anchor: C.ANCHOR,
               aim: C.ANCHOR, feetY: 0, feetCx: 0, inkW: 0,
               bubbleScale: C.BUBBLE.scale,
               panelBox: { x: R.grid.x, y: R.grid.y, w: R.grid.w, h: R.grid.h } };
    }
    /* A distance question has her on screen after all: she flies in to
       put it, then leaves before the controls arrive. She lands at the
       bottom left, in front of the centred board. */
    if (entry.intro === 'measure') {
      /* The same rig the grid screens use — she lands on the grass at
         the left and the board sits right. She stays down here to ask;
         if a control turns up it moves her out of its way. */
      return standGeom(C.BOARD.stand, {
        panelBox: { x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                    w: C.BOARD.panel.w, h: C.BOARD.panel.h }
      });
    }
    if (entry.layout === 'board') {
      /* The same rig as a distance screen: she stands in her column and
         speaks from her own bubble. */
      return standGeom(C.BOARD.stand, {
        panelBox: { x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                    w: C.BOARD.panel.w, h: C.BOARD.panel.h }
      });
    }
    if (entry.layout === 'grid') {
      const S = C.STAND;
      return {
        stand: true,
        // matches the flying sheet to the landed artwork's height
        scale: S.charScale,
        standBox: { x: S.pos.x, y: S.pos.y, w: S.w, h: S.h },
        anchor: { x: S.pos.x + S.belly.x,   y: S.pos.y + S.belly.y },
        // she is under her line here, so the tail comes down on her crown
        aim:    { x: S.pos.x + S.headTop.x, y: S.pos.y + S.headTop.y },
        feetY:  S.pos.y + S.feet.y,
        feetCx: S.pos.x + S.feet.cx,
        inkW:   S.inkW,
        /* Its own wide bubble, at full size: the screens' own
           bubbleScale was tuning the tall one down to fit beside the
           board, and there is no board beside her any more. */
        bubble: C.GRID.bubbleDown,
        bubbleScale: 1
      };
    }
    return {
      stand: false,
      scale: C.CHAR_SCALE,
      anchor: C.ANCHOR,
      aim:    { x: C.ANCHOR.x + C.HEAD_TOP.dx, y: C.ANCHOR.y + C.HEAD_TOP.dy },
      /* And where a corner-tailed balloon points instead: her cheek,
         out at the right of her head rather than on top of it. */
      aimSide: {
        x: C.ANCHOR.x + REF_W * C.CHAR_SCALE * C.BUBBLE.aimSide.dx,
        y: (C.ANCHOR.y + C.HEAD_TOP.dy) +
           (C.FEET_DY - C.HEAD_TOP.dy) * C.BUBBLE.aimSide.dy
      },
      feetY:  C.ANCHOR.y + C.FEET_DY,
      feetCx: C.SWIFTY.cx,
      inkW:   REF_W * C.CHAR_SCALE,
      bubbleScale: entry.bubbleScale || C.BUBBLE.scale
    };
  }

  /* Seats the rig, shadow and bubble for one screen's geometry. */
  function applyGeom(g) {
    Sprite.setScale(g.scale);
    el.birdRig.style.left = g.anchor.x + 'px';
    el.birdRig.style.top = g.anchor.y + 'px';

    /* She stands on a different board's rail depending on the screen,
       so the resting artwork is seated here rather than once at boot. */
    if (g.standBox) {
      el.standSwifty.style.left = g.standBox.x + 'px';
      el.standSwifty.style.top = g.standBox.y + 'px';
      el.standSwifty.style.width = g.standBox.w + 'px';
      el.standSwifty.style.height = g.standBox.h + 'px';
    }

    /* The shadow is a soft ellipse on the ground. On the grid screens
       she is up on the board's frame, and a ground shadow on a 28px rail
       reads as her hovering over a surface that is not there. */
    el.shadow.classList.toggle('gone', !!g.noShadow);
    const SH = C.SHADOW;
    const shW = g.inkW * SH.widthRatio;
    const shH = shW * SH.heightRatio;
    el.shadow.style.left = (g.feetCx - shW / 2) + 'px';
    el.shadow.style.top = (g.feetY + SH.dy - shH / 2) + 'px';
    el.shadow.style.width = shW + 'px';
    el.shadow.style.height = shH + 'px';

    /* Speech bubble: the tail tip is driven onto the top of her head
       (sinking `biteIntoHead` px into it) so the two touch instead of
       the bubble floating above.

       A balloon already on screen keeps the shape it is holding. Re-
       seating it at the shape's default first made every screen change
       flash the full-width box for a few frames before the line it was
       about to say shrank it again. */
    seatBubble(g,
      Bubble.up ? Bubble.boxW : null,
      Bubble.up ? Bubble.boxH : null);
  }

  /* Seats the speech bubble for one screen. Split out of applyGeom so a
     line can re-seat it at a width measured from the text. */
  function seatBubble(g, inkWOverride, bodyHOverride) {
    /* A layout may bring its own bubble shape — the grid screens use a
       wide, shallow one whose tail leaves the side rather than the
       bottom, because she stands above the board with nothing over her. */
    const B = g.bubble || C.BUBBLE, s = g.bubbleScale;
    /* A shape can hang its tail off the balloon's bottom-left corner
       instead of the middle of its underside. Then the balloon sits up
       and to the right of whatever it points at, so she speaks from
       beside her own face rather than from over her head — which only
       works where nothing else wants that space. */
    const side = B.tailSide === 'left';
    const aim = (side && g.aimSide) || g.aim;
    const inkW = (inkWOverride != null ? inkWOverride : B.ink.w) * s;
    /* A shape can be given a shorter balloon for a line that only needs
       one row — the tail keeps its length, so the box shrinks from the
       top and the point stays on her head. */
    const bodyH = bodyHOverride != null ? bodyHOverride : B.bodyH;
    const tailLen = B.tailLen != null ? B.tailLen : (B.tip.y - B.bodyH);
    const inkH = (bodyH + tailLen + 1) * s;
    const tipX = B.tip.x * s, tipY = (bodyH + tailLen) * s;
    const tip = { x: aim.x, y: aim.y + B.biteIntoHead };

    el.bubble.style.left = (tip.x - tipX) + 'px';
    el.bubble.style.top = (tip.y - tipY) + 'px';
    el.bubble.style.width = inkW + 'px';
    el.bubble.style.height = inkH + 'px';
    // Pop the bubble out of the tail tip, where it is anchored.
    el.bubble.style.transformOrigin = tipX + 'px ' + tipY + 'px';

    const bs = el.bubble.style;
    bs.setProperty('--e1',   B.edgeW * s + 'px');
    bs.setProperty('--fill', B.fill);
    bs.setProperty('--edge', B.edge);
    bs.setProperty('--ink',  B.ink_);
    bs.setProperty('--sheen', B.sheen);
    bs.setProperty('--bubSize', B.size * s + 'px');
    bs.setProperty('--glow',     B.glow     || 'rgba(224, 154, 85, .34)');
    bs.setProperty('--glowWide', B.glowWide || 'rgba(224, 154, 85, .18)');
    bs.setProperty('--cast',     B.cast     || 'rgba(120, 62, 14, .24)');

    /* ---- the silhouette, as one path ----
       Balloon and tail used to be two shapes laid over each other, and
       where they met the balloon's corner was stroked on both sides:
       its border dead-ended in mid-air and the tail's flat top jutted
       out past the curve as a step. Overlapping them harder only moved
       the step. Drawn as one outline the join cannot exist — the box's
       underside simply carries on down to the point and back up.

       The stroke is centred on the line, so every coordinate is inset
       by half its width and the outer edge lands exactly on the box,
       which is where the balloon's border sat before. */
    const e = B.edgeW * s, hw = e / 2;
    const bw = inkW, bh = bodyH * s, drop = tailLen * s;
    const x0 = hw, y0 = hw, x1 = bw - hw, y1 = bh - hw;
    const r = Math.max(0, Math.min(B.radius * s - hw,
                                   Math.min(bw, bh) / 2 - hw));
    /* The tail hangs off the underside, clear of the corner, and leans
       in to its point — a horn, with both edges curved, rather than a
       spike. Run off the corner itself it read as a spur growing out of
       the box: the round corner is what says balloon, and the tail has
       to leave a finished edge rather than replace one.

       `tip` is the point, not the join: the join sits up and to the
       right of it, held clear of both corner arcs so the underside it
       leaves is straight. */
    /* The shared bubble draws its tail in a 44 x 42 box: the join runs
       x 4..42 on y 0, the point sits at (2, 34). So the join is 38 wide
       against a drop of 34 — 1.118 — and the point falls 2/38 of that
       width to the LEFT of where the join starts, which is what gives
       the tail its hook instead of a lean. The curve below is that
       path's own control points, restated against jx/jw/drop so it
       holds at any size. */
    const TAIL_W = 38 / 34, TAIL_BACK = 2 / 38;
    const jw = Math.max(16, Math.min(drop * TAIL_W, (x1 - r) - (x0 + r)));
    const jx = Math.max(x0 + r, Math.min(x1 - r - jw, tipX + jw * TAIL_BACK));
    const ptX = jx - jw * TAIL_BACK, ptY = y1 + drop;
    const d = [
      'M' + (x0 + r) + ' ' + y0,
      'H' + (x1 - r),
      'A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + (y0 + r),
      'V' + (y1 - r),
      'A' + r + ' ' + r + ' 0 0 1 ' + (x1 - r) + ' ' + y1,
      'H' + (jx + jw),
      // down the outer edge, which falls away steeply, to the point
      'C' + (jx + jw * (32 / 38)) + ' ' + (y1 + drop * (12 / 34)) + ' ' +
            (jx + jw * (20 / 38)) + ' ' + (y1 + drop * (22 / 34)) + ' ' + ptX + ' ' + ptY,
      // and back up the inner one, which stays tucked under the join
      'C' + (jx + jw * (4 / 38)) + ' ' + (y1 + drop * (24 / 34)) + ' ' +
            (jx + jw * (4 / 38)) + ' ' + (y1 + drop * (12 / 34)) + ' ' + jx + ' ' + y1,
      'H' + (x0 + r),
      'A' + r + ' ' + r + ' 0 0 1 ' + x0 + ' ' + (y1 - r),
      'V' + (y0 + r),
      'A' + r + ' ' + r + ' 0 0 1 ' + (x0 + r) + ' ' + y0,
      'Z'
    ];

    el.bubbleShape.setAttribute('width', bw);
    el.bubbleShape.setAttribute('height', inkH);
    el.bubbleShape.setAttribute('viewBox', '0 0 ' + bw + ' ' + inkH);
    el.bubbleBody.setAttribute('d', d.join(' '));

    /* The catch-light, where the light is coming from. Sized off the
       line's own size so it holds its proportion at any scale. */
    const em = B.size * s;
    const cx = e + em * 0.67, cy = e + em * 0.44;
    el.bubbleSheen.setAttribute('cx', cx);
    el.bubbleSheen.setAttribute('cy', cy);
    el.bubbleSheen.setAttribute('rx', em * 0.25);
    el.bubbleSheen.setAttribute('ry', em * 0.10);
    el.bubbleSheen.setAttribute('transform', 'rotate(-22 ' + cx + ' ' + cy + ')');

    if (B.pad) {
      el.bubbleText.style.left = B.pad.x * s + 'px';
      el.bubbleText.style.top = B.pad.y * s + 'px';
      el.bubbleText.style.width = (inkW - B.pad.x * 2 * s) + 'px';
      el.bubbleText.style.height = (bodyH - B.pad.y * 2) * s + 'px';
    } else {
      el.bubbleText.style.left = inkW * B.text.left + 'px';
      el.bubbleText.style.top = inkH * B.text.top + 'px';
      el.bubbleText.style.width = inkW * B.text.width + 'px';
      el.bubbleText.style.height = inkH * B.text.height + 'px';
    }
  }

  function layout() {
    applyGeom(geomFor(0));

    /* Screen 5 art sits at fixed 1:1 positions from the brief. */
    Board.place(C.GRID.box);

    /* It mounts itself and owns its own markup and styles; the game
       only decides where, when, and what range it counts over. */
    if (window.NumberSelector && !Lock) {
      const SP = C.BOARD.selector;
      Lock = window.NumberSelector.mount(el.scene,
        { x: SP.pos.x, y: SP.pos.y, scale: SP.scale, hidden: true });
      Sel = Lock;
    }
    /* The other way of giving a number: a ruler rather than a keypad,
       for the one question that is about how far rather than about how
       many. Same column, same housing, same surface. */
    if (window.DistanceSlider && !Slide) {
      const DP = C.BOARD.slider || C.BOARD.selector;
      Slide = window.DistanceSlider.mount(el.scene,
        { x: DP.pos.x, y: DP.pos.y, scale: DP.scale, hidden: true });
    }
    /* And the panel that asks where the numbers go before anything is
       worked out. It stands where the answers stand. */
    if (window.FormulaSlots && !Slots) {
      const FP = C.BOARD.slots || C.BOARD.options;
      Slots = window.FormulaSlots.mount(el.scene,
        { x: FP.pos.x, y: FP.pos.y, scale: FP.scale, hidden: true });
    }
    if (window.TriangleOptions && !Opts) {
      const OP = C.BOARD.options;
      // scaled to her column, the same way the number selector is
      Opts = window.TriangleOptions.mount(el.scene,
        { x: OP.pos.x, y: OP.pos.y, scale: OP.scale, hidden: true });
      /* The hint lives inside the answers, so it takes their scale and
         their column without needing to know where either is. */
      if (window.HintNote) Hints = window.HintNote.mount(Opts.el);
    }

    /* A way around the lesson, beside the way on: which screen you are
       on, and every screen you could be on instead. It goes through
       goTo, so a jump is the ordinary screen change Back and Next make.
       Switched off in one place — `CFG.NAV.jump` — for a build that
       should not carry it. */
    if (window.ScreenJump && !Jump && (!C.NAV || C.NAV.jump !== false)) {
      Jump = window.ScreenJump.mount(el.nav, {
        screens: function () { return C.SCRIPT; },
        current: function () { return Game.index; },
        go: function (i) { Game.goTo(i); }
      });
      Jump.sync();
    }

    /* The town is drawn over the board, so it goes in the panel and
       follows every re-place the board makes. */
    if (window.TownMap && !Town) {
      Town = window.TownMap.mount(el.gridPanel);
      Board.onPlaced = function () {
        const cell = Board.cellSize();
        Town.place(function (gx, gy) {
          const G = C.GRID, b = Board.box || G.box;
          /* Inside the panel, so the panel's own corner is the origin
             — stagePos answers in stage coordinates and this layer is
             not on the stage. */
          return { x: (G.originX + gx * G.stepX) * (b.w / G.w),
                   y: (G.originY - gy * G.stepY) * (b.h / G.h) };
        }, cell.w, cell.h);
      };
    }

    /* The standing pose is seated per screen now, in applyGeom — the
       grid screens and the distance screens put her on different
       boards' rails. */

    /* Play button: the glowing disc is fitted into the briefed box. */
    const P = C.PLAY;
    const k = P.sizeScale || 1;
    const ps = Math.min((P.box.w * k) / P.ink.w, (P.box.h * k) / P.ink.h);
    const dw = P.ink.w * ps, dh = P.ink.h * ps;
    el.playBtn.style.left = (P.box.cx - dw / 2) + 'px';
    el.playBtn.style.top = (P.box.cy - dh / 2) + 'px';
    el.playBtn.style.width = dw + 'px';
    el.playBtn.style.height = dh + 'px';
    el.playImg.style.width = P.srcW * ps + 'px';
    el.playImg.style.height = P.srcH * ps + 'px';
    el.playImg.style.left = -P.ink.x * ps + 'px';
    el.playImg.style.top = -P.ink.y * ps + 'px';
  }

  /* True while a screen shows the standing artwork instead of the
     animated sheet. She must not flip to the talking sheet to speak
     on those screens. */
  let standPose = false;

  /* ---------------- speech bubble ---------------- */
  const Bubble = {
    typing: false, timer: null, hideTimer: null, full: '', shown: 0, onDone: null,
    voiceMs: 0,
    /* How much of the recording is still sounding when the last word
       lands. The words are paced across the voice with a little left
       over, so a caller that has to wait for her to actually stop —
       the count-out does — has something true to wait on rather than a
       guess that happens to fit this line's length. */
    voiceTail: 0,
    /* Whether the balloon is already on screen. A line replacing another
       must not pop the box away and back — that is the flicker between
       every sentence — so it resizes instead, and only an arrival pops. */
    up: false,
    boxW: null, boxH: null,          // the shape it currently holds
    glide: 0,                        // id of the resize in flight, if any
    spans: [],
    /* The line split into words, each keeping its trailing space, so
       joining the shown ones reproduces the text exactly. The reveal
       steps a word at a time rather than a letter at a time — at this
       reading age a word appearing whole is read as a word, where a
       letter crawl has to be reassembled before it means anything. */
    words: [],

    /* Pick the largest type size at which the whole line still fits
       the plate, so a long line can never spill out of the bubble
       (and so a fallback font can't break the layout either). */
    fitType: function (text) {
      const line = el.bubbleLine, plate = el.bubbleText;
      const max = plate.clientHeight;      // 0 while the bubble is hidden
      const g = Game.geom;
      let size = (g && g.bubble && g.bubble.size) || C.BUBBLE.size;
      line.style.fontSize = size + 'px';
      line.textContent = text;
      if (max > 0) {
        while (size > 20 && line.offsetHeight > max) {
          size -= 2;
          line.style.fontSize = size + 'px';
        }
      }
      line.textContent = '';
    },

    /* Shrink-wraps the balloon to the line it is about to say, for the
       shapes that ask for it. Measured with the real face at the size
       fitType settled on, so the cream either side is the padding the
       shape asks for and nothing more — a fixed bar leaves "Correct!"
       marooned in the middle of it. */
    fitBox: function (text) {
      /* The same fallback seatBubble() uses: only the grid layout brings
         its own shape, and reading g.bubble alone left every other
         screen on a fixed bar however short its line was. */
      const g = Game.geom, B = (g && g.bubble) || C.BUBBLE;
      if (!g || !B.autoWidth) return 0;
      const A = B.autoWidth, line = el.bubbleLine, plate = el.bubbleText;
      const prevWrap = line.style.whiteSpace, prevW = plate.style.width;
      line.style.whiteSpace = 'nowrap';
      plate.style.width = 'auto';
      line.textContent = text;
      const measured = line.offsetWidth;
      line.textContent = '';
      line.style.whiteSpace = prevWrap;
      plate.style.width = prevW;
      if (!measured) return 0;             // hidden, or no metrics yet
      /* Two pixels of slack: sized to exactly the measured width, the
         plate and the line are the same length, and any sub-pixel
         difference between the nowrap measurement and the real wrap
         spills a second row into a box cut for one. */
      const want = Math.min(A.max, Math.max(A.min, measured + A.pad * 2 + 2));
      /* And the height: a line that fits across in one row gets a
         balloon one row tall, instead of sitting in a box built for the
         longest question in the game. */
      let bodyH = null;
      if (B.pad && B.lineH) {
        const usable = want - B.pad.x * 2 * (g.bubbleScale || 1);
        const rows = Math.max(1, Math.ceil(measured / Math.max(1, usable)));
        bodyH = Math.round(rows * B.lineH + B.pad.y * 2);
      }
      return this.setBox(g, want, bodyH);
    },

    /* Takes the balloon to a shape. Already up, it is re-cut a frame at
       a time between the old one and the new: the balloon is a drawn
       path, so a CSS transition on the box would glide the element
       while the outline inside it snapped. */
    setBox: function (g, want, bodyH) {
      const fromW = this.boxW, fromH = this.boxH;
      this.boxW = want; this.boxH = bodyH;
      this.glide++;                                  // any resize in flight is stale
      /* `rising` carries the balloon to the raised spot on a CSS
         transition that owns its left and top. Re-cutting the shape
         every frame moves those too, and the two chase each other, so
         that moment is left to seat in one go. */
      if (!this.up || fromW == null || fromH == null ||
          el.bubble.classList.contains('rising') ||
          (Math.abs(fromW - want) < 1 && Math.abs(fromH - bodyH) < 1)) {
        seatBubble(g, want, bodyH);
        return 0;
      }
      /* Seat the shape it is going to first, so anything measuring the
         plate this tick — fitType, which decides the type size — sees
         the box the line will actually get rather than the one it is
         still leaving. The first glide frame runs before the next
         paint, so this never reaches the screen. */
      seatBubble(g, want, bodyH);
      const self = this, mine = this.glide, t0 = performance.now(), MS = 300;
      const step = function () {
        if (self.glide !== mine) return;             // a newer line took over
        const k = Math.min(1, (performance.now() - t0) / MS);
        const e = 1 - Math.pow(1 - k, 3);            // ease out, no overshoot
        seatBubble(g, fromW + (want - fromW) * e, fromH + (bodyH - fromH) * e);
        if (k < 1) requestAnimationFrame(step);
      };
      /* Scheduled, not called: running the first frame here would put
         the old shape straight back over the target seated above, and
         the type would then be fitted to the box it is leaving. */
      requestAnimationFrame(step);
      return MS;
    },

    /* A coordinate pair must never break across lines, so the space
       inside one becomes non-breaking. Applies to every line, so any
       future "(x, y)" is handled without special-casing. */
    keepPairs: function (text) {
      return text.replace(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, '($1,\u00A0$2)');
    },

    /* The line laid out in full, a span per word, every one hidden. The
       box is therefore the right size before the first word lands, and
       each word fades up exactly where it will sit rather than shoving
       the centred line along as it grows. */
    lay: function (text) {
      const line = el.bubbleLine;
      line.textContent = '';
      this.spans = [];
      const self = this;
      (text.match(/\S+\s*/g) || (text ? [text] : [])).forEach(function (w) {
        const sp = document.createElement('span');
        sp.className = 'wd';
        sp.textContent = w;
        line.appendChild(sp);
        self.spans.push(sp);
      });
      return this.spans;
    },

    /* The whole line, already arrived. Used where a line has to survive
       something that re-seats the box under it. */
    showAll: function (text) {
      this.lay(text == null ? this.full : text);
      this.spans.forEach(function (sp) { sp.classList.add('in'); });
    },

    /* The same line put back, already out.

       lay() empties the box and builds a fresh span per word, and every
       fresh word arrives with its own little fade — so re-showing a line
       she has already finished saying played that arrival a second time,
       word by word, and read as the question being asked twice. This
       marks them settled instead: same words, same box, no arrival. */
    restore: function (text) {
      this.lay(text == null ? this.full : text);
      this.spans.forEach(function (sp) { sp.classList.add('in', 'shown'); });
    },

    /* fitType measured against whatever plate the LAST line left behind,
       and fitBox then moved the plate — so the type was sized for a box
       it never got, and a long line overran the balloon it ended up in.
       Size the box first, fit the type to that, and if the type had to
       come down, cut the box again to the smaller line. */
    fit: function (text) {
      const g = Game.geom, B = (g && g.bubble) || C.BUBBLE;
      el.bubbleLine.style.fontSize = ((B && B.size) || C.BUBBLE.size) + 'px';
      let ms = this.fitBox(text);
      /* Settle: a line that will not fit even the biggest box comes
         down a step, which buys a smaller box, which may let it come
         back up. Two passes is enough to land — the size only ever
         falls, so it cannot cycle. */
      for (let pass = 0; pass < 2; pass++) {
        const was = el.bubbleLine.style.fontSize;
        this.fitType(text);
        if (el.bubbleLine.style.fontSize === was) break;
        ms = this.fitBox(text) || ms;
      }
      return ms;
    },

    open: function (text, done) {
      // an answer can arrive mid-sentence, so stop any line in flight
      if (this.typing) { this.typing = false; clearInterval(this.timer); SFX.duck(false); }
      if (window.Voice) window.Voice.stop();
      text = this.keepPairs(text);
      this.full = text; this.shown = 0; this.onDone = done;
      this.words = text.match(/\S+\s*/g) || [];
      // Unhide first: a display:none plate measures zero.
      clearTimeout(this.hideTimer);
      el.bubble.classList.remove('hidden', 'pop-out');
      const settled = this.fit(text);
      el.bubbleLine.textContent = '';
      /* How long she will take to say it, if there is a recording. The
         words are then paced to her voice instead of to a fixed beat,
         so the line finishes as she does. */
      this.voiceMs = (window.Voice && window.Voice.lengthOf(text)) || 0;
      /* Pop only on arrival. Replacing a line re-pops nothing: the box
         has already resized itself to the new words. */
      let wait;
      if (!this.up) {
        el.bubble.classList.remove('pop-in');
        void el.bubble.offsetWidth;
        el.bubble.classList.add('pop-in');
        this.up = true;
        /* 260 as it always was. Later than this and a question she is
           still asking runs into the player pressing Check, which stops
           her mid-word. */
        wait = 260;
      } else {
        wait = settled ? settled - 40 : 90;
      }

      const self = this;
      setTimeout(function () { self.type(); }, wait);
    },

    type: function () {
      const self = this;
      this.typing = true;
      SFX.duck(true);                 // dip the music under her voice
      if (!standPose) Sprite.play('talk', true);   // beak moves while she speaks

      this.lay(this.full);
      const voiced = window.Voice ? window.Voice.say(this.full) : 0;
      /* Spread the words across the recording so the last one lands as
         she stops speaking. Without one, the old fixed beat stands. */
      const beat = voiced
        ? Math.max(90, voiced / Math.max(1, this.words.length + 0.6))
        : C.AUTO.wordMs;
      this.voiceTail = voiced
        ? Math.max(0, voiced - this.words.length * beat)
        : 0;

      this.timer = setInterval(function () {
        if (self.shown >= self.words.length) { self.finish(); return; }
        const w = self.words[self.shown];
        const sp = self.spans[self.shown++];
        if (sp) sp.classList.add('in');
        // her own voice where there is one; the little notes where not
        if (!voiced) SFX.chirp(/[.!?]\s*$/.test(w) ? 0.7 : 1);
      }, beat);
    },

    /* Tapping mid-line reveals the rest immediately. */
    skip: function () {
      if (!this.typing) return false;
      if (window.Voice) window.Voice.stop();
      this.shown = this.words.length;
      this.spans.forEach(function (sp) { sp.classList.add('in'); });
      this.finish();
      return true;
    },

    finish: function () {
      if (!this.typing) return;
      this.typing = false;
      clearInterval(this.timer);
      SFX.duck(false);
      SFX.chime();
      if (!standPose) Sprite.stopAt('talk', 0);
      if (this.onDone) { const d = this.onDone; this.onDone = null; d(); }
    },

    /* The box has to stay in the layout until the pop-out has played,
       so the hide waits 240ms — and a line arriving inside that window
       would otherwise be hidden by the timer set for the box it
       replaced. open() cancels it. */
    close: function () {
      if (window.Voice) window.Voice.stop();
      this.up = false;
      this.boxW = this.boxH = null;
      this.glide++;                    // drop any resize still running
      if (this.typing) { this.typing = false; clearInterval(this.timer); SFX.duck(false); }
      el.bubble.classList.remove('pop-in');
      el.bubble.classList.add('pop-out');
      const b = el.bubble;
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(function () {
        b.classList.add('hidden'); b.classList.remove('pop-out');
      }, 240);
    }
  };

  /* ---------------- coordinate board ---------------- */
  /* The panel art carries only the cream board and its grid. The axes,
     arrowheads and numbers are drawn as an SVG overlay so each part
     can animate in on its own, and so the numbers land exactly on the
     drawn gridlines (measured into CFG.GRID). */
  const Board = {
    built: false, shown: false, labels: [], axisLabels: [], lines: [], arrows: [], dots: [],
    /* Which of `GRID.ranges` the board is currently drawn on. */
    rangeName: 'close', baseGeom: null,
    foundMarks: [],          // points already located, left on the board

    /* Which board this screen stands on. `close` is the plane the whole
       lesson is taught on; `wide` is the same plane at two fifths, for
       a pair that does not fit on it.

       A unit is a cell on both, which is the rule that matters: every
       point lands on an intersection and can still be counted to. What
       changes is the size of the cell, the numbers written along the
       axes, and how far the ruling runs — and nothing else, because
       every mark the board makes works out where it goes from `origin
       + n × step` at the moment it is drawn. The origin itself does
       not move: both ranges are centred on the viewBox, so the panel,
       the frame and everything measured against them stay put.

       The base geometry is read once and kept, so switching back and
       forth cannot accumulate rounding. */
    setRange: function (name) {
      const G = C.GRID, R = (G.ranges || {})[name || 'close'];
      if (!R || this.rangeName === (name || 'close')) return false;
      if (!this.baseGeom) {
        this.baseGeom = { stepX: G.stepX, stepY: G.stepY,
                          labelGap: G.labelGap, yLabelGap: G.yLabelGap,
                          zeroGap: G.zeroGap };
      }
      const B = this.baseGeom;
      G.stepX = B.stepX * R.k;
      G.stepY = B.stepY * R.k;
      G.originX = G.w / 2;
      G.originY = G.h / 2;
      G.xFrom = R.xFrom; G.xTo = R.xTo;
      G.yFrom = R.yFrom; G.yTo = R.yTo;
      G.labelEvery = R.every;
      G.labelSize = R.labelSize;
      G.overshoot = R.overshoot;
      G.arrow = R.arrow;
      /* The gaps that hold a number off its axis are cell-sized, so
         they come down with the cell; the axis stroke and the type of
         the letters x and y do not, because neither is measured in
         units. */
      G.labelGap = B.labelGap * R.k;
      G.yLabelGap = B.yLabelGap * R.k;
      G.zeroGap = B.zeroGap * R.k;
      G.paper.gxFrom = R.gxFrom; G.paper.gxTo = R.gxTo;
      G.paper.gyFrom = R.gyFrom; G.paper.gyTo = R.gyTo;
      this.rangeName = name || 'close';
      this.forgetTextMetrics && this.forgetTextMetrics();
      /* Whatever pair is up was placed against the old cell. It is not
         "already drawn" any more, whatever its coordinates say. */
      this.lastPlotted = null;

      if (this.built) {
        /* Only the axis furniture is remade. Everything in these four
           lists was made BY the old range and means nothing on the new
           one; everything else on the board is placed against it and
           will be placed again. */
        const svg = el.gridAxes;
        const drop = function (list) {
          list.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
          list.length = 0;
        };
        const wasDrawn = this.lines.some(function (l) { return l.classList.contains('draw'); });
        drop(this.lines); drop(this.arrows); drop(this.labels);
        this.axisLabels.length = 0;
        this.buildAxes();
        /* New axes are made the way the board makes them at the start of
           a screen: dashed out of sight, waiting for the sweep that
           reveals them. A range that changes on a board already on the
           frame gets no sweep — the screen has not been rebuilt — so
           without this the new plane came up as bare paper with no axes
           and no numbers on it at all. They are simply put in the state
           the ones they replaced were in. */
        /* And put back UNDER the drawing. `buildAxes` appends, which is
           right the first time — it runs before anything else is made —
           and wrong every time after: a rebuilt axis went on top of the
           very triangle it is the paper for. Since the board gained a
           second range this has been true of every screen that changes
           one. */
        const svg2 = el.gridAxes;
        const axisNodes = this.lines.concat(this.arrows, this.labels);
        axisNodes.forEach(function (n) { svg2.removeChild(n); });
        for (let k = axisNodes.length - 1; k >= 0; k--) {
          svg2.insertBefore(axisNodes[k], svg2.firstChild);
        }
        if (wasDrawn || this.shown) this.showAxes();
      }
      /* The ruling is laid out from the origin at `place` time, so the
         new cell size reaches it as soon as the board is placed again
         — which the screen change is about to do. */
      return true;
    },

    /* Axes already drawn, with no sweep. The sweep is how a board
       ARRIVES; a board that is already here and has only changed its
       numbering has nothing to announce. */
    showAxes: function () {
      this.lines.forEach(function (l) { l.classList.add('draw'); });
      this.arrows.forEach(function (a) { a.classList.add('pop'); });
      this.labels.forEach(function (t) { t.classList.add('pop'); });
    },

    /* The axes, their arrowheads and their numbering — everything on
       the board that is made OF the range rather than merely placed
       against it. Split out of `build` because a screen can change the
       range, and then this is the only part that has to be made again:
       every line, label and marker the board draws afterwards works
       out where it goes from `origin + n × step` at the moment it is
       drawn, so those follow the new board without being touched. */
    buildAxes: function () {
      const G = C.GRID, NS = 'http://www.w3.org/2000/svg';
      const svg = el.gridAxes;
      const ox = G.originX, oy = G.originY;
      /* Each axis runs a fixed overshoot past its last number to carry
         the arrowhead, sized so no tip leaves the drawn grid. */
      const ov = G.overshoot;
      const xMin = ox + G.xFrom * G.stepX - ov;
      const xMax = ox + G.xTo   * G.stepX + ov;
      const yMin = oy - G.yTo   * G.stepY - ov;
      const yMax = oy - G.yFrom * G.stepY + ov;
      const self = this;

      svg.style.setProperty('--axisDraw', G.axisDrawMs + 'ms');
      svg.style.setProperty('--numLit', G.numLit);
      svg.style.setProperty('--numInk', G.ink);

      const half = function (x2, y2) {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', ox); l.setAttribute('y1', oy);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', G.ink);
        l.setAttribute('stroke-width', G.axisWidth);
        l.setAttribute('class', 'axis');
        const len = Math.hypot(x2 - ox, y2 - oy);
        l.setAttribute('stroke-dasharray', len);
        l.style.strokeDashoffset = len;
        svg.appendChild(l);
        self.lines.push(l);
        return l;
      };
      /* Four half-axes, each drawn outward from the origin and stopped
         at its arrowhead's base rather than its tip: the round line cap
         would otherwise stick out past the point of the arrow. Ending
         at the base tucks the cap under the triangle instead. */
      const al = G.arrow.len;
      this.axisX = [half(xMin + al, oy), half(xMax - al, oy)];
      this.axisY = [half(ox, yMin + al), half(ox, yMax - al)];

      const arrow = function (tx, ty, dx, dy) {
        const a = G.arrow, p = document.createElementNS(NS, 'polygon');
        // base sits `len` back along the axis, corners `halfW` to each side
        const bx = tx - dx * a.len, by = ty - dy * a.len;
        const px = -dy * a.halfW, py = dx * a.halfW;
        p.setAttribute('points',
          tx + ',' + ty + ' ' + (bx + px) + ',' + (by + py) + ' ' + (bx - px) + ',' + (by - py));
        p.setAttribute('fill', G.ink);
        p.setAttribute('class', 'arrow');
        svg.appendChild(p);
        self.arrows.push(p);
      };
      arrow(xMin, oy, -1, 0);
      arrow(xMax, oy,  1, 0);
      arrow(ox, yMin, 0, -1);
      arrow(ox, yMax, 0,  1);

      const label = function (txt, x, y, size, axis, v) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        /* Scale it about its own spot, in the SVG's own units. Relying
           on `transform-box: fill-box` here is what stops the pop being
           seen in some browsers — Safari has long been unreliable about
           the fill box of an SVG <text>, and when it falls back the
           origin becomes the whole viewBox's centre, so the label flies
           in from the middle of the board instead of growing in place.
           Naming the point outright removes the guesswork. */
        t.style.transformOrigin = x + 'px ' + y + 'px';
        t.setAttribute('fill', G.ink);
        t.setAttribute('font-size', size || G.labelSize);
        t.setAttribute('class', 'glabel');
        t.textContent = txt;
        svg.appendChild(t);
        self.labels.push(t);
        /* Which axis it belongs to and how far along it, so it can be
           revealed by the line as that line reaches it. */
        self.axisLabels.push({ el: t, axis: axis || 'x', v: v || 0 });
      };
      /* x numbers sit under the axis, y numbers to its left, 0 in the
         corner between them. The three rows are tuned against each
         other: at stepY 61 a 32px number cannot be centred on both the
         x row and the y=-1 row without them touching, so the x row is
         tucked up under its axis, which is what opens the gap the 0
         and the -1 need. */
      /* Every unit on the close board; every fifth on the wide one,
         where thirty-one numbers along an axis would be a wall of
         digits rather than a scale. The gridline is still there for
         each of the unnumbered ones — a point between two labels is
         still a point you can count to. */
      const step = G.labelEvery || 1;
      for (let x = G.xFrom; x <= G.xTo; x++) {
        if (x === 0 || x % step) continue;
        label(numText(x), ox + x * G.stepX, oy + G.labelGap + G.labelSize * 0.42, 0, 'x', x);
      }
      for (let y = G.yFrom; y <= G.yTo; y++) {
        if (y === 0 || y % step) continue;
        label(numText(y), ox - G.yLabelGap - G.labelSize * 0.30, oy - y * G.stepY, 0, 'y', y);
      }
      // at the origin, so it lights as the sweep sets off
      label('0', ox - G.zeroGap, oy + G.labelGap + G.labelSize * 0.42, 0, 'x', 0);

      /* The axis names sit past the last number, where each sweep ends —
         but the ruling now runs to the panel's own edges, so past the
         last number can be past the paper. Clamped on, like every other
         label the board writes. */
      const N = G.axisName;
      const nw = self.textW('x', N.size);
      label('x', self.clampX(xMax + N.gap, nw), oy - N.rise, N.size, 'x', G.xTo + 1);
      label('y', ox + N.yGap, self.clampY(yMin + N.yDrop, N.size), N.size, 'y', G.yTo + 1);
      /* Held onto so a label can keep off them. They are the two pieces
         of ink on this board that nothing has ever avoided, which is
         how `(6, 1)` came to be written into the x. */
      this.axisNames = self.labels.slice(-2);
    },

    /* Everything the board owns that outlives a change of range, plus
       the axes for whichever range is current. Runs once. */
    build: function () {
      if (this.built) return;
      this.built = true;

      const G = C.GRID, NS = 'http://www.w3.org/2000/svg';
      const svg = el.gridAxes;
      const ox = G.originX, oy = G.originY;
      const self = this;

      this.buildAxes();

      /* Screen 6's intersection markers: every gridline crossing in
         the numbered range. Built once, hidden until that screen. */
      const D = G.dot;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'gridDots');
      g.setAttribute('class', 'dots');
      svg.appendChild(g);
      for (let gy = D.yFrom; gy <= D.yTo; gy++) {
        for (let gx = D.xFrom; gx <= D.xTo; gx++) {
          // points that would land on an axis line are left clear
          if (D.skipOnAxes && (gx === 0 || gy === 0)) continue;
          const c = document.createElementNS(NS, 'circle');
          c.setAttribute('cx', ox + gx * G.stepX);
          c.setAttribute('cy', oy - gy * G.stepY);
          c.setAttribute('r', D.r);
          c.setAttribute('fill', D.fill);
          c.setAttribute('stroke', D.stroke);
          c.setAttribute('stroke-width', D.strokeWidth);
          c.setAttribute('class', 'gdot');
          c.dataset.gx = gx;
          c.dataset.gy = gy;
          // pulse travels outward from the origin rather than in unison
          const ring = Math.abs(gx) + Math.abs(gy);
          const d = ring * D.rippleMs;
          c.style.animationDelay = d + 'ms, ' + (d + 380) + 'ms';
          g.appendChild(c);
          self.dots.push(c);
        }
      }
      /* The face of the triangle, once its three sides are there. Built
         before the legs and the segment, so it lies under every line and
         every label rather than washing over them. */
      const tf = document.createElementNS(NS, 'polygon');
      tf.setAttribute('class', 'trifill');
      svg.appendChild(tf);
      this.triFill = tf;

      /* Legs of the right-angled path. Two slots, each a coloured line
         with an optional endpoint marker and an optional length
         written alongside it. Built once and reused. */
      const LG = G.leg;
      this.legSlots = [];
      for (let i = 0; i < LG.slots; i++) {
        const lg = document.createElementNS(NS, 'g');
        lg.setAttribute('class', 'leg');

        /* The dotted guide, under the solid line and under the
           measuring stroke — the legs are appended before the segment
           group, which is where that stroke lives. It grows out of its
           own start, so it sits in a group that can carry a transform
           origin; the dots themselves are held at size by
           non-scaling-stroke, or they would swell as it grows. */
        const dg = document.createElementNS(NS, 'g');
        dg.setAttribute('class', 'legdash-g');
        const dl = document.createElementNS(NS, 'line');
        dl.setAttribute('class', 'legdash');
        dl.setAttribute('stroke-width', LG.dashWidth || 7);
        dl.setAttribute('stroke-linecap', 'round');
        dl.setAttribute('stroke-dasharray', LG.dashArray || '2 14');
        dl.setAttribute('vector-effect', 'non-scaling-stroke');
        dg.appendChild(dl);

        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('class', 'legline');
        ln.setAttribute('stroke', LG.color);
        ln.setAttribute('stroke-width', LG.width);
        ln.setAttribute('stroke-linecap', 'round');

        const dt = document.createElementNS(NS, 'circle');
        dt.setAttribute('class', 'legdot');
        dt.setAttribute('r', LG.dotR);
        dt.setAttribute('fill', LG.color);
        dt.setAttribute('stroke', '#FFFFFF');
        dt.setAttribute('stroke-width', 3);

        const co = document.createElementNS(NS, 'text');
        co.setAttribute('class', 'legcoord');
        co.setAttribute('fill', G.ink);
        co.setAttribute('font-size', G.segment.coordSize);

        const nm = document.createElementNS(NS, 'text');
        nm.setAttribute('class', 'legname');
        nm.setAttribute('fill', G.ink);
        nm.setAttribute('font-size', G.segment.nameSize);

        const lp = document.createElementNS(NS, 'rect');
        lp.setAttribute('class', 'legplate');
        lp.setAttribute('rx', 11);

        /* In the leg's own colour: with the plate gone, that is what
           says which of the two sides a measurement belongs to. */
        const lt = document.createElementNS(NS, 'text');
        lt.setAttribute('class', 'leglen');
        lt.setAttribute('fill', LG.color);
        lt.setAttribute('font-size', LG.lenSize);

        ln.id = i === 0 ? 'lineAC' : 'lineCB';     // first leg, then second
        ln.style.setProperty('--base-stroke-width', LG.width + 'px');
        ln.style.setProperty('--pulse-stroke-width', (LG.width + 4) + 'px');
        /* The length hangs in a group of its own so it can be TURNED.
           Its own `pop` is a filled animation, and a filled animation
           beats a transform attribute on the same element — so the
           rotation has to sit on something the animation does not
           touch. */
        const lturn = document.createElementNS(NS, 'g');
        lturn.appendChild(lt);
        [dg, ln, dt, co, nm, lp, lturn].forEach(function (n) { lg.appendChild(n); });
        svg.appendChild(lg);
        this.commitDraw(ln);
        this.legSlots.push({ g: lg, line: ln, dot: dt, coord: co, name: nm,
                             plate: lp, len: lt, lenTurn: lturn,
                             dash: dl, dashG: dg });
      }

      /* Three spare lines that do nothing but pulse, laid over the real
         ones. The real lines carry stroke-width as a presentation
         attribute written by the drawing code, and a highlight that
         fights that is a highlight that loses — so nothing here touches
         them. These are appended last, which puts them above everything
         else in the SVG, and they take their ends and their colour from
         whatever they are covering. */
      const pulseG = document.createElementNS(NS, 'g');
      pulseG.setAttribute('class', 'tri-pulse-overlay');
      pulseG.setAttribute('pointer-events', 'none');
      this.pulseLines = [0, 1, 2].map(function () {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('class', 'triangle-pulse-line');
        l.setAttribute('fill', 'none');
        l.setAttribute('stroke-linecap', 'round');
        pulseG.appendChild(l);
        return l;
      });
      this.pulseOverlay = pulseG;

      /* The count's total. There used to be a filled square per unit
         under it as well; the line walking out a unit at a time already
         says how many there are, and the squares only buried the
         coordinates and the ruling under a block of colour. */
      const U = G.unitBox;
      const ug = document.createElementNS(NS, 'g');
      // (the overlay is appended at the very end of build, below)
      ug.setAttribute('class', 'units');

      /* The squares that got taken away were one per unit, bordered,
         drawn on every count — a block of colour over the ruling the
         child was meant to be reading. This is one pale band, a single
         cell deep along the line, and it is only ever shown to someone
         who has missed twice. */
      const ub = document.createElementNS(NS, 'rect');
      ub.setAttribute('class', 'uband');
      ub.setAttribute('fill', U.band.fill);
      ub.setAttribute('stroke', U.band.edge);
      ub.setAttribute('stroke-width', U.band.edgeW);
      ug.appendChild(ub);

      const ul = document.createElementNS(NS, 'text');
      ul.setAttribute('class', 'ulabel');
      ul.setAttribute('fill', G.ink);
      ul.setAttribute('font-size', U.labelSize);
      ug.appendChild(ul);

      svg.appendChild(ug);
      this.unitGroup = ug;

      /* The subtraction worked on the board. Five separate nodes so each
         part can be revealed on its own, inside one group so the finished
         sum can be lifted as a single object rather than five characters
         moving independently.

         The sweep is a second line laid over the segment and drawn end to
         end; the real line is never touched, so nothing here can disturb
         what is already on the board. */
      const eg = document.createElementNS(NS, 'g');
      eg.setAttribute('class', 'xeq');
      this.xParts = [0, 1, 2, 3, 4].map(function () {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'xeq-p');
        t.setAttribute('font-size', G.xeq.size);
        eg.appendChild(t);
        return t;
      });
      const fly = document.createElementNS(NS, 'text');
      fly.setAttribute('class', 'xfly');
      const word = document.createElementNS(NS, 'text');
      word.setAttribute('class', 'xword');
      word.setAttribute('font-size', G.unitBox.labelSize);
      const sweep = document.createElementNS(NS, 'line');
      sweep.setAttribute('class', 'xsweep');
      svg.appendChild(sweep); svg.appendChild(eg); svg.appendChild(fly); svg.appendChild(word);
      this.xGroup = eg; this.xFly = fly; this.xSweep = sweep; this.xWord = word;

      /* The working, written on the paper. One text per line, each one
         a run of tspans — one per part of the line — so a part is a
         node the board can point at, fly a number into, and light. The
         radical's overbar is a line of its own, drawn over the span the
         radicand actually measures rather than over a guess at it. */
      const wg = document.createElementNS(NS, 'g');
      wg.setAttribute('class', 'work');
      /* Something to write it on. Five lines of algebra straight onto
         the ruling is five lines with grid lines through them; the
         plate is the paper's own cream with a soft edge, quiet enough
         to be a surface rather than a second panel competing with the
         drawing beside it. First into the group, so it is behind every
         line of the working. */
      const wp = document.createElementNS(NS, 'rect');
      wp.setAttribute('class', 'workplate');
      wg.appendChild(wp);
      this.workPlate = wp;
      this.workLines = [0, 1, 2, 3, 4, 5].map(function () {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'workline');
        const bar = document.createElementNS(NS, 'line');
        bar.setAttribute('class', 'workbar');
        wg.appendChild(t); wg.appendChild(bar);
        return { t: t, bar: bar, spans: [] };
      });
      svg.appendChild(wg);
      this.workGroup = wg;

      /* The square in the corner of a right angle, shown only once the
         triangle has been named. */
      const ra = document.createElementNS(NS, 'polyline');
      ra.setAttribute('class', 'rightangle');
      ra.setAttribute('fill', 'none');
      ra.setAttribute('stroke', G.leg.color);
      svg.appendChild(ra);
      this.rightMark = ra;

      this.unitBand = ub;
      this.unitLabel = ul;

      /* The guided count: one square per unit, each with its own number
         under it. Built as a pool at the widest span any screen asks
         about, and seated per count — a node per unit made and thrown
         away on every miss would flicker. */
      const UC = G.unitBox.count;
      this.countCells = [];
      for (let u = 0; u < UC.slots; u++) {
        const cg = document.createElementNS(NS, 'g');
        cg.setAttribute('class', 'ucell');
        const cr = document.createElementNS(NS, 'rect');
        cr.setAttribute('class', 'ucell-box');
        cr.setAttribute('fill', U.band.fill);
        cr.setAttribute('stroke', U.band.edge);
        cr.setAttribute('stroke-width', U.band.edgeW);
        cr.setAttribute('rx', 6);
        const ct = document.createElementNS(NS, 'text');
        ct.setAttribute('class', 'ucell-n');
        ct.setAttribute('fill', G.ink);
        ct.setAttribute('font-size', UC.numSize);
        cg.appendChild(cr); cg.appendChild(ct);
        ug.appendChild(cg);
        this.countCells.push({ g: cg, box: cr, num: ct });
      }

      const SG = G.segment;

      /* Pairs the child has already finished with, brought back on a
         later screen beside the one that screen is about.

         Each slot is the segment's own furniture — a line, two points,
         two labels, two letters and a length — carrying the segment's
         own classes, so an example is styled by the very rules that
         styled it the first time and cannot drift from it. No dashed
         guide: an example is only ever shown finished. Built before the
         segment group, which leaves the pair a screen is actually about
         on top of anything recalled beside it. */
      const EX = G.example;
      this.exSlots = [];
      for (let e = 0; e < (EX && EX.slots || 0); e++) {
        const exg = document.createElementNS(NS, 'g');
        exg.setAttribute('class', 'example');
        const exl = document.createElementNS(NS, 'line');
        exl.setAttribute('class', 'segline');
        exl.setAttribute('stroke', SG.lineColor);
        exl.setAttribute('stroke-width', SG.lineWidth);
        exl.setAttribute('stroke-linecap', 'round');
        exg.appendChild(exl);
        const exParts = { a: {}, b: {} };
        ['a', 'b'].forEach(function (key) {
          const c = document.createElementNS(NS, 'circle');
          c.setAttribute('class', 'segdot');
          c.setAttribute('r', SG.dotR);
          c.setAttribute('fill', SG.dotFill);
          c.setAttribute('stroke', SG.dotStroke);
          c.setAttribute('stroke-width', SG.dotStrokeW);
          const co = document.createElementNS(NS, 'text');
          co.setAttribute('class', 'segcoord');
          co.setAttribute('fill', G.ink);
          co.setAttribute('font-size', SG.coordSize);
          const nm = document.createElementNS(NS, 'text');
          nm.setAttribute('class', 'segname');
          nm.setAttribute('fill', G.ink);
          nm.setAttribute('font-size', SG.nameSize);
          exg.appendChild(c); exg.appendChild(co); exg.appendChild(nm);
          exParts[key] = { dot: c, coord: co, name: nm };
        });
        const exr = document.createElementNS(NS, 'text');
        exr.setAttribute('class', 'segres');
        exr.setAttribute('fill', G.ink);
        exr.setAttribute('font-size', 34);
        /* In a group of its own so a column's length can be turned
           along its line — `segres.pop` is a filled animation and
           would beat a transform on the text itself. */
        const ext = document.createElementNS(NS, 'g');
        ext.appendChild(exr);
        exg.appendChild(ext);
        svg.appendChild(exg);
        this.exSlots.push({ g: exg, segParts: exParts, segLine: exl,
                            segRes: exr, segResTurn: ext });
      }

      /* A plotted segment: two named points joined by a line. Built
         here, positioned and revealed by showSegment(). */
      const seg = document.createElementNS(NS, 'g');
      seg.setAttribute('class', 'seg');
      /* A dashed guide along the segment, shown before the question so
         the span being asked about is visible without being answered.
         It goes in first so the solid line and the player's measuring
         line both draw over it. Wrapped in a group because the reveal
         scales it out from A, and scaling the line itself would drag
         its own transform-origin with it. */
      const dashG = document.createElementNS(NS, 'g');
      dashG.setAttribute('class', 'segdash-g');
      const segDash = document.createElementNS(NS, 'line');
      segDash.setAttribute('class', 'segdash');
      segDash.setAttribute('stroke', SG.dashColor);
      segDash.setAttribute('stroke-width', SG.dashWidth);
      segDash.setAttribute('stroke-linecap', 'round');
      segDash.setAttribute('stroke-dasharray', SG.dashArray);
      segDash.setAttribute('vector-effect', 'non-scaling-stroke');
      dashG.appendChild(segDash);
      seg.appendChild(dashG);
      this.segDash = segDash;
      this.segDashG = dashG;

      const segLine = document.createElementNS(NS, 'line');
      segLine.setAttribute('class', 'segline');
      segLine.setAttribute('stroke', SG.lineColor);
      segLine.setAttribute('stroke-width', SG.lineWidth);
      segLine.setAttribute('stroke-linecap', 'round');
      segLine.id = 'lineAB';          // the line between the two points
      /* Its own widths, for the highlight to grow between. Read off the
         line rather than restated in CSS, because a leg and the segment
         are not drawn at the same weight. */
      segLine.style.setProperty('--base-stroke-width', SG.lineWidth + 'px');
      segLine.style.setProperty('--pulse-stroke-width', (SG.lineWidth + 4) + 'px');
      seg.appendChild(segLine);
      this.segLine = segLine;
      this.commitDraw(segLine);

      /* The player's own line, laid down with the slider. It sits in
         the same group as the segment so it is cleared alongside it. */
      const ml = document.createElementNS(NS, 'line');
      ml.setAttribute('class', 'measline');
      ml.setAttribute('stroke', G.measure.color);
      ml.setAttribute('stroke-width', G.measure.width);
      ml.setAttribute('stroke-linecap', 'round');
      const mc = document.createElementNS(NS, 'circle');
      mc.setAttribute('class', 'mescap');
      mc.setAttribute('r', G.measure.capR);
      mc.setAttribute('fill', G.measure.color);
      seg.appendChild(ml); seg.appendChild(mc);
      this.measLine = ml; this.measCap = mc;
      this.segParts = { a: {}, b: {} };
      ['a', 'b'].forEach(function (key) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('class', 'segdot');
        c.setAttribute('r', SG.dotR);
        c.setAttribute('fill', SG.dotFill);
        c.setAttribute('stroke', SG.dotStroke);
        c.setAttribute('stroke-width', SG.dotStrokeW);
        const co = document.createElementNS(NS, 'text');
        co.setAttribute('class', 'segcoord');
        co.setAttribute('fill', G.ink);
        co.setAttribute('font-size', SG.coordSize);
        const nm = document.createElementNS(NS, 'text');
        nm.setAttribute('class', 'segname');
        nm.setAttribute('fill', G.ink);
        nm.setAttribute('font-size', SG.nameSize);
        seg.appendChild(c); seg.appendChild(co); seg.appendChild(nm);
        self.segParts[key] = { dot: c, coord: co, name: nm };
      });
      /* The answer written on the segment, on its own plate. */
      const rt = document.createElementNS(NS, 'text');
      rt.setAttribute('class', 'segres');
      rt.setAttribute('fill', G.ink);
      rt.setAttribute('font-size', 34);
      const rtt = document.createElementNS(NS, 'g');
      rtt.appendChild(rt);
      seg.appendChild(rtt);
      this.segRes = rt;
      this.segResTurn = rtt;

      svg.appendChild(seg);
      this.segGroup = seg;

      /* The marker left on a point once it has been found, plus its
         written coordinates. Built here, placed by solve(). */
      const F = G.found;
      const fg = document.createElementNS(NS, 'g');
      fg.setAttribute('class', 'found');
      const fc = document.createElementNS(NS, 'circle');
      fc.setAttribute('r', F.r);
      fc.setAttribute('fill', F.fill);
      fc.setAttribute('stroke', F.stroke);
      fc.setAttribute('stroke-width', F.strokeWidth);
      fc.setAttribute('class', 'fdot');
      const ft = document.createElementNS(NS, 'text');
      ft.setAttribute('fill', G.ink);
      ft.setAttribute('font-size', F.labelSize);
      ft.setAttribute('class', 'flabel');
      fg.appendChild(fc);
      fg.appendChild(ft);
      svg.appendChild(fg);
      this.foundGroup = fg;
      this.foundDot = fc;
      this.foundLabel = ft;

      /* They look tappable, so they take the tap — and swallow it, or
         it would bubble to the scene and skip the screen. */
      g.addEventListener('click', function (e) {
        const c = e.target;
        if (!c || !c.classList || !c.classList.contains('gdot')) return;
        e.stopPropagation();
        Game.tapPoint(Number(c.dataset.gx), Number(c.dataset.gy), c);
      });

      this.dotGroup = g;
      // last of all, so the pulse overlay sits above every other part
      svg.appendChild(pulseG);
    },

    /* The board is seated in different boxes on different screens, so
       its placement is applied rather than fixed. */
    box: null,
    /* The panel fills its briefed box exactly rather than being
       letterboxed inside it. The art's own ratio differs by under half
       a percent, so nothing reads as stretched, and the SVG overlay
       maps through the same viewBox — axes and numbers stay locked to
       the drawn gridlines either way. */
    /* How much of the board is inside the window, in the board's own
       units. Nothing set means all of it, which is what every screen
       outside the triangle sees. */
    viewRect: function () {
      const G = C.GRID;
      return this.view || { x: 0, y: 0, w: G.w, h: G.h };
    },

    /* The region a named view asks for, worked out from what is on the
       board rather than typed.

       Framed on what is DRAWN AND WRITTEN, not on the coordinates alone:
       a label sits out beyond the point it names, and air measured from
       the point would crowd the label against the edge. The origin is
       taken in too, so both axes stay in shot — as lines, since the
       numbers are not shown at this range. */
    viewFor: function (name) {
      if (!name) return null;
      const G = C.GRID, Z = G.zoom, self = this, SG = G.segment, LG = G.leg;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };

      let x1 = px(0), x2 = px(0), y1 = py(0), y2 = py(0);   // the origin, always
      const span = function (cx, cy, w, h) {
        x1 = Math.min(x1, cx - w / 2); x2 = Math.max(x2, cx + w / 2);
        y1 = Math.min(y1, cy - h / 2); y2 = Math.max(y2, cy + h / 2);
      };
      const text = function (n, size) {
        if (!n || !n.textContent) return;
        if (n.style && n.style.display === 'none') return;
        const cx = parseFloat(n.getAttribute('x')), cy = parseFloat(n.getAttribute('y'));
        if (!isFinite(cx) || !isFinite(cy)) return;
        span(cx, cy, self.textW(n.textContent, size), size);
      };
      const dot = function (n, r) {
        if (!n || (n.style && n.style.display === 'none')) return;
        const cx = parseFloat(n.getAttribute('cx')), cy = parseFloat(n.getAttribute('cy'));
        if (!isFinite(cx) || !isFinite(cy)) return;
        span(cx, cy, r * 2, r * 2);
      };

      const sp = this.lastPlotted;
      if (sp && sp.a) [sp.a, sp.b].forEach(function (p) { span(px(p.x), py(p.y), SG.dotR * 2, SG.dotR * 2); });
      if (this.segParts) ['a', 'b'].forEach(function (k) {
        text(self.segParts[k].coord, SG.coordSize);
        text(self.segParts[k].name, SG.nameSize);
      });
      (this.legPlaced || []).forEach(function (l, i) {
        if (!l || !l.from) return;
        span(px(l.from.x), py(l.from.y), SG.dotR * 2, SG.dotR * 2);
        span(px(l.to.x), py(l.to.y), SG.dotR * 2, SG.dotR * 2);
        const L = self.legSlots && self.legSlots[i];
        if (!L) return;
        dot(L.dot, LG.dotR);
        text(L.coord, SG.coordSize);
        text(L.name, SG.nameSize);
        text(L.len, LG.lenSize);
      });

      const mx = Z.margin * G.stepX, my = Z.margin * G.stepY;
      const r = { x: x1 - mx, y: y1 - my, w: (x2 - x1) + 2 * mx, h: (y2 - y1) + 2 * my };
      /* Kept, so the working can be laid out beside the very thing the
         camera framed rather than beside a second guess at it. */
      this.drawnBox = { x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y + r.h };
      /* A view that has to hold a working as well as a drawing asks for
         the drawing and then for as much again, out to the side the
         drawing is not on — so the paper in shot is the triangle in one
         half and clear board in the other. Which side is worked out
         from where the drawing sits against the board's own middle,
         never typed: a pair right of centre writes to its left. */
      if (name === 'working') {
        /* How much board the writing needs, worked out rather than
           guessed at. The working is set to a fixed size ON THE STAGE —
           like every label here, it shrinks in board units as the
           camera comes in — so its width in pixels does not change with
           the view, and the column that holds it has to be that many
           pixels wide however far the board pushes in.
             column_px = c · panel / (D + c)   must be at least L
           gives   c = L·D / (panel − L),
           which is the widest push this drawing and this working can
           both fit in. Ask for more and the lines run into the
           triangle; ask for less and the board barely moves. */
        const W = G.work, pw = G.centre.w, D = r.w;
        const L = (this.workWidest || 0) + 2 * W.pad * G.stepX * (pw / G.w);
        const room = (L > 0 && L < pw * 0.92) ? (L * D) / (pw - L)
                                              : D * (W.room || 1);
        this.workSide = ((r.x + r.w / 2) >= G.w / 2) ? -1 : 1;
        if (this.workSide < 0) r.x -= room;
        r.w += room;
      } else this.workSide = 0;
      /* Grown to the board's own shape about its middle, so a square on
         the grid is still square and the drawing sits in the middle of
         the window rather than off one side. */
      const A = G.w / G.h;
      if (r.w / r.h < A) { const w = r.h * A; r.x -= (w - r.w) / 2; r.w = w; }
      else               { const h = r.w / A; r.y -= (h - r.h) / 2; r.h = h; }
      // never past the paper's own edge, and never wider than the board
      if (r.w >= G.w || r.h >= G.h) return null;
      r.x = Math.max(0, Math.min(G.w - r.w, r.x));
      r.y = Math.max(0, Math.min(G.h - r.h, r.y));
      return r;
    },

    /* Pushes the board in to a view, or back out to all of it. The board
       is re-placed on every frame rather than transformed: the ruling,
       the axes and everything plotted are all drawn from the view, so
       they are exactly as sharp pushed in as they are pulled out.

       Token-cancelled, like the text tweens — a screen change or a skip
       must not leave the board stopped halfway. */
    viewTo: function (rect, ms) {
      const self = this, G = C.GRID;
      const to = rect || { x: 0, y: 0, w: G.w, h: G.h };
      const from = this.viewRect();
      this.viewSeq = (this.viewSeq || 0) + 1;
      const token = this.viewSeq;
      const near = function (a, b) { return Math.abs(a - b) < 0.5; };
      /* Pushed in, the board is about one drawing rather than about the
         scale it sits on, so the axis numbers go — the axes stay, as
         lines. Set from where the push is HEADING, not from where it
         is, so the numbers leave as the board comes in and come back as
         it goes out, rather than either waiting for the other. */
      el.gridPanel.classList.toggle('framed', !!rect);
      const same = near(from.x, to.x) && near(from.y, to.y) &&
                   near(from.w, to.w) && near(from.h, to.h);
      /* Already there, and on the same footing — pushed in asking to be
         pushed in, or out asking to be out. Keep the view it has rather
         than pinning the one just asked for: they are the same view,
         and only one of them is the one everything on the board was
         last placed against. */
      if (same && (!rect === !this.view)) return;
      if (!this.box || !ms || same) {
        this.view = rect;
        if (this.box) { this.place(this.box); this.relabel(); }
        return;
      }
      const ease = function (t) {                 // cubic-bezier(.22,.61,.36,1)
        let lo = 0, hi = 1, u = t;
        for (let i = 0; i < 14; i++) {
          u = (lo + hi) / 2;
          const x = 3 * (1-u) * (1-u) * u * 0.22 + 3 * (1-u) * u * u * 0.36 + u*u*u;
          if (x < t) lo = u; else hi = u;
        }
        return 3 * (1-u) * (1-u) * u * 0.61 + 3 * (1-u) * u * u + u*u*u;
      };
      const start = performance.now();
      const step = function () {
        if (token !== self.viewSeq) return;
        const p = Math.min(1, (performance.now() - start) / ms), e = ease(p);
        self.view = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
                      w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e };
        self.place(self.box);
        self.relabel();
        if (p < 1) requestAnimationFrame(step);
        else { self.view = rect; self.place(self.box); self.relabel(); }  // pinned
      };
      requestAnimationFrame(step);
    },

    /* Everything written on the board, put back where it belongs for
       the camera it is under now. The type is set smaller as the board
       pushes in, so every offset worked out from its size has to be
       worked out again — otherwise a pair lettered at full size floats
       half a cell off its own points the moment the board comes in.

       Only the placing is redone: nothing is cleared, nothing pops
       again, and a label whose words have not changed keeps the very
       nodes it had, so a highlight lit on one of its halves survives. */
    relabel: function () {
      const self = this;
      if (this.lastPlotted) this.placeSegment(this.lastPlotted);
      (this.legPlaced || []).forEach(function (s, i) {
        if (s && self.legSlots && self.legSlots[i]) self.placeLeg(i, s);
      });
      if (this.legPlaced && this.legPlaced.length) this.clearMarksOfLines();
    },

    place: function (box) {
      const G = C.GRID, P = G.paper;
      this.box = box;
      el.gridPanel.style.left = box.x + 'px';
      el.gridPanel.style.top = box.y + 'px';
      el.gridPanel.style.width = box.w + 'px';
      el.gridPanel.style.height = box.h + 'px';

      /* The board is stretched to its box rather than fitted, so the
         two axes scale by different amounts. Anything round — the
         frame, the corners — follows the wider one. */
      /* Two scales, not one. The panel's own says how big the window is
         on the stage, and the frame round it follows that — it must not
         thicken when the board pushes in. The view's says how much board
         is inside the window, and everything drawn follows that. With no
         view set the two are the same number, which is what every screen
         but the triangle's sees. */
      const V = this.viewRect();
      const fs = box.w / G.w;
      const sx = box.w / V.w, sy = box.h / V.h;
      const st = el.gridPanel.style;
      st.setProperty('--paper-inner', P.inner);
      st.setProperty('--paper-frame', P.frame);
      st.setProperty('--paper-edge',  P.edge);
      st.setProperty('--paper-hi',    P.highlight);
      st.setProperty('--radius', P.radius * fs + 'px');
      st.setProperty('--edgeW',  P.edgeW  * fs + 'px');
      st.setProperty('--frameW', P.frameW * fs + 'px');
      st.setProperty('--hiW',   (P.frameW + P.hiW) * fs + 'px');

      /* The grid is pinned to the origin, not to the panel: a line
         every stepX across and every stepY down, so whatever size the
         board is drawn at, a line still falls on every whole
         coordinate and the numbers sit on it. */
      const cw = G.stepX * sx, ch = G.stepY * sy, lw = P.lineW;
      // measured from the corner of the view, not the corner of the board
      const left = (G.originX + P.gxFrom * G.stepX - V.x) * sx;
      const top  = (G.originY - P.gyTo   * G.stepY - V.y) * sy;
      const gs = el.gridImg.style;
      gs.left   = (left - lw / 2) + 'px';
      gs.top    = (top  - lw / 2) + 'px';
      gs.width  = ((P.gxTo - P.gxFrom) * cw + lw) + 'px';
      gs.height = ((P.gyTo - P.gyFrom) * ch + lw) + 'px';
      gs.setProperty('--cw', cw + 'px');
      gs.setProperty('--ch', ch + 'px');
      gs.setProperty('--lw', lw + 'px');
      gs.setProperty('--gridline', P.line);

      /* Keep the lines off the frame, if they reach it at all. Clipped
         rather than shrunk: the gradient's phase is measured from this
         element's own origin, so moving or resizing it slides every
         line off its coordinate, while a clip leaves them exactly
         where they fall.

         The ruling is now cut to whole cells inside the cream, so
         normally there is nothing to trim — and the clip has to go
         away entirely when that is so. Left on, its rounded corner was
         still being applied to the ruling's OWN corners: a 26px radius
         on an 83px cell, which took the corner out of the outermost
         square and left the two boundary lines stopping short of each
         other instead of meeting. */
      const inset = (P.frameW + P.hiW) * fs;
      const gw = (P.gxTo - P.gxFrom) * cw + lw, gh = (P.gyTo - P.gyFrom) * ch + lw;
      const cl = Math.max(0, inset - (left - lw / 2));
      const ct = Math.max(0, inset - (top  - lw / 2));
      const cr = Math.max(0, (left - lw / 2 + gw) - (box.w - inset));
      const cb = Math.max(0, (top  - lw / 2 + gh) - (box.h - inset));
      gs.clipPath = (cl || ct || cr || cb)
        ? 'inset(' + ct + 'px ' + cr + 'px ' + cb + 'px ' + cl +
          'px round ' + Math.max(0, P.radius * fs - inset) + 'px)'
        : 'none';

      el.gridAxes.setAttribute('viewBox', V.x + ' ' + V.y + ' ' + V.w + ' ' + V.h);
      /* Pushed in, the board runs on past the window — the parts of it
         outside the view are still drawn, just off the side of the
         panel, and #gridAxes is overflow:visible, so they would paint
         over the frame and out across the field. Clipped to the cream,
         exactly where the ruling is clipped, they are simply out of
         shot. Left alone when there is no view, so nothing that has
         always been drawn at the very edge is shaved. */
      /* Pushed in, everything inside the viewBox is magnified — the type
         with it, which left the coordinates shouting at nearly twice the
         size they were drawn at. So the type is SET smaller in the same
         proportion rather than scaled: a transform on an SVG <text> is
         the one thing this board will not do (see the axis numbers), and
         a size is a size wherever the camera is. */
      const tk = Math.min(1, V.w / G.w);
      const gs2 = el.gridAxes.style, SGt = G.segment, LGt = G.leg;
      gs2.setProperty('--coordFs', (SGt.coordSize * tk) + 'px');
      gs2.setProperty('--nameFs',  (SGt.nameSize  * tk) + 'px');
      gs2.setProperty('--lenFs',   (LGt.lenSize   * tk) + 'px');
      gs2.setProperty('--resFs',   (34 * tk) + 'px');
      gs2.setProperty('--workFs',  (G.work.size * tk) + 'px');

      el.gridAxes.style.clipPath = this.view
        ? 'inset(' + inset + 'px round ' + Math.max(0, P.radius * fs - inset) + 'px)'
        : 'none';
      el.gridAxes.setAttribute('preserveAspectRatio', 'none');
      el.gridAxes.style.width = box.w + 'px';
      el.gridAxes.style.height = box.h + 'px';
      /* Anything drawn OVER the board rather than in it has to follow
         the box the same way the ruling does. The board does not know
         what that is; it only says that it moved. */
      if (this.onPlaced) this.onPlaced();
    },

    /* How big the type on the board actually is, against what the
       config says. Pushed in, the whole viewBox is magnified and the
       type is SET smaller in the same proportion so it stays the size
       it was drawn at — which means a label measured at its config
       size is measured at nearly twice the size it will be, and every
       offset worked out from that measure puts it half a cell from the
       point it names. Anything typographic — the ink of a label, the
       air between it and its dot — is worked out at this size. The
       drawing itself is not: a point is part of the picture and is
       meant to come closer when the board does. */
    typeScale: function () {
      const G = C.GRID, V = this.viewRect ? this.viewRect() : null;
      return V ? Math.min(1, V.w / G.w) : 1;
    },

    /* What one cell measures on the stage. The board is stretched to
       its box rather than fitted, so the two axes come out different —
       which is why anything sized in cells has to ask for both. */
    cellSize: function () {
      const G = C.GRID, b = this.box || G.box;
      return { w: G.stepX * (b.w / G.w), h: G.stepY * (b.h / G.h) };
    },

    setDots: function (on) {
      if (!this.dotGroup) return;
      this.dotGroup.classList.toggle('on', !!on);
      /* Marked points are NOT cleared here any more: the second locate
         screen turns the highlighters back on, and doing it here rubbed
         out the point they had just found. They go when the board is
         rebuilt or a question plots its own segment instead. */
    },

    /* Where a point on the BOARD — in the board's own drawing units,
       which is what every label's x/y is in — sits on the stage. The
       view is part of it: pushed in, the same board point is somewhere
       else on the stage, and a flight that ignored that would leave
       from beside the label rather than out of it. */
    boardToStage: function (bx, by) {
      const G = C.GRID, b = this.box || G.box, V = this.viewRect();
      return { x: b.x + (bx - V.x) * (b.w / V.w),
               y: b.y + (by - V.y) * (b.h / V.h),
               k: b.w / V.w };
    },

    /* Where a grid point sits in stage coordinates, for effects that
       live outside the SVG. */
    stagePos: function (gx, gy) {
      const G = C.GRID, b = this.box || G.box;
      return {
        x: b.x + (G.originX + gx * G.stepX) * (b.w / G.w),
        y: b.y + (G.originY - gy * G.stepY) * (b.h / G.h)
      };
    },

    /* Writes a finished draw down, so nothing can take it away again.

       `drawOut` ends at stroke-dashoffset 0 and holds it there with
       `forwards` — the animation's FILL is the only thing keeping the
       line at full length. `animation` is one property, so anything
       that puts its own on the element replaces that fill and the line
       springs back to the offset underneath, which is nothing at all.
       That is what emptied AC on the Pythagoras beats: the working
       lights the side it names, the highlight's animation displaced the
       draw's, and the side the whole screen is about went off the board
       under its own written length.

       Committing the offset the moment the draw lands ends the argument
       for good — a later animation may do as it likes, the line is
       drawn because its own style says so, not because an animation is
       still holding it. */
    commitDraw: function (node) {
      if (!node || node.__committed) return;
      node.__committed = true;
      node.addEventListener('animationend', function (e) {
        if (e.animationName === 'drawOut') node.style.strokeDashoffset = 0;
      });
    },

    /* Where a thing on the board sits on the STAGE — measured off what
       is painted rather than worked out from attributes, so a length
       that has been turned on its side is found where it is read and
       the camera's push-in is already in it. */
    spotOf: function (node) {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      const s = el.stage.getBoundingClientRect();
      const k = C.STAGE_W / (s.width || C.STAGE_W);
      return { x: (r.left + r.width / 2 - s.left) * k,
               y: (r.top + r.height / 2 - s.top) * k };
    },

    /* The number they have just found, wherever the board wrote it:
       against a leg, along the segment, or on the board's own label.
       Null if nothing was written — a screen that counts without
       writing a total has nothing for this to point at. */
    totalSpot: function (leg) {
      const shown = function (n) {
        if (!n || !n.textContent) return null;
        if (n.style.display === 'none') return null;
        return (+getComputedStyle(n).opacity > .05) ? n : null;
      };
      const L = (leg != null && this.legSlots) ? this.legSlots[leg] : null;
      return this.spotOf(shown(L && L.len) || shown(this.unitLabel) ||
                         shown(this.segRes));
    },

    /* Brings back pairs that were finished with screens ago, in the
       segment's own order — the two points, the line that joins them,
       their coordinates, then what the child measured. It runs under
       her line rather than before it, the way the worked subtraction
       does, so a recall never costs the screen a silent pause. */
    runExamples: function (list, later, done) {
      const self = this, EX = C.GRID.example;
      if (!list || !list.length || !this.exSlots || !this.exSlots.length) {
        if (done) done(); return;
      }
      let t = 0;
      list.forEach(function (spec, i) {
        const slot = self.exSlots[i];
        if (!slot) return;
        /* Placed by placeSegment itself, so the labels fall exactly
           where they fell on the screen this pair came from — beside a
           wide row's points, above and below a column's. */
        self.placeSegment(spec, slot);
        slot.g.classList.add('on');
        later(function () { slot.segParts.a.dot.classList.add('pop'); SFX.tick(0); }, t + EX.dotAMs);
        later(function () { slot.segParts.b.dot.classList.add('pop'); SFX.tick(2); }, t + EX.dotBMs);
        later(function () { slot.segLine.classList.add('draw'); SFX.draw(); }, t + EX.lineMs);
        ['a', 'b'].forEach(function (k, n) {
          later(function () {
            slot.segParts[k].coord.classList.add('pop'); SFX.tick(n + 3);
          }, t + EX.coordMs + n * EX.coordStep);
        });
        if (spec.result) later(function () {
          const R = spec.result;
          self.showSegResult(spec, R.text, R.dy, R.dx, slot);
          SFX.chime();
        }, t + EX.resultMs);
        t += EX.stagger;
      });
      later(function () { if (done) done(); }, t + EX.resultMs + 300);
    },

    clearExamples: function () {
      (this.exSlots || []).forEach(function (s) {
        s.g.classList.remove('on');
        s.segLine.classList.remove('draw', 'lit');
        s.segRes.classList.remove('pop');
        ['a', 'b'].forEach(function (k) {
          ['dot', 'coord', 'name'].forEach(function (n) {
            s.segParts[k][n].classList.remove('pop', 'set');
          });
        });
      });
    },

    /* Shades the face of the triangle the two legs and the segment
       close. Only when all three are actually on the board — a wash
       over two lines and a gap is not a shape. */
    showTriangle: function () {
      const G = C.GRID, sp = this.lastPlotted, L = this.legPlaced || [];
      if (!this.triFill || !sp || !sp.a || !L[0] || !L[1]) return;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const corner = L[0].to;
      this.triFill.setAttribute('points',
        [sp.a, corner, sp.b].map(function (p) { return px(p.x) + ',' + py(p.y); }).join(' '));
      this.triFill.classList.add('on');
    },

    /* Does what is drawn run over an axis?

       The axes are the paper and the drawing is the subject, and where
       they meet the paper gives way. A side crossing a 7px axis of the
       same colour family, at the same weight, leaves nothing in the
       picture saying which of the two is the shape.

       Every side counts — the pair's own line and both legs — because
       all of them are the drawing. A side crosses when its two ends sit
       on opposite sides of an axis, and a corner ON one counts as well:
       a point at x = 0 has the y-axis running straight through it. */
    crossesAxis: function () {
      const on = (g) => g && g.classList && g.classList.contains('on');
      const sides = [];
      if (this.lastPlotted && this.lastPlotted.a && on(this.segGroup)) {
        sides.push([this.lastPlotted.a, this.lastPlotted.b]);
      }
      (this.legPlaced || []).forEach(function (s, i) {
        const L = this.legSlots && this.legSlots[i];
        if (s && s.from && s.to && on(L && L.g)) sides.push([s.from, s.to]);
      }, this);
      return sides.some(function (s) {
        const a = s[0], b = s[1];
        return (a.x <= 0 && b.x >= 0) || (a.x >= 0 && b.x <= 0) ||
               (a.y <= 0 && b.y >= 0) || (a.y >= 0 && b.y <= 0);
      });
    },

    /* And the class that says so. Called wherever the drawing changes,
       not only on a screen change: a beat whose legs arrive after its
       line starts not crossing and ends crossing. */
    markCrossing: function () {
      if (!el.gridPanel) return;
      el.gridPanel.classList.toggle('crossed', this.shown && this.crossesAxis());
    },

    clearLegs: function () {
      this.rightAngle(false);
      if (this.triFill) this.triFill.classList.remove('on');
      this.legPlaced = [];
      this.labelFace = null;
      this.markCrossing();
      if (!this.legSlots) return;
      this.legSlots.forEach(function (L) {
        L.g.classList.remove('on');
        L.line.classList.remove('draw');
        if (L.dashG) L.dashG.classList.remove('draw');
        ['dot', 'coord', 'name', 'plate', 'len'].forEach(function (k) {
          L[k].classList.remove('pop', 'on', 'triangle-point');
        });
      });
    },

    /* Seats one leg. `spec.mark` puts a labelled corner at its far
       end; `spec.length` writes how long it is alongside it. */
    /* The row the x-axis owns: the line itself, and the numbers tucked
       under it, with a little air either side. A coordinate written
       into this band lands on one or the other, which is what happens
       to any point sitting one square above the axis. */
    /* How much room a string will actually take at a given size, used
       to decide where a label can go. getBBox would be exact but is
       only good once the text is laid out, and these decisions are made
       while placing it — so the same font is measured on a canvas
       instead, which needs nothing drawn.

       It used to be one character at 0.58 of the type size. That is
       fine for "-6" and half again too wide for "(-2,\u00A03)", where
       the brackets, the comma and the space are all narrow — and a
       label pushed off its own point by half of an over-wide measure
       floats a clear third of a cell away from the thing it names.
       Every coordinate written beside its point was doing that.

       Both metrics carry the halo the labels are painted with, so what
       is measured is what is seen. The estimate stays as the fallback
       for anywhere there is no canvas to measure on. */
    textMetrics: function (t, size) {
      const s = String(t), key = size + '\u0000' + s;
      const M = this._tm || (this._tm = {});
      if (M[key]) return M[key];
      let ctx = this._tmCtx;
      if (ctx === undefined) {
        const cv = (typeof document !== 'undefined' && document.createElement)
                 ? document.createElement('canvas') : null;
        ctx = this._tmCtx = (cv && cv.getContext) ? cv.getContext('2d') : null;
      }
      /* The halo is stroked outside the glyphs, so it widens and heightens
         what is painted by half its width on every side. */
      const halo = C.GRID.segment.haloW || 0;
      let w = 0, up = 0, down = 0;
      if (ctx) {
        ctx.font = '600 ' + size + 'px Nunito, system-ui, sans-serif';
        const m = ctx.measureText(s);
        w = m.width;
        /* The canvas measures from the alphabetic baseline; the labels
           are set `dominant-baseline: middle`, whose anchor sits half
           an x-height above it. So the two are squared up before the
           ink is reported, or a word with no descenders — "5 units" —
           comes out claiming to be centred on something it sits above. */
        const half = ctx.measureText('x').actualBoundingBoxAscent / 2;
        up = m.actualBoundingBoxAscent - half;
        down = m.actualBoundingBoxDescent + half;
      }
      if (!w) w = s.length * size * 0.58;
      /* Older engines report no ink box, and so does the test harness.
         Bracketed coordinates are the tallest thing written on the
         board, and this is about their extent either side. */
      if (!(up > 0)) { up = size * 0.37; down = size * 0.31; }
      const r = { w: w + halo, h: up + down + halo, up: up + halo / 2, down: down + halo / 2 };
      M[key] = r;
      return r;
    },

    textW: function (t, size) { return this.textMetrics(t, size).w; },
    textH: function (t, size) { return this.textMetrics(t, size).h; },

    /* Measured before the webfont arrives, every label is sized to the
       fallback's metrics and stays that way. Called once the real face
       is in. */
    forgetTextMetrics: function () { this._tm = null; },

    /* The column the y-axis owns: the line, and its numbers down the
       left of it. */
    onYAxisCol: function (cx, w) {
      const G = C.GRID, pad = 5;
      const left = G.originX - G.yLabelGap - G.labelSize * 0.30 -
                   this.textW('-6', G.labelSize) / 2 - pad;
      const right = G.originX + G.axisWidth / 2 + pad;
      return cx + w / 2 > left && cx - w / 2 < right;
    },

    /* Slides a label sideways until the drawn line is no longer running
       through it, whichever way is the shorter move.

       A label sits over its own point, and a segment leaving that point
       at a slope goes up through the very space the label is written
       in — which is why "(2, 1)" had the hypotenuse through its last
       bracket on every screen that draws that triangle. Only a label
       the line actually cuts is moved; one already clear is returned
       untouched, so nothing that reads properly today shifts. */
    clearOfLine: function (cx, cy, w, h, x1, y1, x2, y2, prefer) {
      const air = 9;
      const top = cy - h / 2, bot = cy + h / 2;
      /* Where the line is over the rows of the page this label covers.
         Outside them it cannot be in the way, whatever its x. */
      const yA = Math.max(top, Math.min(y1, y2));
      const yB = Math.min(bot, Math.max(y1, y2));
      if (yA > yB) return cx;
      let lo, hi;
      if (y1 === y2) {                       // level: its whole span is in those rows
        lo = Math.min(x1, x2); hi = Math.max(x1, x2);
      } else {
        const at = function (y) { return x1 + (x2 - x1) * ((y - y1) / (y2 - y1)); };
        const p = at(yA), q = at(yB);
        lo = Math.max(Math.min(p, q), Math.min(x1, x2));
        hi = Math.min(Math.max(p, q), Math.max(x1, x2));
      }
      if (cx + w / 2 <= lo || cx - w / 2 >= hi) return cx;      // already clear of it
      const left = lo - air - w / 2, right = hi + air + w / 2;
      /* Which side, where the caller cares: a label pushed off a line
         and then pulled back by the frame has not been moved at all,
         so it needs to be able to ask for the other one. */
      if (prefer < 0) return left;
      if (prefer > 0) return right;
      return (cx - left) <= (right - cx) ? left : right;
    },

    /* Slides a label sideways until it is off the y-axis and clear of
       the numbers beside it, whichever way is the shorter move. */
    clearOfYAxis: function (cx, w) {
      if (!this.onYAxisCol(cx, w)) return cx;
      const G = C.GRID, pad = 5, air = 6;
      const left = G.originX - G.yLabelGap - G.labelSize * 0.30 -
                   this.textW('-6', G.labelSize) / 2 - pad - w / 2 - air;
      const right = G.originX + G.axisWidth / 2 + pad + w / 2 + air;
      return (cx - left) < (right - cx) ? left : right;
    },

    /* Keeps a label on the cream. Every offset that places one is
       measured from its own point, so the outermost column's labels
       walk off the right-hand frame as soon as the cells grow — which
       is exactly what happened when a cell went from 59px to 78px.
       Clamping here means no cell size can push one off, whatever
       offset asked for it. */
    /* What is in shot, in board units, with the frame's own thickness
       taken off every side.

       The window is the VIEW, not the paper. With no view set the two
       are the same thing and this is what it always was; pushed in they
       are not, and a label held off the paper's edge is held off a line
       the child cannot see while the edge they CAN see cuts through it.
       The frame is a fixed thickness on the stage, so the further in
       the board comes the thinner it is in board units. */
    window: function (air) {
      const G = C.GRID, P = G.paper, V = this.viewRect();
      const k = V.w / G.w;
      const edge = (P.frameW + P.hiW + air) * k;
      return { lo: V.x + edge, hi: V.x + V.w - edge,
               top: V.y + edge, bot: V.y + V.h - edge };
    },

    clampX: function (cx, w) {
      const W = this.window(8);
      return Math.max(W.lo + w / 2, Math.min(W.hi - w / 2, cx));
    },
    /* Coordinate labels get a tighter margin than everything else.
       clampX keeps 8 units of air inside the frame, which is right for
       text that is free to sit anywhere — but a coordinate is not: it
       belongs over its own point, and the widest of them at x = 6 needs
       6 of those 8 to stay centred there. Nudging it in instead left
       the two labels of one pair sitting differently against their own
       dots, and moved the label when a located point was taken over by
       a segment. Every one of them clears the frame at this margin. */
    /* ============ one way of labelling =========================
       Everything the board writes is a box that has to go somewhere
       near the thing it names and on top of nothing else. Three pieces
       do that for all of it: what is on the board already
       (`obstacles`), where a box may go (`placeBlock`), and a point's
       letter-over-coordinate stack as one box (`placePointLabel`).
       ============================================================ */

    /* Everything already inked, in board units. Rebuilt for each pass
       and grown as each label is placed, so a label never lands on one
       placed before it — and so the same screen always comes out the
       same, because the order they are placed in is fixed. */
    startLabelPass: function () {
      const G = C.GRID, SG = G.segment, self = this;
      const list = [];
      const push = function (l, t, r, b, what) {
        if (r > l && b > t) list.push({ l: l, t: t, r: r, b: b, what: what });
      };
      /* The two runs of axis numbers — taken from the numbers
         THEMSELVES rather than from a band drawn where they ought to
         be. The band started exactly at the axis and the glyphs do
         not: they are centred a little below it and reach above its
         line, so a label could sit on the top of a 5 while clearing
         the band that was supposed to describe it. */
      const nh = G.labelSize;
      let anyNum = false;
      (this.labels || []).forEach(function (n) {
        if (!n || !n.textContent) return;
        const x = parseFloat(n.getAttribute('x')), y = parseFloat(n.getAttribute('y'));
        if (!isFinite(x) || !isFinite(y)) return;
        const w = self.textW(n.textContent, nh);
        push(x - w / 2 - 2, y - nh * 0.62, x + w / 2 + 2, y + nh * 0.62, 'a number');
        anyNum = true;
      });
      if (!anyNum) {
        /* Before they exist, the bands they will occupy. */
        push(0, G.originY, G.w, G.originY + G.labelGap + nh, 'x numbers');
        push(G.originX - G.yLabelGap - nh, 0, G.originX, G.h, 'y numbers');
      }
      /* And the two letters that name the axes — which nothing has ever
         kept clear of, and which is what `(6, 1)` was written into. */
      (this.axisNames || []).forEach(function (n) {
        if (!n) return;
        const x = parseFloat(n.getAttribute('x')), y = parseFloat(n.getAttribute('y'));
        const w = self.textW(n.textContent, G.axisName.size);
        push(x - w / 2, y - G.axisName.size / 2, x + w / 2, y + G.axisName.size / 2,
             'the ' + n.textContent);
      });
      this.inked = list;
      this.inkLines = [];
      /* The two axes. `inkLine` has only ever been called for the pair
         and for the legs, so the two strongest strokes on the paper —
         heavier than anything drawn on it — were invisible to the rule
         that keeps labels off things, and a coordinate could be
         written straight across one. */
      (this.lines || []).forEach(function (l, i) {
        const x1 = parseFloat(l.getAttribute('x1')), y1 = parseFloat(l.getAttribute('y1'));
        const x2 = parseFloat(l.getAttribute('x2')), y2 = parseFloat(l.getAttribute('y2'));
        if (isFinite(x1) && isFinite(x2)) {
          self.inkLines.push({ x1: x1, y1: y1, x2: x2, y2: y2, what: 'an axis' });
        }
      });
      /* And the one obstacle that is never overridden: the inside of
         the shape. Worked out once for the pass, like the rest. */
      this.labelFace = this.shapeFace();
      /* The lengths go in BEFORE any label is placed. A length belongs
         to a side and has almost nowhere else to go; a label has eight
         directions and can be asked to move. So the length is the one
         that gets its place first and the label reads it as an
         obstacle — which is the whole of why "C" and "3 units" were
         being written through each other. */
      this.inkLengths();
      return list;
    },

    /* Every length the board is showing right now, as a box. Called at
       the top of a pass, and again whenever one lands. */
    inkLengths: function () {
      const G = C.GRID, LG = G.leg, SG = G.segment, self = this;
      const tk = this.typeScale();
      (this.legSlots || []).forEach(function (L, i) {
        if (!L || !L.len || !L.len.textContent) return;
        if (L.len.style.display === 'none') return;
        const x = parseFloat(L.len.getAttribute('x'));
        const y = parseFloat(L.len.getAttribute('y'));
        if (!isFinite(x) || !isFinite(y)) return;
        const w = self.textW(L.len.textContent, LG.lenSize * tk);
        const h = LG.lenSize * tk;
        self.inkBox(x - w / 2, y - h / 2, x + w / 2, y + h / 2,
                    'leg ' + i + ' length', L.len);
      });
      const R = this.segRes;
      if (R && R.textContent && R.classList.contains('pop')) {
        const x = parseFloat(R.getAttribute('x')), y = parseFloat(R.getAttribute('y'));
        if (isFinite(x) && isFinite(y)) {
          const size = (SG.resSize || SG.coordSize) * tk;
          const w = this.textW(R.textContent, size);
          this.inkBox(x - w / 2, y - size / 2, x + w / 2, y + size / 2,
                      'the length', R);
        }
      }
    },

    /* What a box would cost where it is: the same reckoning placeBlock
       does, so "is this position free?" and "which position is best?"
       can never answer differently. */
    costAt: function (box) {
      const self = this;
      let over = 0;
      (this.inked || []).forEach(function (o) {
        if (o.owner && o.owner === box.owner) return;   // itself
        const ox = Math.min(box.r, o.r) - Math.max(box.l, o.l);
        const oy = Math.min(box.b, o.b) - Math.max(box.t, o.t);
        if (ox > 0 && oy > 0) over += ox * oy;
      });
      (this.inkLines || []).forEach(function (L) {
        if (self.boxHitsLine(box, L)) over += 400;
      });
      return over;
    },

    /* A length asks for the place its own arithmetic chose. If that is
       clear it keeps it — which is what leaves every length that reads
       properly today exactly where it is, the count-out's included.
       Only a blocked one is handed to the rule, from the middle of its
       own side and pointing out of the shape. */
    seatLength: function (node, X, Y, w, h, away, owner, mid) {
      const box = { l: X - w / 2, t: Y - h / 2, r: X + w / 2, b: Y + h / 2,
                    owner: owner };
      let fx = X, fy = Y;
      if (this.costAt(box)) {
        /* Blocked. The search starts from the MIDDLE OF ITS OWN SIDE,
           not from the place it was hoping for — a bad position is a
           bad place to look outward from, and starting there put the
           two legs' lengths on top of each other. From the middle, one
           gap out, pointing away from the shape, is where a length
           belongs. */
        const ax = (mid && mid.x != null) ? mid.x : X;
        const ay = (mid && mid.y != null) ? mid.y : Y;
        const at = this.placeBlock(w, h, ax, ay, Math.max(10, h * 0.55), away, null);
        fx = at.x; fy = at.y;
      }
      node.setAttribute('x', fx);
      node.setAttribute('y', fy);
      this.inkBox(fx - w / 2, fy - h / 2, fx + w / 2, fy + h / 2,
                  'a length', owner);
      return { x: fx, y: fy };
    },

    /* A line of the drawing: labels keep off these too. */
    inkLine: function (x1, y1, x2, y2, what) {
      (this.inkLines || []).push({ x1: x1, y1: y1, x2: x2, y2: y2, what: what });
    },
    /* `owner` is the thing the box belongs to — a label's own node.
       Given one, this REPLACES that owner's previous box rather than
       adding a second.

       A corner's label is placed twice: once as its leg is drawn, and
       again once every leg is down and the lengths are known. Without
       an owner the first box stays in the list, and the second pass
       then reads its own ghost as an obstacle and shoves the label out
       of the very place it had just chosen. That is why C's label sat
       above its point with clear paper underneath. */
    inkBox: function (l, t, r, b, what, owner) {
      if (!this.inked || r <= l || b <= t) return;
      if (owner) {
        for (let i = this.inked.length - 1; i >= 0; i--) {
          if (this.inked[i].owner === owner) this.inked.splice(i, 1);
        }
      }
      this.inked.push({ l: l, t: t, r: r, b: b, what: what, owner: owner });
    },

    /* Does a box cross a line segment? Cheap and exact enough: the
       segment is walked in steps no longer than the box is small. */
    boxHitsLine: function (B2, L) {
      const dx = L.x2 - L.x1, dy = L.y2 - L.y1;
      const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) /
                Math.max(6, Math.min(B2.r - B2.l, B2.b - B2.t) / 2)));
      for (let i = 0; i <= n; i++) {
        const x = L.x1 + dx * i / n, y = L.y1 + dy * i / n;
        if (x > B2.l && x < B2.r && y > B2.t && y < B2.b) return true;
      }
      return false;
    },

    /* Where a block of this size sits so that its NEAREST INK is
       `gap` from the point, in this direction.

       It used to be `gap` on each axis at once, which is the right
       distance for the four cardinals and `gap × √2` — 41% too far —
       for the four diagonals. The diagonals are the ones a label
       reaches for first, because they are the ones that keep clear of
       the drawing, so every label placed the preferred way was placed
       the furthest way. Measured along the direction instead, all
       eight hug their point by the same amount. */
    blockAt: function (w, h, X, Y, d, gap) {
      const m = Math.hypot(d[0], d[1]) || 1;
      const cx = X + (d[0] / m) * gap + d[0] * w / 2;
      const cy = Y + (d[1] / m) * gap + d[1] * h / 2;
      return { x: cx, y: cy,
               box: { l: cx - w / 2, t: cy - h / 2, r: cx + w / 2, b: cy + h / 2 } };
    },

    /* The closed region the drawing encloses — the same three corners
       `showTriangle` washes in, whether or not it is actually shaded:
       a label in a triangle is in the triangle either way. Null while
       nothing is closed, because two points and a line enclose
       nothing. */
    shapeFace: function () {
      const G = C.GRID, sp = this.lastPlotted, L = this.legPlaced || [];
      if (!sp || !sp.a || !sp.b || !L[0] || !L[1] || !L[0].to) return null;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const poly = [sp.a, L[0].to, sp.b].map(function (p) {
        return { x: px(p.x), y: py(p.y) };
      });
      /* Three points on one line enclose nothing either. */
      const ar = (poly[1].x - poly[0].x) * (poly[2].y - poly[0].y) -
                 (poly[2].x - poly[0].x) * (poly[1].y - poly[0].y);
      return Math.abs(ar) < 1 ? null : poly;
    },

    inFace: function (x, y, poly) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > y) !== (b.y > y) &&
            x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
      }
      return inside;
    },

    /* Any part of this box in that face: a corner of the box inside it,
       a corner of it inside the box, or one of its sides crossing the
       box — which is the same as part of the box being inside. */
    boxHitsFace: function (B2, poly) {
      if (!poly || poly.length < 3) return false;
      const cs = [[B2.l, B2.t], [B2.r, B2.t], [B2.l, B2.b], [B2.r, B2.b]];
      for (let i = 0; i < cs.length; i++) {
        if (this.inFace(cs[i][0], cs[i][1], poly)) return true;
      }
      for (let i = 0; i < poly.length; i++) {
        const v = poly[i];
        if (v.x > B2.l && v.x < B2.r && v.y > B2.t && v.y < B2.b) return true;
        const u = poly[(i + 1) % poly.length];
        if (this.boxHitsLine(B2, { x1: v.x, y1: v.y, x2: u.x, y2: u.y })) return true;
      }
      return false;
    },

    /* Where a box of this size may sit beside this point. Eight places,
       sorted so the one pointing AWAY from the drawing comes first — a
       label belongs outside the shape it is labelling, never in its
       fill.

       Two rules, and only one of them bends. A label hugs its point:
       its nearest ink is `gap` off the dot, the same `gap` in all eight
       directions. And no label is ever inside a shape. So the search
       walks OUTWARD when it has to, and never inward: every step keeps
       clear of the face, including the least-bad one it settles for. A
       label pressed against the frame is untidy; a label in the fill is
       written on the thing it is annotating. */
    placeBlock: function (w, h, X, Y, gap, away, keep) {
      const self = this, W = this.window(2);
      const DIRS = [[1,-1],[-1,-1],[1,1],[-1,1],[0,-1],[0,1],[1,0],[-1,0]];
      const ax = away && (away.x || away.y) ? away : { x: 1, y: -1 };
      const aim = Math.atan2(-ax.y, ax.x);
      let order = DIRS.slice().sort(function (p, q) {
        const dp = Math.abs(Math.atan2(-p[1], p[0]) - aim);
        const dq = Math.abs(Math.atan2(-q[1], q[0]) - aim);
        const wp = Math.min(dp, Math.PI * 2 - dp), wq = Math.min(dq, Math.PI * 2 - dq);
        return wp - wq;
      });
      /* The side it is already on goes first. A push-in re-places every
         label on every frame, and a label that changes its mind between
         two equally good sides does it sixty times a second — which is
         what 402 frames of drift looked like. It only moves when the
         side it is on has stopped being clear. */
      if (keep) {
        order = [keep].concat(order.filter(function (d) {
          return d[0] !== keep[0] || d[1] !== keep[1];
        }));
      }
      const face = this.labelFace;
      const cost = function (box) {
        let over = 0;
        (self.inked || []).forEach(function (o) {
          const ox = Math.min(box.r, o.r) - Math.max(box.l, o.l);
          const oy = Math.min(box.b, o.b) - Math.max(box.t, o.t);
          if (ox > 0 && oy > 0) over += ox * oy;
        });
        (self.inkLines || []).forEach(function (L) {
          if (self.boxHitsLine(box, L)) over += 400;
        });
        return over;
      };
      /* Distance stretches; outside does not. Every direction at `gap`
         first, then the same eight walked out a step at a time, and
         only then the least bad of everything that was outside. */
      const OUT = [0, gap * 0.8, gap * 1.8, gap * 3.2, gap * 5.4];
      let best = null;
      for (let s = 0; s < OUT.length; s++) {
        for (let i = 0; i < order.length; i++) {
          const d = order[i];
          const at = this.blockAt(w, h, X, Y, d, gap + OUT[s]);
          const box = at.box;
          /* Off the paper is not a candidate at all. */
          if (box.l < W.lo || box.r > W.hi || box.t < W.top || box.b > W.bot) continue;
          /* Nor is inside the shape, however bad the alternatives. */
          if (face && this.boxHitsFace(box, face)) continue;
          const over = cost(box);
          /* A few square pixels is a graze, not a collision. The dots
             are inked at their radius plus four, so a label hugging
             its own point at the measured gap clips the NEXT point's
             box by a pixel or two — and demanding a dead-zero score
             threw away every direction over that, fell through to the
             least-bad, and put C's coordinates on the axis numbering
             with clear paper one step to the left. */
          if (over <= 12) return { x: at.x, y: at.y, box: box, dir: d };
          if (!best || over < best.over) {
            best = { x: at.x, y: at.y, box: box, over: over, dir: d };
          }
        }
      }
      if (best) return best;
      /* Nowhere on the paper at all: clamped where it was asked for —
         and still not into the face, which is the one thing that never
         gives. */
      for (let i = 0; i < order.length; i++) {
        const at = this.blockAt(w, h, X, Y, order[i], gap);
        const cx2 = this.clampLabel(at.x, w), cy2 = this.clampY(at.y, h);
        const box = { l: cx2 - w/2, t: cy2 - h/2, r: cx2 + w/2, b: cy2 + h/2 };
        if (face && this.boxHitsFace(box, face)) continue;
        return { x: cx2, y: cy2, box: box, dir: order[i] };
      }
      const cx = this.clampLabel(X + (ax.x >= 0 ? 1 : -1) * (gap + w / 2), w);
      const cy = this.clampY(Y - (gap + h / 2), h);
      return { x: cx, y: cy,
               box: { l: cx - w/2, t: cy - h/2, r: cx + w/2, b: cy + h/2 } };
    },

    /* A point's letter and its coordinate, as ONE thing: the letter
       over the coordinate, centred on each other, placed once and kept
       clear once. They are one fact about one point, and two labels on
       opposite sides of a dot is that fact taken to pieces. */
    placePointLabel: function (part, p, X, Y, opt) {
      const G = C.GRID, SG = G.segment, tk = this.typeScale();
      opt = opt || {};
      const ctext = opt.ctext || '';
      const ntext = (opt.ntext != null ? opt.ntext : p.name) || '';
      const cm = ctext ? this.textMetrics(ctext, SG.coordSize * tk) : null;
      const nm = ntext ? this.textMetrics(ntext, SG.nameSize * tk) : null;
      const cw = cm ? cm.w : 0, ch = cm ? (SG.coordSize * tk) : 0;
      const nw = nm ? nm.w : 0, nh = nm ? (SG.nameSize * tk) : 0;
      const lead = (cm && nm) ? SG.stackGap * tk : 0;
      const w = Math.max(cw, nw), h = nh + lead + ch;
      if (!w || !h) return null;
      const gap = SG.dotR + SG.dotStrokeW / 2 + SG.coordGap * tk;

      /* Which side of its point it is already on, so it keeps that side
         while the side is still clear — see `placeBlock`. */
      /* A point the child located already has a side — the one its
         mark used — and the pair it becomes keeps it, so the label does
         not shuffle the moment the two are joined. */
      const wasFound = (this.foundSide || {})[opt.at];
      const at = this.placeBlock(w, h, X, Y, gap, part.heldDir ? opt.away : (wasFound ?
                   { x: 0, y: -wasFound[1] } : opt.away), part.heldDir || wasFound);
      part.heldDir = at.dir;

      /* And now measured to the INK.

         `placeBlock` places a BOX, but the ink inside it is a narrow
         letter sitting over a wider coordinate — so the nearest glyph
         to the dot is hardly ever the box's own corner, and the gap
         the box keeps is not the gap anyone sees. That is what left A
         at 26.9px from its dot and C at 0.7, touching, off the same
         one number.

         So the block slides along the direction it already chose
         until the nearest of its two runs of ink is exactly `gap` from
         the point. It only ever moves along that direction, so a
         position the rule approved stays the position it approved.

         This is what `labels-hug-their-points` §2 asked for and could
         not have while the thing placed and the thing measured were
         different shapes. */
      if (at.dir) {
        const dm = Math.hypot(at.dir[0], at.dir[1]) || 1;
        const ux = at.dir[0] / dm, uy = at.dir[1] / dm;
        const inkNear = function (bx) {
          let best = Infinity;
          const runs = [];
          if (nm) runs.push({ l: bx.l + (w - nw) / 2, t: bx.t,
                              r: bx.l + (w + nw) / 2, b: bx.t + nh });
          if (cm) runs.push({ l: bx.l + (w - cw) / 2, t: bx.b - ch,
                              r: bx.l + (w + cw) / 2, b: bx.b });
          runs.forEach(function (r) {
            const dx = Math.max(r.l - X, 0, X - r.r);
            const dy = Math.max(r.t - Y, 0, Y - r.b);
            best = Math.min(best, Math.hypot(dx, dy));
          });
          return best;
        };
        const have = inkNear(at.box);
        const slide = have - gap;
        if (isFinite(have) && Math.abs(slide) > 0.5) {
          at.x -= ux * slide;
          at.y -= uy * slide;
          at.box = { l: at.x - w / 2, t: at.y - h / 2,
                     r: at.x + w / 2, b: at.y + h / 2 };
        }
      }
      /* Seated inside the block: letter on top, coordinate under it.
         No plate — the words carry their own paper halo and the panel
         behind the FORMULA is the only panel on this board. */
      if (nm) {
        part.name.setAttribute('x', at.x);
        part.name.setAttribute('y', at.box.t + nh / 2);
      }
      if (cm) {
        part.coord.setAttribute('x', at.x);
        part.coord.setAttribute('y', at.box.b - ch / 2);
      }
      /* Owned by this label's own coordinate node, so placing it again
         supersedes where it was rather than adding a second obstacle. */
      this.inkBox(at.box.l, at.box.t, at.box.r, at.box.b,
                  (ntext || ctext) + ' label', part.coord || part.name);
      return at;
    },

    clampLabel: function (cx, w) {
      const W = this.window(2);
      return Math.max(W.lo + w / 2, Math.min(W.hi - w / 2, cx));
    },

    clampY: function (cy, h) {
      const W = this.window(8);
      return Math.max(W.top + h / 2, Math.min(W.bot - h / 2, cy));
    },

    onXAxisRow: function (cy, h) {
      const G = C.GRID, pad = 5;
      const top = G.originY - G.axisWidth / 2 - pad;
      const bot = G.originY + G.labelGap + G.labelSize * 0.42 + G.labelSize / 2 + pad;
      return cy + h / 2 > top && cy - h / 2 < bot;
    },

    placeLeg: function (i, spec) {
      const G = C.GRID, LG = G.leg, L = this.legSlots[i];
      /* Kept so the camera can frame what is actually drawn. */
      this.legPlaced = this.legPlaced || [];
      /* What was in this slot a moment ago, before it is overwritten:
         the same side, still on the board, is a side being HANDED OVER
         rather than one arriving. */
      const was = this.legPlaced[i];
      this.legPlaced[i] = spec;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const f = spec.from, t = spec.to;
      const x1 = px(f.x), y1 = py(f.y), x2 = px(t.x), y2 = py(t.y);
      // the size the camera is actually setting this leg's labels at
      const tk = this.typeScale();

      /* Its own colour, by which way it runs — the length written
         beside it takes the same one, so the two read as one thing. */
      const side = (f.y === t.y) ? (LG.hColor || LG.color) : (LG.vColor || LG.color);
      L.line.setAttribute('stroke', side);
      L.len.setAttribute('fill', side);
      /* Its own colour as `color` too, so a glow can be drawn in it:
         one warm glow round all three reads on the navy diagonal and
         vanishes against the orange and the green. */
      L.line.style.color = side;
      if (L.dash) L.dash.style.color = side;

      /* Dotted while it is a guide, solid once it is known. Only one of
         the two is ever on the board. */
      if (L.dash) {
        L.dash.setAttribute('x1', x1); L.dash.setAttribute('y1', y1);
        L.dash.setAttribute('x2', x2); L.dash.setAttribute('y2', y2);
        L.dash.setAttribute('stroke', side);
        L.dashG.style.transformOrigin = x1 + 'px ' + y1 + 'px';
        L.dashG.style.display = spec.dash ? '' : 'none';
        L.line.style.display = spec.dash ? 'none' : '';
      }

      L.line.setAttribute('x1', x1); L.line.setAttribute('y1', y1);
      L.line.setAttribute('x2', x2); L.line.setAttribute('y2', y2);
      const len = Math.hypot(x2 - x1, y2 - y1);
      L.line.setAttribute('stroke-dasharray', len);
      /* Wound back to nothing, so the leg can draw itself on. A side
         the board is CARRYING OVER is already there and goes down at
         full length instead — and both that and the `set` mark are
         done here, in the one place that winds a leg back, because
         this runs again every time the board is laid out.

         `set` has to be taken OFF as well as put on. A leg slot is
         reused screen after screen: left on from the screen that
         carried the side over, it switched off the draw on the next
         screen that wanted one, and a side that should have been
         drawing sat wound back to nothing under its own written
         length. It follows the spec now, every time. */
      /* Wound back only if it has yet to be on the board at all.

         Three ways a side is already there. It says `settled`. Or it
         still carries `draw`, which means nothing has cleared this
         board since it drew — `clearLegs` is what takes that class off.
         Or the slot held this very side a moment ago and the group is
         still up: a dotted guide going solid, which is the same two
         points and the same span, drawn differently. That last one is
         what made CB vanish and draw itself again one screen after the
         guide had already shown the child where it ran — the hand-over
         from guide to found side should be a change of dress, not a
         second arrival. */
      const shownAlready = !!(was && was.from && was.to &&
        was.from.x === f.x && was.from.y === f.y &&
        was.to.x === t.x && was.to.y === t.y &&
        L.g.classList.contains('on') &&
        (L.line.classList.contains('draw') ||
         (L.dashG && L.dashG.classList.contains('draw'))));
      const held = !!spec.settled || L.line.classList.contains('draw') ||
                   shownAlready;
      L.line.style.strokeDashoffset = held ? 0 : len;
      const quietly = !!spec.settled || shownAlready;
      /* Read back by `placeLegs`, which decides whether this side
         arrives on a clock or is simply on. */
      L.handedOver = shownAlready;
      L.line.classList.toggle('set', quietly);
      if (L.dashG) L.dashG.classList.toggle('set', quietly);

      if (spec.mark) {
        L.dot.setAttribute('cx', x2); L.dot.setAttribute('cy', y2);
        // the corner can be drawn as a plotted point rather than a leg end
        L.dot.setAttribute('fill', spec.mark.fill || side);
        L.coord.textContent = spec.mark.coordText ||
                              ('(' + numText(t.x) + ',\u00A0' + numText(t.y) + ')');
        L.name.textContent = spec.mark.name || '';
        /* The corner's letter and its coordinate are one block, placed
           by the same rule every other point's are — out of the shape,
           clear of the axes, their numbers and their letters. It used
           to have three special cases of its own and still ended up
           floating in the middle of its own triangle. */
        const away = (function (self) {
          const drawn = self.lastPlotted;
          if (!drawn || !drawn.a) return { x: 1, y: -1 };
          const mx = (px(drawn.a.x) + px(drawn.b.x) + x2) / 3;
          const my = (py(drawn.a.y) + py(drawn.b.y) + y2) / 3;
          return { x: x2 - mx, y: y2 - my };
        })(this);
        this.placePointLabel(
          L.markLabel || (L.markLabel = { coord: L.coord, name: L.name }),
          { name: spec.mark.name, coordText: L.coord.textContent },
          x2, y2, { ctext: L.coord.textContent, away: away });
        L.dot.style.display = L.coord.style.display = L.name.style.display = '';
      } else {
        L.dot.style.display = L.coord.style.display = L.name.style.display = 'none';
      }

      if (spec.length) {
        /* How long the leg is, not how far round it. Every leg in this
           game used to run along a row or a column, where the two are
           the same number — and they stop being the same the moment a
           leg is a side of an ordinary triangle, where |dx| + |dy| gave
           21 for a side of length 15. Measured properly, an
           axis-parallel leg is unchanged: one of the two terms is zero
           and the root of the other squared is the other. */
        const d = Math.hypot(t.x - f.x, t.y - f.y);
        const n = Math.abs(d - Math.round(d)) < 1e-9
          ? Math.round(d) : Math.round(d * 100) / 100;
        /* A leg can name its length instead of measuring it — the
           general case labels it x2 - x1 rather than 10 units. */
        this.placeLegLength(i, f, t,
          spec.lengthText || (n + '\u00A0unit' + (n === 1 ? '' : 's')));
        L.len.style.display = L.plate.style.display = '';
      } else {
        L.len.style.display = L.plate.style.display = 'none';
      }
    },

    /* Where a leg writes how long it is.
       Its own, so the count-out can put a measured total in the very
       place the leg's label goes: one label, written once, which the
       next screen keeps rather than replacing with an identical one of
       its own — which is what made the length appear, vanish and come
       back a moment later in a different colour. */
    placeLegLength: function (i, f, t, txt) {
      const G = C.GRID, LG = G.leg, L = this.legSlots[i];
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const x1 = px(f.x), y1 = py(f.y), x2 = px(t.x), y2 = py(t.y);
      const tk = this.typeScale(), self2 = this;
      {
        const horiz = (f.y === t.y);
        /* Above a horizontal leg — inside the right angle, where the
           board is empty. Beside a vertical one, pushed along it
           towards the corner it starts from: the far end of that side
           carries the other point's coordinates.

           And beside it on the side the rest of the drawing is on —
           inside the shape, not out in the margin. Always taking the
           right-hand side put the outermost column's length past the
           frame, and the clamp does not decline, it drags: it came back
           and landed along the leg it was measuring. */
        const towardCorner = y1 > y2 ? 1 : -1;
        /* Which side of this leg the rest of the drawing is on — and so
           which side the length may not have. A length is the one label
           that may sit along the side it belongs to, but not in the
           face: written there it is written on the very thing it is
           measuring. Both of these used to be aimed deliberately
           inward, so a triangle carried both its lengths in its own
           fill.

           Taken from the pair the legs hang off rather than from the
           closed face, so the answer is the same before and after the
           third side lands: the side that is going to be the inside is
           already the inside while the shape is still open, and a
           length the child has just counted does not jump when the
           triangle closes round it. */
        const drawn = this.lastPlotted;
        let inner = 1, vSide = 1;
        if (drawn && drawn.a && drawn.b) {
          const mx = (px(drawn.a.x) + px(drawn.b.x)) / 2;
          const my = (py(drawn.a.y) + py(drawn.b.y)) / 2;
          if (horiz) vSide = (my <= y1) ? -1 : 1;   // pair above it: write below
          else inner = (mx <= x1) ? 1 : -1;         // pair to its left: write right
        }
        const face = this.shapeFace();
        /* A vertical leg's length is TURNED and set along its own
           line, just outside it. Laid across, "3 units" had to stand
           78px off the leg to clear it and still read as a caption
           floating beside the drawing; turned, it is a label ON the
           side it measures and sits a line's width away. */
        const turn = !horiz;
        const off = turn ? (LG.lenSize * tk * 0.62 + LG.width) : 0;
        let lx = horiz ? (x1 + x2) / 2 : (x1 + inner * off);
        const ly = horiz ? y1 + vSide * LG.lenGap * tk
                         : (y1 + y2) / 2 + towardCorner * LG.lenBiasV * tk;
        /* A leg centred on the origin writes its length straight down
           the y-axis, so it slides along its own leg towards the corner
           until it is clear of the axis and the numbers beside it. */
        const lw2 = this.textW(txt, LG.lenSize * tk);
        /* Turned, its footprint is on its side: as wide as the type is
           tall, and as tall as the words are long. */
        const bw = turn ? (LG.lenSize * tk) : lw2;
        const bh = turn ? lw2 : (LG.lenSize * tk);
        if (horiz) lx = this.clearOfYAxis(lx, lw2);
        else if (Math.abs(this.clampX(lx, lw2) - lx) > 0.5) {
          /* No room on that side after all: take the other one whole —
             unless the other one is the inside of the shape, which it
             may not have at any price. Then it comes in against the
             frame instead, which is untidy where the fill is wrong. */
          if (!face) lx = x1 - inner * LG.lenGapV * tk;
        }
        /* And a vertical leg whose middle is level with the x-axis
           writes its length across the axis numbering — "14 units" over
           the 3, 4 and 5. It slides along its own leg, towards the
           corner it starts from, until it is out of that row: the same
           courtesy showSegResult already does for a pair's own length,
           and the same row it measures against. */
        let lyOut = ly;
        if (!horiz) {
          const band = LG.lenSize * tk;
          let guard = 0;
          while (this.onXAxisRow(lyOut, band) && guard++ < 12) {
            lyOut += towardCorner * band * 0.55;
          }
        }
        /* A vertical leg on the outermost column writes its length past
           the frame — 78px beside x=6 is off the cream once a cell is
           78px wide. */
        let fx = this.clampX(lx, bw), fy = this.clampY(lyOut, bh);
        /* And out of the face, which the outer side cannot always
           manage: beside the outermost column there are 53px of paper
           and "3 units" is 136 wide, so the clamp does not decline, it
           drags — and what it drags the length into is the shape it is
           measuring. Then it slides ALONG its own leg instead, the
           shorter way, until it is past the corner and out. Along the
           side is where a length belongs; inside the face is the one
           place beside that side it may not be. */
        if (face) {
          const hw = bw / 2, hh = bh / 2;
          const hits = function (X, Y) {
            return self2.boxHitsFace({ l: X - hw, t: Y - hh, r: X + hw, b: Y + hh }, face);
          };
          if (hits(fx, fy)) {
            const ux = x2 - x1, uy = y2 - y1, m = Math.hypot(ux, uy) || 1;
            const step = Math.max(8, LG.lenSize * tk * 0.4);
            for (let n = 1; n <= 60; n++) {
              let done = false;
              for (let s2 = 1; s2 >= -1 && !done; s2 -= 2) {
                const X = this.clampX(fx + (ux / m) * step * n * s2, bw);
                const Y = this.clampY(fy + (uy / m) * step * n * s2, bh);
                if (!hits(X, Y)) { fx = X; fy = Y; done = true; }
              }
              if (done) break;
            }
          }
        }
        /* And then the one rule has the last word. Everything above
           says where this length would LIKE to be; `seatLength` keeps
           that place when it is free — which is every length that
           reads properly today, the count-out's included — and only
           hands a blocked one to the solver, out of the middle of its
           own side and away from the shape. It was this step's absence
           that let "3 units" be written across the x-axis letter and
           through the corner's own C. */
        L.len.textContent = txt;
        const outX = horiz ? 0 : (inner >= 0 ? 1 : -1);
        const outY = horiz ? (vSide >= 0 ? 1 : -1) : 0;
        const seat = this.seatLength(L.len, fx, fy, bw, bh,
                        { x: outX, y: outY }, L.len,
                        { x: (x1 + x2) / 2, y: (y1 + y2) / 2 });
        /* Turned about wherever it ended up, so the words run up the
           side rather than across it. */
        const tn = L.lenTurn;
        if (tn) {
          if (turn) tn.setAttribute('transform',
                      'rotate(-90 ' + seat.x + ' ' + seat.y + ')');
          else tn.removeAttribute('transform');
        }
      }
    },

    /* The total a count-out arrived at, written as the leg's own length
       — in the leg's colour, in the leg's place — instead of on the
       board's general label. The screen after keeps it untouched. */
    showLegTotal: function (i, units, from, to) {
      const L = this.legSlots && this.legSlots[i];
      /* The ends come from the count that has just been walked out —
         the very pair being measured — rather than from what the board
         last remembered placing. The two are the same leg, but only one
         of them is guaranteed to be there when the answer lands. */
      const spec = (from && to) ? { from: from, to: to } : (this.legPlaced || [])[i];
      if (!L || !spec || !spec.from) return false;
      this.placeLegLength(i, spec.from, spec.to,
        units + '\u00A0unit' + (units === 1 ? '' : 's'));
      L.len.style.display = L.plate.style.display = '';
      L.len.classList.add('pop');
      return true;
    },

    /* Draws the legs a screen asks for: any already settled from the
       screen before simply appear, the rest animate in. */
    /* A corner's coordinates are placed knowing only the leg that
       arrives at it — the leg that leaves it has not been drawn yet.
       On the triangle that second leg rises straight up out of the
       corner, through the very space the label takes when the frame
       has left it nowhere to go but over the point. So once every leg
       is down, each corner's label is put clear of all of them, and of
       the segment they hang off. */
    clearMarksOfLines: function () {
      const G = C.GRID, SG = G.segment, LG = G.leg, self = this;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const placed = this.legPlaced || [];
      if (!placed.filter(Boolean).length) return;
      // measured at the size the camera is setting, like everything else
      const tk = this.typeScale();

      /* A blocked corner used to be moved by hand: the coordinates
         dropped to a fixed offset under the point and the letter
         stepped sideways off whatever line was in the way. That offset
         is a distance to the label's MIDDLE, not to its ink, so it owed
         nothing to the gap every other label keeps — on screen 25 it
         put the corner's coordinates ON its own dot, 2px INSIDE the
         circle they belong to.

         There is one rule for this now and it already knows how to
         miss a line. The only thing it could not see was the lengths
         written beside the legs, because nothing inks those — so they
         go in, and then each corner is simply placed again. */
      (this.legSlots || []).forEach(function (L, n) {
        const s = placed[n];
        if (!s || !L.len || !L.len.textContent || L.len.style.display === 'none') return;
        const w = self.textW(L.len.textContent, LG.lenSize * tk);
        const h = LG.lenSize * tk;
        const x = parseFloat(L.len.getAttribute('x')), y = parseFloat(L.len.getAttribute('y'));
        if (isFinite(x) && isFinite(y)) {
          self.inkBox(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 'a leg length');
        }
      });

      (this.legSlots || []).forEach(function (L, i) {
        const spec = placed[i];
        if (!spec || !spec.mark || !L.coord.textContent) return;
        const x2 = px(spec.to.x), y2 = py(spec.to.y);
        const drawn = self.lastPlotted;
        let away = { x: 1, y: -1 };
        if (drawn && drawn.a) {
          const mx = (px(drawn.a.x) + px(drawn.b.x) + x2) / 3;
          const my = (py(drawn.a.y) + py(drawn.b.y) + y2) / 3;
          away = { x: x2 - mx, y: y2 - my };
        }
        self.placePointLabel(
          L.markLabel || (L.markLabel = { coord: L.coord, name: L.name }),
          { name: spec.mark.name, coordText: L.coord.textContent },
          x2, y2, { ctext: L.coord.textContent, away: away });
      });
    },

    runLegs: function (specs, later, done) {
      const self = this;
      if (!specs || !specs.length) { done(); return; }

      /* Every side this screen is going to draw, recorded before the
         first of them is placed. A leg's length and a corner's label
         both have to keep out of the face the three sides close, and
         that face is not knowable from one leg — so the first leg used
         to be laid out as if there were no shape and then moved when
         the last one arrived, which is a length written twice in two
         places. */
      this.legPlaced = this.legPlaced || [];
      specs.forEach(function (s, i) { self.legPlaced[i] = s; });
      /* And only those. A screen that keeps its drawing keeps the
         record of it too, so a screen drawing one side after a screen
         that drew two inherited the second — and closed a face that is
         not on the paper. A screen's `legs` is always all of its
         sides: the ones carried over say `settled`, they are not left
         out. */
      this.legPlaced.length = specs.length;

      let delay = 0;
      specs.forEach(function (spec, i) {
        const L = self.legSlots[i];
        self.placeLeg(i, spec);
        L.g.classList.add('on');
        /* Every side is down now, so the face exists — and the pair's
           own two labels were placed before it did, when the only
           thing to keep out of was a line. Lay the board out again
           knowing the shape, then put the corners clear of the lines
           as before. */
        if (i === specs.length - 1) { self.relabel(); self.markCrossing(); }

        if (spec.settled) {
          /* Already on the board; only its length is new — so it goes
             down DRAWN, not drawing. `placeLeg` has just wound this
             line back to nothing (every leg is seated undrawn so the
             ones that do arrive can arrive), and adding `draw` alone
             set it animating from zero: the side the child had just
             measured came off the board and joined itself a second
             time, in front of them, one screen after they found it.
             `set` is the line's version of `.segdot.set` — the same
             hand-over, made invisible. It keeps `draw` so everything
             that asks what is on the board still counts it. */
          if (!spec.noLine) (spec.dash ? L.dashG : L.line).classList.add('draw');
          /* And this is the hand-over: the side the child measured is
             now drawn in its own colour with its own length, so the
             lit measuring line lying along it has been taken over and
             can go. Same tick as the leg being drawn — the measure
             must never travel to a screen that is not about it. */
          Board.clearMeasure();
          if (spec.mark) { L.dot.classList.add('pop'); L.coord.classList.add('pop'); L.name.classList.add('pop'); }
          if (spec.length) {
            const fly = self.flyIntoLeg(i, spec, later, delay + 200);
            later(function () { self.showLegLength(i); SFX.tick(2); },
                  delay + 200 + fly);
            delay += 520 + fly;
          }
          return;
        }

        const base = delay;
        /* The line first, then the point it arrives at, then what that
           point is called. A corner that appears before anything has
           reached it is just a dot on the grid; drawn this way round it
           is the line that puts it there, which is the whole story of
           where the third point comes from. The line takes 600ms, so
           the dot lands as it gets there. */
        if (!spec.noLine) {
          /* Handed over rather than arriving: it goes on at once, with
             no stroke sound, because nothing is being drawn — the line
             the child is already looking at is simply solid now. */
          if (L.handedOver) {
            (spec.dash ? L.dashG : L.line).classList.add('draw', 'set');
          } else {
            later(function () {
              (spec.dash ? L.dashG : L.line).classList.add('draw');
              SFX.draw();
            }, base + 120);
          }
        }
        // the dots take 900ms to reach the far end where the line takes 600
        const lands = base + (spec.dash ? 980 : 760);
        if (spec.mark) {
          later(function () { L.dot.classList.add('pop'); SFX.tick(1); }, lands);
          later(function () { L.coord.classList.add('pop'); SFX.tick(3); }, lands + 250);
          later(function () { L.name.classList.add('pop'); SFX.tick(4); }, lands + 390);
        }
        if (spec.length) later(function () { self.showLegLength(i); SFX.tick(5); }, base + 1330);
        delay = base + 1640;
      });

      /* Three sides make a shape: as soon as the second leg is placed,
         the face it closes with the segment is washed in. */
      if (specs.length > 1) later(function () { self.showTriangle(); }, 220);
      later(done, delay + 260);
    },

    /* The three sides lit while she says what they make — A to C, C to
       B, B back to A, going round the shape the way it was built, and
       then all three held lit together for a beat so it reads as one
       triangle rather than three lines that happen to touch.

       It runs under her voice, not after it: the light is what she is
       talking about, and a shape that lights once she has stopped is
       illustrating a sentence that is already over.

       Whichever line a side is actually showing takes the pulse: a side
       still waiting to be measured is its dotted guide, not its solid
       line. The class is dropped and put back a frame later rather than
       forced through a reflow, which is the one way that works the same
       in a browser and in a test harness. */
    pulseSides: function (later, delay, keys, runMs) {
      if (!this.segLine || !this.legSlots) return 0;
      const pick = function (L) {
        if (!L) return null;
        return (L.dashG && L.dashG.style.display !== 'none') ? L.dashG : L.line;
      };
      /* 'h' the horizontal leg, 'v' the vertical, 'ab' the line between
         the two points. All three is the shape being named; one on its
         own is the side being asked about. */
      const of = { h: pick(this.legSlots[0]), v: pick(this.legSlots[1]), ab: this.segLine };
      const sides = (keys || ['h', 'v', 'ab']).map(function (k) { return of[k]; })
        .filter(Boolean);
      if (!sides.length) return 0;

      /* The corners, and the groups they and their sides live in. The
         geometry is spread across three groups — a group per leg and
         one for the segment — so rather than move it into a new one and
         break everything that addresses those, all three take the same
         float, with the same duration and no delay. Identical animation
         on every piece is what keeps the shape connected; one group
         floating on its own would pull it apart. */
      const whole = !keys || keys.length === 3;
      const dots = whole
        ? [this.segParts && this.segParts.a.dot,
           this.segParts && this.segParts.b.dot,
           this.legSlots[0] && this.legSlots[0].dot].filter(Boolean)
        : [];

      /* Marked, then switched on from one place. `triangle-side` says
         which lines are in the highlight; the class on the board turns
         it on. Both go on in the same tick and one animation drives all
         of them, so there is no way for the three to drift apart or for
         a line to be caught between states — which is what the old
         per-line beats did, each taken off and put back a frame later.
         Nothing here is removed and re-added while it is running. */
      const start = delay || 0, run = runMs || 1600;
      /* The overlay copies whatever it is covering — the same two ends
         and the same colour — so it can never drift out of line with
         the real thing, and nothing has to know where the points are. */
      const srcOf = { h: this.legSlots[0] && this.legSlots[0].line,
                      v: this.legSlots[1] && this.legSlots[1].line,
                      ab: this.segLine };
      const srcs = (keys || ['h', 'v', 'ab']).map(function (k) { return srcOf[k]; })
        .filter(Boolean);
      const overlay = this.pulseLines || [];
      const self2 = this;

      later(function () {
        overlay.forEach(function (l, i) {
          const src = srcs[i];
          if (!src) { l.classList.remove('on'); return; }
          ['x1', 'y1', 'x2', 'y2'].forEach(function (a) {
            l.setAttribute(a, src.getAttribute(a));
          });
          const col = src.getAttribute('stroke');
          l.setAttribute('stroke', col);
          l.style.color = col;                 // what the glow is drawn in
          l.classList.add('on');
        });
        dots.forEach(function (n) { n.classList.add('triangle-point'); });
        el.gridAxes.classList.add('triangle-question-active');
        SFX.tick(3);
      }, start);
      later(function () {
        el.gridAxes.classList.remove('triangle-question-active');
        overlay.forEach(function (l) { l.classList.remove('on'); });
        dots.forEach(function (n) { n.classList.remove('triangle-point'); });
      }, start + run);
      return start + run;
    },

    /* The same highlight, on POINTS rather than sides. "Look at A and
       C" names two dots and nothing between them — the line between
       them is the next sentence, and lighting it early answers the
       question before it is asked. `a` and `b` are the pair's own
       ends, `c` the corner the first leg arrives at. */
    pulsePoints: function (later, delay, keys, runMs) {
      if (!this.segParts) return 0;
      const of = { a: this.segParts.a.dot, b: this.segParts.b.dot,
                   c: this.legSlots && this.legSlots[0] && this.legSlots[0].dot };
      const dots = (keys || ['a', 'b']).map(function (k) { return of[k]; })
        .filter(Boolean);
      if (!dots.length) return 0;
      const start = delay || 0, run = runMs || 1600;
      later(function () {
        dots.forEach(function (n) { n.classList.add('triangle-point'); });
        el.gridAxes.classList.add('triangle-question-active');
        SFX.tick(3);
      }, start);
      later(function () {
        el.gridAxes.classList.remove('triangle-question-active');
        dots.forEach(function (n) { n.classList.remove('triangle-point'); });
      }, start + run);
      return start + run;
    },

    /* Which side of the triangle the working is talking about: that one
       comes forward and the rest step back, so a child reading "4\u00B2"
       can see at once which line it means. `which` is 'h', 'v' or 'ab';
       anything else puts the board back the way it was. */
    /* The two ends of one side of the drawing, in grid coordinates.
       'ab' is the pair itself; 'h' and 'v' are the two legs, in the
       order the screen's `legs` gives them. */
    sideEnds: function (which) {
      if (which === 'ab') {
        const d = this.lastPlotted;
        return (d && d.a && d.b) ? { from: d.a, to: d.b } : null;
      }
      const i = which === 'h' ? 0 : which === 'v' ? 1 : -1;
      const L = (this.legPlaced || [])[i];
      return (L && L.from && L.to) ? { from: L.from, to: L.to } : null;
    },

    spotlightPart: function (which) {
      if (!this.segLine) return;
      const A = this.segParts && this.segParts.a;
      const B = this.segParts && this.segParts.b;
      const L0 = this.legSlots && this.legSlots[0];
      const L1 = this.legSlots && this.legSlots[1];
      /* A corner is its dot, its letter and its coordinate. They are
         one thing on the paper, so they light as one. `legSlots[0]`'s
         mark is the corner the two legs share — `rightAngle` reads it
         the same way. */
      const corner = function (o) { return o ? [o.dot, o.name, o.coord] : []; };
      /* The stroke of a side, and the length written along it. */
      const stroke = {
        ab: [this.segLine, this.segRes],
        h:  [L0 && L0.line, L0 && L0.len],
        v:  [L1 && L1.line, L1 && L1.len]
      };
      /* But a side is not a stroke. It is the stroke, its length, and
         the two corners it runs between — letters and coordinates and
         all. That is what the working means when it writes (AC)², and
         lighting only the line left the rest of the drawing at full
         strength while the child was being told to look at one side
         of it. */
      const part = {
        ab: stroke.ab.concat(corner(A), corner(B)),
        h:  stroke.h.concat(corner(A), corner(L0)),
        v:  stroke.v.concat(corner(L0), corner(B))
      };
      /* Nobody's own. The face the three sides close and the square in
         the corner belong to the shape rather than to any one side, so
         they step back whenever one is singled out and come back when
         nothing is. */
      const shape = [this.triFill, this.rightMark];

      /* Only what is actually ON the board. `hush` now carries enough
         weight to beat the animation painting a label, which means it
         is also heavy enough to paint one that was never up: a leg
         with no mark, a length not yet written, a face on a screen
         with no triangle. Anything sitting at nothing stays at
         nothing. */
      const shown = function (n) {
        if (!n || n.style.display === 'none') return false;
        return +getComputedStyle(n).opacity > .05;
      };
      const lit = (which && part[which]) ? part[which].filter(shown) : [];
      const all = [];
      const add = function (n) {
        if (shown(n) && all.indexOf(n) < 0) all.push(n);
      };
      Object.keys(part).forEach(function (k) { part[k].forEach(add); });
      shape.forEach(add);

      /* Union, not last-write. A corner belongs to whichever side is
         lit — C is on both legs — so it is hushed only when neither of
         them is. The old map walked one key after another and a shared
         node took whatever the last pass happened to say about it. */
      all.forEach(function (n) {
        const on = lit.indexOf(n) >= 0;
        n.classList.toggle('spot', on);
        n.classList.toggle('hush', !!which && !on);
      });

      /* The beat is the side swelling, so it goes on the stroke and its
         length and nothing else. On a dot or a letter it would name an
         animation on an element whose visibility IS the fill of another
         one, and take it off the board — the trap this file has fallen
         into four times already. */
      const beat = (which && stroke[which]) ? stroke[which].filter(shown) : [];
      Object.keys(stroke).forEach(function (k) {
        stroke[k].forEach(function (n) { if (n) n.classList.remove('spotbeat'); });
      });
      beat.forEach(function (n) { n.classList.add('spotbeat'); });
      clearTimeout(this.beatOff);
      if (which) this.beatOff = setTimeout(function () {
        beat.forEach(function (n) { n.classList.remove('spotbeat'); });
      }, 720);
    },

    /* The square in the corner, drawn from the two legs rather than
       typed: which way each of them runs decides which of the four
       corners it goes in, so it is right whatever the pair is.

       It is the evidence for an answer, so it arrives with the answer.
       A marker already sitting there turns "what type of triangle is
       this?" into a reading exercise. */
    rightAngle: function (on) {
      const G = C.GRID, LG = G.leg;
      const m = this.rightMark;
      if (!m) return;
      const L = this.legPlaced || [];
      if (!on || !L[0] || !L[1]) { m.classList.remove('on'); return; }
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const c0 = L[0].to;                       // the corner the two share
      const s = (LG.rightAngle || 0.28) * G.stepX * this.typeScale();
      /* Inside the angle: one step back along the leg that arrives,
         one step along the leg that leaves. */
      const hx = Math.sign(px(L[0].from.x) - px(c0.x)) || -1;
      const vy = Math.sign(py(L[1].to.y) - py(c0.y)) || -1;
      const x0 = px(c0.x), y0 = py(c0.y);
      m.setAttribute('points',
        [ [x0 + hx * s, y0],
          [x0 + hx * s, y0 + vy * s],
          [x0,          y0 + vy * s] ].map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
      m.setAttribute('stroke-width', (LG.rightAngleW || 4) * this.typeScale());
      m.classList.add('on');
    },

    /* No plate to fit any more — the text carries its own paper halo,
       so it reads over the ruling without a box taking up the room. */
    showLegLength: function (i) {
      this.legSlots[i].len.classList.add('pop');
    },

    /* A leg whose length is written in the points' own letters — `AC =
       x2 - x1`, on the screens that name the general case. Those two
       symbols are read off the board, out of `(x2, y1)` and `(x1, y1)`,
       so they arrive from it.

       This is the screen where a child either sees that `x2` is an
       ADDRESS rather than a value, or does not, and the flight is the
       only thing on it that can say so. */
    flyIntoLeg: function (i, spec, later, at) {
      const L = this.legSlots && this.legSlots[i];
      const src = spec.lengthFrom;
      if (!L || !src || !src.length || !Game.flyInto) return 0;
      const F = C.GRID.fly, self = this, step = F.pickMs + F.ms;
      src.forEach(function (from, n) {
        later(function () { Game.flyInto({ from: from }, L.len); }, at + n * step);
      });
      return src.length * step;
    },

    /* A leg put on the board by something other than `runLegs` — the
       working, on a screen that held its triangle back until the
       substitution needed it. `placeLeg` seats one; this is what makes
       it seen. Without it the sides are measured, their lengths are
       written, and none of it is on: the group they live in is still
       switched off. */
    revealLeg: function (i, dash) {
      const L = this.legSlots && this.legSlots[i];
      if (!L) return;
      L.g.classList.add('on');
      (dash ? L.dashG : L.line).classList.add('draw');
      if (L.dot) L.dot.classList.add('pop');
    },

    clearUnits: function () {
      if (this.segGroup) this.segGroup.classList.remove('counting');
      (this.countCells || []).forEach(function (c) {
        c.g.classList.remove('on', 'lit');
        c.g.style.display = 'none';
      });
      if (this.unitBand) this.unitBand.classList.remove('on');
      if (this.unitLabel) this.unitLabel.classList.remove('on');
      this.clearEquation();
    },

    /* The worked sum, taken right off the board — text as well as
       classes, or a node still holding the last pair's digits would
       flash the moment the next one wrote its own. */
    clearEquation: function () {
      this.tweenSeq = (this.tweenSeq || 0) + 1;         // stops anything mid-journey
      (this.xParts || []).forEach(function (t) {
        t.classList.remove('on', 'lit', 'gone', 'drop');
        t.style.transform = ''; t.style.transformOrigin = '';
        t.textContent = '';
      });
      if (this.xGroup) this.xGroup.style.transform = '';
      if (this.xFly) { this.xFly.classList.remove('on', 'go'); this.xFly.textContent = ''; this.xFly.style.transform = ''; }
      if (this.xWord) { this.xWord.classList.remove('on'); this.xWord.textContent = ''; }
      if (this.xSweep) this.xSweep.classList.remove('draw');
    },

    /* Moves a piece of text by changing its own attributes, one frame at
       a time. Deliberately not a CSS transform: a transform on an SVG
       <text> is the one thing here that browsers disagree about — Safari
       has misplaced its origin, and a transition set in the same tick as
       its start never runs at all. x, y and font-size are attributes
       every browser has drawn the same way for twenty years.

       The caller pins the final values itself when the time is up, so
       the end state never depends on this having painted every frame. */
    tweenText: function (el, from, to, ms) {
      const self = this, start = performance.now();
      const token = this.tweenSeq = (this.tweenSeq || 0) + 1;
      /* cubic-bezier(.22, .61, .36, 1), solved for x by bisection */
      const ease = function (t) {
        let lo = 0, hi = 1, u = t;
        for (let i = 0; i < 14; i++) {
          u = (lo + hi) / 2;
          const x = 3 * (1 - u) * (1 - u) * u * 0.22 + 3 * (1 - u) * u * u * 0.36 + u * u * u;
          if (x < t) lo = u; else hi = u;
        }
        return 3 * (1 - u) * (1 - u) * u * 0.61 + 3 * (1 - u) * u * u + u * u * u;
      };
      const step = function () {
        if (token !== self.tweenSeq) return;             // the board was cleared
        const p = Math.min(1, (performance.now() - start) / ms), e = ease(p);
        el.setAttribute('x', from.x + (to.x - from.x) * e);
        el.setAttribute('y', from.y + (to.y - from.y) * e);
        el.setAttribute('font-size', from.size + (to.size - from.size) * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    /* Ends a tween where it was meant to end. Cancelling first matters: a
       frame already queued when the landing fires would otherwise run
       after it and drag the text back a step. */
    pinText: function (el, at) {
      this.tweenSeq = (this.tweenSeq || 0) + 1;
      el.setAttribute('x', at.x); el.setAttribute('y', at.y); el.setAttribute('font-size', at.size);
    },

    /* Where one fragment of a coordinate label sits. The label is centred
       on its point, so a part's middle is the width of everything before
       it plus half of itself — worked out from the strings rather than
       measured off the page, which would need a layout the board may not
       have done yet.

       This is what lets a digit be lifted out of the label it lives in:
       without it there is no way to know where the "3" in "(3, 2)"
       begins. */
    partSpot: function (which, part) {
      const SG = C.GRID.segment, self = this;
      const p = this.segParts && this.segParts[which];
      if (!p || !p.coord) return null;
      const kids = p.coord.children || [];
      if (!kids.length) return null;
      const size = parseFloat(p.coord.getAttribute('font-size')) || SG.coordSize;
      const widths = Array.prototype.map.call(kids, function (ts) {
        return self.textW(ts.textContent, size);
      });
      const total = widths.reduce(function (t, n) { return t + n; }, 0);
      const left = parseFloat(p.coord.getAttribute('x')) - total / 2;
      let run = 0, spot = null;
      Array.prototype.forEach.call(kids, function (ts, n) {
        if (!spot && ts.dataset && ts.dataset.part === part) {
          spot = { x: left + run + widths[n] / 2,
                   y: parseFloat(p.coord.getAttribute('y')),
                   size: size, text: ts.textContent, node: ts };
        }
        run += widths[n];
      });
      return spot;
    },

    /* Counts the segment out in unit squares, one at a time, then
       writes the total above it. Only used when a child answers
       wrongly — seeing the units is the whole point of the exercise. */
    /* The answer being made, one unit at a time.

       The child dials a number and presses Check; this counts that
       number out for them. The line grows a unit of length per beat,
       each unit it covers lights the square underneath it, and the
       total lands at the end. Nothing is drawn while the number is
       being chosen — the point of pressing Check is that this is when
       you find out, and a line that had already crept out to the
       answer would have given it away before the press.

       It is their number that gets counted, not the right one, so a
       guess that is too long walks the line straight past the point.
       That overshoot is the feedback: you can see the extra unit. */
    countOut: function (from, to, units, later, done, leg, keep) {
      const G = C.GRID, U = G.unitBox, P = G.paper;
      const self = this;
      this.clearUnits();
      this.clearMeasure();

      /* The count always runs the way it is read: left to right across
         a row, and bottom to top up a column. Which end is A and which
         is B is about naming the points, not about which way a
         measurement should travel — counting a column downwards had the
         line walking away from the origin while the numbers beside it
         climbed. */
      if (to.x < from.x || (to.x === from.x && to.y < from.y)) {
        const swap = from; from = to; to = swap;
      }

      const dx = to.x - from.x, dy = to.y - from.y;
      const span = Math.hypot(dx, dy);
      if (!span || units <= 0) { later(done, 200); return; }
      const ux = dx / span, uy = dy / span;

      /* However far past the point they go, the line stops at the edge
         of the ruled paper rather than leaving it. Solved along the
         line rather than per axis: clamping x and y separately would
         bend a diagonal off its own segment. */
      let reach = Infinity;
      if (ux > 0) reach = Math.min(reach, (P.gxTo - from.x) / ux);
      if (ux < 0) reach = Math.min(reach, (P.gxFrom - from.x) / ux);
      if (uy > 0) reach = Math.min(reach, (P.gyTo - from.y) / uy);
      if (uy < 0) reach = Math.min(reach, (P.gyFrom - from.y) / uy);
      const steps = Math.max(1, Math.min(units, Math.floor(reach + 1e-9)));

      /* Their number is walked out, right or wrong. The line IS the
         answer they gave: short of the point, on it, or a unit past
         it, and seeing where it stops is the whole of the feedback.
         Taking it away the moment it was wrong read as the board
         deleting their answer. */
      for (let n = 1; n <= steps; n++) {
        (function (k) {
          later(function () {
            self.drawMeasure(from, from.x + ux * k, from.y + uy * k);
            SFX.tick(k);
          }, (k - 1) * U.stepMs);
        })(n);
      }

      /* And a wrong one is walked BACK. It is held at its wrong length
         long enough to be read, then travels home to the point it
         started from — quicker going back than coming out, because it
         is not being counted, it is being cleared — and only then does
         the beat hand over to the squares. The number is never
         written: the line may show a wrong length, but the board must
         not assert one. */
      if (!keep) {
        const out = steps * U.stepMs;
        const back = U.missStepMs == null ? 110 : U.missStepMs;
        const hold = U.missHoldMs == null ? 620 : U.missHoldMs;
        for (let n = steps - 1; n >= 0; n--) {
          (function (k) {
            later(function () {
              if (k === 0) self.clearMeasure();
              else self.drawMeasure(from, from.x + ux * k, from.y + uy * k);
            }, out + hold + (steps - 1 - k) * back);
          })(n);
        }
        later(done, out + hold + steps * back + 160);
        return;
      }

      later(function () {
        /* Measuring a leg? Then the total IS that leg's length, and it
           belongs on the leg rather than on the board's own label —
           written once, where it stays.

           Only when the number is right. The line walking past the
           point is the feedback for a guess that is too long and it
           costs nothing; a NUMBER written on a side of the drawing is
           the board asserting a length, and the board must never
           assert a wrong one. "2 units" used to go against a leg that
           is 4 long, in the leg's own colour, in the place a correct
           length goes. */
        if (keep) {
          if (leg == null || !self.showLegTotal(leg, units, from, to)) {
            self.showUnitTotal(from, ux, uy, steps, units);
          }
          SFX.chime();
        }
        done();
      }, steps * U.stepMs + 140);
    },

    /* "N units", where N is the number they chose. Above a horizontal
       count, above the top of a vertical column, and out to the free
       side of a diagonal — never on an axis. */
    /* Every line actually drawn on the board right now, with the width
       it is drawn at. A measurement written across another side reads as
       belonging to that side, so this is what a total has to keep off. */
    drawnLines: function () {
      const out = [], LG = C.GRID.leg;
      const get = function (n, w) {
        return { x1: +n.getAttribute('x1'), y1: +n.getAttribute('y1'),
                 x2: +n.getAttribute('x2'), y2: +n.getAttribute('y2'), w: w };
      };
      if (this.segGroup && this.segGroup.classList.contains('on') &&
          this.segLine.classList.contains('draw'))
        out.push(get(this.segLine, C.GRID.segment.lineWidth));
      (this.legSlots || []).forEach(function (L) {
        if (!L.g.classList.contains('on')) return;
        const dashed = L.dashG && L.dashG.style.display !== 'none';
        const node = dashed ? L.dashG : L.line;
        if (node.classList.contains('draw')) out.push(get(dashed ? L.dash : L.line, LG.width));
      });
      return out;
    },

    /* Does any of them pass through this box? The segment is clipped
       against the box — Liang-Barsky — with the stroke's own half-width
       as a margin, so a line grazing an edge counts as crossing it. */
    onALine: function (cx, cy, w, h) {
      return this.drawnLines().some(function (L) {
        const m = L.w / 2 + 3;
        const l = cx - w/2 - m, r = cx + w/2 + m, t = cy - h/2 - m, b = cy + h/2 + m;
        let t0 = 0, t1 = 1;
        const dx = L.x2 - L.x1, dy = L.y2 - L.y1;
        const clip = function (p, q) {
          if (p === 0) return q >= 0;
          const u = q / p;
          if (p < 0) { if (u > t1) return false; if (u > t0) t0 = u; }
          else       { if (u < t0) return false; if (u < t1) t1 = u; }
          return true;
        };
        return clip(-dx, L.x1 - l) && clip(dx, r - L.x1) &&
               clip(-dy, L.y1 - t) && clip(dy, b - L.y1);
      });
    },

    /* The spot a total wants, or the nearest one to it that is not on a
       line. Tries where it was put, then the mirror of that across its
       own line, then walks both of those along the span — so it stays
       between the two points and near the line it belongs to either
       way. Gives the wanted spot back if nothing is clear, because a
       total somewhere is better than none. */
    clearOfLines: function (mx, my, ox, oy, w, h) {
      const G = C.GRID;
      const ax = -oy, ay = ox;                       // along the line
      const n = Math.hypot(ax, ay) || 1;
      const sx = (ax / n) * G.stepX * 0.5, sy = (ay / n) * G.stepY * 0.5;
      const tries = [];
      [1, -1].forEach(function (side) {
        for (let k = 0; k <= 2; k++) {
          tries.push([mx + ox * side + sx * k, my + oy * side + sy * k]);
          if (k) tries.push([mx + ox * side - sx * k, my + oy * side - sy * k]);
        }
      });
      for (let i = 0; i < tries.length; i++) {
        if (!this.onALine(tries[i][0], tries[i][1], w, h)) return tries[i];
      }
      return [mx + ox, my + oy];
    },

    /* The two coordinate labels, as boxes, for anything that has to
       keep out of their way. They sit close to their own points on
       purpose, so they are the fixed thing here and whatever else wants
       that space is what gives. */
    coordBoxes: function () {
      const SG = C.GRID.segment, self = this;
      if (!this.segParts) return [];
      return ['a', 'b'].map(function (k) {
        const c = self.segParts[k] && self.segParts[k].coord;
        if (!c || !(c.textContent || '').trim()) return null;
        const w = self.textW(c.textContent, SG.coordSize);
        const x = parseFloat(c.getAttribute('x')), y = parseFloat(c.getAttribute('y'));
        if (!isFinite(x) || !isFinite(y)) return null;
        return { l: x - w/2, r: x + w/2, t: y - SG.coordSize/2, b: y + SG.coordSize/2 };
      }).filter(Boolean);
    },

    /* A length written along a span, moved off the coordinates if it
       has landed on them. A short span is the case: three units apart
       leaves less room between the two labels than "3 units" needs, so
       there is no height above the line where all three fit.

       It tries the far side of the line first — the coordinates are
       over the points, so under them is clear — and only steps further
       out if that is taken too. Both keep it square to the span and the
       same distance along it. */
    clearOfCoords: function (lx, ly, mx, my, w, h) {
      const boxes = this.coordBoxes();
      if (!boxes.length) return [lx, ly];
      const air = 6;
      const hits = function (x, y) {
        return boxes.some(function (b) {
          return x - w/2 < b.r + air && x + w/2 > b.l - air &&
                 y - h/2 < b.b + air && y + h/2 > b.t - air;
        });
      };
      if (!hits(lx, ly)) return [lx, ly];
      const dx = lx - mx, dy = ly - my;
      if (!hits(mx - dx, my - dy)) return [mx - dx, my - dy];   // the far side
      const len = Math.hypot(dx, dy) || 1;
      for (let i = 1; i <= 8; i++) {
        const x = lx + (dx/len) * 14 * i, y = ly + (dy/len) * 14 * i;
        if (!hits(x, y)) return [x, y];
      }
      return [lx, ly];
    },

    showUnitTotal: function (from, ux, uy, steps, units, quiet) {
      const G = C.GRID, U = G.unitBox, P = G.paper;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const txt = units + '\u00A0unit' + (units === 1 ? '' : 's');
      const end = { x: from.x + ux * steps, y: from.y + uy * steps };
      let lx, ly;
      if (ux && uy) {            // a diagonal
        /* Beside the middle of the line, on the side away from the
           right-angled corner — the other side is where its two legs
           and their own labels are. */
        const sx = px(from.x), sy = py(from.y), ex = px(end.x), ey = py(end.y);
        const len = Math.hypot(ex - sx, ey - sy) || 1;
        const nx = -(ey - sy) / len, ny = (ex - sx) / len;
        const mx = (sx + ex) / 2, my = (sy + ey) / 2;
        const corner = { x: px(end.x), y: py(from.y) };
        const away = ((corner.x - mx) * nx + (corner.y - my) * ny) > 0 ? -1 : 1;
        let gap = U.diagGap;
        /* A segment whose middle falls on the x-axis puts its total in
           the row of numbers under it at the ordinary offset; pushed
           twice as far along the same perpendicular it clears them
           without crossing to the legs' side. */
        if (this.onXAxisRow(my + ny * away * gap, U.labelSize)) gap *= 2;
        lx = mx + nx * away * gap;
        ly = my + ny * away * gap;
      } else if (ux) {           // along a row
        lx = (px(from.x) + px(end.x)) / 2;
        ly = py(from.y) + U.labelDy;
      } else {                   // down a column
        /* Beside the middle of the span, not stranded above the top of
           it. A vertical answer written level with the highest point
           reads as belonging to that point rather than to the distance
           between the two.

           Which side is decided by what fits, not by a rule: cleared by
           its own half-width so it never crosses the line, on the far
           side from the y-axis where there is room, and on the near
           side where there is not — a column out at x=6 has nothing to
           its right. */
        const uw0 = this.textW(txt, U.labelSize);
        const gap = uw0 / 2 + G.stepX * 0.24;
        const edge = (P.frameW + P.hiW) + 10;
        const fits = function (c) { return (c - uw0 / 2) >= edge && (c + uw0 / 2) <= G.w - edge; };
        const out = from.x >= 0 ? 1 : -1;
        const away = px(from.x) + out * gap, back = px(from.x) - out * gap;
        lx = fits(away) ? away : back;
        ly = (py(from.y) + py(end.y)) / 2;
        /* A column that straddles the x-axis has its middle in the row
           the axis numbers live in — (1,-3) to (1,2) is centred on
           y=-0.5. Step it clear, a cell at a time; it stays beside the
           line either way. */
        let guard = 0;
        while (this.onXAxisRow(ly, U.labelSize) && guard++ < 3) ly -= G.stepY;
      }
      const uw = this.textW(txt, U.labelSize);
      /* Nowhere near a line that is already drawn. mx,my is the point on
         its own line this was measured from; lx,ly is where it wanted to
         go, so the difference is the offset to try the other way. */
      const mid = (ux && uy)
        ? [(px(from.x) + px(end.x)) / 2, (py(from.y) + py(end.y)) / 2]
        : (ux ? [(px(from.x) + px(end.x)) / 2, py(from.y)]
              : [px(from.x), (py(from.y) + py(end.y)) / 2]);
      const spot = this.clearOfLines(mid[0], mid[1], lx - mid[0], ly - mid[1],
                                     uw, U.labelSize);
      lx = spot[0]; ly = spot[1];
      const free = this.clearOfCoords(lx, ly, mid[0], mid[1], uw, U.labelSize);
      lx = free[0]; ly = free[1];
      const X0 = this.clampX(this.clearOfYAxis(lx, uw), uw);
      const Y0 = this.clampY(ly, U.labelSize);
      /* `quiet` works the spot out without writing anything there, so a
         length arrived at by working and one counted out land in exactly
         the same place on the very same pair. */
      if (quiet) return { x: X0, y: Y0, text: txt, w: uw };
      this.unitLabel.setAttribute('x', X0);
      this.unitLabel.setAttribute('y', Y0);
      this.unitLabel.textContent = txt;
      this.unitLabel.classList.add('on');
      return { x: X0, y: Y0, text: txt, w: uw };
    },

    /* The unit squares between the two points, as one band a single
       cell deep lying along the line. It hangs on the side facing the
       axis the segment runs parallel to, which is the side the child
       counts against and the side that cannot run off the board. */
    showUnitBand: function (from, to) {
      const G = C.GRID, U = G.unitBox, b = this.unitBand;
      if (!b) return;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const x0 = Math.min(from.x, to.x), x1 = Math.max(from.x, to.x);
      const y0 = Math.min(from.y, to.y), y1 = Math.max(from.y, to.y);
      let L, T, W, Hh;
      if (from.y === to.y) {                       // a row
        const down = from.y > 0 ? 1 : -1;          // toward the x-axis
        L = px(x0); W = px(x1) - px(x0);
        T = Math.min(py(from.y), py(from.y - down));
        Hh = G.stepY;
      } else {                                     // a column
        const side = from.x > 0 ? -1 : 1;          // toward the y-axis
        T = py(y1); Hh = py(y0) - py(y1);
        L = Math.min(px(from.x), px(from.x + side));
        W = G.stepX;
      }
      b.setAttribute('x', L); b.setAttribute('y', T);
      b.setAttribute('width', Math.abs(W)); b.setAttribute('height', Math.abs(Hh));
      b.classList.add('on');
    },

    /* The guided count, for a child who has missed twice: the unit
       squares between the two points light one at a time, each with how
       many there are so far written under it, and then the whole thing
       clears and plays again. It is the answer to "count the spaces",
       shown at the speed you would count them out loud. */
    countUnits: function (from, to, later) {
      const G = C.GRID, U = G.unitBox, UC = U.count;
      if (!this.countCells || !this.countCells.length) return 0;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const self = this;
      const row = from.y === to.y;
      const n = Math.min(UC.slots,
        row ? Math.abs(to.x - from.x) : Math.abs(to.y - from.y));
      if (!n) return 0;

      /* On the side the child counts against — the one facing the axis
         the pair runs along, which is also the side that cannot run off
         the board. The same rule the single band used. */
      const step = row ? (to.x > from.x ? 1 : -1) : (to.y > from.y ? 1 : -1);
      const down = row ? (from.y > 0 ? 1 : -1) : 0;
      const side = row ? 0 : (from.x > 0 ? -1 : 1);

      /* The coordinates hang under their points, which is exactly where
         the squares are — so while the spaces are being counted they
         step back out of them. They are the context, not the thing
         being counted. */
      if (this.segGroup) this.segGroup.classList.add('counting');

      this.countCells.forEach(function (c, i) {
        if (i >= n) { c.g.classList.remove('on', 'lit'); c.g.style.display = 'none'; return; }
        c.g.style.display = '';
        c.g.classList.remove('on', 'lit');
        let L, T, W, H, nx, ny;
        if (row) {
          const a = from.x + step * i, b = a + step;
          L = Math.min(px(a), px(b)); W = Math.abs(px(b) - px(a));
          T = Math.min(py(from.y), py(from.y - down)); H = G.stepY;
        } else {
          const a = from.y + step * i, b = a + step;
          T = Math.min(py(a), py(b)); H = Math.abs(py(b) - py(a));
          L = Math.min(px(from.x), px(from.x + side)); W = G.stepX;
        }
        /* In the square, not beside it. A number hung outside the box
           is a label on it; a number in it is the count of it, which
           is the whole of what "count the spaces" asks for. */
        nx = L + W / 2; ny = T + H / 2;
        c.box.setAttribute('x', L); c.box.setAttribute('y', T);
        c.box.setAttribute('width', W); c.box.setAttribute('height', H);
        c.num.setAttribute('x', nx); c.num.setAttribute('y', ny);
        c.num.textContent = String(i + 1);
      });

      /* Played more than once on purpose: the first time through says
         what is happening, the second is the one they count along with. */
      const cycle = n * UC.stepMs + UC.readMs + UC.gapMs;
      let t = 0;
      for (let pass = 0; pass < UC.passes; pass++) {
        for (let k = 0; k < n; k++) {
          (function (k) {
            later(function () {
              const c = self.countCells[k];
              c.g.classList.add('on', 'lit');
              SFX.tick(k);
            }, t + k * UC.stepMs);
          })(k);
        }
        later(function () {
          self.countCells.forEach(function (c) { c.g.classList.remove('on', 'lit'); });
        }, t + n * UC.stepMs + UC.readMs);
        t += cycle;
      }
      return t;
    },

    /* Seats a segment's two points, its line and its four labels. */
    /* `into` names which set of nodes to write into. Left out, it is the
       board's own pair — every caller in the game. Given an example slot,
       the very same placement runs against that slot's nodes instead,
       which is the point: a pair recalled on a later screen is laid out
       by the code that laid it out the first time, so it cannot drift
       from how the child saw it. */
    placeSegment: function (spec, into) {
      const G = C.GRID, SG = G.segment;
      /* The paper is ordinarily made by the first screen that shows it,
         and every screen after inherits it. The picker breaks that: a
         jump from the title beat straight into the middle of the lesson
         asks for a pair to be drawn on paper nobody has made yet. Make
         it — `build` only ever runs once. */
      if (!into) this.build();
      const T = into || this;
      if (!T.segLine) return;
      /* A fresh pass over what is inked. Only for the board's own pair:
         an example slot is a small picture of its own and is laid out
         against nothing. */
      if (!into) {
        this.startLabelPass();
        const GG = C.GRID;
        const qx = function (v) { return GG.originX + v * GG.stepX; };
        const qy = function (v) { return GG.originY - v * GG.stepY; };
        this.inkLine(qx(spec.a.x), qy(spec.a.y), qx(spec.b.x), qy(spec.b.y), 'the pair');
        (this.legPlaced || []).forEach(function (L, i) {
          if (L) this.inkLine(qx(L.from.x), qy(L.from.y), qx(L.to.x), qy(L.to.y), 'leg ' + i);
        }, this);
        const dr = C.GRID.segment.dotR + 4;
        [spec.a, spec.b].concat((this.legPlaced || []).filter(Boolean).map(function (L) { return L.to; }))
          .forEach(function (pt) {
            this.inkBox(qx(pt.x) - dr, qy(pt.y) - dr, qx(pt.x) + dr, qy(pt.y) + dr, 'a point');
          }, this);
      }
      /* A length written on the last pair does not belong to this one.
         Screens that keep their segment never come through here, so a
         measurement stays up across the beats that talk about it and
         goes the moment the points change.

         Unless this IS the pair that is already up — `relabel` puts the
         same spec back through here on every frame of a push-in, and a
         length wiped sixty times a second is a length nobody sees. */
      if (T.segRes && spec !== this.lastPlotted) {
        T.segRes.classList.remove('pop');
        T.segRes.textContent = '';
      }
      const NS2 = 'http://www.w3.org/2000/svg';
      const a = spec.a, b = spec.b;
      /* The pair currently drawn. The beat that argues about a segment
         inherits it rather than declaring one, so this is the only way
         it can find out what it is arguing about. */
      /* Only the board's own pair is the one the game is about; an
         example is a picture of a pair that was settled screens ago. */
      /* A new pair forgets which side the last one's labels were on —
         the side is held so a label does not hop during a push-in, and
         holding it across a change of pair would carry one pair's
         layout onto another. */
      if (!into && spec !== this.lastPlotted) {
        ['a', 'b'].forEach(function (k) { if (T.segParts[k]) T.segParts[k].heldDir = null; });
      }
      if (!into) { this.lastPlotted = spec; this.markCrossing(); }
      // a screen can recolour the segment — red once it closes a triangle
      T.segLine.setAttribute('stroke', spec.color || SG.lineColor);
      T.segLine.style.color = spec.color || SG.lineColor;   // for its own glow
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const self = this;
      /* Everything typographic is worked out at the size the camera is
         actually setting it, not at the size the config names. */
      const tk = this.typeScale(), gap = SG.coordGap * tk;

      T.segLine.setAttribute('x1', px(a.x)); T.segLine.setAttribute('y1', py(a.y));
      T.segLine.setAttribute('x2', px(b.x)); T.segLine.setAttribute('y2', py(b.y));

      /* Same two ends for the dashed guide; it grows out of A, so the
         group's origin is pinned there. */
      /* An example carries no guide: it is only ever shown finished. */
      if (T.segDash) {
      T.segDash.setAttribute('x1', px(a.x)); T.segDash.setAttribute('y1', py(a.y));
      T.segDash.setAttribute('x2', px(b.x)); T.segDash.setAttribute('y2', py(b.y));
      /* It grows from the left-hand end, so the guide always reads left
         to right — the order the pair is read in — rather than from
         whichever point the screen happened to call `a`. A column has
         no left and right, so that one grows upward from its lower
         point. */
      const from = (a.x === b.x) ? (a.y <= b.y ? a : b) : (a.x <= b.x ? a : b);
      T.segDashG.style.transformOrigin = px(from.x) + 'px ' + py(from.y) + 'px';
      }
      const len = Math.hypot(px(b.x) - px(a.x), py(b.y) - py(a.y));
      T.segLine.setAttribute('stroke-dasharray', len);
      T.segLine.style.strokeDashoffset = len;

      /* A vertical segment stacks its points, so labels above and
         below would collide with each other. Those go to the sides. */
      const vertical = (a.x === b.x);
      // face the labels away from the y-axis, or they sit on its numbers
      const side = (a.x >= 0) ? 1 : -1;

      /* Where a row's labels go is decided once, for the pair — never
         once per point. A label with no room beside its own point used
         to drop under it on its own, which left the two points on one
         board labelled two different ways: one level, one below. The
         child reads that as the two points meaning different things.
         So if either of them cannot take its own side, both go over
         their points instead, and they stay a matched pair.

         Over, not under: it is where the labels already are when the
         child taps the points out, so a pair carried onto the distance
         question does not shuffle, and it keeps the space beneath the
         line free for the count-out to hang its squares in. */
      const label = function (p) {
        return p.coordParts ? p.coordParts.map(function (f) { return f.t; }).join('')
                            : (p.coordText || ('(' + numText(p.x) + ',\u00A0' + numText(p.y) + ')'));
      };
      let stacked = false;
      if (!vertical && spec.coordSide) {
        /* A screen can say which side of the points its coordinates go.
           The beats that work the subtraction want them under, because
           the space above the line is where the working happens and the
           length it produces is written. */
        stacked = spec.coordSide;
      } else if (!vertical && spec.coordDy == null) {
        stacked = [a, b].some(function (p) {
          const mate = (p === a) ? b : a;
          const w = self.textW(label(p), SG.coordSize * self.typeScale());
          const want = px(p.x) + (p.x < mate.x ? -1 : 1) *
                       (SG.dotR + SG.coordFit + w / 2);
          return Math.abs(self.clampX(want, w) - want) > 0.5;   // had to be pulled back
        });
        /* And if over the point is where the x-axis numbering is, the
           pair goes under instead — again together. */
        if (stacked && [a, b].some(function (p) {
          return self.onXAxisRow(py(p.y) + G.found.labelDy, SG.coordSize * self.typeScale());
        })) stacked = 'under';
      }

      [['a', a], ['b', b]].forEach(function (pair) {
        const key = pair[0], p = pair[1], part = T.segParts[key];
        const X = px(p.x), Y = py(p.y);
        part.dot.setAttribute('cx', X);  part.dot.setAttribute('cy', Y);

        /* A point something else on the board already names. Two lines
           that share an end — the two walks out of Maya's house — each
           want to label it, and the second lands exactly on the first.
           The dot is drawn (it is an end of this line too, and it is
           the same dot in the same place), and nothing is written. */
        if (p.quiet) {
          part.coord.textContent = '';
          part.name.textContent = '';
          return;
        }

        const mate = (p === spec.a) ? spec.b : spec.a;
        /* What this label will say, worked out before it is placed
           rather than read off the node — which still holds the last
           screen's words at this point. */
        const ctext = p.coordParts
          ? p.coordParts.map(function (f) { return f.t; }).join('')
          : (p.coordText || ('(' + numText(p.x) + ',\u00A0' + numText(p.y) + ')'));

        /* The words go in before the block is placed, so what is
           measured is what will be read.

           Only when they have actually changed: rebuilding the label
           rewrites its fragments, and a fragment lit by `glowPart` is a
           node — rebuild it under the highlight and the light goes
           out. */
        if (part.coord.textContent === ctext) { /* the same words, still there */ }
        else {
          while (part.coord.firstChild) part.coord.removeChild(part.coord.firstChild);
          if (p.coordParts) {
            p.coordParts.forEach(function (f) {
              const ts = document.createElementNS(NS2, 'tspan');
              ts.textContent = f.t;
              /* `glow` may be true, or the name of the part it is — 'x'
                 or 'y' — so a screen can light the y halves of both
                 labels and then the x halves, which is the whole of the
                 argument that the distance is one minus the other. */
              if (f.glow) {
                ts.classList.add('glowable');
                if (typeof f.glow === 'string') ts.dataset.part = f.glow;
              }
              part.coord.appendChild(ts);
            });
          } else {
            part.coord.textContent = ctext;
          }
        }
        /* Its own if it has one, else whatever the board was told to
           call it while this same pair was already up. */
        const ntxt = p.name || (!into && self.namedAs ? (self.namedAs[key] || '') : '');
        part.name.textContent = ntxt;

        /* Away from the drawing: the direction from the middle of what
           is drawn, out through this point. A label that goes that way
           is outside the shape rather than in its fill, which is the
           whole of why a corner's letter used to float in the middle of
           its own triangle. */
        let away = { x: X - (px(a.x) + px(b.x)) / 2, y: Y - (py(a.y) + py(b.y)) / 2 };
        const legs = self.legPlaced || [];
        if (legs[0] && legs[1]) {
          const mx = (px(a.x) + px(b.x) + px(legs[0].to.x)) / 3;
          const my = (py(a.y) + py(b.y) + py(legs[0].to.y)) / 3;
          away = { x: X - mx, y: Y - my };
        }
        if (!away.x && !away.y) away = { x: 1, y: -1 };

        /* No hand-placed exceptions any more. The one that was left
           pushed the rescue vehicle's coordinates two and a half cells
           off their own point, because the rule could not then see the
           axis letters and would have written (0, 0) into the y. It can
           see them now, so the rule does it — and a screen that still
           reads better by hand is a fault in the rule to go and find. */
        self.placePointLabel(part, p, X, Y,
                             { ctext: ctext, ntext: ntxt, away: away,
                               at: p.x + ',' + p.y });
      });
    },

    /* The subtraction, worked on the board out of the coordinates it
       comes from — and then handed back to the line as its length.

       The order is the lesson. The two y-halves light first and let go,
       because they match and so play no part. Then the smaller x is
       lifted out of its own label into the back of the sum, then the
       larger into the front; only once both are up does the operator
       appear between them, then the equals, then the answer. Finally the
       answer leaves the sum and comes down to the middle of the span,
       where the word "units" is written after it.

       Nothing here moves an original, and nothing on the grid or the
       axes is touched. Each digit is copied into a travelling node that
       is discarded the moment the sum's own part takes over, so the
       coordinates are untouched from beginning to end. */
    runEquation: function (later, done) {
      const G = C.GRID, X = G.xeq, U = G.unitBox, SG = G.segment, self = this;
      const sp = this.lastPlotted;
      if (!this.xParts || !sp || !sp.a || !sp.b) { if (done) later(done, 0); return 0; }
      this.clearEquation();
      /* The beat before leaves both x-halves lit, and a sequence whose
         first move is "these two match" cannot open on a board where
         everything is already glowing. */
      this.glowPart(null, false);

      const row = sp.a.y === sp.b.y;
      const part = row ? 'x' : 'y';
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };

      const va = row ? sp.a.x : sp.a.y, vb = row ? sp.b.x : sp.b.y;
      const bigger = va >= vb ? 'a' : 'b', smaller = va >= vb ? 'b' : 'a';
      /* Taken in the order the sum is read — and said. "Six minus three"
         fetches the six first, so the front of the sum fills before the
         back, and the child hears the order they are watching. It is not
         the order the points sit in: on this row the six is the
         right-hand point. On a column the two happen to agree, the
         larger y being the upper point.

         The board is still read left to right and top to bottom, and the
         sweep below keeps to that — what is drawn along the pair is
         about the pair, not about the sum. */
      const firstRead = row ? (sp.a.x <= sp.b.x ? 'a' : 'b')
                            : (sp.a.y >= sp.b.y ? 'a' : 'b');
      const secondRead = firstRead === 'a' ? 'b' : 'a';
      const slotOf = function (which) { return which === bigger ? 0 : 2; };
      const hi = Math.max(va, vb), lo = Math.min(va, vb);
      const units = Math.abs(hi - lo);

      /* Laid out in full before anything is shown, so every part knows
         where it is going and nothing reflows as the sum is assembled. */
      /* A negative is bracketed in the sum, so it reads "2 − (-3)" and
         never "2 − -3". The copy that travels out of the label carries
         just the number; the brackets are the sum's own and appear when
         it lands. */
      const loTxt = lo < 0 ? '(' + numText(lo) + ')' : numText(lo);
      const text = [numText(hi), '\u2212', loTxt, '=', numText(units)];
      /* textW's flat width per character is fine for digits, but brackets
         and the minus are narrow glyphs — at a flat width "(-3)" claims
         half again the room it fills and the sum reads with holes round
         it. Weighed glyph by glyph here, so the parts sit evenly. */
      const glyphW = function (t) {
        return Array.prototype.reduce.call(String(t), function (acc, ch) {
          return acc + (/[()]/.test(ch) ? 0.33 : /[-\u2212=]/.test(ch) ? 0.5 : 0.58);
        }, 0) * X.size;
      };
      const w = text.map(glyphW);
      const whole = w.reduce(function (t, n) { return t + n; }, 0) + X.gap * 4;
      const midX = (px(sp.a.x) + px(sp.b.x)) / 2;
      let left, stageY;
      if (row) {
        /* Centred on the pair, but pushed off the y-axis where the pair
           sits beside it — a row whose middle falls on the axis would
           otherwise lay the sum straight across its numbering. */
        left = this.clampX(this.clearOfYAxis(midX, whole), whole) - whole / 2;
        /* And above whatever is up there — the higher point, or its
           coordinates if they are written over it. The row writes its
           coordinates under its points, so the sum comes down into the
           space they left. */
        let topY = Math.min(py(sp.a.y), py(sp.b.y));
        ['a', 'b'].forEach(function (k) {
          const c = self.segParts && self.segParts[k] && self.segParts[k].coord;
          if (!c || !c.textContent) return;
          const cy = parseFloat(c.getAttribute('y'));
          if (isFinite(cy)) topY = Math.min(topY, cy - SG.coordSize / 2);
        });
        stageY = this.clampY(topY - G.stepY * X.stageUp, X.size);
      } else {
        /* A column is worked below the x-axis instead: down past the
           axis and the numbers under it, and off to the side the column
           is not on. Over the top of a column the sum is a long way from
           the pair and hard against the frame; under the axis it sits in
           the quarter of the board a column always leaves empty. */
        const numbers = G.labelGap + G.labelSize * 0.42 + G.labelSize / 2;
        stageY = this.clampY(py(0) + numbers + G.stepY * X.underDown, X.size);
        /* Clear of the column itself, on whichever side has the room. */
        const gapX = G.stepX * X.underGap;
        const colX = px(sp.a.x);
        const toRight = colX + gapX;
        const toLeft = colX - gapX - whole;
        left = (toRight + whole <= G.w - 8) ? toRight : toLeft;
        left = this.clampX(left + whole / 2, whole) - whole / 2;
      }

      let run = 0;
      const at = w.map(function (width) {
        const cx = left + run + width / 2;
        run += width + X.gap;
        return cx;
      });
      this.xParts.forEach(function (t, n) {
        t.setAttribute('x', at[n]);
        t.setAttribute('y', stageY);
        t.setAttribute('font-size', X.size);   // the answer came down smaller last time
        t.textContent = text[n];
      });

      /* Where the finished length belongs: the very spot the count-out
         writes its total, which already keeps clear of the coordinate
         labels and of everything drawn. */
      const ux = row ? (sp.b.x > sp.a.x ? 1 : -1) : 0;
      const uy = row ? 0 : (sp.b.y > sp.a.y ? 1 : -1);
      const spot = this.showUnitTotal(sp.a, ux, uy, units, units, true);
      const wNum = this.textW(String(units), U.labelSize);
      const wWord = this.textW('units', U.labelSize);
      const both = wNum + X.gap + wWord;
      const numCx = spot.x - both / 2 + wNum / 2;
      this.xWord.setAttribute('x', spot.x - both / 2 + wNum + X.gap);
      this.xWord.setAttribute('y', spot.y);
      this.xWord.style.setProperty('--pen', X.wordMs + 'ms');
      this.xWord.textContent = 'units';

      /* the sweep, lying along the pair but drawn separately */
      const l2r = sp[firstRead], r2l = sp[secondRead];
      const len = Math.hypot(px(r2l.x) - px(l2r.x), py(r2l.y) - py(l2r.y));
      this.xSweep.setAttribute('x1', px(l2r.x)); this.xSweep.setAttribute('y1', py(l2r.y));
      this.xSweep.setAttribute('x2', px(r2l.x)); this.xSweep.setAttribute('y2', py(r2l.y));
      this.xSweep.setAttribute('stroke-dasharray', len);
      this.xSweep.style.strokeDashoffset = len;
      this.xSweep.style.setProperty('--sweep', X.sweepMs + 'ms');

      /* Carries a copy of one digit out of its label and up into the sum,
         then hands over to the sum's own part and gets out of the way. */
      const lift = function (which, slot, t0) {
        const from = self.partSpot(which, part);
        later(function () {
          /* Everything off first: handing straight from one digit to the
             next left both lit for the frame they crossed on. */
          self.glowPart(null, false);
          self.glowPart(part, true, which);
          SFX.tick(2);
        }, t0);
        later(function () {
          if (!from) { self.xParts[slot].classList.add('on'); return; }
          const f = self.xFly;
          f.textContent = from.text;
          /* It starts life exactly over the digit it was copied from, at
             that digit's size, and is carried to its slot by moving its
             own x, y and font-size — no CSS transform anywhere, so there
             is nothing for a browser to misplace or fail to start. */
          f.setAttribute('x', from.x);
          f.setAttribute('y', from.y);
          f.setAttribute('font-size', from.size);
          f.classList.add('on');
          self.tweenText(f, { x: from.x, y: from.y, size: from.size },
                            { x: at[slot], y: stageY, size: X.size }, X.flyMs);
        }, t0 + X.pickMs);
        later(function () {
          const f = self.xFly;                 // pin the end, whatever was painted
          self.pinText(f, { x: at[slot], y: stageY, size: X.size });
          self.xParts[slot].classList.add('on', 'lit');
          f.classList.remove('on');
          self.glowPart(part, false, which);
          SFX.blip();
        }, t0 + X.pickMs + X.flyMs);
      };

      let t = 0;
      /* 1 — nothing. The halves that match were lit two beats ago, on
         the screen whose whole line was "the y-coordinates are the
         same", and lighting them again here said it a third time and
         made the child look back at something already settled. A
         highlight that is finished with does not come back; the board
         opens on the beat that is actually new. */

      /* 2 and 3 — the smaller first, into the back of the sum, then the
         larger into the front. Taken in the order they are read off the
         board; assembled in the order the sum is read. */
      lift(bigger, slotOf(bigger), t);
      t += X.pickMs + X.flyMs;
      lift(smaller, slotOf(smaller), t);
      t += X.pickMs + X.flyMs + X.settleMs;

      // 4 — the sum assembled between them, a piece at a time
      later(function () { self.xParts[1].classList.add('on'); SFX.tick(3); }, t);
      t += X.opMs;
      later(function () { self.xParts[3].classList.add('on'); SFX.tick(4); }, t);
      t += X.eqMs;
      later(function () { self.xParts[4].classList.add('on', 'lit'); SFX.chime(); }, t);
      t += X.resMs + X.readMs;

      // 5 — and what it measures, lit from one end of the pair to the other
      later(function () { self.xSweep.classList.add('draw'); SFX.draw(); }, t);
      t += X.sweepMs + X.holdMs;

      /* 6 — the answer leaves the sum and comes down to the line. The
         same node the child watched being worked out, not a second one
         fading in; the rest of the sum goes with it, because "6 - 3 ="
         left hanging without its answer reads as broken. */
      later(function () {
        const a = self.xParts[4];
        a.classList.add('drop');
        self.tweenText(a, { x: at[4], y: stageY, size: X.size },
                          { x: numCx, y: spot.y, size: U.labelSize }, X.dropMs);
        [0, 1, 2, 3].forEach(function (n) { self.xParts[n].classList.add('gone'); });
        SFX.blip();
      }, t);
      t += X.dropMs;

      // 7 — landed, pinned, and the word is written after it
      later(function () {
        const a = self.xParts[4];
        self.pinText(a, { x: numCx, y: spot.y, size: U.labelSize });
        self.xWord.classList.add('on'); SFX.draw();
      }, t);
      t += X.wordMs;
      later(function () { if (done) done(); }, t + 200);
      return t + 200;
    },

    /* Lights the fragments named `part` — of one point, or of both.
       Passing no name lights every glowable fragment, which is what the
       axis cases want. */
    glowPart: function (part, on, which) {
      const self = this;
      (which ? [which] : ['a', 'b']).forEach(function (k) {
        const c = self.segParts[k] && self.segParts[k].coord;
        if (!c) return;
        Array.prototype.forEach.call(c.children, function (ts) {
          if (!ts.classList || !ts.classList.contains('glowable')) return;
          if (part && ts.dataset && ts.dataset.part !== part) return;
          ts.classList.toggle('glow', !!on);
        });
      });
    },

    /* Makes the y-parts of both coordinate labels glow. */
    glowCoords: function (on) {
      const self = this;
      ['a', 'b'].forEach(function (k) {
        const c = self.segParts[k].coord;
        Array.prototype.forEach.call(c.children, function (ts) {
          if (ts.classList && ts.classList.contains('glowable')) {
            ts.classList.toggle('glow', !!on);
          }
        });
      });
    },

    /* Highlights the segment and writes the answer on it. */
    /* dx slides the plate along the segment: a segment centred on the
       origin would otherwise drop its answer straight onto the y-axis
       and the -1 beside it. */
    /* How long the pair is, written on the pair.

       Its place is not a decision a screen should have to make. A
       length belongs in the middle of the span it measures — that is
       what tells the child it is the distance between those two points
       and not a remark about one of them — so unless a caller says
       otherwise that is where it goes: square in the middle, out to the
       side by the same air a coordinate keeps from its dot, and then
       slid along its own line only as far as it takes to get off the
       other axis' numbering. Never past the points: a length that has
       left the span it measures has stopped measuring it. */
    showSegResult: function (spec, text, dy, dx, into) {
      const G = C.GRID, SG = G.segment, T = into || this;
      if (!T.segLine) return;             // no paper yet; see placeSegment
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      T.segLine.classList.add('lit');
      const ax = px(spec.a.x), ay = py(spec.a.y);
      const bx = px(spec.b.x), by = py(spec.b.y);
      let X = (ax + bx) / 2, Y = (ay + by) / 2;
      if (dx == null && dy == null) {
        const size = (SG.resSize || SG.coordSize) * this.typeScale();
        const m = this.textMetrics(text, size);
        /* Ink is the right measure of the air between this and the
           things it is written beside — a dot, a line. It is the wrong
           measure of whether it has landed on the axis numbering: a
           word with no descenders would claim to clear a band it is
           sitting in, so that question is asked of the whole band a
           label of this size occupies. */
        const band = Math.max(m.h, size);
        const vertical = (ax === bx);
        const gap = SG.lineWidth / 2 + SG.resGap * this.typeScale();
        /* How far it may travel along the line before it is no longer
           between the two points. */
        const half = (vertical ? Math.abs(ay - by) : Math.abs(ax - bx)) / 2;
        const room = Math.max(0, half - (vertical ? Math.max(m.up, m.down) : m.w / 2) - SG.resInset);
        if (vertical) {
          // the side away from the y-axis, where its numbers are not
          X += (spec.a.x >= 0 ? 1 : -1) * (gap + m.w / 2);
          /* A column that straddles the x-axis has its own middle in
             the row the axis numbers live in. It steps off it, along
             its own line, away from the axis. */
          const away = (Y <= G.originY) ? -1 : 1;
          let moved = 0, guard = 0;
          while (this.onXAxisRow(Y, band) && moved < room && guard++ < 60) {
            Y += away * 6; moved += 6;
          }
        } else {
          Y -= gap + m.down;
          // over the line, unless over the line is the x-axis numbering
          if (this.onXAxisRow(Y, band)) Y = (ay + by) / 2 + gap + m.up;
          /* And a row whose middle falls on the y-axis steps aside,
             along its own line, by as much as that takes. */
          const want = this.clearOfYAxis(X, m.w);
          X += Math.max(-room, Math.min(room, want - X));
        }
        X = this.clampX(X, m.w);
        Y = this.clampY(Y, band);
      } else { X += (dx || 0); Y += (dy || 0); }
      T.segRes.textContent = text;
      /* The pair's own length goes through the rule too. An example
         slot is a picture of its own and is laid out against nothing,
         so only the board's own is seated. */
      /* A column's length is TURNED and set along its own line, the
         way a vertical leg's is. Laid across, "5 units" is written
         through the very line it measures — which is what the second
         picture shows, on the board's own pair AND on the example
         beside it. An example is laid out against nothing, so it needs
         this more than the board's own does, not less. */
      const upright = (ax === bx);
      const size2 = (SG.resSize || SG.coordSize) * this.typeScale();
      const m2 = this.textMetrics(text, size2);
      const bw2 = upright ? Math.max(m2.h, size2) : m2.w;
      const bh2 = upright ? m2.w : Math.max(m2.h, size2);
      if (upright) {
        /* Beside the line, a line's width out, on the side away from
           the y-axis so it does not land on the numbering. */
        X = ax + (spec.a.x >= 0 ? 1 : -1) * (SG.lineWidth / 2 + bw2 * 0.62);
        Y = (ay + by) / 2;
      }
      let seat2 = { x: X, y: Y };
      if (!into) {
        const perp = upright ? { x: (spec.a.x >= 0 ? 1 : -1), y: 0 }
                             : { x: 0, y: -1 };
        seat2 = this.seatLength(T.segRes, X, Y, bw2, bh2,
                        perp, T.segRes, { x: (ax + bx) / 2, y: (ay + by) / 2 });
      } else {
        T.segRes.setAttribute('x', X);
        T.segRes.setAttribute('y', Y);
      }
      const tw = T.segResTurn;
      if (tw) {
        if (upright) tw.setAttribute('transform',
                       'rotate(-90 ' + seat2.x + ' ' + seat2.y + ')');
        else tw.removeAttribute('transform');
      }
      T.segRes.classList.add('pop');
      /* No plate behind it: the text carries its own paper halo, the
         same as every other measurement written on the board. A drawn
         box round this one made it read as a different kind of thing
         from the leg lengths beside it. */
    },

    /* The widest line of a working, in stage pixels on the centred
       board — which is the one number the framing needs, and the one
       thing about the working that does not change when the camera
       moves. */
    workingWidth: function (lines) {
      const G = C.GRID, W = G.work, self = this;
      let w = 0;
      (lines || []).forEach(function (l) {
        const t = (l.parts || [{ t: l.text || '' }])
          .map(function (f) { return f.t; }).join('');
        w = Math.max(w, self.textW(t, W.size));
      });
      return w * (G.centre.w / G.w);
    },

    /* ---------------- the working, on the paper ----------------

       Laid out in the half of the view the drawing is not in, at the
       size the camera is setting, one line per row. Nothing is revealed
       here — `showWorkLine` does that, one at a time, so the child
       reads at the pace the lines arrive. */
    layoutWorking: function (lines) {
      const G = C.GRID, W = G.work, NS2 = 'http://www.w3.org/2000/svg';
      const V = this.viewRect(), D = this.drawnBox, side = this.workSide;
      if (!this.workLines || !D || !side) return false;
      const tk = this.typeScale(), size = W.size * tk;
      const pad = W.pad * G.stepX * tk;
      /* The column: from the view's edge to the drawing's, with air at
         both ends. Left-aligned inside it. */
      const left = side < 0 ? V.x + pad : D.x2 + pad;
      const right = side < 0 ? D.x1 - pad : V.x + V.w - pad;
      const step = W.lineGap * G.stepY * tk;
      let top = (D.y1 + D.y2) / 2 - (lines.length - 1) * step / 2;
      /* Centred on the drawing — unless that drops a line onto the
         x-axis, which is the one line on this paper strong enough to
         cut through text. The whole block moves, not the line: evenly
         spaced lines with one nudged out of the way read as a mistake,
         and the block has room above and below. */
      const size0 = W.size * tk;
      for (let n = 0; n < lines.length; n++) {
        const y = top + n * size0 * 0 + n * step;
        if (!this.onXAxisRow(y, size0 * 1.4)) continue;
        const up = y - (G.originY - G.axisWidth / 2 - size0 * 0.9);
        const down = (G.originY + G.labelGap + G.labelSize * 0.42 +
                      G.labelSize / 2 + size0 * 0.9) - y;
        top += (up <= down) ? -up : down;
        break;
      }
      const self = this;

      /* Every line hangs from its own EQUALS SIGN, not from the left
         edge of the column.

         A worked calculation is read down the equals: the first line
         states the thing, and each line after it is another way of
         writing the same right-hand side. Flush left, those signs sat
         in the corner of the plate with nothing over them — four lines
         each starting with a stray `=` — and the eye had nothing to run
         down. Hung under the sign above, the block reads as one
         continued sentence, which is what it is.

         The column is whichever line needs the most room before its
         sign; each line is then pushed right by what it is short of.
         A line with no sign in it keeps the left edge. */
      const full = (lines || []).map(function (l) {
        return (l.parts || [{ t: l.text || '' }])
          .map(function (f) { return f.t; }).join('');
      });
      let col = 0;
      const before = full.map(function (t) {
        const at = t.indexOf('=');
        if (at < 0) return null;
        const w = self.textW(t.slice(0, at), size);
        col = Math.max(col, w);
        return w;
      });
      const indent = before.map(function (w) { return w == null ? 0 : col - w; });

      /* The plate, round the block the lines actually make: the widest
         of them, the first baseline to the last, and enough air that no
         glyph sits on a rule. */
      if (this.workPlate) {
        let wide = 0;
        full.forEach(function (t, n) {
          wide = Math.max(wide, indent[n] + self.textW(t, size));
        });
        const air = size * 0.62;
        const p1 = this.workPlate;
        p1.setAttribute('x', left - air);
        p1.setAttribute('y', top - size * 0.86 - air);
        p1.setAttribute('width', Math.min(wide, right - left) + air * 2);
        p1.setAttribute('height', (lines.length - 1) * step + size * 1.3 + air * 2);
        p1.setAttribute('rx', size * 0.5);
        p1.classList.remove('on');
      }

      this.workLines.forEach(function (L, i) {
        const spec = lines[i];
        L.t.classList.remove('on');
        L.bar.classList.remove('on');
        L.spans = [];
        while (L.t.firstChild) L.t.removeChild(L.t.firstChild);
        if (!spec) { L.t.textContent = ''; return; }
        L.t.setAttribute('x', left + indent[i]);
        L.t.setAttribute('y', top + i * step);
        L.t.setAttribute('font-size', size);
        (spec.parts || [{ t: spec.text || '' }]).forEach(function (f) {
          const ts = document.createElementNS(NS2, 'tspan');
          ts.textContent = f.t;
          if (f.lit) { ts.classList.add('lit-' + f.lit); if (f.from) ts.classList.add('wait'); }
          L.t.appendChild(ts);
          L.spans.push(ts);
        });
      });
      /* And the longest line must fit the column it was given. If it
         does not, the framing asked for too little room — say so rather
         than letting a line run into the drawing. */
      let widest = 0;
      full.forEach(function (txt, n) {
        widest = Math.max(widest, indent[n] + self.textW(txt, size));
      });
      return widest <= (right - left);
    },

    /* One line, shown — and its radical's bar drawn over exactly the
       span the radicand measures, which can only be known once the
       line has been laid out. */
    showWorkLine: function (i, spec) {
      const L = this.workLines && this.workLines[i];
      if (!L) return;
      /* The plate arrives with the first line, not before it: a card
         sitting empty on the paper while she is still talking is a
         panel waiting to be filled in. */
      if (this.workPlate) this.workPlate.classList.add('on');
      L.t.classList.add('on');
      const W = C.GRID.work;
      const size = parseFloat(L.t.getAttribute('font-size')) || W.size;
      /* The radicand is everything after the sign. Measured off the
         parts, not off the rendered boxes: this board is laid out
         before it is painted, and a box read now is a box from the
         screen before. */
      const parts = (spec && spec.parts) || [{ t: (spec && spec.text) || '' }];
      const txt = parts.map(function (f) { return f.t; }).join('');
      const at = txt.indexOf('\u221A');
      if (at < 0) { L.bar.classList.remove('on'); return; }
      const x0 = parseFloat(L.t.getAttribute('x'));
      const y0 = parseFloat(L.t.getAttribute('y'));
      const from = x0 + this.textW(txt.slice(0, at + 1), size);
      const to = x0 + this.textW(txt, size);
      const up = y0 - size * (0.5 + W.barGap);
      L.bar.setAttribute('x1', from); L.bar.setAttribute('y1', up);
      L.bar.setAttribute('x2', to);   L.bar.setAttribute('y2', up);
      L.bar.setAttribute('stroke-width', W.barW * this.typeScale());
      L.bar.classList.add('on');
    },

    clearWorkLines: function () {
      if (this.workPlate) this.workPlate.classList.remove('on');
      (this.workLines || []).forEach(function (L) {
        L.t.classList.remove('on');
        L.bar.classList.remove('on');
        while (L.t.firstChild) L.t.removeChild(L.t.firstChild);
        L.t.textContent = '';
        L.spans = [];
      });
    },

    /* Empties every label the board can write, text and all. The
       ordinary clears only drop the classes that show a label, so its
       words survive — invisible, but still there. That is fine between
       screens, where the next one overwrites them, and wrong on a
       replay: the board came back carrying the last run's coordinates
       under a group that had simply been switched off. */
    blankLabels: function () {
      const self = this;
      if (this.segParts) ['a', 'b'].forEach(function (k) {
        const p = self.segParts[k];
        if (p && p.coord) p.coord.textContent = '';
        if (p && p.name)  p.name.textContent = '';
      });
      if (this.segRes) this.segRes.textContent = '';
      (this.exSlots || []).forEach(function (s) {
        s.segRes.textContent = '';
        ['a', 'b'].forEach(function (k) {
          s.segParts[k].coord.textContent = '';
          s.segParts[k].name.textContent = '';
        });
      });
      if (this.legSlots) this.legSlots.forEach(function (L) {
        ['coord', 'name', 'len'].forEach(function (k) {
          if (L[k]) L[k].textContent = '';
        });
      });
      if (this.unitLabel) this.unitLabel.textContent = '';
      if (this.foundLabel) this.foundLabel.textContent = '';
    },

    /* Is the pair on the paper this one? What "keeping" a drawing
       means is that the beat before left the right thing there — true
       of every route through the script, and false the moment the
       picker drops a child in from somewhere else. Every screen that
       keeps asks this first. */
    showing: function (spec) {
      const k = this.lastPlotted;
      return !!(spec && spec.a && spec.b && k && k.a && k.b &&
                k.a.x === spec.a.x && k.a.y === spec.a.y &&
                k.b.x === spec.b.x && k.b.y === spec.b.y);
    },

    clearSegment: function () {
      this.namedAs = null;          // this pair's letters go with it
      this.clearUnits();
      this.clearLegs();
      this.clearExamples();
      this.clearMeasure();
      if (!this.segGroup) return;
      this.glowCoords(false);
      if (this.segRes) this.segRes.classList.remove('pop');
      if (this.segLine) this.segLine.classList.remove('lit');
      this.segGroup.classList.remove('on');
      this.markCrossing();
      const parts = this.segParts;
      if (parts) ['a', 'b'].forEach(function (k) {
        parts[k].dot.classList.remove('triangle-point');
      });
      (this.pulseLines || []).forEach(function (l) { l.classList.remove('on'); });
      this.segLine.classList.remove('draw');
      /* The dashed guide has to be reset too, or once one screen draws
         it every screen after inherits it — already complete, so it
         never reads as arriving at the end of the plot. */
      if (this.segDashG) this.segDashG.classList.remove('draw');
      const self = this;
      ['a', 'b'].forEach(function (k) {
        const p = self.segParts[k];
        p.dot.classList.remove('pop', 'set');
        p.coord.classList.remove('pop', 'set');
        p.name.classList.remove('pop', 'set');
      });
    },

    /* points first, then the line joins them, then the labels */
    /* The opening of a distance question: the two points arrive one at
       a time, then their coordinates, then their letters.

       `withLine` says whether to join them. A question asking about
       this very pair leaves them unjoined — the line is the answer,
       and the player draws it with the slider. A question asking about
       a leg dropped from them draws the pair's own line, because there
       it is the shape being reasoned about, not the answer. */
    runPoints: function (spec, later, done, withLine) {
      const self = this;
      /* When the pair being plotted is the pair the child has just
         tapped out, those points are already on the board — same place,
         same size, same colour. Taking them away and plotting them
         again makes the child watch two points they put there
         themselves be rebuilt in front of them, which reads as a new
         board rather than as the same one being asked a question about.
         So they are adopted: the segment's own dots go up settled, the
         located marks fade off them, and the points never move. What
         follows is only what is genuinely new — the coordinates sliding
         out to make room, then the guide drawn along the span, and then
         she asks. */
      const carried = this.carriesFound(spec);
      /* Otherwise this screen plots its own points, so anything located
         on an earlier one goes. A locate screen plots nothing and keeps
         what is already there — that is how the first point stays put
         while the second is being found. */
      if (!carried) this.clearFound();
      this.placeSegment(spec);
      this.clearSegment();
      this.segGroup.classList.add('on');
      this.markCrossing();

      if (carried) {
        /* Nothing here is new, so nothing here moves. The segment's own
           dots and coordinates are put up settled at exactly the places
           the located marks already have them — same point, same label,
           same size — and those marks come away in the same frame. The
           swap is invisible because there is nothing to see: the board
           the child built simply carries on into the question. */
        ['a', 'b'].forEach(function (k) {
          const part = self.segParts[k];
          part.dot.classList.add('set');
          part.coord.classList.add('set');
          if (part.name.textContent) part.name.classList.add('set');
        });
        this.clearFound();

        /* The guide is the one thing that is actually new, so it is the
           one thing that is drawn. */
        let t = 260;
        if (withLine) {
          later(function () { self.segLine.classList.add('draw'); SFX.draw(); }, t);
          t += 180;
        }
        if (spec.dash) {
          later(function () { self.segDashG.classList.add('draw'); SFX.draw(); }, t);
          later(done, t + 1180);
        } else later(done, t + 320);
        return;
      }

      later(function () { self.segParts.a.dot.classList.add('pop'); SFX.pop(); }, 220);
      later(function () { self.segParts.b.dot.classList.add('pop'); SFX.pop(); }, 720);
      if (withLine) {
        later(function () { self.segLine.classList.add('draw'); SFX.draw(); }, 980);
      }
      later(function () { self.segParts.a.coord.classList.add('pop'); SFX.tick(2); }, 1260);
      later(function () { self.segParts.b.coord.classList.add('pop'); SFX.tick(3); }, 1530);
      later(function () { self.segParts.a.name.classList.add('pop'); SFX.tick(4); }, 1880);
      later(function () { self.segParts.b.name.classList.add('pop'); SFX.tick(5); }, 2150);
      if (spec.dash) {
        later(function () { self.segDashG.classList.add('draw'); SFX.draw(); }, 2420);
        later(done, 3320);
      } else later(done, 2560);
    },

    /* The letters, written onto points that are already on the board.
       A screen keeping its segment never replots it, so the names it
       declares would otherwise never appear — and they have to appear
       exactly then, because that is the screen where the third point
       joins. Two points need no telling apart; three do. */
    nameSegment: function (spec, later) {
      const self = this;
      if (!spec || !this.segParts) return false;
      let any = false;
      this.namedAs = this.namedAs || {};
      ['a', 'b'].forEach(function (k) {
        const p = spec[k], part = self.segParts[k];
        if (!p || !p.name || part.name.textContent === p.name) return;
        part.name.textContent = p.name;
        /* Remembered, not only written. The pair on the paper was drawn
           from a spec that did not name its points, so every later
           lay-out of that pair reads a nameless spec — and a letter put
           straight onto the node went out again the next time anything
           asked the board to arrange itself. */
        self.namedAs[k] = p.name;
        any = true;
      });
      if (!any) return false;
      /* A letter is half of its point's block. Now that the point has
         two halves, the block is laid out again — otherwise the letter
         stays wherever the screen before it left one. */
      if (this.lastPlotted) this.placeSegment(this.lastPlotted);
      ['a', 'b'].forEach(function (k, i) {
        later(function () {
          self.segParts[k].name.classList.add('pop');
          SFX.tick(4 + i);
        }, 200 + i * 260);
      });
      return true;
    },

    /* The line itself, from a point to a point. Everything that lays it
       down goes through here so there is one place it is drawn. */
    drawMeasure: function (from, ex, ey) {
      const G = C.GRID, LG = G.leg;
      /* In the colour of the side it is measuring. It was always the
         measure's own blue, so walking out CB — a green side — drew a
         blue line along it and the change of colour read as a second,
         different connection arriving. A measurement is the side being
         found, not a thing of its own. */
      const horiz = Math.abs(ey - from.y) < 1e-6;
      const vert = Math.abs(ex - from.x) < 1e-6;
      const col = horiz ? (LG.hColor || LG.color)
                : vert ? (LG.vColor || LG.color)
                : G.measure.color;
      if (this.measLine) {
        this.measLine.setAttribute('stroke', col);
        this.measLine.style.color = col;
      }
      if (this.measCap) this.measCap.setAttribute('fill', col);
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      this.measLine.setAttribute('x1', px(from.x));
      this.measLine.setAttribute('y1', py(from.y));
      this.measLine.setAttribute('x2', px(ex));
      this.measLine.setAttribute('y2', py(ey));
      this.measCap.setAttribute('cx', px(ex));
      this.measCap.setAttribute('cy', py(ey));
      this.measLine.classList.add('on');
      this.measCap.classList.add('on');
    },

    clearMeasure: function () {
      if (!this.measLine) return;
      this.measLine.classList.remove('on', 'lit');
      this.measCap.classList.remove('on');
    },

    // the guess landed: leave it on the board, lit
    litMeasure: function () {
      if (this.measLine) this.measLine.classList.add('lit');
    },

    /* Is what is on the board a side the child has already measured,
       rather than a stroke half-drawn on this screen? A found length
       stays; a working line does not. */
    measureIsLit: function () {
      return !!(this.measLine && this.measLine.classList.contains('lit'));
    },

    runSegment: function (spec, later, done) {
      const self = this;
      /* This screen plots its own points, so anything located on an
         earlier one goes. A locate screen plots nothing and keeps what
         is already there — that is how the first point stays put while
         the second is being found. */
      this.clearFound();
      const a = spec.a, b = spec.b;
      this.placeSegment(spec);
      this.clearSegment();
      this.segGroup.classList.add('on');
      this.markCrossing();

      later(function () { self.segParts.a.dot.classList.add('pop'); SFX.tick(0); }, 120);
      later(function () { self.segParts.b.dot.classList.add('pop'); SFX.tick(2); }, 380);
      later(function () { self.segLine.classList.add('draw'); SFX.draw(); }, 680);
      later(function () {
        [['a', 'coord'], ['a', 'name'], ['b', 'coord'], ['b', 'name']]
          .forEach(function (pair, i) {
            later(function () {
              self.segParts[pair[0]][pair[1]].classList.add('pop');
              SFX.tick(i + 3);
            }, i * 130);
          });
      }, 1320);
      later(done, 1980);
    },

    /* Marks a point as found: the pulsing markers clear away and the
       point is left labelled with its coordinates. */
    /* A located point is marked, labelled with its coordinates, and left
       there. Each one gets its own marker rather than the single one
       being moved, so the first stays locked in place while the second
       is being found. */
    solve: function (gx, gy) {
      const NS2 = 'http://www.w3.org/2000/svg';
      const G = C.GRID, F = G.found;
      const px = G.originX + gx * G.stepX, py = G.originY - gy * G.stepY;

      const g = document.createElementNS(NS2, 'g');
      g.setAttribute('class', 'found');
      const c = document.createElementNS(NS2, 'circle');
      c.setAttribute('cx', px); c.setAttribute('cy', py);
      c.setAttribute('r', F.r);
      c.setAttribute('fill', F.fill);
      c.setAttribute('stroke', F.stroke);
      c.setAttribute('stroke-width', F.strokeWidth);
      c.setAttribute('class', 'fdot');
      const t = document.createElementNS(NS2, 'text');
      /* Centred over its own point, and pulled back if that would take
         it off the board — at x = 6 the old fixed offset to the right
         hung a third of the label past the edge, where the SVG cut it
         off. Centred is also what a segment does with the pair later,
         so a point the child locates keeps its label exactly where they
         first saw it rather than shuffling when the pair is joined. */
      const ctext = '(' + numText(gx) + ',\u00A0' + numText(gy) + ')';
      const cw = this.textW(ctext, F.labelSize);
      t.setAttribute('x', this.clampLabel(px, cw));
      /* And remembered, so the pair this point is about to become is
         labelled where the child already saw it. A located mark and the
         segment that joins it are the same point twice; its coordinates
         jumping between the two reads as two different pairs. */
      this.foundSide = this.foundSide || {};
      this.foundSide[gx + ',' + gy] = (F.side === 'under') ? [0, 1] : [0, -1];
      /* `labelDy` is the offset that puts a label OVER its point; the
         side is named separately, so a located mark can sit under the
         point it names without inverting every other label that reads
         the same number. Both have to agree: a pair tapped out with its
         coordinates under it and then joined with them over it looks
         like two different pairs. */
      t.setAttribute('y', py + (F.side === 'under' ? -F.labelDy : F.labelDy));
      t.setAttribute('fill', G.ink);
      t.setAttribute('font-size', F.labelSize);
      t.setAttribute('class', 'flabel');
      t.textContent = ctext;
      g.appendChild(c); g.appendChild(t);
      el.gridAxes.appendChild(g);
      this.foundMarks.push(g);

      if (this.dotGroup) this.dotGroup.classList.remove('on');   // highlighters away
      void g.getBoundingClientRect;
      g.classList.add('on');
    },

    clearFound: function () {
      if (this.foundGroup) this.foundGroup.classList.remove('on');
      (this.foundMarks || []).forEach(function (g) {
        if (g.parentNode) g.parentNode.removeChild(g);
      });
      this.foundMarks = [];
    },

    /* Is the pair this segment is about the pair the child has just
       located? Compared by where the marks actually sit, because that
       is the only thing that decides whether the segment's own dots can
       take over from them without anything appearing to move. */
    carriesFound: function (spec) {
      const marks = this.foundMarks || [];
      if (!spec || !spec.a || !spec.b || marks.length !== 2) return false;
      const G = C.GRID;
      const at = marks.map(function (g) {
        const c = g.querySelector('.fdot');
        return c ? { x: parseFloat(c.getAttribute('cx')),
                     y: parseFloat(c.getAttribute('cy')) } : null;
      });
      if (at.some(function (m) { return !m; })) return false;
      return [spec.a, spec.b].every(function (p) {
        const X = G.originX + p.x * G.stepX, Y = G.originY - p.y * G.stepY;
        return at.some(function (m) {
          return Math.abs(m.x - X) < 0.5 && Math.abs(m.y - Y) < 0.5;
        });
      });
    },


    /* A wrong tap: the point flashes red and settles back. */
    reject: function (node) {
      if (!node) return;
      node.classList.remove('wrong');
      void node.getBoundingClientRect;
      node.classList.add('wrong');
      setTimeout(function () { node.classList.remove('wrong'); }, 600);
    },

    /* Reset so a replay rebuilds the same entrance. */
    reset: function () {
      this.spotlightPart(null);
      /* Text as well as classes: every screen that reveals the board
         seats its own segment straight after, so there is nothing here
         worth keeping, and leaving it meant a replayed board came up
         still holding the last run's coordinates. */
      this.blankLabels();
      this.lines.forEach(function (l) { l.classList.remove('draw'); });
      this.arrows.forEach(function (a) { a.classList.remove('pop'); });
      this.labels.forEach(function (t) { t.classList.remove('pop'); });
      this.clearFound();
      el.gridPanel.classList.add('hidden');
      el.gridPanel.classList.remove('magic-in');
      this.setDots(false);
    },

    /* panel -> x axis -> y axis -> arrowheads -> numbers */
    /* The axis, its arrowheads and every number, all the way on.
       Board.run sweeps them in one at a time through the same queue a
       tap on Skip empties, and the y-axis goes last — so a build cut
       short left a board with no arrowheads and only half its numbers,
       and it stayed that way, because a board already up is never
       rebuilt. Anything the sweep did not reach is put in place here. */
    settleFurniture: function () {
      if (!this.built) return;
      (this.lines || []).forEach(function (l) {
        /* The offset is inline, so the class alone will not shift it —
           a rule cannot outrank an inline style. Clearing it is what
           actually draws a half-axis the sweep never got to. */
        l.style.strokeDashoffset = 0;
        l.classList.add('draw');
      });
      (this.arrows || []).forEach(function (a) { a.classList.add('pop'); });
      (this.labels || []).forEach(function (t) { t.classList.add('pop'); });
    },

    run: function (later, done) {
      const self = this;
      const G = C.GRID;
      const b = this.box || G.box;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;

      this.build();
      this.reset();
      this.shown = true;

      el.gridPanel.classList.remove('hidden');
      void el.gridPanel.offsetWidth;
      el.gridPanel.classList.add('magic-in');
      // the ruling washes in under the axes, a beat behind the panel
      el.gridImg.classList.remove('ruling');
      void el.gridImg.offsetWidth;
      el.gridImg.classList.add('ruling');
      SFX.magic();
      FX.sparkles(cx, cy, 12, 380);

      /* The numbers are not written on afterwards: each one is revealed
         by the line that passes it, lighting as the sweep drawing its
         own axis reaches its place. The ruling and its labels arrive as
         one movement, out from the origin in both directions, instead
         of the board being drawn and then labelled. */
      const SWEEP = G.axisDrawMs, POP = 300;
      const X_AT = 760, Y_AT = 1020;
      const xReach = Math.max(Math.abs(G.xFrom), Math.abs(G.xTo)) + 1;
      const yReach = Math.max(Math.abs(G.yFrom), Math.abs(G.yTo)) + 1;

      const sweepAxis = function (which, at, reach, halves) {
        later(function () {
          halves.forEach(function (l) { l.classList.add('draw'); });
          SFX.draw();
        }, at);
        self.axisLabels.forEach(function (L) {
          if (L.axis !== which) return;
          const d = Math.abs(L.v);
          later(function () {
            L.el.classList.add('pop');
            // one note per step outward, not two for the matching pair
            if (L.v >= 0) SFX.tick(d);
          }, at + (d / reach) * SWEEP);
        });
        // and the arrowheads land as their own line finishes
        halves.forEach(function (l, i) {
          const a = self.arrows[(which === 'x' ? 0 : 2) + i];
          if (a) later(function () { a.classList.add('pop'); SFX.tick(reach); }, at + SWEEP);
        });
      };
      sweepAxis('x', X_AT, xReach, this.axisX);
      sweepAxis('y', Y_AT, yReach, this.axisY);

      later(done, Y_AT + SWEEP + POP + 140);
    }
  };

  /* A square root drawn whole, rather than a sign with brackets standing
     in for the bar over it.

     Config writes a root as \u221A(...), and that bracket pair is what
     says how far the root reaches — so it is read as the delimiter and
     then not drawn, because the bar is the grouping it was standing in
     for. Everything is walked as one string rather than part by part:
     the x-axis screens split a radicand across three parts so that one
     term inside it can glow, and the root still has to be found across
     those joins. */
  const Radical = (function () {
    const SIGN = '\u221A';
    const SVGNS = 'http://www.w3.org/2000/svg';

    /* Every character with the part it came from, so a run can be
       regrouped later and keep that part's glow or fade. */
    function chars(parts) {
      const out = [];
      parts.forEach(function (p, i) {
        String(p.t == null ? '' : p.t).split('').forEach(function (ch) {
          out.push({ ch: ch, p: i });
        });
      });
      return out;
    }

    /* From the sign to the bracket closing the one straight after it.
       Anything else — no sign, or a sign with no bracket — is left to be
       drawn as plain text rather than guessed at. */
    function span(cs) {
      let i = 0;
      while (i < cs.length && cs[i].ch !== SIGN) i++;
      if (i >= cs.length) return null;
      if (!cs[i + 1] || cs[i + 1].ch !== '(') return null;
      let depth = 0;
      for (let j = i + 1; j < cs.length; j++) {
        if (cs[j].ch === '(') depth++;
        else if (cs[j].ch === ')' && !--depth) return { sign: i, open: i + 1, close: j };
      }
      return null;
    }

    /* Characters back into spans, one per run of the same source part,
       so a glowing term stays one element the animation can hold. */
    function emit(host, cs, from, to, parts) {
      let k = from;
      while (k < to) {
        const p = cs[k].p;
        let s = '';
        while (k < to && cs[k].p === p) { s += cs[k].ch; k++; }
        const sp = document.createElement('span');
        sp.textContent = s;
        if (parts[p].glow) sp.classList.add('glow');
        if (parts[p].fade) sp.classList.add('fade');
        host.appendChild(sp);
      }
    }

    /* The sign itself. Lilita One carries no radical, so typing one left
       the browser falling back to another face and the sign came out
       lighter than the type around it. Drawn here it takes the colour
       and weight of its line — and, stretched to the radicand's height,
       its apex lands on the bar by construction rather than by guessing
       at a glyph's metrics. */
    function sign() {
      const wrap = document.createElement('span');
      wrap.classList.add('rad-sign');
      wrap.setAttribute('aria-hidden', 'true');
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 50');
      svg.setAttribute('preserveAspectRatio', 'none');
      const pl = document.createElementNS(SVGNS, 'polyline');
      // the short left arm, down to the foot, up to the bar, and along it
      pl.setAttribute('points', '1.8,30 8,45.5 16.4,1.7 24,1.7');
      pl.setAttribute('fill', 'none');
      pl.setAttribute('stroke', 'currentColor');
      pl.setAttribute('stroke-width', '3.4');
      pl.setAttribute('stroke-linecap', 'round');
      pl.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(pl);
      wrap.appendChild(svg);
      return wrap;
    }

    return {
      /* Fills `host` with `parts`, drawing any root in them properly. */
      render: function (host, parts) {
        const cs = chars(parts), r = span(cs);
        if (!r) { emit(host, cs, 0, cs.length, parts); return false; }
        emit(host, cs, 0, r.sign, parts);
        const rad = document.createElement('span');
        rad.classList.add('rad');
        const body = document.createElement('span');
        body.classList.add('rad-body');
        emit(body, cs, r.open + 1, r.close, parts);   // inside the brackets
        rad.appendChild(sign());
        rad.appendChild(body);
        host.appendChild(rad);
        emit(host, cs, r.close + 1, cs.length, parts);
        return true;
      }
    };
  })();

  /* The formula panel. Shows either a fixed set of lines (the recap)
     or one line that is replaced step by step (the x-axis case). */
  const Formula = {
    place: function (box) {
      el.formulaBoard.style.left = box.x + 'px';
      el.formulaBoard.style.top = box.y + 'px';
      el.formulaBoard.style.width = box.w + 'px';
    },
    inner: function () {
      let fb = el.formulaBoard.children[0];
      if (!fb) {
        fb = document.createElement('div');
        fb.classList.add('fb-inner');
        el.formulaBoard.appendChild(fb);
      }
      return fb;
    },
    clear: function () {
      const fb = this.inner();
      while (fb.children.length) fb.removeChild(fb.children[0]);
    },
    /* A fixed set of lines, arriving one after another — `step` apart,
       so a caller whose lines have to be read can space them out. */
    setLines: function (lines, step) {
      const fb = this.inner();
      this.clear();
      lines.forEach(function (l, i) {
        const d = document.createElement('div');
        d.classList.add('fb-' + (l.kind || 'lead'));
        Radical.render(d, [{ t: l.text }]);
        d.style.animationDelay = (i * (step || 300)) + 'ms';
        fb.appendChild(d);
      });
    },
    /* One line built from fragments, so a part can glow or fade. */
    setStep: function (parts) {
      const fb = this.inner();
      this.clear();
      const d = document.createElement('div');
      d.classList.add('fb-step');
      Radical.render(d, parts);
      fb.appendChild(d);
    }
  };

  /* ---------------- screen flow ---------------- */
  const Game = {
    index: -1, state: 'start', busy: false, geom: null, task: null,
    flight: null, landFlight: null, raised: false,
    pending: [], entranceCancel: null,

    /* A screen is done: arm Skip and hand over by itself after a pause.
       The hand-over is held back while a question is still unanswered,
       and there is nothing to hand over to on the last screen. Because
       it is queued through later(), tapping Skip cancels it along with
       everything else the screen had pending. */
    settle: function (pause) {
      const self = this, i = this.index;
      this.state = 'waiting';
      el.nextBtn.classList.add('ready');

      if (i + 1 >= C.SCRIPT.length) return;
      const entry = C.SCRIPT[i] || {};
      if (entry.task && !(this.task && this.task.done)) {
        /* Nothing more will happen until they tap, so point the way —
           unless the screen has asked not to be helped. */
        if (entry.dots && entry.task.target && entry.hint !== false) {
          Hint.arm(entry.task.target);
        }
        return;
      }

      /* A working takes half a minute to write and it owns the screen
         while it does. The balloon that was still open when the ladder
         ran out finishes somewhere in the middle of it — and by then
         the task is done, so this would otherwise arm the hand-over and
         take the paper away mid-sentence. The working settles when it
         is finished; until then nothing else does. */
      if (this.writing) return;

      this.later(function () {
        if (self.index !== i) return;        // something got there first
        const to = self.nextIndex();
        if (to >= C.SCRIPT.length) return;   // nothing follows this
        self.goTo(to);
      }, pause || C.AUTO.afterLine);
    },

    /* Where the next step goes. Ordinarily the screen after this one.
       A beat that teaches a child who has missed twice sets it to the
       beat that does the teaching, and a child who got it right sets it
       past them — so the guided path exists for whoever needs it and
       does not exist for whoever does not.

       Read once and cleared, so a branch can never outlive the answer
       that set it. */
    branch: null,
    nextIndex: function () {
      const to = this.branch;
      this.branch = null;
      if (to == null) return this.index + 1;
      /* A right answer on the last question steps over the beats that
         exist to teach a child who got it wrong — and there is nothing
         after those, so where it steps to is off the end. Both Next and
         the hand-over below already stop there. */
      if (to === 'end') return C.SCRIPT.length;
      const k = C.SCRIPT.findIndex(function (s) { return s.id === to; });
      return k < 0 ? this.index + 1 : k;
    },

    /* Everything in flight, stopped. The queued steps are this object's
       own; a leaf sweep is not — it runs on plain timeouts of its own,
       and left alone it dresses and plots the screen being left onto
       the board of the screen just arrived at. */
    stopSweep: function () {
      if (FX && FX.leaves && FX.leaves.cancel) FX.leaves.cancel();
    },

    /* Every queued step goes through here so a skip can cancel it. */
    later: function (fn, ms) {
      const self = this;
      const id = setTimeout(function () {
        self.pending = self.pending.filter(function (x) { return x !== id; });
        fn();
      }, ms);
      this.pending.push(id);
      return id;
    },

    clearPending: function () {
      this.pending.forEach(clearTimeout);
      this.pending = [];
      /* Whatever was being written is not being written any more —
         Next, Back and the picker all come through here, and a screen
         left mid-working must not hand the flag to the next one. */
      this.writing = false;
      this.ruler = false;
      this.stopSweep();
      if (FX && FX.landAll) FX.landAll();   // nothing left in the air
      if (this.entranceCancel) { this.entranceCancel(); this.entranceCancel = null; }
      // a skip mid-flight sets her down rather than leaving her airborne
      if (this.landFlight) this.landFlight(true);
    },

    begin: function () {
      const self = this;
      if (this.busy) return;
      this.busy = true;

      SFX.pop();
      SFX.sparkle();
      el.playBtn.classList.add('pressed');

      const P = C.PLAY.box;
      FX.ring(P.cx, P.cy, 120, 'rgba(120,200,255,.95)');
      FX.starBurst(P.cx, P.cy, 18, 230);

      setTimeout(function () {
        SFX.whoosh();
        el.startScreen.classList.add('fade-out');
        el.scene.classList.remove('hidden');
        void el.scene.offsetWidth;
        el.scene.classList.add('fade-in');
      }, 260);

      setTimeout(function () {
        el.startScreen.classList.add('hidden');
        stopWeather.splice(0).forEach(function (f) { f(); });
        FX.motes(18);
        self.busy = false;
        self.goTo(0);
      }, 900);
    },

    goTo: function (i) {
      /* A branch belongs to the answer that set it and to nothing
         else: arriving anywhere clears it, so Back and Next can never
         carry one into a screen that did not ask for it. */
      this.branch = null;
      const self = this;
      this.clearPending();
      Hint.clear();
      /* A beat that speaks without a balloon, or works its own sum, must
         not open wearing the last one's. Both are inherited, so both go
         here — at the change — rather than a third of a second later when
         the beat gets round to its own business. */
      const next = C.SCRIPT[i] || {};
      if (next.voiceOnly) Bubble.close();
      if (next.xEquation && Board.segRes) Board.segRes.classList.remove('pop');
      /* A screen carrying more than one pair lets the ruling, the axes
         and their numbers fall back, so the pairs themselves come
         forward. Set at the change and faded by the stylesheet, so the
         board settles into it rather than snapping — and cleared the
         same way by every screen that does not ask for it. */
      el.gridPanel.classList.toggle('quiet', !!next.quietBoard);
      /* And the other reason a board steps back, which no screen asks
         for because the board can see it: the drawing runs over an
         axis. It fades the axes and their numbers and leaves the ruling
         alone — the one beat that asks a child to count squares over an
         axis still needs the squares. */
      Board.markCrossing();
      /* The board's camera. A beat that names a view pushes in to it; one
         that names none pulls back out; one that wants the view it
         already has does nothing at all. Given a beat to settle first so
         the push comes with her line rather than under the change, and
         queued through later() so a skip cancels it with everything
         else. */
      this.later(function () {
        /* "The view it already has" is compared by NAME, not by the
           rect the name works out to. The rect is derived from what is
           written on the board, and what is written moves with the
           camera — the type is set smaller as the board comes in — so
           two asks for the same view come back a few pixels apart and
           the board re-pushes to chase itself. The name does not move. */
        if (next.view && Board.viewName === next.view) return;
        Board.viewName = next.view || null;
        Board.viewTo(Board.viewFor(next.view), C.GRID.zoom.ms);
      }, C.GRID.zoom.delayMs);
      this.index = i;
      this.state = 'entering';
      el.nextBtn.classList.remove('ready');
      this.syncNav();
      /* Whatever the last screen's board sweep did not get to, finish
         now — before this screen draws anything of its own on it. */
      if (Board.shown) Board.settleFurniture();

      const entry = C.SCRIPT[i];
      /* A question that follows straight on from one answered on the
         control keeps the whole arrangement: she stays up on the panel,
         the control stays under her, and only the board changes. Taking
         them both away and bringing them both back — with her flying
         down and up again in between — for what is the same question
         about two new points read as the screen restarting. */
      /* `askFirst` gives a screen its question back: the control is
         taken away while she puts it, and comes in once she has. A
         screen that asks something new about what is already drawn
         needs the board watched, not a panel of answers sitting under
         it waiting to be pressed. */
      /* Which thing she would be standing on. Keeping a control means
         the one already under her is the one this screen wants — the
         reel, the ruler, the answers or the slots. Four screens in a
         row now change control between them, and a screen that assumed
         it had inherited the reel when the beat before put the
         substitution panel up came up with no control at all. */
      const kindOf = function (e) {
        if (!e) return null;
        if (e.task && e.task.kind === 'slots') return 'slots';
        if (e.options) return 'options';
        if (e.distance || e.entry) return e.control === 'slider' ? 'slider' : 'lock';
        return null;
      };
      const wantKind = kindOf(entry);
      const keepsControl = (entry.intro === 'measure' || entry.layout === 'board') &&
                           !!wantKind &&
                           entry.transition !== 'leaves' && !entry.askFirst &&
                           this.raised && Board.shown &&
                           this.controlKind === wantKind;
      this.raised = keepsControl;
      this.controlKind = wantKind;
      const geom = keepsControl ? controlGeom(wantKind) : geomFor(i);
      this.geom = geom;
      standPose = !!geom.stand;
      /* Reseating the rig also resizes the speech bubble, and a screen
         with nobody in shot sizes it to nothing — so behind a leaf
         sweep this waits for the cover too, or the last screen's
         bubble collapses in plain sight. */
      /* The box belongs to her: it goes the moment a screen has no line
         for her to say, rather than lingering over a frame she has
         already flown out of. A board screen puts its question in the
         banner instead, so that counts as having no line either. A leaf
         sweep closes it inside dress(), under the cover.

         A distance screen has a line but does not say it here: the
         board builds and the points go up first, and she only flies in
         seconds later, so its box is closed now and runMeasure() opens
         it when she lands. Screens where she is already standing are
         left alone — there the next line is 140ms away, and closing
         would blink the box between two sentences of the same breath. */
      const speaks = !!entry.line && !geom.bare && entry.intro !== 'measure';
      if (entry.transition !== 'leaves') {
        if (!speaks) Bubble.close();
        applyGeom(geom);
      }

      const AX = axisOf(entry);
      const onBoard = entry.layout === 'grid' || entry.layout === 'board' ||
                      entry.layout === 'recap' || !!AX;
      /* A screen behind a leaf sweep strips the last one inside
         dress(), while the frame is covered. Doing it here as well
         would pop the board and the panels out a beat early, in plain
         sight, before a single leaf had arrived. */
      if (entry.transition !== 'leaves') {
        // the board only exists on its own screens
        if (!onBoard) {
          el.gridPanel.classList.add('hidden');
          el.standSwifty.classList.add('hidden');
          Board.shown = false;
          Board.setDots(false);
        }
        if (entry.layout !== 'recap' && !AX) el.formulaBoard.classList.add('hidden');
        if (!entry.segment && !entry.keepSegment) Board.clearSegment();
        if (Opts && !entry.options) Opts.hide();
        if (Sel && !(entry.distance || entry.entry)) Sel.hide();
      }

      /* What happens once she has arrived: speak her line, hand over
         on its own if the screen has none, or simply wait. */
      /* A screen with a task waits for the player rather than for a
         tap on Next. */
      this.task = entry.task
        ? { target: entry.task.target, spec: entry.task, wrong: 0, done: false }
        : null;

      /* Back to the first beat is a replay, and a replay starts on an
         empty board. The ordinary clears only switch labels off, which
         is right between screens — the next one writes over them — and
         wrong here: the board is put away holding the last run's
         coordinates, and `reset` does not run again until it is next
         built. So the words go now, while nothing is looking at them. */
      if (i === 0) Board.blankLabels();

      /* Which plane this screen is taught on, before anything is
         measured against it. Nearly every screen wants the one the
         lesson has always used; a pair that does not fit on it asks
         for the wide one by name. */
      Board.setRange(entry.board || 'close');

      /* Which numeric control this screen wants. The reel is for
         digits and the ruler is for magnitude; a screen says which and
         the other one leaves, so only ever one of them is on the
         frame. */
      const wantsRuler = entry.control === 'slider' && Slide;
      const nextSel = wantsRuler ? Slide : Lock;
      if (Sel && Sel !== nextSel) { Sel.lock(); Sel.hide(); }
      Sel = nextSel;

      /* The substitution panel belongs to one kind of question and
         nothing else, so it is put away the moment a screen is not
         asking one. */
      if (Slots) {
        const asks = entry.task && entry.task.kind === 'slots';
        if (!asks) { Slots.lock(); Slots.hide(); }
        else {
          Slots.setPair(entry.segment.a, entry.segment.b);
          Slots.reset();
          Slots.onOffer(function (f) { self.checkSlots(f); });
        }
      }

      /* Both kinds of numeric question are answered on the same
         control; only a distance one lays a line down as it changes. */
      if (Sel) {
        const numeric = entry.task && (entry.task.kind === 'distance' || entry.task.kind === 'entry');
        const NS = window.NumberSelector;
        const r = entry.range || { min: NS.MIN, max: NS.MAX };
        let hi = r.max;
        if (numeric && entry.task.kind === 'distance') {
          const fits = self.paperSteps();
          if (fits != null) hi = Math.min(hi, fits);
        }
        Sel.setRange(r.min, hi, r.start);
        Sel.onCheck(!numeric ? null : function (v) {
          if (entry.task.kind === 'distance') self.checkDistance(v);
          else self.checkEntry(v);
        });
        /* Nothing is drawn while the number is being chosen. Pressing
           Check is the moment you find out, and a line creeping out to
           the answer beforehand gave it away before the press.

           The ruler is the one exception, and it is armed by a miss
           rather than by arriving — see `armRuler`. A slider you can
           drag until the line lands on the point is a dexterity game
           and the formula never gets used; a slider that becomes a
           ruler once you have already had your go is the scaffold this
           game always gives, arriving when it is needed. */
        Sel.onChange(null);
      }
      // a choice task is answered on the options panel
      if (Opts) {
        const choice = entry.task && entry.task.kind === 'choice';
        // each screen brings its own three answers
        if (Array.isArray(entry.options)) Opts.setChoices(entry.options);
        Opts.setAnswer(choice ? entry.task.answer : null);
        Opts.onAnswer(choice ? function (key, right) { self.checkChoice(right); } : null);
      }

      /* A screen that puts its answers up before she arrives brings
         them in itself, so nothing may bring them in again after. */
      /* The substitution panel arrives the same way the answers do:
         after she has spoken, into the space she leaves. */
      const withControl = (entry.options || (entry.task && entry.task.kind === 'slots')) &&
                          entry.intro !== 'measure' && !entry.askLast;

      /* A screen can point at part of what is already drawn while she
         talks about it: the y halves of both labels, then the x halves,
         then one x at a time in the order the subtraction reads. The
         board is already up, so this is the whole of the screen's
         work — it lights what her line is about. */
      /* Returns how long the light runs — the caller waits it out
         before the next sentence, so a light never plays under one. */
      const lit = entry.lineLights
        ? function (n) { return self.lightAfterLine(entry, n); } : null;

      const spotlight = function () {
        /* She has just named the shape; the board agrees with her. Timed
           off her own recording so the light comes as she finishes,
           rather than under the words. */
        if (entry.pulse && !entry.lineLights) {
          /* A beat into her line, so the light comes as she gets to the
             words rather than on the first one — and the run of it plays
             out under the rest of what she says. */
          const voiced = (window.Voice && window.Voice.lengthOf(entry.line)) || 1800;
          const keys = entry.pulse === 'triangle' ? null : [entry.pulse];
          /* A beat into her line, and running until a moment after she
             stops — the light is what she is talking about, so it lasts
             as long as the talking does. */
          const start = entry.line ? voiced * 0.18 : 200;
          const run = Math.max(1200, voiced - start + 700);
          /* How much of the highlight is still to come once she has
             stopped talking. A control that arrives inside it is a panel
             of answers landing on top of the thing being pointed at, so
             whatever brings one in waits this out first. */
          /* When the light will actually go out, as a time rather than
             as a length. Subtracting the recording's length from the
             run assumes her balloon closes the instant the recording
             ends, and it does not — it opens late and types — so the
             two drift by a couple of frames and she is lifted out from
             under a light that is still burning. A moment read off the
             same clock the light is on cannot drift. */
          self.pulseTail = Math.max(0, (start + run) - voiced) + 260;
          self.pulseOff = performance.now() + start + run + 260;
          Board.pulseSides(self.later.bind(self), start, keys, run);
        }
        /* One side held forward for as long as the beat lasts, rather
           than lit and let go. The beat that asks for CB has to leave
           AC on the board — the child needs to see they now have two
           measured sides — while the one being asked for is the loud
           one. */
        if (entry.focus) self.later(function () {
          Board.spotlightPart(entry.focus);
        }, 300);

        /* And a beat can name its sides one after the other: the two
           known ones, then the one it is about to ask after. */
        if (entry.spotSeq && !entry.lineLights) entry.spotSeq.forEach(function (k, n) {
          self.later(function () { Board.spotlightPart(k); SFX.tick(n); },
                     700 + n * 900);
        });

        const h = entry.highlight;
        /* The beats that do the pointing inherit the board rather than
           replotting it, so they carry no segment of their own — what
           matters is that one is drawn, not that this screen drew it. */
        if (!h || !Board.segParts) return;
        Board.glowPart(null, false);              // whatever the last screen lit
        const steps = h.order || [null];
        steps.forEach(function (which, n) {
          self.later(function () {
            Board.glowPart(h.part, true, which);
            SFX.tick(n);
          }, (h.delay != null ? h.delay : 260) + n * (h.stagger || 0));
        });
      };

      /* One beat works its subtraction on the board out of the axis it is
         measured along, instead of stating it in a balloon. It runs on the
         board this screen inherited, so it waits for nothing. */
      const buildEquation = function () {
        if (!entry.xEquation) return;
        self.later(function () { Board.runEquation(self.later.bind(self)); }, 260);
      };


      /* A beat that states a derivation rather than asking for one.
         Every working in this game plays because an answer was given —
         right, or the ladder spent. A screen that simply shows the
         method has no such trigger, so its own line is the trigger:
         she finishes, and the working begins. */
      const derive = function (next) {
        if (!entry.derive) { if (next) next(); return; }
        self.later(function () {
          self.workThrough({ spec: entry.derive, done: true },
                           function () { self.settle(C.AUTO.afterLine); });
        }, 420);
      };

      const after = function () {
        self.pulseTail = 0;
        self.pulseOff = 0;
        spotlight();
        const bring = withControl && !keepsControl
          ? function () { revealControl(entry); } : null;
        /* She asks, the shape lights, the light goes — and only then do
           the answers rise and she comes down on them. */
        const gated = (bring && self.pulseOff)
          ? function () {
              self.later(bring, Math.max(0, self.pulseOff - performance.now()));
            } : bring;
        buildEquation();
        /* A beat that states a derivation says its lines and then hands
           over to the working — which settles the screen itself once it
           has finished writing. Nothing else may settle in between. */
        if (entry.derive) {
          self.sayLines([entry.line, entry.line2].filter(Boolean), function () {
            if (gated) gated();
            derive();
          }, lit);
        }
        else if (entry.line && entry.voiceOnly) {
          self.sayOnly(entry.line, function () { if (lit) lit(0); if (gated) gated(); });
        }
        else if (entry.line && entry.line2) {
          self.speakBoth(entry.line, entry.line2, gated, lit);
        }
        else if (entry.line) {
          self.speak(entry.line, function () { if (lit) lit(0); if (gated) gated(); });
        }
        else if (entry.auto && i + 1 < C.SCRIPT.length) {
          self.later(function () { self.goTo(i + 1); }, 160);
        } else {
          /* A screen that draws something to be read, rather than just
             moving a piece into place, can name its own pause. */
          self.settle(entry.hold != null ? entry.hold : C.AUTO.afterSilent);
        }
      };

      const arrive = function () {
        /* The reverse of every other question in the game: the answers
           and the hint go up first and she comes to them. The child
           looks at what is on the board and has begun to wonder before
           anybody says anything, so her line lands on a question they
           have already started asking themselves — which is the
           difference between being told a problem and noticing one. */
        if (entry.askLast && entry.options && Opts) {
          Opts.reset();
          Opts.show(true);
          self.later(function () { self.perchOn(entry.perch, after); },
                     C.AUTO.perchMs || 900);
          return;
        }
        if (entry.entrance === 'fly') self.flyIn(after);
        else if (entry.entrance === 'flyOut') self.flyOut(after);
        else if (entry.entrance === 'hop') self.hop(after);
        else if (entry.entrance === 'none') after();     // nobody to bring on
        else self.stay(after);
      };

      /* Plot the segment, then any leg dropped from it, before asking
         about either. */
      const plotThen = function (next) {
        const afterSeg = function () {
          /* Places on the board that are not one of the pair — the
             third corner of a town. Plotted and labelled exactly as
             the pair is, because they are the same kind of thing. */
          (entry.mark || []).forEach(function (m, n) {
            self.later(function () { Board.solve(m.x, m.y); SFX.tick(n + 1); },
                       260 + n * 220);
          });
          /* A pair already on the board, joined here. The beat that
             says "first, find this distance" is the one that draws the
             line the distance is along — before it there is nothing on
             the board saying which two places the question is about,
             which is the question. */
          if (entry.joinSegment && Board.segLine) self.later(function () {
            Board.segLine.classList.add('draw'); SFX.draw();
          }, 240);
          /* A pair that has already been measured says so on its own
             line, the way an axis case writes its answer there. */
          const R = entry.segment && entry.segment.result;
          if (R) self.later(function () {
            Board.showSegResult(entry.segment, R.text, R.dy, R.dx);
            SFX.chime();
          }, 260);
          /* Pairs recalled beside this one come up under her line, not
             before it — the screen is no slower for carrying them. */
          if (entry.examples) Board.runExamples(entry.examples, self.later.bind(self));
          if (entry.legs) Board.runLegs(entry.legs, self.later.bind(self), next);
          else next();
        };
        /* A screen that keeps what it inherited does not replot the
           segment — only whatever is new gets drawn.

           Unless what it inherited is not its pair. Keeping is what
           lets a run of beats argue about one drawing without redrawing
           it between each; it assumes the beat before left the right
           thing there, which is true of every route through the script
           and false the moment the picker drops a child in from
           somewhere else. So the pair it declares wins over the pair
           that happens to be up. */
        const samePair = Board.showing(entry.segment);
        /* Redrawing over the top of the wrong pair leaves the wrong
           pair's labels and lengths underneath it, so the paper is
           wiped first: this is not "keeping" anything, it is drawing
           this screen from nothing. */
        if (entry.segment && entry.keepSegment && !samePair) Board.clearSegment();
        if (entry.segment && (!entry.keepSegment || !samePair)) {
          /* Plotted, but not joined. A line drawn between two of three
             places says which pair is being asked about, so a screen
             whose whole question is "which pair?" puts the points up
             and leaves them apart. */
          if (entry.pointsOnly) {
            Board.runPoints(entry.segment, self.later.bind(self), afterSeg, false);
          } else {
            Board.runSegment(entry.segment, self.later.bind(self), afterSeg);
          }
        } else {
          // kept, but this screen may be the one that names the points
          if (entry.segment) Board.nameSegment(entry.segment, self.later.bind(self));
          afterSeg();
        }
      };

      /* Everything a screen needs in place, applied behind whatever is
         covering the frame. Layout-driven rather than hard-coded, so a
         leaf sweep can land on the board layout or back on the field
         one equally well. */
      const dress = function () {
        Bubble.close();
        applyGeom(geom);
        el.standSwifty.classList.add('hidden');
        el.birdWin.classList.add('hidden');
        el.shadow.classList.add('lifted');
        /* A screen that keeps its drawing keeps it through the sweep
           too — only the count-out squares go. */
        if (entry.keepSegment) Board.clearUnits();
        else Board.clearSegment();
        /* A working written on the paper belongs to the screen that
           wrote it. The one after gets clean paper. */
        Board.clearWorkLines();
        /* The player's own measuring line is left lit when they get it
           right — on the screen they drew it, where it is the answer.
           It must not travel: it is 9px of light blue lying exactly
           along a 7px leg, drawn after it, so every screen after the
           counting showed that leg in the measure's colour instead of
           its own, and anything done to the leg happened underneath. */
        if (!entry.distance && !entry.entry) Board.clearMeasure();

        /* Only a board screen brings the board through the sweep; the
           field screens leave it behind entirely. */
        /* A distance question arrives with the frame empty and brings
           the board, the question and the controls in itself, in that
           order — so the sweep must not put any of them up early. */
        const holds = entry.intro === 'measure';
        if (onBoard && !holds) {
          Board.place(geom.panelBox || C.GRID.box);
          el.gridPanel.classList.remove('hidden');
          Board.shown = true;
          Board.setDots(!!entry.dots);
        } else {
          el.gridPanel.classList.add('hidden');
          Board.shown = false;
          Board.setDots(false);
          Board.clearSegment();
        }

        if (Sel) {
          if ((entry.distance || entry.entry) && !holds) { Sel.reset(); Sel.show(); }
          else Sel.hide();
        }
        if (Opts && !entry.options) Opts.hide();   // shown by revealControl
        dressTown(entry);

        if (entry.layout === 'recap') {
          Formula.place(C.RECAP.formula);
          Formula.setLines(C.RECAP.lines, C.RECAP.step);
          el.formulaBoard.classList.remove('hidden');
        } else if (AX) {
          Formula.place(AX.formula);
          Formula.setStep(AX.steps[0]);
          el.formulaBoard.classList.remove('hidden');
        } else {
          el.formulaBoard.classList.add('hidden');
        }
      };

      /* The map over the board, and the two things that sit with it in
         the control column. All three belong to the screen rather than
         to the component, and all three have to be taken away again by
         the screens that do not want them — a town left standing on the
         screen after is a town on the wrong board. */
      const dressTown = function (e) {
        if (Town) {
          if (e.town) { Town.set(C.TOWN.places); Board.onPlaced(); Town.show(); }
          else Town.hide();
        }
        if (Opts) Opts.setRow(!!e.optionRow);
        if (Opts && Opts.setTrio) Opts.setTrio(!!e.optionTrio);
        if (Hints) {
          if (e.hint) { Hints.set(e.hint); Hints.show(); } else Hints.hide();
        }
        /* A place marked on an earlier beat is a second dot and a
           second label on a point this one is drawing itself. */
        if (e.dropMarks) Board.clearFound();
        /* And a triangle that was the working's own scaffolding does
           not belong to the screen after it. */
        if (e.dropLegs) Board.clearLegs();
      };

      /* An axis case: plot the segment, then narrow the formula a step
         at a time until only the one difference that matters is left.
         Which axis it is lives entirely in the config passed in. */
      const runAxisCase = function (X) {
        const spec = { a: X.a, b: X.b, color: C.GRID.leg.color,
                       coordDy: X.coordDy, nameDy: X.nameDy };
        const step = function () {
          let t = 0;
          // the two zeros light up, and the formula takes them in
          self.later(function () { Board.glowCoords(true); SFX.tick(0); }, t += 500);
          /* The two zeros are read off the board, so they arrive from
             it. That term collapsing a beat later is only believable if
             the child watched the numbers that made it zero arrive in
             it — which is the entire argument this screen is making. */
          self.later(function () {
            Formula.setStep(X.steps[1]);
            SFX.draw();
            const half = X.a.coordParts.filter(function (p) { return p.glow; })[0];
            const node = el.formulaBoard.querySelector('.fb-step .glow');
            if (half && node) {
              self.flyInto({ from: { p: 'a', half: half.glow } }, node);
              self.later(function () {
                self.flyInto({ from: { p: 'b', half: half.glow } }, node);
              }, C.GRID.fly.pickMs + C.GRID.fly.ms);
            }
          }, t += 700);
          t += 2 * (C.GRID.fly.pickMs + C.GRID.fly.ms);
          // then that term collapses away
          self.later(function () { Formula.setStep(X.steps[2]); SFX.tick(3); }, t += 1400);
          self.later(function () { Formula.setStep(X.steps[3]); SFX.draw(); }, t += 900);
          // and the answer lands on the segment itself
          self.later(function () {
            Board.showSegResult(spec, X.result, X.resultDy, X.resultDx);
            Board.glowCoords(false);
            SFX.chime();
            SFX.sparkle();
          }, t += 900);
          self.later(function () { self.settle(); }, t += 900);
        };

        /* The line runs alongside the drawing rather than after it —
           the segment is what she is naming — but the formula only
           starts narrowing once it has been read. dress() cleared the
           frame behind the leaves, so she is put back up here. */
        const SEG_MS = 1980, LEAD = 700;
        let read = 0;
        if (entry.line) {
          self.later(function () {
            self.stay(function () {
              /* Her line is said, not `speak`ed: `speak` settles the
                 screen when the balloon finishes, and on this beat the
                 balloon finishes in the middle of the working. The
                 hand-over belongs to `step`, which is the thing that
                 knows when the working is done — the un-arming of Next
                 just below has always said so.

                 It never showed while the y-axis case was the last
                 screen in the game, because a settle with nothing
                 after it does nothing. Give it something to advance
                 to and the answer never reaches the segment. */
              const g = self.geom || {};
              const aim = g.aim || { x: C.ANCHOR.x, y: C.ANCHOR.y - 200 * C.CHAR_SCALE };
              self.state = 'speaking';
              FX.sparkles(aim.x, aim.y, 7, 170 * (g.scale || C.CHAR_SCALE));
              Bubble.open(entry.line);
            });
          }, LEAD);
          read = entry.line.length * 42 + 500;
        }
        Board.runSegment(spec, self.later.bind(self), function () {
          self.later(function () {
            // Next is armed by the line ending; hold it for the working
            el.nextBtn.classList.remove('ready');
            step();
          }, Math.max(LEAD, LEAD + read - SEG_MS));
        });
      };

      /* A distance question, from an empty frame: the board arrives on
         its own and draws its axes, the two points and their labels
         pop in one at a time with no line between them, Swifty flies
         in to put the question and leaves again, and only then does
         the board move aside for the banner and the slider. */
      const runMeasure = function () {
        self.state = 'entering';
        /* Kept: emptied for the new question rather than taken away, and
           live from the moment the points are down, so a child who is
           ahead of her can answer while she is still asking. */
        if (Sel) { if (keepsControl) Sel.reset(); else Sel.hide(); }
        if (Slots && !(entry.task && entry.task.kind === 'slots')) Slots.hide();

        /* A screen that follows straight on from the one before keeps
           the board it inherited, and her with it: no sweep, no
           rebuild, no slide. The points simply appear on the board
           already in front of them, which is the whole difference
           between this and a fresh question. */
        const inherited = entry.transition !== 'leaves' && Board.shown;
        if (!inherited) {
          el.gridPanel.classList.add('hidden');
          el.standSwifty.classList.add('hidden');
          el.birdWin.classList.add('hidden');
          Board.shown = false;
        }
        /* Points that have not changed stay exactly where they are.
           Taking them away and plotting them again — dots, then
           coordinates, then letters — makes a screen that is carrying
           straight on from the last one look like a new one, and the
           child watches the board they were already reading be rebuilt
           in front of them. Only what is new gets drawn. */
        /* And keeping is only keeping when what is up is this screen's
           own pair — see Board.showing. */
        const holds = !!entry.keepSegment && Board.shown &&
                      (!entry.segment || Board.showing(entry.segment));
        Board.setDots(false);
        if (holds) Board.clearUnits(); else Board.clearSegment();

        const plot = function () {
          Board.shown = true;

          /* 2. the points, then their coordinates, then their letters,
             then the dashed guide along the span being asked about.
             The solid line is still held back — that is the answer. */
          const measuringLeg = entry.task && entry.task.measureLeg != null;
          const laid = function (done) {
            if (holds) {
              // already on the board — but its letters may be new
              Board.nameSegment(entry.segment, self.later.bind(self));
              done();
              return;
            }
            Board.runPoints(entry.segment, self.later.bind(self), done, measuringLeg);
          };
          laid(function () {
            const asks = function () {
              /* She puts the question and stays, line and all — the
                 control arrives below her rather than in her place, so
                 there is no reason for her to leave. */
              /* A measure screen says its own line here rather than
                 through `after`, so a second line and its lights are
                 honoured here too, and in the same order as everywhere
                 else: each light waits for the sentence that introduces
                 it, and the control waits for the last of them rather
                 than landing on top of the thing being pointed at. */
              const speak = function () {
                FX.sparkles(geom.aim.x, geom.aim.y, 7, 170 * geom.scale);
                const lines = [entry.line, entry.line2].filter(Boolean);
                const step = function (n) {
                  if (n >= lines.length) return;
                  Bubble.open(lines[n], function () {
                    const run = self.lightAfterLine(entry, n);
                    const last = n + 1 >= lines.length;
                    /* Either way, the light finishes before anything
                       else begins — the next sentence, or the control. */
                    self.later(last ? opens : function () { step(n + 1); },
                               Math.max(last ? 700 : C.AUTO.betweenLines, run + 260));
                  });
                };
                step(0);
              };

              if (inherited) {
                // already standing here from the screen before
                self.stay(speak);
                return;
              }

              /* Otherwise the board moves aside as she arrives — the
                 same slide the grid screens use, and for the same
                 reason: there is someone to share the frame with now. */
              el.gridPanel.classList.add('sliding');
              Board.place(geom.panelBox);
              self.later(function () {
                el.gridPanel.classList.remove('sliding');
              }, 700);
              self.flyIn(speak);
            };
            /* A leg question draws the other legs, but not the one it
               is about: that side is what the player lays down with the
               control, so drawing it first both gives the answer away
               and leaves the far half of it sitting there in the leg's
               own colour while the measuring line covers the near half.
               Its corner and coordinates still go up — the question is
               how far, not where to. */
            /* Every leg is drawn, the measured one included, and the
               question comes after. The side being asked about used to
               be held back so the player laid it down themselves with
               the control — but the line reaching the corner is what
               names that corner and gives the question something to
               point at, so it goes down first and the counting happens
               along a side that is already there. */
            /* A screen can hold its legs back for the working. On the
               closing beat the triangle is not what is being asked
               about — the distance is — and a right-angled triangle
               already drawn round the line would be answering the
               question the working exists to answer. */
            if (entry.legs && !entry.legsLater) {
              /* The side being asked about goes down dotted: the count
                 lays a solid stroke along it, and a solid guide under a
                 solid stroke reads as one thick line rather than as
                 something being measured. */
              const drawn = entry.legs.map(function (l, i) {
                if (i !== (entry.task && entry.task.measureLeg)) return l;
                return Object.assign({}, l, { dash: true });
              });
              Board.runLegs(drawn, self.later.bind(self), asks);
            } else asks();
          });
        };

        if (inherited) {
          Board.place(geom.panelBox);
          plot();
        } else {
          // the board builds itself in the middle of an empty frame
          Board.place(C.GRID.centre);
          Board.run(self.later.bind(self), plot);
        }
      };

      /* 4. the controls arrive. The board does not move: she is still
         standing there with the question in her bubble, and the control
         comes in under her. */
      const opens = function () {
        self.later(function () {
          if (keepsControl) {
            // nothing to bring on; it never left, and it was reset above
          } else {
            revealControl(entry);      // she flies up, the control follows
            /* But not over a side they have already measured. AC is
               found on 24 and left lit along its own leg, which is
               correct; bringing 25's control on wiped it, and a moment
               later 25 redrew the same side as a settled leg — so it
               appeared, went, and came back. A length that has been
               found stays on the board, and the settled leg takes it
               over without a frame of nothing in between. */
            if (!Board.measureIsLit()) Board.clearMeasure();
          }
          self.settle();
        }, 240);
      };

      /* And a working written on the paper goes with the screen that
         wrote it, however the next one is arrived at. */
      Board.clearWorkLines();

      /* The picker is told where the game went, however it got there —
         her own hand-over, Back, Next, or a jump from the picker
         itself. */
      if (Jump) { Jump.close(); Jump.sync(); }

      /* Behind the leaves where there are leaves — dress() does it —
         and straight away where there are not. Either way it happens
         before anything is drawn, never after, or the town flashes up
         on the board the screen before was using. */
      if (entry.transition !== 'leaves') dressTown(entry);

      if (entry.transition === 'leaves') {
        this.state = 'entering';
        SFX.wind(FX.leaves.seconds);
        /* Points and lines are drawn before anyone speaks, so the
           child sees what is being talked about. */
        FX.leaves(el.leafLayer, dress, function () {
          if (AX) runAxisCase(AX);
          else if (entry.intro === 'measure') runMeasure();
          else plotThen(arrive);
        });
        return;
      }

      // a distance question rebuilds from an empty frame, every time
      if (entry.intro === 'measure') { runMeasure(); return; }

      if (geom.panelBox) Board.place(geom.panelBox);
      else Board.place(C.GRID.box);

      /* Screens 9-11 stay on the board they inherited: no leaves, no
         rebuild — just clear the last segment and plot the next. */
      if (entry.layout === 'board' && entry.transition !== 'leaves') {
        el.gridPanel.classList.remove('hidden');
        Board.shown = true;
        if (!entry.keepSegment) Board.clearSegment();
        else Board.clearUnits();          // keep the drawing, drop any count-out
        if (!entry.distance && !entry.entry) Board.clearMeasure();
        /* A control that revealControl is going to bring in must not be
           up already: it rises into the space under her once she has
           asked the question, not before she has opened her mouth. */
        const brought = withControl && !!entry.line && !keepsControl;
        if (Sel && (entry.distance || entry.entry) && !brought) { Sel.reset(); Sel.show(); }
        if (Opts && entry.options && !brought) { Opts.reset(); Opts.show(); }
        const asksSlots = entry.task && entry.task.kind === 'slots';
        if (Slots && asksSlots && !brought) { Slots.reset(); Slots.show(); }
        /* And one the screen before left standing has to go. Not showing
           it is only half of "must not be up already" — it was already
           there, so the screen has to take it away. */
        if (brought) { if (Sel) Sel.hide(); if (Opts) Opts.hide(); if (Slots) Slots.hide(); }
      }

      /* A grid screen builds the board in first — but only if it is
         not already standing from the screen before, so screen 6
         carries straight on from 5 instead of rebuilding it. */
      /* Plot the segment before asking about it, on any screen that
         has one. */
      if (entry.layout === 'grid' && !Board.shown) {
        /* A screen that brings her in builds the board centred first
           and only moves it aside once she is on her way — until then
           there is nobody to share the frame with, so the board has no
           reason to sit off to one side. Screens where she is already
           standing inherit the board where it is and skip all this. */
        const slides = entry.entrance === 'fly';
        if (slides) Board.place(C.GRID.centre);
        Board.run(this.later.bind(this), function () {
          Board.setDots(!!entry.dots);
          if (slides) {
            el.gridPanel.classList.add('sliding');
            Board.place(C.GRID.box);
            self.later(function () {
              el.gridPanel.classList.remove('sliding');
            }, 700);
          }
          plotThen(arrive);
        });
      } else {
        Board.setDots(!!entry.dots);
        plotThen(arrive);
      }
    },

    /* Down onto one of the answers, rather than onto the panel as a
       whole. She lands on the button named by the screen — its top
       edge, the way she already perches on the selector's frame — and
       asks from there. */
    perchOn: function (key, done) {
      const self = this;
      const g = standGeom(C.BOARD.perch, {
        noShadow: true,          // she is standing on a button, not on grass
        panelBox: { x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                    w: C.BOARD.panel.w, h: C.BOARD.panel.h }
      });
      /* Which button, worked out from the screen's own answers rather
         than typed twice: the perch is seated on the right-hand one, so
         a left-hand key steps back by the width of a button and its
         gap. */
      const entry = C.SCRIPT[this.index] || {};
      const list = entry.options || [];
      let n = list.length - 1;
      for (let i = 0; i < list.length; i++) if (list[i].key === key) n = i;
      const O = C.BOARD.options;
      const step = (O.w - 2 * (9 + 28) + 24) / 2 * O.scale;
      const shift = (n - (list.length - 1)) * step;
      if (shift) {
        g.standBox.x += shift;
        g.anchor.x += shift;
        g.aim.x += shift;
      }
      /* Seat the rig on the button and then use the ordinary entrance:
         flyIn lands her wherever `geom` says, so the perch needs no
         flight of its own. */
      this.geom = g;
      this.raised = true;
      applyGeom(g);
      this.flyIn(done);
    },

    /* Swifty flies in from off-stage on the fly sheet, then lands. */
    flyIn: function (done) {
      const self = this;
      el.birdWin.classList.remove('hidden');
      el.standSwifty.classList.add('hidden');
      el.birdFlip.classList.remove('turn');   // she arrives facing right
      Sprite.play('fly', true);
      el.birdRig.classList.remove('hop');
      // Same frame: drop the hold and start the arc. The animation's 0%
      // keyframe is off-stage at opacity 0, so there is no flash of her
      // standing at the landing spot.
      el.birdRig.classList.remove('pre-entrance');
      el.birdRig.classList.add('fly-in');
      el.shadow.classList.add('lifted');      // no shadow while airborne

      // one wing-beat sound per pair of frames during the approach
      let beats = 0;
      const flapper = setInterval(function () {
        SFX.flap();
        if (++beats > 11) clearInterval(flapper);
      }, 155);

      let settled = false;
      /* Tear-down shared by a normal landing and a skip, so tapping
         Next mid-flight cannot leave her stuck in the air. */
      const groundHer = function () {
        settled = true;
        el.birdRig.removeEventListener('animationend', onEnd);
        clearInterval(flapper);
        el.birdRig.classList.remove('fly-in');
        el.shadow.classList.remove('lifted'); // shadow settles under her
        Sprite.stopAt('talk', 0);
      };
      const onEnd = function () {
        if (settled) return;
        groundHer();
        self.entranceCancel = null;
        // On the board screen she settles into the standing artwork,
        // which is drawn at the same size the sheet lands at.
        if (self.geom && self.geom.stand) {
          el.birdWin.classList.add('hidden');
          el.standSwifty.classList.remove('hidden', 'land-in');
          void el.standSwifty.offsetWidth;
          el.standSwifty.classList.add('land-in');
        }
        SFX.land();
        const g = self.geom || { anchor: C.ANCHOR, feetY: C.ANCHOR.y + C.FEET_DY };
        FX.puff(g.anchor.x - 10, g.feetY);
        FX.sparkles(g.anchor.x, g.anchor.y - 120 * C.CHAR_SCALE, 12, 190 * C.CHAR_SCALE);
        SFX.sparkle();
        self.later(done, 320);
      };
      this.entranceCancel = groundHer;
      el.birdRig.addEventListener('animationend', onEnd);
    },

    /* She flies on out to the right, carrying straight on past where
       she landed, and the screen hands over once she is gone. */
    flyOut: function (done) {
      const self = this;
      el.birdWin.classList.remove('hidden');
      el.standSwifty.classList.add('hidden');
      Sprite.play('fly', true);
      el.birdRig.classList.remove('fly-in', 'hop', 'pre-entrance');
      void el.birdRig.offsetWidth;
      el.birdRig.classList.add('fly-out');
      el.birdFlip.classList.remove('turn');   // she leaves the way she came in
      el.shadow.classList.add('lifted');
      const g = this.geom || { anchor: C.ANCHOR, feetY: C.ANCHOR.y + C.FEET_DY };
      FX.puff(g.anchor.x - 10, g.feetY);
      SFX.flap();

      let beats = 0;
      const flapper = setInterval(function () {
        SFX.flap();
        if (++beats > 8) clearInterval(flapper);
      }, 165);

      let gone = false;
      const finish = function () {
        if (gone) return;
        gone = true;
        el.birdRig.removeEventListener('animationend', finish);
        clearInterval(flapper);
        el.birdRig.classList.remove('fly-out');
        el.birdRig.classList.add('pre-entrance');   // off-stage again
        el.birdFlip.classList.remove('turn');
        Sprite.stopAt('talk', 0);
        self.entranceCancel = null;
        self.later(done, 120);
      };
      this.entranceCancel = function () {
        gone = true;
        el.birdRig.removeEventListener('animationend', finish);
        clearInterval(flapper);
        el.birdRig.classList.remove('fly-out');
        el.birdRig.classList.add('pre-entrance');
        el.birdFlip.classList.remove('turn');
        Sprite.stopAt('talk', 0);
      };
      el.birdRig.addEventListener('animationend', finish);
    },

    /* Talking only: she is already standing where she landed, so the
       fly sheet is not touched — just settle on the talking pose and
       let the next bubble come up. */
    stay: function (done) {
      el.birdRig.classList.remove('fly-in', 'hop', 'pre-entrance');
      el.shadow.classList.remove('lifted');
      if (this.geom && this.geom.stand) {
        /* Assert the standing artwork rather than assuming the screen
           before left it up — skipping screen 5 mid-build would
           otherwise land here with no Swifty at all. */
        el.birdWin.classList.add('hidden');
        el.standSwifty.classList.remove('hidden');
      } else {
        el.birdWin.classList.remove('hidden');
        Sprite.stopAt('talk', 0);
      }
      this.later(done, 140);
    },

    /* A short flap-and-hop in place. Unused by the current script —
       set a screen's `entrance` to 'hop' in config to bring it back. */
    hop: function (done) {
      Sprite.play('fly', true);
      el.birdRig.classList.remove('hop', 'pre-entrance');
      void el.birdRig.offsetWidth;
      el.birdRig.classList.add('hop');
      el.shadow.classList.add('lifted');
      SFX.flap();
      this.later(function () { SFX.flap(); }, 190);

      this.later(function () {
        el.birdRig.classList.remove('hop');
        el.shadow.classList.remove('lifted');
        Sprite.stopAt('talk', 0);
        SFX.land();
        FX.puff(C.ANCHOR.x - 10, C.ANCHOR.y + C.FEET_DY);
        done();
      }, 720);
    },

    /* `then` runs once the line has finished — a screen with a control
       uses it to move her aside and bring the control in, so the two
       happen after she has spoken rather than while she is speaking. */
    speak: function (line, then) {
      const self = this;
      this.state = 'speaking';
      /* Over her head wherever she is standing — the default anchor is
         only right on the screens she has not moved from. */
      const g = this.geom || {};
      const aim = g.aim || { x: C.ANCHOR.x, y: C.ANCHOR.y - 200 * C.CHAR_SCALE };
      FX.sparkles(aim.x, aim.y, 7, 170 * (g.scale || C.CHAR_SCALE));
      Bubble.open(line, function () {
        if (then) then();
        /* Longer after a right answer than after an ordinary line: the
           confetti is still coming down — and a screen that goes on
           drawing after she has stopped talking can name its own pause,
           or it is taken away mid-working. */
        const e = C.SCRIPT[self.index] || {};
        self.settle(e.hold != null ? e.hold
          : (self.task && self.task.done ? C.AUTO.afterCorrect : C.AUTO.afterLine));
      });
    },

    /* Lines said one after the other, and NOTHING settled at the end of
       them. `speak` hands the screen on when its balloon finishes,
       which is right for a beat whose last act is speaking — and wrong
       for one that goes on to write a derivation, because the screen
       would be carried off while the working was still being written.
       Whatever follows owns the hand-over. */
    sayLines: function (list, then, each) {
      const self = this;
      this.state = 'speaking';
      const g = this.geom || {};
      const aim = g.aim || { x: C.ANCHOR.x, y: C.ANCHOR.y - 200 * C.CHAR_SCALE };
      FX.sparkles(aim.x, aim.y, 7, 170 * (g.scale || C.CHAR_SCALE));
      const step = function (i) {
        if (i >= list.length) { if (then) then(); return; }
        Bubble.open(list[i], function () {
          /* Her line, then its light — and the NEXT line waits for that
             light to finish. Two sides lit one after the other take
             longer than the breath between two sentences, so the second
             of them landed under the sentence about the third side. A
             light belongs to the words that introduced it at both ends. */
          const run = each ? (each(i) || 0) : 0;
          self.later(function () { step(i + 1); },
                     Math.max(C.AUTO.betweenLines, run + 260));
        });
      };
      step(0);
    },

    /* Two things said on one beat, one after the other.

       `speak` settles the screen when its balloon finishes, which is
       right for a beat that says one thing and wrong for a beat that
       says two: the hand-over would be armed while she was still
       talking, and a short hold would carry the screen off mid-sentence.
       So the first line is opened rather than spoken, and only the
       second one settles. */
    speakBoth: function (a, b, then, each) {
      const self = this;
      this.state = 'speaking';
      const g = this.geom || {};
      const aim = g.aim || { x: C.ANCHOR.x, y: C.ANCHOR.y - 200 * C.CHAR_SCALE };
      FX.sparkles(aim.x, aim.y, 7, 170 * (g.scale || C.CHAR_SCALE));
      Bubble.open(a, function () {
        const run = each ? (each(0) || 0) : 0;
        self.later(function () {
          self.speak(b, function () { if (each) each(1); if (then) then(); });
        }, Math.max(C.AUTO.betweenLines, run + 260));
      });
    },

    /* She has said it, so the balloon goes. On a screen that stays open
       for another go it would otherwise sit there for the rest of the
       question — the child reading "Not quite! Try again!" over their
       second attempt, and their third. Called once she has finished
       typing, so it waits out whatever is left of her voice first.

       The balloon is only ever on screen while there are words being
       said in it; this is the wrong-answer half of that. */
    closeAfterLine: function (extra) {
      this.later(function () { Bubble.close(); },
                 Bubble.voiceTail + (extra != null ? extra : 420));
    },

    /* Heard, not read. The screen has already shown how it went — a red
       border, a dot lighting up — so the words would only be repeating
       it. She still says them; there is just nothing to read.

       Bubble.close() stops the voice, so it has to go first, and the
       hand-over is armed off the clip's own length because there is no
       balloon finishing to ride on. */
    sayOnly: function (line, then) {
      const self = this;
      this.state = 'speaking';
      Bubble.close();
      SFX.duck(true);                                  // dip the music under her
      if (!standPose) Sprite.play('talk', true);       // her beak still moves
      const ms = (window.Voice && window.Voice.say(line)) || 0;
      this.later(function () {
        SFX.duck(false);
        if (!standPose) Sprite.stopAt('talk', 0);
        if (then) then();
        /* A beat that names its own hold is honoured here too: without it
           a line said without a balloon takes the ordinary pause and the
           board is carried off mid-sequence. */
        const scr = C.SCRIPT[self.index] || {};
        self.settle(scr.hold != null ? scr.hold
          : (self.task && self.task.done ? C.AUTO.afterCorrect : C.AUTO.afterLine));
      }, (ms || 700) + 180);
    },

    /* Some moments need no words: the point lighting up under their
       finger says "right" better than the word does, and a child who
       has just tapped the wrong square can see that without being told.
       Where a screen carries no line for one of those, there is no
       bubble to finish — and the hand-over rides on the bubble
       finishing — so it has to be armed here instead, or the screen
       would sit there for ever with Next unarmed. */
    finishWith: function (line, pause, then) {
      if (line) { this.speak(line, then); return; }
      /* Nothing to say, so nothing to say it in: the balloon goes rather
         than sitting there holding the last thing she said. It is only
         on screen when there are words in it. */
      Bubble.close();
      if (then) then();
      /* `pause` is how long the board is left up to be read. It only
         applies to the wordless path — a line sets its own, by how long
         she takes to say it.

         A screen that names its own hold is honoured here too. Without
         that, a question answered right with nothing to say took the
         ordinary two seconds and the board was carried off in the
         middle of whatever it was still drawing. */
      const scr = C.SCRIPT[this.index] || {};
      this.settle(pause != null ? pause
        : scr.hold != null ? scr.hold
        : (this.task && this.task.done ? C.AUTO.afterCorrect : C.AUTO.afterLine));
    },

    /* ---------------- numbers come from somewhere ----------------

       A working does not invent its numbers. The ones that could have
       been read off the board arrive by leaving the board: a copy lifts
       out of the coordinate half or the leg length it was read from,
       carries across the screen, and lands in the slot that needed it.
       The ones that were worked out — the squares, the sums — simply
       appear, because that is what they are: arithmetic, not reading.

       That distinction is the whole teaching. `(x2 - x1)` is not hard
       arithmetic, it is hard REFERENCE: the child has to hold that x2
       is an address on the board rather than a value, and a formula
       that writes itself out of thin air hides exactly that. */

    /* Where a part says it was read from, as a place on the stage.
       `from: { p: 'a'|'b', half: 'x'|'y' }` — a half of a coordinate
       label; `from: { leg: 0|1 }` — a leg's own written length. */
    sourceSpot: function (from) {
      if (!from) return null;
      /* A SIDE of the drawing, named rather than measured. It comes
         from the middle of its own span, because that is what the name
         refers to — not a number sitting at one end of it but the
         whole run from one corner to the other. */
      if (from.side) {
        const ends = Board.sideEnds(from.side);
        if (!ends) return null;
        const G = C.GRID;
        const mx = G.originX + (ends.from.x + ends.to.x) / 2 * G.stepX;
        const my = G.originY - (ends.from.y + ends.to.y) / 2 * G.stepY;
        const s = Board.boardToStage(mx, my);
        return { x: s.x, y: s.y,
                 size: C.GRID.segment.nameSize * Board.typeScale() * s.k,
                 side: from.side };
      }
      if (from.leg != null) {
        const L = Board.legSlots && Board.legSlots[from.leg];
        if (!L || !L.len || !L.len.textContent) return null;
        if (!L.len.classList.contains('pop')) return null;   // not up yet
        const x = parseFloat(L.len.getAttribute('x')),
              y = parseFloat(L.len.getAttribute('y'));
        if (!isFinite(x) || !isFinite(y)) return null;
        const s = Board.boardToStage(x, y);
        return { x: s.x, y: s.y,
                 size: C.GRID.leg.lenSize * Board.typeScale() * s.k,
                 text: (L.len.textContent || '').split('\u00A0')[0] };
      }
      /* A coordinate half. It can only be found where the label was
         built in parts — a plain label is one run of text with no
         halves to point at — so a screen that wants this says so in
         its own `coordParts`. */
      const spot = Board.partSpot(from.p, from.half);
      if (!spot) return null;
      const s = Board.boardToStage(spot.x, spot.y);
      return { x: s.x, y: s.y, size: spot.size * s.k, text: spot.text,
               p: from.p, half: from.half };
    },

    /* Carries one number out of the board and into the slot waiting for
       it. Lights where it came from as it leaves, and lets go as it
       lands — the original never moves, never empties, never resizes. */
    flyInto: function (part, node) {
      const src = this.sourceSpot(part.from);
      /* No source on the board — the label was never built in parts, or
         the leg is not up yet. The number simply appears, which is what
         every working did before this existed. */
      if (!src || !node) return 0;
      /* A side brings no text of its own, so it carries what is written
         in the slot it is flying into, with the brackets and the square
         left behind: `(AB)²` flies as `AB`, the same way a leg's
         `4 units` flies as `4`. Taken from the part rather than read
         off the corners so the glyph can never say one thing while the
         slot it lands in says another. */
      if (!src.text) {
        const t = (part.t || '').replace(/\u00A0/g, ' ');
        const inner = t.match(/\(([^)]*)\)/);
        src.text = inner ? inner[1] : t.replace(/[\u00B2\u00B3\s]+$/, '');
      }
      const F = C.GRID.fly;
      const st = el.stage.getBoundingClientRect();
      const k = st.width / C.STAGE_W || 1;
      const r = node.getBoundingClientRect();
      const to = { x: (r.x + r.width / 2 - st.x) / k,
                   y: (r.y + r.height / 2 - st.y) / k,
                   size: parseFloat(getComputedStyle(node).fontSize) / 1 || 34 };
      const self = this;
      /* Lit WHERE IT IS, before it moves. For a coordinate half that is
         the half glowing; for a side it is the side coming forward and
         the rest of the drawing stepping back — which is the answer to
         "where did that come from", given before the question. */
      if (src.p) Board.glowPart(src.half, true, src.p);
      else if (src.side) Board.spotlightPart(src.side);
      SFX.tick(2);
      this.later(function () {
        FX.flyGlyph(src.text, src, to, F.ms, function () {
          if (src.p) Board.glowPart(src.half, false, src.p);
          SFX.blip();
        });
      }, F.pickMs);
      return F.pickMs + F.ms;
    },

    /* And the other direction: the answer leaving the working and
       landing on the thing it measures.

       Not the answer said twice. It is the same statement relocating —
       the working has finished making it, and where it belongs is on
       the line, which is where the child will look for it. The board's
       own sum has ended this way since it was built; this is that
       ending, for the workings that happen in a panel. */
    flyAnswerHome: function (t, then) {
      const spec = t && t.spec, seg = (C.SCRIPT[this.index] || {}).segment;
      const F = C.GRID.fly, self = this;
      const done = function () { if (then) then(); };
      if (!spec || !spec.formula || !seg || !Opts) { done(); return 0; }

      /* The part the working marked as the one that goes home, and the
         node it was written into. */
      let node = null, text = null, idx = -1;
      const view = Opts.el.querySelector('.formula-view');
      if (view) spec.formula.forEach(function (l, li) {
        (l.parts || []).forEach(function (p, pi) {
          if (!p.home || node) return;
          const line = view.children[li];
          if (line) { node = line.children[pi]; text = p.t; idx = li; }
        });
      });
      if (!node) { done(); return 0; }

      const st = el.stage.getBoundingClientRect();
      const k = st.width / C.STAGE_W || 1;
      const r = node.getBoundingClientRect();
      const from = { x: (r.x + r.width / 2 - st.x) / k,
                     y: (r.y + r.height / 2 - st.y) / k,
                     size: parseFloat(getComputedStyle(node).fontSize) || 34 };
      /* Where it is going: the middle of the pair, in stage terms — the
         same place showSegResult is about to write it. */
      const G = C.GRID;
      const mid = Board.boardToStage(
        (G.originX + (seg.a.x + seg.b.x) / 2 * G.stepX),
        (G.originY - (seg.a.y + seg.b.y) / 2 * G.stepY));
      const to = { x: mid.x, y: mid.y,
                   size: (G.segment.resSize || G.segment.coordSize) *
                         Board.typeScale() * mid.k };
      node.classList.add('gone');
      FX.flyGlyph(text.replace(/\u00A0/g, ' '), from, to, F.ms, function () {
        Board.showSegResult(seg, text);
        SFX.sparkle();
        done();
      });
      return F.ms + 200;
    },

    /* The Check button on the distance panel. */
    /* The two points a distance question is about: a named leg, or the
       segment itself. Read from the board rather than typed into the
       task, so a moved point can never leave a stale answer behind.
       Both the slider's line and the grading go through here, so the
       two can never disagree about what is being measured. */
    measurePair: function () {
      const entry = C.SCRIPT[this.index] || {};
      const t = this.task;
      const sg = entry.segment;
      let from = sg ? sg.a : null, to = sg ? sg.b : null;
      if (t && t.spec.measureLeg != null && entry.legs && entry.legs[t.spec.measureLeg]) {
        const L = entry.legs[t.spec.measureLeg];
        from = L.from; to = L.to;
      }
      if (!from || !to) return null;
      /* Always measured left to right, and top to bottom on a vertical
         pair, whichever order the script happens to list the two points
         in — otherwise the line grows backwards on the screens whose
         first point is the right-hand or lower one. The answer is the
         same either way, since it is a distance. */
      const backwards = (to.x < from.x) || (to.x === from.x && to.y > from.y);
      return backwards ? { from: to, to: from } : { from: from, to: to };
    },

    /* How many whole units the ruled paper allows from where the count
       sets off — the same reach countOut clamps to, worked out from the
       same normalised direction. The control must not offer a number
       the board cannot draw: picking 8 where only four units of paper
       lie past the start drew four and then wrote "8 units" under it,
       which is the label telling the child something untrue. */
    paperSteps: function () {
      const pair = this.measurePair();
      if (!pair) return null;
      let from = pair.from, to = pair.to;
      if (to.x < from.x || (to.x === from.x && to.y < from.y)) {
        const swap = from; from = to; to = swap;
      }
      const dx = to.x - from.x, dy = to.y - from.y, span = Math.hypot(dx, dy);
      if (!span) return null;
      const ux = dx / span, uy = dy / span, P = C.GRID.paper;
      let reach = Infinity;
      if (ux > 0) reach = Math.min(reach, (P.gxTo   - from.x) / ux);
      if (ux < 0) reach = Math.min(reach, (P.gxFrom - from.x) / ux);
      if (uy > 0) reach = Math.min(reach, (P.gyTo   - from.y) / uy);
      if (uy < 0) reach = Math.min(reach, (P.gyFrom - from.y) / uy);
      return Math.max(1, Math.floor(reach + 1e-9));
    },

    /* Both numeric questions answer the same way now: the control
       closes, their number is counted out on the board, and only then
       does the verdict land. Split out because the two used to say the
       same thing twice with slightly different timing. */
    revealAnswer: function (v, right, correctLine) {
      const t = this.task, self = this;
      const pair = this.measurePair();
      if (!pair) return;
      this.state = 'showing';
      if (Sel) Sel.lock();          // nothing to fiddle while it counts

      /* The screens where counting is still new say so while it runs.
         Said on every answer, never only on a wrong one — a line that
         turned up only when you were wrong would give the game away
         before the count had finished. */
      const narrate = t.spec.showLine;

      /* The verdict lands when the count does — and the count only
         sets off once she has finished asking for it. */
      const verdict = function () {
        if (right) {
          t.done = true;
          self.state = 'waiting';
          SFX.correct();
          /* Past the beats that teach it: they are for a child who did
             not get here. The choice path has had this since the café
             beat; a numeric question can want it just as much. */
          if (t.spec.rightAt != null) self.branch = t.spec.rightAt;
          /* A length they worked out, written on the side it belongs to
             and left there. A beat that measures three sides one at a
             time has to keep the ones already found — the board filling
             up in front of them IS the argument the last screen makes,
             and a length that arrives and leaves has made none of it. */
          if (t.spec.keepLength) self.writeLength(t);
          if (Sel) Sel.markCorrect();
          // nothing was walked out on the Pythagoras screens, so there
          // is no line from A to B to leave lit
          if (!t.spec.noCount) Board.litMeasure();
          /* Out of the number they just found. It used to come out of
             the far point — the end of the line — which is where the
             drawing finishes, not where the answer is: the child is
             looking at "4 units", and that is the thing that was got
             right. Worked out inside the beat rather than before it,
             so a length still arriving has landed by the time the
             confetti comes out of it; a screen that writes no total
             still gets the far point. */
          self.later(function () {
            const at = Board.totalSpot(t.spec.measureLeg) ||
                       Board.stagePos(pair.to.x, pair.to.y);
            SFX.cheer();
            SFX.confettiPop();
            FX.pop(at.x, at.y, 18);
            self.finishWith(correctLine);
          }, 260);
          return;
        }
        /* Wrong: the count they asked for is on the board, so the miss
           is there to be seen — short of the point, or a unit past it.
           She says so, it is left up to be read, and then the board is
           handed back empty. */
        t.wrong++;
        SFX.wrong();
        if (Sel) Sel.markWrong();
        self.state = 'waiting';
        /* They have had their ungiven go. Now the slider becomes the
           ruler it looks like. */
        if (t.spec.rulerAfterMiss) self.later(function () { self.armRuler(); }, 640);
        // the ladder is read after the count, not before: feedbackFor
        // indexes on how many have been got wrong, this one included
        /* Two misses in is where a child needs showing rather than
           telling: she names what is about to happen and the units
           between the points are laid out to be counted. The question
           stays theirs — the band is the help, not the answer. */
        const fb = self.feedbackFor(t);

        /* Both hints spent. The answer is not asked for a fourth time,
           it is shown: the two sides measured on the board and then AB,
           which is the working itself rather than a sentence about it.
           The question is over, so nothing is cleared away after. */
        /* Out of hints, and the teaching is a beat of its own rather
           than a working written here. The asking stops and the screen
           hands over to it; she says so there, not here, because a
           child needs a moment to stop being wrong before they can
           start learning. */
        if (fb.exhausted && t.spec.teachAt != null) {
          t.done = true;
          self.state = 'waiting';
          if (Sel) Sel.lock();
          self.branch = t.spec.teachAt;
          self.later(function () { self.settle(C.AUTO.afterSilent); }, 520);
          return;
        }

        if (fb.exhausted && t.spec.showWorking) {
          t.done = true;
          self.writing = true;      // from here the screen belongs to it
          if (Sel) Sel.lock();
          const screen = C.SCRIPT[self.index] || {};
          self.later(function () {
            /* The two sides measured on the board first — they are what
               the working is about to square and add, so they have to be
               there before it does. */
            const ms = self.showWorking(screen);
            self.later(function () {
              if (t.spec.formula) {
                self.workThrough(t, function () { self.settle(C.AUTO.afterLine); });
              } else {
                self.settle(C.AUTO.afterReveal);
              }
            }, ms);
          }, 420);
          return;
        }

        const helping = fb.exhausted && !!t.spec.countLine;
        const msg = helping ? t.spec.countLine : fb.msg;

        /* "Count the spaces between the two points" — and then they
           are counted. In that order.

           The count used to be started first and the sentence 320ms
           after it, so the first square was already lit while she was
           still asking for it, and the count played twice to make up
           for the words having arrived underneath the first pass.
           Nothing on the board moves until she has finished the
           sentence that introduces it.

           And then the beat is over. This was the only branch of a
           spent ladder that left the question armed, so a child who
           had just been shown the answer was asked for it again. */
        if (helping) {
          t.done = true;
          if (Sel) Sel.lock();
          const UC = C.GRID.unitBox.count;
          self.later(function () {
            Bubble.open(msg, function () {
              self.closeAfterLine();
              self.later(function () {
                const counting =
                  Board.countUnits(pair.from, pair.to, self.later.bind(self));
                SFX.sparkle();
                self.later(function () {
                  /* The squares go first. Then, on the empty line, the
                     number they came to — so the count is read as a
                     count and its answer arrives as an answer, rather
                     than the two being on the board at once. */
                  Board.clearUnits();
                  Board.clearMeasure();
                  self.later(function () {
                    const real = Math.round(Math.hypot(
                      pair.to.x - pair.from.x, pair.to.y - pair.from.y));
                    const txt = real + '\u00A0unit' + (real === 1 ? '' : 's');
                    const ent = C.SCRIPT[self.index] || {};
                    if (t.spec.measureLeg != null) {
                      Board.showLegTotal(t.spec.measureLeg, real,
                                         pair.from, pair.to);
                    } else if (ent.segment) {
                      Board.showSegResult(ent.segment, txt);
                    }
                    SFX.chime();
                    self.later(function () { self.settle(C.AUTO.afterLine); },
                               C.GRID.unitBox.holdMs);
                  }, 420);
                }, counting + UC.readMs);
              }, Bubble.voiceTail + 260);
            });
          }, 320);
          return;
        }

        self.later(function () {
          /* The count they asked for is on the board, short of the
             point or a unit past it, and that is the answer to what
             went wrong. Words or none, it is left up to be read and
             then taken away — the hold cannot ride on a line that may
             not exist, or the board would never clear and the control
             never come back. */
          self.finishWith(msg, C.AUTO.afterLine, function () {
            self.closeAfterLine();
            self.later(function () { self.clearWorking(); },
                       C.GRID.unitBox.holdMs);
          });
        }, 320);
      };

      /* Her line first, then the stroke. The two used to run together,
         so she was still saying "let's count the units" while the line
         was already two units along — the words described something
         that had already happened. Now the stroke sets off as she
         finishes, and the counting is the answer to what she just
         said. The short beat between is her voice tailing off.

         Queued through later(), so skipping the screen cancels the
         count along with everything else it had pending. */
      const run = function () {
        self.state = 'showing';
        /* A diagonal is the one length that cannot be counted off the
           grid, which is exactly what these screens are teaching. No
           line is walked out along AB; the verdict lands on its own. */
        if (t.spec.noCount) { verdict(); return; }
        Board.countOut(pair.from, pair.to, v, self.later.bind(self), verdict,
                       t.spec.measureLeg, right);
      };
      if (narrate) this.speak(narrate, function () {
        // wait out whatever is left of her voice, then a breath
        self.later(run, Bubble.voiceTail + 60);
      });
      else run();
    },

    /* The worked solution, shown rather than told: each side measured
       in turn, then AB written along the line between the two points.
       Every number is read off the legs themselves, so a screen that
       moves its points cannot leave a stale one behind. Returns how
       long it all takes, so the caller can wait it out. */
    showWorking: function (entry) {
      const self = this, legs = entry.legs || [], seg = entry.segment;
      const G = C.GRID, SG = G.segment;
      let delay = 0;
      legs.forEach(function (spec, i) {
        self.later(function () {
          // placeLeg works the length out from the leg's own two ends
          Board.placeLeg(i, Object.assign({}, spec, { length: true }));
          /* A screen that held its triangle back until now has never
             drawn these, so the working is the thing that puts them
             up. On a screen that drew them with the question this
             changes nothing — they are already on. */
          if (entry.legsLater) Board.revealLeg(i, spec.dash);
          Board.showLegLength(i);
          SFX.tick(2 + i);
        }, delay);
        delay += 640;
      });
      if (!seg) return delay;

      /* AB goes on the far side of the hypotenuse from the right angle,
         so it can never land on a leg or on C — then steps out along
         that same line until it is clear of the x-axis numbers, which
         is where the second screen's midpoint otherwise falls. */
      const corner = legs[0] && legs[0].to;
      const mx = (seg.a.x + seg.b.x) / 2, my = (seg.a.y + seg.b.y) / 2;
      let dx = 0, dy = -26;
      if (corner) {
        const vx = mx - corner.x, vy = my - corner.y;
        const L = Math.hypot(vx, vy) || 1;
        const ux = vx / L, uy = vy / L;
        dx = ux * 76;
        dy = -uy * 76;                 // grid y counts up, screen y counts down
        const midY = G.originY - my * G.stepY;
        let guard = 0;
        while (Board.onXAxisRow(midY + dy, SG.coordSize) && guard++ < 10) {
          dx += ux * 20;
          dy += -uy * 20;
        }
      }
      /* Where a panel is going to write the working out, the board
         stops at the two sides: stating the answer twice, once on the
         line and once in the working, makes the working look like a
         caption for something already settled. */
      if (this.task && this.task.spec && this.task.spec.formula) return delay + 240;

      const txt = 'AB\u00A0=\u00A0' + this.task.spec.answer + '\u00A0units';
      this.later(function () {
        Board.showSegResult(seg, txt, dy, dx);
        SFX.sparkle();
      }, delay + 160);
      return delay + 900;
    },

    /* The count goes and the control comes back, ready for another go. */
    clearWorking: function () {
      Board.clearUnits();
      Board.clearMeasure();
      if (Sel && !(this.task && this.task.done)) Sel.reset();
    },

    checkDistance: function (v) {
      const t = this.task;
      if (!t || t.done) return;

      // only axis-aligned pairs are asked about, so one term is zero
      const pair = this.measurePair();
      const answer = t.spec.answer != null ? t.spec.answer
        : (pair ? Math.abs(pair.to.x - pair.from.x) + Math.abs(pair.to.y - pair.from.y) : null);

      this.revealAnswer(v, v === answer, t.spec.correctLine);
    },

    /* A typed answer. The right answer is worked out from the board
       rather than trusted from config where it can be: the legs are
       measured off the two points, so a moved point cannot leave a
       stale answer behind. */
    checkEntry: function (v) {
      const t = this.task;
      if (!t || t.done) return;
      const entry = C.SCRIPT[this.index] || {};

      let answer = t.spec.answer;
      /* Which two points the question is about. Ordinarily the pair
         itself; on a screen that asks for one SIDE of a triangle, that
         side — or every side of a three-sided shape would be checked
         against the length of the one the board happens to call its
         segment. */
      const leg = t.spec.measureLeg != null && (entry.legs || [])[t.spec.measureLeg];
      const ends = leg ? { a: leg.from, b: leg.to } : entry.segment;
      if (ends) {
        const a = ends.a, b = ends.b;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        // only whole answers are asked for, so a clean one wins
        if (Math.abs(d - Math.round(d)) < 1e-9) answer = Math.round(d);
      }

      this.revealAnswer(v, v === answer, t.spec.correctLine);
    },

    /* The slider turning into a ruler. From here it lays a line out of
       the first point along the pair's own bearing, as long as the
       number it is showing — short of the second point, past it, or
       exactly on it. It is armed once, by the first miss. */
    armRuler: function () {
      const self = this;
      if (!Sel || this.ruler) return;
      const pair = this.measurePair();
      if (!pair) return;
      this.ruler = true;
      const dx = pair.to.x - pair.from.x, dy = pair.to.y - pair.from.y;
      const span = Math.hypot(dx, dy) || 1;
      const ux = dx / span, uy = dy / span;
      const lay = function (v) {
        if (!v) { Board.clearMeasure(); return; }
        Board.drawMeasure(pair.from, pair.from.x + ux * v, pair.from.y + uy * v);
      };
      Sel.onChange(lay);
      lay(Sel.value);
    },

    /* Where the numbers go, checked before anything is worked out.

       What counts as right is narrower than "the answer comes out the
       same" and wider than one canonical line. Both brackets must hold
       one value from each point; the first bracket must hold the two
       x's and the second the two y's; and the two brackets must be
       subtracted the same way round — both B−A, or both A−B. Squares
       kill the sign, so `(4 − (−2))² + (−3 − 5)²` and
       `(−2 − 4)² + (5 − (−3))²` are the same number and the same
       understanding; a build that took only one of them would be
       teaching that the formula has a direction, which it has not.

       Mixing an x with a y is the error this screen exists to catch,
       and it is caught here rather than three lines later in an
       arithmetic slip nobody can trace. */
    checkSlots: function (f) {
      const t = this.task, self = this;
      if (!t || t.done || !Slots) return;
      const axes = f.map(function (p) { return p.axis; }).join('');
      const froms = f.map(function (p) { return p.from; }).join('');
      const right = axes === 'xxyy' && (froms === 'baba' || froms === 'abab');

      if (right) {
        t.done = true;
        this.state = 'waiting';
        Slots.lock();
        SFX.correct();
        SFX.chime();
        this.later(function () { self.finishWith(t.spec.correctLine); }, 320);
        return;
      }

      t.wrong++;
      SFX.wrong();
      Slots.markWrong();
      this.state = 'waiting';
      const fb = this.feedbackFor(t);

      /* Spent. The chips walk in by themselves, in reading order,
         because the order is half of what is being shown — and then
         the beat moves on. Nothing is asked a third time, here least
         of all: a child who has put the numbers in the wrong places
         twice is not going to find them on a third go. */
      if (fb.exhausted) {
        t.done = true;
        Slots.lock();
        const W = C.GRID.slots || {};
        this.later(function () {
          Slots.fillIn([2, 0, 3, 1], W.fillMs || 620, function () {
            self.later(function () {
              self.speak(t.spec.spentLine || t.spec.correctLine,
                         function () { self.settle(C.AUTO.afterLine); });
            }, 420);
          });
        }, 520);
        return;
      }

      this.later(function () {
        Slots.reset();
        if (t.spec.voiceOnly) self.sayOnly(fb.msg); else self.speak(fb.msg);
      }, 700);
    },

    /* The measured length, written on the side it measures and left
       there. A leg keeps it in its own colour beside itself; the pair's
       own line writes it the way every other answered pair does. */
    writeLength: function (t) {
      const entry = C.SCRIPT[this.index] || {};
      const k = t.spec.measureLeg;
      if (k != null && (entry.legs || [])[k]) {
        /* placeLeg works the length out from the leg's own two ends, so
           it cannot disagree with what was just answered. */
        Board.placeLeg(k, Object.assign({}, entry.legs[k], { length: true }));
        Board.showLegLength(k);
        SFX.chime();
        return;
      }
      if (!entry.segment) return;
      const s = entry.segment;
      const d = Math.round(Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y));
      Board.showSegResult(s, d + '\u00A0units');
      SFX.chime();
    },

    /* Nothing on the board starts until the sentence that introduces
       it has finished.

       A screen lists one entry per line it says, and each is played
       the moment that line is done. What this replaces is three
       parallel clocks: a count started 320ms before the sentence that
       asks for it, two sides lit at a flat 700 and 1600ms whatever she
       happened to be saying, and a third side timed off the length of
       the FIRST line — so on the Pythagoras beat AB lit 324ms into "we
       already know two of its sides", which is the sentence about the
       other two. A light read off the sentence it belongs to cannot
       land on a different one.

       Returns how long the light runs, so whatever comes next can wait
       it out rather than landing on top of it. */
    lightAfterLine: function (entry, n) {
      const L = ((entry || {}).lineLights || [])[n];
      if (!L) return 0;
      const later = this.later.bind(this), run = L.run || 1700;
      let ms = 0;
      if (L.points) ms = Math.max(ms, Board.pulsePoints(later, 0, [].concat(L.points), run));
      if (L.pulse) ms = Math.max(ms, Board.pulseSides(later, 0, [].concat(L.pulse), run));
      if (L.spots) [].concat(L.spots).forEach(function (k, m) {
        const at = m * (L.step || 900);
        later(function () { Board.spotlightPart(k); SFX.tick(m); }, at);
        ms = Math.max(ms, at + (L.step || 900));
      });
      return ms;
    },

    /* The feedback ladder: each wrong attempt gets the next message,
       and once they run out the worked solution is shown rather than
       leaving a child guessing. A task with a single tryAgainLine
       behaves as a one-rung ladder. */
    feedbackFor: function (t) {
      const list = t.spec.feedback ||
                   (t.spec.tryAgainLine ? [t.spec.tryAgainLine] : []);
      return { list: list, msg: list[Math.min(t.wrong - 1, list.length - 1)],
               exhausted: t.wrong > list.length };
    },

    /* The worked solution, given the screen to itself.

       She goes first and the answers go with her: a panel of choices
       under a solution is still asking a question, and she is standing
       on the very spot the working is about to be written. Then it is
       written where she was — the middle of her column — slowly enough
       to be followed, each part lighting the side of the triangle it
       names. Then she comes back and sits on it, and it is left up long
       enough to read the whole thing back.

       Both ways in use this: getting it right, and running out of
       tries. What is shown is the same thing either way. */
    /* The worked solution, written on the paper.

       She goes, the control goes with her, and then — with nothing else
       on the frame — the board comes to the middle, pushes in on what is
       drawn AND on the room the working needs, and writes the working
       beside the drawing. A panel beside a picture makes the child
       choose which to look at; on one sheet there is nothing to choose,
       and the number that flew out of a label lands where the label can
       still be seen.

       Move, then push, then write, and never two at once: a board that
       moves while it is being read is a board nobody reads. */
    workOnBoard: function (t, then) {
      const self = this, G = C.GRID, W = G.work, Z = G.zoom;
      const lines = t.spec.formula || [];
      const fly = G.fly.pickMs + G.fly.ms;
      this.writing = true;                   // the screen is the working's now
      Bubble.close();
      if (Sel) Sel.lock();
      if (Opts) Opts.lock();

      this.later(function () {
        self.flyOut(function () {
          if (Opts) Opts.hide();
          if (Sel) Sel.hide();
          /* Everything the working is not about comes off the paper.
             The town is scenery for the question — five buildings and
             their names, drawn over the very half the working is about
             to be written in — and the places marked beside the pair
             are the same. What is left is the pair, its triangle, and
             the room to write in. */
          if (Town) Town.hide();
          Board.clearFound();
          /* 1 — to the middle of the frame. */
          self.later(function () {
            el.gridPanel.classList.add('sliding');
            Board.place(G.centre);
            self.later(function () { el.gridPanel.classList.remove('sliding'); }, 700);
            /* 2 — and in, on the drawing and the room beside it. */
            self.later(function () {
              Board.workWidest = Board.workingWidth(lines);
              Board.viewName = 'working';
              Board.viewTo(Board.viewFor('working'), Z.ms);
              /* 3 — then the lines, one at a time. Laid out after the
                 push has landed, so they are placed against the view
                 they will be read in. */
              self.later(function () {
                const fits = Board.layoutWorking(lines);
                if (!fits) Board.layoutWorking(lines);   // placed anyway; see below
                let at = 0;
                lines.forEach(function (l, i) {
                  const parts = l.parts || [];
                  self.later(function () { Board.showWorkLine(i, l); SFX.draw(); }, at);
                  let beat = at + W.beatMs;
                  /* Every part that names a side of the drawing lights
                     it as it lands. The ones that were READ off the
                     board arrive from it first; the ones that were
                     worked out are simply there — which is the whole
                     distinction, and it is visible only if both of them
                     light. */
                  parts.forEach(function (p, k) {
                    if (!p.lit) return;
                    const land = function () {
                      const L = Board.workLines[i], s = L && L.spans[k];
                      if (s) { s.classList.remove('wait'); s.classList.add('now'); }
                      Board.spotlightPart(p.lit);
                      SFX.tick(2);
                    };
                    if (p.from) {
                      const t0 = beat;
                      self.later(function () {
                        /* The side lights BEFORE the glyph leaves it,
                           and is still lit when it lands. It used to
                           light only on arrival, so the child saw a
                           symbol appear in the panel and a line come
                           forward on the board as two separate events
                           — and the whole beat is the claim that they
                           are one thing. */
                        if (p.lit) Board.spotlightPart(p.lit);
                        self.flyInto(p, (Board.workLines[i] || {}).spans[k]);
                      }, t0);
                      self.later(land, t0 + fly);
                      beat = t0 + fly + W.beatMs;
                    } else {
                      self.later(land, beat);
                      beat += W.beatMs;
                    }
                  });
                  at = Math.max(at + W.lineMs, beat);
                });
                self.later(function () {
                  Board.spotlightPart(null);
                  const home = self.flyAnswerHomeFromBoard(t, lines);
                  self.later(function () {
                    self.writing = false;    // written; it can be handed on
                    if (then) then();
                  }, home + C.AUTO.afterWorking);
                }, at + 400);
              }, Z.ms + 200);
            }, 760);
          }, 300);
        });
      }, 700);
    },

    /* The answer leaving the working for the line it measures — the
       board's own version, a short move on the same paper. */
    flyAnswerHomeFromBoard: function (t, lines) {
      const G = C.GRID, seg = (C.SCRIPT[this.index] || {}).segment;
      if (!seg) return 0;
      let text = null;
      lines.forEach(function (l) {
        (l.parts || []).forEach(function (p) { if (p.home && !text) text = p.t; });
      });
      if (!text) return 0;
      Board.showSegResult(seg, text);
      SFX.sparkle();
      return 600;
    },

    workThrough: function (t, then) {
      const self = this, W = C.BOARD.working;
      if (!Opts || !t.spec.formula) { if (then) then(); return; }
      /* A screen can ask for its working on the paper instead. */
      if ((C.SCRIPT[this.index] || {}).stage === 'working') {
        this.workOnBoard(t, then);
        return;
      }
      Opts.lock();
      if (Sel) Sel.lock();
      this.writing = true;                  // the screen is the working's now
      Bubble.close();                       // she is about to fly

      /* One thing at a time, in this order: she goes, then the answers
         go, then the working comes up and writes itself. Overlapping
         any two of them reads as the screen rearranging rather than as
         it being cleared and then used. */
      this.later(function () {
        self.flyOut(function () {
          // she is gone; now the control follows her off, whichever
          // one this screen was using
          Opts.hide();
          if (Sel) Sel.hide();
          self.later(function () {
            // and only then does the working take the empty column
            Opts.moveTo(W.pos.x, W.pos.y);
            Opts.show(true);
            const F = C.GRID.fly;
            const ms = Opts.showFormula(t.spec.formula, function (which) {
              Board.spotlightPart(which);
              SFX.tick(2);
            }, {
              flyMs: F.pickMs + F.ms,
              onFly: function (part, node) { self.flyInto(part, node); }
            });
            SFX.sparkle();
            self.later(function () {
              Board.spotlightPart(null);
              /* The answer goes home before she comes back to the
                 working: she lands on a panel that has finished
                 saying its piece, and the line carries the result. */
              const home = self.flyAnswerHome(t);
              self.later(function () {
                self.landOnWorking();      // written; she comes back to it
                self.later(function () {
                  self.writing = false;
                  if (then) then();
                }, C.AUTO.afterWorking);
              }, home);
            }, ms + 320);
          }, 520);
        });
      }, 700);
    },

    /* Down onto the working panel, wherever it has moved to. */
    landOnWorking: function () {
      const g = workGeom(), from = this.geom || {};
      const p0 = { x: parseFloat(el.birdRig.style.left) || 0,
                   y: parseFloat(el.birdRig.style.top) || 0 };
      const s0 = from.scale || C.CHAR_SCALE;
      this.geom = g;
      this.raised = true;
      standPose = !!g.stand;
      flyTo(p0, { x: g.anchor.x, y: g.anchor.y }, s0, g.scale);
      applyGeom(g);
    },

    /* One of the answer options was pressed. The panel has already
       played its own verdict; this decides what she says. */
    checkChoice: function (right) {
      const t = this.task;
      if (!t || t.done) return;
      const self = this;

      if (right) {
        t.done = true;
        this.state = 'waiting';
        if (Opts) Opts.lock();
        /* Past the beats that teach it: they are for a child who did
           not get here. */
        if (t.spec.rightAt != null) this.branch = t.spec.rightAt;
        /* The evidence for what they just named, drawn as they name
           it: the square in the corner they built themselves two beats
           ago by walking across and then up. */
        if (t.spec.marksRightAngle) this.later(function () {
          Board.rightAngle(true); SFX.chime();
        }, 420);
        SFX.correct();
        /* How long the working takes to play. The screen has to stay
           open for all of it, and the ordinary pause after a right
           answer is nowhere near that. */
        const work = (t.spec.formula && Opts)
          ? Opts.formulaMs(t.spec.formula, C.GRID.fly.pickMs + C.GRID.fly.ms) : 0;
        const at = this.optionSpot(t.spec.answer);
        this.later(function () {
          SFX.cheer();
          SFX.confettiPop();
          FX.pop(at.x, at.y, 16);
          /* The panel has already played its own verdict, so there may
             be nothing left to say — finishWith arms the hand-over
             either way, where speak() would need a line to ride on. */
          /* With a working to come, the hand-over belongs to it: she
             has to leave, it has to be written, and she has to come
             back. finishWith would settle in the middle of that. */
          if (!work) self.finishWith(t.spec.correctLine);
        }, 260);
        /* The chosen method, worked through where the buttons were.
           Late enough that the green border is read first: it is the
           only thing telling them which one they picked, and the
           working covers it over.

           Each part of the working lights the side of the triangle it
           names, as it names it — 4\u00B2 and 16 the horizontal, 3\u00B2
           and 9 the vertical, AB\u00B2 and 25 and the answer the line
           between the points. */
        if (work) {
          this.writing = true;
          this.later(function () {
            self.workThrough(t, function () { self.settle(C.AUTO.afterLine); });
          }, 1100);
        }
      } else {
        t.wrong++;
        SFX.wrong();
        const fb = this.feedbackFor(t);

        /* Two misses on a two-answer question is not a question any
           more: the method is not there to be used, and a third go is
           asking a child to guess. The asking stops here and the beat
           that teaches it takes over — she says so on that screen, not
           on this one, because a child needs a moment to stop being
           wrong before they can start learning. */
        if (fb.exhausted && t.spec.marksRightAngle) this.later(function () {
          Board.rightAngle(true);
        }, 620);

        if (fb.exhausted && t.spec.teachAt != null) {
          t.done = true;
          this.state = 'waiting';
          if (Opts) Opts.lock();
          this.branch = t.spec.teachAt;
          this.later(function () { self.settle(C.AUTO.afterSilent); }, 520);
          return;
        }

        /* Out of hints: show the working instead of asking again. */
        if (fb.exhausted && t.spec.formula && Opts) {
          t.done = true;
          this.writing = true;
          this.state = 'waiting';
          Opts.lock();
          SFX.chime();
          this.later(function () {
            self.workThrough(t, function () { self.settle(C.AUTO.afterLine); });
          }, 420);
          return;
        }
        /* Spent, with nothing to show and nowhere to send them: the
           last rung would otherwise be said a second time and the
           buttons left live, which is the third ask this game does not
           make. She names it herself and the beat moves on — the
           marker above has already put the evidence in the corner, so
           what she says is about something they can see. */
        if (fb.exhausted) {
          t.done = true;
          this.state = 'waiting';
          /* Not just locked — answered. Three live-looking buttons
             under a bird who has just said which one it is reads as a
             third go, so the panel says it too. */
          if (Opts) Opts.reveal();
          const told = t.spec.spentLine || t.spec.correctLine;
          this.later(function () {
            if (told) self.speak(told, function () { self.settle(C.AUTO.afterLine); });
            else self.settle(C.AUTO.afterSilent);
            /* after the marker above, never under it: she is naming a
               square that has to already be in the corner. */
          }, 900);
          return;
        }

        this.later(function () {
          if (t.spec.voiceOnly) self.sayOnly(fb.msg); else self.speak(fb.msg);
        }, 320);
      }
    },

    /* A point was tapped. Without a task running this is just a
       friendly blip; with one, it is an answer. */
    tapPoint: function (gx, gy, node) {
      const t = this.task;
      const at = Board.stagePos(gx, gy);
      Hint.clear();          // they are answering; the hint has done its job

      if (!t || t.done) {
        SFX.blip();
        FX.ring(at.x, at.y, 70, 'rgba(90,180,225,.95)');
        return;
      }
      if (gx === t.target.x && gy === t.target.y) this.answerRight(gx, gy, at);
      else this.answerWrong(node);
    },

    answerRight: function (gx, gy, at) {
      const t = this.task;
      t.done = true;
      this.state = 'waiting';

      SFX.correct();
      Board.solve(gx, gy);                       // highlighters clear, point labelled
      FX.ring(at.x, at.y, 150, 'rgba(70,200,95,.95)');
      FX.starBurst(at.x, at.y, 12, 170);

      const self = this;
      this.later(function () {
        SFX.cheer();
        SFX.confettiPop();
        FX.pop(at.x, at.y, 18);
        self.finishWith(t.spec.correctLine);
      }, 260);
    },

    /* The middle of one of the answer buttons, worked out from the
       panel's own geometry rather than measured off the page: the
       buttons are a fixed stack, and this has to be right whether or
       not the browser has laid them out yet. */
    optionSpot: function (key) {
      const O = C.BOARD.options, k = O.scale;
      const entry = C.SCRIPT[this.index] || {};
      const list = entry.options || [];
      let n = 0;
      for (let i = 0; i < list.length; i++) if (list[i].key === key) n = i;
      const BORDER = 9, PAD_TOP = 28, BTN = 108, GAP = 24;
      return {
        x: O.pos.x + (O.w / 2) * k,
        y: O.pos.y + (BORDER + PAD_TOP + n * (BTN + GAP) + BTN / 2) * k
      };
    },

    answerWrong: function (node) {
      const t = this.task;
      t.wrong++;
      SFX.wrong();
      Board.reject(node);
      Hint.again();          // point it out again, from the top

      const self = this;
      if (t.wrong >= (t.spec.maxWrong || 2)) {
        // she shows the answer herself rather than letting them flounder
        t.done = true;
        this.later(function () {
          Board.solve(t.target.x, t.target.y);
          const at = Board.stagePos(t.target.x, t.target.y);
          FX.ring(at.x, at.y, 150, 'rgba(70,200,95,.9)');
          FX.sparkles(at.x, at.y, 8, 120);
          SFX.chime();
          /* Shown, not told. With no sentence pointing at it, the board
             has to stay up long enough to be read — which is the pause
             a worked solution gets, not the one a right answer gets. */
          self.finishWith(t.spec.revealLine, C.AUTO.afterReveal);
        }, 620);
      } else {
        this.later(function () {
          self.finishWith(t.spec.tryAgainLine, null,
                          function () { self.closeAfterLine(); });
        }, 260);
      }
    },

    /* Tapping the scene: first tap finishes the line, second moves on. */
    /* A tap on the field: finish the line she is saying, or move on.
       settle() puts every screen into `waiting`, including one whose
       question is still open — it only holds back the automatic hand-
       over — so a tap anywhere on the grass used to carry the player
       straight past the thing they had just been asked. The question
       belongs to them until they answer it; tapping the field is not an
       answer. Next still goes through, because that button is the
       deliberate way out and says so. */
    advance: function () {
      if (this.state === 'speaking') { Bubble.skip(); return; }
      if (this.state !== 'waiting') return;
      const entry = C.SCRIPT[this.index] || {};
      if (entry.task && !(this.task && this.task.done)) return;
      this.skipScreen();
    },

    /* Which way there is left to go. The first screen has nothing
       behind it and the last nothing ahead, and a button with nowhere
       to take you should say so rather than swallow the tap. */
    syncNav: function () {
      if (el.backBtn) el.backBtn.disabled = this.index <= 0 || this.state === 'start';
      if (el.nextBtn) el.nextBtn.disabled = this.index + 1 >= C.SCRIPT.length;
    },

    /* Back one screen, on the same footing as Next: whatever was in
       flight is cancelled and the screen is played again from the top.
       It replays rather than restores — a screen is a performance, not
       a saved state, and half of them are built by the one before. */
    backScreen: function () {
      const self = this;
      if (this.busy || this.state === 'start') return;
      if (this.index <= 0) return;          // first screen: nothing behind it

      this.busy = true;
      this.clearPending();
      el.nextBtn.classList.remove('ready');
      SFX.pop();
      Bubble.close();

      setTimeout(function () {
        self.busy = false;
        self.goTo(self.index - 1);
      }, 280);
    },

    /* The Next button: always available, always jumps straight to the
       next screen — mid-flight or mid-sentence, it does not matter. */
    skipScreen: function () {
      const self = this;
      if (this.busy || this.state === 'start') return;
      /* Whatever the answer branched to, Next goes there as well —
         pressing it must never walk a child who got it right into the
         beats that exist to teach a child who did not. */
      const to = this.nextIndex();
      if (to >= C.SCRIPT.length) return;               // nothing follows

      this.busy = true;
      this.clearPending();                  // stop the entrance and any queued step
      el.nextBtn.classList.remove('ready');
      SFX.pop();
      Bubble.close();                       // also aborts typing and lifts the duck

      setTimeout(function () {
        self.busy = false;
        self.goTo(to);
      }, 280);
    }
  };

  /* ---------------- input ---------------- */
  function bind() {
    // Any first touch unlocks audio (browsers block it until then).
    const unlock = function () { SFX.unlock(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    el.playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.unlock();
      Game.begin();
    });
    el.playBtn.addEventListener('pointerenter', function () { SFX.blip(); });

    el.nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      Game.skipScreen();
    });
    el.nextBtn.addEventListener('pointerenter', function () { SFX.blip(); });

    el.backBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      Game.backScreen();
    });
    el.backBtn.addEventListener('pointerenter', function () {
      if (!el.backBtn.disabled) SFX.blip();
    });

    // Tapping the scene skips typing or moves to the next line.
    el.scene.addEventListener('click', function () { Game.advance(); });
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (Game.state === 'start') Game.begin(); else Game.advance();
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        Game.backScreen();
      }
    });
  }

  /* ---------------- preload ---------------- */
  function preload(done) {
    const list = Object.keys(C.ART).map(function (k) { return C.ART[k]; });
    if (window.Voice) window.Voice.preload();
    // Bubble text is sized by measurement, so the real face has to be
    // in before anything gets measured.
    let fontsReady = false;
    /* And every label measured before the real face arrived was
       measured against the fallback's metrics, so those go. */
    const fontDone = function () { fontsReady = true; Board.forgetTextMetrics(); };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fontDone);
      setTimeout(fontDone, 2500);          // never block on a slow CDN
    } else { fontsReady = true; }
    let loaded = 0;
    const bump = function () {
      loaded++;
      const pct = Math.round((loaded / list.length) * 100);
      el.loaderBar.style.width = pct + '%';
      el.loaderPct.textContent = pct + '%';
      if (loaded === list.length) {
        const wait = function () {
          if (fontsReady) setTimeout(done, 320);
          else setTimeout(wait, 80);
        };
        wait();
      }
    };
    list.forEach(function (src) {
      const im = new Image();
      im.onload = bump;
      im.onerror = function () {
        /* Never let one bad path stall the game — but say so. A silent
           404 is how the hand went missing: the loader reached 100%,
           nothing threw, and the picture simply never drew. */
        if (window.console) console.warn('missing asset: ' + src);
        bump();
      };
      im.src = src;
    });
  }

  /* A control wants the bottom of her column, so she moves up out of
     its way as it arrives — she is not drawn in a different place, she
     travels there, which is why the move carries a transition and why
     her line has to be re-fitted afterwards (re-seating the rig resets
     the balloon to its default size). */
  /* She hops up to her raised spot on the wing rather than sliding
     there: the fly sheet, an arc that carries her up and out over the
     board before she settles back, and the standing artwork swapped
     back in the moment she lands. Driven frame by frame rather than by
     a CSS transition, because the sprite window is re-seated on every
     frame of the sheet and a transition on it would fight that. */
    /* The lift is what makes it a flight rather than a lift shaft: she
     has to rise past the perch and settle back onto it. */
  const FLIGHT_MS = 820, FLIGHT_BULGE = 230, FLIGHT_LIFT = 250;

  function flyTo(p0, p1, s0, s1) {
    if (Game.landFlight) Game.landFlight(true);

    el.standSwifty.classList.add('hidden');
    el.birdWin.classList.remove('hidden');
    el.birdFlip.classList.remove('turn');    // she faces the way she is going
    el.birdRig.classList.remove('fly-in', 'hop', 'pre-entrance', 'rising');
    el.shadow.classList.add('lifted');
    Sprite.play('fly', true);
    Sprite.setScale(s0);
    el.birdRig.style.left = p0.x + 'px';
    el.birdRig.style.top = p0.y + 'px';

    SFX.flap();
    const flapper = setInterval(SFX.flap, 165);

    /* A quadratic curve through a control point out to her right and
       above the straight line, so she leaves the ground on a proper arc
       instead of rising like a lift. */
    const cx = (p0.x + p1.x) / 2 + FLIGHT_BULGE;
    const cy = (p0.y + p1.y) / 2 - Math.max(FLIGHT_LIFT, Math.abs(p1.y - p0.y) * 0.9);
    const t0 = performance.now();

    const land = function (silent) {
      cancelAnimationFrame(Game.flight);
      clearInterval(flapper);
      Game.flight = null;
      Game.landFlight = null;
      Sprite.stopAt('talk', 0);
      Sprite.setScale(s1);
      el.birdRig.style.left = p1.x + 'px';
      el.birdRig.style.top = p1.y + 'px';
      el.birdWin.classList.add('hidden');
      el.standSwifty.classList.remove('hidden');
      if (!silent) SFX.land();
    };
    Game.landFlight = land;

    const step = function (now) {
      const t = Math.min(1, (now - t0) / FLIGHT_MS);
      // ease out: she pushes off hard and feathers into the landing
      const e = 1 - Math.pow(1 - t, 2.2), u = 1 - e;
      el.birdRig.style.left = (u * u * p0.x + 2 * u * e * cx + e * e * p1.x) + 'px';
      el.birdRig.style.top  = (u * u * p0.y + 2 * u * e * cy + e * e * p1.y) + 'px';
      Sprite.setScale(s0 + (s1 - s0) * e);
      if (t < 1) Game.flight = requestAnimationFrame(step);
      else land();
    };
    Game.flight = requestAnimationFrame(step);
    return land;
  }

  /* Where she stands once a control is up: on its top edge, a little
     smaller, with no ground shadow. A screen that inherits the control
     inherits this too, so it is written once. */
  function controlGeom(kind) {
    /* Whichever control is actually under her. They are not all built
       the same: the reel's painted top and the answers' are 30 units
       apart, so one seat for both left her standing inside one of
       them. A control that carries its own `stand` is trusted over
       the general one. */
    const own = kind && C.BOARD[kind] && C.BOARD[kind].stand;
    return standGeom(own || C.BOARD.standUp, {
      noShadow: true,        // she is standing on the control, not on grass
      panelBox: { x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                  w: C.BOARD.panel.w, h: C.BOARD.panel.h }
    });
  }

  /* Her seat on the working panel — the same pose as the one on the
     answers, moved up with it. */
  function workGeom() {
    return standGeom(C.BOARD.working.stand, {
      noShadow: true,
      panelBox: { x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                  w: C.BOARD.panel.w, h: C.BOARD.panel.h }
    });
  }

  function revealControl(entry) {
    const g = controlGeom(entry && entry.options ? 'options' : null);
    /* Where she is now, before the new rig overwrites it: the flight
       starts from her feet rather than from wherever the last screen
       happened to leave the rig. */
    const from = Game.geom || {};
    const p0 = { x: parseFloat(el.birdRig.style.left) || 0,
                 y: parseFloat(el.birdRig.style.top) || 0 };
    const s0 = from.scale || C.CHAR_SCALE;
    Game.geom = g;
    Game.raised = true;

    /* Up on the wing before the new rig is seated: applyGeom() moves
       her standing artwork to where she is going, so it has to be off
       screen by then or it lands there a frame early.
       The balloon travels with her; her artwork does not — she flies. */
    flyTo(p0, { x: g.anchor.x, y: g.anchor.y }, s0, g.scale);
    el.bubble.classList.add('rising');
    applyGeom(g);
    /* Re-seating the rig resets the balloon to its default size, so the
       line is re-fitted — and then written back, because fitBox() blanks
       the line after measuring it (it normally runs just before the text
       is typed in, where leaving it empty is the point). */
    Bubble.fitBox(Bubble.full);
    /* She is carrying a line she has already said — put it back as it
       was, rather than letting it arrive again. */
    Bubble.restore(Bubble.full);
    setTimeout(function () { el.bubble.classList.remove('rising'); }, 720);

    /* The control rises into the space she has just left and is settled
       before she comes down on it: it arrives, then she lands on it. */
    setTimeout(function () {
      if (Sel) {
        if (entry.distance || entry.entry) {
          Sel.reset();
          Sel.show(true);        // rising, since she is coming down on it

        } else Sel.hide();
      }
      if (Opts) {
        if (entry.options) { Opts.reset(); Opts.show(true); } else Opts.hide();
      }
      if (Slots) {
        if (entry.task && entry.task.kind === 'slots') { Slots.reset(); Slots.show(true); }
        else Slots.hide();
      }
    }, 150);
  }

  /* ---------------- the hint ----------------
     For a child who has stopped on a locate screen: the point they are
     looking for starts pulsing on its own a beat after she has finished
     asking, and keeps going until it is found. That is the whole of it
     — a hand used to come down and tap the point as well, which was
     more help than the moment needs and put a cursor on a screen the
     child is meant to be reading. */
  const Hint = {
    pulseT: null, nudgeT: null, dot: null, target: null, hand: null,

    /* The hand, built the first time it is wanted and kept after — it
       is one image that only ever moves. */
    palm: function () {
      if (this.hand) return this.hand;
      const D = C.GRID.dot;
      const img = document.createElement('img');
      img.id = 'nudge';
      img.src = C.ART.handNudge;
      img.alt = '';
      img.width = D.nudgeSize;
      img.height = D.nudgeSize;
      // the tap pivots on the fingertip, wherever that is in the file
      img.style.transformOrigin = (D.nudgeTip.x * 100).toFixed(1) + '% ' +
                                  (D.nudgeTip.y * 100).toFixed(1) + '%';
      el.scene.appendChild(img);
      this.hand = img;
      return img;
    },

    dropHand: function () {
      clearTimeout(this.nudgeT);
      this.nudgeT = null;
      if (this.hand) this.hand.classList.remove('on');
    },

    /* The rest of the board going still, or coming back to life. */
    hush: function (on) {
      if (Board.dotGroup) Board.dotGroup.classList.toggle('hushed', !!on);
    },

    clear: function () {
      clearTimeout(this.pulseT);
      this.pulseT = null;
      this.target = null;
      this.dropHand();
      this.hush(false);            // the others may breathe again
      if (this.dot) { this.dot.classList.remove('hint'); this.dot = null; }
    },

    /* Only screens with one right place to point at arm it. */
    arm: function (target) {
      const t = target || this.target;
      this.clear();
      if (!t) return;
      this.target = t;
      const self = this;

      this.pulseT = setTimeout(function () {
        const dot = Board.dots.filter(function (d) {
          return Number(d.dataset.gx) === t.x && Number(d.dataset.gy) === t.y;
        })[0];
        if (!dot) return;
        self.dot = dot;
        dot.classList.add('hint');
        self.hush(true);           // and everything else goes quiet
        SFX.blip();

        /* And a hand, for a moment. The image hangs from its fingertip,
           so the finger lands on the point and the rest of the hand
           falls away below and right of it, clear of what it is
           pointing at. */
        const D = C.GRID.dot, at = Board.stagePos(t.x, t.y);
        const hand = self.palm();
        hand.style.left = (at.x - D.nudgeSize * D.nudgeTip.x) + 'px';
        hand.style.top  = (at.y - D.nudgeSize * D.nudgeTip.y) + 'px';
        hand.classList.remove('on');
        void hand.offsetWidth;
        hand.classList.add('on');
        self.nudgeT = setTimeout(function () { self.dropHand(); }, D.nudgeMs);
      }, C.GRID.dot.hintAfter);
    },

    // after a wrong tap the point speaks up again, from the top
    again: function () { if (this.target) this.arm(this.target); }
  };

  /* ---------------- title screen ---------------- */
  /* Cancellers for the title screen's wind and leaves, run when the
     game starts: #startScreen is taken out of the layout then, and
     without this its weather would keep spawning into a hidden box. */
  const stopWeather = [];

  /* She flies in from off-stage left and perches on the rock before the
     Play button is offered. Runs silent on purpose: the audio context
     is still suspended until the first gesture, so anything scheduled
     here would either be dropped or land all at once the moment Play
     is pressed. */
  const StartBird = {
    arrivedSilent: false,

    /* Called the first time a gesture authorises audio. If she flew in
       unheard and is still sitting on the rock, she calls once now —
       not a replayed entrance, just the bird you watched land finally
       making a sound. */
    greetIfUnheard: function () {
      if (!this.arrivedSilent) return;
      if (el.startScreen.classList.contains('hidden')) return;
      this.arrivedSilent = false;
      setTimeout(function () { SFX.birdCall(0.9); }, 140);
    },

    setup: function () {
      const S = C.START;
      el.startFly.src = C.ART.swiftyFly;
      el.startTalk.src = C.ART.swiftyTalk;
      StartSprite.setup(el.startBirdWin,
        { fly: el.startFly, talk: el.startTalk }, S.scale);
      // the rig origin is her belly anchor; the flight moves it
      el.startBird.style.left = S.anchor.x + 'px';
      el.startBird.style.top = S.anchor.y + 'px';
      el.startShadow.style.width = S.shadow.w + 'px';
      el.startShadow.style.height = S.shadow.h + 'px';
      el.startShadow.style.left = (S.perch.cx - S.shadow.w / 2) + 'px';
      el.startShadow.style.top = (S.perch.feetY - S.shadow.h / 2) + 'px';
    },

    arrive: function (done) {
      const S = C.START;
      StartSprite.play('fly', true);
      el.startBird.classList.remove('pre-flight');
      el.startBird.classList.add('flying');

      // a wingbeat every few frames of the approach; she glides the last bit
      let beats = 0;
      const flapper = setInterval(function () {
        SFX.flap();
        if (++beats > 11) clearInterval(flapper);
      }, 175);
      /* She calls once on her way in — around the point the arc brings
         her into frame — and again as she settles on the rock. */
      const calls = [setTimeout(function () { SFX.birdCall(1); }, 640),
                     setTimeout(function () { SFX.birdCall(0.75); }, 1560)];

      let settled = false;
      const land = function () {
        if (settled) return;
        settled = true;
        el.startBird.removeEventListener('animationend', land);
        el.startScreen.removeEventListener('click', skip);
        clearInterval(flapper);
        calls.forEach(clearTimeout);        // a skipped flight loses its calls
        StartSprite.stopAt('talk', 0);      // wings in, standing pose
        el.startShadow.classList.add('down');
        /* Dust off the crown as she puts her feet down. Heavier than a
           hop in the game: she has just come out of a long glide, and
           this is the moment the flight stops being weightless. */
        FX.puff(S.perch.cx, S.perch.feetY - 6, 1.5);
        SFX.land();
        setTimeout(function () { SFX.birdCall(0.85); }, 260);
        /* A cold load has had no gesture yet, so the browser blocked
           all of that and her whole arrival was silent. Remember it, so
           the first moment sound is allowed she is at least heard. */
        StartBird.arrivedSilent = !SFX.armed;
        setTimeout(done, S.buttonDelay);
      };
      /* Tapping through the arrival puts her straight on the perch: the
         keyframes are offsets from where the rig already sits, so
         dropping the class leaves her exactly where the flight would
         have set her down. Nobody has to sit through it twice. */
      const skip = function () {
        el.startBird.classList.remove('flying');
        land();
      };
      el.startBird.addEventListener('animationend', land);
      el.startScreen.addEventListener('click', skip);
      /* animationend never arrives if the tab is backgrounded mid-flight,
         and the screen must not be left without a Play button. */
      setTimeout(land, S.flyMs + 600);
    }
  };

  /* ---------------- boot ---------------- */
  function boot() {
    /* The two full-frame pictures take their source from config rather
       than from the markup. They used to be hardcoded in the HTML,
       which meant a renamed file left ART pointing at the new name
       while the page still asked for the old one — and the background
       silently failed to load. */
    el.sceneArt.src = C.ART.background;
    el.startArt.src = C.ART.startScreen;
    el.flySheet.src = C.ART.swiftyFly;
    el.talkSheet.src = C.ART.swiftyTalk;
    el.standSwifty.src = C.ART.swiftyStand;
    el.playImg.src = C.ART.playButton;

    /* Browsers refuse audio before a gesture, so the title screen's
       wind, leaves and landing are silent on a cold load and every
       sound is a no-op rather than a queued burst. This tries anyway —
       it succeeds for a visitor the browser already trusts — and the
       first touch of anything arms it for the rest of the screen,
       including the tap that lands her early. */
    SFX.prime();
    const armAudio = function () {
      SFX.prime(true);           // from a gesture, so it takes effect at once
      StartBird.greetIfUnheard();
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
        document.removeEventListener(ev, armAudio);
      });
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, armAudio, { passive: true });
    });

    FX.init(el.fxLayer);
    FX.clouds(el.skyLayer);
    FX.leafDrift(el.skyLayer);
    // the title screen blows its own weather, on its own layer
    stopWeather.push(FX.wind(el.startSky, C.START.wind),
                     FX.leafDrift(el.startSky, C.START.drift));
    fitStage();
    Sprite.setup(el.birdWin, { fly: el.flySheet, talk: el.talkSheet }, C.CHAR_SCALE);
    StartBird.setup();  // must precede layout(): layout seats the rig
    layout();
    bind();
    requestAnimationFrame(loop);

    preload(function () {
      el.loader.classList.add('fade-out');
      setTimeout(function () { el.loader.classList.add('hidden'); }, 500);
      el.startScreen.classList.remove('hidden');
      // Play is offered only once she has flown in and settled
      StartBird.arrive(function () {
        el.playBtn.disabled = false;   // also unreachable by keyboard until now
        el.playBtn.classList.remove('veiled');
        el.playBtn.classList.add('idle');
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

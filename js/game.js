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
   'bubbleText', 'bubbleLine', 'nextBtn', 'backBtn',
   'gridPanel', 'gridImg', 'gridAxes', 'standSwifty',
   'formulaBoard', 'leafLayer', 'fxLayer', 'sceneArt', 'startArt',
   'startBird', 'startBirdWin', 'startFly', 'startTalk', 'startShadow', 'startSky'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

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
    img: { fly: null, talk: null },

    setup: function (win, flyImg, talkImg, scale) {
      this.win = win;
      this.img.fly = flyImg;
      this.img.talk = talkImg;
      this.setScale(scale);
    },

    /* Screens draw her at different sizes — small in the field, full
       size beside the board — so the sheet is rescaled per screen. */
    setScale: function (S) {
      this.scale = S;
      [this.img.fly, this.img.talk].forEach(function (im) {
        im.style.width = C.SHEET_W * S + 'px';
        im.style.height = C.SHEET_H * S + 'px';
      });
      this.show(this.sheet, this.frame);
    },

    /* Seats one pose so its belly anchor lands on the rig origin.
       Every pose has its own opaque bounds and its own anchor, so
       all six numbers are recomputed per frame. */
    show: function (sheet, i) {
      const S = this.scale;
      const f = C.SHEETS[sheet].frames[i];
      this.sheet = sheet; this.frame = i;

      this.win.style.left = -(f.ax - f.x) * S + 'px';
      this.win.style.top = -(f.ay - f.y) * S + 'px';
      this.win.style.width = f.w * S + 'px';
      this.win.style.height = f.h * S + 'px';

      const im = this.img[sheet], other = this.img[sheet === 'fly' ? 'talk' : 'fly'];
      im.style.left = -f.x * S + 'px';
      im.style.top = -f.y * S + 'px';
      im.style.visibility = 'visible';
      other.style.visibility = 'hidden';
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
  let Sel  = null;              // the number selector, mounted on demand
  let Opts = null;              // the triangle-type answer panel

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
    if (window.NumberSelector && !Sel) {
      const SP = C.BOARD.selector;
      Sel = window.NumberSelector.mount(el.scene,
        { x: SP.pos.x, y: SP.pos.y, scale: SP.scale, hidden: true });
    }
    if (window.TriangleOptions && !Opts) {
      const OP = C.BOARD.options;
      // scaled to her column, the same way the number selector is
      Opts = window.TriangleOptions.mount(el.scene,
        { x: OP.pos.x, y: OP.pos.y, scale: OP.scale, hidden: true });
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
    foundMarks: [],          // points already located, left on the board

    build: function () {
      if (this.built) return;
      this.built = true;

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
      for (let x = G.xFrom; x <= G.xTo; x++) {
        if (x === 0) continue;
        label(String(x), ox + x * G.stepX, oy + G.labelGap + G.labelSize * 0.42, 0, 'x', x);
      }
      for (let y = G.yFrom; y <= G.yTo; y++) {
        if (y === 0) continue;
        label(String(y), ox - G.yLabelGap - G.labelSize * 0.30, oy - y * G.stepY, 0, 'y', y);
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
        [dg, ln, dt, co, nm, lp, lt].forEach(function (n) { lg.appendChild(n); });
        svg.appendChild(lg);
        this.legSlots.push({ g: lg, line: ln, dot: dt, coord: co, name: nm,
                             plate: lp, len: lt, dash: dl, dashG: dg });
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

      this.unitBand = ub;
      this.unitLabel = ul;

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
        exg.appendChild(exr);
        svg.appendChild(exg);
        this.exSlots.push({ g: exg, segParts: exParts, segLine: exl, segRes: exr });
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
      seg.appendChild(rt);
      this.segRes = rt;

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
      const sx = box.w / G.w, sy = box.h / G.h;
      const st = el.gridPanel.style;
      st.setProperty('--paper-inner', P.inner);
      st.setProperty('--paper-frame', P.frame);
      st.setProperty('--paper-edge',  P.edge);
      st.setProperty('--paper-hi',    P.highlight);
      st.setProperty('--radius', P.radius * sx + 'px');
      st.setProperty('--edgeW',  P.edgeW  * sx + 'px');
      st.setProperty('--frameW', P.frameW * sx + 'px');
      st.setProperty('--hiW',   (P.frameW + P.hiW) * sx + 'px');

      /* The grid is pinned to the origin, not to the panel: a line
         every stepX across and every stepY down, so whatever size the
         board is drawn at, a line still falls on every whole
         coordinate and the numbers sit on it. */
      const cw = G.stepX * sx, ch = G.stepY * sy, lw = P.lineW;
      const left = (G.originX + P.gxFrom * G.stepX) * sx;
      const top  = (G.originY - P.gyTo   * G.stepY) * sy;
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
      const inset = (P.frameW + P.hiW) * sx;
      const gw = (P.gxTo - P.gxFrom) * cw + lw, gh = (P.gyTo - P.gyFrom) * ch + lw;
      const cl = Math.max(0, inset - (left - lw / 2));
      const ct = Math.max(0, inset - (top  - lw / 2));
      const cr = Math.max(0, (left - lw / 2 + gw) - (box.w - inset));
      const cb = Math.max(0, (top  - lw / 2 + gh) - (box.h - inset));
      gs.clipPath = (cl || ct || cr || cb)
        ? 'inset(' + ct + 'px ' + cr + 'px ' + cb + 'px ' + cl +
          'px round ' + Math.max(0, P.radius * sx - inset) + 'px)'
        : 'none';

      el.gridAxes.setAttribute('viewBox', '0 0 ' + G.w + ' ' + G.h);
      el.gridAxes.setAttribute('preserveAspectRatio', 'none');
      el.gridAxes.style.width = box.w + 'px';
      el.gridAxes.style.height = box.h + 'px';
    },

    setDots: function (on) {
      if (!this.dotGroup) return;
      this.dotGroup.classList.toggle('on', !!on);
      /* Marked points are NOT cleared here any more: the second locate
         screen turns the highlighters back on, and doing it here rubbed
         out the point they had just found. They go when the board is
         rebuilt or a question plots its own segment instead. */
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
          self.showSegResult(spec, R.text, R.dy != null ? R.dy : -26, R.dx, slot);
          SFX.chime();
        }, t + EX.resultMs);
        t += EX.stagger;
      });
      later(function () { if (done) done(); }, t + EX.resultMs + 300);
    },

    clearExamples: function () {
      (this.exSlots || []).forEach(function (s) {
        s.segLine.classList.remove('draw', 'lit');
        s.segRes.classList.remove('pop');
        ['a', 'b'].forEach(function (k) {
          ['dot', 'coord', 'name'].forEach(function (n) {
            s.segParts[k][n].classList.remove('pop', 'set');
          });
        });
      });
    },

    clearLegs: function () {
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
    /* A rough width for a string at a given size, used to decide where
       a label can go. getBBox would be exact but is only good once the
       text is laid out, and these decisions are made while placing it. */
    textW: function (t, size) { return String(t).length * size * 0.58; },

    /* The column the y-axis owns: the line, and its numbers down the
       left of it. */
    onYAxisCol: function (cx, w) {
      const G = C.GRID, pad = 5;
      const left = G.originX - G.yLabelGap - G.labelSize * 0.30 -
                   this.textW('-6', G.labelSize) / 2 - pad;
      const right = G.originX + G.axisWidth / 2 + pad;
      return cx + w / 2 > left && cx - w / 2 < right;
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
    clampX: function (cx, w) {
      const G = C.GRID, P = G.paper, air = 8;
      const edge = P.frameW + P.hiW + air;
      return Math.max(edge + w / 2, Math.min(G.w - edge - w / 2, cx));
    },
    /* Coordinate labels get a tighter margin than everything else.
       clampX keeps 8 units of air inside the frame, which is right for
       text that is free to sit anywhere — but a coordinate is not: it
       belongs over its own point, and the widest of them at x = 6 needs
       6 of those 8 to stay centred there. Nudging it in instead left
       the two labels of one pair sitting differently against their own
       dots, and moved the label when a located point was taken over by
       a segment. Every one of them clears the frame at this margin. */
    clampLabel: function (cx, w) {
      const G = C.GRID, P = G.paper, air = 2;
      const edge = P.frameW + P.hiW + air;
      return Math.max(edge + w / 2, Math.min(G.w - edge - w / 2, cx));
    },

    clampY: function (cy, h) {
      const G = C.GRID, P = G.paper, air = 8;
      const edge = P.frameW + P.hiW + air;
      return Math.max(edge + h / 2, Math.min(G.h - edge - h / 2, cy));
    },

    onXAxisRow: function (cy, h) {
      const G = C.GRID, pad = 5;
      const top = G.originY - G.axisWidth / 2 - pad;
      const bot = G.originY + G.labelGap + G.labelSize * 0.42 + G.labelSize / 2 + pad;
      return cy + h / 2 > top && cy - h / 2 < bot;
    },

    placeLeg: function (i, spec) {
      const G = C.GRID, LG = G.leg, L = this.legSlots[i];
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const f = spec.from, t = spec.to;
      const x1 = px(f.x), y1 = py(f.y), x2 = px(t.x), y2 = py(t.y);

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
      L.line.style.strokeDashoffset = len;

      if (spec.mark) {
        L.dot.setAttribute('cx', x2); L.dot.setAttribute('cy', y2);
        // the corner can be drawn as a plotted point rather than a leg end
        L.dot.setAttribute('fill', spec.mark.fill || side);
        L.coord.textContent = spec.mark.coordText ||
                              ('(' + t.x + ',\u00A0' + t.y + ')');
        const mw = this.textW(L.coord.textContent, G.segment.coordSize);
        /* Beside the corner — but only if the frame will take it there.
           The outermost column has no room on its own side, and the
           clamp does not decline, it drags: the label came back and
           landed on the very point it names, which is how "(6, 1)" ended
           up written across C. So when the side it wants is not there,
           it goes over the point instead — where every other coordinate
           in this game sits — or under, if over is the axis numbering. */
        const want = x2 + LG.coordDx;
        const beside = this.clampX(want, mw);
        const squashed = Math.abs(beside - want) > 0.5;
        let cx = beside, cy = y2;
        if (squashed) {
          cy = y2 + G.found.labelDy;
          if (this.onXAxisRow(cy, G.segment.coordSize)) cy = y2 - G.found.labelDy;
          cx = this.clampX(x2, mw);
        }
        L.coord.setAttribute('x', cx);
        L.coord.setAttribute('y', this.clampY(cy, G.segment.coordSize));
        /* Below the corner, unless the x-axis row is there. */
        let nx = x2, ny = y2 + LG.nameDy;
        if (this.onXAxisRow(ny, G.segment.nameSize)) {
          ny = y2 - LG.nameDy;
          nx = x2 + LG.nameFlipDx;
        }
        /* And if the coordinates have just taken the space over the
           point, the letter cannot have it as well: it keeps the other
           side, or goes beside the point where that side is the axis
           numbering. */
        if (squashed && (ny - y2) * (cy - y2) > 0) {
          ny = y2 - (ny - y2);
          if (this.onXAxisRow(ny, G.segment.nameSize)) { ny = y2; nx = x2 + LG.nameFlipDx; }
        }
        L.name.textContent = spec.mark.name || '';
        const nw2 = this.textW(L.name.textContent || 'A', G.segment.nameSize);
        L.name.setAttribute('x', this.clampX(nx, nw2));
        L.name.setAttribute('y', this.clampY(ny, G.segment.nameSize));
        L.dot.style.display = L.coord.style.display = L.name.style.display = '';
      } else {
        L.dot.style.display = L.coord.style.display = L.name.style.display = 'none';
      }

      if (spec.length) {
        const n = Math.abs(t.x - f.x) + Math.abs(t.y - f.y);
        const horiz = (f.y === t.y);
        /* A leg can name its length instead of measuring it — the
           general case labels it x2 - x1 rather than 10 units. */
        const txt = spec.lengthText || (n + '\u00A0unit' + (n === 1 ? '' : 's'));
        /* Above a horizontal leg — inside the right angle, where the
           board is empty. Beside a vertical one, pushed along it
           towards the corner it starts from: the far end of that side
           carries the other point's coordinates. */
        const towardCorner = y1 > y2 ? 1 : -1;
        let lx = horiz ? (x1 + x2) / 2 : (x1 + LG.lenGapV);
        const ly = horiz ? y1 + LG.lenGap
                         : (y1 + y2) / 2 + towardCorner * LG.lenBiasV;
        /* A leg centred on the origin writes its length straight down
           the y-axis, so it slides along its own leg towards the corner
           until it is clear of the axis and the numbers beside it. */
        const lw2 = this.textW(txt, LG.lenSize);
        if (horiz) lx = this.clearOfYAxis(lx, lw2);
        /* A vertical leg on the outermost column writes its length past
           the frame — 78px beside x=6 is off the cream once a cell is
           78px wide. */
        L.len.setAttribute('x', this.clampX(lx, lw2));
        L.len.setAttribute('y', this.clampY(ly, LG.lenSize));
        L.len.textContent = txt;
        L.len.style.display = L.plate.style.display = '';
      } else {
        L.len.style.display = L.plate.style.display = 'none';
      }
    },

    /* Draws the legs a screen asks for: any already settled from the
       screen before simply appear, the rest animate in. */
    runLegs: function (specs, later, done) {
      const self = this;
      if (!specs || !specs.length) { done(); return; }

      let delay = 0;
      specs.forEach(function (spec, i) {
        const L = self.legSlots[i];
        self.placeLeg(i, spec);
        L.g.classList.add('on');

        if (spec.settled) {
          // already on the board; only its length is new
          if (!spec.noLine) (spec.dash ? L.dashG : L.line).classList.add('draw');
          if (spec.mark) { L.dot.classList.add('pop'); L.coord.classList.add('pop'); L.name.classList.add('pop'); }
          if (spec.length) {
            later(function () { self.showLegLength(i); SFX.tick(2); }, delay + 200);
            delay += 520;
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
          later(function () {
            (spec.dash ? L.dashG : L.line).classList.add('draw');
            SFX.draw();
          }, base + 120);
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

    /* Which side of the triangle the working is talking about: that one
       comes forward and the rest step back, so a child reading "4\u00B2"
       can see at once which line it means. `which` is 'h', 'v' or 'ab';
       anything else puts the board back the way it was. */
    spotlightPart: function (which) {
      if (!this.segLine) return;
      const self = this;
      const part = {
        ab: [this.segLine, this.segRes],
        h:  [this.legSlots[0] && this.legSlots[0].line, this.legSlots[0] && this.legSlots[0].len],
        v:  [this.legSlots[1] && this.legSlots[1].line, this.legSlots[1] && this.legSlots[1].len]
      };
      /* `lit` is spoken for — it is what makes a reached segment pulse —
         so these carry their own names. */
      Object.keys(part).forEach(function (k) {
        part[k].forEach(function (n) {
          if (!n) return;
          const on = !!which && k === which;
          n.classList.toggle('spot', on);
          n.classList.toggle('hush', !!which && !on);
          n.classList.remove('spotbeat');
          if (on) n.classList.add('spotbeat');
        });
      });
      clearTimeout(this.beatOff);
      if (which) this.beatOff = setTimeout(function () {
        Object.keys(part).forEach(function (k) {
          part[k].forEach(function (n) { if (n) n.classList.remove('spotbeat'); });
        });
      }, 520);
    },

    /* No plate to fit any more — the text carries its own paper halo,
       so it reads over the ruling without a box taking up the room. */
    showLegLength: function (i) {
      this.legSlots[i].len.classList.add('pop');
    },

    clearUnits: function () {
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
    countOut: function (from, to, units, later, done) {
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

      for (let n = 1; n <= steps; n++) {
        (function (k) {
          later(function () {
            self.drawMeasure(from, from.x + ux * k, from.y + uy * k);
            SFX.tick(k);
          }, (k - 1) * U.stepMs);
        })(n);
      }

      later(function () {
        self.showUnitTotal(from, ux, uy, steps, units);
        SFX.chime();
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

    /* Seats a segment's two points, its line and its four labels. */
    /* `into` names which set of nodes to write into. Left out, it is the
       board's own pair — every caller in the game. Given an example slot,
       the very same placement runs against that slot's nodes instead,
       which is the point: a pair recalled on a later screen is laid out
       by the code that laid it out the first time, so it cannot drift
       from how the child saw it. */
    placeSegment: function (spec, into) {
      const G = C.GRID, SG = G.segment;
      const T = into || this;
      /* A length written on the last pair does not belong to this one.
         Screens that keep their segment never come through here, so a
         measurement stays up across the beats that talk about it and
         goes the moment the points change. */
      if (T.segRes) {
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
      if (!into) this.lastPlotted = spec;
      // a screen can recolour the segment — red once it closes a triangle
      T.segLine.setAttribute('stroke', spec.color || SG.lineColor);
      T.segLine.style.color = spec.color || SG.lineColor;   // for its own glow
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const self = this;

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
                            : (p.coordText || ('(' + p.x + ',\u00A0' + p.y + ')'));
      };
      let stacked = false;
      if (!vertical && spec.coordDy == null) {
        stacked = [a, b].some(function (p) {
          const mate = (p === a) ? b : a;
          const w = self.textW(label(p), SG.coordSize);
          const want = px(p.x) + (p.x < mate.x ? -1 : 1) * (SG.dotR + SG.coordGap + w / 2);
          return Math.abs(self.clampX(want, w) - want) > 0.5;   // had to be pulled back
        });
        /* And if over the point is where the x-axis numbering is, the
           pair goes under instead — again together. */
        if (stacked && [a, b].some(function (p) {
          return self.onXAxisRow(py(p.y) + G.found.labelDy, SG.coordSize);
        })) stacked = 'under';
      }

      [['a', a], ['b', b]].forEach(function (pair) {
        const key = pair[0], p = pair[1], part = T.segParts[key];
        const X = px(p.x), Y = py(p.y);
        part.dot.setAttribute('cx', X);  part.dot.setAttribute('cy', Y);

        const mate = (p === spec.a) ? spec.b : spec.a;
        /* What this label will say, worked out before it is placed
           rather than read off the node — which still holds the last
           screen's words at this point, so measuring it there sized
           every label to whatever happened to be there before. That
           did not show while labels were centred on their points; it
           does the moment the width decides how far out they sit. */
        const ctext = p.coordParts
          ? p.coordParts.map(function (f) { return f.t; }).join('')
          : (p.coordText || ('(' + p.x + ',\u00A0' + p.y + ')'));
        const cw = self.textW(ctext, SG.coordSize);

        /* Which way a label is pushed off its own point: away from the
           other one, always. A column stacks the two points, so those
           go above the upper and below the lower; every other pair
           reads left to right, so the left point's goes out to its left
           and the right point's out to its right. Either way the two
           can never crowd each other, and neither takes the middle,
           where the length between them is written. */
        let cx, cy;
        if (vertical) {
          /* Over the top one and under the bottom one — and slid off
             the y-axis where the column sits on it, or the label would
             be written straight down the axis line. */
          cx = self.clearOfYAxis(X, cw);
          // to the text's middle, so its edge lands coordGap off the dot
          const outV = SG.dotR + SG.coordGap + SG.coordSize / 2;
          cy = Y + (p.y >= mate.y ? -outV : outV);
        } else if (spec.coordDy != null) {
          /* A screen that has placed its own. Both points on the x-axis
             is the case for it: out to the side there is the axis
             numbering, so those go above instead. */
          cx = X;
          cy = Y + spec.coordDy;
        } else if (stacked) {
          /* The pair could not both sit beside their points, so both sit
             over them — at the very offset the located marks use, so a
             carried pair's labels do not move at all. */
          /* Squarely over its own point, the same for both — and the
             same place the located mark already has it, so a pair
             carried into a question does not shift. */
          cx = self.clampLabel(X, cw);
          cy = Y + (stacked === 'under' ? -G.found.labelDy : G.found.labelDy);
        } else {
          // to the text's near edge, the same clear air as a column's
          const outH = SG.dotR + SG.coordGap;
          cx = self.clampX(self.clearOfYAxis(
            X + (p.x < mate.x ? -1 : 1) * (outH + cw / 2), cw), cw);
          cy = Y;
          /* Level with its point, unless the point is close enough to
             the x-axis that level means on top of the numbering. Then
             it steps off, away from the axis. */
          let guard = 0;
          while (self.onXAxisRow(cy, SG.coordSize) && guard++ < 8) {
            cy += (p.y >= 0 ? -1 : 1) * 20;
          }
        }
        part.coord.setAttribute('x', stacked ? cx : self.clampX(cx, cw));
        part.coord.setAttribute('y', self.clampY(cy, SG.coordSize));
        /* A point can carry its own label — the general case names the
           points (x1, y1) and (x2, y2) rather than their values — and
           can split it so one fragment glows on its own. */
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

        /* A point can carry its own letter offset. The default puts the
           letter straight below, which lands on top of a leg dropped
           from that same point — so those points push theirs aside. */
        let ndy = p.nameDy != null ? p.nameDy
                : (vertical ? SG.vNameDy : (spec.nameDy != null ? spec.nameDy : SG.nameDy));
        /* The coordinates have gone out to the side, so the letter has
           the space over the point — or under it, where over would be
           the x-axis numbering. */
        if (!vertical && p.nameDy == null && spec.nameDy == null &&
            self.onXAxisRow(Y + ndy, SG.nameSize)) ndy = -ndy;
        /* Unless the coordinates took that space instead. Then the two
           would be written on top of each other, so the letter goes
           under the point — which on a pair labelled this way is free,
           because a row labelled this way has no letters at all. */
        if (stacked && p.nameDy == null && spec.nameDy == null && ndy < 0) ndy = -ndy;
        const nw = self.textW(part.name.textContent || 'A', SG.nameSize);
        /* On a column the coordinate has taken the space over or under
           the point, so the letter goes beside it — and on the side the
           coordinate did not end up on, which is what keeps the two
           apart where the coordinate had to slide off the y-axis. */
        const cx0 = parseFloat(part.coord.getAttribute('x'));
        const other = (cx0 >= X ? -1 : 1) * SG.coordDx;
        part.name.setAttribute('x', self.clampX(
          p.nameDx != null ? X + p.nameDx
                           : (vertical ? X + other : X), nw));
        part.name.setAttribute('y', self.clampY(
          vertical && p.nameDy == null ? Y : Y + ndy, SG.nameSize));
        part.name.textContent = p.name || '';
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
      const G = C.GRID, X = G.xeq, U = G.unitBox, self = this;
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
      /* Taken in the order the points are read on the board — left to
         right along a row, top to bottom down a column — never by size.
         Each still lands in its own slot: the larger in front, the
         smaller behind. On the row the left point happened to hold the
         smaller value; on a column the top point holds the larger. */
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
      const loTxt = lo < 0 ? '(' + lo + ')' : String(lo);
      const text = [String(hi), '\u2212', loTxt, '=', String(units)];
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
      /* Centred on the pair, but pushed off the y-axis where the pair
         sits beside it — a column at x = 1 would otherwise lay the sum
         straight across the axis numbering. */
      const left = this.clampX(this.clearOfYAxis(midX, whole), whole) - whole / 2;
      const topY = Math.min(py(sp.a.y), py(sp.b.y));
      const stageY = this.clampY(topY - G.stepY * X.stageUp, X.size);

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
      // 1 — the halves that match, lit and let go
      later(function () { self.glowPart(row ? 'y' : 'x', true); SFX.tick(0); }, t);
      later(function () { self.glowPart(row ? 'y' : 'x', false); }, t += X.yGlowMs);

      /* 2 and 3 — the smaller first, into the back of the sum, then the
         larger into the front. Taken in the order they are read off the
         board; assembled in the order the sum is read. */
      lift(firstRead, slotOf(firstRead), t);
      t += X.pickMs + X.flyMs;
      lift(secondRead, slotOf(secondRead), t);
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
    showSegResult: function (spec, text, dy, dx, into) {
      const G = C.GRID, T = into || this;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      T.segLine.classList.add('lit');
      T.segRes.setAttribute('x', (px(spec.a.x) + px(spec.b.x)) / 2 + (dx || 0));
      T.segRes.setAttribute('y', (py(spec.a.y) + py(spec.b.y)) / 2 + dy);
      T.segRes.textContent = text;
      T.segRes.classList.add('pop');
      /* No plate behind it: the text carries its own paper halo, the
         same as every other measurement written on the board. A drawn
         box round this one made it read as a different kind of thing
         from the leg lengths beside it. */
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

    clearSegment: function () {
      this.clearUnits();
      this.clearLegs();
      this.clearExamples();
      this.clearMeasure();
      if (!this.segGroup) return;
      this.glowCoords(false);
      if (this.segRes) this.segRes.classList.remove('pop');
      if (this.segLine) this.segLine.classList.remove('lit');
      this.segGroup.classList.remove('on');
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
      ['a', 'b'].forEach(function (k) {
        const p = spec[k], part = self.segParts[k];
        if (!p || !p.name || part.name.textContent === p.name) return;
        part.name.textContent = p.name;
        any = true;
      });
      if (!any) return false;
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
      const G = C.GRID;
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
      const ctext = '(' + gx + ',\u00A0' + gy + ')';
      const cw = this.textW(ctext, F.labelSize);
      t.setAttribute('x', this.clampLabel(px, cw));
      t.setAttribute('y', py + F.labelDy);
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

      this.later(function () {
        if (self.index !== i) return;        // something got there first
        self.goTo(i + 1);
      }, pause || C.AUTO.afterLine);
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
      const keepsControl = (entry.intro === 'measure' || entry.layout === 'board') &&
                           !!(entry.distance || entry.entry || entry.options) &&
                           entry.transition !== 'leaves' && !entry.askFirst &&
                           this.raised && Board.shown;
      this.raised = keepsControl;
      const geom = keepsControl ? controlGeom() : geomFor(i);
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
           the answer beforehand gave it away before the press. */
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

      const withControl = entry.options && entry.intro !== 'measure';

      /* A screen can point at part of what is already drawn while she
         talks about it: the y halves of both labels, then the x halves,
         then one x at a time in the order the subtraction reads. The
         board is already up, so this is the whole of the screen's
         work — it lights what her line is about. */
      const spotlight = function () {
        /* She has just named the shape; the board agrees with her. Timed
           off her own recording so the light comes as she finishes,
           rather than under the words. */
        if (entry.pulse) {
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
          self.pulseTail = Math.max(0, (start + run) - voiced) + 260;
          Board.pulseSides(self.later.bind(self), start, keys, run);
        }
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


      const after = function () {
        self.pulseTail = 0;
        spotlight();
        const bring = withControl && !keepsControl
          ? function () { revealControl(entry); } : null;
        /* She asks, the shape lights, the light goes — and only then do
           the answers rise and she comes down on them. */
        const gated = (bring && self.pulseTail)
          ? function () { self.later(bring, self.pulseTail); } : bring;
        buildEquation();
        if (entry.line && entry.voiceOnly) self.sayOnly(entry.line, gated);
        else if (entry.line) self.speak(entry.line, gated);
        else if (entry.auto && i + 1 < C.SCRIPT.length) {
          self.later(function () { self.goTo(i + 1); }, 160);
        } else {
          /* A screen that draws something to be read, rather than just
             moving a piece into place, can name its own pause. */
          self.settle(entry.hold != null ? entry.hold : C.AUTO.afterSilent);
        }
      };

      const arrive = function () {
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
          /* A pair that has already been measured says so on its own
             line, the way an axis case writes its answer there. */
          const R = entry.segment && entry.segment.result;
          if (R) self.later(function () {
            Board.showSegResult(entry.segment, R.text, R.dy != null ? R.dy : -26, R.dx);
            SFX.chime();
          }, 260);
          /* Pairs recalled beside this one come up under her line, not
             before it — the screen is no slower for carrying them. */
          if (entry.examples) Board.runExamples(entry.examples, self.later.bind(self));
          if (entry.legs) Board.runLegs(entry.legs, self.later.bind(self), next);
          else next();
        };
        /* A screen that keeps what it inherited does not replot the
           segment — only whatever is new gets drawn. */
        if (entry.segment && !entry.keepSegment) {
          Board.runSegment(entry.segment, self.later.bind(self), afterSeg);
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
          self.later(function () { Formula.setStep(X.steps[1]); SFX.draw(); }, t += 700);
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
            self.stay(function () { self.speak(entry.line); });
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
        const holds = !!entry.keepSegment && Board.shown;
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
              const speak = function () {
                FX.sparkles(geom.aim.x, geom.aim.y, 7, 170 * geom.scale);
                Bubble.open(entry.line, function () {
                  self.later(opens, 700);
                });
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
            if (entry.legs) {
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
            Board.clearMeasure();
          }
          self.settle();
        }, 240);
      };

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
        /* And one the screen before left standing has to go. Not showing
           it is only half of "must not be up already" — it was already
           there, so the screen has to take it away. */
        if (brought) { if (Sel) Sel.hide(); if (Opts) Opts.hide(); }
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
          if (Sel) Sel.markCorrect();
          // nothing was walked out on the Pythagoras screens, so there
          // is no line from A to B to leave lit
          if (!t.spec.noCount) Board.litMeasure();
          /* Out of the far point — the end of the line they just drew,
             which is the thing that was got right and where they are
             already looking. */
          const at = Board.stagePos(pair.to.x, pair.to.y);
          self.later(function () {
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
        if (fb.exhausted && t.spec.showWorking) {
          t.done = true;
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
        if (helping) self.later(function () {
          Board.showUnitBand(pair.from, pair.to);
          SFX.sparkle();
        }, 700);
        self.later(function () {
          /* The count they asked for is on the board, short of the
             point or a unit past it, and that is the answer to what
             went wrong. Words or none, it is left up to be read and
             then taken away — the hold cannot ride on a line that may
             not exist, or the board would never clear and the control
             never come back. */
          self.finishWith(msg, C.AUTO.afterLine, function () {
            self.closeAfterLine();
            self.later(function () { self.clearWorking(); }, C.GRID.unitBox.holdMs);
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
        Board.countOut(pair.from, pair.to, v, self.later.bind(self), verdict);
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
      if (entry.segment) {
        const a = entry.segment.a, b = entry.segment.b;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        // only whole answers are asked for, so a clean one wins
        if (Math.abs(d - Math.round(d)) < 1e-9) answer = Math.round(d);
      }

      this.revealAnswer(v, v === answer, t.spec.correctLine);
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
    workThrough: function (t, then) {
      const self = this, W = C.BOARD.working;
      if (!Opts || !t.spec.formula) { if (then) then(); return; }
      Opts.lock();
      if (Sel) Sel.lock();
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
            const ms = Opts.showFormula(t.spec.formula, function (which) {
              Board.spotlightPart(which);
              SFX.tick(2);
            });
            SFX.sparkle();
            self.later(function () {
              Board.spotlightPart(null);
              self.landOnWorking();        // written; she comes back to it
              self.later(function () { if (then) then(); }, C.AUTO.afterWorking);
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
        SFX.correct();
        /* How long the working takes to play. The screen has to stay
           open for all of it, and the ordinary pause after a right
           answer is nowhere near that. */
        const work = (t.spec.formula && Opts) ? Opts.formulaMs(t.spec.formula) : 0;
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
          this.later(function () {
            self.workThrough(t, function () { self.settle(C.AUTO.afterLine); });
          }, 1100);
        }
      } else {
        t.wrong++;
        SFX.wrong();
        const fb = this.feedbackFor(t);

        /* Out of hints: show the working instead of asking again. */
        if (fb.exhausted && t.spec.formula && Opts) {
          t.done = true;
          this.state = 'waiting';
          Opts.lock();
          SFX.chime();
          this.later(function () {
            self.workThrough(t, function () { self.settle(C.AUTO.afterLine); });
          }, 420);
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
      if (this.index + 1 >= C.SCRIPT.length) return;   // last screen: nothing follows

      this.busy = true;
      this.clearPending();                  // stop the entrance and any queued step
      el.nextBtn.classList.remove('ready');
      SFX.pop();
      Bubble.close();                       // also aborts typing and lifts the duck

      setTimeout(function () {
        self.busy = false;
        self.goTo(self.index + 1);
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
    const fontDone = function () { fontsReady = true; };
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
  function controlGeom() {
    return standGeom(C.BOARD.standUp, {
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
    const g = controlGeom();
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
      StartSprite.setup(el.startBirdWin, el.startFly, el.startTalk, S.scale);
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
    Sprite.setup(el.birdWin, el.flySheet, el.talkSheet, C.CHAR_SCALE);
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

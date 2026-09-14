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
   'bubble', 'bubbleImg', 'bubbleText', 'bubbleLine', 'nextBtn',
   'gridPanel', 'gridImg', 'gridAxes', 'standSwifty',
   'qBanner', 'qBannerImg', 'qBannerText', 'qBannerLine',
   'formulaBoard', 'leafLayer', 'fxLayer', 'sceneArt', 'startArt',
   'startBird', 'startBirdWin', 'startFly', 'startTalk', 'startShadow', 'startSky', 'nudge'
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
      // board to one side, formula beside it, nobody in shot
      return { stand: false, bare: true, scale: C.CHAR_SCALE, anchor: C.ANCHOR,
               aim: C.ANCHOR, feetY: 0, feetCx: 0, inkW: 0,
               bubbleScale: C.BUBBLE.scale,
               panelBox: { x: AX.grid.x, y: AX.grid.y, w: AX.grid.w, h: AX.grid.h } };
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
       the bubble floating above. */
    seatBubble(g);
  }

  /* Seats the speech bubble for one screen. Split out of applyGeom so a
     line can re-seat it at a width measured from the text. */
  function seatBubble(g, inkWOverride, bodyHOverride) {
    /* A layout may bring its own bubble shape — the grid screens use a
       wide, shallow one whose tail leaves the side rather than the
       bottom, because she stands above the board with nothing over her. */
    const B = g.bubble || C.BUBBLE, s = g.bubbleScale;
    const side = B.tailSide === 'left';
    const inkW = (inkWOverride != null ? inkWOverride : B.ink.w) * s;
    /* A shape can be given a shorter balloon for a line that only needs
       one row — the tail keeps its length, so the box shrinks from the
       top and the point stays on her head. */
    const bodyH = bodyHOverride != null ? bodyHOverride : B.bodyH;
    const tailLen = B.tailLen != null ? B.tailLen : (B.tip.y - B.bodyH);
    const inkH = (bodyH + tailLen + 1) * s;
    const tipX = B.tip.x * s, tipY = (bodyH + tailLen) * s;
    const tip = { x: g.aim.x, y: g.aim.y + B.biteIntoHead };

    el.bubble.classList.toggle('tail-left', side);
    el.bubble.style.left = (tip.x - tipX) + 'px';
    el.bubble.style.top = (tip.y - tipY) + 'px';
    el.bubble.style.width = inkW + 'px';
    el.bubble.style.height = inkH + 'px';
    // Pop the bubble out of the tail tip, where it is anchored.
    el.bubble.style.transformOrigin = tipX + 'px ' + tipY + 'px';

    el.bubbleImg.style.width = inkW + 'px';
    el.bubbleImg.style.height = bodyH * s + 'px';

    const bs = el.bubble.style;
    bs.setProperty('--bodyH', bodyH * s + 'px');
    /* A square turned 45 degrees drops its corner 1/root-2 of a side
       past its centre, so this side puts the point exactly on the tip
       when the square is centred on the balloon's edge. */
    bs.setProperty('--tailSq', tailLen * s * Math.SQRT2 + 'px');
    bs.setProperty('--tailX', (side ? 0 : B.tip.x * s) + 'px');
    bs.setProperty('--tailY', (side ? bodyH * s / 2 : bodyH * s) + 'px');
    bs.setProperty('--tailTip', B.tailTip * s + 'px');
    bs.setProperty('--r',      B.radius * s + 'px');
    bs.setProperty('--e1',     B.edgeW * s + 'px');
    bs.setProperty('--e2',     B.midW  * s + 'px');
    bs.setProperty('--e3',     B.goldW * s + 'px');
    bs.setProperty('--fill',   B.fill);
    bs.setProperty('--edge',   B.edge);
    bs.setProperty('--mid',    B.mid);
    bs.setProperty('--gold',   B.gold);
    bs.setProperty('--leaf',   B.leaf * s + 'px');

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

    /* Screen 8's question banner, at its briefed 1:1 size. */
    const Q = C.BOARD.banner;
    el.qBanner.style.left = Q.pos.x + 'px';
    el.qBanner.style.top = Q.pos.y + 'px';
    el.qBanner.style.width = Q.w + 'px';
    el.qBanner.style.height = Q.h + 'px';
    el.qBannerImg.style.width = Q.w + 'px';
    el.qBannerImg.style.height = Q.h + 'px';

    /* The bar is drawn, so its frame and its corner leaves come from
       config and scale with it rather than being baked into a picture. */
    const QP = Q.paper, qs = el.qBanner.style;
    qs.setProperty('--qr',  QP.radius + 'px');
    qs.setProperty('--q1',  QP.e1 + 'px');
    qs.setProperty('--q2',  QP.e2 + 'px');
    qs.setProperty('--q3',  QP.e3 + 'px');
    qs.setProperty('--q4',  QP.e4 + 'px');
    qs.setProperty('--qleaf', QP.leaf + 'px');
    qs.setProperty('--q-top', QP.innerTop);
    qs.setProperty('--q-mid', QP.inner);
    qs.setProperty('--q-bot', QP.innerBot);
    qs.setProperty('--q-edge', QP.edge);
    qs.setProperty('--q-orange', QP.mid);
    qs.setProperty('--q-gold', QP.gold);
    qs.setProperty('--q-hi', QP.hi);
    el.qBannerText.style.left = Q.w * Q.text.left + 'px';
    el.qBannerText.style.top = Q.h * Q.text.top + 'px';
    el.qBannerText.style.width = Q.w * Q.text.width + 'px';
    el.qBannerText.style.height = Q.h * Q.text.height + 'px';
    el.qBannerText.style.fontSize = Q.size + 'px';

    /* It mounts itself and owns its own markup and styles; the game
       only decides where, when, and what range it counts over. */
    if (window.NumberSelector && !Sel) {
      const SP = C.BOARD.selector;
      Sel = window.NumberSelector.mount(el.scene,
        { x: SP.pos.x, y: SP.pos.y, scale: SP.scale, hidden: true });
    }
    if (window.TriangleOptions && !Opts) {
      const OP = C.BOARD.options;
      Opts = window.TriangleOptions.mount(el.scene, { x: OP.pos.x, y: OP.pos.y, hidden: true });
      // scaled to her column, the same way the number selector is
      Opts.el.style.transformOrigin = 'top left';
      Opts.el.style.transform = 'scale(' + OP.scale + ')';
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
      const g = Game.geom, B = g && g.bubble;
      if (!B || !B.autoWidth) return;
      const A = B.autoWidth, line = el.bubbleLine, plate = el.bubbleText;
      const prevWrap = line.style.whiteSpace, prevW = plate.style.width;
      line.style.whiteSpace = 'nowrap';
      plate.style.width = 'auto';
      line.textContent = text;
      const measured = line.offsetWidth;
      line.textContent = '';
      line.style.whiteSpace = prevWrap;
      plate.style.width = prevW;
      if (!measured) return;               // hidden, or no metrics yet
      const want = Math.min(A.max, Math.max(A.min, measured + A.pad * 2));
      /* And the height: a line that fits across in one row gets a
         balloon one row tall, instead of sitting in a box built for the
         longest question in the game. */
      let bodyH = null;
      if (B.pad && B.lineH) {
        const usable = want - B.pad.x * 2 * (g.bubbleScale || 1);
        const rows = Math.max(1, Math.ceil(measured / Math.max(1, usable)));
        bodyH = Math.round(rows * B.lineH + B.pad.y * 2);
      }
      seatBubble(g, want, bodyH);
    },

    /* A coordinate pair must never break across lines, so the space
       inside one becomes non-breaking. Applies to every line, so any
       future "(x, y)" is handled without special-casing. */
    keepPairs: function (text) {
      return text.replace(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, '($1,\u00A0$2)');
    },

    open: function (text, done) {
      // an answer can arrive mid-sentence, so stop any line in flight
      if (this.typing) { this.typing = false; clearInterval(this.timer); SFX.duck(false); }
      text = this.keepPairs(text);
      this.full = text; this.shown = 0; this.onDone = done;
      this.words = text.match(/\S+\s*/g) || [];
      // Unhide first: a display:none plate measures zero.
      clearTimeout(this.hideTimer);
      el.bubble.classList.remove('hidden', 'pop-out');
      this.fitType(text);
      this.fitBox(text);
      el.bubbleLine.textContent = '';
      // restart the pop animation
      el.bubble.classList.remove('pop-in');
      void el.bubble.offsetWidth;
      el.bubble.classList.add('pop-in');

      const self = this;
      setTimeout(function () { self.type(); }, 260);
    },

    type: function () {
      const self = this;
      this.typing = true;
      SFX.duck(true);                 // dip the music under her voice
      if (!standPose) Sprite.play('talk', true);   // beak moves while she speaks

      this.timer = setInterval(function () {
        if (self.shown >= self.words.length) { self.finish(); return; }
        const w = self.words[self.shown++];
        el.bubbleLine.textContent = self.words.slice(0, self.shown).join('');
        // one note per word, dropping at the end of a sentence
        SFX.chirp(/[.!?]\s*$/.test(w) ? 0.7 : 1);
      }, C.AUTO.wordMs);
    },

    /* Tapping mid-line reveals the rest immediately. */
    skip: function () {
      if (!this.typing) return false;
      this.shown = this.words.length;
      el.bubbleLine.textContent = this.full;
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
    built: false, shown: false, labels: [], lines: [], arrows: [], dots: [],
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

      const label = function (txt, x, y, size) {
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
      };
      /* x numbers sit under the axis, y numbers to its left, 0 in the
         corner between them. The three rows are tuned against each
         other: at stepY 61 a 32px number cannot be centred on both the
         x row and the y=-1 row without them touching, so the x row is
         tucked up under its axis, which is what opens the gap the 0
         and the -1 need. */
      for (let x = G.xFrom; x <= G.xTo; x++) {
        if (x === 0) continue;
        label(String(x), ox + x * G.stepX, oy + G.labelGap + G.labelSize * 0.42);
      }
      for (let y = G.yFrom; y <= G.yTo; y++) {
        if (y === 0) continue;
        label(String(y), ox - G.yLabelGap - G.labelSize * 0.30, oy - y * G.stepY);
      }
      label('0', ox - G.zeroGap, oy + G.labelGap + G.labelSize * 0.42);

      // axis names, last so they pop in after the numbers
      const N = G.axisName;
      label('x', xMax + N.gap,  oy - N.rise,    N.size);
      label('y', ox + N.yGap,   yMin + N.yDrop, N.size);

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

        const lt = document.createElementNS(NS, 'text');
        lt.setAttribute('class', 'leglen');
        lt.setAttribute('fill', G.ink);
        lt.setAttribute('font-size', LG.lenSize);

        [ln, dt, co, nm, lp, lt].forEach(function (n) { lg.appendChild(n); });
        svg.appendChild(lg);
        this.legSlots.push({ g: lg, line: ln, dot: dt, coord: co, name: nm,
                             plate: lp, len: lt });
      }

      /* Unit squares for the count-out demo. Made once at the widest      /* Unit squares for the count-out demo. Made once at the widest
         span the board allows and reused, so a wrong answer never
         churns the DOM mid-animation. */
      const U = G.unitBox;
      const ug = document.createElementNS(NS, 'g');
      ug.setAttribute('class', 'units');
      this.unitBoxes = [];
      for (let i = 0; i < U.max; i++) {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('class', 'ubox');
        r.setAttribute('fill', U.fill);
        r.setAttribute('stroke', U.stroke);
        r.setAttribute('stroke-width', U.strokeW);
        r.setAttribute('width', G.stepX);
        r.setAttribute('height', G.stepY);
        ug.appendChild(r);
        this.unitBoxes.push(r);
      }
      const up = document.createElementNS(NS, 'rect');
      up.setAttribute('class', 'uplate');
      up.setAttribute('rx', 12);
      ug.appendChild(up);
      this.unitPlate = up;

      const ul = document.createElementNS(NS, 'text');
      ul.setAttribute('class', 'ulabel');
      ul.setAttribute('fill', G.ink);
      ul.setAttribute('font-size', U.labelSize);
      ug.appendChild(ul);
      svg.appendChild(ug);
      this.unitGroup = ug;
      this.unitLabel = ul;

      /* A plotted segment: two named points joined by a line. Built
         here, positioned and revealed by showSegment(). */
      const SG = G.segment;
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
      const rp = document.createElementNS(NS, 'rect');
      rp.setAttribute('class', 'segresplate');
      rp.setAttribute('rx', 12);
      const rt = document.createElementNS(NS, 'text');
      rt.setAttribute('class', 'segres');
      rt.setAttribute('fill', G.ink);
      rt.setAttribute('font-size', 34);
      seg.appendChild(rp); seg.appendChild(rt);
      this.segResPlate = rp;
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
    },

    /* The board is seated in different boxes on different screens, so
       its placement is applied rather than fixed. */
    box: null,
    /* The panel fills its briefed box exactly rather than being
       letterboxed inside it. The art's own ratio differs by under half
       a percent, so nothing reads as stretched, and the SVG overlay
       maps through the same viewBox — axes and numbers stay locked to
       the drawn gridlines either way. */
    /* Restart the leaves' entrance. Called from every place the board
       is revealed, so they blow in with it each time rather than being
       there already. */
    flutter: function () {
      el.gridPanel.classList.remove('leaves-in');
      void el.gridPanel.offsetWidth;          // restart the animation
      el.gridPanel.classList.add('leaves-in');
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
      st.setProperty('--leaf',   P.leafSize * sx + 'px');

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

      /* Keep the lines off the frame. Clipped rather than shrunk: the
         gradient's phase is measured from this element's own origin, so
         moving or resizing it slides every line off its coordinate,
         while a clip leaves them exactly where they fall. The radius
         follows the cream's inner corner. */
      const inset = (P.frameW + P.hiW) * sx;
      const gw = (P.gxTo - P.gxFrom) * cw + lw, gh = (P.gyTo - P.gyFrom) * ch + lw;
      const cl = Math.max(0, inset - (left - lw / 2));
      const ct = Math.max(0, inset - (top  - lw / 2));
      const cr = Math.max(0, (left - lw / 2 + gw) - (box.w - inset));
      const cb = Math.max(0, (top  - lw / 2 + gh) - (box.h - inset));
      gs.clipPath = 'inset(' + ct + 'px ' + cr + 'px ' + cb + 'px ' + cl +
                    'px round ' + Math.max(0, P.radius * sx - inset) + 'px)';

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

    clearLegs: function () {
      if (!this.legSlots) return;
      this.legSlots.forEach(function (L) {
        L.g.classList.remove('on');
        L.line.classList.remove('draw');
        ['dot', 'coord', 'name', 'plate', 'len'].forEach(function (k) {
          L[k].classList.remove('pop', 'on');
        });
      });
    },

    /* Seats one leg. `spec.mark` puts a labelled corner at its far
       end; `spec.length` writes how long it is alongside it. */
    placeLeg: function (i, spec) {
      const G = C.GRID, LG = G.leg, L = this.legSlots[i];
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const f = spec.from, t = spec.to;
      const x1 = px(f.x), y1 = py(f.y), x2 = px(t.x), y2 = py(t.y);

      L.line.setAttribute('x1', x1); L.line.setAttribute('y1', y1);
      L.line.setAttribute('x2', x2); L.line.setAttribute('y2', y2);
      const len = Math.hypot(x2 - x1, y2 - y1);
      L.line.setAttribute('stroke-dasharray', len);
      L.line.style.strokeDashoffset = len;

      if (spec.mark) {
        L.dot.setAttribute('cx', x2); L.dot.setAttribute('cy', y2);
        // the corner can be drawn as a plotted point rather than a leg end
        L.dot.setAttribute('fill', spec.mark.fill || LG.color);
        L.coord.setAttribute('x', x2 + LG.coordDx); L.coord.setAttribute('y', y2);
        L.coord.textContent = spec.mark.coordText ||
                              ('(' + t.x + ',\u00A0' + t.y + ')');
        L.name.setAttribute('x', x2); L.name.setAttribute('y', y2 + LG.nameDy);
        L.name.textContent = spec.mark.name || '';
        L.dot.style.display = L.coord.style.display = L.name.style.display = '';
      } else {
        L.dot.style.display = L.coord.style.display = L.name.style.display = 'none';
      }

      if (spec.length) {
        const n = Math.abs(t.x - f.x) + Math.abs(t.y - f.y);
        const horiz = (f.y === t.y);
        // below a horizontal leg, out to the side of a vertical one
        L.len.setAttribute('x', horiz ? (x1 + x2) / 2 : (x1 + LG.lenGapV));
        L.len.setAttribute('y', horiz ? y1 + LG.lenGap : (y1 + y2) / 2);
        /* A leg can name its length instead of measuring it — the
           general case labels it x2 - x1 rather than 10 units. */
        L.len.textContent = spec.lengthText ||
                            (n + '\u00A0unit' + (n === 1 ? '' : 's'));
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
          L.line.classList.add('draw');
          if (spec.mark) { L.dot.classList.add('pop'); L.coord.classList.add('pop'); L.name.classList.add('pop'); }
          if (spec.length) {
            later(function () { self.showLegLength(i); SFX.tick(2); }, delay + 200);
            delay += 520;
          }
          return;
        }

        const base = delay;
        if (spec.mark) {
          later(function () { L.dot.classList.add('pop'); SFX.tick(1); }, base + 120);
        }
        /* A leg can still be told to hold its line back from config,
           though no screen asks for that now. */
        if (!spec.noLine) {
          later(function () { L.line.classList.add('draw'); SFX.draw(); }, base + 380);
        }
        if (spec.mark) {
          later(function () { L.coord.classList.add('pop'); SFX.tick(3); }, base + 980);
          later(function () { L.name.classList.add('pop'); SFX.tick(4); }, base + 1100);
        }
        if (spec.length) later(function () { self.showLegLength(i); SFX.tick(5); }, base + 1200);
        delay = base + 1500;
      });

      later(done, delay + 260);
    },

    /* Plates the length text once it is set, so it reads over the grid. */
    showLegLength: function (i) {
      const L = this.legSlots[i];
      L.len.classList.add('pop');
      if (L.len.getBBox) {
        const bb = L.len.getBBox();
        L.plate.setAttribute('x', bb.x - 12);
        L.plate.setAttribute('y', bb.y - 7);
        L.plate.setAttribute('width', bb.width + 24);
        L.plate.setAttribute('height', bb.height + 14);
        L.plate.classList.add('on');
      }
    },

    clearUnits: function () {
      if (!this.unitBoxes) return;
      this.unitBoxes.forEach(function (r) { r.classList.remove('on'); });
      this.unitLabel.classList.remove('on');
      if (this.unitPlate) this.unitPlate.classList.remove('on');
    },

    /* Counts the segment out in unit squares, one at a time, then
       writes the total above it. Only used when a child answers
       wrongly — seeing the units is the whole point of the exercise. */
    runUnits: function (a, b, later, done) {
      const G = C.GRID, U = G.unitBox;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const vertical = (a.x === b.x);
      const n = vertical ? Math.abs(b.y - a.y) : Math.abs(b.x - a.x);
      const loX = Math.min(a.x, b.x), loY = Math.min(a.y, b.y);
      const self = this;

      this.clearUnits();
      /* One unit square per unit of length, laid along the segment and
         offset one unit to its side: hanging beneath a horizontal
         line, stacked beside a vertical one. */
      for (let i = 0; i < this.unitBoxes.length; i++) {
        const r = this.unitBoxes[i];
        if (i < n) {
          // vertical: stack them on the origin side of the line
          r.setAttribute('x', vertical ? (a.x >= 0 ? px(a.x - 1) : px(a.x)) : px(loX + i));
          r.setAttribute('y', vertical ? py(loY + i + 1) : py(a.y));
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      }

      for (let i = 0; i < n; i++) {
        (function (idx) {
          later(function () {
            self.unitBoxes[idx].classList.add('on');
            SFX.tick(idx);
          }, idx * U.stepMs);
        })(i);
      }

      later(function () {
        /* Horizontal: centred in the band under the line. Vertical:
           above the top of the column, pushed to the squares' far edge
           so it clears the coordinate labels opposite. */
        const boxSide = (a.x >= 0) ? -1 : 1;
        self.unitLabel.setAttribute('x', vertical
          ? px(a.x) + boxSide * G.stepX * 0.85
          : (px(loX) + px(loX + n)) / 2);
        self.unitLabel.setAttribute('y', vertical
          ? py(Math.max(a.y, b.y)) - U.labelUpV
          : py(a.y) + U.labelDy);
        self.unitLabel.textContent = n + '\u00A0unit' + (n === 1 ? '' : 's');
        self.unitLabel.classList.add('on');
        /* Size the plate to the text once it is set. A segment can sit
           anywhere — across the y-axis, beside its numbers — so the
           total needs its own ground rather than a halo alone. */
        if (self.unitLabel.getBBox) {
          const bb = self.unitLabel.getBBox();
          self.unitPlate.setAttribute('x', bb.x - 14);
          self.unitPlate.setAttribute('y', bb.y - 8);
          self.unitPlate.setAttribute('width', bb.width + 28);
          self.unitPlate.setAttribute('height', bb.height + 16);
          self.unitPlate.classList.add('on');
        }
        SFX.chime();
      }, n * U.stepMs + 220);

      later(done, n * U.stepMs + 900);
    },

    /* Seats a segment's two points, its line and its four labels. */
    placeSegment: function (spec) {
      const G = C.GRID, SG = G.segment;
      const NS2 = 'http://www.w3.org/2000/svg';
      const a = spec.a, b = spec.b;
      // a screen can recolour the segment — red once it closes a triangle
      this.segLine.setAttribute('stroke', spec.color || SG.lineColor);
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const self = this;

      this.segLine.setAttribute('x1', px(a.x)); this.segLine.setAttribute('y1', py(a.y));
      this.segLine.setAttribute('x2', px(b.x)); this.segLine.setAttribute('y2', py(b.y));

      /* Same two ends for the dashed guide; it grows out of A, so the
         group's origin is pinned there. */
      this.segDash.setAttribute('x1', px(a.x)); this.segDash.setAttribute('y1', py(a.y));
      this.segDash.setAttribute('x2', px(b.x)); this.segDash.setAttribute('y2', py(b.y));
      this.segDashG.style.transformOrigin = px(a.x) + 'px ' + py(a.y) + 'px';
      const len = Math.hypot(px(b.x) - px(a.x), py(b.y) - py(a.y));
      this.segLine.setAttribute('stroke-dasharray', len);
      this.segLine.style.strokeDashoffset = len;

      /* A vertical segment stacks its points, so labels above and
         below would collide with each other. Those go to the sides. */
      const vertical = (a.x === b.x);
      // face the labels away from the y-axis, or they sit on its numbers
      const side = (a.x >= 0) ? 1 : -1;

      [['a', a], ['b', b]].forEach(function (pair) {
        const key = pair[0], p = pair[1], part = self.segParts[key];
        const X = px(p.x), Y = py(p.y);
        part.dot.setAttribute('cx', X);  part.dot.setAttribute('cy', Y);

        part.coord.setAttribute('x', vertical ? X + side * SG.coordDx : X);
        part.coord.setAttribute('y', vertical ? Y + SG.vCoordDy
                                              : Y + (spec.coordDy != null ? spec.coordDy : SG.coordDy));
        /* A point can carry its own label — the general case names the
           points (x1, y1) and (x2, y2) rather than their values — and
           can split it so one fragment glows on its own. */
        while (part.coord.firstChild) part.coord.removeChild(part.coord.firstChild);
        if (p.coordParts) {
          p.coordParts.forEach(function (f) {
            const ts = document.createElementNS(NS2, 'tspan');
            ts.textContent = f.t;
            if (f.glow) ts.classList.add('glowable');
            part.coord.appendChild(ts);
          });
        } else {
          part.coord.textContent = p.coordText || ('(' + p.x + ',\u00A0' + p.y + ')');
        }

        /* A point can carry its own letter offset. The default puts the
           letter straight below, which lands on top of a leg dropped
           from that same point — so those points push theirs aside. */
        part.name.setAttribute('x', p.nameDx != null ? X + p.nameDx
                                  : (vertical ? X + side * SG.coordDx : X));
        part.name.setAttribute('y', p.nameDy != null ? Y + p.nameDy
                                  : (vertical ? Y + SG.vNameDy
                                              : Y + (spec.nameDy != null ? spec.nameDy : SG.nameDy)));
        part.name.textContent = p.name || '';
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
    showSegResult: function (spec, text, dy, dx) {
      const G = C.GRID;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      this.segLine.classList.add('lit');
      this.segRes.setAttribute('x', (px(spec.a.x) + px(spec.b.x)) / 2 + (dx || 0));
      this.segRes.setAttribute('y', (py(spec.a.y) + py(spec.b.y)) / 2 + dy);
      this.segRes.textContent = text;
      this.segRes.classList.add('pop');
      if (this.segRes.getBBox) {
        const bb = this.segRes.getBBox();
        this.segResPlate.setAttribute('x', bb.x - 16);
        this.segResPlate.setAttribute('y', bb.y - 9);
        this.segResPlate.setAttribute('width', bb.width + 32);
        this.segResPlate.setAttribute('height', bb.height + 18);
        this.segResPlate.classList.add('on');
      }
    },

    clearSegment: function () {
      this.clearUnits();
      this.clearLegs();
      this.clearMeasure();
      if (!this.segGroup) return;
      this.glowCoords(false);
      if (this.segRes) { this.segRes.classList.remove('pop'); this.segResPlate.classList.remove('on'); }
      if (this.segLine) this.segLine.classList.remove('lit');
      this.segGroup.classList.remove('on');
      this.segLine.classList.remove('draw');
      /* The dashed guide has to be reset too, or once one screen draws
         it every screen after inherits it — already complete, so it
         never reads as arriving at the end of the plot. */
      if (this.segDashG) this.segDashG.classList.remove('draw');
      const self = this;
      ['a', 'b'].forEach(function (k) {
        const p = self.segParts[k];
        p.dot.classList.remove('pop');
        p.coord.classList.remove('pop');
        p.name.classList.remove('pop');
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
      /* This screen plots its own points, so anything located on an
         earlier one goes. A locate screen plots nothing and keeps what
         is already there — that is how the first point stays put while
         the second is being found. */
      this.clearFound();
      this.placeSegment(spec);
      this.clearSegment();
      this.segGroup.classList.add('on');

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

    /* `units` squares out from the point the question starts from,
       towards the other one. Clamped to the board so a long guess
       stops at the edge rather than running off it. */
    setMeasure: function (from, to, units) {
      const G = C.GRID;
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const sx = Math.sign(to.x - from.x), sy = Math.sign(to.y - from.y);
      const ex = Math.max(G.xFrom, Math.min(G.xTo, from.x + sx * units));
      const ey = Math.max(G.yFrom, Math.min(G.yTo, from.y + sy * units));
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
      t.setAttribute('x', px + F.labelDx);
      t.setAttribute('y', py + F.labelDy);
      t.setAttribute('fill', G.ink);
      t.setAttribute('font-size', F.labelSize);
      t.setAttribute('class', 'flabel');
      t.textContent = '(' + gx + ',\u00A0' + gy + ')';
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
      this.lines.forEach(function (l) { l.classList.remove('draw'); });
      this.arrows.forEach(function (a) { a.classList.remove('pop'); });
      this.labels.forEach(function (t) { t.classList.remove('pop'); });
      this.clearFound();
      el.gridPanel.classList.add('hidden');
      el.gridPanel.classList.remove('magic-in');
      this.setDots(false);
    },

    /* panel -> x axis -> y axis -> arrowheads -> numbers */
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
      this.flutter();
      SFX.magic();
      FX.sparkles(cx, cy, 12, 380);

      later(function () {
        self.axisX.forEach(function (l) { l.classList.add('draw'); });
        SFX.draw();
      }, 760);

      later(function () {
        self.axisY.forEach(function (l) { l.classList.add('draw'); });
        SFX.draw();
      }, 1020);

      later(function () {
        self.arrows.forEach(function (a, i) {
          later(function () { a.classList.add('pop'); SFX.tick(i); }, i * 70);
        });
      }, 1520);

      /* Numbers only once every line and arrowhead is in, and `done`
         only once the last number has finished popping — the two were
         using different spacings, so the dots used to start while the
         final few numbers were still arriving. */
      const STEP = 60, POP = 420;
      later(function () {
        self.labels.forEach(function (t, i) {
          later(function () { t.classList.add('pop'); SFX.tick(i); }, i * STEP);
        });
      }, 1860);

      later(done, 1860 + (this.labels.length - 1) * STEP + POP + 140);
    }
  };

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
    /* A fixed set of lines, arriving one after another. */
    setLines: function (lines) {
      const fb = this.inner();
      this.clear();
      lines.forEach(function (l, i) {
        const d = document.createElement('div');
        d.classList.add('fb-' + (l.kind || 'lead'));
        d.textContent = l.text;
        d.style.animationDelay = (i * 300) + 'ms';
        fb.appendChild(d);
      });
    },
    /* One line built from fragments, so a part can glow or fade. */
    setStep: function (parts) {
      const fb = this.inner();
      this.clear();
      const d = document.createElement('div');
      d.classList.add('fb-step');
      parts.forEach(function (f) {
        const sp = document.createElement('span');
        sp.textContent = f.t;
        if (f.glow) sp.classList.add('glow');
        if (f.fade) sp.classList.add('fade');
        d.appendChild(sp);
      });
      fb.appendChild(d);
    }
  };

  /* ---------------- screen flow ---------------- */
  const Game = {
    index: -1, state: 'start', busy: false, geom: null, task: null, askTimer: null,
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
      this.index = i;
      this.state = 'entering';
      el.nextBtn.classList.remove('ready');

      const entry = C.SCRIPT[i];
      const geom = geomFor(i);
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
        /* The banner belongs to the axis screens now; every other screen
           asks through her bubble. */
        if (!AX) el.qBanner.classList.add('hidden');
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
        Sel.setRange(r.min, r.max, r.start);
        Sel.onCheck(!numeric ? null : function (v) {
          if (entry.task.kind === 'distance') self.checkDistance(v);
          else self.checkEntry(v);
        });
        /* Changing it lays the measuring line down as it goes, so the
           control reads as a ruler rather than a number picker. */
        Sel.onChange(entry.task && entry.task.kind === 'distance'
          ? function (v) { self.showMeasure(v); } : null);
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
      const after = function () {
        if (entry.line && geom.bare) self.ask(entry.line);   // banner, not bubble
        else if (entry.line) self.speak(entry.line, withControl
          ? function () { revealControl(entry); } : null);
        else if (entry.auto && i + 1 < C.SCRIPT.length) {
          self.later(function () { self.goTo(i + 1); }, 160);
        } else {
          self.settle(C.AUTO.afterSilent);
        }
      };

      const arrive = function () {
        if (entry.entrance === 'fly') self.flyIn(after);
        else if (entry.entrance === 'flyOut') self.flyOut(after);
        else if (entry.entrance === 'hop') self.hop(after);
        else if (entry.entrance === 'none') after();     // nobody to bring on
        else self.stay(after);
      };

      /* Screen 8 hides its changeover behind a curtain of leaves: the
         swap happens while the frame is covered, so Swifty leaving and
         the board re-seating itself are never seen. */
      /* Plot the segment, then any leg dropped from it, before asking
         about either. */
      const plotThen = function (next) {
        const afterSeg = function () {
          if (entry.legs) Board.runLegs(entry.legs, self.later.bind(self), next);
          else next();
        };
        /* A screen that keeps what it inherited does not replot the
           segment — only whatever is new gets drawn. */
        if (entry.segment && !entry.keepSegment) {
          Board.runSegment(entry.segment, self.later.bind(self), afterSeg);
        } else afterSeg();
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

        /* Only a board screen brings the board through the sweep; the
           field screens leave it behind entirely. */
        /* A distance question arrives with the frame empty and brings
           the board, the question and the controls in itself, in that
           order — so the sweep must not put any of them up early. */
        const holds = entry.intro === 'measure';
        if (onBoard && !holds) {
          Board.place(geom.panelBox || C.GRID.box);
          el.gridPanel.classList.remove('hidden');
          Board.flutter();
          Board.shown = true;
          Board.setDots(!!entry.dots);
        } else {
          el.gridPanel.classList.add('hidden');
          Board.shown = false;
          Board.setDots(false);
          Board.clearSegment();
        }

        if ((entry.layout === 'board' || AX) && !holds) {
          /* Empty before it pops in: the banner is on screen while the
             board draws, and the last screen's line must not sit in it. */
          el.qBannerLine.textContent = '';
          el.qBanner.classList.remove('hidden', 'pop-in');
          void el.qBanner.offsetWidth;
          el.qBanner.classList.add('pop-in');
        } else {
          el.qBanner.classList.add('hidden');
        }

        if (Sel) {
          if ((entry.distance || entry.entry) && !holds) { Sel.reset(); Sel.show(); }
          else Sel.hide();
        }
        if (Opts && !entry.options) Opts.hide();   // shown by revealControl

        if (entry.layout === 'recap') {
          Formula.place(C.RECAP.formula);
          Formula.setLines(C.RECAP.lines);
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
           the banner is already on screen and would sit empty — but
           the formula only starts narrowing once it has been read. */
        const SEG_MS = 1980, LEAD = 700;
        let read = 0;
        if (entry.line) {
          self.later(function () { self.ask(entry.line); }, LEAD);
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
        el.qBanner.classList.add('hidden');
        el.qBannerLine.textContent = '';
        if (Sel) Sel.hide();

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
        Board.setDots(false);
        Board.clearSegment();

        const plot = function () {
          Board.shown = true;

          /* 2. the points, then their coordinates, then their letters,
             then the dashed guide along the span being asked about.
             The solid line is still held back — that is the answer. */
          const measuringLeg = entry.task && entry.task.measureLeg != null;
          Board.runPoints(entry.segment, self.later.bind(self), function () {
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
            /* A leg question draws every leg first, the one it is about
               included: the triangle is being built up across these
               screens, so each side goes on the board and is then
               measured. Only a question about the segment itself keeps
               its line back, since there the line is the answer. */
            if (entry.legs) Board.runLegs(entry.legs, self.later.bind(self), asks);
            else asks();
          }, measuringLeg);
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

      /* 4. the controls arrive. The board does not move and there is no
         banner: she is still standing on the rail with the question in
         her bubble, so repeating it in a bar underneath would be the
         same sentence twice. */
      const opens = function () {
        self.later(function () {
          revealControl(entry);        // she rises, the control follows
          Board.clearMeasure();
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
        // she asks from her own bubble on these screens; no banner
        el.qBannerLine.textContent = '';
        el.qBanner.classList.add('hidden');
        Board.shown = true;
        if (!entry.keepSegment) Board.clearSegment();
        else Board.clearUnits();          // keep the drawing, drop any count-out
        if (Sel && (entry.distance || entry.entry)) { Sel.reset(); Sel.show(); }
        if (Opts && entry.options) { Opts.reset(); Opts.show(); }
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
      FX.sparkles(C.ANCHOR.x, C.ANCHOR.y - 200 * C.CHAR_SCALE, 7, 170 * C.CHAR_SCALE);
      Bubble.open(line, function () {
        if (then) then();
        /* Longer after a right answer than after an ordinary line: the
           confetti is still coming down. */
        self.settle(self.task && self.task.done ? C.AUTO.afterCorrect : C.AUTO.afterLine);
      });
    },

    /* The banner's version of speak(): types the question into the
       question bar, with the same chirps and music duck. */
    ask: function (line) {
      const self = this;
      /* An answer can land while a line is still typing, so stop the
         one in flight first — two intervals writing into the same
         banner would interleave their text. */
      if (this.askTimer) {
        clearInterval(this.askTimer);
        this.askTimer = null;
        SFX.duck(false);
      }
      this.state = 'speaking';
      const text = Bubble.keepPairs(line);
      el.qBannerLine.textContent = '';
      SFX.duck(true);

      const words = text.match(/\S+\s*/g) || [];
      let n = 0;
      const timer = setInterval(function () {
        if (n >= words.length) {
          clearInterval(timer);
          self.askTimer = null;
          SFX.duck(false);
          SFX.chime();
          self.settle(self.task && self.task.done ? C.AUTO.afterCorrect : C.AUTO.afterLine);
          return;
        }
        const w = words[n++];
        el.qBannerLine.textContent = words.slice(0, n).join('');
        SFX.chirp(/[.!?]\s*$/.test(w) ? 0.7 : 1);
      }, C.AUTO.wordMs);
      this.askTimer = timer;
      this.pending.push(timer);
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

    /* The slider moved: lay the line down that far. */
    showMeasure: function (v) {
      const t = this.task;
      if (!t || t.done) return;
      const pair = this.measurePair();
      if (!pair) return;
      Board.setMeasure(pair.from, pair.to, v);
    },

    checkDistance: function (v) {
      const t = this.task;
      if (!t || t.done) return;
      const self = this;
      const sg = C.SCRIPT[this.index] && C.SCRIPT[this.index].segment;

      // only axis-aligned pairs are asked about, so one term is zero
      const pair = this.measurePair();
      const answer = t.spec.answer != null ? t.spec.answer
        : (pair ? Math.abs(pair.to.x - pair.from.x) + Math.abs(pair.to.y - pair.from.y) : null);

      if (v === answer) {
        t.done = true;
        this.state = 'waiting';
        SFX.correct();
        if (Sel) { Sel.markCorrect(); Sel.lock(); }
        Board.litMeasure();        // their line reached, and stays lit
        this.later(function () {
          SFX.cheer();
          SFX.confettiPop();
          FX.confetti(60);
          self.ask(t.spec.correctLine);
        }, 260);
        return;
      }

      /* Wrong: rather than just saying no, count the segment out in
         unit squares so the answer is visible, then hand the slider
         back so they can try again. */
      t.wrong++;
      SFX.wrong();
      if (Sel) Sel.markWrong();
      const fb = this.feedbackFor(t);

      /* No showLine means no count-out: some questions want a hint
         rather than the whole thing worked through. */
      if (!sg || !t.spec.showLine) {
        this.later(function () { self.ask(fb.msg); }, 240);
        return;
      }

      this.state = 'showing';
      this.later(function () {
        self.ask(t.spec.showLine);
        Board.runUnits(sg.a, sg.b, self.later.bind(self), function () {
          self.state = 'waiting';
          self.ask(fb.msg);                       // the slider is live again
        });
      }, 260);
    },

    /* A typed answer. The right answer is worked out from the board
       rather than trusted from config where it can be: the legs are
       measured off the two points, so a moved point cannot leave a
       stale answer behind. */
    checkEntry: function (v) {
      const t = this.task;
      if (!t || t.done) return;
      const self = this;
      const entry = C.SCRIPT[this.index] || {};

      let answer = t.spec.answer;
      if (entry.segment) {
        const a = entry.segment.a, b = entry.segment.b;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        // only whole answers are asked for, so a clean one wins
        if (Math.abs(d - Math.round(d)) < 1e-9) answer = Math.round(d);
      }

      if (v === answer) {
        t.done = true;
        this.state = 'waiting';
        SFX.correct();
        if (Sel) { Sel.markCorrect(); Sel.lock(); }
        Board.litMeasure();
        this.later(function () {
          SFX.cheer();
          SFX.confettiPop();
          FX.confetti(60);
          self.ask(t.spec.correctLine);
        }, 260);
        return;
      }

      t.wrong++;
      SFX.wrong();
      if (Sel) Sel.markWrong();
      const fb = this.feedbackFor(t);
      this.later(function () { self.ask(fb.msg); }, 240);
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
        this.later(function () {
          SFX.cheer();
          SFX.confettiPop();
          FX.confetti(60);
          self.ask(t.spec.correctLine);
        }, 260);
        // the chosen method, worked through where the buttons were
        if (t.spec.formula && Opts) {
          this.later(function () {
            Opts.showFormula(t.spec.formula);
            SFX.sparkle();
          }, 700);
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
          this.later(function () {
            Opts.showFormula(t.spec.formula);
            SFX.chime();
            SFX.sparkle();
            // longer than usual: there are four lines of working to read
            self.settle(C.AUTO.afterReveal);
          }, 420);
          return;
        }
        this.later(function () { self.ask(fb.msg); }, 320);
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
        FX.confetti(60);
        (self.geom && self.geom.bare ? self.ask : self.speak).call(self, t.spec.correctLine);
      }, 260);
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
          (self.geom && self.geom.bare ? self.ask : self.speak).call(self, t.spec.revealLine);
        }, 620);
      } else {
        this.later(function () {
          (self.geom && self.geom.bare ? self.ask : self.speak).call(self, t.spec.tryAgainLine);
        }, 260);
      }
    },

    /* Tapping the scene: first tap finishes the line, second moves on. */
    advance: function () {
      if (this.state === 'speaking') { Bubble.skip(); return; }
      if (this.state !== 'waiting') return;
      this.skipScreen();
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

    // Tapping the scene skips typing or moves to the next line.
    el.scene.addEventListener('click', function () { Game.advance(); });
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (Game.state === 'start') Game.begin(); else Game.advance();
      }
    });
  }

  /* ---------------- preload ---------------- */
  function preload(done) {
    const list = Object.keys(C.ART).map(function (k) { return C.ART[k]; });
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
      im.onerror = bump;   // never let one bad path stall the game
      im.src = src;
    });
  }

  /* A control wants the bottom of her column, so she moves up out of
     its way as it arrives — she is not drawn in a different place, she
     travels there, which is why the move carries a transition and why
     her line has to be re-fitted afterwards (re-seating the rig resets
     the balloon to its default size). */
  function revealControl(entry) {
    const moving = [el.standSwifty, el.bubble, el.shadow, el.birdRig];
    const g = standGeom(C.BOARD.standUp, {
      noShadow: true,        // she is standing on the control, not on grass
      panelBox: { x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                  w: C.BOARD.panel.w, h: C.BOARD.panel.h }
    });
    Game.geom = g;
    moving.forEach(function (n) { n.classList.add('rising'); });
    applyGeom(g);
    /* Re-seating the rig resets the balloon to its default size, so the
       line is re-fitted — and then written back, because fitBox() blanks
       the line after measuring it (it normally runs just before the text
       is typed in, where leaving it empty is the point). */
    Bubble.fitBox(Bubble.full);
    el.bubbleLine.textContent = Bubble.full;
    setTimeout(function () {
      moving.forEach(function (n) { n.classList.remove('rising'); });
    }, 720);

    /* The control comes in while she is still moving, so the two read as
       one action — her stepping aside and it taking the space. */
    setTimeout(function () {
      if (Sel) {
        if (entry.distance || entry.entry) { Sel.reset(); Sel.show(); }
        else Sel.hide();
      }
      if (Opts) {
        if (entry.options) { Opts.reset(); Opts.show(); } else Opts.hide();
      }
    }, 150);
  }

  /* ---------------- the nudge ---------------- */
  /* For a child who has stopped on a locate screen. The point they are
     looking for speaks up on its own first; only if that goes unanswered
     does a hand come down and tap it. Touching anything at all puts the
     clock back to the start — this is a hint for someone stuck, not a
     timer to beat, so a child who is still thinking and moving the
     cursor never sees it. */
  const Hint = {
    pulseT: null, handT: null, hideT: null, dot: null, target: null,

    clear: function () {
      clearTimeout(this.pulseT); clearTimeout(this.handT); clearTimeout(this.hideT);
      this.pulseT = this.handT = this.hideT = null;
      this.target = null;
      if (this.dot) { this.dot.classList.remove('hint'); this.dot = null; }
      el.nudge.classList.add('hidden');
      el.nudge.classList.remove('tapping');
    },

    /* Only screens with one right place to point at arm it. */
    arm: function (target) {
      const t = target || this.target;
      this.clear();
      if (!t) return;
      this.target = t;
      const self = this, N = C.NUDGE;

      this.pulseT = setTimeout(function () {
        const dot = Board.dots.filter(function (d) {
          return Number(d.dataset.gx) === t.x && Number(d.dataset.gy) === t.y;
        })[0];
        if (!dot) return;
        self.dot = dot;
        dot.classList.add('hint');
        SFX.blip();
      }, N.pulseAfter);

      this.handT = setTimeout(function () {
        // and away again after a while: a pointer, not a fixture
        self.hideT = setTimeout(function () {
          el.nudge.classList.add('hidden');
          el.nudge.classList.remove('tapping');
        }, N.handFor);
        const at = Board.stagePos(t.x, t.y);
        const k = N.height / N.inkH;          // the hand's ink at its rendered size
        const st = el.nudge.style;
        st.width  = N.srcW * k + 'px';
        st.height = N.srcH * k + 'px';
        // the fingertip, not the corner, is what lands on the point
        st.left = (at.x - N.tip.x * k) + 'px';
        st.top  = (at.y - N.tip.y * k) + 'px';
        el.nudge.classList.remove('hidden');
        void el.nudge.offsetWidth;
        el.nudge.classList.add('tapping');
      }, N.handAfter);
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
    el.nudge.src = C.ART.handNudge;
    el.nudge.style.setProperty('--tipx', (C.NUDGE.tip.x / C.NUDGE.srcW * 100) + '%');
    el.nudge.style.setProperty('--tipy', (C.NUDGE.tip.y / C.NUDGE.srcH * 100) + '%');

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

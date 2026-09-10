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
   'bubble', 'bubbleImg', 'bubbleText', 'bubbleLine', 'nextBtn', 'dots',
   'gridPanel', 'gridImg', 'gridAxes', 'standSwifty',
   'qBanner', 'qBannerImg', 'qBannerText', 'qBannerLine',
   'formulaBoard', 'leafLayer', 'fxLayer'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  /* ---------------- responsive stage ---------------- */
  function fitStage() {
    const s = Math.min(window.innerWidth / C.STAGE_W, window.innerHeight / C.STAGE_H);
    el.stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);

  /* ---------------- sprite player ---------------- */
  const Sprite = {
    sheet: 'talk', frame: 0, playing: false, acc: 0, last: 0, loop: true,
    scale: C.CHAR_SCALE,
    img: { fly: null, talk: null },

    setup: function () {
      this.img.fly = el.flySheet;
      this.img.talk = el.talkSheet;
      this.setScale(C.CHAR_SCALE);
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

      el.birdWin.style.left = -(f.ax - f.x) * S + 'px';
      el.birdWin.style.top = -(f.ay - f.y) * S + 'px';
      el.birdWin.style.width = f.w * S + 'px';
      el.birdWin.style.height = f.h * S + 'px';

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

  let lastT = 0;
  function loop(t) {
    const dt = lastT ? Math.min(t - lastT, 60) : 16;
    lastT = t;
    Sprite.tick(dt);
    requestAnimationFrame(loop);
  }

  /* ---------------- layout of positioned art ---------------- */
  const REF_W = C.SHEETS.talk.frames[0].w;
  let Dist = null;              // the distance selector, mounted on demand
  let Opts = null;              // the triangle-type answer panel

  /* Where the character, her shadow and her bubble sit on a given
     screen. Screens 1-4 use the small field pose; screen 5 puts her
     full size on the left of the board in the standing artwork. */
  function geomFor(i) {
    const entry = C.SCRIPT[i] || {};
    if (entry.layout === 'recap') {
      // the result stated on its own: board to one side, nobody in shot
      const R = C.RECAP;
      return { stand: false, bare: true, scale: C.CHAR_SCALE, anchor: C.ANCHOR,
               aim: C.ANCHOR, feetY: 0, feetCx: 0, inkW: 0,
               bubbleScale: C.BUBBLE.scale,
               panelBox: { x: R.grid.x, y: R.grid.y, w: R.grid.w, h: R.grid.h } };
    }
    if (entry.layout === 'board') {
      // Swifty is gone; nothing character-shaped to seat.
      return { stand: false, bare: true, scale: C.CHAR_SCALE, anchor: C.ANCHOR,
               aim: C.ANCHOR, feetY: 0, feetCx: 0, inkW: 0,
               bubbleScale: C.BUBBLE.scale, panelBox: {
                 x: C.BOARD.panel.pos.x, y: C.BOARD.panel.pos.y,
                 w: C.BOARD.panel.w, h: C.BOARD.panel.h } };
    }
    if (entry.layout === 'grid') {
      const S = C.STAND;
      return {
        stand: true,
        scale: 1,
        anchor: { x: S.pos.x + S.belly.x,   y: S.pos.y + S.belly.y },
        aim:    { x: S.pos.x + S.belly.x,   y: S.pos.y + S.headTop.y },
        feetY:  S.pos.y + S.feet.y,
        feetCx: S.pos.x + S.feet.cx,
        inkW:   S.inkW,
        bubbleScale: entry.bubbleScale || C.BUBBLE.scale
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
    const B = C.BUBBLE, s = g.bubbleScale;
    const tip = { x: g.aim.x, y: g.aim.y + B.biteIntoHead };
    const inkW = B.ink.w * s, inkH = B.ink.h * s;
    const tipX = B.tip.x * s, tipY = B.tip.y * s;

    el.bubble.style.left = (tip.x - tipX) + 'px';
    el.bubble.style.top = (tip.y - tipY) + 'px';
    el.bubble.style.width = inkW + 'px';
    el.bubble.style.height = inkH + 'px';
    // Pop the bubble out of the tail tip, where it is anchored.
    el.bubble.style.transformOrigin = tipX + 'px ' + tipY + 'px';

    el.bubbleImg.style.width = B.srcW * s + 'px';
    el.bubbleImg.style.height = B.srcH * s + 'px';
    el.bubbleImg.style.left = -B.ink.x * s + 'px';
    el.bubbleImg.style.top = -B.ink.y * s + 'px';

    el.bubbleText.style.left = inkW * B.text.left + 'px';
    el.bubbleText.style.top = inkH * B.text.top + 'px';
    el.bubbleText.style.width = inkW * B.text.width + 'px';
    el.bubbleText.style.height = inkH * B.text.height + 'px';
  }

  function layout() {
    applyGeom(geomFor(0));

    /* Screen 5 art sits at fixed 1:1 positions from the brief. */
    Board.place(C.GRID.box);

    /* Screen 24's formula board. Sized from its content so the panel
       always fits the lines it is given. */
    const R = C.RECAP;
    el.formulaBoard.style.left = R.formula.x + 'px';
    el.formulaBoard.style.top = R.formula.y + 'px';
    el.formulaBoard.style.width = R.formula.w + 'px';
    /* Build the inner plate if the markup does not carry one, so the
       panel does not depend on a specific bit of HTML being present. */
    let fb = el.formulaBoard.querySelector && el.formulaBoard.querySelector('.fb-inner');
    if (!fb) {
      fb = document.createElement('div');
      fb.classList.add('fb-inner');
      el.formulaBoard.appendChild(fb);
    }
    R.lines.forEach(function (l, i) {
      const d = document.createElement('div');
      d.classList.add('fb-' + (l.kind || 'lead'));
      d.textContent = l.text;
      d.style.animationDelay = (i * 300) + 'ms';
      fb.appendChild(d);
    });

    /* Screen 8's question banner, at its briefed 1:1 size. */
    const Q = C.BOARD.banner;
    el.qBanner.style.left = Q.pos.x + 'px';
    el.qBanner.style.top = Q.pos.y + 'px';
    el.qBanner.style.width = Q.w + 'px';
    el.qBanner.style.height = Q.h + 'px';
    el.qBannerImg.style.width = Q.w + 'px';
    el.qBannerImg.style.height = Q.h + 'px';
    el.qBannerText.style.left = Q.w * Q.text.left + 'px';
    el.qBannerText.style.top = Q.h * Q.text.top + 'px';
    el.qBannerText.style.width = Q.w * Q.text.width + 'px';
    el.qBannerText.style.height = Q.h * Q.text.height + 'px';
    el.qBannerText.style.fontSize = Q.size + 'px';

    /* Screen 8's distance selector. It mounts itself and owns its own
       markup and styles; the game only decides where and when. */
    if (window.DistancePanel && !Dist) {
      const DP = C.BOARD.distance;
      Dist = window.DistancePanel.mount(el.scene, { x: DP.pos.x, y: DP.pos.y, hidden: true });
    }
    if (window.TriangleOptions && !Opts) {
      const OP = C.BOARD.options;
      Opts = window.TriangleOptions.mount(el.scene, { x: OP.pos.x, y: OP.pos.y, hidden: true });
    }

    const S = C.STAND;
    el.standSwifty.style.left = S.pos.x + 'px';
    el.standSwifty.style.top = S.pos.y + 'px';
    el.standSwifty.style.width = S.w + 'px';
    el.standSwifty.style.height = S.h + 'px';

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
    typing: false, timer: null, full: '', shown: 0, onDone: null,

    /* Pick the largest type size at which the whole line still fits
       the plate, so a long line can never spill out of the bubble
       (and so a fallback font can't break the layout either). */
    fitType: function (text) {
      const line = el.bubbleLine, plate = el.bubbleText;
      const max = plate.clientHeight;      // 0 while the bubble is hidden
      let size = 42;
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
      // Unhide first: a display:none plate measures zero.
      el.bubble.classList.remove('hidden', 'pop-out');
      this.fitType(text);
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

      let sinceChirp = 0;
      this.timer = setInterval(function () {
        if (self.shown >= self.full.length) { self.finish(); return; }
        const ch = self.full[self.shown++];
        el.bubbleLine.textContent = self.full.slice(0, self.shown);
        sinceChirp++;
        if (ch !== ' ' && sinceChirp >= 2) {
          sinceChirp = 0;
          SFX.chirp(/[.!?]/.test(ch) ? 0.7 : 1);
        }
      }, 42);
    },

    /* Tapping mid-line reveals the rest immediately. */
    skip: function () {
      if (!this.typing) return false;
      this.shown = this.full.length;
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

    close: function () {
      if (this.typing) { this.typing = false; clearInterval(this.timer); SFX.duck(false); }
      el.bubble.classList.remove('pop-in');
      el.bubble.classList.add('pop-out');
      const b = el.bubble;
      setTimeout(function () { b.classList.add('hidden'); b.classList.remove('pop-out'); }, 240);
    }
  };

  /* ---------------- coordinate board ---------------- */
  /* The panel art carries only the cream board and its grid. The axes,
     arrowheads and numbers are drawn as an SVG overlay so each part
     can animate in on its own, and so the numbers land exactly on the
     drawn gridlines (measured into CFG.GRID). */
  const Board = {
    built: false, shown: false, labels: [], lines: [], arrows: [], dots: [],

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
      // four half-axes, each drawn outward from the origin
      this.axisX = [half(xMin, oy), half(xMax, oy)];
      this.axisY = [half(ox, yMin), half(ox, yMax)];

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
        t.setAttribute('fill', G.ink);
        t.setAttribute('font-size', size || G.labelSize);
        t.setAttribute('class', 'glabel');
        t.textContent = txt;
        svg.appendChild(t);
        self.labels.push(t);
      };
      // x numbers sit under the axis, y numbers to its left, 0 in the
      // corner between them — as in the reference board.
      for (let x = G.xFrom; x <= G.xTo; x++) {
        if (x === 0) continue;
        label(String(x), ox + x * G.stepX, oy + G.labelGap + G.labelSize * 0.42);
      }
      for (let y = G.yFrom; y <= G.yTo; y++) {
        if (y === 0) continue;
        label(String(y), ox - G.labelGap - G.labelSize * 0.30, oy - y * G.stepY);
      }
      label('0', ox - G.zeroGap, oy + G.labelGap + G.labelSize * 0.42);

      // axis names, last so they pop in after the numbers
      const N = G.axisName;
      label('x', xMax + N.gap, oy - N.rise, N.size);
      label('y', ox + N.gap, yMin + N.yDrop, N.size);

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
      const segLine = document.createElementNS(NS, 'line');
      segLine.setAttribute('class', 'segline');
      segLine.setAttribute('stroke', SG.lineColor);
      segLine.setAttribute('stroke-width', SG.lineWidth);
      segLine.setAttribute('stroke-linecap', 'round');
      seg.appendChild(segLine);
      this.segLine = segLine;
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
    place: function (box) {
      const G = C.GRID;
      this.box = box;
      el.gridPanel.style.left = box.x + 'px';
      el.gridPanel.style.top = box.y + 'px';
      el.gridPanel.style.width = box.w + 'px';
      el.gridPanel.style.height = box.h + 'px';
      el.gridImg.style.width = box.w + 'px';
      el.gridImg.style.height = box.h + 'px';
      el.gridAxes.setAttribute('viewBox', '0 0 ' + G.w + ' ' + G.h);
      el.gridAxes.setAttribute('preserveAspectRatio', 'none');
      el.gridAxes.style.width = box.w + 'px';
      el.gridAxes.style.height = box.h + 'px';
    },

    setDots: function (on) {
      if (!this.dotGroup) return;
      this.dotGroup.classList.toggle('on', !!on);
      // clear any point marked by the previous question, either way
      this.clearFound();
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
        later(function () { L.line.classList.add('draw'); SFX.draw(); }, base + 380);
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
        self.unitLabel.setAttribute('x', vertical
          ? (a.x >= 0 ? px(a.x) - U.labelDy : px(a.x) + U.labelDy)
          : (px(loX) + px(loX + n)) / 2);
        self.unitLabel.setAttribute('y', vertical ? (py(loY) + py(loY + n)) / 2
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
      const a = spec.a, b = spec.b;
      // a screen can recolour the segment — red once it closes a triangle
      this.segLine.setAttribute('stroke', spec.color || SG.lineColor);
      const px = function (v) { return G.originX + v * G.stepX; };
      const py = function (v) { return G.originY - v * G.stepY; };
      const self = this;

      this.segLine.setAttribute('x1', px(a.x)); this.segLine.setAttribute('y1', py(a.y));
      this.segLine.setAttribute('x2', px(b.x)); this.segLine.setAttribute('y2', py(b.y));
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
        part.coord.setAttribute('y', vertical ? Y + SG.vCoordDy : Y + SG.coordDy);
        /* A point can carry its own label — the general case names the
           points (x1, y1) and (x2, y2) rather than their values. */
        part.coord.textContent = p.coordText || ('(' + p.x + ',\u00A0' + p.y + ')');

        part.name.setAttribute('x', vertical ? X + side * SG.coordDx : X);
        part.name.setAttribute('y', vertical ? Y + SG.vNameDy : Y + SG.nameDy);
        part.name.textContent = p.name || '';
      });
    },

    clearSegment: function () {
      this.clearUnits();
      this.clearLegs();
      if (!this.segGroup) return;
      this.segGroup.classList.remove('on');
      this.segLine.classList.remove('draw');
      const self = this;
      ['a', 'b'].forEach(function (k) {
        const p = self.segParts[k];
        p.dot.classList.remove('pop');
        p.coord.classList.remove('pop');
        p.name.classList.remove('pop');
      });
    },

    /* points first, then the line joins them, then the labels */
    runSegment: function (spec, later, done) {
      const self = this;
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
    solve: function (gx, gy) {
      const G = C.GRID, F = G.found;
      const px = G.originX + gx * G.stepX, py = G.originY - gy * G.stepY;
      this.foundDot.setAttribute('cx', px);
      this.foundDot.setAttribute('cy', py);
      this.foundLabel.setAttribute('x', px + F.labelDx);
      this.foundLabel.setAttribute('y', py + F.labelDy);
      this.foundLabel.textContent = '(' + gx + ',\u00A0' + gy + ')';
      if (this.dotGroup) this.dotGroup.classList.remove('on');   // highlighters away
      this.foundGroup.classList.remove('on');
      void this.foundGroup.getBoundingClientRect;
      this.foundGroup.classList.add('on');
    },

    clearFound: function () {
      if (this.foundGroup) this.foundGroup.classList.remove('on');
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
      SFX.magic();
      FX.ring(cx, cy, 420, 'rgba(255,235,150,.95)');
      FX.sparkles(cx, cy, 18, 420);

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

      // numbers only once every line and arrowhead is in
      later(function () {
        self.labels.forEach(function (t, i) {
          later(function () { t.classList.add('pop'); SFX.tick(i); }, i * 46);
        });
      }, 1860);

      later(done, 1860 + this.labels.length * 46 + 320);
    }
  };

  /* ---------------- screen flow ---------------- */
  const Game = {
    index: -1, state: 'start', busy: false, geom: null, task: null, askTimer: null,
    pending: [], entranceCancel: null,

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

    buildDots: function () {
      el.dots.innerHTML = '';
      C.SCRIPT.forEach(function () {
        const d = document.createElement('span');
        d.className = 'dot';
        el.dots.appendChild(d);
      });
    },

    markDots: function (i) {
      Array.prototype.forEach.call(el.dots.children, function (d, n) {
        d.classList.toggle('on', n <= i);
        d.classList.toggle('now', n === i);
      });
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
        FX.confetti(50);
        FX.motes(18);
        self.busy = false;
        self.goTo(0);
      }, 900);
    },

    goTo: function (i) {
      const self = this;
      this.clearPending();
      this.index = i;
      this.state = 'entering';
      this.markDots(i);
      el.nextBtn.classList.remove('ready');

      const entry = C.SCRIPT[i];
      const geom = geomFor(i);
      this.geom = geom;
      standPose = !!geom.stand;
      applyGeom(geom);

      const onBoard = entry.layout === 'grid' || entry.layout === 'board' ||
                      entry.layout === 'recap';
      // the board only exists on its own screens
      if (!onBoard) {
        el.gridPanel.classList.add('hidden');
        el.standSwifty.classList.add('hidden');
        Board.shown = false;
        Board.setDots(false);
      }
      if (entry.layout !== 'board') el.qBanner.classList.add('hidden');
      if (entry.layout !== 'recap') el.formulaBoard.classList.add('hidden');
      if (!entry.segment && !entry.keepSegment) Board.clearSegment();
      if (Dist && !entry.distance) Dist.hide();
      if (Opts && !entry.options) Opts.hide();

      /* What happens once she has arrived: speak her line, hand over
         on its own if the screen has none, or simply wait. */
      /* A screen with a task waits for the player rather than for a
         tap on Next. */
      this.task = entry.task
        ? { target: entry.task.target, spec: entry.task, wrong: 0, done: false }
        : null;

      // a distance task is answered on the slider, so route Check to it
      if (Dist) {
        Dist.onCheck(entry.task && entry.task.kind === 'distance'
          ? function (v) { self.checkDistance(v); }
          : null);
      }
      // a choice task is answered on the options panel
      if (Opts) {
        const choice = entry.task && entry.task.kind === 'choice';
        // each screen brings its own three answers
        if (Array.isArray(entry.options)) Opts.setChoices(entry.options);
        Opts.setAnswer(choice ? entry.task.answer : null);
        Opts.onAnswer(choice ? function (key, right) { self.checkChoice(right); } : null);
      }

      const after = function () {
        if (entry.line && geom.bare) self.ask(entry.line);   // banner, not bubble
        else if (entry.line) self.speak(entry.line);
        else if (entry.auto && i + 1 < C.SCRIPT.length) {
          self.later(function () { self.goTo(i + 1); }, 160);
        } else {
          self.state = 'waiting';
          el.nextBtn.classList.add('ready');
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
        el.standSwifty.classList.add('hidden');
        el.birdWin.classList.add('hidden');
        el.shadow.classList.add('lifted');
        Board.clearSegment();

        Board.place(geom.panelBox || C.GRID.box);
        el.gridPanel.classList.remove('hidden');
        Board.shown = true;
        Board.setDots(!!entry.dots);

        if (entry.layout === 'board') {
          el.qBanner.classList.remove('hidden', 'pop-in');
          void el.qBanner.offsetWidth;
          el.qBanner.classList.add('pop-in');
        } else {
          el.qBanner.classList.add('hidden');
        }

        if (Dist) {
          if (entry.distance) { Dist.reset(); Dist.show(); } else Dist.hide();
        }
        if (Opts) {
          if (entry.options) { Opts.reset(); Opts.show(); } else Opts.hide();
        }

        if (entry.layout === 'recap') {
          el.formulaBoard.classList.remove('hidden');
          // restart the lines so they arrive one at a time
          const inner = el.formulaBoard.children[0];
          Array.prototype.forEach.call(inner.children, function (c) {
            c.style.animation = 'none';
            void c.offsetWidth;
            c.style.animation = '';
          });
        } else {
          el.formulaBoard.classList.add('hidden');
        }
      };

      if (entry.transition === 'leaves') {
        this.state = 'entering';
        SFX.rustle();
        /* Points and lines are drawn before anyone speaks, so the
           child sees what is being talked about. */
        FX.leaves(el.leafLayer, dress, function () { plotThen(arrive); });
        return;
      }

      if (geom.panelBox) Board.place(geom.panelBox);
      else Board.place(C.GRID.box);

      /* Screens 9-11 stay on the board they inherited: no leaves, no
         rebuild — just clear the last segment and plot the next. */
      if (entry.layout === 'board' && entry.transition !== 'leaves') {
        el.gridPanel.classList.remove('hidden');
        el.qBanner.classList.remove('hidden');
        Board.shown = true;
        if (!entry.keepSegment) Board.clearSegment();
        else Board.clearUnits();          // keep the drawing, drop any count-out
        if (Dist && entry.distance) { Dist.reset(); Dist.show(); }
        if (Opts && entry.options) { Opts.reset(); Opts.show(); }
      }

      /* A grid screen builds the board in first — but only if it is
         not already standing from the screen before, so screen 6
         carries straight on from 5 instead of rebuilding it. */
      /* Plot the segment before asking about it, on any screen that
         has one. */
      if (entry.layout === 'grid' && !Board.shown) {
        Board.run(this.later.bind(this), function () {
          Board.setDots(!!entry.dots);
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
        FX.puff(C.ANCHOR.x - 10, C.ANCHOR.y + C.FEET_DY);
        FX.sparkles(C.ANCHOR.x, C.ANCHOR.y - 120 * C.CHAR_SCALE, 12, 190 * C.CHAR_SCALE);
        SFX.sparkle();
        self.later(done, 320);
      };
      this.entranceCancel = groundHer;
      el.birdRig.addEventListener('animationend', onEnd);
    },

    /* Screen 4: she flies back out the way she came in, off to the
       left, and the screen hands over once she is gone. */
    flyOut: function (done) {
      const self = this;
      el.birdWin.classList.remove('hidden');
      el.standSwifty.classList.add('hidden');
      Sprite.play('fly', true);
      el.birdRig.classList.remove('fly-in', 'hop', 'pre-entrance');
      void el.birdRig.offsetWidth;
      el.birdRig.classList.add('fly-out');
      el.birdFlip.classList.remove('turn');
      void el.birdFlip.offsetWidth;
      el.birdFlip.classList.add('turn');    // she faces the way she is going
      el.shadow.classList.add('lifted');
      FX.puff(C.ANCHOR.x - 10, C.ANCHOR.y + C.FEET_DY);
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

    speak: function (line) {
      const self = this;
      this.state = 'speaking';
      FX.sparkles(C.ANCHOR.x, C.ANCHOR.y - 200 * C.CHAR_SCALE, 7, 170 * C.CHAR_SCALE);
      Bubble.open(line, function () {
        self.state = 'waiting';
        el.nextBtn.classList.add('ready');    // gentle nudge once she is done
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

      let n = 0, since = 0;
      const timer = setInterval(function () {
        if (n >= text.length) {
          clearInterval(timer);
          self.askTimer = null;
          SFX.duck(false);
          SFX.chime();
          self.state = 'waiting';
          el.nextBtn.classList.add('ready');
          return;
        }
        const ch = text[n++];
        el.qBannerLine.textContent = text.slice(0, n);
        if (ch !== ' ' && ++since >= 2) { since = 0; SFX.chirp(1); }
      }, 42);
      this.askTimer = timer;
      this.pending.push(timer);
    },

    /* The Check button on the distance panel. */
    checkDistance: function (v) {
      const t = this.task;
      if (!t || t.done) return;
      const self = this;
      const sg = C.SCRIPT[this.index] && C.SCRIPT[this.index].segment;

      /* Measured from the two points rather than typed into config, so
         a moved point can never leave a stale answer behind. Only
         axis-aligned segments are asked about, so one term is zero. */
      const entry = C.SCRIPT[this.index] || {};
      /* Measured from whichever pair the question is about: a named
         leg, or the segment itself. */
      let from = sg ? sg.a : null, to = sg ? sg.b : null;
      if (t.spec.measureLeg != null && entry.legs && entry.legs[t.spec.measureLeg]) {
        const L = entry.legs[t.spec.measureLeg];
        from = L.from; to = L.to;
      }
      const answer = t.spec.answer != null ? t.spec.answer
        : (from && to ? Math.abs(to.x - from.x) + Math.abs(to.y - from.y) : null);

      if (v === answer) {
        t.done = true;
        this.state = 'waiting';
        SFX.correct();
        this.later(function () {
          SFX.cheer();
          FX.confetti(26);
          self.ask(t.spec.correctLine);
        }, 260);
        return;
      }

      /* Wrong: rather than just saying no, count the segment out in
         unit squares so the answer is visible, then hand the slider
         back so they can try again. */
      t.wrong++;
      SFX.wrong();
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
          FX.confetti(26);
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
            el.nextBtn.classList.add('ready');
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
        FX.confetti(26);                         // enough to read as a shower, not a mess
        (self.geom && self.geom.bare ? self.ask : self.speak).call(self, t.spec.correctLine);
      }, 260);
    },

    answerWrong: function (node) {
      const t = this.task;
      t.wrong++;
      SFX.wrong();
      Board.reject(node);

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

  /* ---------------- boot ---------------- */
  function boot() {
    FX.init(el.fxLayer);
    FX.clouds(el.skyLayer);
    fitStage();
    Sprite.setup();     // must precede layout(): layout seats the rig
    layout();
    Game.buildDots();
    bind();
    requestAnimationFrame(loop);

    preload(function () {
      el.loader.classList.add('fade-out');
      setTimeout(function () { el.loader.classList.add('hidden'); }, 500);
      el.startScreen.classList.remove('hidden');
      el.playBtn.classList.add('idle');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* =============================================================
   Distance Formula — configuration & measured sprite geometry
   Stage is a fixed 1920 x 1080 (16:9) design space; everything
   below is expressed in those design pixels.
   ============================================================= */
window.CFG = (function () {
  'use strict';

  /* ---------- Stage ---------- */
  const STAGE_W = 1920;
  const STAGE_H = 1080;

  /* ---------- Asset paths ---------- */
  const ART = {
    startScreen: 'assets/start screen.png',
    background:  'assets/Background game.png',
    clouds:      'assets/clouds.png',
    playButton:  'assets/play button .png',
    dialogue:    'assets/dialouge box.png',
    swiftyFly:   'assets/swifty fly.png',
    swiftyTalk:  'assets/swifty talk.png',
    swiftyStand: 'assets/normal stand swifty.png',
    gridPanel:   'assets/grid lines panel.png',
    questionBar: 'assets/question template.png'
  };
  const MUSIC = 'sfx/bg music.mp3';

  /* -------------------------------------------------------------
     SPRITE SHEETS
     Both sheets are 1448 x 1086 holding 8 poses in a 4 x 2 grid.
     The nominal 362 x 543 cells are NOT usable directly: several
     flying poses bleed past their cell edge, and the two rows sit
     at different heights, so naive cell slicing clips wings and
     makes the bird jump vertically at the row change.

     `rect`   = exact opaque bounds of each pose, measured from the
                alpha channel.
     `anchor` = centroid of the yellow belly, in sheet coordinates.
                The belly is rigidly attached to the body and barely
                moves while the wings flap, so pinning it to a fixed
                point keeps every pose registered to the same spot.
     ------------------------------------------------------------- */
  const SHEETS = {
    fly: {
      src: ART.swiftyFly,
      fps: 14,
      frames: [
        { x:   27, y: 156, w: 334, h: 314, ax:  198.5, ay: 398.0 },
        { x:  392, y: 155, w: 338, h: 315, ax:  570.6, ay: 396.9 },
        { x:  746, y: 169, w: 358, h: 306, ax:  933.5, ay: 406.9 },
        { x: 1119, y: 169, w: 310, h: 309, ax: 1294.0, ay: 406.7 },
        { x:   24, y: 627, w: 351, h: 313, ax:  208.5, ay: 868.0 },
        { x:  396, y: 631, w: 335, h: 300, ax:  574.2, ay: 864.3 },
        { x:  751, y: 619, w: 332, h: 311, ax:  924.4, ay: 858.9 },
        { x: 1109, y: 627, w: 323, h: 306, ax: 1283.7, ay: 864.7 }
      ]
    },
    talk: {
      src: ART.swiftyTalk,
      fps: 10,
      frames: [
        { x:   25, y: 131, w: 329, h: 355, ax:  195.1, ay: 398.6 },
        { x:  378, y: 126, w: 334, h: 360, ax:  548.6, ay: 397.5 },
        { x:  737, y: 130, w: 334, h: 356, ax:  908.1, ay: 398.2 },
        { x: 1096, y: 127, w: 330, h: 359, ax: 1267.7, ay: 397.8 },
        { x:   20, y: 623, w: 336, h: 353, ax:  196.3, ay: 888.7 },
        { x:  379, y: 617, w: 334, h: 360, ax:  547.5, ay: 886.4 },
        { x:  738, y: 623, w: 335, h: 353, ax:  909.8, ay: 888.1 },
        { x: 1097, y: 620, w: 335, h: 357, ax: 1269.4, ay: 888.6 }
      ]
    }
  };
  const SHEET_W = 1448, SHEET_H = 1086;

  /* -------------------------------------------------------------
     SWIFTY PLACEMENT
     ------------------------------------------------------------- */

  // Reference pose the placement is measured against: the standing /
  // talking pose, 329 x 355 of opaque pixels.
  const REF = SHEETS.talk.frames[0];
  // Belly anchor relative to that pose's top-left corner.
  const REF_AX = REF.ax - REF.x;   // 170.1
  const REF_AY = REF.ay - REF.y;   // 267.6

  /* Swifty's placement on the 1920 x 1080 background.

     The artwork's aspect ratio is fixed (the standing pose is 329 x 355
     opaque pixels), so ONE number drives her whole size: `height`. The
     width follows from it, and she is never squashed. The brief's
     398 x 307 box could not be met on both axes for that reason; this
     is that box tuned down to the size asked for.

     Everything else — the belly anchor, the head the bubble tail lands
     on, where landing dust falls — is derived from these three values,
     so changing `height` or the centre moves the whole rig together. */
  const SWIFTY = {
    cx: 960,       // centred horizontally on the background
    cy: 600,       // a little below centre, so she stands down on the grass
    height: 240    // rendered height in stage px (width follows at 222)
  };

  const CHAR_SCALE = SWIFTY.height / REF.h;

  // Stage position the belly anchor is pinned to.
  const ANCHOR = {
    x: SWIFTY.cx - (REF.w * CHAR_SCALE) / 2 + REF_AX * CHAR_SCALE,
    y: SWIFTY.cy - (REF.h * CHAR_SCALE) / 2 + REF_AY * CHAR_SCALE
  };

  /* Anchor -> ground contact, so landing dust lands under her feet
     whatever scale she is drawn at. */
  const FEET_DY = (REF.h - REF_AY) * CHAR_SCALE;

  /* Ground shadow under her feet. Sized as a fraction of her rendered
     width, so it tracks `SWIFTY.height` automatically. */
  const SHADOW = {
    widthRatio: 0.88,   // of her rendered width
    heightRatio: 0.23,  // of the shadow's own width
    dy: -5              // nudge up so her feet sit ON it, not above it
  };

  /* Top of Swifty's head (the crest tuft), measured as an offset
     from the belly anchor, averaged over the eight talking poses.
     This is what the speech-bubble tail has to reach. */
  const HEAD_TOP = {
    dx: -28.9 * CHAR_SCALE,
    dy: -268.4 * CHAR_SCALE
  };

  /* -------------------------------------------------------------
     SPEECH BUBBLE
     Source is 494 x 247. Ink occupies x[6..487] y[31..234], and the
     tail narrows to a tip at (265, 234). Offsets below are relative
     to the ink box so the art's transparent padding never matters.
     ------------------------------------------------------------- */
  const BUBBLE = {
    src: ART.dialogue,
    srcW: 494, srcH: 247,
    ink: { x: 6, y: 31, w: 482, h: 204 },
    tip: { x: 259, y: 203 },       // tail tip, relative to the ink box
    scale: 1.0,
    // Text plate inside the bubble, as a fraction of the ink box.
    text: { left: 0.06, top: 0.11, width: 0.88, height: 0.55 },
    // How far the tail tip sinks into the head so it visibly touches
    // it rather than hovering above it.
    biteIntoHead: 10
  };

  /* -------------------------------------------------------------
     PLAY BUTTON
     Brief: Position X = 1010, Y = 659 / Dimensions W = 281, H = 267.
     Read as the centre of a 281 x 267 box — which lands the button
     in the clear grass between Swifty and the chalkboard on the
     start screen. Source is 1285 x 1224 with the glowing disc
     occupying x[70..1204] y[58..1175]; the disc is fitted to the box.
     ------------------------------------------------------------- */
  const PLAY = {
    src: ART.playButton,
    srcW: 1285, srcH: 1224,
    ink: { x: 70, y: 58, w: 1135, h: 1118 },
    box: { cx: 950, cy: 659, w: 281, h: 267 },
    // Shrinks the briefed box about its centre — the button stays put,
    // it just gets smaller. 1 = the full 281 x 267 from the brief.
    sizeScale: 0.70
  };

  /* -------------------------------------------------------------
     CLOUDS
     clouds.png is not a sky layer — it is one cloud drawn inside a
     1920 x 1080 transparent canvas, its ink sitting at
     x[545..1396] y[257..737]. Tiling the whole file parks that cloud
     on the grass, so the sprite is cropped out and re-used instead.
     ------------------------------------------------------------- */
  const CLOUD = {
    src: ART.clouds,
    srcW: 1920, srcH: 1080,
    ink: { x: 545, y: 257, w: 852, h: 481 },
    /* Two small clouds only, at full opacity, looping across the sky.
       `top` is the cloud's top edge and `phase` is how far through its
       loop it starts, so the pair never travels in lockstep. Both sit
       well above the horizon (~640) so nothing drifts behind Swifty. */
    instances: [
      { scale: 0.34, top: 96,  speed: 20, opacity: 1, phase: 0.30 },
      { scale: 0.26, top: 212, speed: 14, opacity: 1, phase: 0.65 }
    ]
  };

  /* -------------------------------------------------------------
     SCREEN 5 — grid panel + standing Swifty

     The brief's numbers are absolute Figma canvas coordinates, and
     both assets are supplied at exactly their briefed size (the panel
     is 1299 x 896, the standing pose 398 x 307), so these are 1:1
     top-left placements rather than scaled boxes.

     Solving both elements against a 1920 x 1080 frame pins the
     artboard origin to x = 197 — the same x the game background was
     given — and y = 1114, which centres the panel vertically.
     ------------------------------------------------------------- */
  const S5_ORIGIN = { x: 197, y: 1114 };
  const place = function (fx, fy) {
    return { x: fx - S5_ORIGIN.x, y: fy - S5_ORIGIN.y };
  };

  const GRID = {
    src: ART.gridPanel,
    w: 1507, h: 1044,               // native art size, and the SVG viewBox

    /* The updated board is bigger than the frame allows, so it is
       fitted into the footprint the old one occupied — same place,
       same size on screen. */
    box: { x: 593, y: 92, w: 1299, h: 896 },

    /* Axis geometry in panel-local pixels, measured off the drawn
       grid. The artwork is 22 x 14 cells at ~61px: 23 vertical lines
       (67..1413) and 15 horizontal (64..924). Both axes carry the
       same range and each line spans exactly that range, so neither
       reaches past the grid. */
    originX: 740, originY: 494,
    stepX: 61.1818, stepY: 61.4286,

    /* The board is far wider than it is tall, so x reaches further
       than y. ±9 is the limit: the line, its arrowheads and the `x`
       label all still sit inside the drawn grid, where ±10 would push
       the label off the board. Cells are square (61.18 x 61.43), so a
       unit is the same length on both axes. */
    xFrom: -9, xTo: 9,
    yFrom: -6, yTo: 6,

    ink: '#213258',                 // axes, arrowheads and numbers
    axisWidth: 7,

    /* How far each axis runs past its last number before the
       arrowhead. Sized to the tighter axis: there is only one spare
       row (61px) above +6 and below -6, against five spare columns
       either side of x, so 40 keeps all four tips inside the drawn
       grid and all four arms the same length. */
    overshoot: 40,
    arrow: { len: 34, halfW: 20 },
    labelSize: 32,
    labelGap: 22,                   // number offset from its axis
    zeroGap: 18,                    // 0 sits closer in, clear of -1

    /* Axis names. `x` sits beyond the positive x arrow; `y` sits
       beside its arrow rather than above it — there are only 21px
       between that tip and the top of the grid. */
    axisName: { size: 38, gap: 42, rise: 38, yDrop: 14 },

    /* Screen 6: a marker on every gridline intersection across the
       numbered range — 13 x 13 = 169 of them. Faint light blue so
       they read as places you could tap rather than as answers, with
       a white ring keeping each legible where it crosses a navy axis.
       They brighten and grow under the cursor. */
    dot: {
      r: 8,
      fill: '#6FC0E8',      // soft light blue, held faint by the pulse opacity
      stroke: '#FFFFFF',
      strokeWidth: 2,
      rippleMs: 60,         // per-ring delay, so the pulse travels outward
      skipOnAxes: true,     // no marker where a point would sit on an axis
      // markers cover every numbered intersection on both axes
      xFrom: -9, xTo: 9,
      yFrom: -6, yTo: 6
    },

    /* A plotted segment: two named points joined by a line, each
       labelled with its coordinates above and its letter below. */
    segment: {
      dotR: 15,
      dotFill: '#3B7DD8',
      dotStroke: '#FFFFFF',
      dotStrokeW: 3,
      lineColor: '#213258',
      lineWidth: 6,
      coordSize: 34,
      nameSize: 40,
      /* A horizontal segment carries its labels above and below the
         points. A vertical one cannot — the two points sit one above
         the other and the labels would run into each other — so it
         puts them to either side instead. */
      coordDy: -42,       // horizontal: coordinates above
      nameDy: 46,         // horizontal: letter below
      /* Vertical: both labels go to whichever side faces away from the
         y-axis, or they land on the axis numbers. Stacked slightly so
         the two points' labels stay apart even 2 units in. */
      coordDx: 84,
      vCoordDy: -26,
      vNameDy: 32
    },

    /* A leg dropped from the segment: the extra corner point and the
       coloured line joining it, used to break a diagonal into a
       horizontal and a vertical step. */
    leg: {
      color: '#B3261E',
      width: 7,
      dotR: 11,
      coordDx: 84,        // coordinates to the right of the corner
      nameDy: 46,         // letter below it
      slots: 2,           // a right-angled path needs two
      lenSize: 32,        // "4 units" written along a leg
      lenGap: 38          // its offset from the line
    },

    /* Unit squares that count out a segment's length when a child
       gets the distance wrong. Filled strongly enough to be obvious
       against the cream board, with a brighter flash as each lands. */
    unitBox: {
      fill: '#8FC2F0',
      stroke: '#2E6FD0',
      strokeW: 3,
      flash: '#FFD747',
      stepMs: 380,           // pause between squares, so they can be counted
      /* The total sits inside the shaded band rather than above the
         line: above, it collides with the two coordinate labels, and
         would collide worse on a shorter segment. Inside, it also ties
         the number directly to the squares being counted. */
      labelSize: 32,
      labelDy: 31,           // half a cell below the line = band centre
      max: 18                // widest span the board allows (-9 to 9)
    },

    /* The marker left behind once a point has been found, with its
       coordinates written beside it. */
    found: {
      r: 15,
      fill: '#35B94B',
      stroke: '#FFFFFF',
      strokeWidth: 3.5,
      labelSize: 34,
      labelDx: 46,          // label offset from the point
      labelDy: -42
    }
  };

  /* Standing pose used once she has landed on screen 5. */
  const STAND = {
    src: ART.swiftyStand,
    w: 398, h: 307,
    pos: place(241, 1761),          // -> 44, 647
    headTop: { x: 206, y: 3 },      // crest tuft, sprite-local
    belly:   { x: 223, y: 228.4 },  // matches the sheet's belly anchor
    feet:    { y: 300, cx: 208 },
    inkW: 335
  };

  /* -------------------------------------------------------------
     SCREEN 8 — board on its own, question in a banner

     Brief: grid panel (850, 2422) 1239 x 856, question banner
     (666, 2256) 1023 x 158, distance panel (219, 2646) 610 x 407.

     Three elements pin the artboard origin to (194, 2227) — the only
     value that fits all of them in a 1920 x 1080 frame and leaves
     symmetric margins (25px left and right, 29px top and bottom).
     It lands the grid on the right, the banner across the top and the
     distance panel on the left, as briefed.
     ------------------------------------------------------------- */
  const S8_ORIGIN = { x: 194, y: 2227 };
  const place8 = function (fx, fy) {
    return { x: fx - S8_ORIGIN.x, y: fy - S8_ORIGIN.y };
  };

  const BOARD = {
    // the same grid art, re-seated and a little smaller
    panel: { pos: place8(850, 2422), w: 1239, h: 856 },

    /* Swifty has left, so the question moves out of her speech bubble
       and into the banner. Its cream interior runs x[41..981]
       y[32..127]; the bird sits at x[121..204] and sparkles at both
       ends, so the text plate clears them. */
    banner: {
      src: ART.questionBar,
      pos: place8(666, 2256), w: 1023, h: 158,
      text: { left: 0.22, top: 0.20, width: 0.65, height: 0.60 },
      size: 42
    },

    // the distance selector, mounted as its own component
    distance: { pos: place8(219, 2646), w: 610, h: 407 },

    /* The triangle-type answer panel takes the slider's place, centred
       on the same footprint so the left column stays put. */
    options: { pos: { x: 70, y: 398 }, w: 520 }
  };

  /* ---------- Audio ---------- */
  const AUDIO = {
    musicSrc: MUSIC,
    musicVolume: 0.20,   // brief: background music at 20%
    musicDucked: 0.055,  // dipped while Swifty is speaking
    sfxVolume: 0.85,
    duckDown: 0.22,      // seconds
    duckUp: 0.65
  };

  /* -------------------------------------------------------------
     SCRIPT — one entry per screen
     ------------------------------------------------------------- */
  /* `entrance` — how Swifty arrives on each screen:
       'fly'  she flies in from off-stage on the fly sheet, then lands
       'stay' she is already standing; only the bubble changes
       'hop'  a short flap-and-hop in place (uses the fly sheet)
     She flies in on screen 1 only; 2 and 3 are talking only. */
  const SCRIPT = [
    { id: 1, line: 'Hey there!',                                         entrance: 'fly'  },
    { id: 2, line: 'Ready to explore distance on the coordinate plane?', entrance: 'stay' },
    { id: 3, line: 'Let’s start with something familiar.',               entrance: 'stay' },

    // 4 — no dialogue: she simply flies back out the way she came in,
    //     then the screen hands over on its own.
    { id: 4, line: null, entrance: 'flyOut', auto: true },

    // 5 — no dialogue: the grid builds itself in and she flies back in
    //     and lands on the left. The question comes on screen 6.
    { id: 5, line: null, entrance: 'fly',
      layout: 'grid', bubbleScale: 0.9 },

    /* 6 — the highlighters come up and the board goes live: tap the
       point she asked for. Two wrong taps and she shows the answer
       herself. */
    { id: 6, line: 'Locate the point (2, 1).', entrance: 'stay',
      layout: 'grid', dots: true, bubbleScale: 0.9,
      task: {
        target: { x: 2, y: 1 },
        maxWrong: 2,
        correctLine: 'Correct!',
        tryAgainLine: 'Not quite — try again!',
        revealLine: 'Here it is — (2, 1).'
      } },

    // 7 — same again with a new point.
    { id: 7, line: 'Locate the point (6, 1).', entrance: 'stay',
      layout: 'grid', dots: true, bubbleScale: 0.9,
      task: {
        target: { x: 6, y: 1 },
        maxWrong: 2,
        correctLine: 'Correct!',
        tryAgainLine: 'Not quite — try again!',
        revealLine: 'Here it is — (6, 1).'
      } },

    /* 8 — leaves sweep the screen; behind them Swifty leaves, the
       board re-seats itself and the empty banner drops in. No
       question and nothing to locate yet. */
    { id: 8, line: 'How far apart are A and B?', entrance: 'none',
      layout: 'board', transition: 'leaves', distance: true,

      // plotted first, then the question is asked
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 1, name: 'B' } },

      /* `answer` is left out on purpose: the game measures it from the
         two points, so moving a point can never leave a stale answer
         behind. Set it explicitly only to override that. */
      task: {
        kind: 'distance',       // answered on the slider, not by tapping
        correctLine: 'Correct!',
        // a wrong answer counts the units out on the board instead of
        // just saying no, then hands the slider back
        showLine: 'Let’s count the units.',
        tryAgainLine: 'Now try again!'
      } },

    /* 9-11 — three more of the same, staying on the board. Two of them
       are vertical segments, so the count-out stacks its squares
       beside the line instead of hanging them beneath it. */
    { id: 9, line: 'How far apart are A and B?', entrance: 'none', layout: 'board',
      distance: true,
      segment: { a: { x: 4, y: 3, name: 'A' }, b: { x: -3, y: 3, name: 'B' } },
      task: { kind: 'distance', correctLine: 'Correct!',
              showLine: 'Let’s count the units.', tryAgainLine: 'Now try again!' } },

    { id: 10, line: 'How far apart are A and B?', entrance: 'none', layout: 'board',
      distance: true,
      segment: { a: { x: 1, y: 2, name: 'A' }, b: { x: 1, y: -3, name: 'B' } },
      task: { kind: 'distance', correctLine: 'Correct!',
              showLine: 'Let’s count the units.', tryAgainLine: 'Now try again!' } },

    { id: 11, line: 'How far apart are A and B?', entrance: 'none', layout: 'board',
      distance: true,
      segment: { a: { x: -2, y: 3, name: 'A' }, b: { x: -2, y: 1, name: 'B' } },
      task: { kind: 'distance', correctLine: 'Correct!',
              showLine: 'Let’s count the units.', tryAgainLine: 'Now try again!' } },

    /* 12 — leaves sweep again and the scene goes back to the field
       layout of screen 5: board on the right, Swifty standing on the
       left, no banner and no slider. The segment is diagonal this
       time, so counting whole squares no longer works — which is the
       point she is about to make. */
    { id: 12, line: 'This one’s different.', entrance: 'fly',
      layout: 'grid', transition: 'leaves', bubbleScale: 0.9,
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B' } } },

    // 13 — same board and same segment, she just carries on talking
    { id: 13, line: 'Can the grid help?', entrance: 'stay',
      layout: 'grid', bubbleScale: 0.9, keepSegment: true },

    /* 14 — leaves again, back to the board layout with the slider.
       The diagonal is redrawn and a corner C is dropped from it, so
       the horizontal step A-C can be measured on its own. The answer
       is that leg, not the diagonal, so the task measures from it. */
    { id: 14, line: 'How far apart are A and C?', entrance: 'none',
      layout: 'board', transition: 'leaves', distance: true,
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B' } },
      legs: [ { from: { x: 2, y: 1 }, to: { x: 6, y: 1 }, mark: { name: 'C' } } ],
      task: {
        kind: 'distance',
        measureLeg: 0,        // A to C, not A to B
        correctLine: 'Correct!',
        // no count-out here: a nudge to look at the spaces instead
        tryAgainLine: 'Not quite! Check the spaces between the units.'
      } },

    /* 15 — the board is kept exactly as it was. The first leg is
       already drawn, so it only gains its length, and the second leg
       rises from the corner to B. */
    { id: 15, line: 'How far apart are C and B?', entrance: 'none',
      layout: 'board', distance: true, keepSegment: true,
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B' } },
      legs: [
        { from: { x: 2, y: 1 }, to: { x: 6, y: 1 }, mark: { name: 'C' },
          settled: true, length: true },
        { from: { x: 6, y: 1 }, to: { x: 6, y: 4 } }
      ],
      task: {
        kind: 'distance',
        measureLeg: 1,        // C to B
        correctLine: 'Correct!',
        tryAgainLine: 'Not quite! Check the spaces between the units.'
      } },

    /* 16 — leaves, then the whole shape redrawn as one closed red
       triangle with both legs measured. Nothing to answer here, so no
       slider: she is just naming what they have built. */
    { id: 16, line: 'Look! We made a triangle.', entrance: 'none',
      layout: 'board', transition: 'leaves',
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B' },
                 color: '#B3261E' },
      legs: [
        { from: { x: 2, y: 1 }, to: { x: 6, y: 1 }, mark: { name: 'C' }, length: true },
        { from: { x: 6, y: 1 }, to: { x: 6, y: 4 }, length: true }
      ] },

    /* 17 — same triangle, now named. The slider is replaced by the
       three triangle types; the square corner at C makes it a
       right-angled triangle. */
    { id: 17, line: 'What kind of triangle is it?', entrance: 'none',
      layout: 'board', keepSegment: true,
      options: [
        { key: 'scalene',      cls: 'scalene',      label: 'Scalene Triangle' },
        { key: 'isosceles',    cls: 'isosceles',    label: 'Isosceles Triangle' },
        { key: 'right-angled', cls: 'right-angled', label: 'Right-angled Triangle' }
      ],
      task: {
        kind: 'choice',
        answer: 'right-angled',
        correctLine: 'Correct!',
        tryAgainLine: 'Not quite — try again!'
      } },

    /* 18 — same triangle again, now asking how to reach the third
       side. Same panel, different three answers. */
    { id: 18, line: 'We know two sides. How can we find the third?',
      entrance: 'none', layout: 'board', keepSegment: true,
      options: [
        { key: 'area',       label: 'Area' },
        { key: 'perimeter',  label: 'Perimeter' },
        { key: 'pythagoras', label: 'Pythagoras' }
      ],
      task: {
        kind: 'choice',
        answer: 'pythagoras',
        correctLine: 'That’s right!',
        /* Each wrong attempt gets the next hint; once they run out the
           working is shown rather than leaving a child guessing. */
        feedback: [
          'Not quite. Check your working and try again.',
          'Use the right triangle to find AB.'
        ],
        /* Shown on a correct answer, or after the hints are spent. */
        formula: [
          { kind: 'lead',   text: 'AB² = 4² + 3²' },
          { kind: 'step',   text: '= 16 + 9' },
          { kind: 'step',   text: '= 25' },
          { kind: 'result', text: 'AB = 5 units' }
        ]
      } },

    /* 19 — leaves, back to the field layout, and the same idea stated
       in general: the points are named rather than numbered. */
    { id: 19, line: 'The same idea works for any two points.', entrance: 'fly',
      layout: 'grid', transition: 'leaves', bubbleScale: 0.9,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)' },
        color: '#B3261E'
      } },

    /* 20 — the same general segment, with the corner dropped and both
       legs drawn: the right-angled triangle in its general form. The
       corner is named from the two points' own coordinates. */
    { id: 20, line: null, entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)' },
        color: '#B3261E'
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' } },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 } }
      ] },

    /* 21 — the horizontal leg is named. Nothing is redrawn; it only
       gains its length, written as the difference rather than a
       count of units. */
    { id: 21, line: 'AC = x2 - x1', entrance: 'stay',
      layout: 'grid', keepSegment: true, bubbleScale: 0.9,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)' },
        color: '#B3261E'
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x2 - x1' },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 }, settled: true }
      ] }
  ];

  return {
    STAGE_W, STAGE_H, ART, SHEETS, SHEET_W, SHEET_H,
    SWIFTY, CHAR_SCALE, ANCHOR, HEAD_TOP, FEET_DY, SHADOW, CLOUD,
    S5_ORIGIN, GRID, STAND, S8_ORIGIN, BOARD,
    BUBBLE, PLAY, AUDIO, SCRIPT
  };
})();

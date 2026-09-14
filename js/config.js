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
    startScreen: 'assets/image 15.png',
    background:  'assets/game Background .png',
    clouds:      'assets/clouds.png',
    playButton:  'assets/play button .png',
    swiftyFly:   'assets/swifty fly.png',
    swiftyTalk:  'assets/swifty talk.png',
    swiftyStand: 'assets/normal stand swifty.png',
    leaf:        'assets/leaf.png',
    handNudge:   'hand nudge.png'
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
  /* Swifty's speech bubble, drawn in CSS. The box positioned on screen
     is the ink rectangle; the tail's tip sits at `tip` inside it, and
     applyGeom() drives that point onto the top of her head so the two
     touch instead of the bubble floating above her.

     The body fills the box down to `bodyH`; the tail runs from there to
     the tip. The frame is built from inset rings, the same way the
     board's is, so the bubble reads as part of the same autumn set. */
  /* Swifty's speech bubble, drawn in CSS. The box positioned on screen
     is the ink rectangle; the tail's point sits at `tip` inside it, and
     applyGeom() drives that point onto the top of her head so the two
     touch instead of the bubble floating above her.

     The body fills the box down to `bodyH`; the tail hangs from there
     to the point. Both carry the same three-band frame at the same
     total thickness, which is what lets them meet at the mouth without
     a step — the thing that goes wrong if the tail is given a lighter
     edge than the balloon. */
  const BUBBLE = {
    ink: { w: 620, h: 221 },
    tip: { x: 172, y: 220 },      // 27.7% across, on the lower left
    scale: 1,
    biteIntoHead: 10,             // how far the point sinks into her crown

    bodyH: 156,                   // the balloon; the 64 below it is tail
    radius: 48,
    tailTip: 10,                  // rounding on the point

    /* Cumulative insets, measured from the outside in: a dark rim, the
       orange body of the frame, then a golden inner band before the
       cream. The tail repeats them at the same widths.

       The rim is both darker and wider than the rest of the autumn set
       needs: the bubble floats on open sky, which is very light and
       very warm, so a thin mid-orange edge disappeared into it. */
    /* One stroke. The three cumulative insets are kept as the mechanism
       — the balloon and the tail are both built from them — but set to
       the same width and colour, so what is drawn is a single line
       rather than a dark rim, an orange band and a golden one. */
    edgeW: 5, midW: 5, goldW: 5,

    fill:   '#FFF8E8',
    edge:   '#C07A17',
    mid:    '#C07A17',
    gold:   '#C07A17',
    ink_:   '#173A72',            // the text
    size:   32,                   // the size every line is set at

    leaf: 62,                     // the corner decorations

    /* The text plate, as fractions of the ink box: x 45..575, y 25..131.

       The inset is the bubble's padding, and it has to live here rather
       than as slack inside the plate, because fitType() grows the type
       until the line just fills the plate — any room left spare there is
       room it will spend. Two lines at the size it settles on therefore
       sit 14px clear of the golden band, not flush against it.

       The plate is 106 tall and not the 104 two lines exactly need:
       landing on the tie makes the fitted size turn on sub-pixel
       rounding, so one screen could take 40px and the next 38px for no
       visible reason. */
    text: { left: 0.073, top: 0.113122, width: 0.855, height: 0.479638 }
  };
;
;

  /* -------------------------------------------------------------
     START SCREEN
     She flies in and perches on the rock at the lower left before the
     Play button is offered — the title shot, so she is the subject of
     it rather than a presenter, and is drawn well above her in-game
     size.

     feetY is where the bottom of her toes lands, and it is 12px below
     the rock's painted top edge (which runs y 873..888 under her, the
     crown being domed rather than flat). Sitting her exactly on that
     edge left both feet hovering 7-10px clear, because only her very
     toe tips reach the bottom of the sprite box — the sole reads about
     14px higher. Sinking her instead puts weight on the rock. */
  const START = {
    height: 400,                    // against SWIFTY.height of 240 in game
    perch: { cx: 365, feetY: 892 },
    flyMs: 2600,                    // a title screen can afford a long arc
    buttonDelay: 420                // beat between her settling and Play
  };
  /* Derived exactly the way ANCHOR is, so the same belly-anchor rule
     seats her here: the rig origin is the anchor, and her feet fall
     FEET_DY below it at this scale. */
  START.scale = START.height / REF.h;
  START.anchor = {
    x: START.perch.cx - (REF.w * START.scale) / 2 + REF_AX * START.scale,
    y: START.perch.feetY - (REF.h - REF_AY) * START.scale
  };
  // A contact shadow on the rock's crown, narrower than the grass one:
  // the crown is only about 90px across at the top.
  START.shadow = { w: 196, h: 40 };

  /* The title screen's weather, livelier than the game's: there is
     nothing here anyone has to read, so leaves overlap instead of
     queueing and the wind itself is visible.

     This art's tree is wider than the game's — its foliage reaches
     x 648 at y 120 and x 516 at y 160 — so leaves lift off further
     right and still read as leaving the canopy. */
  START.drift = {
    solo: false,                  // several on the wing at once
    rustleOnLift: true,           // heard leaving the tree, not just drifting
    dur: 11000,
    gapMin: 2800, gapMax: 5400,
    firstDelay: 500,
    lines: 4,
    fromX: 340,
    y0: [110, 250],
    /* The loop is held left of and below the wordmark (x 796..1667,
       y 211..643) so no leaf ever circles over the type, and they
       leave the frame beneath it rather than across it. */
    loopX: [520, 780], loopY: [450, 600], loopR: [60, 120],
    endY: [680, 860],
    size: [46, 88]
  };
  START.wind = {
    gustLines: [4, 7], gustMs: [2000, 3300],
    /* Two bands, high sky and low over the lake, chosen so no streak
       ever crosses the wordmark (y 211..643). A leaf blowing past the
       type reads as a leaf; a straight 3px line reads as a scratch on
       it. The leaves carry the wind through the middle instead. */
    gustBands: [[110, 200], [655, 800]],
    gapMin: 2600, gapMax: 5600, firstDelay: 600
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
    /* Centred under the title on the start art, which sits at
       x 796..1667, y 211..643 on the stage.

       cx is the centre of the lettering, not of that box: the logo
       carries decorative leaves off its top and bottom right, and
       centring on the full outline hangs the button 10px right of the
       words. Measured off each word's own fill instead — "Formula"'s
       white gives 1219, "Distance"'s yellow 1223.

       The art was replaced with a larger logo, but its baseline landed
       within a pixel of the old one, so cy is unchanged. At sizeScale
       the disc renders 197 x 187 and spans y 683..870 — about 40px
       clear of the type. */
    box: { cx: 1221, cy: 776, w: 281, h: 267 },
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
    srcW: 2048, srcH: 768,
    /* The opaque part of the artwork, measured off its alpha: the file
       carries a wide transparent margin, and the drift is positioned
       by the cloud itself rather than by the picture around it. */
    ink: { x: 68, y: 64, w: 1881, h: 621 },
    /* Two small clouds only, at full opacity, looping across the sky.
       `top` is the cloud's top edge and `phase` is how far through its
       loop it starts, so the pair never travels in lockstep. Both sit
       well above the horizon (~640) so nothing drifts behind Swifty. */
    /* Measured off the background across the rows the clouds occupy:
       between the tree that fills the top left corner and the one on
       the right, the sky is unbroken from x 424 to x 1771. A cloud
       stays wholly inside that, drifting to one end and back again
       rather than crossing the frame, so it never touches a tree at
       any opacity — the sky is the only place it is ever seen. */
    band: { x0: 440, x1: 1760 },

    /* Deliberately barely-moving. This is scenery behind a lesson, so
       it has to read as alive without ever pulling the eye off the
       board: at these speeds a cloud shifts about a finger's width in
       half a minute, which is under the threshold that catches
       attention. */
    instances: [
      /* Faint on purpose. They sit behind the board, so the only part
         ever seen is the strip of sky above it — and even there they
         should read as distant weather, not as something on the same
         plane as the lesson. */
      { scale: 0.154, top: 96,  speed: 7,   opacity: 0.5,  phase: 0.30 },
      { scale: 0.118, top: 212, speed: 4.5, opacity: 0.38, phase: 0.65 }
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
    /* The space the board is drawn in, and the SVG viewBox. It used to
       be the old artwork's 1507 x 1044, which showed x -12.8..12.7 and
       y -8.8..8.8 while only ever labelling x -9..9 and y -6..6 — close
       to four unlabelled columns of padding on each side.

       Trimmed to just what the labels need plus the axis overshoot,
       the arrowhead and the x/y glyph. Nothing measured below moves:
       every offset is relative to the origin, so trimming the frame
       only stops the panel drawing cells nobody names, and the same
       range is then drawn at 56px a cell instead of 51px. */
    w: 1216, h: 990,

    /* Centred, and filling everything below the band that carries
       Swifty and her line. Square cells tie the panel's aspect to the
       frame's, so height is what limits it: the band costs 178px and
       the rest is grid. */
    /* Floor to ceiling, and reaching left as far as her bubble allows.
       The frame was widened symmetrically to do it, so the board grew
       into the dead space without the axes leaving its centre — the
       extra columns either side of 6 are unnumbered grid. */
    /* As far left as her column allows. The slider used to set that
       limit at 660 — it was 610 wide and had to live in whatever the
       board left; narrowing it to 520, the width the answer pad and the
       options panel already use, bought the board another 60px. The
       frame was widened to suit, so the board grew without the axes
       leaving its centre. */
    box: { x: 600, y: 12, w: 1308, h: 1056 },

    /* Where the board builds itself before anyone is on screen: the
       middle of an empty frame, since it is the whole picture until
       there is someone to share it with. It moves to `box` as she
       flies in. Same size either end, so the slide moves two offsets
       and the grid art never rescales mid-flight. */
    centre: { x: (STAGE_W - 1308) / 2, y: 12, w: 1308, h: 1056 },

    /* A wide, shallow bubble for these screens instead of the tall one
       she uses elsewhere. Two reasons: the band above the panel is only
       130px, and at 910px the text plate puts every line these screens
       speak on a single line, which is what keeps the band shallow.

       Only the balloon has to clear the panel — the tail is meant to
       cross into it, since that is where her head is. */
    /* On the grid screens she stands below her line, so the tail points
       down at her head the ordinary way. Same shallow shape and single
       stroke as the rail version — only the tail differs. */
    bubbleDown: Object.assign({}, BUBBLE, {
      /* Two lines tall. The longest thing she says here — the distance
         question — cannot fit on one line inside the width her column
         allows, and a balloon sized for one line would shrink the type
         to 26px to cope. */
      ink: { w: 620, h: 186 },
      tip: { x: 150, y: 185 },
      bodyH: 132,
      radius: 34,
      leaf: 44,
      size: 32,
      // bounded so the balloon never reaches the board at x 866
      autoWidth: { min: 320, max: 460, pad: 46 },
      // plate 88 tall: two lines of 32px at 1.3, with 22px inset all round
      text: { left: 0.06, top: 0.118279, width: 0.88, height: 0.473118 }
    }),

    bubble: Object.assign({}, BUBBLE, {
      /* Standing on the panel's top rail puts her head near the top of
         the frame, so nothing can sit above it — a downward tail would
         force the balloon over her and push the panel down about 300px,
         leaving the grid smaller than it started. The tail points left
         instead, out of the balloon's side, so she and her line share
         one shallow band. */
      tailSide: 'left',
      biteIntoHead: 0,
      ink: { w: 760, h: 112 },      // w is a starting size; see autoWidth
      tip: { x: 0, y: 56 },         // mid-height on the balloon's left edge
      tailLen: 34,
      bodyH: 112,
      radius: 34,
      leaf: 44,
      /* Sized to the line rather than fixed: most of what she says here
         is short, and a bar of empty cream either side of "Correct!"
         reads as a mistake. */
      /* max is bounded by the distance screens: she stands at the board's
         left end there, and the slider starts at x 1285. */
      autoWidth: { min: 330, max: 800, pad: 46 },
      size: 32,
      text: { left: 0.06, top: 0.1964, width: 0.88, height: 0.607 }
    }),

    /* Axis geometry in panel-local pixels, measured off the drawn
       grid. The artwork is 22 x 14 cells at ~61px: 23 vertical lines
       (67..1413) and 15 horizontal (64..924). Both axes carry the
       same range and each line spans exactly that range, so neither
       reaches past the grid. */
    /* The origin sits at the centre of the cream, so the axes are
       centred in the grid rather than merely centred on their own
       extents. */
    originX: 608, originY: 495,
    /* Sized so 12 cells each way across and 8 each way down exactly
       fill the cream. Down, that leaves a 12px margin. Across, the
       outermost column on each side is left undrawn, so the sides
       finish on open cream rather than on a thin strip walled in by a
       grid line — which read as a squeezed extra column.
       The two steps are within 0.8% of each other, so cells read as
       square. */
    stepX: 59.083333, stepY: 59.5625,

    /* The board is far wider than it is tall, so x reaches further
       than y. ±9 is the limit: the line, its arrowheads and the `x`
       label all still sit inside the drawn grid, where ±10 would push
       the label off the board. Cells are square (61.18 x 61.43), so a
       unit is the same length on both axes. */
    xFrom: -6, xTo: 6,
    yFrom: -6, yTo: 6,

    ink: '#213258',                 // axes, arrowheads and numbers
    axisWidth: 7,

    /* How far each axis runs past its last number before the
       arrowhead. Sized to the tighter axis: there is only one spare
       row (61px) above +6 and below -6, against five spare columns
       either side of x, so 40 keeps all four tips inside the drawn
       grid and all four arms the same length. */
    /* Long enough that the arrowhead clears the last number: at 40 the
       head's base sat right on the 9 and the 6, because the arrow is
       34 of it. */
    overshoot: 58,
    arrow: { len: 34, halfW: 20 },
    /* The board itself: a golden frame, a cream surface and a grid of
       even squares, all drawn in CSS rather than dropped in as a
       picture. Sizes are in the same 1507x1044 space the axes are
       measured in and scale with the panel.

       The grid is laid out from the origin outwards, one line every
       stepX / stepY, so a line falls on every whole coordinate and the
       numbers sit exactly where they always did.

       Its extent is chosen to leave an even margin of cream inside the
       frame. The origin sits above the panel's middle, so a grid
       centred on it would leave a thin strip of cream at the top and a
       wide empty band at the bottom; carrying it two rows below the
       numbers instead of one fills that band and evens the margins to
       31px top and 25px bottom. Sideways there is no whole cell to
       gain — one more would run right up against the frame. */
    paper: {
      inner:     '#FFF9E8',
      frame:     '#FFC93D',
      edge:      '#DF8A0A',
      highlight: 'rgba(255, 255, 255, .65)',
      line:      'rgba(120, 135, 135, .55)',
      lineW: 2,             // stage px, the same weight at every size
      radius: 40,
      /* Slimmed: the frame used to be 34px of stacked rings, which at
         this board size read as a heavy border around the work rather
         than a edge to it. */
      edgeW: 2,
      frameW: 13,
      hiW: 3,               // the pale ring just inside the frame
      gxFrom: -10, gxTo: 10,
      gyFrom: -8,  gyTo: 8,

      /* Autumn leaves pinned to two corners, sized off the panel so
         they hold their place at any board size: one on its own at the
         top left, two overlapping at the bottom right, each overhanging
         the frame. They blow in whenever the board appears. Decoration
         only — they sit under the gameplay overlay and take no pointer
         events. */
      leafSize: 132         // source-space px, like everything above
    },

    labelSize: 30,                  // scaled with the cell, which shrank 3%
    labelGap: 12,                   // x numbers, tucked under their axis
    /* The y numbers need more room than the x ones: they sit beside
       the axis rather than under it, and the 0 has to fit between them
       and the origin without touching either. */
    yLabelGap: 30,
    /* 0 keeps the x numbers' row but sits in its own column, left of
       the axis and right of where the y numbers start — the one spot
       that clears both the axis and the -1 below it. */
    zeroGap: 22,

    /* Axis names. `x` sits beyond the positive x arrow; `y` sits
       beside its arrow rather than above it — there are only 21px
       between that tip and the top of the grid. */
    /* x and y sit just outside their own arrowhead, diagonally off the
       tip — the same relationship on both axes rather than floating
       away from them. */
    axisName: { size: 38, gap: 22, rise: 26, yGap: 32, yDrop: 10 },

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
      xFrom: -6, xTo: 6,
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
      // the guide drawn between the two points before the question
      dashColor: '#5B7AA8',
      dashWidth: 5,
      dashArray: '2 15',
      coordSize: 34,
      nameSize: 40,
      /* A horizontal segment carries its labels above and below the
         points. A vertical one cannot — the two points sit one above
         the other and the labels would run into each other — so it
         puts them to either side instead. */
      /* Coordinates under the point and the letter over it. The pair
         reads downward — dot, then what it is called, then where it is
         — and it keeps the numbers clear of a guide line drawn along
         the segment. */
      coordDy: 54,        // horizontal: coordinates below
      nameDy: -38,        // horizontal: letter above
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
      lenGap: 38,         // below a horizontal leg
      /* Beside a vertical leg it has to clear the upper point's letter
         as well as the line, so it sits further out. */
      lenGapV: 96
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
      labelDy: 31,           // horizontal: half a cell below the line
      /* A vertical count stacks its squares in a band one cell wide,
         and the total is far wider than that — it cannot sit beside
         them without covering the very squares being counted. It goes
         above the top of the column instead, clear of the squares and
         of the coordinate labels on the other side of the line. */
      labelUpV: 46,
      max: 18                // widest span the board allows (-9 to 9)
    },

    /* The line the player lays down with the slider. It grows out of
       the point the question starts from, one grid square per step, so
       the answer is something measured rather than guessed: a short
       guess visibly falls short of the other point, a long one runs
       past it. */
    measure: {
      color: '#2E9BD4',
      width: 9,
      capR: 9
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
  /* The resting pose, built at whatever size a screen needs. Every
     offset is in rendered stage pixels, so they scale with her, and
     charScale is the sprite-sheet scale that renders the flying frames
     at this same height — the sheet and this artwork are two different
     pictures, so a scale that suits one does not suit the other. */
  const standAt = function (k, x, y) {
    return {
      src: ART.swiftyStand,
      w: 398 * k, h: 307 * k,
      pos: { x: x, y: y },
      headTop: { x: 206 * k, y: 3 * k },
      belly:   { x: 223 * k, y: 228.4 * k },
      feet:    { y: 300 * k, cx: 208 * k },
      // where a side-tailed bubble points: off her right edge, level
      // with the middle of her body
      speak:   { x: 384 * k, y: 307 * k * 0.50 },
      inkW: 335 * k,
      charScale: 307 * k / 355
    };
  };

  /* The grid screens put her back on the grass at the left, full size,
     and give the whole right of the frame to the board. */
  const STAND = standAt(1, 60, 700);

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

  /* The brief laid the answering screens out with the board on the
     right and the controls down its left; the two were later switched
     over. Mirroring about the stage's centre line rather than picking
     fresh numbers keeps every margin and gap the brief chose — the
     board keeps its 25px outer edge, the controls theirs. */
  const flipX = function (pos, w) { return { x: STAGE_W - pos.x - w, y: pos.y }; };

  const BOARD = {
    /* The same board, in the same place, as every other screen: right
       of the frame, floor to ceiling. The answering screens used to put
       it left with the controls beside it; they share one layout now,
       so nothing jumps between a question and the screens around it. */
    panel: { pos: { x: GRID.box.x, y: GRID.box.y }, w: GRID.box.w, h: GRID.box.h },

    /* Swifty has left, so the question moves out of her speech bubble
       and into the banner. Its cream interior runs x[41..981]
       y[32..127]; the bird sits at x[121..204] and sparkles at both
       ends, so the text plate clears them. */
    banner: {
      /* Small, and centred across the top: it is a line to read once,
         not the thing on screen. Its own width sets the x so it stays
         centred if the size is ever changed again. */
      w: 800, h: 108,
      pos: { x: (STAGE_W - 800) / 2, y: 26 },

      /* Drawn rather than dropped in as a picture: a cream bar inside a
         layered golden frame, built from inset rings so the box stays
         one piece and the text plate can sit at its measured spot.
         Sizes are in banner pixels and scale with the bar. */
      paper: {
        innerTop: '#FFFDF5',
        inner:    '#FFF9E9',
        innerBot: '#FFF4D8',
        edge:     '#C96608',       // thin dark rim, outermost
        mid:      '#F29113',
        gold:     '#FFC536',
        hi:       '#FFF0A8',       // bright highlight against the cream
        radius: 23,
        e1: 2, e2: 6, e3: 10, e4: 13,   // cumulative insets
        leaf: 52                   // the corner leaves' size
      },

      /* The artwork it replaces carried a bird and sparkles at the
         ends, which is what squeezed the text into the middle 65%. The
         drawn bar has only leaves on its corners, so the line gets
         nearly the whole width — room the longer questions needed. */
      text: { left: 0.11, top: 0.16, width: 0.78, height: 0.68 },
      size: 32
    },


    /* A distance question opens with the board on its own, centred in
       an otherwise empty frame; it only moves aside once the question
       has been put and the controls are on their way in. Same size, so
       the move is a slide rather than a resize. */
    centre: { x: 387, y: 112, w: 1146, h: 925 },

    /* Where Swifty lands to put that question, while the board is
       still centred: bottom left, in front of the board's blank
       margin, with her bubble over the empty lower-left of the grid
       where no screen plots a point. */
    speak: { cx: 400, feetY: 985 },

    /* Where she stands to ask: on this board's top rail, near its left
       end. Same pose and scale as the grid screens — only the spot
       differs, because this board sits further left. */
    /* She stands on the grass at the left, exactly as she does on the
       grid screens — the rail pose is gone along with the band it
       needed. */
    stand: STAND,

    /* The one control every answering screen uses now — the number
       selector that replaced both the slider and the typed pad. It is
       built at its own natural 760 x 430 and scaled to fit her column,
       so its proportions stay the ones it was designed at rather than
       whatever happened to fit. */
    selector: { pos: { x: 34, y: 380 }, w: 760, h: 430, scale: 0.70 },

    /* The triangle-type answer panel takes the slider's place, centred
       on the same footprint so the left column stays put. */
    options: { pos: { x: 30, y: 115 }, w: 520 },

    /* And the answer pad takes the same column again, for the
       questions whose answer is typed rather than chosen. */
    entry: { pos: { x: 30, y: 115 }, w: 520 }
  };

  /* -------------------------------------------------------------
     SCREEN 24 — the result, stated
     Board on the left, the formula beside it, nobody on screen.
     ------------------------------------------------------------- */
  const RECAP = {
    grid: { x: 46, y: 142, w: 1063, h: 858 },
    formula: { x: 1246, y: 372, w: 630 },
    /* Plain "x2" rather than a subscript glyph, and the square root
       written with brackets rather than an overline: both keep to
       characters the game's font actually carries. */
    lines: [
      { kind: 'lead',   text: 'AB² = AC² + BC²' },
      { kind: 'lead',   text: 'AB² = (x2 - x1)² + (y2 - y1)²' },
      { kind: 'result', text: 'AB = √((x2 - x1)² + (y2 - y1)²)' }
    ]
  };

  /* -------------------------------------------------------------
     SCREEN 27 — the x-axis case
     Board in the middle, the formula beside it, and the general form
     narrowed step by step until only |x2 - x1| is left.
     ------------------------------------------------------------- */
  const XAXIS = {
    grid: { x: 60, y: 250, w: 924, h: 746 },
    formula: { x: 1110, y: 470, w: 750 },

    /* Both points sit on the axis, so their labels stack above it —
       below is where the axis numbering already lives. */
    a: { x: -4, y: 0, name: 'A',
         coordParts: [{ t: '(x1, ' }, { t: '0', glow: true }, { t: ')' }] },
    b: { x:  4, y: 0, name: 'B',
         coordParts: [{ t: '(x2, ' }, { t: '0', glow: true }, { t: ')' }] },
    coordDy: -88,
    nameDy: -40,
    resultDy: 82,          // the answer goes below, clear of the numbering
    /* This segment is centred on the origin, so the answer slides
       right or its plate lands on the y-axis and the -1 beside it. */
    resultDx: 168,

    /* Each step replaces the line above it. Fragments let one part
       glow as it arrives, or fade as it collapses. */
    steps: [
      [ { t: 'd = √((x2 - x1)² + (y2 - y1)²)' } ],
      [ { t: 'd = √((x2 - x1)² + ' }, { t: '(0 - 0)²', glow: true }, { t: ')' } ],
      /* The plus goes out with the term it joins, or the formula
         reads "√((x2 - x1)² + )" for the length of the fade. */
      [ { t: 'd = √((x2 - x1)²' }, { t: ' + (0 - 0)²', fade: true }, { t: ')' } ],
      [ { t: 'd = √((x2 - x1)²)' } ]
    ],
    result: 'd = |x2 - x1|'
  };

  /* The same thing turned on its side. The pair reads as one idea, so
     the board and the working stay exactly where the x-axis case left
     them — only what is on them changes. A vertical segment puts its
     labels to the side of its own accord, clear of the y numbering. */
  const YAXIS = {
    grid: XAXIS.grid,
    formula: XAXIS.formula,

    a: { x: 0, y: -4, name: 'A',
         coordParts: [{ t: '(' }, { t: '0', glow: true }, { t: ', y1)' }] },
    b: { x: 0, y:  4, name: 'B',
         coordParts: [{ t: '(' }, { t: '0', glow: true }, { t: ', y2)' }] },

    /* This segment is centred on the origin too, so the answer moves
       off it — right of the axis and a little above the x numbering. */
    resultDx: 200,
    resultDy: -60,

    steps: [
      [ { t: 'd = √((x2 - x1)² + (y2 - y1)²)' } ],
      [ { t: 'd = √(' }, { t: '(0 - 0)²', glow: true }, { t: ' + (y2 - y1)²)' } ],
      [ { t: 'd = √(' }, { t: '(0 - 0)² + ', fade: true }, { t: '(y2 - y1)²)' } ],
      [ { t: 'd = √((y2 - y1)²)' } ]
    ],
    result: 'd = |y2 - y1|'
  };

  /* ---------- Audio ---------- */
  /* Screens hand over by themselves rather than waiting to be tapped.
     Skip is still there to jump ahead early, but nothing needs a tap
     to continue. The holds are the pause after the thing that ended
     the screen, long enough to take it in before the next arrives. */
  const AUTO = {
    /* One word at a time rather than one letter: a word appearing whole
       is read as a word, where a letter crawl has to be reassembled
       before it means anything. Paced so a short line still takes about
       as long to deliver as it did. */
    wordMs: 190,
    afterLine: 1500,          // she has finished speaking
    afterCorrect: 2100,       // a question has been answered right
    afterSilent: 900,         // nothing was said; the screen just drew
    afterReveal: 3800         // a worked solution, which takes reading
  };

  /* The nudge for a child who has stopped on a locate screen. Measured
     off the artwork: the hand's own ink runs x 488..770, y 484..840 in
     a 1234 square, and the fingertip — the part that has to land on the
     point — is at (571, 484). */
  const NUDGE = {
    srcW: 1234, srcH: 1234,
    tip: { x: 571, y: 484 },
    inkH: 356,            // the hand's height in source pixels
    height: 128,          // what it renders at on the stage: about two cells
    /* The point speaks up first and the hand only follows if that was
       not enough — a hand arriving straight away would read as being
       hurried rather than helped. */
    pulseAfter: 2000,
    handAfter: 5000
  };

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
    { id: 6, line: 'Locate the point (3, 2).', entrance: 'stay',
      layout: 'grid', dots: true, bubbleScale: 0.9,
      task: {
        target: { x: 3, y: 2 },
        maxWrong: 2,
        correctLine: 'Correct!',
        tryAgainLine: 'Not quite — try again!',
        revealLine: 'Here it is — (3, 2).'
      } },

    // 7 — same again with a new point.
    { id: 7, line: 'Locate the point (6, 2).', entrance: 'stay',
      layout: 'grid', dots: true, bubbleScale: 0.9,
      task: {
        target: { x: 6, y: 2 },
        maxWrong: 2,
        correctLine: 'Correct!',
        tryAgainLine: 'Not quite — try again!',
        revealLine: 'Here it is — (6, 2).'
      } },

    /* 8 — leaves sweep the screen; behind them Swifty leaves, the
       board re-seats itself and the empty banner drops in. No
       question and nothing to locate yet. */
    { id: 8, line: 'What is the distance between points A and B?', entrance: 'none',
      layout: 'board', transition: 'leaves', distance: true, intro: 'measure',

      /* Plotted first, then joined by a dashed guide, and only then is
         the question asked. The guide shows which span is being asked
         about without answering it — the solid line the slider lays
         down is still the answer. */
      segment: { a: { x: 3, y: 2, name: 'A' }, b: { x: 6, y: 2, name: 'B' }, dash: true },

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
      distance: true, intro: 'measure',
      segment: { a: { x: 4, y: 3, name: 'A' }, b: { x: -3, y: 3, name: 'B' } },
      task: { kind: 'distance', correctLine: 'Correct!',
              showLine: 'Let’s count the units.', tryAgainLine: 'Now try again!' } },

    { id: 10, line: 'How far apart are A and B?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: 1, y: 2, name: 'A' }, b: { x: 1, y: -3, name: 'B' } },
      task: { kind: 'distance', correctLine: 'Correct!',
              showLine: 'Let’s count the units.', tryAgainLine: 'Now try again!' } },

    { id: 11, line: 'How far apart are A and B?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
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
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B', nameDx: 40, nameDy: 8 } } },

    // 13 — same board and same segment, she just carries on talking
    { id: 13, line: 'Can the grid help?', entrance: 'stay',
      layout: 'grid', bubbleScale: 0.9, keepSegment: true },

    /* 14 — leaves again, back to the board layout with the slider.
       The diagonal is redrawn and a corner C is dropped from it, so
       the horizontal step A-C can be measured on its own. The answer
       is that leg, not the diagonal, so the task measures from it. */
    { id: 14, line: 'How far apart are A and C?', entrance: 'none',
      layout: 'board', transition: 'leaves', distance: true, intro: 'measure',
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B', nameDx: 40, nameDy: 8 } },
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
      layout: 'board', distance: true, intro: 'measure', keepSegment: true,
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B', nameDx: 40, nameDy: 8 } },
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
      segment: { a: { x: 2, y: 1, name: 'A' }, b: { x: 6, y: 4, name: 'B', nameDx: 40, nameDy: 8 },
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

    /* 19-20 — the method used straight away on two fresh triangles,
       both already drawn. Only the coordinates are given: no side
       lengths, so the legs have to be read off the grid before
       Pythagoras can be applied. Both are Pythagorean triples, so the
       answer comes out whole — 3-4-5 first, then the same shape
       doubled to 6-8-10. */
    { id: 19, line: 'Find the distance AB.', range: { min: 1, max: 12 }, entrance: 'none',
      layout: 'board', transition: 'leaves', intro: 'measure', entry: true,
      segment: { a: { x: -2, y: 2, name: 'A' },
                 b: { x:  2, y: 5, name: 'B', nameDx: 40, nameDy: 8 } },
      legs: [
        { from: { x: -2, y: 2 }, to: { x: 2, y: 2 }, mark: { name: 'C' } },
        { from: { x:  2, y: 2 }, to: { x: 2, y: 5 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 5,
              correctLine: 'That\u2019s right!',
              feedback: [
                'Not quite. Count the two sides, then use Pythagoras.',
                'The sides are 4 and 3. What is \u221a(4\u00b2 + 3\u00b2)?'
              ] } },

    { id: 20, line: 'Now find AB.', range: { min: 1, max: 12 }, entrance: 'none',
      layout: 'board', transition: 'leaves', intro: 'measure', entry: true,
      segment: { a: { x: -3, y:  3, name: 'A' },
                 b: { x:  5, y: -3, name: 'B', nameDx: 40, nameDy: 8 } },
      legs: [
        { from: { x: -3, y: 3 }, to: { x: 5, y:  3 }, mark: { name: 'C' } },
        { from: { x:  5, y: 3 }, to: { x: 5, y: -3 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 10,
              correctLine: 'That\u2019s right!',
              feedback: [
                'Not quite. Count the two sides, then use Pythagoras.',
                'The sides are 8 and 6. What is \u221a(8\u00b2 + 6\u00b2)?'
              ] } },

    /* 21 — leaves, back to the field layout, and the same idea stated
       in general: the points are named rather than numbered. */
    { id: 21, line: 'The same idea works for any two points.', entrance: 'fly',
      layout: 'grid', transition: 'leaves', bubbleScale: 0.9,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)', nameDx: 40, nameDy: 8 },
        color: '#B3261E'
      } },

    /* 22 — the same general segment, with the corner dropped and both
       legs drawn: the right-angled triangle in its general form. The
       corner is named from the two points' own coordinates. */
    { id: 22, line: null, entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)', nameDx: 40, nameDy: 8 },
        color: '#B3261E'
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' } },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 } }
      ] },

    /* 23 — the horizontal leg is named. Nothing is redrawn; it only
       gains its length, written as the difference rather than a
       count of units. */
    { id: 23, line: 'AC = x2 - x1', entrance: 'stay',
      layout: 'grid', keepSegment: true, bubbleScale: 0.9,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)', nameDx: 40, nameDy: 8 },
        color: '#B3261E'
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x2 - x1' },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 }, settled: true }
      ] },

    /* 24 — and now the vertical leg is named too, so both differences
       are on the board together. */
    { id: 24, line: 'CB = y2 - y1', entrance: 'stay',
      layout: 'grid', keepSegment: true, bubbleScale: 0.9,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)', nameDx: 40, nameDy: 8 },
        color: '#B3261E'
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x2 - x1' },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 },
          settled: true, length: true, lengthText: 'y2 - y1' }
      ] },

    /* 25 — the board is finished; she just turns to the question it
       sets up. Nothing is declared to draw, so nothing redraws and
       her line comes straight up. */
    { id: 25, line: 'Now, let’s find AB.', entrance: 'stay',
      layout: 'grid', keepSegment: true, bubbleScale: 0.9 },

    /* 26 — leaves, then the result on its own: board to the left, the
       working beside it, and nobody in shot. */
    { id: 26, line: null, entrance: 'none',
      layout: 'recap', transition: 'leaves', keepSegment: true },

    /* 27-28 — leaves, then back to the opening arrangement: no board,
       no panels, Swifty alone in the field. */
    { id: 27, line: 'And that gives us the distance between any two points!',
      entrance: 'fly', transition: 'leaves' },

    { id: 28, line: 'What if both points are on the x-axis?', entrance: 'stay' },

    /* 29 — the x-axis case worked through: the general formula narrows
       to |x2 - x1| as the y terms fall away. */
    { id: 29, line: 'Both points are on the x-axis.', entrance: 'none',
      layout: 'xaxis', transition: 'leaves' },

    /* 30 — leaves again, and the same empty field as 25: board, banner
       and working all left behind, Swifty flying back in alone to put
       the next question. */
    { id: 30, line: 'And what if they’re on the y-axis?',
      entrance: 'fly', transition: 'leaves' },

    /* 31 — the same working as 27 with the axes swapped: the x terms
       are the pair that falls away this time. */
    { id: 31, line: 'Both points are on the y-axis.', entrance: 'none',
      layout: 'yaxis', transition: 'leaves' }
  ];

  return {
    STAGE_W, STAGE_H, ART, SHEETS, SHEET_W, SHEET_H,
    SWIFTY, CHAR_SCALE, ANCHOR, HEAD_TOP, FEET_DY, SHADOW, CLOUD,
    S5_ORIGIN, GRID, STAND, S8_ORIGIN, BOARD, RECAP, XAXIS, YAXIS,
    BUBBLE, PLAY, START, NUDGE, AUDIO, AUTO, SCRIPT
  };
})();

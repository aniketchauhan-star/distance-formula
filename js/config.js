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
    background:  'assets/game Background .png',
    clouds:      'assets/clouds.png',
    playButton:  'assets/play button .png',
    swiftyFly:   'assets/swifty fly.png',
    swiftyTalk:  'assets/swifty talk.png',
    swiftyStand: 'assets/normal stand swifty.png',
    leaf:        'assets/leaf.png',
    handNudge:   'assets/hand nudge.png'
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
  /* Proportions taken from the shared Swiftee bubble, which sets every
     one of them off the line's own size: padding .62em over 1em, a .62em
     corner, 1.2 line-height, and a box that hugs whatever it is holding.
     Its palette block is the host game's tokens — the file says so — so
     the numbers below are its, and the colours are this field's. */
  const BUBBLE = {
    ink: { w: 620, h: 172 },
    /* The point, in the box's own pixels — .815em in from the left, so
       the tail hangs off the straight underside just past the corner
       arc rather than off the corner itself. */
    tip: { x: 24, y: 172 },

    /* Where a corner tail points: her head's right cheek. Measured off
       her artwork's own alpha, over all eight talking poses — at 0.38
       of the way from her crown to her feet (plus the bite below) her
       outline sits between 0.353 and 0.367 of the frame's width out
       from the belly anchor. 0.330 is therefore 5px inside the
       narrowest of the eight and 8px inside the widest, so the point
       touches her on every frame of the talk cycle instead of landing
       on the outline and flickering off it as she talks. Kept as
       fractions so it holds wherever she is drawn at. */
    aimSide: { dx: 0.330, dy: 0.38 },
    scale: 1,
    biteIntoHead: 10,             // how far the point sinks into her crown

    /* Only a fallback: the balloon is cut to its line by fitBox(), one
       row or two. */
    bodyH: 120,
    /* .62em. The shared bubble ties its corner to the type rather than
       to the box, so a two-row balloon reads as the same object as a
       one-row one instead of a rounder version of it. */
    radius: 20,
    /* Long enough to clear her crest on the way down to her cheek. The
       shared bubble's own tail is shorter, but it hangs over a mascot
       with room under it; this one has to reach past her head. */
    tailLen: 52,
    tailTip: 10,                  // rounding on the point

    /* Cumulative insets, measured from the outside in: a dark rim, the
       orange body of the frame, then a golden inner band before the
       cream. The tail repeats them at the same widths.

       The rim is both darker and wider than the rest of the autumn set
       needs: the bubble floats on open sky, which is very light and
       very warm, so a thin mid-orange edge disappeared into it. */
    /* Out of the balloon's bottom-left corner, so the box sits up and
       to the right of her face. She is alone in the middle of an open
       field on these screens, and a box over her head pushed her down
       the frame to make room for itself; beside her it takes the space
       that was empty anyway and she stays where she stands. */
    tailSide: 'left',

    /* One stroke around the balloon and the same one around the tail,
       drawn as a border rather than as stacked inset rings. */
    edgeW: 5,

    /* The field's own colours, two steps apart so the box still reads
       as a thing in front of the scene: a pale warm peach taken off the
       light in the sky, an amber edge out of the tree and the grass,
       and a deep warm brown for the letters. */
    fill:   '#FFF1E2',
    edge:   '#E09A55',
    ink_:   '#7C3B12',            // the text
    sheen:  'rgba(255, 255, 255, .92)',   // the catch-light in the corner
    size:   32,                   // the size every line is set at

    /* The box is cut to the line rather than being a fixed bar: a
       two-word greeting in a box built for the longest question in the
       game was the thing that read as wrong. min/max keep it from
       becoming a tile or running off the field. */
    autoWidth: { min: 200, max: 620, pad: 32 },
    pad: { x: 32, y: 20 },        // .62em over 1em, off the line's size
    lineH: 40,                    // 1.2 line-height, with room to sit in

    /* Two coloured halos and one cast, the way the shared bubble is
       lifted: the glow is what makes it read as sitting in front of the
       field rather than printed on it. */
    glow: 'rgba(224, 154, 85, .34)',
    glowWide: 'rgba(224, 154, 85, .18)',
    cast: 'rgba(120, 62, 14, .24)',

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
    /* On the grass, not on the stone. She stands in the open between
       the two boulders — the big one falls away to her left and the
       small one sits below her right, so both read as in front of her
       and she is planted on the slope rather than balanced on a rock. */
    height: 380,                    // against SWIFTY.height of 240 in game
    perch: { cx: 470, feetY: 955 },
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
  // A contact shadow on open ground, so it spreads the way the game's
  // grass one does rather than being pinched to a rock's width.
  START.shadow = { w: 186, h: 40 };

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

       At sizeScale the disc renders 197 x 187. It hung too low for the
       lockup — 110px of sky under the plate put it adrift in the middle
       of the lake — so it sits 30px higher, spanning y 667..853, which
       lands it on the far shore and reads as part of the title rather
       than as something floating below it. Still 80px under the plate,
       well clear of the leaves hanging off its corners. */
    /* Under the wordmark, centred on it. The lockup's plate ends at
       y 587 and its middle is x 1336, both measured off the art, so the
       button hangs below the title rather than beside it. */
    box: { cx: 1336, cy: 760, w: 281, h: 267 },
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

  /* What a plotted point looks like — one description, used by every
     one of them. A point the child locates and the same point drawn as
     the end of a segment are the same point, so they are drawn the same
     way: finding one used to turn it green and plotting it turned it
     back to blue, which read as the board swapping it for a different
     one rather than carrying on with it. Being right is said by the
     ring, the burst and the cheer, not by recolouring the answer. */
  /* One definition for every point the child ever sees — the one they
     tap out and the one a segment joins are the same object, so they
     cannot drift apart in colour or size. */
  const POINT = { r: 10, fill: '#2E9E6B', stroke: '#FFFFFF', strokeW: 3 };

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
    /* The viewBox is the ruling and nothing else: 14 cells across by 12
       down, exactly. There is no spare band round the outside, so the
       first and last lines of the grid land on the panel's own edges
       and every square on the board is whole.

       That also settles the gaps for good. Air round the ruling could
       only ever be even if panel.w - panel.h came to exactly two cells;
       with none at all, there is nothing to be uneven. The axes still
       stop short of the edge — they run to the last number plus an
       overshoot for the arrowhead, not to the frame. */
    w: 14 * 77.372458, h: 12 * 78,

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
    /* 14 by 12 cells, so the panel is 7:6 and the cells stay square.
       88px a cell — bigger than it has ever been, because the band that
       used to sit outside the ruling is now grid. */
    box: { x: 644, y: 12, w: 1232, h: 1056 },

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
      /* Over her head here, not beside it: she stands in her own column
         with the board filling everything to her right, so there is no
         room out there for a box to sit in. */
      tailSide: null,
      ink: { w: 620, h: 176 },
      tip: { x: 150, y: 176 },
      bodyH: 120,
      radius: 20,
      leaf: 44,
      size: 32,
      // bounded so the balloon never reaches the board at x 866
      autoWidth: { min: 250, max: 460, pad: 32 },
      /* The cream around the text, and one row's height — the balloon is
         built from these rather than from fractions of a fixed box, so
         a one-line greeting gets a one-line balloon instead of sitting
         in a box sized for the longest question in the game. */
      pad: { x: 32, y: 20 },
      lineH: 40,
      tailLen: 44
    }),


    /* Axis geometry in panel-local pixels, measured off the drawn
       grid. The artwork is 22 x 14 cells at ~61px: 23 vertical lines
       (67..1413) and 15 horizontal (64..924). Both axes carry the
       same range and each line spans exactly that range, so neither
       reaches past the grid. */
    /* The origin sits at the centre of the cream, so the axes are
       centred in the grid rather than merely centred on their own
       extents. */
    originX: 7 * 77.372458, originY: 6 * 78,
    /* Sized so the numbered plane fills the board. The board is 1.24:1
       and cells have to stay square, so the two ranges cannot both be
       the same: 6 columns each way and 5 rows each way is what a square
       cell divides this frame into. Asking for 6 rows as well is what
       held the cells down to 59px with a band of unnamed ruling top and
       bottom — the same plane now draws at 78px a cell.

       Both steps scale together, so their ratio is untouched and cells
       stay square against the panel's own aspect. */
    stepX: 77.372458, stepY: 78,

    /* The board is far wider than it is tall, so x reaches further
       than y — which is the whole point: a square cell divides this
       frame into 6 columns each way and 5 rows each way, and asking
       for 6 rows as well is what used to squeeze the cells down.
       Cells are square (83.2 x 83.2 on the full board), so a unit is
       the same length on both axes. */
    /* y stops at 5 where x stops at 6. Every point the game plots fits
       (x runs -5..6, y runs -3..5) and it is what lets a square cell
       fill a frame that is wider than it is tall. */
    xFrom: -6, xTo: 6,
    yFrom: -5, yTo: 5,

    ink: '#213258',                 // axes, arrowheads and numbers
    axisWidth: 7,
    /* How long a half-axis takes to draw itself outward from the
       origin. The stylesheet reads it from a custom property set in
       Board.build(), so the numbers riding the sweep and the sweep
       itself can never drift apart. */
    axisDrawMs: 900,
    /* The colour a number is struck in as the sweep uncovers it, before
       it cools to the board's ink. Scale alone was too quiet to notice
       on a bright board; a number that lights up is not missable. */
    numLit: '#F0A310',

    /* How far each axis runs past its last number before the
       arrowhead. Sized to the tighter axis, which is y: past the
       arrow there is only the `y` above it and then the frame, where
       x has room to spare on both sides. The same length on all four
       arms, so the cross reads as one shape. */
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
      /* Whole cells only. Running the ruling past the frame and
         trimming it to the cream left a sliver of a cell down every
         side and a curved scrap in each rounded corner — the grid read
         as cut out rather than drawn on. These are the most cells that
         fit inside the cream while still landing on whole coordinates,
         so every square on the board is a square.

         The cream is 1184 x 958 and a cell is 77.4 x 78, so it holds
         15.3 across and 12.3 down: the leftover is 50px a side and
         11px top and bottom. That is arithmetic, not a choice — square
         cells on a board wider than it is tall cannot come out even on
         both axes. */
      gxFrom: -7, gxTo: 7,
      gyFrom: -6, gyTo: 6
    },

    labelSize: 36,                  // scaled with the cell
    labelGap: 14,                   // x numbers, tucked under their axis
    /* The y numbers sit beside their axis the way the x ones sit under
       theirs: tucked close to it, with the rest of the cell left open
       on the far side. They used to be pushed right out to the x=-1
       gridline — 8px off it and 33px off the axis they belong to — so
       they read as hanging in the cell rather than labelling the line.
       This is the x row's own proportion, about a quarter of the spare
       room on the axis side and three quarters beyond. */
    yLabelGap: 20,
    /* 0 keeps the x numbers' row and shares the y numbers' column, so
       the left-hand numbers read as one column with the 0 at its
       corner. It is the only one of them in that row, so the -1 to its
       left and the -1 below it are what it has to clear, not the
       column it sits in. */
    zeroGap: 30,

    /* Axis names. `x` sits beyond the positive x arrow; `y` sits
       beside its arrow rather than above it — there are only 21px
       between that tip and the top of the grid. */
    /* x and y sit just outside their own arrowhead, diagonally off the
       tip — the same relationship on both axes rather than floating
       away from them. */
    axisName: { size: 40, gap: 24, rise: 28, yGap: 34, yDrop: 10 },

    /* Screen 6: a marker on every gridline intersection across the
       numbered range — 13 x 13 = 169 of them. Faint light blue so
       they read as places you could tap rather than as answers, with
       a white ring keeping each legible where it crosses a navy axis.
       They brighten and grow under the cursor. */
    dot: {
      // small enough to read as a place you could tap, not as a plotted point
      r: 5,
      fill: '#6FC0E8',      // soft light blue, held faint by the pulse opacity
      stroke: '#FFFFFF',
      strokeWidth: 2,
      rippleMs: 60,         // per-ring delay, so the pulse travels outward
      skipOnAxes: true,     // no marker where a point would sit on an axis
      /* How long a child is left to look before anything helps them.
         Ten seconds is long enough that someone reading the board is
         never interrupted, and short enough that someone stuck is not
         left there. Until then nothing on the board moves at all. */
      hintAfter: 10000,
      /* When it does come, a hand taps the place as well — but only for
         a moment. The glow stays until the point is found; the hand
         says "here" once and gets out of the way. */
      nudgeMs: 3000,
      /* The art is a 1234 square that is mostly empty: the drawn hand
         occupies only x 488..770, y 484..840 of it, so a box sized to
         look right draws a hand under a quarter that wide. 290 puts
         about 66x84px of hand on a board whose cells are 88 — plainly a
         pointing finger, and small enough not to sit on top of the
         point it is pointing at.

         The fingertip is at 0.4627 across and 0.3922 down. That is
         measured off the yellow of the hand specifically, not off the
         file's alpha: the art also carries a pale tap-ripple ring that
         reaches higher than the finger does, and taking the alpha
         bounding box read the top of that ring instead, which hung the
         whole hand a tenth of an image too low and left the fingertip
         floating below the point. */
      nudgeSize: 290,
      nudgeTip: { x: 0.4627, y: 0.3922 },
      // markers cover every numbered intersection on both axes
      xFrom: -6, xTo: 6,
      yFrom: -5, yTo: 5
    },

    /* A plotted segment: two named points joined by a line, each
       labelled with its coordinates above and its letter below. */
    segment: {
      /* About a third of a cell across. At half a cell the two points
         were the loudest thing on the board — bigger than the numbers
         beside them and nearly touching the ruling on either side. */
      dotR: POINT.r,
      dotFill: POINT.fill,
      dotStroke: POINT.stroke,
      dotStrokeW: POINT.strokeW,
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
      coordDy: 54,        // only where a screen asks for it outright
      nameDy: -38,        // a row or a diagonal: letter above the point
      /* A point one square above the x-axis writes its coordinates
         straight across the axis and the numbering under it, so those
         go above the point instead — and out along the segment, away
         from whatever else is written near the other end of it. */
      coordFlipDx: 46,
      /* Vertical: both labels go to whichever side faces away from the
         y-axis, or they land on the axis numbers. Stacked slightly so
         the two points' labels stay apart even 2 units in. */
      coordDx: 84,
      vCoordDy: -26,
      /* How much clear air there is between the edge of a plotted point
         and the near edge of its coordinates — the one number for it,
         whichever way the label is pushed. Two separate offsets used to
         say this, one measured to the text's edge and one to its
         middle, and they had drifted to 12px one way and 19px the
         other. Close enough to read as belonging to the point, never
         close enough to touch it. */
      coordGap: 8,
      vNameDy: 32
    },

    /* A leg dropped from the segment: the extra corner point and the
       coloured line joining it, used to break a diagonal into a
       horizontal and a vertical step. */
    leg: {
      /* A deep teal rather than red: red read as a mistake next to the
         green "found" markers and the navy hypotenuse, and it is the
         one colour in the game that means something is wrong. */
      color: '#2F8F6F',
      /* One colour per side, so a length and the line it measures are
         plainly the same thing — and so the working can say "4\u00B2" in
         the horizontal's colour. Set by which way the leg runs, not by
         which slot it lands in. */
      hColor: '#E07B12',
      vColor: '#2F8F6F',
      /* A side about to be measured is laid down dotted, not solid: the
         count draws a solid stroke along it, and two solid lines on the
         same span read as one thick line rather than as a measurement
         being taken of something.

         Round caps extend every dash by half the stroke width at each
         end, so the dash and gap written here are not what is drawn: at
         7px wide, "2 14" comes out as a 9px dot with a 7px gap, which
         is a chain, not a dotted line. These render as an 8px dot with
         15px of air — 1+7 long, 22-7 apart. */
      dashWidth: 7,
      dashArray: '1 22',
      width: 7,
      dotR: 8,            // the corner, a shade under a plotted point
      coordDx: 84,        // coordinates to the right of the corner
      nameDy: 46,         // letter below it
      /* Straight up from the corner is where the other leg rises, so a
         letter driven off the x-axis goes up and to the side of it
         rather than sitting on the line. */
      nameFlipDx: -52,
      slots: 2,           // a right-angled path needs two
      lenSize: 32,        // "4 units" written along a leg
      /* No plate behind these any more, so they need far less room —
         and where they sit matters more, since nothing boxes them off
         from what they are near.

         Above a horizontal leg, which is inside the right angle and
         the one clear space on the board: below it are the x-axis
         numbering and the start point's own coordinates. */
      lenGap: -34,
      /* Beside a vertical leg, on the outside. Both ends of that side
         are taken — the far point's coordinates above, the corner's
         below — so it is pushed along the leg towards the corner, into
         the gap between the two. */
      lenGapV: 78,
      lenBiasV: 34
    },

    /* Unit squares that count out a segment's length when a child
       gets the distance wrong. Filled strongly enough to be obvious
       against the cream board, with a brighter flash as each lands. */

    /* ---- the subtraction, worked on the board ----

       One beat shows where a horizontal distance actually comes from.
       The two numbers are lifted out of the coordinate labels they live
       in, carried above the line, and the subtraction is assembled from
       them a piece at a time — and then its answer comes back down to
       sit between the points as the length. A child who watches the 3
       and the 6 leave their coordinates and the answer arrive on the
       line has been shown why it is a subtraction; a balloon reading
       "6 - 3 = 3" has told them the answer and nothing else.

       Every duration is slower than the game's usual beat. This is the
       one screen where the arithmetic is the content. */
    /* The board's camera. It pushes in on the triangle while the
       triangle is what is being worked on, so the squares the child is
       counting are big enough to count. */
    zoom: {
      ms: 900,           // one push, about a second
      delayMs: 260,      // after the beat opens, so it comes with her line
      margin: 0.6        // cells of air round what is being framed
    },

    /* A pair the child finished with, brought back on a later screen
       beside the one that screen is about. The timings are the
       segment's own, tightened: the pair being recalled is not news, so
       it arrives at a glance rather than being introduced. */
    example: {
      slots: 1,          // the most any one screen recalls
      dotAMs: 100,       // its two points
      dotBMs: 240,
      lineMs: 420,       // the line that joins them
      coordMs: 760,      // their coordinates
      coordStep: 120,
      resultMs: 1040,    // and what the child measured
      stagger: 760,      // between one recalled pair and the next
      /* Held after her line. Long enough that both lengths on the board
         are up for the three seconds a recall has always given its own
         — and longer than the whole arrival, so even a beat with
         nothing recorded to say cannot be carried off with a pair still
         coming up. */
      readMs: 2200
    },

    xeq: {
      size: 40,          // the sum, big enough to read across the board
      gap: 11,           // air between its parts
      stageUp: 1.15,     // cells above the pair, where the numbers land
      finalUp: 1.9,      // and where the finished sum settles
      yGlowMs: 1000,     // the matching y-halves, lit and let go
      pickMs: 320,       // a number lighting before it is lifted
      flyMs: 800,        // and travelling up off the axis
      settleMs: 500,     // both up, before the operator appears
      opMs: 300,         // then the minus
      eqMs: 500,         // then the equals
      resMs: 350,        // then the answer
      readMs: 900,       // which is left to be read
      sweepMs: 800,      // the pair lit end to end under it
      holdMs: 900,       // a beat before the answer leaves the sum
      dropMs: 900,       // and comes down to the middle of the span
      wordMs: 850        // where "units" is written after it
    },

    unitBox: {
      /* One beat per unit as the line walks out. Slow enough to count
         along with, quick enough that twelve of them is not a wait. */
      stepMs: 240,
      /* How long the finished count stays up before the board is handed
         back. It is a hint, not a caption: it says how long a unit is
         and how many fit, and then gets out of the way so the next try
         starts on a clean board. */
      holdMs: 2600,
      /* The total sits above the line, with nothing behind it — the
         coordinates it used to collide with are now under their points,
         so the space above the segment is free. */
      labelSize: 32,

      /* The band shown to someone who has missed twice: pale enough
         that the ruling and the numbers still read through it, which
         is what the bordered per-unit squares failed at. */
      band: { fill: 'rgba(120, 170, 225, .26)', edge: 'rgba(85, 135, 200, .55)', edgeW: 2 },
      labelDy: -28,          // horizontal: just above the line
      /* A vertical count stacks its squares in a band one cell wide,
         and the total is far wider than that — it cannot sit beside
         them without covering the very squares being counted. It goes
         above the top of the column instead, clear of the squares and
         of the coordinate labels on the other side of the line. */
      /* Clear of the upper point's own coordinates, which on a vertical
         span sit just above the point and off to one side — the total
         used to be written straight across them. */
      labelUpV: 86,
      /* A diagonal has no squares to sit over, so its total goes out to
         the side of the line, clear of the two legs opposite. */
      diagGap: 54
    },

    /* The line the player lays down with the slider. It grows out of
       the point the question starts from, one grid square per step, so
       the answer is something measured rather than guessed: a short
       guess visibly falls short of the other point, a long one runs
       past it. */
    measure: {
      color: '#2E9BD4',
      width: 9,
      // the growing end, kept under the plotted points it runs between
      capR: 7
    },

    /* The marker left behind once a point has been found, with its
       coordinates written beside it. */
    found: {
      /* Exactly a plotted point, because that is what it is — the very
         point the next screen goes on to draw a line from. */
      r: POINT.r,
      fill: POINT.fill,
      stroke: POINT.stroke,
      strokeWidth: POINT.strokeW,
      labelSize: 34,
      /* Close over the point — near enough to belong to it, far enough
         not to touch it: 42 less the dot's 10 and the text's own 17
         leaves 15 of clear air. The length written along the line gets
         out of ITS way rather than the other way round, because the
         coordinates belong to their points and the total is the thing
         that floats.

         There is no labelDx any more. A fixed shift to the right hung a
         third of the label off the board at x = 6, where the SVG cut it
         off; the label is centred over its point instead, which is also
         exactly where a segment puts it, so a located point keeps its
         label when the pair is joined. */
      labelDy: -42
    }
  };



  /* The whole sequence end to end, plus a beat to read what it leaves.
     Derived rather than typed, so tuning any step cannot leave the board
     carried off mid-sentence. */
  const XEQ_HOLD = (function (x) {
    return x.yGlowMs + 2 * (x.pickMs + x.flyMs) + x.settleMs +
           x.opMs + x.eqMs + x.resMs + x.readMs +
           x.sweepMs + x.holdMs + x.dropMs + x.wordMs + 1200;
  })(GRID.xeq);

  /* Both recall beats take the same hold from the same place, so they
     stay the same length as each other whatever is tuned. */
  const EXAMPLE_HOLD = GRID.example.readMs;

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
  /* Where she stands to talk: down on the grass, front of frame. */
  const STAND = standAt(1, 60, 700);
  /* And where she moves to when a control arrives: standing on its top
     edge, feet at 688 against a panel whose top is 680, and a little
     smaller — she is further away up there, and the control is what
     should hold the eye once it has arrived. The move animates, so the
     size settles with the travel rather than snapping. */
  const STAND_UP = standAt(0.88, 60, 424);

  /* And a perch for the working panel, which sits higher up her column
     than the answers do — she leaves before it is written and comes
     back to stand on it, so it needs a seat of its own. Her feet sit
     256 below the pose's own top, so this is the working panel's y less
     that — move one and the other has to follow. */
  const STAND_WORK = standAt(0.88, 60, 134);

  /* -------------------------------------------------------------
     SCREEN 8 — board on its own, the question in her bubble

     Brief: grid panel (850, 2422) 1239 x 856, distance panel
     (219, 2646) 610 x 407.

     These pin the artboard origin to (194, 2227) — the only value that
     fits them in a 1920 x 1080 frame and leaves symmetric margins
     (25px left and right, 29px top and bottom). It lands the grid on
     the right and the distance panel on the left, as briefed.
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


    /* A distance question opens with the board on its own, centred in
       an otherwise empty frame; it only moves aside once the question
       has been put and the controls are on their way in. Same size, so
       the move is a slide rather than a resize. */
    centre: { x: 377, y: 40, w: 1166, h: 1000 },

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
    standUp: STAND_UP,

    /* The one control every answering screen uses now — the number
       selector that replaced both the slider and the typed pad. It is
       built at its own natural 760 x 430 and scaled to fit her column,
       so its proportions stay the ones it was designed at rather than
       whatever happened to fit. */
    selector: {
      /* The reel's own natural size — one gold housing 800 x 190 with
         an arrow built into each end, and the Check button under it.
         Scaled so it keeps the width it has always had in her column:
         she lands on the housing's top edge at y 688, and the board
         still starts 34px clear of its right. */
      pos: { x: 34, y: 680 },
      w: 800, h: 346,
      scale: 0.665
    },

    /* The triangle-type answer panel takes the slider's place, centred
       on the same footprint so the left column stays put. */
    /* Below her, like the selector — its natural height is about 432,
       so it is scaled to clear the bottom of the frame. */
    /* The same slot the number selector takes: top edge at 680, so she
       stands on it at exactly the height she stands on that one. Three
       stacked buttons is a taller shape than a row of tiles, so it is
       scaled to land its foot near the selector's rather than to match
       its width. h is its real built height — 9px borders, 28/32
       padding, three 108px buttons and two 24px gaps. */
    options: { pos: { x: 34, y: 680 }, w: 520, h: 450, scale: 0.73 },

    /* Where the working goes once the answers have gone: the middle of
       her column rather than the foot of it. A worked solution is the
       whole screen for as long as it is being written, so it takes the
       middle and nothing stands on it until it is finished. */
    /* Drawn at its natural size — the type inside was designed at these
       numbers, so anything under 1 is shrinking a solution that is the
       only thing on its half of the screen. 520 wide from x 34 leaves
       46px to the board's edge. */
    working: { pos: { x: 34, y: 390 }, scale: 1, stand: STAND_WORK },

    /* And the answer pad takes the same column again, for the
       questions whose answer is typed rather than chosen. */
    entry: { pos: { x: 30, y: 115 }, w: 520 }
  };

  /* -------------------------------------------------------------
     SCREEN 24 — the result, stated
     Board on the left, the formula beside it, nobody on screen.
     ------------------------------------------------------------- */
  /* One arrangement for every screen that states a formula beside the
     board, so none of them reads as a different kind of screen: the
     working on the left, where every other panel in the game lives, and
     the board big on the right. The ratio is held or the cells stop
     being square. */
  const STUDY = {
    /* Same ratio as the main board, so its gaps come out even too —
       that falls out of the viewBox rather than being tuned per board:
       any panel at this ratio has panel.w = panel.h + 2 x cell, which
       is exactly the condition for the air round the ruling to match on
       all four sides. */
    grid: { x: 790, y: 68, w: 1108, h: 950 },
    fx: 34, fw: 720
  };

  const RECAP = {
    grid: STUDY.grid,
    // nobody in shot here, so the working takes the middle of its column
    formula: { x: STUDY.fx, y: 415, w: STUDY.fw },
    /* How far apart the three lines arrive. Each is written on rather
       than dropped in, so this has to clear the writing itself or two
       lines are being drawn at once. */
    step: 1500,
    /* Plain "x2" rather than a subscript glyph — that one is still a
       character the font has to carry. The root is written \u221A(...)
       here, and those brackets are read as saying how far it reaches:
       the panel draws the sign and a bar over everything inside them,
       so the brackets themselves are never shown. */
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
    /* The working goes where every other panel in the game goes — the
       left column — rather than underneath the board. Under it there
       was only the strip below y 884 to have, which is not enough for a
       panel and read as one pushed off the bottom of the frame.

       She stands at the foot of that column and her bubble tops out at
       y 589, so the working takes the empty half above her. The board
       gives up 40px of width to make the room; its ratio is held, or
       the cells stop being square. */
    grid: STUDY.grid,
    // she stands at the foot of this column, so the working takes the top
    formula: { x: STUDY.fx, y: 132, w: STUDY.fw },

    /* Both points sit on the axis, so their labels stack above it —
       below is where the axis numbering already lives.

       No letters on these two. A letter is there to tell one point from
       another when a third has joined them and the sides need naming;
       with only two on the board there is nothing to tell apart, and
       the coordinates already say which is which. */
    a: { x: -4, y: 0,
         coordParts: [{ t: '(x1, ' }, { t: '0', glow: true }, { t: ')' }] },
    b: { x:  4, y: 0,
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

    a: { x: 0, y: -4,
         coordParts: [{ t: '(' }, { t: '0', glow: true }, { t: ', y1)' }] },
    b: { x: 0, y:  4,
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
    afterReveal: 3800,        // a worked solution, which takes reading
    /* And after a worked solution that wrote itself out line by line —
       long enough to read the whole thing back before it goes. */
    afterWorking: 4000
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
    /* The grid builds itself, then the tappable points wiggle in, and
       only then does she fly back to the left — so the board is whole
       and alive before anyone is asked to do anything with it. */
    { id: 5, line: null, entrance: 'fly',
      layout: 'grid', dots: true },

    /* 6 — the highlighters come up and the board goes live: tap the
       point she asked for. Two wrong taps and she shows the answer
       herself. */
    { id: 6, line: 'Locate the point (3, 2).', entrance: 'stay',
      layout: 'grid', dots: true,
      task: {
        target: { x: 3, y: 2 },
        maxWrong: 2
      } },

    /* 7 — same again with a new point, and without the pulse: the first
       one showed how, so pointing at this one too would be doing it for
       them rather than letting them try. */
    { id: 7, line: 'Locate the point (6, 2).', entrance: 'stay', hint: false,
      layout: 'grid', dots: true,
      task: {
        target: { x: 6, y: 2 },
        maxWrong: 2
      } },

    /* No sweep between 7 and 8: this question is asked on the very board
       the point was just located on, so the board and Swifty both stay
       and only the two points arrive. */
    { id: 8, line: 'What is the distance between two points?', entrance: 'none',
      layout: 'board', distance: true, intro: 'measure',

      /* Plotted first, then joined by a dashed guide, and only then is
         the question asked. The guide shows which span is being asked
         about without answering it — the solid line the slider lays
         down is still the answer. */
      /* The coordinates are split into their parts here rather than on
         the screen that argues about them, so that argument can keep
         this very drawing instead of taking it down and putting an
         identical one back up. Nothing about how they read changes. */
      segment: {
        a: { x: 3, y: 2,
             coordParts: [{ t: '(' }, { t: '3', glow: 'x' }, { t: ',\u00A0' },
                          { t: '2', glow: 'y' }, { t: ')' }] },
        b: { x: 6, y: 2,
             coordParts: [{ t: '(' }, { t: '6', glow: 'x' }, { t: ',\u00A0' },
                          { t: '2', glow: 'y' }, { t: ')' }] },
        /* Left over the points here, and only here. This is the pair
           the child tapped out two screens ago, and it is carried in
           wearing the labels they put there — moving them as it arrives
           would read as a different pair. They go under the points on
           the screen that starts arguing about them, which replots. */
        dash: true },

      /* `answer` is left out on purpose: the game measures it from the
         two points, so moving a point can never leave a stale answer
         behind. Set it explicitly only to override that. */
      task: {
        kind: 'distance',       // answered on the reel, not by tapping
        /* A wrong answer counts their number out on the board so the
           miss can be seen, and says this over it. */
        tryAgainLine: 'Not quite! Try again!',
              /* Missed twice: shown instead of told. */
              countLine: 'Now let’s count the units.'
      } },

    /* 9-11 — three more of the same, staying on the board. Two of them
       are vertical segments, so the count-out stacks its squares
       beside the line instead of hanging them beneath it. */
    /* ---- why the counting works, on a pair that has just been counted.
       Four beats on one board: the pair joined and measured, then the
       y halves of both labels light (they match), then the x halves
       (they do not), then the subtraction itself — 6 first, then 2, in
       the order it is read. Nothing is asked here; it is the reason
       behind the counting they have just done twice. */
    /* From here to the end of the argument the board is read rather
       than counted, so the ruling, the axes and their numbers fall back
       and the pair, its coordinates and the working come forward. The
       beats that ASK — 8, 13, 14, 19 — keep the board at full strength:
       a child counting squares needs to see them. */
    { id: 9, line: 'Did you notice?',
      entrance: 'stay', layout: 'board', quietBoard: true,
      /* The very pair screen 8 asked about, not a fresh one. The whole
         of this argument is "look at what you just measured, and see
         where the answer came from" — which only works if it is
         actually what they measured. Changing the numbers under them
         between the question and its explanation made this read as a
         second, unrelated example. */
      /* This beat plots the pair itself rather than keeping screen 8's.
         Keeping it looked tidier — the same points, no rebuild — but
         nothing on the measure screen before this one ever reveals the
         coordinate labels, so a kept segment arrived with its labels
         still at opacity 0 and the whole argument ran over an empty
         board. Replotting is what puts them on screen.

         The parts are split out here because the three beats that
         follow light the x and y halves separately; without them there
         is nothing for the highlight to take hold of.

         No length is written. The beats that follow build the argument
         that arrives at it, and the last of them works it out on the
         board — stating the answer first would make the argument a
         restatement of something already on screen. */
      segment: {
        a: { x: 3, y: 2,
             coordParts: [{ t: '(' }, { t: '3', glow: 'x' }, { t: ',\u00A0' },
                          { t: '2', glow: 'y' }, { t: ')' }] },
        b: { x: 6, y: 2,
             coordParts: [{ t: '(' }, { t: '6', glow: 'x' }, { t: ',\u00A0' },
                          { t: '2', glow: 'y' }, { t: ')' }] },
        // the working happens over the line; see screen 8
        coordSide: 'under'
      } },

    { id: 10, line: 'The y-coordinates are the same.',
      entrance: 'stay', layout: 'board', keepSegment: true, quietBoard: true,
      highlight: { part: 'y' } },

    { id: 11, line: 'So, the distance is the difference between the x-coordinates.',
      entrance: 'stay', layout: 'board', keepSegment: true, quietBoard: true,
      highlight: { part: 'x' } },

    /* 6 first, then 2 — the order the subtraction is read in, so the
       two numbers light as she says them rather than together. */
    { id: 12, line: '6 - 3 = 3',
      entrance: 'stay', layout: 'board', keepSegment: true, quietBoard: true,
      /* She says it; the board works it out. The balloon is left shut on
         purpose — a bubble reading "6 - 3 = 3" beside a board building
         that very sum is the answer twice over, and the built one is the
         half that teaches. No `highlight` here: the sequence does all of
         its own lighting, in its own order. */
      voiceOnly: true, xEquation: true, hold: XEQ_HOLD },

    { id: 13, line: 'What is the distance between two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: 4, y: 3 }, b: { x: -3, y: 3 } , dash: true},
      task: { kind: 'distance',
              tryAgainLine: 'Not quite! Try again!',
              /* Missed twice: shown instead of told. */
              countLine: 'Now let’s count the units.' } },

    { id: 14, line: 'What is the distance between two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: 1, y: 2 }, b: { x: 1, y: -3 } , dash: true},
      task: { kind: 'distance',
              tryAgainLine: 'Not quite! Try again!',
              /* Missed twice: shown instead of told. */
              countLine: 'Now let’s count the units.' } },

    /* ---- and the same argument for a column. After the first vertical
       question the y-axis gets what the x-axis got: this time the x
       halves are the ones that match, so the distance is the difference
       of the y halves, and the subtraction reads 2 - (-3). */
    { id: 15, line: 'Did you notice?',
      entrance: 'stay', layout: 'board', quietBoard: true,
      segment: {
        a: { x: 1, y: -3,
             coordParts: [{ t: '(' }, { t: '1', glow: 'x' }, { t: ',\u00A0' },
                          { t: '-3', glow: 'y' }, { t: ')' }] },
        b: { x: 1, y: 2,
             coordParts: [{ t: '(' }, { t: '1', glow: 'x' }, { t: ',\u00A0' },
                          { t: '2', glow: 'y' }, { t: ')' }] }
        /* No length here — screen 18 works it out on the board and
           writes it beside the line itself. */
      } },

    { id: 16, line: 'The x-coordinates are the same.',
      entrance: 'stay', layout: 'board', keepSegment: true, quietBoard: true,
      highlight: { part: 'x' } },

    { id: 17, line: 'So, the distance is the difference between the y-coordinates.',
      entrance: 'stay', layout: 'board', keepSegment: true, quietBoard: true,
      highlight: { part: 'y' } },

    /* She says it; the board works it out — the column twin of screen
       12. The 2 is taken first, out of (1, 2), then the -3, the order
       the points are read down the column. The balloon stays shut and
       the sequence does its own lighting, so no `highlight` here. */
    { id: 18, line: '2 - (-3) = 5',
      entrance: 'stay', layout: 'board', keepSegment: true, quietBoard: true,
      voiceOnly: true, xEquation: true, hold: XEQ_HOLD },

    { id: 19, line: 'What is the distance between two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: -2, y: 3 }, b: { x: -2, y: 1 } , dash: true},
      task: { kind: 'distance',
              tryAgainLine: 'Not quite! Try again!',
              /* Missed twice: shown instead of told. */
              countLine: 'Now let’s count the units.' } },

    /* ---- 20-21: the recall, immediately before the ground moves.

       Two beats, neither of them a question. The child has just worked
       through a row and a column; these put both back in front of them
       finished — the pair, its coordinates, and the length written on
       the line — one after the other. That is the whole job: the next
       screen shows a pair that answers to neither method, and it can
       only land as a problem if both methods are still in mind when it
       arrives. Recalled first, broken second, rebuilt third.

       They are shown rather than asked deliberately. Asking again here
       would test what was just tested and spend the child's attention
       before the part that needs it; seeing a solved case costs one
       breath and leaves the question that follows the only thing on
       the board worth thinking about.

       The pairs are the very ones they worked: (3,2)-(6,2) is the row
       from screen 9 and the argument on 10-12, and (1,-3)-(1,2) is the
       column from 14 and the argument on 15-18. Fresh numbers here
       would read as new examples rather than as their own. */
    { id: 20, line: 'We know how to find horizontal distance.',
      entrance: 'stay', layout: 'board', hold: EXAMPLE_HOLD,
      /* Two pairs on one board: the furniture steps back so they read as
         the subject rather than as more lines among the ruling. */
      quietBoard: true,
      /* The same row the argument worked, laid out the way it laid it
         out: the coordinates under their points, and the length over
         the line, where the working left it. */
      segment: { a: { x: 3, y: 2 }, b: { x: 6, y: 2 },
                 coordSide: 'under',
                 result: { text: '3\u00A0units', dy: -28 } },
      /* The other row they measured — screen 13's question, with the
         answer they gave it. Its middle sits all but on the y-axis, so
         the length goes above its own line, the side the count-out used
         there, and far enough right to clear the axis numbering. */
      examples: [ { a: { x: 4, y: 3 }, b: { x: -3, y: 3 },
                    result: { text: '7\u00A0units', dy: -48, dx: 66 } } ] },

    /* Beside the line and lifted off its middle, the same as screen 15
       writes this very pair: the column straddles the x-axis, so the
       midpoint the length would otherwise take is the row the axis
       numbers live in. */
    { id: 21, line: 'And vertical distance.',
      entrance: 'stay', layout: 'board', hold: EXAMPLE_HOLD, quietBoard: true,
      segment: { a: { x: 1, y: -3 }, b: { x: 1, y: 2 },
                 result: { text: '5\u00A0units', dy: -117, dx: 108 } },
      /* The other column they measured — screen 19's question. Its
         length goes beside its own line on the far side from the pair
         next to it, level with its own middle. */
      examples: [ { a: { x: -2, y: 3 }, b: { x: -2, y: 1 },
                    result: { text: '2\u00A0units', dy: 0, dx: -84 } } ] },

    /* 12 — leaves sweep again and the scene goes back to the field
       layout of screen 5: board on the right, Swifty standing on the
       left, and no slider. The segment is diagonal this
       time, so counting whole squares no longer works — which is the
       point she is about to make.

       The board does the whole of it before she arrives: the diagonal
       is drawn, then the run across to C is dropped from it, and only
       then does she fly in and say her line. She is remarking on a
       picture that is finished, rather than talking over one being
       made — which is also why she is given the flight to arrive in
       and does not simply appear. */
    { id: 22, line: 'This one’s different.', entrance: 'fly',
      layout: 'grid', transition: 'leaves',
      /* Named here rather than three screens on. They are called A and B
         from the moment the question about them is asked, and a pair
         that gains its letters later reads as two different pairs — the
         one she wondered about, and the one the triangle is built on. */
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      legs: [ { from: { x: 2, y: 1 }, to: { x: 6, y: 1 },
                dash: true, mark: { name: 'C' } } ] },

    // 13 — same board and same segment, she just carries on talking
    /* The board pushes in here, on the first quadrant the triangle sits
       in, and stays pushed in while the triangle is being measured. */
    { id: 23, line: 'Can the grid help?', entrance: 'stay',
      layout: 'grid', keepSegment: true, view: 'triangle', quietBoard: true },

    /* 14 — leaves again, back to the board layout with the slider.
       The diagonal is redrawn and a corner C is dropped from it, so
       the horizontal step A-C can be measured on its own. The answer
       is that leg, not the diagonal, so the task measures from it. */
    /* Same grid, same points, same leg. Nothing here is new to look at:
       A, B and the run across to C are all already on the board the
       child is reading, so the leg is marked settled and only the
       question arrives. */
    { id: 24, line: 'How far apart are A and C?', entrance: 'none',
      layout: 'board', distance: true, intro: 'measure', keepSegment: true,
      view: 'triangle', quietBoard: true,
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      legs: [ { from: { x: 2, y: 1 }, to: { x: 6, y: 1 },
                settled: true, mark: { name: 'C' } } ],
      task: {
        kind: 'distance',
        measureLeg: 0,        // A to C, not A to B
        // no count-out here: a nudge to look at the spaces instead
        tryAgainLine: 'Not quite! Check the spaces between the units.'
      } },

    /* 15 — the board is kept exactly as it was. The first leg is
       already drawn, so it only gains its length, and the second leg
       rises from the corner to B. */
    { id: 25, line: 'How far apart are C and B?', entrance: 'none', view: 'triangle', quietBoard: true,
      layout: 'board', distance: true, intro: 'measure', keepSegment: true,
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      legs: [
        { from: { x: 2, y: 1 }, to: { x: 6, y: 1 }, mark: { name: 'C' },
          settled: true, length: true },
        { from: { x: 6, y: 1 }, to: { x: 6, y: 4 } }
      ],
      task: {
        kind: 'distance',
        measureLeg: 1,        // C to B
        tryAgainLine: 'Not quite! Check the spaces between the units.'
      } },

    /* 16 — leaves, then the whole shape redrawn as one closed red
       triangle with both legs measured. Nothing to answer here, so no
       slider: she is just naming what they have built. */
    /* Still the same grid: the triangle is the two legs they have just
       measured, not a new drawing. */
    { id: 26, line: 'Look! We made a triangle.', entrance: 'stay', view: 'triangle', quietBoard: true,
      layout: 'board', keepSegment: true,
      /* No highlight here. This screen and the one after it show the
         same triangle on the same board, so lighting it on both made
         one moment look like it was happening twice. It belongs to the
         question — move `pulse: 'triangle'` up here and off screen 25
         to have it land on "Look! We made a triangle." instead. */
      hold: 3400,
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      legs: [
        { from: { x: 2, y: 1 }, to: { x: 6, y: 1 }, mark: { name: 'C' }, length: true },
        { from: { x: 6, y: 1 }, to: { x: 6, y: 4 }, length: true }
      ] },

    /* 17 — same triangle, now named. The slider is replaced by the
       three triangle types; the square corner at C makes it a
       right-angled triangle. */
    { id: 27, line: 'What kind of triangle is it?', entrance: 'stay',
      layout: 'board', keepSegment: true,
      /* The same three sides light as she asks — she is asking about
         the shape, so the shape says which lines she means. No hold
         needed here: an open question keeps the screen anyway. */
      pulse: 'triangle',
      options: [
        { key: 'scalene',      cls: 'scalene',      label: 'Scalene Triangle' },
        { key: 'isosceles',    cls: 'isosceles',    label: 'Isosceles Triangle' },
        { key: 'right-angled', cls: 'right-angled', label: 'Right-angled Triangle' }
      ],
      task: {
        kind: 'choice',
        answer: 'right-angled',
        /* Heard, not read: the panel's border has gone red, so a
           balloon spelling that out again is one more thing to sit
           through. */
        tryAgainLine: 'Try again!',
        voiceOnly: true
      } },

    /* 18 — same triangle again, now asking how to reach the third
       side. Same panel, different three answers. */
    { id: 28, line: 'We know two sides. How can we find the third?',
      entrance: 'stay', layout: 'board', keepSegment: true,
      /* The third side is the one she is asking about, so it lights
         while she asks — and the answers stay off until she has, or
         they are being read instead of the board. */
      pulse: 'ab',
      askFirst: true,
      options: [
        { key: 'area',       label: 'Area' },
        { key: 'perimeter',  label: 'Perimeter' },
        { key: 'pythagoras', label: 'Pythagoras' }
      ],
      task: {
        kind: 'choice',
        answer: 'pythagoras',
        /* One rung, spoken and not shown — so a second wrong answer
           spends the ladder and the working appears, which is the two
           attempts the rest of the game allows before it counts out
           loud. */
        feedback: ['Try again!'],
        voiceOnly: true,
        /* Shown on a correct answer, or after the hints are spent. */
        /* The working, tagged to the board. Every part that names a
           length carries the side it belongs to — 'h' the horizontal,
           'v' the vertical, 'ab' the line between the two points — and
           the panel lights them one at a time, lighting that side of
           the triangle as it goes. */
        formula: [
          { kind: 'lead', parts: [
              { t: 'AB\u00B2', lit: 'ab' }, { t: ' = ' },
              { t: '4\u00B2', lit: 'h' }, { t: ' + ' }, { t: '3\u00B2', lit: 'v' } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '16', lit: 'h' }, { t: ' + ' }, { t: '9', lit: 'v' } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '25', lit: 'ab' } ] },
          { kind: 'result', parts: [
              { t: 'AB = ' }, { t: '5\u00A0units', lit: 'ab' } ] }
        ]
      } },

    /* 19-20 — the method used straight away on two fresh triangles,
       both already drawn. Only the coordinates are given: no side
       lengths, so the legs have to be read off the grid before
       Pythagoras can be applied. Both are Pythagorean triples, so the
       answer comes out whole — 3-4-5 first, then the same shape
       doubled to 6-8-10. */
    { id: 29, line: 'Use the right triangle to find AB.', range: { min: 0, max: 12 }, entrance: 'none',
      layout: 'board', transition: 'leaves', intro: 'measure', entry: true,
      segment: { a: { x: -2, y: 2, name: 'A' },
                 b: { x:  2, y: 5, name: 'B' } , dash: true},
      legs: [
        { from: { x: -2, y: 2 }, to: { x: 2, y: 2 }, mark: { name: 'C' } },
        { from: { x:  2, y: 2 }, to: { x: 2, y: 5 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 5,
              correctLine: 'That\u2019s right!',
              /* The one length on this board that cannot be counted off
                 the grid — which is the whole lesson — so nothing is
                 walked out along AB. */
              noCount: true,
              feedback: [
                'Not quite. Check your working and try again.',
                'Use the right triangle to find AB.'
              ],
              /* Still wrong after both: it is shown rather than asked a
                 fourth time — each side measured on the board, then the
                 working written out in the panel. */
              showWorking: true,
              /* And the working itself, in the panel — the same shape
                 as the one the method screen shows, with this
                 triangle's own numbers. Each part names a side and
                 lights it. */
              formula: [
                { kind: 'lead', parts: [
                    { t: 'AB\u00B2', lit: 'ab' }, { t: ' = ' },
                    { t: '4\u00B2', lit: 'h' }, { t: ' + ' }, { t: '3\u00B2', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '16', lit: 'h' }, { t: ' + ' }, { t: '9', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '25', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'AB = ' }, { t: '5\u00A0units', lit: 'ab' } ] }
              ], } },

    { id: 30, line: 'What is the distance between two points?', range: { min: 0, max: 12 }, entrance: 'none',
      layout: 'board', transition: 'leaves', intro: 'measure', entry: true,
      segment: { a: { x: -3, y:  3, name: 'A' },
                 b: { x:  5, y: -3, name: 'B' } , dash: true},
      legs: [
        { from: { x: -3, y: 3 }, to: { x: 5, y:  3 }, mark: { name: 'C' } },
        { from: { x:  5, y: 3 }, to: { x: 5, y: -3 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 10,
              correctLine: 'That\u2019s right!',
              noCount: true,
              // the same ladder as the screen before it
              feedback: [
                'Not quite. Check your working and try again.',
                'Use the right triangle to find AB.'
              ],
              showWorking: true,
              /* And the working itself, in the panel — the same shape
                 as the one the method screen shows, with this
                 triangle's own numbers. Each part names a side and
                 lights it. */
              formula: [
                { kind: 'lead', parts: [
                    { t: 'AB\u00B2', lit: 'ab' }, { t: ' = ' },
                    { t: '8\u00B2', lit: 'h' }, { t: ' + ' }, { t: '6\u00B2', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '64', lit: 'h' }, { t: ' + ' }, { t: '36', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '100', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'AB = ' }, { t: '10\u00A0units', lit: 'ab' } ] }
              ], } },

    /* 21 — leaves, back to the field layout, and the same idea stated
       in general: the points are named rather than numbered. */
    { id: 31, line: 'The same idea works for any two points.', entrance: 'fly',
      layout: 'grid', transition: 'leaves',
      segment: {
        a: { x: -5, y: 1, coordText: '(x1, y1)' },
        b: { x:  5, y: 4, coordText: '(x2, y2)' }
      } },

    /* 22 — the same general segment, with the corner dropped and both
       legs drawn: the right-angled triangle in its general form. The
       corner is named from the two points' own coordinates. */
    { id: 32, line: null, entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)' }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' } },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 } }
      ] },

    /* 23 — the horizontal leg is named. Nothing is redrawn; it only
       gains its length, written as the difference rather than a
       count of units. */
    { id: 33, line: 'AC = x2 - x1', entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)' }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x2 - x1' },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 }, settled: true }
      ] },

    /* 24 — and now the vertical leg is named too, so both differences
       are on the board together. */
    { id: 34, line: 'CB = y2 - y1', entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordText: '(x1, y1)' },
        b: { x:  5, y: 4, name: 'B', coordText: '(x2, y2)' }
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
    { id: 35, line: 'Now, let’s find AB.', entrance: 'stay',
      layout: 'grid', keepSegment: true },

    /* 26 — leaves, then the result on its own: board to the left, the
       working beside it, and nobody in shot. */
    { id: 36, line: null, entrance: 'none',
      layout: 'recap', transition: 'leaves', keepSegment: true,
      /* The formula the whole lesson has been building to. Nothing is
         said over it, and the ordinary silent beat is 900ms — which
         took it away before the last line had been read. Three lines
         written on at 1500 apart finish around 5.6s in, and this leaves
         four clear seconds after that. Next is armed throughout, so it
         is a chance to look, not a wait. */
      hold: 6600 },

    /* 27-28 — leaves, then back to the opening arrangement: no board,
       no panels, Swifty alone in the field. */
    { id: 37, line: 'And that gives us the distance between any two points!',
      entrance: 'fly', transition: 'leaves' },

    { id: 38, line: 'What if both points are on the x-axis?', entrance: 'stay' },

    /* 29 — the x-axis case worked through: the general formula narrows
       to |x2 - x1| as the y terms fall away. She says which case it is
       from her own bubble, standing beside the board. */
    { id: 39, line: 'Both points are on the x-axis.', entrance: 'stay',
      layout: 'xaxis', transition: 'leaves',
      /* The working runs for ten seconds after she has finished saying
         which case it is, and the ordinary 1500 took the screen away
         two steps in — the x terms never fell away and |x2 - x1| was
         never reached. The y-axis screen only escaped this by being
         the last one, where nothing advances. */
      hold: 7800 },

    /* 30 — leaves again, and the same empty field as 25: board and
       working left behind, Swifty flying back in alone to put the next
       question. */
    { id: 40, line: 'And what if they’re on the y-axis?',
      entrance: 'fly', transition: 'leaves' },

    /* 31 — the same working as 27 with the axes swapped: the x terms
       are the pair that falls away this time. */
    { id: 41, line: 'Both points are on the y-axis.', entrance: 'stay',
      layout: 'yaxis', transition: 'leaves' }
  ];

  return {
    STAGE_W, STAGE_H, ART, SHEETS, SHEET_W, SHEET_H,
    SWIFTY, CHAR_SCALE, ANCHOR, HEAD_TOP, FEET_DY, SHADOW, CLOUD,
    S5_ORIGIN, GRID, STAND, S8_ORIGIN, BOARD, RECAP, XAXIS, YAXIS,
    BUBBLE, PLAY, START, AUDIO, AUTO, SCRIPT
  };
})();

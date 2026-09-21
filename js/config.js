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
    /* The title screen's arrival and departure. The filename's stray
       space is the file's own — renaming art silently breaks the page
       that asks for it, so the name is copied exactly. */
    swiftyRocket: 'assets/rocket swifty.png',
    swiftyHop:   'assets/get of swifty .png',
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
     THE ROCKET, on the title screen only.

     Two more sheets, and they are a different kind of sheet: eight
     frames in one row of even 271.5 x 724 cells, drawn consistently
     inside those cells. So they are played as a plain strip — one
     rect and one anchor for the whole sheet — rather than measured
     pose by pose. The poses in `fly` and `talk` need that treatment
     because they bleed past their cells and sit at two different
     heights; these do not.

     `k` is how much bigger this sheet's art is than the talk sheet's,
     so that SHE comes out the same size in all four. She is drawn
     smallest in the rocket and grows as she climbs out and steps
     forward, which is the artist's own perspective and is kept: the
     numbers below only line the four sheets up with each other at the
     two places they hand over.

     Measured off the alpha: her head is 246px across standing, 168 in
     the last rocket frame, 229 in the first get-off frame and 262 in
     the last. So the rocket is scaled to meet get-off's first frame,
     and get-off is scaled to meet the standing pose at its last. */
  const strip = function (src, n, sw, sh, k, fps, ax, ay) {
    const cw = sw / n, out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: i * cw, y: 0, w: cw, h: sh, ax: i * cw + ax, ay: ay });
    }
    return { src: src, fps: fps, sw: sw, sh: sh, k: k, frames: out };
  };
  SHEETS.rocket = strip(ART.swiftyRocket, 8, 2172, 724, 1.280, 12, 108.1, 462.8);
  SHEETS.hop    = strip(ART.swiftyHop,    8, 2172, 724, 0.939, 11, 138.0, 556.0);
  /* The two original sheets, said the same way, so the sprite can ask
     any sheet for its own size instead of assuming one. */
  SHEETS.fly.sw = SHEET_W;  SHEETS.fly.sh = SHEET_H;  SHEETS.fly.k = 1;
  SHEETS.talk.sw = SHEET_W; SHEETS.talk.sh = SHEET_H; SHEETS.talk.k = 1;

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
    /* Her feet come out at cy + height/2, so this number is really
       "where she stands". The new painting puts the shoreline at
       y 956 under her — measured off the art, not guessed — and 600
       left her feet at 720, which is two hundred pixels out over the
       water. 855 puts them at 975, a little way into the grass and
       above the board screens' own 1000, which is right: she is
       smaller here, so she is further away and stands higher up the
       slope. */
    cy: 855,
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
    /* Numbered every unit. The wide board cannot be — see `ranges`. */
    labelEvery: 1,

    /* Two boards, and a screen picks one.

       A rescue twelve units below the origin does not fit on a plane
       that stops at five, and the tempting fix — worth more than one
       unit a cell — is the wrong one: a point that lands between
       gridlines cannot be counted to, and counting off the board is
       this whole lesson's method. So a unit is always a cell; only the
       cell gets smaller.

       `wide` is `close` at two fifths, which keeps the cells square
       (both steps scale by the same factor, so their ratio is
       untouched) and leaves the origin exactly where it was, at the
       middle of the viewBox — so nothing that measures from the panel
       moves. Numbered every five, because thirty-one numbers along an
       axis is a wall of digits rather than a scale.

       y stops short of x for the same reason it does on `close`: the
       board is wider than it is tall and the cells are square, so a
       symmetric range is height-limited. The overshoot and arrowhead
       come down with the cells, or the head alone would be most of a
       numbered interval. */
    ranges: {
      close: { k: 1,   xFrom: -6,  xTo: 6,  yFrom: -5,  yTo: 5,
               every: 1, labelSize: 36, overshoot: 58,
               arrow: { len: 34, halfW: 20 },
               gxFrom: -7, gxTo: 7, gyFrom: -6, gyTo: 6 },
      /* Between the two, for a shape that is too big for the lesson's
         own plane and too small to be lost on the rescue's. Still
         numbered every unit — at 53px a cell there is room for all
         twenty-one numbers, and a board a child can count on is worth
         more than a tidy axis. */
      mid:   { k: 0.6, xFrom: -10, xTo: 10, yFrom: -8,  yTo: 8,
               every: 1, labelSize: 30, overshoot: 40,
               arrow: { len: 26, halfW: 15 },
               gxFrom: -11, gxTo: 11, gyFrom: -10, gyTo: 10 },
      wide:  { k: 0.4, xFrom: -15, xTo: 15, yFrom: -13, yTo: 13,
               every: 5, labelSize: 26, overshoot: 30,
               arrow: { len: 22, halfW: 13 },
               gxFrom: -17, gxTo: 17, gyFrom: -15, gyTo: 15 }
    },

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
      /* How far a length written on a pair keeps off the line it
         measures — the same air a coordinate keeps off its dot, so the
         three things written on a segment all sit the same distance
         from it — and how much of the span it must leave at each end
         when it has to step along the line to clear an axis. */
      resGap: 5,
      resInset: 10,
      /* The paper halo every label on the board is painted with
         (`stroke-width` in the stylesheet). Stroked outside the
         glyphs, so it is half of this again on each side — and
         it is part of what the child sees, so it is part of what
         is measured when a label is placed. */
      haloW: 6,
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
      /* The air between a point as it is painted — dot plus its
         white ring — and the ink of its own coordinates. Small on
         purpose: the numbers are part of the point, not a remark
         near it, and the label carries its own paper halo, so a
         few pixels read as touching rather than as crowding.
         `coordFit` is the older, looser figure, kept for the one
         question it still answers: whether a row's labels have
         room beside their points at all. Deciding that on the new
         air would move pairs that read properly today.

         Nine, not three. Three was chosen while the offset was
         applied on each axis at once, so a DIAGONAL label — which is
         the direction a label reaches for first, because it is the
         one that keeps clear of the drawing — actually landed at
         `gap × √2`, about nine past the painted edge. The cardinals
         got the literal three and were rarely chosen, so nobody saw
         it. Measuring to the ink made all eight honest and the
         diagonals lost six pixels overnight, which is A sitting on
         its own dot. This is the number they were really getting. */
      coordGap: 9,
      /* The air between a point's letter and the coordinate under it.
         They are one block, so this is leading rather than a gap
         between two labels — tight enough that the two read as one
         thing and loose enough that the descenders clear. */
      stackGap: 2,
      coordFit: 8,
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
      /* The square drawn in the corner once the triangle has been
         named — a third of a cell, inside the angle, in the corner's
         own colour. */
      rightAngle: 0.28,
      rightAngleW: 4,
      /* The corner's coordinates sit beside it at the same measured air
         a plotted point keeps from its own — `GRID.segment.coordGap`
         off the dot as painted, whatever the label is and whatever
         size the camera is setting it. There used to be a fixed 84
         here, which is a distance to a label's MIDDLE and so a
         different gap for every label. */
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
      /* Along a vertical leg, off its middle towards the corner it
         starts from — the far end of that side carries the other
         point's coordinates. Kept small: the leg's length now sits
         INSIDE the shape, where the hypotenuse closes in on it, so a
         big bias either walks it into that line or down onto the
         corner's own coordinates. */
      lenBiasV: 16
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
    /* A working written on the paper rather than in a panel beside it.

       The board comes to the middle of the frame, pushes in on what is
       drawn AND on the room the working needs, and the lines are
       written in the half the drawing is not in. A panel beside a
       picture makes the child choose which to look at; on one sheet
       there is nothing to choose. */
    work: {
      /* In the same units as a coordinate label, and set through the
         camera the same way — so it is the size it is meant to be on
         the stage whatever the board has pushed in to. The working is
         the subject of the screen, so it is the largest type on the
         board. */
      size: 30,
      lineGap: 1.25,     // cells between one line and the next
      pad: 0.45,         // cells of air inside the writing column
      /* How much room the working needs beside the drawing, as a
         multiple of the drawing's own width. One means "as much again",
         which puts the triangle in one half and the writing in the
         other. */
      room: 1.15,
      lineMs: 1500,      // one line, read, before the next
      beatMs: 820,       // and one named part after the last
      barW: 3,           // the radical's overbar
      barGap: 0.30       // and how far above the digits it sits, in ems
    },

    /* A number leaving the board for a working. The board's own sum
       (`xeq` below) has flown its digits since it was built; these are
       the same two beats, for the flights that have to cross from the
       board into the panel. */
    fly: {
      pickMs: 340,       // it lights where it is, before it is lifted
      ms: 760            // and travels
    },

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
      /* Cells of air above whatever is topmost — the higher point, or
         its coordinates where they are written over it. Closer than it
         was: with the row's coordinates moved under its points, the sum
         was left hanging a cell and a half over an empty space. Not
         closer still, though — the answer has to be seen coming DOWN
         from it to the line afterwards. */
      stageUp: 0.85,
      /* A column works its sum below the x-axis rather than over its top
         point: how far under the axis numbering it sits, and how far off
         the column itself. */
      underDown: 0.55,
      underGap: 0.35,
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

      /* The guided count, shown to a child who has missed twice: the
         squares light one at a time with the running number under
         each, and then it clears and plays again. Paced to be counted
         along with out loud, not to be watched. */
      count: {
        slots: 14,         // the longest span any screen asks about
        stepMs: 430,       // one square, then the next
        readMs: 900,       // the finished row, held to be read
        gapMs: 420,        // blank, before it goes again
        /* Once. It used to play twice, and the second pass was
           doing the job the sentence should have been doing — the
           first time through "says what is happening" only because
           the sentence arrived underneath it. She says it and
           finishes now, so there is nothing left for a second pass
           to say. */
        passes: 1,
        numSize: 30
      },
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
      /* Under the point, matching the pair the argument goes on to make
         of these two: the space above a plotted pair is where its length
         and its working are written, so the coordinates keep out of it
         from the moment the child taps them out. */
      side: 'under',
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
    /* No yGlowMs any more: the matching halves are not lit again here,
       so the sequence opens on the first digit being taken. */
    return 2 * (x.pickMs + x.flyMs) + x.settleMs +
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

  /* And a perch on ONE of the answers rather than on the panel's middle.
     The closing question puts its two cafes side by side and she lands
     on the right-hand one, so the pose is seated on that button's own
     top edge: the panel is at (34, 680) and drawn at 0.73, its border
     and padding put a button top 37 natural units down (707 on the
     stage), and the right button's centre is 377.5 natural units in
     (309 on the stage). Her feet are 264 below this pose's top and
     183 in from its left, so those two numbers are these two less. */
  const STAND_PERCH = standAt(0.88, 126, 443);

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
      /* The combination-lock widget's own natural size — a frame 660
         wide with a round arrow overhanging each end, and GO under its
         foot. Scaled so it keeps the width it has always had in her
         column, and set so she still lands on the frame's own top edge:
         the art's body starts 4.5% down (the pointer is cut into that
         edge rather than standing above it), which at this scale is
         12px, and her feet are at 700. */
      /* x is pulled back by the extra overhang the widget now reserves
         for its left arrow, so the frame itself has not moved. */
      pos: { x: 29, y: 688 },
      w: 816, h: 520,
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

    /* The ruler, in the same column as the reel and at the same width
       as the answers. It is shorter than the reel's housing, so it sits
       a little lower and she still lands on its own top edge. */
    slider: { pos: { x: 34, y: 700 }, w: 520, h: 330, scale: 0.73 },
    /* The substitution panel: her column, and the answers' own seat, so
       she stands on its top edge exactly as she stands on theirs. */
    slots:  { pos: { x: 34, y: 680 }, w: 520, h: 420, scale: 0.73 },

    /* Where the working goes once the answers have gone: the middle of
       her column rather than the foot of it. A worked solution is the
       whole screen for as long as it is being written, so it takes the
       middle and nothing stands on it until it is finished. */
    /* Drawn at its natural size — the type inside was designed at these
       numbers, so anything under 1 is shrinking a solution that is the
       only thing on its half of the screen. 520 wide from x 34 leaves
       46px to the board's edge. */
    working: { pos: { x: 34, y: 390 }, scale: 1, stand: STAND_WORK },

    /* Where she stands when a screen names a perch — one of the answer
       buttons rather than the panel as a whole. */
    perch: STAND_PERCH,

    /* And the answer pad takes the same column again, for the
       questions whose answer is typed rather than chosen. */
    entry: { pos: { x: 30, y: 115 }, w: 520 }
  };

  /* -------------------------------------------------------------
     THE TOWN — the closing beat's map

     Three places standing on three coordinates. The dots and the
     coordinate labels under them are the board's own, plotted by the
     segment and by a marked place; everything here is the picture
     drawn over them — a building and the pill that names it.

     The coordinates are load-bearing and two properties of them must
     survive any edit:

       * Cafe B is on the house's own row, so its distance can be
         counted straight off the grid without the formula. That is
         what makes it the tempting wrong answer.
       * Cafe A makes a 3-4-5 triangle with the house, so the right
         answer is a whole 5 and a child who works it out properly can
         see that they are right.

     The reference art put these at (2,3), (6,6) and (-4,3). This board
     rules to y = 6 but only numbers to 5, and a place standing on an
     unnumbered line cannot be checked by the child reading it — so the
     town sits one square down and one square left of that. The two
     distances, 5 and 6, are unchanged.
     ------------------------------------------------------------- */
  const TOWN = {
    /* One row lower than the reference's shape would put them. A place
       is drawn standing ON its coordinate — building and name pill
       above the dot — so the top row of the board has no room for one:
       at y = 5 a cafe's roof is off the paper. At y = 4 it has two
       cells of headroom, which is what it needs. */
    house: { x:  1, y: 1 },
    cafeA: { x:  5, y: 4 },
    cafeB: { x: -5, y: 1 },
    /* And two more for the walk after it. The prompt asked for (-4,-2)
       and (4, 4); neither survives its own rule that a marker needs the
       room it stands in. A place is drawn standing ON its coordinate,
       a cell and a half wide and nearly two tall, so:

         * (4, 4) is one column from Cafe A on the same row, and two
           markers a cell apart overlap by half of one.
         * (-4, -2) rises into the x-axis numbering — a marker below
           the axis has to start at y = -3 to clear the row the numbers
           live in.

       Moved to a pair that keeps everything the beat is for: 8 across,
       6 up, a whole 10, and BOTH subtractions crossing zero — -3 - 5
       and 2 - (-4).

       And running the OTHER way. The first pair tried, (-5,-3) to
       (3,3), had the same gradient as the cafe walk and passed within a
       cell and a half of it: drawn together on the closing screen the
       two lines read as one long line, which is the opposite of what
       that screen is for. This one falls to the left where the cafe
       walk rises to the right, so "two walks" looks like two. */
    school: { x:  5, y: -4 },
    park:   { x: -3, y:  2 },
    /* What is drawn over each. `kind` picks the CSS building, `tone`
       the pill's colour — the same colour its answer button carries,
       so a child can pair the two without reading either. */
    /* Derived from the three coordinates above rather than written out
       again: a picture of a town standing one row off the points it is
       drawn over is what two lists of the same numbers gets you. */
    places: null,   // filled in below, from house / cafeA / cafeB
    /* A cell and a half across, two cells tall including the pill —
       big enough to be a place, small enough that the ruling under it
       is still something a child could count on. Both in cells, so the
       town grows and shrinks with the board rather than with the
       stage. */
    wCells: 1.5,
    hCells: 1.05,
    /* How far the building's foot sits above the dot it stands on, so
       the dot and the coordinates written under it are never covered.
       In cells, for the same reason. */
    liftCells: 0.16,
    fadeMs: 420
  };
  TOWN.places = [
    { key: 'cafeB',  x: TOWN.cafeB.x,  y: TOWN.cafeB.y,
      name: 'Café B',        kind: 'cafe',   tone: 'red' },
    { key: 'house',  x: TOWN.house.x,  y: TOWN.house.y,
      name: 'Maya’s House',  kind: 'house',  tone: 'violet' },
    { key: 'cafeA',  x: TOWN.cafeA.x,  y: TOWN.cafeA.y,
      name: 'Café A',        kind: 'cafe',   tone: 'teal' },
    /* Up from the closing beat: the same town, two more places in it.
       They are on the map from the first beat that uses them and stay
       for the last — a town that gains a building between one question
       and the next is a different town. */
    { key: 'school', x: TOWN.school.x, y: TOWN.school.y,
      name: 'School',             kind: 'school', tone: 'blue' },
    { key: 'park',   x: TOWN.park.x,   y: TOWN.park.y,
      name: 'Park',               kind: 'park',   tone: 'green' }
  ];

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
         coordParts: [{ t: '(x1, ' }, { t: '0', glow: 'y' }, { t: ')' }] },
    b: { x:  4, y: 0,
         coordParts: [{ t: '(x2, ' }, { t: '0', glow: 'y' }, { t: ')' }] },
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
         coordParts: [{ t: '(' }, { t: '0', glow: 'x' }, { t: ', y1)' }] },
    b: { x: 0, y:  4,
         coordParts: [{ t: '(' }, { t: '0', glow: 'x' }, { t: ', y2)' }] },

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
    betweenLines: 520,        // and between two things said on one beat
    afterCorrect: 2100,       // a question has been answered right
    afterSilent: 900,         // nothing was said; the screen just drew
    afterReveal: 3800,        // a worked solution, which takes reading
    /* And after a worked solution that wrote itself out line by line —
       long enough to read the whole thing back before it goes. */
    afterWorking: 4000,
    /* How long the answers are up on their own before she flies in to
       ask about them, on the one beat that puts them first. Long enough
       for a child to have read both and looked back at the board, short
       enough that nothing feels stuck. */
    perchMs: 1100
  };


  /* The navigation bar. `jump` is the screen picker beside Next — a way
     around the lesson rather than a part of it, kept here so a build
     that should not carry it switches it off in one place. */
  const NAV = { jump: true };

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
       them rather than letting them try.

       And she asks it shorter. Saying "locate the point" a second time
       teaches the instruction over again, when the only new thing on
       the screen is the point — so she says the point, and "now try"
       carries the rest: same task, your turn. */
    { id: 7, line: 'Now try (6, 2).', entrance: 'stay', hint: false,
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
        /* Under the points, the same as the located marks it is carried
           in from and the same as every beat that argues about it — so
           the labels the child put there never move. */
        coordSide: 'under',
        dash: true },

      /* `answer` is left out on purpose: the game measures it from the
         two points, so moving a point can never leave a stale answer
         behind. Set it explicitly only to override that. */
      task: {
        kind: 'distance',       // answered on the reel, not by tapping
        /* A wrong answer counts their number out on the board so the
           miss can be seen, and says this over it. */
        /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count the spaces between the two points.'
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
              /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count the spaces between the two points.' } },

    { id: 14, line: 'What is the distance between two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: 1, y: 2 }, b: { x: 1, y: -3 } , dash: true},
      task: { kind: 'distance',
              /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count the spaces between the two points.' } },

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
              /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count the spaces between the two points.' } },

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
    /* Half a sentence each. One line covering both, said on the second
       of them, was the old shape — and a whole sentence on each would
       indeed have said the same thing twice. Half a sentence does not:
       this beat names rows, the next names columns, and the two halves
       are one thought spoken across two pictures. "And vertical
       distance." cannot be read on its own, which is what keeps them
       from reading as two separate recollections. */
    { id: 20,
      line: 'We know how to find horizontal distance.',
      /* It says nothing, so nothing paces it but this: a spoken beat is
         held for as long as the words take and then some, and without
         them the rows would be up and gone before they had been looked
         at. */
      entrance: 'stay', layout: 'board', hold: EXAMPLE_HOLD + 1600,
      /* Two pairs on one board: the furniture steps back so they read as
         the subject rather than as more lines among the ruling. */
      quietBoard: true,
      /* The same row the argument worked, laid out the way it laid it
         out: the coordinates under their points, and the length over
         the line, where the working left it. */
      segment: { a: { x: 3, y: 2 }, b: { x: 6, y: 2 },
                 coordSide: 'under',
                 result: { text: '3\u00A0units' } },
      /* The other row they measured — screen 13's question, with the
         answer they gave it. No offsets on either: a length goes in the
         middle of the span it measures, and the board steps this one
         aside far enough to clear the y-axis numbering its own middle
         falls on — see showSegResult. */
      examples: [ { a: { x: 4, y: 3 }, b: { x: -3, y: 3 },
                    result: { text: '7\u00A0units' } } ] },

    /* Both lengths go where every length goes: the middle of the span
       it measures, out to the side of the line by the same air a
       coordinate keeps from its dot. This column straddles the x-axis,
       so its own middle is the row the axis numbers live in — the
       board slides it down its own line until it is clear of them, and
       no further. */
    { id: 21, line: 'And vertical distance.',
      entrance: 'stay', layout: 'board', hold: EXAMPLE_HOLD, quietBoard: true,
      segment: { a: { x: 1, y: -3 }, b: { x: 1, y: 2 },
                 result: { text: '5\u00A0units' } },
      // the other column they measured — screen 19's question
      examples: [ { a: { x: -2, y: 3 }, b: { x: -2, y: 1 },
                    result: { text: '2\u00A0units' } } ] },

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
    /* Both lines belong here. "Our earlier way won't work this time" is
       a statement about THIS pair, and this is the beat where the pair
       is introduced — it used to be merged into the question on 24.

       The warning that merged them was about a different thing: a HINT
       held across a screen change ("can the grid help?", then "how far
       apart are A and C?"). A statement about the problem is carried
       nowhere; the question on 24 stands on its own. */
    { id: 22, line: 'But what if two points are like this?',
      line2: 'Our earlier way won’t work this time.',
      pulse: 'ab', entrance: 'fly',
      layout: 'grid', transition: 'leaves',
      /* Named here rather than three screens on. They are called A and B
         from the moment the question about them is asked, and a pair
         that gains its letters later reads as two different pairs — the
         one she wondered about, and the one the triangle is built on. */
      /* A and B, and only A and B. The run across to C belongs to the
         beat that says to look at it — put here it answered a question
         the child has not been asked yet. */
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } } },

    // 13 — same board and same segment, she just carries on talking
    /* The board pushes in here, on the first quadrant the triangle sits
       in, and stays pushed in while the triangle is being measured. */
    /* 14 — leaves again, back to the board layout with the slider.
       The diagonal is redrawn and a corner C is dropped from it, so
       the horizontal step A-C can be measured on its own. The answer
       is that leg, not the diagonal, so the task measures from it. */
    /* Same grid, same points, same leg. Nothing here is new to look at:
       A, B and the run across to C are all already on the board the
       child is reading, so the leg is marked settled and only the
       question arrives. */
    /* The reason and the question in one breath. They used to be two
       beats — "can the grid help?", then "how far apart are A and C?" —
       which asked the child to hold a hint across a screen change. */
    /* Two sentences, and a light each: the two points, then the line
       between them. Naming the points and lighting the line in one
       breath answers the question in the act of asking it.

       It stays ONE screen. These were two beats once and were merged
       because two beats asked the child to hold a hint across a screen
       change; what splits here is the sentence and its highlighting,
       not the beat. One board, one question, one control. */
    { id: 24, line: 'But look at A and C.',
      line2: 'Can you find AC?',
      lineLights: [ { points: ['a', 'c'] }, { pulse: 'h' } ],
      entrance: 'none',
      layout: 'board', distance: true, intro: 'measure', keepSegment: true,
      view: 'triangle', quietBoard: true,
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      legs: [ { from: { x: 2, y: 1 }, to: { x: 6, y: 1 },
                dash: true, mark: { name: 'C' } } ],
      task: {
        kind: 'distance',
        measureLeg: 0,        // A to C, not A to B
        /* No retry, and the spaces counted rather than a nudge to go
           and count them — the same showing every other miss gets. */
        countLine: 'Count the spaces between the two points.'
      } },

    /* 15 — the board is kept exactly as it was. The first leg is
       already drawn, so it only gains its length, and the second leg
       rises from the corner to B. */
    /* "Great!" closes beat 4 before beat 5 opens, so the child knows the
       first answer was taken; "now find CB" says this is the same job
       again rather than a new one, which is the point — it is the
       vertical method they already have.

       And AC stays on the board while they do it, stepped back rather
       than cleared: they need to see they now have two measured sides,
       and the one being asked for has to be the loud one. */
    { id: 25, line: 'Great! Now find CB.', focus: 'v',
      entrance: 'none', view: 'triangle', quietBoard: true,
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
        // no retry; see screen 24
        countLine: 'Count the spaces between the two points.'
      } },

    /* 16 — leaves, then the whole shape redrawn as one closed red
       triangle with both legs measured. Nothing to answer here, so no
       slider: she is just naming what they have built. */
    /* Still the same grid: the triangle is the two legs they have just
       measured, not a new drawing. */
    /* The one question of these seven beats, and it is answerable from
       the screen — which is the whole reason it is here rather than on
       28. They built this right angle themselves two beats ago, by
       walking across and then up; naming it is reading the drawing, not
       recalling a word. And it is exactly the precondition for
       Pythagoras, so the question EARNS the theorem instead of guessing
       at it, which is what lets her simply tell them the theorem on the
       next beat.

       The panel was built for this: `triangle-options.js` carries these
       three as its own defaults and the game had stopped asking them. */
    { id: 26, line: 'Look! We\u2019ve made a triangle.',
      askFirst: true,
      /* No "Triangle" on any of them. Every card on the screen is a
         triangle, the word was in all three, and it told the child
         nothing about any of them — while taking up the room that
         kept the type at a size nobody could read from the back of a
         classroom. The names are what is being chosen between. */
      options: [
        { key: 'scalene',      cls: 'scalene',      label: 'Scalene' },
        { key: 'isosceles',    cls: 'isosceles',    label: 'Isosceles' },
        { key: 'right-angled', cls: 'right-angled', label: 'Right-angled' }
      ],
      task: {
        kind: 'choice',
        answer: 'right-angled',
        /* One rung, and it points at the evidence rather than at the
           answer. Wrong twice and she names it herself — nothing in
           this game is asked a third time. */
        feedback: ['Look at the corner at C.'],
        voiceOnly: true,
        correctLine: 'A right-angled triangle!',
        /* Missed twice, and the asking is over: the square goes into
           the corner and she reads it out, so the beat ends on the
           evidence rather than on a second helping of the same nudge. */
        spentLine: 'It\u2019s a right-angled triangle \u2014 see the square corner at C.',
        /* And the square goes in the corner as the answer lands: the
           evidence for the thing they just named. */
        marksRightAngle: true
      },
      entrance: 'stay', view: 'triangle', quietBoard: true,
      /* The three sides light as she names the shape. They used to light
         on the question after this one — and that question is gone, so
         the beat that says "triangle" is the one that should show which
         three lines it means. */
      pulse: 'triangle',
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

    /* No question here any more. It asked "how can we find the third
       side?" — Area, Perimeter, Pythagoras — which is not answerable
       from the screen: Pythagoras has not been taught in this lesson,
       so a child picks it by elimination, by recognising the word, or
       by guessing, and the answer teaches nothing because the question
       tested nothing.

       That question has moved to 26 and become one the child can
       actually answer. There is still exactly one question in these
       seven beats; it is just a better one. Here she simply says the
       theorem, which is the honest thing to do with a theorem they
       have not met, and the derivation follows on its own. */
    { id: 28,
      /* The working goes on the paper, not in a panel beside it: the
         board comes to the middle, pushes in on the drawing and the
         room the working needs, and writes it there. */
      stage: 'working',
      line: 'A right triangle! And we already know two of its sides.',
      line2: 'Pythagoras theorem can help us find the third!',
      entrance: 'stay', layout: 'board', keepSegment: true,
      /* The two known sides under the first line, the one she is about
         to find under the second — each played when its own sentence
         finishes. It used to be two clocks running past the words:
         `spotSeq` at a flat 700 and 1600ms, and `pulse` timed off the
         length of the FIRST line and started a fifth of the way into
         it, so AB lit 324ms into "we already know two of its sides". */
      lineLights: [ { spots: ['h', 'v'] }, { pulse: 'ab' } ],
      derive: {
        /* The working, tagged to the board. Every part that names a
           length carries the side it belongs to — 'h' the horizontal,
           'v' the vertical, 'ab' the line between the two points — and
           each lights that side as it lands. The two squares are read
           off the leg lengths, so they arrive from them; 16, 9 and 25
           are arithmetic and simply appear. */
        formula: [
          /* The theorem first, with no numbers in it at all. The
             working used to open on `AB² = 4² + 3²` — already
             substituted — so the one line the beat exists to teach
             was never written, and the line that followed could not
             read as a substitution because there was nothing above it
             to substitute into. */
          { kind: 'lead', parts: [
              { t: 'AB\u00B2', lit: 'ab' }, { t: ' = ' },
              { t: 'AC\u00B2', lit: 'h' }, { t: ' + ' },
              { t: 'CB\u00B2', lit: 'v' } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: '4\u00B2', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
              { t: '3\u00B2', lit: 'v', from: { leg: 1 } } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '16', lit: 'h' }, { t: ' + ' }, { t: '9', lit: 'v' } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '25', lit: 'ab' } ] },
          { kind: 'result', parts: [
              { t: 'AB = ' }, { t: '5\u00A0units', lit: 'ab', home: true } ] }
        ]
      } },

    /* 19-20 — the method used straight away on two fresh triangles,
       both already drawn. Only the coordinates are given: no side
       lengths, so the legs have to be read off the grid before
       Pythagoras can be applied. Both are Pythagorean triples, so the
       answer comes out whole — 3-4-5 first, then the same shape
       doubled to 6-8-10. */
    { id: 29,
      /* The working goes on the paper, not in a panel beside it: the
         board comes to the middle, pushes in on the drawing and the
         room the working needs, and writes it there. */
      stage: 'working', line: 'Use the right triangle to find AB.', range: { min: 0, max: 12 }, entrance: 'none',
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
                    { t: '4\u00B2', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
                    { t: '3\u00B2', lit: 'v', from: { leg: 1 } } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '16', lit: 'h' }, { t: ' + ' }, { t: '9', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '25', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'AB = ' }, { t: '5\u00A0units', lit: 'ab', home: true } ] }
              ], } },

    { id: 30,
      /* The working goes on the paper, not in a panel beside it: the
         board comes to the middle, pushes in on the drawing and the
         room the working needs, and writes it there. */
      stage: 'working', line: 'What is the distance between two points?', range: { min: 0, max: 12 }, entrance: 'none',
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
                    { t: '8\u00B2', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
                    { t: '6\u00B2', lit: 'v', from: { leg: 1 } } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '64', lit: 'h' }, { t: ' + ' }, { t: '36', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '100', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'AB = ' }, { t: '10\u00A0units', lit: 'ab', home: true } ] }
              ], } },

    /* 21 — leaves, back to the field layout, and the same idea stated
       in general: the points are named rather than numbered. */
    { id: 31, line: 'The same idea works for any two points.', entrance: 'fly',
      layout: 'grid', transition: 'leaves',
      segment: {
        a: { x: -5, y: 1, coordParts: [ { t: '(' }, { t: 'x1', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y1', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, coordParts: [ { t: '(' }, { t: 'x2', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y2', glow: 'y' }, { t: ')' } ] }
      } },

    /* 22 — the same general segment, with the corner dropped and both
       legs drawn: the right-angled triangle in its general form. The
       corner is named from the two points' own coordinates. */
    { id: 32, line: null, entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x1', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y1', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x2', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y2', glow: 'y' }, { t: ')' } ] }
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
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x1', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y1', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x2', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y2', glow: 'y' }, { t: ')' } ] }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x2 - x1',
          /* both symbols read straight off the two labels */
          lengthFrom: [ { p: 'b', half: 'x' }, { p: 'a', half: 'x' } ] },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 }, settled: true }
      ] },

    /* 24 — and now the vertical leg is named too, so both differences
       are on the board together. */
    { id: 34, line: 'CB = y2 - y1', entrance: 'stay',
      layout: 'grid', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x1', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y1', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x2', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y2', glow: 'y' }, { t: ')' } ] }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x2, y1)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x2 - x1',
          /* both symbols read straight off the two labels */
          lengthFrom: [ { p: 'b', half: 'x' }, { p: 'a', half: 'x' } ] },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 },
          settled: true, length: true, lengthText: 'y2 - y1',
          lengthFrom: [ { p: 'b', half: 'y' }, { p: 'a', half: 'y' } ] }
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
      layout: 'yaxis', transition: 'leaves' },

    /* ---- 42-46: the closer cafe.

       The only beat in the game that does not look like maths. Every
       screen before it speaks in A, B, C, legs and units, with the
       triangle already drawn — so the child can DO the formula when
       they are told to. Whether they know what it is FOR is a
       different question, and this is the one that asks it.

       Nothing here says distance, triangle or formula. There is a
       town, a house, two cafes, and a question a person would ask.
       Noticing that it is a distance question is the whole skill; the
       arithmetic after it they already have. That is why the points
       are plotted but not joined, carry no letters, and why the board
       stays quiet until she has been answered.

       42 asks. 46 closes it. 43, 44 and 45 are the way through for a
       child who missed twice, and a child who did not never sees them
       — `rightAt` steps over them. */
    { id: 42, entrance: 'fly', layout: 'board', transition: 'leaves',
      line: 'Maya wants to walk to the closer caf\u00E9. Which caf\u00E9 is closer to her house?',
      town: true,
      /* Plotted, not joined: a line between any two of them would say
         which pair the question is about, which is the question. */
      pointsOnly: true,
      /* Built in halves rather than as one run of text. Nothing looks
         different — it is the same label — but each half is then a node
         the board can point at, which is what lets screen 45 lift the
         numbers out of it into the working. A plain label has no halves
         to lift. */
      segment: { a: { x: 1, y: 1, coordParts: [ { t: '(' }, { t: '1', glow: 'x' },
                      { t: ',\u00A0' }, { t: '1', glow: 'y' }, { t: ')' } ] },
                 b: { x: 5, y: 4, coordParts: [ { t: '(' }, { t: '5', glow: 'x' },
                      { t: ',\u00A0' }, { t: '4', glow: 'y' }, { t: ')' } ] },
                 coordSide: 'under' },
      // the third place, plotted the same way and labelled the same way
      mark: [ { x: -5, y: 1 } ],
      /* The answers and the hint go up FIRST and she arrives after —
         the reverse of every other question in the game. The child
         looks at a town with two cafes in it and has begun to wonder
         before anyone says anything, so her line lands on a question
         they have already started asking themselves. */
      askLast: true,
      options: [
        { key: 'a', label: 'Caf\u00E9 A', cls: 'cafe-a' },
        { key: 'b', label: 'Caf\u00E9 B', cls: 'cafe-b' }
      ],
      optionRow: true,              // side by side, as the two places are
      perch: 'b',                   // and she lands on the right-hand one
      /* The method, never the answer. The moment a hint names a cafe it
         has stopped being a scaffold. */
      hint: 'Count across and up from the house to each caf\u00E9.',
      task: {
        kind: 'choice',
        answer: 'a',
        /* One rung, and it must not narrow the field: on a two-answer
           question "try the other one" is the answer. */
        feedback: ['Not quite \u2014 have another look.'],
        /* Said, not written. She is telling the child to look at the
           map, and a balloon is drawn over the map — so the words that
           send them back to it must not cover it. */
        voiceOnly: true,
        /* Right: past the teaching, to the line that closes it. */
        rightAt: 46,
        /* Wrong twice: two misses on a two-answer question means the
           method is not there to be used, and asking a third time is
           asking a child to guess. The asking stops and the beat that
           teaches takes over. */
        teachAt: 43
      } },

    /* One sentence and a breath. No line, no control, no working — a
       child needs a moment to stop being wrong before they can start
       learning. The word is "together", not "let me show you". */
    { id: 43, line: 'Oops! Let\u2019s find it together.',
      entrance: 'stay', layout: 'board', keepSegment: true, town: true,
      hold: 1500 },

    /* One distance, not both. Cafe B is a row and rows are the first
       thing this game taught; Cafe A is the one that needs the formula,
       so it is the one that gets asked about. "First" promises a second
       step, and it asks for a number rather than for a cafe — the
       conclusion stays the child's. */
    { id: 44, line: 'First, find this distance.',
      entrance: 'stay', layout: 'board', keepSegment: true, town: true,
      joinSegment: true, hold: 1200 },

    /* And they answer it themselves. The same shape as screens 29 and
       30 — the pair is already on the board, the legs are dropped when
       the working needs them, and AB is the one length here that cannot
       be counted off the grid. */
    { id: 45,
      /* The working goes on the paper, not in a panel beside it: the
         board comes to the middle, pushes in on the drawing and the
         room the working needs, and writes it there. */
      stage: 'working', line: 'How far is it from the house to Caf\u00E9 A?',
      entrance: 'none', layout: 'board', intro: 'measure', entry: true,
      keepSegment: true, town: true,
      /* As far as the paper goes along this walk and no further:
         a miss is counted out on the board, and a number the line
         cannot reach is a miss with nothing to look at. Seven
         still leaves two steps past the answer to overshoot by. */
      range: { min: 0, max: 7 },
      segment: { a: { x: 1, y: 1 }, b: { x: 5, y: 4 }, coordSide: 'under' },
      /* Declared, but not drawn with the question. The triangle is not
         what is being asked about, and one drawn round the line before
         the child has answered hands them the two numbers the working
         is there to find. It goes down when the working starts. */
      legsLater: true,
      legs: [
        { from: { x: 1, y: 1 }, to: { x: 5, y: 1 } },
        { from: { x: 5, y: 1 }, to: { x: 5, y: 4 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 5,
              correctLine: 'That\u2019s it \u2014 5 units.',
              noCount: true,
              feedback: [ 'Not quite. Count across, then up, and use the formula.' ],
              showWorking: true,
              /* The formula they were taught, then this town's own
                 numbers put into it, then the arithmetic — one idea to
                 a line. Each part carries the side it names so the
                 board lights the same thing at the same moment: the
                 whole difficulty of this formula is that it looks like
                 symbol-pushing, and a child who watches the 4 light up
                 four squares they could have counted is being shown
                 that the algebra and the picture are one object. */
              formula: [
                { kind: 'lead', small: true, parts: [
                    { t: 'd = \u221A((x2 - x1)\u00B2 + (y2 - y1)\u00B2)' } ] },
                /* The substitution, and the only line whose numbers were
                   READ rather than worked out — so the only line that
                   flies. Each half comes out of the coordinate it is
                   the half of. */
                { kind: 'step', parts: [
                    { t: 'd = \u221A((' },
                    { t: '5', lit: 'h', from: { p: 'b', half: 'x' } },
                    { t: ' - ' },
                    { t: '1', lit: 'h', from: { p: 'a', half: 'x' } },
                    { t: ')\u00B2 + (' },
                    { t: '4', lit: 'v', from: { p: 'b', half: 'y' } },
                    { t: ' - ' },
                    { t: '1', lit: 'v', from: { p: 'a', half: 'y' } },
                    { t: ')\u00B2)' } ] },
                { kind: 'step', parts: [
                    { t: 'd = \u221A(' }, { t: '4\u00B2', lit: 'h' }, { t: ' + ' },
                    { t: '3\u00B2', lit: 'v' }, { t: ')' } ] },
                { kind: 'step', parts: [
                    { t: 'd = \u221A(' }, { t: '16', lit: 'h' }, { t: ' + ' },
                    { t: '9', lit: 'v' }, { t: ')' } ] },
                { kind: 'result', parts: [
                    { t: 'd = \u221A25 = ' }, { t: '5\u00A0units', lit: 'ab', home: true } ] }
              ] } },

    /* The comparison, not the winner. Children compute 5, compute 6 and
       stop, because the maths is finished — and the maths being
       finished is not the question being answered. Both numbers are on
       the board as she says it, so the comparison is something they can
       see rather than something they are told: Cafe B's own line is
       drawn here and measured, which costs one row and a second. */
    { id: 46, line: '5 is less than 6 \u2014 so Caf\u00E9 A is closer.',
      entrance: 'stay', layout: 'board', town: true,
      /* Kept and joined rather than replotted: this beat is reached
         from the question itself or from the end of the teaching, and
         on both the points are already up. Redrawing them would make
         the last screen of the game look like a new board. */
      keepSegment: true, joinSegment: true,
      /* And the triangle the working drew goes with them. A child who
         reached this beat by missing twice arrives with 45's scaffolding
         still on the board, and this screen is about the two walks. */
      dropLegs: true,
      /* Cafe B was a marked place while it was one of two answers; here
         it is one end of a line that gets measured, so the example
         below owns it — and two dots on one coordinate is one dot too
         many. */
      dropMarks: true,
      segment: { a: { x: 1, y: 1 }, b: { x: 5, y: 4 },
                 coordSide: 'under', result: { text: '5\u00A0units' } },
      /* Its far end is the house, which the pair above already names —
         so this line is drawn to it and says nothing about it. Two
         labels on one point is one label written over another. */
      examples: [ { a: { x: -5, y: 1 }, b: { x: 1, y: 1, quiet: true },
                    coordSide: 'under', result: { text: '6\u00A0units' } } ],
      hold: 5200 },

    /* ---- 47-48: one more walk.

       The cafe beat asked the child to RECOGNISE a distance question,
       and gave them something to lean on while they did: two answers, a
       comparison, and a guided walk through one of the distances if
       they missed twice. None of that is here. One question, asked
       outright, answered alone — the last rung of that scaffold, and
       the only one that tells anybody whether it landed.

       And it makes exactly one thing harder. Every distance this game
       has worked has had both points up and to the right, so every
       subtraction has been two positives, larger first. This pair
       straddles both axes: -3 - 5 and 2 - (-4). That is the single
       step of the formula children actually get wrong, and the lesson
       has earned it — screens 15-18 worked 2 - (-3) slowly, on a
       column, with the board building the subtraction. This is the
       first time it has to be done inside the formula with nobody
       helping.

       Nothing on the screen points at it. A child who has it will do
       it; a child who has not will answer 6 — from 2 - 4, or from
       counting only the rise — and the working shows them exactly
       where. That is what the working is for, and it is why there is
       no special message for that answer. */
    { id: 47,
      /* The working goes on the paper, not in a panel beside it: the
         board comes to the middle, pushes in on the drawing and the
         room the working needs, and writes it there. */
      stage: 'working', line: 'Now this one. Maya walks from the school to the park. How far is that?',
      entrance: 'fly', layout: 'board', transition: 'leaves',
      intro: 'measure', entry: true, town: true,
      /* Same rule as 45: twelve is where this walk leaves the
         paper, and the answer is ten. */
      range: { min: 0, max: 12 },
      // in halves, so the working can lift them out — see screen 42
      segment: { a: { x: 5, y: -4, coordParts: [ { t: '(' }, { t: '5', glow: 'x' },
                      { t: ',\u00A0' }, { t: '-4', glow: 'y' }, { t: ')' } ] },
                 b: { x: -3, y: 2, coordParts: [ { t: '(' }, { t: '-3', glow: 'x' },
                      { t: ',\u00A0' }, { t: '2', glow: 'y' }, { t: ')' } ] },
                 coordSide: 'under' },
      /* Held back from the question, as on screen 45: a right-angled
         triangle drawn round the line before the child has answered
         hands them the two numbers the working exists to find. */
      legsLater: true,
      legs: [
        { from: { x:  5, y: -4 }, to: { x: -3, y: -4 } },
        { from: { x: -3, y: -4 }, to: { x: -3, y:  2 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 10,
              correctLine: 'Ten units. Nicely done.',
              noCount: true,
              /* One rung, and it names the trap without solving it. A
                 child stuck on 3 - (-5) is stuck all day without it; a
                 child who is not stuck loses nothing by reading it. */
              feedback: [ 'Not quite. Count across, then up \u2014 watch the minus signs.' ],
              showWorking: true,
              formula: [
                { kind: 'lead', small: true, parts: [
                    { t: 'd = \u221A((x2 - x1)\u00B2 + (y2 - y1)\u00B2)' } ] },
                /* With its brackets. "3 - -5" reads as a typo; the
                   bracket is what makes the minus-a-minus visible, and
                   this line is the whole reason the beat exists. */
                { kind: 'step', small: true, parts: [
                    { t: 'd = \u221A((' },
                    { t: '-3', lit: 'h', from: { p: 'b', half: 'x' } },
                    { t: ' - ' },
                    { t: '5', lit: 'h', from: { p: 'a', half: 'x' } },
                    { t: ')\u00B2 + (' },
                    { t: '2', lit: 'v', from: { p: 'b', half: 'y' } },
                    { t: ' - ' },
                    { t: '(-4)', lit: 'v', from: { p: 'a', half: 'y' } },
                    { t: ')\u00B2)' } ] },
                { kind: 'step', parts: [
                    { t: 'd = \u221A(' }, { t: '8\u00B2', lit: 'h' }, { t: ' + ' },
                    { t: '6\u00B2', lit: 'v' }, { t: ')' } ] },
                { kind: 'step', parts: [
                    { t: 'd = \u221A(' }, { t: '64', lit: 'h' }, { t: ' + ' },
                    { t: '36', lit: 'v' }, { t: ')' } ] },
                { kind: 'result', parts: [
                    { t: 'd = \u221A100 = ' }, { t: '10\u00A0units', lit: 'ab', home: true } ] }
              ] } },

    /* Both walks on one picture. One worked example is a trick that
       happened to work; two, with different numbers, in different
       quadrants, measured the same way, is a method — and that is the
       thing the child should be looking at when the game stops. */
    { id: 48, line: 'Two walks, one way to measure them.',
      entrance: 'stay', layout: 'board', town: true,
      keepSegment: true, joinSegment: true, dropMarks: true,
      /* The triangle goes. It was the working's own scaffolding, and
         this screen is about the two walks, not about how one of them
         was worked out. */
      dropLegs: true,
      segment: { a: { x: 5, y: -4 }, b: { x: -3, y: 2 },
                 coordSide: 'under', result: { text: '10\u00A0units' } },
      examples: [ { a: { x: 1, y: 1 }, b: { x: 5, y: 4 },
                    coordSide: 'under', result: { text: '5\u00A0units' } } ],
      hold: 6000 },

    /* ================= the towers, the repair, the rescue =========
       Everything up to here has been taught. These six find out
       whether what was learned was the method or the wrapper, and
       what happens when it was the wrapper.
       ============================================================== */

    /* 49 — the same mathematics as 47 and nothing at all that says so.
       No town, no walk, no "now this one": a question, a board and a
       control. It is the only beat in the game that offers no help of
       any kind until it is asked for.

       (−2, 5) to (4, −3): six across, eight down, a whole ten. Both
       subtractions cross zero and one of them crosses it DOWNWARDS —
       47 did 2 − (−4), this does −3 − 5, which is the direction a
       child is likelier to write as −2. The numbers are deliberately
       another 6-8-10: a retest that changed the sum as well as the
       costume would measure two things at once and tell you neither. */
    { id: 49, line: 'How long should this connection be?',
      transition: 'leaves', entrance: 'fly', layout: 'board',
      intro: 'measure', entry: true, legsLater: true,
      range: { min: 0, max: 12 },
      hint: 'How far across? How far up?',
      segment: { a: { x: -2, y: 5, name: 'A', coordSide: 'under' },
                 b: { x: 4, y: -3, name: 'B', coordSide: 'under' },
                 dash: true },
      legs: [
        { from: { x: -2, y: 5 }, to: { x: 4, y: 5 }, mark: { name: 'C' } },
        { from: { x:  4, y: 5 }, to: { x: 4, y: -3 } }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 10, noCount: true,
              correctLine: 'Ten units — exactly right.',
              /* One rung, and then the repair takes over. No working
                 here: a worked solution answers an arithmetic slip and
                 says nothing at all to a child who paired x with y,
                 which is the mistake people actually make with this
                 formula. The next four screens find out which it was. */
              feedback: ['Not quite. Count across, then up.'],
              /* Right, and the repair is stepped over: it is for a
                 child who did not get here. */
              rightAt: 54,
              teachAt: 50 } },

    /* 50 — one line, and nothing to do.

       It exists so that 51 is not landing on a child who is still
       absorbing being wrong. Screens 43 and 44 are two screens for
       exactly this reason and it is why that beat lands. */
    { id: 50, line: 'Oops! Let\u2019s find it together.',
      entrance: 'stay', layout: 'board', keepSegment: true,
      /* The line between them, and nothing else on the board moves. */
      pulse: 'ab',
      segment: { a: { x: -2, y: 5, name: 'A', coordSide: 'under' },
                 b: { x: 4, y: -3, name: 'B', coordSide: 'under' },
                 dash: true },
      hold: 1500 },

    /* 51 — the formula, stated rather than asked for. Written beside
       a board that still has both towers and both coordinates on it,
       which is the whole reason it is written here and not in a panel
       of its own. */
    { id: 51, line: 'Start with the Distance Formula.',
      entrance: 'stay', layout: 'board', keepSegment: true,
      /* Written on the paper beside the two towers, not in a panel of
         its own: the formula and the thing it is about have to be one
         picture, or the child has to choose which to look at. The
         board comes to the middle and pushes in, the way every other
         working in this lesson does — this one just has one line and
         states it rather than deriving it. */
      stage: 'working',
      segment: { a: { x: -2, y: 5, name: 'A', coordSide: 'under' },
                 b: { x: 4, y: -3, name: 'B', coordSide: 'under' },
                 dash: true },
      derive: { formula: [
        { kind: 'lead', small: true, parts: [
            { t: 'd = \u221A((x\u2082 \u2212 x\u2081)\u00B2 + (y\u2082 \u2212 y\u2081)\u00B2)' } ] }
      ] },
      hold: 3600 },

    /* 52 — the diagnosis. The formula with its numbers taken out and
       the four numbers underneath as chips.

       Chips rather than typing: four text fields with minus signs in
       them is a test of a keyboard, and this screen is not about
       typing. Each chip carries its own tower's colour, which says
       WHICH POINT it came from and never which axis — so "one of each
       colour in a bracket" is visible and "x with x" is still the
       child's to work out. */
    { id: 52, line: 'Put the coordinates in.',
      entrance: 'stay', layout: 'board', keepSegment: true,
      segment: { a: { x: -2, y: 5, name: 'A', coordSide: 'under' },
                 b: { x: 4, y: -3, name: 'B', coordSide: 'under' },
                 dash: true },
      task: { kind: 'slots',
              correctLine: 'That\u2019s where they go.',
              feedback: ['x with x, y with y — across first, then up.'],
              voiceOnly: true,
              spentLine: 'x with x, y with y — like this.' } },

    /* 53 — and only now the arithmetic, with the substitution locked
       above it. A child who filled 52 first try is being asked the one
       thing that was actually wrong; a child who did not has just been
       shown it. */
    { id: 53, line: 'Now calculate.',
      stage: 'working',
      entrance: 'stay', layout: 'board', keepSegment: true,
      intro: 'measure', entry: true, range: { min: 0, max: 12 },
      hint: 'The two sides are 6 and 8.',
      segment: { a: { x: -2, y: 5, name: 'A', coordSide: 'under' },
                 b: { x: 4, y: -3, name: 'B', coordSide: 'under' },
                 dash: true },
      legs: [
        { from: { x: -2, y: 5 }, to: { x: 4, y: 5 }, mark: { name: 'C' }, length: true },
        { from: { x:  4, y: 5 }, to: { x: 4, y: -3 }, length: true }
      ],
      substituted: '(4 − (−2))² + (−3 − 5)²',
      task: { kind: 'entry', pair: 'AB', answer: 10, noCount: true,
              correctLine: 'Ten units. That is the connection.',
              /* Everything except the last step, because the last step
                 is the only one still to take — and said in one
                 sentence, because a hint that takes as long to hear as
                 the working takes to write is not a hint. The two
                 numbers are already written on the legs; what a child
                 stuck here is missing is what to DO with them. */
              feedback: ['Square them, add, then take the root.'],
              showWorking: true,
              formula: [
                { kind: 'lead', parts: [
                    { t: 'AB\u00B2', lit: 'ab' }, { t: ' = ' },
                    { t: '6\u00B2', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
                    { t: '8\u00B2', lit: 'v', from: { leg: 1 } } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '36', lit: 'h' }, { t: ' + ' }, { t: '64', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '100', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'AB = ' }, { t: '10\u00A0units', lit: 'ab', home: true } ] }
              ] } },

    /* 54 — the special case, and the last thing in the game.

       One point is the origin, and that is the beat: every distance so
       far has cost two subtractions and this one costs none. A child
       who sees why has understood what the subtraction was FOR — it
       was never a ritual, it was the gap, and the gap from zero is the
       number itself.

       (−5, −12) is a 5-12-13, after the café's 3-4-5 and the walk's
       6-8-10. It does not fit the plane the lesson is taught on, so
       this screen asks for the wide board — the same plane at two
       fifths, where a unit is still a cell and the vehicle still lands
       on an intersection twelve rows down.

       Answered on the ruler rather than the reel: the question means
       "how far?", and a slider is an instrument for measuring where a
       keypad is an instrument for spelling a number. */
    { id: 54, line: 'The station is right at zero.',
      line2: 'How far is the rescue vehicle from it?',
      /* Missed twice and the working goes on the paper, beside the
         drawing, the way every other one in this lesson does. */
      stage: 'working',
      transition: 'leaves', entrance: 'fly', layout: 'board',
      board: 'wide', control: 'slider',
      intro: 'measure', entry: true, legsLater: true,
      range: { min: 0, max: 15 },
      hint: 'One of them is zero. What is left to take away?',
      /* The station is ON the origin — the first point in this game
         that is — so its coordinate cannot go under it: that is where
         the axis numbers live, and (0, 0) written over the 0 is two
         labels in one place. It goes up and to the right instead,
         away from the vehicle and clear of both axes; the vehicle,
         down in the third quadrant with nothing near it, keeps the
         ordinary treatment. */
      /* The station is ON the origin — the first point in this game
         that is — so underneath it is the x numbering, to its left is
         the y numbering, and the two axis letters are the nearest
         things on the board to it. Both points used to be told where
         their labels went, the station's pushed two and a half cells
         off its own dot to clear all of that. Nothing is told now:
         the rule keeps clear of the numbering and the letters both,
         and it puts a label against its point rather than near it. */
      segment: { a: { x: 0, y: 0, name: 'S' },
                 b: { x: -5, y: -12, name: 'R' },
                 dash: true },
      legs: [
        { from: { x: 0, y: 0 }, to: { x: -5, y: 0 }, mark: { name: 'C' } },
        { from: { x: -5, y: 0 }, to: { x: -5, y: -12 } }
      ],
      task: { kind: 'entry', pair: 'SR', answer: 13, noCount: true,
              correctLine: 'Thirteen. From zero, the coordinates are the distance.',
              feedback: ['Nothing to subtract from zero — it is just 5 and 12.'],
              /* The scaffold arrives when it is needed: they have had
                 their ungiven go, and now the slider is a ruler. */
              rulerAfterMiss: true,
              showWorking: true,
              formula: [
                { kind: 'lead', parts: [
                    { t: 'SR\u00B2', lit: 'ab' }, { t: ' = ' },
                    { t: '5\u00B2', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
                    { t: '12\u00B2', lit: 'v', from: { leg: 1 } } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '25', lit: 'h' }, { t: ' + ' }, { t: '144', lit: 'v' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '169', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'SR = ' }, { t: '13\u00A0units', lit: 'ab', home: true } ] }
              ] },
      hold: 6000 },

    /* ================= what kind of triangle is this park? =========
       The last beat, and the first one where the distance formula is
       not the question but the tool. Three sides, measured, compared,
       and a name put to the shape.

       The triangle is 13-14-15 — the only near-equilateral triangle
       with whole, unequal sides that fits on a lattice this size. That
       is the whole design: it LOOKS equilateral, so a child who answers
       by eye is wrong, and the only way through is to measure. Drawn as
       a pair (A–B) with two legs (B→C, C→A), which is how the board
       already holds three sides: `ab`, `h` and `v`.
       ============================================================== */

    /* 55 — the question. */
    { id: 55, line: 'What kind of triangle is this park?',
      transition: 'leaves', entrance: 'fly', layout: 'board',
      board: 'mid', askFirst: true, optionTrio: true,
      quietBoard: true, fillTriangle: true,
      hint: 'Measure all three. Looking is not enough.',
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' } },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 } }
      ],
      options: [
        { key: 'scalene',     cls: 'scalene',     label: 'Scalene',     marks: 0 },
        { key: 'isosceles',   cls: 'isosceles',   label: 'Isosceles',   marks: 2 },
        { key: 'equilateral', cls: 'right-angled', label: 'Equilateral', marks: 3 }
      ],
      task: {
        kind: 'choice',
        answer: 'scalene',
        /* One rung, and it points at the work rather than the answer. */
        feedback: ['Have another look at the three sides.'],
        voiceOnly: true,
        correctLine: 'Scalene — no two sides the same.',
        /* Right, and the six beats that measure it are stepped over:
           they are for a child who guessed. */
        rightAt: 'end',
        teachAt: 56
      },
      hold: 3000 },

    /* 56 — a beat to stop being wrong in. The cards go, the triangle
       stays exactly where it was. Screens 43 and 50 do the same job for
       the same reason. */
    { id: 56, line: 'Oops! Let\u2019s check the sides.',
      entrance: 'stay', layout: 'board', board: 'mid', keepSegment: true,
      quietBoard: true, fillTriangle: true,
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true }
      ],
      hold: 1500 },

    /* 57, 58, 59 — one shape three times: the side being asked about is
       the loud one, the sides already found keep their lengths and step
       back, and the board fills up in front of them. */
    { id: 57, line: 'First, find AB.', focus: 'ab',
      entrance: 'stay', layout: 'board', board: 'mid', keepSegment: true,
      quietBoard: true, fillTriangle: true,
      intro: 'measure', entry: true, range: { min: 0, max: 18 },
      hint: 'Twelve across and five up.',
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 13, noCount: true,
              keepLength: true,
              correctLine: 'Thirteen. That one stays.',
              feedback: ['Square them, add, then take the root.'],
              showWorking: true,
              formula: [
                { kind: 'lead', parts: [
                    { t: 'AB\u00B2', lit: 'ab' }, { t: ' = ' },
                    { t: '12\u00B2' }, { t: ' + ' }, { t: '5\u00B2' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '144' }, { t: ' + ' }, { t: '25' } ] },
                { kind: 'step', parts: [ { t: '= ' }, { t: '169', lit: 'ab' } ] },
                { kind: 'result', parts: [
                    { t: 'AB = ' }, { t: '13\u00A0units', lit: 'ab', home: true } ] }
              ] } },

    /* The one side of this triangle that runs straight up the grid — so
       it is the one a child can COUNT, and counting a side you can count
       is knowing which tool a job needs, not cheating. It is asked as a
       distance rather than as a typed answer for exactly that reason. */
    { id: 58, line: 'Now find BC.', focus: 'h',
      entrance: 'none', layout: 'board', board: 'mid', keepSegment: true,
      /* The board stays at full strength here, alone of the seven: this
         is the beat that asks a child to COUNT, and counting squares
         needs the squares. */
      fillTriangle: true,
      intro: 'measure', distance: true, range: { min: 0, max: 18 },
      hint: 'This one runs straight up. You can count it.',
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' },
                 result: { text: '13\u00A0units' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true }
      ],
      task: { kind: 'distance', measureLeg: 0, keepLength: true,
              correctLine: 'Fourteen.',
              feedback: ['Count the squares from B up to C.'],
              countLine: 'Count the spaces between the two points.' } },

    { id: 59, line: 'One more. Find CA.', focus: 'v',
      entrance: 'none', layout: 'board', board: 'mid', keepSegment: true,
      quietBoard: true, fillTriangle: true,
      intro: 'measure', entry: true, range: { min: 0, max: 18 },
      hint: 'Twelve across and nine down.',
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' },
                 result: { text: '13\u00A0units' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true, length: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true }
      ],
      task: { kind: 'entry', measureLeg: 1, answer: 15, noCount: true,
              keepLength: true,
              correctLine: 'Fifteen. All three are down.',
              feedback: ['Square them, add, then take the root.'],
              showWorking: true,
              formula: [
                { kind: 'lead', parts: [
                    { t: 'CA\u00B2', lit: 'v' }, { t: ' = ' },
                    { t: '12\u00B2' }, { t: ' + ' }, { t: '9\u00B2' } ] },
                { kind: 'step', parts: [
                    { t: '= ' }, { t: '144' }, { t: ' + ' }, { t: '81' } ] },
                { kind: 'step', parts: [ { t: '= ' }, { t: '225', lit: 'v' } ] },
                { kind: 'result', parts: [
                    { t: 'CA = ' }, { t: '15\u00A0units', lit: 'v', home: true } ] }
              ] } },

    /* 60 — the screen the whole repair is for. Three numbers become a
       property here, and a child who computed all three perfectly can
       still not have noticed what they MEAN. It is also where 13 and 14
       being close has to be decided out loud: about-the-same is not the
       same. */
    { id: 60, line: 'What do you notice about the side lengths?',
      entrance: 'stay', layout: 'board', board: 'mid', keepSegment: true,
      askFirst: true, optionRow: false, quietBoard: true, fillTriangle: true,
      pulse: 'triangle',
      hint: 'Are any two of them the same number?',
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' },
                 result: { text: '13\u00A0units' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true, length: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true, length: true }
      ],
      options: [
        { key: 'all-equal',  cls: 'scalene',      label: 'All equal' },
        { key: 'two-equal',  cls: 'isosceles',    label: 'Two equal' },
        { key: 'all-diff',   cls: 'right-angled', label: 'All different' }
      ],
      task: {
        kind: 'choice',
        answer: 'all-diff',
        feedback: ['Are any two of them the same number?'],
        voiceOnly: true,
        correctLine: 'All different — 13, 14 and 15.',
        spentLine: 'Thirteen, fourteen, fifteen — all different.'
      },
      hold: 2600 },

    /* 61 — and back to the question they opened. Same three cards, same
       triangle, three lengths on the board now. The loop a child opened
       by getting it wrong is closed by them getting it right. */
    { id: 61, line: 'So, which triangle is it?',
      entrance: 'stay', layout: 'board', board: 'mid', keepSegment: true,
      askFirst: true, optionTrio: true, quietBoard: true, fillTriangle: true,
      hint: 'No two sides are the same length.',
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under' },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under' },
                 result: { text: '13\u00A0units' } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true, length: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true, length: true }
      ],
      options: [
        { key: 'scalene',     cls: 'scalene',     label: 'Scalene',     marks: 0 },
        { key: 'isosceles',   cls: 'isosceles',   label: 'Isosceles',   marks: 2 },
        { key: 'equilateral', cls: 'right-angled', label: 'Equilateral', marks: 3 }
      ],
      task: {
        kind: 'choice',
        answer: 'scalene',
        feedback: ['All three lengths are different. Which name is that?'],
        voiceOnly: true,
        correctLine: 'That\u2019s right — a scalene triangle.',
        spentLine: 'All different means scalene.'
      },
      hold: 6000 }
  ];

  return {
    STAGE_W, STAGE_H, ART, SHEETS, SHEET_W, SHEET_H,
    SWIFTY, CHAR_SCALE, ANCHOR, HEAD_TOP, FEET_DY, SHADOW, CLOUD,
    S5_ORIGIN, GRID, STAND, S8_ORIGIN, BOARD, RECAP, XAXIS, YAXIS, TOWN,
    BUBBLE, PLAY, START, AUDIO, AUTO, NAV, SCRIPT
  };
})();

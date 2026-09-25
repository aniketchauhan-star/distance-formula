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

  /* ---------- Version ----------
     The stamp index.html gives this file's own address, written on
     every commit by tools/stamp.js. Everything the scripts fetch —
     pictures, music, voices — carries it too, so a browser holding an
     earlier copy of any of them asks for the new one instead of
     showing yesterday's picture with today's code. Empty when the page
     is opened without one, and then nothing is stamped. */
  const VERSION = (function () {
    const s = document.currentScript && document.currentScript.src;
    const m = s && /[?&]v=(\d+)/.exec(s);
    return m ? m[1] : '';
  })();
  const stamped = function (url) { return VERSION ? url + '?v=' + VERSION : url; };

  /* ---------- Asset paths ---------- */
  const ART = {
    startScreen: stamped('assets/start screen.png'),
    background:  stamped('assets/game Background .png'),
    clouds:      stamped('assets/clouds.png'),
    playButton:  stamped('assets/play button .png'),
    swiftyFly:   stamped('assets/swifty fly.png'),
    swiftyTalk:  stamped('assets/swifty talk.png'),
    swiftyStand: stamped('assets/normal stand swifty.png'),
    townSheet:   stamped('assets/sheet.png'),
    /* The number selector, drawn. Every piece of the control is a crop
       of this one sheet, so `preload` waiting for it is the whole of
       the loading story: it is about 940KB, and a control that rises
       un-skinned and then dresses itself is worse than the CSS it
       replaced. */
    buttons:     stamped('assets/buttons.png'),
    /* One tile of that sheet cut out on its own — region (184, 646,
       215, 213) — for the table's scrollers, which lay it in nine
       pieces so a tile can widen to its number (formula-table.css).
       Listed so `preload` has it before the first scroller drops. */
    tile:        stamped('assets/tile.png'),
    leaf:        stamped('assets/leaf.png'),
    handNudge:   stamped('assets/hand nudge.png')
  };
  const MUSIC = stamped('sfx/bg music.mp3');

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

  /* Each sheet says its own pixel size and its own scale, so the
     sprite asks a sheet rather than assuming one size for all of
     them. Both of these are the one size; the machinery that let them
     differ is kept because it costs nothing and is already proven. */
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

    /* Near-white on a deep indigo edge, and the reasoning is measured
       rather than felt. Sampled off the painted page, the scene behind
       her runs from the lake at luminance 0.10 to the lit mountain at
       0.45 — mid-tone everywhere, with no dark and no light to hide
       against. Contrast against that whole range:

         the old tan edge #E09A55   worst 1.11   (invisible, and it was)
         a teal edge                worst 1.20
         this indigo #232A44        worst 2.45

       So the answer is value, not hue: the surface goes brighter than
       anything in the picture and the edge darker than anything in it.
       The peach and the amber were taken off the OLD field's own light,
       which is exactly why they disappeared when the field changed. The
       indigo also gives 17:1 against its own fill, which is what makes
       the shape crisp rather than merely present. */
    fill:   '#FFFDF7',
    edge:   '#232A44',
    /* The words are the same ink as the outline. A warm brown was the
       right colour for a bubble edged in amber; edged in indigo it
       read as two different inks in one box. One colour, and the
       letters sit at about 15:1 on the near-white fill. */
    ink_:   '#232A44',            // the text, and the edge
    sheen:  'rgba(255, 255, 255, .92)',   // the catch-light in the corner
    size:   32,                   // the size every line is set at

    /* The box is cut to the line rather than being a fixed bar: a
       two-word greeting in a box built for the longest question in the
       game was the thing that read as wrong. min/max keep it from
       becoming a tile or running off the field. */
    autoWidth: { min: 200, max: 620, pad: 32 },
    pad: { x: 32, y: 20 },        // .62em over 1em, off the line's size
    lineH: 40,                    // 1.2 line-height, with room to sit in

    /* Lifted by a shadow rather than by a warm halo. A glow the colour
       of the old edge was doing nothing against a sunset of the same
       colour; a cool shadow under it does the separating. */
    glow: 'rgba(24, 28, 48, .30)',
    glowWide: 'rgba(24, 28, 48, .16)',
    cast: 'rgba(16, 20, 40, .34)',

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
    /* Under the wordmark, centred on the WHOLE lockup — which is not
       the same as centred on the plate it hangs under, and that is
       what two goes at this kept missing.

       Measured off the rendered page (the art is 1672 wide against a
       1920 stage, so a number read straight off the picture is out by
       a seventh): the "Formula" plate's middle is stage 1273, but the
       "Distance" plank above it is 90px wider and reaches further
       left, and the two together span x 615..1855 with their middle
       at 1234. The eye centres the button under the pair, not under
       the lower one, so 1273 read as 39px right of where it belongs
       and 1336 before that as 100px. */
    box: { cx: 1234, cy: 760, w: 281, h: 267 },
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
      /* 34, down from 36. The numbering is what the board is read
         against and it was the loudest type on the paper — louder than
         the working being taught at 30, and a shade louder than it
         needs to be to be counted along. Two points quieter leaves the
         drawing the loud thing, which is the right way round, and
         hands every negative a little more air besides. */
      close: { k: 1,   xFrom: -6,  xTo: 6,  yFrom: -5,  yTo: 5,
               every: 1, labelSize: 34, overshoot: 58,
               arrow: { len: 34, halfW: 20 },
               gxFrom: -7, gxTo: 7, gyFrom: -6, gyTo: 6 },
      /* Between the two, for a shape that is too big for the lesson's
         own plane and too small to be lost on the rescue's.

         Numbered every SECOND unit. It was every unit, and the note
         here said there was room at 53px a cell for all twenty-one
         numbers — which was true while a negative was written with a
         hyphen. It is not any more: the board writes a real minus sign
         now, and U+2212 is a tabular glyph the width of a digit, so
         "−10" is three digit-widths where "10" is two. Measured on
         this board that is 62px of number in a 53px cell, and the run
         came out as "−10−9−8…" with 1.6px between one number and the
         next, and the 0 overlapping the −1 beside it.

         Every second unit gives each label two cells of its own and a
         44px gap at the worst pair. The gridline is still drawn for
         the ones between — a point between two labels is still a point
         a child can count to, which is the same reasoning the wide
         board has always used. */
      mid:   { k: 0.6, xFrom: -10, xTo: 10, yFrom: -8,  yTo: 8,
               every: 2, labelSize: 30, overshoot: 40,
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
      /* A dark slate, not gold. Gold scored worst 1.38 against this
         scene — the same value as the sunset it sits in front of —
         where the slate scores 2.45. It also leaves gold to mean one
         thing: gold is what you can touch (the dials, GO, Back and
         Next). This is a surface to read. */
      frame:     '#252C47',
      edge:      '#141930',
      highlight: 'rgba(255, 255, 255, .65)',
      line:      'rgba(120, 135, 135, .55)',
      lineW: 2,             // stage px, the same weight at every size
      radius: 40,
      /* Slimmed: the frame used to be 34px of stacked rings, which at
         this board size read as a heavy border around the work rather
         than a edge to it. */
      edgeW:     1.5,
      /* The band round the board, thinner than it was. 13 plus its own
         2px edge put 15px of dark border round a cream sheet — heavy
         enough to read as a picture frame rather than as the edge of a
         page. Seven is a rule, not a moulding.

         This does NOT follow the camera: `place` scales the frame by
         the panel's own scale rather than the view's, so a board that
         pushes in does not thicken its border. */
      frameW:    7,
      hiW:       2,               // the pale ring just inside the frame
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

    /* 34, down from 36 — and this is the one that governs the close
       board, not `ranges.close.labelSize` beside it. `setRange` bails
       when the range asked for is the one already in force, and close
       is in force from the start, so the range's own figure is never
       applied to it; the two are kept the same number so reading
       either tells the truth. */
    labelSize: 34,                  // scaled with the cell
    /* How far every axis number stands off its own axis, measured from
       the stroke's outer edge to the number's INK.

       One value for both runs, because the two were placed by different
       rules and neither of them was a gap: the x row by a constant plus
       a fraction of its type, the y column by its own CENTRE — so a
       two-character "-5" reached closer to the axis than a one-character
       "5", and the column's clearance ran from 6.3px to 16.5px while
       the row sat tucked against the line. */
    numGap: 16,
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
      coordSize: 26,
      /* "N units", written on a pair.

         It had no figure at all. Four places in the code asked for
         `SG.resSize || SG.coordSize` and got 26, while the stylesheet
         was handed a hardcoded 34 — so every one of these was MEASURED
         at 26 and DRAWN at 34, and each one was a third bigger than
         the code placing it believed. It was also the loudest type on
         the paper: larger than the coordinates it sits among, larger
         than the working being taught at 30, and level with the axis
         numbering the whole board is read against.

         28 — a shade over a coordinate, because it is the answer and
         they are the address, and under everything else. One number
         now, read by the placing and by the painting alike. */
      resSize: 28,
    /* Down from 40 and 34. A point's letter was the loudest type on
       the paper — larger than the axis NUMBERS the board is read
       against (36) and a third larger than the working that is being
       taught (30). Nothing about a label earns that. The working's 30
       is the ceiling; the letter keeps a little over its coordinate so
       the two still read as a name above an address. */
      nameSize: 30,
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
      /* Close enough that the five lines read as ONE piece of working.
         It was 1.25 — 80px between baselines on 24px of type, 3.3x,
         further apart than they are tall — and five statements sitting
         near each other is not a calculation. The gap is
         `lineGap x stepY x typeScale`, so 0.62 puts it at 39px, about
         1.6x the type, which is how algebra is set. It only reads as
         continuation rather than crowding because every line hangs
         from its own equals sign: the two belong together. */
      lineGap: 0.62,     // cells between one line and the next
      pad: 0.45,         // cells of air inside the writing column
      /* How much room the working needs beside the drawing, as a
         multiple of the drawing's own width. One means "as much again",
         which puts the triangle in one half and the writing in the
         other. */
      room: 1.15,
      lineMs: 1700,      // one line, read, before the next
      beatMs: 980,       // and one named part after the last
      barW: 3,           // the radical's overbar
      barGap: 0.30       // and how far above the digits it sits, in ems
    },

    /* A number leaving the board for a working. The board's own sum
       (`xeq` below) has flown its digits since it was built; these are
       the same two beats, for the flights that have to cross from the
       board into the panel. */
    fly: {
      /* Slower on purpose. `pickMs` is the pause in which the side
         lights WHERE IT IS, before anything moves — without it the
         flight is a thing arriving rather than a thing being taken off
         the board, and the whole point of the beat is that the symbol
         was already there. */
      pickMs: 460,       // it lights where it is, before it is lifted
      ms: 980            // and travels
    },

    /* The formula table (screen 28): the board slides left and the table
       opens out of its right edge; every name and number in it is a copy
       lifted off the triangle. Slow on purpose — about three seconds a
       symbol — so a child can follow each one from where it was to
       where it goes. Only that screen uses these; `fly` above is
       untouched for every other working. */
    table: {
      board:    { x: 44, y: 12, w: 1232, h: 1056 },   // where the board slides to
      tuck:     60,       // how far the table's edge sits behind the board's
      margin:   44,       // from the table's right edge to the frame's
      size:     40,       // its type, in stage pixels
      openMs:   900,      // the drawer opening, and a breath after
      rowMs:    450,      // a row's skeleton coming in
      appearMs: 200,      // a copy appears on its original
      /* and goes: no lifting above it, no swelling — the copy comes out
         of the drawing and flies straight to its slot. (It used to lift
         and pulse twice first.) */
      pulseMs:  0,
      travelMs: 1400,     // travels to its slot, turning level on the way
      restMs:   300,      // lands; a breath before the next
      writeMs:  600,      // a worked-out value written in place
      lift:     0,        // how far above the original it lifts first (none)
      pickCy:   400       // 29c's table sits higher: she comes back under it
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
      slots: 2,          // the most any one screen recalls
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
      /* A wrong guess is HELD, then LET GO. The line goes out to the
         number they chose — short of the point or a unit past it,
         which is the feedback — waits long enough to be read against
         the point it was meant to reach, and then fades where it
         stands, leaving the board clear for the squares.

         It walked back, once, unit by unit the way it had come. That
         is the gesture of giving the answer run in reverse, so the eye
         follows the line home and the wrong length is the last thing
         it is still being shown. Fading leaves the length where it was
         drawn and stops showing it, which is the difference between
         withdrawing an answer and letting one go. */
      missHoldMs: 620,   // the wrong length, held to be read
      missFadeMs: 380,   // and then let go where it stands
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
        stepMs: 1000,      // one square, then the next — slowly
        numMs:  450,       // its arrow first, then its number
        readMs: 900,       // the finished row, held to be read
        /* Once the last arrow and its number are up, the whole count
           stays for this long — to be looked at and counted along —
           before the squares go and the total ("3 units") is written.
           It used to be taken away 1.4s after the last number. */
        holdMs: 5000,
        gapMs: 420,        // blank, before it goes again
        /* Once. It used to play twice, and the second pass was
           doing the job the sentence should have been doing — the
           first time through "says what is happening" only because
           the sentence arrived underneath it. She says it and
           finishes now, so there is nothing left for a second pass
           to say. */
        passes: 1,
        numSize: 20,
        /* An arrow in each square, pointing the way the count is
           running, with its number under it.

           A square on its own says "here is a space"; an arrow in it
           says "and this is the step you just took across it", which
           is the thing being counted. It turns with the count rather
           than always pointing right: along the row on a horizontal
           span, up the column on a vertical one, and reversed on
           either if the count runs the other way.

           All three are fractions of the SMALLER side of the square,
           so the arrow keeps its shape on a board whose cells are not
           square, and the two heights are fractions of the square's
           own, so the pair sits the same way in a tall cell as in a
           squat one. */
        arrow: {
          len:  1,           // tip to tail: the whole square, edge to edge
          head: 0.11,        // small barbs — the line is the mark, not the heads
          w:    2.5,         // a fine line, not a bold one
          near: 0.28,        // how far the arrow sits from the line,
                             // as a share of the square across it
          /* And its number, just past it on the side away from the
             line — close enough to read as the arrow's own label, never
             touching it. This is the clear space between the tips of
             the arrowheads and the number's paper halo, in board units.
             (The number used to hang at a fixed 71% of the square, which
             left a gap wider than the number itself.) */
          numGap: 2
        }
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
  /* And where she moves to when a control arrives: standing ON its top
     edge, and a little smaller — she is further away up there, and the
     control is what should hold the eye once it has arrived. The move
     animates, so the size settles with the travel rather than snapping.

     Her feet land at 713. 688 was right while the selector was a
     drawing whose frame began at the top of its own box; rebuilt in
     CSS the housing starts 30 units in, which at the widget's 0.665
     puts its painted top at 711 — so she had been standing 23px above
     it, in the air. Measured off the rendered page, because the art is
     no longer where this number comes from. */
  const STAND_UP = standAt(0.88, 60, 449);

  /* And a perch on ONE of the answers rather than on the panel's middle.
     The closing question puts its two cafes side by side and she lands
     on the right-hand one, so the pose is seated on that button's own
     top edge: the panel's border and padding put a button top 37
     natural units down, and the right button's centre is 377.5 natural
     units in, both at the panel's scale.

     Worked out from where the panel IS, not typed. These numbers used
     to be written for a panel at (34, 680); the panel moved to
     (64, 650) and the perch did not, so she landed 30px into the Café B
     button and 30px to the left of it. Her feet are 300 and 208 natural
     units into this pose (264 and 183 at 0.88). */
  /* On the panel's own top edge rather than on the button: standing on
     the button she covered the top of "Cafe B". The panel's yellow
     frame is its outer 9 natural units, so her feet rest on it 3 in —
     above the right-hand button, in the panel's top right corner. */
  const OPTS_AT = { x: 64, y: 650 }, OPTS_K = 0.73;
  const PERCH_FEET = { x: OPTS_AT.x + 377.5 * OPTS_K, y: OPTS_AT.y + 3 * OPTS_K };
  const STAND_PERCH = standAt(0.88, PERCH_FEET.x - 208 * 0.88, PERCH_FEET.y - 300 * 0.88);

  /* And a perch for the working panel, which sits higher up her column
     than the answers do — she leaves before it is written and comes
     back to stand on it, so it needs a seat of its own. Her feet sit
     256 below the pose's own top, so this is the working panel's y less
     that — move one and the other has to follow. */
  const STAND_WORK = standAt(0.88, 60, 134);

  /* And a seat on the ANSWERS, which is not the selector's seat even
     though the two panels used to share a slot.

     Measured off the rendered page: the answers' painted top edge —
     the outer edge of its gold border — sat at 680 and her feet at
     713, so she was standing 33px inside the panel, on the cream,
     with the stroke behind her ankles. The selector's own painted top
     is at 711, which is why 713 is right there and wrong here: the
     two controls are built differently and only looked alike.

     Her feet are 264 below this pose's own top (300 x 0.88), so this
     is the answers' y less that, plus the 2px of overlap the selector
     already has — enough that she is standing ON the line rather than
     hovering a pixel above it. Move the panel and this has to follow. */
  const STAND_OPTIONS = standAt(0.88, 90, 388);

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
      /* y follows the bar. The drawn bar is shorter than the one the
         CSS invented — 794 x 307 rather than 660 x 330 — so the whole
         widget sits three units lower to put the gold's painted top
         back under her feet at 713, which is where `STAND_UP` has
         always expected it. */
      pos: { x: 29, y: 691 },
      w: 816, h: 460,
      scale: 0.665
    },

    /* The triangle-type answer panel takes the slider's place, centred
       on the same footprint so the left column stays put. */
    /* Below her, like the selector — its natural height is about 432,
       so it is scaled to clear the bottom of the frame. */
    /* Its own slot, not the selector's. Three stacked buttons is a
       taller shape than a row of tiles and a differently built one, so
       sharing a top edge with the reel only ever meant they started at
       the same number — it never put her feet on both. It sits a
       little in from the frame's edge and a little higher than the
       reel, which gives the tallest control on the screen room under
       it, and it carries the seat she stands on so the two can never
       drift apart again. h is its real built height — 9px borders,
       28/32 padding, three 108px buttons and two 24px gaps. */
    /* The same two numbers the perch above is worked out from. */
    options: { pos: OPTS_AT, w: 520, h: 450, scale: OPTS_K,
               stand: STAND_OPTIONS },

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
    /* Where she comes back to when the child has filled the table on
       29c: under the table, on the right, with room above her head for
       her balloon between her and it. */
    tableStand: standAt(0.88, 1371, 786),

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
    /* Two rows up from the house's row, so its walk is a real triangle
       — six across and two up — and it is worked the way Cafe A's is. */
    cafeB: { x: -5, y: 3 },
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

  /* The town's art: one sheet, cut by these rects.

     Measured off the alpha rather than assumed. The sheet came back
     1774 x 887 with the seven drawings placed freely — different
     sizes, different gaps — rather than on the even grid that was
     asked for, so there is no cell to divide by and every rect here
     is the drawing's own opaque bounds.

     They are also different shapes: the café is 1.21 wide to tall,
     the station 1.90, the tower 0.53. So a place is sized by its
     HEIGHT and takes its own width from its own ratio — asking them
     all to fill one box would squash the van and stretch the tower.
     `tall` is that height in cells. */
  TOWN.sheet = { src: ART.townSheet, w: 1774, h: 887 };
  TOWN.sprites = {
    /* A little smaller than they were drawn at first (1.05): at that
       size the pictures crowded the points under them, their
       coordinates and the sides running out of them. */
    cafe:    { x:   52, y:  99, w: 346, h: 285, tall: 0.85 },
    house:   { x:  484, y: 110, w: 356, h: 274, tall: 0.85 },
    school:  { x:  912, y: 101, w: 397, h: 283, tall: 0.85 },
    park:    { x: 1380, y: 129, w: 336, h: 271, tall: 0.85 },
    /* Not placed on any screen yet — screens 49 to 54 do not use this
       layer. Cut and ready for when they do. */
    tower:   { x:  139, y: 470, w: 171, h: 324, tall: 1.3 },
    station: { x:  468, y: 578, w: 396, h: 208, tall: 0.95 },
    van:     { x:  927, y: 618, w: 363, h: 173, tall: 0.78 }
  };
  TOWN.places = [
    { key: 'cafeB',  x: TOWN.cafeB.x,  y: TOWN.cafeB.y,
      name: 'Cafe B',        kind: 'cafe',   tone: 'yellow' },
    { key: 'house',  x: TOWN.house.x,  y: TOWN.house.y,
      name: 'Maya’s House',  kind: 'house',  tone: 'violet' },
    { key: 'cafeA',  x: TOWN.cafeA.x,  y: TOWN.cafeA.y,
      name: 'Cafe A',        kind: 'cafe',   tone: 'teal' },
    /* Up from the closing beat: the same town, two more places in it.
       They are on the map from the first beat that uses them and stay
       for the last — a town that gains a building between one question
       and the next is a different town. */
    { key: 'school', x: TOWN.school.x, y: TOWN.school.y,
      name: 'School',             kind: 'school', tone: 'blue' },
    { key: 'park',   x: TOWN.park.x,   y: TOWN.park.y,
      name: 'Park',               kind: 'park',   tone: 'green' },
    /* The two towers the connection runs between (49). Each hangs from
       its point — the point is the top of the tower — so the one at
       y = 5 stays on the paper and the sides leave the points clear of
       the pictures. */
    { key: 'towerA', x: -2, y: 5,  name: 'Tower A', kind: 'tower', tone: 'yellow', hang: true },
    { key: 'towerB', x:  4, y: -3, name: 'Tower B', kind: 'tower', tone: 'teal',   hang: true },
    /* The station and the rescue van (54), on the wide board, where a
       cell is a third the size — so drawn three times their usual
       height. The van hangs below its point, so the side that comes
       down to it arrives at the point rather than through the van. */
    { key: 'station', x: 0,  y: 0,   name: 'Station', kind: 'station', tone: 'blue',   tall: 1.6, corner: true },
    { key: 'van',     x: -5, y: -12, name: 'Van',     kind: 'van',     tone: 'violet', tall: 1.4, hang: true }
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
    /* Subscripts (x₂) and the real minus sign: the game carries its own
       copy of both (assets/fonts, nunito-600-math.woff2), so they no
       longer depend on the laptop's fonts. The root is written \u221A(...)
       here, and those brackets are read as saying how far it reaches:
       the panel draws the sign and a bar over everything inside them,
       so the brackets themselves are never shown. */
    lines: [
      { kind: 'lead',   text: 'AB² = AC² + BC²' },
      { kind: 'lead',   text: 'AB² = (x₂ − x₁)² + (y₂ − y₁)²' },
      { kind: 'result', text: 'AB = √((x₂ − x₁)² + (y₂ − y₁)²)' }
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
    /* x1 and x2 are pieces of their own now, beside the 0s, so the
       formula table can make a copy of each and carry it across. */
    a: { x: -4, y: 0,
         coordParts: [{ t: '(' }, { t: 'x₁', glow: 'x' }, { t: ', ' },
                      { t: '0', glow: 'y' }, { t: ')' }] },
    b: { x:  4, y: 0,
         coordParts: [{ t: '(' }, { t: 'x₂', glow: 'x' }, { t: ', ' },
                      { t: '0', glow: 'y' }, { t: ')' }] },
    /* The working as a table, the way 28's arrives (runAxisCase's
       tableStep): the board keeps its full size, the camera comes in on
       the segment, the table opens in her column above her, empty, and
       every piece written on the drawing is carried across from the
       labels. x pieces in the
       horizontal's orange, y pieces in the vertical's green. The
       formula's own shape — and the y2, y1 the labels do not show —
       is each row's skeleton. */
    /* The table stands in her column, where the old working panel
       stood — above her, with her balloon clear beneath it — and the
       board keeps its full study size on the right. */
    tableAt: { x: STUDY.fx, y: 132, w: STUDY.fw },
    tableSize: 36,
    rows: [
      { inline: true, parts: [
          { t: 'd' }, { t: ' = ' }, { t: '√((' },
          { t: 'x₂', lit: 'h', from: { p: 'b', half: 'x' } }, { t: ' - ' },
          { t: 'x₁', lit: 'h', from: { p: 'a', half: 'x' } },
          { t: ')² + (y₂ − y₁)²)' } ] },
      { inline: true, parts: [
          { t: '= ' }, { t: '√((x₂ − x₁)² + (' },
          { t: '0', lit: 'v', from: { p: 'b', half: 'y' } }, { t: ' - ' },
          { t: '0', lit: 'v', from: { p: 'a', half: 'y' } }, { t: ')²)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '√((x₂ − x₁)²)' } ] },
      { inline: true, parts: [
          { t: 'd' }, { t: ' = ' }, { t: '|' },
          { t: 'x₂', lit: 'h', from: { p: 'b', half: 'x' } }, { t: ' - ' },
          { t: 'x₁', lit: 'h', from: { p: 'a', half: 'x' } }, { t: '|' } ] }
    ],
    coordDy: -88,
    nameDy: -40,
    resultDy: 82,          // the answer goes below, clear of the numbering
    /* This segment is centred on the origin, so the answer slides
       right or its plate lands on the y-axis and the -1 beside it. */
    resultDx: 168,

    /* Each step replaces the line above it. Fragments let one part
       glow as it arrives, or fade as it collapses. */
    steps: [
      [ { t: 'd = √((x₂ − x₁)² + (y₂ − y₁)²)' } ],
      [ { t: 'd = √((x₂ − x₁)² + ' }, { t: '(0 − 0)²', glow: true }, { t: ')' } ],
      /* The plus goes out with the term it joins, or the formula
         reads "√((x2 - x1)² + )" for the length of the fade. */
      [ { t: 'd = √((x₂ − x₁)²' }, { t: ' + (0 − 0)²', fade: true }, { t: ')' } ],
      [ { t: 'd = √((x₂ − x₁)²)' } ]
    ],
    result: 'd = |x₂ − x₁|',
    /* The table the child fills (39): both y's are 0 — read off the
       labels — so the second term is (0 − 0)², then 0, then gone; and
       what is left is picked from three. Each blank offers the right
       term and the ones a child reaches for instead. */
    picks: [
      { inline: true, parts: [ { t: 'd' }, { t: ' = ' },
          { t: '\u221A((x₂ − x₁)\u00B2 + (y₂ − y₁)\u00B2)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '\u221A((x₂ − x₁)\u00B2 + (' },
          { t: '0', lit: 'v', offer: [ '0', 'y₂', 'x₂' ] }, { t: ' − ' },
          { t: '0', lit: 'v', offer: [ 'y₁', '0', 'x₁' ] }, { t: ')\u00B2)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '\u221A((x₂ − x₁)\u00B2 + 0)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '\u221A((x₂ − x₁)\u00B2)' } ] },
      { inline: true, parts: [ { t: 'd' }, { t: ' = ' },
          { t: '|x₂ − x₁|', lit: 'h', answer: '|x₂ − x₁|',
            offer: [ '|x₂ − x₁|', '|y₂ − y₁|', 'x₂ + x₁' ] } ] }
    ]
  };

  /* The same thing turned on its side. The pair reads as one idea, so
     the board and the working stay exactly where the x-axis case left
     them — only what is on them changes. A vertical segment puts its
     labels to the side of its own accord, clear of the y numbering. */
  const YAXIS = {
    grid: XAXIS.grid,
    formula: XAXIS.formula,

    a: { x: 0, y: -4,
         coordParts: [{ t: '(' }, { t: '0', glow: 'x' }, { t: ', ' },
                      { t: 'y₁', glow: 'y' }, { t: ')' }] },
    b: { x: 0, y:  4,
         coordParts: [{ t: '(' }, { t: '0', glow: 'x' }, { t: ', ' },
                      { t: 'y₂', glow: 'y' }, { t: ')' }] },
    /* The x-axis case's table with the axes swapped: y pieces carried
       from the labels, the 0s from their x halves. */
    tableAt: XAXIS.tableAt,
    tableSize: XAXIS.tableSize,
    rows: [
      { inline: true, parts: [
          { t: 'd' }, { t: ' = ' }, { t: '√((x₂ − x₁)² + (' },
          { t: 'y₂', lit: 'v', from: { p: 'b', half: 'y' } }, { t: ' - ' },
          { t: 'y₁', lit: 'v', from: { p: 'a', half: 'y' } }, { t: ')²)' } ] },
      { inline: true, parts: [
          { t: '= ' }, { t: '√((' },
          { t: '0', lit: 'h', from: { p: 'b', half: 'x' } }, { t: ' - ' },
          { t: '0', lit: 'h', from: { p: 'a', half: 'x' } }, { t: ')² + (y₂ − y₁)²)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '√((y₂ − y₁)²)' } ] },
      { inline: true, parts: [
          { t: 'd' }, { t: ' = ' }, { t: '|' },
          { t: 'y₂', lit: 'v', from: { p: 'b', half: 'y' } }, { t: ' - ' },
          { t: 'y₁', lit: 'v', from: { p: 'a', half: 'y' } }, { t: '|' } ] }
    ],

    /* This segment is centred on the origin too, so the answer moves
       off it — right of the axis and a little above the x numbering. */
    resultDx: 200,
    resultDy: -60,

    steps: [
      [ { t: 'd = √((x₂ − x₁)² + (y₂ − y₁)²)' } ],
      [ { t: 'd = √(' }, { t: '(0 − 0)²', glow: true }, { t: ' + (y₂ − y₁)²)' } ],
      [ { t: 'd = √(' }, { t: '(0 − 0)² + ', fade: true }, { t: '(y₂ − y₁)²)' } ],
      [ { t: 'd = √((y₂ − y₁)²)' } ]
    ],
    result: 'd = |y₂ − y₁|',
    // the same table turned on its side (41): the x's are the 0s
    picks: [
      { inline: true, parts: [ { t: 'd' }, { t: ' = ' },
          { t: '\u221A((x₂ − x₁)\u00B2 + (y₂ − y₁)\u00B2)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '\u221A((' },
          { t: '0', lit: 'h', offer: [ 'x₂', '0', 'y₂' ] }, { t: ' − ' },
          { t: '0', lit: 'h', offer: [ '0', 'x₁', 'y₁' ] }, { t: ')\u00B2 + (y₂ − y₁)\u00B2)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '\u221A(0 + (y₂ − y₁)\u00B2)' } ] },
      { inline: true, parts: [ { t: '= ' }, { t: '\u221A((y₂ − y₁)\u00B2)' } ] },
      { inline: true, parts: [ { t: 'd' }, { t: ' = ' },
          { t: '|y₂ − y₁|', lit: 'v', answer: '|y₂ − y₁|',
            offer: [ '|x₂ − x₁|', '|y₂ − y₁|', 'y₂ + y₁' ] } ] }
    ]
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

  /* How much the game moves. The laptop's own "reduce motion" setting
     used to decide it, invisibly — Windows turns that on whenever
     "Animation effects" is off, which many school laptops ship with —
     so the same game played differently from one laptop to the next,
     and on those laptops the dots on the locate screens were not there
     at all. Now the game decides, once, the same everywhere:

       'off'            the whole game, on every laptop (the default)
       'on'             calm: the sky holds still, the grid markers stop
                        breathing, panels and drawers appear rather than
                        slide — and nothing is ever hidden by it
       'follow-laptop'  calm only where the laptop asks for less motion

     Calm is the stylesheets' (`html.calm` rules). The moves the script
     makes — her flights, the camera, the numbers carried into the
     table — are the lesson, and play in every mode. */
  const MOTION = { calm: 'off' };

  const AUDIO = {
    musicSrc: MUSIC,
    musicVolume: 0.20,   // brief: background music at 20%
    musicDucked: 0.055,  // dipped while Swifty is speaking
    sfxVolume: 0.85,
    duckDown: 0.22,      // seconds
    duckUp: 0.65
  };

  /* -------------------------------------------------------------
     A WALK — the three screens 29 to 29c taught, for any two points.

       1  the two points named A and B, and the dotted line between
          them as she says it; then the first side drawn out to the
          corner C, and measured on the reel;
       2  the second side, measured the same way;
       3  the table out of the board's right edge, which the child
          fills: (AB)² = (CB)² + (AC)², the two sides, their squares,
          the sum, and the root.

     Used by every walk after 30 — the two cafés, the school and the
     park, the towers, the station — so each is taught the same way.

       ids     the three screens' ids
       a, b, c the two points and the corner, in grid units; the first
               side runs a → c, the second c → b (either may be the
               level one — the table takes its colours from the sides)
       say     { first, ask, second, table } — her lines
       base    what all three share (the town, the board, the range)
       first   what only the first screen has (its entrance, a sweep)
       done    where the table hands on to, if not the next screen
     ------------------------------------------------------------- */
  const SQRT = '√', SQ = '²', UNIT = ' units';
  /* The whole triangle each run of screens builds, for its labels to be
     placed against from the start (see `shape` and Board.labelLegs). */
  const SHAPE_1 = [ { from: { x: 2, y: 1 }, to: { x: 6, y: 1 } },
                    { from: { x: 6, y: 1 }, to: { x: 6, y: 4 } } ];     // 22–28
  const SHAPE_2 = [ { from: { x: -2, y: 2 }, to: { x: 2, y: 2 } },
                    { from: { x: 2, y: 2 }, to: { x: 2, y: 5 } } ];     // 29–29c
  const SHAPE_G = [ { from: { x: -5, y: 1 }, to: { x: 5, y: 1 } },
                    { from: { x: 5, y: 1 }, to: { x: 5, y: 4 } } ];     // 31–37
  /* Where the park's coordinates are written: right of its trees and a
     little up — the same spot whether the park is a point of the walk
     (with its letter over it) or one of the other places. In squares
     from the point. */
  const PARK_LABEL = { x: 1.04, y: 0.376 };
  /* And the house's, on the school-and-park screens (47 to 48): right of
     the house, level with its point. Every line out of the house there
     — to the school, down to the corner under it, left to the park's
     corner, up to the park — leaves on another side, so nothing is ever
     written across it and it never has to move. */
  const HOUSE_LABEL = { x: 0.95, y: 0.12 };

  function walk(w) {
    const pt = function (p, name) {
      return Object.assign({ x: p.x, y: p.y, name: name }, p.extra || {});
    };
    const seg = Object.assign({ a: pt(w.a, 'A'), b: pt(w.b, 'B'), dash: true },
                              w.seg || {});
    const len = function (p, q) { return Math.round(Math.hypot(q.x - p.x, q.y - p.y)); };
    const ac = len(w.a, w.c), cb = len(w.c, w.b);
    const sum = ac * ac + cb * cb, root = Math.sqrt(sum);
    const whole = Math.abs(root - Math.round(root)) < 1e-9;
    /* Two tiles for each blank: the right one, and the mistake that
       blank is there to catch — the other side; squaring as doubling;
       adding the sides instead of their squares; stopping before the
       root. Which comes first alternates, so the right one is not
       always on top. */
    const pair = function (right, wrong, first) {
      if (wrong === right) wrong = right + 1;
      return first ? [right, wrong] : [wrong, right];
    };
    const dbl = function (n) { return (n * n === 2 * n) ? n : 2 * n; };
    const res = whole ? Math.round(root) : SQRT + sum;
    const legA = { from: w.a, to: w.c, mark: { name: 'C', away: w.cAway } };
    const legB = { from: w.c, to: w.b };
    /* The whole triangle, from the first screen of the three: every
       label is placed once, clear of sides that are not drawn yet, and
       stays there (Board.labelLegs). */
    const shape = [ { from: w.a, to: w.c }, { from: w.c, to: w.b } ];
    const say = w.say || {};
    const firstWord = function (t) { return String(t).split(/[\s,.]+/)[0]; };
    const base = Object.assign({ shape: shape }, w.base || {});
    const s1 = Object.assign({
      id: w.ids[0],
      line: say.first, line2: say.ask || 'How far is it from A to C?',
      /* The dotted line waits for her first word, and A and B pulse
         with it; the corner comes after her sentence, drawn out along
         the first side; then she asks, and while she asks only A, C and
         the side between them are at full strength. */
      guideOnLine: true,
      wordCues: [ { word: say.cue || firstWord(say.first), in: say.first,
                    guide: true, beat: ['a', 'b'] },
                  { word: firstWord(say.ask || 'How'), in: say.ask || 'How far is it from A to C?',
                    spot: 'h' } ],
      lineLights: [ { legs: true, beat: ['c'], quiet: true }, { pulse: 'h' } ],
      /* Not quiet: these two screens ask for a side to be COUNTED, and
         a child counting squares needs to see them. */
      entrance: 'none', layout: 'board',
      intro: 'measure', distance: true,
      segment: seg,
      legs: [ Object.assign({ dash: true }, legA) ],
      task: { kind: 'distance', measureLeg: 0, countLine: 'Count carefully!' }
    }, base, w.first || {});
    const s2 = Object.assign({
      id: w.ids[1],
      line: say.second || 'Now find the distance from C to B.',
      wordCues: [ { word: firstWord(say.second || 'Now'), spot: 'v' } ],
      lineLights: [ { pulse: 'v' } ],
      entrance: 'none', layout: 'board',
      intro: 'measure', distance: true, keepSegment: true,
      segment: seg,
      legs: [ Object.assign({ settled: true, length: true }, legA), legB ],
      task: { kind: 'distance', measureLeg: 1, countLine: 'Count carefully!' }
    }, base);
    const s3 = Object.assign({
      id: w.ids[2],
      lines: say.table || [ 'We know AC and CB.', 'Let’s use Pythagoras to find AB.' ],
      wordCues: [ { word: 'We', spot: ['h', 'v'] } ],
      lineLights: [ { unspot: true, hold: 600 }, {} ],
      rightAngle: true, keepMark: true,
      entrance: 'none', layout: 'board', quietBoard: true, keepSegment: true,
      segment: seg,
      legs: [ Object.assign({ settled: true, length: true }, legA),
              Object.assign({ settled: true, length: true }, legB) ],
      task: {
        kind: 'table',
        correctLine: 'That’s right!',
        rightAt: w.done,
        formula: [
          { kind: 'lead', parts: [
              { t: '(AB)' + SQ, lit: 'ab' }, { t: ' = ' },
              { t: '(CB)' + SQ, lit: 'v' }, { t: ' + ' },
              { t: '(AC)' + SQ, lit: 'h' } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: '(' + cb + ')' + SQ, lit: 'v', offer: pair(cb, ac, true) }, { t: ' + ' },
              { t: '(' + ac + ')' + SQ, lit: 'h', offer: pair(ac, cb, false) } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: String(cb * cb), lit: 'ab', offer: pair(cb * cb, dbl(cb), false) }, { t: ' + ' },
              { t: String(ac * ac), lit: 'ab', offer: pair(ac * ac, dbl(ac), true) } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: String(sum), lit: 'ab', offer: pair(sum, ac + cb, false) } ] },
          { kind: 'result', parts: [
              { t: 'AB', lit: 'ab' }, { t: ' = ' },
              whole
                ? { t: res + UNIT, lit: 'ab', offer: pair(res, sum, true) }
                : { t: res + UNIT, lit: 'ab', answer: res, offer: [res, String(sum)] } ] }
        ] }
    }, base);
    return [s1, s2, s3];
  }

  /* -------------------------------------------------------------
     SCRIPT — one entry per screen
     ------------------------------------------------------------- */
  /* `entrance` — how Swifty arrives on each screen:
       'fly'  she flies in from off-stage on the fly sheet, then lands
       'stay' she is already standing; only the bubble changes
       'hop'  a short flap-and-hop in place (uses the fly sheet)
     She flies in on screen 1 only; 3 is talking only.

     The ids are labels, not positions: they already skip 23 and 27, and
     2 is gone the same way. Nothing addresses a screen by number — the
     picker and the counter read whatever ids are in the list — so a
     screen that goes simply goes, and the ones after it keep the names
     they have always had. */
  const SCRIPT = [
    { id: 1, line: 'Hey there!',                                         entrance: 'fly'  },
    /* 2 — "Ready to explore distance on the coordinate plane?" She asked
       it and then answered herself by starting, which is a beat that
       costs a screen and settles nothing. Gone; 1 hands straight to 3. */
    { id: 3, line: 'Let’s do a quick warm-up.',                          entrance: 'stay' },

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
    { id: 8, line: 'What is the distance between the two points?', entrance: 'none',
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
              countLine: 'Count carefully!'
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
      /* The pair the question was about, KEPT — after a right answer
         the points and the line stay exactly as they are rather than
         being taken away and animated in again. Only the coordinates
         change, and only in how they are built: in parts, for the next
         beats to light (see Board.carryOn). The question's dotted guide
         becomes the solid line — already drawn, not drawing. */
      keepSegment: true, solidLine: true,
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

    { id: 13, line: 'What is the distance between the two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: 4, y: 3 }, b: { x: -3, y: 3 } , dash: true},
      task: { kind: 'distance',
              /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count carefully!' } },

    { id: 14, line: 'What is the distance between the two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: 1, y: 2 }, b: { x: 1, y: -3 } , dash: true},
      task: { kind: 'distance',
              /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count carefully!' } },

    /* ---- and the same argument for a column. After the first vertical
       question the y-axis gets what the x-axis got: this time the x
       halves are the ones that match, so the distance is the difference
       of the y halves, and the subtraction reads 2 - (-3). */
    { id: 15, line: 'Did you notice?',
      entrance: 'stay', layout: 'board', quietBoard: true,
      /* The pair the question was about, KEPT — after a right answer
         the points and the line stay exactly as they are rather than
         being taken away and animated in again. Only the coordinates
         change, and only in how they are built: in parts, for the next
         beats to light (see Board.carryOn). The question's dotted guide
         becomes the solid line — already drawn, not drawing. */
      keepSegment: true, solidLine: true,
      segment: {
        a: { x: 1, y: -3,
             coordParts: [{ t: '(' }, { t: '1', glow: 'x' }, { t: ',\u00A0' },
                          { t: '\u22123', glow: 'y' }, { t: ')' }] },
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

    { id: 19, line: 'What is the distance between the two points?', entrance: 'none', layout: 'board',
      distance: true, intro: 'measure',
      segment: { a: { x: -2, y: 3 }, b: { x: -2, y: 1 } , dash: true},
      task: { kind: 'distance',
              /* No retry. A wrong answer here goes straight to the showing:
                 this beat carries little weight, and a child who has
                 missed learns more from the spaces being counted than
                 from being sent round again. */
              countLine: 'Count carefully!' } },

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
      /* One sentence, and the board follows it word by word.

         It was two screens — a row on one, a column on the next — and
         then one screen saying both in two lines. Both were spending
         beats on a single fact: that these two are solved, and the
         pair after them will be neither. It is one sentence, so it is
         one line, and the two pairs are drawn as the words for them go
         up: the row on "horizontally", the column on "vertically".
         See `wordCues` and armWordCues.

         Neither pair is the board's own segment. Both are carried as
         recalled ones, because neither is the subject of the screen —
         the sentence is, and they are what it points at. It also means
         the board draws nothing until she starts talking, which is the
         whole of the effect asked for. */
      line: 'So far, the points were lined up horizontally or vertically.',
      entrance: 'stay', layout: 'board', hold: EXAMPLE_HOLD + 1600,
      /* Two pairs on one board: the furniture steps back so they read as
         the subject rather than as more lines among the ruling. */
      quietBoard: true,
      examples: [
        /* The row, laid out the way the argument laid it out: the
           coordinates under their points, the length over the line. */
        { a: { x: 3, y: 2 }, b: { x: 6, y: 2 },
          coordSide: 'under', result: { text: '3\u00A0units' } }
      ],
      /* The column is the very pair 19 has just measured, so it is not
         drawn again: 19's line and its "2 units" stay exactly where the
         child put them (keepMeasure), and on "vertically" its two points
         pulse. It used to be wiped with the screen change and drawn
         again as a recalled pair — the line vanished and came back. */
      keepSegment: true, keepMeasure: true,
      segment: { a: { x: -2, y: 3 }, b: { x: -2, y: 1 }, dash: true },
      wordCues: [ { word: 'horizontally', example: 0 },
                  { word: 'vertically',   beat: ['a', 'b'] } ] },

    /* Both lengths go where every length goes: the middle of the span
       it measures, out to the side of the line by the same air a
       coordinate keeps from its dot. This column straddles the x-axis,
       so its own middle is the row the axis numbers live in — the
       board slides it down its own line until it is clear of them, and
       no further. */

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
    { id: 22, shape: SHAPE_1,
      /* Beats 1 to 3. She notices, she wonders, and then she tries
         something — and C arrives because she said she would look for
         a way, not because the screen opened carrying it.

         Three sentences on one board, so `lines` rather than
         line/line2. "These two aren't" is an observation and "how can
         we find the distance" is a question; run together they become
         one shrug. The question is the one the whole lesson answers,
         so it is allowed to sit. */
      lines: [ 'But these two aren’t.',
               'How can we find the distance between these two?',
               'Let’s explore.' ],
      /* The pair on the first. Nothing at all on the second — the beat
         only stays open, which is what a question needs. And on the
         third, the side that puts C on the board, with A and C lit
         once it has got there: the dot lands 980ms into that draw, and
         a corner must not be lit before the line that puts it there
         has arrived. */
      lineLights: [ { pulse: 'ab' },
                    { hold: 900 },
                    /* Nothing lit: the side drawing in to C is the
                       thing to look at. But the beat stays open until
                       it has arrived, so nobody is handed on with C
                       still on its way. */
                    { hold: 1700 } ],
      /* C on the word itself, not after the sentence carrying it has
         finished — "explore" is the last word of that line, and a
         third point that appears once she has stopped talking is a
         point the screen produced rather than one she went looking
         for. The dots then light 600ms after the line closes, by which
         time the side that puts C there has arrived. */
      wordCues: [ { word: 'explore', legs: true } ],
      entrance: 'fly',
      layout: 'grid', transition: 'leaves',
      /* The same push its neighbours use, so the whole stretch is read
         at one scale — and taken in order rather than on a timer:
         the paper builds in the middle of an empty frame, moves aside,
         the camera comes in on where the pair is going to be, the two
         points land, and only then does she fly in to talk about them.
         See the grid branch of `dress` and the guard in `goTo`. */
      rebuild: true, view: 'triangle',
      /* Named here rather than three screens on. They are called A and B
         from the moment the question about them is asked, and a pair
         that gains its letters later reads as two different pairs — the
         one she wondered about, and the one the triangle is built on. */
      /* A and B, and only A and B. The run across to C belongs to the
         beat that says to look at it — put here it answered a question
         the child has not been asked yet. */
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      /* Dashed, because it is something she is trying rather than a
         measurement anyone has taken. The child measures it next.
         Held back until the third line asks for it — see `lineLights`
         above and lightAfterLine. */
      legs: [ { from: { x: 2, y: 1 }, to: { x: 6, y: 1 },
                dash: true, mark: { name: 'C' } } ] },

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
    { id: 24, shape: SHAPE_1,
      /* Beats 4 and 5. A guess, and then the reason it is askable.

         "Hmm" is her thinking aloud rather than instructing, which is
         the difference between a child watching somebody work and a
         child being told where to look. The second line is true — they
         measured rows and columns four screens ago — and it is why
         this question can be asked at all.

         C and its dashed guide are already on the board from 22. They
         are declared again so the screen stands on its own after a
         jump: `placeLeg` recognises the same side in the same place
         and hands it over rather than drawing it a second time. */
      line: 'Hmm… what about A and C?',
      line2: 'We know how to find this distance.',
      /* While she talks about A and C, the rest steps back — B and the
         dotted AB fade from her first word, so the side she means is
         the only thing at full strength — and AC pulses once she has
         named it. It stays that way through the question. */
      wordCues: [ { word: 'Hmm', spot: 'h' } ],
      lineLights: [ { pulse: 'h' }, {} ],
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
        countLine: 'Count carefully!'
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
    { id: 25, shape: SHAPE_1,
      /* Beat 6. From her first word the side she is talking about is
         the only one at full strength: C, B and the run between them
         stay, and A, AC and the dotted AB step back — through the
         question, until the screen goes. It used to wait for the end of
         the sentence, so "from C to B" was said over the whole drawing. */
      line: 'Now find the distance from C to B.',
      wordCues: [ { word: 'Now', spot: 'v' } ],
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
        countLine: 'Count carefully!'
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
    { id: 27, shape: SHAPE_1,
      /* Beat 7. The result.

         AC and CB stay exactly as the child left them — both
         `settled`, both carrying the length that was measured — and
         the only thing that moves is AB coming back to full strength.
         So the whole shape is on the board at once for the first time,
         and it is there because of what they just did rather than
         because a screen arrived carrying it.

         This is where the line belongs. It was on 26 once, beside
         three buttons, which made an observation into the preamble of
         a question. Standing on its own it is what it says it is.

         And it is VOICED: 16-look-we-made-a-triangle.mp3 is keyed on
         exactly these words and has been sitting unused since the line
         came off 26. Change the wording and the clip is thrown away
         again. */
      line: 'Look! We made a triangle.',
      entrance: 'none', layout: 'board', keepSegment: true,
      view: 'triangle', quietBoard: true,
      /* Nothing is drawn here, and nothing is singled out either.

         `spots: ['ab']` was tried and is wrong: lighting one side
         hushes the others, so bringing AB forward pushed the two legs
         the child had just measured down to 0.28 — and the point of
         this beat is the shape all three make together. `clear` puts
         the board back instead: AB comes up out of the hush beat 6
         left it in, the legs stay exactly where they were, and the
         whole triangle reads at once. */
      lineLights: [ { clear: true } ],
      /* On the word, not after the sentence. `lineLights` fires when a
         line finishes, and measured that left the hypotenuse wound
         back to nothing until 3.5s into a beat whose words land at
         1.25s — so for over two seconds she was naming a triangle
         with two sides on the board. The shape closes as she says
         what it is. */
      wordCues: [ { word: 'triangle', settle: true } ],
      segment: { a: { x: 2, y: 1, name: 'A' },
                 b: { x: 6, y: 4, name: 'B' } },
      legs: [
        { from: { x: 2, y: 1 }, to: { x: 6, y: 1 }, mark: { name: 'C' },
          settled: true, length: true },
        { from: { x: 6, y: 1 }, to: { x: 6, y: 4 },
          settled: true, length: true }
      ] },

    /* The balloon asks it. It used to say "Look! We've made a
       triangle." with the three names already up on the panel —
       an observation beside three buttons, so the child had to
       work out from the buttons alone that a question was being
       put to them. The beat has a question in it; the line is it.

       Unvoiced for now: the recording says "What kind of triangle
       is IT?" and the balloon must never read one thing while she
       says another — the same call screen 7 made. Re-record, or
       change the word here, and 17-what-kind-of-triangle-is-it.mp3
       comes back. */
    { id: 26, shape: SHAPE_1, line: 'What kind of triangle is this?',
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
         to have it land on the question instead. */
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
    { id: 28, shape: SHAPE_1,
      /* The same drawing as the four beats before it — this screen
         keeps their triangle rather than making one — so it keeps
         their camera too. Without a view named here the push pulls
         all the way back out for one beat and goes in again on the
         next, which reads as the board flinching between two
         sentences about the same picture. */
      view: 'triangle',
      /* The need, then the reason, then the theorem.

         What we have — the two sides the child measured, lit together
         as the screen opens and named after, so she confirms what they
         are already reading. What we need — AB, the one side with no
         length on it, lit on the word that names it. Why the tool
         applies — it is a right triangle, and the marker at C that
         says so stays at full strength the whole time. Then the tool:
         the working, unchanged.

         It used to open "A right triangle!" — the answer the child had
         given one screen before — light the two known sides one after
         the other so they were never seen together, and reach for
         Pythagoras with the marker dimmed by every highlight.

         None of these lines is recorded; neither were the two they
         replace. */
      lines: [ 'We know AC and CB.',
               'But we still need AB.',
               'Since it’s a right triangle, Pythagoras theorem can help!' ],
      entrance: 'stay', layout: 'board',
      /* The working is about the drawing, so the paper steps back:
         the ruling, the axes and their numbering fade and the triangle
         and its lengths are what is left at full strength. The screens
         that write a solution on the board all do this now — it was on
         only the last two of them, so the same beat came up loud on one
         screen and quiet on the next. */
      quietBoard: true, keepSegment: true,
      /* The triangle is left exactly as the child built it: every
         side, every point, both lengths, at full strength, with
         nothing pulsing and nothing stepped back. She names what is
         already plainly there. The holds are the breaths between the
         three sentences — what we have, what we need, why the tool
         applies. */
      /* "We know AC and CB." — the two measured sides come forward and
         pulse while she says it, and AB steps back; when the sentence
         ends the triangle is whole again for the rest of the screen and
         the table. */
      /* The pulse and the fade end together, just after the sentence
         has finished — the pulse used to run on into "But we still
         need AB." with AB already back. */
      wordCues: [ { word: 'We', spot: ['h', 'v'], pulse: ['h', 'v'], run: 1500 } ],
      lineLights: [ { unspot: true, after: 550, hold: 500 }, { hold: 700 }, {} ],
      /* The right angle is what the theorem rests on, so the marker is
         asserted on arrival (a jump from the picker would otherwise
         land without it) and exempt from every highlight's hush —
         through the working too, which lights each side as it writes. */
      rightAngle: true, keepMark: true,
      derive: {
        /* As a table out of the board's edge, not writing on the paper:
           the board slides left, the table opens to its right, and each
           name and number is lifted off the triangle as a copy — which
           is left exactly as the child built it. See workAsTable. */
        table: true,
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
          /* Every name is lifted off the side it names. The bracket
             says "the whole of this side, and THEN squared" — which is
             exactly what a child gets wrong the first time they meet
             AB² and read it as A times B squared. */
          { kind: 'lead', parts: [
              { t: '(AB)\u00B2', lit: 'ab', from: { side: 'ab' } }, { t: ' = ' },
              { t: '(AC)\u00B2', lit: 'h',  from: { side: 'h'  } }, { t: ' + ' },
              { t: '(CB)\u00B2', lit: 'v',  from: { side: 'v'  } } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: '(4)\u00B2', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
              { t: '(3)\u00B2', lit: 'v', from: { leg: 1 } } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '16', lit: 'h' }, { t: ' + ' }, { t: '9', lit: 'v' } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '25', lit: 'ab' } ] },
          /* AB off its side like the first line's, so the answer's
             name is carried in too; the answer itself is worked out,
             so it is written — and it stays in the table: nothing is
             added to the triangle, so it does not fly home onto AB. */
          { kind: 'result', parts: [
              { t: 'AB', lit: 'ab', from: { side: 'ab' } }, { t: ' = ' },
              { t: '5\u00A0units', lit: 'ab' } ] }
        ]
      } },

    /* 19-20 — the method used straight away on two fresh triangles,
       both already drawn. Only the coordinates are given: no side
       lengths, so the legs have to be read off the grid before
       Pythagoras can be applied. Both are Pythagorean triples, so the
       answer comes out whole — 3-4-5 first, then the same shape
       doubled to 6-8-10. */
    /* The child's own go at the argument 22 to 28 made — on a fresh
       triangle, A(−2, 2), B(2, 5), C(2, 2) — ending in the same table
       as 28, filled by the child this time. Three screens on one board,
       one question each, with no sweep between them. */
    { id: 29, shape: SHAPE_2,
      /* Beats 0–3, one thing with each sentence.
         The grid fills and the camera frames the triangle before a point
         is drawn (frameDrawing); A and B go up. Then, with "Now, let's
         find the distance between A and B.", A and B pulse and the dotted
         line between them is drawn as she says "distance" — and nothing
         else is on the board. Her balloon goes; C arrives with a pulse,
         the dotted side from A running out to it; and only then "What is
         the difference between these two points?" — from its first word
         AC is the only side at full strength, B and the dotted AB
         stepping back — with AC glowing after it. CB is not drawn here:
         it comes on the next screen, once AC has been answered. */
      view: 'triangle',
      line: 'Now, let’s find the distance between A and B.',
      line2: 'What is the difference between these two points?',
      guideOnLine: true,
      wordCues: [ { word: 'distance', guide: true, beat: ['a', 'b'] },
                  { word: 'What', spot: 'h' } ],
      lineLights: [ { legs: true, beat: ['c'], quiet: true }, { pulse: 'h' } ],
      entrance: 'none', layout: 'board', quietBoard: true, transition: 'leaves',
      intro: 'measure', distance: true,
      segment: { a: { x: -2, y: 2, name: 'A' }, b: { x: 2, y: 5, name: 'B' }, dash: true },
      legs: [ { from: { x: -2, y: 2 }, to: { x: 2, y: 2 }, dash: true,
                mark: { name: 'C', away: { x: 1, y: 0 } } } ],
      task: { kind: 'distance', measureLeg: 0, countLine: 'Count carefully!' } },

    { id: '29b', shape: SHAPE_2,
      /* Beat 4. AC is settled with its length; CB is drawn, and asked
         the same way: from her first word C, B and the side between them
         are the only things at full strength — A, AC and the dotted AB
         step back — and CB glows as she asks. */
      line: 'What is the difference between these two points?',
      wordCues: [ { word: 'What', spot: 'v' } ],
      lineLights: [ { pulse: 'v' } ],
      entrance: 'none', view: 'triangle', quietBoard: true,
      layout: 'board', distance: true, intro: 'measure', keepSegment: true,
      segment: { a: { x: -2, y: 2, name: 'A' }, b: { x: 2, y: 5, name: 'B' }, dash: true },
      legs: [ { from: { x: -2, y: 2 }, to: { x: 2, y: 2 },
                mark: { name: 'C', away: { x: 1, y: 0 } }, settled: true, length: true },
              { from: { x: 2, y: 2 }, to: { x: 2, y: 5 } } ],
      task: { kind: 'distance', measureLeg: 1, countLine: 'Count carefully!' } },

    { id: '29c', shape: SHAPE_2,
      /* Beats 5–7. The shape named, with its marker on the word — the
         reason the theorem applies — then the table, which the child
         fills blank by blank (runTable). The marker stays at full
         strength to the end, and the triangle is left alone. */
      lines: [ 'Look, we made a right triangle.',
               'Let’s use Pythagoras to find AB.' ],
      /* As she says it, the two sides that make the right angle light
         together and AB steps back — from her first word, not after
         the sentence — and the marker comes up on "triangle". When the
         line is done the triangle goes back to normal. */
      wordCues: [ { word: 'Look', spot: ['h', 'v'] },
                  { word: 'triangle', mark: true } ],
      lineLights: [ { unspot: true, hold: 600 }, {} ],
      keepMark: true,
      entrance: 'none', view: 'triangle', quietBoard: true, layout: 'board', keepSegment: true,
      segment: { a: { x: -2, y: 2, name: 'A' }, b: { x: 2, y: 5, name: 'B' }, dash: true },
      legs: [ { from: { x: -2, y: 2 }, to: { x: 2, y: 2 },
                mark: { name: 'C', away: { x: 1, y: 0 } }, settled: true, length: true },
              { from: { x: 2, y: 2 }, to: { x: 2, y: 5 }, settled: true, length: true } ],
      task: {
        kind: 'table',
        correctLine: 'That’s right!',
        /* The theorem is given; every number after it is a blank the
           child fills, choosing between the two in `offer` (in the order
           they drop down — the right one is not always on top). Each
           wrong number is the mistake that blank is there to catch: the
           other side; squaring as doubling; a slip adding; stopping
           before the square root. Coloured by side where a number is a
           side's (CB green, AC orange), the working's blue otherwise. */
        formula: [
          { kind: 'lead', parts: [
              { t: '(AB)\u00B2', lit: 'ab' }, { t: ' = ' },
              { t: '(CB)\u00B2', lit: 'v' }, { t: ' + ' },
              { t: '(AC)\u00B2', lit: 'h' } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: '(3)\u00B2', lit: 'v', offer: [3, 4] }, { t: ' + ' },
              { t: '(4)\u00B2', lit: 'h', offer: [3, 4] } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: '9', lit: 'ab', offer: [6, 9] }, { t: ' + ' },
              { t: '16', lit: 'ab', offer: [16, 8] } ] },
          { kind: 'step', parts: [
              { t: '= ' }, { t: '25', lit: 'ab', offer: [23, 25] } ] },
          { kind: 'result', parts: [
              { t: 'AB', lit: 'ab' }, { t: ' = ' },
              { t: '5\u00A0units', lit: 'ab', offer: [5, 25] } ] }
        ] } },

    /* 30–30c — Question 2, the way 29 taught it, on a harder triangle:
       A(−3, 3), B(5, −3), C(5, 3), across three quadrants. A and B go up
       and pulse, the dotted line between them is drawn as she says
       "AB"; then AC is drawn out to C and she asks for it; then CB; then
       the table, which the child fills. 8, 6, 10.
       From here to the end the board carries no numbers on its axes —
       every point has its coordinates written beside it, and those are
       what the child reads. The axes still sweep in. Said once, on 30;
       it holds for every screen after (Game.numbersAt). */
    ...walk({
      ids: [30, '30b', '30c'],
      a: { x: -3, y: 3 }, b: { x: 5, y: -3 }, c: { x: 5, y: 3 },
      say: { first: 'Now find AB.', cue: 'AB' },
      base: { view: 'triangle', range: { min: 0, max: 12 } },
      first: { transition: 'leaves', numbers: false }
    }),

    /* 31–36 — the general triangle, on the board layout the questions
       before it use, so the answers can rise under her. Subscripts and
       the minus sign are real characters now: the game carries its own
       font for them. */
    { id: 31, shape: SHAPE_G, line: 'The same idea works for any two points.', entrance: 'fly',
      layout: 'board', transition: 'leaves',
      segment: {
        a: { x: -5, y: 1, coordParts: [ { t: '(' }, { t: 'x₁', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₁', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, coordParts: [ { t: '(' }, { t: 'x₂', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₂', glow: 'y' }, { t: ')' } ] }
      } },

    /* 32 — the same general segment, with the corner dropped and both
       legs drawn: the right-angled triangle in its general form. The
       corner is named from the two points' own coordinates. */
    { id: 32, shape: SHAPE_G, line: null, entrance: 'stay',
      layout: 'board', keepSegment: true,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x₁', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₁', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x₂', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₂', glow: 'y' }, { t: ')' } ] }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x₂, y₁)', fill: '#3B7DD8' } },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 } }
      ] },

    /* 33 — the horizontal side named. Nothing asked: as she says "AC",
       AC and its two corners stay at full strength and the rest steps
       back, and its length is put together in the middle of the side as
       she says it — x₂ lifted off B's label, then the sign, then x₁ off
       A's. */
    { id: 33, shape: SHAPE_G, line: 'AC = x₂ − x₁', entrance: 'stay',
      layout: 'board', keepSegment: true,
      wordCues: [ { word: 'AC', spot: 'h', leg: 0 } ],
      hold: 1800,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x₁', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₁', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x₂', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₂', glow: 'y' }, { t: ')' } ] }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x₂, y₁)', fill: '#3B7DD8' },
          settled: true, lengthText: 'x₂ − x₁',
          /* both symbols read straight off the two labels */
          lengthFrom: [ { p: 'b', half: 'x' }, { p: 'a', half: 'x' } ] },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 }, settled: true }
      ] },

    /* 34 — and the vertical side, the same way: CB, C and B stay at full
       strength while she says it; y₂, then the sign, then y₁, written
       along CB, between C and B. */
    { id: 34, shape: SHAPE_G, line: 'CB = y₂ − y₁', entrance: 'stay',
      layout: 'board', keepSegment: true,
      wordCues: [ { word: 'CB', spot: 'v', leg: 1 } ],
      hold: 1800,
      segment: {
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x₁', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₁', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x₂', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₂', glow: 'y' }, { t: ')' } ] }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x₂, y₁)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x₂ − x₁' },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 },
          settled: true, lengthText: 'y₂ − y₁',
          lengthFrom: [ { p: 'b', half: 'y' }, { p: 'a', half: 'y' } ] }
      ] },

    /* 35 — and AB: it lights as she names it, then she flies off, the
       board makes room and the formula opens out of its right edge,
       every piece of it carried in off the triangle — AB, CB and AC off
       their sides, y₂ − y₁ and x₂ − x₁ off the lengths just written —
       ending on AB = √((y₂ − y₁)² + (x₂ − x₁)²). Nothing asked. */
    { id: 35, shape: SHAPE_G, line: 'Now, let’s find AB.', entrance: 'stay',
      layout: 'board', keepSegment: true,
      wordCues: [ { word: 'AB', spot: 'ab' } ],
      lineLights: [ { unspot: true, after: 500 } ],
      /* The child's to fill, the way 29c's table is: she flies off, the
         board makes room and the table opens out of its right edge — AB,
         CB and AC carried in off the triangle — then each blank, tapped,
         drops two tiles: the side's own difference, read off the labels
         on the board, or the sum a child reaches for instead. Then the
         root is written and she comes back under the table. */
      task: {
        kind: 'table',
        correctLine: 'That’s right!',
        tableSize: 36,
        formula: [
          { kind: 'lead', parts: [
              { t: '(AB)\u00B2', lit: 'ab', from: { side: 'ab' } }, { t: ' = ' },
              { t: '(CB)\u00B2', lit: 'v',  from: { side: 'v'  } }, { t: ' + ' },
              { t: '(AC)\u00B2', lit: 'h',  from: { side: 'h'  } } ] },
          { kind: 'step', parts: [
              { t: '= ' },
              { t: '(y\u2082 \u2212 y\u2081)\u00B2', lit: 'v', answer: 'y\u2082 \u2212 y\u2081',
                offer: [ 'y\u2081 + y\u2082', 'y\u2082 \u2212 y\u2081' ] }, { t: ' + ' },
              { t: '(x\u2082 \u2212 x\u2081)\u00B2', lit: 'h', answer: 'x\u2082 \u2212 x\u2081',
                offer: [ 'x\u2082 \u2212 x\u2081', 'x\u2081 + x\u2082' ] } ] },
          { kind: 'result', inline: true, parts: [
              { t: 'AB', lit: 'ab' }, { t: ' = ' },
              { t: '\u221A((y\u2082 \u2212 y\u2081)\u00B2 + (x\u2082 \u2212 x\u2081)\u00B2)', lit: 'ab' } ] }
        ] },
      segment: {
        a: { x: -5, y: 1, name: 'A', coordParts: [ { t: '(' }, { t: 'x₁', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₁', glow: 'y' }, { t: ')' } ] },
        b: { x:  5, y: 4, name: 'B', coordParts: [ { t: '(' }, { t: 'x₂', glow: 'x' }, { t: ',\u00A0' },
                           { t: 'y₂', glow: 'y' }, { t: ')' } ] }
      },
      legs: [
        { from: { x: -5, y: 1 }, to: { x: 5, y: 1 },
          mark: { name: 'C', coordText: '(x₂, y₁)', fill: '#3B7DD8' },
          settled: true, length: true, lengthText: 'x₂ − x₁' },
        { from: { x:  5, y: 1 }, to: { x: 5, y: 4 },
          settled: true, length: true, lengthText: 'y₂ − y₁' }
      ] },

    /* 36 — the recap of the formula — is gone: 35 has just written it.

       37 — what that formula is: no leaf sweep, the table stays where 35
       wrote it, and she flies back under it to say so. */
    { id: 37, shape: SHAPE_G, line: 'And that gives us the distance between any two points!',
      entrance: 'stay', layout: 'board', keepSegment: true, keepTable: true },


    /* Back to the field, behind the leaves: the scene changes here now
       that 37 stays on the board with the table. */
    { id: 38, line: 'What if both points are on the x-axis?', entrance: 'fly',
      transition: 'leaves' },

    /* 29 — the x-axis case worked through: the general formula narrows
       to |x2 - x1| as the y terms fall away. She says which case it is
       from her own bubble, standing beside the board. */
    { id: 39, line: 'Both points are on the x-axis.', entrance: 'none',
      layout: 'xaxis', transition: 'leaves',
      /* The child's own go (runAxisPick): the board builds in the middle
         and moves across, she says which case it is and goes, and the
         table opens out of the board for the child to fill. */
      task: { kind: 'table', formula: XAXIS.picks, tableSize: 32,
              correctLine: 'Exactly! There\u2019s no vertical distance.' } },

    /* 30 — leaves again, and the same empty field as 25: board and
       working left behind, Swifty flying back in alone to put the next
       question. */
    { id: 40, line: 'And what if they’re on the y-axis?',
      entrance: 'fly', transition: 'leaves' },

    /* 31 — the same working as 27 with the axes swapped: the x terms
       are the pair that falls away this time. */
    { id: 41, line: 'Both points are on the y-axis.', entrance: 'none',
      layout: 'yaxis', transition: 'leaves',
      task: { kind: 'table', formula: YAXIS.picks, tableSize: 32,
              correctLine: 'Exactly! There\u2019s no horizontal distance.' } },

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
      line: 'Maya wants to walk to the closer cafe. Which cafe is closer to her house?',
      /* The house and the two cafes, and nothing else: the school and
         the park have nothing to do with this question. Every place on
         the map has its point and its coordinates. */
      town: ['house', 'cafeA', 'cafeB'], textScale: 0.85,
      /* Plotted, not joined: a line between any two of them would say
         which pair the question is about, which is the question. */
      pointsOnly: true,
      segment: { a: { x: 1, y: 1 }, b: { x: 5, y: 4 }, coordSide: 'under' },
      // the third place, plotted the same way and labelled the same way
      mark: [ { x: -5, y: 3 } ],
      /* The answers go up FIRST and she arrives after — the reverse of
         every other question in the game. The child looks at a town
         with two cafes in it and has begun to wonder before anyone says
         anything. No hint under them: the question is the whole screen. */
      askLast: true,
      options: [
        { key: 'a', label: 'Cafe A', cls: 'cafe-a' },
        { key: 'b', label: 'Cafe B', cls: 'cafe-b' }
      ],
      optionRow: true,              // side by side, as the two places are
      perch: 'b',                   // and she stands on the top right corner
      task: {
        kind: 'choice',
        answer: 'a',
        /* One rung, and it must not narrow the field: on a two-answer
           question "try the other one" is the answer. */
        feedback: ['Not quite — have another look.'],
        voiceOnly: true,
        /* Right: past the walks, to the line that closes it. */
        rightAt: 46,
        /* Wrong twice: the two walks, worked the way 29 taught them. */
        teachAt: 43
      } },

    /* One sentence and a breath — a child needs a moment to stop being
       wrong before they can start learning. */
    { id: 43, line: 'Oops! Let’s find it together.',
      entrance: 'stay', layout: 'board', keepSegment: true,
      town: ['house', 'cafeA', 'cafeB'], textScale: 0.85,
      hold: 1500 },

    /* 44–44c — the house to Cafe A, the way 29 taught it: the house and
       Cafe A stay at full strength and Cafe B steps back; they are
       named A and B and joined by the dotted line as she says it; AC
       is drawn out and measured on the reel, then CB; then the table.
       3, 4, 5. */
    ...walk({
      ids: [44, '44b', '44c'],
      a: { x: 1, y: 1 }, b: { x: 5, y: 4 }, c: { x: 5, y: 1 },
      seg: { coordSide: 'under' },
      say: { first: 'First, the house to Cafe A.' },
      base: { textScale: 0.85, town: ['house', 'cafeA', 'cafeB'], townFocus: ['house', 'cafeA'],
              mark: [ { x: -5, y: 3 } ], range: { min: 0, max: 7 } },
      first: { keepSegment: true }
    }),

    /* 45–45c — and the house to Cafe B, the same way, on a fresh board:
       six across, two up, and a root that does not come out whole —
       √40, which is more than 6 and so more than Cafe A's 5. */
    ...walk({
      ids: [45, '45b', '45c'],
      a: { x: 1, y: 1 }, b: { x: -5, y: 3 }, c: { x: -5, y: 1 },
      seg: { coordSide: 'under' },
      say: { first: 'Now, the house to Cafe B.' },
      base: { textScale: 0.85, town: ['house', 'cafeA', 'cafeB'], townFocus: ['house', 'cafeB'],
              mark: [ { x: 5, y: 4 } ], range: { min: 0, max: 8 } },
      /* No leaf sweep: it follows the last walk's table on the same
         town, so she flies off from under it and back in (flyBack). */
      first: { flyBack: true }
    }),

    /* The comparison, not the winner: both walks on the map with their
       lengths, and the smaller one named. */
    { id: 46, line: '5 is less than \u221A40 \u2014 so Cafe A is closer.',
      /* No leaf sweep: she flies off from under the second walk's table
         (or from the answers, answered right on 42), the table folds away
         and the board slides back, the walk's triangle fades — and the
         pair already on the board STAYS: the two places, their points and
         their coordinates, exactly where they were. Its line is drawn
         solid with its length on it, and the other walk is drawn beside
         it (compareWalks). */
      entrance: 'fly', layout: 'board', flyBack: true,
      town: ['house', 'cafeA', 'cafeB'], textScale: 0.85,
      keepSegment: true, dropLegs: true, dropNames: true,
      compare: [
        { a: { x: 1, y: 1 }, b: { x: -5, y: 3 }, coordSide: 'under',
          result: { text: '\u221A40\u00A0units' } },
        { a: { x: 1, y: 1 }, b: { x: 5, y: 4 }, coordSide: 'under',
          result: { text: '5\u00A0units' } }
      ],
      hold: 5200 },

    /* 47 — the same question with the other two places: the house, the
       school and the park, and no cafes. Right, and the comparison
       closes it; wrong twice, and both walks are worked. */
    { id: 47, entrance: 'fly', layout: 'board', transition: 'leaves',
      line: 'Which is closer to Maya’s house — the school or the park?',
      town: ['house', 'school', 'park'], textScale: 0.85,
      pointsOnly: true,
      segment: { a: { x: 1, y: 1, labelAt: HOUSE_LABEL }, b: { x: 5, y: -4 }, coordSide: 'under' },
      mark: [ { x: -3, y: 2, labelAt: PARK_LABEL } ],
      askLast: true,
      options: [
        { key: 'school', label: 'School', cls: 'school' },
        { key: 'park',   label: 'Park',   cls: 'park' }
      ],
      optionRow: true,
      perch: 'park',
      task: {
        kind: 'choice',
        answer: 'park',
        feedback: ['Not quite — have another look.'],
        voiceOnly: true,
        rightAt: 48,
        teachAt: '47a'
      } },

    { id: '47a', line: 'Oops! Let’s find it together.',
      entrance: 'stay', layout: 'board', keepSegment: true,
      town: ['house', 'school', 'park'], textScale: 0.85,
      hold: 1500 },

    /* The house to the school: down first, then across — five, four,
       and √41. The first side leaves the house downwards, clear of the
       house's picture, which stands above its point. */
    ...walk({
      ids: ['47b', '47c', '47d'],
      a: { x: 1, y: 1, extra: { labelAt: HOUSE_LABEL } }, b: { x: 5, y: -4 }, c: { x: 1, y: -4 },
      seg: { coordSide: 'under' },
      say: { first: 'First, the house to the school.' },
      base: { textScale: 0.85, town: ['house', 'school', 'park'], townFocus: ['house', 'school'],
              mark: [ { x: -3, y: 2, labelAt: PARK_LABEL } ], range: { min: 0, max: 8 } },
      first: { keepSegment: true }
    }),

    /* The house to the park: four across, one up, and √17. */
    ...walk({
      ids: ['47e', '47f', '47g'],
      /* B's label to the right of the park's trees, above the dotted line
         — anywhere the rule looked, the trees or a line was in the way,
         and it ended up behind them. Named, it stays there. */
      a: { x: 1, y: 1, extra: { labelAt: HOUSE_LABEL } }, b: { x: -3, y: 2, extra: { labelAt: PARK_LABEL } },
      /* And C's under C, clear of the short side CB — so CB's "1 unit"
         can sit beside its own line. */
      c: { x: -3, y: 1 }, cAway: { x: 0, y: 1 },
      seg: { coordSide: 'under' },
      say: { first: 'Now, the house to the park.' },
      base: { textScale: 0.85, town: ['house', 'school', 'park'], townFocus: ['house', 'park'],
              mark: [ { x: 5, y: -4 } ], range: { min: 0, max: 6 } },
      /* No leaf sweep: it follows the last walk's table on the same
         town, so she flies off from under it and back in (flyBack). */
      first: { flyBack: true }
    }),

    { id: 48, line: '\u221A17 is less than \u221A41 \u2014 so the park is closer.',
      /* As 46: no leaf sweep, the pair on the board kept as it is, its
         line drawn solid with its length, the other walk beside it. */
      entrance: 'fly', layout: 'board', flyBack: true,
      town: ['house', 'school', 'park'], textScale: 0.85,
      keepSegment: true, dropLegs: true, dropNames: true,
      compare: [
        { a: { x: 1, y: 1, labelAt: HOUSE_LABEL }, b: { x: -3, y: 2, labelAt: PARK_LABEL }, coordSide: 'under',
          result: { text: '\u221A17\u00A0units' } },
        { a: { x: 1, y: 1, labelAt: HOUSE_LABEL }, b: { x: 5, y: -4 }, coordSide: 'under',
          result: { text: '\u221A41\u00A0units' } }
      ],
      hold: 5200 },

    /* ================= the towers and the rescue =================
       No town, and no help with the method: two towers, then the
       station and the van — each worked as a walk, on the child's own. */

    /* 49–49c — the connection between the two towers: across, then
       down; six, eight, ten. Then on to the station. */
    ...walk({
      ids: [49, '49b', '49c'],
      a: { x: -2, y: 5 }, b: { x: 4, y: -3 }, c: { x: 4, y: 5 },
      seg: { coordSide: 'under' },
      say: { first: 'How long should this connection be?', cue: 'connection' },
      base: { textScale: 0.85, town: ['towerA', 'towerB'], range: { min: 0, max: 12 } },
      first: { transition: 'leaves', entrance: 'fly' },
      done: 54
    }),

    /* 54–54c — the station is at zero and the van at (−5, −12): along
       the x-axis to the corner, then down; five, twelve, thirteen. On
       the reel, like every other walk; on the wide board, where a unit
       is still a cell. */
    ...walk({
      ids: [54, '54b', '54c'],
      a: { x: 0, y: 0 }, b: { x: -5, y: -12 }, c: { x: -5, y: 0 },
      say: { first: 'The station is right at zero.', cue: 'station' },
      base: { textScale: 0.85, town: ['station', 'van'], board: 'wide', range: { min: 0, max: 15 } },
      first: { transition: 'leaves', entrance: 'fly' }
    }),

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
      quietBoard: true, park: true,
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
      quietBoard: true, park: true,
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
      quietBoard: true, park: true,
      intro: 'measure', entry: true, range: { min: 0, max: 18 },
      /* A and B's coordinates in parts, so the working can carry their
         numbers out of them. The same words either way. */
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under', coordParts: [ { t: '(' }, { t: '−6', glow: 'x' }, { t: ',\u00A0' }, { t: '−2', glow: 'y' }, { t: ')' } ] },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under', coordParts: [ { t: '(' }, { t: '6', glow: 'x' }, { t: ',\u00A0' }, { t: '−7', glow: 'y' }, { t: ')' } ] } },
      legs: [
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C' }, settled: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true }
      ],
      task: { kind: 'entry', pair: 'AB', answer: 13, noCount: true,
              keepLength: true,
              correctLine: 'Thirteen. That one stays.',
              feedback: ['Square them, add, then take the root.'],
              /* Missed twice: she flies off, the board makes room, and the
                 working opens out of its right edge as a table — AB
                 carried in off its side, then the four numbers lifted out
                 of A's and B's coordinates into the formula, then worked
                 through to 13. It stays on AB after. */
              showWorking: true, table: true, tableSize: 36,
              formula: [
                { inline: true, parts: [
                    { t: '(' }, { t: 'AB', lit: 'ab', from: { side: 'ab' } }, { t: ')\u00B2' },
                    { t: ' = ' },
                    { t: '(x\u2082 \u2212 x\u2081)\u00B2 + (y\u2082 \u2212 y\u2081)\u00B2' } ] },
                { inline: true, parts: [
                    { t: '= ' }, { t: '(' },
                    { t: '6', from: { p: 'b', half: 'x' } }, { t: ' \u2212 (' },
                    { t: '\u22126', from: { p: 'a', half: 'x' } }, { t: '))\u00B2 + (' },
                    { t: '\u22127', from: { p: 'b', half: 'y' } }, { t: ' \u2212 (' },
                    { t: '\u22122', from: { p: 'a', half: 'y' } }, { t: '))\u00B2' } ] },
                { inline: true, parts: [ { t: '= ' }, { t: '12\u00B2 + (\u22125)\u00B2' } ] },
                { inline: true, parts: [ { t: '= ' }, { t: '144 + 25 = 169' } ] },
                { inline: true, parts: [
                    { t: 'AB' }, { t: ' = ' }, { t: '\u221A169 = 13\u00A0units', lit: 'ab' } ] }
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
      park: true,
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
              countLine: 'Count carefully!' } },

    { id: 59, line: 'One more. Find CA.', focus: 'v',
      entrance: 'none', layout: 'board', board: 'mid', keepSegment: true,
      quietBoard: true, park: true,
      intro: 'measure', entry: true, range: { min: 0, max: 18 },
      segment: { a: { x: -6, y: -2, name: 'A', coordSide: 'under', coordParts: [ { t: '(' }, { t: '−6', glow: 'x' }, { t: ',\u00A0' }, { t: '−2', glow: 'y' }, { t: ')' } ] },
                 b: { x:  6, y: -7, name: 'B', coordSide: 'under', coordParts: [ { t: '(' }, { t: '6', glow: 'x' }, { t: ',\u00A0' }, { t: '−7', glow: 'y' }, { t: ')' } ] },
                 result: { text: '13\u00A0units' } },
      legs: [
        /* C's coordinates in parts as well: the working lifts its 6 and
           its 7 out of them. */
        { from: { x:  6, y: -7 }, to: { x: 6, y: 7 }, mark: { name: 'C', coordParts: [ { t: '(' }, { t: '6', glow: 'x' }, { t: ',\u00A0' }, { t: '7', glow: 'y' }, { t: ')' } ] },
          settled: true, length: true },
        { from: { x:  6, y:  7 }, to: { x: -6, y: -2 }, settled: true }
      ],
      task: { kind: 'entry', measureLeg: 1, answer: 15, noCount: true,
              keepLength: true,
              correctLine: 'Fifteen. All three are down.',
              feedback: ['Square them, add, then take the root.'],
              /* As on 57: missed twice, the working comes as a table, CA
                 carried in off its side and the numbers lifted out of C's
                 and A's coordinates, read from C to A. */
              showWorking: true, table: true, tableSize: 36,
              formula: [
                { inline: true, parts: [
                    { t: '(' }, { t: 'CA', lit: 'v', from: { side: 'v' } }, { t: ')\u00B2' },
                    { t: ' = ' },
                    { t: '(x\u2082 \u2212 x\u2081)\u00B2 + (y\u2082 \u2212 y\u2081)\u00B2' } ] },
                { inline: true, parts: [
                    { t: '= ' }, { t: '(' },
                    { t: '\u22126', from: { p: 'a', half: 'x' } }, { t: ' \u2212 ' },
                    { t: '6', from: { p: 'c', half: 'x' } }, { t: ')\u00B2 + (' },
                    { t: '\u22122', from: { p: 'a', half: 'y' } }, { t: ' \u2212 ' },
                    { t: '7', from: { p: 'c', half: 'y' } }, { t: ')\u00B2' } ] },
                { inline: true, parts: [ { t: '= ' }, { t: '(\u221212)\u00B2 + (\u22129)\u00B2' } ] },
                { inline: true, parts: [ { t: '= ' }, { t: '144 + 81 = 225' } ] },
                { inline: true, parts: [
                    { t: 'CA' }, { t: ' = ' }, { t: '\u221A225 = 15\u00A0units', lit: 'v' } ] }
              ] } },

    /* 60 — the screen the whole repair is for. Three numbers become a
       property here, and a child who computed all three perfectly can
       still not have noticed what they MEAN. It is also where 13 and 14
       being close has to be decided out loud: about-the-same is not the
       same. */
    { id: 60, line: 'What do you notice about the side lengths?',
      entrance: 'stay', layout: 'board', board: 'mid', keepSegment: true,
      askFirst: true, optionRow: false, quietBoard: true, park: true,
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
      askFirst: true, optionTrio: true, quietBoard: true, park: true,
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
    VERSION, STAGE_W, STAGE_H, ART, SHEETS, SHEET_W, SHEET_H,
    SWIFTY, CHAR_SCALE, ANCHOR, HEAD_TOP, FEET_DY, SHADOW, CLOUD,
    S5_ORIGIN, GRID, STAND, S8_ORIGIN, BOARD, RECAP, XAXIS, YAXIS, TOWN,
    BUBBLE, PLAY, START, AUDIO, AUTO, NAV, MOTION, SCRIPT
  };
})();

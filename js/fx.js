/* =============================================================
   Kid-friendly effects: sparkles, confetti, star bursts, dust
   puffs and drifting motes. All DOM based so they inherit the
   stage's scale transform for free.
   ============================================================= */
window.FX = (function () {
  'use strict';

  let layer = null;
  const CANDY = ['#FFD34E', '#FF8A3D', '#4ED6C8', '#7BD44B', '#FF6FA5', '#5AAEFF', '#FFFFFF'];

  function init(el) { layer = el; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function spawn(cls, styles, life) {
    const d = document.createElement('div');
    d.className = 'fx ' + cls;
    /* Custom properties have to go through setProperty: assigning them
       onto the style object does nothing, which silently left every
       effect that animates through a var() with no values to animate
       to — the pieces were created and then never moved. */
    Object.keys(styles).forEach(function (k) {
      if (k.indexOf('--') === 0) d.style.setProperty(k, styles[k]);
      else d.style[k] = styles[k];
    });
    layer.appendChild(d);
    setTimeout(function () { d.remove(); }, life);
    return d;
  }

  /* A ring of stars flying outward — used on the play button. */
  function starBurst(x, y, count, spread) {
    count = count || 14;
    spread = spread || 190;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + rnd(-0.18, 0.18);
      const dist = rnd(spread * 0.55, spread);
      const size = rnd(16, 30);
      const life = rnd(650, 1000);
      const s = spawn('fx-star', {
        left: x + 'px', top: y + 'px',
        width: size + 'px', height: size + 'px',
        background: pick(CANDY),
        '--dx': Math.cos(a) * dist + 'px',
        '--dy': Math.sin(a) * dist + 'px',
        '--spin': rnd(-320, 320) + 'deg',
        animationDuration: life + 'ms'
      }, life + 60);
      s.style.animationDelay = rnd(0, 90) + 'ms';
    }
  }

  /* An expanding ring, layered under a burst for punch. */
  function ring(x, y, size, color) {
    spawn('fx-ring', {
      left: x + 'px', top: y + 'px',
      width: size + 'px', height: size + 'px',
      borderColor: color || 'rgba(255,255,255,.9)'
    }, 720);
  }

  /* Confetti raining across the whole stage. */
  /* Confetti over the whole frame, falling from above. The delays are
     kept short so the pieces arrive as one burst rather than trickling
     down — a long spread reads as weather, not as a celebration. */
  function confetti(count) {
    count = count || 46;
    for (let i = 0; i < count; i++) {
      const w = rnd(10, 20), h = rnd(14, 26);
      const life = rnd(2000, 3200);
      spawn('fx-confetti', {
        left: rnd(-40, 1960) + 'px', top: rnd(-300, -60) + 'px',
        width: w + 'px', height: h + 'px',
        background: pick(CANDY),
        borderRadius: Math.random() < 0.4 ? '50%' : '3px',
        '--dx': rnd(-170, 170) + 'px',
        '--fall': rnd(1240, 1500) + 'px',
        '--spin': rnd(-900, 900) + 'deg',
        animationDuration: life + 'ms',
        /* Most of the burst lands together; a few stragglers follow so
           the tail of it does not stop dead. */
        animationDelay: (Math.random() < 0.8 ? rnd(0, 170) : rnd(170, 520)) + 'ms'
      }, life + 800);
    }
  }

  /* Twinkles around a point — Swifty's landing and each new line. */
  function sparkles(x, y, count, radius) {
    count = count || 10;
    radius = radius || 150;
    for (let i = 0; i < count; i++) {
      const life = rnd(700, 1200);
      spawn('fx-twinkle', {
        left: x + rnd(-radius, radius) + 'px',
        top: y + rnd(-radius * 0.75, radius * 0.75) + 'px',
        width: rnd(12, 26) + 'px', height: rnd(12, 26) + 'px',
        background: pick(CANDY),
        animationDuration: life + 'ms',
        animationDelay: rnd(0, 350) + 'ms'
      }, life + 400);
    }
  }

  /* Dust kicked up where Swifty touches down. */
  function puff(x, y) {
    for (let i = 0; i < 12; i++) {
      const dir = i < 6 ? -1 : 1;
      const life = rnd(520, 820);
      spawn('fx-puff', {
        left: x + 'px', top: y + 'px',
        width: rnd(26, 54) + 'px', height: rnd(26, 54) + 'px',
        '--dx': dir * rnd(40, 165) + 'px',
        '--dy': rnd(-50, -8) + 'px',
        animationDuration: life + 'ms',
        animationDelay: rnd(0, 90) + 'ms'
      }, life + 120);
    }
  }

  /* Slow ambient motes so the scene is never completely still. */
  function motes(count) {
    count = count || 18;
    for (let i = 0; i < count; i++) {
      const life = rnd(9000, 16000);
      const d = spawn('fx-mote', {
        left: rnd(0, 1920) + 'px', top: rnd(240, 1040) + 'px',
        width: rnd(7, 15) + 'px', height: rnd(7, 15) + 'px',
        '--dx': rnd(-90, 90) + 'px',
        '--rise': rnd(220, 460) + 'px',
        animationDuration: life + 'ms',
        animationDelay: rnd(0, 6000) + 'ms'
      }, life + 6200);
      d.dataset.loop = '1';
    }
  }

  /* Fills the sky with drifting copies of the single cloud sprite.
     Each cloud is a clipping window onto the cloud's ink box, so the
     transparent canvas around it never takes up space. */
  function clouds(sky) {
    const C = window.CFG.CLOUD;
    sky.innerHTML = '';
    C.instances.forEach(function (inst) {
      const sc = inst.scale;
      const w = C.ink.w * sc, h = C.ink.h * sc;
      /* The cloud drifts to one end of the open sky and back again,
         never leaving it: its far edge stops exactly where the band
         does, so no part of it ever reaches a tree. That means it
         needs no fading at the ends — it is simply always in the sky. */
      const B = C.band;
      const dist = (B.x1 - w) - B.x0;
      const dur = dist / inst.speed;

      const d = document.createElement('div');
      d.className = 'cloud';
      d.style.top = inst.top + 'px';
      d.style.width = w + 'px';
      d.style.height = h + 'px';
      d.style.opacity = inst.opacity;
      d.style.setProperty('--x0', B.x0 + 'px');
      d.style.setProperty('--x1', (B.x1 - w) + 'px');
      d.style.animationDuration = dur + 's';
      // a negative delay starts it already part-way along the drift
      d.style.animationDelay = -(inst.phase * dur) + 's';

      const im = document.createElement('img');
      im.src = C.src;
      im.alt = '';
      im.style.width = C.srcW * sc + 'px';
      im.style.height = C.srcH * sc + 'px';
      im.style.left = -C.ink.x * sc + 'px';
      im.style.top = -C.ink.y * sc + 'px';
      d.appendChild(im);
      sky.appendChild(d);
    });
  }

  /* One leaf at a time lifts off the tree in the top left corner,
     loops once on the wind and drifts away to the right. A few speed
     lines follow it down the same path a beat behind — the wake is
     drawn as streaks, never as more leaves, so there is only ever the
     one leaf in the air.

     The path is an SVG one and the leaf rides it with offset-path, so
     the loop is a real curve rather than a stack of translations, and
     offset-rotate turns each piece to face the way it is going. */
  const DRIFT = {
    /* Slow and rare on purpose. The board is what the child should be
       looking at, so a leaf takes its time crossing and a long while
       passes before the next — long enough that it registers as
       weather rather than as something happening. */
    dur: 15000,              // one leaf's whole journey
    /* The next only lifts off once the last has gone, so there is
       never more than one leaf on the wing. */
    gapMin: 14000, gapMax: 28000,
    lines: 3                 // its wake — streaks only, never more leaves
  };

  /* Out of the canopy, once round a loop, then away east. The loop's
     place and size move each time so no two leaves take the same
     line. */
  function driftPath(y0, cx, cy, r, endY) {
    /* Starts inside the canopy, so the leaf reads as leaving the tree
       rather than appearing in clear sky. The foliage reaches x 390 at
       y 120 and narrows to x 234 by y 280, so 270 is inside it for the
       whole range of heights a leaf can start from. */
    return 'M 270,' + y0 +
      ' C 470,' + (y0 - 70) + ' ' + (cx - 170) + ',' + (cy - r - 110) + ' ' + cx + ',' + (cy - r) +
      ' A ' + r + ',' + r + ' 0 0 1 ' + cx + ',' + (cy + r) +
      ' A ' + r + ',' + r + ' 0 0 1 ' + (cx + 0.4) + ',' + (cy - r) +
      ' C ' + (cx + 230) + ',' + (cy - r + 50) + ' ' +
              (cx + 640) + ',' + (endY - 80) + ' 2140,' + endY;
  }

  function driftOnce(host) {
    const y0 = rnd(140, 250);          // up in the canopy, where it is widest
    const cx = rnd(720, 1000), cy = rnd(300, 440), r = rnd(70, 125);
    const path = driftPath(y0, cx, cy, r, rnd(360, 640));
    const size = rnd(54, 78);
    const spin = (Math.random() < 0.5 ? -1 : 1) * rnd(300, 520);

    /* Everything rides the same path; what separates them is how far
       behind they start and how solid they are. */
    const ride = function (el, delay, op) {
      el.classList.add('fx-drift');
      el.style.setProperty('offset-path', 'path("' + path + '")');
      el.style.setProperty('--spin', spin + 'deg');
      el.style.setProperty('--op', op);
      el.style.animationDuration = DRIFT.dur + 'ms, ' + DRIFT.dur + 'ms';
      el.style.animationDelay = delay + 'ms, ' + delay + 'ms';
      host.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); },
                 DRIFT.dur + delay + 200);
    };

    // the speed lines go first, furthest back
    for (let i = 0; i < DRIFT.lines; i++) {
      const l = document.createElement('div');
      l.classList.add('fx-windline');
      l.style.width = rnd(70, 140) + 'px';
      l.style.marginTop = rnd(-26, 26) + 'px';
      ride(l, 430 + i * 200, rnd(0.14, 0.28));
    }
    // and the one leaf, solid, in front of its own wake
    const leaf = document.createElement('img');
    leaf.src = window.CFG.ART.leaf;
    leaf.alt = '';
    leaf.style.width = size + 'px';
    ride(leaf, 0, 1);

    if (window.Audio8 && window.Audio8.breeze) window.Audio8.breeze();
  }

  /* Kicks the cycle off and keeps it going: one leaf, a pause, the
     next. Started once at boot and left to run. */
  function leafDrift(sky) {
    let host = sky.querySelector('.drift-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'drift-host';
      sky.appendChild(host);
    }
    const again = function () {
      driftOnce(host);
      setTimeout(again, DRIFT.dur + rnd(DRIFT.gapMin, DRIFT.gapMax));
    };
    setTimeout(again, 1200);
  }

  /* A gust of leaves sweeps the frame. They blow in from the left,
     fill it completely for a beat, then blow on out to the right —
     `onCover` fires during that beat, which is when the scene behind
     gets swapped, and `onDone` once the frame is clear again.

     One leaf image serves the whole drift: each copy gets its own
     size, tilt, spin and a filter that shifts it along the autumn
     range, so nothing reads as the same leaf twice. */
  const LEAF_TINT = [
    'none',
    'hue-rotate(-12deg) saturate(1.18)',                  // toward red
    'hue-rotate(14deg) brightness(1.07)',                 // toward gold
    'hue-rotate(24deg) saturate(.88) brightness(1.13)',   // pale yellow
    'saturate(1.25) brightness(.9)',                      // deep and dark
    'hue-rotate(-20deg) saturate(1.1) brightness(.95)'    // rust
  ];

  const LEAF_DUR = 2600;          // the whole sweep
  const LEAF_COVER = 0.51;        // where it is solid, and the swap lands

  function leaves(el, onCover, onDone) {
    el.innerHTML = '';
    el.classList.remove('hidden');

    /* A warm veil under the drift guarantees the swap is never seen,
       however the leaves happen to fall. */
    const veil = document.createElement('div');
    veil.className = 'leaf-veil';
    veil.style.animationDuration = LEAF_DUR + 'ms';
    el.appendChild(veil);

    const src = window.CFG.ART.leaf;
    let maxDelay = 0;

    for (let i = 0; i < 92; i++) {
      const size = rnd(140, 380);
      const d = document.createElement('img');
      d.className = 'leaf';
      d.src = src;
      d.alt = '';
      d.style.width = size + 'px';
      d.style.filter = pick(LEAF_TINT);

      // where it sits when the frame is full
      d.style.left = rnd(-160, 1920) + 'px';
      d.style.top  = rnd(-160, 1080) + 'px';

      // in on the wind from the left, out to the right and downward
      d.style.setProperty('--x0', -rnd(700, 2700) + 'px');
      d.style.setProperty('--y0', rnd(-520, 420) + 'px');
      d.style.setProperty('--x1', rnd(-70, 70) + 'px');
      d.style.setProperty('--y1', rnd(-50, 50) + 'px');
      d.style.setProperty('--x2', rnd(1000, 2900) + 'px');
      d.style.setProperty('--y2', rnd(240, 920) + 'px');
      d.style.setProperty('--r0', rnd(-300, 300) + 'deg');
      d.style.setProperty('--r1', rnd(-45, 45) + 'deg');
      d.style.setProperty('--r2', rnd(-560, 560) + 'deg');
      d.style.setProperty('--s0', rnd(0.62, 0.95));
      d.style.setProperty('--s2', rnd(0.8, 1.2));

      /* Staggered so the gust arrives in waves rather than as one
         wall, but every leaf is home before the frame goes solid. */
      const delay = rnd(0, 330);
      if (delay > maxDelay) maxDelay = delay;
      d.style.animationDuration = LEAF_DUR + 'ms';
      d.style.animationDelay = delay + 'ms';
      el.appendChild(d);
    }

    setTimeout(function () { if (onCover) onCover(); }, LEAF_DUR * LEAF_COVER);
    setTimeout(function () {
      el.classList.add('hidden');
      el.innerHTML = '';
      if (onDone) onDone();
    }, LEAF_DUR + maxDelay + 160);
  }

  // how long a sweep runs, in seconds, so the gust can be scored to it
  leaves.seconds = LEAF_DUR / 1000;


  function clear() { if (layer) layer.innerHTML = ''; }

  return { init, starBurst, ring, confetti, sparkles, puff, motes, clouds,
           leafDrift, leaves, clear };
})();

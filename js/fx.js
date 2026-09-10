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
    Object.assign(d.style, styles);
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
  function confetti(count) {
    count = count || 46;
    for (let i = 0; i < count; i++) {
      const w = rnd(10, 20), h = rnd(14, 26);
      const life = rnd(2200, 3600);
      spawn('fx-confetti', {
        left: rnd(-40, 1960) + 'px', top: rnd(-260, -40) + 'px',
        width: w + 'px', height: h + 'px',
        background: pick(CANDY),
        borderRadius: Math.random() < 0.4 ? '50%' : '3px',
        '--dx': rnd(-140, 140) + 'px',
        '--fall': rnd(1180, 1420) + 'px',
        '--spin': rnd(-900, 900) + 'deg',
        animationDuration: life + 'ms',
        animationDelay: rnd(0, 700) + 'ms'
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
      const dist = 1920 + w + 160;               // off-screen right to off-screen left
      const dur = dist / inst.speed;

      const d = document.createElement('div');
      d.className = 'cloud';
      d.style.top = inst.top + 'px';
      d.style.width = w + 'px';
      d.style.height = h + 'px';
      d.style.opacity = inst.opacity;
      d.style.setProperty('--x0', (1920 + 80) + 'px');
      d.style.setProperty('--x1', -(w + 80) + 'px');
      d.style.animationDuration = dur + 's';
      // a negative delay starts the loop already part-way across
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

  function clear() { if (layer) layer.innerHTML = ''; }

  return { init, starBurst, ring, confetti, sparkles, puff, motes, clouds, clear };
})();

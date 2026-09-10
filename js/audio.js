/* =============================================================
   Audio engine
   - background music from sfx/bg music.mp3, held at 20%
   - every other sound is synthesised with the Web Audio API,
     because only the music track was supplied
   - music ducks automatically while Swifty is speaking
   ============================================================= */
window.Audio8 = (function () {
  'use strict';
  const A = window.CFG.AUDIO;

  let ctx = null, master = null, sfxGain = null;
  let musicEl = null, noiseBuf = null, musicRamp = null;
  let started = false, duckDepth = 0, muted = false, musicWant = 0;

  function now() { return ctx ? ctx.currentTime : 0; }

  function build() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = A.sfxVolume;
    // A gentle limiter keeps stacked chirps from clipping.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    sfxGain.connect(comp);
    comp.connect(master);

    // Two seconds of white noise, reused by every noise-based sound.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    /* The music is played by a plain <audio> element and its level is
       driven on the element itself, NOT through a MediaElementSource.
       Routing it into the Web Audio graph silences the track whenever
       the page is opened straight from disk, because file:// counts as
       an opaque origin and taints the node — and nothing here needs to
       process the music anyway. */
    musicEl = new Audio(A.musicSrc);
    musicEl.loop = true;
    musicEl.preload = 'auto';
    musicEl.volume = 0;
  }

  /* Smooth fade on the element, used for start-up and for ducking. */
  function rampMusic(secs) {
    if (!musicEl) return;
    clearInterval(musicRamp);
    const from = musicEl.volume;
    const to = muted ? 0 : musicWant;
    const steps = Math.max(1, Math.round((secs || 0.3) * 30));
    let i = 0;
    musicRamp = setInterval(function () {
      i++;
      const v = from + (to - from) * (i / steps);
      musicEl.volume = Math.min(1, Math.max(0, v));
      if (i >= steps) clearInterval(musicRamp);
    }, 1000 / 30);
  }

  /* Called from the first real user gesture — browsers block audio
     until then. Safe to call repeatedly. */
  function unlock() {
    build();
    if (ctx.state === 'suspended') ctx.resume();
    if (!started) {
      started = true;
      const p = musicEl.play();
      if (p && p.catch) p.catch(function () { started = false; });
      musicTarget(A.musicVolume, 1.6);
    }
  }

  function musicTarget(v, secs) {
    musicWant = v;
    rampMusic(secs);
  }

  /* Duck is reference counted so overlapping speech can't strand the
     music at a low volume. */
  function duck(on) {
    duckDepth = Math.max(0, duckDepth + (on ? 1 : -1));
    if (duckDepth > 0) musicTarget(A.musicDucked, A.duckDown);
    else musicTarget(A.musicVolume, A.duckUp);
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 1, now(), 0.05);
    rampMusic(0.2);
  }
  function isMuted() { return muted; }

  /* ---------- synthesis helpers ---------- */

  function env(node, t0, peak, attack, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    node.connect(g);
    g.connect(sfxGain);
    return g;
  }

  function tone(opts) {
    if (!ctx) return;
    const t0 = now() + (opts.delay || 0);
    const o = ctx.createOscillator();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(opts.f0, t0);
    if (opts.f1) o.frequency.exponentialRampToValueAtTime(opts.f1, t0 + opts.dur);
    if (opts.f2) o.frequency.exponentialRampToValueAtTime(opts.f2, t0 + opts.dur * 1.7);
    env(o, t0, opts.gain || 0.25, opts.attack || 0.008, opts.dur);
    o.start(t0);
    o.stop(t0 + opts.dur * 2.2 + 0.05);
  }

  function noise(opts) {
    if (!ctx) return;
    const t0 = now() + (opts.delay || 0);
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = opts.filter || 'bandpass';
    bp.Q.value = opts.q || 1.1;
    bp.frequency.setValueAtTime(opts.f0, t0);
    bp.frequency.exponentialRampToValueAtTime(opts.f1, t0 + opts.dur);
    s.connect(bp);
    env(bp, t0, opts.gain || 0.2, opts.attack || 0.02, opts.dur);
    s.start(t0);
    s.stop(t0 + opts.dur * 2.4 + 0.05);
  }

  /* ---------- the sound set ---------- */

  // One syllable of bird speech. Pitch wanders so a run of them
  // reads as chatter rather than a repeated beep.
  let chirpStep = 0;
  function chirp(strength) {
    if (!ctx) return;
    const scale = [0, 2, 4, 7, 9, 12, 9, 7, 4, 2];
    const semi = scale[chirpStep++ % scale.length] + (Math.random() * 2 - 1);
    const base = 880 * Math.pow(2, semi / 12);
    const g = 0.16 * (strength || 1);
    tone({ type: 'triangle', f0: base * 0.72, f1: base * 1.5, f2: base * 1.05, dur: 0.055, gain: g });
    tone({ type: 'sine', f0: base * 1.9, f1: base * 2.7, dur: 0.04, gain: g * 0.35, delay: 0.008 });
  }

  // A single wing beat: airy noise sweep plus a soft body thump.
  function flap() {
    noise({ f0: 1700, f1: 380, dur: 0.13, gain: 0.16, q: 0.8 });
    tone({ type: 'sine', f0: 190, f1: 90, dur: 0.1, gain: 0.09 });
  }

  // Landing on the grass.
  function land() {
    noise({ f0: 900, f1: 160, dur: 0.22, gain: 0.2, q: 0.7 });
    tone({ type: 'sine', f0: 150, f1: 60, dur: 0.18, gain: 0.16 });
  }

  // Button press — a fat, friendly pop.
  function pop() {
    tone({ type: 'sine', f0: 320, f1: 1000, dur: 0.07, gain: 0.32 });
    tone({ type: 'triangle', f0: 640, f1: 1600, dur: 0.09, gain: 0.14, delay: 0.02 });
  }

  // Rollover blip.
  function blip() {
    tone({ type: 'sine', f0: 660, f1: 990, dur: 0.05, gain: 0.1 });
  }

  // Rising bell arpeggio for stars and confetti.
  function sparkle() {
    const notes = [1046, 1318, 1568, 2093];
    notes.forEach(function (f, i) {
      tone({ type: 'sine', f0: f, f1: f * 1.01, dur: 0.16, gain: 0.13, delay: i * 0.055 });
    });
  }

  // Screen transition.
  function whoosh() {
    noise({ f0: 300, f1: 2600, dur: 0.26, gain: 0.16, q: 0.6 });
    noise({ f0: 2400, f1: 260, dur: 0.34, gain: 0.13, q: 0.6, delay: 0.24 });
  }

  /* The board materialising: a shimmering upward sweep with a bell
     stack on top. */
  function magic() {
    if (!ctx) return;
    noise({ f0: 400, f1: 7000, dur: 0.5, gain: 0.10, q: 0.5, filter: 'bandpass' });
    [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) {
      tone({ type: 'sine', f0: f, f1: f * 1.005, dur: 0.5 - i * 0.05,
             gain: 0.10, delay: i * 0.06 });
    });
    tone({ type: 'triangle', f0: 110, f1: 330, dur: 0.34, gain: 0.12 });
  }

  // An axis drawing itself outward.
  function draw() {
    noise({ f0: 700, f1: 3400, dur: 0.3, gain: 0.10, q: 1.4 });
    tone({ type: 'sine', f0: 300, f1: 720, dur: 0.26, gain: 0.08 });
  }

  // One number popping in. `step` walks the pitch up the run.
  function tick(step) {
    const semis = [0, 2, 4, 5, 7, 9, 11, 12];
    const f = 660 * Math.pow(2, semis[(step || 0) % semis.length] / 12);
    tone({ type: 'triangle', f0: f * 0.8, f1: f, dur: 0.06, gain: 0.13 });
    tone({ type: 'sine', f0: f * 2, f1: f * 2.02, dur: 0.09, gain: 0.05, delay: 0.01 });
  }

  // A right answer: bright major arpeggio with a sparkle on top.
  function correct() {
    if (!ctx) return;
    [523, 659, 784, 1047].forEach(function (f, i) {
      tone({ type: 'triangle', f0: f, f1: f, dur: 0.22, gain: 0.17, delay: i * 0.075 });
      tone({ type: 'sine', f0: f * 2, f1: f * 2, dur: 0.16, gain: 0.06, delay: i * 0.075 });
    });
  }

  /* A wrong answer. Deliberately soft and low — a nudge, not a buzzer,
     since this is a young player's first go. */
  function wrong() {
    tone({ type: 'triangle', f0: 392, f1: 370, dur: 0.14, gain: 0.13 });
    tone({ type: 'triangle', f0: 311, f1: 294, dur: 0.20, gain: 0.13, delay: 0.13 });
  }

  // The celebration that rides with the confetti.
  function cheer() {
    if (!ctx) return;
    const tune = [523, 659, 784, 1047, 1319];
    tune.forEach(function (f, i) {
      tone({ type: 'triangle', f0: f, f1: f, dur: 0.3, gain: 0.14, delay: 0.18 + i * 0.085 });
    });
    // a shimmer wash under the tune
    noise({ f0: 900, f1: 6500, dur: 0.55, gain: 0.07, q: 0.6, delay: 0.18 });
    [1568, 2093, 2637].forEach(function (f, i) {
      tone({ type: 'sine', f0: f, f1: f * 1.01, dur: 0.5, gain: 0.05, delay: 0.5 + i * 0.1 });
    });
  }

  // Cheerful three-note flourish when a line finishes.
  function chime() {
    [784, 988, 1319].forEach(function (f, i) {
      tone({ type: 'triangle', f0: f, f1: f, dur: 0.24, gain: 0.12, delay: i * 0.09 });
    });
  }

  return {
    unlock, duck, setMuted, isMuted,
    chirp, flap, land, pop, blip, sparkle, whoosh, chime, magic, draw, tick,
    correct, wrong, cheer,
    get ready() { return !!ctx; }
  };
})();

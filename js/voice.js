/* =============================================================
   Swifty's voice.

   One recording of the whole script, sfx/new voice.mp3 — every line
   the game says, read in the order it says them, with the maths said in
   words ("three, comma, two"; "x two minus x one") — cut into one file
   per line in sfx/voices. Each line was found in it by its words and cut
   in the silence either side. Each file is numbered in that order and
   named for the line it says.

   She speaks a little slower than she was recorded, for young
   listeners: the whole recording was slowed to nine-tenths of its speed
   (115/128 exactly, the nearest step Apple's time-pitch unit takes — the
   one Safari slows speech with) at the same pitch, before it was cut,
   and every clip encoded afresh. Each opens 50 ms before her first
   sound, and where she took a breath between two lines the breath is in
   neither.

   MAP is the only thing to edit: the line on the left, then its file
   and how long that file runs. The length is written down rather than
   read off the clip because a browser reports no duration until the
   file's metadata has arrived — and the words are paced to it, so a
   line asked for early would otherwise be paced to nothing.

   A line with no entry simply plays no voice: the game falls back to
   the little per-word notes it used before, so a gap here is quiet
   rather than broken.
   ============================================================= */
window.Voice = (function () {
  'use strict';

  const DIR = 'sfx/voices/';

  const MAP = {
    /* Every line the game says, in the order it says them — cut from
       sfx/new voice.mp3 (see the header). */
    'Hey there!':
      ['01-hey-there.mp3', 0.71],
    'Let’s do a quick warm-up.':
      ['02-lets-do-a-quick-warm-up.mp3', 1.93],
    'Locate the point (3, 2).':
      ['03-locate-the-point-3-2.mp3', 3.21],
    'Now try (6, 2).':
      ['04-now-try-6-2.mp3', 2.69],
    'What is the distance between the two points?':
      ['05-what-is-the-distance-between-the-two-points.mp3', 2.85],
    'Count carefully!':
      ['06-count-carefully.mp3', 1.36],
    'Did you notice?':
      ['07-did-you-notice.mp3', 1.23],
    'The y-coordinates are the same.':
      ['08-the-y-coordinates-are-the-same.mp3', 2.38],
    'So, the distance is the difference between the x-coordinates.':
      ['09-so-the-distance-is-the-difference-between-th.mp3', 4.39],
    'The x-coordinates are the same.':
      ['10-the-x-coordinates-are-the-same.mp3', 2.22],
    'So, the distance is the difference between the y-coordinates.':
      ['11-so-the-distance-is-the-difference-between-th.mp3', 4.41],
    'So far, the points were lined up horizontally or vertically.':
      ['12-so-far-the-points-were-lined-up-horizontally.mp3', 3.94],
    'But these two aren’t.':
      ['13-but-these-two-arent.mp3', 2.04],
    'How can we find the distance between these two?':
      ['14-how-can-we-find-the-distance-between-these-t.mp3', 3.00],
    'Let’s explore.':
      ['15-lets-explore.mp3', 1.20],
    'Hmm… what about A and C?':
      ['16-hmm-what-about-a-and-c.mp3', 2.80],
    'What is the distance between C and B?':
      ['18-what-is-the-distance-between-c-and-b.mp3', 2.85],
    /* Two of her takes joined at the pause between them: "Look! We made
       a" from "Look! We made a triangle." and "right-angled triangle!"
       from "A right-angled triangle!". */
    'Look! We made a right-angled triangle!':
      ['19-look-we-made-a-right-angled-triangle.mp3', 3.45],
    'We know AC and CB.':
      ['24-we-know-ac-and-cb.mp3', 2.56],
    'But we still need AB.':
      ['25-but-we-still-need-ab.mp3', 2.27],
    'Since it’s a right triangle, Pythagoras theorem can help!':
      ['26-since-its-a-right-triangle-pythagoras-theore.mp3', 4.41],
    'Now, let’s find the distance between A and B.':
      ['27-now-lets-find-the-distance-between-a-and-b.mp3', 3.81],
    'What is the distance between these two points?':
      ['28-what-is-the-distance-between-these-two-point.mp3', 2.93],
    'Look, we made a right triangle.':
      ['29-look-we-made-a-right-triangle.mp3', 2.38],
    'Let’s use Pythagoras to find AB.':
      ['30-lets-use-pythagoras-to-find-ab.mp3', 2.90],
    'That’s right!':
      ['31-thats-right.mp3', 1.02],
    'Now find AB.':
      ['32-now-find-ab.mp3', 1.46],
    'What is the distance between A and B?':
      ['33-what-is-the-distance-between-a-and-b.mp3', 2.98],
    'Oops! Let’s find it together.':
      ['34-oops-lets-find-it-together.mp3', 2.25],
    'What is the distance between A and C?':
      ['35-what-is-the-distance-between-a-and-c.mp3', 2.98],
    'The same idea works for any two points.':
      ['36-the-same-idea-works-for-any-two-points.mp3', 3.34],
    'AC = x₂ − x₁':
      ['37-ac-x2-x1.mp3', 3.60],
    'CB = y₂ − y₁':
      ['38-cb-y2-y1.mp3', 3.08],
    'Now, let’s find AB.':
      ['39-now-lets-find-ab.mp3', 2.14],
    'What if both points are on the x-axis?':
      ['41-what-if-both-points-are-on-the-x-axis.mp3', 3.11],
    /* The front of her "Exactly! There's no vertical distance.", cut at
       her pause after it: praise for a warm-up distance, said without a
       balloon. */
    'Exactly!':
      ['42a-exactly.mp3', 1.04],
    'And what if they’re on the y-axis?':
      ['43-and-what-if-theyre-on-the-y-axis.mp3', 2.51],
    /* The end of her "Now, let's find the distance between A and B.",
       cut in the "f" of "find", after the "s" before it. */
    'Find the distance between A and B.':
      ['41b-find-the-distance-between-a-and-b.mp3', 2.74],
    'Maya wants to walk to the closer café. Which café is closer to her house?':
      ['45-maya-wants-to-walk-to-the-closer-cafe-which.mp3', 5.93],
    'Which distance is shorter?':
      ['48-which-distance-is-shorter.mp3', 2.27],
    '4 is less than 5 — so Café A is closer.':
      ['49-4-is-less-than-5-so-cafe-a-is-closer.mp3', 4.28],
    'Scalene — no two sides the same.':
      ['53-scalene-no-two-sides-the-same.mp3', 2.82],
    'Have another look at the three sides.':
      ['54-have-another-look-at-the-three-sides.mp3', 2.30],
    'Oops! Let’s check the sides.':
      ['55-oops-lets-check-the-sides.mp3', 2.46],
    'Thirteen. That one stays.':
      ['57-thirteen-that-one-stays.mp3', 2.14],
    'Fourteen.':
      ['59-fourteen.mp3', 0.99],
    'Count the squares from B up to C.':
      ['60-count-the-squares-from-b-up-to-c.mp3', 2.66],
    'That’s right — a scalene triangle.':
      ['68-thats-right-a-scalene-triangle.mp3', 2.64]
  };

  /* Lines are looked up on a tidied form of themselves. A coordinate
     said aloud carries a non-breaking space so "(3, 2)" can never wrap
     across two rows, and a line typed here with an ordinary space or a
     straight apostrophe should still find its clip. */
  function key(t) {
    return String(t).replace(/\u00A0/g, ' ').replace(/[\u2018\u2019]/g, "'")
                    .replace(/\s+/g, ' ').trim();
  }
  const BY_KEY = {};
  Object.keys(MAP).forEach(function (k) { BY_KEY[key(k)] = MAP[k]; });
  function entryFor(t) { return BY_KEY[key(t)] || null; }
  function fileFor(t) { const e = entryFor(t); return e ? e[0] : null; }

  const clips = {};
  let playing = null;
  let enabled = true;

  /* ONE player for every line she says. Safari lets a page make sound
     only from a tap, and it counts that per player: a player started
     inside the tap on Play may play again later, a player that was not
     may not. With a player per clip every line after the first was
     started long after any tap, and Safari played none of them — her
     words appeared, paced to a voice nobody heard. So the lines share
     this one, it is started (silently) inside the Play tap by prime(),
     and each line only swaps what it plays. The per-clip players below
     are kept only to fetch every clip ahead of time. */
  const player = new Audio();
  player.preload = 'auto';
  /* 0.1s of silence (8kHz, 8-bit), all the Play tap needs to start. */
  const SILENCE = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  let refused = false;           // the last line was not allowed to sound

  function src(file) {
    const v = window.CFG && window.CFG.VERSION;
    return DIR + file + (v ? '?v=' + v : '');
  }

  function load(file) {
    if (clips[file]) return clips[file];
    /* Stamped like everything else the game fetches (see VERSION in
       config.js), so a re-cut clip is fetched again. */
    const a = new Audio(src(file));
    a.preload = 'auto';
    clips[file] = a;
    return a;
  }

  return {
    /* Every clip the script can ask for, fetched up front so a line
       never waits on the network to start. */
    preload: function () {
      Object.keys(MAP).forEach(function (k) { load(MAP[k][0]); });
    },

    has: function (text) { return !!fileFor(text); },
    enable: function (on) { enabled = on !== false; },

    /* From inside the tap on Play: the shared player plays a moment of
       silence and stops, which is what Safari needs to see to let it
       speak later. Harmless everywhere else. */
    /* It plays a tenth of a second of silence — never one of her lines.
       It used to prime with her first recording, muted, and unmute it as
       it stopped; the sound already on its way out came through, and
       tapping Play said "Hey…" before she had even flown in. It stays
       muted until her first real line (say() unmutes it). */
    prime: function () {
      if (player.dataset.primed) return;
      player.dataset.primed = '1';
      player.muted = true;
      player.src = SILENCE;
      const p = player.play();
      const done = function () {
        if (playing === player) return;   // a line has already started on it
        player.pause();
      };
      if (p && p.then) p.then(done, done); else done();
    },

    /* Whether the line being said is sounding at all. A browser that
       refused it leaves the words to the little notes instead of to
       silence. */
    silent: function () { return refused; },

    /* Speak a line. Returns how long it will take, so the words can be
       revealed at the pace she actually says them; 0 when there is no
       recording for it and the caller should fall back to its own
       timing. */
    say: function (text) {
      this.stop();
      const e = entryFor(text);
      if (!e || !enabled) return 0;
      load(e[0]);                       // fetched already; kept warm
      refused = false;
      playing = player;
      player.muted = false;
      player.src = src(e[0]);
      player.currentTime = 0;
      const p = player.play();
      /* Refused (Safari, a browser that has not seen a tap) is silence
         to cover; interrupted by the next line is not. */
      if (p && p.catch) p.catch(function (err) {
        if (err && err.name === 'NotAllowedError') refused = true;
      });
      return e[1] * 1000;
    },

    stop: function () {
      if (playing) { playing.pause(); try { playing.currentTime = 0; } catch (e) {} playing = null; }
    },

    /* How long a line takes, without playing it — the metadata is there
       once the clip has loaded. */
    lengthOf: function (text) {
      const e = entryFor(text);
      return e ? e[1] * 1000 : 0;
    },

    MAP: MAP, fileFor: fileFor
  };
})();

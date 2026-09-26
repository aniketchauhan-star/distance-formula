/* =============================================================
   Swifty's voice.

   One recording of the whole script, sfx/Aniket game.mp3 — every line
   the game says, read in the order it says them, with the maths said in
   words ("open bracket, three, comma, two, close bracket") — cut into
   one file per line in sfx/voices. Each line was found in it by its
   words, and the cut made in the silence either side, losslessly, on
   MP3 frame boundaries: each clip is the original audio with nothing
   re-encoded. Each file is numbered in that order and named for the
   line it says.

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
       sfx/Aniket game.mp3 (see the header). */
    'Hey there!':
      ['01-hey-there.mp3', 0.68],
    'Let’s do a quick warm-up.':
      ['02-lets-do-a-quick-warm-up.mp3', 1.65],
    'Locate the point (3, 2).':
      ['03-locate-the-point-3-2.mp3', 5.64],
    'Now try (6, 2).':
      ['04-now-try-6-2.mp3', 5.49],
    'What is the distance between the two points?':
      ['05-what-is-the-distance-between-the-two-points.mp3', 2.27],
    'Count carefully!':
      ['06-count-carefully.mp3', 1.07],
    'Did you notice?':
      ['07-did-you-notice.mp3', 0.97],
    'The y-coordinates are the same.':
      ['08-the-y-coordinates-are-the-same.mp3', 2.04],
    'So, the distance is the difference between the x-coordinates.':
      ['09-so-the-distance-is-the-difference-between-th.mp3', 3.29],
    '6 - 3 = 3':
      ['10-6-3-3.mp3', 2.48],
    'The x-coordinates are the same.':
      ['11-the-x-coordinates-are-the-same.mp3', 2.09],
    'So, the distance is the difference between the y-coordinates.':
      ['12-so-the-distance-is-the-difference-between-th.mp3', 3.37],
    '2 - (-3) = 5':
      ['13-2-3-5.mp3', 6.03],
    'So far, the points were lined up horizontally or vertically.':
      ['14-so-far-the-points-were-lined-up-horizontally.mp3', 3.50],
    'But these two aren’t.':
      ['15-but-these-two-arent.mp3', 1.36],
    'How can we find the distance between these two?':
      ['16-how-can-we-find-the-distance-between-these-t.mp3', 2.80],
    'Let’s explore.':
      ['17-lets-explore.mp3', 0.99],
    'Hmm… what about A and C?':
      ['18-hmm-what-about-a-and-c.mp3', 2.09],
    'We know how to find this distance.':
      ['19-we-know-how-to-find-this-distance.mp3', 1.72],
    'What is the distance between C and B?':
      ['20-what-is-the-distance-between-c-and-b.mp3', 2.59],
    'Look! We made a triangle.':
      ['21-look-we-made-a-triangle.mp3', 1.70],
    'What kind of triangle is this?':
      ['22-what-kind-of-triangle-is-this.mp3', 1.80],
    'A right-angled triangle!':
      ['23-a-right-angled-triangle.mp3', 1.80],
    'Look at the corner at C.':
      ['24-look-at-the-corner-at-c.mp3', 1.72],
    'It’s a right-angled triangle — see the square corner at C.':
      ['25-its-a-right-angled-triangle-see-the-square-c.mp3', 3.87],
    'We know AC and CB.':
      ['26-we-know-ac-and-cb.mp3', 2.40],
    'But we still need AB.':
      ['27-but-we-still-need-ab.mp3', 1.62],
    'Since it’s a right triangle, Pythagoras theorem can help!':
      ['28-since-its-a-right-triangle-pythagoras-theore.mp3', 3.50],
    'Now, let’s find the distance between A and B.':
      ['29-now-lets-find-the-distance-between-a-and-b.mp3', 3.24],
    'What is the difference between these two points?':
      ['30-what-is-the-difference-between-these-two-poi.mp3', 2.51],
    'Look, we made a right triangle.':
      ['31-look-we-made-a-right-triangle.mp3', 1.93],
    'Let’s use Pythagoras to find AB.':
      ['32-lets-use-pythagoras-to-find-ab.mp3', 2.56],
    'That’s right!':
      ['33-thats-right.mp3', 0.71],
    'Now find AB.':
      ['34-now-find-ab.mp3', 1.65],
    'What is the distance between A and B?':
      ['35-what-is-the-distance-between-a-and-b.mp3', 2.66],
    'Oops! Let’s find it together.':
      ['36-oops-lets-find-it-together.mp3', 2.01],
    'What is the distance between A and C?':
      ['37-what-is-the-distance-between-a-and-c.mp3', 2.61],
    'The same idea works for any two points.':
      ['38-the-same-idea-works-for-any-two-points.mp3', 2.40],
    'AC = x₂ − x₁':
      ['39-ac-x2-x1.mp3', 3.37],
    'CB = y₂ − y₁':
      ['40-cb-y2-y1.mp3', 3.81],
    'Now, let’s find AB.':
      ['41-now-lets-find-ab.mp3', 2.01],
    'And that gives us the distance between any two points!':
      ['42-and-that-gives-us-the-distance-between-any-t.mp3', 3.00],
    'What if both points are on the x-axis?':
      ['43-what-if-both-points-are-on-the-x-axis.mp3', 2.53],
    'Exactly! There’s no vertical distance.':
      ['44-exactly-theres-no-vertical-distance.mp3', 2.48],
    'And what if they’re on the y-axis?':
      ['45-and-what-if-theyre-on-the-y-axis.mp3', 2.01],
    'Exactly! There’s no horizontal distance.':
      ['46-exactly-theres-no-horizontal-distance.mp3', 3.03],
    'Maya wants to walk to the closer cafe. Which cafe is closer to her house?':
      ['47-maya-wants-to-walk-to-the-closer-cafe-which.mp3', 5.25],
    'First, the house to Cafe A.':
      ['48-first-the-house-to-cafe-a.mp3', 2.09],
    'Now, the house to Cafe B.':
      ['49-now-the-house-to-cafe-b.mp3', 2.09],
    'Which distance is shorter?':
      ['50-which-distance-is-shorter.mp3', 1.57],
    '5 is less than √40 — so Cafe A is closer.':
      ['51-5-is-less-than-root-40-so-cafe-a-is-closer.mp3', 4.60],
    'How long should this connection be?':
      ['52-how-long-should-this-connection-be.mp3', 1.83],
    'The station is right at zero.':
      ['53-the-station-is-right-at-zero.mp3', 2.04],
    'What kind of triangle is this park?':
      ['54-what-kind-of-triangle-is-this-park.mp3', 2.09],
    'Scalene — no two sides the same.':
      ['55-scalene-no-two-sides-the-same.mp3', 2.72],
    'Have another look at the three sides.':
      ['56-have-another-look-at-the-three-sides.mp3', 1.96],
    'Oops! Let’s check the sides.':
      ['57-oops-lets-check-the-sides.mp3', 2.12],
    'First, find AB.':
      ['58-first-find-ab.mp3', 1.96],
    'Thirteen. That one stays.':
      ['59-thirteen-that-one-stays.mp3', 2.30],
    'Now find BC.':
      ['60-now-find-bc.mp3', 1.70],
    'Fourteen.':
      ['61-fourteen.mp3', 0.91],
    'Count the squares from B up to C.':
      ['62-count-the-squares-from-b-up-to-c.mp3', 2.35],
    'One more. Find CA.':
      ['63-one-more-find-ca.mp3', 2.53],
    'Fifteen. All three are down.':
      ['64-fifteen-all-three-are-down.mp3', 2.82],
    'What do you notice about the side lengths?':
      ['65-what-do-you-notice-about-the-side-lengths.mp3', 1.99],
    'All different — 13, 14 and 15.':
      ['66-all-different-13-14-and-15.mp3', 3.50],
    'Are any two of them the same number?':
      ['67-are-any-two-of-them-the-same-number.mp3', 1.88],
    'Thirteen, fourteen, fifteen — all different.':
      ['68-thirteen-fourteen-fifteen-all-different.mp3', 3.27],
    'So, which triangle is it?':
      ['69-so-which-triangle-is-it.mp3', 1.52],
    'That’s right — a scalene triangle.':
      ['70-thats-right-a-scalene-triangle.mp3', 2.32],
    'All three lengths are different. Which name is that?':
      ['71-all-three-lengths-are-different-which-name-i.mp3', 3.53],
    'All different means scalene.':
      ['72-all-different-means-scalene.mp3', 2.17]
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

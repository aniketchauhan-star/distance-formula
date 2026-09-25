/* =============================================================
   Swifty's voice.

   One recording was made of the whole script and cut, at the reader's
   own pauses, into one file per line — losslessly, on MP3 frame
   boundaries, so each clip is the original audio with nothing
   re-encoded. Each file is named for the line it says.

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
    'Hey there!':
      ['01-hey-there.mp3', 0.78],
    /* The screen that said this is gone. Kept for the same reason the
       one below it is: the clip exists and the reader said the words,
       so the key is what would hook it back up. */
    'Ready to explore distance on the coordinate plane?':
      ['02-ready-to-explore-distance-on-the-coordinate-pl.mp3', 3.19],
    /* Screen 3 says "Let’s do a quick warm-up." now, and no recording
       says that. The entry stays because the clip does: the reader said
       these words, the file is still in sfx/voices, and the key is what
       would hook it back up if the line ever goes back to them. Until
       there is a cut of the new words under a matching key, that screen
       plays no voice — which the header above says is the quiet
       failure, not the broken one. */
    'Let’s start with something familiar.':
      ['03-let-s-start-with-something-familiar.mp3', 2.25],
    'Locate the point (3, 2).':
      ['04-locate-the-point-3-2.mp3', 2.56],
    'Correct!':
      ['05-correct.mp3', 0.86],
    'Not quite — try again!':
      ['06-not-quite-try-again.mp3', 2.38],
    /* The same three words, punctuated the way the counting screens
       write them. One recording serves both rather than a second cut
       of her saying exactly the same thing. */
    'Not quite! Try again!':
      ['06-not-quite-try-again.mp3', 2.38],
    /* The back half of the same recording, cut at the reader's own
       pause between "Not quite" and "try again" — so it is her voice
       saying the two words, not a second take. The choice screens play
       this with no balloon: the red border has already said it went
       wrong, and hearing it is enough. */
    'Try again!':
      ['06b-try-again.mp3', 1.18],
    'Here it is — (3, 2).':
      ['07-here-it-is-3-2.mp3', 2.30],
    /* Screen 7 asks it as "Now try (6, 2)." now, and the recording
       says "Locate the point (6, 2)" — so it is cut loose rather than
       left to say something the balloon does not. The line is quiet
       until it is re-recorded; 08-locate-the-point-6-2.mp3 stays in
       the master cut. */
    'Here it is — (6, 2).':
      ['09-here-it-is-6-2.mp3', 2.35],
    /* The line reads "between THE two points" now, and the recording
       says "between two points" — so it is cut loose rather than left
       to say something the balloon does not, exactly as screen 7's
       was. The line is quiet until it is re-recorded;
       10-what-is-the-distance-between-two-points.mp3 stays in the
       master cut, and this key is what hooks it back up. */
    'Let’s count the units.':
      ['11-let-s-count-the-units.mp3', 1.52],
    'Now try again!':
      ['12-now-try-again.mp3', 1.38],
    'This one’s different.':
      ['13-this-one-s-different.mp3', 1.20],
    'Can the grid help?':
      ['14-can-the-grid-help.mp3', 1.31],
    'Not quite! Check the spaces between the units.':
      ['15-not-quite-check-the-spaces-between-the-units.mp3', 3.63],
    'Look! We made a triangle.':
      ['16-look-we-made-a-triangle.mp3', 2.19],
    'What kind of triangle is it?':
      ['17-what-kind-of-triangle-is-it.mp3', 1.83],
    'We know two sides. How can we find the third?':
      ['18-we-know-two-sides-how-can-we-find-the-third.mp3', 3.66],
    'That’s right!':
      ['19-that-s-right.mp3', 0.94],
    'Not quite. Check your working and try again.':
      ['20-not-quite-check-your-working-and-try-again.mp3', 3.81],
    'Use the right triangle to find AB.':
      ['21-use-the-right-triangle-to-find-ab.mp3', 3.24],
    'Not quite. Count the two sides, then use Pythagoras.':
      ['22-not-quite-count-the-two-sides-then-use-pythago.mp3', 4.83],
    'The sides are 4 and 3. What is √(4² + 3²)?':
      ['23-the-sides-are-4-and-3-what-is-42-32.mp3', 7.42],
    'The sides are 8 and 6. What is √(8² + 6²)?':
      ['24-the-sides-are-8-and-6-what-is-82-62.mp3', 6.92],
    'The same idea works for any two points.':
      ['25-the-same-idea-works-for-any-two-points.mp3', 2.72],
    'AC = x₂ − x₁':
      ['26-ac-x2-x1.mp3', 3.19],
    'CB = y₂ − y₁':
      ['27-cb-y2-y1.mp3', 3.87],
    'Now, let’s find AB.':
      ['28-now-let-s-find-ab.mp3', 2.22],
    'And that gives us the distance between any two points!':
      ['29-and-that-gives-us-the-distance-between-any-two.mp3', 3.68],
    'What if both points are on the x-axis?':
      ['30-what-if-both-points-are-on-the-x-axis.mp3', 2.98],
    'Both points are on the x-axis.':
      ['31-both-points-are-on-the-x-axis.mp3', 2.95],
    'And what if they’re on the y-axis?':
      ['32-and-what-if-they-re-on-the-y-axis.mp3', 2.30],
    'Both points are on the y-axis.':
      ['33-both-points-are-on-the-y-axis.mp3', 2.51],
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

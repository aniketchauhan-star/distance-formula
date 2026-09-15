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
    'Ready to explore distance on the coordinate plane?':
      ['02-ready-to-explore-distance-on-the-coordinate-pl.mp3', 3.19],
    'Let’s start with something familiar.':
      ['03-let-s-start-with-something-familiar.mp3', 2.25],
    'Locate the point (3, 2).':
      ['04-locate-the-point-3-2.mp3', 2.56],
    'Correct!':
      ['05-correct.mp3', 0.86],
    'Not quite — try again!':
      ['06-not-quite-try-again.mp3', 2.38],
    'Here it is — (3, 2).':
      ['07-here-it-is-3-2.mp3', 2.30],
    'Locate the point (6, 2).':
      ['08-locate-the-point-6-2.mp3', 2.40],
    'Here it is — (6, 2).':
      ['09-here-it-is-6-2.mp3', 2.35],
    'What is the distance between two points?':
      ['10-what-is-the-distance-between-two-points.mp3', 2.61],
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
    'AC = x2 - x1':
      ['26-ac-x2-x1.mp3', 3.19],
    'CB = y2 - y1':
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

  function load(file) {
    if (clips[file]) return clips[file];
    const a = new Audio(DIR + file);
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

    /* Speak a line. Returns how long it will take, so the words can be
       revealed at the pace she actually says them; 0 when there is no
       recording for it and the caller should fall back to its own
       timing. */
    say: function (text) {
      this.stop();
      const e = entryFor(text);
      if (!e || !enabled) return 0;
      const a = load(e[0]);
      playing = a;
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(function () {});
      return e[1] * 1000;
    },

    stop: function () {
      if (playing) { playing.pause(); playing.currentTime = 0; playing = null; }
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

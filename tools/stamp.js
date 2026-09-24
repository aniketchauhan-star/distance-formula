#!/usr/bin/env node
/* =============================================================
   One version stamp for everything the browser keeps a copy of.

   A browser that has seen `js/game.js?v=A` keeps its copy until the
   address changes, so the address has to change whenever the file
   does. The stamp used to be typed in by hand, and it stayed at one
   value through a whole day of changes — a laptop that had opened
   the game earlier could go on running the morning's game. This
   writes it instead: the time of the commit, into

     - every `?v=` in index.html (stylesheets, scripts, icons), and
     - every picture or font a stylesheet names with `url(../assets/…)`.

   The pictures, sounds and voices the scripts load read the stamp from
   config.js's own address (see VERSION in config.js), so they follow
   without being listed here.

   Run by .githooks/pre-commit on every commit that touches the game;
   `node tools/stamp.js` by hand does the same, and
   `node tools/stamp.js 20260101120000` writes a given stamp.

   Prints the files it changed, one per line, so the hook can add them
   to the commit.
   ============================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pad = function (n) { return String(n).padStart(2, '0'); };
const now = new Date();
const stamp = process.argv[2] ||
  (now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
   pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()));
if (!/^\d{14}$/.test(stamp)) {
  console.error('stamp must be 14 digits, YYYYMMDDhhmmss');
  process.exit(1);
}

const changed = [];
function rewrite(rel, edit) {
  const file = path.join(ROOT, rel);
  const was = fs.readFileSync(file, 'utf8');
  const next = edit(was);
  if (next !== was) { fs.writeFileSync(file, next); changed.push(rel); }
}

/* index.html: every stamped address. */
rewrite('index.html', function (s) {
  return s.replace(/\?v=\d{8,14}/g, '?v=' + stamp);
});

/* Stylesheets: a picture or font named relative to the stylesheet.
   Stamped whether or not it carried a stamp before. */
fs.readdirSync(path.join(ROOT, 'css')).filter(function (f) { return /\.css$/.test(f); })
  .forEach(function (f) {
    rewrite('css/' + f, function (s) {
      return s.replace(/url\((['"]?)(\.\.\/(?:assets|sfx)\/[^'"()?]+)(?:\?v=\d+)?\1\)/g,
        function (m, q, p) { return 'url(' + q + p + '?v=' + stamp + q + ')'; });
    });
  });

changed.forEach(function (f) { console.log(f); });

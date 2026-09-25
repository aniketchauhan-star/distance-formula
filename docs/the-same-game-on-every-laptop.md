# Build prompt — the same game on every laptop

The game is meant to play the same way wherever it is opened: the same
words, the same drawing, the same movements, in the same order. It
does not. On one laptop the dots the child taps are not there. On
another every letter is the laptop's own. A quick tap on Next skips two
screens, or leaves the triangle pulsing through the Pythagoras table,
or leaves the music quiet for the rest of the game. A screen reached
with the picker or with Back is missing its points — or is still
carrying the next screen's.

None of it is random. Each difference below was made to happen on the
running page, on purpose, by changing one thing a second laptop can
differ in — a setting, the network, the screen, the speed, the
browser's cache, the browser itself, or the moment the child taps — and
it is written down with what was measured. The fix is one idea applied
everywhere:

> **Nothing the child sees may depend on the machine or on the moment.**
> Where the game has to choose, it chooses once, in the game, the same
> on every laptop.

---

## 0. Before any code — three checks on the other laptop

These take a minute and may explain what was seen there today.

1. **Is it the same copy?** Until §6 puts a version on the loading
   screen, check how that laptop got the game. A folder copied or
   pulled earlier, or a web page loaded earlier today, can be an older
   game. (A web page: reload with Ctrl+Shift+R, or Cmd+Shift+R on a
   Mac.)
2. **Is "reduce motion" switched on?** If yes, that laptop gets the §2
   game — with no dots on the locate screens.
   - Windows 11: Settings → Accessibility → Visual effects → *Animation
     effects* (**off** means reduce). "Adjust for best performance"
     also turns it off, and school laptops often ship that way.
   - Windows 10: Settings → Ease of Access → Display → *Show animations
     in Windows*.
   - macOS: System Settings → Accessibility → Display → *Reduce motion*.
3. **Is it online, and which browser?** The letters come from Google
   (§3); offline, the game is set in the laptop's own font. Note the
   browser and its version (Chrome, Edge, Safari, Firefox).

---

## 1. What was checked

The game was run in Chrome with one condition changed at a time and
every screen measured: what is drawn on the board, every label, the
camera, the panels, the balloon, the bird, the fonts actually used, and
the timeline of every step.

| condition | stands for | result |
|---|---|---|
| "reduce motion" on | Windows *Animation effects* off, macOS *Reduce motion* | **0 of 120 dots visible** on the locate screens (120 normally); the triangle's glow lines invisible on 26, 28, 50–53, 60 |
| fonts never arrive | offline, or a school filter | every letter in the laptop's own font |
| fonts 4 s late | slow connection | first lines in the laptop's font, then a switch mid-game; axis numbers placed up to 4.1 px off |
| screen reached by the picker | a designer checking one screen | 41 of 56 screens differ from played-through; points missing on 10, no board on 35 |
| screen reached by Back | a child going back | 39 of 55 differ; the next screen's drawing left behind; the right-angle marker on 26 before the question |
| Next at the wrong moment | a quick child | 31 and 32 skipped; the triangle pulses through all of 28; the music stays quiet; a double tap counts twice |
| CPU six times slower | a cheap laptop | same steps at the same moments (±10 ms) — **fine** |
| 1366×657, 2560×1440, resized mid-screen | other screens | same proportions everywhere — **fine** |
| 1.6 Mbps connection | school Wi-Fi | 75 s to load instead of 4 s; voice in step with the words — **fine** apart from the wait |
| Safari, Firefox, older browsers | a Mac owner's browser, a school machine | read, not run: Safari likely silent and without glows (§7) |

§2–§7 are the causes, most visible first. §8 is speed, §9 the other
bugs found on the way, §10 what is *not* a bug.

---

## 2. The laptop's "reduce motion" setting changes the game — and hides the dots

### What happens

The stylesheets carry 15 blocks that apply only when the laptop asks
for less motion:

```
style.css           353  526  782  1089  1165  1252  1296  1562  1636
formula-table.css    72  183
number-selector.css 418      triangle-options.css 276
hint-note.css        81      screen-jump.css      140
```

| where | normally | with reduce motion |
|---|---|---|
| grid dots on 5–7 | pop in, breathe, take a tap | **invisible** — nothing to tap |
| the orange hint dot | pulses | invisible |
| a wrong dot | flashes red | nothing |
| the triangle's glow lines (26, 28, 50–53, 60) | pulse | **invisible** |
| the orange sweep under the subtraction (12, 18) | drawn end to end | **never appears** |
| the formula board's lines (36) | written on one at a time | all at once |
| clouds | drift across the sky | **piled at the left edge** (measured: both at x 127; 698 and 1233 normally) |
| drifting leaves, gusts | move | removed — while the wind is still heard |
| sparkle motes at the start | rise and fade | sit still as white specks for 15–22 s |
| her words | fade up and sharpen, .46 s each | snap in, .08 s |
| the table's drawer (28, 29c, 30, 39, 41) | slides open | appears |
| the answer panel | rises | appears |
| the active blank in a table | breathes | still |
| wrong-answer frame glow | two pulses at the corners | one fade |
| the subtraction's words (12, 18) | drawn on | appear |
| the hand, Play button, loader title | tap, bob, pulse | still |

Her flights, the camera, the flying numbers and the balloon are moved
by the script, which never reads the setting — so a reduce-motion
laptop gets a mixture: half the game moving, half standing still.

### Why the dots vanish

`style.css:530` — a grid dot starts at `opacity: 0`; it becomes visible
only through its pop-in, `dotIn … both` (`:540`). The reduce-motion
block at `:1252` keeps that pop-in on purpose. The block at `:1562`
then says `animation: none !important` for the same dots, and
`!important` wins: no pop-in, opacity 0, nothing on the board. The
glow lines are the same trap (`:1604` opacity 0, `:1636` animation
none). The sweep's block (`:786`) sets its dash offset to 0, but the
script has already set it inline (`game.js:4715`), and an inline style
beats the stylesheet. The clouds' only horizontal position is their
drift (`fx.js:176–180`), so with the drift gone they all sit at `left:
0`.

### What to build

- **One game on every laptop** (recommended; §12 Q1). The laptop's
  setting no longer changes anything. The 15 blocks move from
  `@media (prefers-reduced-motion: reduce)` to one class, `html.calm`,
  which nothing sets by default. One switch in config —
  `C.MOTION.calm: 'off' | 'follow-laptop' | 'on'`, default `'off'` —
  so the old behaviour is one word away.
- **Fix the traps anyway**, so that calm, if it is ever switched on,
  only stops things moving: dots, glow lines and the sweep stay visible,
  the clouds keep their places, the formula board still writes its lines
  one at a time (the delay stays, the wipe goes), a wrong dot still turns
  red, and no wind is heard with nothing moving.
- The script's own movements follow the same switch, or none of it
  does — never half.

---

## 3. The letters come from Google — and the game waits for only one of the two fonts

### What happens (measured)

- `index.html:25` loads Lilita One and Nunito 600 from
  fonts.googleapis.com.
- The loader waits for `document.fonts.ready` (`game.js:8950`). That
  waits only for fonts already in use, and at boot only the loading
  screen's Lilita One is. Measured: `ready` at 466 ms with Lilita
  loaded and Nunito not even asked for; Nunito arrived at 7.4 s, when
  her first balloon wanted it.
- **Fonts 4 s late:** her first lines are set in the laptop's font and
  switch to Nunito mid-game. The axis numbers were measured in the
  wrong font and are placed up to 4.1 px off (a "1" measured 16.3 px,
  drawn 20.4 px). The measurements are cached (`game.js:2311–2346`) and
  forgotten once, at the 2.5 s timeout (`game.js:8952`) — before Nunito
  came.
- **Fonts never arrive:** every letter is the laptop's system font —
  San Francisco on a Mac, Segoe UI on Windows, Roboto on a Chromebook.
- **Letters the fonts do not have:** ◀ ▶ on Back and Next are not in
  Lilita One (measured: drawn by the Mac's system font), and √ is not
  in Nunito's latin set. Each laptop draws its own.
- **A weight that does not exist:** Lilita One has one weight (400).
  Where the stylesheets ask it for 900 — the reel's digits
  (`number-selector.css:243`), the table's tiles
  (`formula-table.css:158`) — every browser fakes a bold, each in its
  own way. (Nunito's 700/800 requests all fall back to the loaded 600,
  the same in every browser.)

### What to build

- Both fonts in the repo: `assets/fonts/`, woff2, with their licence
  (both are SIL Open Font License, free to bundle). `@font-face` in
  `style.css`, `font-display: block`. The Google link goes.
- The loader loads both faces by name before Play is offered —
  `document.fonts.load('600 32px Nunito')` and
  `document.fonts.load('32px "Lilita One"')` — with a timeout that never
  blocks, then forgets the text measurements.
- If a face ever arrives after the game has started (`document.fonts`
  `loadingdone`), forget the measurements and re-place what is on the
  board.
- `font-synthesis: none`, and Lilita One asked only for the weight it
  has. If the reel's digits look too thin without Chrome's fake bold,
  give them a fixed stroke rather than a weight, so every browser draws
  the same thing.
- ◀ ▶ drawn as shapes; √ drawn (the table already draws its radical
  with a border) or taken from a bundled font that has it.

---

## 4. The same screen looks different depending on how you got there

### What happens (measured)

Every screen was captured as data — what is drawn, every label, the
camera, the panels, the balloon — the moment it settled, three ways:
played through; jumped to with the picker from a fresh start; come back
to with Back from the screen after it.

**Picker** — 41 of 56 screens differ. The ones that matter:

- the pair and its labels are missing on 9, 15, 26, 29c, 32, 33, 34, 50,
  51, 52 — "Did you notice?" over an empty board;
- 35 arrives with no board at all;
- 48 is missing one of its two worked pairs and its "10 units";
- the camera frames 24–28 and 29b differently, because it frames what is
  drawn and less is drawn.

**Back** — 39 of 55 differ. The ones that matter:

- the next screen's drawing stays: 12 and 18 write their subtraction
  against the next screen's pair; 28's table sits beside 29's triangle,
  without "3 units" and "4 units", so its numbers have nothing to fly
  from and simply appear; 52 shows 53's triangle; 59 shows 60's "13
  units";
- **26 shows the right-angle marker before it asks "What kind of
  triangle is this?"** — the answer, given away;
- the pair is missing on 29b, 32, 33, 50, 51, and 34 has no board;
- Back from 5 goes nowhere: it lands on 4, which moves on by itself.

The remaining differences are her position mid-flight at the moment of
capture, and one intended difference: a question that keeps the control
up from the screen before (14, 25, 29b, 58, 59) raises it after she
asks when it is entered cold.

### Why

A screen draws only what it adds; what it inherits is whatever the
screens before it happened to leave. `seedInherited` (`game.js:6028`)
rebuilds that only for a screen that keeps a drawing and has none of its
own (`if (entry.segment || !entry.keepSegment) return;`), and nothing
takes away what a later screen added when Back comes back.

### What to build

- Every screen can be entered cold and comes out identical to the
  played-through one. On the picker, on Back, and on Next when it
  skips, the board is rebuilt to what the script says it holds at that
  screen — pair, legs and their lengths, marker, range, camera —
  settled, in one frame, before the screen dresses; anything a later
  screen added is taken away.
- One function answers "what is on the board at screen *i*", worked out
  from the config and used by all three paths. Playing through keeps
  doing exactly what it does now.
- Back from 5 lands before the screen that moves on by itself.

---

## 5. What the child taps, and when

### What happens (reproduced on the page)

| the child | what happens | why |
|---|---|---|
| taps Next within ~0.1 s after "That's right!" appears on 30 | 31 and 32 hand themselves on; the game lands on 33 | the balloon's typing is queued on a timer nothing cancels (`game.js:905`), and the old line's `onDone` (`:877`, `:963`) runs on the new screen and moves it on |
| taps Next while 26's three sides are pulsing | the sides keep pulsing through all of 28 — table included — and into 29 | the pulse's "off" is itself a queued step (`game.js:3558`), and the screen change cancels it |
| taps Next during 12's spoken line | the music stays ducked (0.055 instead of 0.200) for the rest of the game | the "un-duck" is a queued step (`game.js:7442`), cancelled with the screen |
| double-taps a wrong dot on 6 | counted as two misses: the answer is shown and the screen moves on | `answerWrong` (`game.js:8797`) counts every tap; nothing locks between them |
| misses 57 twice, then taps Next while the working is shown | 58's triangle comes up dimmed, with one side lit, and stays that way | the working's closing "put the board back" (`game.js:8594`) is a queued step, cancelled with the screen |

### Found by reading — the same four families

Verify each while building; every one is a variation of the four above.

- **The old screen's work runs on the new one.**
  - The answer panel's working steps (`triangle-options.js:248–255`)
    are raw timers, and hiding the panel (`hide`, `:323`) does not cancel
    them: after Next on 57 or 59, any step still queued lights a side or
    flies a digit on the next screen.
  - The slots' auto-fill (`formula-slots.js:273`) speaks "That's where
    they go." over 53.
  - `revealControl`'s two raw timers (`game.js:9103`, `:9107`) show or
    hide the old screen's control on the new one.
  - Next and Back wait a raw 280 ms (`game.js:8868`, `:8891`) that the
    picker does not, so a pick straight after Next is overridden.
- **An "off" lost with the screen.**
  - The board's `sliding` class (every later move then glides across
    the frame).
  - The board working's `spotlightPart(null)` (`game.js:8314`) — the
    same as 57 → 58 above, on the other working.
  - A coordinate's glow, when its flight is landed early (`game.js:7576`).
- **One tap counted twice.**
  - The answer panel after a wrong answer: 42 and 55 jump to the
    teaching beat after one mis-tap; 26, 60 and 61 give the answer away.
  - The slots' Check.
  - The table's tile during its fold: on the last blank, "That's right!"
    is typed twice and its word timer never stops.
- **A clock that is not the game's.** Balloon typing on a raw timer, the
  leaf sweep's screen swap on a raw timer (§8), and `animationend`
  waits with no fallback (`game.js:7178`, `:7225`).

### What to build

- **One owner for everything a screen schedules.** Every timer,
  interval, frame loop and end-of-animation listener a screen starts is
  registered with the screen, and a screen change cancels all of it —
  the balloon's typing timer and its `onDone` included.
- **Every "on" has its "off" run by the change itself**, not queued.
  Leaving a screen puts back the pulse, the glow, the hush, the slide
  and the duck; the duck counter goes to zero on every change.
- **A control takes one answer at a time.** The first tap locks it until
  that answer has been handled.
- **Next, Back and the picker go through one guarded change.**

---

## 6. Old copies of the files

### What happens

- `index.html` gives every stylesheet and script `?v=20260924014413` so
  a browser fetches new copies when they change. It was set at 01:44
  today and has not changed since, while 25 commits changed `game.js`,
  `config.js`, `style.css`, `formula-table.css`, `formula-table.js`,
  `fx.js`, `screen-jump.js` and `voice.js`. A browser that loaded the
  game over a web address earlier can keep old copies — and can mix an
  old stylesheet with a new script.
- Pictures, sounds and the stylesheets' `url('../assets/buttons.png')`
  carry no stamp at all. `normal stand swifty.png` changed twice today,
  each time at a new size (398×307 → 1343×1171 → 1429×1101); an old copy
  is drawn squashed or blurred. `buttons.png` changed on 22 Sep, and the
  crops in `number-selector.css` and `formula-table.css` are percentages
  of the new sheet.
- The three `<meta http-equiv>` cache lines (`index.html:10–12`) are
  ignored by every current browser.
- Opened from a folder (file://), none of this applies — which is why
  this Mac never shows it.

### What to build

- One stamp for everything, written automatically from the last commit —
  a small script run before each commit (or a git hook), never a hand
  edit — on every css/js, every picture in `C.ART`, the music, the
  voices, and the stylesheets' `url()`s.
- The stamp shown, small, on the loading screen and in the picker's
  header, so two laptops can be compared at a glance.
- The meta lines go; they promise something they do not do.

---

## 7. Browser differences

Chrome and Edge behave the same (Edge is Chrome inside), and everything
above was measured in Chrome. Safari and Firefox were not run — this
Mac cannot drive them unattended — so what follows was found by reading
the code against each browser's documented behaviour and its bug
tracker, and each line says how sure it is.

| browser | what the child sees | why | sure |
|---|---|---|---|
| Safari | her recorded voice mostly silent: the words appear, paced to a voice nobody hears | Safari allows sound only from a tap, one player at a time; each line is its own player (`voice.js:141`), started seconds after the last tap (`voice.js:168`), and the refusal is swallowed | likely |
| Safari | the side being named gets no glow; the triangle's pulse is a bare thick line; the answer's line does not pulse | the glows are CSS `filter: drop-shadow` on SVG shapes (`style.css:836`, `880`, `1585`, `1616`), which Safari does not draw | certain |
| Safari 15–18, Firefox before 126 | the "4" lifted off the triangle into the table starts 100–200 px away from the real "4", at the wrong size | `digitSpot` reads `getScreenCTM` (`game.js:5155`), which in those browsers leaves out the stage's scale | likely |
| Safari | a quick double tap on the scene highlights one of her words in blue | `user-select: none` without Safari's `-webkit-` form (`style.css:43`) | certain |
| Safari 15 (older Macs) | the drifting leaves spin in the top-left corner | CSS motion paths (`fx.js:255`) need Safari 16 | certain |
| Safari before 17.5, Firefox ESR, older Chromebooks | her line can leave one word alone on its second row | `text-wrap: balance` (`style.css:337`) is newer than they are | certain |
| Chrome before 87 (old Chromebooks) | a blank page | `inset: 0` (`style.css:47` and others) | certain |
| iPad | the music never ducks under her voice; the slider moves only from its knob | iOS ignores `volume` (`audio.js:54`, `68`); iOS range inputs | certain / likely |

### What to build

- **Her voice:** one player for all her lines, started silently inside
  the Play tap and reused by swapping its source — that is what Safari
  counts as "from a tap". (Routing the lines through the sound engine
  instead would need `fetch`, which fails when the game is opened from a
  folder.) And never silent: if a clip is refused, the chirps play.
- **Glows:** drawn as a wider, softer copy of the line behind it — the
  way the pulse overlay already works — or an SVG `<filter>`; never a
  CSS filter on an SVG shape.
- **The lifted digit's start:** from the text's own box
  (`getBoundingClientRect`), or through `Board.boardToStage` as
  `sourceSpot` does.
- `-webkit-user-select: none` beside `user-select: none`.
- **Leaves:** no drift where motion paths are unsupported
  (`CSS.supports('offset-path', 'path("M0 0")')`).
- `inset: 0` written as its four sides.

---

## 8. Slower laptops and slower connections

### Measured, and fine

- **CPU six times slower:** screens 22 and 28 hit every step at the same
  moment (±10 ms), with no stalls. The game runs on the clock, not on
  frames.
- **Screen size:** at 1366×657, 1920×1080, 2560×1440, and after a resize
  mid-screen, the dotted guides keep their size relative to the board
  (an 8 px dot at full size, 4 px at 0.61, 10 px at 1.33).
- **Voice:** on a 1.6 Mbps connection every clip is in before Play, and
  her voice starts within 4 ms of her words.

### Not fine

- **Loading:** 75 s on a slow connection instead of 4 s — 11.7 MB of
  pictures, 67.9 MiB once decoded, each drawn 3–29 times smaller than it
  is stored. Export each at twice the size it is shown, and decode it
  (`img.decode()`) before its first use rather than inside the first
  animation that shows it.
- **The leaf sweep on a weak graphics chip** (found by reading; this Mac
  cannot show it): 216 large leaves, each its own layer
  (`fx.js:385–448`, about 150 MB of layers at 1080p), with the screen
  behind swapped on a timer (`fx.js:457`) that does not know whether the
  leaves have arrived. A slow laptop shows the old board vanish and the
  new one pop in through the gaps. Fewer leaves, pre-scaled; swap on the
  leaves' own clock.
- **Work every frame:** the 120 breathing dots, animated drop-shadows
  (`segLit`, `realStrokePulse`), the camera push re-placing every label
  on every frame (`game.js:1862–1950`), the board slide on `left`/`top`.
  On a laptop without graphics acceleration each is paid every frame.
  Pulse with the opacity of a glow drawn once; move with transforms;
  re-place labels once, when the camera stops.
- **Timers sized to an animation:**

  | timer | animation | result |
  |---|---|---|
  | balloon hidden at 240 ms (`game.js:980`) | `bubbleOut` .26 s | cut short on every machine |
  | wrong-number wobble cleared at 320 ms (`number-selector.js:257`) | 340 ms | cut short |
  | slider shake cleared at 360 ms (`distance-slider.js:202`) | .4 s | cut short |
  | table `settled` at 760 ms (`formula-table.js:192`) | .7 s drawer | snaps open on a slow frame |
  | leaf swap at 1326 ms (`fx.js:457`) | leaves arrive up to 1474 ms | swap visible |

  End each on its animation's own end, or give it margin.

---

## 9. Other bugs found on the way

- **The right-angle marker swoops in from the corner** (every browser).
  Its pop-in scales it about the board's top-left corner rather than its
  own (`style.css:1710`, no `transform-box`). Measured on 29c: it starts
  near the corner, overshoots about 420 px past C, and settles. The
  written working (`.workline`, `style.css:1686`) has the same fault.
  Scale each about its own centre.
- `game.js:5589` and `:5628` read `getBoundingClientRect` without calling
  it, so the "replay the shake" does nothing: a second wrong tap within
  600 ms shows no red flash.
- The sprite clock clamps a frame to 60 ms (`game.js:222`): below about
  16 frames a second her wings and beak play in slow motion. Clamp at
  about 250 ms.
- 13 `:hover` effects stick after a tap on a touch-screen laptop — a
  tapped dot stays big and blue. Put them under `@media (hover: hover)`.

No script errors: the four full passes above — played, picker, Back,
and reduce motion — went through every screen without one. The bugs in
this prompt are all things the game does without complaining.

---

## 10. Not bugs — so nobody chases them

- **Smoothness.** A 120 Hz screen looks smoother than a 60 Hz one, and a
  laptop on battery saver may drop frames. The timing is the same.
- **A silent title screen.** On a laptop whose browser has not yet
  learned to trust the game, the title screen is silent until the first
  tap. Browsers require a tap before sound, and the game already
  handles it.
- **The sky.** Clouds and drifting leaves are placed at random each
  time.
- **Missing recordings.** 64 of her 77 lines have no recording — from
  screen 8 on, mostly — and play the little chirps instead. That needs
  recordings, not code.
- **Bluetooth headphones** delay her voice by 0.15–0.3 s.

---

## 11. What must not change

- Every screen's words, drawing, order and timing, as they play through
  on this Mac today.
- The look: the faces and weights that render on this Mac now.
- The rules in force: only lines light; no line crosses a point; the
  axes fade as one shape; the grid fills before the camera frames; the
  red glow on every wrong answer; after a right answer nothing animates
  in again.
- Screen 28's plain triangle and its table; 29c's and 30's tables; the
  axis cases' big board.

---

## 12. Open questions for the author

1. **Reduce motion.** Recommended: the game plays the same on every
   laptop and ignores the setting. If a calmer version is wanted later,
   it is a switch the teacher turns on, the same everywhere. The
   alternative is to keep following the laptop's setting — then a
   reduce-motion laptop is meant to look different, and only the
   invisible dots and lines are fixed.
2. **The screen picker.** It lets anyone start any screen cold. Should
   children see it, or should it appear only with `?picker` in the
   address? §4 is needed either way, because Back has the same problem.
3. **How is the game opened on the other laptop** — from a folder, or a
   web address? It decides how much §6 matters there.

---

## 13. How to know it is right

Measured on the running page, not looked at. These are the checks that
found the bugs; each must now come out clean.

1. **Reduce motion on and off:** the captured state of every screen is
   identical, and all 120 dots are visible on 5–7.
2. **Fonts normal, blocked, 4 s late:** every piece of text is drawn in
   the game's own faces (no system font reported for any node); measured
   and drawn widths of the board's numbers match to 0.5 px; Play waits
   for both faces.
3. **Picker, played, Back:** identical captured state on every screen,
   except the control kept up from the screen before.
4. **Next at the moments in §5:** 30 goes to 31 and stays; 28's
   triangle never glows; the music is back at 0.200 within a second of
   any screen change; a double tap on a wrong dot counts once; a double
   tap on the last table tile gives one line.
5. **The stamp** on the loading screen is the last commit's, and every
   css, js, picture and sound address carries it.
6. **CPU ×6, and the three screen sizes:** unchanged — keep them fine.
7. **The walk:** every question answered wrong once, then right; it
   reaches 61 with no exceptions.
8. **By hand, once, on real machines** (this Mac cannot run them):
   - Safari on a Mac: her voice on every recorded line; the named side
     glows; the "4" and "3" lift off exactly where they are written;
     a double tap selects nothing.
   - Edge on Windows with *Animation effects* off: the same game as on
     the Mac.
   - Any laptop with the Wi-Fi off: the game's own letters.
   - A touch-screen laptop: a tapped dot does not stay big and blue.
   - An older Chromebook, if the school has one: the game loads.

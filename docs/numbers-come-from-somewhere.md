# Build prompt — every number comes from somewhere

One idea, applied everywhere the game writes maths: **a number that can
be read off the board arrives in the working by flying out of the thing
it was read from, and that thing lights as it leaves.**

The game already does this once, beautifully, and nowhere else. This
makes it the rule.

**Read section 0 of `docs/horizontal-distance-animation.md` first** —
the text-tweening pitfalls there are the ones this whole prompt rests
on.

---

## 0. What is already built — do not rebuild any of it

Five pieces exist. Four of them are used everywhere and one is used on
two screens. The work is almost entirely in connecting them.

| piece | what it does | used on |
|---|---|---|
| `Board.runEquation` | lifts a digit **out of a coordinate label**, flies a copy of it into a sum on the board, then flies the answer back down onto the line | 12, 18 — **only** |
| `Board.tweenText` | moves SVG text by tweening its `x`/`y`/`font-size` attributes, frame by frame | the above |
| `Board.glowPart(part, on, which)` | lights the **x halves** or the **y halves** inside coordinate labels — the labels are built as `tspan`s tagged `data-part` | 10, 11, 16, 17 |
| `Board.spotlightPart(which)` | brings one side of the drawing forward and hushes the rest — `h`, `v`, `ab` | every panel working |
| `Opts.showFormula(lines, onBeat)` | writes a working one line at a time, and calls back with the side each part names as it lands | 28, 29, 30, 45, 47 |

So today: **the panel workings light the right side of the triangle but
the numbers simply appear**, and **the board sum flies its numbers but
only on two screens**. Everything needed to make one behave like the
other is already written.

---

## 1. Why this is worth doing

A child who has understood nothing can still finish this game. They can
count squares, they can read `4² + 3²` off a panel, and they can press
the right number. What they cannot necessarily do is answer the
question the formula is actually asking: *where did that 4 come from?*

`(x₂ − x₁)` is not hard arithmetic. It is hard **reference**. The child
has to hold that `x₂` is not a value but an address — *the x of the
second point, the one over there on the board* — and school maths loses
most people at exactly that step. A formula that writes itself out of
thin air teaches the arithmetic and hides the reference.

A number that visibly **leaves the point and lands in the formula**
teaches the reference and nothing else. It says: this slot is not a
letter, it is that number, from that place. And when the answer flies
back down onto the line it measures, it closes the loop — the formula
is not a separate thing that happens in a panel, it is a way of getting
from the board to the board.

That is the whole argument. It is worth doing on every screen that
writes maths, not one.

---

## 2. The rule: fly what is read, write what is worked out

One sentence, and it decides every case:

> **A number that was READ off the board flies in from where it was
> read. A number that was WORKED OUT appears where it belongs.**

Screen 45's working, line by line — the house at `(1, 1)` and Café A
at `(5, 4)`:

```
d = √((x2 - x1)² + (y2 - y1)²)   ← the formula they were taught: nothing flies
d = √((5 - 1)² + (4 - 1)²)       ← 5, 1, 4, 1 all FLY, from four coordinate halves
d = √(4² + 3²)                    ← 4 and 3 are worked out: they APPEAR
d = √(16 + 9)                     ← worked out: appear
d = √25 = 5                       ← worked out — and then the 5 FLIES BACK to the line
```

This is not a rule about animation. It is the distinction the child is
losing, made visible: **reading the board** and **doing arithmetic** are
two different acts, and a working that treats them identically teaches
that they are the same thing.

Two corollaries fall straight out of it, and both matter more than they
look:

- **A number flies once.** The first time it enters the working it comes
  from somewhere; after that it is just text on a line, and re-flying it
  says it came from the board twice.
- **The answer flies home.** Every working ends by putting its result
  back on the thing it measures. `runEquation` already does this and it
  is the best moment in the game; it should be how every working ends.

---

## 3. Where this comes up — every place, and what each should do

The audit. Nothing else in the script writes maths.

### 3.1 The board sum — screens 12 and 18

`6 - 3 = 3` and `2 - (-3) = 5`, worked on the board itself.

**Already correct, and it is the model for everything below.** Leave it
exactly as it is. Every other screen is being brought up to this.

### 3.2 The substitution — screens 45 and 47

```
45:  d = √((5 - 1)² + (4 - 1)²)      from (1, 1) and (5, 4)
47:  d = √((-3 - 5)² + (2 - (-4))²)  from (5, -4) and (-3, 2)
```

**The single most valuable place in the game for this**, and the one
that currently teaches the least. Four numbers, four coordinate halves,
four flights:

- on 45, the `5` and the `1` out of the **x halves** of the two
  coordinates, then the `4` and the `1` out of the **y halves**
- on 47, the same four flights — and there they carry the minus signs
  with them, which is that screen's whole lesson

In the order the formula reads them, so the child's eye is led along the
subtraction rather than watching four things at once. As each pair
lands, its side of the triangle lights — which `spotlightPart` already
does; it is the flight that is missing.

Then the squares and the sums appear (worked out), and the answer —
**5 on 45, 10 on 47** — flies down onto AB.

### 3.3 The Pythagoras working — screens 28, 29, 30

```
AB² = 4² + 3²
```

Here the numbers are read off the board too, but from the **leg
lengths** rather than from coordinates — the `4` out of `4 units` on the
horizontal leg, the `3` out of `3 units` on the vertical. Same rule,
different source.

`16`, `9`, `25` are worked out and appear. `AB = 5 units` flies down
onto the hypotenuse.

### 3.4 The axis cases — screens 39 and 41

```
d = √((x2 - x1)² + (0 - 0)²)
```

Both zeros are read off the board — they are the y halves of `(x1, 0)`
and `(x2, 0)`. `Board.glowCoords` already lights them; they should fly
into the `(0 - 0)` as it is written, which is the entire point those
screens are making: *that term is zero because those two numbers are.*

This is the best case in the game for the device, because the formula
there is being **narrowed** rather than filled — a term collapsing is
much easier to believe when you watched the numbers arrive in it.

### 3.5 The general form — screens 33 and 34

```
AC = x2 - x1        CB = y2 - y1
```

The symbols themselves are read off the board: `x2` out of `(x2, y1)`,
`x1` out of `(x1, y1)`. **These should fly too**, and they may be the
most important flights of all — this is the screen where the child
either sees that `x₂` is an address or does not, and the flight is the
only thing on that screen that can say so.

### 3.6 Where it must NOT happen

- **Screen 36, the recap.** Three lines of pure algebra, no pair on the
  board to fly from, and the beat is a summary rather than a working.
  Nothing flies.
- **Screens 10, 11, 16, 17.** These light coordinate halves and write
  nothing. Already right — a glow with nowhere to go is the correct
  thing there.
- **Any number that is worked out.** See §2. This is the rule doing its
  job, not an exception to it.

---

## 4. What one flight looks like

The shape `runEquation` already uses, and the shape everything should
use. Four moments, and none of them is decoration:

1. **It lights where it is.** The half of the label the number lives in
   comes up — `glowPart`'s own highlight, not a new one. *This is the
   number I mean.*
2. **A copy leaves.** The original **never moves and never changes**. A
   label that empties itself teaches that the board lost something.
3. **It travels** — 700–800ms, one easing, arriving at the size the
   formula is set in rather than the size it left at, so it visibly
   becomes part of the line it is joining.
4. **It lands and the side lights.** The slot fills, and the part of the
   drawing that number describes comes forward — `spotlightPart`.

Then the next one. **One thing in the air at a time**: two numbers in
flight is a race, and a child watches the winner.

The whole sequence for a four-number substitution runs about five
seconds. That is not slow. It is the only five seconds in the game that
answers *where did that come from*, and every other beat is paced to be
read too.

---

## 5. Restraint — the part that is easy to get wrong

This device is strong, which means it is easy to ruin by using it more.

- **Never two flights at once.**
- **Never re-fly a number** that is already in the working.
- **Never fly a number that was not read** — the rule in §2 is not a
  guideline, it is the teaching.
- **Never move an original.** Copies only, always.
- **The board's own drawing does not move.** Points, lines and lengths
  stay exactly where they are; only copies travel.
- **A skip cancels everything in flight**, with nothing left mid-air and
  nothing half-written. Everything goes through the game's own
  `later()`.
- **Nothing waits on it.** A child who has already answered, or who
  presses Next, is never held up by a flight.
- **If a flight cannot be made** — no source on the board, a label that
  is not split into halves — the number simply appears, as it does
  today. Degrading to the current behaviour must always be available and
  must never look broken.

---

## 6. How to build it

The work is one new thing and five small connections.

1. **Lift the flight out of `runEquation` into its own thing** —
   something like `Board.flyNumber(fromNode, toPoint, size, done)`:
   light the source, clone its glyph as an `.xfly`, tween it with
   `Board.tweenText`, pin the end, remove the clone. `runEquation`
   then uses it too, and must look exactly as it does now afterwards —
   that screen is the reference, and if it changes, the change is a bug.
2. **Teach the working where its numbers live.** A formula part already
   carries `lit: 'h' | 'v' | 'ab'`; give it an optional source as well —
   which point, and which half of it, or which leg's length. Config,
   not code: the screens differ only in where they read from.
3. **`Opts.showFormula`'s `onBeat` already fires as each part lands.**
   That is the hook: fly first, then land the part, then light the side.
   The panel's own timing has to wait for the flight, so `formulaMs`
   must account for it or the screen is taken away mid-working.
4. **`Formula.setStep`** (the axis cases) needs the same hook, and it is
   the only one that does not have one yet.
5. **The answer flying home is already written** in `runEquation`. Use
   it for the panel workings too.
6. **Every duration in config**, in one block, beside `GRID.xeq`'s —
   which is where the existing flight's timings already live and what
   the new ones should match.

**A note on how NOT to build it.** Do not animate a transform on an SVG
`<text>`, and do not reveal by clipping. Section 0 of the horizontal
prompt records what happens; `tweenText` exists because of it.

---

## 7. What must not break

- **Screens 12 and 18 are pixel-identical afterwards.** They are the
  reference implementation; if they change, something is wrong.
- Every working still ends with the same words on the same lines. This
  changes **how** numbers arrive, never **what** arrives.
- Every screen still takes the same total time, or the hold is extended
  to match — nothing is carried off mid-flight.
- Skip, Back and Next all leave the board clean: no clone left on the
  board, no label left lit, no slot left empty.
- The coordinate labels are unchanged at the end of every flight —
  same words, same place, same size.
- A screen with no source on the board behaves exactly as it does today.
- Nothing that is drawn moves.

---

## 8. Acceptance — in a browser, watching it

- [ ] on 45, the `5` and the `1` visibly leave the two x halves and land
      in `(5 - 1)`, one after the other, and the run across lights
- [ ] then the `4` and the `1` leave the y halves and the step up lights
- [ ] `4²`, `16` and `25` are **not** flown — they appear
- [ ] the `5` flies down onto AB at the end
- [ ] on 47 the same four flights happen, carrying their minus signs
- [ ] on 28, the `4` and the `3` come out of the two leg lengths
- [ ] on 39 and 41, the two zeros come out of the coordinates into
      `(0 - 0)` before the term collapses
- [ ] on 33 and 34, `x2` and `x1` come out of the labels into
      `AC = x2 - x1`
- [ ] the recap on 36 is unchanged
- [ ] no original label ever moves, empties or changes size
- [ ] never two things in the air at once
- [ ] screens 12 and 18 look exactly as they did before
- [ ] pressing Next mid-flight leaves nothing behind
- [ ] every other screen in the game is unchanged

---

## 9. Built — 19 Sep 2026

Every box in §8 ticks, watched in headless Chrome as well as checked in
the Node harness.

**There are two flights, not one**, and the prompt's §6 only anticipated
the first. `Board.tweenText` moves SVG text inside the board's own
coordinates — right for a digit travelling from a label to a sum drawn
on the same board, and useless for reaching the working panel, which is
HTML on the stage in different units entirely. So the board keeps the
flight it has, and **`FX.flyGlyph(text, from, to, ms, done)`** is the new
one: a copy on the stage, given both ends in stage coordinates, tweened
by `requestAnimationFrame` because it has to carry a font-size as well
as a position.

`Board.boardToStage(bx, by)` converts between them, and it takes the
**view** into account — pushed in, the same board point is somewhere
else on the stage, and a flight that ignored that would set off from
beside the label rather than out of it.

**Where each number comes from is config, not code.** A formula part
gains an optional `from`:

```js
{ t: '5', lit: 'h', from: { p: 'b', half: 'x' } }   // a coordinate half
{ t: '4²', lit: 'h', from: { leg: 0 } }             // a leg's own length
```

and the part that goes back to the board gains `home: true`. The screens
differ only in where they read from, which is exactly what config is
for.

**The panel keeps the timing.** `Opts.showFormula(lines, onBeat, opts)`
takes `onFly` and `flyMs`: it schedules the flight, then the landing,
then the next part — so a number is always seen leaving the board before
the slot it is going into fills. `formulaMs` counts the flights too, or
the screen is carried off with a number still in the air.

### What had to change that the prompt did not say

- **Labels that were one run of text cannot be pointed at.** `partSpot`
  finds a half by its `tspan`, so a label written as `coordText` has no
  halves to lift. Screens 42, 47 and the general form 31–34 are built in
  parts now — the same words, the same look, and each half addressable.
  The general labels picked up the game's own non-breaking space after
  the comma in the process, which is what every other coordinate on the
  board has always used.
- **The axis zeros were tagged `glow: true`**, which lights them but
  gives them no half, so nothing could point at either. They are
  `glow: 'y'` and `glow: 'x'` now.
- **The answer going home reverses a decision.** `showWorking` used to
  leave the answer off the line when a panel was writing the working —
  "stating the answer twice makes the working look like a caption". It
  is not twice: the statement *moves*, which is how the board's own sum
  has ended since it was built. `qa-typedwork` asserted the old rule and
  now asserts the new one, keyed on whether the screen marks a part
  `home`.
- **45's triangle carried into 46.** The working draws the legs, and the
  beat after it is about two walks rather than about how one of them was
  worked out — so 46 takes `dropLegs`, as 48 already did.

Probes: `qa-optwork` now derives the line pacing with the flight term in
it, read from config the way it already reads `LINE_MS` and `BEAT_MS`;
`qa-pythshow` normalises the non-breaking space. Screens 12 and 18 are
untouched — `qa-xeq` and `qa-xeqcol` both green, which is the constraint
§7 puts first. Suite is at its five standing reds. Browser capture:
`cdp-fly.js`, which watches the four flights of screen 45 one at a time
and confirms **nothing is ever in the air twice**.

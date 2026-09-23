# Build prompt — the working comes off the triangle

Pythagoras is not a formula to be copied down. It is a sentence about
the shape in front of the child, and every symbol in it is one of that
shape's sides. The panel on screen 28 currently *states* the theorem
beside the triangle. It should *assemble* it out of the triangle —
each name and each number lifted off the side it belongs to, carried
across, and set down in the working, with that side lit while it
travels and everything else stepped back.

That is the whole of this build. Five changes, all on the Pythagoras
beats (28, and the screens that reuse the same machinery: 29, 30, 45,
47, 51, 53, 54).

---

## 0. What is wrong, measured

Measured live on screen 28, with the board pushed in and all five
lines up.

**The working is spaced like five separate statements.**

```
   type size on the board          24px   (30 through the camera)
   baseline to baseline            80px
   ratio                           3.27x the type
```

A worked calculation is read as one continued sentence — that is what
the stacked `=` column is for. At 3.27× the type the lines are further
apart than they are tall, and the plate has to be 456px high to hold
285px of writing. Ordinary set algebra sits at about 1.5× the type.

**Half the theorem is bracketed and half is not.**

```
   (AB)² = (AC)² + (CB)²      ← names bare:  AB² = AC² + CB²
       = (4)² + (3)²          ← numbers bracketed
```

The substitution already brackets its numbers. The names it is
substituting into do not, so the two lines do not read as the same
expression twice.

**Three of the five symbols come from nowhere.** Only the two
substituted numbers have a source on the board:

```
   (4)²   from: { leg: 0 }     flies out of AC's length label
   (3)²   from: { leg: 1 }     flies out of CB's length label
   AB²    —                    simply appears
   AC²    —                    simply appears
   CB²    —                    simply appears
```

So the beat that is supposed to say "this symbol IS that side" never
says it about the theorem itself, only about the arithmetic.

**"Only that side lights" is not true of anything but the lines.**
With `spotlightPart('ab')` running:

```
   segLine        spot   1.00      ✓
   AC line        hush   0.28      ✓
   CB line        hush   0.28      ✓
   AC length      hush   1.00      ✗ carries the class, ignores it
   CB length      hush   1.00      ✗
   A letter       ----   1.00      ✗ not in the set at all
   A coordinate   ----   1.00      ✗
   A dot          ----   1.00      ✗
   C letter       ----   1.00      ✗
   C coordinate   ----   1.00      ✗
   triangle face  ----   1.00      ✗
   right angle    ----   1.00      ✗
```

Two separate faults. The corner labels, the face and the right-angle
mark were never added to `spotlightPart`'s map. And the lengths **are**
given `hush` and ignore it, because `#gridAxes .leglen.pop` runs
`labelPop ... both`, whose last keyframe holds `opacity: 1` — a filled
animation beats a class declaration, so the class can never dim it.
(This is the fourth instance of that same trap in this file. See
`.triangle-point`, `.spotbeat` and `.segdot.set`.)

**The clock is flat.**

```
   work.lineMs    1500     one line, then the next
   work.beatMs     820     one named part after the last
   fly.pickMs      340     a glyph lights where it is
   fly.ms          760     and travels
   spot/hush       300ms   the transition between states
```

Nothing is paced to what is happening. A glyph being lifted off the
board takes the same beat as a number that was simply worked out.

---

## 1. One piece of working, not five statements

`GRID.work.lineGap: 1.25` → **`0.62`**

The gap is `lineGap × stepY × typeScale`, so at `stepY 78` and
`typeScale 0.816` that is 39px between baselines against 24px of type
— **1.6×**, which is how algebra is set. The plate is sized off the
block, so it follows on its own: about 260px tall instead of 456.
Nothing else changes.

Keep the equals column exactly as it is. Every line already hangs from
its own `=`, computed in `layoutWorking`, and that is what makes the
tighter spacing read as continuation rather than crowding. The two
belong together: close spacing without the column is a pile, the
column without close spacing is a list.

---

## 2. Every side name in brackets

```
   (AB)² = (AC)² + (CB)²
        = (4)² + (3)²
        = 16 + 9
        = 25
     AB = 5 units
```

The bracket says "the whole of this side, and then squared" — which is
the thing a child gets wrong when they meet `AB²` for the first time
and read it as `A` times `B` squared.

The last line stays bare. `AB = 5 units` is a statement about a
length, not a squaring, and bracketing it would say there is an
operation on it that there is not.

Apply to every screen with a Pythagoras `formula`, so the same
sentence is never dressed two ways.

---

## 3. Every symbol is carried off the triangle

Extend `sourceSpot` with a third kind of source. It currently knows
two:

```
   from: { leg: n }             a leg's length label
   from: { p: 'a', half: 'x' }  one half of a coordinate
```

Add:

```
   from: { side: 'ab' | 'h' | 'v' }
```

which resolves to the **middle of that side**, in board coordinates,
carrying the side's name as its text. A name is not a number sitting
somewhere; it names the whole span, so the middle of the span is where
it comes from. Use the same `boardToStage` conversion the other two
use, and the same size rule (`GRID.segment.nameSize * typeScale * k`).

The config then reads:

```js
{ kind: 'lead', parts: [
    { t: '(AB)²', lit: 'ab', from: { side: 'ab' } }, { t: ' = ' },
    { t: '(AC)²', lit: 'h',  from: { side: 'h'  } }, { t: ' + ' },
    { t: '(CB)²', lit: 'v',  from: { side: 'v'  } } ] },
{ kind: 'step', parts: [
    { t: '= ' },
    { t: '(4)²', lit: 'h', from: { leg: 0 } }, { t: ' + ' },
    { t: '(3)²', lit: 'v', from: { leg: 1 } } ] },
```

**`16`, `9` and `25` must NOT fly.** That is not an oversight to be
tidied up — it is the distinction the whole beat rests on. What was
*read off the board* arrives from the board. What was *worked out*
simply appears. A child who sees `16` fly out of the triangle has been
told that 16 is a thing on the paper, and it is not: it is what you get
when you square a thing on the paper.

`5 units` keeps its existing flight home to the line.

The flight contract is already right and should not change: the source
lights as the glyph is lifted, the original never moves, never empties
and never resizes, and the source lets go as the glyph lands. Extend
`glowPart` so a `side` source glows the side rather than a coordinate
half — the side lighting IS the answer to "where did that come from".

---

## 4. One side lit; everything that belongs to it lit with it

A side is not a line. It is a line, its length, its two corners, the
letters naming them and the coordinates under them. When the working
says `(AC)²`, all of that should be what the child sees, and the rest
of the drawing should be behind it.

Rebuild `spotlightPart`'s map so each key owns its whole side:

```
   ab   segLine, segRes,   A and B's dot/letter/coordinate
   h    leg0 line, leg0 length,  A and C's dot/letter/coordinate
   v    leg1 line, leg1 length,  C and B's dot/letter/coordinate
```

Two rules follow from corners being shared:

- **A corner belongs to whichever side is lit.** C is on both `h` and
  `v`. When either is lit, C is lit. It is only hushed when neither is.
- **The face and the right-angle mark hush with the rest.** They belong
  to the shape, not to any one side, so they step back whenever
  anything is singled out and come back when nothing is.

Then fix the fault that stops a length obeying:

```css
#gridAxes .leglen.hush.hush,
#gridAxes .segres.hush.hush { opacity: .28; animation: none; }
```

The doubled class is the weight needed to beat `.leglen.pop`'s filled
`labelPop`, and `animation: none` releases the fill that was holding
the opacity at 1. Matches the existing precedent at
`#gridAxes .spotbeat.spotbeat`, and the note above it explains why the
doubling is there.

Give everything newly in the set the transition the lines already
have, so nothing snaps:

```css
#gridAxes .segdot, #gridAxes .legdot,
#gridAxes .segname, #gridAxes .legname,
#gridAxes .segcoord, #gridAxes .legcoord,
#gridAxes .trifill, #gridAxes .rightangle {
  transition: opacity 420ms ease, filter 420ms ease;
}
```

**Nothing may move.** The highlight is opacity and glow only. The
moment a spotlight nudges geometry, a label that was placed clear of
the numbering is no longer clear of it.

---

## 5. Slower, and paced to what is happening

```
   GRID.fly.pickMs      340  →   460     it lights where it is, longer
   GRID.fly.ms          760  →   980     and travels unhurriedly
   GRID.work.beatMs     820  →   980
   GRID.work.lineMs    1500  →  1700
   spot/hush transition 300ms →  420ms
```

And two ordering rules, which matter more than the numbers:

- **The side lights before the glyph leaves it.** `pickMs` is that
  pause. The child must see where it is coming from before it moves,
  or the flight is a thing arriving rather than a thing being taken.
- **The side stays lit until the glyph lands.** The hand-over is the
  point: it is lit on the board, it is lit in the working, and for a
  moment it is lit in both.

Ease everything that travels on `cubic-bezier(.22, .61, .36, 1)` — the
camera's own curve, already in the file — so a glyph crossing the board
moves like the board does.

---

## 6. What must not change

- The stacked `=` column. It was just built; the tighter line gap is
  what it was waiting for.
- `16 + 9` and `= 25` appear without flying.
- The answer still flies home and lands as the segment's length.
- Every screen that writes a solution keeps its quiet paper.
- No geometry moves during the beat.

---

## 7. How to know it is right

Measured, not looked at.

1. **The block reads as one piece.** Baseline-to-baseline is under
   1.75× the rendered type, and the plate's height is under 280px with
   five lines up.
2. **The column holds.** Every `=` reports the same x, to the pixel.
3. **The right things fly, and only those.** Across the whole beat:
   five flights — `(AB)²`, `(AC)²`, `(CB)²`, `(4)²`, `(3)²` — and
   `16`, `9`, `25` have none.
4. **One side at a time.** At every landing, sample the whole board:
   exactly one side's ink — line, length, both corners, both letters,
   both coordinates — is above 0.9 opacity, and everything else,
   including the face and the right-angle mark, is below 0.35.
5. **A length can be hushed.** With `spotlightPart('ab')` running, both
   leg lengths report opacity 0.28, not 1.00.
6. **Nothing moves.** Record every point's, label's and length's
   position every frame from the first line to the last: no element
   changes position by more than 1px for any reason other than the
   camera's own push.
7. **The walk is clean.** 52 screens, 0 exceptions, and the undrawn
   sweep reports no side left at 0%.

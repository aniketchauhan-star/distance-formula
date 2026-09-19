# Build prompt — a label belongs to its point, and never to the shape

Two rules for everything the board writes, everywhere in the game. One
of them can bend and the other cannot.

**Read `docs/one-way-of-labelling.md` first** — this tightens the rule
that doc started and that is half-built on this branch.

---

## 0. What the picture shows

Screen 25, pushed in on its triangle. Three points, three label blocks,
and every one of them further from its point than it should be:

- **A** and its coordinates sit down and to the left of the dot with a
  clear gap of paper between them.
- **C** floats up and right of its dot by more than the block is tall.
  Nothing in the picture says the two belong together except that they
  are nearer each other than to anything else.
- **B** is the closest of the three and still reads as beside the point
  rather than as the point's own.

The blocks are grouped now — letter over coordinate, one thing — which
is the half of the job that is done. What is left is **where that thing
sits**, and there are only two rules.

---

## 1. Two rules

1. **A label hugs its point.** The nearest ink of the block is a fixed
   small distance from the edge of the dot. The same distance for every
   point on every screen, in every direction.
2. **No label is ever inside a shape.** Not preferred-outside. Never
   inside.

Rule 2 cannot bend. Rule 1 can, and §4 says how far.

---

## 2. Why they are too far now, exactly

`placeBlock` puts the block's centre at

```
    cx = X + dx * (gap + w / 2)
    cy = Y + dy * (gap + h / 2)
```

For a cardinal direction that is right: the block's near edge lands
exactly `gap` from the point. **For a diagonal it is not.** Both offsets
apply at once, so the block's nearest corner ends up at `gap × √2` —
**41% further out** — and the diagonals are the four the rule tries
first, because they are the ones that keep clear of the drawing.

So every label placed the preferred way is placed the furthest way, and
the four that are closest are the four the rule reaches for last. That
is the whole of what the picture shows.

**Measure to the ink, along the direction the label went.** For each of
the eight, work out where the block has to sit so that the point on its
boundary nearest the dot is exactly `gap` away — the near edge for a
cardinal, the near corner for a diagonal. Then a diagonal label and a
cardinal one are the same distance from their points, which is what
makes a board of them look laid out rather than scattered.

`gap` itself is the dot's radius, its stroke, and the board's own
`coordGap` — it is already the right number and does not change.

---

## 3. Inside a shape

**What counts as inside:** the closed region the drawing encloses. Where
the board shades a face (`triFill`), that is exactly it; where three
sides close without a shade, it is the same triangle.

**Why it cannot bend.** The inside of a shape is the shape. A coordinate
written in it is written on the thing it is annotating, and on a screen
that asks *what kind of triangle is this* the fill is the answer being
looked at. It is also the one place a label can land where no amount of
opacity or halo will save it, because what is underneath is not paper —
it is the subject.

The interior joins the obstacle list from `one-way-of-labelling.md` §4,
and unlike everything else on that list it is never overridden: a
position that puts any part of the block inside is not a candidate at
all, however bad the alternatives.

---

## 4. When the two rules fight

They will, on a point in a corner of the paper with a shape on one side
of it and an axis on the other.

**Distance stretches; outside does not.** The search runs in this order
and stops at the first thing that works:

1. every direction at `gap`, outside the shape and clear of everything
2. every direction at `gap`, outside the shape, clear of everything but
   the ruling
3. the same, walking outward from `gap` a few steps at a time, still
   outside the shape
4. and only if the paper genuinely has nowhere: the least bad position
   that is still outside

There is no step that puts it inside. A label pressed against the frame
is untidy; a label in the fill is wrong.

---

## 5. Everywhere

This governs every label the board writes about a point or a side:

- the pair's two points, letter and coordinate
- a leg's corner mark — the `C` in the picture
- a located point's own coordinates
- the pairs recalled into example slots
- a length written on a side, which is the one thing that may sit
  *along* a side but never in the face

**And the hand-placed ones go.** Screen 54's station carries
`coordDx: 2.6` — two and a half cells from its own point, put there
because the rule could not then see the axis letters and would have
written `(0, 0)` into the `y`. It can see them now. Every override of
that kind should be deleted and the rule left to do it; if any of them
still reads better by hand afterwards, that is a §2 or §3 failure worth
finding rather than a case for keeping the override.

---

## 6. How to build it

1. **`Board.blockAt(w, h, X, Y, dir, gap)`** — one place that works out
   where a block of this size sits so its nearest ink is `gap` from the
   point in this direction. Cardinal and diagonal both. Everything else
   calls it instead of doing the arithmetic inline.
2. **`Board.shapeFace()`** — the closed region, as the polygon the pair
   and its legs make, or null when there is not one. Added to the
   obstacle list as the one entry that can never be overlapped.
3. **`placeBlock` gains the stretch of §4** — the four passes, in order,
   outside always.
4. **Delete the overrides** in §5 and let the rule place them.

---

## 7. What must not break

- **Every point's letter and coordinate stay one block.** This moves the
  block; it does not take it apart.
- **The same gap everywhere**, at every camera, on every board.
- A label still keeps the side it is on while that side works, so a
  push-in does not make it hop.
- The axis letters, the axis numbers, the dots, the lines and the other
  labels stay on the obstacle list.
- Nothing about what is written changes — only where it lands.
- And whatever is still red on this branch from the unfinished labelling
  work does not get redder: that list is the baseline.

---

## 8. Acceptance

- [ ] for every labelled point on every screen, the gap between the dot
      and the nearest ink of its label is the same number
- [ ] and that number is small enough that the two read as one thing
- [ ] no part of any label is inside a shaded face, anywhere
- [ ] no part of any label is inside a triangle that is drawn but not
      shaded
- [ ] a diagonal label is no further from its point than a cardinal one
- [ ] screen 54 places `(0, 0)` by the rule, with the override gone, and
      it is clear of both axes and both axis letters
- [ ] every override listed in §5 is gone

And by eye:

- [ ] screen 25 — the picture this came from: A, B and C each reading as
      their own point's label
- [ ] screen 61, where a filled triangle has a label at every corner
- [ ] screen 26 pushed in, where the camera makes the type largest
      against the board

---

## 9. Built — 19 Sep 2026

Every box in §8 ticks. Watched in headless Chrome as well as measured
in the Node harness, on branch `park-and-labelling`.

### What the arithmetic was doing

§2 was right about the shape of the fault and understated its reach.
`Board.blockAt` now works out where a block sits so that the point on
its boundary nearest the dot is `gap` away — the near edge for a
cardinal, the near corner for a diagonal — and every one of the eight
directions is measured the same way. Across the whole game **33 labels
were sitting at `gap × √2`** before this, and none is now.

### Outside is a wall, not a preference

`Board.shapeFace()` returns the three corners the pair and its legs
close — the same polygon `showTriangle` washes in, whether or not it is
shaded, and null when three points fall on one line. `startLabelPass`
works it out once for the pass, `clearLegs` forgets it, and
`placeBlock` skips any position that touches it **before scoring** — so
it is out of the running even in the least-overlap fallback, and in the
last-resort clamp as well. Ten point labels were inside a shape; none
is now.

Then the stretch of §4, as `OUT = [0, 0.8, 1.8, 3.2, 5.4] × gap`: every
direction at the gap first, then the eight again a step further out,
and only then the least bad of what was outside. Pass 2 of §4 — the one
that allows the ruling — is a no-op here and is not built: the grid is
a background image and has never been an obstacle, so "clear of
everything" and "clear of everything but the ruling" are the same test.
**82 of 94 point labels land at the gap exactly; the other 12 take one
step and no more** — none of them invents a distance of its own, which
is what makes a board of them read as laid out.

### Three things the spec did not see

1. **A leg's length was aimed deliberately inward** — `lenGap` negative
   above a horizontal leg, `inner` toward the pair beside a vertical
   one, both of them commented as going inside the right angle. Twelve
   lengths were in the face. Which side is now read off **the pair the
   legs hang off, not the closed face**, so the answer is the same
   before and after the third side lands and a length the child has
   just counted does not jump when the triangle closes round it.
2. **Where the frame leaves no room outside**, the clamp does not
   decline — it drags, and what it dragged the length into was the
   shape. So a trapped length now slides ALONG its own leg, the shorter
   way, until it is past the corner and out. `qa-vert` knew that a
   column's answer sits level with the middle of what it measured; it
   now knows the one case that overrules it, and says so on the line it
   prints.
3. **`legPlaced` outlived the screen that filled it.** A screen drawing
   one side after a screen that drew two inherited the second and
   closed a face that was not on the paper — so the length on screen 24
   was placed once against a phantom triangle and again when the real
   one arrived. `runLegs` now records every side it is about to draw
   before it places the first, and records only those: a screen's
   `legs` is always all of its sides, the carried-over ones marked
   `settled` rather than left out.

### And one that bit

Laying the board out again once every side is down (`relabel` at the
last leg, so the pair's own labels know about the face that did not
exist when they were placed) **wiped the letters off screens 32–34**. A
kept pair is named by `nameSegment`, which wrote `A` and `B` straight
onto the nodes; the spec those screens inherit does not name its
points, so the next lay-out read a nameless spec and blanked them.
`nameSegment` now *remembers* what it was told — `Board.namedAs`,
forgotten with `clearSegment` — and lays the block out again itself, so
the letter arrives in its place beside its coordinate rather than
wherever the screen before left one.

### The overrides are gone

Screen 54's station and vehicle carried `coordDx / coordDy / nameDx /
nameDy`; the station's pushed its `(0, 0)` **2.6 cells off its own
point** to clear the numbering and the two axis letters. Both are
deleted, the branch in `placeSegment` that read them is deleted with
them, and the rule puts `(0, 0)` **one step — 26px — above and right of
the origin**, clear of both axes, both runs of numbers and both axis
letters. Nothing in `SCRIPT` places a point by hand any more.

### Probes

**`qa-hug.js`** is new and is the acceptance list: one gap measured to
the ink on every labelled point of every screen, on each screen's own
board and at the size its camera is setting; every stretched label on a
whole §4 step; nothing at `gap × √2`; no point label and no length
inside a face; no hand-placed point left in the config; and screen 54's
origin. Against the code as it was it reports **8 problems**; against
this, none.

`qa-vert` learned the face rule. `qa-corner` — a coordinate with its own
line drawn through it on screens 32–34 — **went green on its own**, which
is what the pass was for. Browser capture: **`cdp-hug.js`**, which plays
forward into each screen rather than jumping, measures the painted page
against the face, and leaves `shots/hug-25/26/54/55.png`.

The filled-face capture is screen **55** rather than 61: the walk into
the park does not get past its first card question inside the time the
probe allows. It is the same triangle — 55 to 61 carry one drawing
through the whole beat — and the Node probe measures all seven of them
separately, so the eye check is of the picture the acceptance names,
one screen earlier in the chain that draws it.

Suite: **88 green, 10 red** — the four standing reds (`qa-sel`,
`qa-tap2`, `qa-tap3`, `qa-taps`) and six left by the unfinished
labelling work (`qa-carry`, `qa-examples`, `qa-labelpair`, `qa-nolap`,
`qa-recall`, `qa-unitfit`). The baseline was 86/11; nothing new is red.

### Noticed, not fixed

Jumping straight onto screen 26 with the picker leaves the board on the
screen before's camera with none of this screen's drawing — the board
zooms to a single crossing and one stray label. It is the same
picker-jump fault already recorded against screen 20, it is unchanged
by this work (the capture is byte-identical on the code as it was), and
it is why `cdp-hug.js` plays forward.

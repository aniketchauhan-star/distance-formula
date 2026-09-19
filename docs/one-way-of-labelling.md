# Build prompt — one way of labelling, everywhere

Not a beat. The board writes letters, coordinates, lengths, axis numbers
and workings, and each of them is placed by its own rule invented on the
screen that first needed it. This replaces all of that with one rule,
and makes "it looks neat" something a probe can decide.

**Read section 0 of `docs/horizontal-distance-animation.md` first.**

---

## 0. What is wrong, read off the picture

The crop is screen 26, pushed in on its triangle. Six things, and none
of them is a one-off:

1. **`(6, 1)` is written into the `x`.** The coordinate's closing
   bracket and the axis's own letter are the same ink. The board keeps
   labels off the frame, off the x-number row and off the y-number
   column — and has never heard of the two letters that name the axes.
2. **Every point is labelled by two things on opposite sides of it.**
   `A` sits below-left of its dot and `(2, 1)` above-left. `B` below and
   `(6, 4)` above-right. They are one fact about one point and they read
   as two.
3. **`C` floats.** It is a long way off its own corner, inside the
   triangle's fill, closer to the middle of the shape than to the point
   it names.
4. **Both lengths are inside the shape.** `4 units` lies along the
   orange side it measures and `3 units` hangs in the fill. Inside is
   where the drawing is; an annotation of an edge belongs outside it.
5. **Nothing checks anything against anything else.** Each label is
   placed by a local rule — away from the other point, above the leg,
   beside the axis — and then hopes. No label knows where any other
   label went.
6. **So it is different on every screen**, and each new screen has
   needed another special case: `coordSide`, `coordDx`, `coordDy`,
   `nameDx`, `nameDy`, `lengthText`, `quiet`, `stacked`, `vNameDy`.
   Nine ways of saying "not there, there".

---

## 1. The idea: one label per point

**A point's letter and its coordinate become one thing.** One group, one
box, one position:

```
        A
    (2, 1)
```

The letter above, the coordinate under it, centred on each other. It is
placed once, clamped once, and kept clear of things once. Where the
screen wants only the coordinate, the block is just the coordinate;
where it wants only the letter, just the letter. Nothing else changes
about what is written.

Three reasons this is the whole fix and not a tidy-up:

- **It is what a child reads.** "A is at (2, 1)" is one fact. Two labels
  forty pixels apart on opposite sides of a dot is that fact taken to
  pieces and left for them to reassemble.
- **It halves the things on the board.** Two labels per point become
  one, which is the difference between a placement problem that can be
  solved and one that cannot.
- **It is what the mocks have always drawn.** Every reference picture in
  this project shows a point labelled by one stacked callout. The game
  is the only place the two have ever been separated.

---

## 2. Where a label goes

**Eight places, tried in order, first clear one wins.**

Round the point: `NE, NW, SE, SW, N, S, E, W`. For each, the label's box
is put there with the standard gap off the dot, and rejected if it
touches anything in §4. The first that survives is used. If none does,
the least bad one is used — the one overlapping the fewest things, and
then the least ink.

**The order is not fixed; it is sorted by one rule: away from the
drawing.** The direction pointing from the drawing's centre through the
point comes first, and the rest follow by angle from it. So a label
never sits inside a shape when there is room outside it, and the corner
of a triangle is labelled out into the margin rather than into its own
fill — which is `C`'s whole problem.

**It is worked out in board units and re-run when the camera moves**,
exactly as `relabel` already does. Two rules keep that stable:

- The camera is compared **by name**, never by measurement — the
  existing guard against a label that changes the frame that places it.
- A label that is already clear stays where it is. Re-solving every
  position on every frame of a push-in makes labels hop; only a label
  that has stopped being clear moves.

---

## 3. Lengths

A length is an annotation of an edge, so it goes **beside the edge, on
the outside of the shape**, at the midpoint, offset perpendicular to the
side — and then through exactly the same eight-position search if that
spot is not clear.

Outside, not inside, for the same reason a point's label goes outward:
the inside of a shape is the shape. The two lengths in the crop are both
in the fill and one of them is lying along the line it measures.

Two cases the rule has to get right on its own, because they are the
ones that keep going wrong:

- **A side whose midpoint is level with an axis** writes across the axis
  numbering. It slides along its own side until it is clear.
- **A side on the outermost column** has no outside to be written in.
  It goes inside, and that is the one time inside is correct.

---

## 4. What a label must never touch

This is the part that does not exist today. One list, checked by
everything:

| | today |
|---|---|
| the frame and the paper's edge | clamped |
| the x-axis number row | checked, by two callers |
| the y-axis number column | checked, by one caller |
| **the axis letters `x` and `y`** | **not known about** |
| **any point's dot** | not checked |
| **any line of the drawing** | not checked |
| **any other label already placed** | not checked |
| **the count-out's squares and their numbers** | not checked |

Every one of those is ink on the board, and ink that overlaps other ink
is the whole of what the picture shows. A label is clear when its box
touches none of them, with the board's own standard air around it.

**Measured as ink, not as a line box.** `Board.textMetrics` already
gives the real inked extent of a string including its halo, and the
project has learned twice that `getBBox` on an SVG text returns the
font's line box instead. Everything here uses the metrics.

---

## 5. The type, so they look like one family

- **The letter** is the larger of the two and carries **its own point's
  colour** — the same colour as its dot, which is the second channel
  that says which label belongs to which point.
- **The coordinate** sits under it, smaller, in the board's ink. One
  accent per point, not two.
- **A length** is in its own side's colour, which it already is.
- The two are locked to one ratio rather than two independent sizes, so
  a block always looks like a block.
- Every one of them keeps the halo it has, at one weight.
- And all of it scales through `typeScale()`, so the rendered size is
  the same whatever the camera is doing — the rule the board already
  follows and must keep following.

---

## 6. What this replaces

The following exist only because there was no general rule, and should
be gone or reduced to one:

`coordSide`, `coordDx`, `coordDy`, `nameDx`, `nameDy`, `stacked`,
`vNameDy`, `clearOfYAxis`, the corner's own placement in `placeLeg`, and
the hand-tuned offsets in `showSegResult` and `placeLegLength`.

**One escape hatch survives**: a screen may still say *"put this one
here"*, because there will always be one picture the rule reads
differently from a person. It is an override, not the way things are
normally done, and every use of it is a small failure of §2 worth
looking at.

---

## 7. How to build it

1. **`Board.labelBox(spec)`** — builds a point's block (letter, or
   coordinate, or both stacked) and returns its ink size. One place
   decides what a point's label says and how big it is.
2. **`Board.placeBlock(box, at, avoid, prefer)`** — the eight-position
   search of §2. It knows nothing about points or lengths; it is given a
   size, an anchor, a list of rectangles and lines to miss, and a
   preferred direction.
3. **`Board.obstacles()`** — the list in §4, built fresh each time the
   board is laid out: the frame, both number runs, both axis letters,
   every dot, every drawn line, and every label already placed this
   pass. Labels are placed in a fixed order so the list grows
   deterministically and the same screen always comes out the same.
4. **`placeSegment`, `placeLeg`, `showSegResult` and `placeLegLength`
   all call those three** instead of computing offsets. That is where
   the special cases go.
5. **`relabel` re-runs the pass** on a camera move, with the
   already-clear rule from §2.
6. Nothing about what is written changes — only where it lands.

---

## 8. What must not break

- **Every screen still says exactly what it says now.** This moves ink;
  it does not add, remove or reword any of it.
- **The camera.** Rendered type size is constant through `typeScale()`,
  and a push-in does not make labels hop.
- **No feedback loop.** A label must never be able to change the frame
  that decides where it goes; the view is compared by name.
- **Deterministic.** The same screen at the same camera gives the same
  layout every time — no dependence on which label happened to be
  measured first.
- **The count-out.** The squares and their running totals are labels
  too, and the answer written at the end of one lands in the same
  system.
- The town's pills, the example slots and the working on the paper all
  keep working; the working has its own layout and is not part of this,
  but it is in the obstacle list.
- Back and Next replay every screen with the same layout as the first
  time through.

---

## 9. Acceptance — one probe, every screen

"It looks neat" is not testable. **"No ink touches other ink" is**, and
it is the same thing here.

`qa-neat` walks all 61 screens, waits for each to settle, and for every
pair of things the board has written asks whether their inked boxes
overlap. It fails on the first pair that do, naming both and the screen.

- [ ] no label overlaps another label
- [ ] no label overlaps an axis number
- [ ] no label overlaps the `x` or the `y`
- [ ] no label overlaps a dot or a line of the drawing
- [ ] no label leaves the paper
- [ ] every point's letter and coordinate are one block, and the block
      is nearer its own point than any other
- [ ] every length is nearer the side it measures than any other side
- [ ] and the same screen, revisited, lays out identically

Then, by eye, in a browser:

- [ ] screen 26 reads cleanly — `C` beside its corner, `(6, 1)` clear of
      the `x`, both lengths outside the fill
- [ ] the pushed-in triangle screens, where the camera makes type
      largest relative to the board
- [ ] screen 55, the busiest: three corners, three coordinates, three
      lengths and a filled shape
- [ ] screen 54 on the wide board, where the cells are smallest
- [ ] and the town, where five pills sit over the same paper

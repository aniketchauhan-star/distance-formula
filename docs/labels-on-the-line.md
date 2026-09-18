# The numbers are part of the line — built 18 Sep 2026

What was asked for, on the recall screens (20 and 21):

> the pointers numbers should touch and up side of the corners and the
> unit should between the the two points same the the horizontal things
> also … its should look like this are talking about this line and this
> numbers part of this lines

Three pieces of text hang off a plotted pair: a coordinate at each end
and a length in the middle. They should read as parts of one drawing —
ends, middle, ends — and neither of them did.

---

## 1. Why the coordinates floated

`Board.textW` was an estimate: one character at 0.58 of the type size.
That is about right for `-6` and half again too wide for `(-2, 3)`,
where the brackets, the comma and the space are all narrow. A label
pushed off its point by half of an over-wide measure floats a third of a
cell from the thing it names, and every coordinate written beside its
point was doing that.

**`Board.textMetrics(text, size)`** now measures the real thing on a
canvas in the same face, and returns `w`, `h`, `up` and `down` — the ink
either side of the label's own anchor, not the font's line box, which is
`46.8px` tall for every string at 34px and so tells you nothing. Two
corrections are folded in:

- the labels are set `dominant-baseline: middle`, whose anchor sits half
  an x-height above the alphabetic baseline the canvas measures from —
  without squaring that up, a word with no descenders (`5 units`) claims
  to be centred on something it sits above;
- the paper halo (`stroke-width: 6`) is painted outside the glyphs, so it
  is part of what is seen and part of what is measured.

`textW` and a new `textH` read off it. The old estimate stays as the
fallback for anywhere with no canvas — which is the Node test harness,
so the probes still measure something sane. The cache is dropped once
`document.fonts.ready` resolves, or every label would keep the metrics of
whatever the fallback face happened to be.

## 2. Where a coordinate goes now

Measured from the **painted** edge of the dot — its radius plus half its
white ring — to the **ink** of the label, `GRID.segment.coordGap` (3px)
of air, on whichever edge faces the point. A label above its point is
placed by its `down`, one below by its `up`, so the gap the child sees is
the same either way. Both axes, so a row reads like a column.

`coordFit` (8px, the old figure) is kept for the one question it still
answers: whether a row's labels have room beside their points at all.
Deciding that on the new air would move pairs that read properly today.

## 3. Where a length goes now

Its place is not a decision a screen should have to make, and four
screens were making it by hand — screen 21's `5 units` was `dy: -117`
off its own middle, which put it level with the top point, a remark
about one end rather than the distance between two. All four hand
offsets are gone. `showSegResult` places it:

1. the middle of the span it measures;
2. out to the side of the line by `resGap` (5px) of ink — a column to
   the side away from the y-axis, a row above it;
3. then along its own line, only as far as it takes to clear the other
   axis' numbering, and **never past the points**: a length that has
   left the span it measures has stopped measuring it. `resInset` is
   what it must leave at each end.

A caller may still hand it offsets and they are obeyed — the general
axis cases (screens 39–41) and the AB result on the triangle still do.

Ink is the right measure of air between a label and a thing beside it.
It is the wrong measure of whether it has landed on the axis numbering —
a word with no descenders would claim to clear a band it is sitting in —
so that question is asked of the whole band a label of its size occupies.

## 4. What the tighter air uncovered

- **A point's two labels could touch.** Drawing the coordinates in
  against the dot brought them up under the letter on a segment that
  runs at a slope. The letter gives way along the offset it already has;
  where it is pinned against the top of the paper — B on screens 29 and
  30 — the coordinate gives way instead.
- **`nw` was measured from the letter the node still held**, not the one
  the point was about to be given: the same trap the coordinates already
  had a comment about.
- **A corner's coordinates knew only the leg that arrives at it.** The
  leg that leaves it is placed afterwards, and on the triangle it rises
  straight out of the corner through the very space the label takes when
  the frame has left it nowhere to go but over the point — so `(6, 1)`
  had the green leg through its comma. `Board.clearMarksOfLines()` runs
  once every leg is down: the rows just over a corner are the busiest on
  the board (the rising leg, and the arriving leg's length written along
  them), and under it is empty, so the coordinates go under and the
  letter — one glyph, needing almost nothing — takes the space over the
  point, stepped off the leg standing in it.

## 5. One to remember

`clearOfLines` was already taken, by the unit count's own further down
the same object literal. A second key of that name **silently wins** —
no error, no warning, and every corner label written as `"1121,382"`.
The new one is `offEveryLine`.

---

## 6. Where it landed

| | before | after |
|---|---|---|
| `5 units` (screen 21) | grid (2.40, 1.03) — level with the top point | grid (1.82, −0.93), between the two, clear of the axis numbers |
| `7 units` (screen 20) | `dy: -48, dx: 66` by hand | its own middle, stepped right off the y-axis |
| `(1, 2)` off its dot | 38px | 35px, ink 3px clear of the painted dot |
| `(-3, 3)` off its dot | a third of a cell | 3px |

Probes: `qa-examples`, `qa-nolap`, `qa-corner` all green; the suite is
back to its five standing reds (`qa-optspend`, `qa-sel`, `qa-tap2`,
`qa-tap3`, `qa-taps`). Watched in Chrome on screens 5, 8, 13, 14, 19,
20, 21, 22, 24, 25, 26, 31, 32, 33, 34, 39 and 41 — no label overlaps
another and none leaves the paper on any of them.

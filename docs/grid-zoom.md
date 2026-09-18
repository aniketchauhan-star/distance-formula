# Build prompt — the board pushes in when she asks "Can the grid help?"

Fifth in the set. **Read section 0 of
`docs/horizontal-distance-animation.md` first** — every pitfall recorded
there applies here too.

---

## 1. Scope

Add one thing: a **camera push-in on the board**, on the beat whose
spoken line is *"Can the grid help?"* (`js/config.js`, id 23).

Do not redesign the screen, the character, navigation, audio or game
logic. Do not change what is drawn on the board — the triangle A, B, C
is already there, drawn on the beat before. This is about how much of
the board the child is looking through, and nothing else.

---

## 2. What the child sees

She says *"Can the grid help?"* and the board **pushes in on the first
quadrant** — the corner the triangle lives in — over about a second, so
the triangle, its coordinates and the squares it crosses are half again
as large. The frame stays exactly where it is: it is the window, not the
picture. What falls outside the view is simply not in shot.

```
   before                             after
   ┌───────────────────┐              ┌───────────────────┐
   │      y            │              │  y                │
   │      │     B      │              │  │           ●B   │
   │      │    ╱┆      │      →       │  │        ╱   ┆   │
   │  ────┼───A┄┄C──   │              │  │    ●A┄┄┄┄┄┄●C  │
   │      │            │              │  └──────────────  │
   │      │            │              │                   │
   └───────────────────┘              └───────────────────┘
```

It holds while the triangle is the subject, and the board pulls back out
when the lesson leaves it.

---

## 3. The view

**Where it pushes in to.** The first quadrant with a cell of air round
it — about `x` from −0.6 to 7 and `y` from −0.6 to 5.4 — so the origin,
both axes and every point of the triangle stay in shot. Work it out from
the pair and the leg on the board, with a margin, rather than typing the
numbers: the same beat must still frame itself if the triangle ever
moves.

**Aspect.** The board is drawn with `preserveAspectRatio="none"`, so a
view whose shape does not match the panel's will stretch the squares
into rectangles. Grow the requested region on whichever axis is short
until its aspect matches the panel's box, and centre it on what was
asked for. **A square on the grid must still be square at every moment
of the movement.**

**Timing.** About 900ms, one easing — `cubic-bezier(.22, .61, .36, 1)` —
starting as she speaks, not before. Every duration in config.

---

## 4. How to build it

The board already has exactly the machinery for this, and it is not a
CSS transform.

`Board.place(box)` derives the whole board from one box: the panel's
position and size, the frame widths, where the ruling sits and how big
its cells are, the clip that keeps the ruling off the frame, and the
SVG's `viewBox`. The SVG stretches that viewBox onto the panel, and
**everything drawn on the board — points, lines, labels, lengths — is in
viewBox units**. So a push-in is not a new way of drawing anything. It
is the same `place`, given a smaller region of board to show.

1. **Separate the two things `place` currently conflates**: the *panel*
   (where the window is on the screen, and how thick its frame is) and
   the *view* (which part of the board is inside it). The frame, the
   corner radius and the highlight keep scaling with the panel, exactly
   as now — they must not thicken when the board pushes in.
2. **Give the board a current view**, defaulting to the whole board
   (`paper.gxFrom … gxTo`, `gyFrom … gyTo`), and have `place` honour it:
   the SVG's `viewBox` becomes the view, and the ruling's origin, cell
   size and clip are computed from the same numbers. Then a screen that
   re-places the panel — 23 is `layout: 'grid'` and 24 is
   `layout: 'board'`, so the panel does move — keeps the view it had.
3. **`Board.viewTo(region, ms, later)`** tweens from the current view to
   the new one, one `requestAnimationFrame` step at a time, re-placing
   the board each frame — the same shape as `Board.tweenText`, easing
   solved in code, cancelled by a token so a skip or a screen change
   cannot leave the board mid-push. `Board.viewAll(ms)` goes back.
4. **A screen declares its view**, e.g. `view: 'triangle'` (or the
   region itself), and `goTo` moves the board to it — screens that
   declare none are the whole board. Which screens hold it is the one
   real decision: recommended is **23 through 26**, the beats where the
   triangle is what is being worked on, pulling back out on 27.
5. **Queue it through the game's `later()`**, never a bare `setTimeout`.

**Why not a CSS transform on the panel's contents.** It would need a new
clipping wrapper in the markup, it would rasterise the ruling and the
SVG at the old scale and blow them up soft, and it would fight
`Board.place` every time the panel moves. The viewBox is already the
board's own camera; use it.

---

## 5. What must not break

- **A square stays square** — see the aspect rule above.
- **The frame does not change.** No thicker border, no bigger corner
  radius, no shifted panel. Only what is inside the window changes.
- **Nothing that is drawn moves on the board.** Every point keeps its
  coordinates; it is the view that moves, and the child must be able to
  believe they are looking at the same board.
- **The ruling stays pinned to the coordinates**: a line on every whole
  number, at the zoomed cell size, and still clipped off the frame.
- **The axis numbers outside the view are out of shot, not deleted** —
  they come back when the board pulls out.
- **Taps still land where they look.** Board taps go through the SVG, so
  they follow the viewBox; check it rather than assume it, on a screen
  that takes taps.
- **Back then Next replays it cleanly**, once, and arriving on 23 from
  either direction leaves the board pushed in.
- **The leaves sweep on 22 and the layout change on 24** both re-place
  the panel. Neither may snap the view back.

---

## 6. Acceptance — in a browser, watching it

- [ ] she says *"Can the grid help?"* and the board pushes in as she
      says it, not before and not after
- [ ] it lands on the first quadrant: the origin, both axes and A, B and
      C all in shot, with air round them
- [ ] the squares are still square, at every moment of the movement
- [ ] the frame, its corners and its thickness are unchanged throughout
- [ ] the ruling still has a line on every whole coordinate
- [ ] nothing drawn on the board moved relative to the grid
- [ ] the movement is one smooth push, about a second, no snap at either
      end
- [ ] the board is still pushed in for the question that follows
- [ ] it pulls back out when the lesson leaves the triangle
- [ ] Back and Next both leave the board in the right state
- [ ] a tap on the board still lands where it looks
- [ ] every other screen is unchanged

---

## 7. Built — 18 Sep 2026

Every box in §6 ticks, watched in headless Chrome as well as checked in
the Node harness.

How it was built, as §4 laid out:

- **`Board.place` now works from two scales, not one.** `fs` is the
  panel's — how big the window is on the stage — and drives the frame,
  its corner radius and the highlight, so none of them change when the
  board pushes in. `sx`/`sy` are the view's, and drive the ruling's cell
  size, its origin, and the SVG's `viewBox`. With no view set the two are
  the same number, which is every screen outside the triangle.
- **`Board.viewRect()` / `viewFor(name)` / `viewTo(rect, ms)`.**
  `viewFor` frames what is actually drawn — the pair on the board, any
  leg dropped from it (`placeLeg` now records its spec), and the origin
  so both axes stay in shot — with `GRID.zoom.margin` cells of air.
  `viewTo` tweens the four numbers by `requestAnimationFrame`, re-placing
  the board each frame and pinning the end state, token-cancelled the way
  the text tweens are.
- **The view is board state, not screen state**, so the layout change
  from 23 (`grid`) to 24 (`board`) re-places the panel and keeps the
  push-in — measured at the same `viewBox` on both.
- **A screen names its view** (`view: 'triangle'` on 23, 24, 25 and 26);
  `goTo` moves the camera after `GRID.zoom.delayMs`, so the push comes
  with her line rather than under the screen change, and a beat that
  wants the view it already has does nothing at all.

**The view it lands on**: x −0.60 … 6.60, y −1.09 … 5.09, a 1.94× push.
Its shape is the board's own, so a cell keeps exactly the shape it had —
checked on all 2718 frames of a full walk. (Note for anyone reading that
check: cells are *not* square in every panel. The board is stretched to
its box rather than fitted, so in the wide centre box used on screens 5
and 29 they have always been 93×88. The guarantee is that pushing in does
not change a cell's shape, not that the shape is square.)

One thing the spec did not anticipate: **`#gridAxes` is
`overflow: visible`.** Harmless while the viewBox was the whole board,
because nothing was ever drawn outside it — but pushed in, the rest of
the board is still drawn, just past the edge of the panel, and it painted
over the frame and out across the field behind Swifty. `place` now clips
the SVG to the cream whenever a view is set, exactly where the ruling is
already clipped, and leaves it alone when there is none.

Probe: `qa-zoom.js`. Browser capture: `cdp-zoom.js` — it reads the live
`viewBox`, the panel's box and its `--radius` / `--frameW` through the
push, confirming the frame never moves (45.49px / 14.79px throughout)
while the cells grow 101.5 → 171.1px with width equal to height at every
sample.

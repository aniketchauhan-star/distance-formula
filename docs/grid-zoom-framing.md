# Build prompt — frame the push-in on the corner, and quieten it

Follows `docs/grid-zoom.md`, which built the push-in. That works; this is
about **where it lands** and **how it reads**. Read section 0 of
`docs/horizontal-distance-animation.md` first — every pitfall there
applies.

---

## 1. Scope

Change **only** the board's pushed-in view — the beats that carry
`view: 'triangle'` (`js/config.js`, ids 23, 24, 25, 26).

Do not change what is drawn, the push-in itself, its timing, the frame,
the character, navigation, audio or game logic. Do not touch any screen
that is not pushed in.

---

## 2. What is wrong with it now

The view is centred on the triangle, and the board's shape then decides
the rest. Three things come out of that:

- **The axes float.** The y-axis sits six tenths of a cell in from the
  left, and the x-axis a whole cell up from the bottom, with a strip of
  the fourth quadrant under it that has nothing on it.
- **Numbers are cut in half.** The `5` at the top and the `−1` at the
  bottom are bisected by the edge, which reads as a mistake rather than
  as a crop.
- **The grid is as loud as the triangle.** Pushed in, the ruling and the
  axes are the same weight as the lines the beat is about.

---

## 3. What it should be instead

**The origin goes in the corner.** Anchor the view's bottom-left just
below and just left of `(0, 0)` — far enough out that the axis numbers
sit fully inside the frame, and no further. The x-axis then runs along
the bottom of the window with its numbers under it, the y-axis up the
left with its numbers beside it, and the first quadrant fills everything
above and right of them. That is the picture: a corner of the board, not
a floating middle of it.

```
   now                                should be
   ┌────────────────────┐             ┌────────────────────┐
   │ 5(cut)             │             │ 5                  │
   │      │        ●B   │             │ 4          ●B      │
   │      │     ╱       │      →      │ 3       ╱          │
   │      │  ●A┄┄┄●C    │             │ 2    ╱             │
   │   ───┼──────────   │             │ 1 ●A┄┄┄┄┄┄●C       │
   │      │             │             │ 0──1──2──3──4──5──6│
   │ −1(cut)            │             └────────────────────┘
   └────────────────────┘
```

**Extent.** Out from that corner, far enough to clear the triangle with
air, and then as far as the panel's shape requires — the aspect rule
from `grid-zoom.md` §3 still governs, so a square stays square. Growing
away from the anchored corner rather than about the centre is the whole
change.

**No number is cut.** After the fit, an edge must not fall inside a
label's own band: push that edge out until the label is wholly in shot
or wholly out of it. Wholly out is fine; half of one is not.

**The grid falls back.** These beats quieten the board, exactly as
screens 9–12, 15–18, 20 and 21 already do — the ruling, the axes, their
arrowheads and their numbers step back, while the triangle, its points,
its coordinates and its letters stay at full strength. The flag exists
(`quietBoard: true`); this is deciding that the pushed-in beats want it
too, so the triangle reads on top of the grid rather than among it.

---

## 4. How to build it

All of it lives in `Board.viewFor`, which already frames the region, and
in the four screens' config.

1. **Anchor, do not centre.** `viewFor` currently takes the bounds of
   what is drawn, adds a margin, then grows the short axis about the
   centre. For this view, fix the left edge at `0` minus the room the
   y-axis numbers need, and the bottom edge at `0` minus the room the
   x-axis numbers need, and grow only right and up.
2. **Measure that room, do not type it.** The numbers are `GRID.labelSize`
   tall and sit `GRID.labelGap` off their axis; `Board.textW` gives their
   width. Work the two margins out from those, plus a little air, so the
   framing survives a change of cell size or type size.
3. **Then the aspect fit**, growing right and up only, and never past the
   paper's own edge — `viewFor` already clamps for that.
4. **Then the no-half-numbers pass**: for each edge, if it falls within
   half a label's height (or width) of a whole coordinate that carries a
   number, push that edge out past it.
5. **`quietBoard: true`** on 23, 24, 25 and 26.
6. Nothing else changes: the tween, the timing, the frame, the clip, and
   the pull-out on 27 all stay as they are.

---

## 5. What must not break

- Everything in `grid-zoom.md` §5 still holds — a square stays square,
  the frame never changes, nothing drawn moves on the board, the ruling
  stays pinned to whole coordinates, taps still land where they look,
  and Back/Next leave the board in the right state.
- **A, B and C, their coordinates and their letters all stay in shot**,
  with air round them. Anchoring at the corner must not push the
  triangle out of the frame or crowd it against the top-right.
- **The quietening is only on the pushed-in beats.** 27 onwards pull out
  and come back to full strength, as they do now.
- The push-in is still one movement, about a second, with no snap.

---

## 6. Acceptance — in a browser, watching it

- [ ] pushed in, the x-axis runs along the bottom of the window and the
      y-axis up the left, with the origin in the corner
- [ ] every axis number in shot is whole — none cut by an edge
- [ ] there is no empty strip of the fourth quadrant under the x-axis
- [ ] A, B, C, their coordinates and their letters are all in shot with
      air round them
- [ ] the ruling, the axes and their numbers are quieter than the
      triangle drawn on them
- [ ] the triangle, its points, its coordinates and its letters are at
      full strength
- [ ] the squares are still square, at every moment of the movement
- [ ] the frame, its corners and its thickness are unchanged throughout
- [ ] the push is still one smooth second, no snap at either end
- [ ] it still holds for 24, 25 and 26, and pulls out on 27 at full
      strength
- [ ] every screen that is not pushed in is unchanged

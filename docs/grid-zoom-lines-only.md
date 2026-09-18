# Build prompt — pushed in, the axes are lines only

Third on the push-in, after `grid-zoom.md` (which built it) and
`grid-zoom-framing.md` (which anchored it on the corner and quietened
it). **Read section 0 of `docs/horizontal-distance-animation.md`
first** — every pitfall there applies.

---

## 1. Scope

Change **only** what is shown inside the board's pushed-in view — the
beats that carry `view: 'triangle'` (`js/config.js`, ids 23, 24, 25, 26).

Do not change what is drawn on the board, the push-in itself, its
timing, the frame, the character, navigation, audio or game logic. Do
not touch any screen that is not pushed in.

---

## 2. What the child should see

Pushed in, the board is about **one triangle**, not about the scale it
sits on. So:

- **The axes are lines only.** The x-axis and the y-axis stay — they are
  what says which way is which — but **their numbers go**. At this zoom
  the child is reading A, B and C, not counting along an axis, and the
  numbers are the loudest thing left on a board that has already been
  quietened.
- **The triangle is shown whole, with air round it.** Both points and
  the corner, the line joining them, all three coordinate labels and all
  three letters — nothing crowded against an edge, nothing cut.

```
   ┌────────────────────────────┐
   │                            │
   │                    (6, 4)  │
   │   │             ●B         │
   │   │          ╱             │
   │   │       ╱                │
   │   │    ╱                   │
   │   │ (2,1)        (6, 1)    │
   │   │ ●A┄┄┄┄┄┄┄┄┄┄┄┄●C       │
   │   │  A            C        │
   │ ──┼─────────────────────   │
   └────────────────────────────┘
      axes as lines, no numbers
```

---

## 3. What that changes about the framing

The corner anchor in `grid-zoom-framing.md` exists to keep the axis
numbers wholly in shot. **With the numbers gone, that reason goes with
them.** So:

- Frame on **the triangle and the origin**, with even air round the
  whole of it — the triangle sits in the middle of the window rather
  than pushed up and right off an anchored corner.
- The axes then fall near the left and the bottom as lines, which is
  what they should look like.
- The margin is the air round the drawing, and it must clear the
  **labels**, not just the points: `(6, 4)` sits above and right of B,
  and `C` sits below its own point, so the air is measured from the
  things that are written, not only from the coordinates.
- Everything else about the fit stands: the aspect rule from
  `grid-zoom.md` §3 (a square stays square), never past the paper's own
  edge, and no half-cut anything.

---

## 4. How to build it

1. **Hide the numbers with the view, not with a screen flag.** The board
   knows when it is pushed in (`Board.view`), so that is the one place
   that should decide: when a view is set, the axis numbers fade out;
   when it is cleared, they come back. A screen that names a view gets
   this for nothing, and no screen can have one without the other.
2. **Fade, do not delete.** Opacity only, on the same easing and roughly
   the same length as the push itself, so the numbers leave as the board
   comes in rather than vanishing a beat before it. They are still
   there, still lettered, still measured by anything that measures them
   — just not in shot.
3. **Watch the specificity.** `#gridAxes .glabel.pop` already declares
   `opacity: 1`, and the quiet board already overrides it with
   `#gridPanel.quiet #gridAxes .glabel.pop`. A third rule has to beat
   both: more specific, and below them in the file. `animation` is a
   single property — if any of those rules ever animates, this one must
   animate too, or it loses. (The ruling records the same trap.)
4. **Then re-centre `Board.viewFor`**: take the bounds of what is drawn
   *and written* plus the origin, add the margin, and grow the short
   axis about the centre — the version before the corner anchor, with
   the label extents folded in.
5. Nothing else changes: the tween, the timing, the frame, the clip, the
   quiet board and the pull-out on 27 all stay as they are.

---

## 5. What must not break

- Everything in `grid-zoom.md` §5 still holds — a square stays square,
  the frame never changes, nothing drawn moves on the board, the ruling
  stays pinned to whole coordinates, taps still land where they look,
  Back and Next leave the board in the right state.
- **The axis lines and their arrowheads stay.** Only the numbers go.
- **The numbers come back** when the board pulls out on 27, at the
  strength they have everywhere else.
- **Nothing that belongs to the triangle is cut or crowded**: three
  points, three coordinate labels, three letters, the line and the
  dotted run, all wholly in shot with air round them.
- The board stays quiet behind it — the ruling and the axes still fall
  back, so the triangle reads on top of them.
- The push is still one movement, about a second, with no snap.

---

## 6. Acceptance — in a browser, watching it

- [ ] as the board pushes in, the axis numbers fade out with it — not
      before, not after, not abruptly
- [ ] pushed in, both axes are visible as lines, with their arrowheads,
      and no numbers anywhere on the board
- [ ] the triangle sits in the middle of the window with air all round
- [ ] A, B and C, their three coordinate labels and their three letters
      are all wholly in shot, none crowded against an edge
- [ ] the squares are still square, at every moment of the movement
- [ ] the frame, its corners and its thickness are unchanged throughout
- [ ] the ruling and the axes are still quieter than the triangle
- [ ] it still holds for 24, 25 and 26
- [ ] on 27 the board pulls out **and the numbers come back**
- [ ] every screen that is not pushed in is unchanged — numbers and all

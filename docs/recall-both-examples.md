# Build prompt — each recall screen shows every example of its kind

Fourth in the set, after `horizontal-distance-animation.md`,
`vertical-distance-animation.md` and the removed axis-link attempt.
**Read section 0 of the horizontal prompt first** — every pitfall
recorded there applies here too.

---

## 1. Scope

Change **only** the two recall beats before the diagonal — the screens
whose spoken lines are *"We know how to find horizontal distance."* and
*"And vertical distance."* (`js/config.js`, ids 20 and 21).

Do not redesign the screens, the graph, the character, navigation, audio
or game logic. Do not touch the learning beats (8–12, 15–18), the
questions (13, 14, 19) or the diagonal that follows.

Each recall beat currently shows **one** worked pair. It should show
**every pair of its kind the child has already met**, drawn exactly as
they were drawn then. No new pairs, no invented numbers.

---

## 2. The search — what is already in the game

Every horizontal and vertical pair in `SCRIPT` before these screens.
Nothing else qualifies: screens 1–7 plot single points and nothing else,
and every horizontal or vertical **leg** belongs to the triangle, which
starts on screen 24 — after these beats, so none of them count.

### Horizontal, before screen 20

| # | pair | where the child met it | what they made of it |
|---|---|---|---|
| 1 | **(3, 2) – (6, 2)** | screen 8's question, then the whole argument on 9–12 | **3 units** |
| 2 | **(4, 3) – (−3, 3)** | screen 13's question | **7 units** |

### Vertical, before screen 21

| # | pair | where the child met it | what they made of it |
|---|---|---|---|
| 1 | **(1, 2) – (1, −3)** | screen 14's question, then the argument on 15–18 | **5 units** |
| 2 | **(−2, 3) – (−2, 1)** | screen 19's question | **2 units** |

Screen 20 already draws horizontal #1 and screen 21 already draws
vertical #1 — as `(1, −3)–(1, 2)`, the same pair the other way round,
which is how screen 15 writes it. **So each screen gains exactly one
more pair.** Take the coordinates verbatim from the screens above,
including the order of `a` and `b`.

---

## 3. What each screen shows afterwards

Both pairs up together, each complete: two points, the line joining
them, both coordinate labels, and the length the child worked out.

**Screen 20** — *"We know how to find horizontal distance."*

```
   (−3, 3)                    7 units            (4, 3)
       ●───────────────────────────────────────────●
                    │
   ─────────────────┼──────── (3, 2) ●──────● (6, 2)
                    │                 3 units
```

**Screen 21** — *"And vertical distance."*

```
        (−2, 3) ●                    (1, 2) ●
                │                           │
       2 units  │                           │  5 units
                │                           │
        (−2, 1) ●                           │
   ─────────────┼───────────────────────────┼─────
                │                    (1, −3) ●
```

Drawn as they ended up on their own screens: **solid** line, not the
dashed guide the question opens with; points green; labels over their
points; the length written beside the line.

---

## 4. Where the second pair's length goes

The only thing that needs deciding, because everything else keeps the
coordinates it already has. Both screens' new lengths must clear the
y-axis and the other pair's labels.

- **Screen 20**, `(4, 3)–(−3, 3)`: the midpoint of that pair sits almost
  exactly on the y-axis, so a length centred there is written across the
  axis numbering. Put it **above** its own line — the side the count-out
  used on screen 13 — and push it right of the axis:
  `result: { text: '7 units', dy: -48, dx: 66 }`.
- **Screen 21**, `(−2, 3)–(−2, 1)`: beside its line, on the side away
  from the other pair, level with its own middle:
  `result: { text: '2 units', dy: 0, dx: -84 }`.
- The existing pairs keep the offsets they already have
  (`dy: 48` on 20; `dy: -117, dx: 108` on 21). Nothing that is on the
  board today moves.

If any of the four lengths, four labels or two lines end up touching,
the offsets above are what to adjust — never the coordinates.

---

## 5. How to build it

The board can draw **one** pair: `Board.segParts.a/b`, `segLine`,
`segRes`. A second pair needs somewhere to live.

**Add a small pool of example pairs — do not generalise the segment.**
The real segment is wired into the question machinery, the measuring,
the count-out, the coordinate glow, `lastPlotted`, `checkDistance` and
the triangle. Widening it to N puts every one of those at risk for a
screen that only needs to *show* something.

So:

1. In `Board.build`, build `GRID.example.slots` example slots, each one
   a `<line>`, two `<circle>` points, two `<text>` coordinate labels and
   one `<text>` length — in a group appended **before** the segment
   group, so the screen's own pair stays on top.
2. Every style comes from the existing config, not from new values:
   point `GRID.segment.dotR` / `dotFill` / `dotStroke` / `dotStrokeW`
   (10, `#2E9E6B`, white, 3), line `lineColor` / `lineWidth`
   (`#213258`, 6), labels `coordSize` (34) placed `GRID.found.labelDy`
   (−42) above their own point, length `GRID.unitBox.labelSize` (32).
   A second pair that is drawn even slightly differently reads as a
   different kind of thing.
3. `Board.showExample(i, spec)` places one, and `Board.runExamples(list,
   later, done)` brings them up in the segment's own order — **points,
   then the line joining them, then the labels, then the length** — so
   a pair arrives the way pairs have arrived all game.
4. `Board.clearExamples()` hangs off `clearSegment`, so nothing is
   inherited by the diagonal.
5. A screen declares them as `examples: [ … ]`, each entry the same
   shape as `segment` (`a`, `b`, `result`). Wire it beside `entry.legs`
   in the plot path (`js/game.js:3238`), after the screen's own pair and
   its length.
6. Screen 20 has no `hold`; give it one that covers the second pair
   arriving. Screen 21's `hold: 2250` may need the same treatment. Both
   recall beats should still last the same time as each other — derive
   it rather than typing two numbers.
7. Clamp with what exists — `Board.clampX`, `clampY`, `clearOfYAxis` —
   rather than trusting the offsets blindly.

---

## 6. Constraints

- Only the pairs listed in §2. No new examples, no re-lettered points,
  no renumbering.
- Coordinates are copied verbatim, `a` and `b` in their original order.
- The pair each screen already draws does not move, change or lose its
  length.
- The second pair is not interactive and is never measured, counted,
  glowed or asked about. It is a picture of something already done.
- Nothing overlaps: not the two lines, not the four labels, not the two
  lengths, not the axis numbering.
- Both pairs are up together for the whole of the held frame.
- Runs exactly once per visit; Back then Next replays it cleanly.
- No CSS transform on any SVG `<text>`; reveal by opacity.

---

## 7. Acceptance — in a browser, watching it

- [ ] screen 20 shows **(3, 2)–(6, 2)** with `3 units` **and**
      **(4, 3)–(−3, 3)** with `7 units`
- [ ] screen 21 shows **(1, −3)–(1, 2)** with `5 units` **and**
      **(−2, 3)–(−2, 1)** with `2 units`
- [ ] every point, line, label and length matches how that pair looked
      on the screen it came from — same green points, same navy solid
      line, same label size and offset
- [ ] no dashed guide anywhere on either screen
- [ ] the pair that was already there has not moved
- [ ] nothing touches anything: lines, labels, lengths, axis numbers
- [ ] both pairs are on screen together and stay for the whole beat
- [ ] both recall beats last the same time
- [ ] nothing is carried onto the diagonal that follows
- [ ] screens 8–19 are unchanged

---

## 8. Built — 17 Sep 2026

Every box in §7 ticks, watched in headless Chrome as well as checked in
the Node harness.

How it was built:

- **`Board.placeSegment(spec, into)`** now takes an optional target.
  Left out it is the board's own pair — every existing caller, unchanged
  — and given an example slot it lays that slot out by the very same
  code. That is what makes §7's "matches how that pair looked on the
  screen it came from" true by construction rather than by eye: the
  recalled row's labels come out beside its points at `dx 77 / -87`,
  exactly as on screen 13, and the recalled column's above and below at
  `dy -35 / 35`, exactly as on screen 19. `showSegResult` takes the same
  optional target.
- **`GRID.example`** holds the slot count and every duration.
  `Board.exSlots` are built in `Board.build` before the segment group —
  so a recalled pair sits under the pair the screen is about — and each
  slot carries the segment's own classes (`segline`, `segdot`,
  `segcoord`, `segres`), which is why its styling is identical rather
  than merely similar. No dashed guide: an example is only ever shown
  finished.
- **`Board.runExamples`** brings them up in the segment's own order —
  points, line, labels, length — and runs **under her line**, the way
  the worked subtraction does, so neither screen costs a silent pause.
  `clearExamples` hangs off `clearSegment`, and `blankLabels` empties
  their text so a replay cannot inherit last run's words.
- A screen declares `examples: [ … ]`, wired beside `entry.legs` in the
  plot path.

One thing the spec did not anticipate: **`qa-recall` already enforced
that a recall's length stays readable for at least 2800ms**, and the
first hold (1700ms) cut screen 21 to 2450ms. The example's arrival was
tightened (its length lands at 1040ms rather than 1320ms) and `readMs`
raised to 2200, which puts screen 20 at 3700ms and screen 21 at 2950ms —
both clear, and both beats still the same length as each other because
they take the same derived hold.

Probe: `qa-examples.js`. It reads the pairs **out of SCRIPT** rather than
having them typed in, so if a horizontal or vertical pair is ever added,
changed or removed before these screens, the probe fails rather than
quietly going stale. It also checks the styles against `GRID.segment`,
compares each recalled pair's label offsets against the screen it came
from, and box-tests all four labels and both lengths for overlap.
Browser capture: `cdp-examples.js`.

---

## 9. The board steps back — 17 Sep 2026

With two pairs on one board, the furniture was competing with them: a
plotted line and an axis are the same navy at nearly the same weight,
which is right on a screen carrying one pair and wrong on a screen
carrying several.

So these two beats — and only these two — quieten the board.
`quietBoard: true` on the screen puts a `quiet` class on `#gridPanel` at
the screen change, and the stylesheet fades four things back by
different amounts, each to what its job needs:

| what | opacity | why that much |
|---|---|---|
| the ruling (`#gridImg`) | .35 | it only has to stay countable |
| the axes | .30 | they only have to stay findable |
| the arrowheads | .30 | with their axes |
| the axis numbers | .50 | the coordinates point at these, so they keep most of their ink |

Everything plotted — points, lines, coordinate labels, lengths — stays
at full strength.

One trap, the same one the axes' own comment records: **the ruling could
not be dimmed by a declaration.** `#gridImg.ruling` runs `ruleIn` with
`both`, so its filled last frame (opacity 1) beats any rule at any
weight. The quiet ruling therefore has to be an animation of its own
(`ruleQuiet`), placed below it. The other three are ordinary rules,
specific enough to beat the ones that turn them on, with a transition on
the base rules so a board goes quiet and comes back with a fade rather
than a flicker.

`qa-examples.js` checks that exactly screens 20 and 21 carry the flag and
that 19 and 22 do not; the Chrome capture reads the computed opacities
off the live page (ruling .35, axes .30, arrows .30, numbers .50, and
every plotted thing 1.00).

---

## 10. The marked corner's label — 17 Sep 2026

Separate fix, on the triangle screens rather than the recall ones.

On screen 24 the corner C at (6, 1) had its own coordinates written
straight across it: `(6, 1)` sat on the orange dot. The cause is that
**`clampX` does not decline, it drags.** `placeLeg` asked for the label
one offset to the right of the corner, the outermost column has no room
on that side, and the clamp pulled it back inside the frame — which put
it exactly on the point it was naming.

`placeLeg` now asks first and checks: if the side it wants is not there,
the label goes **over the point** instead — where every other coordinate
in the game sits — or under, if over is the axis numbering. Because the
letter normally takes the space below the corner, and would collide if
it were ever pushed above, it now keeps whichever side of the point the
coordinates did not take, and goes beside the point if that side is the
axis numbering.

Nothing else moved: the change only fires where the clamp was already
having to drag, which on the whole script is screen 24's C and nowhere
else. Screens 25, 26, 29, 30, 32, 33 and 34 place their corners exactly
as before.

Probe: `qa-corner.js`, over every screen that marks a corner (24, 25,
26, 29, 30, 32, 33, 34). For each it checks the coordinates are not
across their own point, that the coordinates and the letter keep apart,
that the letter is not across the point either, that the label is inside
the frame, and that it clears the length written beside it. It watches
each beat rather than reading at a fixed time, because a short one is
gone inside eight seconds and a question draws its legs partway through
its own flow.

Known and left alone: on screen 34 the letter C and the length
`x2 - x1` touch by one pixel. It predates this change, it is a hairline
rather than a collision, and the four screens that share that layout
would all move to fix it.

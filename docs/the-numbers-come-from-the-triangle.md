# Build prompt — the numbers come from the triangle

Screen 28 ends with the Pythagoras working. Today the board slides to
the middle of the frame, the camera pushes in, and the working is
written on the paper beside the triangle, one line at a time, while
each side it names is lit and the rest of the drawing steps back.

This rewrite keeps the maths and changes how it arrives:

- **The triangle stays exactly as the child built it.** Every side,
  every point, both lengths and the right-angle marker, at full
  strength, for the whole screen. Nothing on it pulses, glows, lights
  or steps back, and nothing is added to it.
- **The board does not travel.** It stays where it is beside her. The
  paper opens up to the right of the triangle, and a **formula table**
  comes into that room.
- **Every number and name in the table comes from the triangle.** A
  copy lifts off the thing on the triangle it stands for, pulses just
  above it, and travels slowly into its place in the table. The
  original never moves. One at a time, slowly, so a child can follow
  each symbol from where it was to where it goes.

The three lines she says first ("We know AC and CB." / "But we still
need AB." / "Since it’s a right triangle, Pythagoras theorem can
help!") are unchanged. The table begins once the third has finished.

---

## 0. What is there now

Screen `id: 28`, `stage: 'working'`, `view: 'triangle'`, `keepMark`,
`rightAngle`. When the lines are done, the working stage:

```
   1. slides the board to the middle of the frame   Board.place(G.centre)
   2. pushes the camera to the 'working' view        room beside the triangle
   3. writes five lines on the paper, one at a time  workThrough
        (AB)² = (AC)² + (CB)²
        = (4)² + (3)²
        = 16 + 9
        = 25
        AB = 5 units          ← `home: true` flies "5 units" onto AB
```

As each part is written, `flyInto` lights its source ON the triangle
(`spotlightPart` for a side, which steps the rest of the drawing back;
`glowPart` for a coordinate), waits `fly.pickMs` (460ms), and sends a
glyph across with `FX.flyGlyph` in `fly.ms` (980ms). The working's own
lights (`lit: 'h' | 'v' | 'ab'`) light and hush sides as it goes.

Everything in that list that touches the triangle has to stop on this
screen, and the board must not move.

---

## 1. The layout

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │               ┌─────────── the board, where it already is ──────────┐│
 │               │                                                     ││
 │               │         B            ┌─── formula table ─────────┐  ││
 │   (Swifty)    │        /|            │ (AB)²  =  (AC)²  +  (CB)² │  ││
 │               │       / |            │        =  (4)²   +  (3)²  │  ││
 │               │      /  | 3 units    │        =  16     +  9     │  ││
 │               │     /   |            │        =  25              │  ││
 │               │    A────┘C           │  AB    =  5 units         │  ││
 │               │    4 units           └───────────────────────────┘  ││
 │               └─────────────────────────────────────────────────────┘│
 └──────────────────────────────────────────────────────────────────────┘
```

- **The board stays put.** No slide to the middle. Its box is the one
  it had while she was speaking.
- **The paper opens to the right.** The camera eases so the triangle
  sits in the left part of the board and clear paper is left on the
  right. This is what the `working` view already computes (the drawing,
  then as much again on the side the drawing is not on); use it, sized
  from the table's width.
- **The table lives on that paper**, in the room the camera opened:
  a light plate with soft rounded corners, and the formula set out as a
  table — the `=` signs in one column, each term in its own column, so
  every row lines up under the one above. It is set at a fixed size on
  the stage, like the working is today, so it reads the same however
  far the camera came in.
- **Empty slots first.** Each row appears as its skeleton — brackets,
  `²`, `=`, `+` — with a soft empty slot wherever a number or name will
  land, so the child can see where each symbol is going before it
  leaves the triangle. The plate comes in with the first row; each
  later row's skeleton appears when its turn comes, so the table grows
  downward step by step.

---

## 2. How one symbol travels

The same four steps for every symbol that comes from the triangle.

```
   1. APPEAR   a copy appears exactly on top of the original
               (same text, same colour, same size) — for the first
               moment it is indistinguishable from it
   2. PULSE    the copy lifts a little above the original and pulses
               twice there; the original stays put underneath, unchanged
   3. TRAVEL   the copy travels slowly to its slot in the table,
               easing out and in, growing or shrinking to the table's size
   4. LAND     it settles into its slot, which now holds it; a short
               pause, then the next symbol
```

- **Only the copy moves, and only the copy pulses.** The original on
  the triangle is never lit, stepped back, scaled or moved. "Pulse
  above the 4" means the copy, a few pixels over the 4, not the 4.
- **One at a time.** Never two copies in the air, and never a copy
  leaving before the last one has landed.
- **Slow.** Suggested starting values, all in config so they can be
  tuned by eye:

  | step | time |
  |---|---|
  | appear | 200ms |
  | lift + two pulses | 1000ms |
  | travel | 1400ms |
  | land, then pause | 300ms |

  So about three seconds a symbol. The travel is deliberately slower
  than today's 980ms: the point is that the child can follow it.
- **A copy is text, not a highlight.** It is what `FX.flyGlyph` already
  flies; the pulse is new, and it happens on the copy. Do not add a
  glow or spotlight on the board to announce it.

---

## 3. The sequence

Once her third line has finished:

```
   0.  [The camera eases, opening paper to the right of the triangle.
        The table's plate comes in, with row 1's skeleton:
            (  )²  =  (  )²  +  (  )²                               ]

   1.  AB   — a copy rises off the side AB, pulses, travels into
              the first slot                          → (AB)² = (  )² + (  )²
   2.  AC   — the same, off the side AC               → (AB)² = (AC)² + (  )²
   3.  CB   — the same, off the side CB               → (AB)² = (AC)² + (CB)²

   4.  [Row 2's skeleton:      =  (  )²  +  (  )²                   ]
   5.  4    — a copy of the 4 in "4 units" on AC      →  = (4)² + (  )²
   6.  3    — a copy of the 3 in "3 units" on CB      →  = (4)² + (3)²

   7.  [Row 3, written in place:   =  16  +  9     ]
   8.  [Row 4, written in place:   =  25           ]

   9.  [Row 5's skeleton:   (  )  =  ...                            ]
  10.  AB   — a copy rises off the side AB once more  →  AB = ...
  11.  [written in place:   5 units   ]
```

### Where each symbol comes from

| symbol | its source on the triangle |
|---|---|
| AB | the side AB — the copy rises from the middle of the side |
| AC | the side AC — from its middle |
| CB | the side CB — from its middle |
| 4 | the digit 4 in "4 units", written along AC |
| 3 | the digit 3 in "3 units", written along CB |

The sides carry no written name, so a side's copy appears at the
middle of that side, in the ink of the letters at its corners. This is
the source `flyInto` already uses for a side (`sourceSpot` with
`from.side`). A length's copy is only its digit: "4 units" gives up a
`4`, and "units" stays where it is.

### What is written, not flown

`16`, `9`, `25` and `5 units` are arithmetic. Nothing on the triangle
says them, so they are written into the table in place — the same
gentle write-in the working uses today — never flown from somewhere
they did not come from.

### The answer stays in the table

`AB = 5 units` is the table's last row and it stays there. It does
**not** fly home onto the side AB: that would add a label to the
triangle, and the triangle is not to gain anything on this screen.
Turn `home` off for this screen's result.

---

## 4. What the code needs

### 4a. A working that does not move the board

The working stage's first step is `Board.place(G.centre)`. This screen
keeps the board where it is. A per-screen switch — for example
`stage: 'table'`, or `stage: 'working'` with `stayPut: true` — that
skips step 1 and still does step 2 (the push to the `working` view,
with `workWidest` taken from the table's width).

### 4b. The table

A renderer for the formula as a table on the paper: the plate, columns
aligned on `=`, empty slots, rows that appear one at a time. It reads
the same `derive.formula` the working reads today — same five lines,
same parts, same `from` sources — so the maths is written once.

### 4c. The duplicate's pulse, and no light on the triangle

Today `flyInto` lights the source where it is — `spotlightPart` for a
side, `glowPart` for a coordinate — before the glyph flies. On this
screen that light is replaced by the copy's own appear-and-pulse (§2),
and nothing on the board is lit. Keep `flyInto`'s current behaviour for
every other screen.

### 4d. The working's lights, off

The working lights and hushes sides as it writes (`lit` on each part,
through `spotlightPart`). On this screen none of that runs: no side is
lit, no side steps back, the pulse overlay never comes on. A
per-screen flag such as `keepTriangle: true` read wherever the working
lights a side. `keepMark` stays, so the marker is safe either way.

### 4e. Slower, and in config

The four timings in §2 live in config (for example
`GRID.table: { appearMs, pulseMs, travelMs, restMs }`), used only by
this screen, so the existing `fly.pickMs` / `fly.ms` are untouched for
the others.

---

## 5. What must not change

- Screen 28's three lines, their order, and the marker being up from
  the first frame.
- The triangle: A(2, 1), B(6, 4), C(6, 1); "4 units" on AC, "3 units"
  on CB; the right-angle marker at C. Nothing is added to it and nothing
  on it changes, for the whole screen.
- The maths: the same five lines, the same order, the same numbers.
- Screens 29 and 30 keep their own workings exactly as they are, and
  `flyInto` behaves as it does now everywhere else.
- The rules in force: only lines light; no line crosses a point; the
  axes fade as one shape; the red glow on a wrong answer.

---

## 6. How to know it is right

Measured on the running page, not looked at.

1. **The board never moves.** Its box is the same in every frame from
   the start of the screen to the end of the table.
2. **The table is in the room it was given.** Every row, every slot and
   the plate itself lie inside the board and inside the camera's shot,
   to the right of the triangle, overlapping nothing on it.
3. **The triangle is untouched.** In every frame, no side, point,
   letter, coordinate or length on the triangle carries a lit or
   stepped-back state, none of them moves or changes size, and the
   pulse overlay is never on.
4. **Each copy starts on its original.** When a copy appears, its
   centre is within a few pixels of its source's centre; the original
   is still there, unchanged, until the end of the screen.
5. **It pulses above, then travels.** Each copy grows past its own size
   at least twice while it is above its source, before it starts to
   travel.
6. **One at a time.** There is never more than one copy on the stage.
7. **In order.** The slots fill in this order: AB, AC, CB, 4, 3, then
   16, 9, 25 written, then AB, then 5 units written.
8. **Slow.** Every travel takes at least 1.2 seconds; every pulse phase
   at least 0.8 seconds.
9. **The answer stays in the table.** When the screen is done, "5 units"
   is in the table and there is no new label on the side AB.
10. **The marker stays up.** Its opacity is 1 in every frame.
11. **The walk is clean.** Every screen, each number answered wrong
    once before right: no exceptions.

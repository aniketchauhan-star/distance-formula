# Build prompt — the axis cases come from the drawing

Screens 39 and 41 are the two special cases of the distance formula:
both points on the x-axis, then both on the y-axis. Today each one
opens with the working already printed in a panel above her head —
"d = √((x₂ − x₁)² + (y₂ − y₁)²)" — and rewrites it in place on a single
line: the (0 − 0)² glows, fades away, and "d = |x₂ − x₁|" is written on
the board under the segment.

It should arrive the way screen 28's working does. The drawing is
shown, the camera comes in on it, and a table opens beside it **with
nothing in it**. Everything the table needs from the drawing is lifted
off the drawing and carried across, one piece at a time, slowly, and
set down in its place. The answer stays in the table.

Same treatment on both screens: this is one kind of screen, built once.

---

## 0. What is there now

```
   39   layout 'xaxis'   "Both points are on the x-axis."
        points (x₁, 0) and (x₂, 0), labels built in parts (the 0s glow)
   41   layout 'yaxis'   "Both points are on the y-axis."
        points (0, y₁) and (0, y₂), the same the other way round

   Both (runAxisCase, C.XAXIS / C.YAXIS):
     the board on the right; a formula panel in the left column above
     her, already showing the formula
       step 0   d = √((x₂ − x₁)² + (y₂ − y₁)²)
       step 1   the two 0s light on the board and fly into (0 − 0)²
       step 2   + (0 − 0)² fades out
       step 3   d = √((x₂ − x₁)²)
       result   d = |x₂ − x₁|   written on the board, under the segment
```

---

## 1. The layout

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │                 ┌──────── board ────────┐┌────── table ──────────┐   │
 │                 │                       ││ d = √((x₂−x₁)² + ...)  │   │
 │   (Swifty)      │   (x₁,0) ●━━━━━● (x₂,0)││   = √((x₂−x₁)² + ...)  │   │
 │                 │                       ││   = √((x₂−x₁)²)        │   │
 │                 │                       ││ d = |x₂ − x₁|          │   │
 │                 └───────────────────────┘└────────────────────────┘   │
 └──────────────────────────────────────────────────────────────────────┘
```

- **She stays on the left**, in her column, where she said her line.
- **The board comes to the middle**, smaller than full size — it only
  has to hold the segment and its two labels once the camera is in.
- **The camera comes in on the lines area**: the segment, its two
  points and their labels, filling the board.
- **The table opens out of the board's right edge**, exactly as on 28 —
  the same component (`FormulaTable`), the same frame, the same drawer —
  its rows hung from one column of equals signs.
- **No formula panel above her.** The panel that sits in her column
  today goes; the table replaces it.

---

## 2. The sequence (screen 39; 41 is the same with x and y swapped)

```
   1.  [The board with the two points on the x-axis, her on the left.]
       "Both points are on the x-axis."

   2.  [The board moves to the middle and the camera comes in on the
        segment and its labels.]

   3.  [The table opens out of the board's right edge — empty.]

   4.  [Row by row, each row's skeleton comes in, and every piece that is
        written on the drawing is carried across from it:]

         d = √((x₂ − x₁)² + (y₂ − y₁)²)     x₂, x₁ from the two labels
           = √((x₂ − x₁)² + (0 − 0)²)       the two 0s from the labels
           = √((x₂ − x₁)²)                  written: (0 − 0)² is 0
         d = |x₂ − x₁|                      x₂, x₁ from the labels again

   5.  [The table is finished. The answer stays in it.]
```

### What is carried, and from where

| piece | source on the drawing |
|---|---|
| x₁ | the "x₁" in the label (x₁, 0) |
| x₂ | the "x₂" in the label (x₂, 0) |
| 0 (for y₁) | the "0" in (x₁, 0) — its y half |
| 0 (for y₂) | the "0" in (x₂, 0) — its y half |

On 41 the same with the axes swapped: y₁ and y₂ from the labels'
y halves, the 0s from their x halves.

### What is written, not carried

- The formula's own shape — d, √, brackets, squares, the minus and plus
  signs — is each row's skeleton.
- **y₂ and y₁ in the first row** (x₂ and x₁ on 41) are the formula's
  letters, not anything on the board: the labels say 0 there. They are
  written with the skeleton, and it is the next row that shows the 0s
  arriving to take their place.
- **Row 3** is the arithmetic of (0 − 0)² being nothing; it is written.

### How one piece travels

Exactly as on 28 (`FX.liftAndFly`, `GRID.table` timings): a copy appears
on the original, lifts just above it and pulses twice, then travels
slowly into its slot; the original never moves. One at a time.

---

## 3. The drawing is left alone

As on 28: nothing on the board is lit, stepped back or pulsed while the
table fills — the copies pulse, the originals do not. Today's step 1
lights the two 0s on the board (`glowCoords`); on these screens that
light is replaced by the copies' own pulse.

**The answer stays in the table.** Today "d = |x₂ − x₁|" is also
written on the board under the segment; with the table it is the
table's last row and nothing is added to the drawing.

---

## 4. What the code needs

- **The label pieces as their own parts.** The labels are built in
  parts today (`coordParts`) but only the 0 is its own piece; "x₁" and
  "x₂" (and "y₁", "y₂" on 41) need to be pieces too, so a copy can be
  made of each. Glow names: `x` and `y`, as now.
- **A table working for the axis cases**, reusing 28's: `FormulaTable`
  for the table, `workAsTable`'s drawer and `fillTable`'s one-at-a-time
  order, with parts that carry `from: { p: 'a' | 'b', half: 'x' | 'y' }`
  so `liftInto` finds them through `sourceSpot`'s coordinate-half branch.
  The formula lives in `C.XAXIS` / `C.YAXIS` in 28's `derive.formula`
  shape instead of the four `steps`.
- **The layout**: she stays; the board is placed in the middle at a
  smaller box; the camera frames the segment; the table's box is to the
  board's right. New boxes in `C.XAXIS` / `C.YAXIS` (both cases share
  them, as they share the grid and formula boxes today).
- **Retire** the left-column formula panel and the result written on
  the board, on these two screens only.

---

## 5. What must not change

- The points, their labels and her lines on 39 and 41.
- Screens 38 and 40 (the questions before each case) and everything
  from 42 on.
- Screen 28's table, 29c's and 30's.
- The rules in force: only lines light; no line crosses a point; the
  axes fade as one shape; the grid fills before the camera frames.

---

## 6. Open questions for the author

1. **Where the panel goes.** This prompt reads "grid in the middle,
   bird left, then the panel" as her on the left, the board in the
   middle and the table to its right — the order 28 uses, so the pieces
   fly left to right from the drawing to the working. If the panel
   should sit *between* her and the board instead, the pieces fly the
   other way; say so.
2. **Screen 36 as well?** 36 states the whole distance formula in a
   panel beside the board after it is derived. It is the same kind of
   screen and could open empty and have its pieces carried in from the
   triangle on 31–35. Not included unless asked.

---

## 7. How to know it is right

Measured on the running page, not looked at.

1. **She stays.** Her position is the same from her line to the end of
   the table.
2. **The board moves to the middle and the camera frames the segment:**
   both points and both labels inside the shot, nothing cut off.
3. **The table opens empty** out of the board's right edge, and there
   is no formula panel in her column at any point.
4. **Every piece from the drawing is carried:** each copy starts on its
   original (x₁, x₂ and the two 0s), pulses above it, travels into its
   slot; never more than one in the air; the originals never move.
5. **In order:** row 1's x₂ and x₁, row 2's two 0s, row 3 written,
   row 4's x₂ and x₁.
6. **The drawing is untouched:** nothing on the board lit, stepped back
   or pulsed while the table fills, and no result written on the board.
7. **41 matches 39**, with x and y swapped.
8. **The walk is clean:** no exceptions.

# Build prompt — this time the child fills the table

Screen 28 shows the Pythagoras working: the table opens out of the
board's right edge and every number in it is carried in from the
triangle while the child watches. Screen 29 is the next thing, and it
should be the child's turn.

Today 29 is one question — "Use the right triangle to find AB." —
answered with a single number on the control, with the working shown
only if they get it wrong. This rewrite makes it the same argument as
the triangle stretch before it, done by the child this time:

1. two points, and the distance between them as the question;
2. a third point, and the two sides the child already knows how to
   measure;
3. the right triangle those sides make;
4. the same table as 28 — but every blank in it is the child's to fill,
   by tapping it and choosing between two numbers.

The mockups (five wireframes, grey on white) give the layout and the
words; the look is the game's own.

---

## 0. The triangle

```
   A (−2, 2)      B (2, 5)      C (2, 2)

   AC = 4   (across: 2 − (−2))
   CB = 3   (up:     5 − 2)
   AB = 5   (3² + 4² = 25)
```

This is screen 29's triangle today, and it is the one the mockups'
numbers belong to — "4 units", "3 units", 25, AB = 5. The wireframes
label B "(2, 4)"; that is a slip: with B at (2, 4), CB would be 2 and
nothing downstream would work. **B is (2, 5).**

---

## 1. The sequence to build

The bracketed lines are what the board does, not what she says.

```
   0.  [The grid comes in, in the middle of an empty frame, and fills.
        Then the camera comes in on where the triangle will be.]

   1.  [A and B appear — each point, then its letter and coordinates.]
       [She flies in.]
       "Now, let's find the distance between A and B."

   2.  [C appears at (2, 2), with a dashed guide from A to C and from
        C to B.]
       "What is the difference between these two points?"
       [The side AC lights — the line, not the points.]

   3.  [The number control rises. The child picks AC = 4.]
       [AC turns solid and "4 units" is written along it.]

   4.  "What is the difference between these two points?"
       [The side CB lights.]
       [The control. The child picks CB = 3. CB turns solid, "3 units".]

   5.  "Look, we made a right triangle."
       [The right-angle marker appears at C, at full strength.]

   6.  "Let's use Pythagoras to find AB."

   7.  [She flies out. The board slides left and the table opens out of
        its right edge — exactly as on 28.]
       [The child fills the table, one blank at a time (§3).]
       [When AB = 5 is in, she comes back and says the screen's right
        answer line.]
```

### Why it is built like this

- **Beat 0 is the standing rule** (`bbcf49c`): a new drawing that the
  camera frames is framed after the grid has filled and before any
  point is drawn. Build it that way; it already exists.
- **Beats 1–2 mirror 22 and 24.** The question is named first (the
  distance between A and B), then the thing that makes it answerable
  (C, and two sides the child can count).
- **Beats 3–4 are two questions, not one.** The table needs both
  lengths, and image 48 has both written on the triangle. Asking both
  keeps the child doing every step — see the open question in §6.
- **Beat 5 names the shape and shows the marker** — the reason
  Pythagoras applies, as on 28.
- **Beat 7 is the same table as 28, the other way round.** On 28 the
  numbers came from the triangle on their own; here the child supplies
  each one, so the child has done the whole working by the end.

---

## 2. Screens

The game grades one question per screen and hands on when it is
answered, so this is three screens on one board — no leaf sweep
between them, the drawing kept (`keepSegment`), the camera held:

| screen | beats | question |
|---|---|---|
| 29 | 0–3 | AC, on the control (`kind: 'distance'`, `measureLeg: 0`) |
| new | 4 | CB, on the control (`measureLeg: 1`) |
| new | 5–7 | the table (§3) — a new question kind |

This is how 22 → 24 → 25 → 27 → 28 is built already. Ids are labels,
not positions, so the two new screens take any unused ids; the picker
should list them in script order between 29 and 30.

---

## 3. The table the child fills

### Layout

The table from 28 (`FormulaTable`): the board slides left, the table
opens out of its right edge in the board's own frame, rows hung from
one column of equals signs.

```
      (AB)²  =  (CB)²  +  (AC)²          ← written in: the theorem
             =  ( ▢ )² +  ( ▢ )²         ← the child: 3, then 4
             =    ▢    +    ▢            ← the child: 9, then 16
             =    ▢                      ← the child: 25
         AB  =    ▢                      ← the child: 5
```

The first row is given — it is the theorem, and 28 has just shown it.
Every other value is a blank the child fills, and the order of the
terms follows the mockup: CB first, then AC.

### One blank at a time

1. **The active blank** is an empty rounded box with a soft dashed
   outline and a small ▾ under it, breathing gently. Only it can be
   tapped; the blanks after it wait, faint.
2. **Tap it**, and a short scroller drops down out of it: **two
   numbers**, stacked, each a tappable tile in the style of the number
   control's tiles, so the child knows it is the same kind of choosing.
3. **Tap a number.**
   - **Right:** the scroller folds back up into the blank and the number
     settles there in its side's colour (CB green, AC orange, the rest
     the working's blue), with a tick. The next blank becomes active.
   - **Wrong:** the red glow on the frame (the standing rule for every
     wrong answer), the tapped number shakes and fades out of the
     scroller, and the other stays for the child to take. No second
     wrong is possible on a blank, so no blank can strand them.
4. **Slowly.** The drop, the fold and the settle each take their time;
   nothing is rushed past, and there is a beat between one blank and
   the next.

### The two numbers in each blank

Each wrong number is the mistake that blank is there to catch:

| blank | right | offered with | the mistake it catches |
|---|---|---|---|
| (CB)² | 3 | 4 | reading the other side |
| (AC)² | 4 | 3 | reading the other side |
| 9 | 9 | 6 | squaring as doubling (3 × 2) |
| 16 | 16 | 8 | squaring as doubling (4 × 2) |
| 25 | 25 | 23 | a slip adding 9 and 16 (as the mockup has it) |
| AB | 5 | 25 | stopping before the square root |

The right number is not always on top: which of the two is first comes
from the blank, not from a rule the child can learn.

### The triangle while the table is filled

Left exactly as it is — nothing on it lit, stepped back or pulsed, as
on 28. The marker stays at full strength.

---

## 4. What the code needs

- **A new question kind for the table**, graded blank by blank, done
  when the last blank (AB) is right. Its spec lives in the screen's
  config: the formula (reusing 28's `derive.formula` shape) with each
  blank marking its right value and its alternative, e.g.
  `{ t: '(3)²', pick: [3, 4] }`, where the first is the right one and
  the order shown is set per blank.
- **`FormulaTable` gains a mode where a slot is the child's**: the
  active state, the drop-down scroller of two tiles, right and wrong
  handling. Its layout, frame and drawer opening are reused unchanged.
- **Screens 29 and the two new ones** as in §2, using the existing
  measuring questions for AC and CB and the existing leg drawing
  (dashed guide → solid with its length).
- **The standing rules apply everywhere here**: grid before frame
  before points; only lines light; no line crosses a point; the axes
  fade as one shape; the red glow on every wrong answer.

---

## 5. What must not change

- The triangle: A(−2, 2), B(2, 5), C(2, 2); AC = 4, CB = 3, AB = 5.
- Screen 28 and its table, and screen 30 onward.
- The number control and the measuring questions as every other screen
  uses them.

---

## 6. Open question for the author

**One leg question or two?** The brief says the question "what is the
difference between these two points?" once, and image 48 then shows
both lengths written. This prompt asks it twice (AC, then CB) so the
child finds both numbers the table needs. If only AC should be asked,
drop the middle screen and have CB drawn with its length when C
appears.

---

## 7. How to know it is right

Measured on the running page, not looked at.

1. **Grid, then frame, then points.** On 29 the new grid is shown at
   the full board, the camera frames the triangle after it, and the
   first point appears after that; nothing of the triangle is cut off.
2. **The lines in order.** "Now, let's find the distance between A and
   B." → "What is the difference between these two points?" (×2) →
   "Look, we made a right triangle." → "Let's use Pythagoras to find
   AB."
3. **The two sides.** AC answers 4 and CB answers 3 on the control; a
   wrong answer gives the red glow and the usual count.
4. **The marker** appears with "Look, we made a right triangle." and is
   at full strength from then to the end.
5. **The table opens as on 28**: the board slides left, the table comes
   out of its right edge, and the first row is written in.
6. **One blank at a time.** Only the active blank can be tapped;
   tapping it shows exactly two numbers.
7. **Right fills, wrong glows.** A right number settles in the blank and
   activates the next; a wrong one gives the red glow and leaves only
   the other number.
8. **In order.** The blanks fill 3, 4, 9, 16, 25, 5, and the screen
   hands on only after AB = 5.
9. **The triangle is untouched** while the table is filled.
10. **The walk is clean.** Every screen, each question answered wrong
    once before right — including every blank in the table: no
    exceptions.

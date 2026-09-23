# Build prompt — the point labels, designed like the working

The formula on the paper is quiet, small, and sits on a plate of its
own. The point labels are none of those things, and they are the
loudest type on the board.

---

## 0. What is wrong, measured

**The labels are the biggest type on the paper.** Measured off the
config, the type on a board runs:

```
   a point's letter          40      the loudest thing on the paper
   a point's coordinate      34
   the axis numbers          36      what the board is READ against
   a leg's length            32
   the working's formula     30      the thing being taught
```

The letter naming a point is larger than the numbers the board is read
against, and a third larger than the working. Nothing about a label is
more important than either.

**A label may sit straight on an axis.** The obstacle pass inks the
axis NUMBERS and the two axis LETTERS. It has never inked the axis
LINES: `inkLine` is called exactly twice, for the pair and for the
legs. So the two strongest strokes on the paper — 7px of dark ink,
heavier than anything drawn on it — are invisible to the rule that is
supposed to keep labels off things. That is what the second picture
shows: `C (6, 1)` written across the x-axis.

**And the labels have a plate already, in all but name.** Each one
carries a 6px halo in the paper's own cream, painted under the glyphs
so they read over the ruling. It follows the letterforms, so it is a
smudge rather than a shape — where the working's plate is an honest
rounded rectangle with a soft edge.

---

## 1. The design

**A point's label is a small working panel.** It takes what the
working already has:

- the same quiet plate — the paper's own cream `#FDFBF0` at about .96,
  a soft `rgba(150, 120, 60, .28)` edge, a small radius
- the same restraint of size
- enough padding that no glyph touches the plate's edge

And it keeps what it already has: the letter over the coordinate,
centred on each other, **one block**.

**The type comes down.** The label should not be louder than the axis
numbers it sits among, and should not compete with the working. Bring
the letter and the coordinate down so that the block reads as a
caption on the drawing rather than as the drawing's headline — the
working's 30 is the reference to aim at, and the letter may stay a
little above the coordinate, as it is now.

**Nothing about what is written changes.** The words are the same; the
plate and the size are what change.

---

## 2. The letter and the number are one thing

They already are, and they must stay so: **a point's letter and its
coordinate are never split across the board.** One plate holds both.
If a position will not take the block, the block moves — it is never
taken apart so that half of it fits.

This is what the first picture gets right and is worth keeping
explicitly, because a plate makes it tempting to shrink the box by
dropping the letter out of it.

---

## 3. What a label may never sit on

In this order, and all of them are refusals rather than costs:

1. **an axis line** — both of them, the 7px stroke and its arrowhead.
   These are new to the pass and are the whole of §0's second point.
2. **the axis numbers, and the two axis letters** — already known.
3. **a side of the drawing** — the pair, the legs.
4. **another label, or a length** — already known.
5. **the inside of a shape** — already settled and unchanged.

**The one thing it MAY sit on is the ruling.** That is what the plate
is for: a label on a grid line is legible on its plate, and asking a
label to dodge a line every cell would leave it nowhere to stand. The
ruling has never been an obstacle and must not become one.

---

## 4. What must not break

- **The gap a label keeps from its own dot** — one number, measured to
  the ink, the same in all eight directions. The plate grows the block,
  so the gap is measured from the PLATE's edge now, not the glyphs'.
- A label still keeps the side it is on while that side works, so a
  push-in does not make it hop.
- A label still never lands inside a shape.
- The lengths keep going through the same rule they do now.
- Every screen that is clean today stays clean.
- The working's own plate is untouched — this borrows its look, it
  does not change it.

---

## 5. Acceptance — watched, and measured

- [ ] no label overlaps either axis line, on any screen, at any moment
- [ ] no label overlaps an axis number or an axis letter
- [ ] no label is split: every letter is on the same plate as its own
      coordinate
- [ ] a label's type is no larger than the axis numbers, and no larger
      than the working
- [ ] every label sits on a plate, and no glyph touches its edge
- [ ] labels still sit the same measured distance from their own dots,
      and that distance is the same for every point on a screen
- [ ] labels may cross the ruling, and read clearly when they do
- [ ] screens 24, 25, 26 and 28 clean throughout
- [ ] a full play-through raises no exceptions

---

## 6. Built — 21 Sep 2026

Every box in §5 ticks but one, and that one is smaller than it was.

**The plate.** Each point's label is now a rounded rect in the paper's
cream with the working's own soft edge, sized to the block with 7 units
of air round the words. It replaces the 6px halo that used to be
painted under the glyphs — that was a plate in all but name, and
because it followed the letterforms it was a smudge rather than a
shape. It is shown by `:has`, reading forward from the plate to the
words it sits under, so it can never be left on over an empty corner
or missed on a screen that reveals its labels some other way.

**The type came down** — the letter 40 → 30, the coordinate 34 → 26.
It was the loudest type on the paper, louder than the axis numbers the
board is read against and a third louder than the working being
taught. It is now at the working's own size and below the numbering.

**The axes are obstacles at last.** `inkLine` had only ever been
called for the pair and the legs, so the two heaviest strokes on the
paper were invisible to the rule meant to keep labels off things.
Both are inked now.

### And it closed something else

The gap a label keeps from its dot is **A 8.9, B 8.6, C 8.8 — a
spread of 0.3px**, where it was 16.3.

That was an open item from two prompts back: `labels-hug-their-points`
§2 asked for one gap measured to the ink in all eight directions, and
it could not be had, because the block placed was a box and the ink
inside it was glyph-shaped — a narrow letter over a wide coordinate
leaves the corner of its own box empty. `one-thing-at-a-time` §11
recorded it as a box that does not tick.

The plate closes it without anyone aiming at it: the thing placed and
the thing measured are now the same rectangle.

### What is left

Screen 28 still shows a label touching an axis number while the camera
is moving — `C` on the 6 at 250ms and 12500ms, `(6, 1)` on the 5 at
750ms and 11500ms. They are smaller than they were (19x2 and 21x9,
against 24x15 and 25x14 before) and the board is clean once settled.

The cause is unchanged and is not the rule: the label is still sitting
where the previous camera left it, because no re-lay-out has run at
that frame. Placing on the camera's clock rather than the beat's is
still the fix, and still wants its own prompt.

So §5's first two boxes tick for every settled board and for screens
24, 25 and 26 throughout — but not for screen 28 at every moment.

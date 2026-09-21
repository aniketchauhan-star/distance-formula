# Build prompt — one rule for everything the board writes

The labels obey a rule. The lengths do not, and they are the ones
landing on top of things.

---

## 0. What is wrong, measured

Screen 28 — the beat that pushes in on the triangle and works
Pythagoras beside it. Watched frame by frame from the moment it opens,
these collide:

```
   "3 units"   ON  the x-axis letter          21 x 26 px
   "C"         ON  the axis number 6          24 x 15
   "(6, 1)"    ON  the axis number 5          25 x 14
   "(6, 1)"    ON  "4 units"                   5 x  4
   "C"         ON  "3 units"                  14 x 39
```

That last one is the one in the picture: the corner's letter and the
vertical leg's length written through each other.

Screens 25 and 26 are clean throughout. So this is not "labels are
badly placed" in general — it is a specific hole, and §1 names it.

---

## 1. The hole

**Every label goes through one rule. No length does.**

`placePointLabel` builds a block and hands it to `placeBlock`, which
knows the obstacle list, keeps off the axis numbers and letters, keeps
out of the shape, and walks outward when it has to.

`placeLegLength` does none of that. It works out a position with its
own arithmetic — `lenGap`, `lenGapV`, `towardCorner`, `clearOfYAxis`,
`onXAxisRow` — and never once asks what is already on the paper. The
same is true of the pair's own length. `placeBlock` has four callers
in the whole file and all four are labels.

So a length is placed blind. It lands where its formula says, and
whatever was there is simply underneath it.

And the labels cannot get out of its way either, because on this
screen the lengths are placed **after** them: `showWorking` calls
`placeLeg(..., {length: true})` and `showLegLength(i)` when the
working starts, long after the corner was lettered.

---

## 2. What to build

**Every measured thing the board writes goes through the same rule.**
A length is a block like any other: it has a size, a place it would
like to be, and a list of things it may not sit on.

- **`placeLegLength` composes a block and hands it to `placeBlock`.**
  Its preferred direction is *along its own side, on the outside of
  the shape* — which is what its current arithmetic is trying to say,
  and saying badly. Keep that as the `away` it asks for; let the rule
  decide whether it can have it.
- **The pair's own length** (`showSegResult`) goes the same way.
- **A length inks itself** when it lands, so whatever is placed after
  it can see it.

**And whatever is written last must see what is already down.** Where
a length arrives after the labels — which is what `showWorking` does —
the board needs one more pass over the corner marks once the lengths
are in place, the way `clearMarksOfLines` already does after the legs.
Nothing may be placed against a board it cannot see.

---

## 3. The order that has to hold

One obstacle pass per state of the board, and everything in it:

1. the axis numbers, both runs
2. the axis letters — `x` and `y`
3. the drawing: the pair, the legs, the dots
4. the face, where three sides close one
5. **the lengths**
6. the labels — the pair's two, and every corner's

A thing placed at step *n* sees everything from steps 1..*n−1*. That
is the whole of it. The lengths sit at 5 rather than 6 because a
length belongs to a side and has almost nowhere else to go, where a
label has eight directions and can be asked to move.

---

## 4. What must not break

- **The count-out's own squares and its total.** A row being counted
  writes its length in the one place the count is happening; that beat
  owns its own layout and must come out unchanged.
- **A length already found stays where it was found.** Screens 24 → 25
  → 26 carry AC's "4 units" forward; it must not jump when the next
  side is measured.
- **Lengths stay off the face** — `the-paper-gives-way` and the
  labelling work both settled that, and it stands.
- **The gaps labels keep** — measured at A 14.2, B 5.1, C 21.4 on
  screens 24 and 25 — do not change.
- No label or length lands on the axis numbering, which is what §0 is
  about, and that includes the axis LETTERS, not only the digits.
- Every screen that is clean today stays clean.

---

## 5. Acceptance — watched frame by frame, not once at the end

The check that found this is the check that proves it: sample every
screen from the moment it opens until it settles, and collect every
pair of written things whose boxes overlap. A still of the settled
board is not enough — screens 25 and 26 are clean at rest and screen
28 was not, and the worst of it was mid-animation.

- [ ] screen 28: none of the five collisions in §0, at any moment
- [ ] no length on an axis number or an axis letter, on any screen
- [ ] no label on a length, and no length on a label
- [ ] screens 24, 25, 26 still clean throughout
- [ ] AC's length does not move between 24, 25 and 26
- [ ] the count-out beats are untouched
- [ ] a full play-through raises no exceptions

---

## 6. Built — 21 Sep 2026, and what it did not reach

### What changed

**The lengths go through the rule.** `placeLegLength` and
`showSegResult` still work out where they would LIKE to be with their
own arithmetic — which is what keeps every length that reads properly
today exactly where it is, the count-out's included — and then hand
that to `Board.seatLength`. If the place is free it is kept. If it is
not, the block goes to `placeBlock` **from the middle of its own
side**, one gap out, pointing away from the shape.

Starting that search from the length's own preferred position instead
was the first attempt and it was worse than doing nothing: a bad
position is a bad place to look outward from, and it put the two legs'
lengths on top of each other. The midpoint is not a detail.

**A length inks itself**, with the node as its owner, so re-placing it
supersedes rather than duplicates.

**The pass knows about the lengths before any label is placed** —
§3's step 5 — because a length belongs to a side and has almost
nowhere else to go, where a label has eight directions.

**The numbering's boxes come from the numbers themselves.** The old
band started exactly at the axis and the glyphs do not: they are
centred a little below it and reach above its line, so a label could
sit on the top of a 5 while clearing the band that was supposed to
describe it.

**A few square pixels is a graze, not a collision.** The dots are
inked at their radius plus four, so a label hugging its own point at
the measured gap clips the NEXT point's box by a pixel or two.
Demanding a dead-zero score threw away every direction over that and
fell through to the least-bad.

### One thing in §4 that could not be kept

**C's gap on screens 24 and 25 is 33px, not 21.4.** §4 asks for both
"no label on a length" and "the gaps do not change", and C cannot have
both: its 21.4 was only ever available because it was sitting on "4
units". It keeps off the length now and stands further out. The check
that guards the gaps was raised from 26 to 36 to say so rather than to
hide it.

### What this did not reach

Screen 28 still shows **three kinds of overlap, all transient**:

```
   "C"       ON  the axis number 6      at 250ms and 12250ms
   "(6, 1)"  ON  the axis number 5      at 500-750ms and 11500ms
   "(6, 1)"  ON  "4 units"              4 x 4 px at 3000ms
```

The two from the picture — `"C"` through `"3 units"`, and `"3 units"`
across the x-axis letter — are gone, and so is length-on-length. What
is left happens **only while the camera is moving**: the screen
opening, and the push-in that makes room for the working. The board is
**clean from 14 seconds onward** and stays clean.

These are not bad choices by the rule. They are the label still
sitting where the previous camera left it, because a re-lay-out has not
run yet at that frame. Fixing it properly means re-placing on the
camera's own clock rather than on the beat's — which is a change to
when the board lays itself out, not to how, and belongs in its own
prompt.

§5's first box therefore does NOT tick: screen 28 is not free of all
five collisions at every moment. It is free of them once settled, and
free of the two worst at every moment.

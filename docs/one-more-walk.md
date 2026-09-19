# Build prompt — one more walk

The beat after the closer café. Same town, new question, and this time
nobody helps.

**Read section 0 of `docs/horizontal-distance-animation.md` first.** Then
`docs/closer-cafe.md`, which built the beat this one follows — it owns
the town, the map layer, and the working; this adds to all three rather
than building anything new.

---

## 0. What I could not see

The reference image did not come through, so three things here are my
reading of your words rather than of a picture. Each is one line to
overrule, and nothing else in the prompt depends on which way it goes:

- **The two places** are the school at `(5, -4)` and the park at
  `(-3, 2)` — §3 says why. *(This section first said `(-4, -2)` and
  `(4, 4)`; §11 records the two things the build found wrong with
  them.)*
- **"show Café A and 2"** I have read as: the close puts *both* walks on
  the board together — this one and the café one — so the child sees
  the method twice on one picture. If it meant something else, say so.
- **The incorrect feedback** is the `d = √((x₂ - x₁)² + (y₂ - y₁)²)`
  slide you sent before, substituted line by line. Screen 45 already
  does exactly that; this reuses it.

---

## 1. What this beat is for

### 1.1 What the last one left undone

The café beat asked the child to *recognise* a distance question, and it
gave them something to lean on while they did: two answers, a
comparison, and — if they missed twice — a guided walk through one of
the two distances with her beside them.

None of that is here. One question, asked outright, answered alone:

> Maya walks from the school to the park. How far is that?

That is the last rung of the scaffold the café beat started on. They
tried, they were shown, and now they do it on their own — which is the
only step that tells anybody, the child included, whether it landed.

### 1.2 The one thing it makes harder

Every distance this game has worked has had both points in the first
quadrant, so every subtraction has been `6 - 2` and `5 - 1`: two
positive numbers, larger first. **This pair straddles both axes.** The
working reads

```
d = √((-3 - 5)² + (2 - (-4))²)
```

`2 - (-4)`. That is the single step of the distance formula children
actually get wrong, and it is the reason this beat exists rather than
being a second café with different numbers. The lesson has already
earned it: screens 15-18 worked `2 - (-3)` on a column, slowly, with
the board building the subtraction. This is the first time it has to be
done inside the formula, unaided.

Nothing on the screen should point at it. A child who has understood
the column screens will do it; a child who has not will get `4 - 4 = 0`
and an answer of 6, and the working will show them exactly where — which
is what the working is for.

### 1.3 What they can do when it ends

Take two points anywhere on the plane — not just up and to the right —
and find the distance between them, unprompted.

---

## 2. What the child sees, in order

1. **The leaves sweep.** The same town comes back, with two more places
   on it: the **school** and the **park**.
2. **Swifty flies in** and says *"Now this one."* — then asks how far
   Maya walks from the school to the park.
3. **The control comes up.** The child answers.
4. **Right**, and she says so.
5. **Wrong once** — one nudge, and another go.
6. **Wrong twice** — the asking stops and the working is written out,
   one line at a time, lighting the board as it goes.
7. **The close**: both walks on the board together, hers and theirs.

Three beats: the question, its working, the close. No guided path — the
working *is* the guidance, and it comes without being asked for after
the second miss.

---

## 3. The two places

| | where | why |
|---|---|---|
| School | **`(5, -4)`** | fourth quadrant: below the axis, right of it |
| Park | **`(-3, 2)`** | second quadrant: above the axis, left of it |

- across: `-3 - 5 = **-8**`, so **8** apart
- up: `2 - (-4) = **6**`
- `d = √(8² + 6²) = √(64 + 36) = √100 = **10**`

Four things those numbers are doing, all of which must survive an edit:

- **Both subtractions cross zero.** That is the whole point of the beat
  — see §1.2.
- **The answer is whole.** 10. A child who does the work right knows
  they are right, without being told.
- **It is a 6-8-10** — the 3-4-5 of the café beat, doubled. A child who
  notices that has noticed something real, and the working shows it
  plainly enough that some will.
- **It fits the numbered board** on both axes (`x -6..6`, `y -5..5`) with
  room above each marker for its building and its pill — the rule
  `closer-cafe.md` §4.1 records, learned the hard way.
- **It is not the café walk's line.** This one falls to the left where
  that one rises to the right. Two walks on one picture only read as
  two if they are not the same slope — see §11.

**A common wrong answer is 6**, from `2 - 4` or from counting only the
rise. Do not special-case it: the working answers it better than any
message could.

### 3.1 Drawn the way the town is drawn

Two more entries in `GRID.TOWN`, exactly like the three already there:
a dot on the coordinate, the coordinates under it in the board's own
label, a building above, a name pill above that. `kind: 'school'` and
`kind: 'park'` — two more CSS buildings in `css/town.css`, in the same
flat marker style as the cafés, not a storybook.

Give them their own two pill colours, distinct from the three in use
(teal, red, violet) — the map now has five places on it and a child
should be able to tell them apart at a glance, with the names still on
every one of them.

**The cafés and the house stay on the map.** This is the same town and
the child has been in it; taking them away to make room would make it a
different place and cost the beat the one thing it has for free. The
five markers must not overlap each other or any axis number — that is
what §3's coordinates are for.

---

## 4. Her part

**Two sentences, and the second is the question.**

> *"Now this one."* … *"Maya walks from the school to the park. How far
> is that?"*

*"Now this one"* is doing real work: it says this is the same kind of
thing they have just seen, which is what lets a child reach for the
method instead of waiting to be told which one to use. It is not a new
topic and should not sound like one.

She flies in through the leaves to her ordinary speaking mark — **not**
onto a button. There are no buttons here; the café beat put her on one
because there were two answers to stand between, and this beat has a
number to type instead.

---

## 5. The control, and the ladder

The game's own control — the combination lock, as everywhere else. The
answer is **10**, so the range must reach it.

One rung, then the working:

- **Wrong once**: *"Not quite. Count across, then up — watch the
  minus signs."*

  That names the trap without solving it. It is the one place in this
  beat where the child is pointed at anything, and it earns its place:
  a child stuck on `2 - (-4)` will be stuck all day without it, and a
  child who is not stuck loses nothing by reading it.

- **Wrong twice**: the asking stops. Nothing is asked a third time.

---

## 6. The working

Written in the formula panel, one line at a time, about a second and a
half apart — the reading time for a line of algebra, and a working that
arrives faster than it can be read teaches nothing.

```
d = √((x₂ - x₁)² + (y₂ - y₁)²)

d = √((-3 - 5)² + (2 - (-4))²)

d = √(8² + 6²)

d = √(64 + 36)

d = √100 = 10
```

Five lines, one idea each: the formula they were taught; **this pair's
own numbers put into it, brackets and all**; the subtraction done; the
squares; the root.

The second line is the one that matters here, and it must be written
with its brackets — `(2 - (-4))`, not `2 - -4`. The bracket is what
makes the minus-a-minus visible instead of a typo.

**Light the board as each line arrives**, exactly as screen 45 does: the
`8` and the `64` belong to the run across, the `6` and the `36` to the
step up, the `100` and the `10` to the line itself. The two legs go down
on the map as the substitution begins — held back until then, so a
triangle drawn round the line never hands the child the two numbers the
working exists to find.

---

## 7. The close — two walks, one picture

She comes back with both distances on the board at once: **this walk,
10 units, and the café walk, 5 units**, each on its own line.

> *"Two walks, one way to measure them."*

That is the whole reason this beat is worth building rather than
stopping at the café. One worked example is a trick that happened to
work; two on the same picture, with different numbers, in different
quadrants, is a method. The child should leave looking at the second
thing, not the first.

Both lines drawn, both lengths written, nothing else moving. Then the
game ends.

---

## 8. How to build it

1. **Two screens at the end of `SCRIPT`**, after 46: the question and
   the close.
2. **Two more places in `GRID.TOWN`**, and two more buildings in
   `css/town.css`. The town layer already places whatever it is given,
   in cells, and follows the board.
3. **The question is the shape screen 45 already has** — `entry: true`,
   `intro: 'measure'`, `task.kind: 'entry'`, `legsLater: true`, its own
   `feedback` and `formula`, `showWorking`. Copy the shape, not the
   numbers.
4. **The close reuses the example slot**, as screen 46 does, to draw the
   café walk beside this one — with `quiet: true` on any point the
   other line already names.
5. **Every spoken line in config**, in one place.
6. Everything through the game's own `later()`, never a bare
   `setTimeout`.

---

## 9. What must not break

**The teaching**

- **Nothing points at the negative** before the child has tried.
- **One nudge, then the working.** No third ask.
- The working writes `(2 - (-4))` **with its brackets**.
- Both legs are on the map before the substitution begins.
- The close carries **both** walks, and says they were measured the same
  way.

**The build**

- Every screen before this one is untouched.
- The coordinate labels are the game's own — same size, same gap off the
  dot, same halo — and they sit near their points at whatever size the
  camera is setting them.
- No marker covers an axis number, another marker, or another's label.
- The five places never overlap.
- A square stays square.
- Back and Next leave the beat sane from either direction.
- The game still ends after it.

---

## 10. Acceptance — in a browser, watching it

- [ ] the leaves sweep and the town comes back with five places on it,
      each on its own coordinate, each labelled once
- [ ] she flies in, says *"Now this one."*, and asks the question
- [ ] the lock comes up and reaches 10
- [ ] a right answer is taken and said to be right
- [ ] one wrong answer gets the nudge about the minus signs
- [ ] the **second** ends the asking — not a third time
- [ ] the two legs go down as the working starts, not before
- [ ] the working arrives one line at a time, readable at the pace it
      comes, and line two shows `(-3 - 5)² + (2 - (-4))²` with its
      brackets
- [ ] each line lights the part of the board it names
- [ ] it ends on `d = √100 = 10`
- [ ] the close shows **both** walks — 10 units and 5 units — and she
      says they were measured the same way
- [ ] every other screen in the game is unchanged

---

## 11. Built — 18 Sep 2026

Every box in §10 ticks, watched in headless Chrome as well as checked in
the Node harness. Screens **47** and **48**, after the closing café.

**The coordinates moved twice, and both moves were forced by §3's own
rule** that a marker needs the room it stands in:

1. The prompt's `(-4, -2)` and `(4, 4)` do not survive it. A place is
   drawn standing ON its coordinate, a cell and a half wide and nearly
   two tall — so `(4, 4)` is one column from Café A on the same row and
   the two markers overlap by half of one, and `(-4, -2)` rises into
   the row the x-axis numbers live in. First move: `(-5, -3)` and
   `(3, 3)`.
2. **That pair had the café walk's own gradient.** 6/8 and 3/4 are the
   same slope, and the two lines passed within a cell and a half of
   each other — so the closing screen, whose whole job is *two* walks,
   drew what read as one long line with both lengths stacked on top of
   each other where they crossed. Second move: **school `(5, -4)`,
   park `(-3, 2)`**, which falls to the left where the café walk rises
   to the right.

Everything the beat is for survives both moves: 8 across, 6 up, a whole
10, and both subtractions crossing zero — `-3 - 5` and `2 - (-4)`.

**Two new places** in `GRID.TOWN`, derived from their coordinates like
the other three, with two more CSS buildings — a school with a bell
gable, and a park that is trees on grass rather than a fourth shop
front. Two more pill colours, blue and green, with every name still
written on every pill.

**The question is screen 45's shape** — `intro: 'measure'`, `entry`,
`legsLater`, its own ladder and working — and the close is screen 46's,
with the café walk in the example slot.

One thing the spec did not anticipate: **the working's triangle stayed
up on the close.** It was the working's own scaffolding and the closing
screen is about the two walks, not about how one of them was worked
out — so `dropLegs` now takes it away, the way `dropMarks` already
takes away a place marked on an earlier beat.

Probes: `qa-walk2.js` is new — the numbers the beat is built on
(a whole 10, both subtractions crossing zero, and **not** the café
walk's gradient), five markers clear of each other and of the axis
numbering, the substitution keeping its brackets, and a miss of 6
behaving as a miss. `qa-cafe.js` learned that 46 is no longer the last
screen. Suite is at its five standing reds. Browser capture:
`cdp-walk2.js`.

**Still to record:** every line on these two screens.

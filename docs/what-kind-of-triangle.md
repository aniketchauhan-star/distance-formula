# Build prompt — what kind of triangle is this park?

One question and a six-screen repair. Screens **55 to 61**, and this
becomes the last thing in the game.

**Read section 0 of `docs/horizontal-distance-animation.md` first.** Then
`docs/towers-and-the-rescue.md` — this beat is that one's repair pattern
done again for a different kind of question, and §11 of it lists what
the last build changed.

---

## 0. What is mine to decide, and what is yours

Two of these are preferences. The third is not.

- **The mascot.** The mock shows a girl in a park. **I have kept
  Swifty**, for the same reason as last time: a game that changes its
  guide in the last five minutes throws away the only relationship it
  has built. The park can be the backdrop.
- **The park inside the triangle.** Trees, a pond, a bench, drawn inside
  the green fill. That is a `town.js`-sized piece of art and CSS. The
  beat works with the triangle simply filled green — the board already
  shades a triangle's face — and the scenery can arrive later.
- **The coordinates have to change.** Not a preference: §1.2. The mock's
  triangle cannot be measured by a child, and its shape gives the answer
  away.

---

## 1. What this beat is for

### 1.1 The method in service of something else

Every question in this game so far has been *"how far?"*. This one is
*"what kind?"* — and the only way to answer it is to measure three
distances and compare them. The distance formula stops being the point
and becomes the tool, which is the last thing that has to happen before
a child can be said to have learned it.

That makes it the right **ending**. Screen 54's closing line — *"From
zero, the coordinates are the distance."* — becomes that beat's own last
word rather than the game's.

### 1.2 The mock's triangle cannot be measured

`A(−6, 8)`, `B(8, −2)`, `C(−4, −6)` gives

```
AB = √296 = 17.20…      BC = √160 = 12.64…      AC = √200 = 14.14…
```

**Not one of them is a whole number**, and screens 2, 3 and 4 ask the
learner to work out each side and give it. There is no number a child
can type. Every answer in this game is whole, on purpose: *"a child who
does the work right knows they are right, without being told."*

Three ways out, and I have taken the third:

- **Ask for the squares** — `AB² = 296`, `BC² = 160`, `AC² = 200`. Whole,
  and sufficient: if the squares differ the sides differ. It is a real
  idea and I nearly chose it. Against: it changes what is written on
  every side from `AB = 15 units` to `AB² = 296`, which is not what the
  rest of the game writes, and it asks a child to trust a step they have
  not been shown.
- **Ask for the lengths to one decimal place.** No.
- **Move the triangle so all three sides are whole.** §3.

### 1.3 And the mock's shape gives the answer away

This matters as much as the arithmetic. 17.2, 12.6 and 14.1 make a
triangle that is *visibly* lopsided. A child looks at it, says
"scalene", and is right — without measuring anything. The question has
tested nothing and the repair never runs.

**The triangle has to look like it might be equilateral.** Then the eye
says one thing, the arithmetic says another, and the gap between them is
the entire lesson: *you cannot tell by looking.* That is what this beat
is for, and it is why the numbers in §3 are what they are.

### 1.4 What they can do when it ends

Take any three points, find the three distances, and say what the
triangle is — and know that looking at it was never going to be enough.

---

## 2. What the child sees, in order

1. **The park.** A triangle on the board with its three corners
   labelled, and the question, and three cards to choose from.
2. **Right** — she says so, and the game ends.
3. **Wrong** — *"Oops! Let's check the sides."* The cards fade.
4. **One side lights.** The other two step back. *"First, find AB."*
   They work it out and the answer stays written on that side.
5. **The second side.** Then **the third**.
6. **All three at once**, with their lengths. *"What do you notice?"* —
   All equal · Two equal · All different.
7. **The question again.** Now they can answer it.

---

## 3. The triangle

**13 – 14 – 15.**

| | |
|---|---|
| A | **(−8, −1)** |
| B | **(4, −6)** |
| C | **(4, 8)** |

*(Built at `A(−6, −2)`, `B(6, −7)`, `C(6, 7)` — the same 13-14-15,
translated so it is centred on the origin with clear rows past each
apex. See §10.2.)*
| AB | **13** |
| BC | **14** |
| CA | **15** |

Five things those numbers are doing, all of which must survive an edit:

- **Every side is whole.** Three clean answers on the reel.
- **All three are different**, so the answer is Scalene — and scalene is
  the one classification you cannot make by eye. Isosceles and
  equilateral announce themselves; scalene has to be *proved*, by
  showing no two sides match.
- **It looks almost equilateral.** 13, 14 and 15 are within 15% of each
  other. A child who guesses by looking says equilateral, or isosceles,
  and is wrong. That is the beat working as designed — see §1.3.
- **It is the only one.** Searching every lattice triangle out to ±10
  with whole sides, all different, none shorter than 7: **13-14-15 is
  the only near-equilateral one there is.** Everything else is 9-12-15
  or 8-15-17 — obviously lopsided, and no use here. This is not a number
  that can be swapped for taste.
- **One side is vertical** — BC, from (4, −6) to (4, 8). That is a gift,
  not a flaw: it is the one side a child can *count*, which makes it the
  natural first rung, and it quietly makes the point that the other two
  cannot be counted and need the formula.

*(Every lattice placement of 13-14-15 has exactly one axis-parallel
side. There is no version of this triangle without one.)*

**A common wrong answer is Equilateral.** Do not special-case it; the
repair answers it better than any message could.

---

## 4. The question, and the three cards

> **"What kind of triangle is this park?"**
> *Find the lengths of the sides and choose the correct option.*

**The cards carry diagrams, not just words** — and this is the one place
I would spend new design effort. Each card shows a small triangle with
**tick marks on the sides that are equal**: none on the scalene, a pair
on the isosceles, three on the equilateral.

Those tick marks are not decoration. They are the standard notation for
"these two are the same length", and this whole beat is about which
sides are the same length. A child who has seen the notation three times
on these cards has been taught it for free, and the cards stop being
three words to be recognised and become three *definitions* to be
matched against what they measured.

**The hint**, one rung:

> *"Measure all three. Looking is not enough."*

Not the mock's *"Compare the three lengths"*, which assumes they already
have three lengths — the thing they have not got yet.

**The ladder is one rung and then the repair**, not a working:

- **Wrong once**: *"Have another look at the three sides."* Another go.
- **Wrong twice**: the asking stops and the repair takes over. She says
  so on the next screen, not this one.

---

## 5. The repair  *(screens 56–61)*

### 5.1 Six screens is a lot, and here is the bound

The rule everywhere is *nothing is asked a third time*, and
`one-question-better.md` §4.1 settles why a **decomposition** is not a
re-ask: the repair asks *different* questions, each answerable by a
child who could not answer the first. That holds here — "how long is
AB?" is not "what kind of triangle is this?".

But five more asks in a row needs its own bound, so:

- **Each of the three side questions gets one nudge, then it is worked
  out for them** — the game's own working, written on the paper, which
  it already does when a ladder runs out.
- **Nothing is ever asked twice.** A child who misses everything still
  reaches the end in six screens.
- **Every side that has been found stays written on the board.** By
  screen 60 all three lengths are up, and they got there one at a time.

### 5.2 — *"Oops! Let's check the sides."*  (56)

The triangle stays exactly as it is. The three cards fade out. Nothing
else happens.

One line, one beat, nothing to do — the same job screens 43 and 50 do,
and for the same reason: the next screen must not land on a child who is
still absorbing being wrong.

### 5.3 — *"First, find AB."*  (57)

**AB lights and the other two sides step back.** The two coordinates it
runs between stay readable; everything else on the board hushes.

The reel comes up. **AB = 13.**

Right, and **13 units stays written on AB** for the rest of the beat.

### 5.4 — *"Now find BC."*  (58)  and  *"One more. Find CA."*  (59)

The same shape, twice. Each time the side being asked about is the loud
one and the sides already found keep their lengths and step back — so
the board fills up in front of them.

**BC = 14**, and it is the vertical one: a child may count it rather
than compute it, and that is allowed. Counting a side you can count is
not cheating; it is knowing which tool a job needs.

**CA = 15.**

### 5.5 — *"What do you notice about the side lengths?"*  (60)

All three sides at full strength, all three lengths written:

```
AB = 13 units      BC = 14 units      CA = 15 units
```

> **All equal** · **Two equal** · **All different**

**This is the most important screen in the beat**, and it is the one a
build is most likely to treat as a formality. It is where three numbers
turn into a property. A child can compute all three sides perfectly and
still not see that "13, 14, 15" *means* something — this screen is the
step that makes them say it.

It is also the screen that catches the near-miss: 13 and 14 are close,
and a child who has been thinking "they look about the same" has to
decide, out loud, whether about-the-same counts. It does not.

One nudge if they miss: *"Are any two of them the same number?"*

### 5.6 — *"So, which triangle is it?"*  (61)

The three cards come back, with the three lengths still on the board.

> Scalene · Isosceles · Equilateral

They choose **Scalene**, the tick-marked card lights, and she says so.

The loop the child opened by getting it wrong is closed by them getting
it right — on the same question, with the same three cards, having done
the work in between. That is worth a whole screen and it is why the
repair does not simply end on screen 60.

**And then the game ends.**

---

## 6. The board

`A(−8, −1)`, `B(4, −6)`, `C(4, 8)` spans 12 across and 14 up. Neither
existing board fits it well: `close` (x −6..6, y −5..5) is far too
small, and on `wide` (x −15..15, y −13..13, 35px cells) the triangle is
fourteen small cells tall in a large empty sheet.

**A third range**, between the two:

| board | x | y | numbered every | cell |
|---|---|---|---|---|
| `close` | −6..6 | −5..5 | 1 | 88 |
| **`mid` (new)** | **−10..10** | **−8..8** | **1** | **~53** |
| `wide` | −15..15 | −13..13 | 5 | 35 |

`setRange` already does this — `towers-and-the-rescue.md` §11 built it,
and a range is six numbers in `GRID.ranges`. Numbered every unit at
53px a cell: every corner lands on an intersection and can still be
counted to, which is the rule that matters.

---

## 7. How to build it

1. **Seven screens at the end of `SCRIPT`**: 55 the question, 56–61 the
   repair. Screen 54 stops being the last beat.
2. **The three sides are the pieces the board already has.** Draw the
   triangle as `segment: A–B` plus `legs: [B→C, C→A]`, and the board's
   own three parts line up with the three sides: `ab` is AB, `h` is BC,
   `v` is CA. Then everything the repair needs is built —
   `spotlightPart('ab' | 'h' | 'v')` lights one side and hushes the
   rest, `showLegLength(i)` and `showSegResult` write a length on its
   own side, and `task.measureLeg` asks about one. **Do not draw the
   right-angle marker**: there is no right angle here.
3. **`rightAt` and `teachAt`** carry the flow, as they do on 49: right
   at 55 steps to the end, spent at 55 walks into 56.
4. **The `mid` range** is §6 — six numbers in config.
5. **The answer cards gain diagrams.** `triangle-options.js` already
   takes a `cls` per choice; the tick-marked triangle is an inline SVG
   or a CSS drawing inside the button, above its label.
6. **Screens 57–59 are one shape three times** — the same entry
   question with a different side lit and a different answer. Whatever
   is written for the first should be what the other two use.
7. **Every spoken line in config**, every duration in config, and
   everything through the game's own `later()`.

---

## 8. What must not break

**The teaching**

- **The triangle looks like it might be equilateral.** If an edit makes
  it obviously lopsided, the beat has lost its reason to exist.
- **All three sides are whole and all three are different.**
- **Nothing is asked twice** — not the question, not any side, not the
  comparison.
- **Each side's length stays on the board** once it is found.
- Screen 60 asks what the numbers *mean* before screen 61 asks for the
  name.
- No right-angle marker, and no claim that this triangle has one.

**The build**

- **Every screen before 55 is untouched**, on the boards they already
  use.
- A right answer at 55 never shows the repair; a wrong one never returns
  to 55 before the repair is done.
- Back and Next replay each of the seven cleanly, from either direction,
  with no side left lit and no length left written.
- The picker can land on any of the seven and each draws its own
  triangle — the rule `qa-picked` enforces.
- Every corner sits on a gridline, and no label lands on an axis number,
  another label, or another corner.
- The reel's range reaches 15 and leaves room to overshoot.
- The game still ends after 61.

---

## 9. Acceptance — in a browser, watching it

- [ ] 55 draws the triangle with A, B and C and their coordinates, and
      asks what kind of triangle it is
- [ ] the three cards show tick-marked diagrams, not just words
- [ ] the hint says measuring is the only way, not "compare the lengths"
- [ ] Scalene is taken, and the game ends
- [ ] one wrong answer gets one nudge; the **second** starts the repair
- [ ] 56 says *"Oops! Let's check the sides."* and fades the cards, and
      the triangle does not move
- [ ] 57 lights AB alone, asks for it, and **13 units** stays on that
      side afterwards
- [ ] 58 does the same for BC — **14** — with AB's length still up
- [ ] 59 does the same for CA — **15** — with both of the others up
- [ ] each of the three writes its working out on the paper if its
      one nudge is spent, and none of them is asked a third time
- [ ] 60 brings all three sides up together with all three lengths, and
      asks what the child notices
- [ ] *All different* is right; *Two equal* gets one nudge
- [ ] 61 brings the three cards back and Scalene is right
- [ ] the board is the new `mid` one, numbered every unit, with all
      three corners on intersections
- [ ] every screen from 1 to 54 is unchanged

---

## 10. Built — 19 Sep 2026

Every box in §9 ticks, watched in headless Chrome as well as checked in
the Node harness. Screens **55 to 61**, and the game ends on 61.

### 10.1 The beat, as it plays

```
[55]  "What kind of triangle is this park?"   A(-6,-2) B(6,-7) C(6,7)
      Scalene · Isosceles · Equilateral        each card drawn, with its marks
      right -> the game ends        two wrong -> the repair
[56]  "Oops! Let's check the sides."           the cards go, the triangle stays
[57]  "First, find AB."      AB lights alone   13 -> stays on AB
[58]  "Now find BC."         BC lights alone   14 -> stays on BC
[59]  "One more. Find CA."   CA lights alone   15 -> stays on CA
[60]  "What do you notice about the side lengths?"
      All equal · Two equal · All different
[61]  "So, which triangle is it?"              the same three cards, and Scalene
```

### 10.2 What the spec did not anticipate

**The triangle moved, and the sides did not.** §3's `A(−8, −1)`,
`B(4, −6)`, `C(4, 8)` is 13-14-15 but it is not centred — it leans two
cells left and one down, and its apex has three cells of headroom on one
side and none to spare on the other. Translating a triangle changes no
distance, so it is placed at **`A(−6, −2)`, `B(6, −7)`, `C(6, 7)`**:
the same 13-14-15, centred on the origin, with three clear rows past
each apex for its label.

**A right answer on the last question has nowhere to branch to.**
`task.rightAt` names the screen to step to, and on 55 that is "past the
beats that teach it" — of which there are none, because they are the end
of the game. `rightAt: 'end'` says so; `nextIndex` returns one past the
last screen and both Next and the hand-over already stop there. Written
as a number it would have fallen through to the next screen, which is
the first beat of the repair.

**Screen 58 must NOT step the board back.** Every other beat here reads
the board, and `quietBoard` is right for them. 58 asks a child to
*count* the vertical side — and counting squares needs the squares.
`qa-examples` caught it, which is the probe doing exactly the job its
own comment claims.

### 10.3 Four things the board had never been asked to do

The board has drawn two-legged right-angled paths for the whole lesson.
A triangle with three ordinary sides asks four new things of it, and
each was wrong in the same way: a shortcut that is exact while a leg
runs along a row or a column.

1. **A leg's length was `|dx| + |dy|`.** Identical to the real length
   for every leg that had ever existed, and 21 for a side of length 15.
   Measured properly now; an axis-parallel leg is unchanged, one of the
   two terms being zero.
2. **A typed answer was always checked against the pair.** `checkEntry`
   derived the answer from the screen's segment, so a question about a
   *side* was marked against the length of a different side. It now asks
   which two points the question is about — the named leg, or the pair.
3. **A changed range left the board with no axes.** `setRange` makes new
   axis lines the way the board makes them at the start of a screen:
   dashed out of sight, waiting for the sweep. A screen that changes
   range without being rebuilt gets no sweep, so the `mid` board came up
   as bare paper with no axes and no numbers at all. They are put into
   the state the ones they replaced were in.
4. **A vertical side's length wrote across the x-axis numbering.** BC's
   middle is level with the axis, so "14 units" landed on the 3, 4 and
   5. It slides along its own side until it is out of that row — the
   same courtesy `showSegResult` already does for a pair.

And one thing that is new rather than broken: **`task.keepLength`**,
which writes a measured length on the side it measures and leaves it
there. Three sides found one at a time only make an argument if the
board fills up in front of the child.

### 10.4 The cards

`marks: 0 | 2 | 3` on a choice draws a triangle on its card with that
many hash marks. Scalene leans and carries none; the other two are
symmetric, because a child should be able to see the symmetry the marks
are claiming. `optionTrio` puts the three side by side rather than
stacked, for the same reason the pair layout exists: three of one kind
of thing are not a list to work down.

Screen 60's three answers are about the numbers, not the shapes, so they
carry no drawings — which is checked, because a card that drew a
triangle there would be answering its own question.

### 10.5 Probes

New: **`qa-park`** — the three sides whole, all different and within
15% of each other (so the eye is fooled), the three of them closing into
one triangle with each corner named once, every corner on an
intersection of the `mid` board, the cards and their marks, the branch
both ways, the lengths accumulating one per screen, and 60 asking about
numbers while 61 asks about names.

Taught: `qa-onelen` and `qa-pyth2` (a leg's length, not its perimeter),
`qa-dashleg` (a side the question *introduces* is laid down dotted; a
side of a shape already drawn is measured where it is — `settled` says
which), `qa-examples` (the park beats read the board, all but 58),
`qa-typedwork` (as many lit parts as the screen's own working has,
rather than the seven the Pythagoras screens happen to carry),
`qa-typedwork` and `qa-pyth2` and `qa-tripulse` (a walk that answers
everything correctly steps over the screens it is hunting, now that a
branch can end the game), and `qa-towers` (54 is no longer the last
beat — what is claimed now is that nothing after it re-teaches the
method).

Suite: **92 green, 4 red** — `qa-sel`, `qa-tap2`, `qa-tap3`, `qa-taps`,
the standing four.

Browser capture: `cdp-park.js`.

**Still to record:** every line on all seven screens.

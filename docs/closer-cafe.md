# Build prompt — the closer café

The last beat of the game, and the only one that does not look like
maths. Everything before it teaches the distance formula. This one finds
out whether the child can *reach for it unprompted* — and teaches them
properly if they cannot.

**Read section 0 of `docs/horizontal-distance-animation.md` first** —
every pitfall recorded there applies here. Then
`docs/labels-on-the-line.md`: this screen writes coordinates under
points on a board, and that file is the rule for how.

---

## 1. What this beat is for

### 1.1 Where the child is when they arrive

They have just been walked through the whole method, and every screen
that did it spoke the same language: *A*, *B*, *C*, legs, units, "find
the distance", a triangle already drawn on the board. The last four
screens even handed them the formula in symbols.

That means they can now **do** the formula when they are told to. It
does **not** mean they know what it is for. Those are different things,
and the gap between them is where most of school maths is lost.

### 1.2 What this asks that nothing before has

Nothing on this screen says *distance*, *triangle*, or *formula*. There
is a town, a house, two cafés, and a question a person would actually
ask:

> Maya wants to walk to the closer café. Which café is closer to her
> house?

The child has to do the one step the whole lesson has been building
toward and has never once been asked to do: **notice that this is a
distance question.** Recognising the problem is the skill. The
arithmetic after that is the easy half, and they already have it.

So: no letters on the points, no line drawn between anything, no legs,
no `d =` anywhere on screen. Every one of those is a hint, and putting
any of them there answers the question before it is asked.

### 1.3 The misconception it is built to catch

Café B is **6 units straight along a row** from the house. Café A is
**5 units, diagonally**. A child who thinks *distance means counting
along the grid* — which is what the first half of the game taught them,
truthfully but incompletely — will look at the picture and pick **B**,
because B is the one they can count.

That is not an accident of the numbers. It is the whole design:

- **B is countable and wrong.** It rewards the old method and punishes
  nothing else.
- **A is diagonal and right.** It is only reachable through the thing
  this game exists to teach.
- The two are **close** — 5 and 6 — so it cannot be got by eye. Looking
  harder does not help. Only measuring does.

A wrong answer here is therefore *information*, not failure: it says
exactly which idea has not landed. The screen should treat it that way.

### 1.4 What the child can do when this beat ends

1. Recognise "which is closer" as a distance question.
2. Choose which two points to measure between.
3. Apply the formula to points that were given as places, not as
   `(x₁, y₁)`.
4. Compare two distances and say what the comparison *means* for the
   person in the question.

The fourth is the one most often skipped, and it is the one that makes
the maths worth doing. It gets its own moment at the end.

---

## 2. The shape of the teaching

The beat is built on the oldest scaffold there is, and it should be
recognisable as such when you read the code:

| | on this screen |
|---|---|
| **You try** | the town, two cafés, one question, no help |
| **A miss is allowed** | one retry, and nothing else changes |
| **We do it together** | *"Oops! Let's find it together."* — the asking stops |
| **I show you one step** | *"First, find this distance."* — one distance, not both |
| **You finish it** | the child answers that distance themselves |
| **And if that misses too** | the working, written out, tied to the picture |
| **You say what it means** | 5 < 6, so Café A — the comparison made out loud |

Two rules sit over all of it:

- **Never re-ask a question the child has already failed twice.** A
  third attempt at the same question is not teaching; it is testing
  something you already know the answer to. After two misses the screen
  stops asking and starts showing.
- **Every piece of help hands the method back, never the answer.** The
  hint says how to measure. The guided step asks for a distance, not for
  a café. The working shows the substitution, not the conclusion. The
  child gets to be the one who decides which café — right up to the end.

---

## 3. What the child sees, in order

1. The leaves sweep. The board comes up carrying **a town**: two cafés
   and a house, each standing on its own coordinate.
2. **The two answers arrive** — `Café A` and `Café B` — and under them a
   quiet **`Need a hint?`** row.
3. **Then Swifty flies in**, perches on the **Café B** button, and asks
   the question.
4. Right, and she says so, and the game ends as it ends now.
5. Wrong once — one nudge, and the child tries again.
6. **Wrong twice** — *"Oops! Let's find it together."*
7. *"First, find this distance."* — the line from the house to **Café A**
   is drawn as she says it.
8. She leaves; the control comes up. How long is that line?
9. Wrong there, and the formula is substituted one line at a time, down
   to `d = √25 = 5`, lighting the board as it goes.
10. She comes back: **5 is less than 6, so Café A is closer.**

```
   ┌──────────────────────────────┐   ┌─────────────────┐
   │        ▣ Café A              │   │                 │
   │         (5, 4)               │   │  ┌────┐ ┌────┐  │
   │                              │   │  │ A  │ │ B  │  │
   │  ▣ Café B      ⌂ Maya's      │   │  └────┘ └──┬─┘  │
   │   (-5, 1)       (1, 1)       │   │      Swifty┘    │
   │ ───────────┼───────────────  │   │  ┌───────────┐  │
   │            │                 │   │  │ Need a    │  │
   └──────────────────────────────┘   │  │ hint?   v │  │
                                      │  └───────────┘  │
                                      └─────────────────┘
```

---

## 4. The town

### 4.1 Where the three places are, and why they moved

The reference picture puts the house at `(2, 3)`, Café A at `(6, 6)` and
Café B at `(-4, 3)`. **`(6, 6)` is off this board**: the ruling runs to
`y = 6` but the numbering stops at `5`, and on a map whose entire job is
to be read in coordinates, one of the three places cannot stand on an
unnumbered line. A child who tries to check it would find nothing to
check against.

So the town moves one square down and one square left. The problem is
untouched — same two distances, same 3-4-5 triangle, same answer:

| | reference | on this board |
|---|---|---|
| Maya's house | `(2, 3)` | **`(1, 1)`** |
| Café A | `(6, 6)` | **`(5, 4)`** |
| Café B | `(-4, 3)` | **`(-5, 1)`** |

- house → Café A: `√(4² + 3²) = √25 = **5**`
- house → Café B: `6 across, 0 up = **6**`

*(One row lower again than this section first said, and for a reason
only the build could find: a place is drawn standing ON its coordinate,
building and name pill above the dot, which is two cells of board. At
`y = 5` Café A's roof is off the paper. At `y = 4` it fits.)*

Two further things the numbers are doing, which must survive any change
to them:

- **Café B shares the house's row**, so its distance is countable
  without the formula. That is what makes it the tempting wrong
  answer.
- **Café A makes a 3-4-5 triangle**, so the right answer is a whole
  number. A child who does the work correctly gets a clean 5 and knows
  they are right. Nothing about this beat should hinge on arithmetic
  they cannot check.

If these coordinates are ever edited, keep both properties or the
teaching goes with them.

### 4.2 What each place is made of

Three parts, meaning three different things, so drawn as three
different things:

- **A dot on the coordinate** — the game's own plotted point, same size,
  same colour. This is where the place *is*.
- **Its coordinates under the dot**, exactly as every other pair in this
  game is labelled: same type, same halo, same air off the dot.
  `labels-on-the-line.md` is the rule. Do not hand-place these, and do
  not invent a second style of coordinate label on the last screen of
  the game.
- **The building above the dot**, with a **name pill** above that —
  `Café A` teal, `Café B` red, `Maya's House` purple, as the picture has
  them. The pill names it, the dot locates it, the coordinates say
  where. A child must be able to see that the building *is at* the dot,
  not merely near it.

**CSS, not new artwork.** Rounded roof, awning, door, windows — simple
shapes in the game's palette. These are markers on a grid and should
read as markers, not as an illustrated storybook.

**Not too big**: about a cell and a half wide, two cells tall including
the pill. Large enough to be a place; small enough that the grid beneath
is still a grid a child could count on. Nothing may cover an axis
number.

The trees, pond and fountain in the reference belong to another product.
They are not part of this. The board is the board.

### 4.3 Where they live in the DOM

Over the board, not inside the SVG: the buildings are CSS, and
`#gridAxes` is where measured things go. One layer positioned against
the panel, each place placed by the board's own coordinate arithmetic
(`Board.stagePos`), so a place stays on its coordinate when the panel
moves or the board is re-placed.

The **dots and coordinate labels are the segment's own**, plotted in the
SVG by `placeSegment` like every other pair. Do not redraw them in CSS:
they are measured things and must match the rest of the game to the
pixel.

---

## 5. The two answers, and the hint

### 5.1 The buttons

`Café A` and `Café B`, side by side, in the column every control in this
game lives in. The game already has this panel — the one the three
triangle names use (`options` + `task.kind: 'choice'`). Use it: two
choices instead of three, its own labels, the same component, the same
verdict, the same lock-out.

Colour them as the map does — **Café A red, Café B teal**, matching
their pills — so a child can see which button is which place. But the
colour is a second channel, never the only one: **both buttons carry
their names**, and the map carries the names too. A child who cannot
separate red from teal must lose nothing.

### 5.2 `Need a hint?`

New, and the only new control here. A quiet row under the buttons: bulb,
the words `Need a hint?`, a chevron. Tap to open one line; tap to close.

The teaching rules it must obey:

- **It is optional and invisible in its effect.** Nothing waits for it,
  nothing is disabled until it is opened, and the beat plays out the
  same whether it is touched or not. A child who does not need it must
  not be slowed by it; a child who does must not feel marked.
- **It gives the method, never the answer.** One sentence:
  *"Count across and up from the house to each café."* That points at
  how to measure. It does not point at Café A. The moment a hint names
  the answer it stops being a scaffold and becomes the solution.
- **One sentence only.** A paragraph of help is read as punishment.
- It stays open once opened, until the beat ends.
- It is quieter than the buttons — a pale outlined row against their
  solid fill — so it never competes with the thing the child is being
  asked to do.

---

## 6. Swifty's part

**There is no Maya on screen.** She is a person in the question, as she
is in the reference's text. The bird is the only character this game
has, and it stays that way — a second character introduced on the last
screen is a new thing to learn at the moment there is least reason to
learn one.

**The order is the reverse of every other question in the game.** Usually
she asks and the answers follow. Here the board, both buttons and the
hint are up *first*, and **she flies in afterwards** and lands on the
**Café B** button — on its top edge, the way she already perches on the
selector's frame — and asks from there.

That order is deliberate and it is pedagogical: the child looks at a
town with two cafés in it and has begun to wonder *before anyone says
anything*. Her line then lands on a question they have already started
asking themselves, which is the difference between being told a problem
and noticing one.

The flight is the game's own `entrance: 'fly'`. Her bubble must not
cover either button, the hint row, or any of the three places.

---

## 7. Wrong twice — where the teaching turns

**One retry, then she stops asking.**

The first wrong answer gets a short nudge and another go: it may have
been a slip, and a child who has nearly got it deserves the chance to
get it. The nudge must not narrow the field — *"Not quite — have
another look"*, not *"try the other one"*, which on a two-answer
question simply gives it away.

The second wrong answer is different in kind. Two misses on a two-choice
question means the method is not available to them, and asking again
would be asking a child to guess. So the asking ends.

**Beat one — *"Oops! Let's find it together."*** She comes off the
button to her speaking mark and says it, and nothing else moves. No
line, no control, no working. One sentence and a breath — the child
needs a moment to stop being wrong before they can start learning.

The word is *together*. Not "let me show you". What follows is a thing
they do, with her.

**Beat two — *"First, find this distance."*** As she says it, **the line
from the house to Café A is drawn** — the game's own segment stroke,
drawn from the house outward. The two buttons go; they are finished
with.

Three teaching decisions live in that one sentence:

- **One distance, not both.** They can already do Café B — it is a row,
  and rows are the first thing this game taught. Café A is the one that
  needs the formula, so it is the one that gets asked about. Asking for
  both would double the work and halve the attention for no teaching.
- **"First"** promises a second step. The child knows this is going
  somewhere and that they are not being marched through a solution.
- **It asks for a number, not for a café.** The conclusion stays theirs.

**Beat three — she leaves and the control comes up.** The reference
shows a typed box; **this game has one control** — the combination lock
that replaced both the slider and the typed pad. Use it. The answer is
**5**.

---

## 8. The working — if the distance is missed too

The ladder the rest of the game uses: one spoken nudge, then the working
is shown rather than the question asked a third time.

It is written in the formula panel, arriving **one line at a time** —
not all at once, and not character by character:

```
d = √((x₂ - x₁)² + (y₂ - y₁)²)

d = √((5 - 1)² + (5 - 2)²)

d = √(4² + 3²)

d = √(16 + 9)

d = √25 = 5
```

Five lines, roughly a second and a half apart, each landing whole. That
pacing is not decoration — it is the reading time a ten-year-old needs
to take in one line of algebra, and a working that arrives faster than
it can be read teaches nothing.

The five lines are chosen to be one idea each:

1. the formula they were taught, unchanged, so they recognise it;
2. **this town's own numbers put into it** — the substitution step, the
   one that is skipped most often and understood least;
3. the subtraction done, so `4` and `3` appear — and those are the two
   numbers they could have counted off the grid themselves;
4. the squares;
5. the root, and the answer.

**Light the board as each line arrives.** The game already tags parts of
a working with the side they name and lights that side of the picture as
the part appears. Do the same: `4` and `16` belong to the run across,
`3` and `9` to the step up, `25` and `5` to the line itself.

This is the single most important instruction in this section. The whole
difficulty of the distance formula is that it looks like symbol-pushing;
a child who sees the `4` in the formula light up the four squares they
could have counted is being shown that the algebra and the picture are
**the same object**. A working that runs in a panel while the board sits
still is just more algebra.

That means the two legs must be on the map by then — the run across from
the house and the step up to Café A, dropped from the line the way the
triangle screens drop theirs, at the moment the substitution begins.

---

## 9. The closing — say what the number means

She comes back and closes it:

> **"5 is less than 6 — so Café A is closer."**

Not *"Café A is closer"* on its own. The comparison is the step that
turns two numbers back into a decision about a person walking to a café,
and it is the step children skip: they compute 5, compute 6, and stop,
because the maths is finished. The maths being finished is not the
question being answered.

Both numbers must be **on the board** as she says it — the `5` on the
line to Café A and the `6` on the line to Café B — so the comparison is
something the child can see, not just something they are told. If Café
B's distance has never been measured out loud, measure it here: it is
one row, it costs a second, and without it there is nothing to compare
against.

Then the game ends.

---

## 10. How to build it

1. **New screens at the end of `SCRIPT`**, ids 42 onward, after 41 —
   the question, the two spoken beats, the distance question, and the
   closing line.
2. **The pair is a segment.** House and Café A are `segment.a` and
   `segment.b`; the line is drawn on beat two by the same `runSegment`
   every other pair uses, and the two legs are `legs`, as on the
   triangle screens. Café B is a third plotted point with a coordinate
   label like the others — a `found` mark or an example slot, whichever
   needs less new code.
3. **The town layer is presentation only.** One absolutely-positioned
   layer over `#gridPanel`, one element per place, placed by
   `Board.stagePos`, re-placed wherever the board is re-placed. It knows
   nothing about the question and nothing about the answer.
4. **Two choices through the existing panel.** `options` with two
   entries, `task: { kind: 'choice', answer: 'a' }`. If the panel
   assumes three, teach it two rather than forking it.
5. **The hint is its own small component**, mounted under the buttons,
   with its own CSS file the way the selector and the options panel have
   theirs. Open/closed is its whole state.
6. **The order of arrival belongs to the screen**, not the components:
   board, buttons, hint, then `entrance: 'fly'`. Everything through the
   game's own `later()`, never a bare `setTimeout`.
7. **The working is `task.formula`**, tagged `h` / `v` / `ab` exactly as
   screens 28-30 tag theirs, with `showWorking` once the ladder is
   spent.
8. **Every spoken line goes in config**, in one place, so the words can
   be changed without touching the code that says them.

---

## 11. What must not break

**The teaching**

- **Nothing on screen names the method before the child does.** No
  letters on the points, no line between anything, no `d =`, no
  triangle, until the guided path begins.
- **The hint never names a café.**
- **The first nudge never narrows a two-answer question to one.**
- **No question is asked a third time** after two misses.
- **The child, not the game, decides which café** — right up to the
  closing line.
- **The closing line states the comparison**, not just the winner.

**The build**

- **Every screen before this one is untouched.** This is added at the
  end; nothing in the lesson moves.
- **The coordinate labels are the game's own**, at the game's size, gap
  and halo. If they look like a different kind of label, they are wrong.
- **No building covers an axis number**, obscures the ruling, or lands
  on another place's label.
- **A square stays square.** The town is placed on the board, not fitted
  to it; buildings scale with the cells.
- **Nothing can be answered twice.** Once a café is chosen both buttons
  lock, as the triangle names do.
- **Colour is never the only signal** — every button and every place
  carries its name.
- **Back and Next** both leave this beat sane from either direction:
  the town whole, nothing half-drawn, no control left over from a
  previous attempt.
- **Swifty never stands on a button she is not perched on**, and her
  bubble never covers a control or a place.
- The game still ends after it.

---

## 12. Acceptance — in a browser, watching it

**The picture**

- [ ] the leaves sweep and the town comes up: two cafés, a house, three
      dots, three coordinate labels, three name pills
- [ ] every place stands on its own coordinate, dot on the exact
      crossing, building plainly *at* the dot
- [ ] the coordinates are written exactly as every other pair in the
      game — same size, same gap off the dot, same halo
- [ ] no square on the board is a rectangle at any moment

**The asking**

- [ ] the buttons arrive, then the hint row, and only then does Swifty
      fly in and land on the Café B button
- [ ] she asks from there, and her bubble covers nothing
- [ ] nothing on screen says *distance*, *triangle* or `d =` yet
- [ ] `Need a hint?` opens one sentence, turns its chevron, closes
      again — and does not name a café
- [ ] a right answer is said to be right, and the game ends
- [ ] one wrong answer gets a nudge that does not give the other one
      away

**The teaching**

- [ ] the **second** wrong answer ends the asking — the buttons lock and
      are not offered again
- [ ] she says *"Oops! Let's find it together."* with nothing else
      moving
- [ ] she says *"First, find this distance."* and the line from the
      house to Café A is drawn as she says it
- [ ] she leaves; the lock comes up asking for that distance, not for a
      café
- [ ] a right answer there is taken
- [ ] a wrong one writes the working, one line at a time, readable at
      the pace it arrives
- [ ] each line lights the part of the board it names — the run across,
      the step up, the line itself
- [ ] both legs are on the map before the substitution begins
- [ ] it ends on `d = √25 = 5`

**The close**

- [ ] both distances are on the board — 5 on Café A's line, 6 on Café
      B's
- [ ] she says the comparison, not just the winner
- [ ] every other screen in the game is unchanged

---

## 13. Built — 18 Sep 2026

Every box in §12 ticks, watched in headless Chrome as well as checked in
the Node harness. Screens **42-46**, after the y-axis case.

**The branch.** `Game.branch` is read once and cleared by
`nextIndex()`, which both `settle` and `skipScreen` go through — so a
child who gets it right never sees 43-45, Next follows the same route
the answer took, and `goTo` clears it so Back can never carry one into a
screen that did not ask for it. The two ends are declared on the task:
`rightAt: 46`, `teachAt: 43`.

**The town** is `js/town.js` + `css/town.css`, mounted inside
`#gridPanel` and re-placed by `Board.onPlaced` — a new hook at the foot
of `Board.place`, because anything drawn *over* the board has to follow
the box the same way the ruling does. `Board.cellSize()` gives it a
cell in stage pixels, and every size in `GRID.TOWN` is in cells, so the
buildings grow and shrink with the board. `pointer-events: none`
throughout: it sits over a board whose points are tappable.

Its three places are **derived from the three coordinates**, not listed
again beside them — the first version wrote both and the drawing sat one
row above the points it was drawn over for an hour before anyone noticed.

**The hint** is `js/hint-note.js` + `css/hint-note.css`, mounted *into*
the answer panel so it takes that panel's scale and column for nothing,
and `order: 2` puts it under the answers whatever order it is built in.

**The answers** are the existing panel taught two-in-a-row
(`Opts.setRow`, `.triangle-options-panel.pair`), which wraps so the hint
drops onto its own line beneath them.

**Her perch** is `Game.perchOn(key, done)`: it seats the rig on the
named button — `BOARD.perch`, worked out from the panel's own border,
padding and gap — and then uses the ordinary `flyIn`, which lands her
wherever `geom` says. No new flight.

### Four things the build turned up that were not in the spec

- **The leaf sweep could not be called off.** `FX.leaves` ran on plain
  timeouts, so `Game.clearPending` could not reach them: a screen change
  mid-sweep let the screen being *left* dress and plot itself onto the
  board of the screen just arrived at. It surfaced here because this
  beat follows a sweep, but it was reachable by any child pressing Next
  while the leaves were crossing. `leaves.cancel` now exists and
  `clearPending` uses it.
- **The y-axis case relied on being the last screen.** Its spoken line
  ends with a `settle`, which did nothing while nothing followed it.
  Give it something to advance to and the working is carried off before
  the answer reaches the segment. Her line there is now opened rather
  than `speak`ed, so the hand-over belongs to the working — which is
  what the un-arming of Next beside it always said.
- **A working could measure legs that were never switched on.**
  `showWorking` seats each leg and writes its length, and relied on
  `runLegs` having turned the group on. A screen that holds its triangle
  back until the substitution needs it (`legsLater`) has no `runLegs`,
  so both sides were measured invisibly. `Board.revealLeg` fixes it.
- **The nudge opened a balloon over the map.** Caught by `qa-optwork`:
  "have another look" was written up over the very thing it was sending
  the child back to. `voiceOnly` on the task, as screen 28 already does.

### Probes

`qa-cafe.js` is new — the numbers the beat is built on (5 and 6, B on
the house's row, A a 3-4-5), what screen 42 does and does not give away,
both sides of the branch, and the close. Five existing probes had to
learn something true rather than be silenced:

- `qa-dashleg`, `qa-legorder`, `qa-typedwork`, `qa-pyth2` walked the
  script answering everything correctly, which now steps over a screen
  that only exists for a child who missed. They take the teaching branch.
- `qa-legorder` also learned that a screen may hold its legs back, and
  asserts they are *not* there while the question is live.
- `qa-pyth2` asserted one screen's words of every screen: the PPT's
  ladder on the PPT's screens, each screen's own ladder rung by rung
  everywhere else, and a ladder is as long as the screen says it is.
- `qa-labelpair` counted columns as asymmetric rows — a column is
  asymmetric by design, and its own message says "rows".
- `qa-zoom` read the next screen's labels against this screen's view.
  It reads both at the same moment now.

Suite is at its five standing reds (`qa-optspend`, `qa-sel`, `qa-tap2`,
`qa-tap3`, `qa-taps`). Browser capture: `cdp-cafe.js` (the whole beat)
and `cdp-right.js` (the path a child who gets it right takes).

**Still to record:** every line on these five screens.

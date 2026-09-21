# Build prompt — one thing at a time, and nothing twice

Four things off the review, from the miss through to Pythagoras. Most
of them are the same fault wearing different clothes, so §1 names it
once and the rest of the document points back at it.

---

## 0. What I could not see

**The PPT.** §6 asks for the triangle question in "the exact text given
in the PPT/content", and I do not have it. Everything else in §6 is
built regardless of what that sentence turns out to be; the sentence
itself is one line to fill in. Where I have had to write something, it
is marked **[PPT]** and is a placeholder, not a proposal.

One other reading to confirm, in §6.

---

## 1. The fault underneath three of these four

Three of the four complaints are the same thing: **something on the
board is timed against a clock instead of against the thing it belongs
to.**

- The squares start lighting 320ms before she has finished saying
  "count the spaces", because the count is started first and the
  sentence is started after it.
- AB lights while she is still saying "we already know two of its
  sides", because the light is timed off the length of the *first*
  line and set to begin a fifth of the way into it.
- The two known sides light at 700ms and 1600ms flat, whatever she is
  saying at the time.

This game has fixed this exact fault twice before and written down
both fixes. `countOut`'s own comment: *"Her line first, then the
stroke. The two used to run together, so she was still saying 'let's
count the units' while the line was already two units along — the
words described something that had already happened."* And
`pulseOff`'s: *"A moment read off the same clock the light is on
cannot drift."*

So the rule is already the house rule, and these three are places it
was never applied: **nothing on the board starts until the sentence
that introduces it has finished.** Not 320ms before. Not on a fixed
700ms. When she stops talking, the board moves.

---

## 2. The miss

### 2.1 What happens now, exactly

A child gets a distance wrong for the last time. In order:

1. **`countOut` walks their number out.** The measuring line grows one
   unit per beat to the number they chose, and at the end their number
   is written as a length — on the leg itself when the screen measures
   a leg, which screens 24 and 25 both do. A wrong answer is written
   on the drawing in the leg's own colour, in the place a correct
   length would go.
2. **`countUnits` lights the squares** — from t=0, with the running
   number under each.
3. **She says "Count the spaces between the two points"** — at t+320ms,
   by which time the first square is already lit.
4. **The squares clear and play again.** `GRID.unitBox.count.passes`
   is 2, and the comment says why: *"the first time through says what
   is happening, the second is the one they count along with."*
5. **The control comes back and the same question is asked again.** The
   helping branch is the only branch of a spent ladder that does not
   set `t.done`, so `closeAfterLine()` re-arms the question.

Every one of the five things reported is in that list.

### 2.2 What should happen

> She says it. Then it is counted. Once. Then the beat is over.

1. **She says "Count the spaces between the two points" and finishes
   saying it.** Nothing on the board moves while she talks.
2. **Then the squares light, one at a time, once.** `passes` becomes 1.
   The reason for the second pass — *"the first time says what is
   happening"* — was doing the job the sentence should have been
   doing, and it only had to do it because the sentence arrived under
   the count. Fix the order and the second pass has no job left.
3. **Each square carries its own number, inside it.** 1, 2, 3, 4,
   centred in the square that is lighting, not under it. They are
   there now but hung outside the box on `UC.numDy`; a number beside a
   square is a label, a number in it is a count.
4. **The finished row is held to be read**, as it is now.
5. **Then the beat is over.** Not another go at the same question: the
   ladder is spent, the answer has been counted out in front of them,
   and asking again is asking a child to perform something they have
   just been shown. The screen hands on.

### 2.3 And their own number comes off the board

`countOut` writes the child's answer as a length — "2 units" against a
leg that is 4 long. The intent is recorded and it is a real one: *"It
is their number that gets counted, not the right one, so a guess that
is too long walks the line straight past the point. That overshoot is
the feedback: you can see the extra unit."*

**Keep the overshoot, drop the caption.** The line walking past the
point is the feedback and it costs nothing; a *number* written on a
side of the drawing is the board asserting a length, and the board must
never assert a wrong one. So the count that follows still counts the
real spaces, and the only number written anywhere is the one under the
squares as they light.

Concretely: the count-out no longer calls `showLegTotal` or
`showUnitTotal` with the child's figure. On a right answer nothing
changes — that number is correct and is written the way it always was.

---

## 3. A label against its point

**A's label is touching its dot on screens 24 and 25**, and the number
that decides it is `GRID.segment.coordGap: 3`.

The air between the painted dot and the nearest ink of its label is
exactly `coordGap`. The dot is painted at `dotR` 10 with a 3px stroke,
so its outer edge is at 11.5, and the label's nearest ink goes at
`11.5 + coordGap`. Three pixels.

**That number was calibrated against a bug.** Until last week the
offset was applied on each axis at once, so a *diagonal* label — and A
on a diagonal pair is placed diagonally — landed at `gap × √2`, which
put its nearest corner about **9** past the painted edge, not 3. The
cardinals got the literal 3 and were rarely chosen, so nobody saw it.
Measuring to the ink made all eight honest, and the diagonals lost six
pixels of air overnight.

So the rule is right and the constant is stale. **Set `coordGap` to
what the diagonals were actually delivering — about 9** — and check it
by eye at both cameras, because it now means the same thing in every
direction and on every screen rather than one thing on four of them and
another on the other four. The comment above it, which argues for a few
pixels on the grounds that "a few pixels read as touching rather than
as crowding", is describing a gap that was never three pixels in the
places anyone was looking.

Nothing else about the labelling changes. This is one number.

---

## 4. Two looks, one board

Screen 24 says **"But look at A and C. Can you find AC?"** in one
breath, and lights the board once. It should be two:

- **"But look at A and C."** — A and C light. Only those two.
- **"Can you find AC?"** — the segment between them lights.

That is the sentence doing what it says: first the two things, then the
thing between them, which is the whole idea of a distance.

**It must stay one screen.** The config comment on 24 records why the
two beats were merged into one: *"They used to be two beats — 'can the
grid help?', then 'how far apart are A and C?' — which asked the child
to hold a hint across a screen change."* That was right and it stays
right. What splits here is **the sentence and its highlighting**, not
the beat: one board, one question, one control, two sentences with a
light each. Nothing has to be carried across anything.

So screen 24 gains a `line2`, and its two highlights are bound to the
two lines by §1's rule — the second light waits for the first sentence
to finish, and the question's control waits for both.

---

## 5. A found length stays found

**AC appears, disappears, and appears again.** The disappearance is one
line: `game.js:5497`, in the path that brings a control on, calls
`Board.clearMeasure()` unconditionally.

So: the child finds AC on 24 and their measuring line is left lit along
it, which is correct and deliberate — *"The player's own measuring line
is left lit when they get it right — on the screen they drew it, where
it is the answer."* Then screen 25 opens, brings its control in, and
wipes it. A moment later screen 25 draws leg 0 as `settled: true,
length: true` and it is back.

**A length that has been found stays on the board.** It is the thing
the next screen is building on — screen 25's whole argument is *you now
have two measured sides* — and a side that blinks out between the two
beats undoes it. The clear must not fire over a side the child has
already measured; the settled leg takes over from the lit measure
without a frame of nothing in between.

Screens 24 → 25 → 26 are the test: AC arrives once, and from that
moment there is never a frame without it.

---

## 6. The triangle question

**Which screen.** Two screens ask this, and the review's list points at
both halves:

- **Screen 26**, *"Look! We've made a triangle."* — a stacked panel of
  three, labelled **Scalene Triangle / Isosceles Triangle /
  Right-angled Triangle**. The three names in the review are this
  screen's three, and this is the only screen with the word "Triangle"
  in its labels.
- **Screen 55**, *"What kind of triangle is this park?"* — the
  three-across card trio, **Scalene / Isosceles / Equilateral**, no
  spare word to remove. Its caption type is 26px inside a panel scaled
  to 0.665, which renders at about **17px on a 1920 stage** — the
  smallest type anywhere in the game, and the readability complaint
  fits it best by measurement.

**So: the naming change is screen 26's, and the readability change is
both screens', worst first.** One line to overrule if only one was
meant.

**What to do**

1. **The question**, on 26: **[PPT]**. Screen 55's stays as it is
   unless the PPT says otherwise — it is a good question and it names
   the park, which is what the beat is about.
2. **Drop the word "Triangle"** from 26's three labels. Every card on
   the screen is a triangle; the word is in all three and tells the
   child nothing about any of them. **Scalene / Isosceles /
   Right-angled.**
3. **Then the type can grow, because the word was what was holding it
   down.** 36px was chosen against a measurement — *"The longest
   label, 'Right-angled Triangle', needs about 416px of the 446px a
   button has inside it."* "Right-angled" alone needs well under half
   of that. Take the type up until the longest of the three sits
   comfortably in its button, and no further; the three cards stay one
   size, set by whichever is longest.
4. **Redesign the boxes for reading, not decoration.** The three read
   as one set now and must go on doing so — same size, same baseline,
   same everything but the marks. What has to change is that the name
   is the loudest thing on each card. On 55 the icon and the caption
   are competing at 17px, which is why neither wins.
5. **The trio's type comes up too**, on the same principle: it is the
   answer being chosen, so it is the thing to be read.

Nothing about which answer is right changes on either screen, and
neither set of three changes membership.

---

## 7. Pythagoras

Screen 28. She says two sentences and the board answers both of them
at once, then the working substitutes numbers into a formula it never
stated.

### 7.1 The two sentences, and what each one lights

| she says | what lights |
|---|---|
| "A right triangle! And we already know two of its sides." | **AC, then CB** |
| "Pythagoras theorem can help us find the third!" | **AB** |

Both of those are declared on the screen already — `spotSeq: ['h','v']`
for the two known sides, `pulse: 'ab'` for the third — and neither lands
where it should:

- **`spotSeq` fires at 700ms and 1600ms flat**, measured from the
  start of the beat. It happens to fall inside the first sentence and
  that is luck, not design.
- **`pulse` is timed off the length of `entry.line` — the FIRST line —
  and starts at 18% of it.** With no recording for these two lines yet
  it falls back to 1800ms, so **AB lights 324ms into the first
  sentence**, while she is saying "we already know two of its sides".
  It cannot land on the second line, because the second line is not
  what it is measured against.

**Bind each light to its own sentence**, by §1: the first sentence
finishes, then AC and CB light one after the other; the second sentence
finishes, then AB lights. When those lines are recorded the timing must
still hold, which is the whole reason for driving off the sentence
rather than a number.

### 7.2 The working states the theorem before it uses it

The board's working opens at

```
AB² = 4² + 3²
```

and the theorem it is an instance of is never written. That is the one
line the beat exists to teach. It should read:

```
AB² = AC² + CB²
    = 4² + 3²
    = 16 + 9
    = 25
AB  = 5 units
```

Five steps, one idea each: **the theorem**, then **this triangle's own
numbers put into it**, then the squares, then the sum, then the root.
The first line is the general statement and carries no numbers at all;
the second is the substitution, and it only reads as a substitution
because the first one is above it.

The two lengths in line two are read off the legs and should arrive
from them, the way the working already does it — that is what makes it
a substitution the child watched rather than a line that appeared.

### 7.3 Where it is written

It is already on the paper rather than in a side panel, which is right
and stays. What it does not have is **anything behind it**: five lines
of algebra are written straight onto the ruling, over the grid.

Give it a quiet plate — the paper's own cream, a soft edge, enough
padding that no glyph sits on a rule — sized to the lines it holds and
placed in the room the push-in already reserves for it. Quiet: it is a
surface for the working to be legible on, not a second panel competing
with the drawing beside it.

### 7.4 One line at a time

Already true — `workOnBoard` writes line by line and lights the side
each part names. The new first line joins that sequence as its own
beat, and the pacing stretches to five lines rather than four; a
working that arrives faster than it can be read teaches nothing.

---

## 8. How to build it

Roughly in this order, because each one makes the next easier to see:

1. **§1's rule, as a way of starting things.** One place that says
   "after she has finished this sentence, do this", used by the count
   in §2, by both of screen 24's lights in §4, and by both of screen
   28's in §7. Replace the fixed offsets — the 320ms, the 700 + n×900,
   the 18% of a fallback 1800 — rather than tuning them.
2. **§3's one number**, which is the smallest change here and the most
   visible.
3. **§2**: `passes` to 1, the numbers into the middle of their squares,
   the child's figure off the board, and `t.done` set on the helping
   branch so the beat ends.
4. **§5**: the measure clear stops firing over a found side.
5. **§4**: screen 24 gains its second line and its second light.
6. **§6**: the labels, the type, the boxes.
7. **§7**: the two lights, the theorem line, the plate, the pacing.

---

## 9. What must not break

**The teaching**

- A wrong answer still shows its own overshoot — the line walking past
  the point. Only the number comes off.
- The count still counts the real spaces between the two points.
- Nothing is asked a third time, and after the count nothing is asked
  again at all.
- Screen 24 stays **one screen**: one board, one question, one control.
- Screen 25 still opens with AC measured and visible, because its
  argument is that there are now two measured sides.
- The right answers do not change, on any screen.
- Screen 26 still earns the theorem: the child names the right angle
  before Pythagoras is mentioned.

**The build**

- Labels stay where §3's own rule puts them — one gap, measured to the
  ink, the same in all eight directions. This moves the number, not the
  rule.
- The three option cards stay one set: same size, same baseline, the
  marks the only difference.
- The working stays on the paper.
- Every delay through the game's own `later()`, so skipping a screen
  cancels what it had pending.
- Back and Next leave every touched screen sane from either direction.
- Every spoken line in config, in one place.

---

## 10. Acceptance — in a browser, watching it

**The miss** (get 24 wrong twice)

- [ ] she says "Count the spaces between the two points" and **finishes**
      before anything on the board moves
- [ ] the squares light one at a time, **once**, not twice
- [ ] each one carries its own number **inside it** — 1, 2, 3, 4
- [ ] the finished row is held long enough to read
- [ ] no wrong number is written anywhere on the board at any point
- [ ] and then the beat ends — the same question is not asked again

**The labels**

- [ ] on 24 and 25, A's letter and coordinate are clear of A's dot, and
      the gap is the same as B's and C's
- [ ] no label has drifted into a shape or onto the numbering

**Screen 24**

- [ ] "But look at A and C." — **only** A and C light
- [ ] she finishes, then "Can you find AC?" — the segment AC lights
- [ ] the control arrives after both

**24 → 25 → 26**

- [ ] AC appears once when it is found and there is never a frame after
      it without it

**The triangle question**

- [ ] 26 asks **[PPT]**
- [ ] its three read Scalene / Isosceles / Right-angled, no "Triangle"
- [ ] the type is bigger and the longest of the three still fits
- [ ] 55's captions are readable at a glance
- [ ] both sets still read as three of one thing

**Pythagoras**

- [ ] "…we already know two of its sides" — she finishes, **then** AC
      lights, then CB
- [ ] "Pythagoras theorem can help us find the third!" — she finishes,
      **then** AB lights, and not before
- [ ] the working sits on a quiet plate on the paper, no glyph on a rule
- [ ] its first line is `AB² = AC² + CB²`, with no numbers in it
- [ ] then `= 4² + 3²`, and the 4 and the 3 arrive from the legs
- [ ] then `= 16 + 9`, then `= 25`, then `AB = 5 units`
- [ ] one line at a time, each readable before the next arrives

---

## 11. Built — 21 Sep 2026

Every box in §10 ticks, watched in a real browser rather than a stub —
the Node harness and its ninety-odd probes went with the session's
scratchpad, so verification was rebuilt on headless Chrome driving the
actual page. That turned out to be the better instrument: two of the
findings below are only visible on a painted page.

**One thing the whole exercise turned on.** Every probe plays the game
FORWARD, with Next and with real answers. Jumping to a screen leaves
the board with no ruling, no numbering and the camera in the wrong
place — the picker-jump fault — so nothing measured on a jumped-to
screen means anything. The first two runs of this build were measured
that way and both were wrong.

### What was built

**§1's rule, as one thing.** `Game.lightAfterLine(entry, n)` plays what
a screen lists under `lineLights` for the line that has just finished;
`sayLines` and `speakBoth` gained a per-line callback to call it, and
`entry.pulse`/`entry.spotSeq` stand down on any screen that declares
lights by line. Three fixed clocks are gone: the count's 320ms, the
700 + n×900 of `spotSeq`, and the 18%-of-the-first-line that `pulse`
used.

**§2.** `passes` 2 → 1, the running numbers moved into the middle of
their own squares (`numDy` deleted with them), and the helping branch
rewritten: she says the line and finishes it, then the count runs once,
then the beat ends — it was the only branch of a spent ladder that left
the question armed.

**§2.3.** `countOut` takes a `keep` flag and writes the total only when
the answer was right.

**§3.** `coordGap` 3 → 9.

**§4.** Screen 24 says two sentences with a light each, and stays one
screen.

**§5.** `Board.measureIsLit()`; bringing a control on no longer wipes a
side the child has measured, and the settled leg clears it as it takes
it over.

**§6.** The word "Triangle" off screen 26's three; 36 → 52 (38px
rendered, from 26). The trio 26 → 34 and its panel 520 → 740 wide
(24.8px rendered, from 17), still 61px clear of the board.

**§7.** Screen 28's lights bound to their own sentences, the theorem
written before the substitution, and the working given a plate —
`Board.workPlate`, sized to the block it holds, arriving with the first
line rather than sitting there empty.

### Five things the prompt did not foresee

1. **Screen 26's `options` array was dead config.** `TriangleOptions`
   rebuilds its cards only when the option KEYS differ, and screen 26's
   three keys are the component's own three — so it had been showing
   the component's default labels, "Scalene Triangle" and the rest, and
   the screen's own words were never read. The cache signature now
   covers everything a card is made of. Renaming the options in config
   would have changed nothing at all without this.
2. **A `measure` screen speaks on its own path.** `after()` skips them
   (`entry.intro !== 'measure'`), so screen 24's second line and its
   lights had to be honoured in a second place — which is why
   `lightAfterLine` is a method on Game rather than a closure in
   `after`.
3. **The rule silently did nothing until a callback returned its
   value.** The "next sentence waits for this sentence's light"
   half of §1 was written, correct, and dead: the wrapper called
   `lightAfterLine` without returning what it gave back, so every gap
   fell through to the 520ms default and CB still lit under the second
   sentence. Caught only by recording the painted page frame by frame.
4. **The trio's type was small because the card was narrow.** Raising
   the font alone overflowed all three cards — "Equilateral" wanted
   155px of a 129px card. The panel had to widen before the type could
   grow, which is the actual answer to "redesign the boxes".
5. **A corner's label was still being placed by hand, and it was
   sitting on its own dot.** §3 says "this is one number" and it very
   nearly was — but `clearMarksOfLines` still moved a blocked corner
   itself, dropping its coordinates to a fixed offset under the point.
   That offset is a distance to the label's MIDDLE rather than to its
   ink, so it owed nothing to the gap every other label keeps, and on
   screen 25 it put C's coordinates **2px inside the circle they
   belong to**. The one rule already knows how to miss a line; the
   only thing it could not see was the lengths written beside the
   legs, because nothing inks those. So they go in, and each corner is
   simply placed again. `offEveryLine` went with the hand-placing —
   nothing called it any more.

### One thing the prompt asked for that I could not reproduce

**§5's "appears, disappears, and then appears again" does not happen on
the path where the child gets it right.** Recorded every animation
frame across 24 → 25 on the code as it was and on this: AC is on the
board continuously in both, with no blank frame in either.

What IS wrong on the old code is the path where they get it wrong, and
it is worse than a flicker: the leg's length reads **"2 units"** from
641ms onwards — the child's wrong answer written as AC's length, in the
leg's own colour, in the place a correct length goes, and left there.
That is what §2.3 removes. So the reported symptom is fixed on the path
it actually occurs on, and the change to the control-reveal clear (§5)
stands on its own merit: it stops the measuring line travelling onto
the next screen and lying over the leg in the wrong colour, which is a
fault the code's own comments already warned about.

If the flicker was seen somewhere else, the screens and the answer
given would pin it down.

### One box in §10 that does not tick

**"the gap is the same as B's and C's" is not true at the ink**, and
saying so is better than quietly loosening the test. Measured on the
painted page at screen 24's camera: **A 14.2px, B 5.1px, C 21.4px**
clear of their own dots.

The placement is uniform — every block's nearest CORNER is one gap off
its dot, which is what `blockAt` guarantees and what §3's number sets.
What varies is whether there is any ink in that corner. A point's block
is a narrow letter over a wide coordinate, so when the block goes up
and to the left its top-right corner is empty air beside the letter,
and the nearest actual glyph is further out than the corner is.

That is the ink-versus-box question `labels-hug-their-points.md` §2
opened and did not close, not something §3 introduced — §3 is one
number and it did its job: nothing is on its own dot any more, and
nothing has drifted. Closing it properly means `placeBlock` measuring
to the glyphs rather than to the box, which is a change to the rule and
belongs in its own prompt.

### Verification

`qa-onething.js` is §10 as a probe — 19 checks across screens 24, 25,
26, 28 and 55 — and `qa-gap.js` is the labelling half, measured off the
painted page with the ink read from `getBoundingClientRect` rather than
`getBBox`, which returns the font's line box and has caught this
project out twice. The highlight and continuity checks record every
animation frame rather than polling: a blink shorter than a poll is
still a blink the eye catches. Both report no problems. A full
play-through — 51 screens, answering every question — raises **no
exceptions**.

Three checks in the first drafts were hollow and were fixed rather than
kept. The option cards were measured while the panel was hidden, where
every button is 0 wide and "0 fits in 0" passes. And the working was
compared against a string with an ordinary space in "5 units" where the
game writes a non-breaking one, so a line that was exactly right
reported as wrong. A check that measures nothing is worse than no
check, and a check that fails on what it is not testing is worse than
that.

### Noticed, not fixed

- **"3 units" crowds C's label on screen 28.** Measured identical on
  the code as it was, so it is not this work. Leg lengths are now inked
  before a corner is re-placed, which is what stopped C sitting on its
  dot — but they are still not in the pass that places the pair's own
  two labels, which `one-way-of-labelling.md` records as unfinished.
- **The ink-versus-box spread**, above.
- **The picker-jump fault**, as above.
- **§0's `[PPT]`**: screen 26 still asks "Look! We've made a triangle."
  The question text is the one thing in this document that needs the
  PPT, and one line changes it.

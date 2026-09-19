# Build prompt — the middle of the lesson, re-cut

Seven beats, screens 20 to 28. The drawing does not change; what she
says over it does, and **the one question in the middle changes to a
better one**.

**Read section 0 of `docs/horizontal-distance-animation.md` first.**
Then `docs/working-on-the-board.md` — beat 7 hands straight to it.

---

## 0. What changes, beat by beat

| beat | now | after |
|---|---|---|
| 1 · recall the row | **silent** | *"We know how to find horizontal distance."* |
| 2 · recall the column | *"We know how to find horizontal and vertical distance."* | *"And vertical distance."* |
| 3 · the diagonal | *"But what if two points are like this?"* | that, **and** *"Our earlier way won't work this time."* |
| 4 · find AC | *"Our earlier way won't work this time. But look at A and C. Can you find AC?"* | *"But look at A and C. Can you find AC?"* |
| 5 · find CB | *"How far apart are C and B?"* | *"Great! Now find CB."* |
| 6 · the triangle | *"Look! We made a triangle."* — nothing asked | that, **and a question: what type of triangle is this?** |
| 7 · Pythagoras | *"We know two sides. How can we find the third?"* — Area / Perimeter / Pythagoras | **no question.** *"A right triangle! And we already know two of its sides."* → *"Pythagoras theorem can help us find the third!"* → straight into the derivation |

Nothing on the board moves. No new screens, none removed. Two lines
split, one line moved back a beat, one question swapped for another,
and one new mark drawn.

---

## 1. The reversal, and why it is the right one

**This reinstates a question the config says was cut on purpose**, and
removes the one that replaced it. `js/config.js`, above screen 28:

> *"No question in between. The triangle is made, both its known sides
> are measured, and the next thing to say is the theorem itself —
> asking what kind of triangle it is first put a second question
> between the child and the answer they were promised."*

That reasoning is sound and it is still sound. It just assumed the
triangle question would be **additional**. It is not: this swaps the two,
and the count stays at one.

And the swap is worth making, for a reason that decides it:

- **"How can we find the third side?" is not answerable from the
  screen.** Pythagoras has not been taught in this lesson. A child picks
  it by elimination, by recognising the word, or by guessing — and the
  answer teaches nothing, because the question tested nothing. It is a
  quiz about vocabulary standing where a question about the drawing
  should be.
- **"What type of triangle is this?" is answerable from the screen.**
  They built the right angle themselves, two beats ago, by walking
  across and then up. It is a question about the thing in front of them,
  and getting it right is evidence rather than luck.
- And naming it right-angled is exactly the **precondition** for
  Pythagoras. The question *earns* the theorem instead of guessing at
  it, which is what lets her simply tell them the theorem afterwards —
  the honest thing to do with a theorem they have not met.

So the concern the old comment raised is answered rather than ignored:
still one question, and now one the child can actually answer.

**The panel was built for this question.** `js/triangle-options.js`
carries the three triangle types as its own default choices — scalene,
isosceles, right-angled — and the game stopped asking it. This is a
restoration, not an invention.

---

## 2. The beats

### 1 — Recall the row  *(screen 20)*

> **"We know how to find horizontal distance."**

The two rows they measured come back with their lengths. It says
nothing today; the config's reason was that a sentence on each *"said
the same thing twice"*. That was true of the sentence it had — one line
covering both recollections, on the second of them. Half a sentence each
does not repeat: this beat names rows, the next names columns, and the
two halves are one thought spoken across two pictures.

### 2 — Recall the column  *(screen 21)*

> **"And vertical distance."**

Starting with *"And"* is what keeps the pair together. It cannot be read
on its own, so it does not read as a second, separate recollection.

### 3 — The diagonal  *(screen 22)*

> **"But what if two points are like this?"**
> *(AB lights, briefly)*
> **"Our earlier way won't work this time."**

The second line moves back here from screen 24. It belongs to the
**problem**, not to the question: it is a statement about this pair, and
this is the beat where the pair is introduced.

The config warns against splitting these, and the warning is about a
different thing — *"they used to be two beats: 'can the grid help?',
then 'how far apart are A and C?', which asked the child to hold a hint
across a screen change."* A hint has to be carried; a statement about the
problem does not. The question on beat 4 stands on its own, so nothing
is being held.

### 4 — Find AC  *(screen 24)*

> **"But look at A and C. Can you find AC?"**

C appears, the run across is drawn, and the child measures it the way
they measured every row before it. Unchanged apart from the line, which
is now just the question.

### 5 — Find CB  *(screen 25)*

> **"Great! Now find CB."**

*"Great!"* is doing work, not decoration: it closes beat 4 before beat 5
opens, so the child knows the first answer was accepted. And *"Now find
CB"* says this is the same job again rather than a new one — which is
the point, because it is the vertical method they already have.

### 6 — The triangle, and the question  *(screen 26)*

> **"Look! We've made a triangle."**
> *(AC, CB and AB all come up together)*
>
> **"What type of triangle is this?"** — Scalene · Isosceles ·
> Right-angled

Right, and **the right-angle marker appears at C**: a small square in
the corner, drawn as the answer lands, so the child sees the thing they
named.

Wrong, and one nudge — *"Look at the corner at C."* — then another go.
Wrong twice and she names it herself and moves on; nothing is asked a
third time, which is the rule everywhere else in this game. *(It was
the rule, and it had no path here — see §9.2. She now says
* **"It's a right-angled triangle — see the square corner at C."** *and
the panel marks which one it was.)*

### 7 — Pythagoras  *(screen 28)*

No question. She lands and says it:

> **"A right triangle! And we already know two of its sides."**
> *(the run across and the step up light, one then the other)*
> **"Pythagoras theorem can help us find the third!"**
> *(then AB lights)*

Then straight into the derivation — which, since
`docs/working-on-the-board.md`, is written **on the paper beside the
triangle**. Nothing else is needed here: the screen already carries
`stage: 'working'` and its formula.

---

## 3. Focus — what is lit, and what is faded

This is half the teaching and it is almost all already built:
`Board.spotlightPart(which)` brings one side forward and hushes the
rest; `pulse` runs a highlight under a line.

| beat | in focus | faded |
|---|---|---|
| 1 | the two rows and their coordinates | the ruling and axes (`quietBoard`) |
| 2 | the two columns and their coordinates | as above |
| 3 | A, B, AB | the ruling and axes |
| 4 | **AC** | AB, and CB is not drawn yet |
| 5 | **CB** — AC stays visible but steps back | AB |
| 6 | **all three together**, at full strength | nothing |
| 7 | the two known sides first, **then AB** | the one not being named |

Beat 5 is the one that is not built: AC has to stay on the board and
step back rather than either vanishing or staying at full strength.
*(It was buildable after all — `focus: 'v'`, the existing per-beat
spotlight held for the beat instead of only during a working.)* The
child needs to see that they now have two measured sides — that is what
the next beat is about — but the one being asked for has to be the loud
one.

---

## 4. The right-angle marker — the one new drawing

A small square in the corner at C, on the inside of the angle, in the
corner's own colour.

- **It appears when the triangle is named**, not before. It is the
  evidence for the answer, so it arrives with the answer — a marker
  already sitting there turns the question into a reading exercise.
- **It is drawn from the two legs**, not typed: which way each runs
  decides which of the four corners the square goes in, so it is right
  whatever the pair is. About a third of a cell, and scaled through the
  camera like everything else on this board.
- It stays for beat 7 and goes when the triangle does.

---

## 5. A derivation nobody asked for

Screen 28 has a formula and, after this, no task. Today a working plays
because an answer was given — right on 28, or the ladder spent on 29,
30, 45, 47. A screen that simply **states** a derivation has no such
trigger, so it needs one: the beat's own line ends, and the working
begins.

Everything else about it is already there — `stage: 'working'`, the
board coming to the middle, the push, the lines on the paper, the
numbers flying out of the leg lengths, the answer going home.

---

## 6. How to build it

1. **Lines and options are config.** Beats 1–5 and 7 are lines moving
   between screens; nothing in code changes for them.
2. **Screen 26 gains a question**: `options` with the three triangle
   types — the panel's own defaults, so it may need no list at all —
   `task: { kind: 'choice', answer: 'right-angled' }`, one rung of
   feedback, and `askFirst` so the answers arrive after she has spoken
   rather than under her.
3. **Screen 28 loses `options`, `askFirst` and `task.kind: 'choice'`**,
   and keeps its formula. It needs the working to run off the end of
   her line instead of off an answer.
4. **`Board.rightAngle(i)`** — the marker, drawn from the two placed
   legs, shown when the choice is answered and cleared with the
   triangle. *(Built as `rightAngle(on)`: the corner comes from the
   legs, so there is nothing to index.)*
5. **Beat 5's fade** is `spotlightPart`, held rather than cleared: the
   existing call already hushes everything but one side, so what is
   needed is for it to run while the question is open rather than only
   during a working.
6. Every line in config, every duration in config.

---

## 7. What must not break

- **Still exactly one question in these seven beats.** If both 26 and 28
  end up asking something, this has failed.
- **Nothing is asked a third time.** One rung, then she says it.
- **The right-angle marker never appears before the triangle is named.**
- **The drawing does not change.** Same pair, same corner, same legs,
  same lengths, same coordinates.
- Beat 5 still shows AC — faded, not gone.
- Screen 28 still reaches its derivation, and the derivation is
  unchanged.
- Every screen outside 20–28 is untouched.
- Back and Next replay each beat cleanly, with no marker, no highlight
  and no control left behind.

---

## 8. Acceptance — in a browser, watching it

- [ ] 20 says *"We know how to find horizontal distance."* over the rows
- [ ] 21 says *"And vertical distance."* over the columns
- [ ] 22 says both its lines, and AB lights briefly between them
- [ ] 24 asks only *"But look at A and C. Can you find AC?"*
- [ ] 25 says *"Great! Now find CB."*, and AC is still on the board,
      faded, while CB is the loud one
- [ ] 26 brings all three sides up together, then asks what type of
      triangle it is
- [ ] the three answers are Scalene, Isosceles, Right-angled
- [ ] a right answer puts a square in the corner at C
- [ ] a wrong one nudges once and never asks a third time
- [ ] 28 asks **nothing** — she says both lines, the two known sides
      light and then AB
- [ ] and the derivation follows on its own, on the paper, as it does now
- [ ] every screen outside 20–28 is unchanged

---

## 9. Built — 19 Sep 2026

Every box in §8 ticks, watched in headless Chrome as well as checked in
the Node harness. Screens **20, 21, 22, 24, 25, 26, 28** — no screens
added, none removed, the drawing unchanged.

### 9.1 The beats, as they play

```
[20]  "We know how to find horizontal distance."      3 units | 7 units
[21]  "And vertical distance."                        5 units | 2 units
[22]  "But what if two points are like this?"   AB lights
      "Our earlier way won't work this time."
[24]  "But look at A and C. Can you find AC?"   then the lock
[25]  "Great! Now find CB."                     AC still up at 4 units
[26]  "Look! We've made a triangle."            the three sides light
      Scalene / Isosceles / Right-angled        the answers rise after
[28]  "A right triangle! And we already know two of its sides."
      "Pythagoras theorem can help us find the third!"
      AB² = 4² + 3²  →  = 16 + 9  →  = 25  →  AB = 5 units
```

Exactly one question in the seven, and it is the one a child can
answer from the picture.

### 9.2 What the spec did not anticipate

**Beat 6 had no way to stop asking.** §2 says *"Wrong twice and she
names it herself and moves on; nothing is asked a third time, which is
the rule everywhere else in this game."* It is the rule, and it was
enforced in exactly two ways: a spent ladder either wrote a working or
branched to a teaching screen. Screen 26 does neither, so it fell
through to the last rung a second time with the buttons still live —
which is the third ask. Two things now close it:

- `task.spentLine` — *"It's a right-angled triangle — see the square
  corner at C."* — said 900ms after the marker, so she is naming
  something already in the corner.
- `Opts.reveal()` — the panel marks the answer green and steps the
  other two back. Locking alone leaves three live-looking buttons
  under a bird who has just given the answer, which still reads as a
  question.

**Beat 5's fade was already buildable.** §3 called it *"the one that is
not built"*. It is `focus: 'v'` on screen 26's predecessor — the
existing per-beat spotlight, held for the beat rather than only during
a working. AC stays on the board at 4 units while CB is the loud one.

**`Board.rightAngle` takes a flag, not an index** (§6.4 guessed
`rightAngle(i)`). The corner is worked out from the two placed legs, so
there is nothing to index; `rightAngle(true)` puts the square in
whichever of the four corners the legs make, and it is cleared with the
triangle.

### 9.3 Four things found while verifying, outside these seven beats

Each was reachable before this change and is fixed here.

1. **A working could be carried off in the middle of a sentence.** The
   balloon still open when a ladder ran out finishes *after* the working
   has started — and by then the task is done, so `settle` armed the
   hand-over and took the paper away mid-derivation. Screen 29 wrote one
   line of four and jumped to 30. `Game.writing` is now raised the
   moment a working is committed to and lowered when it hands on;
   `settle` will not carry a screen off while it is up, and
   `clearPending` drops it so Next and Back are unaffected.

2. **The control was lifted 160ms before the highlight went out.**
   `pulseTail` subtracted the recording's length from the run, which
   assumes her balloon closes the instant the recording ends — it opens
   late and types. `pulseOff` is now the moment the light goes, read off
   the same clock the light is on, so the gap cannot drift.

3. **The picker could land on a screen showing the wrong pair.** A beat
   that keeps its drawing assumes the beat before left the right thing
   there — true of every route through the script, false the moment a
   child taps `26/48` from somewhere else. `Board.showing(spec)` now
   answers "is this pair the one on the paper?", and both keep-paths
   ask it: the pair a screen declares wins over the pair that happens
   to be up, and the paper is wiped before it is redrawn. Two smaller
   ones with it: `placeSegment` builds the paper if nobody has
   (a jump from the title beat used to throw), and going back to the
   first beat blanks the labels, so a replay does not come up holding
   the last run's coordinates.

4. **Two questions offered more than the board can draw.** Screen 45
   reached 12 on a walk the paper runs out of after 7; screen 47
   reached 14 where it runs out after 12. A miss is counted out on the
   board, so a number the line cannot reach is a miss with nothing to
   look at. Both are capped at what the paper allows, each still
   leaving two steps past the answer to overshoot by.

### 9.4 Probes

New: **`qa-cold`** — every one of the 46 screens arrived at cold from
the title beat, nothing thrown. **`qa-picked`** — every screen that
keeps a drawing, jumped to from the furthest-away pair in the script,
draws its own pair and writes its own coordinates.

Taught what changed: `qa-recall` (beat 1 speaks its half; neither half
says the whole thing), `qa-askflow` (same frame counts as after),
`qa-optspend` (the subject split in two — the ladder that stops asking
lives on 26, the ladder that writes a working on 29), `qa-sync` (a beat
that states its derivation is 'speaking' for the whole of it), `qa-vert`
(a leg question writes its answer as the leg's own length), `qa-onelen`
and `qa-cafe` (read while the screen is still up), `qa-labelpair` (judge
a label against the window the board is clamping to, and let a corner
be asymmetric the way a column already is).

Three of those had been answering questions about a screen before its
control was up — the game says `waiting` before the lock or the answers
have arrived, and pressing in that gap answers a question nobody has
asked yet. They now wait for the control, as a child has to.

Suite: **88 green, 4 red** — `qa-sel`, `qa-tap2`, `qa-tap3`, `qa-taps`,
the standing four. `qa-optspend` has left that list.

Browser captures: `cdp-seven-a.js` (beats 1–6 and a right answer),
`cdp-seven-b.js` (two misses, and beat 7 end to end), `cdp-jump26.js`
(the picker's own move).

**Still to record:** screen 20's line, 21's, 22's second line, 25's
*"Great!"*, 26's question, its nudge and its spent line, and both of
28's.

# Build prompt — the need, then the reason, then the theorem

Screen 28 is where Pythagoras enters the lesson. Today it opens with
"A right triangle! And we already know two of its sides.", follows with
"Pythagoras theorem can help us find the third!", and writes the
working. The working is right. The words before it are not doing their
job:

- "A right triangle!" repeats the answer the child gave one screen ago.
- "We already know two of its sides" is lit one side at a time, so the
  child never sees the two known sides together.
- The theorem arrives without its reason. The reason is the right angle
  at C, and the marker that shows it is dimmed by every highlight on
  this screen — at exactly the moment the theorem is invoked.

This rewrite puts the argument in order: **what we have** (AC and CB),
**what we need** (AB), **why the tool applies** (it is a right
triangle, and the marker says so), **then the tool** (the working).

**Nothing about the drawing or the working changes.** Same triangle,
same lengths, same five lines of working, same camera. What changes is
the words, what is lit while each is said, and one mark that must stay
at full strength.

---

## 0. What is there now

Screen `id: 28`. It follows 27 ("Look! We made a triangle.") and 26
("What kind of triangle is this?"), whose right answer turns the
right-angle marker on.

```
   28   line:   "A right triangle! And we already know two of its sides."
                 lights: spots h, then v — one side at a time; the
                 second replaces the first
        line2:  "Pythagoras theorem can help us find the third!"
                 lights: pulse ab + spot ab
        derive: (AB)² = (AC)² + (CB)²
                = (4)² + (3)²
                = 16 + 9
                = 25
                AB = 5 units
        stage: 'working', view: 'triangle', quietBoard, keepSegment
```

`spotlightPart` steps back the triangle's face **and the right-angle
marker** whenever a side is singled out (`shape = [triFill, rightMark]`
in `spotlightPart`). So on today's screen the marker is dimmed by both
lines' lights and by every side the working lights as it writes.

---

## 1. The sequence to build

The bracketed lines are what the board does, not what she says.

```
   0.  [The screen arrives. AC and CB light together, each with its
        length — AC = 4 units, CB = 3 units. AB steps back.]

   1.  "We know AC and CB."
       [AC and CB stay lit, both of them, for the whole sentence.]

   2.  "But we still need AB."
       [AB lights. AC and CB step back.]

   3.  "Since it’s a right triangle, Pythagoras theorem can help!"
       [The right-angle marker at C is at full strength — it is the
        reason she is giving.]

   4.  [The working plays, exactly as it does now.]
```

From the moment the screen opens to the end of the working, **nothing
on this screen dims the right-angle marker.**

### Why each beat is where it is

- **0 comes before 1.** The two known sides are lit as the screen
  arrives, and then she names them. The child is already reading two
  lengths when she says "we know AC and CB", so the line confirms what
  they are looking at instead of sending them looking.
- **1 lights both at once.** "We know AC and CB" is one fact about two
  things. Lit one after the other, the second replaces the first, and
  the child never sees both known sides at the same moment.
- **2 is the need.** AB is the one side with no length on it. Lighting
  it while the legs step back makes the missing length the loudest thing
  on the paper.
- **3 gives the reason before the tool.** "Since it’s a right triangle"
  is only true because of the corner at C, and the marker is the
  evidence. The theorem is earned by the shape, not announced — which
  is the same move screen 26 already made by asking the question.
- **4 is unchanged.** The working is correct and already animated. It
  begins when beat 3 has finished, as it does now after line2.

---

## 2. What is lit, and with what

Use what the board already has. Do not add a second way to light a
side.

| beat | lit | stepped back | the call |
|---|---|---|---|
| 0–1 | AC and CB, with "4 units" and "3 units" | AB | `spotlightPart(['h', 'v'])` — both at once, see §3a |
| 2 | AB | AC, CB | `spotlightPart('ab')` |
| 3 | nothing new; the marker stays at full strength | — | the marker is never hushed, see §3d |
| 4 | whatever the working lights, as now | — | unchanged |

The standing rules hold: **only lines light**. A lit side glows along
its stroke and its length; its two corners stay at normal strength and
do not glow. No highlight, dotted line or solid line crosses a point
(commit `14f3b01`).

In config this reads roughly:

```js
openLight:  { spots: [['h', 'v']] },         // beat 0, before she speaks
lines:      [ 'We know AC and CB.',
              'But we still need AB.',
              'Since it’s a right triangle, Pythagoras theorem can help!' ],
lineLights: [ {},                            // keep AC and CB as they are
              { spots: ['ab'] },             // the need
              {} ],                          // the reason: the marker, untouched
keepMark:   true,
rightAngle: true,
```

The exact keys are the builder's call; the behaviour in §1 is not.

---

## 3. Four things the code does not do yet

### 3a. Light two sides at once

`spotlightPart(which)` takes one side. `spots: ['h', 'v']` runs them in
sequence, and each call replaces the last. Let it take a list:
`spotlightPart(['h', 'v'])` lights the union — both strokes and both
lengths glow, the corners of both stay at full strength, everything
else steps back. A single key keeps working exactly as it does now.

Do not fake it with a pulse. `pulseSides` accepts several sides, but a
pulse fades, and beat 1 needs both sides held for the whole sentence.

### 3b. A light before the first line

`lineLights[n]` runs when line *n* finishes. That is right for every
beat that names something, and it is why no light ever lands before its
sentence. Beat 0 is the one exception: the two known sides are lit as
the screen arrives, and named after.

Add `openLight` — one entry in the same shape as a `lineLights` entry —
run once the screen has arrived and before the first line opens,
through the same `lightAfterLine` code. What is needed is a second
*moment* to run the existing light, not a second way of lighting.

Do not extend the arrival `spotlight()`. It only handles `entry.pulse`,
and it is skipped whenever `lineLights` is set.

### 3c. Three lines on a working screen

A `derive` screen speaks through
`sayLines([entry.line, entry.line2].filter(Boolean), …)`, so the
`lines: []` array added for screen 22 is not reachable here. Let the
derive path read it when present:

```js
self.sayLines(entry.lines || [entry.line, entry.line2].filter(Boolean), …)
```

Every other working screen keeps `line` and `line2`.

If this is more than the change should carry, split the screen in two
instead — beats 0–2 on one, beat 3 and the working on the next — but do
not append a third sentence to `line2`. The beats need their own lights,
and a line that is really two lines cannot have them.

### 3d. The marker stays visible

Three parts:

- **Never hushed on this screen.** `spotlightPart` steps back
  `[triFill, rightMark]` whenever a side is singled out. On this screen
  the marker is exempt — a per-screen flag such as `keepMark: true`,
  read by `spotlightPart`. The face may still step back. Per-screen, not
  global: nobody asked for this on 29 or 30.
- **Through the working as well.** The working lights each side as it
  writes `(AB)²`, `(AC)²` and `(CB)²`. The exemption has to hold there
  too, or the marker goes dim on the first line of working.
- **On when the screen opens.** The marker is switched on by answering
  26 correctly (`marksRightAngle` → `Board.rightAngle(true)`) and off by
  `clearLegs`. A child who jumps straight to 28 from the picker arrives
  without it. Assert it on arrival — `rightAngle: true` →
  `Board.rightAngle(true)` once both legs are placed. This is the same
  idea as `settlePair` and `settleFurniture`: a screen that inherits a
  drawing asserts it rather than hoping it survived the journey.

---

## 4. What she says

Three lines replace two.

| was | becomes |
|---|---|
| "A right triangle! And we already know two of its sides." | "We know AC and CB." |
| — | "But we still need AB." |
| "Pythagoras theorem can help us find the third!" | "Since it’s a right triangle, Pythagoras theorem can help!" |

Write "it’s" with the curly apostrophe, like every other line in the
script ("Let’s explore."). The letters are the ones on the board: the
points A, B, C and the sides AC, CB, AB.

---

## 5. Her voice

- Neither of today's two lines has a recording, so nothing is lost.
- None of the three new lines has one either. They fall back to the
  per-word notes, as most of the script's lines already do.
- There is an unused recording close by: "We know two sides. How can we
  find the third?" (`js/voice.js`). Its words match none of the new
  lines, so it stays unused. Do not key it to a line it does not say —
  screen 7's recording was cut loose for exactly that reason.

---

## 6. What must not change

- The drawing: A(2, 1), B(6, 4), C(6, 1); AC = 4 units, CB = 3 units.
- The working: all five lines, their text, their order, their lights,
  the parts that lift off the sides, the move to the middle of the
  frame and the push to the `working` view.
- On 28: `stage: 'working'`, `view: 'triangle'`, `quietBoard`,
  `keepSegment`.
- Screens 26 and 27 before it, and 29 after it.
- The rules already in force: only lines light; no line crosses a point;
  the axes fade as one shape; the red glow on a wrong answer.
- `line` / `line2` on every other screen, and what `lineLights` means
  (a light runs when its line has finished).

---

## 7. How to know it is right

Measured on the running page, not looked at.

1. **Both known sides are lit before she speaks.** At the first frame
   in which the balloon on 28 shows text, AC and CB are both lit —
   strokes and lengths — and AB is stepped back.
2. **Both, not one and then the other.** In every frame while "We know
   AC and CB." is up, AC and CB are both lit.
3. **AB is the loud one for the need.** Once the light for "But we
   still need AB." has landed, AB is lit and AC and CB are stepped back.
4. **The marker is never dim.** In every frame from arrival to the end
   of the working, the right-angle marker's opacity is 1 — including
   while a side is singled out, and while the working lights sides.
5. **The marker survives a jump.** Jump straight to 28 from the picker:
   the marker is on.
6. **Three lines, in order, then the working.** The balloon shows the
   three lines in order, and the first line of working appears only
   after the third has finished.
7. **The working is untouched.** The same five lines with the same
   text, every line inside the shot.
8. **Only lines light.** No point is lit in any frame on 28, and no
   line crosses a point.
9. **The walk is clean.** Every screen, each number answered wrong once
   before right: no exceptions.

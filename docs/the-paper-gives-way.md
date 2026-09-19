# Build prompt — the axes step back under a drawing

Small and exact. When what is drawn crosses an axis, the axes and their
numbers step back so the shape reads over them. Seventeen screens
change; the mechanism to do it already exists and is already tuned.

**Read section 0 of `docs/horizontal-distance-animation.md` first.**

---

## 0. What is happening now, in numbers

The board already has a quiet mode. `#gridPanel.quiet` takes the ruling
to .35, the axis lines and arrowheads to .3, and the axis numbers to
.5 — numbers left more readable than lines, which is exactly the right
call and was made a long time ago.

**It is switched on by hand, one screen at a time, and the two lists
barely overlap:**

```
marked quiet    9 10 11 12 15 16 17 18 20 21 24 25 26 55 56 57 59 60 61
crosses an axis          13 14 15    21          29 30 31 32 33 34
                         47 48 49 50 51 52 53 54 55 56 57 58 59 60 61
```

- **Crossing and NOT quiet — seventeen screens:** `13 14 29 30 31 32 33
  34 47 48 49 50 51 52 53 54 58`. A shape drawn over a 7px navy axis of
  the same colour family, at full strength, with big numbers beside it.
  That is every Pythagoras screen, both walks, all six of the towers and
  the rescue. It is the whole of what the picture shows.
- **Quiet and not crossing — eleven screens:** `9 10 11 12 16 17 18 20
  24 25 26`. These are quiet for a different and also correct reason:
  the board is being *read* rather than counted. Nothing here changes
  for them.

So this is not a new effect. It is the effect that exists, applied where
it is needed rather than where somebody remembered to ask.

---

## 1. The principle

**The axes are the paper. The drawing is the subject.** Where they meet,
the paper gives way — never the other way round, and never the drawing.

A child looking at screen 61 has to tell a side of the triangle from the
y-axis at the point where the two cross. Both are heavy, dark, straight
and about the same weight. There is nothing in the picture that says
which one is the shape.

---

## 2. Two reasons to step back, and they fade different things

This is the part worth getting right, because the two reasons collide on
one screen and the existing all-or-nothing mode cannot serve both.

| | why | what steps back |
|---|---|---|
| **read** (`quietBoard`, unchanged) | the beat is about the drawing, not about counting | the ruling, the axes, the arrows, the numbers |
| **crossed** (new, automatic) | a side of the drawing runs over an axis | the axes, the arrows, the numbers — **not the ruling** |

**The ruling stays when a drawing merely crosses an axis**, and that is
the whole reason the two are separate. Screen 58 asks a child to count
fourteen squares up a side that crosses the x-axis: the axis has to get
out of the way of the side, and the squares have to stay countable.
Fading both would take away the thing that beat is for.

A screen that asks for `quietBoard` gets both, as it does today.

---

## 3. What the board works out for itself

No screen has to say anything. After the drawing is placed, the board
asks: **does any of it cross an axis?**

It crosses when any drawn side has ends on opposite sides of `x = 0` or
of `y = 0`, or when any corner sits on one. All three sides count — the
pair's own line and both legs — because all three are the drawing.

Recomputed whenever what is drawn changes, and it goes off again when
the drawing does. It is a property of the picture, not of the screen.

---

## 4. How far down

Use the numbers already in the stylesheet; they are tuned and they are
right:

- axis lines and arrowheads → **.3**
- axis numbers → **.5**, because a child still reads coordinates off
  them and a number at .3 is a number they have to squint at. Lines
  carry less than numbers do here, so lines can go further.
- the ruling → **unchanged** under `crossed`, .35 under `read`.

And it fades rather than switches: the transition on those four is
already in the stylesheet, so a board going quiet and coming back does
it smoothly.

---

## 5. The crossing itself

Two things beyond opacity, one already true:

- **The drawing is painted over the axes.** The axes are built first, so
  every side is already on top of them. Nothing to do — but nothing may
  change it either, which is worth a line in the probe.
- **Optional, and I would do it second:** a thin paper-coloured casing
  on a side where it crosses an axis, so the side reads as passing in
  front rather than as meeting. It is the standard answer to two lines
  crossing and the board already uses the same trick on text. It costs
  a second stroke on every line that needs it, so it is worth doing only
  if §4 alone does not settle the picture.

---

## 6. How to build it

1. **`Board.crossesAxis()`** — the test in §3, over the pair and both
   placed legs. One small function.
2. **`#gridPanel.crossed`** — a second class beside `quiet`, with the §4
   rules and no rule for `#gridImg`.
3. **Set it where `quiet` is set** and recompute it whenever the drawing
   is placed, not only on a screen change: a beat that draws its legs
   after its line starts not crossing and ends crossing.
4. Nothing in config changes. No screen gains a flag.

---

## 7. What must not break

- **The eleven read-quiet screens are untouched** — same fade, same
  reasons, nothing added.
- **Screen 58 keeps its ruling.** It is the one beat that asks a child
  to count squares over an axis, and it is the reason the two modes are
  separate.
- **The axis numbers stay readable.** A child reads coordinates off
  them on every screen in the game.
- **The drawing stays on top of the axes.**
- The fade never flickers: a screen whose legs arrive after its line
  goes quiet once, not off and on.
- Back and Next leave every screen in the state it had the first time.
- Nothing about the camera, the labels or the working changes.

---

## 8. Acceptance

The list is exact, so the probe can be:

- [ ] these seventeen step back where they did not before —
      `13 14 29 30 31 32 33 34 47 48 49 50 51 52 53 54 58`
- [ ] these eleven are unchanged — `9 10 11 12 16 17 18 20 24 25 26`
- [ ] and on `58` the ruling is still at full strength
- [ ] no screen whose drawing stays in one quadrant steps back at all
- [ ] the axis numbers are never below .5 anywhere
- [ ] every side is painted over every axis
- [ ] a beat that draws its legs late goes quiet once, not twice

And by eye:

- [ ] screen 61, where the triangle straddles both axes — the sides read
      as the subject and the axes as the paper
- [ ] screen 54 on the wide board, where the line runs from the origin
- [ ] screen 26, already quiet, looks exactly as it does today

---

## 9. Built — 19 Sep 2026

Every box in §8 ticks, measured in the harness and watched in headless
Chrome.

### 9.1 What it does

`Board.crossesAxis()` asks the pair's own line and both placed legs
whether any of them has ends on opposite sides of an axis, or an end on
one. `#gridPanel.crossed` follows it, and carries the §4 numbers:

```
                      axis lines   arrows   numbers   ruling
read    (quietBoard)     .3         .3        .5       .35
crossed (automatic)      .3         .3        .5        1
```

Measured on the live page: screen 49 and screen 54 are `crossed` alone —
axes .3, numbers .5, **ruling 1**. Screen 61 is both — ruling .35.
Screen 26 is `quiet` alone and is exactly what it was.

No screen gained a flag. The seventeen the prompt names all step back,
and so do the axis-case beats, which draw a pair lying *along* an axis
and never declared a segment for a hand-written list to find.

### 9.2 What the spec did not anticipate

**Where the class is computed matters more than what it computes.**
Recomputing on every mutation — each leg as it is placed, each group as
it is switched on — makes the board briefly answer for a half-drawn
picture: the last screen's pair still up, this screen's legs going down.
Seven screens showed a `crossed` that was true for a few frames and
false by the time anything settled. It is now asked when the drawing is
coherent: when the pair is placed, when the last leg of a run is placed,
and when either is cleared. No screen flickers.

*(The .45s fade would have hidden a 40ms transient anyway. It is still
wrong to be computing an answer about a picture that is not there yet.)*

### 9.3 And one real bug, found by §5

§5 said the drawing is painted over the axes because the axes are built
first, and that nothing must change it. **Something already had.**

`setRange` — which arrived with the second board range — tears the axis
nodes out and calls `buildAxes()`, which **appends**. Appending is right
the first time, when it runs before anything else exists, and wrong
every time after: the rebuilt axes went on top of the very drawing they
are the paper for. Since the `mid` and `wide` boards existed, every
screen that changes range has been drawing its triangle *under* the
axes — which is the loudest possible version of the problem this prompt
is about, and neither the eye nor any probe had caught it.

The rebuilt nodes are now put back at the front of the SVG. Checked
going close → wide → mid → close: the drawing is on top on all of them.

### 9.4 Probe

**`qa-quiet`** is new: the seventeen, the fade matching what is actually
*drawn* on every screen (not what the screen declares — the axis-case
beats would fail that test while being perfectly right), the read-quiet
screens untouched, screen 58 keeping its ruling, no flicker, and the
drawing painted over the axes.

Suite: **86 green, 11 red** — the same eleven as before this change,
which are the four standing ones plus the seven left red by the
unfinished labelling work on this branch. Nothing new is red.

### 9.5 Noticed, not fixed

Jumping straight to **screen 20** from the title beat leaves it drawing
screen 14's column instead of its own row. It is the picker-jump class
of bug `qa-picked` covers for screens that say `keepSegment`; 20 does
not say it and is not covered. It plays correctly in order, and it is
nothing to do with the fade — recorded here so it is not lost.

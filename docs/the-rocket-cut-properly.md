# Build prompt — the rocket flies like a rocket, and she gets out of it cleanly

Two faults in the title screen's arrival, one of them mine and both
measurable.

---

## 0. What is wrong, measured off the art

### 0.1 Every frame shows the frame next to it

The two sheets were wired up as plain strips — eight even cells of
271.5 × 724 — on the evidence that the rocket sheet's gutters fell
exactly on that grid. **The get-off sheet does not.** Counting runs of
inked columns (a gap of 6px or more counting as a break):

| sheet | ink clusters | cells showing another frame's ink |
|---|---|---|
| rocket | 6 | **3 of 8** |
| get-off | 7 | **8 of 8** |

Every single get-off frame has a neighbour's art inside its window.
That is the thing on the screen.

The clusters, left to right:

```
rocket    0:   17.. 262    1:  289.. 531    2:  560.. 805
          3:  819..1622  (three drawings touching)
          4: 1639..1890    5: 1914..2161

get-off   0:   14.. 648  (three drawings touching)
          1:  660.. 870    2:  880..1101    3: 1124..1322
          4: 1334..1534    5: 1560..1726
          6: 1747..2162  (two drawings touching)
```

**There is no grid to find.** Where the drawings touch there is no gap
to cut at, so those boundaries are a decision, not a measurement —
which is why this cannot be done by dividing by eight and why it has
to be checked frame by frame afterwards.

This is the same problem the game's own two sheets have, and they
already solve it: `fly` and `talk` carry an exact rect per pose
*because* their poses bleed past any cell you would draw. The rocket
sheets need the same treatment. Wiring them as even strips was my
mistake and the comment I left claiming they were "drawn consistently
inside those cells" is wrong for the get-off sheet.

### 0.2 The rocket still flies like a bird

`startFlyIn` is unchanged from when a bird flew it: **nine waypoints
that bob up and down** — y −262, −368, −205, −338, −178, −290, −148,
−212, −62 — which is a wingbeat arc, plus **eleven `SFX.flap()` calls
at 175ms**, and `linear` easing over 2600ms.

A rocket does not flap and does not bob. The sheet even draws its
flame lengthening, and the motion contradicts it.

---

## 1. The cut

**Every frame gets its own rect**, in the shape `fly` and `talk`
already use: `{ x, y, w, h, ax, ay }`, measured from the alpha.

**The rule that decides it is one line: no frame's window may contain
any ink but its own.** Where two drawings touch, put the boundary
where the artist's intent is — between the two compositions — and
accept that a pixel or two of a neighbour's outer glow is the cost;
what must never appear is a recognisable piece of another rocket or
another bird.

Cut **left to right, in order**, so frame *n* is always the drawing
that comes after frame *n−1*. The number of frames is whatever the
sheet actually holds, which is what §0.1's clusters have to be
resolved into — not assumed to be eight because the other sheet was.

---

## 2. The rocket flies like a rocket

- **One line, not an arc.** In from off-stage on a single smooth path.
  A gentle curve is right; the up-down bobbing is not.
- **It accelerates in and settles.** Ease, not `linear` — fast while
  it is far away, slowing as it comes down. The current constant speed
  is the one thing that most makes it read as drifting.
- **No wingbeats.** `SFX.flap()` has no business here. If there is a
  whoosh or a thruster in the audio layer, use it; if there is not,
  it is better silent than flapping. Do not add an audio library.
- Her calls on the way in can stay — she is still a bird, and they are
  the only thing that says she is in there.
- It should still be skippable by tapping, and still land in exactly
  the same place, at the same size, as it does now.

---

## 3. Getting out

**Left to right, one frame at a time, once, in order** — and the
registration is the part to get right:

- **The rocket stays still while it is in shot.** She climbs out of a
  rocket that is standing on the grass; the rocket must not slide,
  bob or drift while she does it.
- **She is continuous.** Her last position in the rocket sheet is her
  first position in the get-off sheet, at the same size.
- **It ends exactly on the standing pose** — same place, same size, no
  jump on the last change.

Those three are what per-frame anchors are for: each frame's anchor is
chosen so the thing that should be still, is.

---

## 4. What must not break

- **Her size.** The three sheets are drawn at three different scales
  and the current numbers line them up at the two handovers: her head
  is 246px across standing, 168 in the last rocket frame, 229 in the
  first get-off frame, 262 in the last. Re-cutting the frames must not
  disturb that.
- **She lands where she landed** — the perch, unchanged.
- **The title screen only.** The game's own screens keep the wings and
  are not touched.
- **Play still appears once she is standing**, not during the climb.
- Tapping through the arrival still puts her straight on the perch.
- The departure still takes her away in the rocket.

---

## 5. Acceptance — watched, and measured

- [ ] **no frame of either sheet shows any part of another frame** —
      checked frame by frame, not by eye on one still
- [ ] the arrival reads as a rocket: one path, no bob, no flapping
- [ ] it eases in rather than arriving at a constant speed
- [ ] she climbs out left to right, in order, once
- [ ] the rocket does not move while she climbs out of it
- [ ] she is the same size in the last rocket frame and the first
      get-off frame
- [ ] and the same size again on the change to the standing pose
- [ ] she ends standing exactly where she stands today
- [ ] Play arrives after she is standing
- [ ] tapping through the arrival still works
- [ ] pressing Play still takes her away in the rocket

---

## 6. Built — 21 Sep 2026

Every box in §5 ticks.

### The cut

The sheets are cut pose by pose now, the way `fly` and `talk` are.
Resolving §0.1's clusters gave **8 frames in the rocket sheet and ten
in the get-off sheet** — and the get-off sheet turns out to be laid
out on a **217.2 pitch, not 271.5**: ten drawings, not eight. That one
number is the whole of the original fault. Dividing 2172 by eight was
cutting ten drawings into eight windows, which is why every single one
held part of a neighbour.

Proved by rendering every frame into its own window on one page and
looking at all eighteen: no frame shows any part of another. The probe
holds the weaker form of it — that no two frames share a column of the
sheet — because that is the part a machine can keep checking.

### The anchors

Chosen per frame for whatever has to hold still:

- **the rocket sheet pins the porthole**, so the craft is steady in
  flight and only she shifts about inside it;
- **the get-off sheet pins the porthole too**, for as long as the
  craft is in shot — measured, it sits within a pixel or two of the
  same place in all seven of those frames, so the rocket does not
  slide while she climbs out of it;
- **the frame she stands on pins her belly**, which is what the
  standing pose is pinned by, so the change to it moves nothing.

### Nine frames of ten

The sheet's **9th drawing is left out**. It puts the craft back on
screen 145px from where it had been standing, and a rocket that
teleports for one frame is worse than one that is simply out of shot
once she is clear of it. The 10th is her standing and is kept, as the
frame that hands over.

### The scales

`k` is how much bigger each sheet's art is than the talk sheet's, so
she comes out the same size in all of them. Her head is 246px across
standing and 147 in the last get-off frame, which fixes that sheet
exactly — the handover to standing is dead on.

The rocket sheet cannot match both her head and the craft across its
own handover: the two sheets draw them in different proportions. It
splits the difference, so each is out by **3.6%** rather than one of
them by 7%. That is under what the eye catches on a single frame
change, and it is a real limit of the art rather than something to
tune away.

### The flight

One line in from high on the left, easing down onto the grass —
`cubic-bezier(.16,.62,.30,1)` over the same 2600ms. The nine bobbing
waypoints are five that only ever descend, and the eleven `SFX.flap()`
calls are gone; the craft arrives on the whoosh alone, because there is
no thruster in the audio layer and adding one was out of scope.

### One thing I broke and caught

Replacing the keyframes block left **a stray `}`** behind — my cut
stopped at the closing brace of the `100%` rule rather than the
block's. A stray brace in CSS silently deletes the next rule, which
here was `#playBtn`, and Play rendered as an unstyled circle in the
corner. This project's notes already record that exact trap and I
walked into it anyway. The file's braces now balance, 465 to 465, and
that count is the cheap check worth keeping.

### Verification

`qa-rocket.js`: ten checks in a real browser — the frames disjoint,
the approach never rising, the easing, the climb running left to right
through all nine frames once, the rig still throughout it, the
hand-over to the standing pose, and nothing thrown. Tapping through the
arrival still puts her straight on the perch with Play live, and
pressing Play still takes her away in the rocket. A full play-through
of 51 screens raises no exceptions.

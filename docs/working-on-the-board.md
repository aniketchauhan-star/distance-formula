# Build prompt — the working belongs on the board

When the game works a formula out, it should stop being two things. The
board comes to the middle of the frame, pushes in on what is drawn, and
**the working is written on the paper beside the triangle**. Nobody else
is on screen. No panel, no control, no bird.

**Read section 0 of `docs/horizontal-distance-animation.md` first**, then
`docs/numbers-come-from-somewhere.md` — this is the beat that prompt's
flights happen in, and it makes them a quarter as long.

---

## 0. What exists, and what this changes

| today | after |
|---|---|
| board on the right at `GRID.box` (644, 12) 1232×1056 | board in the middle at `GRID.centre` (306, 12) 1308×1056 |
| whole board in shot — the triangle is 4 cells of a 14-cell paper | pushed in on the triangle **and the room the working needs** |
| working written in the answers panel, left column | working written **on the paper**, beside the drawing |
| she flies out, the control goes with her | unchanged — and now nothing takes their place |
| a number flies right across the screen into a panel | a number travels a few cells, on the same paper |

The camera (`Board.viewTo` / `viewFor`), the centred box (`GRID.centre`),
the quiet board (`quietBoard`), the camera-sized type (`--coordFs` and
friends) and the flights all exist. What does not exist is a working
drawn **in the SVG**, and the framing that leaves room for one.

---

## 1. Why — and this is the whole prompt

**A panel beside a picture makes the child choose.** Right now the
algebra is on the left and the triangle is on the right, and reading one
means not looking at the other. The child's eye crosses the frame on
every line, and each crossing costs them the thing they were holding.
For most of this game that is a fair trade — a question and its control
are different jobs. For a *worked solution* it is not, because the whole
job is holding the two together.

**Written on the paper, the choice disappears.** `4²` sits a hand's
width from the run of four squares it counts. The `5` that flew out of
`(5, 4)` lands where the child can still see the label it left. The
formula stops being a caption for the drawing and becomes part of it —
which is the claim the lesson has been making since screen 8 and has
never once shown.

**The board comes to the middle because nothing else is there.** She has
gone, the control has gone. A board still sitting off to one side says
something is missing from the other side; a board in the middle says
this is the only thing now. That is not decoration, it is where the
child should be looking.

**It pushes in because the working has to be legible and the squares
have to be countable.** Fourteen cells of paper is a scale for plotting
points. Nine is a scale for reading a triangle and an argument about it
at the same time.

**And it is a held moment.** The child is not being asked anything. They
have either just got it right or just run out of goes, and either way
the next thing they need is time and one uncluttered picture. Everything
here serves that: fewer things, bigger, together, still.

---

## 2. What the child sees

```
   ┌─────────────────────────────────────────────┐
   │                                             │
   │    d = √((x₂ − x₁)² + (y₂ − y₁)²)           │
   │                                             │
   │    d = √((5 − 1)² + (4 − 1)²)         ●B    │
   │                                      ╱┆     │
   │    d = √(4² + 3²)                  ╱  ┆ 3   │
   │                                  ╱    ┆     │
   │    d = √(16 + 9)               ●A┄┄┄┄┄●C    │
   │                                    4        │
   │    d = √25 = 5 units                        │
   │                                             │
   └─────────────────────────────────────────────┘
        the working                the drawing
```

One board. The triangle where it has always been, on its own
coordinates. The working beside it, on the same paper, arriving a line
at a time — and the numbers that were read off the drawing crossing the
short distance from the label to the line, which is now a move the child
can follow with their eyes rather than their memory.

---

## 3. The framing — the part that needs thinking about

**The view must frame the drawing *and* the writing.** Today `viewFor`
frames what is drawn plus a margin. That is right for screens 24–26,
where the triangle is the only thing in shot. Here it would push in so
far that there is nowhere to write.

So: **ask for the drawing, then for the room the writing actually
needs.** "Double it" was this section's first answer and it is the wrong
shape of one — see §11. The working is set to a fixed size *on the
stage*, so its width in pixels does not change with the view, and the
column has to be that many pixels wide however far the board comes in.
That gives a closed form rather than a multiplier:

```
column_px = c · panel / (D + c)   must be at least L
    →   c = L·D / (panel − L)
```

`L` is the widest line in stage pixels, `D` the drawing's width in board
units. Then the aspect rule from `grid-zoom.md` §3 applies exactly as it
does now: grow the short axis until the view's shape matches the
panel's, or the squares stop being square.

**Which side does the writing take?** Whichever side the drawing is not
on. Work it out from where the drawing sits against the board's middle,
never type it: A(1,1)–B(5,4) sits right of centre, so the writing goes
left; a pair in the left half puts the writing right. On a pair dead
centre, prefer the left, because that is the side the working has always
been on in this game and the child has seen it there thirty times.

**Worked example, screen 45.** The drawing spans `x 1..5`, `y 1..4` —
four cells by three, plus labels. The working's widest line is about
460 stage pixels at 30 units of type, which asks for a column of roughly
270 board units; the view comes out `x 100..1037` by `y 0..810`, a 1.16×
push. One cell is then about 108 stage pixels, which is a countable
square.

**The type size and the push trade against each other, and that is a
teaching decision rather than a layout one.** At the 40 units a working
would want, the column it needs fills the paper and there is no push at
all — the board just slides to the middle. Bigger type or a bigger push;
not both.

**Both axes stay in shot if they can**, and are not worth distorting the
frame for. On a triangle in the first quadrant the origin comes free.

---

## 4. The working, written on the paper

### 4.1 Where

Left-aligned in the writing column, vertically centred on the drawing —
so the two read as one spread rather than as a list next to a picture.
Lines evenly spaced, about one and a third cells apart.

**It must never touch the drawing, the axes, or their numbers.** The
column is chosen to make that true; a line that would still reach into
the drawing means the framing was wrong, not that the line should be
nudged.

### 4.2 How big

Set it like every other label on this board: **name the size it should
be on the stage and divide by the magnification**, exactly as
`--coordFs` already does. A working that keeps its board-unit size would
come out half again too big the moment the camera moved.

The working is the subject of the screen, but it is also the thing that
decides how far the board can come in — see §3. It ends up a little
smaller than a coordinate label rather than larger, which is the price
of a push worth making.

### 4.3 How it arrives

One line at a time, about a second and a half apart — the reading time
for a line of algebra, and the pace the panel already uses. Each line
lands whole.

**And the numbers still fly.** Everything in
`docs/numbers-come-from-somewhere.md` holds: a number that was read off
the board leaves the thing it was read from, the half it came from
lights as it goes, the side of the triangle lights as it lands, and
numbers that were worked out simply appear.

What changes is that the flight is now **a short hop on the same paper**
rather than a journey across the frame — so it can use the board's own
`Board.tweenText`, which is the older and safer of the two flights, and
the child can watch the number leave and arrive without losing either
end. That is a straight improvement and it is most of why this is worth
building.

---

## 5. The radical — the one genuinely new drawing

The working panel draws `√` as HTML: a span for the tick, a border for
the bar. On the board it has to be SVG.

Two parts, and the second is the one that goes wrong: **the tick**, and
**the bar over the radicand**. The bar has to span exactly the radicand
and no more, which means the radicand's width has to be measured before
the line is placed — `Board.textMetrics` is what measures text on this
board, and it is the only thing that should.

The existing `Radical` module already works out which characters are
inside the sign. Reuse that decision; only the drawing is new.

**If the radical cannot be drawn well, do not fake it.** A tall glyph
from a fallback face, or a bar that overshoots, is worse than not
pushing in at all — this beat exists to be looked at closely.

---

## 6. Clutter — the rules that keep it clean

The whole point is that there is less on screen. That is easy to lose
one addition at a time.

- **Nobody is on screen.** No bird, no shadow, no bubble, no control, no
  answers panel, no hint. They are gone before the board moves, not
  during.
- **The board is quiet.** The ruling, the axes and their numbers fall
  back — `quietBoard` already does this — so the triangle and the
  working are the only two things at full strength.
- **The axis numbers go**, as they already do on any pushed-in beat.
  At this scale they are the loudest thing left and the beat is not
  about them.
- **Nothing is written twice.** The lengths on the legs stay; the
  working does not restate them in a corner.
- **One thing arrives at a time.** One line, or one flight. Never both.
- **Nothing blinks, pulses or drifts** while a line is being read. The
  only movement is the thing currently arriving.

---

## 7. Which screens

**The worked solution, wherever it happens** — the beat after a right
answer on 28, and after the ladder is spent on 29, 30, 45 and 47. Those
five are the whole of it: they are the only screens where the game
writes a derivation with nobody asking anything.

**Not the axis cases (39, 41).** She is narrating those, and the formula
is being *narrowed* rather than worked — the panel beside her is right
for a line she is talking over.

**Not the recap (36).** It is a statement, not a working: nothing is
being derived, the board carries no pair to write beside, and it already
has the frame to itself.

If the axis cases should move too, that is a separate decision and a
separate prompt — it changes what she does, not just where the words go.

---

## 8. How to build it

1. **A screen says it wants this**, e.g. `stage: 'working'`. Everything
   below follows from that one flag; nothing is decided in code that a
   screen cannot see.
2. **Move, then push, then write** — in that order, and never two at
   once. The panel slides to `GRID.centre` (it already slides:
   `#gridPanel.sliding`), then `viewTo` pushes in, then the first line
   is written. A board that moves while it is being read is a board
   nobody reads.
3. **`Board.viewFor` gains the writing room.** One more named view —
   the drawing's box, doubled away from the drawing, then the existing
   aspect fit. Everything else about `viewFor` stays.
4. **`Board.showWorking(lines, later, done)`** — SVG text in
   `#gridAxes`, one node per line, sized through the camera the way
   every other label on the board is, placed in the writing column, and
   pooled the way the sum's parts are rather than created per screen.
5. **The flights use the board's own.** `Board.tweenText` from the
   label to the line's own position; `FX.flyGlyph` stays for anything
   that still has to leave the board.
6. **Every duration and every size in config**, in one block beside
   `GRID.xeq`.
7. **Pull out afterwards**: the board goes back to its box and its full
   view before the next screen, or the next screen inherits a pushed-in
   board it did not ask for.

---

## 9. What must not break

- **A square stays square**, at every moment of the move and the push.
- **The frame does not change** — no thicker border, no bigger corner
  radius. Only what is inside the window changes, and where the window
  is.
- **Nothing drawn moves on the board.** Every point keeps its
  coordinates; it is the camera that moves.
- **The whole drawing stays in shot** — both points, the corner, all
  three coordinate labels, all three letters, both leg lengths.
- **The working never overlaps the drawing, the axes or their numbers.**
- Screens 12 and 18 are untouched. They work their sum on the board
  already, at the board's own scale, and are not part of this.
- The answer still ends up on the line it measures.
- Back and Next leave the board in the right place, at the right view,
  with no working left written on it.
- Every screen that does not ask for this is unchanged.

---

## 10. Acceptance — in a browser, watching it

- [ ] the control and the bird go, and only then does the board move
- [ ] the board slides to the middle of the frame — even margins left
      and right
- [ ] it pushes in once, smoothly, and lands with the triangle in one
      half and clear paper in the other
- [ ] the squares are still square at every moment of both movements
- [ ] the axis numbers have gone; the ruling and axes are quiet
- [ ] the working is written on the paper, one line at a time, readable
      at the pace it arrives
- [ ] the radical's bar spans exactly its radicand
- [ ] the numbers that were read off the board still fly — and now only
      a few cells
- [ ] nothing is ever written over the drawing, the axes or their
      numbers
- [ ] the answer lands on the line it measures
- [ ] the board pulls back out before the next screen
- [ ] Back then Next replays it once, cleanly
- [ ] every screen that does not ask for it is unchanged

---

## 11. Built — 19 Sep 2026

Every box in §10 ticks, watched in headless Chrome as well as checked in
the Node harness. Screens 28, 29, 30, 45 and 47 carry `stage: 'working'`
and everything follows from that one flag.

**The room the working needs is worked out, not guessed at**, and §3's
"double it" turned out to be the wrong shape of answer. The working is
set to a fixed size *on the stage* — like every label here it shrinks in
board units as the camera comes in — so **its width in pixels does not
change with the view**. The column that holds it has to be that many
pixels wide however far the board pushes in, which gives a closed form:

```
column_px = c · panel / (D + c)   must be at least L
    →   c = L·D / (panel − L)
```

`L` is the widest line in stage pixels, `D` the drawing's own width in
board units. That is the widest push this drawing and this working can
both fit in — ask for more and the lines run into the triangle, ask for
less and the board barely moves. `Board.workingWidth(lines)` measures
`L` before the push.

**It also decides the type size, which is a teaching decision.** At the
40 units a working would want, the room needed fills the paper and there
is no push at all — the board just slides to the middle. At 30 the
column comes out at about a third of the view and the push is 1.16×.
Bigger type or a bigger push; not both. 30 buys the push.

**The radical is one `√` and one drawn bar.** The panel draws the sign
itself because Lilita One has no radical — but the board's labels are
Nunito, which does, so the sign is simply typed and only the overbar is
drawn: a `<line>` from the end of the sign to the end of the radicand,
both measured with `Board.textMetrics`, which is the only thing that
measures text on this board.

**Each line is a `<text>` of `<tspan>`s, one per part** — so a part is a
node the working can fly a number into and light, which is what let
`docs/numbers-come-from-somewhere.md` come with it unchanged.

### Three things the spec did not foresee

- **The town was sitting on the working.** Five buildings and their name
  pills, drawn over the very half the lines were about to occupy — and
  invisible to a clash check that only looked inside `#gridAxes`,
  because the town is a layer of its own. The board is cleared of
  everything the working is not about before it moves: the town goes,
  and so do the places marked beside the pair.
- **The last line landed on the x-axis.** Centred on the drawing, five
  lines reach down to `y = 0`, and the axis is the one line on this
  paper strong enough to cut through text. The whole block moves clear
  of it, not the line — evenly spaced lines with one nudged aside read
  as a mistake.
- **A part that was worked out never took its colour.** The first pass
  only lit parts that flew, so `16`, `9` and `25` stayed navy. Both
  kinds light now, which is the point: the distinction is between where
  a number came from, not whether it matters.

### Probes

Three asserted the working appears in the panel — the thing this
removes. All three were taught to follow the screen rather than
silenced: `qa-sync` watches whichever the screen uses and still checks
that each part lights the side it names as it names it (seven beats, in
order, on the board); `qa-typedwork` checks that the board takes the
middle before it writes and that no panel comes up beside it;
`qa-optwork` checks the lines are on the paper and keeps its pacing
arithmetic for the screens still using the panel.

Suite is at its five standing reds. Browser capture: `cdp-work.js`,
which also checks that nothing written overlaps anything drawn —
ignoring what is switched off, since a thing at opacity 0 still has a
box, which is how the town hid from the first version of that check.

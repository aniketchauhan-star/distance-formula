# Build prompt — horizontal distance, worked on the graph

One animation in *Swifty's Adventure*. Written against the real codebase.

---

## 0. READ THIS FIRST — why previous attempts did not work

Two SVG techniques look correct, pass every logic check, and then render
as nothing (or as something flying in from the corner of the board) in
real browsers. Both have already been tried here and both failed.

**Do not use `transform-box: fill-box` on an SVG `<text>`.**
This codebase already documents why, in `js/game.js` where the axis
numbers are built:

> *Relying on `transform-box: fill-box` here is what stops the pop being
> seen in some browsers — Safari has long been unreliable about the fill
> box of an SVG `<text>`, and when it falls back the origin becomes the
> whole viewBox's centre, so the label flies in from the middle of the
> board instead of growing in place. Naming the point outright removes
> the guesswork.*

**Do not use `clip-path: inset(...)` on an SVG `<text>`** to reveal it.
Support is uneven and it silently shows nothing.

**Never set a transition's start and end in the same tick.** A browser
given both in one style pass never sees the start, and the element simply
appears at its destination — which is exactly what "the numbers don't
come" looked like. Put the start state in one `later()` call and the
journey in a second one ~40ms on, so a paint happens between them. Do not
rely on forcing a reflow: `void el.getBoundingClientRect;` — without
parentheses, as it appears in this codebase — references the method and
forces nothing.

### What to use instead — and what the build now does

- **Move text by tweening its own `x`, `y` and `font-size` attributes
  from JS** (`requestAnimationFrame`, with the easing solved in code).
  This is what `Board.tweenText` does. No CSS transform is involved at
  all, so there is nothing for any browser to misplace or fail to start.
  The caller pins the final values itself when the time is up, so the end
  state never depends on a frame having painted.
- To reveal something, animate **`opacity`** — nothing else is as safe.
- If a transform is ever unavoidable, put it on a `<g>`, or name its
  origin in user units (`x + 'px ' + y + 'px'`) as the axis labels do.

**A stray `}` in the stylesheet silently deletes the next rule.** CSS
parses an unmatched `}` as the start of the following rule's selector,
which makes that selector invalid, so the whole rule is dropped without
any error. One left behind by an earlier edit removed the coordinate
highlight rule (`.glowable.glow`) for four screens. After any CSS
removal, scan the file for brace balance.

**Before saying it is done, open it in a browser and watch it.** Logic
tests in the Node harness cannot see paint: they confirm that a class was
added, never that anything appeared. Every failure so far has been in
the gap between those two things.

---

## 1. Scope

Improve **only** the horizontal-distance explanation on the existing
coordinate graph — the beat whose spoken line is the subtraction itself
(`js/config.js`, the screen whose `line` reads `6 - 3 = 3`).

Do not redesign the screen. Do not rebuild the graph. Do not change the
character, navigation, audio, or any game logic.

**Which pair.** A = **(3, 2)**, B = **(6, 2)**, so the sum is
**6 − 3 = 3**. Build it from whatever pair is on the board — never
hard-code the digits.

---

## 2. Starting state

The board arrives carrying, from the beats before it:

- the two points joined by a solid line at `y = 2`
- both coordinate labels, centred 42px above their own points
- the length `3 units` already written on the line — **this must be gone
  before the sequence starts**; the animation is what produces it
- both x-halves of the coordinate labels already lit — **also to be
  cleared**
- the previous balloon, mid pop-out (leave it; that is how lines end)

---

## 3. Where the numbers come from

The two digits are lifted **out of the coordinate labels** — the `3` from
inside `(3, 2)`, the `6` from inside `(6, 2)`.

**Nothing on the grid or the axis numbering is touched or lit at any
point.** The only things that light are the two digits inside the two
coordinate labels.

Each digit is **copied**. The labels themselves never move, never change,
never lose a character.

---

## 4. The sequence

Slow and readable. Every duration in config, in one block.

| # | what happens | ms |
|---|---|---|
| 1 | both `2`s light inside the two labels — they match, so they are not the distance — then release | 1000 |
| 2 | the `6` lights inside `(6, 2)`; a copy travels up into the **front** of the sum | 320 + 800 |
| 3 | the `3` lights inside `(3, 2)`; a copy travels up into the **back**, leaving `6  3` | 320 + 800 |
| 4 | `−` appears between them | +300 |
| 5 | `=` appears | +500 |
| 6 | the answer `3` appears | +350 |
| 7 | held to be read | 900 |
| 8 | the segment lights from A to B, left to right | 800 |
| 9 | a beat | 900 |
| 10 | the answer leaves the sum and travels **down to the middle of the span**; the rest of the sum fades as it goes | 900 |
| 11 | `units` is written after it — the line reads **`3 units`** | 850 |

Fades and travel only. No bounce, no scale-in, no flicker, no spin.

The digit that descends must be the **same element** that was worked out —
not one faded out and another faded in.

**Final state**, held until the beat advances:

```
   (3, 2) ●──── 3 units ────● (6, 2)
```

Both labels, both points, the line, `3 units` between them. Nothing above.

---

## 5. Constraints

- Originals never move. Each travelling digit is a copy, discarded when
  the thing it becomes takes over.
- The two digits never overlap, in flight or at rest.
- Warm (orange `#E07B12`) only for the digits being taken and the answer.
  The rest of the sum is navy `#102D70`. Nothing stays lit permanently.
- One easing everywhere: `cubic-bezier(.22, .61, .36, 1)`.
- The balloon shows **nothing** on this beat. She still speaks the line.

---

## 6. Codebase notes

1. **Clear inherited state in `goTo`**, at the screen change — not when
   the sequence starts. Clearing it later leaves it on screen for the
   first third of a second.
2. **`sayOnly` must honour the beat's `hold`**, or a line spoken without
   a balloon takes the ordinary pause and the board is carried off
   mid-sequence. Derive the hold by summing the step durations.
3. **`animation` is one CSS property.** Two rules matching one element
   fight; specificity first, then source order. A rule that must beat a
   running animation has to be an animation itself, placed below it.
4. **Compute positions, don't measure them.** The board may not be laid
   out yet, so `getBBox`/`getComputedTextLength` are unreliable. Use
   `Board.textW(text, size)`; a coordinate label's parts are `tspan`s
   carrying `data-part="x"` / `"y"`.
5. **Reuse the count-out's placement** for where `3 units` ends up — it
   already keeps clear of the labels and the drawn lines.
6. **Queue every step through the game's `later()`**, never bare
   `setTimeout`, so a skip or screen change cancels the whole sequence.

---

## 7. Acceptance — in a browser, watching it

- [ ] **every step is actually visible on screen**, start to finish
- [ ] the travelling digit starts on the digit it came from and arrives
      where it should — not from the centre of the board, not invisibly
- [ ] `units` appears
- [ ] the coordinate labels never move, change or vanish
- [ ] nothing on the grid or axis numbering ever lights
- [ ] the 6 is taken first and lands left of the 3 — the order the sum
      is read and said
- [ ] the two digits never overlap
- [ ] the parts appear strictly in order
- [ ] the answer that descends is the same element that was worked out
- [ ] the rest of the sum is gone by the time it lands
- [ ] the line ends up reading `3 units`, between the two points
- [ ] the segment stays visible throughout
- [ ] nothing is written into the balloon
- [ ] no length is on screen before the sequence produces it
- [ ] the board holds until the sequence finishes
- [ ] the sequence runs exactly once per visit

# Build prompt — vertical distance, worked on the graph

The column twin of `horizontal-distance-animation.md`. That sequence is
already built and verified in a real browser for the row; this prompt is
about applying it to the column beat and the handful of things a column
does differently. Read the horizontal prompt's section 0 first — every
pitfall in it applies here too.

---

## 1. Scope

Improve **only** the vertical-distance explanation — the beat whose spoken
line is the subtraction itself (`js/config.js`, the screen whose `line`
reads `2 - (-3) = 5`, currently screen 18).

Do not redesign the screen, the graph, the character, navigation, audio or
game logic. Reuse `Board.runEquation` — it already handles a column — and
change only what a column needs.

**Which pair.** A = **(1, 2)**, B = **(1, −3)**. The x's match, so the
distance is the difference of the y's: **2 − (−3) = 5**. Build it from
whatever pair is on the board — never hard-code the digits.

---

## 2. Starting state

Inherited from the beats before it:

- the two points joined by a solid vertical line at `x = 1`
- both coordinate labels — over the upper point, under the lower one
- the length **`5 units` already written beside the line** — this must be
  **gone before the sequence starts**; the animation is what produces it.
  It comes from screen 15's `result`; remove that, exactly as screen 9's
  was removed for the row, so 15, 16 and 17 show the pair with no length
- both **y-halves already lit** from the beat before — to be cleared
- the previous balloon, mid pop-out (leave it)

---

## 3. Where the numbers come from

Out of the **coordinate labels** — the `2` from inside `(1, 2)`, the `−3`
from inside `(1, −3)`. Nothing on the grid or the axis numbering is
touched or lit. Each digit is **copied**; the labels never move, change or
lose a character.

**Order.** The digits are taken in the order the sum is *read and said* —
"two minus minus-three" fetches the two first. Here that is the **2**
(upper point), then the **−3** (lower), so on a column the sum's order and
the board's reading order happen to agree. On a row they do not: the six
of "six minus three" is the right-hand point, and it still goes first.

---

## 4. What a column does differently

1. **Brackets round the negative.** The sum must read **`2 − (−3) = 5`**,
   never `2 − -3 = 5`. `runEquation` currently formats the smaller value
   as `String(lo)`; wrap it in brackets when it is negative, as the old
   `revealUnits` did. The copy that travels out of `(1, −3)` is `−3`; the
   brackets belong to the sum's own part, so they appear when it lands.
2. **The sum sits above the upper point, centred on the column.** With the
   column at `x = 1` that centre is one cell from the y-axis, and a sum
   this wide would lie across the axis numbering. Push it clear —
   `Board.clearOfYAxis` exists for exactly this — so it sits wholly to the
   right of the axis.
3. **The matching halves are the x's.** Step 1 lights the `1` and the `1`,
   not the y's. `runEquation` already picks the axis from the pair
   (`row` false → `part = 'y'`, glow the other half first); confirm it
   lights x's here.
4. **"5 units" lands beside the line, not on it.** A column's total sits
   to the side of the segment, away from the y-axis, stepped off the
   x-axis row — `showUnitTotal`'s column branch already does this. Reuse
   it (`quiet` mode) for the landing spot, so the answer comes down to
   exactly where a counted-out total would sit.

Everything else — timings, the y-halves-then-digits order, the sum
assembled a piece at a time, the sweep, the descent, the word written
after — is the row's sequence unchanged, and lives in `GRID.xeq`.

---

## 5. The sequence

| # | what happens | ms |
|---|---|---|
| 1 | both `1`s light inside the labels — they match — then release | 1000 |
| 2 | the `2` lights inside `(1, 2)`; a copy travels to the **front** of the sum | 320 + 800 |
| 3 | the `−3` lights inside `(1, −3)`; a copy travels to the **back** | 320 + 800 |
| 4 | `−` appears between them | +300 |
| 5 | `=` appears | +500 |
| 6 | the answer `5` appears | +350 |
| 7 | held to read | 900 |
| 8 | the segment lights from the upper point down | 800 |
| 9 | a beat | 900 |
| 10 | the answer travels to the spot **beside the line**; the rest fades | 900 |
| 11 | `units` appears after it — **`5 units`** beside the line | 850 |

Fades and attribute travel only. No CSS transform on any `<text>`.

**Final state**, held until the beat advances:

```
        (1, 2) ●
               │
               │   5 units
               │
        (1, −3) ●
```

Both labels, both points, the line, `5 units` beside it. Nothing above.

---

## 6. Wiring

- Remove `result` from screen 15's segment.
- On screen 18: add `voiceOnly: true, xEquation: true, hold: XEQ_HOLD`;
  remove its `highlight` — the sequence does its own lighting.
- `goTo` already clears an inherited length and balloon for an
  `xEquation` screen; nothing new needed there.

---

## 7. Acceptance — in a browser, watching it

- [ ] no `5 units` anywhere on 15, 16, 17 or at the start of 18
- [ ] both `1`s light first, then release
- [ ] the `2` is taken first, out of `(1, 2)`, and lands in front
- [ ] the `−3` is taken second, out of `(1, −3)`, and lands behind
- [ ] the sum reads exactly `2 − (−3) = 5` — brackets present
- [ ] the sum sits wholly right of the y-axis, above the upper point
- [ ] the coordinate labels never move, change or vanish
- [ ] nothing on the grid or axis numbering ever lights
- [ ] the answer that descends is the same element that was worked out
- [ ] the rest of the sum is gone by the time it lands
- [ ] it lands **beside** the line and reads `5 units`
- [ ] the segment stays visible throughout; nothing in the balloon
- [ ] the board holds until the sequence finishes; runs exactly once
- [ ] screen 12 (the row) is unchanged

---

## 8. Built — 17 Sep 2026

Every box in §7 ticks, checked in headless Chrome (real time, over the
DevTools protocol) as well as in the Node harness.

What the build changed, beyond §6:

- `runEquation` takes the digits in **reading order** (`firstRead` /
  `secondRead`: left→right on a row, top→bottom on a column) and slots
  each by value — the larger in front, the smaller behind. The sweep runs
  the same way, so a column lights from the upper point down.
- The smaller value is bracketed when negative — `2 − (-3) = 5`.
- The sum is passed through `Board.clearOfYAxis` before `clampX`, so a
  column at `x = 1` lays its sum wholly right of the axis.
- The sum's part widths are weighed **glyph by glyph** (brackets 0.33em,
  minus/equals 0.5em, digits 0.58em) instead of `textW`'s flat 0.58em —
  otherwise `(-3)` claims half again its width and the sum reads with
  holes round it.
- `Board.tweenText` is timed by `performance.now()`, and every landing
  goes through `Board.pinText`, which **cancels the tween before writing
  the final attributes**. A frame already queued when the landing fired
  could otherwise run after it and drag the text back a step — under the
  harness it left the answer parked at the top of the board; in a browser
  it is a one-frame flicker, but the same fault.

Probes: `qa-xeqcol.js` (this beat, 33 checks), `qa-xeq.js` (the row,
unchanged), `qa-notice.js` (both four-beat runs). Browser capture:
`probe-col.html` + `cdp-col.js` — reaches the column via the distance
question before screen 15 and answers it once, since a cold `goTo` past
the question leaves the board unbuilt.

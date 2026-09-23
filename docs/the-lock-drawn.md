# Build record — the combination lock, drawn

The number selector rebuilt as a 3D control in HTML, CSS and vanilla
JavaScript. No artwork, no WebGL, no library: every surface is a
gradient, an inset shadow or a solid slab of colour under a face.

Built 21 Sep 2026.

---

## 1. What changed, and what deliberately did not

**Only the skin.** `css/number-selector.css` is new from top to
bottom. The component's markup, its API and every behaviour the game
relies on are the ones that were already there:

- `mount / show / hide / reset / set / setRange / markCorrect /
  markWrong / lock / onChange / onCheck` — untouched
- the reel is still **five cells**, not three. Three would mean
  recycling a cell in plain sight; the two beyond the visible ones are
  buffers under the housing, and that is where a cell is moved and
  rewritten. Three are visible, which is what the brief asked for —
  the other two are the reason the three never flicker.
- GO still calls the game's own `onCheck`, which is the validation
  that was already there. Nothing about scoring moved.

**Three small changes to the component**, all presentational:

1. A `.pointer` node. It was painted into the frame while the frame
   was a drawing; drawn in CSS it has to be an element, so it can dip
   as a number seats.
2. The action button's word. It was `Check` with the text hidden and
   `GO` painted into the artwork — so the label a screen reader read
   said something the button did not. It says `GO` now, and its
   accessible name says so too.
3. `seatCell` composes the drum's turn along with its position. The
   two either side of the chosen one curve away as the surface of a
   barrel does; the chosen one is straight on and stands proud. That
   belongs in `seatCell` rather than in CSS because the position is
   written as an inline transform, and an inline transform wins.

**The artwork is gone**: `assets/ui/` (eight files) and
`assets/buttons.png`, the sheet they were cropped from — 1.6MB that no
longer has to be fetched before a question can be asked. Nothing
referenced them but this stylesheet.

---

## 2. How the depth is made

One light, from above. Every highlight is on a top edge and every
shadow falls below it. The depth reads because the whole control
agrees about where the light is, not because any one piece is clever.

- **Thickness is a solid offset shadow**, not a translated layer:
  `0 16px 0 #E88A0C` under the housing, `0 9px 0` under each dial,
  `0 9px 0 #1E8A38` under GO. Clipped to the same radius as the face,
  it reads exactly as the slab the face stands on — and it cannot get
  lost the way a `translateZ` layer can (see §4).
- **The bevel is three golds down one edge**, painted as a border-box
  gradient rather than a flat outline: bright along the top, gold
  round the sides, orange underneath.
- **The well is sunk** — a dark inset shadow at the top, a light one at
  the bottom, and a thin teal ring with a pale keyline outside it.
- **The drums are cylinders** by a 90° gradient that is brightest down
  the middle and darkest at both edges, with the seated one in gold,
  scaled up, and standing on its own orange lip *inside* the well.
- **Pressing moves the button and shortens what it stands on**: down
  5–6px, and the slab from 9px to 2–3px. That pairing is what makes it
  feel pressed rather than merely moved.

The scene keeps a 1000px perspective and the control sits almost
front-on. A heavy camera angle makes a game UI harder to read and
harder to hit, and the brief asked for dimensional, not tilted.

---

## 3. One deliberate departure from the brief

**Fixed pixels scaled by `--k`, not `clamp()`/`vw`.** The brief asks
for `clamp(360px, 42vw, 620px)`. The whole stage is already
transform-scaled to the viewport, so a viewport-relative size is
scaled a second time and comes out different at every window width —
a lesson this project has already written down twice, once in this
very stylesheet. The control keeps its 816×520 footprint so the
game's own placement still holds, and `--k` does the fitting.

---

## 4. What the build found

**A `translateZ` extrusion disappears.** The housing's lower slab was
first built the way the brief describes — a `::after` at
`translateZ(-12px)` with `z-index: -1`. Inside a 3D context a negative
z-index puts it behind the scene rather than behind the face, and it
vanished entirely. The solid offset shadow does the same job and
cannot be lost.

**And the dials went behind the housing** for the same reason: inside
`preserve-3d`, `translateZ(25px)` is not a reliable way to say "in
front of" when the thing it is in front of is a sibling pseudo-element.
They carry an explicit `z-index` as well now.

---

## 5. Verification

`qa-sel.js`, in a real browser, playing forward into screen 24:

- [x] the control is on the frame
- [x] nothing in it loads an image — no `url()` on any element or
      pseudo-element of the control
- [x] the button says GO and carries no checkmark
- [x] the reel still has its five cells, and exactly three show
- [x] an arrow rolls the reel one step
- [x] GO hands the chosen number to the game's own check
- [x] no image or stylesheet failed to load

A full play-through — 51 screens, answering every question — raises no
exceptions.

Watched as well as measured: idle, mid-roll, pressed, and the locked
state while a count runs.

---

## 6. Still to do

- **The GO press has no sound of its own.** The brief mentions soft
  mechanical ticks; `Audio8.blip()` already plays on a roll, and I
  have not added anything new — no audio was added because the brief
  said not to add a library, and the existing one has no click sample
  I could honestly call a button press.

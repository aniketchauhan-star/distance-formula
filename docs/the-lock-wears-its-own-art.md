# Build prompt — the number selector wears its own art

`assets/buttons.png` is the control, drawn. Every piece of the number
selector is on it: the housing, the well the numbers turn in, the two
round dials, GO, the pointer, and the two tiles a number sits on.

The selector on screen is a CSS reconstruction of that drawing —
gradients, stacked pseudo-element extrusions, a chevron built from two
borders on a rotated box, four golds declared as custom properties.
It was built because there was no art. There is art now, so the
reconstruction comes out and the drawing goes in.

**The behaviour does not change.** `js/number-selector.js` keeps its
DOM, its reel logic and its public methods. This is a change of skin.

---

## 0. The sheet, cut

`assets/buttons.png` — 1774 x 887, with alpha. Cut by alpha rather
than by assuming a grid: eleven pieces in three bands, measured, not
guessed.

```
   piece                    x      y      w     h     frame     fill
   ---------------------------------------------------------------------
   housing                  73     33    794   307   #da7702   #fcf2db
   reel window             928     71    758   258   #057aa6   #fdf3df
   dial, left (<)          104    380    242   240   —         #f8a228
   dial, right (>)         390    380    241   240   —         #f8a127
   GO                      716    400    604   200   #d57300   green
   pointer (v)            1414    426    193   129   —         #f59b0d
   tile, unselected        184    646    215   213   #ad9782   #fbedd9
   tile, selected          494    645    225   217   #d68700   #fdc913
   digit "6"               830    671    140   175   —         #5e5145
   digit "7"              1129    672    140   171   —         #0042c1
   digit "8"              1432    670    141   175   —         #5e5045
```

Corner radii, measured off the top edge of each piece:

```
   housing        ~56px          GO          ~75px
   reel window    ~45px          tiles       ~25-28px
```

Each cut carries 1-3px of clear margin before its ink starts. Take the
rects above as given — they are the ink's own bounds.

---

## 1. What each piece replaces

The DOM `js/number-selector.js` builds, and what now paints it:

```
   .number-control
     .selector           ← housing            (73, 33, 794, 307)
       .pointer          ← pointer            (1414, 426, 193, 129)
       .reel             ← reel window        (928, 71, 758, 258)
         .seat           ← tile, selected     (494, 645, 225, 217)
         .lane
           .cell         ← tile, unselected   (184, 646, 215, 213)
           .cell.on      ← sits on .seat; the tile under it is the
                           selected one, so .cell.on paints no tile
       .side.prev        ← dial, left         (104, 380, 242, 240)
       .side.next        ← dial, right        (390, 380, 241, 240)
     .check              ← GO                 (716, 400, 604, 200)
```

Three things in that list already exist as nodes only because the CSS
had to draw them. They stay nodes; they stop being drawings.

---

## 2. Two pieces stretch. The rest do not.

The housing and the reel window change width with the control. They
must be **nine-sliced** — `border-image` with a slice past the corner
radius — so the corners keep their shape and only the straight runs
stretch. Slice the housing past 56 and the window past 45; anything
tighter cuts into the curve and the corner distorts as the control
resizes.

Everything else keeps its aspect and is a plain crop:
`background-image` + `background-position` + `background-size`, or a
`<img>` with `object-fit`. A dial, GO, the pointer and a tile are all
fixed shapes; stretching any of them is a bug.

The dials overhang the housing's ends and the pointer sits over the
window's top edge, exactly as they do now. Keep those relationships —
they are the layout, and only the skin is being replaced.

---

## 3. The digits stay as live text

The sheet carries three numerals — 6, 7 and 8. They are a **type
sample, not a set**. The reel shows any number from its own min to its
own max, and several screens ask for a two-digit answer, so a sprited
digit would work for exactly three values and fail for the rest.

So `.cell` keeps its `textContent` and is styled to match what the
sheet shows:

```
   on an unselected tile     #5e5145     (the "6" and "8")
   on the selected tile      #0042c1     (the "7")
```

Match the weight and the optical size to the sampled digits. Do not
cut them out and place them.

---

## 4. The art sets the proportions; one number moves

`css/number-selector.css` invents the widget's geometry — `--frame-w:
660`, `--frame-x: 78`, `--arrow: 150`, `--go: 168`, the well as
fractions of the bar. Those were a description of a drawing nobody
had. Do not squeeze the sheet into them.

Lay the widget out at the **art's own proportions**, taken from the
rects above, and then set one number so nothing else on the screen
moves: `BOARD.selector.scale`. The two things it has to hold are

- the control keeps the column width it has now, and
- **her feet stay on its painted top edge.** She stands at
  `STAND_UP`, feet at y 713, and the current painted top is 715. That
  relationship is the reason `STAND_UP` reads the way it does, and the
  answers panel has just been given a seat of its own precisely
  because a control that moves under her without telling her is how
  she ends up standing inside one.

If the art's proportions make the frame's painted top land somewhere
else, move `BOARD.selector.pos`/`scale` until it lands at 713 again —
and if that cannot be done, say so rather than nudging `STAND_UP`,
which the slider and the slots panel also use.

---

## 5. The word and the chevrons are in the art

GO is drawn into its pill and the arrowheads are drawn into their
discs. The live text that currently draws them has to stop being
visible — but it must not stop existing.

`.check` carries the text "GO" and `aria-label="Go — check this
answer"`; `.side` carries a `.chev` span and its own `aria-label`.
Hide the visible glyphs with a screen-reader-only clip, not with
`display: none`, and keep every `aria-label` exactly as it is. The
note in `number-selector.js` about this is worth reading before
touching it: the word used to live in the artwork with the button's
text set to nothing, and a screen reader then read a label that said
something the button did not.

---

## 6. The states have no art, so they stay CSS

The sheet gives one frame per piece. There is no pressed dial, no
disabled GO, no wrong-answer tile. Every state the control has —
`is-pressed`, `:disabled`, `.locked`, `.is-correct`, `.is-wrong`,
`.rising`, and the `lockIntoPlace` / `goodPop` / `drumWobble` / `ncRise`
keyframes — keeps working, expressed over the new skin:

- **press**: the transform it already has, plus a short darkening
  filter. Not a recolour.
- **disabled**: the opacity it already has.
- **correct / wrong**: the existing keyframes, retargeted at the new
  nodes. Same timings.
- **rising**: unchanged; it moves the root.

Invent no art. If a state cannot be expressed over the drawing, leave
it as it is and say which one.

---

## 7. What to delete

From `css/number-selector.css`, everything that was drawing:

- the four golds `--g1`..`--g4` and every gradient built from them
- the `::before` / `::after` extrusion stacks on `.selector`, `.side`
  and `.check`
- `.chev`'s two-border box and its two rotations
- the drum/barrel shading on `.cell`
- the invented geometry in §4 above, once the art's own is in

Keep the file — the layout, the transitions, the states and the
reduced-motion block all still live there. Only the skin goes.

From `js/number-selector.js`: nothing, unless a node exists purely to
hold a CSS drawing and the art has made it redundant. If one has, say
which and why before removing it.

---

## 8. Loading

Add the sheet to `ART` in `js/config.js`:

```js
buttons: 'assets/buttons.png',
```

`preload()` walks every value in `C.ART`, so that one line is the whole
of it. It matters: the sheet is about 940KB, and a control that rises
un-skinned and then dresses itself is worse than the reconstruction it
replaced.

---

## 9. What must not change

- The control's public API: `reset`, `lock`, `markCorrect`,
  `markWrong`, `onChange`, `value`, `hide`, `show`.
- The reel's behaviour — five cells rotating, the two buffers jumping
  across rather than travelling, a number keeping its element as it
  moves.
- Every `aria-label`, and `.seat`'s `role="status"` / `aria-live`.
- `STAND_UP`, and where she stands on this control.
- The answers panel, the slider and the slots panel. This is the
  selector only.

---

## 10. How to know it is right

Measured on the rendered page, not looked at.

1. **The skin is the sheet.** Every painted part of the control
   resolves to `assets/buttons.png` — no element in the subtree paints
   a gradient of its own.
2. **Nothing is distorted.** Each dial, GO, the pointer and each tile
   is rendered at the aspect of its own rect, within 1%.
3. **The corners survive.** Render the control at its own scale and at
   1.4x: the housing's and the window's corner radii stay the same
   number of art pixels, rather than scaling with the stretch.
4. **The numbers read.** The reel shows a two-digit answer with both
   digits inside the selected tile and neither clipped.
5. **She is still standing on it.** Her feet at 713 and the control's
   painted top within 2px of that, on every screen that raises it.
6. **The states still fire.** Press, disable, correct, wrong and lock
   each change the rendered control, and the reduced-motion block
   still stops the animations.
7. **It arrives dressed.** From a cold load with the cache cleared,
   the control is never painted before the sheet has decoded.
8. **The walk is clean.** 52 screens, 0 exceptions.

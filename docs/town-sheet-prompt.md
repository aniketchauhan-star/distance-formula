# Prompt for ChatGPT — one sprite sheet for the town and the towers

Paste everything in the block below into ChatGPT (image generation).
It asks for a single transparent PNG holding seven flat 2D places on
an even grid, so they can be cut into seven sprites.

**Two different jobs in one sheet.** The first four REPLACE drawings
the game currently makes in CSS — the town's café, house, school and
park. The last three are NEW: screens 49 to 54 are about two radio
towers, a rescue station and a rescue vehicle, and they show none of
them. That beat never used the town layer at all, so its places are
bare lettered dots on the paper. Swapping the first four is a
like-for-like change; adding the last three is new art for screens
that have never had any.

**Why the layout rules are so blunt:** the last two sheets this game
took delivery of were drawn with the figures touching and overlapping
their cells, and every frame ended up showing part of its neighbour.
Dividing the sheet by the number of drawings then cut them in half.
The gutters and the "nothing may touch a cell edge" rule are the whole
difference between a sheet that can be cut and one that cannot.

---

````
Draw ONE image: a sprite sheet of four flat 2D buildings for a
children's educational maths game. Transparent background (PNG with
alpha). No photorealism, no 3D, no perspective — flat vector shapes
with clean edges, like modern mobile-game UI art.

CANVAS AND GRID — follow this exactly
• Canvas 2048 x 1024 pixels, fully transparent.
• Eight equal cells in a 4 x 2 grid, each 512 x 512. Top row cells
  span x 0-511, 512-1023, 1024-1535, 1536-2047 at y 0-511; bottom row
  the same columns at y 512-1023.
• SEVEN drawings, one per cell, filling the top row and the first
  three cells of the bottom row. The eighth cell — bottom right — must
  be left COMPLETELY EMPTY and fully transparent.
• ONE drawing per cell, centred horizontally in its own cell.
• Each building must fit inside a 340 x 340 area at the centre of its
  cell. Nothing may come within 85 pixels of a cell boundary. No part
  of any building may touch, cross or overlap a neighbouring cell.
• Every drawing stands on the SAME baseline within its own cell: the
  bottom sits 112 pixels above that cell's bottom edge. Nothing below
  that line.
• Wider than tall: each should be roughly 1.4 times as wide as it is
  tall, because they are drawn 1.4 times wider than tall in the game.
  The two towers are the exception — see 5.

THE SEVEN PLACES — top row first, left to right, then the bottom row

1. CAFÉ — a small shopfront. A striped awning across the top in
   orange-red #E2643C with cream #FFF3E2 stripes. Cream body #FBE8CC
   with a soft tan outline #D8A96A. Two pale blue windows #9FD8F0 with
   blue frames #4E7FA8. A brown door #A4642F with a darker frame
   #7A4A22. A small round cream sign above the awning with a simple
   brown coffee-cup shape on it.

2. HOUSE — a cottage. A pitched triangular roof in warm red-orange
   #D9663E. Cream-yellow body #FAE3C0 with the same tan outline. Two
   pale blue windows, one brown door, all in the colours above.

3. SCHOOL — a wider, plainer building. A flat blue-grey roof #8FA6C4
   with a small bell gable on top #6E86A8. Pale blue-white body
   #E8EDF5 with a grey-blue outline #A9BBD2. Two pale blue windows and
   one wide deep-blue door #4E6A93 with frame #38506F.

4. PARK — NOT a building: two rounded green trees on a patch of grass.
   Foliage in two greens, #4E9B4A and #6FB25C, brown trunks #8A5A2B.
   A soft pale-green grass patch under them #CFE7B6 with a green edge
   #8FBE79, and a small bush #A7D48E with a #7FB268 edge.

5. RADIO TOWER — a slim lattice mast, the ONE drawing that is TALLER
   than it is wide: about 1 wide to 1.6 tall, still inside its own
   340 x 340 area and still on the shared baseline. A simple
   criss-cross lattice in steel grey #8A93A6 with a darker outline
   #5D6677, wider at the foot and narrowing to the top, with two small
   horizontal cross-braces. A small signal dish or bar at the very top
   in warm orange #E8913C. No radiating waves or arcs.

6. RESCUE STATION — a low, wide building with a garage front. Flat
   roof in slate #6E7A92 with a darker outline #4A5468. Pale body
   #EDF1F6 with a grey-blue outline #A9BBD2. One wide roll-up garage
   door in warm red #D84B3F with a darker frame #A63328, and one
   small pale blue window #9FD8F0 with a #4E7FA8 frame.

7. RESCUE VEHICLE — a small, simple van seen from the side, facing
   right. Warm red body #D84B3F with a darker outline #A63328, a pale
   blue window #9FD8F0 with a #4E7FA8 frame, two dark grey wheels
   #3C4250, and a small white stripe along the side. No sirens, no
   lights, no lettering.

STYLE
• Flat fills and simple outlines only. No gradients, no textures, no
  gloss, no drop shadows, no ground shadows — the game adds its own.
• Bold, simple silhouettes. Each one is shown at about 116 x 82 pixels
  in the game — the tower about 82 x 130 — so small details will
  disappear: keep to a few large shapes per drawing.
• Straight-on elevation, viewed from the front. No angled or
  three-quarter view, no vanishing point — these stand on a flat
  coordinate grid and must read as facing the viewer.
• All seven must look like one set: the same outline weight, the same
  corner rounding, the same level of detail. The tower, the station
  and the vehicle belong to the same town as the café and the house.
• No text, no letters, no numbers, no signage words anywhere.
• No background, no sky, no ground line, no frame, no border, no
  labels, and no captions under the drawings.
````

---

## What to check when it comes back

- [ ] the canvas really is 2048 x 1024 and the background really is
      transparent — not white
- [ ] exactly seven drawings, one per 512px cell, and the bottom-right
      cell genuinely empty
- [ ] a clear empty gutter down every cell boundary AND along the row
      boundary: nothing of one drawing appears in a neighbour's cell
- [ ] all seven stand on their cell's shared baseline
- [ ] the tower is the only one taller than it is wide
- [ ] no text anywhere, and no baked-in shadow under any of them
- [ ] readable when scaled down to about 116px wide

If any drawing bleeds into its neighbour, ask for that one to be
redrawn smaller inside its own cell rather than accepting the sheet —
a sheet that cannot be cut cleanly costs more to work around than to
regenerate.

---

## A note on the last three

The café, house, school and park drop straight in: the town layer
already places a `kind` on a coordinate, so they replace CSS with a
picture and nothing else changes.

The tower, the station and the vehicle do not. Screens 49 to 54 do not
use the town layer — their places are the board's own plotted points —
so giving them art means putting those screens on the town layer too,
and deciding whether the drawing replaces the plotted dot or stands
above it the way a building does. That is a change to how those beats
are built, not a swap, and it is worth doing as its own piece of work
rather than smuggling it in with the sheet.

#!/usr/bin/env python3
"""The fire engine's sprite sheet: assets/fire-engine.webp.

Screen 54, answered: the engine drives up the line from B to the fire
at A and puts it out (Board.fireRescue in js/game.js). It is the red van
from the town sheet (assets/sheet.webp), made a fire engine the way
the town has always shown it — a ladder on its roof on two brackets, a
lamp over the cab — with the turret of a water cannon on the front of
the ladder, and drawn in the sheet's own style: flat colour, a dark
edge. The cannon's barrel is not in the strip: the game draws it over
the turret (js/town.js, OVERLAY.cannon) so it can swing round and aim at
the fire whichever way the engine is facing on its line.

One row of frames, each FRAME_W x FRAME_H (421 x 225), the van at
(PAD_X, PAD_TOP) = (44, 46):

    0-7    driving: the wheels turning (the lug nuts go round), the body
           riding on its springs a pixel or two over them, the lamp
           flashing, the headlight lit, a puff of exhaust behind.
    8-9    standing: the lamp flashing, on and off.

The turret's pivot, in a frame's pixels, is PIVOT + (PAD_X, PAD_TOP) —
(250, 25). The game reads every position in the frame's own pixels
(CFG.GRID.engine), so the strip is shipped smaller than it is drawn:
EXPORT, 0.7 — the engine is never drawn on the board anywhere near 421
pixels wide.

Needs Pillow and numpy:  python3 tools/fire-engine-sprite.py
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SHEET = os.path.join(ROOT, 'assets/sheet.webp')
OUT_WEBP = os.path.join(ROOT, 'assets/fire-engine.webp')

VAN = (927, 618, 363, 173)            # the van on the town sheet
PAD_X, PAD_RIGHT, PAD_TOP, PAD_BOTTOM = 44, 14, 46, 6   # room behind it for the exhaust
FRAME_W = VAN[2] + PAD_X + PAD_RIGHT  # 421
FRAME_H = VAN[3] + PAD_TOP + PAD_BOTTOM   # 225
SS = 4                                # drawn 4x and brought down: smooth edges
EXPORT = 0.7                          # the shipped strip, against the drawing

# measured off the drawing (van pixels)
WHEELS = [(85.5, 134.4), (283.2, 134.4)]
HUB_R, TYRE_R = 15.8, 36.8
HEADLIGHT = (342.0, 95.5)

# the sheet's palette
EDGE = (43, 58, 103, 255)             # the town's dark edge (#2B3A67)
STEEL = (220, 226, 234, 255)          # ladder (#DCE2EA)
STEEL_DK = (160, 170, 184, 255)
LAMP_ON = (255, 59, 59, 255)          # #FF3B3B
LAMP_OFF = (255, 217, 217, 255)       # #FFD9D9, as the lamp flashes on the town
LAMP_EDGE = (126, 30, 14, 255)
LUG = (98, 101, 110, 255)
CAP = (196, 198, 205, 255)

# the cannon's pivot, on its turret on the front of the ladder (van pixels)
PIVOT = (206.0, -21.0)


def van_crop():
    im = Image.open(SHEET).convert('RGBA')
    x, y, w, h = VAN
    return im.crop((x, y, x + w, y + h))


def shifted(img, dx, dy):
    """The picture moved by a fraction of a pixel, resampled smoothly."""
    return img.transform(img.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), resample=Image.BICUBIC)


def disc_mask(size, cx, cy, r):
    m = Image.new('L', (size[0] * SS, size[1] * SS), 0)
    ImageDraw.Draw(m).ellipse(((cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS), fill=255)
    return m.resize(size, Image.LANCZOS)


class Pen:
    """Shapes in van pixels, drawn 4x over a frame, brought down at the end."""
    def __init__(self):
        self.im = Image.new('RGBA', (FRAME_W * SS, FRAME_H * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def p(self, x, y):
        return ((x + PAD_X) * SS, (y + PAD_TOP) * SS)

    def rect(self, x, y, w, h, fill, edge=None, ew=2.5, r=0):
        a, b = self.p(x, y), self.p(x + w, y + h)
        self.d.rounded_rectangle((a[0], a[1], b[0], b[1]), radius=r * SS, fill=fill,
                                 outline=edge, width=int(ew * SS) if edge else 0)

    def circle(self, cx, cy, r, fill, edge=None, ew=2):
        a = self.p(cx - r, cy - r); b = self.p(cx + r, cy + r)
        self.d.ellipse((a[0], a[1], b[0], b[1]), fill=fill, outline=edge, width=int(ew * SS) if edge else 0)

    def poly(self, pts, fill, edge=None, ew=2.5):
        q = [self.p(x, y) for x, y in pts]
        self.d.polygon(q, fill=fill)
        if edge:
            self.d.line(q + [q[0]], fill=edge, width=int(ew * SS), joint='curve')

    def done(self):
        return self.im.resize((FRAME_W, FRAME_H), Image.LANCZOS)


def glow(size, cx, cy, rx, ry, colour, strength):
    """A soft light: a blurred ellipse, in frame pixels."""
    g = Image.new('RGBA', size, (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=colour[:3] + (int(255 * strength),))
    return g.filter(ImageFilter.GaussianBlur(max(rx, ry) * 0.45))


def roof(pen, lamp_lit):
    """Ladder, brackets, lamp and the cannon's turret — the town's fire engine."""
    # brackets and the ladder, as the town draws them (js/town.js OVERLAY.engine)
    pen.rect(56, 1, 9, 7, EDGE, r=1)
    pen.rect(186, 1, 9, 7, EDGE, r=1)
    for x in range(46, 207, 16):
        pen.rect(x, -12, 5, 10, STEEL, EDGE, 2.2)
    pen.rect(36, -17, 184, 7, STEEL, EDGE, 2.5, r=3)
    pen.rect(36, -5, 184, 7, STEEL, EDGE, 2.5, r=3)
    # the cannon's turret on the ladder's front end (its barrel is the game's)
    pen.rect(197, -25, 20, 9, STEEL_DK, EDGE, 2.2, r=3)
    # the lamp over the cab
    pen.rect(220, -2, 30, 6, EDGE, r=2)
    pen.rect(223, -12, 24, 11, LAMP_ON if lamp_lit else LAMP_OFF, LAMP_EDGE, 2.0, r=5)
    if lamp_lit:
        pen.rect(227, -10, 7, 3, (255, 236, 236, 255), r=1.5)   # its shine


def wheel(pen, cx, cy, turn):
    """The hub's lug nuts and centre cap, turned `turn` radians."""
    for k in range(5):
        a = turn + k * 2 * math.pi / 5
        pen.circle(cx + 9.2 * math.cos(a), cy + 9.2 * math.sin(a), 2.4, LUG)
    pen.circle(cx, cy, 4.2, CAP, (110, 113, 122, 255), 1.4)


def frame(van, i):
    driving = i < 8
    size = (FRAME_W, FRAME_H)
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    # exhaust: grey puffs leaving the back, one after another
    if driving:
        puffs = Image.new('RGBA', size, (0, 0, 0, 0))
        dp = ImageDraw.Draw(puffs)
        for k in range(2):
            u = ((i + k * 4) % 8) / 8.0
            x = PAD_X + 6 - 34 * u
            y = PAD_TOP + 150 - 10 * u
            r = 5 + 9 * u
            dp.ellipse((x - r, y - r, x + r, y + r), fill=(150, 156, 168, int(150 * (1 - u))))
        out.alpha_composite(puffs.filter(ImageFilter.GaussianBlur(2.2)))

    # the body on its springs, the wheels on the road
    bounce = [0.0, -0.8, -1.5, -1.0, -0.2, 0.5, 0.2, -0.4][i] if driving else 0.0
    body = Image.new('RGBA', size, (0, 0, 0, 0))
    body.alpha_composite(van, (PAD_X, PAD_TOP))
    pen = Pen()
    lamp = (i % 4) < 2 if driving else i == 8
    roof(pen, lamp_lit=lamp)
    body.alpha_composite(pen.done())
    out.alpha_composite(shifted(body, 0, bounce))

    # the wheels over it, where they stand, turning
    for cx, cy in WHEELS:
        m = disc_mask(van.size, cx, cy, TYRE_R)
        tyre = Image.new('RGBA', van.size, (0, 0, 0, 0))
        tyre.paste(van, (0, 0), m)
        out.alpha_composite(tyre, (PAD_X, PAD_TOP))
    pen = Pen()
    turn = (i / 8.0) * (2 * math.pi / 5) if driving else 0.3
    for cx, cy in WHEELS:
        wheel(pen, cx, cy, turn)
    out.alpha_composite(pen.done())

    # lights
    lx, ly = PAD_X + 235, PAD_TOP - 7 + bounce
    if lamp:
        out.alpha_composite(glow(size, lx, ly, 26, 18, LAMP_ON, 0.55))
    if driving:
        hx, hy = PAD_X + HEADLIGHT[0], PAD_TOP + HEADLIGHT[1] + bounce
        out.alpha_composite(glow(size, hx + 6, hy, 14, 12, (255, 228, 120, 255), 0.55))
    return out


def main():
    van = van_crop()
    frames = [frame(van, i) for i in range(10)]
    # each frame brought down on its own, to whole pixels, so the frames
    # sit at whole-pixel steps along the strip and never drift
    fw, fh = round(FRAME_W * EXPORT), round(FRAME_H * EXPORT)
    small = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
    for k, f in enumerate(frames):
        small.alpha_composite(f.resize((fw, fh), Image.LANCZOS), (k * fw, 0))
    small.save(OUT_WEBP, 'WEBP', quality=82, alpha_quality=85, method=6)
    print('frames', len(frames), 'of', FRAME_W, 'x', FRAME_H,
          '| pivot', (PIVOT[0] + PAD_X, PIVOT[1] + PAD_TOP),
          '| wheels at %.4f of the height, their middle at %.4f of the width' % (
              (PAD_TOP + WHEELS[0][1] + TYRE_R) / FRAME_H, (PAD_X + (WHEELS[0][0] + WHEELS[1][0]) / 2) / FRAME_W),
          '| van top %.4f' % (PAD_TOP / FRAME_H), '| shipped frames %d x %d' % (round(FRAME_W * EXPORT), round(FRAME_H * EXPORT)),
          '| webp', os.path.getsize(OUT_WEBP), 'B')


if __name__ == '__main__':
    main()

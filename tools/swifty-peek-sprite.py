#!/usr/bin/env python3
"""Swifty peeking over the formula panel: assets/swifty-peek.webp.

37, 39 and 41 end with her coming up from behind the panel the formula
is written on, her hands on its top edge, to say what it gives (the
peek in js/game.js). The drawing was supplied as a sheet of six poses,
three by two: her head and her two hands over an edge, the beak

    closed, a little open, open         (top row)
    wide open, open, closed             (bottom row)

— 'assets/swifty hide and talk.png', in the repository's history (it
was added and taken out again, as the voice recordings were: only what
is made from it ships). Get it back with

    git show d2d396c:"assets/swifty hide and talk.png" > peek.png

The six were drawn freely rather than on a grid, a little bigger or
smaller and a few pixels this way or that from one another, so cut on
the sheet's cells the head swam from frame to frame as she talked. Each
pose is found by its own opaque pixels instead (and the faint specks
the drawing left round them dropped), then laid over the first: scaled
and moved until its outline — head, crest and hands, the beak left out,
since the beak is the thing that moves — lies on the first pose's. FIT
is what that came to (python3 tools/swifty-peek-sprite.py --fit works
it out again, which takes a minute or two).

One row of six frames, each CELL_W x CELL_H of the drawing brought down
by EXPORT, in the sheet's order, frame 0 her beak shut. The numbers the
game places her by are printed, in the shipped frame's pixels, and are
written into CFG.PEEK (js/config.js).

Needs Pillow, numpy and scipy:  python3 tools/swifty-peek-sprite.py [sheet.png]
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'assets/swifty hide and talk.png')
OUT = os.path.join(ROOT, 'assets/swifty-peek.webp')

PAD = 30          # room round each pose while it is moved
EXPORT = 0.75     # the shipped strip, against the drawing
# Each pose laid over the first: scale (about its crop's corner), then
# the move, in the drawing's pixels. Measured by fit() below.
FIT = [(1.0,     0.0,  0.0),
       (0.995,   6.5, -2.0),
       (0.995,   6.0, -5.0),
       (0.975,  10.5, -1.0),
       (0.98125, 5.5,  1.0),
       (0.9875,  5.25, -1.5)]


def poses(path):
    """The six poses, each cut out on its own opaque pixels, in reading order."""
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    a = np.pad(a, ((PAD, PAD), (PAD, PAD), (0, 0)))
    lab, n = ndimage.label(a[..., 3] > 16)
    sizes = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    keep = [i for i in np.argsort(-sizes)[:6]]
    objs = ndimage.find_objects(lab)
    keep.sort(key=lambda i: (objs[i][0].start > a.shape[0] / 2, objs[i][1].start))
    out = []
    for i in keep:
        sl = objs[i]
        y0, y1 = sl[0].start - PAD, sl[0].stop + PAD
        x0, x1 = sl[1].start - PAD, sl[1].stop + PAD
        sub = a[y0:y1, x0:x1].copy()
        # the pose and a rim round it: its antialiasing, and none of the specks
        mine = ndimage.binary_dilation(lab[y0:y1, x0:x1] == i + 1, iterations=3)
        sub[~mine] = 0
        out.append(sub)
    return out


def place(sub, s, dx, dy, size):
    pil = Image.fromarray(np.clip(sub, 0, 255).astype(np.uint8))
    return np.asarray(pil.transform(size, Image.AFFINE,
                                    (1 / s, 0, -dx / s, 0, 1 / s, -dy / s),
                                    resample=Image.BICUBIC)).astype(np.float32)


def beak(img):
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    return (r > 180) & (g < 190) & (b < 120) & (r > g + 40)


def fit(subs):
    """Each pose scaled and moved onto the first, by the overlap of their outlines."""
    ref = subs[0]
    size = (ref.shape[1], ref.shape[0])
    ra = ref[..., 3] / 255.0

    def score(sub, s, dx, dy):
        w = place(sub, s, dx, dy, size)
        skip = ndimage.binary_dilation(beak(w) | beak(ref), iterations=4)
        a = w[..., 3] / 255.0
        return np.minimum(a, ra)[~skip].sum() / np.maximum(a, ra)[~skip].sum()

    found = []
    for sub in subs:
        best = None
        for s in np.arange(0.96, 1.041, 0.005):
            w = place(sub, s, 0, 0, size)
            cy0, cx0 = ndimage.center_of_mass(ra > 0.5)
            cy1, cx1 = ndimage.center_of_mass(w[..., 3] > 128)
            for dy in range(round(cy0 - cy1) - 6, round(cy0 - cy1) + 7):
                for dx in range(round(cx0 - cx1) - 6, round(cx0 - cx1) + 7):
                    v = score(sub, s, dx, dy)
                    if best is None or v > best[0]:
                        best = (v, s, dx, dy)
        for ds, dt in ((0.0025, 0.5), (0.00125, 0.25)):
            better = True
            while better:
                better = False
                b = best
                for a1 in (-ds, 0, ds):
                    for a2 in (-dt, 0, dt):
                        for a3 in (-dt, 0, dt):
                            c = (b[1] + a1, b[2] + a2, b[3] + a3)
                            v = score(sub, *c)
                            if v > best[0] + 1e-6:
                                best, better = (v,) + c, True
        print('pose %d: overlap %.4f, scale %.5f, move (%.2f, %.2f)' % ((len(found),) + best))
        found.append(best[1:])
    return found


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    src = args[0] if args else SRC
    if not os.path.exists(src):
        sys.exit('No sheet at %s — see the note at the top for getting it back.' % src)
    subs = poses(src)
    how = fit(subs) if '--fit' in sys.argv else FIT
    H, W = subs[0].shape[:2]
    BIG = 80
    laid = [place(sub, s, dx + BIG, dy + BIG, (W + 2 * BIG, H + 2 * BIG))
            for sub, (s, dx, dy) in zip(subs, how)]
    # one cell round all six, a few pixels clear of each
    ys, xs = np.where(np.stack([f[..., 3] for f in laid]).max(0) > 8)
    x0, x1, y0, y1 = xs.min() - 4, xs.max() + 5, ys.min() - 4, ys.max() + 5
    cw, ch = round((x1 - x0) * EXPORT), round((y1 - y0) * EXPORT)
    strip = Image.new('RGBA', (cw * 6, ch), (0, 0, 0, 0))
    for k, f in enumerate(laid):
        im = Image.fromarray(f.astype(np.uint8)).crop((x0, y0, x1, y1))
        strip.alpha_composite(im.resize((cw, ch), Image.LANCZOS), (k * cw, 0))
    strip.save(OUT, 'WEBP', quality=86, alpha_quality=90, method=6)

    # Where the game places her by, off the first pose, in shipped pixels.
    a = np.asarray(strip)[:, :cw, 3] > 128
    rows = np.where(a.any(1))[0]
    cols = np.where(a.any(0))[0]
    low = np.array([np.where(a[:, x])[0].max() if a[:, x].any() else -1 for x in range(cw)])
    mid = low[int(cw * 0.35):int(cw * 0.65)]
    body = int(np.median(mid))                 # the flat foot of her body, between the hands
    hands = int(low.max())                     # the foot of her hands, the lowest of her
    # her crown: the top of the dome right of the crest, where a balloon's tail lands
    cx = int(cw * 0.62)
    crown = int(np.where(a[:, cx])[0].min())
    print(json.dumps({
        'frames': 6, 'w': cw, 'h': ch,
        'top': int(rows.min()), 'hands': hands, 'body': body,
        'left': int(cols.min()), 'right': int(cols.max()),
        'crown': {'x': cx, 'y': crown},
        'bytes': os.path.getsize(OUT)}))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""The face of the lesson's algebra: assets/fonts/swifty-math.woff2.

x₁, y₂ and the rest, the x of "x-axis", and the d of the distance
formula, set the way TeX sets them: the letters in Latin Modern Math's
own italic, their numbers its small script digits (css/style.css, .mvar
and .msub; js/math-text.js finds them).

Latin Modern Math is an OpenType maths font, and in one of those the
plain letters are upright — its italic x is the Mathematical Italic
Small X, U+1D465, and it has no ₁ or ₂ at all. So this is a font of its
own, made from its glyphs and nothing else, in which the ordinary
characters the game writes ARE those glyphs:

    x y d        its maths italic x, y and d (U+1D465, U+1D466, U+1D451)
    ₀ … ₉        its script-size digits (zero.st … nine.st, the shapes TeX
                 uses for a subscript), set against those at TeX's 70%

— so nothing the game writes has to change: an "x₂" is still an "x₂",
and reads back as one. Its lines are short (ascender 800, descender
200, no gap), so a letter set in it never makes a line taller than the
face round it would.

Drawn a little bigger and a little heavier than the maths font itself
(LETTER, BOLD): set at its own size among the game's rounded, heavy
faces (Poppins 700 in her balloon, Nunito 600 and 700 on the board and
the table), its x stood a head shorter than theirs and in hairlines. At
115% its x is about as tall as theirs, and every stroke is thickened by
BOLD, all round (skia-pathops), so it holds its own beside them and is
still, unmistakably, TeX's x.

Latin Modern Math is the GUST e-foundry's (B. Jackowski, P. Strzelczyk,
P. Pianowski), under the GUST Font License, which asks that anything made
from it goes by another name: this is "Swifty Math", and its licence is
assets/fonts/GUST-FONT-LICENSE.txt. The source font is not kept here —
get it from CTAN:

    curl -LO https://mirrors.ctan.org/fonts/lm-math/opentype/latinmodern-math.otf

Needs fontTools, brotli and skia-pathops:
    python3 tools/swifty-math-font.py latinmodern-math.otf
"""
import os, sys
import pathops
from fontTools.ttLib import TTFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets/fonts/swifty-math.woff2')
LETTER = 1.15        # the letters, against the maths font's own size
SCRIPT = 0.72        # the digits: TeX's 70% of a letter, less the letters' growth, a hair over
BOLD = 20            # every stroke thickened by this, in units of the em (1000)
DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

# what each character is drawn with: (source glyph, scale)
GLYPHS = {'x': ('u1D465', LETTER), 'y': ('u1D466', LETTER), 'd': ('u1D451', LETTER)}
CMAP = {0x78: 'x', 0x79: 'y', 0x64: 'd'}
for n, name in enumerate(DIGITS):
    GLYPHS['uni%04X' % (0x2080 + n)] = (name + '.st', SCRIPT)
    CMAP[0x2080 + n] = 'uni%04X' % (0x2080 + n)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = TTFont(sys.argv[1])
    have = src.getGlyphSet()
    order = ['.notdef', 'space'] + list(GLYPHS)
    charstrings, metrics = {}, {}

    empty = T2CharStringPen(500, None)
    charstrings['.notdef'] = empty.getCharString()
    metrics['.notdef'] = (500, 0)
    space = T2CharStringPen(333, None)
    charstrings['space'] = space.getCharString()
    metrics['space'] = (333, 0)
    CMAP[0x20] = 'space'

    for name, (from_, k) in GLYPHS.items():
        g = have[from_]
        # scaled, then thickened: its outline stroked BOLD wide, round,
        # and the stroke joined to it; moved over by half that, and as
        # much wider, so its sidebearings stay its own
        path = pathops.Path()
        g.draw(TransformPen(path.getPen(glyphSet=have), (k, 0, 0, k, 0, 0)))
        rim = pathops.Path(path)
        rim.stroke(BOLD, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
        rim.convertConicsToQuads()
        path = pathops.op(path, rim, pathops.PathOp.UNION, fix_winding=True)
        adv = round(g.width * k + BOLD)
        pen = T2CharStringPen(adv, None)
        path.draw(TransformPen(pen, (1, 0, 0, 1, BOLD / 2, 0)))
        charstrings[name] = pen.getCharString()
        box = BoundsPen(None)
        path.draw(TransformPen(box, (1, 0, 0, 1, BOLD / 2, 0)))
        lsb = round(box.bounds[0]) if box.bounds else 0
        metrics[name] = (adv, lsb)

    fb = FontBuilder(1000, isTTF=False)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(CMAP)
    fb.setupCFF('SwiftyMath-Regular', {'FullName': 'Swifty Math Regular',
                                        'FamilyName': 'Swifty Math', 'Weight': 'Regular'},
                charstrings, {})
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=800, descent=-200, lineGap=0)
    copyright = src['name'].getDebugName(0) or ''
    fb.setupNameTable({
        'copyright': copyright,
        'familyName': 'Swifty Math',
        'styleName': 'Regular',
        'uniqueFontIdentifier': 'SwiftyMath-Regular-1.0',
        'fullName': 'Swifty Math Regular',
        'psName': 'SwiftyMath-Regular',
        'version': 'Version 1.0',
        'description': ('Made from Latin Modern Math (GUST e-foundry) for the Distance '
                        'Formula game: its italic x, y, d and script digits only, '
                        'under the ordinary characters. Renamed, as the GUST Font '
                        'License asks of a derived work.'),
        'licenseDescription': 'GUST Font License (LaTeX Project Public License 1.3c).',
        'licenseInfoURL': 'http://tug.org/fonts/licenses/GUST-FONT-LICENSE.txt',
    })
    fb.setupOS2(version=4, sTypoAscender=800, sTypoDescender=-200, sTypoLineGap=0,
                usWinAscent=800, usWinDescent=200, fsSelection=0x40 | 0x80,
                achVendID='SWFT', usWeightClass=400)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    fb.save(OUT)
    print('glyphs', len(order), '| widths', {k: metrics[k][0] for k in ('x', 'y', 'd', 'uni2081', 'uni2082')},
          '| woff2', os.path.getsize(OUT), 'B')


if __name__ == '__main__':
    main()

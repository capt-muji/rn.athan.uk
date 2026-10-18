#!/usr/bin/env python3
"""Expectation table for ticket 137: candidate Arabic line boxes from the shipped TTFs.

Prints, per Rubik face, the four vertical-metric sets in em, then the candidate
single-line heights in layout pixels for the measured surfaces at both device scales.
Exit status is nonzero when a font file is missing or unparsable.
"""

import sys

from fontTools.ttLib import TTFont

FONTS = [
    ('assets/fonts/Rubik-Regular.ttf', 'Regular'),
    ('assets/fonts/Rubik-Medium.ttf', 'Medium'),
    ('assets/fonts/Roboto-Regular.ttf', 'Roboto-Regular'),
]
SIZES = [13, 14, 15, 16, 17, 18, 22, 24]
SCALES = [('3T', 2.625), ('XS', 3.0)]


def sets_em(font):
    head = font['head']
    hhea = font['hhea']
    os2 = font['OS/2']
    upm = head.unitsPerEm
    return {
        'hhea': (hhea.ascent - hhea.descent + hhea.lineGap) / upm,
        'typo': (os2.sTypoAscender - os2.sTypoDescender + os2.sTypoLineGap) / upm,
        'win': (os2.usWinAscent + os2.usWinDescent) / upm,
        'bbox': (head.yMax - head.yMin) / upm,
    }


def main():
    for path, label in FONTS:
        try:
            font = TTFont(path, lazy=False)
        except Exception as exc:  # noqa: BLE001 - one line, the file is gone or corrupt
            print(f'FAIL {path}: {exc}')
            return 1
        ems = sets_em(font)
        print(f'file {path} ({label})')
        for name, em in ems.items():
            print(f'  {name:4} {em:.4f}em')
        for size in SIZES:
            for device, scale in SCALES:
                cells = ' '.join(
                    f'{name}={em * size * scale:.2f}/{round(em * size * scale)}px'
                    for name, em in ems.items()
                )
                print(f'  size {size} {device} scale {scale}: {cells}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

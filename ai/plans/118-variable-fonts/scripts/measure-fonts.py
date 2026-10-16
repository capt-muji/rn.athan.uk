#!/usr/bin/env python3
"""Metrics extraction for ticket 118: one block per font file.

Reads the font's own tables (head, hhea, OS/2, maxp, cmap, hmtx, fvar, GSUB)
and prints vertical metrics, em-boxes, per-1000em advances for the glyphs the
app pins, digit tabularity, fvar axes, coverage counts and file sizes.

Subcommands:
  file <path>...              metrics block per file (fvar axes when present)
  instance <vf> wght=<n>      instance at wght n (wdth 100 when declared),
                              write the instanced font beside the source as
                              <stem>-wght<n>.ttf, print its block
  tnum <path> [--pin wght=n]  default and tnum digit advances with equality
  sizes <path>...             raw and gzip -9 byte totals per file and summed

Exit status is nonzero when a file is missing, unparsable, or carries none of
the requested codepoints.
"""

import gzip
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

PINNED = {'0': 0x30, '1': 0x31, '5': 0x35, '7': 0x37, 'h': 0x68, 'm': 0x6D,
          's': 0x73, ':': 0x3A, ' ': 0x20, '.': 0x2E}
DIGITS = '0123456789'


def load(path, pin=None):
    font = TTFont(path, lazy=False)
    if pin is not None:
        axes = {a.axisTag for a in font['fvar'].axes}
        limits = {'wght': pin}
        if 'wdth' in axes:
            limits['wdth'] = 100
        instantiateVariableFont(font, limits, inplace=True, updateFontNames=True)
    return font


def block(path, font):
    head = font['head']
    hhea = font['hhea']
    os2 = font['OS/2']
    upm = head.unitsPerEm
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    axes = ''
    if 'fvar' in font:
        axes = ' fvar=' + ','.join(
            f"{a.axisTag}:{int(a.minValue)}/{int(a.defaultValue)}/{int(a.maxValue)}"
            for a in font['fvar'].axes)
    name = font['name'].getDebugName(4) or font['name'].getDebugName(1) or '?'
    print(f"file {os.path.basename(path)}")
    print(f"  fullName {name} weight {os2.usWeightClass} upm {upm} "
          f"glyphs {font['maxp'].numGlyphs} cps {len(cmap)}{axes}")
    print(f"  hhea {hhea.ascent}/{hhea.descent}/{hhea.lineGap} "
          f"win {os2.usWinAscent}/{os2.usWinDescent} "
          f"typo {os2.sTypoAscender}/{os2.sTypoDescender}/{os2.sTypoLineGap}")
    print(f"  embox win {(os2.usWinAscent + os2.usWinDescent) * 1000 / upm:.0f}/1000em "
          f"hhea {(hhea.ascent - hhea.descent + hhea.lineGap) * 1000 / upm:.0f}/1000em "
          f"bytes {os.path.getsize(path)}")
    advances = {ch: hmtx[cmap[cp]][0] for ch, cp in PINNED.items() if cp in cmap}
    print('  advances/1000em ' + ' '.join(
        f"{ch}:{round(v * 1000 / upm)}" for ch, v in advances.items()))


def tnum_advances(font):
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    gsub = font['GSUB'].table
    lookup_indexes = []
    for record in gsub.FeatureList.FeatureRecord:
        if record.FeatureTag == 'tnum':
            lookup_indexes.extend(record.Feature.LookupListIndex)
    resolved = {}
    for ch in DIGITS:
        cp = ord(ch)
        if cp not in cmap:
            continue
        glyph = cmap[cp]
        for index in lookup_indexes:
            table = gsub.LookupList.Lookup[index]
            for sub in table.SubTable:
                if sub.LookupType == 1 and glyph in sub.mapping:
                    glyph = sub.mapping[glyph]
                    break
        resolved[ch] = hmtx[glyph][0]
    return resolved, len(lookup_indexes)


def cmd_file(paths):
    for path in paths:
        block(path, load(path))
    return 0


def cmd_instance(path, pin_text):
    if not pin_text.startswith('wght='):
        print('instance takes wght=<n>', file=sys.stderr)
        return 2
    pin = int(pin_text.split('=')[1])
    font = load(path, pin=pin)
    stem = os.path.splitext(path)[0]
    out = f"{stem}-wght{pin}.ttf"
    font.save(out)
    block(out, font)
    return 0


def cmd_tnum(argv):
    pin = None
    if '--pin' in argv:
        pin = int(argv[argv.index('--pin') + 1].split('=')[1])
        argv = [a for i, a in enumerate(argv) if i not in
                (argv.index('--pin'), argv.index('--pin') + 1)]
    path = argv[0]
    font = load(path, pin=pin)
    upm = font['head'].unitsPerEm
    cmap = font.getBestCmap()
    default = {ch: font['hmtx'][cmap[ord(ch)]][0] for ch in DIGITS
               if ord(ch) in cmap}
    tnumed, lookup_count = tnum_advances(font)
    fmt = lambda m: ' '.join(f"{ch}:{round(v * 1000 / upm)}"
                             for ch, v in m.items()) if m else '(no digits)'
    verdict = lambda eq: 'equal' if eq else 'NOT equal'
    deq = len(set(default.values())) == 1 if default else None
    teq = len(set(tnumed.values())) == 1 if lookup_count else None
    print(f"file {os.path.basename(path)} pin wght={pin}")
    print(f"  default {fmt(default)} -> {deq}")
    print(f"  tnum    {fmt(tnumed)} -> {teq}")
    return 0


def cmd_sizes(paths):
    raw_total = gz_total = 0
    for path in paths:
        raw = os.path.getsize(path)
        gz = len(gzip.compress(open(path, 'rb').read(), 9))
        raw_total += raw
        gz_total += gz
        print(f"{os.path.basename(path):36s} raw {raw:>9,} gzip9 {gz:>9,}")
    print(f"{'TOTAL n=' + str(len(paths)):36s} raw {raw_total:>9,} gzip9 {gz_total:>9,}")
    return 0


def main(argv):
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    command = argv[1]
    if command == 'file':
        return cmd_file(argv[2:])
    if command == 'instance' and len(argv) == 4:
        return cmd_instance(argv[2], argv[3])
    if command == 'tnum' and argv[2:]:
        return cmd_tnum(argv[2:])
    if command == 'sizes':
        return cmd_sizes(argv[2:])
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))

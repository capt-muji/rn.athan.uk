# Font measurements behind the 1.15 factor (ticket 74)

All numbers measured from the TrueType tables of the named files (glyf bounding boxes for glyph
bands, OS/2 for cap and x heights, usWeightClass for weights). Measured 2026-10-13 at plan time;
the scripts were stdlib TTF parsers run against the byte-exact files cited below.

## The English faces (bundled today)

- `assets/fonts/Roboto-Regular.ttf`, `assets/fonts/Roboto-Medium.ttf`
- unitsPerEm 2048; OS/2 sCapHeight 1456 (0.711 em); sxHeight 1082 (0.528 em)
- usWeightClass 400 and 500; both files carry no Arabic cmap entries (the fallback defect)

## The fix face: Noto Sans Arabic v2.013, hinted statics

- Source: `https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.013/NotoSansArabic-v2.013.zip`
- Files used: `NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf`,
  `NotoSansArabic/hinted/ttf/NotoSansArabic-Medium.ttf`
- sha256 Regular: `bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48`
- sha256 Medium: `5aaa32f0fe7fdd828342aea06a3c645edb51bcea2620af68b4c385a3b9fb0c42`
- sha256 `OFL.txt` from the same zip: `a7a5a25eb188bf1cd96982030d53e23c33485c69b1044a562254226857ee13af`
- unitsPerEm 1000; alif U+0627 bbox top 714 (0.714 em, baseline-sitting); flat letters U+0628 and
  U+0633 top 403 (0.403 em), bottoms below baseline (-211, -232)
- OS/2 sCapHeight 714 on both; sxHeight 536 on Regular, 539 on Medium (these mirror the
  Latin-analog design values, not the Arabic letter band — the glyph boxes above are the reading
  numbers)
- usWeightClass 400 and 500; PostScript names `NotoSansArabic-Regular`, `NotoSansArabic-Medium`
- cmap holds: Arabic letters, U+0660-0669 and U+06F0-06F9 digits, U+061F, U+066A, U+003A,
  U+002E, U+002C, U+0021, U+002D, U+00AB, U+00BB, and the Latin digits U+0030-0039. It holds no
  Latin letters, no U+003F, no parentheses, no U+0025, no U+203A, no U+2304 — those glyphs take
  the OS fallback exactly as they do today.

## Today's Android fallback face, for the record

- Noto Naskh Arabic UI Regular (the AOSP Arabic fallback class on the 3T's Android 9): alif top
  806/1000, flat letters 475-543/1000. Its band is not the deficit; the deficit is the face class
  (thin naskh strokes) plus the missing medium weight plus iOS's Geeza Pro. The bundled face
  removes all three variables on both platforms.

## The factor

- Tall-letter parity: 0.711 / 0.714 = 0.996
- Text-mass parity: 0.528 / 0.403 = 1.310
- Geometric mean: sqrt(0.996 * 1.310) = 1.142, rounded to the nearest 0.05, which is **1.15**
- Under ar: fontSize and lineHeight resolve `Math.round(n * 1.15)`; letterSpacing resolves 0
  (joining script; tracking distorts the joins)

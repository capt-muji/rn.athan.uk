# EXPECTATIONS 137

Candidate line-box heights from the shipped TTFs, verbatim output of
`python3 ai/plans/137-arabic-line-height/scripts/tables-137.py`, run at the
worktree on `lane/137`. Scales: 2.625 the 3T, 3 the XS. Each cell is
unrounded/nearest-integer layout pixels.

```
file assets/fonts/Rubik-Regular.ttf (Regular)
  hhea 1.1850em
  typo 1.1850em
  win  1.5320em
  bbox 1.5540em
  size 13 3T scale 2.625: hhea=40.44/40px typo=40.44/40px win=52.28/52px bbox=53.03/53px
  size 13 XS scale 3.0: hhea=46.22/46px typo=46.22/46px win=59.75/60px bbox=60.61/61px
  size 14 3T scale 2.625: hhea=43.55/44px typo=43.55/44px win=56.30/56px bbox=57.11/57px
  size 14 XS scale 3.0: hhea=49.77/50px typo=49.77/50px win=64.34/64px bbox=65.27/65px
  size 15 3T scale 2.625: hhea=46.66/47px typo=46.66/47px win=60.32/60px bbox=61.19/61px
  size 15 XS scale 3.0: hhea=53.33/53px typo=53.33/53px win=68.94/69px bbox=69.93/70px
  size 22 3T scale 2.625: hhea=68.43/68px typo=68.43/68px win=88.47/88px bbox=89.74/90px
  size 22 XS scale 3.0: hhea=78.21/78px typo=78.21/78px win=101.11/101px bbox=102.56/103px
file assets/fonts/Rubik-Medium.ttf (Medium)
  hhea 1.1850em
  typo 1.1850em
  win  1.5320em
  bbox 1.5810em
  size 13 3T scale 2.625: hhea=40.44/40px typo=40.44/40px win=52.28/52px bbox=53.95/54px
  size 13 XS scale 3.0: hhea=46.22/46px typo=46.22/46px win=59.75/60px bbox=61.66/62px
  size 14 3T scale 2.625: hhea=43.55/44px typo=43.55/44px win=56.30/56px bbox=58.10/58px
  size 14 XS scale 3.0: hhea=49.77/50px typo=49.77/50px win=64.34/64px bbox=66.40/66px
  size 15 3T scale 2.625: hhea=46.66/47px typo=46.66/47px win=60.32/60px bbox=62.25/62px
  size 15 XS scale 3.0: hhea=53.33/53px typo=53.33/53px win=68.94/69px bbox=71.14/71px
  size 22 3T scale 2.625: hhea=68.43/68px typo=68.43/68px win=88.47/88px bbox=91.30/91px
  size 22 XS scale 3.0: hhea=78.21/78px typo=78.21/78px win=101.11/101px bbox=104.35/104px
file assets/fonts/Roboto-Regular.ttf (Roboto-Regular)
  hhea 1.1719em
  typo 1.0498em
  win  1.2002em
  bbox 1.3271em
  size 13 3T scale 2.625: hhea=39.99/40px typo=35.82/36px win=40.96/41px bbox=45.29/45px
  size 13 XS scale 3.0: hhea=45.70/46px typo=40.94/41px win=46.81/47px bbox=51.76/52px
  size 14 3T scale 2.625: hhea=43.07/43px typo=38.58/39px win=44.11/44px bbox=48.77/49px
  size 14 XS scale 3.0: hhea=49.22/49px typo=44.09/44px win=50.41/50px bbox=55.74/56px
  size 15 3T scale 2.625: hhea=46.14/46px typo=41.34/41px win=47.26/47px bbox=52.26/52px
  size 15 XS scale 3.0: hhea=52.73/53px typo=47.24/47px win=54.01/54px bbox=59.72/60px
  size 22 3T scale 2.625: hhea=67.68/68px typo=60.63/61px win=69.31/69px bbox=76.64/77px
  size 22 XS scale 3.0: hhea=77.34/77px typo=69.29/69px win=79.21/79px bbox=87.59/88px
```

## Extended sizes (D137.11, 2026-10-18)

`tables-137.py` SIZES extended to 13, 14, 15, 16, 17, 18, 22, 24. Verbatim output
of the new sizes from the rerun at the worktree on `step-137/adjudication`:

```
file assets/fonts/Rubik-Regular.ttf (Regular)
  size 16 3T scale 2.625: hhea=49.77/50px typo=49.77/50px win=64.34/64px bbox=65.27/65px
  size 16 XS scale 3.0: hhea=56.88/57px typo=56.88/57px win=73.54/74px bbox=74.59/75px
  size 17 3T scale 2.625: hhea=52.88/53px typo=52.88/53px win=68.37/68px bbox=69.35/69px
  size 17 XS scale 3.0: hhea=60.44/60px typo=60.44/60px win=78.13/78px bbox=79.25/79px
  size 18 3T scale 2.625: hhea=55.99/56px typo=55.99/56px win=72.39/72px bbox=73.43/73px
  size 18 XS scale 3.0: hhea=63.99/64px typo=63.99/64px win=82.73/83px bbox=83.92/84px
  size 24 3T scale 2.625: hhea=74.66/75px typo=74.66/75px win=96.52/97px bbox=97.90/98px
  size 24 XS scale 3.0: hhea=85.32/85px typo=85.32/85px win=110.30/110px bbox=111.89/112px
file assets/fonts/Rubik-Medium.ttf (Medium)
  size 16 3T scale 2.625: hhea=49.77/50px typo=49.77/50px win=64.34/64px bbox=66.40/66px
  size 16 XS scale 3.0: hhea=56.88/57px typo=56.88/57px win=73.54/74px bbox=75.89/76px
  size 17 3T scale 2.625: hhea=52.88/53px typo=52.88/53px win=68.37/68px bbox=70.55/71px
  size 17 XS scale 3.0: hhea=60.44/60px typo=60.44/60px win=78.13/78px bbox=80.63/81px
  size 18 3T scale 2.625: hhea=55.99/56px typo=55.99/56px win=72.39/72px bbox=74.70/75px
  size 18 XS scale 3.0: hhea=63.99/64px typo=63.99/64px win=82.73/83px bbox=85.37/85px
  size 24 3T scale 2.625: hhea=74.66/75px typo=74.66/75px win=96.52/97px bbox=99.60/100px
  size 24 XS scale 3.0: hhea=85.32/85px typo=85.32/85px win=110.30/110px bbox=113.83/114px
```

## Measured surfaces and pinned controls

| Surface | Nominal size | Face | LineHeight pin |
| --- | --- | --- | --- |
| Settings sheet title | 22 | Rubik-Medium | unpinned |
| Settings sheet subtitle | 14 | Rubik-Regular | unpinned |
| Settings card title | 14 | Rubik-Medium | unpinned |
| Help question | 15 | Rubik-Medium | pinned 23 (`ty.scriptLineHeight(15)`) |
| Help answer | 13 | Rubik-Regular | pinned 20 |
| Day location label | 16 | Rubik-Regular | unpinned |
| Day date label | 18 | Rubik-Regular | unpinned |
| Prayer row name | 18 | Rubik-Regular | unpinned |
| Row time | 18 | Rubik-Regular | unpinned |
| Countdown word | 17 | Rubik-Regular | unpinned |
| Overlay explanation title | 18 | Rubik-Medium | unpinned |
| Overlay explanation body | 16 | Rubik-Regular | pinned 24 (`ty.scriptLineHeight(16)`) |

The unpinned three are the measured surfaces; their rendered box is the
platform's own. The two pinned controls prove the instrument: both must read
their pin ratio on both platforms. The home and overlay rows extend the set per
D137.11: steps 2b and 3b read them on both phones, and the overlay body joins
the Help pair as a pinned control.

#!/bin/zsh
# Render month pages of the three 1447 books: overview 2.2x + table halves a/b at 6x.
R="$HOME/athan-gitree/census/o1k-wide/fit11/render"
CAP="$HOME/athan-gitree/census/o1l-city/algeria-1447/captures"
OUT="$HOME/athan-gitree/census/o1l-city/algeria-1447/pages"

typeset -A PDF
PDF[dz47]="$CAP/dz-marw-calendrier-1447-alger.pdf"
PDF[ad47]="$CAP/dz-marw-calendrier-1447-adrar.pdf"
PDF[dj47]="$CAP/dz-marw-calendrier-1447-djelfa.pdf"

# pages to render per book (fit11 already holds dz47 p06/07/08/10 and ad47+dj47 p06)
PAGES_DZ="2 3 4 5 9 11 12 13"
PAGES_AD="2 3 4 5 7 8 9 10 11 12 13"

for tag in dz47 ad47 dj47; do
  p="$PDF[$tag]"
  if [[ $tag == dz47 ]]; then pages="$PAGES_DZ"; else pages="$PAGES_AD"; fi
  for pg in ${(s: :)pages}; do
    "$R" "$p" "$pg" "$OUT/$tag-p$pg-overview.png" 2.2
    # table region: fx 0.47..0.925, fy 0.075..0.745; halves with overlap at fy 0.40-0.42
    "$R" "$p" "$pg" "$OUT/$tag-p$pg-a.png" 6 0.47 0.075 0.925 0.42
    "$R" "$p" "$pg" "$OUT/$tag-p$pg-b.png" 6 0.47 0.40 0.925 0.745
  done
done
echo RENDER-DONE

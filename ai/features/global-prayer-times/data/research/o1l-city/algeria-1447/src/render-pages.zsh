#!/bin/zsh
# Table crops for every month page: page 2..13 = Hijri month 1..12.
R="$HOME/athan-gitree/census/o1k-wide/fit11/render"
CAP="$HOME/athan-gitree/census/o1l-city/algeria-1447/captures"
OUT="$HOME/athan-gitree/census/o1l-city/algeria-1447/pages"
typeset -A PDF
PDF[dz47]="$CAP/dz-marw-calendrier-1447-alger.pdf"
PDF[ad47]="$CAP/dz-marw-calendrier-1447-adrar.pdf"
PDF[dj47]="$CAP/dz-marw-calendrier-1447-djelfa.pdf"
PDF[dz48]="$CAP/dz-marw-calendrier-1448-alger.pdf"
typeset -A PAGES
PAGES[dz47]="3 4 5 9 11 12 13"
PAGES[ad47]="2 3 4 5 7 8 9 10 11 12 13"
PAGES[dj47]="2 3 4 5 7 8 9 10 11 12 13"
PAGES[dz48]="2 12"
for tag in ${(k)PAGES}; do
  for pg in ${(s: :)PAGES[$tag]}; do
    "$R" "$PDF[$tag]" "$pg" "$OUT/$tag-p$pg-tab.png" 3.0 0.465 0.072 0.93 0.742
  done
done

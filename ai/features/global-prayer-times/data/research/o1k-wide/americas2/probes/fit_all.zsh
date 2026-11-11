#!/usr/bin/env zsh
cd "$HOME/athan-gitree/census/o1k-wide/americas2"
f() { echo "== $1 $2"; node probes/fit_rows.js "data/masjidal_$1_2026.json" $2 $3 $4 $5; }
f 1QL0gbKZ 35.1580 -89.7820 America/Chicago shafi
f keLQn7AM 29.5900 -95.7300 America/Chicago hanafi
f XEdoEvL7 33.7880 -118.3160 America/Los_Angeles shafi
f nL1JggAa 42.3700 -83.3600 America/Detroit shafi
f z0AW66Lj 40.7000 -73.7900 America/New_York hanafi
f 6adJ5qAk 47.4500 -122.2900 America/Los_Angeles shafi
f VrdRkwKG 53.5461 -113.4938 America/Edmonton shafi
f pVdwyVLe 53.5461 -113.4938 America/Edmonton shafi
f M0dYkvL6 53.5461 -113.4938 America/Edmonton hanafi

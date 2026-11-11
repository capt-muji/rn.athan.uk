#!/bin/sh
set -u
cd "$HOME/athan-gitree/census/o1l-city/india-cities"
run() { python3 harvest-mbx.py "$1" "$2" "$3"; }
run masjid-umar-bin-khattab kanpur-umar 2026
run chand-masjid-usmanpur moradabad-chand 2026
run masjid-dhalanwali saharanpur-dhalanwali 2026
run masjid-fazl-e-haq up-fazl-e-haq 2026
echo BATCH3_DONE

#!/bin/sh
set -u
cd "$HOME/athan-gitree/census/o1l-city/india-cities"
run() { python3 harvest-mbx.py "$1" "$2" "$3"; }
run madarsa-rafah-e-aam kolkata-rafah 2026
run nandanpur-jama-masjid kolkata-nandanpur 2026
run noorani-masjid-1736945335686 ramban-noorani 2026
run noor-e-ilahi bihar-noor-e-ilahi 2026
run fazle-elahi-masjid baharampur-fazle-elahi 2026
run masjid-noori up-jaigahan-noori 2026
run madarsa-rafah-e-aam kolkata-rafah 2025
run nandanpur-jama-masjid kolkata-nandanpur 2025
run noorani-masjid-1736945335686 ramban-noorani 2025
run noor-e-ilahi bihar-noor-e-ilahi 2025
run fazle-elahi-masjid baharampur-fazle-elahi 2025
run masjid-noori up-jaigahan-noori 2025
echo BATCH2_DONE

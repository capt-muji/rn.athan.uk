#!/bin/sh
set -u
cd "$HOME/athan-gitree/census/o1l-city/india-cities"
run() { python3 harvest-mbx.py "$1" "$2" "$3"; }
run anjuman-risalat-e-haq-masjid mumbai-anjuman-risalat 2026
run masjid-as-salam-1746435310953 mumbai-deeniyat 2026
run sunni-pathan-masjid mumbai-sunni-pathan 2026
run madeena-masjid-1747480624720 chennai-madeena 2026
run masjid-e-rahmania bengaluru-rahmania 2026
run jamiat-ahlihadees-gow-kadal srinagar-jamiat-ahlihadees 2026
run masjidi-tasneem srinagar-soqte 2026
run sunni-jama-masjid-varedia gujarat-varedia 2026
run anjuman-risalat-e-haq-masjid mumbai-anjuman-risalat 2025
run masjid-as-salam-1746435310953 mumbai-deeniyat 2025
run sunni-pathan-masjid mumbai-sunni-pathan 2025
run madeena-masjid-1747480624720 chennai-madeena 2025
run masjid-e-rahmania bengaluru-rahmania 2025
run jamiat-ahlihadees-gow-kadal srinagar-jamiat-ahlihadees 2025
run masjidi-tasneem srinagar-soqte 2025
run sunni-jama-masjid-varedia gujarat-varedia 2025
echo BATCH_DONE

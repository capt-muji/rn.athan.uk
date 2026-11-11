#!/usr/bin/env zsh
# Analyse every captured Masjidal year feed: per-month column offsets and angle fit.
cd "$HOME/athan-gitree/census/o1k-wide/americas2"
run() { echo "#### $1 $2"; node probes/masjidal_analyze.js "captures/masjidal_$1_$3.json" $4 $5 $6 | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('days',d['days'])
for m in ('2026-01','2026-06','2026-11','2026-12'):
    if m in d['months']: print(' ',m,d['months'][m])
print('  shifted runs:',[ (r['from'],r['to'],r['bucket']) for r in d['runs']])
"; }
run 1QL0gbKZ memphis_cordova_tn 2026 35.1580 -89.7820 America/Chicago
run keLQn7AM richmond_tx 2026 29.5900 -95.7300 America/Chicago
run XEdoEvL7 southbay_lomita_ca 2026 33.7880 -118.3160 America/Los_Angeles
run nL1JggAa mas_tarbiyah_livonia_mi 2026 42.3700 -83.3600 America/Detroit
run z0AW66Lj jamaica_center_queens_ny 2026 40.7000 -73.7900 America/New_York
run 6adJ5qAk ema_seattle_seatac_wa 2026 47.4500 -122.2900 America/Los_Angeles
run pVdwyVLe masjid_ataqwa_edmonton 2026 53.5461 -113.4938 America/Edmonton
run M0dYkvL6 masjid_alfatima_edmonton 2026 53.5461 -113.4938 America/Edmonton

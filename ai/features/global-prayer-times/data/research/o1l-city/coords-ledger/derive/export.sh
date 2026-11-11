#!/bin/sh
# Regenerates the two inputs the solver reads from the census index. Run from derive/.
set -e
DB="$HOME/athan-gitree/census/census-index.db"
cd "$(dirname "$0")/../data"
sqlite3 -header -separator '|' "$DB" \
  "SELECT id,op,workspace,file,path,rows_n,first_date,last_date FROM surfaces ORDER BY op,workspace,file;" > surfaces.psv
sqlite3 "$DB" \
  "SELECT surface_id||'|'||date||'|'||COALESCE(sunrise,'')||'|'||COALESCE(dhuhr,'')||'|'||COALESCE(asr,'')||'|'||COALESCE(maghrib,'')
   FROM rows ORDER BY surface_id, date;" > rows.psv
wc -l surfaces.psv rows.psv

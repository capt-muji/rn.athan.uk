#!/bin/zsh
# Probe every provincial Kemenag host for a prayer-time surface.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OUT="$HOME/athan-gitree/census/o1l-city/indonesia2/data/prov-kemenag-probe.txt"
: > "$OUT"
for p in aceh sumut sumbar riau jambi sumsel bengkulu lampung babel kepri dki jakarta jabar jateng jatim banten bali ntb ntt kalbar kalteng kalsel kaltim kaltara sulut sulteng sulsel sultra gorontalo sulbar maluku malut papua papuabarat papuatengah papuapegunungan papuaselatan papuabaratdaya; do
  host="$p.kemenag.go.id"
  ip=$(dscacheutil -q host -a name "$host" 2>/dev/null | grep -m1 ip_address | awk '{print $2}')
  if [ -z "$ip" ]; then echo "NODNS $host" >> "$OUT"; continue; fi
  code=$(curl -sS -L --max-time 12 --connect-timeout 8 -A "$UA" "https://$host/" -o "/tmp/kem-$p.html" -w "%{http_code}" 2>/dev/null)
  size=$(wc -c < "/tmp/kem-$p.html" 2>/dev/null || echo 0)
  hit=""
  if [ "$code" = "200" ]; then
    hit=$(grep -oiE 'jadwal[ -]?sho?lat|waktu sho?lat|imsakiyah' "/tmp/kem-$p.html" | head -1)
    cp "/tmp/kem-$p.html" "$HOME/athan-gitree/census/o1l-city/indonesia2/captures/kem-$p.html"
  fi
  echo "$code $size $ip $host hit=${hit:-none}" >> "$OUT"
done
echo DONE >> "$OUT"

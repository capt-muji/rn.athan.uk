#!/usr/bin/env zsh
# Live-page gates: capture each mosque's own page and the Masjidal widget page.
cd "$HOME/athan-gitree/census/o1l-city/us-states"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
declare -A sites=(
  [5AvPx2KX]="https://www.masjidalhusna.com"
  [VrdRZqdG]="https://www.masjidalquba.net"
  [pQKMMBKB]="https://www.suwaneemasjid.org/"
  [PAPy7ZdJ]="https://www.masjidibraaheem.com/"
  [4nL1XlKa]="http://www.masjidjafaratl.com"
  [xwLVXMdJ]="https://abubakrislamiccenter.org/"
  [keLQjWAM]="https://www.idrismosque.com/"
  [RKxwXOdO]="https://ihseattle.org"
  [lJAmRjdR]="https://chamrefugeescommunity.org"
  [1QL0VydZ]="https://icopsmasjidwa.org"
  [VrdRbPdG]="https://mapsredmond.org/"
  [QL0MGBAZ]="https://islamiccenterofkent.org"
  [0AWpj0dj]="https://mapsredmond.org/maps-snohomish/"
  [y0LbBXLo]="https://www.puyallupmasjid.org/"
  [adJmGxAk]="https://assaber.org/"
  [XAlzQrKb]="https://www.annoorpdx.org/"
  [xdyqvadX]="https://www.charlottemcc.org"
  [BYADgwLN]="https://alnoormasjid.org/"
  [8KXma5LM]="http://www.alhudakaty.org"
  [keLQn7AM]="https://www.richmondmasjid.org"
  [1QL0gbKZ]="https://memphisislamiccenter.org"
  [rdRvm3dG]="https://www.ictnonline.com"
  [6adJ5qAk]="https://emasjiseattle.org"
)
for id in ${(k)sites}; do
  f="captures/gate_${id}_site.html"
  if [ ! -s "$f" ]; then
    code=$(curl -sSL -m 25 -A "$UA" "${sites[$id]}" -o "$f" -w "%{http_code}" 2>/dev/null)
    echo "site $id [${code}] $(wc -c < "$f" | tr -d ' ')b"
    sleep 0.5
  fi
  f2="captures/gate_${id}_widget.html"
  if [ ! -s "$f2" ]; then
    code=$(curl -sSL -m 25 -A "$UA" "https://masjidal.com/widget/monthly/?masjid_id=${id}" -o "$f2" -w "%{http_code}" 2>/dev/null)
    echo "widget $id [${code}] $(wc -c < "$f2" | tr -d ' ')b"
    sleep 0.4
  fi
done

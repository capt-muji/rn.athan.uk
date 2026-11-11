#!/usr/bin/env zsh
# One live re-read per publisher that the banked captures leave without a location field.
cd "$HOME/athan-gitree/census/o1l-city/coords-americas"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
mkdir -p captures
fetch() { # name url
  f="captures/$1"
  [ -s "$f" ] && { echo "cached $1"; return; }
  code=$(curl -sSL -m 45 -A "$UA" "$2" -o "$f" -w "%{http_code}")
  echo "$1 [$code] $(wc -c <"$f" | tr -d ' ') bytes  $2"
  sleep 0.5
}
fetch mb_chaguanas.html      "https://masjidbox.com/prayer-times/masjid-chaguanas-tt"
fetch mb_guaico.html         "https://masjidbox.com/prayer-times/masjid-ul-mu%27mineen"
fetch mb_sanfernando.html    "https://masjidbox.com/prayer-times/san-fernando-jama-masjid"
fetch mb_tobago.html         "https://masjidbox.com/prayer-times/masjid-abdullah-ibn-abbaas"
fetch mb_cartagena.html      "https://masjidbox.com/prayer-times/mezquita-de-muhammad-1747848830940"
fetch site_bilal.html        "https://bilalcentre.ca/"
fetch site_kitchener.html    "https://kitchenermasjid.com/"
fetch site_mia.html          "https://miaonline.org/"
fetch site_ummah.html        "https://ummahmasjid.ca/"
fetch site_hamza.html        "https://isghmasjidhamza.org/"
fetch site_mcisonline.html   "https://masjid.mcisonline.net/"
fetch site_icgt.html         "https://icgt.org/"
fetch site_mcsamasjid.html   "https://mcsamasjid.com/"
fetch site_iit.html          "https://islamicinstitute.ca/"
fetch site_masjidtoronto.html "https://masjidtoronto.com/"
fetch site_bic.html          "https://bicmanitoba.ca/"
fetch site_icswo.html        "https://islamiccentre.ca/"
fetch site_hijrah.html       "https://hijrah.org/"
fetch site_mai.html          "https://mai-ri.org/"
fetch site_ifvp.html         "https://ifvp.org/"
fetch site_mosquefoundation.html "https://www.mosquefoundation.org/"
fetch site_icci.html         "https://iccichicago.org/"
fetch site_icsc.html         "https://www.icsconline.org/"
fetch site_sma.html          "https://smawebsite.com/salat-timings/"

#!/bin/zsh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
for pair in "İZMİR:izmir" "BURSA:bursa" "ADANA:adana" "KONYA:konya" "ANTALYA:antalya" "TRABZON:trabzon" "DİYARBAKIR:diyarbakir" "ERZURUM:erzurum" "SAMSUN:samsun" "KAYSERİ:kayseri" "ESKİŞEHİR:eskisehir" "MALATYA:malatya" "VAN:van" "ŞANLIURFA:sanliurfa" "DENİZLİ:denizli"; do
  name="${pair%%:*}"; slug="${pair##*:}"
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$name")
  out=$(curl -sS -A "$UA" -H "X-Requested-With: XMLHttpRequest" --max-time 25 "https://namazvakitleri.diyanet.gov.tr/Tr-tr/home/GetDestinationUrl?CountryName=T%C3%9CRK%C4%B0YE&StateName=$enc&StateRegionName=&Culture=tr-TR")
  echo "$slug|$name|$out"
done

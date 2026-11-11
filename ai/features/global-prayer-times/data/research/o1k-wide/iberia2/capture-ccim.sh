#!/bin/zsh
# Polite CCIM capture: one request every 20 s, logs the status code per month.
cd "$HOME/athan-gitree/census/o1k-wide/iberia2"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
log=captures/es-ccim-capture.txt
: > $log
typeset -A M
M=(01 Enero 02 Febrero 03 Marzo 04 Abril 05 Mayo 06 Junio 07 Julio 08 Agosto 09 Septiembre 10 Octubre 11 Noviembre 12 Diciembre)
for y in 2025 2026; do
  for mm in 01 02 03 04 05 06 07 08 09 10 11 12; do
    name=$M[$mm]
    out="captures/es-ccim-$y-$name.pdf"
    [[ -s $out ]] && { print -r -- "$y $name cached" >> $log; continue }
    code=$(curl -sSL --max-time 90 -A "$UA" -o "$out" -w '%{http_code}' "https://centro-islamico.com/Doc/Horario/$y/$name-$y.pdf")
    [[ $code != 200 ]] && rm -f $out
    print -r -- "$y $name $code" >> $log
    sleep 20
  done
done
print -r -- DONE >> $log

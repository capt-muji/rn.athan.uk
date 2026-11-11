#!/bin/zsh
# Slow, polite enumeration of the CCIM monthly PDF pattern (Cloudflare rate limit 1015).
cd "$HOME/athan-gitree/census/o1k-wide/iberia2"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
meses=(Enero Febrero Marzo Abril Mayo Junio Julio Agosto Septiembre Octubre Noviembre Diciembre)
log=captures/es-ccim-enum-slow.txt
: > $log
for y in 2027 2025 2026; do
  for m in $meses; do
    code=$(curl -s -o /dev/null --max-time 60 -A "$UA" -w '%{http_code}' "https://centro-islamico.com/Doc/Horario/$y/$m-$y.pdf")
    print -r -- "$y $m $code" >> $log
    sleep 12
  done
done
print -r -- "DONE" >> $log

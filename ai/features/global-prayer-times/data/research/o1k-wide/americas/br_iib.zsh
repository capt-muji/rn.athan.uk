#!/usr/bin/env zsh
# IIB (Instituto Islamico Brasileiro) keyless month API: 25 listed cities, two months.
cd "$HOME/athan-gitree/census/o1k-wide/americas"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
cities=(Sao_Paulo Rio_de_Janeiro Belo_Horizonte Recife Fortaleza Manaus Belem Goiania Campinas Guarulhos Sao_Bernardo_do_Campo Santo_Andre Curitiba Porto_Alegre Brasilia Salvador Florianopolis Vitoria Natal Joao_Pessoa Maceio Cuiaba Campo_Grande Porto_Velho Aracaju)
for c in $cities; do
  for my in "11 2026" "2 2026"; do
    m=${my%% *}; y=${my##* }
    q="city=${c//_/%20}&country=Brazil&view=month&cal=greg&m=$m&y=$y"
    out="captures/br_iib_${c}_${y}-$(printf '%02d' $m).json"
    code=$(curl -sSL -m 30 -A "$UA" "https://institutoislamico.org.br/api/prayer/times?$q" -o "$out" -w "%{http_code}" 2>/dev/null)
    rows=$(python3 -c "import json;print(len(json.load(open('$out')).get('data',[])))" 2>/dev/null || echo 0)
    printf "%s\t%s-%s\tHTTP %s\trows %s\n" "$c" "$y" "$m" "$code" "$rows"
    [ "$rows" = "0" ] && rm -f "$out"
    sleep 1
  done
done

#!/usr/bin/env zsh
# Probe IIB keyless month API for cities beyond the held 25 (Brazil extras + 19 other countries).
cd "$HOME/athan-gitree/census/o1l-city/latam-cities"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
probe() {
  local country="$1" city="$2"
  local cs="${city// /%20}" cos="${country// /%20}"
  local out="captures/probe_iib_${country// /_}_${city// /_}.json"
  local code=$(curl -sSL -m 30 -A "$UA" "https://institutoislamico.org.br/api/prayer/times?city=$cs&country=$cos&view=month&cal=greg&m=11&y=2026" -o "$out" -w "%{http_code}" 2>/dev/null)
  local rows=$(python3 -c "
import json,sys
try:
  d=json.load(open('$out'))
  print(len(d.get('data',[])), d.get('data',[{}])[0].get('meta',{}).get('timezone','') if d.get('data') else '')
except Exception as e:
  print(0,'')
" 2>/dev/null)
  printf "%s\t%s\tHTTP %s\trows_tz %s\n" "$country" "$city" "$code" "$rows"
  [ "${rows%% *}" = "0" ] && rm -f "$out"
  sleep 1
}
# Brazil cities in directory NOT in the held 25
for city in "Sao Luis" "Juiz de Fora" "Varginha" "Anapolis" "Jatai" "Trindade" "Serra" "Taguatinga" "Petropolis" "Olinda" "Belo Jardim" "Carambei" "Foz do Iguacu" "Francisco Beltrao" "Guarapuava" "Jaguapita" "Loanda" "Londrina" "Marechal Candido Rondon" "Maringa" "Paranagua" "Paranavai" "Ponta Grossa" "Sao Jose dos Pinhais" "Alegrete" "Caxias do Sul" "Chui" "Livramento" "Novo Hamburgo" "Passo Fundo" "Pelotas" "Quarai" "Sao Borja" "Uruguaiana" "Criciuma" "Lages" "Barretos" "Bebedouro" "Carapicuiba" "Colina" "Embu das Artes" "Francisco Morato" "Guaira" "Jundiai" "Mogi das Cruzes" "Ribeirao Preto" "Santos" "Sao Jose dos Campos" "Sorocaba" "Suzano" "Taboao da Serra" "Taubate" "Corumba" "Dourados" "Ponta Pora"; do
  probe "Brazil" "$city"
done
# Other countries
probe "Ecuador" "Quito"
probe "Ecuador" "Guayaquil"
probe "Uruguay" "Montevideo"
probe "Uruguay" "Las Piedras"
probe "Paraguay" "Asuncion"
probe "Bolivia" "Sucre"
probe "Bolivia" "Cochabamba"
probe "Bolivia" "Santa Cruz"
probe "Peru" "Lima"
probe "Colombia" "Bogota"
probe "Colombia" "Pasto"
probe "Colombia" "San Andres"
probe "Chile" "Santiago"
probe "Chile" "San Bernardo"
probe "Chile" "Coquimbo"
probe "Chile" "Iquique"
probe "Argentina" "Buenos Aires"
probe "Argentina" "Cordoba"
probe "Argentina" "Mendoza"
probe "Argentina" "Rosario"
probe "Argentina" "Tucuman"
probe "Mexico" "Ciudad de Mexico"
probe "Mexico" "Monterrey"
probe "Mexico" "Hermosillo"
probe "Mexico" "Rosarito"
probe "Venezuela" "Caracas"
probe "Venezuela" "Maracaibo"
probe "Venezuela" "Valencia"
probe "Venezuela" "Porlamar"
probe "Guatemala" "Ciudad de Guatemala"
probe "Honduras" "San Pedro Sula"
probe "Costa Rica" "San Jose"
probe "Panama" "Ciudad de Panama"
probe "Panama" "David"
probe "Panama" "Colon"
probe "Cuba" "La Habana"
probe "Nicaragua" "Managua"
probe "El Salvador" "San Salvador"
probe "Puerto Rico" "San Juan"
probe "Republica Dominicana" "Santo Domingo"

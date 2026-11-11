#!/bin/zsh
run() { node fit.js "data/rows/$1-2026.json" $2 $3 $4 "$5" > "data/fit-$1.json" 2>&1; python3 - "$1" <<'PY'
import json,sys
t=sys.argv[1]
d=json.load(open('data/fit-%s.json'%t))
r=d['recipe']; pc=d['perColumn']
print("%-26s %2d/%2d %-6s off=%s | fajr %d/%d w%d | isha %d/%d w%d | dhuhr %d w%d | asr %d w%d | maghrib %d w%d | sun %d w%d"%(
 t,r['fajrAngle'],r['ishaAngle'],r['madhab'],','.join('%s%+d'%(k[:2],v) for k,v in r['offsets'].items() if v),
 pc['fajr']['exact'],pc['fajr']['w1'],pc['fajr']['worst'],
 pc['isha']['exact'],pc['isha']['w1'],pc['isha']['worst'],
 pc['dhuhr']['exact'],pc['dhuhr']['worst'],
 pc['asr']['exact'],pc['asr']['worst'],
 pc['maghrib']['exact'],pc['maghrib']['worst'],
 pc['sunrise']['exact'],pc['sunrise']['worst']))
PY
}
run benin-savalou-mutiyy 7.8510894 1.897212 Africa/Porto-Novo "BJ Savalou Al-Mutiyy"
run bf-ouaga-kanazoe 12.3714277 -1.5197 Africa/Ouagadougou "BF Ouaga Kanazoe"
run ci-abidjan-genie2000 5.3757182240003 -3.9351761 Africa/Abidjan "CI Abidjan Genie2000"
run ci-abidjan-nountoure 5.4533124815484 -4.079353433401 Africa/Abidjan "CI Abidjan NounToure"
run ci-abidjan-cisse 5.3479239 -4.0160501 Africa/Abidjan "CI Abidjan Cisse"
run ci-abidjan-comucip 5.3838362223676 -3.916851 Africa/Abidjan "CI Abidjan COMUCIP"
run ci-abidjan-aghien 5.3822233 -3.9932946 Africa/Abidjan "CI Abidjan Aghien"
run ci-abidjan-ibrahim 5.25777 -3.90455 Africa/Abidjan "CI Abidjan Ibrahim"
run sl-freetown-ansaar 8.460859 -12.682281 Africa/Freetown "SL Freetown Al Ansaar"
run togo-lome-zossime 6.2320294726382 1.1501741409302 Africa/Lome "TG Lome Zossime"

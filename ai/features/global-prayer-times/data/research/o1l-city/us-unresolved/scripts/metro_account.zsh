#!/usr/bin/env zsh
# Metro accounting for the report: resolved / candidate / defective / unproven.
cd "$HOME/athan-gitree/census/o1l-city/us-unresolved"
resolved=(
"Allentown|PA|lJAmvOdR 3y clean 15/15"
"Bridgeport|CT|3wdqj2Kb 3y clean + masjidbox bicc 7d"
"Chattanooga|TN|mawaqit isgc 365 clean"
"Cleveland|OH|3OA8MOdp + 1QL0NBdZ 3y each clean"
"Fort Wayne|IN|RKxwpMdO 3y clean"
"Indianapolis|IN|YRKxllKO 3y clean Hanafi"
"Jacksonville|FL|bicjax dpt 181d 15-family"
"Lansing|MI|0aAeyzAj 3y DEFECTIVE (isha -18)"
"Lexington|KY|3wdqX2Ab 3y clean"
"Little Rock|AR|theiclr dpt 2023 DEFECTIVE (solar rms 5.5)"
"Milwaukee|WI|nzKzJoKO + nDAgZDL0 3y each clean"
"Newark|NJ|8KXm93LM 3y hand-entered class"
"Omaha|NE|PAPyprdJ hand-entered; aAeoEzKj 2026 regime change"
"Pittsburgh|PA|QKMnW1LB + zKz8QzAO 3y each clean"
"Richmond|VA|BYAD8JAN 3y clean Hanafi + mawaqit al-iman clean"
"Sacramento|CA|mawaqit arden-arcade 365 clean"
"Shreveport|LA|BYADwlLN 3y clean Hanafi"
"Toledo|OH|MjKZ93dX 3y clean"
"Tulsa|OK|xdyq9ZdX 3y clean"
"Greensboro|NC|OLnR9WLM 3y clean Hanafi + apex dpt defective"
"St. Louis|MO|rdRvQDdG 3y clean"
"Orlando|FL|p8KXaELM 3y 18-family Hanafi"
"New York|NY|3OA8V3Kp 3y clean"
"Worcester|MA|rGAEj9dn 3y clean"
"Des Moines|IA|ICDM PDF Nov-2026 candidate 18-family"
"San Antonio|TX|MCEEC PDF Nov-2026 candidate 15-family"
"Wichita|KS|ISW PDF Nov-2026 candidate 15-family"
"Albuquerque|NM|masjidbox 7d candidate"
"Buffalo|NY|masjidbox 7d candidate"
"Columbus|OH|masjidbox noorohio + omar-masjid 7d candidate"
"Cincinnati|OH|masjidbox IAC 7d candidate"
"Mobile|AL|dpt 2026 DEFECTIVE (Houston coordinates)"
"Las Vegas|NV|mawaqit Tawheed DEFECTIVE (hand-edited +79)"
)
held=("Atlanta|GA|held; NEW QL0BZWdZ 3y clean" "Charlotte|NC|held; NEW xdyqvadX 3y clean" "Memphis|TN|held" "Nashville|TN|held" "Phoenix|AZ|held; zKz3zRLO re-read 18/17 Hanafi" "Hartford|CT|held (Waterbury); no new surface")
unproven=("Albany|NY" "Baltimore|MD" "Baton Rouge|LA" "Birmingham|AL" "Dearborn|MI" "Detroit|MI" "Flint|MI" "Gainesville|FL" "Grand Rapids|MI" "Kansas City|MO" "Knoxville|TN" "Louisville|KY" "Montgomery|AL" "New Orleans|LA" "Norfolk|VA" "Oklahoma City|OK" "Portland|OR" "Providence|RI" "Raleigh|NC" "Rochester|NY" "Salt Lake City|UT" "Tallahassee|FL" "Tucson|AZ" "Wilmington|DE")
printf "%-18s %-4s %s\n" METRO ST STATE
for r in $resolved; do print -r -- "$r" | awk -F'|' '{printf "%-18s %-4s %s\n",$1,$2,$3}'; done
for r in $held; do print -r -- "$r" | awk -F'|' '{printf "%-18s %-4s %s\n",$1,$2,$3}'; done
for r in $unproven; do print -r -- "$r" | awk -F'|' '{printf "%-18s %-4s %s\n",$1,$2,"UNPROVEN"}'; done
echo "counts: new=${#resolved} held=${#held} unproven=${#unproven} total=$(( ${#resolved} + ${#held} + ${#unproven} ))"

# R14 data: how the app knows where it is, offline

Scripts and results for `agent-reports/R14-location-and-device.md`. Every `.txt` is the verbatim
stdout of the `.mjs` beside it. Nothing here is app code and nothing was installed into the
repository's `package.json`.

## Reproducing

Everything ran in `/Users/muji/athan-global-scratch/r14/` on Node `v24.14.1`, against
`adhan@4.4.6` and `@photostructure/tz-lookup@11.7.0` installed there alone.

```bash
mkdir -p ~/athan-global-scratch/r14 && cd ~/athan-global-scratch/r14
npm i adhan@4.4.6 @photostructure/tz-lookup@11.7.0
curl -sO https://download.geonames.org/export/dump/cities15000.zip && unzip -o cities15000.zip
# geoBoundaries gbOpen ADM2 polygons, one per country, into ./bounds/
for iso in MYS IDN BRN LKA BGD TUR; do
  curl -s "https://www.geoboundaries.org/api/current/gbOpen/$iso/ADM2/" -o "bounds/$iso-adm2-meta.json"
  curl -sL "$(python3 -c "import json;print(json.load(open('bounds/'"'"$iso"'"'-adm2-meta.json'))['gjDownloadURL'])")" -o "bounds/$iso-adm2.geojson"
done
node part1.mjs > part1.txt   # and so on for every part
```

`part3-gps.mjs` and the two `part5-jakim*` scripts make network requests and cache them
(`wsgrid.json`, `jakim-cache.json`, `jakim-year.json`), so a rerun is offline after the first.
Those caches stay in the scratch tree; they are large and reproducible.

## What each file measures

| File | Section of the report | What it measures |
| --- | --- | --- |
| `lib.mjs` | all | the shared `adhan` configuration, the km-to-degree conversions and the table printer |
| `part1.mjs` | 2.1 to 2.5 | position sensitivity: sub-minute deltas per prayer per km, per axis, per latitude, per season, plus the binary-searched tolerance radii |
| `part1b.mjs` | 2.6 | the same question in DISPLAYED minutes over a whole year, 2,190 values per position |
| `part1c.mjs` | 2.6 | the Tromso outliers isolated as solver discontinuities rather than position sensitivity |
| `part2-tz.mjs` | 3.2 | timezone-only positioning, every city of `cities15000` against its zone's most populous city |
| `part2-tz2.mjs` | 3.2, 3.3 | three choices of zone representative point, and prayer error against qibla error side by side |
| `part2-country.mjs` | 3.4 | the country signal: `zone.tab` ambiguity, and the error of computing at the country capital |
| `part2-citylist.mjs` | 3.7 | the byte cost of a worldwide city list, and the greedy set cover that answers "how many cities" |
| `part2-tzlookup.mjs` | 3.9 | `@photostructure/tz-lookup` against all 34,152 GeoNames places, with the offset cost of each disagreement |
| `part2-methods.mjs` | 3.1 | every positioning method's documented accuracy converted to prayer minutes |
| `part3-zones.mjs` | 4.2 | do JAKIM's 60 zone descriptions name districts the open polygon set carries |
| `part3-gps.mjs` | 4.2 | a 1,605-point grid probe of `api.waktusolat.app` `GET /zones/{lat}/{lon}` |
| `part3-offline-zone.mjs` | 4.2, 4.3 | can that mapping be reproduced OFFLINE from geoBoundaries ADM2, and what do the polygons cost |
| `part4-travel.mjs` | 5.1 to 5.3 | real journeys, the worst intra-zone journey per zone, and the cross-zone false-alarm rate |
| `part4-alarms.mjs` | 5.4 | the solar and zone error in an alarm the OS already holds, and how many requests a move invalidates |
| `part5-elevation.mjs` | 6.1, 6.2 | the horizon dip in minutes, how high the world lives, and the cost of storing elevation |
| `part5-jakim.mjs` | 6.3 | the decisive test: does JAKIM already apply an elevation correction |
| `part5-jakim-robust.mjs` | 6.3 | the same result defended against a wrong reference coordinate, whole published year |
| `zonedelta.mjs` | 4.4 | what picking the WRONG JAKIM zone costs, on JAKIM's own published times |

## Result data

| File | Contents |
| --- | --- |
| `tz-perzone.json` | per-IANA-zone summary: city count, principal city, worst city, worst error, extent in km, population within 2, 5 and 10 minutes |
| `tz-error-muslim-majority-cities.csv` | the per-city timezone-only error for the 4,961 `cities15000` places in Muslim-majority countries. The full 34,152-row version is 2.4 MB and stays in the scratch tree |
| `part4-intrazone.json` | for every IANA zone with 3 or more cities, the worst pair of cities inside it and the minutes between them |
| `part5-jakim.json` | the per-zone JAKIM residuals behind the elevation finding |

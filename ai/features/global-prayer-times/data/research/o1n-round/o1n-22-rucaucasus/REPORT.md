# O1n-22 — Russia and the Caucasus, the fronts O1n-16 never reached

Wave O1n-22 of round o1n. Workspace `$HOME/athan-gitree/census/o1n/o1n-22-rucaucasus/`.
Continues O1n-16 (stopped mid-write at Chechnya); the predecessor's Dagestan 27-district bank,
Grozny and Vladikavkaz captures stand in `../o1n-16-russia/` and were not redone.
Engine: adhan 4.4.6 (`census/adhan-build/node_modules/adhan`), `Rounding.None`, dates from the
row's printed literal date, UTC capture timestamps, no real clock read. No subagents deployed
(no grandchildren). Public pages only; nothing under /tmp; nothing written to the repo.

## 1. Chechnya — negative at the authority, community tier carries the republic

The DUM ChR's own site (`dumchr.ru`) has no prayer table: `/namaz/` is an explainer article
("what namaz is"), no schedule endpoint in its markup, and the only times on the page are
meta-tag timestamps of a 2022 post (inherited capture `../o1n-16-russia/captures/dumchr_namaz.html`,
re-examined this run). Grozny therefore stands as banked by O1n-16: `govzalla.com` monthly
"Ламазан хенаш" tables (365 dated rows, `../o1n-16-russia/data/grozny_govzalla_rows.json`) —
a Chechen portal, community tier, never authority. Not found under these terms: a DUM ChR or
"Heart of Chechnya" mosque surface serving dated tables. Engines: TinyFish search (Russian:
"думchr.ru расписание намаза Грозный время намаза"), site-direct navigation of dumchr.ru.

## 2. Kabardino-Balkaria — DUM KBR annual table, banked (provisional)

**The surface.** `kbrdum.ru/PDF/2025.pdf` ("ГРАФИК НАМАЗОВ НА МЕСЯЦ ... ПО КБР", site footer
"Сайт ДУМ КБР: www.dumkbr.ru"), 12 monthly pages, served by the muftiate's own site.
`/8-grafik-namazov` is the category page (daily posts in 2026, one day per post; not harvested).
The PDF has a text layer; parsed by column coordinates (script `data/`), **365 dated rows** in
`data/kbr_nalchik_2025.json` (city table "ПО КБР", read at Nalchik 43.4989, 43.6189,
Europe/Moscow). Print faults: 2025-04-09 isha prints `08:26` (night value in a morning slot);
kept as printed, excluded from the fit. A 2025 Wayback/CDX pass for older editions died on the
archive being offline mid-run (see NOTICE).

**Recipe and scores (adhan 4.4.6, one year).** Both twilight columns are angle curves with
fixed-minute floors — the house prints sunrise−90 (fajr) and maghrib+100 (isha) whenever the
natural angle gap sits under the floor, and lets the angle through in a summer arc (roughly
27 Apr - 7 Aug) peaking at 109/110 min at the solstice (daily floor-to-angle sequence in
`data/fit_kbr.js` output). The exact angle inside the arc is unresolved (about 15-16 deg):
fajr w1 73.2 pc worst 5.0, isha w1 64.7 pc worst 3 (fault day excluded). Solar columns:
sunrise solar−3 (w1 87.1, worst 2), dhuhr transit+10 (w1 100, worst 1), asr Shafi+8
(exact 50.1, w1 80.5, worst 4), maghrib sunset+6 (w1 91.8, worst 2). Seasonal amplitude
fajr→maghrib span: 634 min (1 Jan) against 1,033 min (1 Jul) in the table. **Grade:
provisional** — one published cycle, fitted, twilight angles partially resolved; a different
house recipe from CDUM's 18/17 and from Dagestan's 17.5/15.0.

## 3. North Ossetia — inherited 2026 transcript diagnosed; mid-year print fault; year-2 doors closed live

O1n-16 banked `islamosetia.ru` `Raspisanie_namazov_Vladikavkaz_2026.pdf` via OCR (319 sparse
rows, `data/vladikavkaz_islamosetia_2026.json`). This run's work:

- **The transcript is faithful to the print.** A fresh local-Vision OCR pass of page 9
  (September) reproduces the transcript's values, including maghrib 18:56 for mid-September
  where astronomy says ~18:12 (`captures/islamosetia_p9_tokens.txt.gz`).
- **The print itself is wrong mid-year.** From roughly July the printed solar columns inflate
  the day: by mid-September the printed sunrise/maghrib day length is 823 min against the
  physical 751 (a +72 min stretch); January and December pages fit the model tightly
  (Jan 15: fajr/sunrise/asr/maghrib/isha all within 1 min at 18/17-class angles). The
  inherited transcript's apparent drift was re-dated per month block by sunrise/maghrib
  cross-correlation (`data/repair_vladikavkaz.js`,
  `data/vladikavkaz_islamosetia_2026_repaired.json`): blocks anchor at day 1, residuals stay
  large only in the Jul-Nov stretch. Flagged: unresolved publisher print fault, same class as
  Dagestan's corrupted month blocks. **Grade stays candidate** (dated 2026, no clean fit).
- **Year-2 doors:** the live site serves only the 2026 edition (probed
  `wp-content/uploads/{YYYY}/{01,11,12}` for 2022-2025 and 2027: all 404); the inherited
  "2022-2025/2027" PDFs are saved 404 pages, not PDFs. Wayback CDX was offline during this
  run's retry window (see NOTICE), so archive hunts for prior editions are an open item.

## 4. Ingushetia, Karachay-Cherkessia, Adygea — negatives at the muftiate level

- **Ingushetia**: search (Russian: "муфтият Ингушетии расписание намаза Магас Назрань время",
  TinyFish; also the DUM RF region listing) surfaces only aggregator platforms
  (raspisanienamaza.ru, azan.today, namaz.su, namazik.ru) — platform methods, never
  provenance. No Ingush muftiate table found under these terms.
- **Karachay-Cherkessia**: the muftiate's own site `dumkchr.ru` answers, but the front page is
  a 3 KB shell with no schedule link (`captures/dumkchr_home.html.gz`); Cherkessk tables
  surface only on aggregators. Not found under these terms.
- **Adygea**: the DUM of Adygea and Krasnodar Krai's own site `dumraikk.ru` carries no prayer
  table; the only namaz link is a "how to pray" article (`captures/dumraikk_home.html.gz`).
  Not found under these terms.

## 5. Moscow — blocked today

`mihrab.ru` (Moscow Cathedral Mosque's own site) served 502 on every attempt this run (three
routes: https direct, http redirect, TinyFish fetch; error pages kept
`captures/mihrab_raspisanie.html.gz`, `captures/mihrab_home.html.gz`). The DUM RF site
(`dumrf.ru`, "Мусульмане России") region pages do not carry static tables. Moscow's banked
layer remains CDUM's 21-city bank from the earlier round. Not found under these terms today;
mihrab.ru is a recorded open door (blocked, not absent).

## 6. Siberia beyond CDUM — negative under these terms

TinyFish Russian searches ("духовное управление мусульман Сибири Новосибирск расписание намаза
сайт") surface only aggregator platforms (azan.su and peers) for Novosibirsk/Omsk/Tomsk/
Irkutsk/Krasnoyarsk; no regional muftiate's own dated table surfaced under these terms. The
inherited `rdums_home.html` (Sverdlovsk muftiate, Yekaterinburg) is Ural, outside this wave's
fronts; left for the owner's next dispatch. Time did not reach per-city muftiate site-direct
walks; recorded as open.

## 7. Bashkortostan — retention PROVEN, DUM RB's own schedule service, banked (provisional)

**The surface.** The DUM RB app's public API (`api.dumrb.com/PrayerSchedule/generate?cityId=1&
year=YYYY&month=M`, city list at `/Prayer/GetSupportedCities`) generates the muftiate's own
monthly schedule sheet ("Время намазов на месяц", "Расписание намаза" by ДУМ РБ) as a PDF with
a text layer, **63 cities across Bashkortostan**, suhur/fajr/sunrise/zaual/dhuhr/asr/maghrib/
isha columns. Harvested all 12 monthly sheets served for 2026 for Ufa (cityId=1, 54.7352,
55.9587, Asia/Yekaterinburg; each sheet covers one Hijri month, 29-30 rows, anchored onto the
Gregorian year): 12 PDFs (`captures/dumrb_ufa_2026-*.pdf.gz`) → **353 dated rows spanning
2026-01-01 to 2026-12-30** in `data/dumrb_ufa_2026.json` (sheet rows re-anchored by
sunrise/maghrib cross-correlation, `data/anchor_ufa.js` + `data/ufa_dump_rows.py`; every
sheet anchors on the 1st of its month).
**Year-2 evidence:** the service still serves 2025-06 (Zul-Hijjah 1446 sheet, 30 rows,
`data/dumrb_ufa_2025-06.json`); 2024 and 2027 answer "запись не найдена" (window = current
year + one). Printed editions: the generated PDF IS the muftiate's printed sheet format.

**Recipe and scores.** Sheet shape: fajr and isha are angle columns — winter gaps match
**fajr 16 deg / isha 15 deg** exactly (Jan 15: 118/110 min = 16/15 deg at Ufa; model and print
agree to the minute), with a **90-minute white-nights clamp** from mid-May to early August
(Jun-Jul prints 90/90 flat). The print carries a **dated mid-year fault block: August-November
solar columns drift up to ~25 min against astronomy** (sheet-anchor mean error 5-10 min in
Aug-Nov against 0.2-1.4 min elsewhere; the same corrupted-late-summer class as Vladikavkaz's
2026 sheet). Scores on the healthy span (Nov-Mar, 146 rows): fajr w1 97.9 pc worst 2,
maghrib w1 99.3 pc worst 2, zaual transit−1 w1 100, isha w1 75.3 worst 3, asr Hanafi−1
w1 78.8 worst 2, sunrise w1 80.8 worst 17 (scattered cells). **Grade: provisional** — one
published full cycle (2026) fitted on the healthy span + one 2025 month matching, fault block
dated; not A.

## 8. Dagestan year identity — archive holds exactly one edition

Wayback CDX for `muftiyatrd.ru/json/namaz/mahashkala.json` with `collapse=digest` returns
**exactly one capture: 2020-11-22** (digest 6ELZM2AP42RNPDEJUGYIPVEWGNM43HKC, all other
snapshots that day are revisits of the same bytes) — the predecessor proved those bytes equal
to the live 2026 file. A dated statement page exists on the same authority — "Расписание
намазов, составленное Муфтиятом РД, соответствует действительности"
(`captures/muftiyatrd_statement.html.gz`) — but its body prints no year. A year-printed
Dagestan edition is **not found under these terms**: the static year-agnostic edition stands,
its year identity stays unproven, and the archive evidence now pins "served byte-stable since
2020-11-22".

## 9. Caucasus trio (AZ / GE / AM) — not reached

Search prep only; no fetches. Recorded as not reached in this wave (context spent on the
Bashkortostan and KBR banks).

## Not proven (this wave's honest negatives, in my own words)

- A Chechen authority table: not found; the republic stands on a community portal (govzalla).
- An Ingush, Karachay-Cherkess or Adygean muftiate table: not found under these terms; only
  aggregator platforms answer for those republics.
- Moscow Cathedral Mosque tables: the site was down/502 all run; nothing banked, door open.
- A Siberian regional muftiate's own dated table: not found under these terms.
- A year-printed Dagestan edition: not found; the one archived edition is byte-stable since
  2020-11-22 and prints no year.
- North Ossetia years 2022-2025/2027: absent live; archive hunt not completed (archive down
  in this run's window).
- KBR's summer-arc twilight angle and Ufa's August-November print fault: measured, not
  explained; both need a second edition or the house generator to resolve.
- Ufa's sheets cover a Hijri year (353 rows across 12 sheets), not the Gregorian 365: twelve
  Gregorian days carry no row. The healthy-span fit reads 146 Nov-Mar rows; the clamp season
  and the fault block take the rest.

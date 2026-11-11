# o1n-7 Maldives — front report

Wave: o1n-7r (continuing cancelled o1n-7). Date worked: 2026-11-11.
Engine for the fit: adhan 4.4.6, Rounding.None, via fit.js in this workspace.

## Surface: mv-islamicaffairs-male-2015 — BANKED, PASS

- What: the Ministry of Islamic Affairs' (Maldives) own annual prayer calendar
  for 2015, one page per Gregorian month, times for Male. Dhivehi/English
  bilingual print; cover carries Hijri 1434/1436 mapping text.
- Source: islamicaffairs.gov.mv download
  `2015 ge calander information 2-17112014091704.pdf`, taken from the Wayback
  Machine capture 20150105070547 (the live ministry domain serves a
  Cloudflare "Attention Required" challenge to anonymous fetchers — recorded,
  not passed). Raw artifact: captures/mv/mvi-2015-calendar.pdf (1,950,857 B,
  17 pages, pure image scan — zero fonts, 17 image XObjects).
- Extraction: PDFKit renders at 4.2x (big01-17.png) and 6.5x (x06/x14/x15.png
  for the three months whose first-pass OCR dropped tokens), macOS Vision OCR
  (`tools/ocr`), then a column-aware parser (`captures/mv/parse2.js`) that
  walks each page's token stream in table order (isha, maghrib, asr, dhuhr,
  sunrise, fajr — the print is 12-hour) and requires every token to land in
  its column's minute window. Result: 365/365 rows (2015-01-01..2015-12-31),
  zero out-of-window tokens, zero missing rows. Pages 2-5 are Dhivehi prose
  and Hijri tables, no time grids; Vision reads Thaana as garbage (recorded
  limitation), which is why extraction went through the rendered Latin-digit
  grids.
- Normalised: data/mv-islamicaffairs-male-2015.json, 365 dated rows,
  24-hour HH:MM.
- Fit (Male 4.1755/73.5093, Indian/Maldives, Shafi): the calendar carries
  fixed ministry margins measured from signed residuals — sunrise −2,
  dhuhr +3, asr +1, maghrib +2, fajr and isha unshifted. Removing the
  margins and sweeping angles gives **fajr 18.90 / isha 19.05**,
  **365/365 days all six columns within 1 minute, rms 0.431 min**
  (fajr 313/365 exact, dhuhr 336/365, maghrib 330/365, isha 328/365, asr
  269/365, sunrise 207/365; worst deviation 1.0 everywhere). Output:
  data/mv-islamicaffairs-male-2015.fit.txt. Without margin removal the
  pure-angle sweep scores 0/365 joint — the margins are measured, not
  assumed.
- Tier: authority (state ministry print). Tier follows adoption: this is the
  ministry's own published computation, dated 2015 — a dated regime of its
  own, never blended with any other year.
- Live gate: not applicable (archived PDF, not a feed); the live ministry
  site is challenge-walled and recorded as blocked.

## Negative — current ministry timetable online

- Live islamicaffairs.gov.mv: Cloudflare challenge (captures/mv/mvi-home.html,
  "Attention Required"). Recorded, moved on.
- Wayback 2019 capture of the ministry's prayer page
  (`/%DE%82%DE%A6%DE%82%DE%B0-%DE%8A%DE%AE%DE%8C%DE%B0/` = "ނަމާދު ސައި",
  namaadhu = prayer): renders a downloads listing (name books, newborn
  rights leaflets), no timetable rows.
  captures/mv/namaadhu-page-2019.html.
- namaadhu.com ("Namaadhu MV"): "Coming Soon" placeholder.
  captures/mv/namaadhu-home.html.
- Dhivehi search terms attempted per discipline: "ނަމާދު" (namaadhu,
  prayer) — surfaced the ministry permalinks above via CDX only; search
  engines bot-walled this session (see horn-summary environment negatives).

## Verdict

Maldives BANKED: authority tier, 365 rows, PASS fit at 18.90/19.05 with
ministry margins (sunrise −2, dhuhr +3, asr +1, maghrib +2). Dhivehi terms on
record: namaadhu (prayer), fajr/dhuhr/'asr/maghrib/isha transliterate in the
print's own English column headings; Thaana body text is OCR-unreadable
(recorded). Current-year ministry surface: not found under these terms
(Cloudflare wall on the live domain; 2019 archive page carries no table).

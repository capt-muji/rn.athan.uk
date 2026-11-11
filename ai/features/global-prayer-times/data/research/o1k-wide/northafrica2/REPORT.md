# northafrica2 — O1k wide census wave report

Date: 2026-11-10. Scope: TUNISIA, ALGERIA, LIBYA, EGYPT (new cities), SUDAN, MAURITANIA.
All searches run in Arabic and French where applicable. Public pages only; no challenge
was solved; every capture's raw response is under `captures/`, normalized rows under `data/`.

## Headline findings

1. **Tunisia: the "today-only" surface note is REFUTED.** `meteo.tn`'s own JSON endpoint
   `https://www.meteo.tn/horaire_gouvernorat/{YYYY-MM-DD}/{gouvId}/{delegId}` is a DATED
   ARCHIVE: it serves any past date (probed back to 2020-06-15, all 200; 2019 null; future
   dates null). The page's own JS (`rest_ephemeride_priere` module) builds this URL, so it
   is the site's first-party data path, not a side door. Harvested FULL years 2024 (366
   rows) and 2025 (365 rows) for Tunis delegation 615, zero null days — Tunisia's year-2
   is met twice over, and the accrual class collapses to a date-addressable pull. Wayback
   holds no dated tables for this surface (only today-only page shells 2020-2026).
2. **Algeria: the ministry calendar PDFs EXIST in Wayback.** marw.gov.dz still unreachable
   from this network (curl 000), but the CDX enumeration shows archived whole-year ministry
   calendars: `media/calendrier/1447/{Alger,Adrar,Djelfa}.pdf` and `media/calendrier/1448/Alger.pdf`,
   plus a `salate_1.jpg` prayer poster. All four PDFs replayed and captured (3.2-3.6 MB each,
   genuine PDF 1.7). The 1448 Alger calendar (Hijri 1448 = 2026/2027, the ministry's own
   annual book, 16 pages) was read visually: daily Gregorian-dated rows, six prayers, Friday
   highlights, AND a per-wilaya minute-offset table (6 prayers x ~24 wilayas vs Algiers) on
   every month page — a nationwide correction register. Jumada al-Awwal 1448 (2026-10-12 ..
   2026-11-10, 30 rows incl. today) transcribed to `data/`. This is Algeria's first captured
   authority table (1447 AND 1448 classes); the 17.91/17.09 fallback recipe now has a real
   artifact to fit against, two Hijri years deep.
3. **Egypt: two new cities through the postback replay.** Alexandria and Aswan November
   2026, 30/30 rows each, city echo verified in-table. Recipe amendment: the postback REJECTS
   clean city text — the option value must be the page's exact string INCLUDING tatweel
   (`القـاهـرة`, `أســوان`); a clean `القاهرة` returns an ASP.NET Runtime Error page. The
   mideast report's `city = القاهرة` note no longer works. Cookie jar + Referer/Origin
   headers + body-from-file is the reliable shape.
4. **Libya: a second authority channel EXISTS but is challenge-gated.** `awqaf.gov.ly`
   (الهيئة العامة للأوقاف والشؤون الإسلامية) carries a live today-only prayer widget with 22
   listed cities on its home page. Direct curl: 403 Cloudflare; browser: interactive
   "Verify you are human" — closed unsolved per standing rules. Two proxied TinyFish fetches
   returned the widget intact (default city Tripoli 2026-11-10: fajr 05:45, sunrise 07:09,
   dhuhr 12:56, asr 16:08, maghrib 18:40, isha 20:00). Wayback holds no archived prayer
   endpoints for the host. The Benghazi ministry site (`awqaf.com.ly`) is live with NO
   prayer surface. Muazzin remains the fitted channel; this widget is a second, authority-
   tier, daily-fetch-class witness.
5. **Sudan: negative on post-Ramadan 2026.** The ministry's current Facebook presence is
   "وزارة الشؤون الدينية والأوقاف جمهورية السودان - المنصة الإعلامية الموحدة" (Kassala seat),
   public view carries ONE post (2025-04-23, Hajj video) — no post-Ramadan prayer table.
   The page's intro lists a ministry domain `ministryawqaf.org`: registered Feb 2025, dead
   now (NXDOMAIN; last archive capture 2026-03-08 reads "Your domain is expired"). A news
   outlet post (2026-02-20) confirms the ministry still publishes imsak/iftar tables for all
   wilayas in Ramadan 1447 — as images, same class as the census's 1446/1447 artifacts.
   Khartoum State gazette: no prayer-table hit in Arabic search. The census record stands.
6. **Mauritania: FIRST authority-tier dated table FOUND.** The ministry site
   `affairesislamiques.mr` (وزارة الشؤون الاسلامية والتعليم الأصلي) has an الإمساكية section
   with dated entries (1 March 2025, 10 March 2024 correction of a maghrib misprint, 1444).
   Downloaded the ministry's own PDF "إمساكية ولايات الوطن 2025-1446" (34 pages, bilingual
   AR/FR, 13 cities x 30 days x 7 columns, text-extractable). Nouakchott transcribed:
   `data/mr-ministry-nouakchott-1446-ramadan.json` (2025-03-01..03-30, imsak+fajr+sunrise+
   dhuhr+asr+magrib+isha). This converts Mauritania from "provisional, corpus-measured, no
   surface" to a real ministry artifact (Ramadan-class, like Sudan's). No 1447/2026 edition
   is published yet (listing tops at 2025-03-01).

## Surface table

| Country | Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- | --- |
| Tunisia | INM dated JSON endpoint | `meteo.tn/horaire_gouvernorat/{date}/{gouv}/{deleg}` | authority | 731 rows Tunis + 4 cities today | 2020-2026 (harvested 2024, 2025 full) |
| Tunisia | INM page (today widget) | `meteo.tn/fr/heures-prieres` | authority | 1 day x 264 delegations | today |
| Tunisia | Wayback page shells | `web.archive.org/web/20200805.../heures-prieres` | authority (archive) | today-only shells, no dated tables | 2020-2026 |
| Algeria | MARW annual calendars | `marw.gov.dz/media/calendrier/1447-1448/*.pdf` via Wayback | authority | whole-year books, 16 pp, wilaya offset table | 1447 + 1448 |
| Algeria | MARW prayer poster | `sites/default/files/2024-10/salate_1.jpg` via Wayback | authority | 1 day image | 2024-10 |
| Egypt | ESA postback | `esa.gov.eg/monthlymwaket.aspx` | authority | 30 rows x 2 new cities | 2026-11 |
| Libya | Awqaf Authority widget | `awqaf.gov.ly/` (proxied only) | authority | 1 day, 22 cities listed | today |
| Libya | Awqaf Ministry site | `awqaf.com.ly/` | authority | none | n/a |
| Sudan | Ministry FB (unified platform) | `m.facebook.com/Ministry.awqaf` | authority | none post-Ramadan | n/a |
| Sudan | ministryawqaf.org | expired, via Wayback | authority | none | dead |
| Mauritania | Ministry imsakia PDF | `affairesislamiques.mr/.../RAMADANE 2025 2_merged_compressed.pdf` | authority | 13 cities x 30 days (transcribed: Nouakchott) | 1446/2025 |

## What CONFIRMS the census

- Tunisia INM: today's page row (Tunis 05:23/12:10/14:53/17:16/18:43) reproduces the record's
  surface; the missing-sunrise property holds on the JSON too (five fields only, no shurūq).
- Egypt ESA: Cairo control postback reproduced the fitted table class before the two new cities.
- Sudan: census's "image-only, Ramadan-only" verdict re-confirmed for 1447.
- Libya: census's derived-channel caveat stands; Muazzin unchanged.

## What is NEW

- Tunisia: the dated-archive endpoint (year-2 solved: 2024 + 2025 full years, Tunis).
- Algeria: 1447 and 1448 ministry calendar books captured; 30 dated rows normalized; the
  wilaya offset table discovered on every month page.
- Egypt: Alexandria + Aswan (60 new dated rows).
- Libya: awqaf.gov.ly widget identified (22 cities, today-class).
- Mauritania: ministry imsakia PDF (1446), Nouakchott normalized (30 rows).

## What deserves a fit

- Algeria 1447/1448 Alger tables vs the 17.91/17.09 fallback (needs full transcription of
  the PDFs; visual parse proven).
- Mauritania Nouakchott 1446 vs the corpus-measured 19.37/17.46 (fajr 06:04 on Mar 1 vs
  recipe predicted — needs the sweep; the sheet also carries 12 more cities).
- Tunisia 2024/2025 rows vs the frozen 18/18 recipe (year-2 ruling input).
- Egypt Alexandria/Aswan vs 19.5/17.5 zero-margin at raw geometry (city-level check only;
  Cairo remains the fitted city).

## Honest negatives

- Tunisia Wayback dated tables: none exist (page was always today-only; shells 2020-2026).
- awqaf.gov.ly per-city reads: Cloudflare challenge on direct/browser paths; not solved.
  Only the default city (Tripoli) is reachable through the proxied fetch.
- Sudan post-Ramadan 2026 table: none published publicly; ministryawqaf.org expired
  mid-2026 ("Your domain is expired" in the archive); gazette search closed empty
  (searches: مواقيت الصلاة ولاية الخرطوم, الجريزة الرسمية الخرطوم, khartoum.gov.sd).
- Mauritania 1447 imsakia: not yet published (site listing tops at 2025-03-01).
- Algeria live PDF bytes: still unreachable from this network; Wayback replay is the working
  path, and 1447 Adrar/Djelfa pages remain untranscribed (visual parse proven on Alger 1448).
- Internet Archive CDX flapped (503 "Temporarily Offline") on several prefix queries;
  successful enumerations recorded in `captures/*-cdx-*.txt`.

## Deliverables index

- `captures/` — 33 files (HTML/JSON/PDF/JPG/NDJSON/CDX), one per surface, named `cc-*`.
- `data/` — 8 normalized JSONs:
  `eg-esa-{alexandria,aswan}-2026-11.json` (30 rows each),
  `tn-inm-tunis-{2024,2025}.json` (366/365 rows),
  `tn-inm-today-2026-11-10.json` (4 cities),
  `tn-gouvernorats-delegations.json` (24 gouv / 264 deleg ids),
  `dz-marw-alger-1448-jumada1.json` (30 rows),
  `mr-ministry-nouakchott-1446-ramadan.json` (30 rows).
- Recipes kept as scripts in the workspace root: `tn-harvest.js` (dated-archive pull),
  `tn-delegs.js` (delegation tree), `eg-post.js` + `eg-parse.js` (postback + parser).

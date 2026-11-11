# O1k wide-research, tag `sea2`

Scope: Myanmar, Cambodia, Laos, Vietnam, Brunei 2027, Malaysia east coast, Indonesia outer
islands, Philippines round 2. Baseline read from `world-table-v2.md`; banked context from the
`thmsg`, `malaysia`-class, `indonesia` and `philippines` passes built on, not redone.
Workspace holds `captures/`, `data/`, this report, and the two scripts that produced the data.

## Surface table

| # | Country | Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|---|---|
| 1 | Indonesia | Muhammadiyah KHGT API — Banda Aceh | api-khgt.muhammadiyah.or.id `POST /api/sholat/schedule` `{lat,lng,date:"YYYY-MM-DD",mode:"monthly_masehi"}` | authority (second national body) | imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya; 365 rows per year | **2026 + 2027, captured whole** (`data/khgt-{2026,2027}-banda-aceh.json`) |
| 2 | Indonesia | Muhammadiyah KHGT API — Puncak Jaya coordinate | same endpoint, KAB. PUNCAK JAYA coordinate −3.9833, 137.25 | authority | same columns; KHGT auto-detects elevation **3396 m** | **2026 + 2027** (`data/khgt-{2026,2027}-puncak-jaya.json`) |
| 3 | Indonesia | Muhammadiyah KHGT — Jayapura | NOT re-captured: the `indonesia` tag already holds 2026+2027 whole (`indonesia/data/khgt-{2026,2027}-jayapura.json`) | authority | full years | 2026, 2027 |
| 4 | Malaysia | Jabatan Mufti Negeri Kelantan, Bahagian Falak | mufti.kelantan.gov.my (Falak functions page) | authority | none online; the Unit Takwim & Arah Kiblat states it prepares "data waktu solat bagi zon 1 dan zon 2 Negeri Kelantan" | none |
| 5 | Malaysia | Jabatan Mufti Negeri Kelantan, Facebook | facebook.com/MUFTIKELANTAN monthly posts | authority by publisher | monthly Hijri-month tables for Kelantan zon 1 + zon 2, poster images | 1441H/2020M series confirmed; Ramadan 1447 (Mar 2026) table referenced in page snippets |
| 6 | Malaysia | JAKIM e-Solat API (re-measured) | e-solat.gov.my `r=esolatApi/takwimsolat&period=month&zone=KTN01` | authority | current month only; `bulan`/`tahun`/`date`/`duration` ignored or 500 | current month (`captures/msia-esolat-ktn01-2026-03.json`) |
| 7 | Malaysia | Terengganu state portals | ekhutbah.terengganu.gov.my/solat, mbkt/jkrmekanikal/mdb.terengganu.gov.my | official, JAKIM-derived | embed the e-Solat module with JAKIM zone banners | rolling |
| 8 | Malaysia | PADK Kuala Terengganu (JHEAT district office) | facebook.com/padktrg.terengganu.gov.my post 1434432242057004 | authority by publisher | "TAKWIM HIJRI DAN WAKTU SOLAT 1448H TERENGGANU" poster album, download link not reachable from the post | 1448H |
| 9 | Brunei | MORA SharePoint OData list `Waktu Sembahyang` | mora.gov.bn `_api/web/lists/getbytitle('Waktu Sembahyang')/items` | authority | ceiling probe: latest row 2026-12-31 (Brunei); **no 2027 rows, no new dataset id, no second prayer list** (list catalog, 100 lists, checked) | 2026 ends at 12-31 |
| 10 | Brunei | Astronomical Society of Brunei Darussalam | bruneiastronomy.org/prayer/ | community | a stated method: "Brunei Darussalam calculation setting retained at Subuh 20° / Isyak 18°", referencing Odeh, Calculations of Prayer Times, 2024 rev. 17 Dec 2024; Doha = Subuh-Sunrise interval thirds | current, live today |
| 11 | Myanmar | Myanmar Islamic Program (mmislamic.znnt.org) | mmislamic.znnt.org/adhan/ | community calculator | NOT a publisher: user picks location + one of the standard AlAdhan methods (Burmese-labelled menu) + Hanafi/Shafi toggle | rolling, user-driven |
| 12 | Myanmar | Community namaz tables (images) | facebook aung.khine.3344 weekly Yangon posts; Instagram/TikTok hjkosithuaung (Haji Ko Si Thu Aung) daily Yangon tables and a "lifetime timetable"; a Lashio-area lifetime table in a Facebook group | community, print-booklet culture photographed and reposted | image-only, one day to one week per artefact, "ref - fb s/o" reposts | 2022-2026 scattered |
| 13 | Philippines | Ulama Council of Zamboanga Peninsula (UCZP) | via facebook.com/hermosotv post 122311385546030276 | authority by publisher | Ramadan 1447 official schedule | Ramadan-only |
| 14 | Philippines | Darul Ifta ZAMBASULTA + Palawan | facebook.com/attyalman; zambocitygovt reposts | authority by publisher | Ramadan start declarations + Ramadan Maghrib/Fajr timings | Ramadan-only |
| 15 | Philippines | Supreme Council for Islamic Preaching and Guidance, Bongao, Tawi-Tawi | instagram akosifhaye post DUsHF5gll9V (12 Feb 2026) | authority by publisher | "PRAYER TIME TABLE" image, Ramadan schedule | Ramadan-only, login-walled |
| 16 | Cambodia | Highest Council for Islamic Religious Affairs Cambodia (the mufti's office) | facebook.com/mufticambodia | authority | page root login-walled; indexed snippets carry announcements only, no timetable | none |
| 17 | Vietnam / Cambodia / Laos | mosque layer | mawaqit (Al-Serkal live today-row re-confirmed) | platform | today-row only | rolling |

## What CONFIRMS the census record

- **Myanmar stays a genuine empty at authority tier.** Burmese-language pass across the exact
  phrases requested (အချိန်ဇယား ဘာသာရေး family), Yangon and Mandalay mosque names, and the
  Islamic Religious Affairs Council: every surface is an aggregator, a calculator, or a
  photographed print booklet. Nothing changed from the record.
- **Cambodia, Laos, Vietnam remain mawaqit-only.** The Cambodian mufti's office has a Facebook
  page but no reachable timetable; HCMC's Chăm mosques (Jamiul Anwar, Saigon Central Mosque)
  have no websites at all; Vietnamese "giờ cầu nguyện" searches return Catholic material.
- **The Philippines outside Davao/BARMM stays Ramadan-only.** UCZP, Darul Ifta ZAMBASULTA and
  the Tawi-Tawi council all issue Ramadan schedules only; Marawi's Grand Mosque, the Manila
  Golden Mosque and Cebu's mosques publish nothing dated.
- **Brunei's OData list still ends 2026-12-31.** Measured live today (max-date row, Jan-2027
  probe, full list catalog).

## What is NEW

**1. Indonesia's KHGT line now spans the whole archipelago for TWO years.** Banda Aceh
(northwest end, 730 rows) captured; Jayapura (southeast end) already on file from the
`indonesia` tag, so the KHGT line is now evidenced at both ends of the country across
2026-2027. Both ends behave identically: imsak = subuh − 10 min every day, isha an angle
(68..76 min after maghrib in Banda Aceh), implied pair 18/18 with ~+1.5 min safety.

**2. The 21/19 highland rule has NO second publisher — measured, not assumed.** KHGT serves the
Puncak Jaya coordinate with its own auto-detected elevation (3396 m, HIGHER than Kemenag's
2422 m trigger) and still prints the plain 18/18 pair: implied fajr depression median 17.65 deg
and isha 18.36 deg at Puncak Jaya, against 17.62/18.35 at lowland Jayapura — identical to two
decimals across a 3,280 m elevation gap, on both 2026 and 2027. Muhammadiyah ignores elevation.
The deepened 21/19 pair is Kemenag's alone; any feeder must take it from Kemenag's table and
must never derive it from elevation or from Muhammadiyah.

**3. Kelantan HAS an own-table publisher, and its zones are JAKIM's zones.** The Jabatan Mufti
Negeri Kelantan publishes monthly prayer tables for Kelantan zon 1 + zon 2 on its Facebook page
(authority by publisher), and its Falak section's own charter says it maintains imsak/prayer
data for those two zones. The zon split is exactly JAKIM's KTN01/KTN02 (Jeli, Gua Musang
Galas/Bertam, Lojing = zon 2, matching JAKIM's own Ramadan imsak PDF wording). One compared
sample (18 Mar 2026, via a third-party mirror) shows +1 min on subuh and syuruk versus the
mirror's KTN01 — too thin to call a different recipe, and e-Solat's month API cannot be pulled
retroactively (re-measured: only the current month is served). Open question, flagged not
resolved.

**4. Terengganu has no independent table.** Every state portal embeds e-Solat; the district
religious office distributes a 1448H takwim poster album. State publisher, JAKIM numbers.

**5. Myanmar's community layer is now on the record.** A Burmese prayer calculator exists
(mmislamic.znnt.org, method-selectable, AlAdhan-class) and a print-booklet ecosystem (weekly
Yangon Facebook tables, "lifetime timetables" for Yangon and Lashio townships) survives in
photographs. These are community tier and are NOT data; they are the proof that the demand is
met offline and that no online publisher exists.

**6. Brunei's method statement is re-verified live and upgraded in detail.** The Astronomical
Society page now cites Odeh 2024 (revised 17 December 2024) and states the retention of
Subuh 20° / Isyak 18° explicitly — the same parameters the census fits confirmed from MORA's
tables (BN-2025/BN-2026). Still community tier; MORA still publishes tables, not a method.

## What deserves a fit

- `data/khgt-2026-banda-aceh.json` and `khgt-2027-banda-aceh.json`: two full KHGT years at the
  northwest anchor, ready for the same fit the five banked cities got. A two-year fit would
  test KHGT year-over-year stability at the latitude extreme (5.56 N) the banked five never
  touched.
- The Puncak Jaya pair (KHGT vs Kemenag's two anchor dates) is now a clean A/B for the
  highland exception: same coordinate, two publishers, one deepens and one does not.
- Kelantan: if the mufti's monthly poster images are ever harvested, a number-by-number
  comparison against JAKIM KTN01/KTN02 settles the +1-minute question in one month.

## Honest negatives

- **Myanmar** (Burmese + English): the council has no web surface with tables; mosques have no
  websites; the Burmese Islamic portal islammyanmar.com is Quran-translation only. Closed:
  every named surface checked, image-table culture recorded as community leads.
- **Cambodia** (Khmer + English + Malay): mufti council page login-walled (`login_required`
  recorded), search-index snippets announcement-only. Closed: no own table exists online.
- **Laos** (English + Lao): aggregators only; embassy video is a projection announcement, not
  a table. Closed.
- **Vietnam** (Vietnamese + Malay + English): HCMC's ten mosques and 19 suraus (VOV's figure)
  publish nothing; no mawaqit tenant; the Chăm community's only dated artefacts are news
  photos. Closed.
- **Philippines round 2** (English, with Malay where it surfaced): Region IX, Marawi, Cebu,
  Manila all checked; the "King Faisal Mosque" MasjidApp hit was Sydney, not Marawi (dead end
  recorded); Tawi-Tawi's council timetable is Ramadan-only and login-walled. Closed.
- **Brunei 2027**: see verdict below.
- Facebook page ROOTS repeatedly login-wall; individual post URLs render. Posters (Kelantan
  monthly tables, Terengganu takwim, Tawi-Tawi timetable) are therefore recorded but not
  transcribed — the images are not reachable without the per-post links, which search did not
  surface.

## Files

- `captures/` — Brunei OData probes (4), Brunei pages (2), e-Solat capture, KHGT raw (4 × 365
  rows), `fetch_khgt.py` (the exact request shape, including the `YYYY-MM` trap), and three
  CAPTURE-NOTES files carrying every URL and dead end above.
- `data/` — `khgt-{2026,2027}-banda-aceh.json`, `khgt-{2026,2027}-puncak-jaya.json`
  (normalized, 1,460 rows total). `normalize_id.py` and `analyze_puncak.py` reproduce both.
- Jayapura 2026/2027 NOT duplicated — the `indonesia` tag's files are the source of record.

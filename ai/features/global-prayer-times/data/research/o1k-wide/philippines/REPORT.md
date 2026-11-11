# O1k wide research: Philippines, with Cambodia, Laos and Vietnam as a fringe sweep

Tag: `philippines`. Census baseline read from `world-table-v2.md`: Philippines is authority-tier but **Ramadan-only** (NCMF Ramadhan 1447 per-city JPEG set, plus the Bangsamoro Darul Ifta Cotabato table), no published parameters, lift named as "a year-round official surface". Cambodia, Laos and Vietnam are community-tier mawaqit captures.

**Headline: the lift is met twice over.** Two separate official bodies publish a monthly, year-round dated timetable, and one of them has been doing so continuously across Hijri years 1446, 1447 and 1448.

## Surface table

| Source | URL | Tier | Dated data held | Years |
|---|---|---|---|---|
| Darul Ifta Wadda'wah Association Region XI (Ecoland Islamic Center, Davao City) | facebook.com/MasjidJamjoom and facebook.com/davaocity.islamiccenter | **authority by publisher** (regional mufti body: every poster is signed "Mufti, Darul Ifta' Wadda'wah Association Region XI") | Per-Hijri-month timetable for Davao City, all six columns, every day, with per-province minute adjustments | 1446 (2025), 1447 (2025-26), 1448 (2026), monthly and unbroken |
| Bangsamoro Darul-Ifta' (BARMM, Office of the Chief Minister) | facebook.com/bdibarmm2020 | **authority** (BARMM religious council) | Four province posters per Hijri month, daily six-column times plus a per-municipality minute table | 1448 (2026) confirmed; Safar and Jumada al-Akhirah 1448 advertised |
| NCMF Public Information | facebook.com/NCMFPublicInformation | authority | Ramadhan 1444/1445/1446/1447 per-city calendars | 2023-2026 |
| NCMF National Capital Region | ncmf.ph | authority | none. Services, procurement and announcements; no prayer page at all | none |
| DOST-PAGASA | pagasa.dost.gov.ph, oras.pagasa.dost.gov.ph | authority | **none.** `oras` is the Philippine Standard Time clock; PAGASA publishes no prayer times. Davao posters cite it as the time standard only | none |
| Masjid Al Noor Hanoi | masjidalnoorhanoi.com | community (mosque) | nothing of its own: the "Prayer Time" block is a `prayers.org` iframe | none |
| Al-Serkal Mosque Phnom Penh, Jamia Masjid Vientiane, Masjid Al-Noor Hanoi | mawaqit.net | platform | today-row only | current |

## What CONFIRMS the census

- NCMF's Ramadhan 1447 city set is live and re-published per city group. One carry reads "FOR MARAWI, ILIGAN, CDO AND METRO MANILA ONLY / RAMADHAN 1447H / 2026G CALENDAR" and credits the NCMF-NCR regional office. The census's 29-image set stands.
- The Bangsamoro Darul Ifta Cotabato table is re-issued each Ramadan by the Office of the Wali: "RAMADHAN 1447H | OFFICIAL PRAYER TIME TABLE ... for Cotabato City, Mindanao and SGA".
- Cambodia, Laos and Vietnam remain mawaqit-only at community tier. No own table surfaced in any of the three.

## What is NEW

**1. Davao City: year-round official series, 90 rows.** `data/davao-city_darul-ifti-region-xi.json`

Three consecutive months transcribed: 2025-09-22 to 2025-10-21 (Rabee'ul Awwal 1447) and 2026-10-11 to 2026-12-09 (Jumadal Awwal and Jumada Thani 1448). This is the country's first non-Ramadan official dated data, and it spans two calendar years.

**2. Cotabato City and Marawi City: year-round official BARMM series, 58 rows.** `data/cotabato-city_bdi-muharram1448.json`, `data/marawi-city_bdi-muharram1448.json`

Muharram 1448, 2026-06-16 to 2026-07-14, both bases. Each poster carries a per-municipality minute-adjustment table, so one poster serves a whole province: the Cotabato base covers Maguindanao del Sur, Maguindanao del Norte and SGA, the Marawi base covers all of Lanao del Sur (Bacolod-Kalawi through Wao). The Basilan and Tawi-Tawi posters are captured but not transcribed.

Together these give the record its first year-round surfaces on Mindanao, and they are direct second witnesses against each other.

Transcription was checked where the crops overlap: the last three Davao days were read twice, once from the 526 px poster and once from a zoomed crop of the same poster, and agree.

## What deserves a fit

The transcripts expose a recipe shape worth testing, not a published parameter set.

- **Isha is a fixed interval after Maghrib, not an angle.** BARMM: 73 to 75 minutes across all 29 Muharram days. Davao: 64 to 69 minutes across all 90 days. One isha angle cannot produce two different near-constant intervals in the same season; a fixed offset can.
- **Asr is near-constant** in both series (BARMM 3:11 to 3:15 PM, Davao 2:43 to 2:51 PM), consistent with a standard Shafi shadow factor at these latitudes.
- **Fajr** moves 4:09 to 4:17 (Marawi), 4:11 to 4:18 (Cotabato), 4:14 to 4:23 (Davao) over the same period. A real latitude effect, and enough to separate the three cities.
- Neither publisher prints an angle, a method name or coordinates. Treat the intervals as observed behaviour, never as their stated rule.

The cross-city comparison is the strongest asset. Cotabato and Marawi differ by one to two minutes on the same day from the same issuing body, which makes a usable locality-differentiation test for any candidate recipe.

## Honest negatives

**Philippines.** Searched English and Filipino/Tagalog: "NCMF prayer time schedule", "NCMF prayer schedule", "site:ncmf.ph prayer", "prayer time schedule regional office", "oras ng pagdarasal Muslim", "oras ng salah masjid", plus city terms for Manila, Cebu, Zamboanga, Marawi, Cotabato and Davao.

- **NCMF regional offices publish no year-round timetable.** The national and NCR web presences carry no prayer page; `ncmf.ph` is services, procurement and announcements. Every NCMF prayer artefact found is a Ramadhan calendar.
- **Manila (Golden Mosque, Masjid Al-Dahab):** no own dated table anywhere. Everything is aggregator output (IslamicFinder, Muslim Pro, prayertimes.date) or a third-party mosque listing.
- **Cebu City:** nothing. No mosque page, no council page.
- **Zamboanga City:** the Ulama Council of Zamboanga issues a Ramadan-only schedule (1447: Suhoor 4:54 AM, Iftar 6:03 PM for Zamboanga del Sur). No year-round surface.
- **Marawi:** the city's own pages post Ramadan material. The year-round data above comes from the BARMM province poster, not from a Marawi mosque page.
- `oras.pagasa.dost.gov.ph` is a clock. PAGASA is not a prayer-time publisher and should not be recorded as one.
- Facebook was the only route to the Davao and BARMM posters. The BARMM page root demands login (`login_required`); individual post URLs render and were captured. The advertised Google Drive downloads were not reachable without a post-by-post link, so no high-resolution PDF was obtained. All transcriptions come from 382x590 and 526x804 poster JPEGs, legible for the digits but not for the smallest footnote type.

**Cambodia.** Searched English and Khmer ("Phnom Penh mosque prayer time table", "Cambodia Muslim prayer timetable official", "ពេលវេលាអធិស្ឋាន ម៉ាស់ស៊ីត ភ្នំពេញ"). No own table. Al-Serkal Mosque has a mawaqit page only. **Negative.**

**Laos.** Searched English and Lao ("Vientiane mosque prayer times", "ເວລາ ມັສຍິດ ວຽງຈັນ"). The Lao-language query returns airline and tourism pages, not religious ones. Jamia Masjid Vientiane is mawaqit-only. **Negative.**

**Vietnam.** Searched English and Vietnamese ("Hanoi mosque prayer time table", "giờ cầu nguyện thánh đường Hà Nội"). Vietnamese results are entirely Catholic parish material, which is the dominant use of the phrase in that language. Masjid Al Noor Hanoi has a real own website, but its prayer block is a `prayers.org` iframe, a platform page wearing the mosque's domain. **Negative for own tables.** The site is a lead if the platform tier is ever admitted.

## Files

- `captures/` has 33 images: the seven original posters plus the zoom crops that carry the transcription, since the source posters are 382 to 590 px wide. `CAPTURE-NOTES.md` holds URLs, publisher and poster text; two raw HTML captures record the dead ends.
- `data/` has three normalized files, 148 dated rows in total, with the transcription scripts that produced them.

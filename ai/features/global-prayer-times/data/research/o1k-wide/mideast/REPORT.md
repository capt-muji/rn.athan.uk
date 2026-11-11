# O1k mideast — backup captures and gap hunts, 2026-11-10

Tag `mideast`. Workspace `census/o1k-wide/mideast/`. All captures raw in `captures/`,
normalized rows in `data/`. Recipe checks below ran on the adhan 4 library with the
census recipe as recorded in `world-table-v2.md`; the harness is this session's quick
one (UTC math plus the printed-clock quirks), not the census's own fit harness.

## Surface table

| Country | Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- | --- |
| Oman | MARA calendar | `mara.gov.om/calendar_page2.asp` POST year/month/CityID | authority | Muscat (CityID=0) 365 days | **2027** full |
| Egypt | ESA monthly table | `esa.gov.eg/monthlymwaket.aspx` postback | authority | Cairo 30 days | 2026-11 |
| Morocco | **MINISTRY REBUILT PORTAL (NEW)** | `habous.gov.ma/` + `data/horaires-2026-MM.js` | authority | 190 cities x 2 months | 2026-10, 2026-11 |
| Morocco | prayertimes.ma | `prayertimes.ma/fr` | community (claims Habous source) | 189 cities, daily/monthly | current |
| Morocco | FM6 Oulema foundation | `fm6oa.org/prieres/code/` | official-adjacent | today only, region widget | today |
| Algeria | MARW ministry | `marw.gov.dz` menu page + `media/calendrier/1448/{Alger,Djelfa,Adrar}.pdf` | authority | whole-year Hijri 1448 PDFs LOCATED, bytes unreachable | 1448 |
| Jordan | Awqaf grid | `awqaf.gov.jo/ar/Pages/PrayerTime` (`MainContent_gvWebparts`) | authority | 10 days, server-bound today+9 | 2026-11-10..19 |
| Qatar | MOI portal | `portal.moi.gov.qa/.../prayertimings/today/en` | authority | 1 day | 2026-11-10 |
| Iraq | Diwan app API | `eldwanapp.jeeteak.com/api/prayer-times?date=` | authority | 31 days | 2026-10 |
| Iran | Calendar Centre | `calendar.ut.ac.ir` all paths | authority | none — JS cookie challenge | n/a |
| Kuwait | Al-Ojeiri calendar | `alojeiri.com/en/ojeiri-calendar?date=` | authority-tier by usage | 10 days month-to-date | 2026-11-01..10 |
| Turkey | Diyanet ilce tables | `namazvakitleri.diyanet.gov.tr/tr-TR/{9541,9206}` | authority | 365 days each | 2026 (2027 NOT served yet) |

## Per country

### Oman — CONFIRMED (year 5)
12 POSTs, CityID=0 (Muscat), 2027-01..12: 365/365 rows, `data/om-mara-muscat-2027.json`.
Recipe check (18/18, ceil, +5 on dhuhr/asr/maghrib): 2178/2190 cells within 1 min
(57.9 pc exact, worst 2 min) on this harness — same signature as the fitted years.
The endpoint still serves the declared 2021-2031 span.
TRAP ADDENDUM: CityID indexes are positional per page language; CityID=2 is Adam,
NOT Muscat (a Muscat-labelled fetch with CityID=2 silently returns Adam's table).
The runbook's example `CityID=2` produced that wrong table; CityID=0 is Muscat on
the Arabic page. Earlier artifacts that used CityID=2 labelled Muscat should be re-checked.

### Egypt — CONFIRMED
The replay recipe works as recorded, minus the `:80` suffix: plain
`https://www.esa.gov.eg/monthlymwaket.aspx` + browser UA + full VIEWSTATE /
VIEWSTATEGENERATOR / EVENTVALIDATION postback (EVENTTARGET =
`ctl00$placeholder1$DropDownList2`, city = option text `القاهرة`, month value `11`)
returns the GridView1 table. An `https://...:80/...` URL form fails TLS (port 80 does
not speak TLS); the `:80` note in the census recipe should read as http-scheme legacy.
Cairo November 2026: 30/30 rows. Recipe check (19.5/17.5, zero margins, nearest):
180/180 within 1 min, 148/180 exact.

### Morocco — NEW SURFACE (the conditional-A resolver)
The rebuilt ministry portal is LIVE and carries the prayer tables itself:
`https://www.habous.gov.ma/` (title: وزارة الأوقاف والشؤون الإسلامية — مواقيت الصلاة)
serves static month files `data/horaires-YYYY-MM.js` (one `HORAIRES_MOIS` JSON push per
month: `fuseau:"GMT"`, 6 columns, all cities), loaded by `assets/js/prieres.js`, no API.
Window today: 2026-10 and 2026-11 published (2026-09, 2026-12, 2027 probes all 404).
Captured both files raw; parsed Rabat (c=1), Casablanca (c=58), Laayoune (c=156):
62 rows per city in `data/`. Recipe check on Rabat November (19/17, margins
-1/-3/+5/+1/+4/0, fajr floor, clock UTC+0 as declared): 123/180 exact, 100 pc within
1 min, worst 1 min. The digits reproduce the census recipe on the ministry's OWN new
surface — direct evidence for the owner's #6983 ruling that the margin delta was a
surface artifact, not a table change. Community witnesses: prayertimes.ma ("189 villes,
reprises des publications du Ministère", © PrayerTimes.ma) captured; fm6oa.org (Mohammed VI
Foundation of African Oulémas, official-adjacent) today-only widget captured.
The portal chrome notes the main portal is still "under maintenance" — the prayer page
is what the ministry chose to keep live.

### Algeria — PARTIAL (host alive, PDF bytes unreachable)
`marw.gov.dz` is LIVE again via proxy paths (TinyFish); unreachable from this machine's
network (curl 000 on root, www, http). The menu page `مقالات-ودراسات/مواقيت-الصلاة`
("يومية رسمية مع جدول زمني لمواقيت الصلاة") links three whole-year calendars,
Hijri 1448: `media/calendrier/1448/Alger.pdf`, `Djelfa.pdf`, `Adrar.pdf`. The PDF bytes
could not be pulled through any available path: curl 000 (host), TinyFish fetch (empty
text on PDFs), docs-mcp fetch_url (error), r.jina.ai reader (422 timeout), Wayback (no
snapshots of `media/calendrier/`). Recording: surface CONFIRMED live, whole-year keyed
calendars exist at stable URLs, capture BLOCKED at the PDF for this network. A retry
from an in-country path (or any network that answers the host) lifts the country.

### Jordan — CONFIRMED (fresh window)
`MainContent_gvWebparts` inside the PrayerTime page carries the 10-day grid; the panel
above it prints `التاريخ: 11-10-2026` (the server's today). Captured 2026-11-10..19
(10 rows, all six times, no image-borne cells this run). Recipe check (18/18, sunrise -6,
dhuhr +1, asr +1, maghrib +7, fajr floor, isha ceil, Amman): 60/60 within 1 min, 31/60
exact, worst -1. The revised maghrib +7 cliff holds on fresh days. December Fajr-16
switch remains unreachable (grid stops at today+9).

### Qatar — CONFIRMED (one day)
Today fragment captured: 10/11/2026, Fajer 4:29, Sunrise 5:48, Dhuhr 11:17, Asr 2:27,
Maghrib 4:49, Isha 6:19 (H:MM unpadded). Parsing quirk confirmed: the six labels share
one header row and one value row, so a naive per-label regex collapses to the first
value. Accumulation stays daily-class.

### Iraq — CONFIRMED (freshness check passed)
October 2026: 31/31 rows from `eldwanapp.jeeteak.com/api/prayer-times?date=`. The four
dates that failed in the last sweep (10-03..10-06) now serve clean rows — the store
self-healed. Recipe check (amended 18.1+1/16.9+1, dhuhr +5, asr +3, maghrib +3, Baghdad):
161/186 within 1 min, worst -2 on this harness. Still 2026-only: year-2 accrues when
the Diwan rolls.

### Iran — NEGATIVE (challenge on the door)
Every `calendar.ut.ac.ir` path (root, `/Fa/Year/Index`, `/Fa/Year/Index?year=1406`,
`/Fa/Calendar/Index`) returns the same ~6.1 KB interstitial that sets `__arcsjs` /
`__arcsjsc` cookies via obfuscated JS and reloads — an anti-bot challenge. Per standing
rules it was NOT solved; recorded and moved on. Wayback has no snapshot of the 1406
annual page (availability API empty; last root snapshot 2026-07-12). The 1406 "in
preparation" status therefore remains UNCHANGED and unverifiable from outside Iran.
Searched EN/FA paths only through the live site and the archive; nothing else counts as
the official calendar under the owner's no-forums rule.

### Kuwait — CONFIRMED (Al-Ojeiri live, matches the ministry paper)
`alojeiri.com/en/ojeiri-calendar?date=YYYY-MM-DD` serves the requested day inside the
page (an `item-prayer` block, 12-hour with AM/PM) alongside today's block. Captured
November 1-10, 2026 (month-to-date, 10 rows). Cross-check: Nov 10 equals al-Anba's
ministry row exactly (04:46/06:07/11:32/14:35/16:56). Recipe check (18/17.5, floor
fajr+sunrise, nearest evening): 60/60 within 1 min, 42/60 exact.

### Turkey — CONFIRMED (2027 not yet served)
Istanbul (ilce 9541) and Ankara (9206) re-captured: 365 rows each, 2026-01-01..12-31,
`#yourTable` intact. The public page still serves 2026 only (no year selector; last row
31 Aralık 2026) — 2027 via the public ilce surface remains unavailable, consistent with
the runbook's late-roll note; the API holds the 2027 door as an owner-held resource.
Recipe check on Istanbul at city-center coords: 2104/2190 within 1 min, worst -2 (the
residual is the city-center vs district anchor difference, not a table change).

## What is NEW for the record
1. Morocco's ministry prayer surface, post-rebuild, with its data-file mechanism
   (`data/horaires-YYYY-MM.js`, two-month rolling window, `fuseau:GMT`) — this is the
   conditional-A resolver the census asked for.
2. Oman 2027 full year (fifth distinct year on the same engine).
3. The Oman CityID trap: positional ids differ per page language; CityID=2 is Adam.
4. Egypt recipe simplification: `:80` not needed over https; the plain https URL + UA +
   stateful postback is the whole recipe.
5. Algeria's whole-year 1448 calendar PDFs at stable URLs (Alger/Djelfa/Adrar), live
   but unreachable from this network path.
6. Kuwait's Al-Ojeiri web calendar is date-addressable (`?date=`), one day per fetch.

## Honest negatives
- Iran 1406: closed as challenge-blocked (not solved per rules); no archive copy exists.
- Algeria PDF bytes: closed for this network; live-capture needs an answering path.
- Morocco months outside the rolling window: 2026-09/12, 2027-01/02 probes 404 — the
  window is what the ministry publishes; a monthly fetch job would bank it going forward.
- Turkey 2027 on the public ilce page: not served as of 2026-11-10; re-probe after the
  new-year roll.
- Jordan December: structurally unreachable on the grid (today+9 bound) — the Fajr-16
  December question stays open.

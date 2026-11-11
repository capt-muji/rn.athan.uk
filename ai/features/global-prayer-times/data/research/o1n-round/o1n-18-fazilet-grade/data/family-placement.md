# Fazilet family: index placement decision

Wave o1n-18, round o1n, 2026-11-11. Settles what o1n-13 left open: one family entry
with per-country counts, or one entry per country layer.

## Decision

**One family entry: `FAZILET-248-CITIES`, grade A, carrying the per-country counts as
fields.** Not one entry per country.

## The rule applied

One entry per fitted surface or surface family, exactly as the index has counted since
round two (FIT-INDEX-ROUND3B, method line 11); per-country entries are cut only where a
country's layer carries its own separately graded evidence base, and whole-platform
walks count once (TAWKIT-COUNTRY-73: 8,709 city pages, 75 countries, one entry).

## The reason, in three lines

1. Fazilet is one surface: one API (`/api/cms/daily` with `date=`), one publisher
   (Fazilet Nesriyat), one engine (adhan-reproducible recipe family), one recomputed
   2020-2030 horizon — the 211 layers are coverage of one door, not 211 publishers.
2. The tawkit precedent walks the same shape: a whole-platform layer across 75 countries
   counted as one entry whose per-country recipe spread lives inside the entry; the
   ZZ-pool precedent counts cross-country matrices once (ZZ-MAGHREB-CROSSCHECK,
   MASJIDAL-216-POOL).
3. The recipe spread across layers (fajr 16.5-20 / isha 15.25-18.5 at the 0.25 quantum,
   Shafi, per-column margin sets) is one convention family varying in margins, the same
   shape that kept tawkit one entry; no layer runs a different engine or regime.

## Does the data argue against the precedent?

No. The departures the record names are characterisations inside the family, not
separate surfaces: the Mongolian layer's seasonal fajr pad (identical at both cities
measured), Colombo's +2 minute dhuhr pad revision dated 2027, the Guinean 2026 fajr
column gap (2027 serves it), and the high-latitude summer night-column class of the
diaspora layers. None changes the engine. The per-country table is coverage, and the
coverage differences (which countries are walked vs not) are carried as counts, not as
separate entries.

## How the earlier entries fold in

- `FAZILET-28-CITIES` (O1n-9's grade-A proposal) is superseded: its 28 cities are
  re-fitted inside this bank and its counts are absorbed by the family table.
- `FAZILET-AFRICA-33-CITIES` (O1n-14, grade A) stays as a named sub-evidence base: its
  34 front cities (2 of them one-year) are folded into the family counts with their own
  attribution, as the tawkit precedent keeps separately graded country entries beside
  the whole-walk entry.

## Proposed index fields (schema of ROUND3B)

- id: `FAZILET-248-CITIES`
- country: ZZ; country_name: "211 layers (Fazilet)"
- surface: faziletcalendar.com `/api/cms/daily?date=` walked: full selector enumeration
  (6,506 city ids, 211 layers), tier-A anchor walk (Jan+Jul x 2026+2027 per city),
  plus O1n-9's 28-city and O1n-14's Africa banks
- tier: authority publisher; span verdict: the served horizon reaches 2030 by parameter
  (`date=`), recompute proven 2026->2027 at fleet scale, horizon years not fit-verified;
  walked depth Jan+Jul
- recipe: the family band with margins; scores: per-country counts and per-city
  within-1; grade: A on the two-year fitted set, provisional only for the one-year
  cities (named).

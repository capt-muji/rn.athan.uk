# fit14 — the LUPT family across England's captured towns

Question: fit4 found that English town tables are INTERVAL TABLES in the LUPT
construction (fajr = sunrise − F[MM-DD], isha = maghrib + I[MM-DD]) with
editorial offsets, not angle tables. This pass maps the whole family: for
every English town with ≥25 dated rows, how do its own F and I arrays compare
against LUPT's, and is "LUPT + per-town offset" a real encoding?

## Method

- LUPT reference: `o1g-decade/fit/recipe.json` carries the recovered F and I
  tables (366 MM-DD entries each). Validated against all seven captured LUPT
  months (`uktowns2/data/lupt-2027-*.json`, `ukscotland/data/lupt-monthly-2027-01.json`):
  every day reproduces the recipe tables at exactly 0 minutes on both arrays.
- Per capture: F = sunrise − fajr, I = isha − maghrib, day by day, then
  d = town − LUPT on the same MM-DD. Intervals are longitude-free, so the
  comparison never needs the town's coordinates, and it is immune to a whole-
  table hour shift (the dpt BST defect leaves F and I unchanged when all
  columns share it).
- Both published columns are rounded to the minute, so a constant offset
  spreads over {c−1, c, c+1}. Offsets are fitted as the centre of the best
  ±1 window; classification runs on days outside masked blocks (isolated
  DST-transition blips, smooth override blocks, constant step blocks).
- Classes: LUPT-exact / LUPT+offset (constant ±1 window on ≥95% of full-year
  days, ≥85% on short windows) / LUPT-family-drift (intervals track LUPT's
  seasonal shape, deviation within ±20 min, never constant) /
  own-table-not-LUPT / angle-table. A smooth block on a flat base counts as a
  town override only when it covers ≤40% of days; beyond that the "block" is
  the table itself (the angle-feed signature).

## The map

30 English captures have ≥25 dated rows (22 in `uktowns2/data`, 8 English
captures that live in `ukscotland/data`). Contrast rows: 4 Scotland tables,
Edinburgh, Cardiff, Galway (excluded, 4 rows).

| Class | n | Towns |
|---|---|---|
| LUPT-exact | 3 | London Elm (full-year), London ICC (Nov–Dec), Middlesbrough (Nov) |
| LUPT+offset | 6 | Coventry +3/+3, Bolton +3/+5, East London Mosque 0/−7, MWH North London −1/−7, Hull −3/−21, Cambridge −2/−5 |
| LUPT-family-drift | 16 | Rochdale, Reading (I side), Oldham OCMIC, Oldham Westwood, Brighton, Dudley, Ilford, Preston (F side), Watford, Luton, Stockport, Stoke, Birmingham, Blackpool, Leicester, Bradford Victor St |
| own-table-not-LUPT | 5 | Oxford COMS, Nottingham IC, Slough JMIC (2022), Walsall WJMG (2020), Bradford Hanfia (I side) |

Evidence quality: the exact set is full-year only for London Elm; ICC and
Middlesbrough are 2-month/1-month windows. The offset set is full-year for
Coventry, Bolton and East London Mosque (354–365 rows); Hull, Cambridge and
MWH are short windows. Every drift verdict except Reading (I side only,
capture has no sunrise) and Preston (no maghrib, F side only) rests on both
arrays over 30–365 days.

Offsets confirmed from fit4: Coventry +3/+3 (fit4: +3 on 179/181 days),
Bolton +3/+5, Reading and Rochdale in the drift family. New in this pass:
the East London −7 pair, Hull, Cambridge, MWH, and the shape of the overrides
below.

## What the offsets actually are

- **The +3 editorial pair.** Coventry (Zeenatul Islam, West Midlands) and
  Bolton (Zakariyya, Greater Manchester) both run F = LUPT + 3 with tol1 1.00
  (Coventry's 5 exceptions are 26–30 March DST blips at +63). Their isha base
  is +3 and +5 respectively — and both carry the SAME summer override: a
  smooth dip in dI from −2 down to −21 and back (Coventry 5 May–2 Aug,
  Bolton 25 Apr–11 Aug), centred on the solstice. One template, two regions.
- **The −7 London pair.** East London Mosque (F exact, I −7) and MWH North
  London (−1/−7). ELM adds a constant step to −15 for 18 Feb–19 Mar.
- **Hull** prints −3/−21 in its Jan–Mar + Nov–Dec window, with November steps
  to −7 (F) and −17 (I) — a two-level table.
- **Cambridge** −2/−5 over 10 Nov–11 Dec.

## The drift curves are shared, not random

- Reading's isha deviation and Rochdale's isha deviation are the same curve:
  month means −7.3/−7.8/−5.5/−6.1/−5.4/−3.0/+2.9/−0.9/−2.0/−3.0/−5.9/−3.3
  (Reading) against −6.7/−7.0/−5.1/−6.2/−5.8/−2.7/+2.9/−1.2/−2.0/−2.9/−5.1/−2.3
  (Rochdale) — within ~0.6 minutes all year. A Home Counties ICS feed and a
  Greater Manchester dpt feed publish one alternative isha table.
- The two Oldham mosques share their own curve (spring dip to −3, late-summer
  peak +13..+15), offset from each other by ~+1.5 on F.
- Eight drift towns hold a clean constant isha offset on one side while the
  other side drifts: Leicester +24, Watford +23, Blackpool +10, Stockport +7,
  Stoke +2, Luton 0, Birmingham −1, Bradford Victor St −36.
- Clusters are publisher-shaped, not geography-shaped. The only regional
  reading that survives: London prints LUPT exact (or −7 isha), and the +3
  template spans Midlands and Lancashire.

## Angle feeds and the Wifaqul question

Four captures are angle tables in behaviour, all four on the dpt plugin:
Oxford COMS, Nottingham IC, Slough JMIC (2022 feed), Walsall WJMG (2020
feed). Their dF curves are continuous (1-minute steps, no flat runs) and blow
up through summer as the unclamped angle crosses the short night — Oxford's
F reaches +315 against LUPT, Nottingham +138, Walsall +63, Slough +64 —
exactly the unclamped-fajr defect class the uktowns2 report documented. Their
mosques' jama'ah columns show they do not serve these printed values.
Bradford Hanfia's isha is the same construction on the I side.

No capture in the LUPT family — or anywhere else in England — carries the
Wifaqul fixed-angle construction (18°/15° day tables). Every family member is
interval-based. The Scotland contrast behaves as latitude predicts: Aberdeen
×2, Dundee and Glasgow sit 30–160 minutes off LUPT's F on smooth curves of
their own, not offsets.

## Encoding verdict

| Encoding | Per-town cost | Covers |
|---|---|---|
| LUPT-exact (pointer) | 0 B | 3 captures (10%) |
| LUPT + offset (2 signed bytes) | 2 B, +6–18 B override annotations | 6 captures (20%), 3 of them full-year |
| Own F/I arrays (1 B/day) | ~730 B | 16 drift captures (53%) |
| Own tables + own solar base | ~1.5 KB | 5 angle captures (17%) |

The shared LUPT base costs 732 bytes (F and I, 366 days × 1 byte) once.
Delta coding does not rescue the drift towns: Rochdale's dF/dI need 164 + 177
run-length entries = 1023 bytes as (offset, run) pairs, more than the 730 raw
bytes, because the curves step 1 minute every 1–3 days exactly like LUPT's
own arrays do.

So: "LUPT + per-town offset" is a real encoding — Coventry +3/+3, Bolton
+3/+5, ELM 0/−7, MWH −1/−7, Hull −3/−21, Cambridge −2/−5 — but it covers only
the LUPT-loyal minority (30% of captures, half of that on short-window
evidence). The mosaic is irreducibly per-town for the other 70%: their
publishers run their own interval arrays in LUPT's construction, and no
constant reproduces them. A product serving England beyond London should
carry LUPT centrally, the +3 pair and −7 pair as two-number offsets, and a
per-town array table for the drift and angle feeds.

## Files

- `englupt.json` — per-capture classification, offsets, dips/steps, month
  means, byte costs (english flag marks the 30 England captures).
- `lupt_fi.json` — the LUPT F/I reference arrays (from `o1g-decade/fit/recipe.json`).
- `series/` — per-capture F/I arrays with MM-DD keys.
- `extract14.py`, `classify14.py` (first pass), `inspect14.py`, `shape14.py`,
  `final14.py` (final classifier), `run-final.log`.

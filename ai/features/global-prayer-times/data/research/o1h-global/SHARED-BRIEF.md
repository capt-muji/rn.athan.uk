# O1h shared brief (binding on every O1h agent)

Study: score every worldwide prayer-time methodology, used NAKED, against every country's own authority recipe, minute by minute, over calendar year 2026, and rank the methods. Read `CONSTRAINTS.md` first: it is binding.

## Inputs (read-only)

- `methods/methods.json` — 20 methods + the ISNA-2010 18/18 row: parameters and sources.
- `countries.json` — 73 scoring targets: country, coordinates, tz, fitted fajr/isha rule kinds, asr school, grade.
- `CONSTRAINTS.md` — the naked-bodies rule.
- `$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/policy-layer.v2.4.json` — full target-side recipes (angles, margins, rounding, high-latitude kind, asr school, clock).
- `$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/world-table-v2.md` — context and special-form documentation.
- adhan-js 4.4.6: `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`.
- London real published minutes: `$HOME/athan-gitree/census/o1g-decade/data/2027.json` and `truth/truth-2028-2038.json`.

All paths are relative to `$HOME/athan-gitree/census/o1h-global/` unless absolute. Read nothing else. No network (unless your dispatch prompt says otherwise). No subagents.

## Target side (the reference)

- Angle-form countries: adhan at the country's coordinates with the object's fitted angles, margins, rounding, high-latitude kind and asr school, exactly as policy-layer.v2.4.json carries them.
- Honor each object's rule kinds per prayer: `angle` (use the angle), `interval` (use the documented interval, e.g. isha = maghrib + N), `twilightRatio` (use the documented ratio), `notPublished` (exclude that prayer for that country), `seasonalSweep`/`intervalTable`/window-class (skip with a one-line reason unless your dispatch says to implement them).
- Where `countries.json` has null coordinates, use: JAMIAT-KZN = Durban 29.8587, 31.0218; EU-DIYANET-UNIFIED = Frankfurt 50.1109, 8.6821.
- FAZILET-WORLD and FAZILET-OTTOMAN are method-side entries, never targets. GB-LONDON-INTERVAL-TABLE is scored against the real published minutes, never a recipe.
- Any cell whose target rule is undefined (null angle, unfitted candidate without parameters) is SKIPPED and logged with a one-line reason. Never invent a value.

## Method side (naked)

- Where adhan carries the body's preset, use it verbatim: MuslimWorldLeague, NorthAmerica, Egyptian, Karachi, UmmAlQura, Dubai, MoonsightingCommittee, Kuwait, Qatar, Singapore, Turkey.
- Where the body has no library preset, construct adhan 'Other' parameters from the body's OWN documented pair in methods.json: MABIMS 20/18, Diyanet-Europe 18/16, Fazilet-A 19.8/17.8 effective, Fazilet-B 20.8/18.7 effective, ECFR 18/17, Russia 16/15, Kemenag = MABIMS, ISNA-2010 = 18/18. This implements the body; it does not modify it.
- Umm al-Qura: isha maghrib+120 inside Ramadan, +90 outside. 2026 window: 2026-02-18 through 2026-03-19. State the month length you used.
- Every method runs at the COUNTRY's coordinates, asr school per the method's own definition, no per-country adjustment of anything.
- Diyanet-Domestic keeps its body-documented temkin (sunrise -7, dhuhr +5, asr +4, maghrib +7) because the temkin IS Diyanet's method. No other method receives margins from the census.

## Harness discipline

- `TZ=<country iana>` per invocation; never read the real clock; construct dates from strings.
- Compute at second resolution (Rounding.None) then apply rounding explicitly: the target's own rounding where the object carries it; nearest for the method side unless the body documents its own.
- Compare wall-clock minutes in the country's tz: HH:MM -> minutes past midnight.
- Dhuhr and maghrib are not part of the headline score; carry the asr school match as a flag.

## Metrics

Per country x method, per prayer (fajr, isha): mean |deviation| minutes, worst |deviation|, percent of days within 2 minutes. 365 days of 2026 (366 where the target is real published data spanning leap years). Asr: school-match flag only.

## Standing rules

- NOTHING under /tmp. All output under your dispatch-named directory inside `$HOME/athan-gitree/census/o1h-global/`.
- Write incrementally, flush each stage. Every number comes from a script you ran and can re-run.
- Final message: your headline numbers in the shape your dispatch names, under the word limit it names.

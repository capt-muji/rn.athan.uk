# The plural surface is four strings, which decides the library question

R1 recommends a hand-rolled catalog with a generated plural table, and attacks its own
recommendation on the grounds that re-implementing CLDR plural rules is risky. The weight of that
risk depends entirely on how much of this app needs plurals. Measured, it is almost nothing.

## The measurement

Every user-facing string in the app that interpolates a runtime value:

| Site | String | Pluralises? |
| --- | --- | --- |
| `shared/notifications.ts:130` | `` `${englishName} now` `` | No. No count |
| `shared/notifications.ts:181` | `` `${englishName} in ${intervalMinutes}m` `` | **No. Abbreviated unit** |
| `shared/notifications.ts:502` | `` `${englishName} in ${intervalMinutes}m Reminder` `` | **No. Abbreviated unit** |
| `shared/time.ts:572` | `` `${hours}h` `` | **No. Abbreviated unit** |
| `shared/time.ts:573` | `` `${hours}h ${remainingMinutes}m` `` | **No. Abbreviated unit** |

That is the complete list. Everything else in the app is a fixed label.

## Why this matters

The app's own display contract, recorded in `ai/AGENTS.md`, is abbreviated units: `6h 8m`, `Xm`,
`in 5m`. An abbreviation does not inflect. "5m" is "5m" whether the language is Arabic, Russian or
Polish, in the same way "5 km" is written identically across languages that pluralise "kilometre"
six different ways.

So the four count-bearing strings the app renders **do not need plural rules at all**, in any
language, as long as the abbreviated form is kept.

Owner decision on this shape is already recorded in `ai/AGENTS.md`: the countdown display contract
is settled and `HH:mm` and the `6h 8m` format stay. Row 39's own queue entry says dates and times
are not touched.

## What this does to the library decision

R1's counter-argument to its own recommendation was:

> A silent table bug ships wrong reminder copy to every Arabic speaker, no community watchdog will
> file it, and CLDR revises rules over time.

That risk is real in the abstract and close to zero here, because **no shipped string selects a
plural form**. A plural table that is never called cannot ship a wrong form.

The Arabic rules genuinely are non-obvious, verified against CLDR on this machine:

```
ar: 0=zero 1=one 2=two 3=few 10=few 11=many 26=many 100=other 103=few 111=many
ru: 0=many 1=one 2=few 5=many 21=one 22=few 101=one
pl: 1=one 2=few 3=few 5=many 22=few 25=many
```

Category counts across the launch set: Arabic 6, Russian 3, Polish 3, Turkish 2, English 2,
French 2, Bengali 2, Indonesian 1.

Nobody should hand-write that. But nobody has to, because the app does not use it.

## The rule the plan carries

1. **Keep the abbreviated unit format.** It is already the owner's settled display contract, and it
   is now also the thing that keeps plural complexity out of the app entirely.
2. **Ship no plural machinery in the first pass.** Not a table, not a 46 KB polyfill. A `t()` that
   does lookup and interpolation covers 100% of the current surface.
3. **Write the guard, not the feature.** A test asserts that no catalog value contains a plural
   construct, so the day someone adds one the suite says so and the decision gets made
   deliberately rather than by accident.
4. **If a plural string ever becomes necessary**, generate the table from `make-plural` rather than
   hand-writing it, pin it with per-language category tests, and keep R1's
   `Intl.PluralRules`-deleted canary so the tests run in Hermes's environment rather than Node's.

This removes the strongest objection to R1's recommendation, and it removes 46 to 155 KB of
polyfill that every library-based option would have needed to be correct in Arabic.

## The caveat

This holds while the copy stays abbreviated. A future string like "3 prayers remaining" or
"2 reminders set" would need the machinery. The guard in point 3 is what makes that a decision
rather than a silent defect, and it is cheap: one test over the catalog files.

The five `EXTRAS_EXPLANATIONS` strings are the nearest thing to prose the app has
("20 mins before Fajr"), and they carry a fixed number rather than a variable one, so they are
translated as whole sentences per locale and never composed at runtime. That is also what
`R2-FINDINGS.md` requires for a different reason: they are doctrinally adjacent and belong in the
sourced glossary track rather than the machine-translated one.

## Reproducing

```bash
python3 ai/plans/39-localisation/scripts/plural-surface.py
node -e "const p=new Intl.PluralRules('ar');console.log([0,1,2,3,11,103].map(n=>n+'='+p.select(n)).join(' '))"
```

Note that the Node command demonstrates the trap rather than the app's behaviour: Node has full
`Intl` and Hermes does not.

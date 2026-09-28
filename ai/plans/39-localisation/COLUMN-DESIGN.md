# The prayer row, redesigned for a 123pt budget

The derived budget changes this from "some languages need shorter names" to "the current row
composition does not fit most languages". That deserves a design rather than a patch.

## The problem, stated exactly

On a 320dp screen with the second name shown, the name column has **123pt**. Measured against the
launch set: Arabic and English fit, Urdu fits with 3pt to spare, and Hindi, Turkish, German,
Indonesian and Swahili do not.

English itself has 43pt of headroom, so the row was already tight before any translation.

The root cause is that the row shows **two names plus a time plus a control** on a phone. That is a
lot of content for 280pt of usable width, and it works today only because both names happen to be
short: "Last Third" and `نصف الليل`.

## Why the obvious fixes do not work here

| Fix | Why not |
| --- | --- |
| Wrap to two lines | `STYLES.prayer.height` is a fixed 57, and the overlay anchors the Extras explanation box off measured absolute coordinates. A taller row moves every anchored box, which is row 36's machinery |
| Shrink the font globally | Makes every locale worse to fix a few |
| Truncate with an ellipsis | Loses meaning on exactly the names that need it. "Sepertiga Malam Ter..." is not a prayer name |
| One global grow-only width | Measured in `CONFLICTS.md` 2: pins a 226pt column forever for anyone who tries Swahili once |

## The design: four layers, applied in order

Each layer is cheap and each one catches what the layer above missed. A name reaching layer 4 is
rare by construction.

### Layer 1: author within the budget

The catalog is authored, so the first remedy is a shorter legitimate form. Most languages have one,
because the long forms are literal translations of an English idiom rather than the term a speaker
would use on a timetable.

Indonesian prayer timetables print `Sepertiga Malam` or even `1/3 Malam`, not `Sepertiga Malam
Terakhir`. Turkish tables print `Son Üçte Bir`. These are the forms the national authorities use in
their own published tables, which is also where R6 sources them, so the short form is usually the
MORE authentic one rather than a compromise.

**This is the primary remedy and it is free.** A shorter name is data.

#### Evidence that layer 1 is sufficient, from a shipping app

Al-Azan (`github.com/meypod/al-azan-compose`, AGPL, 14 locales) is a production Islamic prayer app.
Its own `res/values-*/strings.xml` catalogs were fetched and measured with the same CoreText method,
as an independent cross-check of the working set:

| Locale | Longest standard name | Width | Midnight | Width |
| --- | --- | --- | --- | --- |
| English | Maghrib | 66.1pt | Midnight | 70.4pt |
| Arabic | شروق الشمس | 88.2pt | منتصف الليل | 81.3pt |
| Turkish | Akşam | 55.7pt | Gece yarısı | 87.7pt |
| Indonesian | Maghrib | 66.1pt | Tengah malam | 119.1pt |
| Urdu | طلوع آفتاب | 69.5pt | آدھی رات | 60.9pt |
| Bengali | সূর্যোদয় | 51.8pt | মধ্যরাত | 53.1pt |
| Hindi | सूर्योदय | 48.5pt | मध्यरात्रि | 55.4pt |
| Swahili | Magharibi | 80.2pt | Katikati ya usiku | **130.2pt** |
| French | Lever du soleil | 114.5pt | Minuit | 50.2pt |
| German | **Nachmittagsgebet** | **148.2pt** | Mitternacht | 92.4pt |

**Eighteen of twenty fit the 123pt budget.** Only German's "Nachmittagsgebet" (Asr, translated as
"afternoon prayer" rather than transliterated) and Swahili's "Katikati ya usiku" exceed it.

This materially changes the outlook. My working set had five of eight launch languages over budget,
because it used literal translations of the English phrases. A real app's shipped vocabulary mostly
fits, because real apps use the short forms speakers actually say.

Two lessons for the catalog work:

1. **The width problem is largely self-inflicted by bad source data.** Source the names properly
   (which is R6's job) and most of it disappears.
2. **Where it remains, the cause is translating rather than transliterating.** German's
   "Nachmittagsgebet" is 148pt where "Asr" is 30pt, and both are correct German usage. The catalog
   should prefer the transliteration for the prayer names, which is also what Muslim-majority
   languages do naturally.

Note Al-Azan ships `Tahajjud` rather than a "Last Third" row, so it does not answer the hardest
term. R6 covers that.

### Layer 2: a per-locale measured column

`InitialWidthMeasurement` already measures the longest name and caches it, widen-only. Making the
cache per-locale (step 38.6) means each language gets exactly the width it needs, so Arabic's
column is 68pt and never inherits Swahili's 226pt.

This does not make an over-budget name fit. It stops a fitting locale from being punished for a
non-fitting one, which is a different and equally necessary job.

### Layer 3: the second-name toggle as a width valve

Turning the second name off raises the budget from 123pt to **191pt**, which clears every launch
language except Indonesian and Swahili.

That is worth surfacing in the design rather than leaving implicit. When the app language is one
whose names do not fit alongside a second name, the sensible default is second name off. The user
can turn it on and see a tighter row, which is their choice to make.

This also resolves a question `PROPOSALS.md` P1 left open: what the second name should default to
when the app language is not English. The answer has a width component, not just a taste one.

### Layer 4: shrink-to-fit, per row, as the floor

For the residue, `adjustsFontSizeToFit` with a `minimumFontScale` lets one row's name shrink rather
than clip. It is iOS-complete and Android-partial, which is why it is the floor rather than the
plan.

The interaction to watch: the width cache measures a full-size string, so a shrunk row and the
cached width disagree. The plan pins the cache to the unshrunk measurement and lets shrink handle
only the overflow, so the columns stay aligned.

## The guard that makes this survive 20 more languages

A test that fails the build when any name in any catalog exceeds the budget for its locale.

```
for each locale, for each of the 11 names:
  assert measuredWidth(name) <= BUDGET_PT
```

The budget is a named constant derived from the narrowest supported screen, not a magic number, and
the failure message names the locale, the term, its width and the overage, so whoever adds a
language knows exactly what to shorten.

This is what turns a layout risk into a data constraint with an automated answer, which is the only
form that survives languages being added over time by someone who does not remember this analysis.

**The measurement cannot run in Jest**, because Jest has no text shaper. Two options, and the plan
picks the first: a build-time script using the same CoreText measurement
(`scripts/measure-widths.swift`) that produces a committed widths file the test asserts against; or
a character-count proxy, which `WIDTH-EVIDENCE.md` measured as agreeing with rendered width in all
six scripts tested but which is not guaranteed for an unmeasured script.

## What this means for the launch set

`ASSUMPTIONS.md` A7 takes R4's eight: `en ar id ur bn tr fr de`. Five of those eight need layer 1
work, and two (Indonesian, Swahili in the full set) need it even with the second name hidden.

That is not an argument against the set. It is an argument for doing the catalog authoring as real
work with the authority sources open, rather than accepting a machine translation's first answer.
It is also why R6 was asked for a `shortText` field alongside `text`.

## The honest summary

The prayer row was designed for two short names. Most of the world's languages do not have two
short names for these concepts. The fix is mostly editorial, partly architectural, and the guard is
what keeps it fixed.

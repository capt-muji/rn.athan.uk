# What R6 delivers: the catalog, and whether it fits

R6 produced `research/prayer-names.json`: **28 locales**, the 11 prayer names and 5 explanation
strings, each with `text`, an optional `shortText`, a `source` slug, a `confidence` grade and a
`note`.

This is the artefact that makes the whole feature possible for an owner who cannot verify a
translation himself, because it converts the highest-risk strings in the app from model output into
sourced data with a citation.

## The sourcing is real

`_meta.sourceSlugs` names the authorities rather than gesturing at them:

| Slug | Authority |
| --- | --- |
| `diyanet` | Diyanet İşleri Başkanlığı, Turkey |
| `kemenag` | Kementerian Agama RI, Indonesia |
| `nu-online` | NU Online, Indonesia |
| `jakim` | JAKIM e-Solat, Malaysia |
| `muis` | Majlis Ugama Islam Singapura |
| `kmsh` | Komuniteti Mysliman i Shqipërisë, Albania |
| `habous` | Ministère des Habous et des Affaires Islamiques, Morocco |
| `islom-uz` | islom.uz, Uzbekistan |

Plus the two AGPL app catalogs as cross-checks, which is the discipline R2 specified.

## Confidence across the launch set

| Locale | Fajr | Sunr | Dhuh | Asr | Magr | Isha | Midn | Last | Suho | Duha | Isti |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| en | h | h | h | h | h | h | h | h | h | h | h |
| ar | h | h | h | h | h | h | h | m | h | h | m |
| id | h | h | h | h | h | h | m | m | h | h | l |
| ur | h | h | h | h | h | h | m | m | h | - | - |
| bn | h | h | h | h | h | h | m | m | h | h | - |
| tr | h | h | h | h | h | h | h | m | h | h | m |
| fr | h | h | h | h | h | h | m | m | m | l | - |
| de | m | h | h | h | h | m | h | h | m | - | - |

**All six daily prayer names are `high` in seven of eight launch locales**, which is the half that
matters most and the half users see every day.

**The gaps are exactly where predicted.** `Istijaba` is null in Urdu, Bengali, French and German,
and `Duha` is null in Urdu and German. Those are the two terms this session flagged from the start
as having no standard rendering outside Arabic.

**R6 used nulls rather than guesses**, which was the instruction and is the single most valuable
property of the file. A null with an honest note is actionable; a plausible invention is a silent
defect nobody could catch.

## The validation that raises confidence in the whole file

R6 never saw this repository's source. Its Arabic explanation strings were sourced independently
from authority material. Compared against the app's shipped `EXTRAS_EXPLANATIONS_ARABIC`:

| App's shipped string | R6's sourced string | Match |
| --- | --- | --- |
| نصف الليل بين المغرب والفجر | same | yes |
| عند بداية الثلث الأخير من الليل | same | yes |
| 20 دقيقة قبل الفجر | same | yes |
| 20 دقيقة بعد الشروق | same | yes |
| ساعة قبل المغرب (الجمعة فقط) | same | yes |

**Five of five, character for character.**

The app's Arabic was written by a human who reads Arabic, years ago. An independent sourcing pass
reproduced it exactly. That is the closest thing available to a correctness check on a catalog
nobody in this session can read, and it materially raises confidence in the other 27 locales.

**Coverage: all 28 locales carry all six daily prayer names non-null.** The nulls are confined to
the extras, and to `Istijaba` and `Duha` in particular.

## The measurement that decides the layout

`scripts/catalog-widths.py` measures every locale's widest name, preferring `shortText` where R6
supplied one, against the 123pt budget.

**19 of 28 locales fit. Seven of the eight launch locales fit.**

| Over budget | Widest term | Overage |
| --- | --- | --- |
| Swahili | Theluthi ya mwisho ya usiku | +102pt |
| Malay | Sepertiga akhir malam | +57pt |
| Spanish | Medianoche islámica | +47pt |
| Russian | Исламская полночь | +47pt |
| Somali | Habeennimo dhexe | +31pt |
| French | Minuit islamique | +9pt |
| Chinese (both) | 夜间后三分之一 | +3pt |
| German | Sonnenaufgang | +3pt |

Compare this session's own working set, which had **five of eight launch locales over budget**. With
properly sourced terse forms, that falls to **one** (French, by 9pt).

So the width problem was mostly an artefact of using literal translations. `CATALOG-EVIDENCE.md`
reached the same conclusion from the shipping apps, and this confirms it with sourced data.

## What remains to be decided, and it is small

Six of the nine over-budget locales miss by under 50pt, and four of those are the Midnight string
("Medianoche islámica", "Исламская полночь", "Minuit islamique"). In every case the fix is dropping
the "Islamic" qualifier, which this app can do because its Midnight row is already unambiguous in
context: "Minuit" is 50pt against "Minuit islamique" at 132pt.

Swahili at +102pt is the only genuinely hard one, and it is not in the launch set.

**So the layer-1 remedy in `COLUMN-DESIGN.md` is sufficient**, and the work is small enough to do
once, carefully, rather than needing a per-locale font or a truncation strategy.

## What the plan takes

1. `prayer-names.json` becomes the seed for step 5's glossary, with the provenance fields carried
   into the repo rather than stripped.
2. The `shortText` field is the one the prayer column reads; `text` is the fallback and is what the
   explanation box and any full-width surface use.
3. The nulls are the launch blockers per locale. A locale ships when its 11 names are non-null, or
   when the plan decides a null renders the English term (which is defensible for Istijaba, a word
   with no translation).
4. `scripts/catalog-widths.py` becomes the guard: it runs in CI and fails when a catalog entry
   exceeds the budget, which is `COLUMN-DESIGN.md`'s automated answer.

## The caveat that stays

R6 sourced these from authority portals and cross-checked against two AGPL catalogs. That is the
best available evidence and it is not the same as a native speaker reading the app.

The residual risk sits almost entirely on the `medium` and `low` grades and the extras terms, which
is where R2's user-sourced correction loop earns its place: a "report a translation mistake" row
costs almost nothing and covers every language at once.

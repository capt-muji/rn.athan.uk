# Two shipping catalogs, measured: what they prove about the column

Al-Azan and Mihrab are production Islamic prayer apps with open translation catalogs. Both were
fetched and measured with the same CoreText method used for the budget, as an independent check on
this session's working set.

**Licence discipline:** both are AGPL-3.0. Nothing is copied. They are read as evidence about what
real apps ship, and R2's rule stands: national authority portals are the source of truth and these
are cross-checks.

## What was measured

| Source | Locales | Covers |
| --- | --- | --- |
| Al-Azan, `meypod/al-azan-compose`, `res/values-*/strings.xml` | 14 | 6 prayer names, Midnight, Tahajjud. **No Last Third** |
| Mihrab, `MihrabHQ/Mihrab`, `src/i18n/locales/*.json` | 13 | 6 prayer names, Islamic Midnight, **Last Third**, Suhoor |

Mihrab is also a React Native app, so its catalog shape is directly comparable.

## Result 1: the six prayer names fit comfortably

From Al-Azan's shipped catalogs, longest standard name per locale against the 123pt budget:

| Locale | Longest | Width | Locale | Longest | Width |
| --- | --- | --- | --- | --- | --- |
| Hindi | सूर्योदय | 48.5pt | English | Maghrib | 66.1pt |
| Bengali | সূর্যোদয় | 51.8pt | Indonesian | Maghrib | 66.1pt |
| Turkish | Akşam | 55.7pt | Urdu | طلوع آفتاب | 69.5pt |
| Arabic | شروق الشمس | 88.2pt | Swahili | Magharibi | 80.2pt |
| French | Lever du soleil | 114.5pt | German | **Nachmittagsgebet** | **148.2pt** |

**Nine of ten fit.** Only German is over, and only because Al-Azan translates Asr as
"Nachmittagsgebet" (afternoon prayer) where "Asr" is 30pt. That is a catalog choice, not a
constraint.

## Result 2: the extras names do not fit anyone's budget, including in English

Mihrab's own shipped strings, measured:

| Locale | Last Third | Width | Midnight | Width |
| --- | --- | --- | --- | --- |
| English | Last Third of the Night | **178.1pt** | Islamic Midnight | **132.8pt** |
| Arabic | الثلث الأخير من الليل | 127.4pt | منتصف الليل | 81.3pt |
| Urdu | رات کا آخری تہائی حصہ | 160.1pt | نصف شب | 65.4pt |
| Turkish | Gecenin son üçte biri | 167.5pt | İslami gece yarısı | 138.4pt |
| Indonesian | Sepertiga malam terakhir | 201.4pt | Tengah malam | 119.1pt |
| Bengali | রাতের শেষ তৃতীয়াংশ | 143.2pt | ইসলামিক মধ্যরাত | 124.4pt |
| German | Letztes Drittel der Nacht | 193.6pt | Islamische Mitternacht | 183.5pt |
| French | Dernier tiers de la nuit | 174.3pt | Minuit islamique | 132.3pt |

**Thirteen of sixteen exceed 123pt, and the worst offender is English.**

That is the finding. Mihrab's English "Last Third of the Night" is 178pt, which would overflow this
app's column as badly as any translation. **Mihrab does not have this problem because it does not
have this layout**: those strings live in a settings list with a full-width row, not in a
fixed-width column beside a time and a control.

So the constraint is not linguistic. It is this app's row design, and it already binds in English.
This app ships "Last Third" at 79.8pt only because someone chose a terse label years ago.

## Result 3: this app's existing Arabic is better than Mihrab's for this layout

| Term | This app | Width | Mihrab | Width |
| --- | --- | --- | --- | --- |
| Midnight | نصف الليل | 68.1pt | منتصف الليل | 81.3pt |
| Last Third | آخر ثلث | **49.2pt** | الثلث الأخير من الليل | 127.4pt |

The app's own `EXTRAS_ARABIC` is 78pt narrower on Last Third and both fit the budget. Whoever chose
those strings picked short forms suited to a narrow column.

That is a useful precedent, and it is the model for every other locale: **an app with a fixed
column needs the terse form of each term, and the terse form is a legitimate choice rather than a
compromise.** The app has already made that choice once, in Arabic, and it reads correctly.

## What this changes

1. **The width problem is a labelling problem, and it is solvable.** The worst case in the sourced
   data is English's own long form, so no language is uniquely difficult. Every locale needs a terse
   label, exactly as English and Arabic already have one here.
2. **R6 must ask for the terse form explicitly.** Its brief asks for a `shortText` field, which is
   right. This evidence says `shortText` is the field that matters for the extras and `text` is the
   fallback, rather than the other way round.
3. **`COLUMN-DESIGN.md` layer 1 is confirmed as the primary remedy**, with a sharper instruction:
   the target is not "a shorter translation" but "the term as it appears on a printed timetable",
   which is terse by the same constraint.
4. **Transliterate rather than translate for the prayer names.** German is the proof: "Asr" 30pt
   against "Nachmittagsgebet" 148pt, both correct German.

## The risk this leaves

A terse label can lose meaning. "آخر ثلث" is literally "last third", without "of the night", and it
works because the context is a prayer timetable. The same compression in a language this session
cannot read might produce something odd.

That is exactly what the explanation box is for: the terse label sits in the column, and the
explanation string carries the full sense. The app already uses that division, and the five
explanation strings are in the sourced glossary track for this reason.

## Reproducing

```bash
python3 ai/plans/39-localisation/scripts/alazan-widths.py
python3 ai/plans/39-localisation/scripts/mihrab-check.py
```

Both fetch from `raw.githubusercontent.com` and need a network.

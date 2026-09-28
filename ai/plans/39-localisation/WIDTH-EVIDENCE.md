# The prayer-name column: the owner's concern was correct

Owner decision D9 named this as the feature's main risk:

🐋  "What if the translation of sunrise in a different language might be like 20 characters, 30
characters? I think we might have to run through a bunch of different languages and find out if
this will ever break."

It does break. Measured, not estimated.

## Method

`scripts/name-width-budget.py` measures the **advance width in points** of every one of the 11
prayer names in 15 candidate locales, at `TEXT.size` (18), through CoreText with Roboto as the
requested family and system fallback for scripts Roboto lacks. That is the same shaper and the
same fallback path iOS uses to draw them.

Advance width is the right measure and character count is not. A Devanagari conjunct is several
codepoints in one glyph cluster, and Arabic letters change width when they join, so counting
characters overstates those scripts badly and counting UTF-8 bytes overstates them worse. Only
the shaped width predicts the layout.

## The numbers

English today: standard column 59.8pt ("Sunrise"), extras column 79.8pt ("Last Third").

| Locale | Standard | vs en | Longest standard | Extras | vs en | Longest extras |
| --- | --- | --- | --- | --- | --- | --- |
| Swahili | 80.2 | 1.34x | Magharibi | **226.3** | **2.83x** | Theluthi ya Mwisho ya Usiku |
| Indonesian | 66.1 | 1.10x | Maghrib | 205.0 | 2.57x | Sepertiga Malam Terakhir |
| Malay | 66.1 | 1.10x | Maghrib | 205.0 | 2.57x | Sepertiga Malam Terakhir |
| Spanish | 81.8 | 1.37x | Amanecer | 198.5 | 2.49x | Último tercio de la noche |
| German | **125.9** | **2.11x** | Sonnenaufgang | 193.6 | 2.43x | Letztes Drittel der Nacht |
| Russian | 63.5 | 1.06x | Магриб | 189.8 | 2.38x | Последняя треть ночи |
| Thai | 61.0 | 1.02x | ตะวันขึ้น | 188.9 | 2.37x | หนึ่งในสามสุดท้ายของคืน |
| French | 114.5 | 1.91x | Lever du soleil | 174.3 | 2.18x | Dernier tiers de la nuit |
| Turkish | 55.7 | 0.93x | Akşam | 171.8 | 2.15x | Gecenin Son Üçte Biri |
| Bengali | 51.8 | 0.87x | সূর্যোদয় | 143.2 | 1.79x | রাতের শেষ তৃতীয়াংশ |
| Hindi | 48.5 | 0.81x | सूर्योदय | 131.2 | 1.64x | रात का अंतिम तिहाई |
| Urdu | 69.5 | 1.16x | طلوع آفتاب | 119.9 | 1.50x | رات کا آخری تہائی |
| Chinese | 36.0 | 0.60x | 晨礼 | 108.0 | 1.35x | 后夜三分之一 |
| English | 59.8 | 1.00x | Sunrise | 79.8 | 1.00x | Last Third |
| Arabic | 46.3 | 0.77x | الشروق | 68.1 | 0.85x | نصف الليل |

## What this says

**1. The extras column is the problem, not the standard one.** Every locale except Arabic widens
it, and eight of fifteen at least double it. "Last Third" and its translations are the worst case
in every language, because the concept needs a phrase in most languages while English has a short
idiom. On a 360dp phone, 320dp of usable row width, the Swahili name alone takes 71% before the
time and the alert bell are drawn. That row cannot be laid out.

**2. The standard column is mostly safe, with two exceptions.** German "Sonnenaufgang" at 2.11x and
French "Lever du soleil" at 1.91x are the only real risks, and both are the translation of
"Sunrise", which is the name that sets the column. Muslim-majority languages are comfortable
because they keep the Arabic loanwords, which are short.

**3. Arabic and Chinese are NARROWER than English.** Arabic's extras column is 0.85x and Chinese's
standard column is 0.60x. That matters because of the widen-only width cache
(`CONSTRAINTS.md` C5): a user who switches from Swahili to Arabic keeps a 226pt column forever
with 158pt of empty space. The cache reset is not a nicety, it is required for the feature to look
correct.

**4. The scripts that worried the owner are not the ones that break.** The intuition was that
non-Latin scripts would be long. The measurement says the opposite: Arabic, Chinese, Hindi and
Bengali are all at or below English, and the damage comes from Latin-script languages that
translate the CONCEPT into a phrase. Swahili, Indonesian, Spanish and German break the layout;
Arabic and Chinese improve it.

## The width-setting name is not the same name in every language

R3 raised this and the measurement confirms it, harder than R3 stated. Measuring which INDEX of the
name array produces the widest string, per locale:

| Column | Distinct width-setting names across 15 locales |
| --- | --- |
| Standard | **3**: Fajr (zh), Sunrise (en ar ur bn hi th fr de es), Magrib (id tr ru sw ms) |
| Extras | **2**: Midnight (ar), Last Third (everyone else) |

So in Chinese the standard column is set by "Fajr", in Indonesian and Turkish by "Magrib", and in
English by "Sunrise". In Arabic the extras column is set by "Midnight" (`نصف الليل`), not by the
translation of "Last Third".

**This is a live defect for the feature.** `shared/prayer.ts`'s `getLongestPrayerNameIndex` returns
an index computed from the ENGLISH arrays, and `components/ui/InitialWidthMeasurement.tsx` uses it
to pick which single string to measure:

```tsx
{PRAYERS_ENGLISH[getLongestPrayerNameIndex(ScheduleType.Standard)]}
```

Under any locale in the Magrib or Fajr groups, that measures the wrong string and the column comes
out too narrow, which clips the actual longest name. The widen-only cache then pins the wrong width
permanently.

The fix is small and matches the existing shape: measure the longest name **in the active locale**,
which means `getLongestPrayerNameIndex` reads the active catalog instead of `PRAYERS_ENGLISH` and
`EXTRAS_ENGLISH`, and `InitialWidthMeasurement` indexes that same catalog.

### The selection rule itself is safe, tested rather than assumed

`getLongestPrayerNameIndex` picks by **character length**, not by rendered width. That is
theoretically wrong, because a Devanagari conjunct is several codepoints in one cluster and Arabic
letters change width when they join, so character count and advance width can disagree.

Measured across six scripts, comparing the name chosen by character count against the name chosen
by CoreText advance width:

| Case | By character count | By measured width | Agree |
| --- | --- | --- | --- |
| Arabic extras | `نصف الليل` | `نصف الليل` | yes |
| Urdu standard | `طلوع آفتاب` | `طلوع آفتاب` | yes |
| Hindi standard | `सूर्योदय` | `सूर्योदय` | yes |
| Thai standard | `ตะวันขึ้น` | `ตะวันขึ้น` | yes |
| Chinese standard | `晨礼` | `晨礼` | yes |
| English standard | `Sunrise` | `Sunrise` | yes |

They agree in every case. This is an honest negative result and it makes the fix cheaper: the
selection LOGIC stays as it is, and only its INPUT changes from the English array to the active
catalog. No new measurement machinery is needed.

The agreement is not a coincidence. Within one script, character count and advance width correlate
strongly, and the comparison is only ever made within a single locale's array. The theoretical
failure would need two names in the SAME locale where the shorter string renders wider, which needs
a script mixing wide and narrow glyph classes. Chinese is the candidate (all names are two
full-width characters, so the comparison is a tie broken by array order), and the plan pins this
with a test rather than trusting it to hold for a locale nobody has measured yet.

## What follows for the design

Wrapping is unavailable: `STYLES.prayer.height` is a fixed 57 and the overlay positions the Extras
explanation box from measured absolute coordinates, so a taller row moves anchored boxes
(`ai/plans/README.md` row 36 is the same machinery). So the strategies that survive are:

| Strategy | Verdict |
| --- | --- |
| Per-locale measured column | Already the architecture. `InitialWidthMeasurement` measures the longest name of an array, so it becomes per-locale at no structural cost. Necessary but not sufficient: it cannot fix Swahili, which has no width that fits |
| Shorter names in the catalog | The real fix for the extras. A catalog is authored, so "Theluthi ya Mwisho ya Usiku" can be authored as a shorter local form. This is a translation decision, not a layout one |
| Per-locale font size | Available and cheap, but shrinking the extras column to fit Swahili makes every locale's list inconsistent |
| `adjustsFontSizeToFit` with `minimumFontScale` | Per-row shrink, no layout change. Interacts badly with the width cache, which measures a full-size string |
| Truncation with ellipsis | Loses meaning on exactly the names that need it |

**The recommendation the plan carries:** the catalog is the fix. Every locale's 11 names are
authored to a width budget expressed in points, measured by this script, and a test fails the
build when a name exceeds it. That turns a layout risk into a data constraint with an automated
guard, which is the only form that survives 20-plus languages being added over time.

The budget itself is an owner-facing number, because it trades name fidelity against column width.
`PROPOSALS.md` proposes one with its reasoning.

## Caveat

The 15 locales' names above are a working set assembled for the width question, not a sourced
catalog. Round 2 sources them properly (`R2` is looking for licence-checked open-source Islamic app
catalogs). The width CONCLUSIONS survive that: the phrases that break the layout are
literal translations of "Last Third", and any faithful translation of that concept is long in
those languages. The exact points will move; the shape will not.

## Reproducing

```bash
python3 ai/plans/39-localisation/scripts/name-width-budget.py
```

Needs `swift` on the path (Xcode command line tools). The script writes its measurement program to
`/tmp/opencode/` and runs it once per locale.

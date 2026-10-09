# The single-language pivot, taken by the owner on 2026-10-09

This file is the record of the owner's redirection of rows 38 and 39. It supersedes every part of
the earlier research that assumed the bilingual prayer row: the two-setting model and its revised
one-picker-plus-toggle descendant (`ONE-OR-TWO-LANGUAGES.md`, `PROPOSALS.md` P1), the derived
Arabic second name (D4, D5 as then read), the "primary/secondary" slot model, and the 123pt
two-column width budget. `OWNER-DECISIONS.md` D17 to D20 carry the rulings. Everything structural
from R1 to R7 stands: the identifier split, the hand-rolled `t()`, TS catalogs, the notification
re-arm shape, widget prop baking, the sourced 28-locale glossary.

## The pivot in one paragraph

The app renders exactly one language at a time, chosen in Settings, following the device locale on
first run. The Arabic name column is removed everywhere: the prayer row, the explanation box, the
Settings toggle, the stored data. Every user-visible string renders in the selected language,
including prayer names, sheet and modal chrome, help text, notification copy, widget text and date
labels. Arabic strings survive in the codebase only as source data for transliterations. Each
prayer term is typed transliteration or translation, and the type drives how each language renders
it.

## The owner's term typing (2026-10-09)

| Type | Terms |
| --- | --- |
| Transliterated from Arabic | Fajr, Dhuhr, Asr, Magrib, Isha, Suhoor, Duha, Istijaba, Qibla |
| Translated (the time-of-day concept, one word where the language allows) | Sunrise, Midnight, Last Third |

This confirms D15 and D16 as written. Turkish stays a documented authority exception (Diyanet
prints its own label set, "İmsak" for the Fajr row); `research/prayer-names.json` carries the
per-locale detail.

## Rulings recorded 2026-10-09

- **D17.** One language at a time; the Arabic column is removed; every user-visible string follows
  the selected language. See `OWNER-DECISIONS.md`.
- **D18.** The language switch is an all-or-nothing transaction: a progress UI, no user cancel, and
  no half-applied state survives a crash or force quit. Notification re-arm, channel renames,
  widget re-push, width cache switch and the preference write all commit together.
- **D19.** The language release ships as 2.0.0. Going global later ships as 3.0.0.
- **D20.** The qibla sensor code is untouched. Only its labels translate.

## Code facts verified at `uat` `5ad6aaba` (1.29.288)

| # | Fact | Evidence |
| --- | --- | --- |
| 1 | 205 capitalised literals: 123 display copy over 34 files, 25 widget copy, 23 identifiers, 22 prayer-name-as-identifier, 12 doc comments. Largest: `shared/help.ts` 27, `shared/whatsNew.ts` 14, `components/sheets/screens/Settings.tsx` 12, `components/sheets/screens/Alert.tsx` 10 | scripts in `scripts/`, re-run 2026-10-09 |
| 2 | The English prayer name is load-bearing: 27 MMKV preference keys, 2 OS notification-identifier builders, 11 audio-slug sites, 5 ordering and day-rule sites; 67 reminder mp3s with `[a-z0-9_]` slugs | `identifier-contract.py`; `stores/notifications.ts:207`; `device/notifications.ts:49-66` |
| 3 | Arabic surfaces in production: the row's second column (`components/prayer/Prayer.tsx:91-93`), the Settings toggle (`Settings.tsx:129-131`), the explanation box's Arabic line (`components/prayer/Explanation.tsx:80`), plus plumbing: `PrayerRow.arabic` (`shared/types.ts:272`), `getPrayerNamesForDate` (`shared/prayer.ts:314`), unused `_arabicName` params (`shared/notifications.ts:125,169,176`), `arabicName` in stored alarm records (`stores/notifications.ts:877`), `prayerArabic` in `AlertSheetState`. Widgets and the countdown carry no Arabic | grep sweep 2026-10-09 |
| 4 | Alignment: hidden Texts measure the longest name per schedule (`components/ui/InitialWidthMeasurement.tsx`), stored widen-only (`stores/ui.ts:216`), keys `prayer_max_english_width_standard/extra` whitelisted in both wipes (`stores/sync.ts:365`, `stores/version.ts:155`). The time cell is `flex: 1` with `textAlign: 'center'` (`components/prayer/Time.tsx:62-72`), so times stay pixel-aligned after the Arabic column dies | read 2026-10-09 |
| 5 | Android mirrors the app today on RTL-locale devices: `android:supportsRtl="true"` plus `allowRTL` defaulting true, with zero `I18nManager` calls in the tree. iOS does not (knownRegions holds no RTL language) | `I18nUtil.kt:21-40`; `RCTI18nUtil.m:32-41` |
| 6 | Numerals: `toArabicNumbers` serves only the dying Arabic explanation line; all times are Latin `HH:mm`; Hijri and Gregorian dates format through `Intl` pinned to `en-US` month names | `shared/text.ts`; `shared/time.ts:241-243` |
| 7 | `expo-localization` is not installed; locale reads need no permission | `package.json` |
| 8 | Reminder audio is recorded in-house, one mp3 per prayer and interval; whether the recordings speak English words is owner knowledge | `README.md`; `assets/audio/reminders/` |
| 9 | The stored day rows carry `english` and `arabic` name fields; times are `HH:mm` strings; the "database" is MMKV plus stored row objects, not SQL columns | `stores/database.ts` |
| 10 | Notification copy is frozen at schedule time on both platforms; deterministic identifiers make re-arm an in-place replace with no cancel pass | R4; `device/notifications.ts:44-66` |

## Research agent findings, 2026-10-09

Four research agents were dispatched by the owner's instruction; three had reported when this file
was written, and their full outputs live in this session's record. Digests:

### First-run language (reported)

- `expo-localization` at SDK 58 exports `getLocales`/`useLocales`/`getCalendars`/`useCalendars`
  only; no permission; no locale matcher, so RFC 4647 lookup is a small hand-rolled function
  (`id-ID` resolves to `id`, `ar-EG` to `ar`, fallback `en`).
- App Store and Play localisations govern the listing page only; nothing is injected into the app
  at install. The OS locale is the first-run mechanism.
- Recommended algorithm: while no explicit in-app choice exists, derive the language from
  `getLocales()` on every launch (and Android foreground return), which honours the OS per-app
  override on Android 13+ and iOS 13+ for free; the first explicit in-app choice persists and wins
  forever; existing installs stamp `en` once at upgrade rather than re-matching.

### Launch set (reported)

| Tier | Languages | State |
| --- | --- | --- |
| Ready | en, ar, id, ur, bn, fa, fr, tr | 8 to 11 of 11 names sourced; Turkish is the documented Diyanet exception |
| One sign-off | ms | JAKIM-sourced; "Syuruk" for Sunrise is the authority's own transliteration in a translated slot |
| Needs sourcing | sw, ha, pt | Congo is served by fr + sw; Nigeria is Hausa (5 null names, 5 explanations, then a speaker); Brazil is one `pt` file, the cheapest missing locale |

Recommended against: Igbo, Lingala. Post-launch order: uz, de, ru, hi, so, zh. Population sources:
Pew 2025, World Population Review 2026, UNFPA 2025.

### RTL pinning (reported)

- Pin LTR through the `expo-localization` config plugin with `supportsRTL: false`, which writes
  `android:supportsRtl="false"` and `ExpoLocalization_supportsRTL = false`, applied natively
  before React loads: deterministic on the first frame, both platforms. A JS
  `I18nManager.allowRTL(false)` is wrong on SDK 58: next-launch-only, first-launch race, and
  rewritten by the module every launch.
- Arabic and Urdu inside `Text` nodes still shape and order RTL under the Unicode bidi algorithm
  with the line box anchored left (Android anchors RTL script left by default; iOS needs explicit
  `textAlign: 'left'` where natural alignment would anchor a pure-RTL paragraph right).
- Precedents for an LTR shell rendering RTL content: GitHub Mobile, Notion, Obsidian.

### Pending at write time

- Numeral systems per locale (Latin vs Arabic-Indic vs Persian variants; authority practice).
- Blast-radius census (production sites), language-commit transaction design, test-refactor
  census. Findings land in this folder as they report.

## Design direction the findings force

- **Identifiers.** The prayer identifier becomes a closed slug union (`fajr`, `sunrise`, `dhuhr`,
  `asr`, `magrib`, `isha`, `midnight`, `last_third`, `suhoor`, `duha`, `istijaba`): language-neutral
  ASCII, already the de-facto key in preferences, notification ids and audio slugs, so no storage
  migration. The owner floated numeric ids; slugs carry the same guarantee with zero key churn and
  stay readable in logs. `PrayerRow.english` and `.arabic` die; a `PrayerId` field replaces them,
  and display names resolve at render time through the catalog. Open question Q15 puts the final
  call to the owner.
- **Storage.** Stored day rows keep id and time only; names never persist. Local migration, no
  refetch dependency.
- **The switch.** `commitLanguageSelection` modelled on `commitSoundSelection` under
  `withSchedulingLock`: compute once from arguments, in-place notification replaces on
  deterministic ids, channel re-creation on the same ids, widget timeline re-push, width-key
  switch, persisted intent marker so a killed commit completes or rolls back idempotently at next
  launch.

## Open questions with recommendations (the frontier)

| # | Question | Recommendation |
| --- | --- | --- |
| Q1 | Confirm the removal's reach: English users lose the Arabic column and the explanation box's Arabic line too | Yes; one language everywhere |
| Q2 | The "Show arabic names" toggle, atom and MMKV key | Remove; delete the key once at upgrade |
| Q3 | Pin layout LTR explicitly (Android mirrors today) | Yes, via the config plugin; ruling stands permanently |
| Q4 | Numerals at launch | Latin digits everywhere at 2.0.0, including Arabic; revisit per-locale after the numerals report |
| Q5 | First run and upgrade | Device locale matched to the shipped set, English fallback; existing installs stamp `en`; never location |
| Q6 | Settings surface | One row, globe icon, chevron, sheet like the sound sheet (D8 stands, minus the dead toggle) |
| Q7 | Staging | Two stages inside one 2.0.0 release: Arabic removal plus pipeline first, languages second; each ships to `uat` and is device-verified before the next |
| Q8 | Reminder audio language | Audio unchanged in every language at 2.0.0; the title text translates. Owner confirms whether the recordings speak |
| Q9 | Dates | Localise month names per language; formats unchanged |
| Q10 | Width cache | Keep; per-locale keys `prayer_max_english_width_<locale>_<standard/extra>`; today's values seed `en`; one reflow per switch |
| Q11 | Missing-name policy per locale | Transliterate per D15; suppress a row only where the locale's own timetables never publish it |
| Q12 | Launch size | Eight ready now, `ms` if Syuruk is accepted; hold sw, ha, pt for the first update |
| Q13 | Switch UX detail | Blocking progress UI, no cancel, auto-rollback on failure, success confirmation |
| Q14 | Versioning | Language release 2.0.0, global 3.0.0; 1.29.x continues until the 2.0.0 branch opens |
| Q15 | Identifier shape | Slug union, not numbers; zero key migration, readable in logs |

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

**The İmsak/Suhoor distinction, from the owner (2026-10-09):** Suhoor is the night window when
someone wakes, prepares and eats before Fajr (the beginning of the fast's eating window closing).
İmsak is the stop-eating marker shortly before Fajr, a safety precaution, usually within the last
five minutes. They are different moments, so a locale's Fajr-row label must name the prayer, never
the fast's end marker. Diyanet's table prints İmsak where the English table prints Fajr; that
convention ships only with the owner's explicit sign-off in the catalog pass, and any locale whose
sourced "Fajr" is actually an İmsak-style marker gets the same scrutiny.

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

Seven research agents were dispatched by the owner's instruction; all reported the same day. Full
reports live in `research/` as R8 to R14. Digests:

### First-run language (`research/R8-FIRST-RUN-LOCALE.md`)

- `expo-localization` at SDK 58 exports `getLocales`/`useLocales`/`getCalendars`/`useCalendars`
  only; no permission; no locale matcher, so RFC 4647 lookup is a small hand-rolled function
  (`id-ID` resolves to `id`, `ar-EG` to `ar`, fallback `en`).
- App Store and Play localisations govern the listing page only; nothing is injected into the app
  at install. The OS locale is the first-run mechanism.
- Recommended algorithm: while no explicit in-app choice exists, derive the language from
  `getLocales()` on every launch (and Android foreground return), which honours the OS per-app
  override on Android 13+ and iOS 13+ for free; the first explicit in-app choice persists and wins
  forever; existing installs stamp `en` once at upgrade rather than re-matching.

### Launch set (`research/R9-LAUNCH-SET.md`)

| Tier | Languages | State |
| --- | --- | --- |
| Ready | en, ar, id, ur, bn, fa, fr, tr | 8 to 11 of 11 names sourced; Turkish is the documented Diyanet exception |
| One sign-off | ms | JAKIM-sourced; "Syuruk" for Sunrise is the authority's own transliteration in a translated slot |
| Needs sourcing | sw, ha, pt | Congo is served by fr + sw; Nigeria is Hausa (5 null names, 5 explanations, then a speaker); Brazil is one `pt` file, the cheapest missing locale |

Recommended against: Igbo, Lingala. Post-launch order: uz, de, ru, hi, so, zh. Population sources:
Pew 2025, World Population Review 2026, UNFPA 2025.

### RTL pinning (`research/R10-RTL-PINNING.md`)

- Pin LTR through the `expo-localization` config plugin with `supportsRTL: false`, which writes
  `android:supportsRtl="false"` and `ExpoLocalization_supportsRTL = false`, applied natively
  before React loads: deterministic on the first frame, both platforms. A JS
  `I18nManager.allowRTL(false)` is wrong on SDK 58: next-launch-only, first-launch race, and
  rewritten by the module every launch.
- Arabic and Urdu inside `Text` nodes still shape and order RTL under the Unicode bidi algorithm
  with the line box anchored left (Android anchors RTL script left by default; iOS needs explicit
  `textAlign: 'left'` where natural alignment would anchor a pure-RTL paragraph right).
- Precedents for an LTR shell rendering RTL content: GitHub Mobile, Notion, Obsidian.

### Language commit transaction (`research/R11-LANGUAGE-COMMIT.md`)

- `commitLanguageSelection` modelled on `commitSoundSelection`: compute once from arguments, write
  a persisted intent marker before the atom moves, then under one `withSchedulingLock` acquisition:
  preference write, width-key switch, channel dedup-cache invalidation, channel re-creation on the
  same ids, full re-arm through the deterministic identifiers (in-place replace, no cancel pass,
  no zero-alarm window), widget re-push riding the reschedule. On failure, re-run the whole
  sequence on the previous selection inside the same acquisition; on double failure, keep the
  previous preference and leave the marker for the launch, foreground and background repair cycles.
- Crash windows: every death point analysed. Mid-re-arm death leaves mixed-copy requests, never
  zero alarms; the marker drives an idempotent forward-completion at next launch. Cancel is unsafe
  by the same argument: abandonment is already survivable, so a cancel button adds a second
  interruption path with no new guarantee.
- Existing suites already cover the commit shape (notificationSoundCommit, notificationAlertCommit,
  notificationSchedulingLock, the gate suites); new suites needed for the language commit, the
  crash windows, the locale-keyed width cache and per-locale widget payload runs.

### Numerals (`research/R12-NUMERALS.md`)

- CLDR 46 flipped `ar` to Latin digits (ar-EG and ar-SA stay Arabic-Indic); `fa` and `ps` are
  Persian-digit; `bn` is Bengali-digit; every other candidate locale is Latin.
- Authority practice matches: Dar al-Ifta, Diyanet, JAKIM, Jang and the Maghreb print Latin times
  online. Muslim Pro ships Latin in every sampled language; Mihrab hard-codes Latin with a named
  rationale; Al-Azan defaults to ICU then grew an explicit setting because Arabic users asked for
  Western digits.
- Recommendation: Latin for every launch locale except Persian digits for fa and ps and Bengali
  digits for bn; one choice applied to times, dates and countdowns; internal storage stays `HH:mm`
  Latin. The "Numerals: Western / Eastern Arabic" toggle is the one open sub-question (Q4).

### Blast radius (`research/R13-BLAST-RADIUS.md`)

- PrayerRow name fields: 5 write sites, 15 production read sites. Constants consumers across
  6 arrays. MMKV key builders: 4 families plus the index-to-name migration. OS identifiers and
  channel ids: 5 builders. Widget pipeline: 8 baking sites, 3 re-push paths, 10 renderer sites.
  English-pinned formatters: 6 in `shared/time.ts`. The `showArabicNamesAtom`: 3 consumers.
- **The stored day records already carry no name fields**: `prayer_YYYY-MM-DD` holds `date` plus
  nine lowercase slug-keyed time fields (`fajr` to `istijaba`, `shared/types.ts:108-122`). The
  owner's database concern is smaller than feared: the day cache is already language-neutral. The
  name-bearing storage is the scheduling bookkeeping records (`englishName`/`arabicName`) and the
  preference keys, both already slug-derived.
- Qibla copy is new since the inventory: `Qibla.tsx` (8 strings), `device/qibla.ts` (4),
  cardinal letters N/E/S/W (`shared/qiblaCompass.ts:92-97`), and `shared/qiblaPlace.ts` placeName
  follows the platform locale, not the app locale (a gap the sweep must close).
- Five silent seams ranked: storage-key duality, deterministic identifiers, the
  `canonicalPrayerIndex` fallback, name-keyed ordering and day rules, widget prop contracts across
  the serialization boundary.

### Test census (`research/R14-TEST-CENSUS.md`)

- 74 of 171 suites affected: 62 on English-name fixtures, 38 on the arabic field or
  `showArabicNames`, 24 on display copy, 18 on name-built keys and identifiers, 7 on widget
  props.
- The five largest refactors: schedule.test.ts (106 marker lines), notificationAlertCommit (~80),
  notifications.test.ts (63), prayer.test.ts (~55), widgetSimulation (~45).
- The riskiest single change is the commit-path signature (`(english, arabic)` pairs into
  `commitPrayerAlertChange`/`commitAlertMenuChanges`, eight suites); the second is the name-keyed
  MMKV migration tests.
- Confirmed untouched: the qibla sensor and math suites, time arithmetic, the animation and
  overlay-geometry suites, the sound commit suite (which the language commit copies).

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

Answers recorded 2026-10-09 are marked RULED. Rows still marked OPEN wait on the owner.

| # | Question | Status and ruling |
| --- | --- | --- |
| Q1 | The removal's reach: English users lose the Arabic column and the explanation box's Arabic line too | **RULED: yes.** One language absolutely everywhere; the bilingual identity disappears for every user, English included |
| Q2 | The "Show arabic names" toggle, atom and MMKV key | **RULED: wipe it all.** The Settings row, the atom and the stored key go; nothing relates to it any more |
| Q3 | Pin layout LTR explicitly (Android mirrors today) | **RULED: never mirror, either platform.** The layout is identical regardless of language: names column left, time centre, alert icons right. Pinned via the `expo-localization` plugin (`supportsRTL: false`), per `research/R10-RTL-PINNING.md`; confirms ruling D7 permanently |
| Q4 | Numerals at launch | **RULED: Latin digits everywhere at 2.0.0.** Times, countdown (`1H 10M`), dates, every language including Arabic; `toArabicNumbers` is deleted with the Arabic explanation line. Per-locale digits (R12's fa/ps/bn finding) and the numerals toggle are deferred to a later session |
| Q5 | First run and upgrade | **RULED: device locale matched against the shipped set, English fallback.** Existing installs stamp `en` once at upgrade (part of the approved recommendation, R8 item 4); never location |
| Q6 | Settings surface | **RULED: yes.** One row, globe icon, chevron, opening a language sheet built like the sound sheet |
| Q7 | Staging | **RULED: delegated.** The owner handed staging to the planning session's design; two stages inside one 2.0.0 release stands as the working shape |
| Q8 | Reminder audio language | **RULED: unchanged, 100%.** All athan and reminder files (99) stay exactly as they are for every language; the audio is recorded Arabic, so it carries no English to translate. The notification TEXT translates to the selected language. Re-recording one language would take over six months; the option is closed |
| Q9 | Dates | **RULED: localise month names per language, Gregorian and Hijri; formats and day-month order unchanged.** The Gregorian/Hijri toggle in Settings stays, independent of language; English Hijri months remain today's English transliterations, each language carries its own. Verified 2026-10-09: one `Intl` call per calendar localises both for `id`, `en`, `ar`, `tr`, `ms` (Indonesian renders "Juli" and "Safar"; CLDR carries Hijri month names per locale), so the mechanism is the existing formatter with the locale tag swapped |
| Q10 | Width cache | **RULED: keep it.** Per-locale keys `prayer_max_english_width_<locale>_<standard/extra>`; today's values seed `en`; one reflow per switch |
| Q11 | Missing-name policy per locale | **RULED: transliterate, always.** Every language can transliterate the eight Arabic-term slots; a missing sourced name means writing the transliteration in that language's script. No suppression, no English fallback (refines D15) |
| Q12 | Translation mechanism and launch size | OPEN, under adversarial review by three research agents (architecture on its merits, identifier design, scale and fonts). The owner's challenge stands: the best solution in general, not the best fit for the current code. His top-20-languages lean and the fonts question sit inside this review |
| Q13 | Switch failure UX | **RULED: the sheet reopens on the previous language with one line, "Language change failed, try again", and the app is exactly as it was.** No toast, no error screen. Failure detection is the persisted intent marker (`research/R11-LANGUAGE-COMMIT.md`): written before the commit, cleared only on full success, so a surviving marker drives idempotent forward completion at next launch |
| Q14 | Versioning and branching | **RULED.** main is the 1.29.x release line (PR #168 advances it; the branch protection requires a PR and forbids merge commits, so it lands squash-merged); uat is the v2 integration line where all 2.0.0 work lands and fleet device testing happens; uat reaches main by the same PR flow when 2.0.0 ships; going global later is 3.0.0 with the same workflow. The README updates to 2.0 when the v2 work opens |
| Q15 | Identifier shape | OPEN, under adversarial review. The owner rejects inertia as a reason ("just because I have something in place does not mean it is good"); slug union versus numeric enum versus branded types goes to the verdict |
| Q16 | The language sheet's list | **RULED: native names** ("Bahasa Indonesia", "Türkçe"), sorted alphabetically, English spelled "English" |
| Q17 | The Turkish Fajr row and the authority exceptions | **RULED: no İmsak anywhere.** The five daily prayers are transliterated in every language, absolutely no exceptions, regardless of local habit: Fajr, Dhuhr, Asr, Magrib, Isha in each language's own orthography. Verified: İmsak is the Arabic verbal noun of "to hold back", the start of fasting, a different moment that carries different meanings across languages, while Fajr is never misunderstood. This cancels R9's Turkish Diyanet wholesale exception and returns the Uzbek, Bosnian, Albanian and Chinese labels for the eight transliterated slots to the rule |

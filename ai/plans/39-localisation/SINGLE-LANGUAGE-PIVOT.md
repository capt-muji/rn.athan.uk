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
| 6 | Numerals: `toArabicNumbers` serves only the dying Arabic explanation line; all times are Latin `HH:mm`; **corrected 2026-10-10: Gregorian dates format through date-fns English tokens (`shared/time.ts:232`), Hijri through `Intl` pinned `en-US` (`:243`)** | `shared/text.ts`; `shared/time.ts:229-254` |
| 7 | `expo-localization` is not installed; locale reads need no permission | `package.json` |
| 8 | Reminder audio is recorded in-house, one mp3 per prayer and interval; whether the recordings speak English words is owner knowledge | `README.md`; `assets/audio/reminders/` |
| 9 | **Corrected 2026-10-10 (CNT-14): the stored day rows carry NO name fields**; `prayer_YYYY-MM-DD` holds `date` plus nine lowercase time fields (`shared/types.ts:108-122`). The name-bearing storage is the scheduling bookkeeping records (`englishName`/`arabicName`) and the preference keys, both slug-derived; times are `HH:mm` strings; the "database" is MMKV plus stored row objects, not SQL columns | `stores/database.ts`; `shared/types.ts:108-122` |
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

### The adversarial round (R15 to R17, dispatched by the owner's instruction)

- **Identifier design (`research/R15-IDENTIFIER-DESIGN.md`).** Space-form slug union on a field
  renamed `id`, the underscore demoted to a filename slug, the shared name parameter in
  `genNotificationContent` split in two, and a four-part `prayerIdContract.test.ts` gate (freeze
  table, disk join, catalog closure, `@ts-expect-error` firewall). The hostile pass caught the
  plan's own `last_third` spelling as a landmine that would have silently reset every Last Third
  preference and orphaned its alarms.
- **Architecture (`research/R16-ARCHITECTURE.md`).** Best practice for this shape, not a
  band-aid, once six forced changes land: the tested TS-to-i18next-JSON bridge (round-trip parity
  in CI), flat catalogs, the 3T first-catalog require-timing pre-flight with the JSON.parse
  fallback decision written down first, the plural guard in the first catalog commit, an explicit
  OTA ruling, and the PluralRules canary. The counter-proposal (Lingui plus Crowdin, the Bluesky
  stack) is the right answer at 50 locales with community proofreaders, not at 8 with none.
- **Scale and fonts (`research/R17-SCALE-AND-FONTS.md`).** Top-20-by-speakers is the wrong list
  (double-counts, misses fa/ps/ha/so/ku/uz); ship the D15 eight, add quarterly (ms, pt, uz, then
  sw, ha when speakers close them, then ru, hi); never build ln, ig, ja, ko, vi, Nigerian Pidgin.
  No font bundles on either platform (Android 9 fonts.xml decoded from AOSP pie-release; iOS 18
  system list verified); Urdu renders Naskh on the 3T and Nastaliq bundling is rejected (2.5em
  span versus the fixed 57px row); the real per-locale font work is line-height constants (1.4em
  Arabic, 1.5em Devanagari/Thai/Bengali) plus 3T checks. Corrections carried into the record:
  the catalog figure is 5,317 B of raw source, not gzipped; the bundle denominator is 4.4MB in
  the localisation plan and 4.9MB in the newer global measurements, conclusion unchanged; R17's
  Turkish row is annotated "Diyanet labels", which D27 supersedes (the language ships; its labels
  transliterate).

### Upgrade path (`research/R18-UPGRADE-PATH.md`)

The owner asked what the 2.0.0 upgrade should do. Verdict: no wipe, no schema bump, three
key-state-guarded migrations, the existing forced reschedule, the What's New ritual. The wipe is
rejected on measurement (offline users lose the timetable for the upgrade session; alarms become
unmanageable offline; the dead toggle key survives the wipe because it matches the
`preference_` whitelist). The bump is rejected because no stored family changes shape: the day
records never held name fields, the bookkeeping records' extra `arabicName` field is ignored by
parse, and the identifier bytes are frozen. Every crash window converges through key-absence
guards; the test suites are named in the report.

## Design direction the findings force

- **Identifiers** (`research/R15-IDENTIFIER-DESIGN.md`, adversarial verdict). The prayer identifier
  is a closed slug union whose values are the byte-exact lowercase forms already on disk:
  `fajr`, `sunrise`, `dhuhr`, `asr`, `magrib`, `isha`, `midnight`, `last third` (space, not
  underscore), `suhoor`, `duha`, `istijaba`. The space form is load-bearing: the preference keys
  and armed OS identifiers carry it byte-for-byte, so it is canonical; the underscore form is a
  derived filename slug for res/raw surfaces only. The row field renames `english` to
  `id: PrayerId` (a field named english holding a non-English-forever id is a lie the compiler
  cannot catch), `arabic` leaves the row, `genNotificationContent`'s shared name parameter splits
  (sound from the id, title from the label), and a `prayerIdContract.test.ts` gate pins the
  frozen bytes, joins the 67 audio files, closes every catalog over exactly the 11 ids, and
  firewalls display strings from key builders with `@ts-expect-error`. Numeric enums lose:
  unsound in TypeScript (numbers are assignable to numeric enum types), forfeit both natural
  alignments, and orphan armed alarms unless a map imitates the legacy strings.
- **Storage.** Stored day rows keep id and time only; names never persist. Local migration, no
  refetch dependency.
- **The switch (superseded by D34, 2026-10-10: forward-only convergence replaces this item's
  rollback shape; see `RECONCILIATION.md`).** `commitLanguageSelection` modelled on
  `commitSoundSelection` under `withSchedulingLock`: compute once from arguments, in-place
  notification replaces on deterministic ids, channel re-creation on the same ids, widget
  timeline re-push, width-key switch, persisted intent marker so a killed commit completes or
  rolls back idempotently at next launch.

## Synthesis pass (R19, 2026-10-09): findings and repairs

A cold reviewer read the whole record against itself and returned 23 findings. The transaction
core (R11, R15, R18 on identifier bytes, same-id replace, no wipe, no schema bump) is consistent.
The repairs and dispositions:

- **Launch set (findings 1, 2):** D1's "at least the top 20" predates the pivot and the adopted
  verdict is marked adopted, not ruled, so the launch count returns to the owner as Q20 below.
  The two candidate eights differ on `fa` (R9's ranking) versus `de` (D15's set); R12 and R17
  both treat `fa` as launch-grade. Q20 puts the final set in the owner's words.
- **Language atom shape (finding 8):** reconciled to R8's algorithm. The atom is nullable
  (`preference_language`, null until an explicit choice); null means derive from the device
  locale on every launch; R18's upgrade stamp writes non-null `'en'`, which is exactly the
  existing-install pin. R18's "defaulting to `en`" wording described the rendered fallback, not
  the stored shape; the plan specifies the nullable form.
- **The commit marker key (finding 9):** named `preference_language_commit_pending`, holding
  target and previous locale, written before the atom moves, cleared only on full success. It
  joins `preference_language` on the ask-first sign-off list in the decision block.
- **R18's migration order (finding 10):** `migrateIndexKeyedAlertPreferences` remains the last
  EXISTING migration; `migrateToLocaleDefaults` inserts after it. The plan states this once.
- **String numbers (finding 11):** totals from the pivot's same-day run (205 literals, 123
  display copy); per-file detail from R13. The catalog corpus figure is reconciled as: 123
  display strings plus 25 widget strings plus the 16 religious terms; R2's "178 UI strings" and
  R17's "129 strings" measured subsets (post-widget, prayer-names-only) and are not totals.
- **Arabic line-height floor (finding 12):** R3's fontTools-measured 1.70em span governs as the
  floor, superseding R17's 1.4em figure; the plan's per-script constants take the measured
  numbers and verify on the 3T.
- **R17's script sentence (finding 13):** corrected: Bengali IS required at launch (`bn` is in
  the eight), Devanagari is not (`hi` is post-launch), Urdu brings Arabic script only.
- **R12's premise (finding 14):** D21 governs (Latin everywhere at 2.0.0); R12's fa/ps
  launch-set framing and its toggle are the deferred post-2.0.0 material.
- **Q8's premise (finding 18):** the audio ruling is safe as a decision (unchanged regardless);
  the "no English to translate" premise is owner testimony, now recorded as such.
- **Q9's coverage gap (finding 19):** month-name localisation verified for `id, en, ar, tr, ms`
  only; `ur, bn, fr, de` verification joins the plan's pre-flight checks.
- **R14's assumption (finding 20):** its census assumed `.english` survives; R15 renames it to
  `id`. Counts remain valid as magnitudes.
- **JSON posture (finding 21):** R5's "no JSON files" is the design; R16's JSON.parse fallback
  is the pre-decided contingency if the 3T first-catalog timing fails. Both stand.
- **Bundle denominator (finding 22):** 4.4MB in the localisation research, 4.9MB in the newer
  global measurements; conclusions hold under both.
- **Supersede banners (findings 3, 4, 7, 15, 16, 17):** added to R9, ONE-OR-TWO-LANGUAGES,
  SPLIT, D8, D15, D16, CONSTRAINTS C6 and C8.
- **Missing decisions (finding 23), dispositioned:** (a) the post-pivot width question is the
  per-locale measurement machinery (Q10), with a per-locale max-width sanity guard in the plan;
  (b) atom shape above; (c) 2.0.0 declares `supportedLocales` / `CFBundleLocalizations` exactly
  matching the picker set (R8 item 2), with the direction interaction verified against the
  `supportsRTL: false` pin in the plan's pre-flight; (d) the qibla `placeName` gap closes by
  formatting the geocoded place through the app locale (`Intl.DisplayName`), a stage-two step
  that touches no sensor code (D20) - **superseded 2026-10-10 (ARCH-2/C13): Hermes ships no
  `Intl.DisplayNames` and it names codes, not cities; row 39 re-asks the owner between a named
  exception to D17 (proper nouns as the geocoder returns them) and hiding the line when the
  languages differ**; (e) every authority-exception label needs per-locale
  sign-off under D27, extending beyond `ms` Syuruk; (f) a byte-parity test pins catalog `en`
  output to today's literals, the fact R18's no-op-replace argument rests on; it joins the
  `prayerIdContract` gate in stage one.

**Q20 (owner): the launch set.** R9's ranked eight are `en ar id ur bn fa fr tr` (Persian is
READY, sixth by reach, ~110M Muslims, and R12 and R17 treat it as launch-grade); D15's recorded
eight swap `fa` for `de`. Recommendation: ship R9's eight WITH Persian (`fa`) and hold German
for the first quarterly add: Persian outreaches Turkish and German combined and the catalog is
READY; German's sunrise word was the width problem the pivot dissolved. Confirm `en ar id ur bn
fa fr tr`, or name the set.

**Q21 (owner): RTL text alignment inside the frozen LTR layout.** Your ruling froze the layout:
names left, time centre, icons right, in every language. The refinement the old research
proposed (P4) and never built: inside an LTR box, multi-line RTL prose (the help modal, the
explanation text, in Arabic and Urdu) reads better right-aligned with `direction: 'rtl'` on
those text nodes only; single-word labels stay left. This is visible behaviour, so it is yours.
Recommendation: right-align RTL prose only, left-anchor every single-line label; nothing mirrors.

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
| Q9 | Dates | **RULED: localise month names per language, Gregorian and Hijri; formats and day-month order unchanged.** The Gregorian/Hijri toggle in Settings stays, independent of language; English Hijri months remain today's English transliterations, each language carries its own. Verified 2026-10-09: one `Intl` call per calendar localises both for `id`, `en`, `ar`, `tr`, `ms` (Indonesian renders "Juli" and "Safar"; CLDR carries Hijri month names per locale), so the mechanism is the existing formatter with the locale tag swapped. **Mechanism superseded 2026-10-10 (ARCH-3/A2, verified: the Gregorian label is date-fns with no Somali locale, and an `Intl` swap changes order, era affixes and Thai's year): month and weekday names become catalog entries, 31 keys per locale. The ruling stands; the mechanism is row 39's to build** |
| Q10 | Width cache | **RULED: keep it.** Per-locale keys `prayer_max_english_width_<locale>_<standard/extra>`; today's values seed `en`; one reflow per switch |
| Q11 | Missing-name policy per locale | **RULED: transliterate, always.** Every language can transliterate the eight Arabic-term slots; a missing sourced name means writing the transliteration in that language's script. No suppression, no English fallback (refines D15) |
| Q12 | Translation mechanism and launch size | **VERDICT DELIVERED (R16, R17), adopted.** Architecture: TS catalogs plus a hand-rolled `t()` is best practice for this shape, not a band-aid, PROVIDED the six forced changes land (tested TS-to-i18next-JSON bridge with CI round-trip parity, flat catalogs, 3T first-catalog require-timing pre-flight, plural guard in the first catalog commit, an explicit OTA ruling, the PluralRules canary). Launch size: the D15 eight (`en ar id ur bn tr fr de`) at 2.0.0; quarterly adds `ms`+`pt`+`uz`, then `sw`+`ha` when one speaker each closes them, then `ru`+`hi`; never `ln`, `ig`, `ja`, `ko`, `vi`, Nigerian Pidgin. Top-20-by-speakers is the wrong list: it double-counts and misses fa/ps/ha/so/ku/uz (200M+). No fonts bundle on either platform; the real per-locale font work is line-height constants plus 3T checks. Two sub-rulings await the owner at plan review: the OTA ruling (recommendation: no OTA at 2.0.0, store releases only) and the `ms` Syuruk sign-off (folds into the quarter `ms` ships) |
| Q13 | Switch failure UX | **RULED: the sheet reopens on the previous language with one line, "Language change failed, try again", and the app is exactly as it was.** No toast, no error screen. Failure detection is the persisted intent marker (`research/R11-LANGUAGE-COMMIT.md`): written before the commit, cleared only on full success, so a surviving marker drives idempotent forward completion at next launch |
| Q14 | Versioning and branching | **RULED.** main is the 1.29.x release line (PR #168 advances it; the branch protection requires a PR and forbids merge commits, so it lands squash-merged); uat is the v2 integration line where all 2.0.0 work lands and fleet device testing happens; uat reaches main by the same PR flow when 2.0.0 ships; going global later is 3.0.0 with the same workflow. The README updates to 2.0 when the v2 work opens |
| Q15 | Identifier shape | **VERDICT DELIVERED (R15), adopted:** the closed slug union in the space form, field renamed `id: PrayerId`, the parameter split and the contract-test gate as specified in the design-direction section. Numeric enums rejected (unsound, misaligned, alarm-orphaning) |
| Q16 | The language sheet's list | **RULED: native names** ("Bahasa Indonesia", "Türkçe"), sorted alphabetically, English spelled "English" |
| Q17 | The Turkish Fajr row and the authority exceptions | **RULED: no İmsak anywhere.** The five daily prayers are transliterated in every language, absolutely no exceptions, regardless of local habit: Fajr, Dhuhr, Asr, Magrib, Isha in each language's own orthography. Verified: İmsak is the Arabic verbal noun of "to hold back", the start of fasting, a different moment that carries different meanings across languages, while Fajr is never misunderstood. This cancels R9's Turkish Diyanet wholesale exception and returns the Uzbek, Bosnian, Albanian and Chinese labels for the eight transliterated slots to the rule |
| Q18 | Hotfix path for a 1.29.x production defect during v2 | **RULED by recommendation, adopted:** branch off `main`, PR to `main`, cherry-pick to `uat` so v2 carries it forward |
| Q19 | The 2.0.0 upgrade approach | **VERDICT DELIVERED (R18), adopted: no wipe, no schema bump.** Targeted, key-state-guarded migration: the width seed at module-eval time, `migrateToLocaleDefaults()` stamping the language and deleting the dead toggle key, the existing forced reschedule reconciling copy and records organically, What's New unchanged. The wipe is rejected on three legs (offline suspension, alarm-management loss, the `preference_` whitelist keeping the dead key); D29 later demoted the offline leg from a constraint, and the verdict stands on the other two plus the no-shape-change fact. A schema bump is a category error: no stored family changes shape |
| Q20 | The launch set | **RULED, final: six for the confidence milestone - en, ar, ms, so, hi, th** - private, not for public release, chosen to exercise the hard rendering and sourcing dimensions (RTL, Devanagari, Thai metrics, JAKIM naming, from-scratch sourcing). Then a roadmap: fifteen, twenty (the D32 union), up to fifty, one flat catalog file per language. Malay, Indonesian and Somali guaranteed forever; Indonesian moves to the expansion pool; Chinese removed (store restrictions) |
| Q21 | RTL text alignment inside the frozen LTR layout | **RULED: left-align absolutely everything at 2.0.0**, exactly as English renders today: schedules, settings, sheets, help, What's New, every surface. Revisit as a later CSS-only refinement after 2.0.0 (D31) |
| Q22 | The two new storage keys | **RULED: approved as named** (`preference_language`, nullable, null follows the device locale; `preference_language_commit_pending`, the commit's intent marker) |
| Q23 | Malay Sunrise "Syuruk" | **RULED: accepted** (JAKIM's own table label), revisitable forever because each catalog term is one line in one flat per-locale file: accepting or declining any term later is a one-line edit, the condition the owner set |

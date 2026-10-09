# 06. Test strategy

Evidence: `evidence/test-infra.md`. Citations are `path:line` at base commit `c3149dfc`.

## What the repository already demands

- `yarn validate`: `tsc`, Biome with warnings as errors, Jest with a global 100 percent
  threshold over nine folders (`package.json:22`, `jest.config.js:110-138`).
- A changed-files gate that fails any changed code file below 100 percent
  (`scripts/check-changed-coverage.js:162-165`).
- A guard that fails on an export no production file reaches
  (`shared/__tests__/unusedExports.test.ts:16-54`). Every step in document 07 therefore lands
  a module together with its first production caller.
- No test reads the real clock (`__tests__/README.md:206-229`).
- Red before green, and a hand-run mutation pass on guarded logic. No mutation tool is
  configured (`evidence/test-infra.md` section 7).
- No snapshots, no style assertions (`__tests__/README.md:36-43`).

Every new suite copies an existing pattern. The table in `evidence/test-infra.md` section 4
names the file to copy for each.

## What must not change, and the existing tests that prove it

These suites keep their literal expectations. They change only the names of the functions they
call. A step that needs to edit a literal in one of them is wrong.

| Contract | Suite |
| --- | --- |
| OS identifiers, including `last third` with its space | `device/__tests__/notifications.test.ts:40-70`, `:346-390`; the identifier-to-instant maps in `stores/__tests__/notificationsClockChange.test.ts:45-152` and the three midnight suites |
| Preference keys and stored values | `stores/__tests__/notifications.test.ts:194-433`, `stores/__tests__/notificationPreferenceSetters.test.ts:99-176` |
| The index-key migration and the pre-1.0.27 order | `stores/__tests__/notifications.test.ts:223-345` |
| Channel ids, settings and English names | `shared/__tests__/notifications.test.ts:370-552`, `:706-741`, `device/__tests__/androidChannelUpdate.test.ts:30-56` |
| English titles | `shared/__tests__/notifications.test.ts:294-311`, `:663-672` |
| The 99 audio files | `shared/__tests__/audioMatrix.test.ts:62-176` |
| `AlertType` numbers, `ScheduleType` strings | `shared/__tests__/types.test.ts:16-41` |
| Both keep lists, exactly | `stores/__tests__/database.test.ts:533-578`, `stores/__tests__/version.test.ts:365-375` |
| Record keys | `stores/__tests__/database.test.ts:327-347`, `:411-431` |
| Schedule before cancel | `stores/__tests__/notifications.test.ts:1198-1210`, `:1303-1321` |
| The widget contract | `shared/__tests__/widgetContract.test.ts` |

The 43 suites that query screens by English text (`evidence/test-infra.md` section 5.9) keep
working unedited, for a reason worth stating: the default test device locale is `en-GB`, the
`en` pack reproduces today's bytes, and so every English query still finds its text. Only tests
of things this design removes are rewritten, and document 07 lists each.

## New harness pieces

| Piece | File | Notes |
| --- | --- | --- |
| Device locale mock | `shared/__mocks__/expo-localization.ts`, mapped in `jest.config.js:25-38` | `getLocales` returns `[{ languageTag: 'en-GB', languageCode: 'en' }]`; `mockDeviceLocales(tags)` changes it. Modelled on `shared/__mocks__/expo-constants.ts:7-31` |
| Titles in the in-memory OS | `stores/__tests__/alarmHarness.ts:76-109` | the fake OS keeps each request's `content.title` beside its identifier, and gains `titles(): Record<string, string>` next to `triggers()` |
| Channel fake with read-back | the same harness | an in-memory map of channel id to name behind `setNotificationChannelAsync` and `getNotificationChannelsAsync`, with a per-id refusal switch |
| A 1.x storage and OS fixture | `stores/__tests__/upgradeFixture.ts` | builds the MMKV contents and the pending OS set of a 1.29.291 install from literal keys, values and identifiers typed into the file. It calls no production key builder |
| A test-only second pack | inside the suites that need two languages | suites use `ar` from the registry. No fake pack is registered |

## New tests

Each row names the fault a hand mutation must turn red.

### Identity (document 01)

| Id | Suite | Proves | Mutation that must fail it |
| --- | --- | --- | --- |
| T-ID-1 | `shared/__tests__/prayers.test.ts` | the registry equals the table in document 01, row for row, and is frozen | swap two indices; flip one flag |
| T-ID-2 | `shared/__tests__/identifiers.test.ts` | every builder, for all eleven ids, against literals typed in the test: 55 preference keys, 11 repair keys, 11 at-time and 11 reminder identifiers for one date, 22 record keys, 66 audio names, 66 channel ids | change `last third` to `last_third` in the registry |
| T-ID-3 | the same file, a source-text guard in the style of `stores/__tests__/database.test.ts:500-579` | none of the frozen substrings appears in a production file other than `shared/identifiers.ts` | build a key by hand in a store |
| T-ID-4 | the same file | an independent oracle: for each id, the builder's output equals the 1.x expression applied to the 1.x English name, both typed into the test (`name.toLowerCase()`, and the slug's `replace(/\s+/g, '_')`) | any registry token edit |
| T-ID-5 | `shared/__tests__/prayer.test.ts` | `getCascadeDelay` returns the same ten numbers as on `uat` | use the Extras length |
| T-ID-6 | `shared/__tests__/audioMatrix.test.ts` | unchanged assertions, names now derived from the registry | none needed; the suite is the oracle |

### Catalog (document 02)

| Id | Suite | Proves |
| --- | --- | --- |
| T-CAT-0 to T-CAT-12 | `shared/locales/__tests__/catalogGate.test.ts` | gates G0 and G2 to G12, one `describe` each, as `it.each` over `LOCALES` |
| T-CAT-T | `shared/locales/__tests__/catalogTypes.test.ts` | G1, with one `// @ts-expect-error` line per row of the compile-error table in document 02. `tsc` includes test files (`tsconfig.json:13`), so a row that stops being an error fails `yarn validate` |
| T-CAT-7 | `shared/__tests__/time.test.ts` | English parity. For every day of 2026: `formatDateLong(day, en)` equals date-fns `format(day, 'EEE, d MMM yyyy')`, and `formatHijriDateLong(day, en)` equals the `Intl` long form the function produced on `uat`, both computed in the test. `formatTime` and `formatTimeAgo` keep their pinned outputs (`shared/__tests__/time.test.ts:114-162`) |
| T-FMT | `shared/__tests__/i18n.test.ts` | `format`: no parameters, one, several, a repeated placeholder, a numeric value becoming ASCII digits |

### Language state (document 03)

| Id | Suite | Proves |
| --- | --- | --- |
| T-LANG-1 | `stores/__tests__/languageMatch.test.ts` | `matchDeviceLocale` as a table: exact code, region tag, second entry wins when the first is unsupported, case, a `match` list, nothing matches, empty list |
| T-LANG-2 | `stores/__tests__/languageFirstRun.test.ts`, each case in `jest.isolateModules` | absent key: detected, written once, bare string. Present key: not re-detected when the device locale differs. Unknown stored code: replaced. `getLocales` throws: English |
| T-LANG-3 | the same file | a preview pack is selectable outside production and not in it |

### The switch (document 03)

All on fake timers with the alarm harness, wired as in
`stores/__tests__/notificationsClockChange.test.ts:8-30`. One suite,
`stores/__tests__/languageSwitch.test.ts`. The numbers are the rows of the failure table in
document 03.

| Id | Scenario | Asserts |
| --- | --- | --- |
| T-SW-0 | a clean switch `en` to `ar` with five bells on | the identifier set is unchanged; every title is Arabic; no identifier was ever absent (schedule before cancel order); baked is `ar` |
| T-SW-1 | `setLanguage` with no pass, then `refreshNotifications` inside a closed 2 hour gate | a full pass runs and stamps |
| T-SW-2 | the fake OS rejects after the third arm and the pass throws; then a refresh | converges; identifiers unchanged throughout |
| T-SW-4 | one arm refused | that identifier keeps its old title and its record; no stamp; the repair-only branch is not taken; the next refresh stamps |
| T-SW-7 | one channel rename refused | arming completes; no stamp; the next pass renames only what differs |
| T-SW-8 | no stored day | nothing armed, nothing cancelled, no stamp |
| T-SW-9 | two switches before the first pass starts | both passes bake the last choice |
| T-SW-10 | a switch enqueued while a pass is mid-flight | the first pass stamps what it captured; the second bakes the new language |
| T-SW-11 | an alert commit queued behind a switch | its one prayer arms in the new language |
| T-SW-N | the no-op | selecting the current, baked language starts no pass |

### Baked surfaces (document 04)

| Id | Suite | Proves |
| --- | --- | --- |
| T-N-1 | `shared/__tests__/notifications.test.ts` | for every pack, prayer and interval: a non-empty title that contains the pack's prayer name and only ASCII digits |
| T-N-2 | `stores/__tests__/reminderImminent.test.ts` | red on `uat`: a pass 20 seconds before an armed reminder cancels it. Green after: the request and its record survive. With no record, the day is still skipped |
| T-CH-1 | `shared/__tests__/channelNames.test.ts` | `syncAndroidChannelNames`: a differing name is set with the creator's exact config; a matching one is not touched; an id that is not the app's is not touched; a rejection gives `false` and the rest still run; it never rejects; off Android it makes no native call |
| T-W-1 | `shared/__tests__/widgetTimeline.test.ts`, `widgetSnapshot.test.ts` | names, hero names, footer and the `strings` subsets of document 04, per pack |
| T-W-2 | `shared/__tests__/widgetTimeline.test.ts` | the serialised three-day payload of the longest pack stays under the existing limit (`:725-726`) |
| T-W-3 | `shared/__tests__/widgetRenderer.test.ts`, `widgetLockRenderer.test.ts` | a layout draws prop strings when present and the fallback when absent, per key |
| T-W-4 | the same suites | text parity: a fixture of 1.x props (version 5, `dateLabel`, no `strings`) and the 2.0.0 props built for `en` from the same sequence draw the same text markers. This is what licenses re-pinning the twelve digests in `shared/__tests__/widgetSimulation.test.ts:645-686` |
| T-W-5 | `widgetRenderer.test.ts` | `undefined` props draw the neutral card and do not throw |
| T-W-6 | `shared/__tests__/widgetContract.test.ts` | the closure walk covers all three lock functions, closing the gap at `:73-88`; `environment` is imported unaliased |
| T-ROW-1 | `components/prayer/__tests__/Prayer.test.tsx` | one name per row from the catalog; no second name; `numberOfLines` 1 |
| T-ROW-2 | `components/ui/__tests__/InitialWidthMeasurement.test.tsx` | eleven hidden texts; each layout event reaches the atom of the current language and schedule; a switch measures into the other language's atom |
| T-ROW-3 | `stores/__tests__/ui.test.ts` | `nameWidthKey('en', ...)` equals the two 1.x key literals; other locales get the suffixed key; grow-only per key |
| T-ROW-4 | `components/sheets/screens/__tests__/Settings.test.tsx`, `Language.test.tsx` | the row opens the sheet; a row press commits and dismisses; the selected row is marked; no `Show arabic names` |
| T-ROW-5 | `shared/__tests__/nativeConfig.test.ts`, plus a plugin suite in the style of the existing plugin tests | `app.json` has no `locales` key and no `CFBundleLocalizations`; `./plugins/ltrOnly` is registered; the plugin sets `android:supportsRtl` to `false` and is idempotent |

### Upgrade (document 05)

One suite, `__tests__/app/upgradeTo2.test.tsx`, built on `stores/__tests__/upgradeFixture.ts` and
the install pattern of `__tests__/app/index.test.tsx:130-151`.

| Id | Scenario | Asserts |
| --- | --- | --- |
| T-UP-1 | 1.29.291 storage and pending set, device `en-GB`, launch 2.0.0 | every `preference_alert_*`, `preference_reminder_*` and `preference_sound` key and value deep-equals the fixture; the pending identifier set equals the fixture's still-due set; no cancel was issued for a still-due identifier |
| T-UP-2 | the same | every title equals the fixture's title, byte for byte |
| T-UP-3 | the same with device `ar-SA` | identifiers as T-UP-1; every title is Arabic; baked is `ar` |
| T-UP-4 | the same | the key set after launch is the fixture's plus `preference_language` and `preference_language_baked`; `preference_show_arabic_names` is still there with its value |
| T-UP-5 | records in the 1.x shape, one of them for a prayer since turned off | the stale record's identifier is cancelled and its record removed, so 1.x records are honoured |
| T-UP-6 | no network | the lists are on screen from the cache; `cache_schema_version` is still `1` |
| T-UP-7 | killed after the language is written, before the pass; then a second launch | converges as T-UP-1 or T-UP-3 |

## Time zones

Steps that touch `shared/time.ts` run `yarn test:tz` (`package.json:20`). T-CAT-7 runs under all
four zones through it.

## The mutation pass

By hand, on these, each reverted after it turns its named test red:

1. each of the three conditions of the stamp (document 03, step 6);
2. `languageNeedsBake()` dropped from the gate;
3. the capture of the language moved below the bail, and replaced by a fresh read at the stamp;
4. one registry token;
5. `matchDeviceLocale`'s prefix test without the `-`;
6. the imminent-reminder branch's record check;
7. `text(key)` in a layout returning the fallback always.

## Device gates

Jest measures no width, no glyph, no system setting and no real alarm
(`evidence/test-infra.md` sections 3.1 and 3.3). These are proven on devices, with a dump or a
log line and never a screenshot (`ai/AGENTS.md`, Device testing). Alarm times are driven by
moving the clock or by mock data, never by waiting.

| Id | What | Pass | Blocks |
| --- | --- | --- | --- |
| D-1 | Arabic selected: a short and a long name in the row, Android and iOS | the accessibility snapshot shows every name box starting at the same left x as in English | S12 |
| D-2 | switch language, open the system's channel list | channel names are in the new language with no app restart; a Sound alert on a renamed channel still plays its athan | S10 |
| D-3 | arm three alerts, switch language | `yarn check:device` shows the same identifiers, one pending request each; a fired alert carries the new title at its exact instant | S10 |
| D-4 | iOS, device numbering system set to Arabic-Indic | the widget countdown shows Latin digits; no black widget | S11 |
| D-5 | each shipped language on the small, medium and lock widgets, Friday Extras included | no clipped name at the smallest granted size | a pack's `release` tier |
| D-6 | Android with Arabic as the first system language, fresh install | name left, icon right, on the first launch | S12 |
| D-7 | update a real 1.29.x install with alerts armed to the 2.0.0 build, with and without a network | identifiers unchanged in `check:device`; the timetable is on screen offline | the release |
| D-8 | Thai and Hindi selected | no clipped mark above or below any line in the row, the sheets and the overlay | a pack's `release` tier |

## End-to-end flows

Five of six Maestro flows assert `London, UK`, and `swipes-x15` waits on `Midnight` and `Fajr`
(`evidence/test-infra.md` section 6). They run on an English device and keep passing. No flow is
rewritten to test ids in this work. One flow is added, `e2e/flows/language-switch.yaml`: open
Settings, open Language, pick the second row, assert the first prayer row's new name, switch
back.

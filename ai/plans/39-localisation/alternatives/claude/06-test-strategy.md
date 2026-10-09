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

These suites keep every literal key, identifier, channel id, file name and title they expect
today. What changes in them is how a prayer is passed: an id where a name, or a schedule and an
index, went before. A step that needs to change an expected literal in one of them is wrong.
The cases that cannot survive that change of input are listed after the table.

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
| Schedule before cancel | `stores/__tests__/notifications.test.ts:1303-1321`, with its order helpers at `:1198-1210` |
| The widget contract | `shared/__tests__/widgetContract.test.ts` |

Existing cases that are removed or rewritten, each in the step that removes its subject:

| Case | Why it cannot stay | Step | Replacement |
| --- | --- | --- | --- |
| `device/__tests__/notifications.test.ts:58-61`: the same name under two schedules gives two identifiers | an id belongs to one schedule, so the pair cannot be written | S2 | T-ID-2, which pins all 22 identifiers by literal |
| `device/__tests__/notifications.test.ts:52-56` and `shared/__tests__/notifications.test.ts:284-285`: a lower-case name is accepted | there is no name to fold | S2 | none: the input no longer exists |
| `stores/__tests__/notifications.test.ts:98-170`, `:515-571`: `getPrayerArrays`, `canonicalPrayerIndex` | both functions are deleted | S2 | T-ID-1 and the loading-frame cases of the hook suite |
| `shared/__tests__/notifications.test.ts:124-125`, `:187-188`: plan keys `standard_Fajr` | the plan is keyed by id | S2 | the same assertions on ids |
| `stores/__tests__/database.test.ts:315-322`, `:399-406`: a record holds `englishName` and `arabicName` | the record shape changes | S2 | the new shape, plus one case that reads a 1.x-shaped record |
| `shared/__tests__/constants.test.ts:31-56`, `:63-85`: the name arrays and their lengths | the arrays are deleted | S2, S4, S12 as each array goes | T-ID-1, G8 |
| `stores/__tests__/notificationRefreshGate.test.ts:123-167`: a closed gate skips | an unbaked language opens the gate | S10 | unchanged assertions; the harness now starts with a baked language |
| `shared/__tests__/text.test.ts`, the bilingual cases of `Prayer.test.tsx:23-41`, the toggle cases of `Settings.test.tsx:59-65`, `:256-267` | their subjects are deleted | S12 | T-ROW-1, T-ROW-4 |
| The twelve digests at `shared/__tests__/widgetSimulation.test.ts:645-686` | props gain fields | S11 | re-pinned after T-W-4 is green |

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
| Language in the alarm harness | `stores/__tests__/alarmHarness.ts:83-109` | `resetAlarms` clears storage behind the atoms, which the persisted-atom rule forbids for the two new ones. After clearing it sets the language to `en` and the baked value to `en` through the store, so every existing gate suite starts from a baked language |

## New tests

Each row names the fault a hand mutation must turn red.

### Identity (document 01)

| Id | Suite | Proves | Mutation that must fail it |
| --- | --- | --- | --- |
| T-ID-1 | `shared/__tests__/prayers.test.ts` | the registry equals the table in document 01, row for row, and is frozen | swap two indices; flip one flag |
| T-ID-2 | `shared/__tests__/identifiers.test.ts` | every builder, for all eleven ids, against literals typed in the test: 55 preference keys, 11 repair keys, 11 at-time and 11 reminder identifiers for one date, 22 record keys, 66 audio names, 66 channel ids | change `last third` to `last_third` in the registry |
| T-ID-3 | the same file, a source-text guard in the style of `stores/__tests__/database.test.ts:500-579` | no frozen substring appears in the non-comment code of `stores/`, `device/` or `shared/` outside `shared/identifiers.ts` and the two keep lists (document 01). Lands in S2, when the last hand-built string leaves | build a key by hand in a store |
| T-ID-4 | the same file | an independent oracle: for each id, the builder's output equals the 1.x expression applied to the 1.x English name, both typed into the test (`name.toLowerCase()`, and the slug's `replace(/\s+/g, '_')`) | any registry token edit |
| T-ID-5 | `shared/__tests__/prayer.test.ts` | `getCascadeDelay` returns the same ten numbers as on `uat` | use the Extras length |
| T-ID-6 | `shared/__tests__/audioMatrix.test.ts` | unchanged assertions, names now derived from the registry | none needed; the suite is the oracle |

### Catalog (document 02)

| Id | Suite | Proves |
| --- | --- | --- |
| T-CAT-0 to T-CAT-12 | `shared/locales/__tests__/catalogGate.test.ts` | gates G0 and G2 to G12, one `describe` each, as `it.each` over `LOCALES` |
| T-CAT-T | `shared/locales/__tests__/catalogTypes.test.ts` | G1, with one `// @ts-expect-error` line per row of the compile-error table in document 02. `tsc` includes test files (`tsconfig.json:13`), so a row that stops being an error fails `yarn validate`. It also holds the calls that must compile: `t(prayerNameKey(id))`, `t(EXPLANATION_KEYS[id])` and each date helper with no parameter object, and a `// @ts-expect-error` on `t(key)` where `key` is typed `MessageKey` |
| T-PAR-1 | `shared/__tests__/time.test.ts` | English parity. For every day of 2026: `formatDateLong(day, en)` equals date-fns `format(day, 'EEE, d MMM yyyy')`, and `formatHijriDateLong(day, en)` equals the `Intl` long form the function produced on `uat`, both computed in the test. `formatTime` and `formatTimeAgo` keep their pinned outputs (`shared/__tests__/time.test.ts:114-162`) |
| T-FMT | `shared/__tests__/i18n.test.ts` | `format`: no parameters, one, several, a repeated placeholder, a numeric value becoming ASCII digits |

### Language state (document 03)

| Id | Suite | Proves |
| --- | --- | --- |
| T-LANG-1 | `shared/locales/__tests__/match.test.ts` | `matchDeviceLocale` as a table: exact code, region tag, second entry wins when the first is unsupported, case, a `match` list, nothing matches gives `null`, empty list gives `null`. `readStoredLanguage`: a selectable code, an unknown code, absent |
| T-LANG-2 | `stores/__tests__/languageFirstRun.test.ts`, each case in `jest.isolateModules` | the four rows of the first-run table in document 03. Absent key and a match: written once, as a bare string. Absent key and no match: English, and the key is still absent after launch. Present key: not re-detected when the device language differs. Unknown stored code: key removed, then the two rows above. `getLocales` throws: English, nothing written |
| T-LANG-3 | the same file | a preview pack is selectable outside production and not in it |

### The switch (document 03)

All on fake timers with the alarm harness, wired as in
`stores/__tests__/notificationsClockChange.test.ts:8-30`. One suite,
`stores/__tests__/languageSwitch.test.ts`. The numbers are the rows of the failure table in
document 03. Rows 1, 2 and 3 are process deaths, which Jest cannot stage; T-SW-1, T-SW-4 and
T-SW-3 each start from the state one of them leaves. Row 14 is a lost storage write and has no
test: the state it leaves is the state before the switch. Cases that call
`commitLanguageSelection` land in S13; the rest land in S10 and set the language through the
atom.

| Id | Scenario | Asserts |
| --- | --- | --- |
| T-SW-0 | a clean switch `en` to `ar` with five bells on | the identifier set is unchanged; every title is Arabic; no identifier was ever absent (schedule before cancel order); baked is `ar` |
| T-SW-1 | the language atom set with no pass, then `refreshNotifications` inside a closed 2 hour gate | a full pass runs once and stamps; a second refresh in the same process with the language unbaked again runs no full pass (the once-per-process bound) |
| T-SW-3 | all titles already new, baked absent | the pass repeats with the same identifiers and stamps |
| T-SW-4 | one arm refused | that identifier keeps its old title and its record; baked is absent; the next refresh takes the repair-only branch and re-titles that prayer; the next full pass stamps |
| T-SW-5 | one arm never answers; the clock advances 15 seconds | refused, baked absent, the 2 hour gate reopened |
| T-SW-6 | the pending-list call rejects after every arm has landed | the pass rejects; baked absent; a later full pass stamps |
| T-SW-7 | one channel rename refused | arming completes; baked absent; the next pass renames only what differs |
| T-SW-8 | no stored day | nothing armed, nothing cancelled, baked unchanged |
| T-SW-9 | two switches before the first pass starts | both passes bake the last choice |
| T-SW-10 | a switch enqueued while a pass is mid-flight | the first pass stamps what it captured; the second clears the value before its first arm and bakes the new language |
| T-SW-11 | an alert commit with the language changed and no pass yet | baked is cleared before its arm; its one prayer arms in the new language; it does not stamp |
| T-SW-12 | permission refused | the switch's own pass still runs |
| T-SW-13 | the widget push rejects | the pass still stamps; the settings subscription pushes one second after the switch |
| T-SW-15 | no records at all, the fake OS holding two requests, every bell Off | the sweep is skipped; baked stays absent |
| T-SW-16 | `en` to `ar` with the third arm refused, then back to `en` | baked is absent after the first pass; the switch back runs a full pass; every title is English; baked is `en` |
| T-SW-17 | a sweep cancel refused | baked absent; the next full pass retries |
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
| T-W-6 | `shared/__tests__/widgetContract.test.ts` | the closure walk covers all three lock functions, closing the gap at `:73-88`; `environment` is imported unaliased; no layout function has a parameter or local whose name is an `@expo/ui` export, which is what hid the modifier before the rename |
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
| T-UP-8 | a class B fixture: name keys, deterministic identifiers, no schema marker | the cache is wiped and preferences are not; before data lands nothing is armed and nothing cancelled; after it, every due identifier of the fixture is pending again under the same bytes |
| T-UP-9 | a class C fixture: index keys, requests under identifiers the app did not choose | every value lands on its name key; the old requests are still pending when the deterministic set has been armed, and are cancelled only by the sweep that follows; at no point is a due prayer without a pending request |

## Time zones

Steps that touch `shared/time.ts` run `yarn test:tz` (`package.json:20`). T-PAR-1 runs under all
four zones through it.

## The mutation pass

By hand, on these, each reverted after it turns its named test red:

1. each of the five conditions of the stamp (document 03, step 7);
2. `languageNeedsBake()` dropped from the gate;
3. the stamp writing a fresh read of the language in place of the captured one;
4. one registry token;
5. `matchDeviceLocale`'s prefix test without the `-`;
6. the imminent-reminder branch's record check;
7. `text(key)` in a layout returning the fallback always;
8. the invalidation before the first arm removed, in the pass and in the alert commit;
9. the once-per-process flag never set;
10. the fallback language written to storage on first run.

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
| D-7 | update an install of the live store version, and a 1.29.x install, each with alerts armed, to the 2.0.0 build, with and without a network | 1.29.x: identifiers unchanged in `check:device` and the timetable on screen offline. An older class: what its row in document 05 says, and a pending request for every due prayer at each reading | the release |
| D-8 | Thai and Hindi selected | no clipped mark above or below any line in the row, the sheets and the overlay | a pack's `release` tier |
| D-9 | Arabic selected: every sheet and modal read through on both platforms | no paragraph sits against the wrong edge of its box; each one that does gets an explicit `textAlign` | the Arabic pack's `release` tier |
| D-10 | each test device on a 1.x build with the Hijri date on | the month name the phone prints is recorded beside `date.hijriMonth.N`. The catalog replaces the phone's own spelling, so a difference is a visible change for the owner to accept | S4 |

## End-to-end flows

Five of six Maestro flows assert `London, UK`, and `swipes-x15` waits on `Midnight` and `Fajr`
(`evidence/test-infra.md` section 6). They run on an English device and keep passing. No flow is
rewritten to test ids in this work. One flow is added, `e2e/flows/language-switch.yaml`: open
Settings, open Language, pick the second row, assert the first prayer row's new name, switch
back.

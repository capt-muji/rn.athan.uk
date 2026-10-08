# Plans: every queued session is planned, then executed, then audited, one at a time

**Why this exists.** On 2026-09-15 the owner's model allowance was running low, so the work was split into three
sessions with separate jobs and fresh contexts. The split is what matters and it has not changed. A session says
which JOB it is doing, never which model: the harness chooses the model, these pages are read by different models
across the life of the build, and a name in the text only dates it.

1. **Planning.** One planning session per queued session is the architect: it makes every decision, does the design
   and its review, takes the owner's rulings, and writes a plan that SPECIFIES the work completely, down to the contracts,
   names, behaviour, the tests to write, the acceptance criteria (2026-09-16): "giving it so much information that
   you are confident that the Executor can do its job perfectly" (owner). A question the executor has to ask is a
   defect in the plan.
2. **Execution.** One execution session per plan builds it to those acceptance criteria, reviewing every commit
   itself before merging it. It chooses HOW; it never chooses WHAT. It never pushes.
3. **Audit.** An audit session checks the executed plan against the plan, fixes whatever is wrong itself, and pushes
   `uat`. Work is never handed back to the executor (owner, 2026-09-16); a large repair may take more than one
   audit session, and every one of them is the auditor's.

A plan is good when an executor that makes no decisions never has to make one, and can tell for itself when its work
is finished and right.

## What the owner types

**One prompt per step: `athan-next`.** It loads the skill at `.agents/skills/athan-next/SKILL.md`, which reads the
table below and git, works out whether the next step is planning, execution or audit, runs that one step, and stops.
The same prompt starts the step after it, so the owner never has to remember where the programme stopped. If a
session ever fails to load the skill on the bare word, `Use the athan-next skill.` names it outright.

A step is one session the owner starts, so nothing chains unattended and no guard is needed against a run going
round in circles. A session does all three jobs itself and spawns no subagent, with one exception: reading an image,
which a session whose model cannot see images delegates to `vision` (owner, 2026-09-26). Every session ends with a
four-line handoff naming the job completed, the row it moved, and the job that comes next.

For starting one step by hand (a plan folder's `PROMPT.md` names its row's plan file in place of "the next plan"):

| Phase | Brief | Paste |
| --- | --- | --- |
| Plan | `ai/plans/PLANNER-BRIEF.md` | `Planning session. Read ai/plans/PLANNER-BRIEF.md and plan the next session in ai/plans/README.md.` |
| Execute | `ai/plans/EXECUTOR-BRIEF.md` | `Execution session. Read ai/plans/EXECUTOR-BRIEF.md and execute the next plan in ai/plans/README.md.` |
| Audit | `ai/plans/AUDITOR-BRIEF.md` | `Audit session. Read ai/plans/AUDITOR-BRIEF.md and audit the next plan in ai/plans/README.md.` |

The routing above is what an out-of-repo Python command, also called `athan-next`, used to do until 2026-09-17,
chaining steps on a countdown and carrying three guards that protected a model allowance; the chaining and the
guards went with it. No gateway address, domain or key is ever written into this repository.

**Order: one session at a time.** Plan it, execute it, audit it, and only then plan the next one. The owner asked on
2026-09-16 which order gives the best quality; this is the answer, and the skill enforces it.

1. Plan the first row that needs planning: a PLANNING row is resumed, and a NEEDS REPLAN row refreshed, before a NOT
   PLANNED row is started.
2. Execute that row.
3. Audit it. The audit fixes whatever the executor got wrong, itself, then sets the row DONE and pushes `uat`. It
   never hands work back to the executor (owner, 2026-09-16).
4. Only then plan the next row.

A row whose blocker has not moved is passed over rather than planned, exactly as a BLOCKED row is (section 2,
item 3.4 of `PLANNER-BRIEF.md`). Row 18 is the live case: re-check `npm view expo dist-tags` each session. The day
SDK 58 stable lands, row 18 jumps the queue.

**The invariant: at most one row at a time is PLANNING, READY, IN PROGRESS or EXECUTED.** A BLOCKED, OWNER-LED or
research-parked row waits on the owner and holds no merged code of its own, so more than one of those may sit in the
table at once. A plan is written against one `uat` commit and carries that commit's code verbatim: its anchors,
the lines around them, the tests' expected numbers, and owner decisions taken while looking at it. A row ahead of it
changes that code, so a plan written early is stale before it runs, and a stale anchor that still matches by text is
worse than one that fails, because nothing catches it. Replanning costs what planning cost, so planning ahead is not
faster; it is the same work done twice. Sessions 6 and 6b both changed `stores/notifications.ts` and
`device/notifications.ts`, which is how this was found.

The planning prompt resumes a plan left at PLANNING and refreshes one at NEEDS REPLAN, before it starts a new one.
The execution prompt resumes a plan left at IN PROGRESS, before it starts a new one.

## Status

A plan moves through NOT PLANNED, then PLANNING, then READY, then IN PROGRESS, then EXECUTED, then DONE.

Off that path:
- **NEEDS REPLAN:** the code a plan anchors on has changed, or the owner's answer changed a step. The next planning
  session refreshes it.
- **BLOCKED:** waiting on the owner. The reason is written in the row.
- **OWNER-LED:** the owner's own reading or decisions. There is nothing for an executor to run.
- **CANCELLED:** the owner closed the row before it was planned. Nothing runs it, and it is never re-planned or
  re-queued without the owner.
- **SUPERSEDED:** the owner closed it because other rows took over its subject. Never re-queued either.

## The queue

DONE rows keep their order number, their "Planned at" commit and nothing else: their plan folders and prompts left
the repository in the 2026-10-07 clean-up, and the `uat` history is their record. Where a DONE row's surviving
artefact is still cited by shipped code or config, the Plan column names it. Open rows keep their pointers and the
facts a cold-start session needs.

| Order | Session | Brief | Plan | Status | Planned at | Needs first |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6. An alert always does what its bell shows (findings 79, 80, 82) | — | — | DONE | `b5159305` | nothing |
| 2 | 6b. An alert sheet change is all or nothing, both directions (finding 81) | — | — | DONE | `03cc5688` | 1 |
| 3 | 7. Android: each notification replaces the one before it | — | — | DONE | `7c800915` | nothing |
| 4 | 8. iOS: each notification replaces the one before it | — | — | DONE | `fa3337b3` | nothing |
| 5 | 9. Keep yesterday's still-due rows after 00:00 | — | — | DONE | `7289894a` | nothing |
| 6 | 12. SDK 58 beta upgrade + alarmClock | `ai/plans/SDK58-PROGRAMME.md` §12 | — | DONE | `a2498afa` | nothing |
| 7 | 13. Agent tooling: `@expo/agent-cli` + dev-launcher niceties | `ai/plans/SDK58-PROGRAMME.md` §13 | — | DONE | `423e2db1` | 6 |
| 8 | 14. Expo Modules 2.0 spike: `modules/tls13` | `ai/plans/SDK58-PROGRAMME.md` §14 | none | CANCELLED 2026-09-18 (owner): Modules 2.0 in SDK 58 beta is iOS-only, no Kotlin authoring API exists to migrate `modules/tls13` to, and the 3T TLS proof already ran in session 12. Never re-queue | — | nothing |
| 9 | 15. Android home-screen widgets | `ai/plans/SDK58-PROGRAMME.md` §15 | — | DONE | `0ec4fe70` | 6 |
| 10 | 15b. Android widget polish + self-refresh + mock build loop | — | — | DONE | `825c4ce5` | 9 |
| 11 | 16a. iOS widgets: the containerBackground fix, first-placement UX, cadence table | — | — | DONE | `0506f608` | nothing |
| 12 | 15d. Android widgets: proportional sizing, they break outside the 3T | — | — | DONE | `7b38e5a6` | nothing |
| 13 | 15c. Android widgets open the app on tap | — | — | DONE | `31416a38` | nothing |
| 14 | 17. Widget timeline horizon: 14 to 30 days, both platforms | — | — | DONE | `53d9baba` | nothing |
| 15 | 19. Widget polish: Android dark colours, the active pill overhang, the horizon to 7 days, the iOS flag on | — | — | DONE (steps 1 to 3 and the 3T proof; step 4, the iOS flag flip, became row 16) | `5926e35f` | nothing |
| 16 | 19b. The iOS widgets flag: run the G.1 acceptance protocol on the XS, then flip it | — | — | DONE 2026-09-25 (the protocol passed on the XS and the flag ships on) | `5926e35f` | nothing |
| 17 | 20. G.2: the blank card at placement, and the horizon to 3 days | — | — | DONE | `1406dc51` | nothing |
| 18 | 16. SDK 58 stable re-pin + full release-notes review | `ai/plans/SDK58-PROGRAMME.md` §16 | none: §16 carries the facts A1 to A11 the deleted plan folder held | BLOCKED. NOT PLANNED until SDK 58 stable is on npm (~Oct 7 to 14). **Session 21 added a second job: Babel 8.** `@babel/core` 8.0.6 and its three plugins cannot move while `babel-preset-expo@58.0.3` depends on 36 Babel 7 plugins and `@react-native/babel-preset` pins `@babel/core ^7.25.2`; a Babel 7 plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED`. Bump the four together when the SDK presets move | — | 6 + SDK 58 stable on npm (~Oct 7 to 14); may jump the queue the day it lands |
| 19 | 18. Android lock screen widgets: deep investigation, 3T first | — | — | DONE 2026-09-25 (investigation only, no code ships: no lock-screen widget API on either phone) | `2aeac17c` | nothing |
| 20 | 21. Bump every non-SDK package to its absolute latest | — | — | DONE | `3df9733c` | nothing |
| 21 | 22. Dependency freshness sweep: re-measure every non-SDK package and batch what has moved | — | — | DONE 2026-09-26 (1.28.30 to 1.28.32; 28 of 30 already latest) | `55df8421` | 20 |
| 22 | 23. Lock Screen widgets: a countdown layout, the colour hierarchy, readable sizes (iOS only) | — | — | DONE 2026-09-25 (owner tested all three layouts on the XS through six builds and approved) | `97bef7f4` | nothing |
| 23 | 24. Lock Screen widgets: the whole day's list (iOS only) | — | none | CANCELLED 2026-09-25 (owner, on device): the two day-list faces were built, audited and installed on the XS, and the owner rejected the geometry: a lock-screen card (~160x72pt) cannot hold six rows. `PrayerLockWidget4` and `PrayerLockWidget5` never ship. Never re-queue | `273abe96` | nothing |
| 24 | 25. Android widget countdown: a free-ticking Chronometer, so it can never drift (OPPO Find X8) | — | — | DONE 2026-09-26 (1.28.25, pushed at `868bd69a`; owner accepted). The Chronometer itself was NOT built, and the after-run drift comparison is INVALID (it ran on mock-data APKs). Alarms remain the source of truth | `e16fcbd7` | nothing |
| 26 | 23. SDK 58 preview.7 + RN 0.88.0-rc.2: ride the beta to its latest | `ai/plans/SDK58-PROGRAMME.md` §23 | — | DONE 2026-09-26 (1.28.34 to 1.28.45). Steps 4 and 5 fixed a widget blanking that neither the SDK, React, RN nor Reanimated caused: `@expo/ui` and `expo-widgets` are pinned to an exact `58.0.5`: `@expo/ui` 58.0.7 calls `React.memo` at MODULE scope, which `expo-widgets`' five-name `react-stub.ts` has no `memo` for, so the widget bundle dies at LOAD; iOS broke one version earlier, at 58.0.6, untested because the 3T ladder could never reach it. The two move together: pinning `@expo/ui` alone installs a NESTED 58.0.7 that yarn never prunes. `shared/__tests__/widgetRuntimeLoads.test.ts` builds and evaluates the real runtime bundle on both platforms. Durable lesson: a missing-name guard is the wrong tool; only a LOADED bundle catches a module-scope call | `430fbfd6` | nothing |
| 27 | D1. Notification sound through silent mode and DND, both platforms | `ai/plans/SDK58-PROGRAMME.md` D1 | `ai/plans/27-silent-mode-bypass/FINDINGS.md`: it backs the answers `shared/help.ts` gives | DONE 1.28.58. Five real defects fixed; the mute switch itself proved unreachable on both platforms and the owner accepted that. `NotificationManagerService` gates channel sound on ringer mode BEFORE reading the channel's `AudioAttributes`, so no channel config sounds in silent mode; the stock Clock proves it by playing its own audio. iOS needed the time-sensitive entitlement (`app.json` claimed none, so iOS silently downgraded to `active`); Critical Alerts is refused for this category, and AlarmKit needs iOS 26, which dropped the XS | `7b5e3a38` | nothing |
| 28 | D3. Rolling buffer, plus a second reminder | `ai/plans/SDK58-PROGRAMME.md` D3 | — | DONE 2026-09-27 (1.28.60 to 1.29.5). The rolling buffer is a REQUEST BUDGET, not a day count: rows armed whole, in time order, under the iOS 64-request ceiling; the budget is spent a whole ROW at a time, because spending it per request orphans a reminder in 98.0% of samples. The next Fajr is always armed, where the 1-day window left it unarmed 79.9% of the year. Durable lesson: `null <= now` is `true` | `0b4a1edc` | 27 |
| 29 | D6. Help: one modal answering "why did I not hear the athan?" | `ai/plans/SDK58-PROGRAMME.md` D6 | — | DONE 2026-09-27. A modal on the owner's ruling, not the brief's second sheet. The brief's own copy would have made the page lie about Android and silent mode; the shipped answer says plainly that no app can play through the silent switch on either platform. The app is never named in user copy (pinned by a test). The final visual treatment is still OPEN: 25 candidate layouts, a contact sheet and their exact component source are kept at `~/athan-help-designs` | `a3f8812c` | 28 |
| 30 | 30. ISSUES #35: both stores answer for themselves, so `releases.json` is never read again | — | — | DONE | `a265ec1d` | nothing |
| 31 | 31. Android updates natively through Play, iOS keeps the modal, and `releases.json` is deleted | — | — | DONE | `229272bc` | 30 |
| 32 | 32. ISSUES #27: the day roll, so a list day on screen always holds every one of its rows | — | — | DONE 2026-09-27 (1.29.33 to 1.29.35). #27 was real, had been fixed unremarked by the 2026-09-13 dashes work, and was never reachable on real London data, but IS reachable above ~60N, so one invariant test shipped. Reproduced 562 times against the old algorithm, zero against the new. One finding open as ISSUES #42: the second keep test survives mutation to `===` with the whole suite green. Durable lesson: a break script written from a diagnosis is not verified until it is RUN | `aeb985d5` | nothing |
| 33 | 33. Three open items in one session: the athan sound change bug, ISSUES #42's untested keep, the Help modal's visual design | — | — | DONE | `d59347a2` | nothing |
| 34 | 34. Dead-code sweep: every exported symbol no production file reaches | — | — | DONE 2026-09-28 (1.29.50 to 1.29.58). Lesson: Biome catches an unused import, never an unused EXPORT | `6c3956ef` | nothing |
| 35 | 35. Housekeeping batch: the accessibility fixes, edge-to-edge, finding 74, the audioMatrix timeout, the leftover 3T channels | — | — | DONE 2026-09-28 (1.29.61 to 1.29.65). Three of five queued items were already closed; edge-to-edge CANCELLED (SDK 58 removed the built-in it was to migrate to); finding 74 closed. The audioMatrix timeout had a root cause: `mp3-duration` given a path streams file I/O, given a buffer decodes in memory: 440ms against 14ms for 67 files, the suite 5.70s to 0.70s | `052e25a6` | nothing |
| 36 | 36. iOS only: the Extras explanation box points too far from its row | — | none | CANCELLED 2026-09-28 (owner, on sight): 🐋 "I think the info box is absolutely great, nothing to touch there." Session 35's two fixes (1.29.67, 1.29.68) stand. The lesson that stays: `List.tsx`'s `measureList` bails on `!isStandard`, so `measurementsListAtom` only ever holds the STANDARD list's rect. Do not re-queue; row 39's RTL work no longer waits here | — | nothing |
| 37 | 37. D2 + D5. Qibla finder, on a coarse cached location | — | — | DONE 2026-09-29 (1.29.96 to 1.29.111), audited, on `feat/37-qibla-compass`, NOT merged into `uat-2` on the owner's instruction; row 44 later deleted every qibla artefact, so the branch is moot. 1.29.107 and 1.29.108 each name two commits: never rewrite history; take a version from `origin/uat-2` or serialise | `77eb52fe` | nothing |
| 38 | 38. D4a. The i18n scaffolding: one English catalog and the `t()` convention, no second language yet | `ai/plans/SDK58-PROGRAMME.md` D4 + the owner's decisions of 2026-09-28 | `ai/plans/39-localisation/` (research; PLAN.md pending two owner rulings) | NOT PLANNED. The cheap half: a hand-rolled typed catalog and `t()`, NO i18n library, NO second language, invisible to users. Load-bearing: the English prayer NAME is an identifier (27 MMKV keys, 2 notification id formats, 11 audio slugs, 67 mp3s named from it, Android res/raw `[a-z0-9_]` only), so copy changes never rename it. Hermes has no `Intl.PluralRules`, but the plural surface measured ZERO. TS catalogs, not JSON. The widget layout can never call the library (`react-stub.ts`). Notification copy is baked at schedule time; the plan re-arms by replace-in-place (deterministic identifiers), no cancel pass (`39-localisation/R4-FINDINGS.md`) | `1.29.104` | 37 |
| 39 | 39. D4b. The translation sweep: RTL, the real catalogs, and the language switcher | `ai/plans/SDK58-PROGRAMME.md` D4 + the owner's decisions of 2026-09-28 | `ai/plans/39-localisation/` (research; PLAN.md pending two owner rulings) | NOT PLANNED. The expensive half, and the last thing before v2.0. **RTL is the real work, not the strings**: 63 `left`/`right` style props, 30 row flex containers, 32 absolutely-positioned views, 30 measure sites, `I18nManager` used zero times (measured 2026-09-29 at `77eb52fe`, scripts in `39-localisation/scripts/`). The owner ruled both column names ALWAYS show (🐋 "I really, really, really do want to have both column names"); 21/24 names fit 320dp and 23/24 fit 360dp; two launch terms overflow the 123pt budget: French "Minuit islamique" 132pt, German "Sonnenaufgang" 126pt (C3b, owner-corrected). Shrinking is REJECTED: `adjustsFontSizeToFit` is per-node and the name and time are size-tied (`Prayer.tsx:108`, `Time.tsx:69`); the remedy is per-locale whole-list size. CI guard: first + second + 129pt ≤ screenWidth. The human-reviewer condition is WITHDRAWN (owner) | `1.29.104` | 38 |
| 40 | 40. Re-architect the heading: the fused sensor Maps uses, not the raw magnetometer | — | — | DONE 2026-09-29 (1.29.115 to 1.29.121); its own result queued row 41. The fused sensor shipped, a large improvement, but the tuning never converged: the owner's room bends the field 30 degrees across two metres, so no constant satisfies two spots in one room; the interference is REPORTED, not absorbed. iOS passes `XTrueNorthZVertical`, so the declination correction is Android-only; applying it on both would bend the iOS needle by twice the local declination. The calibration hint was DELETED: the platform's own accuracy band is not trustworthy (an X8 reported HIGH while 71 degrees wrong) | — | 37 |
| 41 | 41. The qibla on an offline map, so the user aligns it by eye | — | — | DONE 2026-09-30 (1.29.149 to 1.29.154), audited, and the DEVICE PROOF REJECTED THE FEATURE; superseded by row 43. The audit fix (1.29.151, `rankStreets`) shipped; the plan's step 6 device proof never ran and is moot: row 44 deleted the feature | `1.29.145` | 40 |
| 25 | 11. Moonsighting research, session 2 | `ai/prompts/moonsighting-research-2.md` | none | NOT PLANNED, deferred until further notice (owner 2026-09-18). Also behind rows 37 to 39, on the owner's sequencing of 2026-09-28 | — | everything above; behind rows 37 to 39 |
| 43 | 43. The qibla felt, not read: a north-locked map and a haptic that taps when you line up | — | none | CANCELLED 2026-09-30 (owner, after the device proof); its own finding queued rows 44 and 45. Step 1 merged at `edad8439` was reverted by row 44; steps 2 to 4 died with `feat/43-the-screen` (an unfinished patch is kept off-repo). Its LOG recorded four wrong diagnoses before the truth | `53976c2b` | 41 |
| 42 | 42. Going worldwide: where a prayer time comes from | the owner's instruction of 2026-09-30 | `ai/features/global-prayer-times/`: read `RESUME-FROM.md` FIRST (the pick-up-cold record), then `FINDINGS.md`, `SOURCE-CATALOG.md`, `RECOMMENDATION.md`, `ASSUMPTIONS.md` | **OWNER-LED. RESEARCH COMPLETE 2026-09-30; awaiting SEVEN owner decisions, all in `ASSUMPTIONS.md`. Nothing is planned and no code is written.** The seven: location permission vs a manual city/zone picker; yearly fetch vs offline; per-prayer offsets; reproduction vs accuracy claim; launch countries (Malaysia, for the corrected reason); the default Asr school (the app shows Shafi'i while `shared/types.ts:25` documents Hanafi, reversed); device elevation. SETTLED already: licensing, and existing London users stay on the published timetable. Load-bearing facts: London is solved exactly: the publisher's interval table plus his equations reproduce 127,838 of 127,841 minute-comparisons, and a 732-byte interval table plus fifty future years is 10,290 bytes brotli; timezone-city median error is 16 displayed minutes, with 28.1% of the world's population within 2; the MMKV key `prayer_${date}` carries no location (`stores/database.ts:138`); the jamaah field is typed in `shared/types.ts:18-38` and never read; `adhan@4.4.6` is MIT with measured conditions: set `highLatitudeRule` explicitly, never `recommended()`, bound Asr above 60N; the provider's Asr margin changes +2 minutes from 2027; USNO fixtures: 37,340 comparisons, 0 failures | `1.29.141` | nothing to research; planning waits on the seven decisions |
| 44 | 44. Delete the qibla, all of it: a deep cleanup before anything is rebuilt | — | — | DONE 2026-09-30 (1.29.170 to 1.29.171), audited; ships NO feature. Every qibla artefact of sessions 37, 40, 41 and 43 removed; the judgement was a grep (`qibla`, `kaaba`, `pmtiles`, `mvt`, `tilecache`, `greatcircle` return nothing across the production trees), and `yarn validate` passed at 100%. `adhan` stays: it computes the prayer times | — | 43 (CANCELLED, so nothing blocks this) |
| 45 | 45. The qibla on a flat world map, the way a maps app does it | the owner's instructions of 2026-09-30 | `ai/plans/45-qibla-flat-map/design/README.md`: the locked design; `shared/qiblaCompass.ts` cites it | **DONE 2026-10-01 (1.29.180 to 1.29.183), audited, tested to 100%. THE DESIGN IS LOCKED:** the drawing code is now the specification, and where an old render and the code differ, the code is right (the owner moved values on the phone after the lock). The design page's motif ban list binds every future drawing on this sheet, the hint included: no compass rose or radiating rays, no hexagram or filled eight-point star, no pinwheel or square Kufic; a repeated-block motif must have all four mirror axes; colours from `COLORS.qibla` alone | `9e9138fe` | 44 |
| 46 | 46. The qibla compass on Android: build it, test it, and prove the heading | the owner's instruction of 2026-10-01 | none | **SUPERSEDED 2026-10-03 by rows 47 to 50; its remaining question is row 53. CLOSED UNPLANNED on the owner's instruction.** Everything it asked for happened: the owner judged the 3T compass himself across 20 trials and accepted it. BOTH named levers are dead and must not be revived: the field-magnitude and dip check is rejected by measurement (row 48: a 10 uT offset swings the heading 30.8 degrees while passing gates of 10% on magnitude and 5 on dip, because a compass reads only the horizontal field); hard-iron calibration harvested from a flat turn is geometrically impossible (row 52, against NXP AN4246: a vertical-axis turn traces a circle, and a circle lies on infinitely many spheres, so 449.7% of the offset survives; only a figure of eight determines it) | — | 45 |
| 47 | 47. The heading comes from the gyro-fused sensor, so the compass turns smoothly | — | — | DONE 2026-10-01 (1.29.193 to 1.29.196). The gyro-fused sensor SHIPPED, measured inaccurate outdoors, and was REVERTED at 1.29.195. Five device defects were recorded, and three test-infra findings that outlive it: Reanimated's mock `useAnimatedReaction` is a NO-OP (`src/mock.ts:67`); a first `render()` runs effects unless awaited; `clearMocks` strips implementations | `d144d777` | 46 |
| 48 | 48. Where the heading comes from: research the alternatives, because the platform's own is not accurate enough | — | — | DONE 2026-10-02 (1.29.201 to 1.29.202), audited. The settling gate shipped; the field-physics lever retired (row 46); the Fused Orientation Provider is the forward answer. The plan's own step-split was a defect, caught by `unusedExports.test.ts` | `ad131a51` | 47 |
| 49 | 49. The heading from our own native module: real accuracy in degrees, Apple's calibration prompt, and the sensor Google Maps uses | — | — | DONE 2026-10-02 (1.29.210 to 1.29.213), audited. The audit found the flag invariant guarded by nothing; iOS `headingAccuracy` is bucketed to 0-3 at `ios/LocationUtils.swift:9-20`; Apple's calibration prompt is never shown. The FOP module landed. Method rule: the phone is TETHERED for heading measurements. Lesson: Gradle resolves dependency conflicts to the HIGHEST request; a pin is a floor | `3100ad7f` | 48 |
| 50 | 50. Which patch fixed the compass: isolate the four changes and measure each | — | — | DONE 2026-10-02 (1.29.216 to 1.29.219), audited. The settling gate's LATCH is the change that fixed the compass; all four patch changes earned their place; requesting 52 Hz would be worse than the 50 Hz that ships. The audit found the device evidence files missing and wrote the verdict files itself | `5f65db20` | 48 |
| 51 | 51. Give the fixes back: upstream what `expo-location` gets wrong about a compass | the owner's question of 2026-10-02, after session 49 | none | **NOT PLANNED, waiting on row 50 deliberately.** Three candidates, each a CORRECTION to `expo-location`'s own code, so Expo maintains them and this repo carries nothing: (1) iOS `headingFilter` is never set: on the XS, 731 of 731 readings were discarded; (2) the Android 2-degree emission gate starves a slow turn (0.83 Hz at 2 degrees/s): make it configurable; (3) `headingAccuracy` is bucketed to 0-3 AND the negative "invalid heading" sentinel is collapsed into bucket 0: propose an additional field. A 5-to-50 Hz rate change is weaker; optional. The FOP as an npm package is deliberately NOT recommended. Corrections go as PRs (there is no process to hand modules to Expo), and `ai/AGENTS.md` section 8 binds every post: anonymity absolute, no app name, repo link, device serial or secret | — | 50 |
| 52 | 52. The qibla wait: is the settling gate still the right 3 seconds, and what does a cold open cost? | — | — | DONE 2026-10-03 (1.29.236 to 1.29.243), audited and pushed. The owner's 20 trials REFUTED the settling model, which is what queued row 53; ~14 Hz at any sensor rate. The warm reopen and the subtitle ship | `e0ba6125` | nothing |
| 53 | 53. The qibla wait, answered properly: gate on the phone's own uncertainty instead of a stopwatch | — | — | **DONE 2026-10-07 (1.29.247 to 1.29.258), audited and pushed. BOTH PLATFORMS ARE LOCKED: no compass behaviour changes without the owner's word.** Android draws a phone only after it has been WAVED (Google's Fused Orientation Provider alone, an 8-turn wave and no ceiling (step 5 deleted the then-10-second ceiling and the then-3-second fallback)); iPhone draws inside 15 degrees either way or on a warm reopen; after five seconds an unvouched phone shows *Could not find north*. Step 5 reversed the earlier "this screen must never lock" on the owner's own ruling. Four findings wait on him: see "Waiting on the owner" below | `380a2a41` | nothing |
| 54 | 54. The patches we carry, one line of qibla copy, and a repository hygiene check | the owner's questions of 2026-10-07, at the close of row 53 | `ai/plans/NEXT-SESSION-PATCHES-AND-COPY.md` is the brief; `ai/plans/54-patches-and-copy/FINDINGS.md` is what was established | **OWNER-LED: the owner paused app work on 2026-10-07, part way through, and the rest waits on his word.** The hygiene check is DONE (1.29.263). The patch questions are ANSWERED: all three patches are still needed; the `expo-background-task` PR is open and unreviewed; the `expo-widgets` change is in no published build; the Android half of the `expo-location` patch is unreached on fused-sensor phones. The qibla copy merged at 1.29.270 on 2026-10-08, its phone proof waived by the owner. LEFT: the build without the Android hunks is not made | — | 53 |

- **Session 6b was planned under the previous rules**, before "specify, do not dictate" was written on the afternoon
  of 2026-09-16. It hands the executor finished files and is executed exactly as written: where a STEP dictates
  rather than specifies, the dictation wins (`EXECUTOR-BRIEF.md`). Every plan from session 7 on is written to the
  new rules.
- "Planned at" is the `uat` commit the plan's anchors were verified against (a version number where a session
  wrote no plan).
- "Needs first" lists the order numbers of the rows that must be DONE before this plan is executed, such as `1`, or
  `nothing`.

## How a dependency upgrade is split into sessions (owner, 2026-09-25)

The owner's rule, refined through session 21, is **blast radius, not the version number**:

| Shape of the bump | How it is queued |
| --- | --- |
| Patch or minor, no API this project touches | Batched with the others, one commit each, one session |
| A major that changes nothing here | Batched too. `lint-staged` crossed TWO majors in session 21 and cost nothing, because the config was JSON and both tasks were binaries |
| A major that breaks code, tests or tooling | Its own session. `jotai` 3 broke 82 of 170 suites through three separate causes and deserved the whole session it got |
| Two breaking majors at once | Never the same session, even on separate branches. Each needs its own device proof, and a failure with two suspects costs more to diagnose than both sessions save |
| A major blocked upstream | Not queued at all until the blocker moves. The four `@babel` packages wait on `babel-preset-expo`, so they belong to row 18, not a bump row |

How to tell which, before queuing: install the candidate in a scratch worktree, run `tsc`, Biome and the full suite,
and count what fails. That measurement is the whole decision, and it is cheap. Session 21's own numbers are the
worked example, in its `uat` history.

One package per branch and per commit stays the rule in every case (owner, 2026-09-25), because `yarn.lock` is one
resolved graph: two packages in a commit cannot be reverted apart.

## Waiting on the owner, not yet sessions

A planning session may turn one of these into a plan only after the owner approves it in that session; it then adds
a row above.

- The dashes approval page's open choices C2, C5 to C10 and C13 (session 3).
- The five deferred owner features of 2026-09-18, detailed in `ai/plans/SDK58-PROGRAMME.md` under "Deferred owner
  features": D1 sound through silent mode (DONE, row 27), D2 qibla finder (row 37), D3 rolling buffer (row 28),
  D4 localisation for v2.0 (rows 38 and 39), D5 location for v2.0. Each remaining one becomes a row only after the
  owner specs and schedules it.
- ~~The Android card PNGs, now that Glance can draw rounded corners~~: **CLOSED by the owner on 2026-09-26.**
  `cornerRadius()` is a no-op below API 31, so the 3T would draw square corners while newer phones looked right;
  the PNG background stays. Do not re-queue; revisit only if the 3T stops being the floor device.
- **Left by row 53, the qibla compass, which the owner accepted and LOCKED on 2026-10-07.** None is a session, and
  none may be built until he unlocks the compass or schedules it:
  - **The hint's drawing is to be redesigned**, on his word of 2026-10-06 that the wave animation will change in a
    later session. It now matters more: an Android phone is drawn only when it has been TURNED about, so the
    drawing shows a path through the air, not a twist (`ai/plans/53-qibla-accuracy-gate/steps/5-vouched-or-nothing.md`,
    part 12.2).
  - **A one-line fix in `awaitNorth`** for two cases that need the sheet opened twice with no close between, and
    **three smaller findings** he closed by locking (`ai/plans/53-qibla-accuracy-gate/AUDIT.md`, findings 7 and 8).
  - **A heading watch that can be stranded with the magnetometer armed**, on every phone that reads `expo-location`,
    older than row 53 (`ai/plans/53-qibla-accuracy-gate/steps/4-android-fused-wave.md`, part 12.3).
  - **Comments in the qibla files that name the owner**, which `ai/AGENTS.md` section 15 excludes.
- Informational: the update-prompt switch from `releases.json` to store data is ISSUES #35, pending; production iOS
  already reads the App Store via iTunes Lookup. Nothing in the SDK 58 programme conflicts with it.

## Files here

- `.agents/skills/athan-next/SKILL.md`, outside this folder: the skill the owner's one prompt loads. It picks the
  next step from the table above and git, runs it, and stops.
- `PLANNER-BRIEF.md`, `EXECUTOR-BRIEF.md`, `AUDITOR-BRIEF.md`: the whole job of each kind of session: precedence,
  rules, traps, the step loop.
- `TEMPLATE.md`: the fixed shape of every plan, so every plan reads the same way.
- `SDK58-PROGRAMME.md`: the briefs for queue rows 12 through 18 (the SDK 58 beta programme, its stable re-pin, and
  the Babel 8 rider), plus the deferred owner features D1 to D5 and the ruling log behind them.
- `NEXT-SESSION-PATCHES-AND-COPY.md`: the brief of row 54.
- `NN-<session>/`: the surviving session folders, each holding only what is still load-bearing:
  `27-silent-mode-bypass/FINDINGS.md` (backs the answers `shared/help.ts` gives),
  `39-localisation/` (the research behind rows 38 and 39), `45-qibla-flat-map/design/README.md` (the locked compass
  design), `48`, `49`, `50` and `53` (the qibla heading programme: plans, logs, audits), and
  `54-patches-and-copy/FINDINGS.md`. Every deleted session's record lives in `uat` history.
- `ai/prompts/`, beside this folder: the two moonsighting research prompts and their README.

## Who changes a status, and who pushes

- **A planning session** sets PLANNING, READY, OWNER-LED, BLOCKED or NOT PLANNED, and fills "Planned at" and
  "Needs first".
- **An execution session** sets IN PROGRESS, EXECUTED, NEEDS REPLAN or BLOCKED. It commits and merges into `uat` on
  this Mac, and never pushes.
- **An audit session** sets DONE for an EXECUTED row. It never sets a row back to READY: what the executor got
  wrong, the audit repairs itself. Auditing an unfinished plan leaves its status as it is, so the executor carries on
  with the plan it has not finished. That is the executor resuming its own work, not work handed back to it.
- **Pushing.** Only planning and audit sessions push `uat`, and only when every commit on `uat` that is not yet
  on `origin/uat` has been audited. A planning session that finds unaudited commits asks the owner to run the audit
  prompt first, unless it is replanning a NEEDS REPLAN row, which it does without pushing.

## State of the phone when this programme started

On 2026-09-15 the OnePlus 3T (`3T_SERIAL`) was left running the mock build of 1.27.159 at the owner's request. Any
plan that needs real prayer times or real alarms on the phone starts by installing a local production build.

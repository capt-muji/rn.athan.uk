# Plans: one queued session at a time, planned, executed, then audited

## Order

One row at a time: plan it, execute it, audit it, only then plan the next. A fresh session with nothing to continue starts with `/athan-next`. A session carrying a handoff continues with `/go`. A session that is running long closes with `/handoff`. The skill at `.agents/skills/athan-next/SKILL.md` reads the queue below and git, picks the step, runs it in this one session, and stops. A session does every phase itself and spawns no subagent, with two exceptions: the audit's one cold review, a reviewer that sees the diff but never the plan or the session, and a model that cannot see images delegating one image read to `vision`.

Planning specifies the work completely, down to contracts, names, behaviour, tests and acceptance criteria. A question the executor has to ask is a defect in the plan. Execution builds to those criteria: it chooses HOW, never WHAT, and never pushes. Audit checks the result against the plan, fixes what is wrong itself, then sets DONE and pushes `uat`. Work never returns to the executor.

Plan the first row that needs planning: resume a PLANNING row, refresh a NEEDS REPLAN row, before starting a NOT PLANNED row. The execution step resumes a plan left at IN PROGRESS. Pass over a row whose blocker has not moved, as a BLOCKED row is passed over. Row 18 is the live case: re-check `npm view expo dist-tags` each session. The day SDK 58 stable lands on npm, row 18 jumps the queue.

**Invariant: at most one row at a time is PLANNING, READY, IN PROGRESS or EXECUTED.** BLOCKED, OWNER-LED and research-parked rows hold no merged code, so several may wait at once. A plan anchors on one `uat` commit and quotes its code, its tests' expected numbers and the owner decisions taken against it. A row ahead changes that code, so a plan written early runs stale, and a stale anchor that still matches by text is the worst failure, because nothing catches it.

Every session ends by submitting the /handoff document, four lines: the job completed, the row it moved, the next job, what the owner types next. No gateway address, domain or key is ever written into this repository.

## Status

A row moves through NOT PLANNED, PLANNING, READY, IN PROGRESS, EXECUTED, DONE. Off that path:

- **NEEDS REPLAN:** the anchored code or an owner answer changed. The next planning session refreshes it.
- **BLOCKED:** waiting on the owner. The reason sits in the row.
- **OWNER-LED:** the owner's own reading or decisions. Nothing for an executor to run.
- **CANCELLED:** closed before planning. Never re-planned or re-queued without the owner.
- **SUPERSEDED:** other rows took the subject. Never re-queued either.

## The queue

The queue is the only tracking file. DONE rows keep order number and short name only, and their record is git history. **A plan's documentation dies with its merge: the session that merges the branch into `uat` deletes the plan folder in the same commit.** Code is the documentation, and MD files go stale. The one survivor is an artefact still cited by shipped code or config, named in the row. Open rows keep the pointers, the facts and Needs first (the rows that must be DONE before a plan runs).

| Order | Session | Status |
| --- | --- | --- |
| 1 | An alert does what its bell shows | DONE |
| 2 | Alert sheet change is all or nothing | DONE |
| 3 | Android: a notification replaces the one before it | DONE |
| 4 | iOS: a notification replaces the one before it | DONE |
| 5 | Yesterday's still-due rows survive 00:00 | DONE |
| 6 | SDK 58 beta upgrade + alarmClock | DONE |
| 7 | Agent tooling | DONE |
| 8 | Expo Modules 2.0 spike: the SDK 58 beta API is iOS-only and has no Kotlin authoring API to migrate `modules/tls13` to | CANCELLED, never re-queue |
| 9 | Android home-screen widgets | DONE |
| 10 | Android widget polish + self-refresh | DONE |
| 11 | iOS widgets: containerBackground fix, first placement | DONE |
| 12 | Android widgets: proportional sizing | DONE |
| 13 | Android widgets open the app on tap | DONE |
| 14 | Widget timeline horizon 14 to 30 days | DONE |
| 15 | Widget polish | DONE |
| 16 | iOS widgets flag flip after the G.1 protocol | DONE |
| 17 | Blank card at placement, horizon to 3 days | DONE |
| 19 | Android lock-screen widgets: investigation only | DONE |
| 20 | Non-SDK packages to absolute latest | DONE |
| 21 | Dependency freshness sweep | DONE |
| 22 | Lock-screen countdown layout (iOS) | DONE |
| 23 | Lock-screen whole-day list: a 160x72pt card cannot hold six rows | CANCELLED, never re-queue |
| 24 | Android widget countdown | DONE |
| 26 | SDK 58 preview.7 + RN 0.88.0-rc.2 | DONE |
| 27 | D1: sound through silent mode and DND | DONE |
| 28 | D3: rolling buffer + second reminder | DONE |
| 29 | D6: the help modal for a missed athan | DONE |
| 30 | Both stores answer for themselves | DONE |
| 31 | Android updates natively, releases.json deleted | DONE |
| 32 | The day roll (ISSUES #27) | DONE |
| 33 | Sound bug, ISSUES #42 keep test, help modal design | DONE |
| 34 | Dead-code sweep | DONE |
| 35 | Housekeeping batch | DONE |
| 36 | Extras explanation box: the owner approved the box as it stands | CANCELLED, never re-queue |
| 37 | D2 + D5: qibla finder on a cached location | DONE |
| 40 | Heading re-architecture: the fused sensor | DONE |
| 41 | Qibla on an offline map | DONE |
| 43 | Qibla felt, not read: the device proof rejected the feature | CANCELLED, never re-queue |
| 44 | Delete the qibla | DONE |
| 45 | Qibla on a flat world map | DONE |
| 47 | Gyro-fused heading | DONE |
| 48 | Heading source research | DONE |
| 49 | Native heading module: the Fused Orientation Provider | DONE |
| 50 | Which patch fixed the compass | DONE |
| 52 | Settling gate: timing and cold-open cost | DONE |
| 53 | Gate on the phone's own uncertainty | DONE |

| Order | Session | Brief and plan | Status | Needs first |
| --- | --- | --- | --- | --- |
| 18 | SDK 58 next re-pin + Babel 8 rider | `ai/plans/SDK58-PROGRAMME.md` section 16 (carries facts A1 to A11) | DONE 2026-10-09, audited. The owner's ride-`next` policy is in force: repin to the newest expo every time, release candidates included. Landed at 1.29.281 to 1.29.284: `expo@58.0.6` with the aligned set, `react-native@0.88.0-rc.3`, all three patches rebuilt, `@expo/ui` and `expo-widgets` at 58.0.14 after the 58.0.5 pin crashed iOS at dyld launch (the app verified alive on the XS with real times, the 3T item struck by the owner). Release notes read: one Android widget fix at 58.0.11 (updates during active Glance sessions), nothing else touching us; expo-notifications 58.1.0 grew `enableRemoteNotifications: false` for local-only apps, a candidate for the next app.json pass. Durable lessons in section 16: the `@expo/ui` pair tracks the ExpoModulesCore ABI, and the Babel 8 rider stays blocked upstream, re-attempted at every re-pin | 6 |
| 25 | Moonsighting research, session 2 | `ai/prompts/moonsighting-research-2.md` | NOT PLANNED, deferred until the owner schedules it. Runs behind rows 37 to 39 | rows 37 to 39 |
| 38 | D4a. i18n scaffolding | `ai/plans/SDK58-PROGRAMME.md` D4 and its owner decisions. Plan: `ai/plans/39-localisation/` (research, PLAN.md waits on two owner rulings) | NOT PLANNED. The cheap half: a hand-rolled typed English catalog and `t()`, no i18n library, no second language, invisible to users. The English prayer NAME is an identifier (27 MMKV keys, 2 notification id formats, 11 audio slugs, 67 mp3s named from it, Android res/raw `[a-z0-9_]` only), so copy changes never rename it. Hermes has no `Intl.PluralRules` and the plural surface measured zero. TS catalogs, not JSON. The widget layout can never call the library (`react-stub.ts`). Notification copy bakes at schedule time, so the plan re-arms by replace-in-place with deterministic identifiers, no cancel pass (`39-localisation/R4-FINDINGS.md`) | 37 |
| 39 | D4b. Translation sweep | `ai/plans/SDK58-PROGRAMME.md` D4 and its owner decisions. Plan: `ai/plans/39-localisation/` (research, PLAN.md waits on two owner rulings) | NOT PLANNED. The expensive half, the last thing before v2.0. RTL is the real work: 63 `left`/`right` style props, 30 row flex containers, 32 absolutely-positioned views, 30 measure sites, `I18nManager` used zero times (measured at `77eb52fe`, scripts in `39-localisation/scripts/`). Both column names always show, on the owner's ruling. 21 of 24 names fit 320dp, 23 of 24 fit 360dp. Two launch terms overflow the 123pt budget: French "Minuit islamique" 132pt, German "Sonnenaufgang" 126pt. Shrinking is rejected: `adjustsFontSizeToFit` is per-node and name and time are size-tied (`Prayer.tsx:108`, `Time.tsx:69`). The remedy is per-locale whole-list size, with a CI guard: first + second + 129pt <= screenWidth. The human-reviewer condition is withdrawn. Load-bearing for the measure sites: `List.tsx`'s `measureList` bails on `!isStandard`, so `measurementsListAtom` only ever holds the STANDARD list's rect | 38 |
| 42 | Global prayer times | `ai/features/global-prayer-times/`: read `RESUME-FROM.md` first (the pick-up-cold record), then `FINDINGS.md`, `SOURCE-CATALOG.md`, `RECOMMENDATION.md`, `ASSUMPTIONS.md` | OWNER-LED. Research is complete, no code is written. **Two rulings taken 2026-10-09: the app asks for a location permission, and completely offline permits a yearly fetch, cached.** The other five questions are deferred by the owner to the going-global planning sessions themselves: offsets (decide at implementation, when the API hard-coding is gone), the reproduction claim (re-ask in plain words there), the launch set (the owner's stated aim is every country by the user's location, not a single second country, and localisation ships first), the default Asr, and elevation (a prayer-times question). Settled already: licensing, and London users stay on the published timetable, which R13 proved permanent and offline. Load-bearing: London is solved exactly, the publisher's interval table and equations reproduce 127,838 of 127,841 minute-comparisons, and a 732-byte interval table plus fifty future years is 10,290 bytes brotli. Timezone-city median error is 16 displayed minutes, 28.1% of the world's population within 2 minutes. The MMKV key `prayer_${date}` carries no location (`stores/database.ts:138`). The jamaah field is typed at `shared/types.ts:18-38` and never read. `adhan@4.4.6` is MIT with measured conditions: set `highLatitudeRule` explicitly, never `recommended()`, bound Asr above 60N. The provider's Asr margin changes +2 minutes from 2027. USNO fixtures: 37,340 comparisons, 0 failures | nothing to research |
| 51 | Upstream `expo-location` compass corrections | `ai/UPSTREAM-PRS.md`, asked by the owner after the heading sessions | NOT PLANNED. Three corrections to `expo-location`'s own code, so Expo maintains them and this repo carries nothing. iOS `headingFilter` is never set: on the XS, 731 of 731 readings were discarded. The Android 2-degree emission gate starves a slow turn (0.83 Hz at 2 degrees per second), so make it configurable. `headingAccuracy` is bucketed to 0-3 and the negative invalid-heading sentinel collapses into bucket 0, so propose an additional field. A 5-to-50 Hz rate change is weaker and optional. The FOP as an npm package is deliberately not recommended. Corrections go as PRs, there is no process to hand modules to Expo, and `ai/AGENTS.md` binds every post to anonymity: no app name, repo link, device serial or secret | 50 |
| 54 | Patches, one line of qibla copy, repository hygiene | `ai/plans/54-patches-and-copy/FINDINGS.md`, asked by the owner at the close of row 53 | OWNER-LED: the owner paused app work part way through, and the rest waits on the owner's word. Hygiene check DONE. Patch questions answered: all three patches are still needed (detail: `ai/UPSTREAM-PRS.md`). The qibla copy is merged, its phone proof waived by the owner. LEFT: the build without the Android hunks is not made | 53 |

## How a dependency upgrade is queued

- Blast radius decides, not the version number. Measure before queuing: install the candidate in a scratch worktree, run `tsc`, Biome and the full suite, count what fails.
- A patch, minor or harmless major batches with the others: one commit each, one session.
- A major that breaks code, tests or tooling gets its own session.
- Two breaking majors never share a session, even on separate branches: each needs its own device proof, and a failure with two suspects costs more to diagnose than the two sessions save.
- A major blocked upstream is not queued until the blocker moves. The four `@babel` packages belong to row 18.
- One package per branch and per commit always, because `yarn.lock` is one resolved graph and two packages in a commit cannot be reverted apart.

## Waiting on the owner

A planning session may turn one of these into a plan only after the owner approves it in that session. Row 53 locked the qibla compass, and the four qibla items below wait until the owner unlocks or schedules it:

- The dashes approval page's open choices C2, C5 to C10 and C13.
- Android card PNG backgrounds stay, because `cornerRadius()` is a no-op below API 31. Revisit only if the 3T stops being the floor device.
- Redesign the hint drawing: Android draws a phone only after it has been waved, so the drawing must show a path through the air, not a twist. The motif ban list binds every future drawing on this sheet, the hint included: no compass rose or radiating rays, no hexagram or filled eight-point star, no pinwheel or square Kufic; a repeated-block motif must have all four mirror axes; colours from `COLORS.qibla` alone.
- Two heading levers are dead and must never be revived: the field-magnitude and dip check (a 10 uT offset swings the heading 30.8 degrees while passing gates of 10% on magnitude and 5 on dip, because a compass reads only the horizontal field), and hard-iron calibration harvested from a flat turn (geometrically impossible: a circle lies on infinitely many spheres, only a figure of eight determines the offset).
- Apply a one-line fix in `awaitNorth` for two cases that need the sheet opened twice with no close between. Three smaller findings closed with the lock.
- A heading watch can be stranded with the magnetometer armed, on every phone that reads `expo-location` and predates row 53.
- Comments in the qibla files name the owner, against the anonymity rules in `ai/AGENTS.md`.

## Files here

- Briefs: the session skills `athan-planner`, `athan-executor` and `athan-auditor` in `.agents/skills/`, orchestrated by `athan-next` and started with `/athan-next`. `SDK58-PROGRAMME.md` holds the row 18 and D4 briefs.
- `TEMPLATE.md` fixes the shape of every plan. A plan folder is scaffolding: it is created at PLANNING and deleted at DONE, in the merge that lands the work.
- Surviving session folders: `27-silent-mode-bypass/FINDINGS.md` (cited by `shared/help.ts`), `39-localisation/` (rows 38 and 39) and `54-patches-and-copy/FINDINGS.md` (row 54). Beside this folder, `ai/prompts/` holds the two moonsighting prompts. Every other session's record lives in git history.

## Who changes a status, and who pushes

- A planning session sets PLANNING, READY, OWNER-LED, BLOCKED or NOT PLANNED, and fills Needs first.
- An execution session sets IN PROGRESS, EXECUTED, NEEDS REPLAN or BLOCKED. It commits and merges into `uat`, and never pushes.
- An audit session sets DONE for an EXECUTED row and never sets a row back to READY: it repairs what the executor got wrong itself. Auditing an unfinished plan leaves the status as it is, so the executor resumes its own plan.
- `uat` is the integration branch. Only planning and audit sessions push it, and only when every commit on `uat` that is not yet on `origin/uat` has been audited. A planning session that finds unaudited commits asks the owner to run the audit step first, unless it is replanning a NEEDS REPLAN row, which it does without pushing.

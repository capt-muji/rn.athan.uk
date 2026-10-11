# Plans: one queued job at a time, planned, executed, then audited

## Words

A session is one context window, opened and closed at will. Rows in this queue are jobs.
The two never share a word. The board mirrors this queue and says ticket (a queue job)
and step (a plan step); these files keep job and step.

## Order

One job at a time: plan it, execute it, audit it, only then plan the next. Every session,
fresh or resuming, starts with `/athan-run` (or `/athan-plan` to plan only). The lead skill
at `.agents/skills/athan-lead/SKILL.md` reads the queue below and git, reconstructs where
the work stands, runs the one phase that can run, and stops. The lead dispatches cold
workers for execution and review (`athan-executor`, `athan-reviewer`,
`athan-plan-griller` in `.opencode/agents/`) and verifies their work from the repository;
a worker that cannot see images calls `vision`. A session running long simply ends: every
step writes its state to the repository as it lands, and the next `/athan-run` picks the
work up from the queue, the ticked steps and the `Resume from:` note.

Planning specifies the work completely, down to contracts, names, behaviour, tests and acceptance criteria. A question the executor has to ask is a defect in the plan. Execution builds to those criteria: it chooses HOW, never WHAT, and never pushes. Audit checks the result against the plan and against the code blind, fixes what is wrong itself, then sets DONE and pushes `uat`. Work never returns to the executor.

Plan the first row that needs planning: resume a PLANNING row, refresh a NEEDS REPLAN row, before starting a NOT PLANNED row. The execution step resumes a plan left at IN PROGRESS. Pass over a row whose blocker has not moved, as a BLOCKED row is passed over. Row 18 is the live case: re-check `npm view expo dist-tags` each session. The day SDK 58 stable lands on npm, row 18 jumps the queue.

**Invariant: at most one row at a time is PLANNING, READY, IN PROGRESS or EXECUTED, unless its plan's code files are disjoint from every other in-flight row's** (the three version files are shared by every step and serialize under the version lock, so they never count as overlap). Disjoint rows form separate conflict groups and may run in parallel, one executor each. BLOCKED, OWNER-LED and research-parked rows hold no merged code, so several may wait at once. A plan anchors on one `uat` commit and quotes its code, its tests' expected numbers and the owner decisions taken against it. A row ahead changes that code, so a plan written early runs stale, and a stale anchor that still matches by text is the worst failure, because nothing catches it.

Every session ends with the handoff block in its final reply, four lines: the phase completed, the row it moved, the next job, what the owner types next (`/athan-run` or `/athan-plan`). The block is a summary for the reader, never state: the resume state is the queue row's status plus the `Resume from:` note the workers write into the plan folder, so any new session reconstructs the work from the repository alone. No gateway address, domain or key is ever written into this repository.

## Status

A row moves through NOT PLANNED, PLANNING, READY, IN PROGRESS, EXECUTED, DONE. Off that path:

- **NEEDS REPLAN:** the anchored code or an owner answer changed. The next planning pass refreshes it.
- **BLOCKED:** waiting on the owner. The reason sits in the row.
- **OWNER-LED:** the owner's own reading or decisions. Nothing for an executor to run.
- **CANCELLED:** closed before planning. Never re-planned or re-queued without the owner.
- **SUPERSEDED:** other rows took the subject. Never re-queued either.

## The queue

The queue is the only tracking file. DONE rows keep order number and short name only, and their record is git history. **A plan's documentation dies with its merge: the session that merges the branch into `uat` deletes the plan folder, the evidence under `~/athan-gitree/sessions/<N>/` and the uncited brief of the job in `ai/prompts/` in the same commit.** Research folders under `ai/features/` keep only files still cited by shipped code or config, named in the row. Code is the documentation, and MD files go stale. The one survivor is an artefact still cited by shipped code or config, named in the row. Open rows keep the pointers, the facts, Needs first (the rows that must be DONE before a plan runs), Parent (the row this one rolls up into) and Group (the shared code surface, when this row's files overlap another open row's).

| Order | Job | Status |
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

| Order | Job | Brief and plan | Status | Needs first |
| --- | --- | --- | --- | --- |
| 18 | SDK 58 next re-pin + Babel 8 rider | `ai/plans/SDK58-PROGRAMME.md` section 16 (carries facts A1 to A11) | DONE 2026-10-09, audited. Versions, incidents and durable lessons live in section 16. The owner’s ride-`next` policy stays in force: repin to the newest expo at every attempt, release candidates included, and the Babel 8 rider is re-attempted at every re-pin, still blocked upstream | 6 |
| 25 | Moonsighting research, part 2 | `ai/prompts/moonsighting-research-2.md` | NOT PLANNED, deferred until the owner schedules it. Runs behind rows 37 to 39 | rows 37 to 39 |
| 38 | D4a. i18n scaffolding | `ai/plans/39-localisation/` (read `PLAN.md`, `RECONCILIATION.md` first, then `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md` D17 to D38) | DONE 2026-10-11, audited, landed as 2.0.0-stage-1 on uat: stage one of the single-language overhaul; Arabic surfaces removed, identifier union frozen by the widened contract test, t() pipeline with flat-JSON bridge and guards, per-locale width keys with seed, the R18 targeted upgrade with the version-guarded stamp, widget props v6 with tolerance. The audit (three reviewers) fixed seven findings in `a36b9a92` (vanished-row naming, the disarmed import gate, hoisted catalog calls, dead styles, stale docs, a duplicate test, missing verdicts) and carried five to row 39; the identifier bytes held across the 3T upgrade, the require stays under 1 ms (D36), the stamp and dead-key proof sits in the step-12 suites plus one monitor-launch read (D37), bells armed by the owner (D38). The four external branches are adjudicated in RECONCILIATION.md (kept until row 39 merges). Stage two is row 39; the plan folder survives until its merge per its own records rule | 37 |
| 39 | D4b. Translation sweep | `ai/plans/SDK58-PROGRAMME.md` D4 and its owner decisions. Plan: `ai/plans/39-localisation/` (research, PLAN.md waits on two owner rulings) | NOT PLANNED. **Frontier round 1 ruled 2026-10-11, D39 to D49 in OWNER-DECISIONS.md: row 55 runs first; one job, one plan; the confidence build precedes any public 2.0.0 sizing; planning drafts the five catalogs through the R2 gates and the owner verifies every string; native strings localise now; the null-props card embeds per-locale statics keyed by device locale; `preference_language_last_armed` approved and the commit-pending marker never created; expo-localization install plus app.json edits approved; the switch keeps a progress UI over forward-only convergence; What's New now, report row at public release; catalog lock file yes, preview tier no. Still open: the channel-rename device check, the progress UI's exact face. The qibla place line is ruled (D50): the name shows exactly as the phone's geocoder returns it.** Pivot 2026-10-09: `39-localisation/SINGLE-LANGUAGE-PIVOT.md` governs - the single-language release is 2.0.0, global is 3.0.0. Research under the old two-column model, kept as evidence: The expensive half, the last thing before v2.0. RTL is the real work: 63 `left`/`right` style props, 30 row flex containers, 32 absolutely-positioned views, 30 measure sites, `I18nManager` used zero times (measured at `77eb52fe`, scripts in `39-localisation/scripts/`). Both column names always show, on the owner's ruling. 21 of 24 names fit 320dp, 23 of 24 fit 360dp. Two launch terms overflow the 123pt budget: French "Minuit islamique" 132pt, German "Sonnenaufgang" 126pt. Shrinking is rejected: `adjustsFontSizeToFit` is per-node and name and time are size-tied (`Prayer.tsx:108`, `Time.tsx:69`). The remedy is per-locale whole-list size, with a CI guard: first + second + 129pt <= screenWidth. The human-reviewer condition is withdrawn. Load-bearing for the measure sites: `List.tsx`'s `measureList` bails on `!isStandard`, so `measurementsListAtom` only ever holds the STANDARD list's rect. Audit 38 carries five inputs: module-scope t() captures (Alert.tsx:31/43, ReminderCard.tsx:10, help.ts:48, whatsNew.ts:258) must move to currentCatalog()-backed getters when the runtime locale lands; InitialWidthMeasurement.tsx:23 must pick its measured row by rendered-label length, not TITLE length; the per-file SHEET_ICON_COLOR/SETTINGS_PERF_NAME constants want one shared home; widgetTypes id/strings may go optional now the guards exist; the i18n-export/import script pair versus the yarn scripts is this row's shape to settle | 38 |
| 42 | Global prayer times | `ai/features/global-prayer-times/`: read `RESUME-FROM.md` first (the pick-up-cold record), then `FINDINGS.md`, `SOURCE-CATALOG.md`, `RECOMMENDATION.md`, `ASSUMPTIONS.md` | OWNER-LED. Research is complete, no code is written. **Two rulings taken 2026-10-09: the app asks for a location permission, and completely offline permits a yearly fetch, cached.** The other five questions are deferred by the owner to the going-global planning jobs themselves: offsets (decide at implementation, when the API hard-coding is gone), the reproduction claim (re-ask in plain words there), the launch set (the owner's stated aim is every country by the user's location, not a single second country, and localisation ships first), the default Asr, and elevation (a prayer-times question). Settled already: licensing, and London users stay on the published timetable, which R13 proved permanent and offline. Load-bearing: London is solved exactly, the publisher's interval table and equations reproduce 127,838 of 127,841 minute-comparisons, and a 732-byte interval table plus fifty future years is 10,290 bytes brotli. Timezone-city median error is 16 displayed minutes, 28.1% of the world's population within 2 minutes. The MMKV key `prayer_${date}` carries no location (`stores/database.ts:138`). The jamaah field is typed at `shared/types.ts:18-38` and never read. `adhan@4.4.6` is MIT with measured conditions: set `highLatitudeRule` explicitly, never `recommended()`, bound Asr above 60N. The provider's Asr margin changes +2 minutes from 2027. USNO fixtures: 37,340 comparisons, 0 failures | nothing to research |
| 51 | Upstream `expo-location` compass corrections | `ai/UPSTREAM-PRS.md`, asked by the owner after the heading jobs | NOT PLANNED. Three corrections to `expo-location`'s own code, so Expo maintains them and this repo carries nothing. iOS `headingFilter` is never set: on the XS, 731 of 731 readings were discarded. The Android 2-degree emission gate starves a slow turn (0.83 Hz at 2 degrees per second), so make it configurable. `headingAccuracy` is bucketed to 0-3 and the negative invalid-heading sentinel collapses into bucket 0, so propose an additional field. A 5-to-50 Hz rate change is weaker and optional. The FOP as an npm package is deliberately not recommended. Corrections go as PRs, there is no process to hand modules to Expo, and `ai/AGENTS.md` binds every post to anonymity: no app name, repo link, device serial or secret. UPDATE 2026-10-09: the corrections are filed as PR `expo/expo#51291` (all three in one, every option defaulting to today's behaviour). The row now waits on review and a published release; the patch dies at the first re-pin past that | 50 |
| 54 | Patches, one line of qibla copy, repository hygiene | `ai/plans/54-patches-and-copy/FINDINGS.md`, asked by the owner at the close of row 53 | OWNER-LED: the owner paused app work part way through, and the rest waits on the owner's word. Hygiene check DONE. Patch questions answered: all three patches are still needed (detail: `ai/UPSTREAM-PRS.md`). The qibla copy is merged, its phone proof waived by the owner. LEFT: the build without the Android hunks is not made | 53 |
| 55 | A reschedule inside 30s of an armed reminder cancels it | Defect found by the row 38 external adjudication (an external branch, `04-surfaces.md` section 2): a scheduling pass that runs within 30 seconds before an armed reminder fires cancels it (`stores/notifications.ts:1040-1051`, `:1130-1139`). Independent of localisation. Notification scheduling logic, ask-first by rule, so it gets its own job | IN PROGRESS, step 2 parked on the owner (overnight 2026-10-11): step 1 merged (`6dc9125b` into `09c13e46`, 2.0.6, hook 5297 passed, coverage 100%); the 3T proof stopped twice on the mock's per-download re-seed, which is in-process and immune to any network cut (device-proven; the fix is not implicated; record in the plan `LOG.md`, "Step 02" and "Step 02 re-run"). Owner menu: (b1') a pinned-date mock fixture built through `build-mock.zsh`'s mocks-file argument, no repo mock changed (recommended), (b2) preview tier against a controlled endpoint, (c) waive the device half and let R5.1 stand on the Jest proof, (e) a production build on the 3T, which the fleettest rule forbids without her word. Audit reviewers returned clean across three passes; two blind findings were confirmed and fixed by the lead (`bb747947` pins the record guard against mutation, `097a7bcd` restores "or imminent" to the docblock; record in the plan `AUDIT.md`). Planned at `uat` `95e5a12e` (2.0.3), 2026-10-11; plan folder `ai/plans/55-reminder-30s-cancel/` (2 steps: the keep-alive branch with a red-green suite and break script, then the 3T clock-driven device proof; proven in a scratch worktree, grilled two rounds, `PLAN OK`). Group: notifications scheduling, `stores/notifications.ts` shared with row 39's convergence work when it plans; same-group rows serialize. Queue order flipped by the owner: this row runs before row 39 (D39) | 53 |
| 56 | Ticket board: a read-only local mirror of the queue and its runs | Asked and fully decided by the owner across the 2026-10-10 planning session. An owned generator, never a product: a per-project reader (queue table, `LOG.md` step headings, committed `uat`, `opencode.db` read-only) emits `board.json`; one self-contained HTML template renders it; a Node-stdlib SSE server (directory watch plus stat poll, under 60 lines) pushes live updates, no page refresh; one `docker-compose` service with a pinned `node:24-alpine` image, the board directory mounted read-only. No database, no editing, no drag, no token: the pusher is the only writer and the human only watches. Deployed per-project in this repo first (prototype), global dashboard on a home server deferred but not designed out. Design elected from ten Opus drafts and eight iterations: A5 stripped dark (flat solid surfaces, aurora as one horizon line, a single glow on the running step) with rounded pale pastel tags; equal 280px columns; one identical card template on an 8px grid; a genuinely composed 390px phone page (one column per swipe at 88vw). Columns left to right: Backlog, Planning, Ready, In progress, Audit, Done, then Blocked and Owner-led. Per-ticket tasks: Pending, Running, Merged (middle sub-states are unobservable and cut). Dependencies render as: needs chip (bordered pill, hollow square unmet, check and strike when met), parent rollup (`1 of 3 tickets done` plus bar), conflict group as dotted left border plus mono label, and a Blocked order list at the foot. Context percentage as telemetry, reusing `oc-handoff` `contextPct` with runtime-sourced limits, formula input plus cache read, schema version check with silent skip. Determinism: a reconciling timer, never git hooks; full recompute from committed state; idempotent; staleness stamped on the board; `yarn validate` gates nothing. Portability: a per-project config file with defaults when absent and an unmapped-status bucket; machine-local state isolated so a cloner degrades gracefully. The workflow side (weights, budgets, `ROTATE`, session ids, step cursor, conflict groups) is merged at `b49c066c`. The job ends with the README update: deploy, access, reading the board, vocabulary. The board is derived, disposable, never a source of truth. AMENDED 2026-10-10 after the owner read the demo, three rulings. One: every card carries a platform tag, computed by the reader from the plan's own file list (only `android/` is Android, only `ios/` is iOS, either both or `shared/` is Both), rendered as a pale pill; nobody ever types a platform. Two: the dependency list at the foot is titled "Run order", each entry carrying its reason inline ("after #38"), and it hides entirely when nothing waits on anything. Three: one ticket in progress at a time is the rule; the exception is two in-flight tickets whose code files are disjoint (different conflict groups), shown as two hero cards with one steps rail each and the counter reading "2 in flight". The In progress column turns red only for two cards sharing a group, never for two legal parallels. Subagent sessions inside a ticket never render: one card per ticket, never per agent session. TRAJECTORY, ruled 2026-10-10: board iterations are queue rows through the existing workflow; no separate board skill exists until a second project adopts the board, at which point workflow and board extract together into one portable product and its own skills | NOT PLANNED | nothing |

## How a dependency upgrade is queued

- Blast radius decides, not the version number. Measure before queuing: install the candidate in a scratch worktree, run `tsc`, Biome and the full suite, count what fails.
- A patch, minor or harmless major batches with the others: one commit each, one job.
- A major that breaks code, tests or tooling gets its own job.
- Two breaking majors never share a job, even on separate branches: each needs its own device proof, and a failure with two suspects costs more to diagnose than the two jobs save.
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

- Briefs: the `athan-planner` and `athan-lead` skills in `.agents/skills/`, the `athan-executor`, `athan-reviewer` and `athan-plan-griller` workers in `.opencode/agents/`, started with `/athan-plan` and `/athan-run`. `SDK58-PROGRAMME.md` holds the job 18 and D4 briefs.
- `TEMPLATE.md` fixes the shape of every plan. A plan folder is scaffolding: it is created at PLANNING and deleted at DONE, in the merge that lands the work.
- Surviving job folders: `27-silent-mode-bypass/FINDINGS.md` (cited by `shared/help.ts`), `39-localisation/` (rows 38 and 39) and `54-patches-and-copy/FINDINGS.md` (row 54). Beside this folder, `ai/prompts/` holds the two moonsighting prompts. Every other job's record lives in git history.

## Who changes a status, and who pushes

- A planning session sets PLANNING, READY, OWNER-LED, BLOCKED or NOT PLANNED, and fills Needs first.
- The executor worker sets IN PROGRESS, EXECUTED, NEEDS REPLAN or BLOCKED. It commits and merges into `uat`, and never pushes.
- The lead's audit sets DONE for an EXECUTED row and never sets a row back to READY: it repairs what the executor got wrong itself. Auditing an unfinished plan leaves the status as it is, so the executor resumes its own plan.
- `uat` is the integration branch. Only the planner and the lead push it, and only when every commit on `uat` that is not yet on `origin/uat` has been reviewed. A planning session that finds unreviewed commits asks the owner to run the audit step first, unless it is replanning a NEEDS REPLAN row, which it does without pushing.

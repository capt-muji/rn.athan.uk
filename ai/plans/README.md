# Plans: every queued session is planned, then executed, then audited, one at a time

**Why this exists.** On 2026-09-15 the owner's model allowance was running low, so the work was split into three
sessions with separate jobs and fresh contexts. The split is what matters and it has not changed. What has left these
pages is the model names: the harness chooses the model, these pages are read by different models across the life of
the build, and a name in the text only dates it. A session says which JOB it is doing, never which model it is.

1. **Planning.** One planning session per queued session is the architect: it makes every decision, does the
   design and its review, takes the owner's rulings, and writes a plan that SPECIFIES the work completely. Since
   2026-09-16 that means contracts, names, behaviour, the tests to write and the acceptance criteria, not the
   executor's keystrokes: "giving it so much information that you are confident that the Executor can do its job
   perfectly" (owner). A question the executor has to ask is a defect in the plan.
2. **Execution.** One execution session per plan builds it to those acceptance criteria, reviewing every commit
   itself before merging it. It chooses HOW; it never chooses WHAT. It never pushes.
3. **Audit.** An audit session checks the executed plan against the plan, fixes whatever is wrong itself, and
   pushes `uat-2`. Work is never handed back to the executor (owner, 2026-09-16); a large repair may take more than one
   audit session, and every one of them is the auditor's.

A plan is good when an executor that makes no decisions never has to make one, and can tell for itself when its work
is finished and right.

## What the owner types

**One prompt per step: `athan-next`.** It loads the skill at `.agents/skills/athan-next/SKILL.md`, which reads the
table below and git, works out whether the next step is planning, execution or audit, runs that one step, and stops.
The same prompt starts the step after it, so the owner never has to remember where the programme stopped. If a session
ever fails to load the skill on the bare word, `Use the athan-next skill.` names it outright.

A step is one session that the owner starts, so nothing chains on unattended and no guard is needed against a run
going round in circles. A session does all three jobs itself and spawns no subagent, with one exception: reading an
image, which a session whose model cannot see images delegates to `vision` (owner, 2026-09-26). Every session ends
with a four-line handoff naming the job just done, the row it moved, and the job that comes next.

For starting one step by hand, and for the plan folders' `PROMPT.md`, which names the row's plan file in place of "the
next plan":

| Phase | Brief | Paste |
| --- | --- | --- |
| Plan | `ai/plans/PLANNER-BRIEF.md` | `Planning session. Read ai/plans/PLANNER-BRIEF.md and plan the next session in ai/plans/README.md.` |
| Execute | `ai/plans/EXECUTOR-BRIEF.md` | `Execution session. Read ai/plans/EXECUTOR-BRIEF.md and execute the next plan in ai/plans/README.md.` |
| Audit | `ai/plans/AUDITOR-BRIEF.md` | `Audit session. Read ai/plans/AUDITOR-BRIEF.md and audit the next plan in ai/plans/README.md.` |

**What this replaced (2026-09-17).** Until this date the owner ran a Python command, also called `athan-next`, that
lived outside the repository and started each step with one of two launchers, one for planning and audit and one for
execution. The command chose the step, chained the next one after a ten-second countdown, and carried three guards
that existed to protect a model allowance. With one session doing all three jobs, the routing it did is the skill's
section 2, and the guards went with the chaining. No gateway address, domain or key is ever written into this repository.

**Order: one session at a time.** Plan it, execute it, audit it, and only then plan the next one. The owner asked on
2026-09-16 which order gives the best quality; this is the answer, and the skill enforces it.

1. Plan the first row that needs planning: a PLANNING row is resumed, and a NEEDS REPLAN row refreshed, before a NOT
   PLANNED row is started.
2. Execute that row.
3. Audit it. The audit fixes whatever the executor got wrong, itself, then sets the row DONE and pushes `uat-2`. It
   never hands work back to the executor (owner, 2026-09-16).
4. Only then plan the next row.

**The invariant: at most one row at a time is PLANNING, READY, IN PROGRESS or EXECUTED.** A BLOCKED or OWNER-LED
row waits on the owner and holds no merged code of its own, so more than one of those may sit in the table at
once. A plan is written against one
`uat-2` commit and carries that commit's code verbatim: its anchors, the lines around them, the tests' expected
numbers, and owner decisions taken while looking at it. A row ahead of it changes that code, so a plan written early
is stale before it runs, and a stale anchor that still matches by text is worse than one that fails, because nothing
catches it. Replanning costs what planning cost, so planning ahead is not faster; it is the same work done twice.
Sessions 6 and 6b both change `stores/notifications.ts` and `device/notifications.ts`, which is how this was found.

The planning prompt resumes a plan left at PLANNING and refreshes one at NEEDS REPLAN, before it starts a new one.
The execution prompt resumes a plan left at IN PROGRESS, before it starts a new one.

## Status

A plan moves through NOT PLANNED, then PLANNING, then READY, then IN PROGRESS, then EXECUTED, then DONE.

Off that path:
- **NEEDS REPLAN:** the code a plan anchors on has changed, or the owner's answer changed a step. The next planning
  session refreshes it.
- **BLOCKED:** waiting on the owner. The reason is written in the row.
- **OWNER-LED:** the owner's own reading or decisions. There is nothing for an executor to run.
- **CANCELLED:** the owner closed the row before it was planned. Nothing runs it, and it is never
  re-planned or re-queued without the owner.

| Order | Session | Brief | Plan | Status | Planned at | Needs first |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6. An alert always does what its bell shows (findings 79, 80 and 82) | `ai/prompts/alert-integrity.md` | `ai/plans/06-alert-integrity/PLAN.md` | DONE | `b5159305` | nothing |
| 2 | 6b. An alert sheet change is all or nothing, both directions (finding 81) | `ai/prompts/alert-all-or-nothing.md` | `ai/plans/06b-alert-all-or-nothing/PLAN.md` | DONE | `03cc5688` | 1 |
| 3 | 7. Android: each notification replaces the one before it | `ai/prompts/replace-previous-notification.md` | `ai/plans/07-replace-previous-notification/PLAN.md` | DONE | `7c800915` | nothing |
| 4 | 8. iOS: a way for each notification to replace the one before it | `ai/prompts/ios-replace-previous-notification.md` | `ai/plans/08-ios-replace-previous-notification/PLAN.md` | DONE | `fa3337b3` | nothing |
| 5 | 9. Keep yesterday's still-due rows after 00:00 | `ai/prompts/keep-still-due-rows-after-midnight.md` | `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md` | DONE | `7289894a` | nothing |
| 6 | 12. SDK 58 beta upgrade + alarmClock | `ai/plans/SDK58-PROGRAMME.md` §12 | `ai/plans/12-sdk58-beta-upgrade/PLAN.md` | DONE | `a2498afa` | nothing (the env refresh finished on 2026-09-18: macOS 27 and Xcode 27 by the owner, the Android Studio cask upgrade and SDK check by the planning session; the plan's pre-flight verifies it) |
| 7 | 13. Agent tooling: `@expo/agent-cli` + dev-launcher niceties | `ai/plans/SDK58-PROGRAMME.md` §13 | `ai/plans/13-agent-tooling/PLAN.md` | DONE | `423e2db1` | 6 |
| 8 | 14. Expo Modules 2.0 spike: `modules/tls13` | `ai/plans/SDK58-PROGRAMME.md` §14 | none (cancelled before a plan was written) | CANCELLED 2026-09-18 (owner): Modules 2.0 in SDK 58 beta is iOS-only, no Kotlin authoring API exists to migrate `modules/tls13` to, and the 3T TLS proof already ran in session 12; never re-queue | | nothing |
| 9 | 15. Android home-screen widgets | `ai/plans/SDK58-PROGRAMME.md` §15 | `ai/plans/15-android-widgets/PLAN.md` | DONE | `0ec4fe70` | 6 |
| 10 | 15b. Android widget polish + self-refresh + mock build loop | `ai/prompts/android-widget-polish.md` | `ai/plans/15b-android-widget-polish/PLAN.md` | DONE | `825c4ce5` | 9 |
| 11 | 16a. iOS widgets: finish the containerBackground fix (stuck kinds, first-placement UX, cadence table) | `ai/prompts/ios-widget-container-background.md` | `ai/plans/16a-ios-widget-container-background/PLAN.md` | DONE | `0506f608` (tip of `wip/16a-ios-widget-archive-budget`, which the plan's step 1 lands on `uat-2`) | nothing |
| 12 | 15d. Android widgets: proportional sizing, they break outside the 3T | `ai/prompts/android-widget-proportional-sizing.md` | `ai/plans/15d-android-widget-proportional-sizing/PLAN.md` | DONE | `7b38e5a6` | nothing |
| 13 | 15c. Android widgets open the app on tap | `ai/prompts/android-widget-tap-open.md` | `ai/plans/15c-android-widget-tap-open/PLAN.md` | DONE | `31416a38` | nothing |
| 14 | 17. Widget timeline horizon: 14 to 30 days, both platforms | `ai/plans/SDK58-PROGRAMME.md` §17 | `ai/plans/17-ios-timeline-horizon/PLAN.md` | DONE | `53d9baba` | nothing |
| 15 | 19. Widget polish: Android dark colours match iOS, the active pill overhang, the horizon to 7 days, the iOS flag on | `ai/prompts/widget-polish-and-horizon.md` | `ai/plans/19-widget-polish-and-horizon/PLAN.md` | DONE (steps 1 to 3 and the 3T proof; step 4, the iOS flag flip, was correctly not started and is re-queued as row 16a) | `5926e35f` | nothing |
| 16 | 19b. The iOS widgets flag: run the G.1 acceptance protocol on the XS, then flip it | `ai/plans/19-widget-polish-and-horizon/PLAN.md` step 4 | that plan's step 4 and step 5b | DONE (2026-09-25: the protocol passed on the XS and the flag ships on) | `5926e35f` | nothing |
| 17 | 20. G.2: the blank card at placement, and the horizon to 3 days | `ai/ISSUES.md` G.2 | `ai/plans/20-g2-blank-card-and-horizon/PLAN.md` | DONE | `1406dc51` | nothing (16's flag flip makes G.2 user-visible on iOS, so the two are read together; this row does not wait on it) |
| 18 | 16. SDK 58 stable re-pin + full release-notes review | `ai/plans/SDK58-PROGRAMME.md` §16 | `ai/plans/16-sdk58-stable-repin/PLAN.md` | NOT PLANNED | | 6 + SDK 58 stable on npm (~Oct 7 to 14); may jump the queue the day it lands. **Session 21 added a second job to this row: Babel 8.** `@babel/core` 8.0.6 and its three plugins cannot move while `babel-preset-expo@58.0.3` depends on 36 Babel 7 plugins and `@react-native/babel-preset` pins `@babel/core ^7.25.2`; Babel 8 with a Babel 7 plugin throws `BABEL_VERSION_UNSUPPORTED`. Bump the four together when the SDK's presets move, never before |
| 19 | 18. Android lock screen widgets: deep investigation, 3T first | `ai/prompts/android-lock-screen-widgets.md` | `ai/plans/18-android-lock-screen-widgets/PLAN.md` (evidence in `FINDINGS.md`) | DONE (2026-09-25: investigation only, no code ships) | `2aeac17c` | nothing (verdict: no lock-screen widget API on either phone, the AOSP Glanceable Hub is inert on ColorOS and absent on Android 9, OPPO's own cards are signature-gated; the one working vehicle, a persistent notification, was built and proven then rejected by the owner, so it was reverted in full) |
| 20 | 21. Bump every non-SDK package to its absolute latest | `ai/plans/README.md` "Waiting on the owner" (owner 2026-09-18, rescoped 2026-09-25) | `ai/plans/21-bump-everything-latest/PLAN.md` | DONE | `3df9733c` | nothing |
| 21 | 22. Dependency freshness sweep: re-measure every non-SDK package and batch what has moved | `ai/plans/README.md` "How a dependency upgrade is split into sessions" | `ai/plans/22-dependency-freshness-sweep/PLAN.md` | DONE 2026-09-26 (1.28.30 to 1.28.32). The sweep re-measured all 30 non-SDK packages against the registry: **28 were already at their absolute latest and two had moved**, `@types/node` 26.6.3 and `lint-staged` 17.6.0, one commit each, no device needed. Babel 8 re-verified against the installed tree and still blocked (`babel-preset-expo@58.0.3` carries 36 Babel 7 deps, `@react-native/babel-preset` pins `@babel/core ^7.25.2`), so the four `@babel` packages stay with row 18, as do the 18 packages `expo install --check` reports. **Durable lesson: a hook that STARTS a tool has not exercised it.** The plan claimed its own commit would prove `lint-staged` works; it could not, because the step stages no file matching the tasks' glob, so the hook printed `could not find any staged files matching configured tasks`. Real proof came from running it against a matching file, which ticked both tasks and then exited non-zero with `prevented an empty git commit`, correct because Biome had stripped the test newline. The step file was corrected to match | `55df8421` | 20 (session 21 must be DONE, because it is what makes this a sweep rather than the first pass) |
| 22 | 23. Lock Screen widgets: a countdown layout, the colour hierarchy, readable sizes (iOS only) | `ai/plans/23-lock-widget-countdown-layout/PLAN.md` section 2 (owner decisions taken on device) | `ai/plans/23-lock-widget-countdown-layout/PLAN.md` | DONE (2026-09-25: owner tested all three layouts on the XS through six builds and approved) | `97bef7f4` | nothing |
| 23 | 24. Lock Screen widgets: the whole day's list (iOS only) | `ai/plans/24-lock-widget-full-day-list/PLAN.md` section 2 | `ai/plans/24-lock-widget-full-day-list/PLAN.md` | CANCELLED 2026-09-25 (owner, on device): the two day-list faces were built, audited and installed on the XS, and the owner rejected them on sight. 🐋  "it looks absolutely horrible. There's no space, everything is squeezed in... those 2 we just need to go, completely wiped as if they never existed before." The whole step was reverted in full, so `ExtrasLockWidget4` and `PrayerLockWidget5` never ship. **Never re-queue either kind.** The cause is geometry, not code: an `accessoryRectangular` face is ~160x72pt, which cannot hold six rows and stay readable, and no size or spacing tuning changes that. The six single-prayer lock faces from sessions 22 and 23 are untouched and still ship | `273abe96` | nothing |
| 24 | 25. Android widget countdown: a free-ticking Chronometer, so it can never drift (OPPO Find X8) | `ai/plans/25-android-widget-drift/PLAN.md` + `MEASURED-DRIFT.md` | `ai/plans/25-android-widget-drift/PLAN.md` | DONE 2026-09-26 (1.28.25, pushed to `uat-2` at `868bd69a`; owner accepted the session-25 merge and closed the row, forward-fixing anything found later). **The Chronometer was NOT built and the `6h 8m` format is KEPT.** Root cause was none of the three things earlier sessions blamed: the alarm is healthy (355 fires / 355 wakeups) and Glance composes fine (`wasOpen=false` is the normal post-timeout exit log; `Session._isOpen` initialises TRUE in the bytecode, and a Samsung Health control on the same phone shows `startSession` then `UI tree updated` with `wasRunning == false`). The defect was our own wiring: `WidgetRefreshTickListener` was only reachable from `armWidgetRefreshChain`, so registration was a side effect of a JS data push and died with every process restart. On the Find X8 it was simply absent, the app holding four receivers and none of them `TIME_TICK`, while 62 other registrations for that action existed on the phone. That matters because `TIME_TICK` is the one minute signal ColorOS does not defer (`windowLength 0`, `exactAllowReason=allow-listed`) while it widens our own exact alarm to a 19 to 41 second window once the screen goes off (`OplusAlarmAdjustment: MSG_SCREEN_OFF`; the dump carries `exactAllowReason=policy_permission` AND a positive window, which is impossible in AOSP, so ColorOS is patching AlarmManager). Fix binds the listener to the process instead of to a push: an `OnCreate` block in the module (1.28.23), plus the same call from `WidgetRefreshReceiver` and `WidgetRefreshBootReceiver` (1.28.24), because `OnCreate` does NOT run in the process Android revives to serve a widget, measured coming back with 3 receivers instead of 8. Measured on the X8: 38% of readings exact and worst case +2 minutes before, 100% exact and worst case +0 after, with the label flipping 1 to 4s after the edge instead of 13 to 40s. Deep-doze proof (simulated discharge + forced IDLE): our alarm fired ONCE per 3.5 min where it should fire 3 to 4 times while `TIME_TICK` fired SIX, and the widget still read exact after 3.5 and 8 minutes idle. No regression on the 3T. The Chronometer option is investigated and costed in `CHRONOMETER-OPTION.md` on `experiment/25-chronometer-ticking`: it is the real Android equivalent of iOS `timerInterval`, but expo-widgets cannot emit it, Glance owns the view ids so it cannot be overlaid, and it does not tick with the screen off either, so it would mean rebuilding all eight cards in RemoteViews XML for a window this fix already closes. **Session 25b (2026-09-26, 1.28.25) then found the gap 1.28.24 left and closed it.** The `TIME_TICK` fix is correct but incomplete: `ACTION_TIME_TICK` is only delivered while the screen is ON, so with the screen off the alarm is the only redraw left, and `dumpsys alarm` on the X8 shows ColorOS widening it to `window=+25s729ms`, `maxWhenElapsed=+34s440ms`. For up to 34 seconds of every minute the widget therefore holds the PREVIOUS minute's label, and waking inside that window shows it: measured on 1.28.24 with TIME_TICK confirmed registered, a wake at 11:51:13 read `1h 7m` against a true `1h 6m` and corrected 21 seconds later. That is the only moment a user ever reads a widget, which **withdraws assumption A5** and explains the owner's original 20 to 24 minute reports that no sampler could reproduce (every sampler woke the phone on a fixed gap and hit the deferral window only by chance). Fix: `ACTION_SCREEN_ON` added to the same listener, renamed `WidgetRefreshSystemListener`, so the redraw happens as the screen comes on instead of up to a minute afterwards. Verified registered on the X8 (SCREEN_ON and TIME_TICK both present where 1.28.24 had TIME_TICK alone); `yarn validate` green at 170 suites / 4662 tests / 100%; the breaks-3 harness extended to 6 cases and all 6 caught. ⚠️ The before/after drift comparison is NOT valid: the after-run ran on a mock-data APK (`EXPO_PUBLIC_ENV=local`), so it counted to different prayer times than the before-run. The mechanism and the registration are proven; the production improvement is unmeasured and is the one open item | `e16fcbd7` + working tree at 1.28.25 | nothing |
| 26 | 23. SDK 58 preview.7 + RN 0.88.0-rc.2: ride the beta to its latest | The owner's instruction of 2026-09-26 (🐋  "upgrade to 88 and an SDK 58 beta latest preview... regardless of if they are released candidates or not") | `ai/plans/23-sdk58-preview7/PLAN.md` | **BLOCKED: the Android widgets render `undefined is not a function` on the 3T from step 1 onward.** Steps 1 to 3 are merged and green (tsc, Biome, 170 suites, 100%), and the device proof STOPPED at step 4. Bisect proved React 19.3.0, RN rc.2 and Reanimated 4.7.0 are NOT the cause: 1.28.35 (preview.7 with the old React and Reanimated) breaks identically. Every library-side diff is additive-only, and the shipped widget bundle is correct and current, so the throw is at runtime evaluation. `LOG.md` records what is ruled out and where to start. Alarms and notifications are healthy throughout. Nothing is reverted, per the owner: fix forward `uat-2` rode preview.3 with RN rc.0 while the beta moved to preview.7 and RN to rc.2, leaving **26 packages behind the SDK's own pin set**, React among them. 4 steps, split by RISK rather than package count, because an SDK pin set is consistent only as a set. The spike found three breakages a version bump does not survive: **both native patches stop applying** (rebuilt for 58.0.7; upstream has fixed neither), **`@expo/ui` split `frame()`** into two overloads that cannot be mixed (2 widget sites), and **Reanimated 4.7 makes the new layout-animations engine the default** (blast radius: `Modal.tsx` alone). Both phones. NOT the stable re-pin: row 18 still waits on npm | `2a1dc302` | nothing |
| 25 | 11. Moonsighting research, session 2 | `ai/prompts/moonsighting-research-2.md` | `ai/plans/11-moonsighting-research-2/PLAN.md` | NOT PLANNED, deferred until further notice (owner 2026-09-18; runs after the SDK 58 programme and the deferred features) | | everything above |

- **Session 6b was planned under the previous rules**, on the morning of 2026-09-16, before "specify, do not
  dictate" was written that afternoon. Every one of its steps hands the executor finished files under
  `ai/plans/06b-alert-all-or-nothing/files/` and tells it to copy them, and it is executed exactly as written: where a
  STEP dictates rather than specifies, the dictation wins (`EXECUTOR-BRIEF.md`). Every plan from session 7 on is
  written to the new rules, and a replan may still leave a `files` step it did not have to touch, so each step says
  which kind it is, in its own part 5 and in the plan's section 6 checklist.
- "Planned at" is the `uat-2` commit the plan's anchors were verified against.
- "Needs first" lists the order numbers of the rows that must be DONE before this plan is executed, such as `1`, or
  `nothing`. A planning session replaces "set when planned".

## How a dependency upgrade is split into sessions (owner, 2026-09-25)

The owner's rule, given while session 21 ran: a major version gets a session of its own, and a batch of patch and
minor bumps shares one. Session 21 then showed what to refine, so the rule is **blast radius, not the version
number**:

| Shape of the bump | How it is queued |
| --- | --- |
| Patch or minor, no API this project touches | Batched with the others, one commit each, one session |
| A major that changes nothing here | Batched too. `lint-staged` crossed TWO majors in session 21 and cost nothing, because the config was JSON and both tasks were binaries |
| A major that breaks code, tests or tooling | Its own session. `jotai` 3 broke 82 of 170 suites through three separate causes and deserved the whole session it got |
| Two breaking majors at once | Never the same session, even on separate branches. Each needs its own device proof, and a failure with two suspects costs more to diagnose than both sessions save |
| A major blocked upstream | Not queued at all until the blocker moves. The four `@babel` packages wait on `babel-preset-expo`, so they belong to the SDK row, not a bump row |

How to tell which, before queuing: install the candidate in a scratch worktree, run `tsc`, Biome and the full suite,
and count what fails. That measurement is the whole decision, and it is cheap. Session 21's own numbers are the
worked example, in `ai/plans/21-bump-everything-latest/PLAN.md` section 5.

One package per branch and per commit stays the rule in every case (owner, 2026-09-25), because `yarn.lock` is one
resolved graph: two packages in a commit cannot be reverted apart.

## Waiting on the owner, not yet sessions

- ~~The Android card PNGs, now that Glance can draw rounded corners~~: **CLOSED by the owner on 2026-09-26, the same
  day it was raised. The PNG background stays on Android and no session is queued.** The owner read the
  `expo-widgets@58.0.5` changelog line about `cornerRadius` and asked whether the card PNG could go. The premise was
  right, and `background()` plus `cornerRadius()` would have been an exact replacement, but the modifier is a no-op
  below API 31 (evidence in `ai/AGENTS.md`), so the 3T would draw SQUARE corners while the X8 looked correct. The
  owner's ruling: 🐋  "if it doesn't work on the 1+ 3T, let's continue to use the PNG background for the widgets on
  Androids. No need to have a session for it just to remove the PNG." A platform split was not worth the second code
  path for a card that already renders correctly everywhere. **Do not re-queue this**; revisit only if the 3T stops
  being the floor device.

A planning session may turn one of these into a plan only after the owner approves it in that session; it then adds a
row above.
- The accessibility fixes listed in "Session 5 of the queue" in `ai/features/uat-2/AUDIT-FINDINGS.md`.
- The edge-to-edge built-in switch: drop `react-native-edge-to-edge` for RN's `edgeToEdgeEnabled`
  (its README recommends this on RN 0.86+; the package stays at 1.8.2 until then). Waits on an
  Android 10+ device beside the 3T, because the package's `enforceNavigationBarContrast` setting
  guards a scrim only those phones show (owner, 2026-09-18, while planning session 12).
- ~~The bump-everything-to-latest session~~: queued as row 20 on 2026-09-25, when the owner chose it as the next
  session and rescoped it (one package per branch, and a major that breaks the code is fixed in the code).
- `shared/__tests__/audioMatrix.test.ts` timing out under load: a longer timeout, or running it outside the hook.
- The dashes approval page's open choices C2, C5 to C10 and C13 (session 3).
- Finding 74: a Suhoor wrapped onto the evening before loses a day of buffer.
- Leftover notification channels on the OnePlus 3T (cosmetic).
- The athan sound change: a failed re-arm shows the old sound in Settings while some alarms keep the new one. On
  2026-09-15 the owner approved it as its own session. Its brief, its row and its place in the order are still to be
  written.
- The five deferred owner features of 2026-09-18, detailed in `SDK58-PROGRAMME.md` under "Deferred owner features",
  sequenced after the SDK 58 programme and before moonsighting: D1 sound through silent mode, D2 qibla finder,
  D3 rolling buffer 2 days to 1 plus a second reminder, D4 localization for v2.0, D5 location for v2.0. Each becomes a
  row only after the owner specs and schedules it.
- Informational: the update-prompt switch from `releases.json` to store data is ISSUES #35, pending; production iOS
  already reads the App Store via iTunes Lookup. Nothing in the SDK 58 programme conflicts with it.

## Files here

- `.agents/skills/athan-next/SKILL.md`, outside this folder: the skill the owner's one prompt loads. It picks the
  next step from the table above and git, runs it, and stops.
- `PLANNER-BRIEF.md`: the whole job of a planning session.
- `EXECUTOR-BRIEF.md`: the whole job of an execution session: precedence, rules, traps, the step loop.
- `AUDITOR-BRIEF.md`: the whole job of an audit session.
- `TEMPLATE.md`: the fixed shape of every plan, so every plan reads the same way.
- `NN-<session>/`: one folder per session, holding everything for that session:
  - `PLAN.md`: the plan, with `steps/`, `scripts/` and `scripts/anchors/` beside it;
  - `PROMPT.md`: the prompts that execute, audit or replan exactly this session, for running one out of order;
  - `LOG.md`: written by the executor as it works: each step's commit, the outputs it compared, and any stop with its
    reason;
  - `AUDIT.md`: written by the auditor: what it checked, what it found, and its verdict.
- `SDK58-PROGRAMME.md`: the briefs for queue rows 12 through 17 (the SDK 58 beta programme) plus the deferred owner
  features D1 to D5 and the ruling log behind them.

## Who changes a status, and who pushes

- **A planning session** sets PLANNING, READY, OWNER-LED, BLOCKED or NOT PLANNED, and fills "Planned at" and
  "Needs first".
- **An execution session** sets IN PROGRESS, EXECUTED, NEEDS REPLAN or BLOCKED. It commits and merges into `uat-2` on
  this Mac, and never pushes.
- **An audit session** sets DONE for an EXECUTED row. It never sets a row back to READY: what the executor got wrong,
  the audit repairs itself. Auditing an unfinished plan leaves its status as it is, so the executor carries on with the
  plan it has not finished. That is the executor resuming its own work, not work handed back to it.
- **Pushing.** Only planning and audit sessions push `uat-2`, and only when every commit on `uat-2` that is not yet on
  `origin/uat-2` has been audited. A planning session that finds unaudited commits asks the owner to run the audit
  prompt first, unless it is replanning a NEEDS REPLAN row, which it does without pushing.

## State of the phone when this programme started

On 2026-09-15 the OnePlus 3T (`8f7ada76`) was left running the mock build of 1.27.159 at the owner's request. Any plan
that needs real prayer times or real alarms on the phone starts by installing a local production build.

# Queued sessions — the index

**This file is where open sessions are tracked.** The owner asked on 2026-09-13 where that was
being kept; the answer was "three separate briefs and a memory note", which is not an answer.
One list, in order, with a status each. Add a row when a session is queued, change the status
when it starts, and keep the brief itself in this directory.

| # | Session | Brief | Status |
| --- | --- | --- | --- |
| 1 | **Verify every feature on real hardware**: the flip either side of 00:00, both clock changes, high latitude, unreadable times, `uat` against `uat-2` | `device-verification-sweep.md` | **DONE** 2026-09-13, findings 72 to 77 |
| 2 | **Fetch before wipe**: never clear a usable cache for a fetch that might fail | `data-resilience-swap-not-wipe.md` | **DONE** 2026-09-13, 1.26.33, finding 67 |
| 3 | **`--:--` for unreadable times**: per prayer, not per day; the day is still shown. Extended by the owner during session 2: missing days, dashed-row styling, 1 January, screenshots to approve | `unavailable-times-dashes.md` | **DONE** 2026-09-13, 1.27.0, findings 71 and 72. Round 2 on 2026-09-14 (1.27.1 to 1.27.14, `feat/audit-71-dashes`, merged into `uat-2` the same day) built the owner's rulings on R5, R8, R11 and R14, the bar and "ago" badge measuring only from the prayer directly above next, and `...` above a waiting `--:--` countdown; choices C2, C5 to C10 and C13 on the approval page wait for the owner |
| 4 | **Close the test-coverage gaps**: parallel agents per area, widen `collectCoverageFrom` first | `coverage-sweep.md` | **DONE** 2026-09-15, 1.27.16 to 1.27.137: statements 68.49 to 76.18 over every measured area, 3,598 to 4,089 tests, thresholds raised to 76 statements, 73 branches, 74 functions and 75 lines; findings 80 to 82 are session 6, and 79 waits for session 5's explanation |
| 5 | **Reach 100% test coverage, and gate every commit on it**: answer the owner's coverage questions and explain findings 79 and 80 simply first; add a React renderer; `yarn validate` runs coverage; no commit or push without 100% coverage of the change | `coverage-100.md` | **DONE** 2026-09-15, 1.27.140 to 1.27.157: a React renderer and one documented test pattern (`__tests__/README.md`), coverage from 76.18% to 100% on all four measures over every measured file (4,089 to 4,472 tests), global thresholds at 100, and a pre-commit and pre-push gate refusing any change below 100%; accessibility findings and two decisions for the owner in "Session 5 of the queue" in `AUDIT-FINDINGS.md` |
| 6 | **An alert always does what its bell shows**: fix findings 79, 80 and 82 (settings hang, Ramadan splash, the scheduling lock released early); 79 approved by the owner after session 5's explanation; design reviewed first. Finding 81 moved to session 6b on 2026-09-15 | `alert-integrity.md` | **DONE** 16 September 2026, 1.27.177 to 1.27.179: Open Settings always answers (79), a start-up error lifts the splash in Ramadan (80), and the scheduling lock waits for every piece of work (82); proven on the 3T. Finding 81 is session 6b |
| 6b | **An alert sheet change is all or nothing, both directions**: finding 81, with the sturdier design the first design review asked for, reviewed again before building | `alert-all-or-nothing.md` | **DONE** 16 September 2026, 1.27.189 to 1.27.190: a refusal is answered rather than thrown, a failed change puts the bell and the alarms back inside the same lock acquisition, and a prayer the phone refuses is marked and put right on the next launch or return; a notification call that does not answer in fifteen seconds counts as refused; proven on the 3T with a throwaway build that forces the refusal |
| 7 | **Android: each notification replaces the one before it**: one shared tag, and notifications due at the same instant are left to the system | `replace-previous-notification.md` | **DONE** 17 September 2026, 1.27.196 to 1.27.203: every Android notification posts under one shared tag with id 0, so each replaces the one before it; scheduling, cancelling and stored identifiers unchanged; proven on the 3T through the update path (the old build's dead PendingIntents deliver nothing), a same-instant Sound pair (one muted by the system), a channel crossing and a five-fire return to the real clock, the tray holding exactly one throughout, and no sound outside the app's own files (mechanism and channel record) |
| 8 | **iOS: find a way for each notification to replace the one before it**: investigate, and prove each answer on the iPhone | `ios-replace-previous-notification.md` | **DONE** 17 September 2026: iOS studied on the XS with a throwaway app and no owner hands: reusing a delivered notification's identifier DOES replace it (59 observations; not usable as the fix, since one id would also collapse the pending set), delivery needs no app and one call clears everything on any app run, the foreground handler cleared every earlier delivered one leaving only the newest, and grouping needs a two-line native change; four options with costs recorded in AUDIT-FINDINGS for the owner to choose from, nothing built |
| 9 | **Keep yesterday's still-due rows after 00:00**: a Magrib or Isha after midnight stays on screen and keeps its alarm, before v2.0 | `keep-still-due-rows-after-midnight.md` | queued |
| 10 | **Moonsighting.com / Khalid Shaukat research**: v2.0 prerequisite, needs its own clean context, and runs after every other session | `moonsighting-research.md` | **RAN** 2026-09-14 on branch `research/moonsighting`. All four steps done: every page, document and archived method-page version read; London 2026 reproduced; implementations measured. Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md` |
| 11 | **Moonsighting research, session 2**: help the owner read the findings, then the small remainders and an independent review | `moonsighting-research-2.md` | **PAUSED** by the owner 2026-09-14. The owner hasn't read the findings yet, section 5's 11 questions are unanswered, and whether the research is usable for v2.0 is open. Resume at step 1 of the brief; the start prompt is at its end |

Ordering is the owner's, given 2026-09-13: the device sweep runs before everything else, and the
moonsighting research runs after everything else. On 2026-09-15 the owner queued the coverage session next and asked
for findings 80 to 82 to be fixed, so those became sessions 5 and 6 and the sessions queued before them moved down two:
old 5 to 9 are now 7 to 11. Documents written before 2026-09-15 use the old numbers. Sessions 7 to 9 sit in the order
they were queued until the owner places them.

## Planned by Claude, executed by GLM (owner, 2026-09-15)

From session 6 on, each queued session is first planned in full by Claude in its own planning session, then executed by
GLM in Claude Code from that plan, then audited by Claude before anything is pushed. The programme, its status table
and the prompts the owner types are in `ai/plans/README.md`. A session's status in the table above changes to DONE only
when its plan is audited, or when its plan row is OWNER-LED and the owner says it is finished.

Decided by the owner on 2026-09-15:
- **Code reviews during execution run on GLM,** as subagents of the GLM session. A Claude audit session checks each
  executed plan as a whole, and only planning and audit sessions push `uat-2`.
- **In an execution session, `ai/plans/EXECUTOR-BRIEF.md` and the plan take precedence** over the Claude-only global
  instructions and memory notes that session also loads.
- **Execution sessions start with `claude-glm`,** which is GLM 5.3 through the home gateway, with GLM 5.3 Flash for the
  `vision` subagent. Planning and audit sessions start with `claude-plan`, which is Opus 5 at xhigh effort.
- **Nothing of OpenCode's is changed** by any session.
- **Every response shows the model in use**, for the session and for every subagent, in text, headings and tables, so
  the owner can track which model did what.

## Waiting on the owner, from session 1

None of these is a session yet. Each needs the owner's decision first.

- **Traced, not run (finding 74):** a Suhoor wrapped onto the evening before loses a day of buffer.
  The other half, 1 January's failed previous-year fetch rejecting `sync()`, was ruled on by the
  owner during session 2 and is queued in session 3 as R13.
- **Leftover channels on the 3T:** cosmetic. Clearing the app's data or uninstalling removes them,
  and either needs a fresh backup of the owner's data first.

## Decided by the owner, 2026-09-15, from session 4

- **Findings 80, 81 and 82 get fixed**, in session 6 (`alert-integrity.md`). The owner's rule: what fires always
  equals what the bell shows (Off none, Silent silent, Sound sound), with no exception and no waiting for a refresh.
- **Finding 79 is not decided.** Session 5 explains 79 and 80 simply, because they were not clear, and the owner
  decides on 79 after that.
- **Yes to a React renderer** and **yes to `yarn validate` running coverage**; both are built in session 5
  (`coverage-100.md`).
- **No commit and no push without 100% coverage of the change**, and 100% overall is the target, with reviewed,
  written exclusions only for genuinely meaningless code.

## Decided by the owner, 2026-09-15, from session 5's answers

- **Finding 79 gets fixed** in session 6, with the small fix: never wait forever, and read the permission when the user
  comes back to the app.
- **Finding 80: any start-up error always shows the error page**, so Refresh can be reached; the splash never stays
  over it.
- **Component tests follow one documented pattern** (`__tests__/README.md`) that later, weaker models can copy exactly.

## Decided by the owner, 2026-09-15, while planning session 6

- **An alert sheet change (every at-time, reminder and interval change) is all or nothing, in both directions.** When
  the phone does not accept every part of a change, the app undoes the whole change, bell and alarms together: a failed
  arm when turning on puts the bell back and cancels what did arm; a refused cancel when turning off puts the bell back
  and re-arms that setting. A refused Off change therefore shows the bell on again, with its alarms matching it: the
  owner put a truthful bell above the Off tap taking effect. If the phone refuses the undo too, the app tries again at
  the next launch, return to the app or background run; this was explained to the owner as a limit of the phone, the
  one case where the state waits for a later event, and the owner confirmed the all-or-nothing rule. The owner's words:
  "If the alert fail to schedule, then I shouldn't have sound on. It should be sound off."
- **Both directions are fixed inside finding 81's step.** Later the same evening the owner split finding 81 out of
  session 6 into session 6b (`alert-all-or-nothing.md`), because the design review asked for a sturdier design than
  would fit before midnight: session 6 plans findings 79, 80 and 82, and session 6b plans finding 81 after it.
- **The athan sound change has the same gap** (Settings shows the old sound again while some alarms keep the new one)
  and **becomes its own session later**, not part of session 6. Its brief is not written yet, so it has no row in the
  table above. It waits in "Waiting on the owner, not yet sessions" in `ai/plans/README.md`.
- **Open Settings opens Athan's own settings page on both platforms** (`Linking.openSettings`, the App info page on
  Android): the plan review found, and the planner checked on the 3T, that Android 9 closes its app notification page at
  once when the request names no package, as the app's request does today. The owner chose the App info page over
  adding the package name.
- **A late return carries on where you left off.** If the user taps Open Settings and comes back to Athan hours later,
  the app reads the permission then and finishes what was started: the sheet opens, or the chosen option becomes
  selected. Nothing is saved until the sheet closes, as today. Owner, 2026-09-16, while planning session 6.
- **Finding 79 is proven on the 3T with the owner's hands:** the owner unlocks the phone and flips Athan's notification
  switch when the execution session asks.
- **The 3T ends every session on the latest `uat-2` build, as a mock build with the Asr-next mock data** (Fajr 2 to 3
  minutes past, Asr 60 to 119 seconds away). Production builds are installed only for the proofs that need real times.

## Decided by the owner, 2026-09-16, while planning session 6b

- **A call into the notification system that has not answered in 15 seconds is treated as refused.** The owner's
  words: "maybe give up after 15s instead of 30s? same as option 1 but shorter". Since session 6 the scheduling queue
  waits for every piece of work it started, so one native call that never answers would stop the app arming or
  cancelling anything for the rest of that run, with the bell already showing the user's choice. A timed-out call is
  undone like any other refusal and the prayer is marked for repair.
- **A prayer the phone refused is repaired on its own, not by a full reschedule.** The app marks that prayer and, on
  the next launch or return to the app, redoes only that prayer. The 12-hour cycle keeps its present meaning. The
  owner chose this after asking whether the first proposal was expensive and being shown the measurement on their own
  3T: a full pass on returning from background took 118 ms and 123 ms
  (`~/athan-device-sweep/session5/mockcheck/reopen.logcat.txt`), against 47, 55, 52 and 50 ms for a production build
  with one alert on (`AUDIT-FINDINGS.md`, "Measured on the device"). Repairing one prayer is about a tenth of that
  work.
- **The refusal is forced on the 3T with a throwaway build.** The owner's words: "I don't want to see it, but I will
  let you do as much testing as you need to to ensure it is absolutely bulletproof. So yes, you can build whatever you
  want, you can throw away whatever you want. It needs to be bulletproof. I don't need to see it. I trust you to do
  it."
- **The 3T is always left unlocked, with Athan open and "Stay awake" on.** The owner's words: "I have purposefully
  left the screen unlocked, and the app is open and stay awake is on... This should be the state always." No session
  changes that setting unless it is deliberately testing lock or sleep behaviour, and it puts it straight back.

## Decided by the owner, 2026-09-17, while planning session 7

- **The notifications stacked by earlier builds stay in the tray.** The owner's words: "The users can
  swipe away the ones that were there before... the old ones can just be cleared away by hand. We don't
  want to make extra work for us." No cleanup or dismissal code is built with the shared tag.
- **Same-instant Sound pairs keep the system's behaviour, one sound at a time.** Shown that the second of
  two Sound notifications landing in the same second is muted and its post can stop the first's sound
  mid-play, the owner answered: "I only ever heard 1 make a sound... we should stack them. The user, it's
  up to the user... I don't think anything breaks." Their earlier ruling (2026-09-13, finding 78) stands:
  the system decides, as long as no default sound ever plays; the device proof measures what actually
  plays.
- **The repository's `opencode.json` sets `experimental.subagent_depth` to 2.** The harness blocked
  nested subagents ("Subagent depth limit reached"); the owner asked for the limit to be looked at and
  fixed if simple. The setting took effect immediately in the live session. Execution and audit sessions
  need it too: their Code Reviewer subagents sit one level down.
- **A planning session commits and pushes its own final docs commit to `uat-2`.** The owner will not
  commit by hand. Relayed by the orchestrator on 2026-09-17, after the execution session stopped on the
  planning work sitting uncommitted: the plan files land on `uat-2` inside the planning session itself.
- **The fixed-days mock's date keying is the planning session's to decide.** Relayed by the orchestrator
  on 2026-09-17, after the execution session found the mock's blocks keyed two days early against the
  plan's device-proof predictions and its own docstring. The planning session re-keyed every date two
  days later (2026-09-08 to 2026-09-19) so each prediction sits on the date the proof drives the clock
  to; the prayer values are unchanged.

## Decided by the owner, 2026-09-17, during session 7's device proof

- **Session 7's posts reading comes from the system's `notification_enqueue` events, and the tray is
  asserted as exactly one shared-tag notification.** The owner's 12:34 answer to the 12:31 question,
  relayed with the 12:39 delegation to the planning session: this device drops the
  `NotificationService: enqueueNotificationInternal` DEBUG lines the plan first read, while the events
  buffer logs every post; and Android cancels an app's posted notifications on package replace, so the
  update itself cleared the stacked pile and `TRAY` reads 1 after each fire. No dismissal code exists;
  the earlier "the tray keeps whatever was stacked before the update" ruling keeps only its code
  consequence. The planning session amended the plan letter to match (version 1.27.199): 7.2 item 11's
  measured readings stand, and execution resumes at 7.3 with the row still IN PROGRESS.
- **Session 7 is replanned from scratch and executed once.** The owner's 13:20 order, after the proof
  had asked four questions in an hour: "You seem to be asking me a lot of questions. Perhaps we should
  replan this entire task and execute it properly like stop all the sessions, replan everything,
  execute it, etc. Like do it from scratch again." Step 1's merged code stays; the plan and the device
  proof were rebuilt (version 1.27.202) around a baseline the proof creates itself, so the single
  execution runs with every count predicted and no question left to ask.
- **The planning session owns every planning question, and the push.** Owner delegation relayed by the
  orchestrator on 2026-09-17: the replan decides everything itself, commits, reviews, merges and pushes
  per its brief's conventions, leaves the row READY, and brings `uat-2`'s unpushed commits current.

## Decided by the owner, 2026-09-17, while planning session 8

- **The iOS study runs on the iPhone XS, as throwaway builds, and nothing merges.** The deliverable
  is a finding with the best achievable behaviours and their costs, and the owner chooses from it
  later; the brief's "nothing is built until the owner chooses" stands.
- **The owner does nothing during the study.** Their words: "you do everything". The study needs no
  tap, no gesture and no unlock schedule: it asks for provisional notification authorization (no
  dialog), drives the phone from the Mac, and the one case that could still need the owner (the
  phone locked at the foreground phase) stops and asks for a single unlock.
- **The study runs under its own app id, `com.mugtaba.athan.experiments`.** The owner's installed
  Athan (1.26.28) and its data are never touched. On-the-fly provisioning of the new id was proven
  while planning; if it fails at execution time the executor stops and asks rather than falling
  back.
- **No subagents in these sessions, for now.** The owner's instruction at the start of this
  programme's move into OpenCode-driven sessions: "Do everything yourself. Do not use any
  subagents for now." Planning, including its review, ran without any; the plan carries the rule
  into execution and audit.

## Decided by the owner, 2026-09-17, after session 8

- **iOS needs no build.** The owner's words: "We already have the Android fixed... iOS, they can
  swipe away, it's not a problem. We can just ignore iOS." Session 8's four options are declined;
  the iOS pile stays until the user clears it. The research stands recorded in
  `ai/features/uat-2/AUDIT-FINDINGS.md` ("Session 8 of the queue") should this ever be revisited.

## Decided by the owner, 2026-09-17, while planning session 9

- **A day hands over after its last readable row, never at 00:00 while a readable row of that day is
  still to come.** The owner confirmed, as one rule, their 2026-09-13 words ("A day stays current
  until its last prayer has passed, not until 00 for both the screen and the alarms. Exactly,
  exactly, exactly.") and session 3's 2026-09-14 default (a day whose last row is unreadable moves on
  after its last readable row): the rule holds even when the readable row falls after 00:00 London,
  so on the high-latitude mock a Friday with Isha dashed still keeps its list until the 00:40 Magrib
  has passed, and nothing moves at 00:00 while a readable row is still due. Session 3's dashes
  behaviour and session 9's still-due rows now share the one hand-over rule.
- **The evening-Suhoor buffer loss stays out of session 9.** A Suhoor wrapped onto the evening before
  its list day (a Fajr before 00:20, high latitude only) loses a day of alarm buffer, but the owner
  declined to fold it into session 9: that session fixes the post-midnight rows only, and this
  defect keeps its place in "Waiting on the owner, not yet sessions" in `ai/plans/README.md`.
- **The step 2 coverage gap is closed by a test, not by narrowing the change.** The step 2 commit was
  refused by the 100% coverage gate: no test the plan named ever called `canStillFire` with a record
  older than yesterday, so its `return false` branch was unreachable as specified. The owner chose
  "add the missing test" over merging without it (2026-09-17); the plan was refreshed with a sixth
  alarm test that refuses a cancel of a record two days old and asserts the record is dropped, and a
  fifth break pinning the same decision.

## Also live, not sessions

- `audit-changes-2.md` — the audit brief currently being worked through. Findings and their
  closures live in `ai/features/uat-2/AUDIT-FINDINGS.md`.
- Mutation harness: `ai/features/uat-2/mutate.py` and `mutate2.py`. Re-run against any file an
  audit touches; a survivor is a place the suite cannot see.
- Finding 76: three wrong code comments and a stale `ai/AGENTS.md:523` note, small documentation
  fixes.

## Standing rules that apply to every session in this list

- Never touch `uat`. One finding → one branch → one commit, version-bumped, merged `--no-ff`
  into `uat-2`.
- Never build on EAS and never push to it. EAS and the Expo MCP are read-only.
- `releases.json` is untouchable.
- Keep every visual exactly as it is — fixes change behaviour, never pixels. The one standing
  exception is session 3's `--:--` rendering and its styling rules, which the owner specified
  directly.
- **Never copy, average or synthesise a prayer time.** Owner ruling, 2026-09-13, absolute.
- Comments explain **why**, never what. The code already shows what.
- Every change deep-reviewed by an agent with no stake in it, and verified on the device.

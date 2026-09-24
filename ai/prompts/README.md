# Queued sessions — the index

**This file is where open sessions are tracked.** The owner asked on 2026-09-13 where that was
being kept; the answer was "three separate briefs and a memory note", which is not an answer.
One list, in order, with a status each. Add a row when a session is queued, change the status
when it starts, and keep the brief itself in this directory.

| # | Session | Brief | Status |
| --- | --- | --- | --- |
| 11 | **Moonsighting research, session 2**: help the owner read the findings, then the small remainders and an independent review | `moonsighting-research-2.md` | **PAUSED** by the owner 2026-09-14. The owner hasn't read the findings yet, section 5's 11 questions are unanswered, and whether the research is usable for v2.0 is open. Resume at step 1 of the brief; the start prompt is at its end |

Ordering is the owner's, given 2026-09-13: the device sweep runs before everything else, and the
moonsighting research runs after everything else. On 2026-09-15 the owner queued the coverage session next and asked
for findings 80 to 82 to be fixed, so those became sessions 5 and 6 and the sessions queued before them moved down two:
old 5 to 9 are now 7 to 11. Documents written before 2026-09-15 use the old numbers. Sessions 7 to 9 sit in the order
they were queued until the owner places them.

## The programme now

From session 6 on, each queued session is planned in full in its own planning session, executed
against that plan, then audited before anything is pushed; a session's status in the table above
changes to DONE only when its plan is audited, or when its plan row is OWNER-LED and the owner
says it is finished. The live programme, its status table, the prompts the owner types and the
SDK 58 ruling log live in `ai/plans/README.md` and `ai/plans/SDK58-PROGRAMME.md`; items waiting
on the owner are that file's "Waiting on the owner, not yet sessions" list. (The
planning/execution/audit split was created 2026-09-15 to spare the owner's Claude allowance;
since 2026-09-17 every job runs in OpenCode on GLM 5.3, and the old Claude/GLM model routing is
history — "a session now says which job it is doing rather than which model".)

## Standing rulings from finished sessions

- The 3T ends every session on the latest `uat-2` build, as a mock build with the Asr-next mock
  data (Fajr 2 to 3 minutes past, Asr 60 to 119 seconds away). Production builds are installed
  only for the proofs that need real times (owner, 2026-09-16).
- The 3T is always left unlocked, with Athan open and "Stay awake" on (owner, 2026-09-16). No
  session changes that setting unless it is deliberately testing lock or sleep behaviour, and it
  puts it straight back.
- A planning session commits and pushes its own final docs commit to `uat-2`. The owner will
  not commit by hand (relayed by the orchestrator, 2026-09-17).
- `expo-env.d.ts` is deleted, not worked around. If an Expo command recreates it, delete it
  again (owner, 2026-09-18, session 12).
- The `@expo/agent-cli` rulings — narrow npx-based adoption, four commands forbidden — are
  revisited at session 16, the SDK 58 stable re-pin (planner, 2026-09-18; findings in
  `ai/features/agent-tooling/FINDINGS.md`).

## Decided by the owner, 2026-09-24, while planning session 15d

- **The Android widget learns its width from a props stamp, not from a Glance fraction.** The
  layout's columns are shares of the width the launcher actually granted, which
  `modules/widgetrefresh` stamps into each kind's props from `OPTION_APPWIDGET_MIN_WIDTH`,
  beside the `size` stamp it already writes. Chosen over patching `expo-widgets`' converter so
  the layout's correctness never depends on a patched dependency. The converter bug is recorded
  for a future upstream PR, not fixed in this session.
- **Both Android phones stay on the bench for session 15d.** The Find X8 returns to its user
  afterwards, so the device proof runs on both phones while it is here: at each phone's native
  density and under a display-size override.
- **Widget sizes stay locked** (`resizeMode="none"`, re-affirmed while planning 15d). The eight
  kinds ARE the size choices, as session 15b ruled. The granted width still changes without a
  resize, when a user re-columns the home grid or changes display size, and the stamp tracks it.
- **The main session does the planning, the execution and the audit itself**, start to finish,
  looping on its own work until it is right. Reviewing, finding and fixing is the session's own
  job, not something handed to a reviewer.
- **A subagent must run the same model as the session that spawns it.** The owner's rule, given
  2026-09-24 and verified that day: no mixed-model work, for any task, vision included. A
  subagent is a way to parallelise or to get fresh eyes on the session's own work, never a way
  to reach a different model.
- **No model names in this repository.** The harness chooses the model, and the same pages are
  read by different models over the months of this build, so naming one dates the page and
  misleads the next reader. This supersedes the "Show the model" wording in `PLANNER-BRIEF.md`,
  `EXECUTOR-BRIEF.md` and `AUDITOR-BRIEF.md`, and the Model columns those briefs ask for.

## Decided by the owner, 2026-09-24, while planning session 15c

- **The widget tap rides a patched `expo-widgets`, not a provider subclass of our own.** The patch
  gives the library's existing `Button` an `openApp` prop that maps to Glance's `actionStartActivity`,
  so the launcher starts the app directly. The rejected alternative, a config plugin writing a
  provider base class that starts the app when the tap broadcast arrives, depends on Android's
  background-activity-launch rules granting a broadcast receiver permission to start an activity,
  which the 3T on Android 9 cannot prove either way.
- **A tap opens the app the way its launcher icon does**, not a forced navigation to a screen. The
  app resumes what it was last showing, or cold-starts to the main screen.
- **All eight kinds, the whole card, every state**: both sizes, both themes, both schedules, and the
  live, out-of-date and placeholder cards. The entire card is the tap target, so there is nothing to
  aim at.
- **No upstream PR in this session.** 🐋  "don't just create PRs, only as a last resort". The patch is
  proven on two Android versions here, and the finding is recorded for a later session to raise.
- **Genuinely test it, before and after.** 🐋  "we have to test them before and after, then we go into
  the actual tests... Don't write comments. And if you do, make sure they are very, very compact and
  they explain the why." The patch is fifty lines in one file with one comment, and the tap is proven
  on two Android versions before anything is called done.

## Decided by the owner, 2026-09-20, while planning session 16a

- **Both lock layouts centre**, via `containerRelativeFrame({ axes: 'horizontal' })`: a real
  SwiftUI attribute, no Spacer pairs (the 2026-09-20 ruling stands: "no empty-view tricks,
  nothing hacky"). iOS 16 renders leading (the modifier needs 17); accepted as degradation.
- **Nebula: adjust first.** One owner-steered iteration round on the simulator, then the
  verdict: keep as runtime blur, keep and bake PNGs, or drop. Deferring the verdict is allowed
  and changes nothing.
- **The expo-widgets memoisation patch is measured before any PR decision.** The owner's words:
  "we're going to remove this patch and try and see if it works without it and see the
  difference in CPU before versus after... Maybe it's not even a fix we want to do." Session
  16a's execution measures both sides on the simulator; the PR is not opened.
- **The owner eyeballs every screen.** No vision subagent; every visual checkpoint is the owner
  looking at the actual device or simulator and answering the plan's question.
- **No subagents at all** (re-affirmed 2026-09-20): "I want you to do everything yourself, no
  subagents." Reviews are the session's own recorded diff reviews; the audit is the independent
  gate.
- The six commits on `wip/16a-ios-widget-archive-budget` (1.27.306 to 1.27.312) are session
  16a's own work, landed on `uat-2` by its plan's step 1; `25ffe2ee`'s diagnostics were
  reverted inside that range, so the merged tree is clean.
- **Lock Layout 2 carries no countdown** (owner, during 16a's device pass): after the tick
  centring fixed Layout 1 but Layout 2 still read left-aligned, the owner ruled its content down
  rather than chasing the centring — "remove the countdown timer from layout 2... it should just
  be the prayer name and the absolute time, remove the dot after it, and the countdown after it,
  and then centre align it horizontally in the whole widget." Landed 1.27.316.
- **The nebula orbs are dropped and the memoisation patch with them** (owner, 2026-09-20, from
  the real-device A/B): the fresh-placement containerBackground flash was the orbs' render cost,
  not the patch's absence — the no-patch no-orb control placed clean — so the orbs go, the dark
  card stays today's flat indigo-black `rgba(18, 14, 40, 0.95)`, and the patch, its postinstall
  hook and the patch-package devDependency are removed. The upstream PR idea dies with the
  patch. Landed 1.27.318 and 1.27.319.
- **The 3T carries the original-id app only, no fleettest** (owner, 2026-09-20): "just have the
  original, no fleet test... no one on this phone is using the original, so we can just delete
  and reuse the original as we want." Session-end state on the 3T is a plain `com.mugtaba.athan`
  build. Durable lesson attached: Android widget builds need `EXPO_PUBLIC_ANDROID_WIDGETS=1`
  present at prebuild and bundle time or the APK silently ships picker-less.
- **The PNG-orb bake ran as this session's tail experiment and is now CLOSED FOR GOOD** (owner,
  2026-09-20, final ruling): the experiment compared runtime blur against a baked PNG card on
  the XS; the flash proved a marginal first-render race (same configuration flashed once, clean
  another time), and the owner then ruled: "completely, completely remove the orbs. Anything to
  do with the orbs, just keep it flat for both Android and iOS, just keep it completely,
  completely flat." The experiment branch was discarded without merging; both platforms stay
  flat from 1.27.318. The look design continues from the flat base in the owner's next session.
  Durable lessons kept: PIL `paste` with a mask replaces pixels (use `alpha_composite`); SwiftUI
  `Image(assetName:)` needs a real asset catalog, not loose bundle PNGs.
- **Android lock screen widgets: queued as session 18, investigation first** (owner,
  2026-09-20): "make this an entire session of its own... let's try to do it on the 3T first.
  Deep investigation." Brief at `ai/prompts/android-lock-screen-widgets.md`, row 15 in
  `ai/plans/README.md` (moonsighting stays absolute last). The brief leads with the platform
  truth to verify: Android removed lock screen widgets in 5.0 and has no API on any modern
  device including the 3T; the leading candidate vehicle is a persistent lock-screen
  notification carrying a system-ticked countdown chronometer, to be proven on the 3T before
  the owner rules on building anything.

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

## Decided by the owner, 2026-09-18, while planning session 15 (for session 17, not yet planned)

- **Session 17's goal widened:** widget data horizons beyond 14 days on both platforms, toward
  "the user never needs to open the app"; 30 days is the floor of the ambition, not the ceiling.

## Closed prompts (index)

One line each; a session's row moves here when it closes. Full detail is in git history,
`ai/plans/` and `ai/features/`. The numbers are the table's session numbers, including the
2026-09-15 renumbering (see the ordering note above).

- 1. `device-verification-sweep.md` — CLOSED — verify all features on hardware
- 2. `data-resilience-swap-not-wipe.md` — CLOSED — fetch before wiping usable cache
- 3. `unavailable-times-dashes.md` — CLOSED — dashes for unreadable prayer times
- 4. `coverage-sweep.md` — CLOSED — close the test-coverage gaps
- 5. `coverage-100.md` — CLOSED — reach and gate 100% coverage
- 6. `alert-integrity.md` — CLOSED — alerts match their bell display
- 6b. `alert-all-or-nothing.md` — CLOSED — alert sheet changes commit atomically
- 7. `replace-previous-notification.md` — CLOSED — Android notifications share one tag
- 8. `ios-replace-previous-notification.md` — CLOSED — iOS replacement study, options declined
- 9. `keep-still-due-rows-after-midnight.md` — CLOSED — keep post-midnight still-due rows
- 10. `moonsighting-research.md` — CLOSED — v2.0 prerequisite moonsighting research
- 12. `SDK58-PROGRAMME.md` §12 — CLOSED — SDK 58 beta alarmClock wave
- 13. `SDK58-PROGRAMME.md` §13 — CLOSED — agent CLI and dev-launcher tooling

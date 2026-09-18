# Plans: every queued session is planned, then executed, then audited, one at a time

**Why this exists.** On 2026-09-15 the owner's Claude allowance was running low, so the work was split into three
sessions with separate jobs and fresh contexts. On 2026-09-17 that allowance ran out and the whole programme moved to
OpenCode on GLM 5.3, with GLM 5.3 Flash for reading images. The split is what matters and it has not changed; what
left these pages is the model names, so a session now says which job it is doing rather than which model it is:

1. **Planning.** One planning session per queued session is the architect: it makes every decision, does the
   design and its review, takes the owner's rulings, and writes a plan that SPECIFIES the work completely. Since
   2026-09-16 that means contracts, names, behaviour, the tests to write and the acceptance criteria, not the
   executor's keystrokes: "giving it so much information that you are confident that the Executor can do its job
   perfectly" (owner). A question the executor has to ask is a defect in the plan.
2. **Execution.** One execution session per plan builds it to those acceptance criteria, including a code review of
   every commit by a subagent. It chooses HOW; it never chooses WHAT. It never pushes.
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

Every step runs in OpenCode on GLM 5.3, and the `vision` subagent reads images on GLM 5.3 Flash. A step is one
session that the owner starts, so nothing chains on unattended and no guard is needed against a run going round in
circles. Every session ends with a four-line handoff naming the job just done, the row it moved, and the job that
comes next.

For starting one step by hand, and for the plan folders' `PROMPT.md`, which names the row's plan file in place of "the
next plan":

| Phase | Brief | Paste |
| --- | --- | --- |
| Plan | `ai/plans/PLANNER-BRIEF.md` | `Planning session. Read ai/plans/PLANNER-BRIEF.md and plan the next session in ai/plans/README.md.` |
| Execute | `ai/plans/EXECUTOR-BRIEF.md` | `Execution session. Read ai/plans/EXECUTOR-BRIEF.md and execute the next plan in ai/plans/README.md.` |
| Audit | `ai/plans/AUDITOR-BRIEF.md` | `Audit session. Read ai/plans/AUDITOR-BRIEF.md and audit the next plan in ai/plans/README.md.` |

**What this replaced (2026-09-17).** Until this date the owner ran a Python command, also called `athan-next`, that
lived in a Claude Code setup outside the repository and started each step with one of two launchers: `claude-plan` for
planning and audit on Claude Opus 5 at xhigh effort, `claude-glm` for execution on GLM 5.3. The command chose the
step, chained the next one after a ten-second countdown, and carried three guards that existed to protect the Claude
allowance. With one model doing all three jobs in OpenCode, the routing it did is the skill's section 2, and the
guards went with the chaining. No gateway address, domain or key is ever written into this repository.

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

| Order | Session | Brief | Plan | Status | Planned at | Needs first |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6. An alert always does what its bell shows (findings 79, 80 and 82) | `ai/prompts/alert-integrity.md` | `ai/plans/06-alert-integrity/PLAN.md` | DONE | `b5159305` | nothing |
| 2 | 6b. An alert sheet change is all or nothing, both directions (finding 81) | `ai/prompts/alert-all-or-nothing.md` | `ai/plans/06b-alert-all-or-nothing/PLAN.md` | DONE | `03cc5688` | 1 |
| 3 | 7. Android: each notification replaces the one before it | `ai/prompts/replace-previous-notification.md` | `ai/plans/07-replace-previous-notification/PLAN.md` | DONE | `7c800915` | nothing |
| 4 | 8. iOS: a way for each notification to replace the one before it | `ai/prompts/ios-replace-previous-notification.md` | `ai/plans/08-ios-replace-previous-notification/PLAN.md` | DONE | `fa3337b3` | nothing |
| 5 | 9. Keep yesterday's still-due rows after 00:00 | `ai/prompts/keep-still-due-rows-after-midnight.md` | `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md` | DONE | `7289894a` | nothing |
| 6 | 12. SDK 58 beta upgrade + alarmClock + largeIcon | `ai/plans/SDK58-PROGRAMME.md` §12 | `ai/plans/12-sdk58-beta-upgrade/PLAN.md` | READY | `a2498afa` | nothing (the env refresh finished on 2026-09-18: macOS 27 and Xcode 27 by the owner, the Android Studio cask upgrade and SDK check by the planning session; the plan's pre-flight verifies it) |
| 7 | 13. Agent tooling: `@expo/agent-cli` + dev-launcher niceties | `ai/plans/SDK58-PROGRAMME.md` §13 | `ai/plans/13-agent-tooling/PLAN.md` | NOT PLANNED | | 6 |
| 8 | 14. Expo Modules 2.0 spike: `modules/tls13` | `ai/plans/SDK58-PROGRAMME.md` §14 | `ai/plans/14-expo-modules-2-spike/PLAN.md` | NOT PLANNED | | 6 |
| 9 | 15. Android home-screen widgets | `ai/plans/SDK58-PROGRAMME.md` §15 | `ai/plans/15-android-widgets/PLAN.md` | NOT PLANNED | | 6 |
| 10 | 17. iOS widget timeline horizon: 14 to 30 days | `ai/plans/SDK58-PROGRAMME.md` §17 | `ai/plans/17-ios-timeline-horizon/PLAN.md` | NOT PLANNED | | 6 |
| 11 | 16. SDK 58 stable re-pin + full release-notes review | `ai/plans/SDK58-PROGRAMME.md` §16 | `ai/plans/16-sdk58-stable-repin/PLAN.md` | NOT PLANNED | | 6 + SDK 58 stable on npm (~Oct 7 to 14); may jump the queue the day it lands |
| 12 | 11. Moonsighting research, session 2 | `ai/prompts/moonsighting-research-2.md` | `ai/plans/11-moonsighting-research-2/PLAN.md` | NOT PLANNED, deferred until further notice (owner 2026-09-18; runs after the SDK 58 programme and the deferred features) | | everything above |

- **Session 6b was planned under the previous rules**, on the morning of 2026-09-16, before "specify, do not
  dictate" was written that afternoon. Every one of its steps hands the executor finished files under
  `ai/plans/06b-alert-all-or-nothing/files/` and tells it to copy them, and it is executed exactly as written: where a
  STEP dictates rather than specifies, the dictation wins (`EXECUTOR-BRIEF.md`). Every plan from session 7 on is
  written to the new rules, and a replan may still leave a `files` step it did not have to touch, so each step says
  which kind it is, in its own part 5 and in the plan's section 6 checklist.
- "Planned at" is the `uat-2` commit the plan's anchors were verified against.
- "Needs first" lists the order numbers of the rows that must be DONE before this plan is executed, such as `1`, or
  `nothing`. A planning session replaces "set when planned".

## Waiting on the owner, not yet sessions

A planning session may turn one of these into a plan only after the owner approves it in that session; it then adds a
row above.
- The accessibility fixes listed in "Session 5 of the queue" in `ai/features/uat-2/AUDIT-FINDINGS.md`.
- The edge-to-edge built-in switch: drop `react-native-edge-to-edge` for RN's `edgeToEdgeEnabled`
  (its README recommends this on RN 0.86+; the package stays at 1.8.2 until then). Waits on an
  Android 10+ device beside the 3T, because the package's `enforceNavigationBarContrast` setting
  guards a scrim only those phones show (owner, 2026-09-18, while planning session 12).
- The bump-everything-to-latest session: every package not already moved by the SDK wave, major
  versions included (`jotai` 3, `husky` 9, `lint-staged` 17, `@biomejs/biome`, `test-renderer`), on
  its own branch with the full gates (owner, 2026-09-18, while planning session 12: the SDK wave is
  strictly the SDK wave; this is everything else).
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

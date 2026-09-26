---
name: athan-next
description: Carry one queued session in ai/plans/README.md from planning through execution to audit, all three phases yourself in this one session, and stop when that session is DONE and pushed. Trigger on "athan-next", "what is the next step", "next session", "continue the queue", or any request to plan, execute or audit a session listed in ai/plans/README.md.
version: 3.0.0
---

# athan-next

The owner types one prompt and walks away. This skill carries ONE queued session from planning through execution to
audit and stops when that session is DONE and pushed, or the moment it needs the owner.

**You do every phase yourself, in this session. Subagents are banned, with one exception** (owner, 2026-09-26):
🐋  "I want to completely ban using subagents, and I want you to do all the work yourself every single time. So
everything in one session, the planning, the execution and the audits."

Never spawn a subagent for planning, for execution, for auditing, for a code review, for a search, or for anything
else. Where a brief in `ai/plans/` tells you to spawn one, section 9 replaces that instruction: you do that work
yourself. You read the plans, the briefs, the logs, the diffs and the app code. You write the code, you commit, you
merge, and you push.

**The one exception is `vision`, and it exists because seeing images is a capability, not a preference.** Some models
running this programme can read an image; some cannot. If you can see images, read them yourself and do not delegate.
If you cannot, call the `vision` subagent with the file path and one exact question, and rely on its report. Never
guess what an image shows, and never claim to have checked one you did not.

Sight is also a way to REACH a screen, not only to read one: when `mobile-mcp` and Maestro cannot see a control
(an OEM dialog outside the app's hierarchy, a surface `uiautomator dump` will not serve, a physical iPhone that
takes no automated taps), screenshot the phone, read the one control's coordinates, tap it, and screenshot again to
confirm the tap landed. `EXECUTOR-BRIEF.md` section 5 has the rules that keep it honest.

## 1. Read the state

Repeat exactly this at the start, and again after each phase:

| What | How |
| --- | --- |
| Refresh `origin` | `git fetch -q origin uat-2` |
| Unpushed commits | `git log --oneline origin/uat-2..uat-2 \| wc -l` |
| Unaudited code commits | `git log --oneline origin/uat-2..uat-2 -- . ':(exclude)ai/plans' ':(exclude)app.json' ':(exclude)package.json' \| wc -l` |
| The queue | `grep -n '^| [0-9]' ai/plans/README.md` |

That grep gives every row with its order number, session, plan path and status.

A row is in flight while its status is PLANNING, READY, IN PROGRESS or EXECUTED. At most one row is in flight.

## 2. The phase this session needs now

First match wins:

| | When | Phase |
| --- | --- | --- |
| 1 | A row is EXECUTED | **Audit** |
| 2 | A row is NEEDS REPLAN | **Plan**, to refresh it |
| 3 | A row is IN PROGRESS | **Execute**, resuming it |
| 4 | Unaudited code commits exist | **Audit** |
| 5 | A READY row has every "Needs first" row DONE | **Execute** |
| 6 | Unpushed commits exist | **Audit** |
| 7 | No row is READY | **Plan** the first PLANNING row, else the first NOT PLANNED row |
| 8 | Nothing above matches | Nothing can run. Report which row waits on what, and stop |

A READY row whose "Needs first" rows are not all DONE is still the row in flight, so nothing else is planned around
it (`ai/plans/README.md`, "Order").

## 3. Run the phase yourself

Read the phase's brief in full, then do what it says, end to end:

| Phase | Brief to read, then execute yourself |
| --- | --- |
| Plan | `ai/plans/PLANNER-BRIEF.md`, planning the row section 2 chose |
| Execute | `ai/plans/EXECUTOR-BRIEF.md`, executing that row's plan |
| Audit | `ai/plans/AUDITOR-BRIEF.md`, auditing that row's plan |

Carry straight on into the next phase when the row moves: plan it, execute it, audit it, all here. Write the phase's
record in the plan folder (`PLAN.md`, `LOG.md`, `AUDIT.md`) exactly as its brief says, because that is where the
owner reads the detail.

**An owner decision is asked with the `question` tool, and you wait for the answer.** Never guess a decision the
owner owns. Give every option both a `label` and a `description`, or the call fails validation.

**Loop on your own work until it is right.** A brief that says a reviewer checks a commit means YOU review that
commit: read the diff back with fresh eyes, attack it from a different angle, and fix what you find before merging.
The audit phase is the independent gate, and it is also yours.

## 4. Judge each phase from the repository, never from memory

Re-read section 1 after every phase. The table and git are the truth.

| What you find | What you do |
| --- | --- |
| The phase moved the row on (PLANNING or NEEDS REPLAN became READY, READY became IN PROGRESS then EXECUTED, EXECUTED became DONE) | Go on to the next phase from section 2 |
| The row is unchanged but you committed to `uat-2` | Carry on with the same phase: it is getting somewhere |
| The row is unchanged and nothing was committed, twice running | Stop. The phase cannot finish as specified |
| A row went BLOCKED or OWNER-LED, or the owner must hold a device | Stop and report it |

**If your context runs low,** write the "Resume from" note the phase's brief specifies, commit and merge what is
finished, and tell the owner to type `athan-next` again. The next session picks up from that note.

## 5. Tools: reach for the MCP servers, never re-derive what they know

`opencode.json` at the repo root lists every MCP server this project has wired up, and `ai/AGENTS.md` section 0
requires reading it at the start of every session. Read it; do not work from memory of it.

**Codegraph is the first stop for any code question** (`ai/AGENTS.md` section 15). It is a live, auto-indexed map of
every symbol and edge in this repo. Before reading or editing code, call `codegraph_explore` with the symbols or a
plain question: one call returns the verbatim line-numbered source PLUS the call path and the blast radius of what
depends on it. That is the blast-radius read this programme's plans are built on. Treat what it returns as already
read, and never re-verify it with grep. Reach for raw Read or Grep only for what codegraph does not index, such as
configs and docs, or to confirm one specific detail it did not cover.

The rest route by job, and every one of them already exists in this repo:

| Work | Route to |
| --- | --- |
| Drive a device: tap, type, scroll, screenshot | `mobile-mcp` |
| Author or run a flow | `maestro mcp`, flows in `e2e/flows/*.yaml` |
| iOS build / simulator | `xcodebuildmcp` |
| Expo project brief, dev-server smoke loop | `npx @expo/agent-cli status` / `smoke --ios` |
| Expo/EAS API question | the matching `expo-*` / `eas-*` skill in `.agents/skills/` |
| "Are alarms actually armed?" | `yarn check:device` |
| Animation smoothness, 30fps floor | `e2e/scripts/frame-audit.sh` |
| Perf regression vs baseline | `e2e/scripts/baseline-compare.sh e2e/flows/<flow>.yaml` |
| Before calling anything done | `yarn validate` |

Maestro needs `export PATH="$HOME/.maestro/bin:$PATH"`.

## 6. Comments: why only, and compact

The owner's rule, tightened on 2026-09-26 and binding on every line you write: 🐋  "the comments should be extremely
compact, and they should only explain the why, and they should never explain the how or the what, because those two
should be self-explanatory from your code. If it's not self-explanatory, then it's not clean enough, it's not good
enough, it's not refactored enough."

So:

- A comment explains WHY: a quirk, a constraint, a trade-off, a reason another engineer would trip over.
- A comment never explains WHAT or HOW. If the code needs that, the code is wrong: rename it, split it, flatten it,
  and delete the comment.
- Extremely compact. One line wherever one line does. Never a paragraph.
- No comments on styling or layout values, no history logs, no dates, no provenance. That belongs in `ai/AGENTS.md`
  or `ai/ISSUES.md`.
- Before writing any comment, try to delete it. If removing it loses nothing, it does not go in.

## 7. Stop, and hand back

Stop as soon as one of these is true, and never start another phase after it:

- the row is DONE and `uat-2` has no unpushed commits: the session is finished, which is where this skill stops;
- a row is BLOCKED or OWNER-LED, or a phase needs the owner's hands, such as holding a device or tapping a screen.
  An owner decision is not one of these: ask it with the `question` tool and carry on;
- section 4 says stop.

One session per run. Never carry on into the next row: the owner starts that with `athan-next` again.

## 8. Your final reply: the handoff, four lines, nothing after it

```
**Just done:** <Planning, Execution and Audit | the phases that ran>, session <n>. <one clause on what moved>
**Row:** <status now>, `uat-2` <pushed | holds N unpushed commits>
**Up next:** <the phase or session that comes next, or what it is waiting on>
**You type:** `athan-next`
```

Above those four lines, at most three sentences: what the session delivered, and anything the owner must decide or
hold. Nothing else. The detail lives in the plan folder's `LOG.md` and `AUDIT.md`.

## 9. This harness

The harness chooses the model, and this repository never names one (owner, 2026-09-24): these pages are read by
different models across the life of the build, so a model name dates the page. Where a brief names a model, a
subagent, a launcher or a specific product, this section replaces it:

- **Subagents are banned except `vision`** (owner, 2026-09-26). Every brief's instruction to spawn one, of any other
  type, for planning, execution, review, audit or search, is void: do that work yourself, in this session.
- **Images.** Read them yourself when your model can. When it cannot, `vision` is the one permitted subagent: give it
  the path and one exact question. Never guess an image's contents, and never claim to have checked one you did not.
- **Running one phase only.** If the owner names a phase ("just plan it", "audit only"), run that one phase yourself,
  then stop at section 8.
- The old per-model launchers and the `athan-next` command no longer exist. Never tell the owner to run them.
- Never read or write anything under `~/.claude/` or `~/.config/opencode/`.
- An isolated tree is a scratch worktree made with `git worktree add` under `~/athan-device-sweep/worktrees/<name>`,
  removed once its verdict is in and always before 00:00.

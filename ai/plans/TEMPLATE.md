# Plan template

Every plan uses these sections, with these headings, in this order. A section with nothing to say keeps its heading
and says "None", with the reason.

The plan SPECIFIES; it does not dictate (owner, 2026-09-16). The executor builds what the plan describes, and decides
nothing: every instruction is concrete enough that two competent implementers would do the same thing. That means a
command with its expected output, a file and the anchor that locates the place in it, the contract of every function
the step adds or changes, the tests the executor must write and what each must prove, and the acceptance criteria the
executor checks its own work against. Code is written out verbatim only where the contract cannot carry it: a log
line, a message a person reads, a formula whose every term matters.

Words a plan never uses inside an instruction, because each hands a decision to the executor: "as appropriate", "as
needed", "if necessary", "etc.", "and so on", "similar", "consider", "figure out", "decide", "clean up", "refactor as you
see fit", "update any", "relevant", "handle edge cases", "should", "try", "ensure", "make sure", "properly",
"appropriate", "optionally", "TBD", "for example". Replace each with the exact condition and the exact action.

---

```markdown
# Plan: Session <N>. <title>

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/<brief>.md` |
| Planned at | `<uat-2 sha>` (version <x.y.z>), <date> |
| Planned by | Claude, planning session on <date> |
| Needs first | <Order numbers of rows in ai/plans/README.md that must be DONE, or "nothing"> |
| Steps | <count>, each one branch, one commit, one version |
| Device | <none / OnePlus 3T with a local production build / mock build / iPhone> |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

One paragraph in plain words: what is wrong or missing today, what is true when this plan is DONE, and how the owner
would notice. Then the owner's rules that apply, quoted exactly with their source.

## 2. Decisions

### 2.1 Taken
A numbered list. Each decision gives what was decided, who decided (owner, with the date, or planner, with the
reason), and where it is recorded.

### 2.2 The executor must not decide
A numbered list of the situations that make the executor STOP and ask the owner, each with the exact question to ask.
At minimum:
- any anchor count other than 1;
- a test failing that the plan does not expect;
- a break printing `BREAK NOT APPLIED`;
- a reviewer finding the plan's section 10 does not answer and that touches something the plan fixed;
- anything the step does not answer that the executor would otherwise have to decide, with the question
  "The plan does not say `<X>`. What should it be?";
- anything touching visuals, prayer times, `releases.json`, `uat` or EAS.

## 3. Pre-flight

A bash script, given in full, saved to `$TMPDIR/preflight-<N>.sh` and run as `bash $TMPDIR/preflight-<N>.sh <k>`,
where `<k>` is the first step in section 6's checklist not ticked DONE (1 for a new plan). It checks:
- the checkout is `/Users/muji/repos/rn.athan.uk` on `uat-2`;
- `git status --porcelain` lists nothing but `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`;
- after `git fetch origin uat-2`, `git merge-base --is-ancestor origin/uat-2 uat-2` exits 0. `uat-2` may be ahead of
  `origin/uat-2`, because execution sessions never push;
- the version in `package.json`, printed, and not lower than the "Planned at" version. It is never compared with a
  fixed value, because later planning sessions bump the version too;
- every "Needs first" row is DONE in `ai/plans/README.md`;
- for steps `<k>` onward, every anchor on code that no earlier step of this plan changes. Each anchor is saved in full
  in `scripts/anchors/<step>-<n>.txt`, and this prints `1`:
  `python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' <anchor file> <source file>`.
  Never use `grep -c` for an anchor: it counts lines, not occurrences, and splits a multi-line anchor. Never use
  plain `grep` to look for a string holding `${...}` either: BSD `grep` reads the `$` as an anchor and reports 0
  matches for a string that is there. Use `grep -F`, or the Python count above;
- each tool the plan needs, with its check command and expected output, such as `adb -s 8f7ada76 get-state` printing
  `device`.

It ends by printing `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

- **Code map.** Every file the plan reads or changes, with what it does in one line. For each place the plan changes,
  the anchor: a verbatim excerpt of 3 to 15 lines, saved under `scripts/anchors/`, with its line number at "Planned at"
  as a hint only.
- **How the pieces interact:** callers, order of events, concurrency. A table for anything asynchronous.
- **Existing tests** that cover this code, by file and test name, and what each proves.
- **Why the obvious simple fix is wrong,** when it is.

## 5. Design

Behaviour changes only; write "None" for docs-only or test-only plans.
- The chosen approach, and the invariant it keeps, stated as one sentence a test can check.
- The alternatives rejected, each with the reason.
- The concurrency trace: every caller from section 4, what it does before and after the change.
- The design review: who reviewed it (agent and date), what they found, what changed as a result.

## 6. Steps

Section 6 starts with the checklist the executor ticks, one line per step:

- [ ] Step 1: <title>
- [ ] Step 2: <title>

Then one subsection per step. A step is one branch, one commit, one version, one review, one merge. Each step has
exactly these parts:

### Step <k>: <title>

0. **Anchor check:** the section 3 count for this step's anchors, run before anything else. Any count other than `1`
   means NEEDS REPLAN.
1. **Goal:** one sentence.
2. **Branch:** `git checkout -b <type>/<name> uat-2`.
3. **Files:** the exact list. Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and
   `LOG.md`.
4. **Tests first (red).** For each suite, its path and whether it is new, and then one row per test: the test's
   name, exactly what it proves, the inputs it uses and what it asserts. Name the existing tests that change, with
   why, and the ones that must not. The command that runs only those suites, path first. The exact failing test names
   expected, and the failure line expected. If any other test fails, or these pass, STOP.
5. **Change.** The contract of everything the step adds or changes: for each function, its name, its signature, what
   it answers, what it must never do, and the exact text of every log line it writes; for each stored value, its key,
   its type and what each value means. The behaviour it must keep, as the invariant from section 5. Names are the
   plan's, so the tests and the review can refer to them. Code verbatim only where the contract cannot carry it.
   Comments explain why, never what.
6. **Green.** The same command; every named test passes, with the exact `Tests:` line expected. Then
   `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both expected to exit 0.
7. **Breaks.** A bash script, given in full, that for each break copies the file, applies one exact `perl`
   substitution, checks the file changed, runs the named tests, expects them to fail, and restores the file. The
   expected result for each break. It ends with `ALL AS EXPECTED: 1`. Every path in it is relative to the repository
   root, and it runs from that root.
8. **Version and commit.** The version command (next patch after `uat-2`'s `package.json`). The files to add, by name.
   The full commit message, in a heredoc, starting `<VERSION> - `; the executor replaces `<VERSION>` with the version
   the command printed. The pre-commit hook runs the full suite and the coverage gate: in the commit log, the last
   `Tests:` line ends `passed, <n> total`, and four `100%` coverage lines are present.
9. **Review.** The subagent type, and the full prompt to give it, in a code block. What a "merge" verdict looks like.
   A "fix first" verdict: the executor applies only fixes the plan's section 10 gives word for word; any other finding
   is a STOP.
10. **Merge.** `git checkout uat-2 && git merge --no-ff <branch> -m "<message>"`, with the exact message.
11. **Done when:** the checks, as commands with expected output.

## 7. Device proof

The exact build command (every build script runs with `zsh`), APK path and install command. For each check:
- the exact adb or `devcheck.py` commands;
- the expected reading;
- where it is saved under `~/athan-device-sweep/session<N>/`.

Safety first:
- read `dumpsys alarm` before any clock change, and list every app alarm the executor will see, including the app
  alarm every 3T dump shows at `when 2104803640505` (year 2036, not identified);
- say which armed alarm a clock change would fire, and what to do about it;
- the owner never receives screenshots.

State the phone left behind at the end (which build, automatic time on).

## 8. Records

- **Findings text.** The exact text to add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under an exact heading. Only
  values the executor measures are placeholders, each one named, like `<TESTS_AFTER>`.
- **Table rows.** The executor sets the `ai/plans/README.md` row to EXECUTED. The exact new cell text for the
  `ai/prompts/README.md` row is given here for the auditor, who applies it on PASS.
- **Docs commit.** The docs commit message, starting `<VERSION> - `.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

- **Symptom table.** A table of symptom, cause and action. Include this session's own risks, and point to the general
  table in `EXECUTOR-BRIEF.md`.
- **Anticipated review fixes.** Each is given word for word. They are the only fixes the executor may make to
  anything the plan fixed. A reviewer finding that touches only code the plan did not give, and changes no name,
  signature, log line, behaviour or test the plan specified, the executor applies itself and records in `LOG.md`
  (`EXECUTOR-BRIEF.md` section 4, item 8).
- **Stopping part-way.** For each step, the files to restore with `git checkout --` and the new files to delete, as
  `EXECUTOR-BRIEF.md` section 4a uses (it also restores `app.json` and `package.json`).

## 11. Subagents in this plan

A table: step, agent type, model (GLM 5.3, or GLM 5.3 Flash for `vision`), isolation, why, and where its prompt is.
Only the agents listed may be used.

## 12. Report to the owner

The final message, starting with `🤖  Model: GLM 5.3 (execution session)` and a `Time:` line from
`date '+%H:%M:%S %d.%m.%Y'`:
- a few plain sentences on what changed and what was proven;
- the progress table (format in `EXECUTOR-BRIEF.md`);
- any decision now waiting on the owner;
- the audit prompt from `ai/plans/README.md`, started with `claude-plan`.
```

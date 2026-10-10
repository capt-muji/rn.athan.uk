# Plan template

The fixed shape of every plan. A section with nothing to say keeps its heading and writes
"None", with the reason. The plan specifies, it does not dictate: every instruction is concrete
enough that two competent implementers do the same thing. These words are banned as hedges:
"as appropriate", "as needed", "as necessary", "if needed", "if applicable", "if relevant",
"where appropriate", "where needed", "where applicable", "as per", "accordingly", "etc.",
"and so on", "and/or", "TBD", "for example", "e.g.", "i.e.", "various", "several", "some",
"appropriate", "reasonable", "properly", "correctly" (say what the correct thing is). Replace
each with the exact condition and the exact action.

## Sections, in order

- **Header table.** Brief, Planned at (`uat` sha, version, date), Planned by, Needs first, Parent, Group, Batch budget, Session budget, Steps
  count, Device, Owner decisions still needed.
- **1. Goal.** What is wrong today, what is true when DONE, how the owner notices. Then the
  owner's rules that apply, quoted with their source.
- **2. Decisions.** 2.1 Taken: what, who, when, where recorded. 2.2 The executor must not
  decide: each situation that stops work and asks the owner, with the exact question.
- **3. Pre-flight.** A full bash script committed at `scripts/preflight-<N>.sh` in the plan
  folder (the executor saves a copy to `$TMPDIR` and runs it from there). It checks the
  checkout on `uat`, a clean tree, `origin/uat` merged in, the version not lower than "Planned
  at", every "Needs first" row DONE, every anchor count equal to 1. It ends `PREFLIGHT OK`.
- **4. Background the executor needs.** The code map: every file read or changed, one line
  each, with anchors under `scripts/anchors/`. How the pieces interact. The existing tests and
  what each proves. Why the obvious fix is wrong.
- **5. Design.** The approach and its invariant as one sentence a test can check. The
  alternatives rejected, with reasons. The concurrency trace. The design review.
  **Acceptance criteria:** every criterion is one EARS sentence tagged with a stable ID, a
  line of the exact shape `- [Rk.n] WHEN <event> THE SYSTEM SHALL <observable response>`
  (`IF <precondition>` and `WHILE <state>` variants allowed). "Observable" means a test,
  a command's output or a log line can see it. These IDs are what every step cites.
- **6. Steps.** A checklist, then one subsection per step: a `Requirements:` line citing the
  criterion IDs it satisfies (`Requirements: R1.2, R3.1`), a `Weight:` line (device 3,
  code 2, docs 1), anchor check, goal, branch, files,
  red tests, change contracts, green run, break script, version and commit, review, merge,
  done when.
- **7. Device proof.** The build, APK and install commands. Each check's adb command and
  expected reading, and where it is saved. Read `dumpsys alarm` before any clock change and
  say which armed alarm it would fire.
- **8. Records.** The findings text written into `LOG.md` under its exact heading, the queue-row cell text the
  lead applies on DONE, the docs commit message.
- **9. Push.** Always None. The executor worker never pushes. The lead pushes after the
  reviews pass.
- **10. When something goes wrong.** A symptom table. Anticipated review fixes, word for
  word. Per-step restore lists.
- **11. Subagents.** Planning: `explore` workers answer fact questions, `athan-plan-griller`
  grills the draft. Delivery: the lead dispatches the `athan-executor` and `athan-reviewer`
  workers. Every worker may call `vision` for an image it cannot see. Nothing else, ever.
- **12. Report to the owner.** Plain sentences on what changed and what was proven, the
  progress table, decisions waiting on the owner, the four-line handoff.

## Hard rules

- `bash scripts/check-plan.sh <plan-folder>` must print `PLAN OK` before the row is set
  READY. The gate checks sections, hedge words, EARS shape, Requirements resolution, anchor
  shape and the pre-flight script. A plan that fails it is not planned, whatever it reads
  like.
- Anchors are verbatim excerpts of 3 to 15 lines, saved under `scripts/anchors/` and verified
  at the "Planned at" sha. Count them with
  `python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' <anchor file> <source file>`,
  never with `grep -c`. Any count other than 1 means NEEDS REPLAN. Never use plain `grep` to
  find a string holding `${...}`: BSD grep reads the `$` as an anchor and reports 0 matches.
  Use `grep -F`.
- A break script cannot disable a timer by enlarging its delay: `setTimeout` clamps a delay
  above 2^31-1 ms to 1 ms. Remove what the callback does.
- Branch and merge carry `uat`: `git checkout -b <type>/<name> uat`, then
  `git checkout uat && git merge --no-ff <branch> -m "<message>"`. Fetch `origin` first.
- A step is one branch, one commit, one version, small enough that its merge leaves `uat`
  green.
- The version comes from the version command: the next patch after `uat`'s `package.json`. The
  commit message starts `<VERSION> - `.
- Red test first. Write the tests, run them, record the exact failing names and failure lines,
  then change code. Any other test failing, or these passing, is a STOP.

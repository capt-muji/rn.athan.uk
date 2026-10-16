# Ticket 125: Workflow guards for three measured lane defects

| Header | Value |
| --- | --- |
| Brief | Queue row 125: three measured lane defects need guards that fail, not only prose |
| Planned at | `455571f8`, 2.0.937, 2026-10-16 |
| Planned by | Lane 125 (agent-ruled throughout; the owner is hands-off) |
| Needs first | nothing |
| Parent | none |
| Group | none (workflow tooling: `.husky/`, `scripts/`, `.opencode/agents/`, `.agents/skills/`; disjoint from every open lane) |
| Batch budget | 4 |
| Session budget | 6 |
| Steps | 2 code steps, 1 docs step |
| Device | none: no app runtime surface is touched; every guard runs in git, bash or jest on the host |
| Owner decisions still needed | none |

## 1. Goal

Three process defects were measured by real lanes on 2026-10-16 and exist today
only as workflow prose, landed at `595efc22` (2.0.908). This ticket turns each
into a mechanism that fails when the defect recurs.

**Defect 1, re-derived from git.** Lane 121's closing sequence landed unhooked:
`d5e981fc` (19:14:26) and its merge `94aa4df9` (19:14:29) sit three seconds
apart; the pre-commit hook takes 3 to 4 minutes, so no hook ran. The same
second-scale gaps repeat through `cccde524`/`0e266f72` and
`595efc22`/`723a6c32`. Cause, measured: `core.hooksPath` is the relative
`.husky/_`, a gitignored directory that only exists after `yarn install`
creates it; a fresh worktree has no `_`, git finds no hook file there and
silently runs nothing, so the commit passes green. The prose warns; nothing
fails.

**Defect 2, re-derived from git.** Thirteen version-collision groups sit in
today's unpushed union (`origin/uat..uat` plus every local branch except
`main`), 91 non-merge commits: cross-lane takes minutes apart (2.0.890 rows
122/123, 2.0.908 rows 121/111, 2.0.901, 2.0.928, 2.0.930, 2.0.858, 2.0.863,
2.0.872, 2.0.886, 2.0.896) and same-lane missed bumps (2.0.909, 2.0.913).
The lockstep test checks one commit's three files against each other, so it
cannot see a number another unpushed commit already carries. Commit messages
sometimes lie about the number (`addc75bb` says 2.0.861, its `app.json` says
2.0.863; `e8dc1416` says 2.0.914, content 2.0.913), so the guard must read
`app.json` content, not message text.

**Defect 3, re-derived from the records.** Both of lane 121's reviewers were
dispatched with only `$TMPDIR` diff-file paths, found them gone, and had to
derive the range from git themselves (queue row 125; the prose fix at
`595efc22` made the range mandatory in dispatch text, but nothing asserts an
audit actually ran its passes or produced findings).

**Defect class 4, in scope under the cost rule, not mandatory.** Two lanes
ended turns parked on a lock or a background shell tonight, invisible to the
orchestrator. The cheap guard is protocol lines pinned by a test.

What is true when DONE: a fresh worktree's commits fire the tracked hooks; a
version another unpushed commit already carries fails the commit and the
merge; an audit cannot close without recorded ranges and existing findings
files; the protocol files carry the range-mandatory and never-parked rules,
pinned by tests. The owner notices nothing: no app behaviour, no pixels, no
schedule changes.

Owner rules that apply: version bump on every commit, `app.json` first (hard
rules); full red-first coverage on changed lines, and `scripts/` sits in the
coverage gate's UNMEASURED list, so the red-first proof for these guards is
jest suites that run them against fixtures; no CI changes, no shell-script
workarounds for blocked commands (these are gates the workflow itself runs,
not workarounds); hook changes must not alter behaviour for lanes whose
worktrees already carry an installed shim (dispatch constraint, reasoned in
section 5).

## 2. Decisions

### 2.1 Taken (agent-ruled, 2026-10-16, recorded here)

- **D125.1 Guard 1 mechanism: the tracked `.husky/` directory becomes the
  hooks path.** `prepare` becomes `husky && node scripts/pin-hooks.js` and the
  new script sets `core.hooksPath` to `.husky` (relative, so each worktree
  resolves its own checkout's hook files, exactly as the relative `.husky/_`
  resolves per worktree today). `.husky/` is tracked, so it exists in every
  worktree and fresh clone from the first commit; a commit before `yarn
  install` then fails loudly at `npx lint-staged` or `yarn validate` instead
  of passing green. For: git itself enforces it; no marker can be forged or
  absent silently. Against: a transitional window where an old-generation
  install re-pins `.husky/_` (shared config) until the next new-generation
  install. Survived the challenge: the window is exactly today's status quo,
  it shrinks with every install, and defect 2's merge-time check does not
  depend on hooksPath at all.
- **D125.2 Rejected alternatives for guard 1.** A marker the hook writes
  (absence is silent; proving it needs message trailers on every commit,
  fragile across rebase and amend). A worktree-shim assertion before the first
  commit (prose-enforced, the class of guard this ticket replaces). An
  absolute shared hooksPath (machine-specific path in shared config, and the
  worktree would run the main tree's hook bytes instead of its own branch's).
  Committing the `.husky/_` shims (generated files go stale after every husky
  upgrade and dirty the tree on each install).
- **D125.3 Guard 2 reads `app.json` content per commit**, never the commit
  message (messages measured lying, section 1). The union is every non-merge
  commit reachable from `uat` and every local branch except `main` (main is a
  stale diverged branch, 92/2684 ahead/behind), minus `origin/uat`. Merge
  commits are excluded because the merge convention repeats the version of the
  commit it lands (measured: `69280a0e` and `a5051480` share 2.0.932 by
  convention, not by defect).
- **D125.4 The staged bump is checked as a candidate** whenever the working
  tree's `app.json` version differs from `HEAD`'s, which also catches the
  same-lane missed bump (the 2.0.909 and 2.0.913 groups). When it equals
  `HEAD`'s (merge-time invocation in the main tree), the candidate is skipped.
- **D125.5 Grandfathering is a static allowlist**, `scripts/version-collisions-allowlist.json`,
  one entry per already-collided version with a one-line reason, regenerated
  from the live census at execution. For: versions are monotonic, so the
  entries can never match again once `origin/uat` catches up and the range
  empties. Against: a floor ref would also work. Rejected the floor: which ref
  is reachable from what shifts with every rebase, and the allowlist is
  explicitly data.
- **D125.6 Guard 2 enforcement points: the pre-commit hook, a new tracked
  `.husky/pre-merge-commit`, and a transition line in the lane protocol.** The
  `_` shim set already contains `pre-merge-commit` in every installed tree, so
  merges in the main tree fire the new tracked check from the first merge
  after this ticket lands, before any re-pinning. The protocol line (run the
  script after `git fetch`, before `git merge`) is the belt for worktrees
  still on old hook bytes.
- **D125.7 Guard 3 is `scripts/check-audit.sh` plus a fixed AUDIT.md record
  shape.** Every reviewer pass is recorded as a `Range:` line (containing a
  `..` range) and a `Findings:` line (a path that exists, non-empty, at check
  time). The gate requires at least two passes. It prints `AUDIT OK` or
  `AUDIT CHECK FAILED` with numbered reasons, in the `check-plan.sh` style.
- **D125.8 The reviewer agent file gains a malformed-dispatch rule**: a
  dispatch naming no commit range returns `MALFORMED_DISPATCH: no commit range
  named` and reviews nothing; a named diff file that is gone is derived from
  the range with git, never from memory. This makes the range mandatory at the
  worker's end, not only in the lead's dispatch habits.
- **D125.9 Guard 4 (parked lanes) is protocol prose pinned by a test.** One
  sentence in `athan-lane.md` (never end a turn holding a lock or with a live
  background shell) and a lock-visibility row in the lead skill's read-state
  table. For: the defect is LLM protocol behaviour, prose is its mechanism,
  and `scripts/__tests__/protocolLines.test.ts` pins the sentences so they
  cannot silently rot. Against: a stale-lock check. Rejected: auto-removing an
  old lock can kill a live sibling's merge, and an mtime cannot tell parked
  from slow.
- **D125.10 husky stays a dependency; `prepare` runs it first.**
  `husky && node scripts/pin-hooks.js` keeps `_` regeneration and `yarn reset`
  working and keeps the diff minimal. Removing the dependency is a separate
  ask-first ticket.
- **D125.11 The version floor is the union maximum, not uat's tip.** Every
  step's version is `max(app.json over uat and every local branch) + 1`,
  recomputed at the moment of the bump, because two sibling lanes commit
  tonight (lane 120 at 2.0.935, bench/116 at 2.0.936 while this plan was
  drafted). This is the rule guard 2 ships; this ticket already obeys it.
- **D125.12 Scripts are tested by jest suites that run them against fixtures**
  in `scripts/__tests__/` (the unit project's testMatch already matches
  `**/__tests__/**/*.test.ts`), spawning `node`/`bash`/`git` against temporary
  directories. `scripts/` stays in the coverage gate's UNMEASURED list; the
  red-first proof is the suites' recorded red runs, per the ticket's own bar.

### 2.2 The executor must not decide

- A test failing for a reason other than the missing new file (red run shows
  ENOENT or a wrong-exit failure; anything else is a STOP).
- The allowlist contents: they come from the live census command in step 1,
  run at execution time, pasted verbatim.
- Any edit outside the step's file list. A sibling lane touching the same
  files is a STOP (`NEEDS_CONTEXT: file conflict with a sibling lane`).
- A version collision involving a sibling's new commit: STOP, re-derive the
  floor, renumber this branch's un-merged tip commit only (never rewrite a
  commit another branch already merged).

## 3. Pre-flight

`scripts/preflight-125.sh` in this folder (the executor copies it to
`$TMPDIR` and runs it from there). It checks: the checkout is a lane-125
worktree on branch `lane/125`; the tree is clean; `origin/uat` is fetched and
merged in; the version is not lower than 2.0.938 (the floor at planning time
plus one); every anchor counts exactly 1 at `455571f8`; the three sibling
surfaces (`e2e/README.md`, `ai/UPSTREAM-PRS.md`, `SDK58-PROGRAMME.md`) are not
modified by this branch. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (all anchors under `scripts/anchors/`, verified at `455571f8`):

- `.husky/pre-commit` - one chained line: identifiers, lint-staged, validate,
  changed-coverage (`pre-commit-line.txt`). Gains the uniqueness check
  prepended. Tracked mode 100755.
- `.husky/commit-msg`, `.husky/pre-push` - unchanged. Their commands (`node`,
  `yarn`) resolve from the system PATH; only `pre-commit`'s `npx lint-staged`
  touches `node_modules`, and `npx` resolves `node_modules/.bin` itself.
- `.husky/pre-merge-commit` - new tracked file, one command, mode 100755.
- `.husky/_/h` - the husky shim; its resolution line (`s=$(dirname
  "$(dirname "$0")")/$n`, `husky-shim-resolution.txt`) is what makes every
  installed worktree run its own checkout's hook bytes today, and what keeps
  working unchanged after the re-pin: with `core.hooksPath=.husky`, git runs
  the tracked file directly and the shim layer is bypassed, same commands.
  `_` contains a `pre-merge-commit` stub, so installed trees fire the new
  tracked merge hook the moment this ticket merges.
- `package.json` - `prepare: "husky"` (`prepare-line.txt`) becomes
  `"husky && node scripts/pin-hooks.js"`; the version trio bump rides the same
  edit.
- `scripts/check-changed-coverage.js` - the coverage gate; its UNMEASURED
  list carries `scripts/` (`unmeasured-scripts.txt`), so the new scripts owe
  jest red-first runs, not coverage percentages.
- `jest.config.js` - the unit project's testMatch picks up
  `scripts/__tests__/*.test.ts`; `collectCoverageFrom` excludes `scripts/`.
- `shared/__tests__/versionLockstep.test.ts` - the per-commit trio check;
  untouched (guard 2 is a different axis: across commits, not across files).
- `.opencode/agents/athan-lane.md` - the fresh-worktree warning bullet
  (`lane-fresh-worktree.txt`) is rewritten to the new truth; the merge bullet
  gains the uniqueness line; the Returns section gains the never-parked
  sentence.
- `.agents/skills/athan-lead/SKILL.md` - item 3 of the audit section already
  says hand the range (`lead-hand-range.txt`); the read-state table gains a
  locks row; the audit section gains the AUDIT.md shape and the
  `check-audit.sh` gate before the DONE commit.
- `.opencode/agents/athan-reviewer.md` - the blind section opens with "You
  see the diff file" (`reviewer-diff-file.txt`); the malformed-dispatch rule
  is added ahead of it, applying to both modes.

How the pieces interact: `prepare` runs on every `yarn install` in any
checkout of this repository; because worktrees share `.git/config`, the last
install's pin wins for everyone, and every new-generation install pins
`.husky`. Git resolves a relative hooksPath against the top of the working
tree per invocation, so each worktree runs its own checkout's hook files -
the same property the relative `.husky/_` relies on today, measured live on
lane-116's worktree.

Existing tests and what they prove: `versionLockstep.test.ts` proves the trio
agrees inside one checkout (and deliberately tolerates an absent
`android/`); no test covers hooks, cross-branch versions or audit records
today. The new suites are the first for all three.

Why the obvious fix is wrong: warning harder in the lane file was already
landed at `595efc22` and the defects still recurred tonight (the 2.0.930 and
2.0.931 groups post-date it); prose cannot fail.

## 5. Design

Invariant, one sentence a test can check: a fresh worktree with no
`node_modules` cannot commit green, and a version number that any unpushed
non-merge commit already carries cannot commit or merge.

Alternatives rejected: section 2.1, D125.2 and D125.9.

Concurrency trace: two lanes commit at once; both hooks read the same shared
refs (all worktrees share one object store), so the second commit's candidate
equals the first's committed version and fails; the second lane rebumps. A
lane commits while another merges: `uat.lock` serializes the merges, and the
pre-merge hook re-reads the union after the fetch. A rebase re-lands the same
work under new shas with the same versions: the old shas leave the refs, so
no collision is seen; if both copies are still on refs, the collision is real
ambiguity and fails. An install races a commit in the same worktree:
`commit.lock` already serializes both.

Design review (the rollout constraint, restated): lanes whose worktrees
already carry an installed shim keep their exact hook bytes until they merge
`uat`, because the `_` shim resolves the user hook from each worktree's own
checkout; the main tree's merges fire the new pre-merge-commit check from the
first merge after this ticket lands (its `_` stub already exists); the shared
`core.hooksPath` re-pin reaches a machine when any of its checkouts next
installs. No installed lane's behaviour changes; only fresh worktrees change,
from silently unhooked to loudly refusing.

Acceptance criteria:

- [R1.1] WHEN `git commit` runs in a worktree whose `core.hooksPath` is
  `.husky` and no `node_modules` exists THE SYSTEM SHALL execute the tracked
  `.husky/pre-commit` and the commit SHALL fail (observable: a fixture repo
  whose tracked hook writes a marker and exits 1).
- [R1.2] WHEN `node scripts/pin-hooks.js` runs inside a git repository THE
  SYSTEM SHALL set `core.hooksPath` to `.husky` (observable: `git config
  core.hooksPath` prints `.husky`).
- [R1.3] WHEN `node scripts/pin-hooks.js` runs outside a git repository THE
  SYSTEM SHALL exit 0 printing nothing.
- [R2.1] WHEN two distinct non-merge commits across `origin/uat..<(uat plus
  every local branch except main)>` carry the same `app.json` version THE
  SYSTEM SHALL exit non-zero printing `VERSION COLLISION <version>` naming
  both shas.
- [R2.2] WHEN the working tree's `app.json` version differs from `HEAD`'s and
  equals any checked commit's version THE SYSTEM SHALL exit non-zero printing
  `VERSION COLLISION <version>` naming the sha and `staged`.
- [R2.3] WHEN a colliding version is an entry in the allowlist file THE
  SYSTEM SHALL print `VERSION GRANDFATHERED <version>` and not fail for it.
- [R2.4] WHEN every checked version is unique THE SYSTEM SHALL print
  `VERSIONS OK <n> commits` and exit 0.
- [R2.5] WHEN the pre-commit hook of this repository's checkout runs THE
  SYSTEM SHALL invoke `node scripts/check-version-uniqueness.js` before the
  existing chain (observable: the tracked file's first command).
- [R3.1] WHEN `bash scripts/check-audit.sh <folder>` runs on an AUDIT.md
  recording at least two `## Pass` sections, each with a `Range:` line
  containing `..` and a `Findings:` line whose file exists non-empty THE
  SYSTEM SHALL print `AUDIT OK` and exit 0.
- [R3.2] WHEN AUDIT.md is missing, or fewer than two passes are recorded, or
  any pass lacks a `Range:` line with `..`, or any `Findings:` file is absent
  or empty THE SYSTEM SHALL print `AUDIT CHECK FAILED` with numbered reasons
  and exit non-zero.
- [R4.1] WHEN `scripts/__tests__/protocolLines.test.ts` runs THE SYSTEM SHALL
  find the never-parked sentence in `.opencode/agents/athan-lane.md`, the
  malformed-dispatch sentence in `.opencode/agents/athan-reviewer.md`, the
  `check-audit.sh` gate line in `.agents/skills/athan-lead/SKILL.md` and the
  locks row in its read-state table.

## 6. Steps

Checklist:

- [ ] Step 1: hooks path pinned, uniqueness gate wired and tested (red first)
- [ ] Step 2: audit gate, reviewer rule, protocol lines, pinned by test
- [ ] Step 3: records and queue row

### Step 1 - the hook-path pin and the version-uniqueness gate

`Requirements: R1.1, R1.2, R1.3, R2.1, R2.2, R2.3, R2.4, R2.5`
`Weight: 2`

Anchor check: every anchor in `scripts/anchors/` counts exactly 1 at
`455571f8` (pre-flight already proved it; re-run `bash
$TMPDIR/preflight-125.sh` if more than an hour has passed).

Goal: a fresh worktree cannot commit unhooked or green without
`node_modules`, and a duplicate unpushed version fails commit and merge.

Branch: `lane/125` (the lane branch; no new branch, per the lane protocol).

Files: `package.json`, `.husky/pre-commit`, `.husky/pre-merge-commit` (new,
mode 100755), `scripts/pin-hooks.js` (new), `scripts/check-version-uniqueness.js`
(new), `scripts/version-collisions-allowlist.json` (new),
`scripts/__tests__/pinHooks.test.ts` (new), `scripts/__tests__/checkVersionUniqueness.test.ts`
(new).

Red tests, written and run first, recorded in LOG.md with the exact failing
lines:

1. `scripts/__tests__/pinHooks.test.ts`, three tests: "sets core.hooksPath to
   .husky in a git repository" (spawn `node scripts/pin-hooks.js` with cwd set
   to a temporary `git init` repository, then read `git config
   core.hooksPath`); "runs the tracked hook with hooksPath .husky and no
   installed shim" (fixture repo with a tracked `.husky/pre-commit` that
   writes a marker file and exits 1; `git -c user.email=t@t -c user.name=t
   commit` fails and the marker exists; then the same repo with
   `core.hooksPath=.husky/_` and no `_` directory commits green and writes no
   marker - the pinned defect); "exits 0 silently outside a git repository"
   (cwd an empty temporary directory).
2. `scripts/__tests__/checkVersionUniqueness.test.ts`, six tests, each
   building a temporary git repository with `app.json` commits and a base ref
   created by `git update-ref`, passing `--base` and `--allowlist`: "fails
   when two branches carry one version" (exit 1, output matches
   `/VERSION COLLISION 1\.0\.1/`); "passes when branch versions are unique"
   (exit 0, `VERSIONS OK`); "grandfathers an allowlisted version" (allowlist
   fixture file listing 1.0.1; exit 0 with `VERSION GRANDFATHERED 1.0.1`);
   "fails when the staged bump equals another branch's version" (worktree
   `app.json` set to the other branch's version; exit 1 with `staged` in the
   collision line); "excludes merge commits" (a `--no-ff` merge whose content
   repeats its branch's version stays OK); "fails a same-branch missed bump"
   (two sequential commits both carrying 1.0.1; exit 1).

Red run: `npx jest scripts/__tests__/pinHooks.test.ts scripts/__tests__/checkVersionUniqueness.test.ts --watchman=false --selectProjects=unit`
from the worktree root. Every test fails on the missing files (ENOENT on the
script spawn, or the assertion on exit codes). Record the failure lines.

Change contracts:

- `scripts/pin-hooks.js` - CommonJS, no arguments, no dependencies. Sets
  `core.hooksPath` to `.husky` via `execFileSync('git', ['config',
  'core.hooksPath', '.husky'])`. On any spawn error (not a repository) exits 0
  printing nothing. On success prints one line: `core.hooksPath -> .husky`.
  Header docblock explains why (three sentences, from section 5's design).
- `scripts/check-version-uniqueness.js` - CommonJS, no dependencies. Flags:
  `--base <ref>` (default `origin/uat`), `--allowlist <file>` (default the
  repository's `scripts/version-collisions-allowlist.json`). Steps: resolve
  the base ref or exit 2 printing `VERSIONS FAIL cannot resolve base <ref>`;
  list branches with `for-each-ref refs/heads --format=%(refname:short)`,
  drop `main`; read non-merge commits with one `git rev-list --no-merges`
  call holding `<base>..<branch>` for each branch plus `<base>..HEAD`, shas
  deduplicated; read each sha's version with `git cat-file -p <sha>:app.json`
  parsed as JSON (a commit whose `app.json` is missing or unparseable is
  skipped and counted); read the worktree's `app.json` and `HEAD:app.json`
  and, when they differ, add the worktree version as candidate `staged`; a
  version held by two or more entries is a collision unless the allowlist
  carries it. Output: one `VERSION COLLISION <v>: <sha-a> <sha-b>` line per
  colliding version (shas space-separated, `staged` in place of a sha for the
  candidate), one `VERSION GRANDFATHERED <v>` line per allowlisted collision,
  and on success `VERSIONS OK <n> commits across <k> refs`. Exit 1 on any
  non-allowlisted collision, else 0.
- `scripts/version-collisions-allowlist.json` - an array of
  `{"version": "...", "reason": "..."}` objects, generated at execution by
  running the census in the plan's step-1 notes (the same pipeline the
  planner ran: rev-list the union, read each sha's `app.json`, group,
  keep versions with two or more shas). Each reason is one line:
  `<date> cross-lane collision predating this gate` or `<date> same-lane
  missed bump predating this gate`. The executor pastes the live result, not
  the planner's draft, and records the command and count in LOG.md.
- `.husky/pre-commit` - one line becomes:
  `node scripts/check-version-uniqueness.js && node scripts/check-identifiers.js --staged && npx lint-staged && yarn validate && node scripts/check-changed-coverage.js --staged`
- `.husky/pre-merge-commit` - new file, mode 100755, single line
  `node scripts/check-version-uniqueness.js` preceded by nothing (git runs it
  from the tree root; `node` resolves from PATH).
- `package.json` - `"prepare": "husky && node scripts/pin-hooks.js"`, plus
  the version trio bump (`app.json` first, then `package.json`; the
  gitignored `android/app/build.gradle` is synced in the main tree under the
  build lock after the merge, per the lane protocol).

Green run: the two suites pass; `yarn validate` green from the worktree; the
hook fires on this step's own commit (its output carries `Tests:` and the
uniqueness line).

Break script (run after green, recorded in LOG.md by its last line):

```bash
cd "$HOME/athan-gitree/worktrees/lane-125"
git checkout -b docs/break-125 lane/125
node -e "const f='app.json';const j=require('./'+f);j.expo.version='2.0.935';require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
git add app.json && git -c user.email=break@t -c user.name=break commit --no-verify -m "break: colliding version" >/dev/null
node scripts/check-version-uniqueness.js; echo "break exit: $?"
git checkout lane/125 && git branch -D docs/break-125
```

Expected last lines: `VERSION COLLISION 2.0.935: <sha> <sha>` then `break
exit: 1` (2.0.935 is lane/120's tip). If it prints `VERSIONS OK`, the gate is
broken.

Version and commit: 2.0.938 (or the recomputed floor plus one per D125.11 if
a sibling moved), message
`2.0.938 - feat(guards): tracked hooks path and the version-uniqueness gate (125)`.

Review: the lane lead reads the diff cold against this step's contracts.

Merge: fetch, `node scripts/check-version-uniqueness.js`, then `--no-ff` into
`uat` in the main tree under `uat.lock`; sync the main tree's
`android/app/build.gradle` `versionName` under the build lock; run `node
scripts/pin-hooks.js` in the main tree to re-pin this machine's shared
`core.hooksPath` immediately (local config only).

Done when: suites green, break script caught the collision, hook fired on the
commit, merged.

### Step 2 - the audit gate and the protocol rules

`Requirements: R3.1, R3.2, R4.1` `Weight: 2`

Anchor check: the three protocol anchors still count 1.

Goal: an audit cannot close without recorded ranges and existing findings;
the reviewer refuses a rangeless dispatch; the lane protocol carries the
never-parked rule; both are pinned by test.

Branch: `lane/125`.

Files: `scripts/check-audit.sh` (new, mode 755),
`scripts/__tests__/checkAudit.test.ts` (new),
`scripts/__tests__/protocolLines.test.ts` (new),
`.opencode/agents/athan-reviewer.md`, `.opencode/agents/athan-lane.md`,
`.agents/skills/athan-lead/SKILL.md`.

Red tests first: `checkAudit.test.ts` builds a temporary folder with fixture
AUDIT.md variants and fixture findings files, spawning
`bash scripts/check-audit.sh <folder>`; four tests: "fails without AUDIT.md"
(exit non-zero, output contains `AUDIT CHECK FAILED`); "fails when a pass has
no Range line" (a pass section whose range line is missing); "fails when a
findings file is missing or empty"; "passes a well-formed two-pass audit"
(exit 0, `AUDIT OK`). `protocolLines.test.ts` reads the three protocol files
from the repository root and asserts the exact sentences below (red until
step 2 edits them). Record the failing lines.

Change contracts:

- `scripts/check-audit.sh` - bash, `set -u`, bash 3.2 compatible, modelled on
  `check-plan.sh`: usage error without one argument; fails if `AUDIT.md` is
  absent; counts sections matching `^## Pass` and fails if fewer than two;
  for each pass section (from its heading to the next `## ` heading or EOF)
  requires a line starting `Range:` whose remainder contains `..`, and a line
  starting `Findings:` whose path token exists and is non-empty; prints
  numbered reasons then `AUDIT CHECK FAILED` and exits 1, or prints
  `AUDIT OK` and exits 0.
- `.opencode/agents/athan-reviewer.md` - after the "Treat any worker's
  report" paragraph, insert:
  `A dispatch that names no commit range is malformed: return MALFORMED_DISPATCH: no commit range named and review nothing. A named diff file that is gone is not a stop: derive the diff from the commit range with git and say so in the findings.`
- `.opencode/agents/athan-lane.md` - three edits. One: the fresh-worktree
  bullet's first sentence is replaced by `A fresh worktree runs the tracked
  .husky/ hooks from its first commit (core.hooksPath .husky), but without
  node_modules the chain fails loudly at npx lint-staged or yarn validate:
  finish yarn install before the first commit` (the rest of the bullet
  stands). Two: the merge bullet gains, after the fetch clause, `run node
  scripts/check-version-uniqueness.js and resolve any collision before
  git merge`. Three: the Returns section gains
  `Never end a turn holding a lock or with a live background shell: carry
  every wait inside the turn in 15-second cycles, and remove a lock the
  moment the work it guards ends.`
- `.agents/skills/athan-lead/SKILL.md` - two edits. One: the read-state table
  gains the row `| Lane locks held | ls $HOME/athan-gitree/*.lock 2>/dev/null; a lock with no live merge or install in a lane that ended its turn is parked: name it in the run reply |`.
  Two: audit item 6 gains at its end: `Each pass is recorded in AUDIT.md as a
  Range: line naming the commit range and a Findings: line naming the
  findings file; bash scripts/check-audit.sh <plan-folder> must print AUDIT
  OK before the DONE commit.`
- `protocolLines.test.ts` asserts, with `readFileSync` and `toContain`: the
  never-parked sentence in `athan-lane.md` (`Never end a turn holding a lock
  or with a live background shell`), the malformed-dispatch sentence in
  `athan-reviewer.md` (`MALFORMED_DISPATCH: no commit range named`), the gate
  line in the lead skill (`must print AUDIT OK before the DONE commit`), and
  the locks row (`Lane locks held`).

Green run: both suites green; `yarn validate` green.

Break script:

```bash
cd "$HOME/athan-gitree/worktrees/lane-125"
d=$(mktemp -d); mkdir "$d/x"; printf '## Pass 1 - blind\n\nRange: a..b\n\nFindings: %s/gone.md\n' "$d" > "$d/x/AUDIT.md"
bash scripts/check-audit.sh "$d/x"; echo "break exit: $?"; rm -rf "$d"
```

Expected: `AUDIT CHECK FAILED` with the missing-file reason, `break exit: 1`.

Version and commit: 2.0.939 (or recomputed floor plus one), message
`2.0.939 - feat(guards): the audit gate and the pinned protocol rules (125)`.

Review and merge: as step 1.

Done when: suites green, break script failed as written, merged.

### Step 3 - records

`Requirements: none (records)` `Weight: 1`

Goal: LOG.md carries each step's ledger entry with hook lines and break
output; the queue row carries the EXECUTED cell text from section 8.

Files: `ai/plans/125-workflow-guards/LOG.md`, `ai/plans/README.md`.

Version and commit: 2.0.940 (or recomputed floor plus one), message
`2.0.940 - docs(plans): ticket 125 executed: three lane guards landed`.

Merge: as step 1. Done when the row reads EXECUTED and LOG.md ends with the
session line.

## 7. Device proof

None. No app code, no build, no phone. The guards run in git, bash and jest
on the host, and every criterion's observable is a test or command output in
the suites above. No `yarn test:tz` either: no date logic is touched.

## 8. Records

LOG.md headings: `### Step 01 — done` and `### Step 02 — done` and
`### Step 03 — done`, each with the commit sha and version, the hook's
`Tests:` and coverage lines, the break script's last lines, and a closing
`session: <id>` line.

Queue cell text on EXECUTED (the lead applies): `EXECUTED 2026-10-16, the
three guards green: tracked hooks path (pin-hooks.js, prepare), the
version-uniqueness gate in pre-commit and the new pre-merge-commit with the
13-group allowlist, the check-audit.sh gate with the Range/Findings record,
the reviewer malformed-dispatch rule, the never-parked lane rule and the
locks row in the lead state read, all pinned red-first in
scripts/__tests__`.

Docs commit message at DONE: `2.0.9<xx> - docs(plans): ticket 125 DONE: three
lane guards audited`.

## 9. Push

None. The executor never pushes; the lane merges into `uat` and the
orchestrator pushes after audit.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| Red run fails on something other than ENOENT or exit codes | a fixture bug | fix the fixture, re-run red, record both runs |
| `check-version-uniqueness.js` fails on this branch's own commit | a sibling took the floor | re-derive floor; if the sibling's commit is unmerged, renumber this branch's tip commit (amend with the new trio); STOP if the sibling's commit is already merged |
| the pre-commit hook reports command not found in the worktree | install incomplete | rerun `yarn install` under `commit.lock`; never `--no-verify` |
| `yarn validate` fails in a suite this ticket did not add | a sibling's merge moved uat | rebase `lane/125` onto `uat` (lane weather), rerun |
| `check-audit.sh` passes a fixture it should fail | gate bug | fix the gate, add the fixture as a test |
| merge conflict on `ai/plans/README.md` or the version files | lane weather | abort, rebase onto `uat`, keep both rows and the higher version, retry once, STOP if it still conflicts |

Anticipated review fixes, word for word: "must: pin-hooks.js must also handle
a bare repository (no working tree) - pin anyway, `.husky` is tracked, so a
bare clone cannot run it; print and skip" (fix: catch the config failure and
exit 0 only outside any git dir; in a bare repository `.husky` cannot resolve,
so exit 0 printing `bare repository, no hooks path pinned`); "must: the
uniqueness script must not read the working tree during a merge" (it reads
`app.json` vs `HEAD:app.json`; during a merge in the main tree they are
equal, so the candidate is skipped - the reviewer may ask for that stated in
the script's header; add the sentence); "should: allowlist entries could
carry the shas" (rejected: monotonic versions never revisit a number, shas
would be noise; the reason line keeps the date).

Restore lists: step 1 restores `package.json`, `.husky/pre-commit` and
deletes the five new files; step 2 restores the three protocol files and
deletes the three new files; step 3 is docs only.

## 11. Subagents

Planning: `explore` for facts (not needed; the planner measured everything
from git directly). `athan-plan-griller` on this folder. Delivery: the lane
dispatches one `athan-executor` for steps 1 to 3 in the lane-125 worktree,
then two `athan-reviewer` passes (plan-conformance and blind), each with the
commit range named, a diff file, the worktree, and a findings file path, per
the new rule this ticket ships. `vision`: never (no images).

## 12. Report to the owner

Three measured lane defects now fail instead of warn: a fresh worktree runs
the tracked hooks from its first commit, a duplicate unpushed version fails
commit and merge (13 grandfathered history groups), and an audit cannot close
without recorded ranges and existing findings files, with the reviewer
refusing a rangeless dispatch and the lane protocol pinned against parking on
a lock. All guards red-first in `scripts/__tests__`, `yarn validate` green,
no app surface touched. Then the progress table and the four-line handoff.

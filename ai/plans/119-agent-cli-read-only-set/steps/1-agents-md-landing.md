# Step 1 - The ai/AGENTS.md landing: four routing rows and the widened ban paragraph

**Requirements:** R1.1, R2.1, R3.1, R4.1, R5.1
Weight: 1

## Anchor check

Save `scripts/preflight-119.sh` to `$TMPDIR/preflight-119.sh` and run it with `bash` from the
worktree root (`$HOME/athan-gitree/worktrees/lane-119`). It must print `PREFLIGHT OK`. Any
`FAIL:` line is a STOP with that line quoted.

## Goal

Land the owner's option-B ruling in `ai/AGENTS.md`: four routing rows for the measured
read-only commands and one widened `@expo/agent-cli` ban paragraph. Nothing else in the file
moves, and nothing is installed.

## Branch

In the worktree: `git checkout -b docs/119-agents-md-rows lane/119`.

## Files

- `ai/AGENTS.md` (the four rows and the ban paragraph)
- `ai/plans/README.md` (row 119 status cell: `IN PROGRESS, step 1`)
- `app.json`, `package.json` (version bump)
- `ai/plans/119-agent-cli-read-only-set/PLAN.md` (checklist tick), `LOG.md` (step entry)

## Red

Run from the worktree root before any edit. Every line must print `0`:

```bash
grep -cF '`npx @expo/agent-cli doctor`' ai/AGENTS.md
grep -cF '`npx @expo/agent-cli typecheck`' ai/AGENTS.md
grep -cF '`npx @expo/agent-cli docs:sync`' ai/AGENTS.md
grep -cF '`npx expo command:ps`' ai/AGENTS.md
grep -cF '`skills:clean`' ai/AGENTS.md
grep -cF '`status --explain`' ai/AGENTS.md
```

Any line printing a nonzero count is a STOP with the count quoted.

## Change contracts

Exactly two edits. Find each place by its anchor text, never by line number.

**Edit 1.** In the tool routing table, insert these four rows directly under the
`| Expo project status and smoke | ... |` row and above the `| Gate before done | ... |` row,
byte-for-byte:

```
| Expo project health check (advisory) | `npx @expo/agent-cli doctor` |
| Quick type check (tsc only, not the gate) | `npx @expo/agent-cli typecheck` |
| Expo docs lookup, SDK-matched | `npx @expo/agent-cli docs:sync` / `docs:search` |
| Expo dev-server session tables | `npx expo command:ps` / `command:events` |
```

No other table row changes.

**Edit 2.** In the `## Device testing` section, replace this paragraph (the second bullet of
the anchor `agent-cli-ban-paragraph.md`, the two lines starting `` - `@expo/agent-cli`: ``)
byte-for-byte with:

```
- `@expo/agent-cli`: the routed reads only - `status`, `smoke --ios`, `doctor`, `typecheck`,
  `docs:sync` and `docs:search`. Never `--eas` (it starts a paid EAS Simulator session),
  `deploy`, `agents:setup`, `skills:sync`, `skills:clean`, `install`, `new`, `feedback`,
  `login`/`logout`/`register`/`whoami`, `status --explain` (an EAS service query) or `--device`
  (it launches or binds a phone), and never `smoke --android` while a phone is connected.
```

The bullet above it (the screenshot bullet) stays byte-identical.

**Queue row.** In `ai/plans/README.md`, row 119's status cell changes its opening words
`PLANNING 2026-10-16 (option-B ruling taken): the read-only set` to
`IN PROGRESS, step 1 (option-B ruling taken 2026-10-16, the read-only set)`. The rest of the
cell is untouched.

## Green

1. `bash scripts/break-1.sh` from the worktree root prints `ALL AS EXPECTED: 1` with every
   count at its expected value. Save the output to `$TMPDIR/break-1-out.txt`.
2. `npx tsc --noEmit` exits 0 and `npx biome check . --error-on-warnings` exits 0 (no code
   changed; both must stay clean).
3. The red block now prints `1`, `1`, `1`, `1`, `1`, `1`.

## Break script

`scripts/break-1.sh`, committed in this plan folder. Ends `ALL AS EXPECTED: 1`.

## Version and commit

1. Acquire the version lock: `mkdir $HOME/athan-gitree/version.lock`, retrying every 15
   seconds while it exists.
2. Read the live number off the shared ref:
   `git show uat:package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const v=JSON.parse(s).version.split(".").map(Number);v[2]++;console.log(v.join("."))})'`
   prints the version, the next patch after `uat`'s.
3. Set that number in the worktree's `app.json` (`expo.version`) and `package.json`
   (`version`). Release the lock with `rmdir $HOME/athan-gitree/version.lock`.
4. Acquire the commit lock (`mkdir $HOME/athan-gitree/commit.lock`, retry every 15 seconds
   while it exists). Write the message to `$TMPDIR/msg-1.txt`:

   ```
   <VERSION> - docs(agents): ticket 119 step 1, ai/AGENTS.md routes the four measured agent-CLI reads and widens the ban set
   ```

5. `git add ai/AGENTS.md ai/plans/README.md app.json package.json` plus the plan files this
   run changed, then `git commit -F $TMPDIR/msg-1.txt` in the background with the log kept at
   `$TMPDIR/commit-1.log`. The log's last `Tests:` line must end `passed, <n> total` and four
   `100%` coverage lines must be present. A commit whose output carries no `Tests:` line is
   unhooked: release nothing, run `yarn validate` and the coverage check by hand, re-verify,
   and only then continue. Release the commit lock with `rmdir` the moment the commit ends.

## Review checklist

Read `git show <sha>` cold, as a stranger. The four rows and the ban paragraph match the
contracts byte-for-byte; the screenshot bullet and every other table row are byte-identical;
the diff touches only the files this step lists; the message starts `<VERSION> - `.

## Merge

`git checkout lane/119 && git merge --no-ff docs/119-agents-md-rows -m "<VERSION> - merge docs/119-agents-md-rows: the agent-CLI landing (119 step 1)"`.
A conflict is a STOP: `git merge --abort` first, then return `STOP:` naming both sides. The
lane lead merges `lane/119` into `uat` in the main tree under `uat.lock`; the executor never
touches `uat` or the main tree.

## Done when

The step's checklist box in `PLAN.md` section 6 is ticked, `LOG.md` carries the step entry
under `### Step 01 — done` ending with the `session:` line, and the merge commit sits on
`lane/119`.

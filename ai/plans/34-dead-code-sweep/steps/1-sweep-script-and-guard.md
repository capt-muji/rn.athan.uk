# Step 1: Replace the sweep script and add the standing guard

0. **Anchor check:** none. This step changes only `scripts/find-unused-exports.py` and adds one new
   test file, so it anchors on nothing. Run the pre-flight with `bash $TMPDIR/preflight-34.sh 1`
   and confirm `PREFLIGHT OK`.

1. **Goal:** the sweep resolves a reference by import graph rather than by bare identifier, and a
   test fails the commit that leaves an export unreachable.

2. **Branch:** `git checkout -b chore/34-sweep-script-and-guard uat-2`

3. **Files:**
   - `scripts/find-unused-exports.py` (replaced)
   - `shared/__tests__/unusedExports.test.ts` (new)
   - `app.json`, `package.json` (version)
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

   Nothing else may change. In particular, no symbol is deleted in this step: the guard is expected
   to FAIL until step 6 finishes, and step 6 is where it turns green.

4. **Tests first (red).**

   This step's test IS the change, so its red is different in shape: the guard must report the 22
   symbols that are still present and not allow-listed.

   New suite: `shared/__tests__/unusedExports.test.ts`. Copy it verbatim from
   `ai/plans/34-dead-code-sweep/scripts/unusedExports.test.ts.txt` and change nothing in it. It is a
   `(files)` artefact inside a `(specified)` step: the plan carries it whole because the allow-list's
   wording and its two assertions are the contract.

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `reports only the symbols a framework or a test-time rule reaches` | no export is unreachable except the five with a named mechanism | the sweep's own output over the repo | the list of reported symbols not in `REACHED_WITHOUT_AN_IMPORT` equals `[]` |
   | `keeps every allow-list entry earning its place, so a stale reason cannot hide a live symbol` | the allow-list holds no entry for a symbol that is live or already deleted | the same output | the reported symbols, sorted, equal the allow-list's keys, sorted |

   Run:

   ```bash
   npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit
   ```

   **Expected BEFORE the script is replaced** (the old script is still in place, so it reports 18,
   of which 13 are not allow-listed):

   ```
   ✕ reports only the symbols a framework or a test-time rule reaches
   ✕ keeps every allow-list entry earning its place, so a stale reason cannot hide a live symbol
   ```

   The first failure's message contains `shared/perf.ts: getPerfRing`.

   **Expected AFTER the script is replaced, and still before steps 2 to 6**: both tests still fail,
   and the first one's message now lists 22 entries rather than 13, including
   `shared/time.ts: getSecondsBetween`, which the old script could not see. That difference is the
   whole point of this step, so record both counts in `LOG.md`.

   If either test PASSES at this point, STOP: the symbols steps 2 to 6 delete are already gone, so
   the plan is stale.

   No existing test changes in this step.

5. **Change.** This is a `(specified)` step for the script and a `(files)` step for the test.

   Replace `scripts/find-unused-exports.py` with
   `ai/plans/34-dead-code-sweep/scripts/find-unused-exports.py`, byte for byte:

   ```bash
   cp ai/plans/34-dead-code-sweep/scripts/find-unused-exports.py scripts/find-unused-exports.py
   ```

   Copy `ai/plans/34-dead-code-sweep/scripts/unusedExports.test.ts.txt` to
   `shared/__tests__/unusedExports.test.ts`, byte for byte, and change nothing in it. The plan's
   copy carries a `.txt` suffix so the coverage gate does not read plan material as a source file
   needing its own coverage.

   The script's contract, which the guard and every later step depend on:

   - **Name:** `scripts/find-unused-exports.py`, run as `python3 scripts/find-unused-exports.py`
     from the repository root.
   - **What it answers:** every exported symbol in `app/`, `components/`, `shared/`, `stores/`,
     `hooks/`, `device/`, `assets/`, `modules/`, `api/` and `widgets/` that no production file can
     reach by an import.
   - **How a reference resolves:** a named import of the symbol from its own module, a namespace
     import used as `NS.name`, a `const { name } = require('...')` binding, a barrel re-export
     (under its own name or a new one, including `export *`), or a use inside the defining file
     below its own export line. Comments and import clauses are stripped before the identifier
     search, so neither a JSDoc mention nor an unused import can make a symbol look reachable.
   - **What it must never do:** count a bare identifier without resolving it, count a name inside a
     comment, or exit non-zero on a clean tree.
   - **Output, exactly this shape**, which the guard parses:

     ```
     exported symbols scanned: <n>
     NEVER reachable from production code: <m>

       <file>: <symbol>
     ```

     Each symbol line begins with exactly two spaces and holds `: ` once between path and name.
   - **Log lines:** none. It is a script, not app code.

   The guard's contract:

   - **File:** `shared/__tests__/unusedExports.test.ts`, in the `unit` project.
   - **`REACHED_WITHOUT_AN_IMPORT`:** a `Record<string, string>` mapping a kept symbol's name to the
     mechanism that reaches it. Five entries: `ErrorBoundary`, `MAX_WHATS_NEW_ITEMS`,
     `MAX_WHATS_NEW_ARCHIVE`, `MAX_WHATS_NEW_TITLE_LENGTH`, `MAX_WHATS_NEW_BODY_LENGTH`.
   - **What it must never do:** allow-list a symbol without a reason, or pass while a reported
     symbol is absent from the allow-list.

   Comments explain why, never what. The script's docstring names the three blind spots it fixes and
   the `ErrorBoundary` false positive; the test's own comment says why Biome cannot do this job.

6. **Green.** Not in this step. The guard is expected to stay RED until step 6 deletes the last
   symbol, because the symbols it reports are still in the tree. That is why this step commits with
   the guard failing and every later step re-runs it.

   **This step therefore commits with `yarn validate` failing**, which is the one deliberate
   exception in this plan. The pre-commit hook will refuse the commit. To keep the hook honest
   rather than skipped, this step's commit adds the test in a SKIPPED state and step 6 un-skips it:

   - In the copied file, change `describe(` to `describe.skip(` for this commit only, and add the
     comment line directly above it:

     ```ts
     // Skipped until session 34's last deletion lands: the symbols it reports are still in the tree
     ```

   - Step 6 removes that comment and the `.skip`.

   With the describe skipped, run:

   ```bash
   npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: `Tests:       2 skipped, 2 total`.

   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** Save as `$TMPDIR/breaks-34-1.sh` and run `bash $TMPDIR/breaks-34-1.sh` from the
   repository root. It un-skips the guard in a copy, so it proves the guard works without leaving it
   failing in the commit.

   ```bash
   #!/bin/bash
   # Step 1 breaks: the guard must catch a new orphan, a removed reason, and a stale reason.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   GUARD=shared/__tests__/unusedExports.test.ts
   caught=0
   total=0

   cp "$GUARD" "$GUARD.bak"
   # The guard ships skipped in this commit; every break runs it live
   perl -pi -e 's/^describe\.skip\(/describe(/' "$GUARD"
   perl -ni -e 'print unless /Skipped until session 34/' "$GUARD"

   run() { npx jest "$GUARD" --watchman=false --selectProjects=unit --silent > "$TMPDIR/b34-1.log" 2>&1; }

   check() { # check <label> <expected-to-fail>
     total=$((total + 1))
     if run; then
       echo "NOT CAUGHT: $1 (the guard passed and should have failed)"
     else
       echo "caught: $1 (expected to fail: $2)"
       caught=$((caught + 1))
     fi
   }

   # BREAK 1: a newly planted dead export must be reported
   cp shared/time.ts shared/time.ts.bak
   printf '\n/** Planted by the break script */\nexport const plantedDeadExport = (): number => 1;\n' >> shared/time.ts
   if ! grep -qF 'plantedDeadExport' shared/time.ts; then
     echo "BREAK NOT APPLIED: planted dead export"
   else
     check "planted dead export" "both guard tests"
   fi
   mv shared/time.ts.bak shared/time.ts

   # BREAK 2: an allow-list entry removed while its symbol is still dead
   before=$(md5 -q "$GUARD")
   perl -pi -e "s/^  MAX_WHATS_NEW_ITEMS: '[^']*',\n//" "$GUARD"
   if [ "$(md5 -q "$GUARD")" = "$before" ]; then
     echo "BREAK NOT APPLIED: removed allow-list entry"
   else
     check "removed allow-list entry" "both guard tests"
   fi
   cp "$GUARD.bak" "$GUARD"
   perl -pi -e 's/^describe\.skip\(/describe(/' "$GUARD"
   perl -ni -e 'print unless /Skipped until session 34/' "$GUARD"

   # BREAK 3: an allow-list entry for a symbol that is live
   before=$(md5 -q "$GUARD")
   perl -pi -e "s/^(  MAX_WHATS_NEW_BODY_LENGTH: '[^']*',)\$/\$1\n  perfMark: 'a stale reason for a live symbol',/" "$GUARD"
   if [ "$(md5 -q "$GUARD")" = "$before" ]; then
     echo "BREAK NOT APPLIED: stale allow-list entry"
   else
     check "stale allow-list entry" "both guard tests"
   fi

   mv "$GUARD.bak" "$GUARD"
   echo "caught $caught of $total"
   [ "$caught" = "3" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail | Why it must |
   | --- | --- | --- |
   | planted dead export | both guard tests | a new orphan is exactly what the guard exists to catch |
   | removed allow-list entry | both guard tests | a kept symbol without a reason must not pass |
   | stale allow-list entry | both guard tests | a reason for a live symbol would let a future orphan hide behind it |

   Ends `ALL AS EXPECTED: 1`. All three were run while planning and all three failed the guard.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files.

8. **Version and commit.**

   ```bash
   python3 -c "
   import json
   major, minor, patch = json.load(open('package.json'))['version'].split('.')
   print(f'{major}.{minor}.{int(patch) + 1}')"
   ```

   Set that version in `app.json` (`expo.version`), `package.json` (`version`) and
   `android/app/build.gradle` (`versionName`) if `android/` exists. Add by name:

   ```
   scripts/find-unused-exports.py
   shared/__tests__/unusedExports.test.ts
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-1.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - chore(sweep): resolve unused exports by import graph, and guard it

   The committed script counted a bare identifier, so it under-reported: 18 dead
   exports where there are 27. Three blind spots, each hiding a real one.

   A name is not a symbol. Three symbols are named
   clearAllScheduledRemindersForPrayer (an export of stores/database.ts, an export
   of device/notifications.ts, and a local const in stores/notifications.ts), and
   the two live ones made the dead one read as used.

   A comment is not a caller. Eight symbols were named only by the prose above
   their own definitions or by a JSDoc @example, among them all four
   MAX_WHATS_NEW_* limits.

   And mocks/ sat outside the scan, so a type only that folder referenced read as
   dead while a real reference existed.

   The replacement resolves a reference through @/ aliases, relative specifiers,
   require() bindings and barrel re-exports, stripping comments and import clauses
   before the identifier search. Verified in both directions with planted
   canaries: no live symbol is flagged, a planted dead export is caught, and a
   planted live one is not.

   shared/__tests__/unusedExports.test.ts makes the measurement standing, because
   Biome cannot: noUnusedImports only sees imports, never an export nobody
   imports. It carries an allow-list naming the mechanism that reaches each kept
   symbol, and its own three breaks were run before it was trusted.

   It ships SKIPPED. The 22 symbols it reports are still in the tree until the
   last deletion of this session lands, and step 6 un-skips it.
   ```

   Commit with `git commit -F $TMPDIR/msg-1.txt` in the background. In the log, the last `Tests:`
   line ends `passed, <n> total` and four `100%` coverage lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this list:

   - `diff scripts/find-unused-exports.py ai/plans/34-dead-code-sweep/scripts/find-unused-exports.py`
     prints nothing;
   - `diff shared/__tests__/unusedExports.test.ts ai/plans/34-dead-code-sweep/scripts/unusedExports.test.ts.txt`
     prints only the added `// Skipped until session 34…` line and the `describe.skip(` change;
   - the allow-list holds exactly five entries, each with a reason naming a mechanism;
   - the script's docstring explains WHY, names the three blind spots and the `ErrorBoundary` false
     positive, and never explains what the code does line by line;
   - no symbol was deleted in this commit;
   - the version is bumped in `app.json` and `package.json`, and they match;
   - nothing beyond the files listed in part 3 changed;
   - no `istanbul ignore`, `c8 ignore` or `v8 ignore` anywhere.

   A clean read is: one script replaced, one test added skipped, a version bump, and nothing else.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8: a fix section 10 gives word for
   word, or a fix meeting all three of that item's conditions, is applied; anything else is a STOP.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/34-sweep-script-and-guard -m "Merge chore/34-sweep-script-and-guard into uat-2: the sweep resolves by import graph and is guarded, reviewed"
    ```

11. **Done when:**

    ```bash
    python3 scripts/find-unused-exports.py | head -2
    ```

    prints `exported symbols scanned: 471` and `NEVER reachable from production code: 27`.

    ```bash
    npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit 2>&1 | grep '^Tests:'
    ```

    prints `Tests:       2 skipped, 2 total`.

    Tick the step in `PLAN.md` section 6 as `- [x] Step 1: DONE in <sha>`, and append to `LOG.md`:
    the branch, the commit sha and version, the hook's last `Tests:` line and its coverage lines, the
    break script's last line, the two red counts from part 4 (13 before the script, 22 after), the
    review verdict and how many rounds it took, and the merge sha.

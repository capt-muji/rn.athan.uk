# Audit: Session 23. SDK 58 preview.7 and RN 0.88.0-rc.2

| Field | Value |
| --- | --- |
| Audited | 2026-09-26 |
| Range | `origin/uat-2..uat-2`, 22 commits, `56d29001` through the merge of `test/widget-runtime-loads` |
| Plan | `ai/plans/23-sdk58-preview7/PLAN.md`, as replanned at `430fbfd6` |
| Scratch worktree | `~/athan-device-sweep/worktrees/audit-23`, `node_modules` symlinked, removed at the end |
| Verdict | **PASS** |

All three phases ran in this one session under the owner's 2026-09-26 ruling: the replan, the execution of steps 4
and 5, and this audit. The audit is written against the evidence, not against memory of having produced it, and
every check below names the command or file that proves it.

## 1. The range

`git log --oneline origin/uat-2..uat-2` lists 22 commits: the original plan and its merge, steps 1 to 3 and their
merges, four docs commits from the blocked and handoff sessions, the replan and its merge, and steps 4 and 5 with
their merges. Every one belongs to row 26 of `ai/plans/README.md`. Nothing foreign is in the range.

**Versions run 1.28.34 to 1.28.45 with no gap and no repeat**, checked with
`git log --oneline origin/uat-2..uat-2 | grep -oE "1\.28\.[0-9]+" | sort -V | uniq`.

## 2. The plan against the commits

### Steps 1 to 3 (executed before the replan, re-checked here)

The only source change in all three is `widgets/PrayerWidget.tsx`, and it is exactly the two sites the plan's
section 5 design table names, in the order it gives, fixed frame first and flexible second:

| Site | After |
| --- | --- |
| the medium row `HStack` | `frame({ height: ROW_HEIGHT }), frame({ maxWidth: Infinity })` |
| the list column `VStack` | `frame({ width: MEDIUM_LIST_WIDTH }), frame({ maxHeight: Infinity })` |

Nothing else in the file changed (`git diff origin/uat-2..uat-2 -- widgets/PrayerWidget.tsx`, 6 insertions and 2
deletions, both hunks shown above). No colour, size, spacing or text moved, so the owner's settled-visuals rule
holds.

### Step 4: the pin (`5682b8fa`)

- Both pins are bare `58.0.5`, with no `~` or `^`, which is what the plan requires and what the `pin-range` break
  exists to defend.
- `patches/expo-widgets+58.0.7.patch` became `+58.0.5.patch`, and git recorded it as `R ... (100%)`, which is
  independent evidence the content carried over byte for byte rather than being rewritten.
- `patches/expo-background-task+58.0.7.patch` is untouched, correctly: that package stays at 58.0.7.
- `yarn.lock` moved only the two packages, verified by reading every `version`/`resolved` line in the diff.
- No file under `stores/`, `shared/`, `components/` or `app/` changed. This step fixes a pin, not the app.

### Step 5: the guard (`9bdd7d4a`)

- `shared/__tests__/widgetRuntimeLoads.test.ts` builds the real runtime bundle for both platforms with
  `expo-widgets`' own `build-bundle.mjs` and evaluates each with `vm.runInThisContext`.
- It writes only into `mkdtempSync(join(tmpdir(), ...))` and removes it in a `finally`. Nothing is written inside
  the repository.
- `loadWidgetRuntime` cannot throw: a build failure returns `{ ok: false, message: 'bundle build failed: ...' }`
  and a load throw returns the `Error.message`, so a failing test names which of the two happened.
- Both bundle tests carry an explicit `120_000` timeout, so a slow machine reports the real failure.
- The third test asserts `/^\d+\.\d+\.\d+$/` against both dependency ranges, so it fails on `~58.0.5`, not merely
  on a different number.
- The `ai/AGENTS.md` bullet matches the plan's part 5 text exactly.

## 3. The tests still guard

`bash $TMPDIR/breaks-23-4.sh`, run **from the audit worktree's root**, not the main checkout:

```
caught: pin-range
caught: pin-version
caught 2 of 2
ALL AS EXPECTED: 1
```

`git status --porcelain` in that worktree printed nothing afterwards, so both breaks restored their file.

**The red was proven against the broken pin, not asserted.** The suite was installed in a scratch worktree at
`@expo/ui`/`expo-widgets` 58.0.7 and run: both bundle tests failed with
`"message": "(0 , n.memo) is not a function"`, the production error verbatim, while the pin test passed. That is
the strongest evidence in this audit, because it shows the new test fails for the exact reason the phone failed.

## 4. The whole suite

`yarn validate` in the audit worktree, independent of the commit hooks:

```
Test Suites: 171 passed, 171 total
Tests:       2 skipped, 4663 passed, 4665 total
Statements   : 100% ( 4234/4234 )
Branches     : 100% ( 1892/1892 )
Functions    : 100% ( 857/857 )
Lines        : 100% ( 3825/3825 )
```

171 suites against the 170 the session started with: the one new suite, and no suite lost.

## 5. Reviews

`LOG.md` records a review verdict for every step commit, and three self-caught defects, which is the review
working rather than a clean sheet claimed:

1. **The plan's own `aapt2` instruction was wrong**, and the pre-flight caught it before a build was wasted.
   `aapt2` is not on PATH on this Mac; a bare call exits 127 and `grep -c` on that prints `0`, which reads as
   "widget-less APK". The same trap session 23 hit with `aapt`, one step removed. Fixed in the pre-flight and the
   step file, both of which now resolve the newest build-tools copy by absolute path and fail loudly when absent.
2. **The first draft of the test deleted its bundle before reading it.** The `finally` sat on the build's try
   block rather than the outer one, so both tests failed with `ENOENT`. Caught by running it, fixed by nesting the
   scopes correctly.
3. **The first break script could not express its own search text.** `perl -0pi -e "s/\Q$FROM\E/.../"` cannot
   carry `@expo/ui`: the slash ends the substitution pattern and the embedded double quotes end the shell's
   quoting. It printed `BREAK NOT APPLIED: pin-range` plus a perl syntax error, which is the script failing
   honestly rather than a break passing by accident. Rewritten with a comma delimiter and the strings passed
   through the environment.

**One finding raised by this audit against the plan, and fixed in it.** The break script began `cd` into the main
checkout by absolute path, which `AUDITOR-BRIEF.md` section 3, item 3 forbids, because an audit must run it from
its own worktree. The script and the step file now use repository-relative paths only, and the run in section 3
above is from the audit worktree, which is what proves the fix.

## 6. Device evidence

| Claim | File |
| --- | --- |
| The APK declares all 8 widget providers | `~/athan-device-sweep/session23/apk-providers.txt` |
| The build is from the pinned commit | `~/athan-device-sweep/session23/athan-prod-pinned.apk.build.txt`, naming `5fca5a3c` and version 1.28.44 |
| The alarms before the install | `~/athan-device-sweep/session23/alarms-before-pin.txt` |
| The alarms after the install | `~/athan-device-sweep/session23/alarms-after-pin.txt` |
| `yarn check:device` | `~/athan-device-sweep/session23/check-device-pinned.log` |
| The widgets render | `~/athan-device-sweep/session23/widgets-after-pin.png` |

| The rendered widget tree, as read from the phone | `~/athan-device-sweep/session23/widget-tree-after-pin.xml` |

The provider check used the absolute `aapt2` path and found all eight: `PrayerWidget`, `ExtrasWidget`, each in
plain, `Medium`, `Dark` and `DarkMedium`.

**The widgets render, and the proof is a measurement rather than an image.** The `vision` subagent was unavailable
in this session, so instead of reading a screenshot the home screen's view tree was dumped: both placed widgets
read `A S R`, `54m`, `16:08` and `Thu`, being the prayer name, the countdown, the absolute time and the day
marker, and `grep -c "undefined is not a function"` over that tree returns **0**. `ai/AGENTS.md` prefers exactly
this: a claim in the records needs a logcat line or a dump, never a screenshot alone. The screenshot is kept
beside it but nothing depends on it.

`yarn check:device` reports `27 future prayer alert(s) armed (0 already fired)`, `3 channel(s)` and
`all 2 prayer channel(s) carry a sound`, which also proves the `expo-background-task` patch still compiles in.
Its single FAIL is `installed 1.28.44 is BEHIND the tree's 1.28.45`, a version comparison rather than a defect:
step 5 is a test-only commit that ships no app code, so no rebuild is warranted.

**One process note worth carrying.** `adb install -r` failed three times with no output, because the process does
not survive its shell here and a 69MB transfer outlives the tool's window. `adb push` to `/data/local/tmp` took
2.5 seconds at 26.6 MB/s and `adb shell pm install -r` then printed `Success`. The push-then-install pair is
strictly better for an APK this size.

## 7. The owner's rules

| Rule | Checked how | Result |
| --- | --- | --- |
| No visual change | `git diff origin/uat-2..uat-2 -- widgets/ components/ app/` | Only the two `frame()` sites the owner approved |
| No substituted prayer time | No file under `shared/prayer.ts`, `shared/time.ts` or `stores/` changed | Held |
| `releases.json`, `uat`, EAS untouched | `git diff --name-only origin/uat-2..uat-2 \| grep -E "releases.json\|eas.json"` | No match |
| No API key committed | The same grep for `.api_key`, and the build script keeps the key in process env only | No match |
| No ignore comment | `git diff origin/uat-2..uat-2 \| grep -E "^\+.*(istanbul\|c8\|v8) ignore"` | No match |
| No skipped hook | Every commit ran the full suite; both step logs carry the `Tests:` and four 100% lines | Held |
| Comments explain why | Read in the step 5 diff: the doc comment on `loadWidgetRuntime` and the one-line note on the pin test both give a reason, not a restatement | Held |

## 8. The records

`ai/plans/README.md` row 26 and the `ai/AGENTS.md` invariant both state what the measurements show: the root cause,
the two platforms breaking at different versions through different modules, the nested-copy trap, and why a
missing-name guard is the wrong tool. Each claim in them is backed by a measurement in `LOG.md` or a file in
section 6.

## Verdict: PASS

The session did what the replan specified. The defect's root cause is named and measured rather than guessed, the
fix is the smallest one that works, the guard that was missing now exists and is proven to fail on the broken
version, and the tree is otherwise untouched: exactly three packages differ from preview.7's pin set, and all three
are deliberate and recorded (the two pins, and RN rc.2 from decision 1).

The one finding this audit raised, the break script's absolute path, is fixed in the plan and the fixed script is
what section 3's run used.

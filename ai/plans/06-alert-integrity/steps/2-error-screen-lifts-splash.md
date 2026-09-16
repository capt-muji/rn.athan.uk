# Step 2: A start-up error lifts the splash onto the error screen, in Ramadan too (finding 80)

This file is part of `ai/plans/06-alert-integrity/PLAN.md`. Run every command from `/Users/muji/repos/rn.athan.uk`.

0. **Anchor check.** Run `bash ai/plans/06-alert-integrity/scripts/check-anchors.sh 2`. Expected: one line per
   anchor ending ` 1`, then `ANCHORS OK`. Any count other than `1`: this is NEEDS REPLAN (`EXECUTOR-BRIEF.md` section
   1, item 4).

1. **Goal:** a launch whose sync fails shows the error screen with the splash lifted, whatever the season or the decorations setting.

2. **Branch:** `git checkout -b fix/audit-80-error-screen-lifts-splash uat-2`.

3. **Files.** Only these change, apart from `app.json`, `package.json`, the local `android/app/build.gradle` and the three plan files:
   - `app/index.tsx`;
   - `__tests__/app/index.test.tsx`;

4. **Tests first (red).**
   1. Apply this anchor to `__tests__/app/index.test.tsx`:

   Anchor `2-2` in `__tests__/app/index.test.tsx` (saved as `ai/plans/06-alert-integrity/scripts/anchors/2-2.txt`), before:

```ts
  it('lifts the splash without waiting for decorations that are turned off', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    // The Settings toggle writes this preference through its atom, and the store has no setter for it
    getDefaultStore().set(decorationsEnabledAtom, false);

    await render(<Index />);

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/2-2.txt`):

```ts
  it('lifts the splash without waiting for decorations that are turned off', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    // The Settings toggle writes this preference through its atom, and the store has no setter for it
    getDefaultStore().set(decorationsEnabledAtom, false);

    await render(<Index />);

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  // No day of 2027 is stored, so the failed download leaves nothing usable and sync fails
  it('lifts the splash onto the error screen, without waiting for decorations that screen never draws', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    jest.mocked(fetchYear).mockRejectedValueOnce(new Error('Offline'));

    await render(<Index />);

    expect(await screen.findByText('Something went wrong.')).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('holds the splash over the error screen until its Masjid icon has loaded, then lifts it', async () => {
    showRamadanLists();
    jest.mocked(fetchYear).mockRejectedValueOnce(new Error('Offline'));
    await render(<Index />);
    await screen.findByText('Something went wrong.');
    const beforeIcon = jest.mocked(SplashScreen.hideAsync).mock.calls.length;

    await act(() => markMasjidIconLoaded());

    expect({ beforeIcon, afterIcon: jest.mocked(SplashScreen.hideAsync).mock.calls.length }).toEqual({
      beforeIcon: 0,
      afterIcon: 1,
    });
  });
});
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py __tests__/app/index.test.tsx ai/plans/06-alert-integrity/scripts/anchors/2-2.txt ai/plans/06-alert-integrity/scripts/changes/2-2.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/2-2.txt to __tests__/app/index.test.tsx`. Any other output: STOP and ask "apply.py printed <output> for anchor 2-2; what do I do?".

   2. Run `npx jest __tests__/app/index.test.tsx --watchman=false --selectProjects=components > $TMPDIR/red-2.log 2>&1`.
   3. Expected in `$TMPDIR/red-2.log`: `Tests:       2 failed, 35 passed, 37 total`, with these failing tests, each prefixed
      `the launch splash in Ramadan, Monday 15 February 2027 at 14:00 › `:
      - `lifts the splash onto the error screen, without waiting for decorations that screen never draws`, with the lines
        `Expected number of calls: 1` and `Received number of calls: 0`;
      - `holds the splash over the error screen until its Masjid icon has loaded, then lifts it`, with the lines
        `-   "afterIcon": 1,` and `+   "afterIcon": 0,`.
   4. Any other result: STOP and ask "the step 2 red run printed <Tests line>; the plan expects 2 failed, 35 passed; what do I do?".

5. **Change.**
   Anchor `2-1` in `app/index.tsx` (saved as `ai/plans/06-alert-integrity/scripts/anchors/2-1.txt`), before:

```ts
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  const decorationsExpected = isRamadan() && decorationsEnabled;
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/2-1.txt`):

```ts
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  // The error screen never mounts the decorations, so waiting for their sprites there would hold the splash over the
  // one screen whose Refresh can recover the app
  const decorationsExpected = isRamadan() && decorationsEnabled && state !== 'hasError';
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py app/index.tsx ai/plans/06-alert-integrity/scripts/anchors/2-1.txt ai/plans/06-alert-integrity/scripts/changes/2-1.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/2-1.txt to app/index.tsx`. Any other output: STOP and ask "apply.py printed <output> for anchor 2-1; what do I do?".


6. **Green.**
   1. Run the red command again, writing to `$TMPDIR/green-2.log`. Expected: `Tests:       37 passed, 37 total`.
   2. Run
      `npx jest __tests__/app/index.test.tsx --watchman=false --selectProjects=components --coverage --collectCoverageFrom=app/index.tsx --coverageReporters=text > $TMPDIR/cov-2.log 2>&1`.
      Expected: `Tests:       37 passed, 37 total` and the row `index.tsx |     100 |      100 |     100 |     100 |`. The log
      also holds stack lines ending `at Index (app/index.tsx:57:33)`: jotai's warning that `loadable` is deprecated, which
      predates this plan. They are expected.
   3. Run `npx tsc --noEmit`. Expected: exit 0 and no output.
   4. Run `npx biome check . --error-on-warnings`. Expected: exit 0, ending `No fixes applied.`
   5. Any difference: STOP and ask "step 2 green printed <line>; what do I do?".

7. **Breaks.**
   1. Run `bash ai/plans/06-alert-integrity/scripts/breaks-2.sh > $TMPDIR/breaks-2.log 2>&1` in the background. It
      takes about 30 seconds.
   2. Expected in `$TMPDIR/breaks-2.log`: 2 lines starting `BREAK 2` that each say `AS EXPECTED`, and the last line
      `ALL AS EXPECTED: 1`. A line saying `NOT AS EXPECTED`: STOP and ask "break <name> did not fail as the plan says:
      <that line>; what do I do?".
   3. Run `git status --porcelain`. Expected: only this step's files and the three plan files. Anything else: STOP.

   The script, saved as `ai/plans/06-alert-integrity/scripts/breaks-2.sh`:

```bash
#!/bin/bash
# Step 2 breaks: run from /Users/muji/repos/rn.athan.uk with bash ai/plans/06-alert-integrity/scripts/breaks-2.sh
# Shared by every breaks script: copy, one perl substitution, check it changed, run the named tests, expect each
# named test to fail, restore. Paths are relative to the repository root, where the script runs.
LOGS="$TMPDIR/plan6-breaks"
mkdir -p "$LOGS"
all=1
brk() { # name, file, perl substitution, jest project, expected failing test titles joined by "|", test paths...
  local name="$1" file="$2" sub="$3" project="$4" expected="$5"
  shift 5
  cp "$file" "$LOGS/$name.backup"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$LOGS/$name.backup"; then
    echo "BREAK $name NOT AS EXPECTED: the substitution did not change $file"
    all=0
    return
  fi
  npx jest "$@" --watchman=false --selectProjects="$project" > "$LOGS/$name.log" 2>&1
  local code=$?
  cp "$LOGS/$name.backup" "$file"
  local missing=""
  local IFS='|'
  for title in $expected; do
    grep -qF -- "● " "$LOGS/$name.log" && grep -F -- "● " "$LOGS/$name.log" | grep -qF -- "$title" || missing="$missing [$title]"
  done
  unset IFS
  if [ "$code" != "0" ] && [ -z "$missing" ]; then
    echo "BREAK $name AS EXPECTED: $(grep -E '^Tests:' "$LOGS/$name.log")"
  else
    echo "BREAK $name NOT AS EXPECTED: jest exit $code, not failing:$missing (log $LOGS/$name.log)"
    all=0
  fi
}
T2="__tests__/app/index.test.tsx"
brk 2a app/index.tsx "s/ && state !== 'hasError';/;/" components "lifts the splash onto the error screen, without waiting for decorations that screen never draws|holds the splash over the error screen until its Masjid icon has loaded, then lifts it" $T2
brk 2b app/index.tsx "s/state !== 'hasError';/state === 'hasError';/" components "holds the splash until the decorations have loaded|lifts the splash once the decorations have loaded" $T2
echo "ALL AS EXPECTED: $all"
```

8. **Version and commit.**
   1. Run `bash ai/plans/06-alert-integrity/scripts/set-version.sh`. Expected: two lines, `VERSION <x.y.z>` and
      `VERSIONS MATCH`. Any other output: STOP and ask "set-version.sh printed <output>; how do I set the version?".
   2. Add exactly these files by name: `app/index.tsx`, `__tests__/app/index.test.tsx`, `app.json`, `package.json`, and `ai/plans/README.md`,
      `ai/plans/06-alert-integrity/PLAN.md` and `ai/plans/06-alert-integrity/LOG.md` when this session changed them.
      Run `git status --porcelain` afterwards. Every changed file must be staged (first column `M` or `A`, second
      column a space). Any other line: STOP and ask "git status shows <line> before the step 2 commit; what do I do?".
   3. Write the commit message below to `$TMPDIR/msg-2.txt`, with `<VERSION>` replaced by the version
      `set-version.sh` printed.
   4. Run `git commit -F $TMPDIR/msg-2.txt > $TMPDIR/commit-2.log 2>&1` in the background, with the hang check from
      `EXECUTOR-BRIEF.md` section 3.
   5. Expected in `$TMPDIR/commit-2.log`: the last `Tests:` line ends `passed, <n> total` with no `failed`; the
      lines `Statements   : 100%`, `Branches     : 100%`, `Functions    : 100%` and `Lines        : 100%`; no line
      starting `Coverage gate:`. If only `shared/__tests__/audioMatrix.test.ts` timed out, follow `EXECUTOR-BRIEF.md`
      section 3. Any other failure: STOP and ask "the step 2 commit failed with <first failing line>; what do I do?".

   The commit message:

```text
<VERSION> - fix(launch): a start-up error lifts the splash onto the error screen in Ramadan too

Finding 80. The splash waited for the Ramadan decoration sprites whenever decorations were on in the season. A sync
that failed on a warm launch shows the error screen, which never mounts the decorations, so their load never came and
the splash stayed over the one screen whose Refresh recovers the app. The owner's ruling: any start-up error always
shows the error page.

- Decorations count as expected only while sync has not failed, since the error screen never draws them.
- A Ramadan launch whose download fails with nothing usable stored now lifts the splash once the Masjid icon loads.
```

9. **Review.**
   Spawn a `Code Reviewer` subagent, isolation `worktree`, with no `model`, and this prompt, with `<sha>` replaced by the
   step 2 commit's sha:

```text
Run git checkout --detach <sha>. Your worktree starts at the wrong branch.

You review one commit in the rn.athan.uk repository, a React Native prayer-times app. The commit is step 2 of the plan
ai/plans/06-alert-integrity/PLAN.md, executed by another model. Read these files in full, with no partial reads:
ai/plans/06-alert-integrity/steps/2-error-screen-lifts-splash.md, __tests__/README.md, app/index.tsx, __tests__/app/index.test.tsx, shared/launchGate.ts, components/ui/Error.tsx, components/ui/Masjid.tsx.

Check each item and report every problem you find:
1. `git show <sha>` changes exactly the files the step's "Files" part lists, plus app.json and package.json, and
   plan files under ai/plans/ only where they record status or the log.
2. The source and test changes equal the step's "Change" and "Tests first" parts character for character. Compare the
   anchors in ai/plans/06-alert-integrity/scripts/anchors/ and the changes in scripts/changes/ and scripts/tests/ with
   the committed files.
3. The version in app.json and package.json is the next patch after the parent commit's package.json, and both match.
4. The commit message equals the step's message with <VERSION> filled in.
5. The splash still waits for the decorations on a Ramadan launch that shows the lists, and lifts once the Masjid icon loads on a launch whose sync failed, whatever the season.
6. Every new test follows __tests__/README.md, and would fail if the line it guards were broken.

Reply with numbered findings (file, line, problem, exact fix), then a final line that is exactly "merge" or
"fix first".
```

   A "merge" verdict is a final line that is exactly `merge`. On "fix first", apply only a fix that `PLAN.md` section 10
   gives word for word; any other finding is a STOP (`EXECUTOR-BRIEF.md` section 4, item 8).

10. **Merge.**
   `git checkout uat-2 && git merge --no-ff fix/audit-80-error-screen-lifts-splash -m "Merge fix/audit-80-error-screen-lifts-splash into uat-2: a start-up error lifts the splash, reviewed"`

11. **Done when.**
   1. `git branch --show-current` prints `uat-2`.
   2. `git log -1 --format=%s` prints `Merge fix/audit-80-error-screen-lifts-splash into uat-2: a start-up error lifts the splash, reviewed`.
   3. `git status --porcelain` lists nothing but the three plan files.
   4. In `PLAN.md` section 6, replace the whole line that starts `- [ ] Step 2:` with `- [x] Step 2: DONE in <merge sha>`, and append the step's record to `LOG.md`.

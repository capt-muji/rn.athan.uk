# Step 5: ai/AGENTS.md stack table re-derived against SDK 58

**Kind: specified.** The executor builds this step from the contracts below. `(specified)` in
PLAN.md's checklist repeats this.

## 0. Anchor check

Run the PLAN.md section 3 anchor check for this step's anchors (`5-*.txt`). Every count must print
`1`. Any other count means NEEDS REPLAN.

## 1. Goal

`ai/AGENTS.md` section 2 states the tree's true stack after the wave, so no later session plans
against SDK 57 facts.

## 2. Branch

```bash
git checkout -b docs/agent-md-sdk58-stack uat-2
```

## 3. Files

Exactly this one, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

- `ai/AGENTS.md`

## 4. Tests first (red)

None. This is a docs-only step; no test can fail on prose. The red phase is skipped by design, and
the break script in part 7 has no substitutions for the same reason. The hook still runs the full
suite and the four 100% coverage lines, which is this step's only executable gate.

## 5. Change

This step is `(specified)`: every edit below is exact; nothing here is a file to copy.

In `ai/AGENTS.md` section 2 ("Stack & Versions"), three edits:

1. The verification line above the table (anchor 5-1; the current text reads "Verified against
   `package.json` on 2026-09-12 at app version 1.25.0, after the Expo SDK / 57 patch wave. When these
   drift again, `package.json` is the source of truth.") becomes:

```markdown
Verified against `package.json` on 2026-09-18 at app version <VERSION>, after the SDK 58 beta
wave (session 12). When these drift again, `package.json` is the source of truth.
```

(`<VERSION>` is this step's version, the same one set in `app.json` and `package.json`.)

2. The stack table's Version cells, row by row. The first two rows (anchor 5-1's table follows the
   verification line) change to:

```markdown
| Framework       | React Native            | 0.88.0-rc.0      |
| Platform        | Expo                    | ~58.0.0-preview.3 |
```

(`UI Library | React | 19.2.3` is unchanged.) These eight rows change to the versions step 1's wave
installed; every other cell of each row (the Category and Technology columns) stays byte-identical:

| Row (Category, Technology) | New Version cell |
| --- | --- |
| Language, TypeScript | `~7.0.2 (strict)` (unchanged; listed for completeness) |
| Routing, Expo Router | `~58.0.4` |
| Audio, Expo Audio | `~58.0.0` |
| Notifications, Expo Notifications | `~58.0.3` |
| Background, expo-background-task / expo-task-manager | `~58.0.3 / ~58.0.4` |
| Updates, expo-updates | `~58.0.5` |
| Widgets, expo-widgets | `~58.0.3` |
| Widget UI, @expo/ui (SwiftUI) | `~58.0.3` |

Every row not named above (State, Storage, Animation, Dates, Colour picker, Logging, Testing,
Lint + Format, Package Manager) already matches the tree; change none of them. After the edits, read
the whole table against `package.json` once: if any row still disagrees, STOP and ask; the plan does
not say which, and a wrong table is worse than a stale one.

3. The "Deliberately ahead of Expo's pins" table (anchor 5-2): the `react-native-reanimated` and
`react-native-worklets` rows are DELETED (4.6.0 and 0.12.2 are SDK 58's own pins; there is nothing to
be ahead of), and the paragraph above the table changes with it, because its "five packages" and
"what SDK 57 shipped with" are both stale after this step. The paragraph's first two sentences
become:

```markdown
**Never run `npx expo install --fix`.** It reports against
`expo/bundledNativeModules.json`, which pins what SDK 58 shipped with, and would silently
roll back three packages this project moved forward on purpose:
```

and the remaining table becomes:

```markdown
| Package | Installed | `--fix` would install |
| --- | --- | --- |
| `jest` | 30.5.1 | ~29.7.0 |
| `@types/jest` | 30.0.0 | 29.5.14 |
| `typescript` | 7.0.2 | ~6.0.3 |
```

The same paragraph's sentence after the table, "`npx expo install --check` is safe and reports the
same five.", becomes "`npx expo install --check` is safe and reports the same three." The sentence
about `@types/node` 26.4.0 stays as it is, and the paragraph's last
line ("Name every package explicitly when upgrading") stays. These three rows and their values are
what `npx expo install --check` printed against the wave while planning (its output is recorded in
PLAN.md section 4); they do not change in this step.

## 6. Green

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
npx jest --silent --coverage
```

All three exit 0 / end `Tests: 4535 passed, 4535 total` (docs change nothing).

## 7. Breaks

Save as `$TMPDIR/breaks-12-5.sh`, run with `bash $TMPDIR/breaks-12-5.sh` from the repository root:

```bash
#!/bin/bash
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# Docs-only step: no code decision exists to break, so there is no substitution to run. The gate is
# the hook's full suite and coverage run in part 8.
echo "caught=0 missed=0"
echo "ALL AS EXPECTED: 1"
```

Expected output, both lines exactly as written. A docs step has no test to fail; this script exists
so the step loop's shape is the same as every other step's.

## 8. Version and commit

```bash
v=$(node -p "const s=require('./package.json').version.split('.');s[2]=String(Number(s[2])+1);s.join('.')") && echo "$v"
```

Set the version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add, by
name: `ai/AGENTS.md`, `app.json`, `package.json`, plus the three plan files when this session changed
them. Commit message (`$TMPDIR/msg-5.txt`, `<VERSION>` replaced):

```text
<VERSION> - docs(agents): stack table re-derived against SDK 58

RN 0.88.0-rc.0 and expo ~58.0.0-preview.3 after session 12's wave. The
reanimated and worklets rows leave the deliberately-ahead table: 4.6.0 and
0.12.2 are SDK 58's own pins now. jest, @types/jest and typescript stay
ahead, per npx expo install --check against the wave.
```

## 9. Review

Spawn `Code Reviewer` (a `general` subagent), isolation `worktree`, no `model`, prompt:

```text
Run git checkout --detach <sha>. Review this docs commit against
/Users/muji/repos/rn.athan.uk/ai/plans/12-sdk58-beta-upgrade/steps/5-agent-md-stack-docs.md (read it
first, in full). Check: the verification line, every table row and the ahead-pins section match the
step's contract with the version filled in; the reanimated and worklets rows are gone; the ahead-pins
paragraph says three packages and SDK 58; nothing else
in ai/AGENTS.md changed; no other file changed beyond the plan's list and the three plan files.
Reply "merge" or "fix first: <findings>".
```

A "fix first" verdict is handled as `EXECUTOR-BRIEF.md` section 4, item 8 says.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff docs/agent-md-sdk58-stack -m "Merge docs/agent-md-sdk58-stack into uat-2: stack table re-derived, step 5 of session 12"
```

## 11. Done when

`npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0; the full suite ends
`Tests: 4535 passed, 4535 total`; `bash $TMPDIR/breaks-12-5.sh` prints `ALL AS EXPECTED: 1`;
`git status --porcelain` lists only this step's files and the three plan files.

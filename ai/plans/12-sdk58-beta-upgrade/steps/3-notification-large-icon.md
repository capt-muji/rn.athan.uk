# Step 3: The Android notification large icon

**Kind: specified.** The executor builds this step from the contracts below. `(specified)` in
PLAN.md's checklist repeats this.

## 0. Anchor check

Run the PLAN.md section 3 anchor check for this step's anchors (`3-*.txt`). Every count must print
`1`. Any other count means NEEDS REPLAN.

## 1. Goal

Every Android notification this app posts carries the owner-chosen large icon (the square image left
of the text): `assets/icons/config/icon-ios.png`, full-colour mosque art the vision read confirmed
stays recognizable at the 64dp the plugin renders it at.

## 2. Branch

```bash
git checkout -b feat/notification-large-icon uat-2
```

## 3. Files

Exactly these, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

- `app.json`
- `shared/__tests__/nativeConfig.test.ts` (new file)

## 4. Tests first (red)

Create `shared/__tests__/nativeConfig.test.ts` with exactly this content:

```ts
/**
 * The app.json config SDK 58 reads: the Android notification large icon, and the widget entries
 * in the nested ios form (the top-level aliases are deprecated in expo-widgets 58)
 */

const loadAppConfigFresh = () => {
  const holder: { config?: import('expo/config').ExpoConfig } = {};
  jest.isolateModules(() => {
    // app.config.ts strips the expo-widgets plugin unless the flag is on, and a flags test that ran
    // earlier in this worker may have deleted the variable; the config under test is the
    // widgets-enabled one
    const previousFlag = process.env.EXPO_PUBLIC_WIDGETS;
    process.env.EXPO_PUBLIC_WIDGETS = '1';
    try {
      holder.config = require('../../app.config').default;
    } finally {
      if (previousFlag === undefined) {
        delete process.env.EXPO_PUBLIC_WIDGETS;
      } else {
        process.env.EXPO_PUBLIC_WIDGETS = previousFlag;
      }
    }
  });
  return holder.config as import('expo/config').ExpoConfig;
};

const pluginProps = (name: string): Record<string, unknown> => {
  const entry = (loadAppConfigFresh().plugins ?? []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === name
  ) as [string, Record<string, unknown>] | undefined;
  return entry?.[1] ?? {};
};

describe('the expo-notifications plugin config', () => {
  it('declares the Android large icon', () => {
    expect(pluginProps('expo-notifications').largeIcon).toBe('./assets/icons/config/icon-ios.png');
  });
});
```

The env-var save/set/restore is not decoration: a flags test that ran earlier in the same worker
deletes `EXPO_PUBLIC_WIDGETS`, and the spike watched this exact order-dependence fail the suite
(lesson recorded in PLAN.md section 4).

| Test | Proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `declares the Android large icon` | The expo-notifications plugin config names the owner-chosen large icon asset | The repo's own `app.config.ts` output, loaded fresh with the widgets flag forced on | `largeIcon` is exactly `'./assets/icons/config/icon-ios.png'` |

Run:

```bash
npx jest shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit
```

Expected: the test FAILS with

```text
Expected: "./assets/icons/config/icon-ios.png"
Received: undefined
```

A suite that fails to load at all is a STOP (the file is new; nothing else can break).

## 5. Change

This step is `(specified)`: build everything below from its contract; nothing here is a file to copy,
except the new test file's content in part 4, which is used verbatim.

In `app.json`, the expo-notifications plugin block (anchor 3-1) gains the `largeIcon` line directly
under `icon`:

```json
      [
        "expo-notifications",
        {
          "icon": "./assets/icons/config/icon-android-notification.png",
          "largeIcon": "./assets/icons/config/icon-ios.png",
```

Nothing else in `app.json` changes. Verified from `expo-notifications@58.0.3`'s plugin source while
planning: `largeIcon` is resized to a 64dp baseline into every drawable density as
`notification_large_icon.png` and announced through the manifest meta-data
`expo.modules.notifications.large_notification_icon`. Our notifications carry no image of their own,
so the large icon shows on every one of them, silent reminders included. The change takes effect at
the device proof's prebuild; no JS sees it.

## 6. Green

```bash
npx jest shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit
```

Expected: `Tests: 1 passed, 1 total`. Then:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Both exit 0. Full suite:

```bash
npx jest --silent --coverage
```

ends `Tests: 4534 passed, 4534 total` (the new suite is the 160th).

## 7. Breaks

Save as `$TMPDIR/breaks-12-3.sh`, run with `bash $TMPDIR/breaks-12-3.sh` from the repository root:

```bash
#!/bin/bash
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
caught=0
missed=0

break_one() {
  label="$1"; file="$2"; sub="$3"; expect="$4"
  cp "$file" "$file.break-bak"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$file.break-bak"; then
    echo "BREAK NOT APPLIED: $label"
    missed=$((missed + 1))
  else
    out=$(npx jest shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit 2>&1)
    if echo "$out" | grep -qE "$expect"; then
      echo "caught: $label"
      caught=$((caught + 1))
    else
      echo "NOT CAUGHT: $label"
      echo "$out" | grep -E "Tests:|✕" | head -5
      missed=$((missed + 1))
    fi
  fi
  cp "$file.break-bak" "$file"; rm "$file.break-bak"
}

# 1. The asset choice is the decision; a different asset is a different notification
break_one "largeIcon swapped" app.json \
  "s|\"largeIcon\": \"./assets/icons/config/icon-ios.png\",|\"largeIcon\": \"./assets/icons/config/icon-android-adaptive.png\",|" \
  "declares the Android large icon"

# 2. The prop itself
break_one "largeIcon dropped" app.json \
  "s|\"largeIcon\": \"./assets/icons/config/icon-ios.png\",\n||" \
  "declares the Android large icon"

echo "caught=$caught missed=$missed"
[ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: `caught=2 missed=0` then `ALL AS EXPECTED: 1`.

## 8. Version and commit

```bash
v=$(node -p "const s=require('./package.json').version.split('.');s[2]=String(Number(s[2])+1);s.join('.')") && echo "$v"
```

Set the version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add, by
name: `app.json`, `shared/__tests__/nativeConfig.test.ts`, `package.json`, plus the three plan files
when this session changed them. Commit message (`$TMPDIR/msg-3.txt`, `<VERSION>` replaced):

```text
<VERSION> - feat(notifications): the Android large icon is the full-square mosque art

expo-notifications 58's plugin takes largeIcon, renders it at a 64dp baseline
into every drawable density and points the manifest meta-data at it. Asset
icon-ios.png by owner ruling 2026-09-18 (a vision read at 64dp: the mosque
stays recognizable; the adaptive-icon foreground collapses to a speck). Our
notifications carry no image of their own, so it shows on every notification,
and the device proof captures the notification shade before and after for the
owner's own eyes, who may revert it.

Tests: 4534 passed, 4534 total; coverage 100% statements/branches/functions/lines.
```

## 9. Review

Spawn `Code Reviewer` (a `general` subagent), isolation `worktree`, no `model`, prompt:

```text
Run git checkout --detach <sha>. Review this commit against
/Users/muji/repos/rn.athan.uk/ai/plans/12-sdk58-beta-upgrade/steps/3-notification-large-icon.md
(read it first, in full). Check: app.json gains exactly the one largeIcon line with the owner's
asset and nothing else; the new test file matches the plan's verbatim content; the test sets and
restores EXPO_PUBLIC_WIDGETS around its fresh load; no other file changed beyond the plan's list
and the three plan files. Reply "merge" or "fix first: <findings>".
```

A "fix first" verdict is handled as `EXECUTOR-BRIEF.md` section 4, item 8 says.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff feat/notification-large-icon -m "Merge feat/notification-large-icon into uat-2: the mosque art on every Android notification, step 3 of session 12"
```

## 11. Done when

The green command ends `Tests: 1 passed, 1 total`; `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0; the full suite ends
`Tests: 4534 passed, 4534 total`; `bash $TMPDIR/breaks-12-3.sh` ends `ALL AS EXPECTED: 1`;
`git status --porcelain` lists only this step's files and the three plan files.

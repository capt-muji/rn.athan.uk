# Step 4: The widget entries move to the nested ios form

**Kind: specified.** The executor builds this step from the contracts below. `(specified)` in
PLAN.md's checklist repeats this.

## 0. Anchor check

Run the PLAN.md section 3 anchor check for this step's anchors (`4-*.txt`). Every count must print
`1`. Any other count means NEEDS REPLAN.

## 1. Goal

All ten expo-widgets entries in `app.json` carry their iOS settings nested under `ios`, the form the
v58 docs prescribe, with no deprecated top-level aliases left. The widgets flag is OFF, so this is
config hygiene on dead config today; it is being done now so the config is already correct when
widgets work resumes.

## 2. Branch

```bash
git checkout -b chore/widgets-nested-ios-config uat-2
```

## 3. Files

Exactly these, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

- `app.json`
- `shared/__tests__/nativeConfig.test.ts`

## 4. Tests first (red)

`shared/__tests__/nativeConfig.test.ts` exists from step 3. At red, the file gains exactly two
additions: the `nested` helper, placed between `pluginProps` and the first `describe` with one blank
line either side, and this `describe` at the end of the file, separated by one blank line:

```ts
const nested = (widget: Record<string, unknown>): { supportedFamilies?: unknown } | undefined =>
  widget.ios as { supportedFamilies?: unknown } | undefined;

describe('the expo-widgets plugin config', () => {
  it('carries every widget nested under ios with no deprecated top-level keys', () => {
    const widgets = pluginProps('expo-widgets').widgets as Array<Record<string, unknown>>;
    expect(widgets).not.toHaveLength(0);

    for (const widget of widgets) {
      expect(Array.isArray(nested(widget)?.supportedFamilies)).toBe(true);
      expect(widget.supportedFamilies).toBeUndefined();
      expect(widget.contentMarginsDisabled).toBeUndefined();
    }
  });
});
```

(That placement sentence repeats part 4's: the helper and the describe are both written at red;
nothing is added at green.)

| Test | Proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `carries every widget nested under ios with no deprecated top-level keys` | Every widget entry nests its families under `ios` and no entry keeps the deprecated top-level aliases | The repo's own `app.config.ts` output, loaded fresh with the widgets flag forced on | Every widget has an array at `ios.supportedFamilies`; `supportedFamilies` and `contentMarginsDisabled` are absent at the top level of every widget |

Run:

```bash
npx jest shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit
```

Expected: the new test FAILS with `Expected: true / Received: false` at the
`Array.isArray(nested(widget)?.supportedFamilies)` assertion (today every widget has top-level
`supportedFamilies`, so `nested` answers undefined), and step 3's test still passes. Any other
failure, or the new test passing, is a STOP.

## 5. Change

This step is `(specified)`: build everything below from its contract; the new test block in part 4
and the table below are used verbatim.

In `app.json`, each of the ten widget entries moves `supportedFamilies` (and, where present,
`contentMarginsDisabled`) into a nested `ios` object. The eight home-screen widgets become, each in
the same one-line shape (here the first, anchor 4-1; the other seven differ only in `name`,
`displayName`, `description` and the families array, which the table below fixes):

```json
            {
              "name": "PrayerWidget",
              "displayName": "Next Prayer (Light)",
              "description": "A countdown to the next prayer.",
              "ios": { "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }
            },
```

| Widget | `ios` object |
| --- | --- |
| `PrayerWidget` | `{ "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }` |
| `ExtrasWidget` | `{ "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }` |
| `PrayerWidgetMedium` | `{ "supportedFamilies": ["systemMedium"], "contentMarginsDisabled": true }` |
| `ExtrasWidgetMedium` | `{ "supportedFamilies": ["systemMedium"], "contentMarginsDisabled": true }` |
| `PrayerWidgetDark` | `{ "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }` |
| `ExtrasWidgetDark` | `{ "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }` |
| `PrayerWidgetDarkMedium` | `{ "supportedFamilies": ["systemMedium"], "contentMarginsDisabled": true }` |
| `ExtrasWidgetDarkMedium` | `{ "supportedFamilies": ["systemMedium"], "contentMarginsDisabled": true }` |
| `PrayerLockWidget` | `{ "supportedFamilies": ["accessoryRectangular", "accessoryInline"] }` |
| `ExtrasLockWidget` | `{ "supportedFamilies": ["accessoryRectangular", "accessoryInline"] }` |

The two lock widgets (anchor 4-2) keep no `contentMarginsDisabled`, as today. Names, display names
and descriptions are unchanged. Verified from `expo-widgets@58.0.3`'s plugin source while planning:
`widget.ios?.supportedFamilies ?? widget.supportedFamilies ?? []` is the reading order, so the
nested form wins and the top-level form is the deprecated fallback; `validateWidget` rejects unknown
family strings, and every family string above is in its `VALID_WIDGET_FAMILIES` set.

## 6. Green

```bash
npx jest shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit
```

Expected: `Tests: 2 passed, 2 total`. Then:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Both exit 0. Full suite:

```bash
npx jest --silent --coverage
```

ends `Tests: 4535 passed, 4535 total`.

## 7. Breaks

Save as `$TMPDIR/breaks-12-4.sh`, run with `bash $TMPDIR/breaks-12-4.sh` from the repository root:

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

# 1. One widget back on the deprecated top-level form
break_one "lock widget un-nested" app.json \
  's/"ios": \{ "supportedFamilies": \["accessoryRectangular", "accessoryInline"\] \}/"supportedFamilies": ["accessoryRectangular", "accessoryInline"]/' \
  "carries every widget nested under ios"

# 2. The margins alias returns on one widget
break_one "margins alias returns" app.json \
  's/"ios": \{ "supportedFamilies": \["systemSmall"\], "contentMarginsDisabled": true \}/"ios": { "supportedFamilies": ["systemSmall"] },\n              "contentMarginsDisabled": true/' \
  "carries every widget nested under ios"

echo "caught=$caught missed=$missed"
[ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: `caught=2 missed=0` then `ALL AS EXPECTED: 1`. Break 1 un-nests `PrayerLockWidget` (the first
lock entry; both share the same one-line shape, so the substitution hits the first occurrence and the
loop fails on it). Break 2 restores the deprecated alias on the first `systemSmall` widget.

## 8. Version and commit

```bash
v=$(node -p "const s=require('./package.json').version.split('.');s[2]=String(Number(s[2])+1);s.join('.')") && echo "$v"
```

Set the version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add, by
name: `app.json`, `shared/__tests__/nativeConfig.test.ts`, `package.json`, plus the three plan files
when this session changed them. Commit message (`$TMPDIR/msg-4.txt`, `<VERSION>` replaced):

```text
<VERSION> - chore(widgets): all ten widget entries on the nested ios form

expo-widgets 58 deprecates the top-level supportedFamilies and
contentMarginsDisabled aliases; the plugin reads ios.* first and falls back
to the aliases. Every entry nests now, so no widget resumes work on the
deprecated shape. Config only: the widgets flag is off and app.config.ts
strips the plugin, so nothing builds or ships differently today.

Tests: 4535 passed, 4535 total; coverage 100% statements/branches/functions/lines.
```

## 9. Review

Spawn `Code Reviewer` (a `general` subagent), isolation `worktree`, no `model`, prompt:

```text
Run git checkout --detach <sha>. Review this commit against
/Users/muji/repos/rn.athan.uk/ai/plans/12-sdk58-beta-upgrade/steps/4-nested-widgets-config.md (read
it first, in full). Check: every one of the ten widget entries matches the plan's table exactly
(name, displayName, description unchanged; the ios object exactly as tabulated; the lock widgets
carry no contentMarginsDisabled); no top-level supportedFamilies or contentMarginsDisabled remains
anywhere in the widgets array; the new test block matches the plan verbatim; no other file changed
beyond the plan's list and the three plan files. Reply "merge" or "fix first: <findings>".
```

A "fix first" verdict is handled as `EXECUTOR-BRIEF.md` section 4, item 8 says.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff chore/widgets-nested-ios-config -m "Merge chore/widgets-nested-ios-config into uat-2: widget entries nested under ios, step 4 of session 12"
```

## 11. Done when

The green command ends `Tests: 2 passed, 2 total`; `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0; the full suite ends
`Tests: 4535 passed, 4535 total`; `bash $TMPDIR/breaks-12-4.sh` ends `ALL AS EXPECTED: 1`;
`git status --porcelain` lists only this step's files and the three plan files.

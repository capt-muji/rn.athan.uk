# Plan 134: widgets-off Android release builds fail their own lint gate

| | |
| --- | --- |
| Brief | queue row 134 |
| Planned at | `80f707d5` (2.0.1002), 2026-10-17 |
| Planned by | lane 134 |
| Needs first | nothing |
| Parent | none |
| Group | none (`app.config.ts` and `plugins/androidLocaleConfig.js` touch no other open ticket) |
| Batch budget | 4 |
| Session budget | 8 |
| Steps count | 3 (code 2, build 3 lane-run, records 1) |
| Device | none: build-bay proof only, no phone is touched |
| Owner decisions still needed | none |

## 1. Goal

A widgets-off Android release prebuild at HEAD drops `./plugins/androidLocaleConfig`
from the resolved plugins, `values/locales_defaults.xml` is never written, and
`:app:lintVitalRelease` fails with 150 fatal `ExtraTranslation` errors (30 keys
across ar ms so hi th). Measured 2026-10-17 by the owner's fleettest build
(`$HOME/athan-gitree/builds/fleettest-65981367/logs/gradle.log`) and reproduced by
this lane's scratch red build at `80f707d5`
(`$HOME/athan-gitree/sessions/134/logs/red-gradle.log`).

When DONE: every Android-only prebuild resolution carries the locale-config
plugin regardless of `EXPO_PUBLIC_ANDROID_WIDGETS`; the plugin writes default
strings for every translated key even when the resolution strips `expo-widgets`;
a widgets-off Android release build at the fix passes `:app:lintVitalRelease`
with no lint exclusion anywhere. The owner notices the next fleettest build
succeeding first try.

Owner rules that apply (ai/AGENTS.md): red before green with full coverage of
every touched line and a mutation pass on guarded logic; builds happen locally
through the build-bay discipline under `build.lock`; no lint exclusions or
baselines may be introduced (the failing gate text itself proposes a baseline:
that route is banned here); `yarn validate` before done; version bump on every
commit, app.json first.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D134.1 | The android branch is entered on `platform === 'android'` or `platform === undefined && androidOnlyResolution`; the widgets flag stops gating the branch and only picks enable-vs-strip inside it | agent-ruled | 2026-10-17 | PLAN.md 2.1, D134 rationale below |
| D134.2 | The plugin derives the widget kinds from the committed `app.json` on disk and skips android kinds only when the resolved plugins hold `expo-widgets` | agent-ruled | 2026-10-17 | PLAN.md 2.1 |
| D134.3 | Red proof re-run by this lane at `80f707d5` with the documented recipe, not only the owner's 2.0.996 logs; green proof from build-bay content at the merged fix | agent-ruled | 2026-10-17 | PLAN.md step 2, LOG.md |
| D134.4 | `yarn test:tz` not run: the change touches config resolution only, no date or time path | agent-ruled | 2026-10-17 | PLAN.md 2.1 |
| D134.5 | Step 2 (the build proof) is lane-run, per the lane protocol's build-bay rule; the executor works the lane worktree only | agent-ruled | 2026-10-17 | PLAN.md step 2 |
| D134.6 | `build-mock.zsh`, `build-prod.zsh` and `.env.example` stay untouched: the standard mock build's widgets-on `.env` is relied upon (widget providers prove the flags reach the build) and the defect is the config resolution, not the scripts | agent-ruled | 2026-10-17 | PLAN.md 2.1 |

D134.1 argued twice: for - the argv/env disjunct is this file's established
android-resolution signal and every real build path pins `-p android`; the
alternative of appending the plugin in every non-ios-only resolution covers a
bare combined `expo prebuild` that no build path runs, at the cost of
restructuring branches with shipped semantics and changing iOS and jest
resolutions. Against - a bare combined widgets-off prebuild would still fail;
that invocation also drops every env discipline the build scripts exist to
carry, and it is indistinguishable by argv from `expo start` and `expo export`
resolutions. The recommendation survives.

D134.2 argued twice: for - the strip mutates the same config object before the
locale plugin is appended, so no call order can preserve the entry; the
committed app.json is the single source the lockstep test already pins.
Against - a resolved override of the widgets block would be missed; no such
override exists (the block lives in static app.json only). The recommendation
survives.

### 2.2 The executor must not decide

- Any deviation from the named contracts, test names or file list: STOP.
- If the red tests pass before the change, or any unnamed test fails: STOP.
- If the break script's substitutions do not match the code: STOP.
- Anything about devices, installs or the phones: there are none in this
  ticket; a command that touches adb or a serial is a STOP.

## 3. Pre-flight

`scripts/preflight-134.sh` (committed in this folder). The executor saves a
copy to `$TMPDIR` and runs it with the lane worktree root
(`$HOME/athan-gitree/worktrees/lane-134`) as cwd, before creating the fix
branch. It checks the worktree is the lane's (a git toplevel holding
`app.config.ts`), the branch is `lane/134` or `fix/*`, the worktree clean,
nothing on `origin/uat` missing from the branch, the version not lower than
Planned at, the ticket row present, and every anchor counting exactly 1 (four
repo anchors, one node_modules anchor against the installed tree, one
build-script anchor). "Rerun after checkout" means the six anchor counts
only, same cwd, on the fix branch. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`):

- `app.config.ts` - the dynamic config. `androidWidgetsEnabled` (line 34)
  reads `EXPO_PUBLIC_ANDROID_WIDGETS === '1'`. `androidOnlyResolution`
  (lines 49-51) is true when the normalized CLI argv holds an `android` token
  without an `ios` token (anchor `resolve-config.txt`), or
  `EXPO_WIDGETS_ANDROID=1`. `resolveConfig` (lines 84-91) is the exported
  resolver.
- `plugins/androidLocaleConfig.js` - the mod. `withAndroidManifest` points the
  application tag at `@xml/locales_config`; the dangerous mod writes
  `res/xml/locales_config.xml` and `res/values/locales_defaults.xml`.
  `defaultLocaleStringEntries` (anchor `plugin-defaults.txt`) currently reads
  the widget kinds from the RESOLVED `config.plugins`.
- `node_modules/@expo/config/build/Config.js` (under the installed
  expo 58.0.13, whose @expo/config is 58.0.6) - the CLI
  evaluates the exported function with `{projectRoot, staticConfigPath,
  packageJsonPath, config}` and no `platform` key (anchor
  `cli-no-platform.txt`; `prebuildAsync.js:52` and `ensureConfigAsync.js`
  call `getConfig(projectRoot)` with no options). So `platform` is `undefined`
  at every CLI evaluation, and `platform === 'android'` is a route only direct
  callers (the tests) take.
- `shared/__tests__/flags.test.ts` - `withCliArgv` sets `process.argv`;
  `loadAppConfigFresh(platform)` loads the config fresh. The
  `strips expo-widgets` test (anchor `flags-strip-test.txt`) asserts the strip
  but never the locale plugin: that is the gap that let this defect ship.
- `shared/__tests__/config.test.ts` - `resolveAndroid` passes
  `{platform: 'android'}`: the platform route the real CLI never takes.
- `shared/__tests__/nativeLocalesConfig.test.ts` - pins
  `defaultLocaleStringEntries(ROOT, app)` at 14 entries with the full config
  (anchor `native-pin.txt`).
- `$HOME/athan-gitree/bin/build-mock.zsh` - writes `.env` from `.env.example`
  stripping only ENV and API_KEY lines (anchor `build-mock-env.txt`), so the
  standard mock build keeps `EXPO_PUBLIC_ANDROID_WIDGETS=1`: that is why every
  earlier build passed the gate.

How the pieces fail together: the CLI never passes `platform`; a widgets-off
android prebuild (`-p android`, flag unset) makes line 85's condition false,
so `resolveConfig` falls to the combined branch and returns
`stripWidgetsPlugin(config)` with no locale plugin. Stock prebuild still writes
`values-b+{ar,ms,so,hi,th}/strings.xml` with 30 keys each (measured in the red
build: 30 `<string>` entries in values-b+ar), and nothing writes the default
twins, so lint fails 30 x 5 = 150. Behind that defect sits a second one: the
widgets-off branch strips the `expo-widgets` entry from `config.plugins`
before `withAndroidLocaleConfig` appends the locale plugin, so
`defaultLocaleStringEntries` would find no widget kinds and write only the 2
permission defaults; and with `expo-widgets` absent no writer exists for the
8 android kinds' defaults. The branch as written has never run in a real
build, which is why neither defect surfaced until the owner's fleettest build.

Why the 131-era build passed at `ca73f5a9` with byte-identical config files:
lane 131's LOG (commit `393fdcfb`) records the first gradle run there failing
lintVitalRelease identically; the passing second run followed re-adding
`EXPO_PUBLIC_ANDROID_WIDGETS=1` to the scratch `.env` (the grill-finding-11
revert). No build has ever passed this gate widgets-off. The historical
mock/prod builds passed because their `.env` keeps the flag at 1. The owner's
fleettest build is the first genuinely widgets-off android release prebuild.

Why the obvious fix is wrong: registering the plugin in static `app.json`
would carry it into every resolution including iOS and jest lockstep tests,
and contradicts this file's architecture (android-scoped plugins ride the
android branch). Making `platform` reach the config is not ours to change (the
CLI is pinned). A lint baseline or exclusion is banned: the gate must pass on
its own merits.

## 5. Design

Invariant, one sentence a test can check: on every Android-only resolution the
resolved plugins contain `./plugins/androidLocaleConfig`, and the plugin's
defaults cover every translated values-b+ key regardless of whether
`expo-widgets` is in the resolution.

The change has two parts. Part 1, `app.config.ts`: drop `androidWidgetsEnabled`
from the branch condition; the flag only chooses `enableAndroidWidgets` versus
`withAndroidLocaleConfig(stripWidgetsPlugin(...))` inside the branch. Part 2,
`plugins/androidLocaleConfig.js`: read the widget kinds from the committed
`app.json` on disk (the infoPlist read's established pattern, same reason: the
mod sandbox), and skip android kinds only when the resolved plugins hold the
`expo-widgets` entry, because only then does expo-widgets write those defaults
itself (and a twin would be a duplicate resource).

Concurrency trace: none. `resolveConfig` runs synchronously inside the config
evaluation; the mod runs once per prebuild in the prebuild phase; no timers, no
subscriptions, no shared mutable state beyond the files it writes.

Alternatives rejected: registering the plugin statically in app.json (every
resolution changes; iOS and jest lockstep tests shift); appending the plugin
in every non-ios-only resolution (covers a bare combined prebuild no build
path runs, restructures shipped branch semantics); reordering strip and append
in app.config.ts (the strip has already mutated the array; order cannot
preserve the entry); passing the kinds through plugin props (duplicates data
app.json already holds and changes the registration shape).

Design review: the widgets-on path must stay byte-identical (same plugin list,
same 14 defaults) - pinned by the existing flags.test.ts widgets-on test and
nativeLocalesConfig.test.ts 14-entry pin, both unchanged in their assertions.
The red-green pair at build level proves the gate itself.

**Acceptance criteria:**

- [R1.1] WHEN the config resolves for an Android-only prebuild with `EXPO_PUBLIC_ANDROID_WIDGETS` unset (platform undefined, argv tokens `['prebuild', 'android']`) THE SYSTEM SHALL return a plugin list containing `./plugins/androidLocaleConfig` and not containing `expo-widgets`.
- [R1.2] WHEN the same resolution runs with `EXPO_PUBLIC_ANDROID_WIDGETS=1` THE SYSTEM SHALL return the widgets-on resolution unchanged: `expo-widgets` with `enableAndroid: true`, `./plugins/androidWidgetGrid` registered before it, `./plugins/androidWidgetAssets`, `./plugins/androidLocaleConfig`, and `config.ios` undefined.
- [R1.3] WHEN the resolution passes `platform: 'ios'`, or its argv carries an `ios` token, or no android token at all THE SYSTEM SHALL return a plugin list without `./plugins/androidLocaleConfig`.
- [R1.4] WHEN `EXPO_WIDGETS_ANDROID=1` with the widgets flag unset THE SYSTEM SHALL return the widgets-off android resolution: locale plugin present, `expo-widgets` absent.
- [R2.1] WHEN `defaultLocaleStringEntries` runs against a resolved config whose plugins lack `expo-widgets` THE SYSTEM SHALL return 30 entries: the 2 permission strings plus `_display_name` and `_description` for all 14 widget kinds, byte-identical to the en gallery table.
- [R2.2] WHEN it runs against a config holding the `expo-widgets` entry THE SYSTEM SHALL return the same 14 entries it returned before the change.
- [R3.1] WHEN the widgets-off Android release build runs at the fix (`gradlew assembleRelease`, no lint exclusion) THE SYSTEM SHALL execute `:app:lintVitalRelease` and print `BUILD SUCCESSFUL` with zero `ExtraTranslation` errors.
- [R3.2] WHILE the same build runs at `80f707d5` THE SYSTEM SHALL fail `:app:lintVitalRelease` with 150 `ExtraTranslation` errors over 30 keys across ar ms so hi th, recorded under `$HOME/athan-gitree/sessions/134/logs/`.

## 6. Steps

Checklist:

- [ ] Step 1: config branch and plugin defaults, red-first with mutation pass
- [ ] Step 2: build-bay green proof at the merged fix (lane-run)

After step 2 merges, the executor's Finishing (athan-executor agent file) applies
section 8's records text and makes the executed docs commit; no separate records
step exists.

### Step 1 - the config branch and the plugin defaults

Requirements: R1.1, R1.2, R1.3, R1.4, R2.1, R2.2
Weight: 2
Anchor check: all six anchors count 1 (pre-flight covers this; rerun after
checkout).

Goal: the android branch no longer requires the widgets flag, and the plugin's
defaults cover every translated key on both resolutions.

Branch: `fix/134-locale-plugin-every-android` off `uat`.

Files: `app.config.ts`, `plugins/androidLocaleConfig.js`,
`shared/__tests__/config.test.ts`, `shared/__tests__/flags.test.ts`,
`shared/__tests__/nativeLocalesConfig.test.ts`.

Red tests (write first, run, record the failing lines):

1. `shared/__tests__/config.test.ts`, inside the existing
   `app.config android resolution` describe, a new helper and four new tests:

```typescript
const resolveAndroidRoute = (
  widgetsEnv: string | undefined,
  argvTokens: readonly string[],
  platform: string | undefined
): { plugins?: unknown[]; ios?: unknown } => {
  const previousWidgets = process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
  if (widgetsEnv === undefined) delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
  else process.env.EXPO_PUBLIC_ANDROID_WIDGETS = widgetsEnv;
  const previousArgv = process.argv;
  process.argv = ['/usr/local/bin/node', 'prebuild', ...argvTokens];
  let resolved: { plugins?: unknown[]; ios?: unknown } | undefined;
  try {
    jest.isolateModules(() => {
      const mod = require('../../app.config');
      resolved = mod.default({ platform });
    });
  } finally {
    process.argv = previousArgv;
    if (previousWidgets === undefined) delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    else process.env.EXPO_PUBLIC_ANDROID_WIDGETS = previousWidgets;
  }
  return resolved as unknown as { plugins?: unknown[]; ios?: unknown };
};

it('registers the locale config on the real CLI route: platform undefined, android argv, widgets off', () => {
  const resolved = resolveAndroidRoute(undefined, ['android'], undefined);
  expect(resolved.plugins).toContain('./plugins/androidLocaleConfig');
  expect(resolved.plugins?.some((p) => Array.isArray(p) && p[0] === 'expo-widgets')).toBe(false);
});

it('keeps the widgets-on argv resolution unchanged', () => {
  const resolved = resolveAndroidRoute('1', ['android'], undefined);
  expect(resolved.ios).toBeUndefined();
  expect(resolved.plugins).toContain('./plugins/androidLocaleConfig');
  expect(resolved.plugins?.some((p) => Array.isArray(p) && p[0] === 'expo-widgets')).toBe(true);
});

it('stays out of the android branch when argv carries ios', () => {
  const resolved = resolveAndroidRoute(undefined, ['android', 'ios'], undefined);
  expect(resolved.plugins).not.toContain('./plugins/androidLocaleConfig');
});

it('stays out of the android branch when a platform is passed', () => {
  const resolved = resolveAndroidRoute(undefined, ['android'], 'ios');
  expect(resolved.plugins).not.toContain('./plugins/androidLocaleConfig');
});
```

Run: `npx jest shared/__tests__/config.test.ts --watchman=false --selectProjects=unit`
Expected red: the first test fails with a `toContain` mismatch (the array holds
no `./plugins/androidLocaleConfig`); the fourth fails the same way only after
the change is half-applied (it passes red today because today's condition also
skips the branch; it pins the guard for the mutation pass). The two existing
tests in the describe keep passing.

2. `shared/__tests__/flags.test.ts`:

   - In `strips the expo-widgets plugin when the flag is disabled` (the
     combined-resolution test in the `app.config widget plugin parity`
     describe), add after the `expo-notifications` assertion:

```typescript
    expect(pluginNames(config)).not.toContain('./plugins/androidLocaleConfig');
```

     That assertion is R1.3's no-android-token leg: it passes today and after
     the change, pinning that a resolution with no android signal never gains
     the locale plugin.

   - In `strips expo-widgets on the android resolution when the android flag
     is off`, add after the existing assertion:

```typescript
    expect(pluginNames(config)).toContain('./plugins/androidLocaleConfig');
```

   - New test after it:

```typescript
  it('registers the locale config on the android argv route with the flag off', () => {
    setAndroidEnv(undefined);
    let config!: import('expo/config').ExpoConfig;
    withCliArgv(['android'], () => {
      config = loadAppConfigFresh(undefined);
    });
    expect(pluginNames(config)).not.toContain('expo-widgets');
    expect(pluginNames(config)).toContain('./plugins/androidLocaleConfig');
    expect(pluginNames(config)).not.toContain('./plugins/androidWidgetGrid');
    expect(pluginNames(config)).not.toContain('./plugins/androidWidgetAssets');
    expect(config.ios?.bundleIdentifier).toBe('com.mugtaba.athan');
  });
```

   - In `treats EXPO_WIDGETS_ANDROID as a platform signal, gated by the flag`,
     rename it to `treats EXPO_WIDGETS_ANDROID as a platform signal, locale
     config without the flag` and add before its closing brace:

```typescript
    expect(pluginNames(flagStillGates)).toContain('./plugins/androidLocaleConfig');
```

Run: `npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit`
Expected red: the new argv-route test and the assertion added to the renamed
`EXPO_WIDGETS_ANDROID` test fail with `toContain` mismatches (no locale plugin
on the widgets-off routes today). The assertion added to the android-flag-off
strip test passes today already (that test drives `platform: 'android'`, a
route the branch's first disjunct already takes, so the plugin is present at
HEAD): it pins the platform route, not the red. The no-android-token
assertion passes today and after the change by design.

3. `shared/__tests__/nativeLocalesConfig.test.ts`, new test after the
   existing `derives a default-locale twin...` test:

```typescript
  it('derives all 30 defaults when the resolution strips expo-widgets', () => {
    const { defaultLocaleStringEntries } = require(join(ROOT, 'plugins', 'androidLocaleConfig.js')) as {
      defaultLocaleStringEntries: (projectRoot: string, config: Record<string, unknown>) => Array<[string, string]>;
    };
    const stripped = {
      ...app,
      plugins: (app.plugins as unknown[]).filter((plugin) => !(Array.isArray(plugin) && plugin[0] === 'expo-widgets')),
    };
    const entries = defaultLocaleStringEntries(ROOT, stripped);
    const defaults = new Map(entries);
    expect(defaults.size).toBe(30);

    // The ExtraTranslation invariant: every translated key gains a default twin
    const locales = app.locales as Record<string, { android: Record<string, string> }>;
    const translatedKeys = new Set(Object.values(locales).flatMap((entry) => Object.keys(entry.android)));
    translatedKeys.add('NSLocationWhenInUseUsageDescription');
    translatedKeys.add('NSUserNotificationsUsageDescription');
    expect(translatedKeys.size).toBe(30);
    for (const key of translatedKeys) {
      expect(defaults.has(key)).toBe(true);
    }

    // The android kinds' twins read the same en gallery bytes as the iOS-only kinds'
    for (const widget of widgetKinds()) {
      expect(defaults.get(`${resourceName(widget.name)}_display_name`)).toBe(NATIVE.en.gallery[widget.displayName]);
      expect(defaults.get(`${resourceName(widget.name)}_description`)).toBe(NATIVE.en.gallery[widget.description]);
    }
  });
```

Run: `npx jest shared/__tests__/nativeLocalesConfig.test.ts --watchman=false --selectProjects=unit`
Expected red: fails with `expect(received).toBe(30)` receiving `2` (today the
stripped config yields only the two permissions). Every other test in all
three suites keeps passing.

Change contracts:

A. `app.config.ts`, `resolveConfig` (find by anchor `resolve-config.txt`):
   the first condition loses its `&& androidWidgetsEnabled`:

```typescript
const resolveConfig = ({ platform }: { platform?: string }): ExpoConfig => {
  if (platform === 'android' || (platform === undefined && androidOnlyResolution)) {
    if (androidWidgetsEnabled) return enableAndroidWidgets(config);
    return withAndroidLocaleConfig(stripWidgetsPlugin(config));
  }
```

   The comment block above `androidOnlyResolution` (lines 41-48) gains one
   sentence at its end: a widgets-off android resolution keeps the locale
   config and strips the widget code generation, because the translated
   values-b+ keys otherwise fail lintVitalRelease with no default twins.
   No other line of the file changes.

B. `plugins/androidLocaleConfig.js`, `defaultLocaleStringEntries` (find by
   anchor `plugin-defaults.txt`), becomes exactly:

```javascript
const expoWidgetsResolvesWidgetDefaults = (config) =>
  (config.plugins ?? []).some((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets');

const defaultLocaleStringEntries = (projectRoot, config) => {
  // readFileSync, not require: the mod compiler evaluates this file in a sandbox whose
  // require does not resolve dynamic absolute paths the way plain node does
  const appExpo = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8')).expo;
  const infoPlist = appExpo.ios.infoPlist;
  const widgetsEntry = (appExpo.plugins ?? []).find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets');
  const widgets = widgetsEntry ? widgetsEntry[1].widgets : [];
  const entries = [
    ['NSLocationWhenInUseUsageDescription', infoPlist.NSLocationWhenInUseUsageDescription],
    ['NSUserNotificationsUsageDescription', infoPlist.NSUserNotificationsUsageDescription],
  ];
  for (const widget of widgets) {
    // expo-widgets writes the android kinds' defaults itself; a twin here would
    // be a duplicate resource. With the plugin stripped from the resolution
    // (widgets off) nobody else writes them, so every kind twins
    if (widget.android && expoWidgetsResolvesWidgetDefaults(config)) continue;
    entries.push([`${widgetResourceName(widget.name)}_display_name`, widget.displayName]);
    entries.push([`${widgetResourceName(widget.name)}_description`, widget.description]);
  }
  return entries;
};
```

   with its docblock's last sentence (`Android kinds are skipped: expo-widgets
   already writes their defaults.`) replaced by: `Android kinds are skipped
   only when expo-widgets is in the resolved plugins: it writes their
   defaults, and with it stripped (widgets off) every kind twins here or the
   translated keys fail lintVitalRelease.` The docblock's `the android
   resolution drops config.ios, so the en permission bytes are read from the
   committed app.json` sentence becomes exactly `the android resolution drops
   config.ios, so the en permission bytes and the widget kinds are read from
   the committed app.json`. Nothing else in the file changes.

Green run: the three suites above pass; `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0; `yarn validate` passes.

Break script: `bash scripts/break-134.sh` from the lane worktree root (committed
in this folder). It applies seven mutations one at a time (branch condition
variants including the original defect, the android-skip both ways, the
disk-read reverted to the resolved config) and expects the named suites to
fail for each. It ends `ALL AS EXPECTED: 7`. A `BREAK NOT APPLIED` line is a
STOP.

Version and commit: the version is the next patch after `uat`'s `package.json`
(2.0.1005 after the planning commits 2.0.1003 and 2.0.1004). Before setting
it, hold `$HOME/athan-gitree/version.lock` (the mkdir lock, retrying in
`sleep 15` cycles; it is a lock, never a data source), run
`git fetch -q origin uat`, and require `node scripts/check-version-uniqueness.js`
to exit clean. Set it in `app.json` then `package.json`; the main tree's
gitignored `android/app/build.gradle` is synced by the lane after merge.
Commit message:

```
2.0.1005 - fix(config): the locale-config plugin rides every android resolution, defaults cover the stripped-widgets case
```

Files added by name: the five step files plus this plan folder's `PLAN.md`,
`LOG.md` and any plan file changed. Set the ticket in `ai/plans/README.md` to
`IN PROGRESS, step 1`.

Review checklist: the diff touches only the five files; the widgets-on plugin
order is unchanged (grid before expo-widgets); no comment states a falsehood
after the change; no test was weakened (assertions only added, one test
renamed per contract); the break script's seven mutants each killed.

Merge: the executor commits `fix/134-locale-plugin-every-android` in the
lane worktree and stops; the lane performs the merge (the worktree cannot
check out `uat`, the main tree holds it): under `$HOME/athan-gitree/uat.lock`,
in the main tree, `git fetch -q origin uat`, `node scripts/check-version-uniqueness.js`
clean, `git merge --no-ff fix/134-locale-plugin-every-android -m "2.0.1005 - merge fix/134: ticket 134 step 1, the locale plugin on every android resolution"`,
then sync the main tree's `android/app/build.gradle` `versionName` under
`build.lock`. A conflict on the queue or version files is lane weather
(abort, rebase, retry once); any other conflict is a STOP.

Done when: merged, checklist ticked, LOG.md appended with the commit sha, the
hook's `Tests:` line and the four coverage lines, and the break script's last
line.

### Step 2 - build-bay green proof at the merged fix (lane-run)

Requirements: R3.1 (R3.2 is already recorded by the planning red)
Weight: 3
Anchor check: none (no repo anchors change).

Goal: a widgets-off Android release build at the merged fix passes the full
lintVital gate.

Lane-run per D134.5: the executor does not run this step; the lane does, from
build-bay content, under `build.lock`, after step 1 merges. No phone is
touched; nothing is installed anywhere.

Procedure:

1. Scratch worktree `git worktree add --detach
   $HOME/athan-gitree/worktrees/plan-134 <merged-uat-sha>` from the main
   tree (planning removed the planning-era worktree of the same name; the
   recipe hardcodes this path); symlink `node_modules` to the main
   checkout's after verifying the `yarn.lock` hashes match.
2. The recipe is `$HOME/athan-gitree/sessions/134/red-green-134.sh green` (the
   same script the planning red used; it strips every widget flag from `.env`,
   sets the fleettest suffix, prebuilds `-p android --no-install --clean`, and
   runs `./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a`,
   logging to `$HOME/athan-gitree/sessions/134/logs/green-*.log`).
3. Expected, in order: the prebuild log's env export line names only
   `EXPO_PUBLIC_ANDROID_PACKAGE EXPO_PUBLIC_IOS_APP_ID`; `values/locales_defaults.xml`
   exists and holds 30 `<string>` entries; `values-b+ar/strings.xml` holds 30;
   the gradle log contains `> Task :app:lintVitalRelease` executed (no
   `SKIPPED`, no `FAILED`) and `BUILD SUCCESSFUL`; zero `ExtraTranslation`
   lines; `aapt2 dump badging` prints `package: name='com.mugtaba.athan.fleettest'`.
   Any difference: STOP, record, replan.
4. Remove the scratch worktree and its TMPDIR. Keep the logs and the script in
   `$HOME/athan-gitree/sessions/134/`. The APK is deleted after the badging
   read (nothing may be installed).

Done when: the green log pair carries every expected line, transcribed into
LOG.md.

## 7. Device proof

None. The owner is actively testing the FleetTest mock on the 3T and her XS
was restored; neither device is touched. The lint gate is proven by the build
alone (step 2). No `adb` command runs anywhere in this ticket.

## 8. Records

LOG.md heading `### Step 01 - the config branch and the plugin defaults`:
the red lines recorded verbatim, the green `Tests:` line, the four coverage
lines, the break script's `ALL AS EXPECTED: 7`, the commit sha, the merge sha.

Heading `### Step 02 - build-bay green proof`: the four expected lines from
step 2's expected list, the merged sha built from, the scratch worktree path
removed.

Queue cell text the lead applies on DONE:

```
DONE 2026-10-17, audited: the locale-config plugin rides every android-only
resolution regardless of the widgets flag, and its defaults cover all 30
translated keys when the resolution strips expo-widgets; a widgets-off
android release build at the fix passes :app:lintVitalRelease with no
exclusion (red at 80f707d5: 150 ExtraTranslation; green at the merge: task
executed, BUILD SUCCESSFUL, locales_defaults.xml 30 strings, fleettest
badging). The 131-era pass re-derived: that build re-added the widgets flag
after its own identical first failure, so no build had ever passed the gate
widgets-off; build-mock.zsh's .env keeps the flag at 1, which is why earlier
builds passed
```

Docs commit message: `<VERSION> - docs(plans): ticket <N> executed: <one line>`.

## 9. Push

None. The executor worker never pushes. The orchestrator pushes after review.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| Red tests pass before the change | STOP: the defect has moved; re-derive |
| Green build still fails lintVital | Record the failing keys; if they are widget keys, the plugin contract broke; if permission keys, the disk read broke; replan |
| `values/locales_defaults.xml` holds 14, not 30, in the green prebuild | The skip condition is inverted against the contract; replan |
| Prebuild env export line names a widgets variable | The `.env` strip failed; fix the script invocation, rerun; never edit `.env.example` |
| Merge conflict on the queue or version files | Lane weather: abort, rebase onto uat, keep both rows and the higher version, retry once, STOP if it still conflicts |
| A duplicate-resource aapt error in a widgets-on build after the change | The skip failed closed; the android kinds need their expo-widgets owner; STOP and replan |

Anticipated review fixes, word for word:

- "The renamed flags test still says `gated by the flag` in a comment" - the
  rename covers the title; no comment carries the old wording.
- "The docblock still claims android kinds are always skipped" - the contract
  replaces that sentence.
- "Mutation 4 is the original defect re-applied; keep it" - it stays: it pins
  the exact regression this ticket exists to fix.

Restore lists: step 1 touches five files; a stop mid-step restores them with
`git checkout -- <file>` each and deletes nothing (no new files). Step 2's
scratch worktree is removed with `git worktree remove --force` and its TMPDIR
deleted.

## 11. Subagents

Planning: `explore` for fact questions (none dispatched: the facts were
measured by the lane), `athan-plan-griller` for the grill. Delivery:
`athan-executor` for step 1, the lane itself for step 2 (D134.5),
`athan-reviewer` twice for the audit (plan-conformance and blind).

## 12. Report to the owner

Plain sentences: what changed (the branch condition and the plugin's default
derivation), what was proven (the red pair, the green gate), the re-derived
131-era contradiction resolution, and the decision table. Progress table and
the four-line handoff close it.

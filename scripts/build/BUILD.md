# Building a mock-serving Android release APK from any commit

For the OnePlus 3T (`DEVICE_SERIAL`, arm64-v8a, Android 9), which carries the owner's local production build at
versionCode 1000000, signed with the Android Debug certificate
(SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`).

```zsh
zsh ~/repos/rn.athan.uk/scripts/build/build-mock.zsh <commit-or-branch> <mocks-file> <out.apk>
# e.g.
zsh ~/repos/rn.athan.uk/scripts/build/build-mock.zsh 466b568 \
  ~/repos/rn.athan.uk/mocks/minutes.ts \
  ~/athan-build/mock-466b568.apk
```

It exits non-zero with `BUILD-MOCK FAILED: <reason>` on any failed step. On success it prints
`BUILD-MOCK OK` and a report (APK size, package, versionCode, versionName, signer, sha256, source commit,
mock sha256), and writes the same report to `<out.apk>.build.txt`. Logs go to `<out dir>/logs/<name>.*.log`.

## What makes it a mock build

- `stores/timetable.ts` lazily serves `mockMinutesSnapshot` from `mocks/minutes.ts` behind its
  build-class gate whenever `EXPO_PUBLIC_ENV` is neither
  `prod` nor `preview`, and `stores/database.ts` then opens
  `athan-storage-dev`. The owner's
  `athan-storage` is never read or written by such a build.
- The script sets `EXPO_PUBLIC_ENV=local` and the placeholder `EXPO_PUBLIC_API_KEY=key` in its own
  environment, first unsetting every `EXPO_PUBLIC_*` it inherited plus `EXPO_ANDROID_SUFFIX` and
  `EXPO_NAME_SUFFIX`. The real key never reaches the build, and the package stays `${ATHAN_BUNDLE_ID}`,
  so the APK replaces the installed app instead of installing beside it.
- It writes the worktree's `.env` from the committed `.env.example`, with ENV and API_KEY lines removed and
  `EXPO_PUBLIC_ENV=local`, `EXPO_PUBLIC_API_KEY=key` appended. Expo loads it for the non-secret catalog
  values: `EXPO_PUBLIC_IOS_APP_ID`, `EXPO_PUBLIC_ANDROID_PACKAGE`, `EXPO_PUBLIC_WIDGETS=0`.
- `app.config.ts` throws only for prod or preview without a real key, so it does not apply here.

## The recipe, step by step (what the script does)

1. **Resolve the ref** with `git -C $HOME/repos/rn.athan.uk rev-parse --verify <ref>^{commit}`.
   Local refs only; nothing is fetched. A branch name resolves to wherever it points now, so re-running on
   a feature branch picks up its new commits. Pass `origin/<branch>` only after fetching it yourself.
2. **Worktree** `~/athan-build/worktrees/mock-build`, outside the repo and outside `/tmp`.
   - First run: `git worktree add --detach <wt> <sha>`.
   - Later runs:
     1. Confirm it belongs to this repo.
     2. Restore its `mocks/minutes.ts`.
     3. Refuse if any other tracked file is modified.
     4. `git -C <wt> checkout --detach <sha>`.

   Detached HEAD means no branch is locked, so the main checkout can keep or switch to any branch. The
   main checkout's working tree, index and HEAD are never touched. The only write to the repo's `.git` is
   the worktree registration under `.git/worktrees/mock-build`. Override the path with `MOCK_WT=…`.
3. **node_modules**:
   - When the commit's `yarn.lock` is byte-identical to the main checkout's, `<wt>/node_modules` is a
     symlink to `$HOME/repos/rn.athan.uk/node_modules`. This is how session 2 built.
   - Otherwise the worktree gets its own `HUSKY=0 yarn install --frozen-lockfile`. `HUSKY=0` stops husky
     from rewriting the shared git config. A stamp file skips the install on the next run.
   - The symlink is an assumption: the main checkout's node_modules must match its own `yarn.lock`.
   - Side effect of the symlink: Gradle builds each native module inside `node_modules/<pkg>/android/build`
     of the main checkout. Those folders are git-ignored and are what any build from the main checkout
     already uses. So two Android builds must never run at once, and the script refuses to start while
     another `gradlew assemble…`, `export:embed` or `react-native-xcode` process is alive.
4. **Prebuild**: `CI=1 npx expo prebuild -p android --no-install` in the worktree.
   - `--clean` is added when `android/` is missing or any prebuild input changed since the last build:
     `app.json`, `app.config.ts`, `package.json`, `yarn.lock`, `plugins/`, `assets/`. These are compared
     by git object id.
   - `CI=1` makes Expo continue past the dirty-tree warning instead of prompting.
   - Prebuild writes `versionCode 1000000` and `versionName` from `app.json` into
     `android/app/build.gradle`. The script checks both, and checks `applicationId '${ATHAN_BUNDLE_ID}'`.
     If a commit's `app.json` predates versionCode 1000000, the script patches the generated
     `build.gradle` to 1000000 and says so. Otherwise the 3T refuses the APK with
     `INSTALL_FAILED_VERSION_DOWNGRADE`, as happened with the main checkout's stale `android/` (versionCode 1).
5. **The mock**: `cp <mocks-file> <wt>/mocks/minutes.ts`, compared byte for byte. The file must export
   `mockMinutesSnapshot`.
6. **Fresh outputs**:
   - Delete the previous `app-release.apk` and every `index.android.bundle*` under `android/app/build`, so
     Gradle cannot report the JS bundle up to date.
   - Point `TMPDIR` at `~/athan-build/worktrees/.tmp-mock-build`, emptied each run. Expo's Metro
     keeps its transform cache in `os.tmpdir()/metro-cache`, so no transform cached by a prod build on
     this Mac (with `prod` and the real key inlined) can be reused.
7. **Build**:
   `cd <wt>/android && TMPDIR=… ./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a`.
   - Output goes to a log file, never through a pipe, so the exit code is Gradle's own. The log must also
     contain `BUILD SUCCESSFUL`.
   - `--no-daemon` guarantees the bundling `node` process sees this build's environment, rather than that
     of a daemon started earlier with other variables (ai/AGENTS.md lesson).
   - arm64-v8a only halves the APK (about 78 MB against 142 MB) and suits the 3T. Use `MOCK_ARCHS=…` for
     other devices.
   - Release is signed with `signingConfigs.debug` (the template's `android/app/debug.keystore`), the
     same certificate as the owner's installed build, so `adb install -r` keeps the app's data.
8. **Restore** the worktree's `mocks/minutes.ts`, copy the APK to `<out.apk>`, then **verify the artefact**:
   - `aapt dump badging` (build-tools 37.0.0): package `${ATHAN_BUNDLE_ID}`, versionCode `1000000`,
     versionName equal to the commit's `app.json` version.
   - `apksigner verify --print-certs`: SHA-256 equals the owner's debug certificate.
   - `assets/index.android.bundle` is Hermes bytecode (magic `c61fbc03c103191f`) and contains every
     `'YYYY-MM-DD'` literal of the mock file. The mock rides every local build, so this proves the
     bundle is fresh and carries this mock. It does not prove the env.
   - The real API key from `~/.config/athan/.api_key`, never printed, does not occur in the bundle.
9. **The env is proven on the device**, not statically:
   - A fresh install launched with the clock on a mock day renders the mock's values.
   - Its data lives in `athan-storage-dev`: an `adb backup` shows `f/mmkv/athan-storage-dev`, not
     `athan-storage`.

## Installing it on the 3T

- `adb -s 3T_SERIAL install -r <apk>`, then `dumpsys package ${ATHAN_BUNDLE_ID} | grep -E "versionName|versionCode"`
  before trusting anything.
- The owner's production data in `athan-storage` survives an `install -r`, and so do their alarms. A mock
  build does not read either store, but an armed owner alarm can still fire when the clock moves.
  Session 3 therefore ran `pm clear ${ATHAN_BUNDLE_ID}` first, and the owner's state comes back from
  `state/owner-1.26.35-pre-session3.ab` at the end of the session.
- A clean install of a mock build starts with every alert Off (`stores/notifications.ts` defaults to
  `AlertType.Off`), so it arms nothing.

## Proven run

- `466b568` with `mocks-dashes.ts` produced `build/athan-uat2-466b568-mock-dashes.apk`.
- Fresh worktree with `--clean` prebuild: 235 s in total, of which Gradle took 3 min 49 s.
- APK: 82,100,668 bytes; `${ATHAN_BUNDLE_ID}`, versionCode 1000000, versionName 1.26.36.
- sha256 `2ce739b304ef3a09c0459d979d35cc3d4f493e7db6232143b3bba2318084e60b`.
- `adb install -r` succeeded. On a clean install with the clock on 25 Sep, it rendered the mock's values
  (see `control/SUMMARY.md`).

## Toolchain this was proven with (2026-09-13)

- JDK: Zulu 17.0.18. The script uses `JAVA_HOME` when set, else `java_home -v 17`. The default
  `java_home` is a Temurin 21 JRE with no compiler.
- Node 24.14.1 (fnm), yarn 1.22.22, Gradle 9.3.1 wrapper from the prebuild template.
- Android SDK `~/Library/Android/sdk`, build-tools 37.0.0.
- Expo SDK 57, React Native 0.86.3.

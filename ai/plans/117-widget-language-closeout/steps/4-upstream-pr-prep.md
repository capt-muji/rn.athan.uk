# Step 4: the upstream PR preparation, held

Requirements: R4.1, R4.2
Weight: 2

Anchor check: `scripts/anchors/a1-patch-cpp.md`, `scripts/anchors/a2-patch-swift.md` and
`scripts/anchors/a3-patch-kt.md` each count 1 in `patches/expo-widgets+58.0.20.patch`;
`scripts/anchors/a6-upstream-ledger.md` counts 1 in `ai/UPSTREAM-PRS.md`.

Goal: prepare the device-locale PR against upstream so her one word files it, and file
nothing.

Branch: `feat/widgets-device-locale` in the local expo clone
`$HOME/athan-gitree/upstream/expo`, based on the fetched `upstream/main`. No repository
branch (nothing lands in this repo except step 5's ledger text).

Lane-run: this step is run by the lane itself (D117.8: the clone sits outside the
executor's bound tree), recorded in `LOG.md`.

Files changed: only inside the clone, only the four device-locale files:

- `packages/expo-widgets/android/src/main/cpp/WidgetsHermesRuntime.cpp` (the `nativeRender`
  locale parameter, the `render` signature's defaulted `locale` argument, the guarded
  `__expoWidgetDeviceLocale` global set)
- `packages/expo-widgets/android/src/main/java/expo/modules/widgets/WidgetsJSRuntime.kt`
  (the `android.os.LocaleList` import, the
  `LocaleList.getDefault().get(0).language` argument)
- `packages/expo-widgets/android/src/main/java/expo/modules/widgets/jni/WidgetsHermesRuntime.kt`
  (the `render` and `nativeRender` signatures carrying `locale`)
- `packages/expo-widgets/ios/Widgets/WidgetsJSRuntime.swift` (the `context.setObject` of
  `Locale.current.language.languageCode?.identifier ?? "en"`)

Excluded on purpose: the `openApp` half (PR `expo/expo#51292` already carries it) and the
iOS `EntryView.swift` rtl hunk (row 135's mirroring site, its own record).

Red tests: None (no code in this repository changes; `shared/__tests__/widgetOpenAppPatch.test.ts`
keeps pinning the local patch and must stay green untouched).

Change contract, in order:

1. `cd $HOME/athan-gitree/upstream/expo && git fetch upstream main --quiet`. Record
   `git rev-parse upstream/main` as the base sha.
2. `git status --porcelain` must be empty. Create the branch:
   `git switch -c feat/widgets-device-locale upstream/main`.
3. Read the sibling pattern: `git show --stat feat/widgets-button-open-app` confirms the
   path translation from the patch's `node_modules/expo-widgets/...` to the clone's
   `packages/expo-widgets/...`.
4. Port the four files' hunks from `patches/expo-widgets+58.0.20.patch`. If `upstream/main`
   moved a signature, port onto the current signature by hand and record the delta; the
   plan's symptom table governs a deleted file.
5. One commit on the branch, message:
   `feat(expo-widgets): expose the device locale to widget JS runtimes`
   mirroring the sibling commits' shape. No `--no-verify`, no force.
6. Write `$HOME/athan-gitree/upstream/pr-descriptions/widgets-device-locale.md` with the
   sections What, Why, How, Testing, Anything else (the repo's PR shape,
   `ai/AGENTS.md`). Required content: What - the widget JS runtimes gain a
   `__expoWidgetDeviceLocale` global carrying the device locale on both platforms; Why -
   widget layouts that render static copy while the host app is not running have no
   locale source today (props carry the app's chosen locale; a widget can render before
   any app run after install or update); How - the Android render call threads the
   primary `LocaleList` language into the Hermes runtime, guarded so an empty locale sets
   nothing, and the iOS JS context sets the current locale at creation, every default
   preserving today's exact behaviour for code that reads nothing; Testing - exercised in
   a production widget surface on a physical Android 9 phone and an iOS device (no app
   name, no serial, no repository link), plus the local suite; Anything else - offered as
   one PR beside the open `openApp` PR on the same package, no config, no API change.
7. Anonymity check, run and recorded: `grep -inE "athan|the owner|the home-path username|rn\.athan|serial" <the
   description file>` prints nothing. If it prints anything, rewrite the offending line
   and rerun until silent.
8. Push nothing. File nothing. The clone's `origin` (the fork) and `upstream` both stay
   untouched beyond the fetch.

Green run: `git log --oneline upstream/main..feat/widgets-device-locale` prints exactly
one commit; `git diff --stat upstream/main..feat/widgets-device-locale` lists exactly the
four files; the description file passes the anonymity grep; both remotes' ref lists are
unchanged by the step (`git for-each-ref refs/remotes/origin refs/remotes/upstream`
captured after item 1's fetch into `sessions/117/step4-refs-before.txt` and again at the
end into `step4-refs-after.txt`, the two files identical - the fetch itself may move
`upstream/main`, which is why the baseline is captured after it).

Break script: None (the green-run ref comparison is the break check: any remote ref move
fails the step).

Version and commit: none in this repository.

Review: the lane rereads the four-file diff against the local patch's locale hunks line by
line and the description against the anonymity rule, and records both verdicts.

Merge: nothing to merge.

Done when: the checklist box 4 is ticked, the `LOG.md` entry under
`### Step 4 — upstream preparation held` records the base sha, the commit sha, the
description path and both verdicts, ending with a `session:` line.

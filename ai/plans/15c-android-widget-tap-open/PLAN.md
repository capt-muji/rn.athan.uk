# Plan: Session 15c. Tapping an Android widget opens the app

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/android-widget-tap-open.md` |
| Planned at | `31416a38` (version 1.27.344), 2026-09-24 |
| Planned by | Planning session on 2026-09-24 |
| Needs first | nothing |
| Steps | 4, each one branch, one commit, one version |
| Device | OnePlus 3T (`8f7ada76`) on a local production build, plus the `athan_test_avd` Android 15 emulator |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Tapping an Android widget does nothing today. Every other widget on an Android home screen opens its app when
tapped, and the app's own iOS widgets already do. The cause is in the library: `expo-widgets` 58.0.3 gives a widget
layout exactly one tap primitive, a `Button`, and that button's click sends a BROADCAST back to the widget's own
provider, which re-evaluates the layout's press handler and reloads the widget. No code path in the library ever
starts an activity, so a tap can reload the card but can never open the app. When this plan is DONE, tapping
anywhere on any of the eight Android widget kinds, in any state, opens Athan exactly as tapping its home-screen icon
does. The owner would notice by tapping the widget on the 3T's home screen: the app opens instead of nothing
happening.

The owner's rules that apply:

🐋  "Tapping any placed Android widget must open the app. Currently taps do nothing." (owner, 2026-09-19, recorded in
`ai/prompts/android-widget-tap-open.md`).

🐋  "make sure to genuinely actually test it, and don't just create PRs, only as a last resort... we have to test
them before and after, then we go into the actual tests... do a very, very clean approach that is consistent with the
code base. Don't write comments. And if you do, make sure they are very, very compact and they explain the why, very
simply, not the what, not the how, and make sure the right unit tests to cover it also. Because the maintainers of
the [library] definitely interrogates you, and code review your work heavily." (owner, 2026-09-24, deciding the
approach). This is why step 1 is a fifty-line patch of one file, with one comment, and why step 4 proves the tap on
two Android versions before anything is called done. No upstream PR is opened by this session.

🐋  "visuals are settled, so no pixel changes without the owner's approval" (`PLANNER-BRIEF.md` section 6). This
session adds a tap target and changes no pixel. Section 5 explains why wrapping the card in a `Button` does not draw
a button: the converter's own code takes the container path, not the `EmittableButton` path, whenever the children
are not text-only, and every Android card's first child is an image. The renderer tests in step 2 pin that every
geometry constant, colour and padding is byte-identical before and after.

🐋  "the geometry constants are owner-tuned: do not touch `A_ROW_HEIGHT`, `PILL_VPAD`, `FOOTER_BOTTOM_PAD`,
`HERO_WIDTH`, `LIST_WIDTH`" (`ai/prompts/android-widget-tap-open.md`, step 3). None of them is touched. `HERO_WIDTH`
and `LIST_WIDTH` became computed locals in session 15d and stay exactly as that session left them.

## 2. Decisions

### 2.1 Taken

1. **The tap rides a patched `expo-widgets`, not a provider subclass of our own.** Decided by the owner, 2026-09-24,
   choosing option A after the planning session measured both. The patch gives the library's existing `Button` an
   `openApp` prop that maps to Glance's own `actionStartActivity`, so the launcher starts the app directly. Rejected
   alternative: a config plugin writing a provider base class that starts the app when the tap broadcast arrives.
   That path depends on Android's background-activity-launch rules granting a broadcast receiver permission to start
   an activity, which is a platform rule this project cannot prove on the 3T (Android 9 predates it entirely).
   Recorded in `ai/prompts/README.md` under "Decided by the owner, 2026-09-24, while planning session 15c", and in
   section 5.
2. **A tap opens the app the way its launcher icon does.** Decided by the owner, 2026-09-24. Not a forced navigation
   to the main screen: the app resumes whatever it was last showing, or cold-starts to the main screen. This is what
   `getLaunchIntentForPackage` returns and what the iOS widgets already do.
3. **All eight kinds, the whole card, every state.** Decided by the owner, 2026-09-24. Both sizes, both themes, both
   schedules, and all three render states: the live card, the "Out of date" refresh card and the neutral placeholder.
   The entire card is the tap target, so there is nothing for the user to aim at.
4. **No upstream PR in this session.** Decided by the owner, 2026-09-24: "don't just create PRs, only as a last
   resort". The patch is proven on two Android versions here. Section 8 records the finding so a later session can
   raise it if the owner chooses.
5. **The patch is captured with `--include '^android/src/'`.** Decided by the planning session, from a measured
   failure: a bare `npx patch-package expo-widgets` produced a 193,000-line patch that swept in `android/build/`
   Gradle artifacts and `bundle/build/` Metro output, including a generated file holding the absolute path
   `/Users/muji/repos/rn.athan.uk/widgets/PrayerWidget`. Section 5 records the measurement. The include filter is
   part of the command, not a detail.
6. **The tap is proven on an Android 15 emulator as well as the 3T.** Decided by the planning session, from the
   fleet change: the Oppo Find X8 went back to its user on 2026-09-24, so the only physical Android phone is the 3T
   on Android 9, which predates every background-activity-launch rule. The `athan_test_avd` emulator (API 35) is the
   only way left to see the tap work on a modern Android. It is a measurement, not a substitute for the phone: both
   are required.
7. **The `openApp` prop is boolean and defaults false.** Decided by the planning session. A boolean cannot carry a
   wrong URL and needs no validation; defaulting false leaves every existing `Button` in the library behaving
   exactly as before, which is what makes the patch reviewable upstream.

### 2.2 The executor must not decide

The executor STOPs and asks the owner when any of these happens.

1. **Any anchor count other than 1.** Ask: "Anchor `<file>` counts `<n>`, not 1. The plan is stale. Should I set the
   row to NEEDS REPLAN?"
2. **A test fails that this plan does not expect.** Ask: "Test `<name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should it be?"
3. **A break prints `BREAK NOT APPLIED`.** Ask: "Break `<label>` changed nothing, so the substitution does not match
   the code. Should I stop for a replan?"
4. **A reviewer finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.** Ask with the finding in the reviewer's words.
5. **Anything the step does not answer.** Ask: "The plan does not say `<X>`. What should it be?"
6. **Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.** Ask before touching it.
7. **The 3T does not answer adb.** `adb -s 8f7ada76 get-state` does not print `device`. Ask: "The OnePlus 3T does
   not answer adb. Step 4's proof needs it. Should I wait, or stop here?"
8. **The tap does not open the app on either device after step 4's build.** Ask: "The widget tap did not open the
   app on `<device>`. The logcat line I expected was an ActivityManager START of
   `com.mugtaba.athan/.MainActivity` and I saw `<what I saw>`. Should I stop for a replan?"
9. **The card looks different after the change.** Any colour, size, spacing or padding that moved. Ask: "The widget
   card changed visually: `<what moved>`. Visuals are settled. Should I stop?"
10. **`patch-package` writes a patch larger than 200 lines, or naming any file outside
    `android/src/`.** Ask: "The captured patch is `<n>` lines and touches `<files>`. The plan expects one file and
    about fifty lines. Should I stop for a replan?"

## 3. Pre-flight

Save this to `$TMPDIR/preflight-15c.sh` and run `bash $TMPDIR/preflight-15c.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/usr/bin/env bash
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "FAIL: not $REPO"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "FAIL: on $BRANCH, expected uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -e 'ai/plans/README.md' \
  -e 'ai/plans/15c-android-widget-tap-open/PLAN.md' \
  -e 'ai/plans/15c-android-widget-tap-open/LOG.md')
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
echo "version: $VERSION (planned at 1.27.344, must not be lower)"

WIDGETS_VERSION=$(node -p "require('./node_modules/expo-widgets/package.json').version")
echo "expo-widgets: $WIDGETS_VERSION (the patch is named for this version)"
[ "$WIDGETS_VERSION" = "58.0.3" ] || { echo "FAIL: expo-widgets is $WIDGETS_VERSION, the patch targets 58.0.3"; exit 1; }

A=ai/plans/15c-android-widget-tap-open/scripts/anchors
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1.txt" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 -> NEEDS REPLAN"; exit 1; }
}
K=node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt
[ "$STEP" -le 1 ] && { count 1-4 "$K"; count 1-5 "$K"; count 1-6 "$K"; }
[ "$STEP" -le 2 ] && { count 1-1 widgets/PrayerWidget.tsx; count 1-2 widgets/PrayerWidget.tsx; count 1-3 widgets/PrayerWidget.tsx; }

STATE=$(adb -s 8f7ada76 get-state 2>&1 | tr -d '\r')
echo "device 8f7ada76: $STATE"
[ "$STATE" = "device" ] || { echo "FAIL: the 3T is not attached (section 2.2 item 7)"; exit 1; }

AVDS=$("$HOME/Library/Android/sdk/emulator/emulator" -list-avds | tr '\n' ' ')
echo "avds: $AVDS"
case "$AVDS" in *athan_test_avd*) ;; *) echo "FAIL: athan_test_avd is missing; step 4 needs it"; exit 1;; esac

echo "PREFLIGHT OK"
```

Expected tail: the version prints `1.27.344` or higher, `expo-widgets: 58.0.3`, each anchor prints `1`,
`device 8f7ada76: device`, an `avds:` line containing `athan_test_avd`, and the last line is `PREFLIGHT OK`. An
anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

Note on step 1's anchors: they locate places in `node_modules`, which is not version-controlled. They are still
anchors and still counted, because `expo-widgets` is pinned at 58.0.3 in `yarn.lock` and the pre-flight checks that
version first. If the pre-flight's version check passes but an anchor count is not 1, `node_modules` has been
modified outside a plan: STOP rather than replan, and say so.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `widgets/PrayerWidget.tsx` | The one `'widget'` layout backing all 8 home kinds. Its `ACard` helper builds the small composition and the neutral and stale cards; `androidRender`'s final return builds the medium. Both are the places a tap target must wrap. |
| `node_modules/expo-widgets/.../ExpoWidgetEmittableTree.kt` | The Glance converter. `toPeekButton` turns a JSX `Button` node into a Glance emittable and decides what its click does. This is the only file the patch touches. |
| `node_modules/expo-widgets/.../WidgetInteractionAction.kt` | The library's whole interaction model: `toGlanceAction` builds an `actionSendBroadcast` at the widget's own provider, and `WidgetsInteraction.handle` re-evaluates the layout's press handler and reloads the widget. Nothing here starts an activity. |
| `node_modules/expo-widgets/bundle/decorator.ts` | Assigns each `Button` node an auto-generated `target` id before the tree reaches the converter, so `props.target` is never null in practice. |
| `patches/expo-background-task+58.0.3.patch` | The repository's existing precedent for patching an Expo module's Android source. |
| `plugins/__tests__/replacePreviousNotification.test.ts` | The precedent for a test that reads upstream source and pins the seam a change rides on ("the upstream the plugin rides on"). Step 3's suite follows it. |
| `shared/__tests__/widgetRenderer.test.ts` | Renders the real layout against mocked component globals and asserts the Android composition. Step 2's tests join its `Android path (jetpack globals)` describe block. |

Anchors, each saved in full under `scripts/anchors/` and each counting exactly 1 at `31416a38`:

| Anchor | File | Line hint | What it locates |
| --- | --- | --- | --- |
| `1-1.txt` | `widgets/PrayerWidget.tsx` | 1 | The jetpack import line the `Button` name joins |
| `1-2.txt` | `widgets/PrayerWidget.tsx` | 258 | `ACard`, the small, neutral and stale composition |
| `1-3.txt` | `widgets/PrayerWidget.tsx` | 414 | The medium branch's return |
| `1-4.txt` | `.../ExpoWidgetEmittableTree.kt` | 65 | The converter's Glance action imports |
| `1-5.txt` | `.../ExpoWidgetEmittableTree.kt` | 293 | `toPeekButton`'s action selection |
| `1-6.txt` | `.../ExpoWidgetEmittableTree.kt` | 688 | The `WidgetButtonProps` record |

### How the pieces interact

A tap on an Android widget is handled entirely by the system, in the launcher's process, from a `PendingIntent` the
app baked into the `RemoteViews` when the widget was last rendered. The app is not running and is not consulted.

| Stage | Who does it | Today | After this plan |
| --- | --- | --- | --- |
| Render | The app's widget runtime, via `toPeekRoot` | Builds a Glance tree of Boxes, Columns, Rows, Texts and Images. None carries an action. | The root is a Glance Box carrying `clickable(actionStartActivity(<launch intent>))`. |
| Translate | Glance, inside the same render | Emits `RemoteViews` with no click handler | `ApplyAction` turns the action into a `PendingIntent.getActivity` and calls `setOnClickPendingIntent` on the root view |
| Tap | The launcher | Nothing is registered, so nothing happens | `RemoteViews.startPendingIntent` sends the intent, with `MODE_BACKGROUND_ACTIVITY_START_ALLOW_ALWAYS` (AOSP `RemoteViews.java`, `getLaunchOptions`) |
| Launch | The system | | `MainActivity` starts. `launchMode="singleTask"` means a running app resumes rather than restarting. |

Two consequences the executor will see, and neither is a fault:

- **The tap works with the app dead.** Nothing about it needs a JS runtime, which is why the proof in step 4 kills
  the app first.
- **The tap works after a reboot with the app never opened.** The `PendingIntent` lives in the `RemoteViews` the
  system holds, not in the app.

### Existing tests

| File | Test | What it proves |
| --- | --- | --- |
| `shared/__tests__/widgetRenderer.test.ts` | `bounds the active pill to the list column, not the card remainder` | The medium's list column geometry. Must keep passing unchanged: it is the geometry regression guard. |
| `shared/__tests__/widgetRenderer.test.ts` | `sizes the medium columns from the granted width`, `never lets the medium columns sum past the granted width`, and the other 15d tests | Session 15d's proportional sizing. All must keep passing unchanged. |
| `shared/__tests__/widgetRenderer.test.ts` | `renders the neutral card without props`, `centers the stale card and the neutral card horizontally` | The two non-live Android states, which this plan also wraps |
| `shared/__tests__/widgetContract.test.ts` | the whole suite | The layout stays serializable: no module-scope reference inside the widget body. A new component name must be an `@expo/ui` import or the suite fails. |
| `plugins/__tests__/replacePreviousNotification.test.ts` | `the upstream the plugin rides on` | The pattern step 3 copies |

At `31416a38`, `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit` reports
`Tests:       41 passed, 41 total`.

### Why the obvious simple fix is wrong

**Setting a `target` and handling the press in JS.** This is what the library offers and it cannot work. The press
handler runs in the widget's own JS runtime, inside a broadcast receiver, and its only outputs are new props and a
widget reload (`WidgetsInteraction.handle`). There is no bridge from there to the app's own JS, and no API to start
an activity. A tap would redraw the card and nothing else.

**A config plugin writing a provider base class that calls `startActivity`.** This avoids the patch, and the owner
rejected it. It puts an activity launch inside a broadcast receiver, which Android has restricted since API 29. The
AOSP trace says the launcher's own send carries `MODE_BACKGROUND_ACTIVITY_START_ALLOW_ALWAYS`
(`RemoteViews.getLaunchOptions`) and `PendingIntentRecord.sendInner` grants a broadcast sender's privileges onward,
so it would most likely work. "Most likely" is the problem: the only physical Android phone is now the 3T on
Android 9, which predates the whole rule, so the risk cannot be retired on hardware the owner keeps.

**Waiting for upstream.** `expo-widgets` 58.0.3 shipped 2026-09-16 and its changelog has no open work on Android
interactions. The widgets are already placed on the owner's home screen and inert.

## 5. Design

**The invariant, as one sentence a test can check:** every Android widget composition the layout can return is
wrapped in exactly one open-the-app tap target, and wrapping it changes no other node's geometry, colour or order.

### The chosen approach

Two changes, in two layers.

**The library layer (step 1).** `expo-widgets`' `Button` gains one optional boolean prop, `openApp`. When it is
true, the converter builds Glance's own `actionStartActivity` against the app's launch intent instead of the
broadcast action it builds today. Everything else about `Button` is untouched, and `openApp` defaults to false, so
every existing use of the component in every app behaves exactly as before. That is fifty lines in one file:

```
props record        + val openApp: Boolean = false
toPeekButton        + choose launchAppAction(context) when props.openApp, else today's broadcast action
new private helper  + launchAppAction(context) = actionStartActivity(packageManager launch intent), null when absent
imports             + androidx.glance.action.Action, androidx.glance.appwidget.action.actionStartActivity
```

**The app layer (step 2).** Every Android composition returns through one new local helper, `AOpenApp`, which wraps
its content in a `Button` carrying `openApp` and `fillMaxSize()`. There are exactly two places to change, because
every Android return already funnels through them: `ACard` (the small card, the neutral card and the stale card) and
the medium branch's own return.

**Why wrapping the card in a `Button` draws no button.** The converter's `toPeekButton` has two paths. It returns a
Glance `EmittableButton`, which draws Material chrome, only when `textContent != null && (children.isEmpty() ||
children.isTextOnlyContent())`. Otherwise it returns a plain `EmittableBox` with the action's `clickable` on it and
`contentAlignment = Center`. Every Android card's first child is the background `Image`, so `isTextOnlyContent()` is
false and the container path is the one taken, every time. The card keeps its own `fillMaxSize()` Box inside, which
already centres nothing and positions everything itself, so the wrapper's `Center` alignment has nothing to move:
its single child fills it. This is the whole visual argument, and step 2's tests pin it by asserting the wrapped
tree is otherwise identical.

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| A JS press handler on a `Button` with a `target` | The handler runs in the widget's own runtime inside a broadcast receiver; its only outputs are new props and a reload. It cannot reach the app or start an activity. |
| A config plugin writing a provider base class that starts the app | Owner rejected it, 2026-09-24. It launches an activity from a broadcast receiver, which Android has restricted since API 29, and the only physical Android phone is Android 9, which cannot test the rule. |
| `actionStartActivity<MainActivity>()` with the class named in the patch | A library cannot know an app's activity class. `getLaunchIntentForPackage` is the general form and is what a launcher icon resolves to. |
| Hard-coding the `athan://` deep link in the patch | Same objection, worse: it bakes one app's scheme into a general library, and a scheme can be unregistered while a launch intent cannot. |
| Waiting for upstream to add it | The changelog shows no work on Android interactions, and the widgets are inert on the owner's phone now. |
| Opening a specific screen rather than the app | Owner decided the launcher-icon behaviour, 2026-09-24 (decision 2). |

### The concurrency trace

| Caller | Before the change | After the change |
| --- | --- | --- |
| JS snapshot push (`stores/widget.ts`) | Pushes props per kind; the widget re-renders | Unchanged. The re-render rebuilds the same tree with the tap target, because the target is part of the layout, not of the props. |
| Native minute tick (`WidgetRefreshScheduler.updateAll`) | Broadcasts `ACTION_APPWIDGET_UPDATE`; the widget re-renders | Unchanged, and the re-render refreshes the `PendingIntent` with it. |
| A tap while the app is dead | Nothing registered, nothing happens | The system starts `MainActivity` from the `PendingIntent`. No JS runs first. |
| A tap while the app is already running | Nothing happens | `launchMode="singleTask"` resumes the existing task rather than starting a second one. |
| A tap on the stale or neutral card | Nothing happens | Opens the app, which is exactly what the stale card's own text ("Open Athan to refresh") tells the user to do. |
| A reinstall or reboot | The widget re-renders from stored props | Unchanged. The tap target is rebuilt with every render. |

### The design review

Reviewed by the planning session against the library source, the Glance 1.2.0 API surface (read out of the cached
AAR with `javap`), the AOSP `RemoteViews` and `PendingIntentRecord` sources, and a scratch worktree at
`~/athan-device-sweep/worktrees/plan-15c` (removed after the proof). What it found, and what changed as a result:

1. **A bare `npx patch-package expo-widgets` is unusable here.** It produced a 193,000-line patch. `expo-widgets`
   builds in place, so `android/build/` holds compiled classes, AARs and Gradle caches, and `bundle/build/` holds
   Metro output including `ExpoWidgetsLayoutRegistry.imports.js`, which contains the absolute path
   `/Users/muji/repos/rn.athan.uk/widgets/PrayerWidget`. Committing that would leak a machine path and break the
   patch on any other checkout. The capture command therefore carries `--include '^android/src/'`, which yields 50
   lines and one file. Decision 5, and step 1 gives the command with the filter.
2. **The first draft imported `android.content.Intent` and never used it.** Kotlin does not error on an unused
   import, so it compiled, but it would be the first thing an upstream reviewer struck. The import is gone; the
   contract in step 1 lists exactly four imports and no more.
3. **`openApp` must be checked before `target`, not after.** The bundle's `decorateInteractiveTargets` assigns every
   `Button` an auto-generated `target` before the tree reaches the converter, so `props.target` is effectively
   always set. An `openApp ?: target` order would work; a `target ?: openApp` order would never reach `openApp`.
   Step 1's contract fixes the order.
4. **A null launch intent must degrade, not throw.** `getLaunchIntentForPackage` returns null for a package with no
   launcher activity. `launchAppAction` returns `Action?`, and `toPeekButton`'s existing `action != null` guard then
   renders the card with no click, which is exactly today's behaviour. No new failure mode.

What the spike proved, and what it taught:

- The patched converter compiles: `./gradlew :expo-widgets:compileReleaseKotlin --no-daemon` printed
  `BUILD SUCCESSFUL in 17s`, twice, once with the draft and once with the final fifty-line form.
- The patch applies to a pristine `node_modules`: the converter was restored from a saved copy (`openApp` count 0),
  `npx patch-package` then printed `expo-background-task@58.0.3 ✔` and `expo-widgets@58.0.3 ✔`, and the count became
  2.
- The app-side wrap type-checks and renders: with the `Button` marker added to the renderer suite's jetpack globals
  and the seven new tests written, the suite reported `Tests:       48 passed, 48 total`, every one of session 15d's
  sizing tests among them, unchanged. Reverting the layout alone left `Tests:       5 failed, 43 passed, 48 total`.
- **The helper must answer `ReactElement`, not `ReactNode`.** The first draft answered `ReactNode` and `tsc` failed,
  but not where it was written: `createWidget` takes a layout returning `Element`, and `ReactNode` widens to include
  `undefined`, so all eight `createWidget` calls reported
  `error TS2345 ... Type 'undefined' is not assignable to type 'ReactElement<any, any>'`. With `ReactElement`,
  `npx tsc --noEmit` exits 0. Step 2's contract fixes the return type for this reason.
- **A type-only break proves nothing here, and the first draft's did exactly that.** Renaming the cast's
  `openApp?: boolean;` field applied cleanly and was NOT caught: Jest transforms with `@babel/preset-typescript`,
  which strips annotations without checking them. Every break in step 2 now substitutes runtime code, and all four
  were measured catching a different test.
- `widgetContract.test.ts` and `widgetLockRenderer.test.ts` reported `Tests: 26 passed, 26 total`, unchanged: the
  `Button` name is an `@expo/ui` import, so the closure rule accepts it.
- Biome rejects the hand-written indentation of a wrapped JSX return: `npx biome check` reported an error until
  `--write` reflowed it. Step 2 warns about this rather than dictating whitespace.
- The Android 15 emulator `athan_test_avd` boots and reports `ro.build.version.sdk` 35, so a modern-Android proof is
  available without the Find X8.
- **The tap works, on both Android versions, with the app dead.** The spike built the production APK from the
  patched tree (`BUILD-PROD OK`, 68,828,594 bytes, versionName 1.27.344, 327s) and installed it on both. On the
  OnePlus 3T: `pidof` empty, tap at the placed widget's centre, then
  `I/ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] dat=glance-action:/CALLBACK?appWidgetId=9... pkg=com.mugtaba.athan cmp=com.mugtaba.athan/.MainActivity} from uid 10191`,
  and `pidof` 19794. On the Android 15 emulator, after `am kill` plus `am kill-all` left `pidof` empty:
  `I/ActivityTaskManager: START u0 {...cmp=com.mugtaba.athan/.MainActivity} with LAUNCH_SINGLE_TASK from uid 10207 (realCallingUid=10176) (BAL_ALLOW_VISIBLE_WINDOW) result code=2`,
  and `pidof` 5402. `BAL_ALLOW_VISIBLE_WINDOW` is the system stating that the background-activity-launch check was
  evaluated and passed, which is the risk the owner's option B could not have retired. Step 4 reproduces this.
- A widget can be placed on the Android 15 emulator from the command line, which the plan first doubted:
  long-press the home screen (`input swipe x y x y 900`), tap Widgets, tap the Athan group, then
  `input draganddrop` from the preview onto the grid. A plain `input swipe` does NOT work for the drag; only
  `draganddrop` does. Step 4's device proof carries the working sequence.

The spike's code was deleted and does not become the plan.

## 6. Steps

- [ ] Step 1: The library's Button can open the app (specified)
- [ ] Step 2: Every Android card is an open-the-app tap target (specified)
- [ ] Step 3: The patch and the seam it rides on are pinned by tests (specified)
- [ ] Step 4: Device proof on the 3T and an Android 15 emulator (specified)

### Step 1: The library's Button can open the app

0. **Anchor check.** Run the section 3 count for `1-4`, `1-5` and `1-6`. Each must print `1`. Any other count means
   STOP, not NEEDS REPLAN: these anchors are in `node_modules`, so a mismatch means the tree was modified outside a
   plan (section 3's note).

1. **Goal:** `expo-widgets`' `Button` gains an `openApp` prop that makes its tap start the containing app, so an
   Android widget layout can be a tap target at all.

2. **Branch:** `git checkout -b feat/15c-widget-open-app-patch uat-2`

3. **Files:** `patches/expo-widgets+58.0.3.patch` (new). Nothing else, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`. The edit to
   `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt` is what the
   patch is captured FROM; `node_modules` is gitignored and is never added.

4. **Tests first (red).** None in this step, and that is deliberate rather than an omission. This step produces a
   Kotlin patch, and no Jest project compiles Kotlin. Step 3 writes the tests that guard it, against the patch file
   and the upstream source this step creates; step 4 proves the behaviour on two devices. A break script here would
   report `NOT CAUGHT` for every substitution regardless of correctness, which is false evidence.

   Before editing, confirm the tree is pristine:
   `grep -c openApp node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt`
   must print `0`. If it prints anything else, STOP (section 2.2, item 1).

5. **Change.** This step is `(specified)`: build it from the contracts below.

   Edit `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt`, then
   capture the patch. Four edits, and no others.

   **Edit 1, at anchor `1-4`:** add exactly two imports, each in the file's existing alphabetical position within
   the `androidx.glance` block: `androidx.glance.action.Action` immediately before the existing
   `androidx.glance.action.clickable`, and `androidx.glance.appwidget.action.actionStartActivity` immediately after
   it. Add no other import. An unused import compiles and is the first thing a reviewer strikes (section 5, design
   review item 2).

   **Edit 2, at anchor `1-5`:** in `toPeekButton`, replace the single `val action = ...` assignment with a binding
   of the application context followed by a conditional action. The contract:

   | Local | Answers | Must never |
   | --- | --- | --- |
   | `context` | `converterContext.applicationContext`, bound once because both branches and the helper need it | Be a non-application context: the action outlives the render |
   | `action` | `launchAppAction(context)` when `props.openApp` is true, otherwise today's expression, `props.target?.let { target -> WidgetInteraction(source, target).toGlanceAction(context) }` | Test `props.target` first: the bundle's decorator assigns every Button a generated `target`, so a `target`-first order would never reach `openApp` |

   The conditional carries exactly one comment, and it is this line verbatim:

   ```kotlin
   // A widget that cannot open its own app is the one interaction every launcher user expects.
   ```

   **Edit 3, immediately above `private fun WidgetButtonProps.buttonModifier(`:** add one private helper. The
   contract:

   | Item | Contract |
   | --- | --- |
   | Name | `launchAppAction` |
   | Signature | `private fun launchAppAction(context: Context): Action?` |
   | Answers | A Glance action that starts the containing app's launcher activity |
   | Returns null when | `context.packageManager.getLaunchIntentForPackage(context.packageName)` is null, which is a package with no launcher activity. `toPeekButton`'s existing `action != null` guard then renders the card unclickable, which is today's behaviour |
   | Must never | Name an activity class or a URL scheme: a library cannot know either, and the launch intent is what a launcher icon resolves to |
   | Logs | Nothing. This runs on every widget render |
   | Comments | None. The name and the two lines say it |

   **Edit 4, at anchor `1-6`:** add one field to the `WidgetButtonProps` record, in its existing alphabetical
   position, which is between `modifiers` and `target`:

   | Field | Type | What each value means |
   | --- | --- | --- |
   | `openApp` | `Boolean`, default `false` | `true`: the button's tap starts the containing app. `false`: the button's tap sends the library's interaction broadcast, which is today's behaviour and stays the default so no existing use changes. |

   **Then capture the patch**, from the repository root:

   ```
   npx patch-package expo-widgets --include '^android/src/'
   ```

   The `--include` filter is not optional. Without it the capture sweeps `android/build/` and `bundle/build/`,
   producing a patch of about 193,000 lines that embeds the absolute path
   `/Users/muji/repos/rn.athan.uk/widgets/PrayerWidget` (section 5, design review item 1).

   Check the result before going on:

   ```
   wc -l patches/expo-widgets+58.0.3.patch
   grep -c '^diff --git' patches/expo-widgets+58.0.3.patch
   grep -n 'muji' patches/expo-widgets+58.0.3.patch
   ```

   Expected: about 50 lines, exactly `1` diff header, and `grep -n muji` printing nothing and exiting 1. A line
   count above 200, or more than one diff header, or any `muji` match, is section 2.2 item 10: STOP.

   Then prove it applies from a clean tree:

   ```
   rm -rf node_modules/expo-widgets && yarn install --check-files
   grep -c openApp node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt
   ```

   `yarn install` is permitted here and only here, because this step's whole purpose is a `node_modules` patch and
   `EXECUTOR-BRIEF.md` section 2 allows a command the plan gives exactly. Its output ends with the postinstall
   running `patch-package`, which prints `expo-widgets@58.0.3 ✔`. The `grep -c` must then print `2`. If it prints
   `0`, the patch did not apply: STOP and quote `patch-package`'s output.

   The invariant this step keeps: `openApp` defaults to false, so every existing `Button` in the library behaves
   exactly as it does today.

6. **Green.** No Jest suite compiles Kotlin, so the compiler is the check:

   ```
   cd android && JAVA_HOME=$(/usr/libexec/java_home -v 17) ANDROID_HOME=$HOME/Library/Android/sdk ./gradlew :expo-widgets:compileReleaseKotlin --no-daemon
   ```

   Run it in the background with its log (`EXECUTOR-BRIEF.md` section 3). Expected: the log contains
   `BUILD SUCCESSFUL`. Warnings about `NativeArrayBuffer` being deprecated come from `expo-modules-core` and are
   present before this change; ignore them. Any line starting `e: ` is a compile error: STOP and quote it.

   Then, from the repository root, `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.
   Neither reads Kotlin; they confirm this step changed nothing they measure.

7. **Breaks.** None, deliberately. The break mechanism is a `perl` substitution followed by a Jest run, and no Jest
   project compiles this Kotlin. Step 3's break script is what guards this step: it breaks the patch file and the
   upstream seam, and step 3's tests catch it. A break script that cannot fail would be false evidence.

8. **Version and commit.** Run `node -p "require('./package.json').version"` on `uat-2` and take the next patch. Set
   it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`); all three must match.

   Add by name: `patches/expo-widgets+58.0.3.patch`, `app.json`, `package.json`, plus `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md` when this session changed them.

   Write to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`:

```
<VERSION> - feat(widgets): expo-widgets' Button can open the containing app

Tapping an Android widget did nothing, and no arrangement of the library's
own API could change that. expo-widgets 58.0.3 has one tap primitive, Button,
and its click sends a broadcast to the widget's own provider, which
re-evaluates the layout's press handler and reloads the widget. Nothing in
the library starts an activity, so a tap could redraw the card and never open
the app.

Button gains one optional boolean, openApp. When set, the converter builds
Glance's own actionStartActivity against the package's launch intent instead
of the interaction broadcast, so the launcher starts the app exactly as its
home-screen icon does. The prop defaults false, so every existing Button in
every app is unaffected.

The helper answers null when the package has no launcher activity, and the
converter's existing null guard then renders the card unclickable, which is
today's behaviour.

Captured with --include '^android/src/': expo-widgets builds in place, so a
bare capture sweeps android/build and bundle/build, including generated files
holding absolute machine paths.
```

   Commit with `git commit -F $TMPDIR/msg-1.txt` in the background. In the log, the last `Tests:` line ends
   `passed, <n> total`, and four `100%` coverage lines are present.

9. **Review.** `Code Reviewer` subagent, isolation `worktree` (section 11). Prompt, word for word, with `<sha>`
   filled in:

```
Run git checkout --detach <sha>.

Review this commit as an upstream maintainer of expo-widgets would review the same change as a pull request. It adds
patches/expo-widgets+58.0.3.patch, which patches one file:
node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt. Read the patch, and
read the patched file in node_modules to see the result in context.

The change gives the library's Button an optional boolean prop, openApp. When true, the converter builds Glance's
actionStartActivity against the package's launch intent rather than the library's interaction broadcast.

Check each of these and say whether it holds:
- the patch touches exactly one file, and that file is under android/src/;
- the patch contains no absolute path and no machine-specific string;
- exactly two imports were added, androidx.glance.action.Action and androidx.glance.appwidget.action.actionStartActivity, and both are used;
- openApp is Boolean, defaults false, and sits in the record's alphabetical position between modifiers and target;
- the action conditional tests props.openApp BEFORE props.target, and the else branch is byte-identical in behaviour to what the file did before;
- launchAppAction has the signature private fun launchAppAction(context: Context): Action?, returns null when getLaunchIntentForPackage returns null, names no activity class and no URL scheme, and logs nothing;
- the file carries exactly one added comment, and it explains why rather than what or how;
- nothing else in the file changed, and no behaviour changes for a Button that does not set openApp;
- the commit message describes the net change, the engineering reason and the significant decisions, without restating the diff.

Reply merge or fix first. If fix first, give each finding as a numbered item with the exact line it concerns.
```

   Every line holding is the "merge" verdict. A "fix first" verdict is handled by `EXECUTOR-BRIEF.md` section 4,
   item 8: a fix section 10 gives word for word, or a fix meeting all three of that item's conditions, is applied;
   anything else is a STOP.

10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/15c-widget-open-app-patch -m "Merge feat/15c-widget-open-app-patch into uat-2: expo-widgets' Button can open the containing app, reviewed"`

11. **Done when:**
    - `wc -l patches/expo-widgets+58.0.3.patch` prints about 50;
    - `grep -c '^diff --git' patches/expo-widgets+58.0.3.patch` prints `1`;
    - `grep -n muji patches/expo-widgets+58.0.3.patch` prints nothing;
    - `grep -c openApp node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt` prints `2`;
    - the Gradle log contains `BUILD SUCCESSFUL`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `git log --oneline -1 uat-2` shows the merge.

### Step 2: Every Android card is an open-the-app tap target

0. **Anchor check.** Run the section 3 count for `1-1`, `1-2` and `1-3`. Each must print `1`. Any other count means
   NEEDS REPLAN.

1. **Goal:** every composition the Android layout can return is wrapped in one open-the-app tap target, with no
   other change to the tree.

2. **Branch:** `git checkout -b feat/15c-android-card-tap uat-2`

3. **Files:** `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`. Nothing else, apart from
   `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** Suite: `shared/__tests__/widgetRenderer.test.ts` (existing).

   One existing fixture CHANGES, and it is not a test:

   | What | Change | Why |
   | --- | --- | --- |
   | The `JETPACK` globals object | Add `Button: android ? marker('Button') : undefined,` immediately after the `Box` entry | The suite mocks the jetpack globals the layout imports. Without a `Button` marker the layout calls `undefined` and every Android test throws. |

   These tests must NOT change, and must keep passing: every test in the `Android path (jetpack globals)` describe
   block, and every test in the `iOS path (swift-ui globals)` block. If any of them fails, the wrap moved something
   it must not: STOP.

   New tests, added to the `Android path (jetpack globals)` describe block:

   Every Android test in this suite renders with
   `renderTree(layouts.PrayerWidget(<props>, { colorScheme: 'light' }))`, after `freezeNow(<epoch>)` where the render
   instant matters. The iOS tests use the block's existing `renderHome(liveProps(), <family>)`. Follow the
   surrounding tests, and `__tests__/README.md`, which the executor reads before writing the first one.

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `opens the app from a tap anywhere on the small card` | The small composition is a tap target | `androidProps({})`, frozen at `at(DAY_ONE, '14:08')` | The returned tree's own `marker` is `Button` and its `props.openApp` is `true` |
   | `opens the app from a tap anywhere on the medium card` | The medium composition is a tap target, which is a separate return the small card's wrap does not cover | `androidProps({ size: 'medium', grantedWidthDp: 380 })`, frozen at `at(DAY_ONE, '14:08')` | The same two assertions as the row above |
   | `stretches the tap target over the whole card` | The target covers the card rather than shrinking to its content, so every part of the card is tappable | `androidProps({})`, frozen at `at(DAY_ONE, '14:08')` | The returned tree's `props.modifiers` equals `[{ modifier: 'fillMaxSize', value: undefined }]`, which is the shape this suite's `ANDROID_MODIFIERS` stub records for a zero-argument modifier |
   | `opens the app from a tap on the out-of-date card` | The stale state is a tap target, which is the state whose own text tells the user to open the app | `androidProps({})`, frozen at `androidProps({}).horizonEpochMs + 60_000`, the suite's existing way of reaching the stale state | The returned tree's `marker` is `Button`, `props.openApp` is `true`, and `textsOf(tree)` contains `Out of date` |
   | `opens the app from a tap on the placeholder card` | The no-props state is a tap target | `null` props | The returned tree's `marker` is `Button`, `props.openApp` is `true`, and `textsOf(tree)` contains `Prayer times for London` |
   | `wraps each Android card in exactly one tap target` | One target, not one per nested card: a nested `Button` would give Glance two competing click handlers on one view tree | Three renders in one loop: `androidProps({})`, `androidProps({ size: 'medium', grantedWidthDp: 380 })` and `null`, frozen at `at(DAY_ONE, '14:08')` | In each render, `collect(tree)` holds exactly one node whose marker is `Button` |
   | `leaves the iOS composition untouched by the Android tap target` | The wrap is Android-only: iOS opens its widget through WidgetKit, and a `Button` in the swift-ui tree would be a visible control | `renderHome(liveProps(), family)` for `systemSmall` and `systemMedium` | Neither tree holds any node whose marker is `Button` |

   The first six go in the `Android path (jetpack globals)` describe block, and the iOS one in the
   `iOS path (swift-ui globals)` block.

   Command: `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit`

   Expected BEFORE the change, measured by the planning session: `Tests:       5 failed, 43 passed, 48 total`.

   Exactly these five fail, and no others: `opens the app from a tap anywhere on the small card`,
   `opens the app from a tap anywhere on the medium card`, `opens the app from a tap on the out-of-date card`,
   `opens the app from a tap on the placeholder card`, and `wraps each Android card in exactly one tap target`.
   The first one's failure, verbatim:

   ```
   expect(received).toBe(expected) // Object.is equality

   Expected: "Button"
   Received: "Box"
   ```

   Two of the seven pass before the change, and both are meant to. They are regression guards for things the change
   must NOT do, so they are green on both sides:

   - `leaves the iOS composition untouched by the Android tap target`, because iOS never had a `Button`;
   - `stretches the tap target over the whole card`, because the unwrapped outermost `Box` already carries
     `fillMaxSize()`, so the assertion reads the same value from a different node. It earns its place at the break
     stage instead: it is the only test that fails when the wrapper is built without its modifier (part 7, break 4).

   If a test outside this set fails, or if any of the five passes before the change, STOP.

5. **Change.** This step is `(specified)`: build it from the contracts below.

   At anchor `1-1`, add `Button` to the jetpack import, in its alphabetical position:
   `import { Box, Button, Column, Row } from '@expo/ui/jetpack-compose';`. The name must be an `@expo/ui` import and
   nothing else, or `widgetContract.test.ts`'s closure rule rejects it as a module-scope reference.

   Add one local helper inside the widget body, immediately above `ACard` at anchor `1-2`. The contract:

   | Item | Contract |
   | --- | --- |
   | Name | `AOpenApp` |
   | Signature | `(content: ReactNode) => ReactElement` |
   | Answers | Its argument, wrapped in one `Button` carrying `openApp` and a single `fillMaxSize()` modifier |
   | Must never | Add padding, alignment, colour or a label: the wrapper is a tap target and nothing else |
   | Must never | Be applied twice to one composition: the medium's return must not also go through `ACard` |
   | Must never | Answer `ReactNode`: `createWidget` takes a layout returning `Element`, and `ReactNode` widens to include `undefined`, which fails `tsc` at the eight `createWidget` calls, not at the helper. The planning session measured this: `error TS2345 ... Type 'undefined' is not assignable to type 'ReactElement'` |
   | Logs | Nothing |

   `ReactElement` is a type-only import, so add it to the existing one:
   `import type { ReactElement, ReactNode } from 'react';`.

   The `Button` component's app-side type comes from `@expo/ui`'s jetpack typings, which do not carry `openApp`,
   because that prop is the step 1 patch's. The prop therefore rides a local cast, the same pattern
   `ATextEl`, `AImageEl` and `ATimeEl` already use a few lines above, and for the same reason. The cast's shape:

   ```tsx
   const AButtonEl = Button as unknown as (elementProps: {
     openApp?: boolean;
     modifiers?: ModifierConfig[];
     children?: ReactNode;
   }) => ReactElement;
   ```

   Declare the cast where the existing casts are declared, so all four sit together, or inside `AOpenApp`; either is
   the executor's choice, because both serialize with the body and neither is observable. Nothing else about the
   choice matters.

   Route both Android returns through the helper, and only these two:

   | Place | Anchor | Change |
   | --- | --- | --- |
   | `ACard` | `1-2` | Its returned `Box` becomes the argument of `AOpenApp`. This one change covers the small card, the neutral card and the stale card, because all three return through `ACard`. |
   | The medium branch's return | `1-3` | Its returned `Box` becomes the argument of `AOpenApp`. |

   Nothing else in the file changes. In particular `A_ROW_HEIGHT`, `PILL_VPAD`, `FOOTER_BOTTOM_PAD`,
   `ROW_TEXT_SIZE`, `ROW_CORNER_RADIUS`, `CARD_PAD_START`, `CARD_PAD_END`, every `REFERENCE_*` constant, the
   computed `HERO_WIDTH` and `LIST_WIDTH`, `ARowLine`, and the entire iOS branch are untouched. The owner's brief
   names the first five of those directly.

   No comment is added. The helper's name says what it does, and why a card is tappable needs no explanation.

   Biome reflows a wrapped JSX return and rejects hand-written indentation for it. Run
   `npx biome check --write widgets/PrayerWidget.tsx` after the edit and let it choose the whitespace; that is a
   formatting decision, not a behaviour one.

   The invariant this step keeps: every Android composition is wrapped in exactly one open-the-app tap target, and
   wrapping it changes no other node's geometry, colour or order.

6. **Green.** The same command. Expected: `Tests:       48 passed, 48 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

   Also run `npx jest shared/__tests__/widgetContract.test.ts --watchman=false --selectProjects=unit`, which must
   pass unchanged: it is what proves the new `Button` reference is legal inside the serialized body.

7. **Breaks.** Save to `$TMPDIR/breaks-15c-2.sh` and run `bash $TMPDIR/breaks-15c-2.sh` from the repository root.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=widgets/PrayerWidget.tsx
SUITE=shared/__tests__/widgetRenderer.test.ts
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" search="$2" replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s/\Q$search\E/$replace/" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "NOT CAUGHT: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

run_break "the tap target never asks to open the app" \
  "<AButtonEl openApp modifiers=" \
  "<AButtonEl modifiers="

run_break "the tap target does not cover the card" \
  "const AOpenApp = (content: ReactNode)" \
  "const AOpenApp = (content: ReactNode): ReactElement => content as ReactElement; const AOpenAppUnused = (content: ReactNode)"

run_break "the medium card is left untapped" \
  "return AOpenApp(" \
  "return ("

run_break "the tap target does not fill the card" \
  "<AButtonEl openApp modifiers={[fillMaxSize()]}>" \
  "<AButtonEl openApp>"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Every break's search text is text this plan fixes in part 5: the wrapper's JSX opening tag, the helper's
   signature, and the medium branch's return. Expected output, in this order: `caught: the tap target never asks to
   open the app`, `caught: the tap target does not cover the card`, `caught: the medium card is left untapped`,
   `caught: the tap target does not fill the card`, then `caught 4 of 4`, then `ALL AS EXPECTED: 1`. Each is caught
   by a different test, which is why there are four: break 1 by the four `opens the app...` tests, break 2 by those
   four plus `wraps each Android card in exactly one tap target`, break 3 by
   `opens the app from a tap anywhere on the medium card` alone, and break 4 by
   `stretches the tap target over the whole card` alone.

   **Every break substitutes RUNTIME code, never a type.** The planning session measured the alternative and it is a
   trap: renaming the cast's `openApp?: boolean;` field applies cleanly, changes the file, and is NOT caught, because
   Babel erases the type annotation before Jest ever sees it. `jest.config.js` transforms with
   `@babel/preset-typescript`, which strips types without checking them, so a type-only break tests nothing. A break
   on this suite must change a value the renderer can observe.

   A `BREAK NOT APPLIED` line means STOP (section 2.2, item 3). Afterwards `git status --porcelain` must list no
   `.bak` file.

8. **Version and commit.** Next patch after `uat-2`'s `package.json`, set in all three places. Add by name:
   `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`, `app.json`, `package.json`, plus the three
   plan files when changed. Message to `$TMPDIR/msg-2.txt`:

```
<VERSION> - feat(widgets): tapping an Android card opens the app

Every Android composition now returns through one wrapper that carries the
openApp tap target added to expo-widgets' Button in the previous commit. Two
places cover all eight kinds and all three states: ACard backs the small,
neutral and out-of-date cards, and the medium branch has its own return.

The card looks the same. The converter renders a Button as Material chrome
only when its children are text-only; every Android card's first child is the
background image, so the container path is taken and the wrapper is a plain
box with a click handler.

The out-of-date card gains the most: its own text tells the user to open
Athan to refresh, and now the tap does it.
```

9. **Review.** `Code Reviewer` subagent, isolation `worktree` (section 11). Prompt, word for word, with `<sha>`
   filled in:

```
Run git checkout --detach <sha>.

Review this commit. It wraps every Android composition of the widget layout in widgets/PrayerWidget.tsx in one tap
target, so tapping the widget opens the app. The tap target is an @expo/ui jetpack Button carrying an openApp prop,
which the previous commit added to expo-widgets through patches/expo-widgets+58.0.3.patch.

Check each of these and say whether it holds:
- exactly one helper was added, named AOpenApp, taking a ReactNode and returning a ReactNode;
- AOpenApp adds only the Button with openApp and one fillMaxSize modifier: no padding, alignment, colour or label;
- exactly two returns route through it, the one in ACard and the one in the medium branch, and no composition goes through both;
- Button is imported from @expo/ui/jetpack-compose, so the serialized widget body may reference it;
- no geometry constant changed: A_ROW_HEIGHT, PILL_VPAD, FOOTER_BOTTOM_PAD, ROW_TEXT_SIZE, ROW_CORNER_RADIUS, CARD_PAD_START, CARD_PAD_END, every REFERENCE_ constant, and the computed HERO_WIDTH and LIST_WIDTH;
- no colour, font size, font weight, padding or alignment value changed anywhere in the file;
- the iOS branch is untouched;
- the six new tests in shared/__tests__/widgetRenderer.test.ts each assert what their name says, and the iOS one guards against a Button appearing in the swift-ui tree;
- every pre-existing test in that suite is unchanged apart from the JETPACK globals gaining a Button marker;
- comments: the commit adds none to the layout, and any it does add explains why rather than what.

Reply merge or fix first. If fix first, give each finding as a numbered item with the exact line it concerns.
```

   Every line holding is the "merge" verdict. A "fix first" verdict is handled by `EXECUTOR-BRIEF.md` section 4,
   item 8.

10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/15c-android-card-tap -m "Merge feat/15c-android-card-tap into uat-2: tapping an Android card opens the app, reviewed"`

11. **Done when:**
    - `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       48 passed, 48 total`;
    - `npx jest shared/__tests__/widgetContract.test.ts --watchman=false --selectProjects=unit` passes unchanged;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `bash $TMPDIR/breaks-15c-2.sh` ends `ALL AS EXPECTED: 1`;
    - `git log --oneline -1 uat-2` shows the merge.

### Step 3: The patch and the seam it rides on are pinned by tests

0. **Anchor check.** None: this step reads files rather than locating places in them.

1. **Goal:** the suite fails if the patch is lost, if it stops applying, or if a dependency bump moves the upstream
   code the patch rides on, so a silent regression is impossible.

2. **Branch:** `git checkout -b test/15c-patch-guard uat-2`

3. **Files:** `shared/__tests__/widgetOpenAppPatch.test.ts` (new). Nothing else, apart from `ai/plans/README.md` and
   this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** This step is only tests, so red is measured by breaking what they guard rather than by the
   absence of the change. Write the suite, run it, then run part 7's break script, which is what proves each test
   guards something.

   Suite: `shared/__tests__/widgetOpenAppPatch.test.ts` (new). It is a `.test.ts`, so it runs in the `unit`
   project. It follows the pattern of `plugins/__tests__/replacePreviousNotification.test.ts`'s
   `the upstream the plugin rides on` describe block: read the real files, assert the seam.

   Its doc comment, verbatim, as the first thing in the file:

   ```ts
   /**
    * The patch that lets an Android widget tap open the app
    * (patches/expo-widgets+58.0.3.patch)
    *
    * The widget layout wraps every Android card in a Button carrying `openApp`,
    * a prop the patch adds to expo-widgets. Nothing else in the repository
    * fails if the patch stops applying: the widget would simply go inert
    * again. These tests are what notice.
    */
   ```

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `names the installed expo-widgets version` | The patch is for the version actually installed; `patch-package` silently skips a patch whose version does not match | `node_modules/expo-widgets/package.json`'s `version`, and the patch file's own name | The patch file at `patches/expo-widgets+<version>.patch` exists, with `<version>` read from the installed package rather than written out |
   | `applies to the installed converter` | The patch is not merely present but actually applied to the tree this build compiles | The converter source at `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt` | It contains `val openApp: Boolean = false,` and `actionStartActivity(intent)` |
   | `patches one file, under android/src` | The capture filter held, so no build artifact or machine path was swept in | The patch file's text | It contains exactly one line starting `diff --git`, that line names a path under `node_modules/expo-widgets/android/src/`, and the whole file contains no occurrence of `/Users/` |
   | `keeps the library's own interaction path for a button that does not open the app` | The patch is additive: a `Button` without `openApp` still gets the broadcast action, which is what makes it safe upstream | The converter source | It still contains `WidgetInteraction(source, target).toGlanceAction(context)` |
   | `rides a Glance API that still exists` | A Glance upgrade that removed or renamed the function would break the patch at compile time only, which no Jest run would catch | The converter source | It imports `androidx.glance.appwidget.action.actionStartActivity` |
   | `keeps every Android card wrapped in the tap target` | The layout still SETS the prop the patch provides, so the two halves cannot drift apart | `widgets/PrayerWidget.tsx` | It contains `<AButtonEl openApp modifiers={[fillMaxSize()]}>`, the wrapper step 2 builds, and imports `Button` from `@expo/ui/jetpack-compose`. Assert the whole opening tag, not the bare word `openApp`: the cast's `openApp?: boolean;` field also contains that word, so a layout that declared the prop and stopped passing it would still pass a substring check |

   Read each file with `readFileSync(path, 'utf8')` and paths built with `join(__dirname, '..', '..')` as the root,
   exactly as `replacePreviousNotification.test.ts` does.

   Command: `npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit`

   Expected after writing them: `Tests:       6 passed, 6 total`.

5. **Change.** None beyond the suite itself. This step adds no source.

6. **Green.** The command above prints `Tests:       6 passed, 6 total`. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exit 0.

7. **Breaks.** Save to `$TMPDIR/breaks-15c-3.sh` and run `bash $TMPDIR/breaks-15c-3.sh` from the repository root.
   This script breaks the PATCH FILE and the layout, not a source file the app compiles, because that is what these
   tests guard.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
SUITE=shared/__tests__/widgetOpenAppPatch.test.ts
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" file="$2" search="$3" replace="$4"
  TOTAL=$((TOTAL + 1))
  cp "$file" "$file.bak"
  perl -0pi -e "s/\Q$search\E/$replace/" "$file"
  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.bak" "$file"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "NOT CAUGHT: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$file.bak" "$file"
}

CONVERTER=node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt

run_break "the patch stops applying to the converter" \
  "$CONVERTER" \
  "val openApp: Boolean = false," \
  "val openAppGone: Boolean = false,"

run_break "the patch drops the Glance import it rides on" \
  "$CONVERTER" \
  "import androidx.glance.appwidget.action.actionStartActivity" \
  "import androidx.glance.appwidget.action.actionStartActivityGone"

run_break "the patch stops building the launch action" \
  "$CONVERTER" \
  "actionStartActivity(intent)" \
  "actionStartActivityGone(intent)"

run_break "the patch swallows the library's own interaction path" \
  "$CONVERTER" \
  "WidgetInteraction(source, target).toGlanceAction(context)" \
  "null"

run_break "the patch sweeps in a machine path" \
  patches/expo-widgets+58.0.3.patch \
  "+  val openApp: Boolean = false," \
  "+  val openApp: Boolean = false, \/\/ \/Users\/somebody\/repo"

run_break "the layout stops using the tap target" \
  widgets/PrayerWidget.tsx \
  "<AButtonEl openApp modifiers=" \
  "<AButtonEl modifiers="

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
```

   Every break's search text is text this plan fixes: a field the step 1 contract names, an import the step 1
   contract names, the helper's call the step 1 contract names, the expression step 1 preserves verbatim, a patch
   line, and the wrapper's opening tag step 2 gives. Expected: six `caught:` lines in that order, then
   `caught 6 of 6`, then `ALL AS EXPECTED: 1`.

   The last break substitutes the wrapper's opening tag, not the cast's `openApp?: boolean;` field. The planning
   session measured the field version and it is NOT caught twice over: `openAppGone` still contains the substring
   `openApp`, and the JSX attribute that actually sets the prop is left untouched. That is why the test asserts the
   whole opening tag.

   A `BREAK NOT APPLIED` line means STOP (section 2.2, item 3).

   Afterwards, run
   `grep -c openApp node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt`,
   which must print `2`: the script restores every file it touched, and this confirms `node_modules` came back
   intact. `git status --porcelain` must list no `.bak` file.

8. **Version and commit.** Next patch, all three places. Add by name:
   `shared/__tests__/widgetOpenAppPatch.test.ts`, `app.json`, `package.json`, plus the three plan files when
   changed. Message to `$TMPDIR/msg-3.txt`:

```
<VERSION> - test(widgets): pin the open-the-app patch and the seam it rides on

A patch is the one kind of change nothing else in a repository notices. If
patches/expo-widgets+58.0.3.patch stopped applying, or a dependency bump moved
the Glance API it calls, the Android widgets would go inert again and every
suite would still be green.

Six tests read the real files: the patch is named for the installed version,
it is applied to the converter this build compiles, it touches one file under
android/src with no machine path in it, it leaves the library's own
interaction path intact for buttons that do not opt in, the Glance function it
calls is still imported, and the layout still uses the prop.

The pattern is the one plugins/__tests__/replacePreviousNotification.test.ts
already uses for its own upstream seam.
```

9. **Review.** `Code Reviewer` subagent, isolation `worktree` (section 11). Prompt, word for word, with `<sha>`
   filled in:

```
Run git checkout --detach <sha>.

Review this commit. It adds shared/__tests__/widgetOpenAppPatch.test.ts, six tests that guard
patches/expo-widgets+58.0.3.patch, which gives expo-widgets' Button an openApp prop so an Android widget tap opens
the app.

Check each of these and say whether it holds:
- each test asserts what its name says, and no test asserts something another already covers;
- the version test reads the installed expo-widgets version from its package.json rather than writing 58.0.3 out, so a dependency bump fails the test rather than passing silently;
- the tests read the real files on disk, and mock nothing;
- the suite would fail if the patch file were deleted, if the patch stopped applying to node_modules, or if the layout stopped setting openApp;
- the machine-path test would catch an absolute path anywhere in the patch, not only on one line;
- the doc comment says why the suite exists, in one short paragraph;
- the suite follows the pattern of plugins/__tests__/replacePreviousNotification.test.ts's "the upstream the plugin rides on" block;
- nothing outside this one new file changed, apart from app.json, package.json and the plan folder.

Reply merge or fix first. If fix first, give each finding as a numbered item with the exact line it concerns.
```

10. **Merge.** `git checkout uat-2 && git merge --no-ff test/15c-patch-guard -m "Merge test/15c-patch-guard into uat-2: the open-the-app patch is pinned by tests, reviewed"`

11. **Done when:**
    - `npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       6 passed, 6 total`;
    - `bash $TMPDIR/breaks-15c-3.sh` ends `ALL AS EXPECTED: 1`;
    - `grep -c openApp node_modules/.../ExpoWidgetEmittableTree.kt` prints `2` after the break script;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `git log --oneline -1 uat-2` shows the merge.

### Step 4: Device proof on the 3T and an Android 15 emulator

0. **Anchor check.** None: this step changes no source file.

1. **Goal:** prove on real Android that tapping a placed widget opens the app, on the oldest Android the project
   supports and on a modern one, with the app dead beforehand.

2. **Branch:** `git checkout -b proof/15c-device uat-2`

3. **Files:** `ai/features/android-widgets-x8/FINDINGS.md` only, plus `ai/plans/README.md` and this folder's
   `PLAN.md` and `LOG.md`.

4. **Tests first (red).** None: this step runs no suite. Its evidence is the device readings in section 7.

5. **Change.** This step is `(specified)`. No source changes. Run section 7's device proof, then append its readings
   to `ai/features/android-widgets-x8/FINDINGS.md` using section 8's findings text.

6. **Green.** No suite. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0, unchanged.

7. **Breaks.** None: no code changes in this step.

8. **Version and commit.** Next patch, all three places. Add by name:
   `ai/features/android-widgets-x8/FINDINGS.md`, `app.json`, `package.json`, plus the three plan files. Message to
   `$TMPDIR/msg-4.txt`:

```
<VERSION> - docs(widgets): the Android widget tap, proven on two Android versions

Readings from the OnePlus 3T on Android 9 and the athan_test_avd emulator on
Android 15. Both had the app killed before the tap, so nothing of ours was
running: the system starts the activity from the PendingIntent the last render
left in the RemoteViews.

Android 15 is the reading that matters most. The 3T predates every
background-activity-launch restriction, so it could never have shown whether
the tap survives them; the emulator is the only modern Android left on the
bench since the Find X8 went back to its user.
```

9. **Review.** `Code Reviewer` subagent, isolation `worktree` (section 11). Prompt, word for word, with `<sha>`
   filled in:

```
Run git checkout --detach <sha>.

Review this docs commit. It appends device readings to ai/features/android-widgets-x8/FINDINGS.md for session 15c,
which made tapping an Android widget open the app.

Check each of these and say whether it holds:
- every number and every quoted logcat line in the new text is presented as something measured, not inferred;
- no claim goes beyond what a logcat ActivityManager START line and a process check can show;
- the text says plainly that the Android 15 reading came from an emulator, not a phone;
- the text does not claim the Find X8 was tested;
- nothing but that file, app.json, package.json and the plan folder changed.

Reply merge or fix first. If fix first, give each finding as a numbered item.
```

10. **Merge.** `git checkout uat-2 && git merge --no-ff proof/15c-device -m "Merge proof/15c-device into uat-2: the Android widget tap proven on Android 9 and Android 15, reviewed"`

11. **Done when:** section 7's checks all read as its table predicts, the findings text is appended, and
    `git log --oneline -1 uat-2` shows the merge.

## 7. Device proof

| Device | Serial | Android | Why it is here |
| --- | --- | --- | --- |
| OnePlus 3T | `8f7ada76` | 9 (API 28) | The owner's phone, with the widgets already placed, and the oldest Android the app supports |
| `athan_test_avd` | `emulator-5554` | 15 (API 35) | The only modern Android on the bench. The Find X8 went back to its user on 2026-09-24. |

**The fleet changed on 2026-09-24.** The Oppo Find X8 (`G6RWBAQ4VKWWEAIZ`) has been returned to its user and
disconnected. It is named in session 15d's plan and findings as a device on the bench; it is not one any more, and
no step here or in any later plan may depend on it. The two physical devices from now on are the OnePlus 3T
(`8f7ada76`) and the iPhone XS (`00008020-0015585C22D2002E`).

### Safety: the alarm dump before anything else

This session changes NO clock, and needs none: a widget tap is instantaneous and depends on no prayer time
arriving. Read the alarms first anyway, so the executor knows what is armed:

```
adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}"
```

Expected: the app's notification alarms, the widget refresh chain's next minute-edge alarm, and one app alarm at
`when 2104803640505` (year 2036, not identified), which every 3T dump shows. If an alarm appears that this list does
not name, STOP and ask.

**No clock change in this session.** If any step seems to need one, that is a defect in this plan: STOP and ask.

### The build

Bump the version FIRST, then prebuild, then build: `expo run:*` never re-syncs an existing native directory, and
violating that order once shipped code stamped with the wrong version (`ai/AGENTS.md`).

Build the PRODUCTION package. Run it in the background with its log:

```
zsh ~/athan-device-sweep/session15/bin/build-prod-widgets.zsh uat-2 ~/athan-device-sweep/session15c/athan-15c-prod.apk
```

Success ends `BUILD-PROD OK`, after about four minutes. That script sets `EXPO_PUBLIC_ANDROID_WIDGETS=1` itself;
without the flag the APK ships with no widget providers at all. If the script prints `FAILED`, STOP and quote the
line.

**It must be the production package.** A mock build installs under `com.mugtaba.athan.fleettest`, and every widget
the owner has PLACED belongs to `com.mugtaba.athan`. An unplaced provider is never rendered by the launcher, so
there is no card to tap and the proof cannot run. This was learned the expensive way in session 15d.

Install on the 3T with `adb -s 8f7ada76 install -r ~/athan-device-sweep/session15c/athan-15c-prod.apk`, which keeps
the app's data and the existing widget placements.

For the emulator, start it and install the same APK:

```
~/Library/Android/sdk/emulator/emulator -avd athan_test_avd -no-snapshot-load -no-audio
```

Start that in the background; it returns nothing and runs until killed. Then wait for it with a background loop of
`sleep 15` or shorter that checks `adb -s emulator-5554 shell getprop sys.boot_completed` on every pass and stops
when it prints `1`. Booting takes two to four minutes. Then
`adb -s emulator-5554 install -r ~/athan-device-sweep/session15c/athan-15c-prod.apk`.

The emulator has no widget placed, because it is a fresh image. This sequence places one, and the planning session
ran it: each step reads the screen with `uiautomator dump` first, because the coordinates below are what that
emulator showed and a different image may differ.

```
adb -s emulator-5554 shell input keyevent KEYCODE_HOME
adb -s emulator-5554 shell input swipe 540 1600 540 1600 900   # long-press the home screen
adb -s emulator-5554 shell input tap 755 1303                  # "Widgets"
adb -s emulator-5554 shell input tap 570 884                   # the "Athan" group
adb -s emulator-5554 shell input draganddrop 781 2100 540 900 2000
```

Find each target's real coordinates by dumping the screen between steps and reading the bounds: the Widgets entry by
its `text="Widgets"`, the app group by its `text="Athan"`, and the widget preview by its
`content-desc="Next Prayer (Light) widget..."`. Tap the centre of the bounds.

**The last command must be `draganddrop`, not `swipe`.** The planning session measured both: `input swipe` between
the same two points leaves nothing placed, and `input draganddrop` places the widget. Confirm placement with
`adb -s emulator-5554 shell dumpsys appwidget | grep -c "host.callbacks"`, which must print `1` or more.

### The readings

For each device, take all three readings. The app must be KILLED before each tap, so the proof shows a dead app
being started.

**Reading A: the app is not running.**

```
adb -s <serial> shell input keyevent KEYCODE_HOME
adb -s <serial> shell am kill com.mugtaba.athan
adb -s <serial> shell pidof com.mugtaba.athan
```

Never `force-stop`: it has hung the 3T before, and it also disables the widget refresh chain until the next app
open. Expected: `pidof` prints nothing and exits 1. If it prints a pid, wait five seconds and repeat once; a second
failure is a STOP.

On the EMULATOR only, `am kill` alone left the process alive in the planning session, because the emulator is under
no memory pressure. Follow it with `adb -s emulator-5554 shell am kill-all`, which then left `pidof` empty. Do not
run `am kill-all` on the 3T: it is the owner's phone.

**Reading B: the tap opens the app.** Start a logcat capture in the background, tap the widget, then read the
capture.

```
adb -s <serial> logcat -c
adb -s <serial> logcat -v time ActivityManager:I ActivityTaskManager:I '*:S' > ~/athan-device-sweep/session15c/<device>-tap.log &
```

Then tap the widget. On the 3T the owner does it, because a physical tap on a placed widget is theirs to perform;
ask them to tap the Athan widget on the home screen and tell you when they have. On the emulator, read the widget's
position with `uiautomator dump` and tap its centre with `adb -s emulator-5554 shell input tap <x> <y>`.

Stop the capture, then read it:

```
grep -E 'START.*com.mugtaba.athan|Background activity launch blocked' ~/athan-device-sweep/session15c/<device>-tap.log
```

Expected: a line containing `START` and `cmp=com.mugtaba.athan/.MainActivity`. Nothing matching
`Background activity launch blocked` may appear; that string is what the system logs when it refuses a launch
(AOSP `PendingIntentRecord`), and its presence means the tap was blocked. If it appears, STOP (section 2.2, item 8).

The two devices log it through different services and with different detail, and both forms are correct. The 3T
(Android 9) logs `I/ActivityManager` and names the intent's `dat=glance-action:/CALLBACK?appWidgetId=...`. The
emulator (Android 15) logs `I/ActivityTaskManager` and appends `with LAUNCH_SINGLE_TASK from uid <n>
(realCallingUid=<launcher uid>) (BAL_ALLOW_VISIBLE_WINDOW) result code=2`. `BAL_ALLOW_VISIBLE_WINDOW` is the system
saying the background-activity-launch check ran and passed; record it verbatim in the findings, because it is the
single most valuable line this session produces.

**Reading C: the app is now running.**

```
adb -s <serial> shell pidof com.mugtaba.athan
```

Expected: a pid. Together with Reading A's empty result, this is the proof: the app was dead, the tap happened, the
app is alive.

**If the emulator cannot be driven at all** (it will not boot, or the drag never places a widget after two
attempts), run step 4 on the 3T alone and write in the findings that the Android 15 reading was not taken. Do not
substitute a weaker reading and present it as the tap: an honest gap is worth more than a claim the evidence does
not carry.

Save every log under `~/athan-device-sweep/session15c/`, as evidence for the audit.

### Afterwards

Kill the emulator: `adb -s emulator-5554 emu kill`.

The 3T is left on the production build this step installed, unlocked, with Athan open and "Stay awake" on, which is
the standing rule (`ai/prompts/README.md`). No clock was changed, so automatic time was never turned off; confirm
with `adb -s 8f7ada76 shell settings get global auto_time`, which must print `1`.

## 8. Records

### Findings text

Append to `ai/features/android-widgets-x8/FINDINGS.md`, under the exact heading
`## Fixed: tapping an Android widget opens the app (session 15c, 2026-09-__)`:

```markdown
## Fixed: tapping an Android widget opens the app (session 15c, 2026-09-__)

Tapping an Android widget did nothing, and no arrangement of `expo-widgets`' own API
could change that. The library has one tap primitive, `Button`, and its click sends a
broadcast to the widget's own provider, which re-evaluates the layout's press handler
and reloads the widget (`WidgetInteractionAction.kt`). No code path in the library
starts an activity, so a tap could redraw the card and never open the app.

`patches/expo-widgets+58.0.3.patch` gives `Button` one optional boolean, `openApp`.
When set, the converter builds Glance's own `actionStartActivity` against the package's
launch intent instead of the interaction broadcast. The prop defaults false, so every
existing `Button` behaves exactly as before. The layout wraps every Android
composition in one such button, which covers all eight kinds and all three states: the
live card, the out-of-date card and the placeholder.

Measured at <VERSION>:

| Device | Android | App before the tap | Logcat | App after the tap |
| --- | --- | --- | --- | --- |
| OnePlus 3T | 9 (API 28) | <3T_BEFORE> | <3T_LOGCAT> | <3T_AFTER> |
| athan_test_avd (emulator) | 15 (API 35) | <EMU_BEFORE> | <EMU_LOGCAT> | <EMU_AFTER> |

The Android 15 reading is the one that matters most, and it came from an emulator
rather than a phone: the Find X8 went back to its user on 2026-09-24, leaving the 3T,
on Android 9, as the only physical Android device. Android 9 predates every
background-activity-launch restriction, so it could never have shown whether the tap
survives them.

### Why the launch is not blocked

A widget tap is not a background activity launch by the app. The launcher sends the
`PendingIntent` itself, and AOSP's `RemoteViews.getLaunchOptions` attaches
`MODE_BACKGROUND_ACTIVITY_START_ALLOW_ALWAYS` to it, with the comment "If the user
interacts with a visible element it is safe to assume they consent that something is
going to start." That is why the tap works with the app dead, and after a reboot with
the app never opened: the `PendingIntent` lives in the `RemoteViews` the system holds.

### Not raised upstream

The owner ruled on 2026-09-24 that a PR is a last resort and that the change is proven
on devices first. It is a candidate for a future session.

### The capture trap, for whoever writes the next patch

`npx patch-package expo-widgets` with no filter produces a patch of about 193,000
lines. `expo-widgets` builds in place, so `android/build/` holds compiled classes,
AARs and Gradle caches, and `bundle/build/` holds Metro output including
`ExpoWidgetsLayoutRegistry.imports.js`, which contains the absolute path of whichever
machine ran the build. The capture must carry `--include '^android/src/'`, which yields
50 lines and one file.
```

Every `<...>` is a placeholder the executor replaces with a value it measured.

### Table rows

The executor sets the `ai/plans/README.md` row 13 status to EXECUTED.

The exact new cell text for the `ai/prompts/README.md` row, which the AUDITOR applies on PASS:

```
DONE (session 15c, <VERSION>): tapping any Android widget opens the app. expo-widgets' Button gained an `openApp` prop through `patches/expo-widgets+58.0.3.patch`, and the layout wraps every Android composition in one. Proven on the OnePlus 3T (Android 9) and an Android 15 emulator, with the app killed before each tap.
```

### Docs commit

The `executed` docs commit message:

```
<VERSION> - docs(plans): session 15c executed: tapping an Android widget opens the app
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor in `widgets/PrayerWidget.tsx` counts other than 1 | `uat-2` moved since this plan was written | NEEDS REPLAN (section 2.2, item 1) |
| An anchor in `node_modules` counts other than 1 while the pre-flight's version check passed | `node_modules` was modified outside a plan | STOP and say so. Do not replan against a hand-edited tree |
| `patch-package` writes a patch of tens of thousands of lines | The `--include '^android/src/'` filter was omitted | Delete the patch, rerun the command with the filter. This is work still to do, not a finding |
| The patch contains `/Users/muji/` | Same cause | Same action |
| `grep -c openApp` on the converter prints 0 after `yarn install` | The patch did not apply | STOP and quote `patch-package`'s output |
| Gradle prints a line starting `e: ` | A compile error in the patched Kotlin | STOP and quote it |
| Every Android renderer test throws after step 2 | The `JETPACK` globals lack a `Button` marker | Add it, as step 2's part 4 table says. Work still to do, not a finding |
| Biome reports a formatter error on the wrapped return | JSX indentation was written by hand | Run `npx biome check --write widgets/PrayerWidget.tsx`. Whitespace is Biome's decision |
| A 15d sizing test fails after step 2 | The wrap moved a geometry node | STOP. This is the regression the plan is built to avoid |
| `widgetContract.test.ts` fails after step 2 | `Button` was not imported from `@expo/ui/jetpack-compose`, so the closure rule reads it as a module-scope reference | Import it from there. Work still to do |
| A break prints `BREAK NOT APPLIED` | The code does not hold the text the plan fixes | STOP (section 2.2, item 3). Never reshape the code to fit a break |
| The 3T does not answer adb | It left the bench | STOP (section 2.2, item 7) |
| The build prints `FAILED` | | STOP and quote the line |
| No widget appears after install | The build lacked `EXPO_PUBLIC_ANDROID_WIDGETS=1` | Rebuild with `build-prod-widgets.zsh`, which sets it |
| The tap does nothing on either device | | STOP (section 2.2, item 8) |
| Logcat shows `Background activity launch blocked` | The system refused the launch | STOP (section 2.2, item 8). Quote the line: it changes the design, not the code |
| The card looks different | The wrap moved something | STOP (section 2.2, item 9) |
| The emulator will not boot, or `adb` never sees it | | Say so, and run step 4 on the 3T alone. Record in the findings that the Android 15 reading was not taken, rather than claiming one |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed. Each is given word for word.

1. **If the reviewer says the patch carries an unused import:** remove the import. Step 1's contract names exactly
   two imports, `androidx.glance.action.Action` and `androidx.glance.appwidget.action.actionStartActivity`, and no
   others.
2. **If the reviewer says the action conditional tests `target` before `openApp`:** reorder it so `props.openApp` is
   tested first, which is what step 1's contract already requires.
3. **If the reviewer says `launchAppAction` should throw or log when the launch intent is null:** it must not.
   Step 1's contract requires it to return null, so the converter's existing `action != null` guard renders the card
   unclickable, which is today's behaviour.
4. **If the reviewer says the wrapper adds padding or alignment:** remove everything but `openApp` and one
   `fillMaxSize()`, which is what step 2's contract already requires.
5. **If the reviewer says a composition is wrapped twice:** route it through `AOpenApp` exactly once. Step 2's
   contract names the two returns, and no composition goes through both.
6. **If the reviewer says the version test hard-codes 58.0.3:** read the version from
   `node_modules/expo-widgets/package.json` and build the patch filename from it, which is what step 3's contract
   already requires.

A reviewer finding that meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies
itself and records in `LOG.md`. Those three conditions are written there and are never restated here in other words.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `app.json`, `package.json` | `patches/expo-widgets+58.0.3.patch`. Then restore `node_modules` with `rm -rf node_modules/expo-widgets && yarn install --check-files` |
| 2 | `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts`, `app.json`, `package.json` | any `.bak` file left by the break script |
| 3 | `app.json`, `package.json` | `shared/__tests__/widgetOpenAppPatch.test.ts`, and any `.bak` file |
| 4 | `ai/features/android-widgets-x8/FINDINGS.md`, `app.json`, `package.json` | nothing |

After restoring, follow `EXECUTOR-BRIEF.md` section 4a.

## 11. Subagents in this plan

A subagent always runs the same model as the session that spawns it, for every task including reading an image
(owner, 2026-09-24). No model is named here or anywhere in this repository: the harness chooses it, and these pages
are read by different models over the life of the build.

| Step | Agent type | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- |
| 1 | `Code Reviewer` | `worktree` | The patch is the change an upstream maintainer would interrogate hardest, and the owner asked for exactly that scrutiny | Step 1, part 9 |
| 2 | `Code Reviewer` | `worktree` | Every changed line is reviewed before merge (standing rule), and this one must be proven to change no pixel | Step 2, part 9 |
| 3 | `Code Reviewer` | `worktree` | Standing rule | Step 3, part 9 |
| 4 | `Code Reviewer` | `worktree` | Standing rule, and the records text must not claim more than the evidence shows | Step 4, part 9 |

No `vision` subagent: this session's proof is logcat lines and process ids, not pixels. If the executor decides a
screenshot would help it understand a device state, it asks the `vision` subagent with the path and one exact
question, because it cannot see images itself.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences: that tapping an Android widget now opens the app, what the patch changed in the library,
  and what each device's logcat showed;
- the progress table, in `EXECUTOR-BRIEF.md` section 6's format;
- any decision now waiting on the owner;
- the four-line handoff from the `athan-next` skill, section 5.

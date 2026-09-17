# Step 1: One shared notification tag, through a config plugin

This file is part of `ai/plans/07-replace-previous-notification/PLAN.md`. Run every command from
`/Users/muji/repos/rn.athan.uk`. This step is **specified**: you build it from the contracts below.

0. **Anchor check.** Run `bash ai/plans/07-replace-previous-notification/scripts/check-anchors.sh 1`.
   Expected: `1-1 app.json 1`, then `ANCHORS OK`. Any count other than `1`: NEEDS REPLAN
   (`EXECUTOR-BRIEF.md` section 1, item 4).

1. **Goal:** every notification the app posts on Android is posted under exactly the tag
   `athan-notification` with id 0, so the notification tray holds at most one notification of the app's,
   while scheduling, identifiers, alarms and every screen stay exactly as they are.

2. **Branch:** `git checkout -b feat/shared-notification-tag uat-2`.

3. **Files.** Only these change, apart from `app.json`, `package.json`, the local
   `android/app/build.gradle` and the three plan files:
   - `plugins/replacePreviousNotification.js` (new);
   - `plugins/__tests__/replacePreviousNotification.test.ts` (new).

   Nothing under `app/`, `components/`, `hooks/`, `stores/`, `device/`, `shared/`, `mocks/`, `e2e/` or
   `node_modules/` changes. `opencode.json` stays as the planning session set it.

4. **Tests first (red).** Create `plugins/__tests__/replacePreviousNotification.test.ts` (new suite, `unit`
   project: its path matches `**/__tests__/**/*.test.ts`). Follow `__tests__/README.md`. Its doc comment:
   `The prebuild change that posts every Android notification under one shared tag
   (plugins/replacePreviousNotification.js)`.

   Its imports, in Biome's order: `existsSync`, `mkdirSync`, `readFileSync`, `rmSync` from `node:fs`;
   `tmpdir` from `node:os`; `join` from `node:path`; then one typed `require` of the plugin (never a named
   `import`: the plugin is CommonJS exporting the composer function, so its other exports ride on it as
   properties and TypeScript cannot see them as named exports). The `require` block's type:

   ```ts
   const { DELEGATE_SOURCE, EXPO_RECEIVER_NAME, RECEIVER_NAME, SERVICE_SOURCE, SHARED_NOTIFICATION_TAG,
     editManifest, writeKotlin } = require('../replacePreviousNotification') as {
     DELEGATE_SOURCE: string; EXPO_RECEIVER_NAME: string; RECEIVER_NAME: string; SERVICE_SOURCE: string;
     SHARED_NOTIFICATION_TAG: string;
     editManifest: (manifest: ManifestDoc) => ManifestDoc;
     writeKotlin: (projectRoot: string) => void;
   };
   ```

   with these local types, above the require:

   ```ts
   type ReceiverNode = {
     $: Record<string, string>;
     'intent-filter'?: Array<{ $: Record<string, string>; action: Array<{ $: Record<string, string> }> }>;
   };

   type ManifestDoc = {
     manifest: {
       $: Record<string, string>;
       application: Array<{ $: Record<string, string>; activity: unknown[]; receiver?: ReceiverNode[] }>;
     };
   };
   ```

   and this fixture builder:

   ```ts
   const manifestWithoutReceivers = (): ManifestDoc => ({
     manifest: {
       $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
       application: [{ $: { 'android:name': '.MainApplication' }, activity: [] }],
     },
   });
   ```

   Ten tests, one behaviour each, in this order:

   | # | `it` name | Proves | Inputs | Asserts |
   | --- | --- | --- | --- | --- |
   | 1 | `removes expo notifications receiver and declares the app own one with the same six actions` | The manifest edit performs the whole surgery | `editManifest(manifestWithoutReceivers())`, typed `ManifestDoc` | `application[0].receiver` holds exactly 2 nodes; the one named `RECEIVER_NAME` has `$` matching `{ 'android:enabled': 'true', 'android:exported': 'false' }` and its one `intent-filter` has `$` `{ 'android:priority': '-1' }` and its `action` list maps to a LITERAL six-element array: `expo.modules.notifications.NOTIFICATION_EVENT`, `android.intent.action.BOOT_COMPLETED`, `android.intent.action.REBOOT`, `android.intent.action.QUICKBOOT_POWERON`, `com.htc.intent.action.QUICKBOOT_POWERON`, `android.intent.action.MY_PACKAGE_REPLACED` (a literal, with a comment saying comparing against the plugin's own export would prove nothing); the one named `EXPO_RECEIVER_NAME` has `$['tools:node']` `'remove'`; the root gained `'xmlns:tools'` = `http://schemas.android.com/apk/res/tools` |
   | 2 | `changes nothing the second time it runs` | Prebuild re-runs on an existing `android/` at every version bump | `editManifest(editManifest(manifestWithoutReceivers()))` | The twice-edited manifest `toEqual` the once-edited one |
   | 3 | `keeps an xmlns:tools the manifest already had` | The xmlns guard only fills a gap | The fixture with `manifest.$['xmlns:tools']` already set to the standard URL | After `editManifest` it is still that URL |
   | 4 | `post every notification under the shared tag` | The delegate template carries the whole swap | `DELEGATE_SOURCE` | Contains `const val SHARED_NOTIFICATION_TAG = "${SHARED_NOTIFICATION_TAG}"`, `NotificationRequest(SHARED_NOTIFICATION_TAG, request.content, request.trigger)`, and `super.presentNotification(Notification(sharedRequest, notification.originDate), behavior)` |
   | 5 | `hand presentation to the shared-tag delegate` | The service template designates the delegate | `SERVICE_SOURCE` | Contains `class AthanNotificationsService : NotificationsService()` and `override fun getPresentationDelegate(context: Context): PresentationDelegate = AthanPresentationDelegate(context)` |
   | 6 | `are written under the app package when prebuild runs` | The file-writing mod writes both sources at the exact path | `const projectRoot = join(tmpdir(), \`plan7-plugin-${process.pid}\`)`, after `rmSync(projectRoot, { recursive: true, force: true })`, and `mkdirSync(projectRoot, { recursive: true })`; the same `rmSync` closes the test | After `writeKotlin(root)`: `existsSync` is true for `<root>/android/app/src/main/java/com/mugtaba/athan/notifications/AthanPresentationDelegate.kt`, and reading it and `AthanNotificationsService.kt` equals `DELEGATE_SOURCE` and `SERVICE_SOURCE` |
   | 7 | `still declares the receiver the plugin removes, under the six actions` | The upstream manifest still holds what the remove node names | `node_modules/expo-notifications/android/src/main/AndroidManifest.xml` | The file contains `android:name=".service.NotificationsService"`; `EXPO_RECEIVER_NAME` is `'expo.modules.notifications.service.NotificationsService'`; each of the six action strings appears as `android:name="<action>"` in it |
   | 8 | `still exposes the override seam the Kotlin rides on` | The upstream Kotlin still has the seams, at the exact signatures overridden | `ExpoPresentationDelegate.kt` and `NotificationsService.kt` under `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/` | The delegate file contains `open class ExpoPresentationDelegate` and `override fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?)`, does NOT contain `final override fun presentNotification`, and `NotificationManagerCompat.from(context).notify` appears exactly once; the service file contains `protected open fun getPresentationDelegate` |
   | 9 | `loads the plugin from app.json` | The plugin is wired into the config | `../../app.json`, parsed as JSON | `expo.plugins` contains `./plugins/replacePreviousNotification` |
   | 10 | `keeps the plugin through app.config.ts when the widgets flag strips its own` | The effective plugin list keeps it, not just the raw one | `delete process.env.EXPO_PUBLIC_WIDGETS`, then inside `jest.isolateModules` `require('../../app.config').default`, mapping the plugins to names exactly as `shared/__tests__/flags.test.ts` does (string, or array whose first element is a string) | The names contain `./plugins/replacePreviousNotification` and not `expo-widgets` |

   Run: `npx jest plugins/__tests__/replacePreviousNotification.test.ts --watchman=false --selectProjects=unit > $TMPDIR/red-1.log 2>&1`.

   Expected in `$TMPDIR/red-1.log`: `Test Suites: 1 failed, 1 total`, `Tests: 0 total`, and the log holds
   `Cannot find module '../replacePreviousNotification'` (the suite dies at the require, before any test
   runs). Any test passing: STOP and ask "the step 1 red run printed `<Tests line>`; the plan expects the
   whole suite to fail on the missing module; what do I do?".

5. **Change.** Build `plugins/replacePreviousNotification.js`, CommonJS like `plugins/gradleJvmMemory.js`.
   Its exports and contracts:

   - `module.exports` IS the composer `withReplacePreviousNotification` (the string entry in `app.json`
     resolves `module.exports` itself), and every other export rides on it as a property, assigned after:
     `editManifest`, `writeKotlin`, `EXPO_RECEIVER_NAME`, `RECEIVER_NAME`, `RECEIVER_ACTIONS`,
     `SHARED_NOTIFICATION_TAG`, `DELEGATE_SOURCE`, `SERVICE_SOURCE`.
   - `withReplacePreviousNotification(config)`: wraps `config` in `withAndroidManifest` (from
     `expo/config-plugins`), whose mod runs `editManifest(cfg.modResults)` and returns the cfg; then
     returns `withDangerousMod(config, ['android', (modConfig) => { writeKotlin(modConfig.modRequest.projectRoot);
     return modConfig; }])`. `withDangerousMod`'s second argument is the `[platform, action]` tuple, and
     the project root rides on `modRequest.projectRoot`: both were verified against the installed
     `@expo/config-plugins` while planning.
   - `editManifest(manifest)`: mutates the manifest document in place and returns that same whole
     document (the `ManifestDoc` it was given, never `application[0]`), so `manifest.manifest.application[0]`
     is where every node goes, with `application.receiver` created as `[]` when absent. It appends
     the app's receiver node when no receiver with `RECEIVER_NAME` exists; the node is
     `{ $: { 'android:name': RECEIVER_NAME, 'android:enabled': 'true', 'android:exported': 'false' },
     'intent-filter': [{ $: { 'android:priority': '-1' }, action: RECEIVER_ACTIONS.map((name) => ({ $:
     { 'android:name': name } })) }] }`. It appends the removal node when no receiver with
     `EXPO_RECEIVER_NAME` exists: `{ $: { 'android:name': EXPO_RECEIVER_NAME, 'tools:node': 'remove' } }`.
     It sets `manifest.manifest.$['xmlns:tools']` to `http://schemas.android.com/apk/res/tools` only when
     that attribute is absent. Every addition is guarded, so the edit is idempotent; the guards' reason
     (prebuild re-runs at every version bump) is the file's comment.
   - `writeKotlin(projectRoot)`: `mkdirSync` with `{ recursive: true }` on
     `<projectRoot>/android/app/src/main/java/com/mugtaba/athan/notifications`, then writes
     `AthanPresentationDelegate.kt` with `DELEGATE_SOURCE` and `AthanNotificationsService.kt` with
     `SERVICE_SOURCE`.
   - `SHARED_NOTIFICATION_TAG` is the string `athan-notification`.
   - `RECEIVER_NAME` is `com.mugtaba.athan.notifications.AthanNotificationsService`;
     `EXPO_RECEIVER_NAME` is `expo.modules.notifications.service.NotificationsService` (fully qualified:
     the library declares a relative name that resolves against its own package).
   - `RECEIVER_ACTIONS` is exactly the six actions of test 1, in that order.
   - The two Kotlin templates, verbatim, as the values of `DELEGATE_SOURCE` and `SERVICE_SOURCE` (these
     are identifiers and calls the tests pin; use them exactly):

     ```kotlin
     package com.mugtaba.athan.notifications

     import android.content.Context

     import expo.modules.notifications.notifications.model.Notification
     import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
     import expo.modules.notifications.notifications.model.NotificationRequest
     import expo.modules.notifications.service.delegates.ExpoPresentationDelegate

     /**
      * Posts every notification under one shared tag, so the newest replaces the one before it (finding 78).
      *
      * The identifier is swapped only here at the posting layer: scheduling, cancelling and the stored
      * request all keep the app's own unique identifiers, so nothing else changes.
      */
     class AthanPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
       companion object {
         const val SHARED_NOTIFICATION_TAG = "athan-notification"
       }

       override fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?) {
         val request = notification.notificationRequest
         val sharedRequest = NotificationRequest(SHARED_NOTIFICATION_TAG, request.content, request.trigger)
         super.presentNotification(Notification(sharedRequest, notification.originDate), behavior)
       }
     }
     ```

     ```kotlin
     package com.mugtaba.athan.notifications

     import android.content.Context

     import expo.modules.notifications.service.NotificationsService
     import expo.modules.notifications.service.interfaces.PresentationDelegate

     /** The app's designated notifications receiver, whose delegate posts under one shared tag. */
     class AthanNotificationsService : NotificationsService() {
       override fun getPresentationDelegate(context: Context): PresentationDelegate = AthanPresentationDelegate(context)
     }
     ```

     The Kotlin package is fixed by the plan and deliberately NOT derived from `config.android.package`:
     `EXPO_ANDROID_SUFFIX=fleettest` builds change the package id while this class must not move.
   - Comments in the file explain why, never what, one to three lines each, on exactly these subjects:
     why expo's receiver is removed (first-match routing), why the Kotlin package is fixed (the fleettest
     suffix), why the composer is the export (the string entry in `app.json`), and why the manifest edits
     are guarded (prebuild re-runs). No comment restates what the code says.
   - In `app.json`, anchor `1-1` (the two local plugin lines) gains one line after it, at the same
     indentation:

     ```json
     "./plugins/replacePreviousNotification",
     ```

     Change nothing else in `app.json`: a rewrite of the file's formatting is a diff the step forbids.

6. **Green.**
   1. Run the red command again, writing to `$TMPDIR/green-1.log`. Expected: `Test Suites: 1 passed,
      1 total`, `Tests: 10 passed, 10 total`.
   2. Run `npx tsc --noEmit`. Expected: exit 0 and no output. (If Biome has not yet organized the test's
      imports, run `npx biome check --write plugins/replacePreviousNotification.js
      plugins/__tests__/replacePreviousNotification.test.ts` once, then this and the next check again.)
   3. Run `npx biome check . --error-on-warnings`. Expected: exit 0, ending `No fixes applied.`
   4. Any difference: STOP and ask "step 1 green printed `<line>`; what do I do?".

7. **Breaks.** Run `bash ai/plans/07-replace-previous-notification/scripts/breaks-1.sh > $TMPDIR/breaks-1.log 2>&1`
   in the background. It takes about 30 seconds. The breaks run after part 6, so the plugin file carries
   Biome's layout. Expected: five lines starting `BREAK 1` each saying
   `AS EXPECTED` (1a, 1b, 1c and 1e each with `Tests: 1 failed, 9 passed, 10 total`; 1d with
   `Tests: 2 failed, 8 passed, 10 total`), and the last line `ALL AS EXPECTED: 1`. A line saying
   `NOT AS EXPECTED` or `the substitution did not change`: STOP and ask
   "break `<name>` did not behave as the plan says: `<that line>`; what do I do?". Afterwards,
   `git status --porcelain` must list only this step's files and the three plan files.

8. **Version and commit.**
   1. Run `bash ai/plans/07-replace-previous-notification/scripts/set-version.sh`. Expected: two lines,
      `VERSION <x.y.z>` and `VERSIONS MATCH`. Any other output: STOP and ask "set-version.sh printed
      `<output>`; how do I set the version?".
   2. Add exactly these files by name: `plugins/replacePreviousNotification.js`,
      `plugins/__tests__/replacePreviousNotification.test.ts`, `app.json`, `package.json`, and
      `ai/plans/README.md`, `ai/plans/07-replace-previous-notification/PLAN.md` and
      `ai/plans/07-replace-previous-notification/LOG.md` when this session changed them. Run
      `git status --porcelain` afterwards. Every changed file must be staged. Any other line: STOP and ask
      "git status shows `<line>` before the step 1 commit; what do I do?".
   3. Write the commit message below to `$TMPDIR/msg-1.txt`, with `<VERSION>` replaced by the version
      `set-version.sh` printed.
   4. Run `git commit -F $TMPDIR/msg-1.txt > $TMPDIR/commit-1.log 2>&1` in the background, with the hang
      check from `EXECUTOR-BRIEF.md` section 3.
   5. Expected in `$TMPDIR/commit-1.log`: the last `Tests:` line ends `passed, <n> total` with no
      `failed`; the lines `Statements   : 100%`, `Branches     : 100%`, `Functions    : 100%` and
      `Lines        : 100%`; no line starting `Coverage gate:`. If only
      `shared/__tests__/audioMatrix.test.ts` timed out, follow `EXECUTOR-BRIEF.md` section 3. Any other
      failure: STOP and ask "the step 1 commit failed with `<first failing line>`; what do I do?".

   The commit message:

   ```text
   <VERSION> - feat(notifications): every Android notification posts under one shared tag, so each replaces the one before it

   Finding 78, Android half. expo-notifications posts each notification under its request identifier as
   the tag with a fixed id of 0, and the app's identifiers are unique, so every notification stacks in the
   tray; a user who never swipes reaches Android's 50-notification cap (finding 73).

   - A config plugin removes expo's receiver from the merged manifest (its companion picks the first
     receiver matching the action, so two would make routing nondeterministic), declares the app's own
     NotificationsService with the same six actions, and writes the Kotlin at prebuild under a fixed
     package, so fleettest package-suffix builds are unaffected.
   - The delegate subclass rebuilds the request under SHARED_NOTIFICATION_TAG only at the posting layer:
     scheduling, cancelling and the stored requests keep the app's identifiers.
   - The suite pins the manifest surgery, the Kotlin, the wiring in app.json and app.config.ts, and the
     upstream seams (open presentNotification, protected-open getPresentationDelegate, the library's one
     posting site, its receiver and actions).
   - Notifications stacked by earlier builds stay for the user to swipe (owner, 2026-09-17); same-instant
     pairs stay with the system (owner, 2026-09-13 and 2026-09-17).
   ```

9. **Review.** Spawn a `Code Reviewer` subagent (a `general` subagent prompted as the reviewer),
   isolation `worktree`, with no `model`, and this prompt, with `<sha>` replaced by the step 1 commit's
   sha:

   ```text
   Run git checkout --detach <sha>. Your worktree starts at the wrong branch.

   You review one commit in the rn.athan.uk repository, a React Native prayer-times app. The commit is
   step 1 of the plan ai/plans/07-replace-previous-notification/PLAN.md, executed by another model. Read
   these files in full, with no partial reads: ai/plans/07-replace-previous-notification/steps/1-shared-tag-plugin.md,
   ai/plans/07-replace-previous-notification/PLAN.md sections 4 and 5, __tests__/README.md,
   plugins/replacePreviousNotification.js, plugins/__tests__/replacePreviousNotification.test.ts, app.json,
   plugins/gradleJvmMemory.js, and, from node_modules/expo-notifications: android/src/main/AndroidManifest.xml,
   android/src/main/java/expo/modules/notifications/service/delegates/ExpoPresentationDelegate.kt and
   android/src/main/java/expo/modules/notifications/service/NotificationsService.kt (lines 400-445 suffice
   for the second).

   Check each item and report every problem you find:
   1. git show <sha> changes exactly the files the step's "Files" part lists, plus app.json and
      package.json, and plan files under ai/plans/ only where they record status or the log.
   2. The plugin's contracts all hold: module.exports is the composer with the other exports as
      properties; editManifest performs exactly the guarded surgery the step describes, idempotently;
      writeKotlin writes the two templates at the exact path; DELEGATE_SOURCE and SERVICE_SOURCE equal the
      step's Kotlin verbatim, including the SHARED_NOTIFICATION_TAG value "athan-notification";
      RECEIVER_ACTIONS holds exactly the six actions in the step's order.
   3. app.json gained exactly one plugin line and no formatting change.
   4. The Kotlin would compile and behave: presentNotification is overridden at the parent's exact
      signature (check the parent), the request rebuild uses the public NotificationRequest constructor,
      and nothing else in the posting path is duplicated.
   5. Every test follows __tests__/README.md, asserts what its row says, and would fail if the line it
      guards were broken; no test compares the plugin against its own exports.
   6. The version in app.json and package.json is the next patch after the parent commit's package.json,
      and both match; the commit message equals the step's message with <VERSION> filled in.
   7. No comment explains what the code already shows.

   Reply with numbered findings (file, line, problem, exact fix), then a final line that is exactly
   "merge" or "fix first".
   ```

   A "merge" verdict is a final line that is exactly `merge`. On "fix first", apply only a fix that
   `PLAN.md` section 10 gives word for word, or one that meets all three of `EXECUTOR-BRIEF.md` section 4,
   item 8's conditions (record it in `LOG.md`, rerun the breaks, amend, resend the same reviewer);
   anything else is a STOP.

10. **Merge.**
    `git checkout uat-2 && git merge --no-ff feat/shared-notification-tag -m "Merge feat/shared-notification-tag into uat-2: one shared notification tag, reviewed"`.

11. **Done when.**
    1. `git branch --show-current` prints `uat-2`.
    2. `git log -1 --format=%s` prints `Merge feat/shared-notification-tag into uat-2: one shared
       notification tag, reviewed`.
    3. `git status --porcelain` lists nothing but the three plan files.
    4. In `PLAN.md` section 6, replace the whole line that starts `- [ ] Step 1:` with `- [x] Step 1:
       DONE in <merge sha>`, and append the step's record to `LOG.md`: the branch, the commit sha and
       version, the hook's last `Tests:` line and its coverage lines, the break script's last line, the
       review verdict with the reviewer's model (GLM 5.3) and how many rounds it took, and the merge sha.

# Step 1: The Help modal and its content

This step is **(specified)**: build it from the contracts below. No file is handed to you to copy.

## 0. Anchor check

```bash
bash $TMPDIR/preflight-29.sh 1
```

Every anchor line prints `1`, and the script ends `PREFLIGHT OK`. Any other count means NEEDS REPLAN.

## 1. Goal

A Help modal, mounted on the launch screen, that answers the running platform's questions and opens the settings
screen each answer names.

## 2. Branch

```bash
git checkout -b feat/29-help-modal uat-2
```

## 3. Files

| File | New |
| --- | --- |
| `shared/help.ts` | yes |
| `shared/__tests__/help.test.ts` | yes |
| `components/modals/Help.tsx` | yes |
| `components/modals/__tests__/Help.test.tsx` | yes |
| `components/modals/index.ts` | no |
| `device/notifications.ts` | no |
| `device/__tests__/androidChannelUpdate.test.ts` | no |
| `stores/ui.ts` | no |
| `stores/__tests__/ui.test.ts` | no |
| `app/index.tsx` | no |
| `__tests__/app/index.test.tsx` | no |
| `app.json`, `package.json` | no (version only) |

Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

## 4. Tests first (red)

Read `__tests__/README.md` before writing the first one. Every test states its behaviour in the present tense,
and each has three blocks separated by blank lines.

### 4a. `shared/__tests__/help.test.ts` (new, `unit` project)

Doc comment, one line:
`Unit tests for shared/help.ts: which questions each platform answers, and which offer a deep link`

`describe('getHelpTopics', ...)` holding:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `answers at least five questions on %s` (`it.each(['ios', 'android'] as const)`) | Neither platform is left with a stub page | `'ios'`, then `'android'` | `getHelpTopics(os).length` is at least 5 |
| `asks about notifications first on both platforms, since it is the most common cause` | The order is the deliberate one, not the array's accident | both platforms | `getHelpTopics('ios')[0].question` and `getHelpTopics('android')[0].question` both equal `'Are notifications turned on for Athan?'` |
| `keeps the reboot question for Android alone, where an alarm is cleared by a restart` | The platform split really drops a topic rather than rewording it | both platforms | the Android questions contain `'I restarted my phone and heard nothing.'`; the iOS questions do not |
| `keeps the alarm volume question for Android alone, which is the platform that plays on that stream` | The second Android-only topic is dropped on iOS too, so one passing test cannot cover both | both platforms | the Android questions contain `'The athan plays too quietly.'`; the iOS questions do not |
| `offers the Do Not Disturb grant on Android only, which is the one platform that has it` | An action is per platform, not per question | both platforms | the Android actions contain `'dndAccess'`; the iOS actions do not |
| `offers the app settings on both platforms, where the permission lives` | The shared action is not accidentally Android-only | both platforms | both platforms' actions contain `'appSettings'` |
| `words the silent switch answer for each platform rather than sharing one` | The brief's rule that the copy is platform-aware | the `'Is the silent switch on?'` topic on each platform | the iOS text contains `'mute switch'`; the Android text contains `'Silent mode'` |
| `never claims an app setting can play through the silent switch` | The page cannot lie: session 27 proved no configuration sounds through it | both platforms | each platform's silent-switch text contains `'No app setting can play through it.'` |
| `gives every answer some text and never an empty question` | No half-written entry ships | both platforms, every topic | each `question.trim().length` and `text.trim().length` is above 0 |
| `names a button for every action an answer offers` | An action can never render a blank button | both platforms, every topic declaring an action | `HELP_ACTION_LABELS[action].length` is above 0 |

### 4b. `components/modals/__tests__/Help.test.tsx` (new, `components` project)

Doc comment, one line:
`The Help modal: the questions it lists on each platform, the settings screens its buttons open, and Close`

Mock, with this comment above it, because both calls leave the app:

```tsx
// The two settings screens leave the app, so opening them is observed instead of done
jest.mock('@/device/notifications', () => ({
  openAppSettings: jest.fn(() => Promise.resolve(true)),
  openDndAccessSettings: jest.fn(() => Promise.resolve(true)),
}));
```

`describe('the Help modal', ...)`, which Jest runs as iOS:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `shows nothing while it is not visible` | The card is not merely transparent | `visible={false}` | `screen.queryByText('Help')` is null |
| `answers the question a silent phone raises first` | The content reaches the screen in order | `visible={true}` | `'Are notifications turned on for Athan?'` is on the screen |
| `lists every question its platform answers` | Nothing is dropped between the module and the screen | `visible={true}` | for each `getHelpTopics('ios')` topic, its question is on the screen. Import `getHelpTopics` from `@/shared/help` |
| `opens the app settings when the notification answer offers it` | The shared action is wired | `visible={true}`, press the first `'Open Settings'` button | `openAppSettings` called once |
| `renders one button for each answer that offers a settings screen, plus Close` | The number of buttons equals the number of actions, so a button cannot appear on an answer that declares none. **This row exists because a break proved every other row missed exactly that**: flipping `{action ? (` to `{true ? (` rendered nine buttons instead of three and no test noticed | `visible={true}`, and `getHelpTopics('ios').filter((topic) => topic.action).length` | `screen.getAllByRole('button')` has that length plus 1 |
| `offers no Do Not Disturb grant on iOS, which has none to give` | An absent action renders no button of that label | `visible={true}` | no button labelled `'Grant Do Not Disturb access'` |
| `reports Close when it is pressed` | The owner's Close button | `visible={true}`, press `'Close'` | `onClose` called once |
| `scrolls its answers rather than growing past the screen` | The card holds on every screen size, which is the owner's sizing rule | `visible={true}` | `StyleSheet.flatten` of the scroller's style has `maxHeight` above 0. Reach it with `screen.root?.queryAll((node) => node.type === 'RCTScrollView')[0]`, because the scroller carries no role, label or text. **`UNSAFE_getByType` and `root.findByType` do not exist in React Native Testing Library 14**, measured in the planning session: `screen.root`'s prototype offers `queryAll` only, and a `ScrollView` renders as the host type `RCTScrollView`. A style is read because it is a rule the app must keep: the answers must scroll or Close leaves the screen |

`describe('the Help modal on Android', ...)`, each test starting `onPlatform('android')` from
`@/__tests__/harness`:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `opens the Do Not Disturb access screen from its own answer` | The Android-only action is wired to the right opener | press `'Grant Do Not Disturb access'` | `openDndAccessSettings` called once, and `openAppSettings` not called |
| `answers the restart question, which iOS never asks` | The platform split reaches the screen | `visible={true}` | `'I restarted my phone and heard nothing.'` is on the screen |

`Platform.OS` is read inside the component body, not at module scope, so `onPlatform` alone is enough here and
no `jest.isolateModules` dance is needed.

### 4c. Rows added to three existing suites

**`device/__tests__/androidChannelUpdate.test.ts`.** Change its import to
`import { openAppSettings, openDndAccessSettings, updateAndroidChannel } from '@/device/notifications';` and
append one `describe('openAppSettings', ...)`, whose `beforeEach` clears `Linking.openSettings` and resolves it:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `opens the app's own settings page on %s` (`it.each(['ios', 'android'] as const)`) | The one opener serves both platforms, unlike the DND one | `Platform.OS` set to each | resolves `true`, and `Linking.openSettings` called once |
| `answers false when the page cannot open, rather than throwing` | A refusal is swallowed and logged, never thrown at a component | `Linking.openSettings` rejecting `new Error('Unable to open app settings')` | resolves `false` |

`it.each` here needs `as const`, or tsc rejects the `string` assigned to `Platform.OS`. The spike hit exactly
that: `error TS2322: Type 'string' is not assignable to type '"android" | "ios" | ...'`.

**`stores/__tests__/ui.test.ts`.** Add `popupHelpEnabledAtom` to the atom imports and `setPopupHelpEnabled` to
the action imports, then one test beside `setPopupUpdateEnabled sets boolean`:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `setPopupHelpEnabled sets boolean` | The action writes the atom it names | `setPopupHelpEnabled(true)` | `mockDefaultStoreSet` called with `popupHelpEnabledAtom, true`. That suite observes the write rather than reading the atom back, so follow it |

**`__tests__/app/index.test.tsx`.** Add `setPopupHelpEnabled` to the `@/stores/ui` import, then three tests:

| Test name | Where | What it proves | Inputs | Asserts |
| --- | --- | --- | --- | --- |
| `shows Help when the settings sheet asks for it` | in the What's New describe, before `closes What's New when Continue is pressed` | The modal is mounted on the launch screen and reacts to the atom | `relaunchRelease()`, render, advance `FIRST_FRAME_MS`, then `await act(() => setPopupHelpEnabled(true))` | `'Help'` and `'Are notifications turned on for Athan?'` are on the screen |
| `closes Help when Close is pressed` | beside the one above | The close handler is wired to the atom | as above, then press `'Close'` | `screen.queryByText('Help')` is not on the screen |
| `holds the update prompt back while Help is showing` | in the update-prompt describe, before `holds the update prompt back while What's New is showing` | The nag cannot stack on Help | `relaunchRelease()`, `checkForUpdates` resolving true, advance `SETTLING_WINDOW_MS`, then set the Help atom | `UPDATE_PROMPT_TITLE` is not on the screen, and `'Help'` is |

`relaunchRelease()` is used rather than `installUpdate()`, so What's New is not also showing and the assertion
can only be about Help.

### 4d. The command, and what it must print before the change

```bash
npx jest shared/__tests__/help.test.ts device/__tests__/androidChannelUpdate.test.ts stores/__tests__/ui.test.ts --watchman=false --selectProjects=unit
npx jest components/modals/__tests__/Help.test.tsx __tests__/app/index.test.tsx --watchman=false --selectProjects=components
```

Expected, measured in the planning session's scratch worktree:

- `shared/__tests__/help.test.ts`: `Cannot find module '../help' from 'shared/__tests__/help.test.ts'`
- `components/modals/__tests__/Help.test.tsx`: `Cannot find module '../Help' from 'components/modals/__tests__/Help.test.tsx'`
- the three edited suites fail on the names they now import (`openAppSettings`, `popupHelpEnabledAtom`,
  `setPopupHelpEnabled`).

If any named test passes, or a test the plan did not name fails, STOP.

## 5. Change

### 5.1 `shared/help.ts` (new)

A pure module. It imports nothing: no `react-native`, no store, no logger. That is what lets the `unit` project
test it with no harness.

**Types, with these exact names:**

```ts
export type HelpAction = 'appSettings' | 'dndAccess';
```

- `HelpAnswer` (not exported): `{ text: string; action?: HelpAction }`.
- `HelpEntry` (not exported): `{ question: string; ios: HelpAnswer | null; android: HelpAnswer | null }`. `null`
  means the question does not arise on that platform.
- `HelpTopic` (exported): `{ question: string; text: string; action?: HelpAction }`. One question as one
  platform sees it.

**Exported constant:**

```ts
export const HELP_ACTION_LABELS: Record<HelpAction, string> = {
  appSettings: 'Open Settings',
  dndAccess: 'Grant Do Not Disturb access',
};
```

**Exported function:**

- Name: `getHelpTopics`
- Signature: `(os: 'ios' | 'android') => HelpTopic[]`
- Answers: the questions that platform has an answer for, in the order `HELP_ENTRIES` declares them.
- Must never: return an entry whose answer for that platform is `null`; reorder the entries; read `Platform`.
- Logs: nothing.
- Shape: `HELP_ENTRIES.flatMap(...)`, returning `[]` for an entry with no answer on that platform and a
  one-element array otherwise.

**The content, `HELP_ENTRIES`, verbatim.** Every string below is what the user reads and is used exactly as
written, in this order. Do not reword, re-punctuate or re-order any of it.

1. `question: 'Are notifications turned on for Athan?'`
   - `ios`: `action: 'appSettings'`, text:
     `'Athan cannot alert you without notification permission. Open Settings, then turn Allow Notifications on, and leave Sounds on with it.'`
   - `android`: `action: 'appSettings'`, text:
     `'Athan cannot alert you without notification permission. Open Settings, then turn notifications on for Athan.'`
2. `question: 'Is background activity allowed?'`
   - `ios`: `action: 'appSettings'`, text:
     `'Athan sets the next days of alerts while you are not using it. With Background App Refresh off, the alerts already set still fire, and no new ones are added. Low Power Mode switches it off as well.'`
   - `android`: `action: 'appSettings'`, text:
     `'Athan sets the next days of alerts while you are not using it. Battery saving can stop that, so the alerts already set still fire and no new ones are added. Allow background activity for Athan.'`
3. `question: 'Is the silent switch on?'`
   - `ios`, no action, text:
     `'The mute switch silences notification sound before any app is consulted, so the alert arrives without a sound. No app setting can play through it. Turn the switch off to hear the athan.'`
   - `android`, no action, text:
     `'Silent mode silences notification sound before any app is consulted, so the alert arrives without a sound. No app setting can play through it. Turn silent mode off to hear the athan.'`
4. `question: 'Is Do Not Disturb or a Focus on?'`
   - `ios`, no action, text:
     `'A Focus holds notifications back unless Athan is allowed through it. Open Settings, then Focus, then the mode you use, then Apps, and add Athan.'`
   - `android`: `action: 'dndAccess'`, text:
     `'Do Not Disturb silences notifications by policy. Athan asks to be allowed through, and Android grants that only once you give it Do Not Disturb access.'`
5. `question: 'Why does the athan stop before it finishes?'`
   - `ios`, no action, text:
     `'iOS plays 30 seconds of a notification sound and falls back to the default tone for anything longer, so every athan is trimmed to fit.'`
   - `android`, no action, text:
     `'Android plays 30 seconds of a notification sound and falls back to the default tone for anything longer, so every athan is trimmed to fit.'`
6. `question: 'How far ahead are alerts set?'`
   - `ios`, no action, text:
     `'Athan fills the days ahead with as many alerts as iOS lets one app hold. The fewer prayers you switch on, the further ahead it reaches. Opening the app tops it up.'`
   - `android`, no action, text:
     `'Athan fills the days ahead with as many alerts as it may hold at once. The fewer prayers you switch on, the further ahead it reaches. Opening the app tops it up.'`
7. `question: 'I restarted my phone and heard nothing.'`
   - `ios`: `null`
   - `android`, no action, text:
     `'Android clears every alarm when the phone restarts, and some phones stop Athan setting them again on its own. Open Athan once after a restart.'`
8. `question: 'The athan plays too quietly.'`
   - `ios`: `null`
   - `android`, no action, text:
     `'The athan plays at your alarm volume rather than your ringer volume. Raise the alarm volume in your phone sound settings.'`
9. `question: 'My widget shows an old time.'`
   - `ios`, no action, text:
     `'A widget redraws on the schedule iOS gives it, so it can sit a while behind. Open Athan to refresh it. After three days with no refresh a widget reads Out of date rather than showing a time that may be wrong.'`
   - `android`, no action, text:
     `'A widget redraws on the schedule Android gives it, so it can sit a while behind. Open Athan to refresh it. After three days with no refresh a widget reads Out of date rather than showing a time that may be wrong.'`
10. `question: 'Can I change the athan sound?'`
    - `ios` and `android`, no action, the same text:
      `'Yes. Open Settings from the mosque button, then Change athan, and pick the one you want.'`

**Where each claim comes from**, so no line of it is invented. This table is for you, not for the file:

| Answer | Measured in |
| --- | --- |
| 30 second sound cap | `ai/AGENTS.md` [2026-09-09]: every audio file is under the cap by decoded duration, because a longer one falls back to the default tone |
| No app setting plays through silent | `ai/plans/27-silent-mode-bypass/FINDINGS.md`, "THE REAL BOUNDARY" |
| The Focus allow-list path on iOS | same file, route A of the Focus table |
| Android needs DND access granted | same file, open item 2 |
| Alarm volume | same file, open item 3 |
| Alerts reach as far as the budget allows | `ai/AGENTS.md` [2026-09-27]: the rolling buffer is a request budget, and a lighter user is covered further |
| A restart clears every alarm | `ai/AGENTS.md` [2026-09-23], the 8T incident |
| Three days, then Out of date | `ai/AGENTS.md`, the horizon note: `TIMELINE_DAYS` is 3 and the terminal card reads `Out of date` |
| Low Power Mode disables Background App Refresh | `27-silent-mode-bypass/FINDINGS.md`, the background-status correction |

**The file's doc comment**, at the top, because why this exists is not evident from the content:

```ts
/**
 * Help content - the answers to "why did I not hear the athan?"
 *
 * Three of the causes are OS settings no code can change, so the app explains
 * them instead of trying to work around them (owner, 2026-09-27). Every claim
 * here was measured: session 27 for the mute switch, Do Not Disturb and the
 * 30 second sound cap, session 28 for how far ahead alerts are set, session 20
 * for the widget horizon.
 *
 * @see ai/plans/27-silent-mode-bypass/FINDINGS.md
 */
```

One more comment, above `HELP_ENTRIES`: `/** Ordered by how often each one turns out to be the cause */`.
No other comment. In particular, no comment restating what a field holds.

### 5.2 `device/notifications.ts`

Add one function, immediately above `export const updateAndroidChannel` (anchor `1-1.txt` is in `Modal.tsx`; find
this place by the text `export const updateAndroidChannel = async (sound: number) => {`).

- Name: `openAppSettings`
- Signature: `() => Promise<boolean>`
- Answers: `true` when the system opened this app's own settings page, `false` when it could not.
- Must never: throw; check `Platform.OS`, because the page exists on both platforms; be awaited for a UI
  decision.
- Logs, on failure, with this exact text and shape, matching `openDndAccessSettings` beside it:
  `logger.error('NOTIFICATION: Failed to open the app settings:', error)`
- Body: `await Linking.openSettings()` in a `try`, returning `true`; the `catch` logs and returns `false`.
- Doc comment, three lines at most:

  ```ts
  /**
   * Opens this app's own page in the system settings, where the user turns notifications and
   * background activity back on. Answers false when no such screen opens, so a caller never
   * claims to have sent the user somewhere.
   */
  ```

`Linking` and `logger` are already imported in that file. Add no import.

### 5.3 `stores/ui.ts`

Two additions, found by anchors `1-2.txt` and `1-3.txt`.

- Above `/** Timestamp of last update check (persisted) */`:

  ```ts
  /** Whether the Help modal should be shown */
  export const popupHelpEnabledAtom = atom(false);
  ```

- Above `/** Sets the timestamp of the last app update check */`:

  ```ts
  /** Sets whether the Help modal should be shown */
  export const setPopupHelpEnabled = (enabled: boolean) => store.set(popupHelpEnabledAtom, enabled);
  ```

Session-scoped, like `popupWhatsNewEnabledAtom` and `popupUpdateEnabledAtom`: a plain `atom`, never
`atomWithStorageBoolean`. Nothing about Help is remembered between launches.

### 5.4 `components/modals/Help.tsx` (new)

- Default export: `ModalHelp`
- Props: `{ visible: boolean; onClose: () => void }`, declared as a local `type Props`, exactly as
  `Update.tsx` and `WhatsNew.tsx` do.
- Renders: `<Modal visible={visible} title='Help'>` holding a `ScrollView` of the platform's topics, then the
  Close `Pressable` OUTSIDE the `ScrollView`, so it can never scroll away.
- Reads the platform once: `const topics = getHelpTopics(Platform.OS === 'android' ? 'android' : 'ios');`. The
  comparison is explicit because `Platform.OS` has five possible values and `HelpAction`'s two platforms are
  the only ones this app ships.
- Height cap: one module constant

  ```ts
  /** Share of the screen the scrolling answers may take, so the card fits every size */
  const ANSWERS_HEIGHT_SHARE = 0.55;
  ```

  and `style={{ maxHeight: height * ANSWERS_HEIGHT_SHARE }}` on the `ScrollView`, with `height` from
  `useWindowDimensions()` (import from `@/hooks/useWindowDimensions`, never from `react-native` directly, which
  is what every other consumer in this repo does). Also `showsVerticalScrollIndicator={false}`.
- Each topic renders, keyed on its question: a `Text` of the question, a `Text` of the answer, and, when the
  topic declares an action, a `Pressable` whose text and `accessibilityLabel` are both
  `HELP_ACTION_LABELS[action]`, with `accessibilityRole='button'`.
- Destructure in the `map` callback: `{ question, text, action }`. Do not read `topic.action` twice, and never
  cast it: destructuring is what narrows it for the label lookup.
- One module-level helper, because a button must choose between two openers:

  - Name: `runAction`
  - Signature: `(action: HelpAction) => void`
  - Answers: nothing. Calls `openDndAccessSettings()` for `'dndAccess'` and `openAppSettings()` otherwise.
  - Must never: `await` either call, or report their result. Nothing on screen changes either way, and both
    log their own failure.

- The Close button: `accessibilityRole='button'`, `accessibilityLabel='Close'`, text `Close`, and the same style
  shape as `WhatsNew.tsx`'s Continue button (`SIZE.modal.buttonWidth`, `alignSelf: 'center'`,
  `paddingVertical: SPACING.md`, `RADIUS.lg`, `COLORS.light.buttonPrimary`, text
  `COLORS.light.background` at `TEXT.sizeSmall` in `TEXT.family.medium`), plus `marginTop: SPACING.lg` to
  separate it from the scrolling answers.
- Styling of the answers, in `StyleSheet.create`: the question at `TEXT.sizeSmall` in `TEXT.family.medium` and
  `COLORS.light.text`; the answer at `TEXT.sizeDetail` in `TEXT.family.regular` and `COLORS.light.textSecondary`
  with `TEXT.lineHeight.default`; both with `TEXT.letterSpacing.default`; each topic `marginBottom: SPACING.xl`;
  the action button `alignSelf: 'flex-start'`, `RADIUS.md`, `COLORS.light.buttonCancel`, its text
  `COLORS.light.textSecondary` at `TEXT.sizeDetail` in `TEXT.family.medium`. This matches `WhatsNew.tsx`'s
  hierarchy exactly, which is why no new colour or size is introduced.
- **No comment on any style value** (`ai/AGENTS.md` section 15). The only two comments in this file are the
  `ANSWERS_HEIGHT_SHARE` line above and nothing else.

### 5.5 `components/modals/index.ts`

Anchor `1-5.txt`. Add, keeping Biome's alphabetical export order intact for the file as it stands:

```ts
export { default as ModalHelp } from './Help';
```

Run `npx biome check --write components/modals/index.ts` and accept whatever order it settles on.

### 5.6 `app/index.tsx`

Four changes, the last found by anchor `1-4.txt`.

1. The modal import becomes `import { ModalHelp, ModalUpdate, ModalWhatsNew } from '@/components/modals';`
2. The `@/stores/ui` import gains `popupHelpEnabledAtom` and `setPopupHelpEnabled`.
3. Beside `const whatsNewVisible = useAtomValue(popupWhatsNewEnabledAtom);`, add
   `const helpVisible = useAtomValue(popupHelpEnabledAtom);`
4. Beside `handleContinueWhatsNew`, add

   ```ts
   const handleCloseHelp = () => {
     setPopupHelpEnabled(false);
   };
   ```

5. In the returned tree, immediately before the update prompt's comment line, add
   `{chromeDeferred && <ModalHelp visible={helpVisible} onClose={handleCloseHelp} />}`, and extend the nag's
   gate to `visible={updateAvailable && !whatsNewVisible && !helpVisible}`. The existing comment becomes
   `{/* Gated so the nag never stacks on the What's New or Help modal */}`.

`chromeDeferred` is what keeps the modal off the launch path, exactly as the other two modals are gated.

### 5.7 The invariant this step must keep

Every topic `getHelpTopics(os)` returns for the running platform is rendered, in order, with a button for each
action it declares and none for the answers that declare none, and `dndAccess` is offered on Android only.

## 6. Green

```bash
npx jest shared/__tests__/help.test.ts device/__tests__/androidChannelUpdate.test.ts stores/__tests__/ui.test.ts --watchman=false --selectProjects=unit
npx jest components/modals/__tests__/Help.test.tsx __tests__/app/index.test.tsx --watchman=false --selectProjects=components
```

Expected, every number measured in the planning session's scratch worktree:

- `npx jest shared/__tests__/help.test.ts --watchman=false --selectProjects=unit` prints
  `Tests:       11 passed, 11 total`;
- `npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components` prints
  `Tests:       10 passed, 10 total`;
- `npx jest __tests__/app/index.test.tsx --watchman=false --selectProjects=components` prints
  `Tests:       40 passed, 40 total`, being the file's 37 plus this step's three;
- `stores/__tests__/ui.test.ts` and `device/__tests__/androidChannelUpdate.test.ts` both pass, their combined
  total rising by 4 (one atom test, three opener tests).

Then:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Both exit 0. `it.each` over platform strings needs `as const`, or tsc rejects the assignment to `Platform.OS`.

## 7. Breaks

Save nothing: the script is already at
`ai/plans/29-help-faq-modal/scripts/breaks-1.sh`. Run it from the repository root:

```bash
bash ai/plans/29-help-faq-modal/scripts/breaks-1.sh
```

It must end `ALL AS EXPECTED: 1`. A `BREAK NOT APPLIED: <label>` line means the substitution matched nothing:
STOP and ask, and never reshape the code to fit a break.

## 8. Version and commit

```bash
node -e "const v=require('./package.json').version.split('.');v[2]=Number(v[2])+1;console.log(v.join('.'))"
```

Set that version in `app.json` (`expo.version`), `package.json` (`version`) and, if `android/` exists,
`android/app/build.gradle` (`versionName`). The gradle file is gitignored and never added, but
`shared/__tests__/versionLockstep.test.ts` fails if it differs.

Add, by name:

```bash
git add shared/help.ts shared/__tests__/help.test.ts components/modals/Help.tsx \
  components/modals/__tests__/Help.test.tsx components/modals/index.ts \
  device/notifications.ts device/__tests__/androidChannelUpdate.test.ts \
  stores/ui.ts stores/__tests__/ui.test.ts app/index.tsx __tests__/app/index.test.tsx \
  app.json package.json ai/plans/README.md ai/plans/29-help-faq-modal/PLAN.md ai/plans/29-help-faq-modal/LOG.md
```

Write this to `$TMPDIR/msg-1.txt`, replacing `<VERSION>`, and commit with
`git commit -F $TMPDIR/msg-1.txt` in the background:

```
<VERSION> - feat(help): a Help modal answering why an athan was not heard

Three of the four causes of a silent phone are OS settings no code can change,
so the app explains them instead of chasing each one as its own defect.

shared/help.ts holds ten questions, each with its own iOS and Android answer and
null where the question does not arise on that platform, so iOS shows eight and
Android ten. components/modals/Help.tsx renders the running platform's topics in
the existing modal card, with the answers scrolling inside a cap of 55% of the
window height so the Close button holds on every screen size.

Two answers open a settings screen. openDndAccessSettings already existed from
session 27; openAppSettings is new beside it, wrapping the Linking.openSettings
call hooks/useNotification.ts already makes, so no component reaches a platform
API directly.

The brief's copy claimed Android still sounds through the silent switch in most
cases. Session 27's own conclusion is the opposite, because
NotificationManagerService gates channel sound on ringer mode before it reads
the channel's AudioAttributes, so the shipped answer says plainly that no app
setting can play through it on either platform.

The update nag is now held back while Help is showing, as it already was for
What's New.
```

The hook runs the full suite and the coverage gate: the last `Tests:` line ends `passed, <n> total`, and four
`100%` coverage lines are present.

## 9. Review

Read `git show <sha>` back cold, as a stranger who did not write it, against this checklist:

1. `getHelpTopics` has the plan's name and signature, returns the plan's order, and drops an entry whose answer
   for that platform is `null`.
2. Every one of the 18 user-facing strings is byte-for-byte what part 5.3 gives, punctuation included.
3. No answer claims anything the part 5.3 provenance table does not cover.
4. `HELP_ACTION_LABELS` reads `'Open Settings'` and `'Grant Do Not Disturb access'`.
5. `openAppSettings` returns `false` on failure and logs
   `'NOTIFICATION: Failed to open the app settings:'` exactly, and checks no platform.
6. `popupHelpEnabledAtom` is a plain `atom(false)`, not a stored atom.
7. The Close button sits outside the `ScrollView`, and the `ScrollView`'s `maxHeight` derives from
   `useWindowDimensions`, imported from `@/hooks/useWindowDimensions`.
8. `runAction` awaits neither opener and returns nothing.
9. `topic.action` is destructured, not read twice, and nowhere cast.
10. The update prompt's `visible` reads `updateAvailable && !whatsNewVisible && !helpVisible`.
11. `shared/help.ts` imports nothing at all.
12. Every comment explains why. There is no comment on a style value, none stating what a field holds, and none
    longer than the three-line doc comments the plan gives.
13. No visual outside the new modal changed: no colour, size, spacing, icon or animation anywhere else.
14. Nothing beyond part 3's file list changed.
15. Every acceptance criterion in parts 6 and 7 is met.

A clean read finds nothing outside those fifteen. A finding is handled by `EXECUTOR-BRIEF.md` section 4,
item 8: a fix section 10 gives word for word, or a fix meeting all three of that item's conditions, is applied;
anything else is a STOP.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff feat/29-help-modal -m "Merge feat/29-help-modal into uat-2: the Help modal, its content and its two settings links"
```

## 11. Done when

- `npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components` prints
  `Tests:       10 passed, 10 total`;
- `npx jest shared/__tests__/help.test.ts --watchman=false --selectProjects=unit` prints
  `Tests:       11 passed, 11 total`;
- `bash ai/plans/29-help-faq-modal/scripts/breaks-1.sh` ends `ALL AS EXPECTED: 1`;
- `git log --oneline -1 uat-2` names the merge above;
- `git status --porcelain` lists nothing but `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

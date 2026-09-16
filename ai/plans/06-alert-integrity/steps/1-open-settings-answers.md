# Step 1: Open Settings always answers, and reads the permission once the user is back (finding 79)

This file is part of `ai/plans/06-alert-integrity/PLAN.md`. Run every command from `/Users/muji/repos/rn.athan.uk`.

0. **Anchor check.** Run `bash ai/plans/06-alert-integrity/scripts/check-anchors.sh 1`. Expected: one line per
   anchor ending ` 1`, then `ANCHORS OK`. Any count other than `1`: this is NEEDS REPLAN (`EXECUTOR-BRIEF.md` section
   1, item 4).

1. **Goal:** the notification dialog's "Open Settings" button always settles its promise: no when Settings cannot open or the permission cannot be read, and otherwise the permission as read the first time the app is active again after leaving for Settings.

2. **Branch:** `git checkout -b fix/audit-79-open-settings-answers uat-2`.

3. **Files.** Only these change, apart from `app.json`, `package.json`, the local `android/app/build.gradle` and the three plan files:
   - `hooks/useNotification.ts`;
   - `hooks/__tests__/notificationSettingsFallback.test.ts`;
   - `hooks/__tests__/useNotification.test.ts`;

4. **Tests first (red).**
   1. Replace the whole of `hooks/__tests__/notificationSettingsFallback.test.ts` with the saved file:
      `cp ai/plans/06-alert-integrity/scripts/tests/1-notificationSettingsFallback.test.ts.txt hooks/__tests__/notificationSettingsFallback.test.ts`
      (the saved file ends `.txt` so that tsc, Biome and the coverage gate leave it alone).
      Its full contents:

```ts
/**
 * Unit tests for the permission fallbacks in hooks/useNotification.ts
 *
 * When notifications are refused, the settings dialog opens the app's own settings page on both platforms and reads the
 * permission again once the app is back in the foreground, because the native call answers as soon as Settings opens.
 * A dialog closed without a button, a Settings screen that cannot open, or a permission API that throws counts as a
 * refusal: no alert is saved that could never go off, and the caller is never left waiting for an answer.
 */

import * as Notifications from 'expo-notifications';
import { Alert, AppState, type AppStateStatus, Linking, Platform } from 'react-native';

import { AlertType, ScheduleType } from '@/shared/types';

import { useNotification } from '../useNotification';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockSetPrayerAlertType = jest.fn();
const mockUpdatePrayerNotifications = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('@/stores/notifications', () => ({
  setPrayerAlertType: (...args: unknown[]) => mockSetPrayerAlertType(...args),
  setReminderAlertType: jest.fn(),
  setReminderInterval: jest.fn(),
  updatePrayerNotifications: (...args: unknown[]) => mockUpdatePrayerNotifications(...args),
}));

jest.mock('@/device/notifications', () => ({}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const alertDialog = Alert as unknown as { alert: jest.Mock; _pressButton: (text: string) => Promise<void> };
const listenToAppState = AppState.addEventListener as jest.Mock;
const platform = Platform as { OS: string };
const shippedOS = platform.OS;

/** Lets the permission reads settle so the dialog is up */
const settle = () => new Promise((resolve) => setImmediate(resolve));

/** Reports app state changes to every listener the dialog added, in order, as the platform does */
const reportAppStates = (...states: AppStateStatus[]) => {
  for (const [, listener] of listenToAppState.mock.calls) {
    for (const state of states) listener(state);
  }
};

/** What a promise has answered so far, read without waiting for it */
const answerSoFar = async <T>(promise: Promise<T>): Promise<{ answered: boolean; value?: T }> => {
  let result: { answered: boolean; value?: T } = { answered: false };
  promise.then((value) => {
    result = { answered: true, value };
  });
  await settle();
  return result;
};

/** Notifications refused on the first read and at the prompt, so the settings dialog comes up */
const refuseUntilSettings = () => {
  getPermissions.mockResolvedValueOnce({ status: 'denied' });
  requestPermissions.mockResolvedValue({ status: 'denied' });
};

beforeEach(() => {
  jest.clearAllMocks();
  getPermissions.mockReset();
  requestPermissions.mockReset();
});

afterEach(() => {
  platform.OS = shippedOS;
});

describe('the settings dialog', () => {
  it.each(['ios', 'android'])(
    "on %s, opens the app's own settings page and answers with the permission read once the app is back",
    async (os) => {
      platform.OS = os;
      refuseUntilSettings();
      getPermissions.mockResolvedValueOnce({ status: 'granted' });
      const answer = useNotification().ensurePermissions();
      await settle();

      const pressed = alertDialog._pressButton('Open Settings');
      await settle();
      reportAppStates('background', 'active');
      await pressed;

      expect(await answerSoFar(answer)).toEqual({ answered: true, value: true });
      expect(getPermissions).toHaveBeenCalledTimes(2);
      expect((Linking.openSettings as jest.Mock).mock.calls).toEqual([[]]);
      expect(Linking.sendIntent).not.toHaveBeenCalled();
    }
  );

  // the state the app reports on leaving for Settings: Android reports background, iOS inactive first
  it.each<AppStateStatus>(['background', 'inactive'])(
    'reads the permission only once the app has gone %s for Settings and come back',
    async (away) => {
      refuseUntilSettings();
      getPermissions.mockResolvedValueOnce({ status: 'granted' });
      const answer = useNotification().ensurePermissions();
      await settle();
      const pressed = alertDialog._pressButton('Open Settings');
      await settle();

      const whileInSettings = { reads: getPermissions.mock.calls.length, ...(await answerSoFar(answer)) };
      reportAppStates(away, 'active');
      await pressed;

      expect(whileInSettings).toEqual({ reads: 1, answered: false });
      expect(await answerSoFar(answer)).toEqual({ answered: true, value: true });
    }
  );

  it('does not take the app reporting active before it has left for Settings as the return', async () => {
    refuseUntilSettings();
    getPermissions.mockResolvedValueOnce({ status: 'granted' });
    const answer = useNotification().ensurePermissions();
    await settle();
    alertDialog._pressButton('Open Settings');
    await settle();

    reportAppStates('active');

    expect(await answerSoFar(answer)).toEqual({ answered: false });
    expect(getPermissions).toHaveBeenCalledTimes(1);
  });

  it('reads the return even when the app has left and come back before Settings answers that it opened', async () => {
    refuseUntilSettings();
    getPermissions.mockResolvedValueOnce({ status: 'granted' });
    (Linking.openSettings as jest.Mock).mockImplementationOnce(async () => {
      reportAppStates('inactive', 'background', 'active');
    });
    const answer = useNotification().ensurePermissions();
    await settle();

    await alertDialog._pressButton('Open Settings');

    expect(await answerSoFar(answer)).toEqual({ answered: true, value: true });
  });

  it('answers no when Android closes the dialog without a button', async () => {
    refuseUntilSettings();
    const answer = useNotification().ensurePermissions();
    await settle();

    const [, , , options] = alertDialog.alert.mock.calls[0];
    options.onDismiss();

    expect(await answerSoFar(answer)).toEqual({ answered: true, value: false });
  });

  it('stops listening to app state changes once the app is back', async () => {
    refuseUntilSettings();
    getPermissions.mockResolvedValueOnce({ status: 'granted' });
    const answer = useNotification().ensurePermissions();
    await settle();
    const pressed = alertDialog._pressButton('Open Settings');
    await settle();

    reportAppStates('background', 'active');
    await pressed;
    await answer;

    expect(listenToAppState.mock.results[0].value.remove).toHaveBeenCalledTimes(1);
  });

  // the platform, and the message its native call rejects with
  it.each([
    ['ios', 'Unable to open app settings'],
    ['android', 'Could not open the Settings'],
  ])(
    'on %s, answers no and stops listening when Settings cannot open, without reading the permission again',
    async (os, message) => {
      platform.OS = os;
      refuseUntilSettings();
      (Linking.openSettings as jest.Mock).mockRejectedValueOnce(new Error(message));
      const answer = useNotification().ensurePermissions();
      await settle();

      await alertDialog._pressButton('Open Settings');

      expect(await answerSoFar(answer)).toEqual({ answered: true, value: false });
      expect(getPermissions).toHaveBeenCalledTimes(1);
      expect(listenToAppState.mock.results[0].value.remove).toHaveBeenCalledTimes(1);
    }
  );

  it('answers no when the permission cannot be read once the app is back', async () => {
    refuseUntilSettings();
    getPermissions.mockRejectedValueOnce(new Error('unavailable'));
    const answer = useNotification().ensurePermissions();
    await settle();
    const pressed = alertDialog._pressButton('Open Settings');
    await settle();

    reportAppStates('background', 'active');
    await pressed;

    expect(await answerSoFar(answer)).toEqual({ answered: true, value: false });
  });
});

describe('a permission API that throws', () => {
  it.each<[string, () => void]>([
    ['reading the status', () => getPermissions.mockRejectedValue(new Error('unavailable'))],
    [
      'asking for permission',
      () => {
        getPermissions.mockResolvedValue({ status: 'denied' });
        requestPermissions.mockRejectedValue(new Error('unavailable'));
      },
    ],
  ])('while %s counts as a refusal, without offering Settings', async (_, arrange) => {
    arrange();

    await expect(useNotification().ensurePermissions()).resolves.toBe(false);
    expect(alertDialog.alert).not.toHaveBeenCalled();
  });

  it('leaves an alert being turned on unsaved and unscheduled', async () => {
    getPermissions.mockRejectedValue(new Error('unavailable'));

    const committed = await useNotification().commitAlertMenuChanges(
      ScheduleType.Standard,
      0,
      'Fajr',
      'الفجر',
      { atTimeAlert: AlertType.Off, reminderAlert: AlertType.Off, reminderInterval: 15 },
      { atTimeAlert: AlertType.Sound, reminderAlert: AlertType.Off, reminderInterval: 15 }
    );

    expect(committed).toBe(false);
    expect(mockSetPrayerAlertType).not.toHaveBeenCalled();
    expect(mockUpdatePrayerNotifications).not.toHaveBeenCalled();
  });
});
```

   2. Apply the six anchors below to `hooks/__tests__/useNotification.test.ts`, in order.

   Anchor `1-3` in `hooks/__tests__/useNotification.test.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-3.txt`), before:

```ts
import { Alert, Linking } from 'react-native';
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-3.txt`):

```ts
import { Alert, AppState, Linking } from 'react-native';
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/__tests__/useNotification.test.ts ai/plans/06-alert-integrity/scripts/anchors/1-3.txt ai/plans/06-alert-integrity/scripts/changes/1-3.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-3.txt to hooks/__tests__/useNotification.test.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-3; what do I do?".

   Anchor `1-4` in `hooks/__tests__/useNotification.test.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-4.txt`), before:

```ts
// Cast Alert to our mock type for test access
const alertMock = Alert as unknown as AlertMock;
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-4.txt`):

```ts
// Cast Alert to our mock type for test access
const alertMock = Alert as unknown as AlertMock;

/** The app leaving for Settings and coming back, reported to every app state listener the dialog added */
const returnFromSettings = () => {
  for (const [, listener] of (AppState.addEventListener as jest.Mock).mock.calls) {
    listener('background');
    listener('active');
  }
};
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/__tests__/useNotification.test.ts ai/plans/06-alert-integrity/scripts/anchors/1-4.txt ai/plans/06-alert-integrity/scripts/changes/1-4.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-4.txt to hooks/__tests__/useNotification.test.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-4; what do I do?".

   Anchor `1-5` in `hooks/__tests__/useNotification.test.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-5.txt`), before:

```ts
      await alertMock._pressButton('Open Settings');

      await permissionPromise;

      expect(Linking.openSettings).toHaveBeenCalled();
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-5.txt`):

```ts
      const pressed = alertMock._pressButton('Open Settings');
      await new Promise((resolve) => setTimeout(resolve, 10));
      returnFromSettings();
      await pressed;

      await permissionPromise;

      expect(Linking.openSettings).toHaveBeenCalled();
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/__tests__/useNotification.test.ts ai/plans/06-alert-integrity/scripts/anchors/1-5.txt ai/plans/06-alert-integrity/scripts/changes/1-5.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-5.txt to hooks/__tests__/useNotification.test.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-5; what do I do?".

   Anchor `1-6` in `hooks/__tests__/useNotification.test.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-6.txt`), before:

```ts
      await alertMock._pressButton('Open Settings');

      const result = await permissionPromise;
      expect(result).toBe(true);
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-6.txt`):

```ts
      const pressed = alertMock._pressButton('Open Settings');
      await new Promise((resolve) => setTimeout(resolve, 10));
      returnFromSettings();
      await pressed;

      const result = await permissionPromise;
      expect(result).toBe(true);
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/__tests__/useNotification.test.ts ai/plans/06-alert-integrity/scripts/anchors/1-6.txt ai/plans/06-alert-integrity/scripts/changes/1-6.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-6.txt to hooks/__tests__/useNotification.test.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-6; what do I do?".

   Anchor `1-7` in `hooks/__tests__/useNotification.test.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-7.txt`), before:

```ts
      await alertMock._pressButton('Open Settings');

      const result = await permissionPromise;
      expect(result).toBe(false);
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-7.txt`):

```ts
      const pressed = alertMock._pressButton('Open Settings');
      await new Promise((resolve) => setTimeout(resolve, 10));
      returnFromSettings();
      await pressed;

      const result = await permissionPromise;
      expect(result).toBe(false);
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/__tests__/useNotification.test.ts ai/plans/06-alert-integrity/scripts/anchors/1-7.txt ai/plans/06-alert-integrity/scripts/changes/1-7.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-7.txt to hooks/__tests__/useNotification.test.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-7; what do I do?".

   Anchor `1-8` in `hooks/__tests__/useNotification.test.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-8.txt`), before:

```ts
      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Notifications',
        'Prayer time notifications are disabled. Would you like to enable them in settings?',
        expect.any(Array)
      );
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-8.txt`):

```ts
      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Notifications',
        'Prayer time notifications are disabled. Would you like to enable them in settings?',
        expect.any(Array),
        { onDismiss: expect.any(Function) }
      );
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/__tests__/useNotification.test.ts ai/plans/06-alert-integrity/scripts/anchors/1-8.txt ai/plans/06-alert-integrity/scripts/changes/1-8.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-8.txt to hooks/__tests__/useNotification.test.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-8; what do I do?".

   3. Run
      `npx jest hooks/__tests__/notificationSettingsFallback.test.ts hooks/__tests__/useNotification.test.ts --watchman=false --selectProjects=unit > $TMPDIR/red-1.log 2>&1`.
   4. Expected in `$TMPDIR/red-1.log`: the line `Tests:       10 failed, 87 passed, 97 total`, and these failing tests (the
      one marked twice is listed twice, once for its assertion and once for the rejection nothing handled):
      - `showSettingsDialog › Alert dialog behavior › shows alert with correct title and message`
      - `the settings dialog › on android, opens the app's own settings page and answers with the permission read once the app is back`
      - `the settings dialog › reads the permission only once the app has gone background for Settings and come back`
      - `the settings dialog › reads the permission only once the app has gone inactive for Settings and come back`
      - `the settings dialog › does not take the app reporting active before it has left for Settings as the return`
      - `the settings dialog › answers no when Android closes the dialog without a button`
      - `the settings dialog › stops listening to app state changes once the app is back`
      - `the settings dialog › on ios, answers no and stops listening when Settings cannot open, without reading the permission again`
      - `the settings dialog › on android, answers no and stops listening when Settings cannot open, without reading the permission again`
      - `the settings dialog › answers no when the permission cannot be read once the app is back` (twice)
   5. Any other result: STOP and ask "the step 1 red run printed <Tests line>; the plan expects 10 failed, 87 passed; what do I do?".

5. **Change.**
   Anchor `1-1` in `hooks/useNotification.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-1.txt`), before:

```ts
import { Alert, Linking, Platform } from 'react-native';
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-1.txt`):

```ts
import { Alert, AppState, Linking } from 'react-native';
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/useNotification.ts ai/plans/06-alert-integrity/scripts/anchors/1-1.txt ai/plans/06-alert-integrity/scripts/changes/1-1.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-1.txt to hooks/useNotification.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-1; what do I do?".

   Anchor `1-2` in `hooks/useNotification.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/1-2.txt`), before:

```ts
/**
 * Shows a dialog prompting user to enable notifications in settings
 * @returns Promise resolving to true if user grants permission after visiting settings
 */
const showSettingsDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Enable Notifications',
      'Prayer time notifications are disabled. Would you like to enable them in settings?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Open Settings',
          onPress: async () => {
            if (Platform.OS === 'ios') await Linking.openSettings();
            else await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS');

            // Check if permissions were granted after returning from settings
            const { status: finalStatus } = await Notifications.getPermissionsAsync();
            resolve(finalStatus === 'granted');
          },
        },
      ]
    );
  });
};
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/1-2.txt`):

```ts
/**
 * Resolves the first time the app is active again after it has left the foreground
 *
 * Listening starts before Settings opens, so the move to the background that opening it causes cannot be missed. An
 * active state with no departure before it is not a return.
 *
 * @returns The return, and a way to stop listening when Settings never opened
 */
const listenForReturnToApp = () => {
  let markReturned!: () => void;
  const returned = new Promise<void>((resolve) => {
    markReturned = resolve;
  });
  let leftApp = false;

  const subscription = AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      leftApp = true;
      return;
    }
    if (!leftApp) return;

    subscription.remove();
    markReturned();
  });

  return { returned, stop: () => subscription.remove() };
};

/**
 * Shows a dialog prompting user to enable notifications in settings
 * @returns Promise resolving to true if the permission is granted once the user is back from settings, and to false
 *   when the user cancels or dismisses the dialog, Settings cannot open, or the permission cannot be read, so the
 *   caller never waits forever
 */
const showSettingsDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Enable Notifications',
      'Prayer time notifications are disabled. Would you like to enable them in settings?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Open Settings',
          onPress: async () => {
            const returnToApp = listenForReturnToApp();

            try {
              // The app's own settings page on both platforms: Android closes its notification settings page at once
              // when the request names no package
              await Linking.openSettings();
            } catch (error) {
              returnToApp.stop();
              logger.error('NOTIFICATION: Failed to open notification settings:', error);
              resolve(false);
              return;
            }

            // Opening answers as Settings opens, when the permission cannot have changed yet
            await returnToApp.returned;

            try {
              const { status: finalStatus } = await Notifications.getPermissionsAsync();
              resolve(finalStatus === 'granted');
            } catch (error) {
              logger.error('NOTIFICATION: Failed to read notification permissions after settings:', error);
              resolve(false);
            }
          },
        },
      ],
      // Android reports a dialog closed without a button, such as by a second dialog replacing it, only here
      { onDismiss: () => resolve(false) }
    );
  });
};
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py hooks/useNotification.ts ai/plans/06-alert-integrity/scripts/anchors/1-2.txt ai/plans/06-alert-integrity/scripts/changes/1-2.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/1-2.txt to hooks/useNotification.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 1-2; what do I do?".


6. **Green.**
   1. Run the red command again, writing to `$TMPDIR/green-1.log`. Expected: `Tests:       97 passed, 97 total`.
   2. Run
      `npx jest hooks/__tests__/notificationSettingsFallback.test.ts hooks/__tests__/useNotification.test.ts hooks/__tests__/notificationForegroundHandler.test.ts --watchman=false --selectProjects=unit --coverage --collectCoverageFrom=hooks/useNotification.ts --coverageReporters=text > $TMPDIR/cov-1.log 2>&1`.
      Expected: `Tests:       98 passed, 98 total` and the row `useNotification.ts |     100 |      100 |     100 |     100 |`.
   3. Run `npx tsc --noEmit`. Expected: exit 0 and no output.
   4. Run `npx biome check . --error-on-warnings`. Expected: exit 0, ending `No fixes applied.`
   5. Any difference: STOP and ask "step 1 green printed <line>; what do I do?".

7. **Breaks.**
   1. Run `bash ai/plans/06-alert-integrity/scripts/breaks-1.sh > $TMPDIR/breaks-1.log 2>&1` in the background. It
      takes about 60 seconds.
   2. Expected in `$TMPDIR/breaks-1.log`: 10 lines starting `BREAK 1` that each say `AS EXPECTED`, and the last line
      `ALL AS EXPECTED: 1`. A line saying `NOT AS EXPECTED`: STOP and ask "break <name> did not fail as the plan says:
      <that line>; what do I do?".
   3. Run `git status --porcelain`. Expected: only this step's files and the three plan files. Anything else: STOP.

   The script, saved as `ai/plans/06-alert-integrity/scripts/breaks-1.sh`:

```bash
#!/bin/bash
# Step 1 breaks: run from /Users/muji/repos/rn.athan.uk with bash ai/plans/06-alert-integrity/scripts/breaks-1.sh
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
T1="hooks/__tests__/notificationSettingsFallback.test.ts hooks/__tests__/useNotification.test.ts"
brk 1a hooks/useNotification.ts 's/\n\s*returnToApp\.stop\(\);//' unit "on ios, answers no and stops listening when Settings cannot open|on android, answers no and stops listening when Settings cannot open" $T1
brk 1b hooks/useNotification.ts "s/if \(state !== 'active'\) \{/if (state === 'background') {/" unit "reads the permission only once the app has gone inactive for Settings and come back" $T1
brk 1c hooks/useNotification.ts 's/\n\s*if \(!leftApp\) return;//' unit "does not take the app reporting active before it has left for Settings as the return" $T1
brk 1d hooks/useNotification.ts 's/\n\s*subscription\.remove\(\);\n(\s*markReturned\(\);)/\n$1/' unit "stops listening to app state changes once the app is back" $T1
brk 1e hooks/useNotification.ts 's/\n\s*await returnToApp\.returned;//' unit "reads the permission only once the app has gone background for Settings and come back|reads the permission only once the app has gone inactive for Settings and come back|does not take the app reporting active before it has left for Settings as the return" $T1
brk 1f hooks/useNotification.ts "s/(after settings:', error\);)\n\s*resolve\(false\);/\$1/" unit "answers no when the permission cannot be read once the app is back" $T1
brk 1g hooks/useNotification.ts "s/(open notification settings:', error\);)\n\s*resolve\(false\);/\$1/" unit "on ios, answers no and stops listening when Settings cannot open|on android, answers no and stops listening when Settings cannot open" $T1
brk 1h hooks/useNotification.ts "s/resolve\(finalStatus === 'granted'\);/resolve(true);/" unit "returns false when permission still denied after returning from settings" $T1
brk 1i hooks/useNotification.ts 's/\],\n\s*\/\/ Android reports a dialog closed[^\n]*\n\s*\{ onDismiss: \(\) => resolve\(false\) \}\n/]\n/' unit "answers no when Android closes the dialog without a button" $T1
brk 1j hooks/useNotification.ts 's/const returnToApp = listenForReturnToApp\(\);\n(\n\s*try \{\n(?:\s*\/\/[^\n]*\n)*\s*await Linking\.openSettings\(\);)/let returnToApp = { returned: Promise.resolve(), stop: () => {} };\n$1\n              returnToApp = listenForReturnToApp();/' unit "reads the return even when the app has left and come back before Settings answers that it opened" $T1
echo "ALL AS EXPECTED: $all"
```

8. **Version and commit.**
   1. Run `bash ai/plans/06-alert-integrity/scripts/set-version.sh`. Expected: two lines, `VERSION <x.y.z>` and
      `VERSIONS MATCH`. Any other output: STOP and ask "set-version.sh printed <output>; how do I set the version?".
   2. Add exactly these files by name: `hooks/useNotification.ts`, `hooks/__tests__/notificationSettingsFallback.test.ts`, `hooks/__tests__/useNotification.test.ts`, `app.json`, `package.json`, and `ai/plans/README.md`,
      `ai/plans/06-alert-integrity/PLAN.md` and `ai/plans/06-alert-integrity/LOG.md` when this session changed them.
      Run `git status --porcelain` afterwards. Every changed file must be staged (first column `M` or `A`, second
      column a space). Any other line: STOP and ask "git status shows <line> before the step 1 commit; what do I do?".
   3. Write the commit message below to `$TMPDIR/msg-1.txt`, with `<VERSION>` replaced by the version
      `set-version.sh` printed.
   4. Run `git commit -F $TMPDIR/msg-1.txt > $TMPDIR/commit-1.log 2>&1` in the background, with the hang check from
      `EXECUTOR-BRIEF.md` section 3.
   5. Expected in `$TMPDIR/commit-1.log`: the last `Tests:` line ends `passed, <n> total` with no `failed`; the
      lines `Statements   : 100%`, `Branches     : 100%`, `Functions    : 100%` and `Lines        : 100%`; no line
      starting `Coverage gate:`. If only `shared/__tests__/audioMatrix.test.ts` timed out, follow `EXECUTOR-BRIEF.md`
      section 3. Any other failure: STOP and ask "the step 1 commit failed with <first failing line>; what do I do?".

   The commit message:

```text
<VERSION> - fix(notifications): Open Settings always answers, and reads the permission once the user is back

Finding 79. The Open Settings button of the notification dialog awaited the native call that opens Settings and read
the permission straight after it. When that call rejected, or the read threw, the dialog's promise never settled, so
tapping the bell of a prayer saved Off did nothing. The call answers as Settings opens, so the read also saw the answer
from before the user changed anything. On Android the request named no package, and Android 9 closes its app
notification page at once without one (seen on the OnePlus 3T).

- Both platforms open the app's own settings page with Linking.openSettings, which Android opens for the right app
  (the owner's choice).
- A failure to open Settings, or to read the permission, answers no, and the app state listener is removed. A dialog
  Android closes without a button also answers no.
- The permission is read the first time the app is active again after leaving the foreground. An active state with no
  departure before it is not a return, and listening starts before Settings opens.
- notificationSettingsFallback.test.ts covers both platforms, every failure, the dismissal, the return rule and the
  listener's removal. The older tests in useNotification.test.ts that press Open Settings now report the return, and
  the dialog's title test expects its dismissal option.
```

9. **Review.**
   Spawn a `Code Reviewer` subagent, isolation `worktree`, with no `model`, and this prompt, with `<sha>` replaced by the
   step 1 commit's sha:

```text
Run git checkout --detach <sha>. Your worktree starts at the wrong branch.

You review one commit in the rn.athan.uk repository, a React Native prayer-times app. The commit is step 1 of the plan
ai/plans/06-alert-integrity/PLAN.md, executed by another model. Read these files in full, with no partial reads:
ai/plans/06-alert-integrity/steps/1-open-settings-answers.md, __tests__/README.md, hooks/useNotification.ts, hooks/__tests__/notificationSettingsFallback.test.ts, hooks/__tests__/useNotification.test.ts.

Check each item and report every problem you find:
1. `git show <sha>` changes exactly the files the step's "Files" part lists, plus app.json and package.json, and
   plan files under ai/plans/ only where they record status or the log.
2. The source and test changes equal the step's "Change" and "Tests first" parts character for character. Compare the
   anchors in ai/plans/06-alert-integrity/scripts/anchors/ and the changes in scripts/changes/ and scripts/tests/ with
   the committed files.
3. The version in app.json and package.json is the next patch after the parent commit's package.json, and both match.
4. The commit message equals the step's message with <VERSION> filled in.
5. The dialog's promise settles on every path (Cancel, the dialog dismissed without a button, Settings failing to open, the permission read failing, the return), the app state listener is removed on every path that added it, listening starts before Settings opens, and the permission is never read before the app has left and come back.
6. Every new test follows __tests__/README.md, and would fail if the line it guards were broken.

Reply with numbered findings (file, line, problem, exact fix), then a final line that is exactly "merge" or
"fix first".
```

   A "merge" verdict is a final line that is exactly `merge`. On "fix first", apply only a fix that `PLAN.md` section 10
   gives word for word; any other finding is a STOP (`EXECUTOR-BRIEF.md` section 4, item 8).

10. **Merge.**
   `git checkout uat-2 && git merge --no-ff fix/audit-79-open-settings-answers -m "Merge fix/audit-79-open-settings-answers into uat-2: Open Settings always answers, reviewed"`

11. **Done when.**
   1. `git branch --show-current` prints `uat-2`.
   2. `git log -1 --format=%s` prints `Merge fix/audit-79-open-settings-answers into uat-2: Open Settings always answers, reviewed`.
   3. `git status --porcelain` lists nothing but the three plan files.
   4. In `PLAN.md` section 6, replace the whole line that starts `- [ ] Step 1:` with `- [x] Step 1: DONE in <merge sha>`, and append the step's record to `LOG.md`
      (`EXECUTOR-BRIEF.md` section 4, item 10).

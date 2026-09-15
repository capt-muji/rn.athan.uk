/**
 * The component harness itself: shared values, the platform switch, icon names, haptics and a fresh install per test
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import { useEffect } from 'react';
import { Linking, Platform, Pressable, Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { onPlatform } from '@/__tests__/harness';
import AppleIcon from '@/assets/icons/svg/apple.svg';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import * as Database from '@/stores/database';

/** What Platform.Version reads on the iOS React Native that Jest loads, taken before any test switches it */
const IOS_VERSION = Platform.Version;

interface HolderProps {
  initial: number | (() => number);
  label: string;
  onValue?: (value: Reanimated.SharedValue<number>) => void;
  onEffect?: (value: Reanimated.SharedValue<number>) => void;
}

/** A component holding one shared value, which it hands to the test, and an effect that depends on that value */
const SharedValueHolder = ({ initial, label, onValue, onEffect }: HolderProps) => {
  const value = Reanimated.useSharedValue(initial);
  onValue?.(value);
  useEffect(() => {
    onEffect?.(value);
  }, [value, onEffect]);
  return <Text>{label}</Text>;
};

describe("useSharedValue, which behaves as Reanimated's own hook", () => {
  it('keeps one shared value across a rerender, so an effect that depends on it runs once', async () => {
    const held: Reanimated.SharedValue<number>[] = [];
    const effect = jest.fn();
    await render(
      <SharedValueHolder initial={0} label='first' onValue={(value) => held.push(value)} onEffect={effect} />
    );

    await screen.rerender(
      <SharedValueHolder initial={0} label='second' onValue={(value) => held.push(value)} onEffect={effect} />
    );

    expect(screen.getByText('second')).toBeOnTheScreen();
    expect(held.at(-1)).toBe(held[0]);
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('calls a function initial value once, on mount, and holds what it returns', async () => {
    const initial = jest.fn(() => 42);
    const held: Reanimated.SharedValue<number>[] = [];
    await render(<SharedValueHolder initial={initial} label='first' onValue={(value) => held.push(value)} />);

    await screen.rerender(<SharedValueHolder initial={initial} label='second' onValue={(value) => held.push(value)} />);

    expect(initial).toHaveBeenCalledTimes(1);
    expect(held.at(-1)?.value).toBe(42);
  });

  it("cancels the shared value's animation when the component unmounts", async () => {
    const cancel = jest.spyOn(Reanimated, 'cancelAnimation');
    const held: Reanimated.SharedValue<number>[] = [];
    await render(<SharedValueHolder initial={0} label='shown' onValue={(value) => held.push(value)} />);

    await screen.unmount();

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(held[0]);
  });
});

// The last test checks that the switches made before it were undone, so these run in this order
describe('onPlatform, switching to Android', () => {
  // [what Platform.select is given, what Android's own select answers]
  it.each<[Record<string, string>, string]>([
    [{ ios: 'ios', android: 'android' }, 'android'],
    [{ ios: 'ios', default: 'default' }, 'default'],
    [{ native: 'native', default: 'default' }, 'native'],
    [{ android: 'android', native: 'native', default: 'default' }, 'android'],
  ])('selects from %j as Android does: %s', (spec, answer) => {
    onPlatform('android');

    expect(Platform.select(spec as Parameters<typeof Platform.select>[0])).toBe(answer);
  });

  // device/updates.ts works out IS_IOS as it loads, and React Native is loaded again inside jest.isolateModules, so a
  // switch made outside it changes a copy the fresh module never reads
  it('opens the Play Store from a module that reads the platform as it loads, switched and loaded fresh', async () => {
    // Read before the fresh load, so this is the same mock the module calls once the load is over
    const openURL = jest.mocked(Linking.openURL);
    let updates: typeof import('@/device/updates') | undefined;
    jest.isolateModules(() => {
      require('@/__tests__/harness').onPlatform('android');
      updates = require('@/device/updates');
    });

    await updates?.openStore();

    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/^market:\/\//));
  });

  it('reads Android API 29 from Platform.OS and Platform.Version', () => {
    onPlatform('android', 29);

    expect(Platform.OS).toBe('android');
    expect(Platform.Version).toBe(29);
  });

  it('is back on iOS in the next test', () => {
    expect(Platform.OS).toBe('ios');
    expect(Platform.Version).toBe(IOS_VERSION);
    expect(Platform.select({ ios: 'ios', android: 'android' })).toBe('ios');
  });
});

describe('an icon imported from an .svg file', () => {
  // [how the caller passes a testID, the props it passes]
  it.each([
    ['passes none', {}],
    ['passes testID={undefined}', { testID: undefined }],
  ])('carries its file name when the caller %s', async (_caller, props) => {
    await render(<AppleIcon width={16} height={16} {...props} />);

    expect(screen.getByTestId('svg:apple', { includeHiddenElements: true })).toBeOnTheScreen();
  });
});

describe('expo-haptics, whose calls are recorded', () => {
  // [the call's name, the call, the arguments the app passes it]
  it.each([
    ['impactAsync', Haptics.impactAsync, [Haptics.ImpactFeedbackStyle.Heavy]],
    ['notificationAsync', Haptics.notificationAsync, [Haptics.NotificationFeedbackType.Warning]],
    ['selectionAsync', Haptics.selectionAsync, []],
    ['performAndroidHapticsAsync', Haptics.performAndroidHapticsAsync, [Haptics.AndroidHaptics.Confirm]],
  ] as const)('records %s when a press makes it', async (_name, call, args) => {
    const haptic = call as (...received: unknown[]) => Promise<void>;
    await render(<Pressable accessibilityRole='button' accessibilityLabel='Buzz' onPress={() => haptic(...args)} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Buzz' }));

    expect(haptic).toHaveBeenCalledWith(...args);
  });
});

// The second test reads what the first left behind, so the two run in this order
describe('every test, which starts from a fresh install', () => {
  it('holds a value it writes to storage and an atom it sets for as long as it runs', () => {
    // A key of the harness's own, since what is pinned is that storage is emptied whatever the app keeps in it
    Database.setItem('harness_written', true);
    // The atom itself, since what is pinned is that every atom goes back to its initial value
    getDefaultStore().set(overlayAtom, { isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Extra });

    expect(Database.getItem('harness_written')).toBe(true);
    expect(getDefaultStore().get(overlayAtom)).toMatchObject({ isOn: true, selectedPrayerIndex: 3 });
  });

  it('finds neither in the next test', () => {
    expect(Database.getItem('harness_written')).toBeNull();
    expect(getDefaultStore().get(overlayAtom)).toEqual({
      isOn: false,
      selectedPrayerIndex: 0,
      scheduleType: ScheduleType.Standard,
    });
  });
});

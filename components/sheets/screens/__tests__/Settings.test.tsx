/**
 * The settings sheet: the athan and What's New buttons, the display toggles, the decorations toggle's season, and the
 * music glyph's size on each platform
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import { StyleSheet } from 'react-native';

import { london } from '@/__tests__/harness';
import type { WhatsNewRelease } from '@/shared/whatsNew';
import {
  bottomSheetModalAtom,
  countdownBarShownAtom,
  decorationsEnabledAtom,
  hijriDateEnabledAtom,
  popupWhatsNewEnabledAtom,
  settingsSheetModalAtom,
  showArabicNamesAtom,
  showSecondsAtom,
  showTimePassedAtom,
} from '@/stores/ui';

import SettingsSheet from '../Settings';
import SoundSheet from '../Sound';

// Whether a release has notes to show is an editorial choice made per release, so the suite sets it both ways rather
// than depending on the stamp the current release happens to carry
let mockVisibleWhatsNew: WhatsNewRelease | null = null;
jest.mock('@/shared/whatsNew', () => ({
  get VISIBLE_WHATS_NEW() {
    return mockVisibleWhatsNew;
  },
}));

const RELEASE_WITH_NOTES: WhatsNewRelease = {
  version: '1.26.32',
  items: [{ title: 'Tablet support', body: 'Athan now supported on tablets', version: '1.26.32' }],
};

// The app has no setter function for these preferences: the sheet writes them through the atoms itself
const store = getDefaultStore();

/** The display rows shown in every season, with the preference each writes */
const DISPLAY_TOGGLES = [
  ['Show hijri date', hijriDateEnabledAtom],
  ['Show seconds', showSecondsAtom],
  ['Show time passed', showTimePassedAtom],
  ['Show arabic names', showArabicNamesAtom],
  ['Show countdown bar', countdownBarShownAtom],
] as const;

/** Every row on, and the one under test off, so a row that shows or writes another row's preference cannot pass */
const setOnlyThisToggleOff = (preference: typeof hijriDateEnabledAtom) => {
  for (const [, other] of DISPLAY_TOGGLES) store.set(other, true);
  store.set(decorationsEnabledAtom, true);
  store.set(preference, false);
};

// A settings row carries no role of its own, so its switch is found inside the row that holds its label
const switchOf = (label: string) => {
  const row = screen.getByText(label).parent;
  if (!row) throw new Error(`${label} has no row`);
  return within(row).getByRole('switch');
};

/** The modal a sheet handed the store when it rendered */
const renderedSheet = (modal: typeof settingsSheetModalAtom) => {
  const sheet = store.get(modal);
  if (!sheet) throw new Error('The sheet has not rendered');
  return sheet;
};

beforeEach(() => {
  mockVisibleWhatsNew = RELEASE_WITH_NOTES;
});

describe('the settings sheet outside the Ramadan season, Friday 11 September 2026 at 14:00', () => {
  it('closes itself and opens the athan sheet with a haptic when Change athan is pressed', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(
      <>
        <SettingsSheet />
        <SoundSheet />
      </>
    );
    // Each sheet's own modal is spied on, so a test tells the settings sheet from the athan sheet by its call count.
    // Comparing the modals themselves would make a failure print a whole React component, which never finishes
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');
    const athanPresent = jest.spyOn(renderedSheet(bottomSheetModalAtom), 'present');

    await fireEvent.press(screen.getByRole('button', { name: 'Change athan' }));

    expect(settingsDismiss).toHaveBeenCalledTimes(1);
    expect(athanPresent).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it("builds the athan sheet's rows the first time it fully opens, one tap before they are needed", async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(
      <>
        <SettingsSheet />
        <SoundSheet />
      </>
    );
    expect(screen.queryByText('Athan 1')).not.toBeOnTheScreen();

    await fireEvent(screen.getByText('Settings'), 'change', 0);

    expect(screen.getByText('Athan 1')).toBeOnTheScreen();
  });

  it("closes itself, then opens What's New once the close has had time to finish", async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);
    // The settings sheet's own modal is spied on, so its close is counted without printing the component
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');

    await fireEvent.press(screen.getByRole('button', { name: "What's new" }));
    await act(() => jest.advanceTimersByTime(149));
    expect(store.get(popupWhatsNewEnabledAtom)).toBe(false);
    await act(() => jest.advanceTimersByTime(1));

    expect(settingsDismiss).toHaveBeenCalledTimes(1);
    expect(store.get(popupWhatsNewEnabledAtom)).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it("offers no What's New button on a release with no notes to show", async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockVisibleWhatsNew = null;

    await render(<SettingsSheet />);

    expect(screen.queryByRole('button', { name: "What's new" })).not.toBeOnTheScreen();
  });

  it('offers no decorations toggle', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });

    await render(<SettingsSheet />);

    expect(screen.queryByText('Show decorations')).not.toBeOnTheScreen();
  });

  // row label, the preference it shows and writes
  it.each(DISPLAY_TOGGLES)('shows and flips its own preference when %s is pressed', async (label, preference) => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    setOnlyThisToggleOff(preference);
    await render(<SettingsSheet />);
    expect(switchOf(label)).not.toBeChecked();

    await fireEvent.press(screen.getByText(label));

    expect(switchOf(label)).toBeChecked();
    expect(store.get(preference)).toBe(true);
  });
});

describe('the settings sheet in the Ramadan season, Monday 15 February 2027 at 14:00', () => {
  it('shows and flips the decorations preference when Show decorations is pressed', async () => {
    jest.useFakeTimers({ now: london('2027-02-15', '14:00') });
    setOnlyThisToggleOff(decorationsEnabledAtom);
    await render(<SettingsSheet />);
    expect(switchOf('Show decorations')).not.toBeChecked();

    await fireEvent.press(screen.getByText('Show decorations'));

    expect(switchOf('Show decorations')).toBeChecked();
    expect(store.get(decorationsEnabledAtom)).toBe(true);
  });
});

describe('the music glyph beside Change athan, Friday 11 September 2026 at 14:00', () => {
  // platform, font size, lift
  it.each([
    ['ios', 10, 0],
    ['android', 14, -2.5],
  ] as const)('draws the glyph on %s at font size %s, lifted by %s', async (os, fontSize, marginTop) => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    // The size is fixed when the sheet's module loads, so the sheet is loaded fresh on a React Native already set to the
    // platform. React itself stays the one this file renders with, because one React cannot run another's hooks
    const sharedReact = {
      react: require('react'),
      jsx: require('react/jsx-runtime'),
      jsxDev: require('react/jsx-dev-runtime'),
    };
    let FreshSettingsSheet: typeof SettingsSheet | undefined;
    jest.isolateModules(() => {
      jest.doMock('react', () => sharedReact.react);
      jest.doMock('react/jsx-runtime', () => sharedReact.jsx);
      jest.doMock('react/jsx-dev-runtime', () => sharedReact.jsxDev);
      jest.replaceProperty(require('react-native').Platform, 'OS', os);
      FreshSettingsSheet = require('../Settings').default;
    });
    if (!FreshSettingsSheet) throw new Error('The settings sheet did not load');

    await render(<FreshSettingsSheet />);

    // A style is read because it is a rule the app keeps: Android's font draws the ♪ glyph smaller and lower, so commit
    // 9c853868 ("fixed music icon android") sized it up and lifted it there, and the owner's visuals are settled
    expect(StyleSheet.flatten(screen.getByText('♪').props.style)).toMatchObject({ fontSize, marginTop });
  });
});

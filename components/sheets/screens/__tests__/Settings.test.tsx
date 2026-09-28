/**
 * The settings sheet: the athan and What's New buttons, the display toggles, the decorations toggle's season, and the
 * music glyph's size on each platform
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';

import { london } from '@/__tests__/harness';
import type { WhatsNewRelease } from '@/shared/whatsNew';
import {
  bottomSheetModalAtom,
  countdownBarShownAtom,
  decorationsEnabledAtom,
  hijriDateEnabledAtom,
  popupHelpEnabledAtom,
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

  // Both badges are vectors cropped to their own ink, so each centres itself in its pill. A regression to a text
  // glyph would bring back the hand-tuned padding that never sat straight on both platforms
  it('badges What\u2019s new and Help with centred vector glyphs', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });

    await render(<SettingsSheet />);

    expect(screen.getByTestId('svg:info', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByTestId('svg:question', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('keeps Help reachable on a release with no notes to show', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockVisibleWhatsNew = null;

    await render(<SettingsSheet />);

    expect(screen.getByRole('button', { name: 'Help' })).toBeOnTheScreen();
    expect(screen.getByText('Other')).toBeOnTheScreen();
  });

  it('closes itself, then opens Help once the close has had time to finish', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);
    // The settings sheet's own modal is spied on, so its close is counted without printing the component
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');

    await fireEvent.press(screen.getByRole('button', { name: 'Help' }));
    await act(() => jest.advanceTimersByTime(149));
    expect(store.get(popupHelpEnabledAtom)).toBe(false);
    await act(() => jest.advanceTimersByTime(1));

    expect(settingsDismiss).toHaveBeenCalledTimes(1);
    expect(store.get(popupHelpEnabledAtom)).toBe(true);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
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

describe('the icons beside the Settings rows, Friday 11 September 2026 at 14:00', () => {
  /**
   * Text glyphs drew differently on each platform, so the music note needed a per-platform size and lift
   * (commit 9c853868) and the info mark sat off-centre in its circle. These are vector icons now, which
   * render identically everywhere, so the platform tweaks are gone with them (owner, 2026-09-27).
   */
  it('draws a real icon for the athan, the notes and the help rows', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });

    await render(<SettingsSheet />);

    for (const name of ['svg:music-note', 'svg:info']) {
      expect(screen.getByTestId(name, { includeHiddenElements: true })).toBeOnTheScreen();
    }
    expect(screen.queryByText('\u266a')).not.toBeOnTheScreen();
  });
});

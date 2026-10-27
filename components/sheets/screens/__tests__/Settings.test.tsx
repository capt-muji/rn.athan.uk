/**
 * The settings sheet: the athan and What's New buttons, the display toggles, the decorations toggle's season, and the
 * music glyph's size on each platform
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import * as Reanimated from 'react-native-reanimated';
import type { ReactTestInstance } from 'react-test-renderer';

import { london } from '@/__tests__/harness';
import type { WhatsNewRelease } from '@/shared/whatsNew';
import {
  bottomSheetModalAtom,
  countdownBarShownAtom,
  decorationsEnabledAtom,
  hijriDateEnabledAtom,
  languageSheetModalAtom,
  manualUpdateCheckSpentAtom,
  popupHelpEnabledAtom,
  popupUpdateEnabledAtom,
  popupWhatsNewEnabledAtom,
  qiblaSheetModalAtom,
  settingsSheetModalAtom,
  showSecondsAtom,
  showTimePassedAtom,
  updateCheckRowStateAtom,
} from '@/stores/ui';

import LanguageSheet from '../Language';
import QiblaSheet from '../Qibla';
import SettingsSheet from '../Settings';
import SoundSheet from '../Sound';

// The update check asks the store over the network, so the row's suite observes the one flow
// instead of running it
const mockCheckForUpdates = jest.fn((_options?: { manual?: boolean }) =>
  Promise.resolve({ modal: false, upToDate: false })
);
jest.mock('@/device/updates', () => ({
  checkForUpdates: (options?: { manual?: boolean }) => mockCheckForUpdates(options),
}));

// The qibla sheet reaches the platform the moment it presents; the settings suite only needs it to exist
const mockQiblaGranted = { value: true };
jest.mock('@/device/qibla', () => ({
  requestQiblaPermission: jest.fn(async () => mockQiblaGranted.value),
  showQiblaLocationDialog: jest.fn(),
  readPosition: jest.fn(async () => ({ latitude: 51.5074, longitude: -0.1278 })),
  watchHeading: jest.fn(async () => jest.fn()),
}));

const qiblaDevice = jest.requireMock('@/device/qibla');

// Whether a release has notes to show is an editorial choice made per release, so the suite sets it both ways rather
// than depending on the stamp the current release happens to carry
let mockVisibleWhatsNew: WhatsNewRelease | null = null;
jest.mock('@/shared/whatsNew', () => ({
  currentVisibleWhatsNew: () => mockVisibleWhatsNew,
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
  mockQiblaGranted.value = true;
  mockCheckForUpdates.mockReset();
  mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: false }));
  // The row's launch-scoped facts reset with the process, so each test starts a fresh launch
  store.set(manualUpdateCheckSpentAtom, false);
  store.set(updateCheckRowStateAtom, 'idle');
});

describe('the settings sheet outside the Ramadan season, Friday 11 September 2026 at 14:00', () => {
  it('closes itself and opens the athan sheet with a haptic when Athan is pressed', async () => {
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

  it('closes itself and opens the qibla sheet with a haptic when Qibla is pressed', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(
      <>
        <SettingsSheet />
        <QiblaSheet />
      </>
    );
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');
    const qiblaPresent = jest.spyOn(renderedSheet(qiblaSheetModalAtom), 'present');

    await fireEvent.press(screen.getByRole('button', { name: 'Qibla' }));

    expect(settingsDismiss).toHaveBeenCalledTimes(1);
    expect(qiblaPresent).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('shows the Language row first in the Display card and opens the language sheet', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(
      <>
        <SettingsSheet />
        <LanguageSheet />
      </>
    );
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');
    const languagePresent = jest.spyOn(renderedSheet(languageSheetModalAtom), 'present');

    const languageRow = screen.getByRole('button', { name: 'Language' });
    // Language leads the Other card, straight after its title
    const otherCard = screen.getByText('Other').parent;
    expect(otherCard?.children.indexOf(languageRow)).toBe(1);
    // The sheet's header globe renders in the same tree, so the row's own globe is found inside it
    expect(within(languageRow).getByTestId('svg:globe', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(within(languageRow).getByText('›')).toBeOnTheScreen();

    await fireEvent.press(languageRow);

    expect(settingsDismiss).toHaveBeenCalledTimes(1);
    expect(languagePresent).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  // The owner's order: a compass that opens and THEN asks shows an empty instrument with the system dialog
  // sitting over it. The permission is settled on the tap, before anything opens
  it('asks for location on the tap, before the qibla sheet is opened', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(
      <>
        <SettingsSheet />
        <QiblaSheet />
      </>
    );
    const qiblaPresent = jest.spyOn(renderedSheet(qiblaSheetModalAtom), 'present');

    await fireEvent.press(screen.getByRole('button', { name: 'Qibla' }));

    expect(qiblaDevice.requestQiblaPermission).toHaveBeenCalled();
    expect(qiblaPresent).toHaveBeenCalledTimes(1);
  });

  // A compass with no position is not a degraded compass, it is nothing at all, so opening one would be showing
  // an instrument that cannot work
  it('opens nothing at all when location is refused, and says why instead', async () => {
    mockQiblaGranted.value = false;
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(
      <>
        <SettingsSheet />
        <QiblaSheet />
      </>
    );
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');
    const qiblaPresent = jest.spyOn(renderedSheet(qiblaSheetModalAtom), 'present');

    await fireEvent.press(screen.getByRole('button', { name: 'Qibla' }));

    expect(qiblaPresent).not.toHaveBeenCalled();
    expect(settingsDismiss).not.toHaveBeenCalled();
    expect(qiblaDevice.showQiblaLocationDialog).toHaveBeenCalledTimes(1);
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

    expect(screen.getByTestId('svg:info-bare', { includeHiddenElements: true })).toBeOnTheScreen();
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

  it('shows no arabic-names toggle', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);

    expect(screen.queryByText('Show arabic names')).not.toBeOnTheScreen();
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

describe('the Check for updates row, Friday 11 September 2026 at 14:00', () => {
  /** One microtask hop: the check's promise resolves and the row's answer lands inside act */
  const settle = () =>
    act(async () => {
      await Promise.resolve();
    });

  it("reads the Other card Language, Help, What's New, Check for updates, in that order", async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);

    const otherCard = screen.getByText('Other').parent;
    const order = (label: string) => otherCard?.children.indexOf(screen.getByRole('button', { name: label }));
    expect(order('Language')).toBe(1);
    expect(order('Help')).toBe(2);
    expect(order("What's new")).toBe(3);
    expect(order('Check for updates')).toBe(4);
  });

  it("keeps Language, Help, Check for updates when a silent release hides the What's New row", async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockVisibleWhatsNew = null;
    await render(<SettingsSheet />);

    const otherCard = screen.getByText('Other').parent;
    const order = (label: string) => otherCard?.children.indexOf(screen.getByRole('button', { name: label }));
    expect(order('Language')).toBe(1);
    expect(order('Help')).toBe(2);
    expect(order('Check for updates')).toBe(3);
  });

  it('rests on the download glyph and the two-arrow circle where other rows carry a chevron', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);

    const row = screen.getByRole('button', { name: 'Check for updates' });
    const otherCard = screen.getByText('Other').parent;
    expect(otherCard?.children.indexOf(row)).toBe((otherCard?.children.length ?? 0) - 1);
    expect(within(row).getByTestId('svg:download', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(within(row).getByTestId('svg:refresh', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(within(row).queryByText('›')).not.toBeOnTheScreen();
  });

  it('runs the one update flow in manual mode when pressed', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(mockCheckForUpdates).toHaveBeenCalledTimes(1);
    expect(mockCheckForUpdates).toHaveBeenCalledWith({ manual: true });
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('shows the checking label and spins the two arrows while the check runs', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    let answerCheck!: (verdict: { modal: boolean; upToDate: boolean }) => void;
    mockCheckForUpdates.mockReturnValue(
      new Promise<{ modal: boolean; upToDate: boolean }>((resolve) => {
        answerCheck = resolve;
      })
    );
    const armed = jest.spyOn(Reanimated, 'withRepeat');
    const stopped = jest.spyOn(Reanimated, 'cancelAnimation');
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));

    expect(screen.getByRole('button', { name: 'Checking for updates...' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Check for updates' })).not.toBeOnTheScreen();
    expect(armed).toHaveBeenCalledTimes(1);
    // The repeat runs forever; only the check's answer stops it
    expect(armed.mock.calls[0][1]).toBe(-1);

    await act(async () => {
      answerCheck({ modal: false, upToDate: true });
      await Promise.resolve();
    });

    expect(stopped).toHaveBeenCalledTimes(1);
    armed.mockRestore();
    stopped.mockRestore();
  });

  it('answers inline in the row when the store says the install is current', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: true }));
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    const row = screen.getByRole('button', { name: 'You’re up to date' });
    expect(screen.queryByRole('button', { name: 'Check for updates' })).not.toBeOnTheScreen();
    // The settled state is the owner's green replacing the purple, with the tick in the circle
    const badge = row.children[0] as unknown as ReactTestInstance;
    expect(badge).toHaveStyle({ backgroundColor: '#16a34a', borderColor: '#22c55e' });
    expect(within(row).getByTestId('svg:check', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(within(row).queryByTestId('svg:refresh', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('closes the sheet and presents the shared update modal once the store has an update', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    store.set(popupUpdateEnabledAtom, false);
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: true, upToDate: false }));
    await render(<SettingsSheet />);
    const settingsDismiss = jest.spyOn(renderedSheet(settingsSheetModalAtom), 'dismiss');

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(settingsDismiss).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(149));
    expect(store.get(popupUpdateEnabledAtom)).toBe(false);
    await act(() => jest.advanceTimersByTime(1));
    expect(store.get(popupUpdateEnabledAtom)).toBe(true);
  });

  it('keeps the row resting when the check cannot reach the store', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: false }));
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(screen.getByRole('button', { name: 'Check for updates' })).toBeOnTheScreen();
    expect(screen.queryByText('You’re up to date')).not.toBeOnTheScreen();
    expect(store.get(popupUpdateEnabledAtom)).toBe(false);
  });

  it('starts no second check this launch: the press after the answer does nothing', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();
    mockCheckForUpdates.mockClear();

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(mockCheckForUpdates).not.toHaveBeenCalled();
  });

  it('holds the spent check and its settled answer beyond the row, where a reopen reads them', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: true }));
    await render(<SettingsSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    // The row reads these through the store, so they are what a closed and reopened sheet finds
    expect(store.get(manualUpdateCheckSpentAtom)).toBe(true);
    expect(store.get(updateCheckRowStateAtom)).toBe('upToDate');
    expect(screen.getByRole('button', { name: 'You’re up to date' })).toBeOnTheScreen();
  });

  it('gives a spent press no haptic', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    (Haptics.impactAsync as jest.Mock).mockClear();
    await render(<SettingsSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();
    (Haptics.impactAsync as jest.Mock).mockClear();

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('the icons beside the Settings rows, Friday 11 September 2026 at 14:00', () => {
  /**
   * Text glyphs drew differently on each platform, so the music note needed a per-platform size and lift
   * and the info mark sat off-centre in its circle. These are vector icons now, which
   * render identically everywhere, so the platform tweaks are gone with them.
   */
  it('draws a real icon for the athan, the notes and the help rows', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });

    await render(<SettingsSheet />);

    for (const name of ['svg:music-note', 'svg:info-bare']) {
      expect(screen.getByTestId(name, { includeHiddenElements: true })).toBeOnTheScreen();
    }
    expect(screen.queryByText('\u266a')).not.toBeOnTheScreen();
  });
});

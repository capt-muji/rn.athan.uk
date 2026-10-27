/**
 * The settings sheet: the athan and What's New buttons, the display toggles, the decorations toggle's season, and the
 * music glyph's size on each platform. The Check for updates row's own four looks, its once-per-opening budget and
 * its retry live in this suite too
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai';
import * as Reanimated from 'react-native-reanimated';
import type { ReactTestInstance } from 'react-test-renderer';

import { london } from '@/__tests__/harness';
import { setActiveLocale } from '@/shared/i18n/locale';
import type { WhatsNewRelease } from '@/shared/whatsNew';
import {
  bottomSheetModalAtom,
  countdownBarShownAtom,
  decorationsEnabledAtom,
  hijriDateEnabledAtom,
  languageSheetModalAtom,
  popupHelpEnabledAtom,
  popupUpdateEnabledAtom,
  popupWhatsNewEnabledAtom,
  qiblaSheetModalAtom,
  settingsSheetModalAtom,
  showSecondsAtom,
  showTimePassedAtom,
} from '@/stores/ui';

import LanguageSheet from '../Language';
import QiblaSheet from '../Qibla';
import SettingsSheet from '../Settings';
import SoundSheet from '../Sound';

// The update check asks the store over the network, so the row's suite observes the one flow
// instead of running it. The default answer is a verdict: the bare pair the old default
// carried is a shape the data layer no longer returns, and a verdict is what the row's
// spent-budget tests mean to spend
const mockCheckForUpdates = jest.fn((_options?: { manual?: boolean }) =>
  Promise.resolve({ modal: false, upToDate: true, failed: false })
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
  mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: true, failed: false }));
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
    let answerCheck!: (verdict: { modal: boolean; upToDate: boolean; failed: boolean }) => void;
    mockCheckForUpdates.mockReturnValue(
      new Promise<{ modal: boolean; upToDate: boolean; failed: boolean }>((resolve) => {
        answerCheck = resolve;
      })
    );
    const armed = jest.spyOn(Reanimated, 'withRepeat');
    const turned = jest.spyOn(Reanimated, 'withTiming');
    const stopped = jest.spyOn(Reanimated, 'cancelAnimation');
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));

    expect(screen.getByRole('button', { name: 'Checking for updates...' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Check for updates' })).not.toBeOnTheScreen();
    expect(armed).toHaveBeenCalledTimes(1);
    // The repeat runs forever; only the check's answer stops it
    expect(armed.mock.calls[0][1]).toBe(-1);
    // The owner's "clockwise, round and round": a full positive turn per second in the LTR face
    expect(turned).toHaveBeenCalledWith(360, { duration: 1000, easing: Reanimated.Easing.linear });

    await act(async () => {
      answerCheck({ modal: false, upToDate: true, failed: false });
      await Promise.resolve();
    });

    expect(stopped).toHaveBeenCalledTimes(1);
    armed.mockRestore();
    turned.mockRestore();
    stopped.mockRestore();
  });

  it('mirrors the arrows and their turn in the Arabic face', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    setActiveLocale('ar');
    let answerCheck!: (verdict: { modal: boolean; upToDate: boolean; failed: boolean }) => void;
    mockCheckForUpdates.mockReturnValue(
      new Promise<{ modal: boolean; upToDate: boolean; failed: boolean }>((resolve) => {
        answerCheck = resolve;
      })
    );
    const turned = jest.spyOn(Reanimated, 'withTiming');
    try {
      await render(<SettingsSheet />);

      // The turn stays clockwise in both faces; the glyph's wrapper carries the RTL mirror, and
      // a mirrored clockwise turn is the anti-clockwise read (owner order 2026-10-27)
      const row = screen.getByRole('button', { name: 'التحقق من التحديثات' });
      const trailing = row.children[2] as unknown as ReactTestInstance;
      expect(trailing).toHaveStyle({ transform: [{ scaleX: -1 }] });

      await fireEvent.press(row);

      expect(screen.getByRole('button', { name: 'جارٍ التحقق من التحديثات...' })).toBeOnTheScreen();
      expect(turned).toHaveBeenCalledWith(360, { duration: 1000, easing: Reanimated.Easing.linear });
    } finally {
      setActiveLocale('en');
      await act(async () => {
        answerCheck({ modal: false, upToDate: false, failed: true });
        await Promise.resolve();
      });
      turned.mockRestore();
    }
  });

  it('answers inline in the row when the store says the install is current', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: true, failed: false }));
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    const row = screen.getByRole('button', { name: 'You’re up to date' });
    expect(screen.queryByRole('button', { name: 'Check for updates' })).not.toBeOnTheScreen();
    // The settled state is the owner's green replacing the purple, a rung darker (order 2026-10-27),
    // with the tick in the circle
    const badge = row.children[0] as unknown as ReactTestInstance;
    expect(badge).toHaveStyle({ backgroundColor: '#15803d', borderColor: '#16a34a' });
    expect(within(row).getByTestId('svg:check', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(within(row).queryByTestId('svg:refresh', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('closes the sheet and presents the shared update modal once the store has an update', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    store.set(popupUpdateEnabledAtom, false);
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: true, upToDate: false, failed: false }));
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

  it('settles into the failure state when the check cannot reach the store, and stays retryable', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const pending: Array<(value: unknown) => void> = [];
    const answer = () =>
      new Promise<{ modal: boolean; upToDate: boolean; failed: boolean }>((resolve) => {
        pending.push(resolve as unknown as (value: unknown) => void);
      });
    mockCheckForUpdates.mockReturnValueOnce(answer()).mockReturnValueOnce(answer());
    const armed = jest.spyOn(Reanimated, 'withRepeat');
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    await act(async () => {
      pending[0]({ modal: false, upToDate: false, failed: true });
      await Promise.resolve();
    });

    const row = screen.getByRole('button', { name: 'Failed to check. Try again' });
    expect(screen.queryByRole('button', { name: 'Check for updates' })).not.toBeOnTheScreen();
    expect(screen.queryByText('You’re up to date')).not.toBeOnTheScreen();
    // The owner's spec: the circle red with a white X, mirroring the green tick's construction,
    // both a rung darker (order 2026-10-27)
    const badge = row.children[0] as unknown as ReactTestInstance;
    expect(badge).toHaveStyle({ backgroundColor: '#b91c1c', borderColor: '#dc2626' });
    expect(within(row).getByTestId('svg:close', { includeHiddenElements: true })).toBeOnTheScreen();
    // The ring stays so the row reads retryable, and no modal is claimed
    expect(within(row).getByTestId('svg:refresh', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(store.get(popupUpdateEnabledAtom)).toBe(false);

    await fireEvent.press(row);
    await settle();

    // The retry re-arms the spin: the failure settle ran the effect's rest branch, and the next
    // press starts the turn again from it
    expect(armed).toHaveBeenCalledTimes(2);

    await act(async () => {
      pending[1]({ modal: false, upToDate: false, failed: true });
      await Promise.resolve();
    });

    expect(mockCheckForUpdates).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Failed to check. Try again' })).toBeOnTheScreen();
    armed.mockRestore();
  });

  it('spends the budget again once a retry reaches a verdict', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockCheckForUpdates
      .mockReturnValueOnce(Promise.resolve({ modal: false, upToDate: false, failed: true }))
      .mockReturnValueOnce(Promise.resolve({ modal: false, upToDate: true, failed: false }));
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();
    await fireEvent.press(screen.getByRole('button', { name: 'Failed to check. Try again' }));
    await settle();

    expect(screen.getByRole('button', { name: 'You’re up to date' })).toBeOnTheScreen();
    mockCheckForUpdates.mockClear();

    await fireEvent.press(screen.getByRole('button', { name: 'You’re up to date' }));
    await settle();

    expect(mockCheckForUpdates).not.toHaveBeenCalled();
  });

  it('rests the row when Play starts its own update flow, and that verdict spends the budget', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    // Android's update-found: Play's overlay owns the message, so the row claims nothing inline
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: false, failed: false }));
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(screen.getByRole('button', { name: 'Check for updates' })).toBeOnTheScreen();
    expect(screen.queryByText('You’re up to date')).not.toBeOnTheScreen();
    mockCheckForUpdates.mockClear();

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(mockCheckForUpdates).not.toHaveBeenCalled();
  });

  it('reads the failure state mirrored in the Arabic face', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    setActiveLocale('ar');
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: false, failed: true }));
    try {
      await render(<SettingsSheet />);

      await fireEvent.press(screen.getByRole('button', { name: 'التحقق من التحديثات' }));
      await settle();

      const row = screen.getByRole('button', { name: 'فشل التحقق. حاول مجددًا' });
      expect(within(row).getByTestId('svg:close', { includeHiddenElements: true })).toBeOnTheScreen();
      // The ring keeps its RTL wrapper in the failure state: the row stays retryable in both faces
      const trailing = row.children[2] as unknown as ReactTestInstance;
      expect(trailing).toHaveStyle({ transform: [{ scaleX: -1 }] });
    } finally {
      setActiveLocale('en');
    }
  });

  it('starts no second check while its sheet stays open: the press after the answer does nothing', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<SettingsSheet />);

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();
    mockCheckForUpdates.mockClear();

    // The verdict keeps the budget spent, so the row's own settled name now refuses the press
    await fireEvent.press(screen.getByRole('button', { name: 'You’re up to date' }));
    await settle();

    expect(mockCheckForUpdates).not.toHaveBeenCalled();
  });

  it('re-arms its one check when the sheet closes and opens again', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    mockCheckForUpdates.mockReturnValue(Promise.resolve({ modal: false, upToDate: true, failed: false }));
    await render(<SettingsSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();
    expect(screen.getByRole('button', { name: 'You’re up to date' })).toBeOnTheScreen();

    // Closing the sheet ends the session (owner order 2026-10-27): the budget re-arms and the row rests
    await fireEvent(screen.getByText('Settings'), 'dismiss');
    mockCheckForUpdates.mockClear();

    expect(screen.getByRole('button', { name: 'Check for updates' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();

    expect(mockCheckForUpdates).toHaveBeenCalledTimes(1);
    expect(mockCheckForUpdates).toHaveBeenCalledWith({ manual: true });
    expect(screen.getByRole('button', { name: 'You’re up to date' })).toBeOnTheScreen();
  });

  it('drops the answer of a check whose sheet closed mid-flight', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    let answerCheck!: (verdict: { modal: boolean; upToDate: boolean; failed: boolean }) => void;
    mockCheckForUpdates.mockReturnValue(
      new Promise<{ modal: boolean; upToDate: boolean; failed: boolean }>((resolve) => {
        answerCheck = resolve;
      })
    );
    await render(<SettingsSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    expect(screen.getByRole('button', { name: 'Checking for updates...' })).toBeOnTheScreen();

    await fireEvent(screen.getByText('Settings'), 'dismiss');

    await act(async () => {
      answerCheck({ modal: false, upToDate: true, failed: false });
      await Promise.resolve();
    });

    // The row rests: the settled answer belonged to the session the close ended
    expect(screen.getByRole('button', { name: 'Check for updates' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'You’re up to date' })).not.toBeOnTheScreen();
  });

  it('gives a spent press no haptic', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    (Haptics.impactAsync as jest.Mock).mockClear();
    await render(<SettingsSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check for updates' }));
    await settle();
    (Haptics.impactAsync as jest.Mock).mockClear();

    await fireEvent.press(screen.getByRole('button', { name: 'You’re up to date' }));

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

/**
 * The bell on a prayer row: what a screen reader hears, and what pressing it does
 */

import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import type { TestInstance } from 'test-renderer';

import { showLondonDay } from '@/__tests__/harness';
import ALERT_ICONS from '@/assets/icons/svg/alerts';
import { PRAYERS_ARABIC } from '@/shared/constants';
import { AlertType, Icon, ScheduleType } from '@/shared/types';
import { setPrayerAlertType } from '@/stores/notifications';
import { closeOverlay, openOverlay } from '@/stores/overlay';
import { getAlertSheetState } from '@/stores/ui';

import Alert from '../Alert';

// A press gives a haptic, and the generated native module behind expo-haptics records no calls
jest.mock('expo-haptics', () => ({
  ...jest.requireActual<typeof import('expo-haptics')>('expo-haptics'),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

const FAJR = 0;
const SUNRISE = 1;

/** The icon a bell draws, as its path data */
const iconOf = (bell: TestInstance): string | undefined =>
  bell.queryAll((node) => node.type === 'RNSVGPath')[0]?.props.d;

describe('the Fajr bell on the Standard list, Friday 11 September 2026 at 14:00', () => {
  it('names the prayer and its saved alert for a screen reader', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);

    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    expect(screen.getByRole('button', { name: 'Fajr notification: sound' })).toBeOnTheScreen();
  });

  it('checks notification permission before opening the sheet of a prayer saved Off', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Off);
    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Fajr notification: off' }));

    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(getAlertSheetState()).toEqual({
      type: ScheduleType.Standard,
      index: FAJR,
      prayerEnglish: 'Fajr',
      prayerArabic: PRAYERS_ARABIC[FAJR],
      isUnavailable: false,
    });
  });

  it('opens the sheet of a prayer saved Sound without checking permission', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Fajr notification: sound' }));

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(getAlertSheetState()).toMatchObject({ prayerEnglish: 'Fajr', isUnavailable: false });
  });

  it('opens the explanation, without checking permission, when the time on screen is unreadable', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': ['fajr'] });
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Off);
    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Fajr notification: unavailable' }));

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(getAlertSheetState()).toMatchObject({ prayerEnglish: 'Fajr', isUnavailable: true });
  });

  // [saved alert in words, saved alert, the icon it draws]
  it.each<[string, AlertType, keyof typeof ALERT_ICONS]>([
    ['off', AlertType.Off, Icon.BELL_SLASH],
    ['silent', AlertType.Silent, Icon.BELL_RING],
    ['sound', AlertType.Sound, Icon.SPEAKER],
  ])('draws a bell saved %s with the %s icon', async (_spoken, saved, icon) => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, saved);

    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    expect(iconOf(screen.getByRole('button'))).toBe(ALERT_ICONS[icon]);
  });

  it('swaps the icon when a new alert is saved while the bell is on screen', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Off);
    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    await act(() => setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound));

    expect(iconOf(screen.getByRole('button', { name: 'Fajr notification: sound' }))).toBe(ALERT_ICONS[Icon.SPEAKER]);
  });

  // The only test whose press runs onPressIn and onPressOut. Nothing asserts them: they scale the bell, and the
  // Reanimated mock never draws a scale
  it('gives a medium haptic when the bell is pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.press(screen.getByRole('button', { name: 'Fajr notification: sound' }));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });
});

// Not Fajr, index 0, which the overlay holds as its selection before it is first opened
describe("the passed Sunrise bell on Friday 11 September 2026 at 14:00, with Saturday's Sunrise unreadable", () => {
  it("names the bell unavailable once the overlay shows Saturday's Sunrise", async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-12': ['sunrise'] });
    setPrayerAlertType(ScheduleType.Standard, SUNRISE, AlertType.Sound);
    await render(<Alert type={ScheduleType.Standard} index={SUNRISE} />);

    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));

    expect(screen.getByRole('button', { name: 'Sunrise notification: unavailable' })).toBeOnTheScreen();
  });

  it('draws the Off icon under the overlay even after Sound is saved', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-12': ['sunrise'] });
    setPrayerAlertType(ScheduleType.Standard, SUNRISE, AlertType.Off);
    await render(<Alert type={ScheduleType.Standard} index={SUNRISE} />);
    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));

    await act(() => setPrayerAlertType(ScheduleType.Standard, SUNRISE, AlertType.Sound));

    expect(iconOf(screen.getByRole('button'))).toBe(ALERT_ICONS[Icon.BELL_SLASH]);
  });

  it('draws the alert saved under the overlay once the overlay closes', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-12': ['sunrise'] });
    setPrayerAlertType(ScheduleType.Standard, SUNRISE, AlertType.Off);
    await render(<Alert type={ScheduleType.Standard} index={SUNRISE} />);
    await act(() => openOverlay(ScheduleType.Standard, SUNRISE));
    await act(() => setPrayerAlertType(ScheduleType.Standard, SUNRISE, AlertType.Sound));

    await act(() => closeOverlay());

    expect(iconOf(screen.getByRole('button', { name: 'Sunrise notification: sound' }))).toBe(ALERT_ICONS[Icon.SPEAKER]);
  });
});

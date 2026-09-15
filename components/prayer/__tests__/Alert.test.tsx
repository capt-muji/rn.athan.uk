/**
 * The bell on a prayer row: what a screen reader hears, and what pressing it does
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { showLondonDay } from '@/__tests__/harness';
import { PRAYERS_ARABIC } from '@/shared/constants';
import { AlertType, ScheduleType } from '@/shared/types';
import { setPrayerAlertType } from '@/stores/notifications';
import { getAlertSheetState } from '@/stores/ui';

import Alert from '../Alert';

const FAJR = 0;

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
});

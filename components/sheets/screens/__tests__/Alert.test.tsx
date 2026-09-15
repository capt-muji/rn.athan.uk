/**
 * The alert sheet: the draft it opens on, what each control does to that draft, and what closing the sheet saves
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

import { showLondonDay } from '@/__tests__/harness';
import { EXTRAS_ARABIC, EXTRAS_ENGLISH, PRAYERS_ARABIC, PRAYERS_ENGLISH } from '@/shared/constants';
import { AlertType, type ReminderInterval, ScheduleType } from '@/shared/types';
import {
  getPrayerAlertType,
  getReminderAlertType,
  getReminderInterval,
  setPrayerAlertType,
  setReminderAlertType,
  setReminderInterval,
} from '@/stores/notifications';
import { showAlertSheet } from '@/stores/ui';

import AlertSheet from '../Alert';

// A locked Toggle or Stepper refuses the press itself, so the sheet's own guards against a locked press never run
// today. They stay for the day a control stops refusing, and these stand-ins hand the sheet that press: while a test
// lets locked presses through, the switch and both arrows call back whatever their lock says, and otherwise each is
// the real control
let mockLockedPressesGetThrough = false;
jest.mock('@/components/sheets/parts', () => {
  const parts = jest.requireActual('@/components/sheets/parts');
  const { createElement } = require('react');
  const { Pressable, Text, View } = require('react-native');

  const Toggle = (props: { value: boolean; disabled?: boolean; onToggle: () => void }) =>
    mockLockedPressesGetThrough
      ? createElement(Pressable, {
          accessibilityRole: 'switch',
          accessibilityState: { checked: props.value, disabled: props.disabled === true },
          onPress: props.onToggle,
        })
      : createElement(parts.Toggle, props);

  const Stepper = (props: { value: number; unit?: string; onDecrement: () => void; onIncrement: () => void }) =>
    mockLockedPressesGetThrough
      ? createElement(
          View,
          null,
          createElement(Pressable, {
            accessibilityRole: 'button',
            accessibilityLabel: 'Decrease',
            onPress: props.onDecrement,
          }),
          createElement(Text, null, `${props.value} ${props.unit}`),
          createElement(Pressable, {
            accessibilityRole: 'button',
            accessibilityLabel: 'Increase',
            onPress: props.onIncrement,
          })
        )
      : createElement(parts.Stepper, props);

  return { ...parts, Toggle, Stepper };
});

const FAJR = 0;
const DHUHR = 2;

/** Opens the sheet for a Standard prayer the way its bell does */
const openSheetFor = (index: number, isUnavailable = false) =>
  showAlertSheet({
    type: ScheduleType.Standard,
    index,
    prayerEnglish: PRAYERS_ENGLISH[index],
    prayerArabic: PRAYERS_ARABIC[index],
    isUnavailable,
  });

// The athan and the reminder both offer Silent and Sound, and the athan's control comes first on screen
const athanOption = (label: string) => screen.getAllByRole('radio', { name: label })[0];
const reminderOption = (label: string) => screen.getAllByRole('radio', { name: label })[1];

/** Closes the sheet as the bottom sheet library reports it, once the close has finished */
const closeSheet = () => fireEvent(screen.getByText('Close to save'), 'dismiss');

/** Lets work that waits on notification permission and scheduling run to its end */
const settle = () => act(() => jest.runAllTimersAsync());

describe('the alert sheet for a Standard prayer, Friday 11 September 2026 at 14:00', () => {
  it('opens on the athan, reminder and interval saved for the prayer', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    setReminderInterval(ScheduleType.Standard, FAJR, 15);
    openSheetFor(FAJR);

    await render(<AlertSheet />);

    expect(screen.getByText('Fajr')).toBeOnTheScreen();
    expect(athanOption('Silent')).toBeSelected();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(reminderOption('Sound')).toBeSelected();
    expect(screen.getByLabelText('15 min')).toBeOnTheScreen();
  });

  it('opens on 5 minutes when the saved interval is not one the stepper offers', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderInterval(ScheduleType.Standard, FAJR, 7 as ReminderInterval);
    openSheetFor(FAJR);

    await render(<AlertSheet />);

    expect(screen.getByLabelText('5 min')).toBeOnTheScreen();
  });

  it('locks the reminder off, on Silent, while the athan is Off', async () => {
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(reminderOption('Silent')).toBeSelected();
  });

  it('checks notification permission before moving the athan off Off', async () => {
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(athanOption('Silent'));
    await settle();

    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(athanOption('Silent')).toBeSelected();
  });

  it('leaves the athan on Off when notification permission is refused', async () => {
    showLondonDay('2026-09-11', '14:00');
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    // The refusal ends at the system dialog offering Settings, where the person taps Cancel. A dialog with no Cancel
    // throws here instead of never answering, so the sheet always gets its answer and has to act on the refusal
    jest.spyOn(Alert, 'alert').mockImplementationOnce((_title, _message, buttons) => {
      const cancel = buttons?.find((button) => button.text === 'Cancel');
      if (!cancel?.onPress) throw new Error('The settings dialog offers no Cancel');
      cancel.onPress();
    });
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(athanOption('Silent'));
    await settle();

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(athanOption('Off')).toBeSelected();
  });

  it('moves the athan between Silent and Sound without checking permission', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(athanOption('Sound'));
    await settle();

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(athanOption('Sound')).toBeSelected();
  });

  it('turns the reminder off when the athan is turned off', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(athanOption('Off'));
    await settle();

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('switches the reminder back on with the sound it had', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(screen.getByRole('switch'));
    await fireEvent.press(screen.getByRole('switch'));

    expect(screen.getByRole('switch')).toBeChecked();
    expect(reminderOption('Sound')).toBeSelected();
  });

  it('moves the reminder sound to the one pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await fireEvent.press(reminderOption('Sound'));

    expect(reminderOption('Sound')).toBeSelected();
  });

  it('saves the athan chosen when the sheet closes', async () => {
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);
    await render(<AlertSheet />);
    await fireEvent.press(athanOption('Sound'));
    await settle();

    await closeSheet();
    await settle();

    expect(getPrayerAlertType(ScheduleType.Standard, FAJR)).toBe(AlertType.Sound);
  });

  it('saves the reminder switched on when the sheet closes', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    openSheetFor(FAJR);
    await render(<AlertSheet />);
    await fireEvent.press(screen.getByRole('switch'));

    await closeSheet();
    await settle();

    expect(getReminderAlertType(ScheduleType.Standard, FAJR)).toBe(AlertType.Silent);
  });

  it('saves the reminder sound chosen when the sheet closes', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    openSheetFor(FAJR);
    await render(<AlertSheet />);
    await fireEvent.press(reminderOption('Sound'));

    await closeSheet();
    await settle();

    expect(getReminderAlertType(ScheduleType.Standard, FAJR)).toBe(AlertType.Sound);
  });

  it('saves the interval stepped to when the sheet closes', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderInterval(ScheduleType.Standard, FAJR, 10);
    openSheetFor(FAJR);
    await render(<AlertSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Increase to 15 min' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Increase to 20 min' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Decrease to 15 min' }));

    await closeSheet();
    await settle();

    expect(getReminderInterval(ScheduleType.Standard, FAJR)).toBe(15);
  });

  it('saves nothing and schedules nothing when the sheet closes unchanged', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await closeSheet();
    await settle();

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("opens on the new prayer's saved athan when the sheet is moved to another prayer", async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    openSheetFor(FAJR);
    await render(<AlertSheet />);

    await act(() => openSheetFor(DHUHR));

    expect(screen.getByText('Dhuhr')).toBeOnTheScreen();
    expect(athanOption('Off')).toBeSelected();
  });

  it('explains an unavailable time instead of offering options', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': ['fajr'] });
    openSheetFor(FAJR, true);

    await render(<AlertSheet />);

    expect(screen.getByText(/This prayer's time isn't available/)).toBeOnTheScreen();
    expect(screen.queryByRole('radio')).not.toBeOnTheScreen();
  });

  it('keeps the saved athan and schedules nothing when the sheet on an unavailable time closes', async () => {
    showLondonDay('2026-09-11', '14:00', { '2026-09-11': ['fajr'] });
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    openSheetFor(FAJR, true);
    await render(<AlertSheet />);

    await closeSheet();
    await settle();

    expect(getPrayerAlertType(ScheduleType.Standard, FAJR)).toBe(AlertType.Sound);
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('offers no options, and schedules nothing when closed, before any prayer is chosen', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<AlertSheet />);

    await closeSheet();
    await settle();

    expect(screen.queryByRole('radio')).not.toBeOnTheScreen();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('the alert sheet for Duha on the Extras list, Friday 11 September 2026 at 14:00', () => {
  // Duha sits away from index 0 on the other list, so a save that reads the wrong list or index cannot land on it
  const DUHA = 3;

  it('saves the athan chosen for Duha alone, and schedules it by its own name', async () => {
    showLondonDay('2026-09-11', '14:00');
    showAlertSheet({
      type: ScheduleType.Extra,
      index: DUHA,
      prayerEnglish: EXTRAS_ENGLISH[DUHA],
      prayerArabic: EXTRAS_ARABIC[DUHA],
      isUnavailable: false,
    });
    await render(<AlertSheet />);
    await fireEvent.press(athanOption('Silent'));
    await settle();

    await closeSheet();
    await settle();

    expect(getPrayerAlertType(ScheduleType.Extra, DUHA)).toBe(AlertType.Silent);
    expect(getPrayerAlertType(ScheduleType.Standard, FAJR)).toBe(AlertType.Off);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ title: 'Duha now' }) })
    );
  });
});

describe('the alert sheet when a locked control lets a press through, Friday 11 September 2026 at 14:00', () => {
  beforeEach(() => {
    mockLockedPressesGetThrough = true;
  });

  afterEach(() => {
    mockLockedPressesGetThrough = false;
  });

  it('keeps the reminder off, and saves nothing, when the reminder switch is pressed while the athan is Off', async () => {
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(DHUHR);
    await render(<AlertSheet />);

    await fireEvent.press(screen.getByRole('switch'));
    await closeSheet();
    await settle();

    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(getReminderAlertType(ScheduleType.Standard, DHUHR)).toBe(AlertType.Off);
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  // arrow pressed, the interval saved at that end of the list
  it.each([
    ['Decrease', 5],
    ['Increase', 30],
  ] as const)(
    'keeps the interval, and saves nothing, when %s is pressed at the end of the list',
    async (arrow, interval) => {
      showLondonDay('2026-09-11', '14:00');
      setPrayerAlertType(ScheduleType.Standard, DHUHR, AlertType.Silent);
      setReminderAlertType(ScheduleType.Standard, DHUHR, AlertType.Silent);
      setReminderInterval(ScheduleType.Standard, DHUHR, interval);
      openSheetFor(DHUHR);
      await render(<AlertSheet />);

      await fireEvent.press(screen.getByRole('button', { name: arrow }));
      await closeSheet();
      await settle();

      expect(screen.getByText(`${interval} min`)).toBeOnTheScreen();
      expect(getReminderInterval(ScheduleType.Standard, DHUHR)).toBe(interval);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    }
  );
});

/**
 * The preference setters the alert sheet and the sound sheet commit through (stores/notifications.ts)
 *
 * `useNotification` saves the reminder alert, the reminder interval and the athan sound through these before it
 * schedules, and writes the originals back through the same setters when scheduling fails. Each write must land
 * on that one prayer's own name-keyed preference, visible to the next reschedule in the same session, and must
 * leave every other prayer, the other schedule and the at-time alert as they were.
 */

import { getDefaultStore } from 'jotai';

import { DEFAULT_REMINDER_INTERVAL, EXTRAS_ENGLISH, PRAYERS_ENGLISH, REMINDER_INTERVALS } from '@/shared/constants';
import { AlertType, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  extraPrayerAlertAtoms,
  extraReminderAlertAtoms,
  extraReminderIntervalAtoms,
  getPrayerAlertType,
  getReminderAlertType,
  getReminderInterval,
  getSoundPreference,
  setReminderAlertType,
  setReminderInterval,
  setSoundPreference,
  soundPreferenceAtom,
  standardPrayerAlertAtoms,
  standardReminderAlertAtoms,
  standardReminderIntervalAtoms,
} from '@/stores/notifications';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn(async () => undefined) }));

jest.mock('@/stores/sync', () => ({ sync: jest.fn(async () => undefined), getArmedDayChanges: jest.fn(() => 0) }));

// =============================================================================
// FIXTURES
// =============================================================================

const store = getDefaultStore();

const PRAYERS = [
  ...PRAYERS_ENGLISH.map((name, index) => ({ type: ScheduleType.Standard, name, index })),
  ...EXTRAS_ENGLISH.map((name, index) => ({ type: ScheduleType.Extra, name, index })),
];

const label = (type: ScheduleType, name: string) => `${type} ${name}`;

/** Every reminder alert, reminder interval and at-time alert, read through the getters the scheduler uses */
const everyPreference = () =>
  Object.fromEntries(
    PRAYERS.map(({ type, name, index }) => [
      label(type, name),
      {
        atTime: getPrayerAlertType(type, index),
        reminder: getReminderAlertType(type, index),
        interval: getReminderInterval(type, index),
      },
    ])
  );

beforeEach(() => {
  Database.database.clearAll();
  for (const atoms of [
    standardPrayerAlertAtoms,
    extraPrayerAlertAtoms,
    standardReminderAlertAtoms,
    extraReminderAlertAtoms,
  ]) {
    for (const atom of atoms) store.set(atom, AlertType.Off);
  }
  for (const atoms of [standardReminderIntervalAtoms, extraReminderIntervalAtoms]) {
    for (const atom of atoms) store.set(atom, DEFAULT_REMINDER_INTERVAL);
  }
  store.set(soundPreferenceAtom, 0);
  Database.database.clearAll();
});

// =============================================================================
// setReminderAlertType
// =============================================================================

describe('setReminderAlertType', () => {
  it.each(PRAYERS)('sets only the $type $name reminder, persisted under its own name', ({ type, name, index }) => {
    // At-time on first, as the sheet requires before a reminder can be chosen
    const atTimeAtoms = type === ScheduleType.Standard ? standardPrayerAlertAtoms : extraPrayerAlertAtoms;
    store.set(atTimeAtoms[index], AlertType.Sound);
    const expected = everyPreference();
    expected[label(type, name)].reminder = AlertType.Silent;

    setReminderAlertType(type, index, AlertType.Silent);

    expect(everyPreference()).toEqual(expected);
    expect(Database.database.getString(`preference_reminder_alert_${type}_${name.toLowerCase()}`)).toBe(
      String(AlertType.Silent)
    );
  });

  it('turns a reminder off without touching its at-time alert, unlike turning the at-time alert off', () => {
    store.set(standardPrayerAlertAtoms[3], AlertType.Sound);
    setReminderAlertType(ScheduleType.Standard, 3, AlertType.Sound);
    expect(getReminderAlertType(ScheduleType.Standard, 3)).toBe(AlertType.Sound);

    setReminderAlertType(ScheduleType.Standard, 3, AlertType.Off);

    expect(getReminderAlertType(ScheduleType.Standard, 3)).toBe(AlertType.Off);
    expect(getPrayerAlertType(ScheduleType.Standard, 3)).toBe(AlertType.Sound);
  });

  it('puts back the original value on a failed commit, the way the sheet rolls back', () => {
    store.set(extraPrayerAlertAtoms[1], AlertType.Silent);
    setReminderAlertType(ScheduleType.Extra, 1, AlertType.Silent);

    setReminderAlertType(ScheduleType.Extra, 1, AlertType.Sound);
    setReminderAlertType(ScheduleType.Extra, 1, AlertType.Silent);

    expect(getReminderAlertType(ScheduleType.Extra, 1)).toBe(AlertType.Silent);
    expect(Database.database.getString('preference_reminder_alert_extra_last third')).toBe(String(AlertType.Silent));
  });
});

// =============================================================================
// setReminderInterval
// =============================================================================

describe('setReminderInterval', () => {
  it.each(PRAYERS)('sets only the $type $name interval, persisted under its own name', ({ type, name, index }) => {
    const expected = everyPreference();
    expected[label(type, name)].interval = 25;

    setReminderInterval(type, index, 25);

    expect(everyPreference()).toEqual(expected);
    expect(Database.database.getString(`preference_reminder_interval_${type}_${name.toLowerCase()}`)).toBe('25');
  });

  it.each(REMINDER_INTERVALS.map((interval) => [interval]))('reads back an interval of %i minutes', (interval) => {
    setReminderInterval(ScheduleType.Extra, EXTRAS_ENGLISH.indexOf('Istijaba'), interval as ReminderInterval);

    expect(getReminderInterval(ScheduleType.Extra, EXTRAS_ENGLISH.indexOf('Istijaba'))).toBe(interval);
    // The reminder alert beside it is a different preference
    expect(getReminderAlertType(ScheduleType.Extra, EXTRAS_ENGLISH.indexOf('Istijaba'))).toBe(AlertType.Off);
  });
});

// =============================================================================
// setSoundPreference
// =============================================================================

describe('setSoundPreference', () => {
  it('stores the selected athan, and the one before it when a commit rolls back', () => {
    setSoundPreference(7);

    expect(getSoundPreference()).toBe(7);
    expect(Database.database.getString('preference_sound')).toBe('7');

    setSoundPreference(0);

    expect(getSoundPreference()).toBe(0);
    expect(Database.database.getString('preference_sound')).toBe('0');
  });

  it('changes no alert or reminder preference', () => {
    store.set(standardPrayerAlertAtoms[0], AlertType.Sound);
    const before = everyPreference();

    setSoundPreference(12);

    expect(everyPreference()).toEqual(before);
  });
});

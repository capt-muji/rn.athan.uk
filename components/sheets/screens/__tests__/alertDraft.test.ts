/**
 * The alert sheet's draft is what closing the sheet commits, so each rule here decides a saved setting: the values
 * the sheet opens on, whether picking an athan type asks for permission, and what the reminder toggle does.
 */

import { DEFAULT_REMINDER_INTERVAL, REMINDER_INTERVALS } from '@/shared/constants';
import { AlertType } from '@/shared/types';

import { initialReminderInterval, initialReminderType, selectionNeedsPermission, toggledReminder } from '../alertDraft';

const TYPE_BY_NAME = {
  Off: AlertType.Off,
  Silent: AlertType.Silent,
  Sound: AlertType.Sound,
} as const;

describe('initialReminderType', () => {
  it.each([
    ['Off', 'Silent'],
    ['Silent', 'Silent'],
    ['Sound', 'Sound'],
  ] as const)('a saved %s reminder opens with the toggle set to turn on %s', (stored, opensOn) => {
    expect(initialReminderType(TYPE_BY_NAME[stored])).toBe(TYPE_BY_NAME[opensOn]);
  });
});

describe('initialReminderInterval', () => {
  it.each(REMINDER_INTERVALS.map((interval) => [interval]))('keeps a saved %i minutes exactly', (interval) => {
    expect(initialReminderInterval(interval)).toBe(interval);
  });

  it('opens on the default for any other stored number, so the commit never writes a value the stepper cannot show', () => {
    const offered = new Set<number>(REMINDER_INTERVALS);
    const notReplaced: number[] = [];

    for (let stored = -60; stored <= 120; stored += 0.5) {
      if (offered.has(stored)) continue;
      if (initialReminderInterval(stored) !== DEFAULT_REMINDER_INTERVAL) notReplaced.push(stored);
    }
    for (const stored of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      if (initialReminderInterval(stored) !== DEFAULT_REMINDER_INTERVAL) notReplaced.push(stored);
    }

    expect(notReplaced).toEqual([]);
  });
});

describe('selectionNeedsPermission', () => {
  it.each([
    ['Off', 'Off', false],
    ['Off', 'Silent', true],
    ['Off', 'Sound', true],
    ['Silent', 'Off', false],
    ['Silent', 'Silent', false],
    ['Silent', 'Sound', false],
    ['Sound', 'Off', false],
    ['Sound', 'Silent', false],
    ['Sound', 'Sound', false],
  ] as const)('moving the athan from %s to %s asks for permission: %s', (from, to, asks) => {
    expect(selectionNeedsPermission(TYPE_BY_NAME[to], TYPE_BY_NAME[from])).toBe(asks);
  });
});

describe('toggledReminder', () => {
  it.each([
    [false, 'Silent'],
    [false, 'Sound'],
    [true, 'Silent'],
    [true, 'Sound'],
  ] as const)('is locked while the athan is Off (reminder on: %s, sound: %s)', (isReminderOn, reminderType) => {
    expect(toggledReminder(false, isReminderOn, TYPE_BY_NAME[reminderType])).toBeNull();
  });

  it.each(['Silent', 'Sound'] as const)('switches an on reminder off whatever its sound (%s)', (reminderType) => {
    expect(toggledReminder(true, true, TYPE_BY_NAME[reminderType])).toBe(AlertType.Off);
  });

  it.each(['Silent', 'Sound'] as const)(
    'switches an off reminder on with the sound last chosen (%s)',
    (reminderType) => {
      expect(toggledReminder(true, false, TYPE_BY_NAME[reminderType])).toBe(TYPE_BY_NAME[reminderType]);
    }
  );
});

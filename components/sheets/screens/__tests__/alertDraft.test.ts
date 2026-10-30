/**
 * The alert sheet's draft is what closing the sheet commits, so each rule here decides a saved setting: the values
 * the sheet opens on, whether picking an athan type asks for permission, and what the reminder toggle does.
 */

import { DEFAULT_REMINDER_INTERVAL, REMINDER_INTERVALS } from '@/shared/constants';
import { type AlertMenuState, AlertType } from '@/shared/types';

import { initialDraft, initialReminderInterval, initialReminderType, selectionNeedsPermission } from '../alertDraft';

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
    expect(selectionNeedsPermission({ selected: TYPE_BY_NAME[to], atTimeAlert: TYPE_BY_NAME[from] })).toBe(asks);
  });
});

describe('initialDraft', () => {
  const baseline = (athan: AlertType, alerts: [AlertType, AlertType]): AlertMenuState => ({
    atTimeAlert: athan,
    reminders: [
      { alert: alerts[0], interval: 10 },
      { alert: alerts[1], interval: 15 },
    ],
  });

  it('drafts the stored athan and each stored reminder while the athan is on', () => {
    const draft = initialDraft(baseline(AlertType.Silent, [AlertType.Sound, AlertType.Off]));

    expect(draft.atTimeAlert).toBe(AlertType.Silent);
    expect(draft.reminders.map((reminder) => reminder.alert)).toEqual([AlertType.Sound, AlertType.Off]);
    expect(draft.sounds).toEqual({ 0: AlertType.Sound, 1: AlertType.Silent });
    expect(draft.preservedAlerts).toEqual([AlertType.Sound, AlertType.Off]);
  });

  it('drafts every reminder Off with a Silent pill while the athan is Off, keeping the stored choices', () => {
    const draft = initialDraft(baseline(AlertType.Off, [AlertType.Sound, AlertType.Silent]));

    expect(draft.atTimeAlert).toBe(AlertType.Off);
    expect(draft.reminders.map((reminder) => reminder.alert)).toEqual([AlertType.Off, AlertType.Off]);
    expect(draft.sounds).toEqual({ 0: AlertType.Silent, 1: AlertType.Silent });
    expect(draft.preservedAlerts).toEqual([AlertType.Sound, AlertType.Silent]);
  });
});

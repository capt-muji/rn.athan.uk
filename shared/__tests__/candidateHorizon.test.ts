/**
 * The candidate walk's horizon, which must never be what limits how far ahead the app arms
 *
 * `collectCandidateRows` walks SCHEDULE_CANDIDATE_DAYS list days from each prayer's first
 * still-due day and drops every row already past. Those dropped rows sit at the HEAD of the walk,
 * so the horizon has to cover them on top of the days the budget pays for. A row firing on its own
 * list day leaves one; a row firing the evening before its list day leaves two once that evening's
 * row has passed, which is the case the old `budget + 1` could not afford.
 */

import { london } from '@/hooks/__tests__/londonDays';
import { NOTIFICATION_REQUEST_BUDGET, SCHEDULE_CANDIDATE_DAYS } from '@/shared/constants';
import { buildSchedulePlan, collectCandidateRows, schedulePlanKey } from '@/shared/notifications';
import { transformApiData } from '@/shared/prayer';
import type { RequiredTimeName } from '@/shared/types';
import { ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

/** Fajr just after midnight, so Midnight and Last Third fire the evening before their list day */
const WRAPPED = { fajr: '00:10', sunrise: '01:30', dhuhr: '06:00', asr: '09:00', magrib: '20:00', isha: '21:00' };

const saveWrappedDays = (count: number) => {
  const start = Date.UTC(2026, 8, 1);
  const payload: Record<string, Record<RequiredTimeName, string>> = {};
  for (let i = 0; i < count; i++) {
    payload[new Date(start + i * 86400000).toISOString().slice(0, 10)] = WRAPPED;
  }
  Database.saveAllPrayers(
    Object.entries(payload).flatMap(([date, t]) => transformApiData({ city: 'london', times: { [date]: t } }))
  );
};

const daysPlannedFor = (type: ScheduleType, name: string): number => {
  const onlyThisPrayer = (t: ScheduleType, n: string) => (t === type && n === name ? 1 : 0);
  const plan = buildSchedulePlan(collectCandidateRows(onlyThisPrayer), NOTIFICATION_REQUEST_BUDGET);
  return (plan.get(schedulePlanKey(type, name)) ?? []).length;
};

describe('the candidate horizon', () => {
  afterEach(() => jest.useRealTimers());

  it('is two more than the budget, so two past rows at the head cannot cost a day', () => {
    expect(SCHEDULE_CANDIDATE_DAYS).toBe(NOTIFICATION_REQUEST_BUDGET + 2);
  });

  it('spends the whole budget on Midnight at 22:30, when two of its rows have already fired', () => {
    jest.useFakeTimers({ now: london('2026-09-15', '22:30') });
    saveWrappedDays(130);

    expect(daysPlannedFor(ScheduleType.Extra, 'Midnight')).toBe(NOTIFICATION_REQUEST_BUDGET);
  });

  it('spends the whole budget on Last Third at 23:30, its own two-past-row hour', () => {
    jest.useFakeTimers({ now: london('2026-09-15', '23:30') });
    saveWrappedDays(130);

    expect(daysPlannedFor(ScheduleType.Extra, 'Last Third')).toBe(NOTIFICATION_REQUEST_BUDGET);
  });

  it('still spends the whole budget on a row that fires on its own list day', () => {
    jest.useFakeTimers({ now: london('2026-09-15', '22:30') });
    saveWrappedDays(130);

    expect(daysPlannedFor(ScheduleType.Standard, 'Fajr')).toBe(NOTIFICATION_REQUEST_BUDGET);
  });
});

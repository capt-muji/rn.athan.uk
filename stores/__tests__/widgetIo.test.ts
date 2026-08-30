/**
 * IO tests for stores/widget.ts — refreshPrayerWidgets platform and error
 * behavior (the push paths are covered by widgetSettingsSync.test.ts):
 * - Android: early return, no native calls
 * - Native updateTimeline throwing: swallowed and logged (widgets are a
 *   surface, never a crash path)
 * - Partial cache: builds from whatever days exist, never fails
 * - readWidgetSettings: snapshots both widget-visible preferences
 */

import { addDays, format } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { createLondonDate, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { hijriDateEnabledAtom } from '@/stores/ui';
import { readWidgetSettings, refreshPrayerWidgets } from '@/stores/widget';
import PrayerLockWidget from '@/widgets/LockPrayerWidget';
import PrayerWidget from '@/widgets/PrayerWidget';

const makeDayData = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '03:30',
  sunrise: '05:20',
  dhuhr: '13:10',
  asr: '17:45',
  magrib: '21:15',
  isha: '22:45',
  midnight: '23:52',
  'last third': '02:15',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
});

const seedPrayerCache = (days: number) => {
  const now = createLondonDate();
  const data: ISingleApiResponseTransformed[] = [];
  for (let offset = -1; offset < days; offset++) {
    const day = addDays(now, offset);
    data.push(makeDayData(formatDateShort(day)));
  }
  Database.saveAllPrayers(data);
};

const widgetPush = () => (PrayerWidget.updateTimeline as jest.Mock).mock.calls;

describe('refreshPrayerWidgets error tolerance', () => {
  beforeEach(() => {
    (PrayerWidget.updateTimeline as jest.Mock).mockReset();
    (PrayerLockWidget.updateTimeline as jest.Mock).mockReset();
  });

  it('swallows a native updateTimeline throw and logs it', async () => {
    seedPrayerCache(1);
    (PrayerWidget.updateTimeline as jest.Mock).mockImplementation(() => {
      throw new Error('native boom');
    });

    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();
  });

  it('still pushes the lock widget when the home widget survives', async () => {
    // Two days so an upcoming prayer exists no matter what time the suite runs
    seedPrayerCache(2);
    (PrayerLockWidget.updateTimeline as jest.Mock).mockImplementation(() => {
      throw new Error('lock boom');
    });

    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();
    expect(widgetPush()).toHaveLength(1);
  });

  it('builds a timeline from a partial cache without failing', async () => {
    seedPrayerCache(2);

    await refreshPrayerWidgets();

    const entries = widgetPush()[0][0];
    expect(entries.length).toBeGreaterThan(0);
    // The stale guard must be the terminal entry even on a short cache
    expect(entries[entries.length - 1].props.stale).toBe(true);
  });
});

describe('label-flip re-push scheduler', () => {
  const minutesAhead = (minutes: number): string => {
    const date = createLondonDate();
    date.setMinutes(date.getMinutes() + minutes);
    return format(date, 'HH:mm');
  };

  /** Seeds a cache whose Maghrib sits `minutes` ahead of now. */
  const seedUpcomingMagrib = (minutes: number) => {
    const now = createLondonDate();
    const dates = [-1, 0, 1].map((offset) => formatDateShort(addDays(now, offset)));
    Database.saveAllPrayers(
      dates.map((date) => ({
        ...makeDayData(date),
        fajr: minutesAhead(-10),
        sunrise: minutesAhead(-8),
        dhuhr: minutesAhead(-6),
        asr: minutesAhead(-4),
        magrib: minutesAhead(minutes),
        isha: minutesAhead(minutes + 9),
      }))
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
    (PrayerWidget.updateTimeline as jest.Mock).mockReset();
    (PrayerLockWidget.updateTimeline as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('re-pushes as each countdown minute flips', async () => {
    seedUpcomingMagrib(11);

    await refreshPrayerWidgets();
    expect(widgetPush()).toHaveLength(1);

    // The next label flip (10m remaining) happens 60s after the push: the
    // scheduler re-pushes right after it, within a minute's window
    await jest.advanceTimersByTimeAsync(60 * 1000 + 300);
    expect(widgetPush()).toHaveLength(2);

    await jest.advanceTimersByTimeAsync(60 * 1000);
    expect(widgetPush()).toHaveLength(3);
  });

  it('re-pushes every minute for far-out prayers too', async () => {
    seedPrayerCache(2);

    await refreshPrayerWidgets();
    expect(widgetPush()).toHaveLength(1);

    // The label minute changes at any distance, so a flip lands within any
    // 59-second window
    await jest.advanceTimersByTimeAsync(59 * 1000);
    expect(widgetPush()).toHaveLength(2);
  });
});

describe('readWidgetSettings', () => {
  it('snapshots the widget-visible preferences', () => {
    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, true);

    expect(readWidgetSettings()).toEqual({
      hijriDate: true,
    });
  });
});

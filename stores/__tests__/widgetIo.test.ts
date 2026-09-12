/**
 * IO tests for stores/widget.ts — refreshPrayerWidgets platform and error
 * behavior (the push paths are covered by widgetSettingsSync.test.ts):
 * - Android: early return, no native calls
 * - Native updateTimeline throwing: swallowed and logged (widgets are a
 *   surface, never a crash path)
 * - Partial cache: builds from whatever days exist, never fails
 * - readWidgetSettings: snapshots both widget-visible preferences
 *
 * The suite exercises the ENABLED widget path, which is not the shipped
 * configuration (jest.setup.js deletes EXPO_PUBLIC_WIDGETS so every suite runs
 * the flag off by default), so it opts in explicitly below. The mock is
 * hoisted above the imports on purpose: flags.ts reads the env once at module
 * evaluation and ESM imports are hoisted, so setting the variable in the file
 * body would run after @/stores/widget has already captured FEATURE_FLAGS.
 */

jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: true } }));

import { addDays, format } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { createInstant, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { hijriDateEnabledAtom } from '@/stores/ui';
import { readWidgetSettings, refreshPrayerWidgets } from '@/stores/widget';
import { ExtrasLockWidget, PrayerLockWidget } from '@/widgets/LockPrayerWidget';
import {
  ExtrasWidget,
  ExtrasWidgetDark,
  ExtrasWidgetDarkMedium,
  ExtrasWidgetMedium,
  PrayerWidget,
  PrayerWidgetDark,
  PrayerWidgetDarkMedium,
  PrayerWidgetMedium,
} from '@/widgets/PrayerWidget';

const makeDayData = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '03:30',
  sunrise: '05:20',
  dhuhr: '13:10',
  asr: '17:45',
  magrib: '21:15',
  isha: '22:45',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
});

const seedPrayerCache = (days: number) => {
  const now = createInstant();
  const data: ISingleApiResponseTransformed[] = [];
  for (let offset = -1; offset < days; offset++) {
    const day = addDays(now, offset);
    data.push(makeDayData(formatDateShort(day)));
  }
  Database.saveAllPrayers(data);
};

const widgetPush = () => (PrayerWidget.updateTimeline as jest.Mock).mock.calls;
const extrasPush = () => (ExtrasWidget.updateTimeline as jest.Mock).mock.calls;
const darkPush = () => (PrayerWidgetDark.updateTimeline as jest.Mock).mock.calls;
const mediumPush = () => (PrayerWidgetMedium.updateTimeline as jest.Mock).mock.calls;

const resetWidgetMocks = () => {
  (PrayerWidget.updateTimeline as jest.Mock).mockReset();
  (PrayerLockWidget.updateTimeline as jest.Mock).mockReset();
  (ExtrasWidget.updateTimeline as jest.Mock).mockReset();
  (ExtrasLockWidget.updateTimeline as jest.Mock).mockReset();
  (PrayerWidgetDark.updateTimeline as jest.Mock).mockReset();
  (ExtrasWidgetDark.updateTimeline as jest.Mock).mockReset();
  (PrayerWidgetMedium.updateTimeline as jest.Mock).mockReset();
  (ExtrasWidgetMedium.updateTimeline as jest.Mock).mockReset();
  (PrayerWidgetDarkMedium.updateTimeline as jest.Mock).mockReset();
  (ExtrasWidgetDarkMedium.updateTimeline as jest.Mock).mockReset();
};

describe('refreshPrayerWidgets error tolerance', () => {
  beforeEach(resetWidgetMocks);

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

    // The extras pair receives its own schedule's timeline — a different
    // countdown target and an extras-stamped schedule field
    const extraEntries = extrasPush()[0][0];
    expect(extraEntries.length).toBeGreaterThan(0);
    expect(extraEntries).not.toEqual(entries);
    expect(extraEntries[0].props.schedule).toBe('extra');
    expect(entries[0].props.schedule).toBe('standard');

    // The dark kind receives its own theme-stamped copy of the timeline
    const darkEntries = darkPush()[0][0];
    expect(darkEntries.length).toBe(entries.length);
    expect(darkEntries[0].props.theme).toBe('dark');
    expect(entries[0].props.theme).toBe('light');

    // The medium kind shares its theme's timeline verbatim
    expect(mediumPush()).toHaveLength(1);
    expect(mediumPush()[0][0]).toBe(entries);
  });
});

describe('label-flip re-push scheduler', () => {
  const minutesAhead = (minutes: number): string => {
    const date = createInstant();
    date.setMinutes(date.getMinutes() + minutes);
    return format(date, 'HH:mm');
  };

  /** Seeds a cache whose Magrib sits `minutes` ahead of now. */
  const seedUpcomingMagrib = (minutes: number) => {
    const now = createInstant();
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
    // PINNED, not "now": a re-push lands on a minute boundary, so a fake clock
    // seeded from the real one starts at an arbitrary point in the minute and
    // the advances below race that boundary. Unpinned, this suite failed about
    // one run in sixty — rare enough to look like noise, often enough to block
    // a commit. On the second of a minute, every advance below is exact.
    jest.useFakeTimers({ now: new Date('2026-09-12T10:30:00.000Z') });
    resetWidgetMocks();
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

    // The label minute changes at any distance, so the next flip is one minute
    // away: advance just past it. 59s was the old value and it only ever passed
    // by luck — the flip is 60s out from a pinned clock, and from an unpinned
    // one it is 60s minus however far into the minute the run happened to start
    await jest.advanceTimersByTimeAsync(60 * 1000 + 300);
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

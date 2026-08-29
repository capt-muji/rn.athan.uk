/**
 * IO tests for stores/widget.ts — refreshPrayerWidgets platform and error
 * behavior (the push paths are covered by widgetSettingsSync.test.ts):
 * - Android: early return, no native calls
 * - Native updateTimeline throwing: swallowed and logged (widgets are a
 *   surface, never a crash path)
 * - Partial cache: builds from whatever days exist, never fails
 * - readWidgetSettings: snapshots all three widget-visible preferences
 */

import { addDays } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { createLondonDate, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { countdownBarColorAtom, countdownBarShownAtom, showArabicNamesAtom } from '@/stores/ui';
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
    seedPrayerCache(1);
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

describe('readWidgetSettings', () => {
  it('snapshots all three widget-visible preferences', () => {
    const store = getDefaultStore();
    store.set(countdownBarColorAtom, '#abcdef');
    store.set(showArabicNamesAtom, false);
    store.set(countdownBarShownAtom, false);

    expect(readWidgetSettings()).toEqual({
      accentColor: '#abcdef',
      showArabic: false,
      showBar: false,
    });
  });
});

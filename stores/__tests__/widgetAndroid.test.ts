/**
 * Android push tests for stores/widget.ts
 *
 * Android widgets have no timeline: refreshPrayerWidgets pushes one
 * snapshot per kind (updateSnapshot with theme and size stamped per kind),
 * never touches the Lock kinds, and the label-flip chain reloads the four
 * home kinds of a schedule instead of re-pushing data — the layout computes
 * fresh content at render. With the androidWidgets flag off everything is a
 * no-op, exactly as the iOS flag gates the iOS paths.
 *
 * Separate file: overrides the react-native mock so Platform.OS is
 * 'android', and the flags mock so androidWidgets is on (jest.setup.js
 * leaves every flag off by default).
 */

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.android ?? options.default,
  },
}));

jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: false, androidWidgets: true } }));

import { addDays } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { createInstant, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { hijriDateEnabledAtom } from '@/stores/ui';
import { initWidgetSettingsSync, refreshPrayerWidgets } from '@/stores/widget';
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

const homeKinds = [
  PrayerWidget,
  PrayerWidgetMedium,
  PrayerWidgetDark,
  PrayerWidgetDarkMedium,
  ExtrasWidget,
  ExtrasWidgetMedium,
  ExtrasWidgetDark,
  ExtrasWidgetDarkMedium,
] as unknown as { updateSnapshot: jest.Mock; updateTimeline: jest.Mock; reload: jest.Mock }[];

const resetMocks = () => {
  for (const kind of homeKinds) {
    kind.updateSnapshot.mockReset();
    kind.updateTimeline.mockReset();
    kind.reload.mockReset();
  }
  (PrayerLockWidget.updateSnapshot as jest.Mock).mockReset();
  (ExtrasLockWidget.updateSnapshot as jest.Mock).mockReset();
  (PrayerLockWidget.updateTimeline as jest.Mock).mockReset();
  (ExtrasLockWidget.updateTimeline as jest.Mock).mockReset();
};

describe('Android snapshot pushes', () => {
  beforeEach(() => {
    resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('pushes one snapshot per home kind with theme and size stamped, never the lock kinds', async () => {
    seedPrayerCache(3);

    await refreshPrayerWidgets();

    const stamp = (call: unknown[]) => call[0] as { theme: string; size: string; schedule: string };
    const standardLightSmall = stamp((PrayerWidget.updateSnapshot as jest.Mock).mock.calls[0]);
    const standardLightMedium = stamp((PrayerWidgetMedium.updateSnapshot as jest.Mock).mock.calls[0]);
    const standardDarkSmall = stamp((PrayerWidgetDark.updateSnapshot as jest.Mock).mock.calls[0]);
    const standardDarkMedium = stamp((PrayerWidgetDarkMedium.updateSnapshot as jest.Mock).mock.calls[0]);
    const extrasSmall = stamp((ExtrasWidget.updateSnapshot as jest.Mock).mock.calls[0]);

    expect(standardLightSmall.theme).toBe('light');
    expect(standardLightSmall.size).toBe('small');
    expect(standardLightSmall.schedule).toBe('standard');
    expect(standardLightMedium).toMatchObject({ theme: 'light', size: 'medium', schedule: 'standard' });
    expect(standardDarkSmall).toMatchObject({ theme: 'dark', size: 'small', schedule: 'standard' });
    expect(standardDarkMedium).toMatchObject({ theme: 'dark', size: 'medium', schedule: 'standard' });
    expect(extrasSmall).toMatchObject({ theme: 'light', size: 'small', schedule: 'extra' });

    for (const kind of homeKinds) {
      expect(kind.updateSnapshot).toHaveBeenCalledTimes(1);
      expect(kind.updateTimeline).not.toHaveBeenCalled();
    }
    expect(PrayerLockWidget.updateSnapshot).not.toHaveBeenCalled();
    expect(PrayerLockWidget.updateTimeline).not.toHaveBeenCalled();
    expect(ExtrasLockWidget.updateSnapshot).not.toHaveBeenCalled();
    expect(ExtrasLockWidget.updateTimeline).not.toHaveBeenCalled();
  });

  it('carries the version, days window and horizon on every snapshot', async () => {
    seedPrayerCache(3);

    await refreshPrayerWidgets();

    const props = (PrayerWidget.updateSnapshot as jest.Mock).mock.calls[0][0] as {
      v: number;
      days: unknown[];
      horizonEpochMs: number;
    };
    expect(props.v).toBe(1);
    expect(props.days.length).toBeGreaterThan(1);
    expect(typeof props.horizonEpochMs).toBe('number');
  });

  it('reloads the home kinds at a minute flip instead of re-pushing snapshots', async () => {
    seedPrayerCache(3);

    await refreshPrayerWidgets();

    // Fast-forward past the next minute flip of the countdown target. The
    // push armed a timer at the flip; when it fires the four standard home
    // kinds reload and no fresh snapshot is written.
    jest.advanceTimersByTime(61_000);

    expect(PrayerWidget.reload).toHaveBeenCalled();
    expect(PrayerWidgetMedium.reload).toHaveBeenCalled();
    expect(PrayerWidgetDark.reload).toHaveBeenCalled();
    expect(PrayerWidgetDarkMedium.reload).toHaveBeenCalled();
    expect((PrayerWidget.updateSnapshot as jest.Mock).mock.calls.length).toBe(1);
  });

  it('rolls the window over when the flip target has passed', async () => {
    seedPrayerCache(3);

    await refreshPrayerWidgets();
    expect((PrayerWidget.updateSnapshot as jest.Mock).mock.calls.length).toBe(1);

    // Advance past every epoch in the window: the flip chain fires, sees the
    // target gone, and re-pushes a fresh snapshot
    await jest.advanceTimersByTimeAsync(5 * 24 * 3600 * 1000);

    expect((PrayerWidget.updateSnapshot as jest.Mock).mock.calls.length).toBeGreaterThan(1);
  });

  it('swallows a native updateSnapshot throw and logs it', async () => {
    seedPrayerCache(3);
    (PrayerWidget.updateSnapshot as jest.Mock).mockImplementation(() => {
      throw new Error('native boom');
    });

    await expect(refreshPrayerWidgets()).resolves.toBeUndefined();

    expect((PrayerWidget.updateSnapshot as jest.Mock).mock.calls.length).toBe(1);
  });

  it('warns and skips the push when the cache holds no readable prayer', async () => {
    Database.clearAllExcept([]);

    await refreshPrayerWidgets();

    for (const kind of homeKinds) {
      expect(kind.updateSnapshot).not.toHaveBeenCalled();
    }
  });

  it('logs no next prayer when every carried epoch is already past', async () => {
    // Yesterday only: readable rows exist (snapshot non-null) but nothing is
    // in the future, so the push carries no countdown target
    const now = createInstant();
    Database.saveAllPrayers([makeDayData(formatDateShort(addDays(now, -1)))]);

    await refreshPrayerWidgets();

    expect((PrayerWidget.updateSnapshot as jest.Mock).mock.calls.length).toBe(1);
  });

  it('re-submits snapshots when a widget-visible preference changes', async () => {
    seedPrayerCache(3);

    initWidgetSettingsSync();
    initWidgetSettingsSync(); // idempotent: one subscription
    resetMocks();

    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, !store.get(hijriDateEnabledAtom));

    await jest.advanceTimersByTimeAsync(1100);

    expect((PrayerWidget.updateSnapshot as jest.Mock).mock.calls.length).toBe(1);
  });
});

// The flag-off gate lives in widgetAndroidFlagOff.test.ts: a dedicated
// file with the flag mocked off at module scope, matching the iOS
// widgetFlagOff.test.ts pattern (jest's isolate + lazy-require interplay
// makes an in-file variant order-dependent).

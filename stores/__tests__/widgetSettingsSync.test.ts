/**
 * Unit tests for the settings-follow subscription in stores/widget.ts
 *
 * Widgets mirror in-app settings: changing a widget-visible preference
 * triggers a debounced timeline re-push. These tests verify the subscription
 * wiring (burst → single push, irrelevant atoms ignored, idempotent init)
 * and that the pushed entries carry the changed setting.
 */

import { addDays } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { createLondonDate, formatDateShort, formatHijriDateLong } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import { WIDGET_PROPS_VERSION } from '@/shared/widgetTypes';
import * as Database from '@/stores/database';
import { hijriDateEnabledAtom, popupUpdateEnabledAtom } from '@/stores/ui';
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

// =============================================================================
// TEST HELPERS
// =============================================================================

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

/** Seeds yesterday/today/tomorrow so the builder always finds upcoming prayers */
const seedPrayerCache = () => {
  const now = createLondonDate();
  const yesterday = addDays(now, -1);
  const tomorrow = addDays(now, 1);

  Database.saveAllPrayers([
    makeDayData(formatDateShort(yesterday)),
    makeDayData(formatDateShort(now)),
    makeDayData(formatDateShort(tomorrow)),
  ]);
};

const widgetPush = () => (PrayerWidget.updateTimeline as jest.Mock).mock.calls;
const lockPush = () => (PrayerLockWidget.updateTimeline as jest.Mock).mock.calls;
const extrasPush = () => (ExtrasWidget.updateTimeline as jest.Mock).mock.calls;
const extrasLockPush = () => (ExtrasLockWidget.updateTimeline as jest.Mock).mock.calls;
const darkPush = () => (PrayerWidgetDark.updateTimeline as jest.Mock).mock.calls;
const extrasDarkPush = () => (ExtrasWidgetDark.updateTimeline as jest.Mock).mock.calls;
const mediumPush = () => (PrayerWidgetMedium.updateTimeline as jest.Mock).mock.calls;
const extrasMediumPush = () => (ExtrasWidgetMedium.updateTimeline as jest.Mock).mock.calls;
const darkMediumPush = () => (PrayerWidgetDarkMedium.updateTimeline as jest.Mock).mock.calls;
const extrasDarkMediumPush = () => (ExtrasWidgetDarkMedium.updateTimeline as jest.Mock).mock.calls;

const resetWidgetMocks = () => {
  (PrayerWidget.updateTimeline as jest.Mock).mockClear();
  (PrayerLockWidget.updateTimeline as jest.Mock).mockClear();
  (ExtrasWidget.updateTimeline as jest.Mock).mockClear();
  (ExtrasLockWidget.updateTimeline as jest.Mock).mockClear();
  (PrayerWidgetDark.updateTimeline as jest.Mock).mockClear();
  (ExtrasWidgetDark.updateTimeline as jest.Mock).mockClear();
  (PrayerWidgetMedium.updateTimeline as jest.Mock).mockClear();
  (ExtrasWidgetMedium.updateTimeline as jest.Mock).mockClear();
  (PrayerWidgetDarkMedium.updateTimeline as jest.Mock).mockClear();
  (ExtrasWidgetDarkMedium.updateTimeline as jest.Mock).mockClear();
};

// =============================================================================
// SETTINGS-FOLLOW SUBSCRIPTION
// =============================================================================

describe('initWidgetSettingsSync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Pin the fake clock to :30 of the current minute. A push arms the
    // label-flip timer (fires at the countdown target's next minute flip);
    // when the wall-clock anchor lands inside the final ~750ms of a minute,
    // that timer sits inside the test's 1s advance and fires a spurious
    // extra push (the G.7 flake). At :30 the flip is ~30s away — outside
    // every advance in this suite.
    jest.setSystemTime(Math.floor(Date.now() / 60000) * 60000 + 30_000);
    (PrayerWidget.updateTimeline as jest.Mock).mockClear();
    (PrayerLockWidget.updateTimeline as jest.Mock).mockClear();
    seedPrayerCache();
    initWidgetSettingsSync();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('re-pushes the timeline when the Hijri setting changes', async () => {
    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, !store.get(hijriDateEnabledAtom));

    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);
    // Date label rendered in Hijri for the next prayer's day (label parity
    // itself is covered by the widgetTimeline suites)
    const first = widgetPush()[0][0][0];
    const nextDate = formatDateShort(new Date(first.props.nextEpochMs));
    expect(first.props.dateLabel).toBe(formatHijriDateLong(nextDate));
  });

  it('collapses a burst of setting changes into a single push', async () => {
    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, true);
    await jest.advanceTimersByTimeAsync(300);
    store.set(hijriDateEnabledAtom, false);
    await jest.advanceTimersByTimeAsync(300);
    store.set(hijriDateEnabledAtom, true);

    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);
    // The debounced push carries the FINAL state of the changed setting
    const first = widgetPush()[0][0][0];
    const nextDate = formatDateShort(new Date(first.props.nextEpochMs));
    expect(first.props.dateLabel).toBe(formatHijriDateLong(nextDate));
  });

  it('ignores changes to settings the widget does not show', async () => {
    const store = getDefaultStore();
    store.set(popupUpdateEnabledAtom, true);

    await jest.advanceTimersByTimeAsync(2000);

    expect(widgetPush()).toHaveLength(0);
    expect(lockPush()).toHaveLength(0);
  });

  it('does not push while the debounce window is still open', async () => {
    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, !store.get(hijriDateEnabledAtom));

    await jest.advanceTimersByTimeAsync(900);

    expect(widgetPush()).toHaveLength(0);
  });

  it('initializes only once (idempotent)', async () => {
    initWidgetSettingsSync();
    initWidgetSettingsSync();

    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, !store.get(hijriDateEnabledAtom));
    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(1);
  });

  it('pushes again for a later change after an earlier one fired', async () => {
    const store = getDefaultStore();
    store.set(hijriDateEnabledAtom, !store.get(hijriDateEnabledAtom));
    await jest.advanceTimersByTimeAsync(1000);
    expect(widgetPush()).toHaveLength(1);

    store.set(hijriDateEnabledAtom, !store.get(hijriDateEnabledAtom));
    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(2);
  });
});

// =============================================================================
// REFRESH INTEGRATION (subscription path exercises the same pusher)
// =============================================================================

describe('refreshPrayerWidgets integration', () => {
  beforeEach(() => {
    jest.useRealTimers();
    resetWidgetMocks();
  });

  it('pushes a non-empty timeline to both widgets from the seeded cache', async () => {
    seedPrayerCache();

    await refreshPrayerWidgets();

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);
    expect(extrasPush()).toHaveLength(1);
    expect(extrasLockPush()).toHaveLength(1);
    expect(darkPush()).toHaveLength(1);
    expect(extrasDarkPush()).toHaveLength(1);
    expect(mediumPush()).toHaveLength(1);
    expect(extrasMediumPush()).toHaveLength(1);
    expect(darkMediumPush()).toHaveLength(1);
    expect(extrasDarkMediumPush()).toHaveLength(1);

    const homeEntries = widgetPush()[0][0];
    const lockEntries = lockPush()[0][0];
    const extraEntries = extrasPush()[0][0];
    const extraLockEntries = extrasLockPush()[0][0];
    expect(homeEntries.length).toBeGreaterThan(0);
    expect(homeEntries).toEqual(lockEntries);
    expect(homeEntries[0].props.v).toBe(WIDGET_PROPS_VERSION);

    // The extras pair carries its own schedule's timeline — same contract,
    // different countdown targets, extras-stamped
    expect(extraEntries).toEqual(extraLockEntries);
    expect(extraEntries).not.toEqual(homeEntries);
    expect(homeEntries[0].props.schedule).toBe('standard');
    expect(extraEntries[0].props.schedule).toBe('extra');

    // The dark kinds carry theme-stamped copies of their schedule's timeline
    const darkEntries = darkPush()[0][0];
    const extrasDarkEntries = extrasDarkPush()[0][0];
    expect(homeEntries[0].props.theme).toBe('light');
    expect(darkEntries[0].props.theme).toBe('dark');
    expect(extrasDarkEntries[0].props.theme).toBe('dark');
    expect(extrasDarkEntries[0].props.schedule).toBe('extra');
    expect(darkEntries.length).toBe(homeEntries.length);
    expect(darkEntries).not.toEqual(homeEntries);
  });

  it('skips the push entirely when the prayer cache is empty', async () => {
    Database.clearPrefix('prayer_');

    await refreshPrayerWidgets();

    expect(widgetPush()).toHaveLength(0);
    expect(lockPush()).toHaveLength(0);
    expect(extrasPush()).toHaveLength(0);
    expect(extrasLockPush()).toHaveLength(0);
    expect(darkPush()).toHaveLength(0);
    expect(extrasDarkPush()).toHaveLength(0);
    expect(mediumPush()).toHaveLength(0);
    expect(extrasMediumPush()).toHaveLength(0);
    expect(darkMediumPush()).toHaveLength(0);
    expect(extrasDarkMediumPush()).toHaveLength(0);
  });
});

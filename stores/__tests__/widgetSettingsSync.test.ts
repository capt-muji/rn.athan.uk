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

import { createLondonDate, formatDateShort } from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { countdownBarColorAtom, countdownBarShownAtom, popupUpdateEnabledAtom, showArabicNamesAtom } from '@/stores/ui';
import { initWidgetSettingsSync, refreshPrayerWidgets } from '@/stores/widget';
import PrayerLockWidget from '@/widgets/LockPrayerWidget';
import PrayerWidget from '@/widgets/PrayerWidget';

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

// =============================================================================
// SETTINGS-FOLLOW SUBSCRIPTION
// =============================================================================

describe('initWidgetSettingsSync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (PrayerWidget.updateTimeline as jest.Mock).mockClear();
    (PrayerLockWidget.updateTimeline as jest.Mock).mockClear();
    seedPrayerCache();
    initWidgetSettingsSync();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('re-pushes the timeline when a widget-visible setting changes', async () => {
    const store = getDefaultStore();
    store.set(countdownBarColorAtom, '#00ff88');

    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);
    expect(widgetPush()[0][0][0].props.accentColor).toBe('#00ff88');
  });

  it('carries the bar-visibility setting into the re-pushed timeline', async () => {
    const store = getDefaultStore();
    store.set(countdownBarShownAtom, false);

    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()[0][0][0].props.showBar).toBe(false);
  });

  it('collapses a burst of setting changes into a single push', async () => {
    const store = getDefaultStore();
    store.set(countdownBarColorAtom, '#123456');
    await jest.advanceTimersByTimeAsync(300);
    store.set(showArabicNamesAtom, false);
    await jest.advanceTimersByTimeAsync(300);
    store.set(countdownBarShownAtom, !store.get(countdownBarShownAtom));

    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);
    // The debounced push carries the FINAL state of every changed setting
    const props = widgetPush()[0][0][0].props;
    expect(props.accentColor).toBe('#123456');
    expect(props.showArabic).toBe(false);
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
    store.set(countdownBarColorAtom, '#abcdef');

    await jest.advanceTimersByTimeAsync(900);

    expect(widgetPush()).toHaveLength(0);
  });

  it('initializes only once (idempotent)', async () => {
    initWidgetSettingsSync();
    initWidgetSettingsSync();

    const store = getDefaultStore();
    store.set(countdownBarColorAtom, '#112233');
    await jest.advanceTimersByTimeAsync(1000);

    expect(widgetPush()).toHaveLength(1);
  });

  it('pushes again for a later change after an earlier one fired', async () => {
    const store = getDefaultStore();
    store.set(countdownBarColorAtom, '#445566');
    await jest.advanceTimersByTimeAsync(1000);
    expect(widgetPush()).toHaveLength(1);

    store.set(showArabicNamesAtom, !store.get(showArabicNamesAtom));
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
    (PrayerWidget.updateTimeline as jest.Mock).mockClear();
    (PrayerLockWidget.updateTimeline as jest.Mock).mockClear();
  });

  it('pushes a non-empty timeline to both widgets from the seeded cache', async () => {
    seedPrayerCache();

    await refreshPrayerWidgets();

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);

    const homeEntries = widgetPush()[0][0];
    const lockEntries = lockPush()[0][0];
    expect(homeEntries.length).toBeGreaterThan(0);
    expect(homeEntries).toEqual(lockEntries);
    expect(homeEntries[0].props.v).toBe(1);
  });

  it('skips the push entirely when the prayer cache is empty', async () => {
    Database.clearPrefix('prayer_');

    await refreshPrayerWidgets();

    expect(widgetPush()).toHaveLength(0);
    expect(lockPush()).toHaveLength(0);
  });
});

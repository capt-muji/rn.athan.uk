/**
 * Unit tests for the settings-follow subscription in stores/widget.ts
 *
 * Widgets mirror in-app settings: changing a widget-visible preference
 * triggers a debounced timeline re-push. These tests verify the subscription
 * wiring (burst → single push, irrelevant atoms ignored, idempotent init)
 * and that the pushed entries carry the changed setting.
 *
 * The suite exercises the ENABLED widget path, which is not the shipped
 * configuration (jest.setup.js deletes EXPO_PUBLIC_WIDGETS so every suite runs
 * the flag off by default), so it opts in explicitly below. The mock is
 * hoisted above the imports on purpose: flags.ts reads the env once at module
 * evaluation and ESM imports are hoisted, so setting the variable in the file
 * body would run after @/stores/widget has already captured FEATURE_FLAGS.
 */

jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: true } }));

import { addDays } from 'date-fns';
import { getDefaultStore } from 'jotai';

import { createInstant, formatDateLong, formatDateShort, formatHijriDateLong } from '@/shared/time';
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

/**
 * A London midsummer day. Isha at 01:05 is stored under the day it belongs to
 * and lands on the NEXT calendar day, so every entry in the Magrib->Isha
 * segment has a `belongsToDate` one day behind the calendar date of its own
 * countdown target. That divergence is the whole point of the fixture: with a
 * pre-midnight Isha the two dates coincide and no assertion here can tell the
 * contract (belongsToDate) from the most likely way it regresses (the
 * calendar date of nextEpochMs).
 */
const makeDayData = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '03:30',
  sunrise: '05:20',
  dhuhr: '13:10',
  asr: '17:45',
  magrib: '21:15',
  isha: '01:05',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
});

/**
 * 23:30:30 London on 21 June — inside the Magrib->Isha segment, so the
 * countdown target is Isha at 01:05 on the 22nd, which belongs to the 21st.
 * Seconds are :30 for the reason the beforeEach notes.
 */
const NIGHT_INSTANT = new Date('2026-06-21T22:30:30.000Z');
const NIGHT_BELONGS_TO = '2026-06-21';
const NIGHT_TARGET_CALENDAR_DATE = '2026-06-22';

/** 14:00:30 London the same day: the target is Asr, whose two dates agree. */
const AFTERNOON_INSTANT = new Date('2026-06-21T13:00:30.000Z');
const AFTERNOON_BELONGS_TO = '2026-06-21';

/** Seeds yesterday/today/tomorrow so the builder always finds upcoming prayers */
const seedPrayerCache = () => {
  const now = createInstant();
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
    // Pinned to a fixed instant at :30 of the minute. A push arms the
    // label-flip timer (fires at the countdown target's next minute flip);
    // when the wall-clock anchor lands inside the final ~750ms of a minute,
    // that timer sits inside the test's 1s advance and fires a spurious
    // extra push (the G.7 flake). At :30 the flip is ~30s away — outside
    // every advance in this suite. The DATE is pinned too, not derived from
    // the real clock: these tests assert the countdown target's Islamic day,
    // which only differs from its calendar day inside the night segment, so a
    // run-time-of-day-dependent anchor would check the interesting case a few
    // hours out of every twenty-four and pass vacuously the rest.
    jest.setSystemTime(NIGHT_INSTANT);
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
    // Date label rendered in Hijri for the next prayer's ISLAMIC day (label
    // parity itself is covered by the widgetTimeline suites)
    const first = widgetPush()[0][0][0];
    expect(first.props.dateLabel).toBe(formatHijriDateLong(NIGHT_BELONGS_TO));
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
    expect(first.props.dateLabel).toBe(formatHijriDateLong(NIGHT_BELONGS_TO));
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
// DATE LABEL CONTRACT
// =============================================================================

/**
 * `dateLabel` names the countdown target's belongsToDate — its Islamic day —
 * not the calendar date the target's instant falls on. The two agree for most
 * of the day, which is how an assertion against the calendar date stood here
 * unchallenged; it would also have gone on passing if the builder swapped to
 * the calendar date, which is the single most likely way the Islamic-day rule
 * regresses.
 *
 * Both ends of the range are pinned on purpose. The night case alone would be
 * satisfied by a builder that always stepped one day back, and the afternoon
 * case alone cannot tell the two rules apart at all.
 */
describe('widget date label', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetWidgetMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  /** Pushes from `instant` with the Hijri preference off, and returns the
   *  head entry — the one the widget is showing at the push. */
  const headEntryAt = async (instant: Date) => {
    jest.setSystemTime(instant);
    seedPrayerCache();
    getDefaultStore().set(hijriDateEnabledAtom, false);

    await refreshPrayerWidgets();

    return widgetPush()[0][0][0];
  };

  it('names the Islamic day, not the calendar day, when the target crosses midnight', async () => {
    const head = await headEntryAt(NIGHT_INSTANT);

    // The target genuinely is on the next calendar day. Asserted, so the case
    // cannot quietly stop crossing and leave the check below vacuous.
    expect(formatDateShort(new Date(head.props.nextEpochMs))).toBe(NIGHT_TARGET_CALENDAR_DATE);

    expect(head.props.dateLabel).toBe(formatDateLong(NIGHT_BELONGS_TO));
    expect(head.props.dateLabel).not.toBe(formatDateLong(NIGHT_TARGET_CALENDAR_DATE));
  });

  it('names the same day when the target does not cross midnight', async () => {
    const head = await headEntryAt(AFTERNOON_INSTANT);

    // Here the two dates agree, which is what stops a blanket day-shift from
    // passing as a fix for the case above.
    expect(formatDateShort(new Date(head.props.nextEpochMs))).toBe(AFTERNOON_BELONGS_TO);
    expect(head.props.dateLabel).toBe(formatDateLong(AFTERNOON_BELONGS_TO));
  });
});

// =============================================================================
// PER-SCHEDULE LABEL-FLIP PUSHES
// =============================================================================

describe('label-flip pushes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Same :30 pinning discipline as the subscription suite: the flip timers
    // arm at the countdown target's next minute flip, which for minute-aligned
    // targets is the next wall-clock :00 (+250ms epsilon) — ~30s away at :30,
    // outside every advance below except the deliberate one.
    jest.setSystemTime(Math.floor(Date.now() / 60000) * 60000 + 30_000);
    resetWidgetMocks();
    seedPrayerCache();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('re-pushes every schedule at the minute flip, each to only its own kinds', async () => {
    await refreshPrayerWidgets();
    resetWidgetMocks();

    // Minute-aligned targets flip at the next wall-clock :00 + epsilon
    const msIntoMinute = Date.now() % 60000;
    const msToFlip = 60000 - msIntoMinute + 250;
    await jest.advanceTimersByTimeAsync(msToFlip);

    expect(widgetPush()).toHaveLength(1);
    expect(lockPush()).toHaveLength(1);
    expect(darkPush()).toHaveLength(1);
    expect(mediumPush()).toHaveLength(1);
    expect(darkMediumPush()).toHaveLength(1);
    expect(extrasPush()).toHaveLength(1);
    expect(extrasLockPush()).toHaveLength(1);
    expect(extrasDarkPush()).toHaveLength(1);
    expect(extrasMediumPush()).toHaveLength(1);
    expect(extrasDarkMediumPush()).toHaveLength(1);
  });

  it('flip pushes reuse the cached sequence instead of re-reading the prayer DB', async () => {
    await refreshPrayerWidgets();
    resetWidgetMocks();
    // Wipe the underlying cache: a label-flip push must still produce full
    // timelines from the cached sequence (per-minute pushes never touch the
    // DB — the next full refresh is what heals an emptied cache).
    Database.clearPrefix('prayer_');

    const msIntoMinute = Date.now() % 60000;
    const msToFlip = 60000 - msIntoMinute + 250;
    await jest.advanceTimersByTimeAsync(msToFlip);

    expect(widgetPush()).toHaveLength(1);
    const entries = widgetPush()[0][0];
    expect(entries.length).toBeGreaterThan(0);
    expect(extrasPush()).toHaveLength(1);
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

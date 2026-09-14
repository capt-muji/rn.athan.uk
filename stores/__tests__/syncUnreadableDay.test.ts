/**
 * A day the provider could not give: what a download stores around it, whether it is ever downloaded again, and
 * what the running app shows across its two 00:00s
 *
 * Runs the real sync(), API client, database, schedule and countdown stores, list builder and sequence rules. The
 * network, the widgets, the logger, the build config and the upgrade check are stubbed. The download holds the
 * published London days from 11 to 20 September 2026, with 14 September either missing from the answer or in it with
 * every time unreadable, so a stored day can be told from a dropped one and a neighbour from its copy.
 *
 * Every instant and count expected here was worked out outside the app, from the published times with Python's
 * zoneinfo.
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

// The real fetch path, not MOCK_DATA_SIMPLE
jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => true,
  isPreview: () => false,
}));

jest.mock('@/shared/config', () => {
  const actual = jest.requireActual('@/shared/config');
  return {
    ...actual,
    APP_CONFIG: { ...actual.APP_CONFIG, isDev: false, apiKey: 'test-key' },
    isProd: () => true,
    isPreview: () => false,
  };
});

jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn() }));
jest.mock('@/stores/version', () => ({ handleAppUpgrade: jest.fn() }));

import { getDefaultStore } from 'jotai/vanilla';

import { type CountdownStore, type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import { clearOverlayBoundary, getCountdownAtom } from '@/stores/countdown';
import * as Database from '@/stores/database';
import { extraSequenceAtom, getDisplayDate, getSequenceAtom, standardSequenceAtom } from '@/stores/schedule';

import { sync } from '../sync';

// =============================================================================
// TEST HELPERS
// =============================================================================

const STANDARD = ScheduleType.Standard;
const EXTRA = ScheduleType.Extra;

const store = getDefaultStore();

const THE_DAY = '2026-09-14';

/** Published London times from the provider's 2026 download: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha */
const SEPTEMBER: Record<string, string[]> = {
  '2026-09-11': ['04:54', '06:26', '13:02', '16:29', '19:28', '20:42'],
  '2026-09-12': ['04:56', '06:28', '13:02', '16:27', '19:25', '20:39'],
  '2026-09-13': ['04:57', '06:29', '13:02', '16:26', '19:23', '20:37'],
  '2026-09-14': ['04:59', '06:31', '13:01', '16:24', '19:21', '20:35'],
  '2026-09-15': ['05:00', '06:32', '13:01', '16:23', '19:18', '20:33'],
  '2026-09-16': ['05:03', '06:34', '13:01', '16:21', '19:16', '20:31'],
  '2026-09-17': ['05:05', '06:36', '13:00', '16:20', '19:14', '20:29'],
  '2026-09-18': ['05:06', '06:37', '13:00', '16:18', '19:11', '20:26'],
  '2026-09-19': ['05:09', '06:39', '12:59', '16:16', '19:09', '20:24'],
  '2026-09-20': ['05:10', '06:40', '12:59', '16:15', '19:07', '20:22'],
};

/** The neighbours as a download must store them, written out rather than worked out */
const STORED_13: ISingleApiResponseTransformed = {
  date: '2026-09-13',
  fajr: '04:57',
  sunrise: '06:29',
  dhuhr: '13:02',
  asr: '16:26',
  magrib: '19:23',
  isha: '20:37',
  suhoor: '04:37',
  duha: '06:49',
  istijaba: '18:23',
};
const STORED_15: ISingleApiResponseTransformed = {
  date: '2026-09-15',
  fajr: '05:00',
  sunrise: '06:32',
  dhuhr: '13:01',
  asr: '16:23',
  magrib: '19:18',
  isha: '20:33',
  suhoor: '04:40',
  duha: '06:52',
  istijaba: '18:18',
};

interface Shape {
  shape: string;
  /** How the provider's answer carries the day, or undefined when it leaves the day out */
  answered: Record<string, string> | undefined;
  /** How the day is stored afterwards */
  stored: ISingleApiResponseTransformed | null;
}

const SHAPES: Shape[] = [
  { shape: 'missing from the answer', answered: undefined, stored: null },
  {
    shape: 'in the answer with every time unreadable',
    answered: { fajr: '-----', sunrise: '-----', dhuhr: '-----', asr: '-----', magrib: '-----', isha: '-----' },
    stored: {
      date: THE_DAY,
      fajr: null,
      sunrise: null,
      dhuhr: null,
      asr: null,
      magrib: null,
      isha: null,
      suhoor: null,
      duha: null,
      istijaba: null,
    },
  },
];

/** Answers a request for 2026 with September's days, the day carried as the shape says; anything else is a failure */
const serveSeptember = ({ answered }: Shape) => {
  const times: Record<string, unknown> = {};
  for (const [date, [fajr, sunrise, dhuhr, asr, magrib, isha]] of Object.entries(SEPTEMBER)) {
    if (date !== THE_DAY) times[date] = { date, fajr, sunrise, dhuhr, asr, magrib, isha };
    else if (answered) times[date] = { date, ...answered };
  }

  global.fetch = jest.fn(async (url: unknown) => {
    if (!/[?&]year=2026(&|$)/.test(String(url))) throw new Error(`Unexpected request: ${String(url)}`);
    return { ok: true, status: 200, json: async () => ({ city: 'london', times }) };
  }) as unknown as typeof fetch;
};

const requests = () => jest.mocked(global.fetch).mock.calls.length;

const storedPrayerDates = () =>
  Database.database
    .getAllKeys()
    .filter((key) => /^prayer_\d{4}-\d{2}-\d{2}$/.test(key))
    .map((key) => key.slice('prayer_'.length))
    .sort();

/** Every stored key with its raw value */
const everythingStored = () => {
  const keys = Database.database.getAllKeys().sort();
  return Object.fromEntries(keys.map((key) => [key, Database.database.getString(key)]));
};

/** The day's rows as a schedule holds them, each row with no readable time in brackets */
const rowsOf = (type: ScheduleType, listDay: string) =>
  (store.get(getSequenceAtom(type))?.prayers ?? [])
    .filter((prayer) => prayer.belongsToDate === listDay)
    .map((prayer) => (prayer.datetime ? prayer.english : `[${prayer.english}]`));

const onScreen = (type: ScheduleType) => ({
  listDay: getDisplayDate(type),
  countdown: store.get(getCountdownAtom(type)),
});

const WAITING: CountdownStore = { timeLeft: null, name: '...' };

/** Stopped in afterEach, so a failed assertion cannot leave atoms mounted for the next test */
const subscriptions: (() => void)[] = [];

const recordWrites = (type: ScheduleType): string[] => {
  const writes: string[] = [];
  subscriptions.push(store.sub(getSequenceAtom(type), () => writes.push(new Date().toISOString())));
  return writes;
};

const recordCountdown = (type: ScheduleType): CountdownStore[] => {
  const values: CountdownStore[] = [];
  subscriptions.push(store.sub(getCountdownAtom(type), () => values.push(store.get(getCountdownAtom(type)))));
  return values;
};

beforeEach(() => {
  Database.database.clearAll();
  store.set(standardSequenceAtom, null);
  store.set(extraSequenceAtom, null);
  store.set(overlayAtom, { isOn: false, selectedPrayerIndex: 0, scheduleType: STANDARD });
  clearOverlayBoundary();
});

afterEach(() => {
  for (const stop of subscriptions.splice(0)) stop();
  jest.clearAllTimers();
  jest.useRealTimers();
});

// =============================================================================
// WHAT IS STORED, AND WHEN IT IS ASKED FOR AGAIN
// =============================================================================

describe.each(SHAPES)('14 September $shape', (shape) => {
  it('caches the readable days around it and does not download again, the evening before, on the day or after it', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-13T21:00:00Z') });
    serveSeptember(shape);

    await sync();

    expect(requests()).toBe(1);
    expect(storedPrayerDates()).toEqual(
      Object.keys(SEPTEMBER).filter((date) => date >= '2026-09-12' && (date !== THE_DAY || shape.stored !== null))
    );
    expect(Database.getPrayerByDateString('2026-09-13')).toEqual(STORED_13);
    expect(Database.getPrayerByDateString('2026-09-15')).toEqual(STORED_15);
    expect(Database.getPrayerByDateString(THE_DAY)).toEqual(shape.stored);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
    const afterDownload = everythingStored();

    // A return to the app that evening, then launches on the day and the day after
    for (const instant of ['2026-09-13T21:00:30Z', '2026-09-14T08:00:00Z', '2026-09-15T08:00:00Z']) {
      jest.setSystemTime(new Date(instant));
      await sync();
    }

    expect(requests()).toBe(1);
    expect(everythingStored()).toEqual(afterDownload);
  });

  it('installed on the day itself, downloads once and not again on the next launch that day', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    serveSeptember(shape);

    await sync();
    await sync();

    expect(requests()).toBe(1);
    expect(storedPrayerDates()).toEqual(
      Object.keys(SEPTEMBER).filter((date) => date >= '2026-09-13' && (date !== THE_DAY || shape.stored !== null))
    );
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
    // The day is on screen as itself, never as the day after it
    expect(onScreen(STANDARD)).toEqual({ listDay: THE_DAY, countdown: WAITING });
    expect(onScreen(EXTRA)).toEqual({ listDay: THE_DAY, countdown: WAITING });
  });

  // =============================================================================
  // THE RUNNING APP ACROSS THE DAY'S TWO 00:00s
  // =============================================================================

  it('shows the day from its own 00:00 to the next with the app left open, and asks for nothing more', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-13T21:00:00Z') });
    serveSeptember(shape);

    await sync();

    // Every row of the 13th has passed and the 14th has no readable time, so the 13th waits for its own 00:00
    expect(onScreen(STANDARD)).toEqual({ listDay: '2026-09-13', countdown: WAITING });
    expect(onScreen(EXTRA)).toEqual({ listDay: '2026-09-13', countdown: WAITING });

    jest.setSystemTime(new Date('2026-09-13T22:59:58Z'));
    const standardIntoTheDay = recordWrites(STANDARD);
    const extraIntoTheDay = recordWrites(EXTRA);
    jest.advanceTimersByTime(4000);

    expect(standardIntoTheDay).toEqual(['2026-09-13T23:00:00.000Z']);
    expect(extraIntoTheDay).toEqual(['2026-09-13T23:00:00.000Z']);
    expect(onScreen(STANDARD)).toEqual({ listDay: THE_DAY, countdown: WAITING });
    expect(onScreen(EXTRA)).toEqual({ listDay: THE_DAY, countdown: WAITING });
    expect(rowsOf(STANDARD, THE_DAY)).toEqual(['[Fajr]', '[Sunrise]', '[Dhuhr]', '[Asr]', '[Magrib]', '[Isha]']);
    expect(rowsOf(EXTRA, THE_DAY)).toEqual(['[Midnight]', '[Last Third]', '[Suhoor]', '[Duha]']);

    // The user comes back during the day, which syncs
    jest.setSystemTime(new Date('2026-09-14T08:00:00Z'));
    await sync();
    expect(onScreen(STANDARD)).toEqual({ listDay: THE_DAY, countdown: WAITING });
    expect(onScreen(EXTRA)).toEqual({ listDay: THE_DAY, countdown: WAITING });

    jest.setSystemTime(new Date('2026-09-14T22:59:58Z'));
    const standardOutOfTheDay = recordWrites(STANDARD);
    const extraOutOfTheDay = recordWrites(EXTRA);
    const standardCountdown = recordCountdown(STANDARD);
    const extraCountdown = recordCountdown(EXTRA);
    jest.advanceTimersByTime(4000);

    expect(standardOutOfTheDay).toEqual(['2026-09-14T23:00:00.000Z']);
    expect(extraOutOfTheDay).toEqual(['2026-09-14T23:00:00.000Z']);
    expect(getDisplayDate(STANDARD)).toBe('2026-09-15');
    expect(getDisplayDate(EXTRA)).toBe('2026-09-15');
    // --:-- until the 00:00 tick, then Fajr at 05:00 BST and Suhoor at 04:40 BST from that same tick
    expect(standardCountdown).toEqual([
      WAITING,
      { timeLeft: 18000, name: 'Fajr' },
      { timeLeft: 17999, name: 'Fajr' },
      { timeLeft: 17998, name: 'Fajr' },
    ]);
    expect(extraCountdown).toEqual([
      WAITING,
      { timeLeft: 16800, name: 'Suhoor' },
      { timeLeft: 16799, name: 'Suhoor' },
      { timeLeft: 16798, name: 'Suhoor' },
    ]);

    expect(requests()).toBe(1);
  });
});

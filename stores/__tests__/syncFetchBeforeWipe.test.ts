/**
 * A refresh fetches first, and swaps the cache only once the year has arrived
 *
 * Runs the real `sync()` over the real database, API client and clock helpers. The network, the
 * sequences, the countdowns, the widgets, the logger, the build config and the upgrade check are
 * stubbed, so what these tests prove about the stored keys is the refresh's doing, not a whole
 * launch's. `sync.test.ts` mocks the database, so it can say which calls were made but never what
 * a user is left holding when a fetch fails.
 *
 * Every cache here holds weeks of days, because with a single cached day "wiped, then the fetch
 * failed" and "never wiped" can look alike.
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

jest.mock('@/stores/schedule', () => ({ setSequence: jest.fn() }));
jest.mock('@/stores/countdown', () => ({ startCountdowns: jest.fn() }));
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn() }));
jest.mock('@/stores/version', () => ({ handleAppUpgrade: jest.fn() }));

import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';

import { sync } from '../sync';

// =============================================================================
// TEST HELPERS
// =============================================================================

const DAY_MS = 86_400_000;

/** Consecutive YYYY-MM-DD dates, stepped from UTC noon so the machine's timezone cannot shift them */
const days = (first: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => {
    const instant = Date.parse(`${first}T12:00:00Z`) + index * DAY_MS;
    return new Date(instant).toISOString().slice(0, 10);
  });

const hhmm = (minutes: number) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
};

/** What the install already holds, and what today's download brings, a minute apart */
const CACHED = 0;
const DOWNLOADED = 1;

const apiTimes = (edition: number) => ({
  fajr: hhmm(290 + edition),
  sunrise: hhmm(390 + edition),
  dhuhr: hhmm(780 + edition),
  asr: hhmm(990 + edition),
  magrib: hhmm(1160 + edition),
  isha: hhmm(1240 + edition),
});

const cachedDay = (date: string): ISingleApiResponseTransformed => ({
  date,
  ...apiTimes(CACHED),
  suhoor: '04:30',
  duha: '06:50',
  istijaba: '18:20',
});

const BOOKKEEPING_KEY = 'scheduled_notifications_standard_0_athan_standard_fajr_2026-09-15';
const REMINDER_KEY = 'scheduled_reminders_standard_0_reminder_standard_fajr_2026-09-15_10';
const KEPT_KEYS = [
  'app_installed_version',
  'whats_new_shown_version',
  'cache_schema_version',
  'preference_athan_sound',
  'prayer_max_english_width_standard',
  BOOKKEEPING_KEY,
  REMINDER_KEY,
];

/** An install that has been running a while: prayer days, markers, settings and alarm records */
const installHolding = (dates: string[], fetchedYears: Record<number, true>) => {
  Database.saveAllPrayers(dates.map(cachedDay));
  Database.setItem('fetched_years', fetchedYears);
  Database.setItem('app_installed_version', '1.0.0');
  Database.setItem('whats_new_shown_version', '1.0.0');
  Database.setItem('cache_schema_version', 1);
  Database.setItem('preference_athan_sound', 7);
  Database.setItem('prayer_max_english_width_standard', 96);
  Database.setItem(BOOKKEEPING_KEY, { id: 'athan_standard_fajr_2026-09-15' });
  Database.setItem(REMINDER_KEY, { id: 'reminder_standard_fajr_2026-09-15_10' });
};

type Answer = 'offline' | 'unpublished' | 'published' | { unreadable: string[] };

const yearTimes = (year: number, unreadable: string[] = []) => {
  const times: Record<string, unknown> = {};
  for (const date of days(`${year}-01-01`, 365)) {
    times[date] = unreadable.includes(date) ? { ...apiTimes(DOWNLOADED), sunrise: '-----' } : apiTimes(DOWNLOADED);
  }
  return times;
};

const yearOf = (url: unknown) => Number(/year=(\d{4})/.exec(String(url))?.[1]);

/** Answers each requested year the way the network and the endpoint would */
const serveYears = (answers: Record<number, Answer>) => {
  global.fetch = jest.fn(async (url: unknown) => {
    const year = yearOf(url);
    const answer = answers[year];

    if (answer === undefined) throw new Error(`Unexpected fetch for ${year}`);
    if (answer === 'offline') throw new TypeError('Network request failed');

    let times = {};
    if (answer === 'published') times = yearTimes(year);
    else if (answer !== 'unpublished') times = yearTimes(year, answer.unreadable);

    return { ok: true, status: 200, json: async () => ({ city: 'london', times }) };
  }) as unknown as typeof fetch;
};

const requestedYears = () => jest.mocked(global.fetch).mock.calls.map(([url]) => yearOf(url));

/** Every stored key with its raw value */
const everythingStored = () => {
  const keys = Database.database.getAllKeys().sort();
  return Object.fromEntries(keys.map((key) => [key, Database.database.getString(key)]));
};

const storedPrayerDates = () =>
  Database.database
    .getAllKeys()
    .filter((key) => /^prayer_\d{4}-\d{2}-\d{2}$/.test(key))
    .map((key) => key.slice('prayer_'.length))
    .sort();

const SEPTEMBER_HOLE = '2026-09-14';
const septemberAroundHole = days('2026-08-24', 45).filter((date) => date !== SEPTEMBER_HOLE);

const DECEMBER_HOLE = '2026-12-14';
const decemberAroundHole = days('2026-11-24', 38).filter((date) => date !== DECEMBER_HOLE);

// =============================================================================
// RESET BEFORE EACH TEST
// =============================================================================

beforeEach(() => {
  Database.database.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

// =============================================================================
// A FAILED FETCH
// =============================================================================

describe('when the fetch fails', () => {
  const failures: { when: string; now: string; cached: string[]; answers: Record<number, Answer>; error: string }[] = [
    {
      when: 'offline, with today missing from the cache',
      now: '2026-09-14T08:00:00Z',
      cached: septemberAroundHole,
      answers: { 2026: 'offline' },
      error: 'Network request failed',
    },
    {
      when: 'online, with the missing day still unreadable at the source',
      now: '2026-09-14T08:00:00Z',
      cached: septemberAroundHole,
      answers: { 2026: { unreadable: [SEPTEMBER_HOLE] } },
      error: `Malformed prayer time: ${SEPTEMBER_HOLE} is unreadable`,
    },
    {
      when: 'in December, offline',
      now: '2026-12-14T09:00:00Z',
      cached: decemberAroundHole,
      answers: { 2026: 'offline', 2027: 'offline' },
      error: 'Network request failed',
    },
    {
      when: 'in December, with this year failing while next year arrives',
      now: '2026-12-14T09:00:00Z',
      cached: decemberAroundHole,
      answers: { 2026: 'offline', 2027: 'published' },
      error: 'Network request failed',
    },
  ];

  it.each(failures)('leaves every stored key as it was: $when', async ({ now, cached, answers, error }) => {
    jest.useFakeTimers({ now: new Date(now) });
    installHolding(cached, { 2026: true });
    serveYears(answers);
    const before = everythingStored();

    await expect(sync()).rejects.toThrow(error);
    expect(everythingStored()).toEqual(before);

    // The next launch finds the same gap and tries again
    await expect(sync()).rejects.toThrow(error);
    expect(everythingStored()).toEqual(before);
  });

  it('on 3 December with the rest of the month cached, loses nothing while next year is not out', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-03T09:00:00Z') });
    installHolding(days('2026-11-15', 47), { 2026: true });
    serveYears({ 2027: 'unpublished' });
    const before = everythingStored();

    await sync();

    expect(requestedYears()).toEqual([2027]);
    expect(everythingStored()).toEqual(before);
  });
});

// =============================================================================
// A SUCCESSFUL FETCH
// =============================================================================

describe('when the fetch succeeds', () => {
  it('swaps in the downloaded year and keeps only what cannot be downloaded again', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, { 2025: true, 2026: true });
    serveYears({ 2026: 'published' });
    const before = everythingStored();

    await sync();

    expect(storedPrayerDates()).toEqual(days('2026-09-13', 110));
    expect(Database.getPrayerByDateString('2026-10-01')?.fajr).toBe(apiTimes(DOWNLOADED).fajr);
    expect(everythingStored()).toMatchObject(Object.fromEntries(KEPT_KEYS.map((key) => [key, before[key]])));
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it('lets nothing that runs during the swap find the cache without its days', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, { 2026: true });
    serveYears({ 2026: 'published' });

    const wipe = Database.clearAllExcept;
    const daysFoundAfterTheWipe: number[] = [];
    const wipeSpy = jest.spyOn(Database, 'clearAllExcept').mockImplementation((keepPrefixes) => {
      wipe(keepPrefixes);
      Promise.resolve().then(() => daysFoundAfterTheWipe.push(storedPrayerDates().length));
    });

    try {
      await sync();
    } finally {
      wipeSpy.mockRestore();
    }

    expect(daysFoundAfterTheWipe).toEqual([110]);
  });

  it('in December brings next year back too, even when it was already marked fetched', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    installHolding([...decemberAroundHole, ...days('2027-01-01', 40)], { 2026: true, 2027: true });
    serveYears({ 2026: 'published', 2027: 'published' });

    await sync();

    expect(requestedYears().sort()).toEqual([2026, 2027]);
    expect(storedPrayerDates()).toEqual([...days('2026-12-13', 19), ...days('2027-01-01', 365)]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('in December keeps this year when next year is not published yet, and leaves next year unmarked', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    installHolding(decemberAroundHole, { 2026: true });
    serveYears({ 2026: 'published', 2027: 'unpublished' });

    await sync();

    expect(storedPrayerDates()).toEqual(days('2026-12-13', 19));
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it("in December keeps next year's stored days and marker when only next year's download fails", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    const january = days('2027-01-01', 40);
    installHolding([...decemberAroundHole, ...january], { 2026: true, 2027: true });
    serveYears({ 2026: 'published', 2027: 'offline' });
    const januaryBefore = january.map((date) => Database.getPrayerByDateString(date));

    await sync();

    expect(storedPrayerDates()).toEqual([...days('2026-12-13', 19), ...january]);
    expect(january.map((date) => Database.getPrayerByDateString(date))).toEqual(januaryBefore);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it("in December carries next year's stored days without marking a year that was never marked", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    const january = days('2027-01-01', 40);
    installHolding([...decemberAroundHole, ...january], { 2026: true });
    serveYears({ 2026: 'published', 2027: 'offline' });

    await sync();

    expect(storedPrayerDates()).toEqual([...days('2026-12-13', 19), ...january]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it("in December does not restore next year's marker when none of its days are stored", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    installHolding(decemberAroundHole, { 2026: true, 2027: true });
    serveYears({ 2026: 'published', 2027: 'offline' });

    await sync();

    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });
});

// =============================================================================
// OVERLAPPING SYNCS
// =============================================================================

/** Holds each request until the test answers it: published, published less one day, or offline */
const holdRequests = () => {
  const held: { year: number; release: (withoutDay?: string) => void; fail: () => void }[] = [];
  global.fetch = jest.fn(
    (url: unknown) =>
      new Promise((resolve, reject) => {
        const year = yearOf(url);
        held.push({
          year,
          release: (withoutDay) => {
            const times = yearTimes(year);
            if (withoutDay) delete times[withoutDay];
            resolve({ ok: true, status: 200, json: async () => ({ city: 'london', times }) });
          },
          fail: () => reject(new TypeError('Network request failed')),
        });
      })
  ) as unknown as typeof fetch;
  return held;
};

describe('when refreshes overlap', () => {
  it.each([
    {
      when: 'outside December',
      now: '2026-09-14T08:00:00Z',
      cached: septemberAroundHole,
      requestsPerSync: 1,
      missingFromLater: '2026-10-01',
    },
    {
      when: 'in December',
      now: '2026-12-14T09:00:00Z',
      cached: decemberAroundHole,
      requestsPerSync: 2,
      missingFromLater: '2026-12-20',
    },
  ])(
    'lets only the first to land wipe the cache, so days and alarm records stored after it survive: $when',
    async ({ now, cached, requestsPerSync, missingFromLater }) => {
      jest.useFakeTimers({ now: new Date(now) });
      installHolding(cached, { 2026: true });
      const held = holdRequests();

      const launch = sync();
      const resumed = sync();
      expect(held).toHaveLength(2 * requestsPerSync);

      for (const request of held.slice(0, requestsPerSync)) request.release();
      await launch;
      // What the reschedule that follows the first sync records for an alarm it has just armed
      Database.setItem(BOOKKEEPING_KEY, { id: 'athan_standard_fajr_2026-09-15' });
      const afterFirstSwap = everythingStored();

      // Lacking a day the first stored, the later download shows whether it wiped before saving
      for (const request of held.slice(requestsPerSync)) request.release(missingFromLater);
      await resumed;

      expect(everythingStored()).toEqual(afterFirstSwap);
    }
  );

  it('keeps the alarm records a reschedule writes while the download is still on its way', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, { 2026: true });
    const held = holdRequests();

    const refresh = sync();
    // What a reschedule that already finds today's times, once 00:00 has passed, records as it arms
    Database.setItem(BOOKKEEPING_KEY, { id: 'athan_standard_fajr_2026-09-16' });
    Database.setItem(REMINDER_KEY, { id: 'reminder_standard_fajr_2026-09-16_10' });
    held[0]?.release();
    await refresh;

    expect(Database.getItem(BOOKKEEPING_KEY)).toEqual({ id: 'athan_standard_fajr_2026-09-16' });
    expect(Database.getItem(REMINDER_KEY)).toEqual({ id: 'reminder_standard_fajr_2026-09-16_10' });
  });

  it('lets a sync that starts after a stalled one fetch and finish on its own', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, { 2026: true });
    const held = holdRequests();

    const stalled = sync();
    const later = sync();
    expect(held).toHaveLength(2);
    held[1]?.release();
    await later;

    expect(Database.getPrayerByDateString(SEPTEMBER_HOLE)).not.toBeNull();

    // The stalled request answering long afterwards must not wipe what the later sync stored. Its
    // download lacks a day the later one stored, so a wipe would show
    Database.setItem(BOOKKEEPING_KEY, { id: 'athan_standard_fajr_2026-09-15' });
    const afterLaterSwap = everythingStored();
    held[0]?.release('2026-10-01');
    await stalled;

    expect(everythingStored()).toEqual(afterLaterSwap);
  });

  it('on 1 January adds the new year a refresh downloads after a 31 December refresh cleared the cache without it', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T23:59:50Z') });
    installHolding(days('2026-12-01', 30), { 2026: true });
    const held = holdRequests();

    const lastNight = sync();
    jest.setSystemTime(new Date('2027-01-01T00:00:05Z'));
    const newYear = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2027]);

    held[0]?.release();
    held[1]?.fail();
    await lastNight;
    held[2]?.release();
    await newYear;

    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('on 31 December adds next year from the second of two first launches when the first could not get it', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T10:00:00Z') });
    const held = holdRequests();

    const launch = sync();
    const resumed = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027]);

    held[0]?.release();
    held[1]?.fail();
    await launch;
    held[2]?.release();
    held[3]?.release();
    await resumed;

    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('lets a refresh that stalled into December add its year without wiping the next year a newer refresh stored', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-30T23:59:50Z') });
    installHolding(days('2026-11-10', 20), { 2026: true });
    const held = holdRequests();

    const stalled = sync();
    jest.setSystemTime(new Date('2026-12-01T00:00:10Z'));
    const later = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2026, 2027]);

    held[1]?.release();
    held[2]?.release();
    await later;
    held[0]?.release();
    await stalled;

    expect(storedPrayerDates()).toContain('2027-06-01');
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('lets a refresh that stalled into December add its year without wiping next year, when a newer sync only added it', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-30T23:59:50Z') });
    // With 30 November missing, the first sync downloads this year. After 00:00 the second finds
    // today stored and only next year missing, so it downloads that alone, with no wipe of its own
    installHolding([...days('2026-11-10', 20), ...days('2026-12-01', 31)], { 2026: true });
    const held = holdRequests();

    const stalled = sync();
    jest.setSystemTime(new Date('2026-12-01T00:00:10Z'));
    const later = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027]);

    held[1]?.release();
    await later;
    held[0]?.release();
    await stalled;

    expect(Database.getPrayerByDateString('2026-11-30')).not.toBeNull();
    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });
});

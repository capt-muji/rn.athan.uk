/**
 * A refresh fetches first, and swaps the cache only once the year has arrived
 *
 * Runs the real `sync()` over the real database, API client and clock helpers. The network, the
 * single-day request for 31 December, the sequences, the countdowns, the widgets, the logger, the
 * build config and the upgrade check are stubbed, so what these tests prove about the stored keys is
 * the refresh's doing, not a whole launch's. `sync.test.ts` mocks the database, so it can say which
 * calls were made but never what a user is left holding when a fetch fails.
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

// Each 1 January test answers 31 December itself, so the order the answers land in is the test's to choose
const mockFetchDay = jest.fn();
jest.mock('@/api/client', () => ({
  ...jest.requireActual('@/api/client'),
  fetchDay: (date: string) => mockFetchDay(date),
}));

jest.mock('@/stores/schedule', () => ({ setSequence: jest.fn(), refreshSequence: jest.fn() }));
jest.mock('@/stores/countdown', () => ({ startCountdowns: jest.fn() }));
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn() }));
jest.mock('@/stores/version', () => ({ handleAppUpgrade: jest.fn() }));

import { getDefaultStore } from 'jotai/vanilla';

import { type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { lastNotificationScheduleAtom } from '@/stores/notifications';
import * as ScheduleStore from '@/stores/schedule';

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
/** A later answer from the provider, so a test can tell which of two downloads a stored day came from */
const NEWER = 2;

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

/** An unreadable day is still in the answer with one time the app cannot read; a missing day is not in it at all */
type Answer = 'offline' | 'unpublished' | 'published' | { unreadable: string[] } | { missing: string[] };

const yearTimes = (year: number, unreadable: string[] = [], edition = DOWNLOADED, missing: string[] = []) => {
  const times: Record<string, unknown> = {};
  for (const date of days(`${year}-01-01`, 365)) {
    if (missing.includes(date)) continue;
    times[date] = unreadable.includes(date) ? { ...apiTimes(edition), sunrise: '-----' } : apiTimes(edition);
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
    else if (answer !== 'unpublished' && 'missing' in answer) times = yearTimes(year, [], DOWNLOADED, answer.missing);
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

/** Lets a request nothing awaits land, and everything it sets off run. Microtasks only, so fake timers do not hold it */
const settle = async () => {
  for (let tick = 0; tick < 20; tick++) await Promise.resolve();
};

// =============================================================================
// RESET BEFORE EACH TEST
// =============================================================================

beforeEach(() => {
  Database.database.clearAll();
  mockFetchDay.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

// =============================================================================
// A FAILED FETCH
// =============================================================================

describe('when the fetch fails', () => {
  // A marked year with a later day stored has today as a gap in its answer, which is not downloaded again, so
  // these caches either leave the year unmarked or stop before today, to make the refresh run
  const failures: {
    when: string;
    now: string;
    cached: string[];
    marked: Record<number, true>;
    answers: Record<number, Answer>;
    error: string;
  }[] = [
    {
      when: 'offline, with today missing from a cache whose year is unmarked',
      now: '2026-09-14T08:00:00Z',
      cached: septemberAroundHole,
      marked: {},
      answers: { 2026: 'offline' },
      error: 'Network request failed',
    },
    {
      when: 'in December, offline, with nothing of this year stored after today',
      now: '2026-12-14T09:00:00Z',
      cached: days('2026-11-24', 20),
      marked: { 2026: true },
      answers: { 2026: 'offline', 2027: 'offline' },
      error: 'Network request failed',
    },
    {
      when: 'in December, with an unmarked year failing while next year arrives',
      now: '2026-12-14T09:00:00Z',
      cached: decemberAroundHole,
      marked: {},
      answers: { 2026: 'offline', 2027: 'published' },
      error: 'Network request failed',
    },
  ];

  it.each(failures)('leaves every stored key as it was: $when', async ({ now, cached, marked, answers, error }) => {
    jest.useFakeTimers({ now: new Date(now) });
    installHolding(cached, marked);
    serveYears(answers);
    const before = everythingStored();

    await expect(sync()).rejects.toThrow(error);
    expect(everythingStored()).toEqual(before);

    // The next launch finds the same gap and tries again
    await expect(sync()).rejects.toThrow(error);
    expect(everythingStored()).toEqual(before);
  });

  it('stores a day that is still unreadable at the source with that time unreadable, and never downloads again for it', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    serveYears({ 2026: { unreadable: [SEPTEMBER_HOLE] } });

    await sync();

    // The day is shown with Sunrise as --:-- rather than dropped, which is what used to start finding 67's loop
    const today = Database.getPrayerByDateString(SEPTEMBER_HOLE);
    expect(today).toEqual({
      date: SEPTEMBER_HOLE,
      ...apiTimes(DOWNLOADED),
      sunrise: null,
      suhoor: '04:31',
      duha: null,
      istijaba: '18:21',
    });
    expect(requestedYears()).toEqual([2026]);

    await sync();
    await sync();

    expect(requestedYears()).toEqual([2026]);
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
// A DAY MISSING FROM THE PROVIDER'S LATEST ANSWER (R7)
// =============================================================================

describe("when today is missing from this year's latest download", () => {
  beforeEach(() => {
    jest.mocked(ScheduleStore.setSequence).mockClear();
  });

  it('launches offline without asking when today is a gap inside the answer, keeping every stored key, and the next sync does not ask either', async () => {
    const now = new Date('2026-09-14T08:00:00Z');
    jest.useFakeTimers({ now });
    installHolding(septemberAroundHole, { 2026: true });
    serveYears({ 2026: 'offline' });
    const before = everythingStored();

    await expect(sync()).resolves.toBeUndefined();

    expect(ScheduleStore.setSequence).toHaveBeenCalledWith(ScheduleType.Standard, now);
    expect(ScheduleStore.setSequence).toHaveBeenCalledWith(ScheduleType.Extra, now);

    await expect(sync()).resolves.toBeUndefined();

    expect(requestedYears()).toEqual([]);
    expect(everythingStored()).toEqual(before);
  });

  const stillAsking: { cache: string; now: string; cached: string[]; marked: Record<number, true>; year: number }[] = [
    { cache: 'is empty', now: '2026-09-14T08:00:00Z', cached: [], marked: {}, year: 2026 },
    {
      cache: 'holds only last year',
      now: '2027-01-05T08:00:00Z',
      cached: days('2026-12-01', 31),
      marked: { 2026: true },
      year: 2027,
    },
  ];

  it.each(stillAsking)('still asks for this year when the cache $cache', async ({ now, cached, marked, year }) => {
    jest.useFakeTimers({ now: new Date(now) });
    installHolding(cached, marked);
    serveYears({ [year]: 'offline' });

    await expect(sync()).rejects.toThrow('Network request failed');

    expect(requestedYears()).toEqual([year]);
  });

  it('asks again on 1 July and each launch after when the year was cut short at 30 June, and stores the rest once it is out', async () => {
    jest.useFakeTimers({ now: new Date('2027-07-01T08:00:00Z') });
    // December's download of 2027 held only 1 January to 30 June, and marked the year
    installHolding(days('2027-01-01', 181), { 2027: true });
    serveYears({ 2027: 'offline' });
    const before = everythingStored();

    await expect(sync()).rejects.toThrow('Network request failed');
    jest.setSystemTime(new Date('2027-07-02T08:00:00Z'));
    await expect(sync()).rejects.toThrow('Network request failed');

    expect(requestedYears()).toEqual([2027, 2027]);
    expect(everythingStored()).toEqual(before);

    serveYears({ 2027: 'published' });
    await sync();

    expect(requestedYears()).toEqual([2027]);
    expect(Database.getPrayerByDateString('2027-07-02')).not.toBeNull();
  });

  it('asks again when 31 December is missing, since nothing of the year comes after it', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T10:00:00Z') });
    // Next year's days come after today and are stored and marked, but belong to another year's answer
    installHolding([...days('2026-11-01', 60), ...days('2027-01-01', 40)], { 2026: true, 2027: true });
    serveYears({ 2026: 'offline', 2027: 'offline' });
    const before = everythingStored();

    await expect(sync()).rejects.toThrow('Network request failed');

    expect(requestedYears().sort()).toEqual([2026, 2027]);
    expect(everythingStored()).toEqual(before);
  });

  it.each([
    { nextYear: 'is offline too', answer: 'offline' as const, marked: { 2026: true }, nextYearStored: false },
    { nextYear: 'arrives', answer: 'published' as const, marked: { 2026: true, 2027: true }, nextYearStored: true },
  ])(
    'in December with today a gap and this year offline, keeps every stored day and asks only for next year, which $nextYear',
    async ({ answer, marked, nextYearStored }) => {
      jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
      installHolding(decemberAroundHole, { 2026: true });
      serveYears({ 2026: 'offline', 2027: answer });
      const daysBefore = decemberAroundHole.map((date) => Database.getPrayerByDateString(date));

      await expect(sync()).resolves.toBeUndefined();

      expect(requestedYears()).toEqual([2027]);
      expect(decemberAroundHole.map((date) => Database.getPrayerByDateString(date))).toEqual(daysBefore);
      expect(Database.getPrayerByDateString(DECEMBER_HOLE)).toBeNull();
      expect(Database.getPrayerByDateString('2027-01-01') !== null).toBe(nextYearStored);
      expect(Database.getItem('fetched_years')).toEqual(marked);
    }
  );
});

// =============================================================================
// THE NOTIFICATION REFRESH GATE
// =============================================================================

describe('the notification refresh gate', () => {
  const store = getDefaultStore();

  it('reopens once a download stores today, after a reschedule stamped it with only the days around today to arm', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    serveYears({ 2026: 'published' });
    store.set(lastNotificationScheduleAtom, Date.now());

    await sync();

    expect(Database.getPrayerByDateString(SEPTEMBER_HOLE)).not.toBeNull();
    expect(store.get(lastNotificationScheduleAtom)).toBe(0);
  });

  it('stays stamped when the download fails', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    serveYears({ 2026: 'offline' });
    const stamped = Date.now();
    store.set(lastNotificationScheduleAtom, stamped);

    await expect(sync()).rejects.toThrow('Network request failed');

    expect(store.get(lastNotificationScheduleAtom)).toBe(stamped);
  });
});

// =============================================================================
// A SUCCESSFUL FETCH
// =============================================================================

describe('when the fetch succeeds', () => {
  it('swaps in the downloaded year and keeps only what cannot be downloaded again', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, { 2025: true });
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
    installHolding(septemberAroundHole, {});
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
    installHolding([...decemberAroundHole, ...days('2027-01-01', 40)], { 2027: true });
    serveYears({ 2026: 'published', 2027: 'published' });

    await sync();

    expect(requestedYears().sort()).toEqual([2026, 2027]);
    expect(storedPrayerDates()).toEqual([...days('2026-12-13', 19), ...days('2027-01-01', 365)]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('in December keeps this year when next year is not published yet, and leaves next year unmarked', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    installHolding(decemberAroundHole, {});
    serveYears({ 2026: 'published', 2027: 'unpublished' });

    await sync();

    expect(storedPrayerDates()).toEqual(days('2026-12-13', 19));
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it("in December keeps next year's stored days and marker when only next year's download fails", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    const january = days('2027-01-01', 40);
    installHolding([...decemberAroundHole, ...january], { 2027: true });
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
    installHolding([...decemberAroundHole, ...january], {});
    serveYears({ 2026: 'published', 2027: 'offline' });

    await sync();

    expect(storedPrayerDates()).toEqual([...days('2026-12-13', 19), ...january]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it("in December does not restore next year's marker when none of its days are stored", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    installHolding(decemberAroundHole, { 2027: true });
    serveYears({ 2026: 'published', 2027: 'offline' });

    await sync();

    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it("in December does not restore next year's marker when 1 January is not among its stored days", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    const lateJanuary = days('2027-01-14', 30);
    installHolding([...decemberAroundHole, ...lateJanuary], { 2027: true });
    serveYears({ 2026: 'published', 2027: 'offline' });

    await sync();

    // Marked without 1 January, December would never download the days before the 14th again
    expect(storedPrayerDates()).toEqual([...days('2026-12-13', 19), ...lateJanuary]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });
  });

  it('carries next year without its marker across a standard swap when 1 January is not stored, so December asks again', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-20T09:00:00Z') });
    const lateJanuary = days('2027-01-14', 30);
    installHolding([...days('2026-11-01', 30).filter((date) => date !== '2026-11-20'), ...lateJanuary], {
      2027: true,
    });
    serveYears({ 2026: 'published', 2027: 'unpublished' });

    await sync();

    expect(storedPrayerDates()).toEqual([...days('2026-11-19', 43), ...lateJanuary]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });

    jest.setSystemTime(new Date('2026-12-02T09:00:00Z'));
    await sync();

    expect(requestedYears()).toEqual([2026, 2027]);
  });

  it('lets a top-up without 1 January store its days but not the marker, so December asks again', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-03T09:00:00Z') });
    installHolding(days('2026-11-15', 47), { 2026: true });
    serveYears({ 2027: { missing: ['2027-01-01'] } });

    await sync();

    expect(Database.getPrayerByDateString('2027-01-02')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true });

    await sync();

    expect(requestedYears()).toEqual([2027, 2027]);
  });

  it("in December keeps next year's stored 1 January when the refresh's own download of next year lacks it", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T09:00:00Z') });
    installHolding([...decemberAroundHole, ...days('2027-01-01', 40)], { 2027: true });
    serveYears({ 2026: 'published', 2027: { missing: ['2027-01-01'] } });

    await sync();

    // The stored 1 January stays, and the newer download still refreshes every day it does have
    expect(Database.getPrayerByDateString('2027-01-01')?.fajr).toBe(apiTimes(CACHED).fajr);
    expect(Database.getPrayerByDateString('2027-01-02')?.fajr).toBe(apiTimes(DOWNLOADED).fajr);
    expect(Database.getPrayerByDateString('2027-12-31')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });
});

// =============================================================================
// OVERLAPPING SYNCS
// =============================================================================

/** Holds each request until the test answers it: published, published less one day, or offline */
const holdRequests = () => {
  const held: { year: number; release: (withoutDay?: string, edition?: number) => void; fail: () => void }[] = [];
  global.fetch = jest.fn(
    (url: unknown) =>
      new Promise((resolve, reject) => {
        const year = yearOf(url);
        held.push({
          year,
          release: (withoutDay, edition) => {
            const times = yearTimes(year, [], edition);
            if (withoutDay) delete times[withoutDay];
            resolve({ ok: true, status: 200, json: async () => ({ city: 'london', times }) });
          },
          fail: () => reject(new TypeError('Network request failed')),
        });
      })
  ) as unknown as typeof fetch;
  return held;
};

/** Holds each request for a single day until the test answers it with one edition of that day */
const holdDays = () => {
  const held: { date: string; release: (edition: number) => void }[] = [];
  mockFetchDay.mockImplementation(
    (date: string) =>
      new Promise<ISingleApiResponseTransformed>((resolve) => {
        held.push({ date, release: (edition) => resolve({ ...cachedDay(date), ...apiTimes(edition) }) });
      })
  );
  return held;
};

// Each year stays unmarked, since a marked year with later days stored has today as a gap, which is not downloaded again
const overlapCases = [
  {
    when: 'outside December',
    now: '2026-09-14T08:00:00Z',
    cached: septemberAroundHole,
    perSync: 1,
    lacking: '2026-10-01',
  },
  { when: 'in December', now: '2026-12-14T09:00:00Z', cached: decemberAroundHole, perSync: 2, lacking: '2026-12-20' },
];

describe('when refreshes overlap', () => {
  it.each(overlapCases)(
    'swaps in the refresh that began later when the earlier one lands first, keeping alarm records: $when',
    async ({ now, cached, perSync, lacking }) => {
      jest.useFakeTimers({ now: new Date(now) });
      installHolding(cached, {});
      const held = holdRequests();

      const launch = sync();
      const resumed = sync();
      expect(held).toHaveLength(2 * perSync);

      for (const request of held.slice(0, perSync)) request.release();
      await launch;
      // What the reschedule that follows the first sync records for an alarm it has just armed
      Database.setItem(BOOKKEEPING_KEY, { id: 'athan_standard_fajr_2026-09-15' });

      // The later request holds the newer answer, so a day it lacks must not survive from the first
      for (const request of held.slice(perSync)) request.release(lacking);
      await resumed;

      expect(Database.getPrayerByDateString(lacking)).toBeNull();
      expect(Database.getItem(BOOKKEEPING_KEY)).toEqual({ id: 'athan_standard_fajr_2026-09-15' });
    }
  );

  it.each(overlapCases)(
    'lets a download that began earlier change nothing when it lands after a later one: $when',
    async ({ now, cached, perSync, lacking }) => {
      jest.useFakeTimers({ now: new Date(now) });
      installHolding(cached, {});
      const held = holdRequests();

      const launch = sync();
      const resumed = sync();
      expect(held).toHaveLength(2 * perSync);

      for (const request of held.slice(perSync)) request.release(lacking, NEWER);
      await resumed;
      Database.setItem(BOOKKEEPING_KEY, { id: 'athan_standard_fajr_2026-09-15' });
      const afterNewerSwap = everythingStored();

      // The earlier request holds an older answer, which must not bring back the day the newer one lacks
      for (const request of held.slice(0, perSync)) request.release();
      await launch;

      expect(everythingStored()).toEqual(afterNewerSwap);
    }
  );

  it('keeps the alarm records a reschedule writes while the download is still on its way', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    const held = holdRequests();

    const refresh = sync();
    expect(held).toHaveLength(1);
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
    installHolding(septemberAroundHole, {});
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

  it('on 1 January swaps in the new year a later refresh downloads, keeping 31 December, after a 31 December refresh', async () => {
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

    // The swap carries 31 December as yesterday, which the first of January's night rows still need
    expect(Database.getPrayerByDateString('2026-12-31')).not.toBeNull();
    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2027: true });
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

  it('lets a refresh that stalled into December change nothing once a refresh that began later stored both years', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-30T23:59:50Z') });
    installHolding(days('2026-11-10', 20), {});
    const held = holdRequests();

    const stalled = sync();
    jest.setSystemTime(new Date('2026-12-01T00:00:10Z'));
    const later = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2026, 2027]);

    held[1]?.release('2026-12-20');
    held[2]?.release();
    await later;
    const afterNewerSwap = everythingStored();
    // The stalled answer still has 20 December, which the newer download no longer does
    held[0]?.release();
    await stalled;

    expect(everythingStored()).toEqual(afterNewerSwap);
    expect(storedPrayerDates()).toContain('2027-06-01');
  });

  it('lets a refresh that stalled into December swap in its year and keep the next year a newer sync only added', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-30T23:59:50Z') });
    // With 30 November missing and this year unmarked, the first two syncs download this year. The second's
    // answer lacks 30 November, so it is added without a wipe but marks the year. After 00:00 the third finds
    // today stored and only next year missing, so it downloads that alone, with no wipe of its own
    installHolding(days('2026-11-10', 20), {});
    const held = holdRequests();

    const stalled = sync();
    const lacking = sync();
    held[1]?.release('2026-11-30');
    await lacking;

    jest.setSystemTime(new Date('2026-12-01T00:00:10Z'));
    const later = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2026, 2027]);

    held[2]?.release();
    await later;
    held[0]?.release();
    await stalled;

    // 10 to 29 November leaving shows the stalled refresh wiped, rather than only adding its days
    expect(storedPrayerDates()).toEqual([...days('2026-11-30', 32), ...days('2027-01-01', 365)]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it.each([
    { nextYear: 'arrives', answer: 'release' as const, nextYearLacks: undefined },
    { nextYear: 'fails', answer: 'fail' as const, nextYearLacks: undefined },
    { nextYear: 'arrives lacking a day the top-up stored', answer: 'release' as const, nextYearLacks: '2027-03-01' },
  ])(
    "lets a December refresh swap in the year when next year's top-up lands while it downloads, and next year $nextYear",
    async ({ answer, nextYearLacks }) => {
      jest.useFakeTimers({ now: new Date('2026-12-14T23:59:50Z') });
      // With 14 December stored, the first sync only tops up next year. After 00:00 the second finds 15 December
      // missing with nothing of this year after it and downloads both years, which must still replace what was cached
      installHolding(days('2026-11-24', 21), { 2026: true });
      const held = holdRequests();

      const topUp = sync();
      jest.setSystemTime(new Date('2026-12-15T00:00:10Z'));
      const refresh = sync();
      expect(held.map((request) => request.year)).toEqual([2027, 2026, 2027]);

      held[0]?.release();
      await topUp;
      held[1]?.release('2026-12-20');
      if (answer === 'fail') held[2]?.fail();
      else held[2]?.release(nextYearLacks);
      await refresh;

      // November and the days the new downloads lack all go, as they would with no top-up at all
      expect(storedPrayerDates()).toEqual([
        ...days('2026-12-14', 18).filter((date) => date !== '2026-12-20'),
        ...days('2027-01-01', 365).filter((date) => date !== nextYearLacks),
      ]);
      expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
    }
  );

  it('swaps in each download that began later across midnight, so the newest answer decides every day', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-13T23:59:50Z') });
    // 13 and 14 December are missing and this year is unmarked, so launch and resume both download both years.
    // The launch's downloads fail, so the background task after 00:00 still finds this year unmarked and downloads
    // both again while the resume's are on their way
    installHolding(
      days('2026-11-15', 45).filter((date) => date !== '2026-12-13' && date !== '2026-12-14'),
      {}
    );
    const held = holdRequests();

    const launch = sync();
    const resumed = sync();
    held[0]?.fail();
    held[1]?.fail();
    await expect(launch).rejects.toThrow('Network request failed');

    jest.setSystemTime(new Date('2026-12-14T00:00:05Z'));
    const background = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027, 2026, 2027]);

    held[2]?.release();
    held[3]?.release();
    await resumed;
    held[4]?.release('2026-12-20');
    held[5]?.release();
    await background;

    // The background task began last, so a day its download lacks must not survive from the resume's
    expect(Database.getPrayerByDateString('2026-12-20')).toBeNull();
    expect(Database.getPrayerByDateString('2026-12-14')).not.toBeNull();
  });

  it('keeps next year from a top-up that began later when an earlier December refresh lands after it', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T23:59:50Z') });
    // 14 December is missing and this year unmarked, so the first two syncs download both years. The second lands
    // first without next year, marking this year with 15 December stored, so after 00:00 the third only tops up
    // next year while the first is still on its way
    installHolding(decemberAroundHole, {});
    const held = holdRequests();

    const refresh = sync();
    const resumed = sync();
    held[2]?.release();
    held[3]?.fail();
    await resumed;

    jest.setSystemTime(new Date('2026-12-15T00:00:10Z'));
    const topUp = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027, 2027]);

    held[4]?.release(undefined, NEWER);
    await topUp;
    // The older download of next year lacks 1 March and has older times, and must replace neither
    held[0]?.release();
    held[1]?.release('2027-03-01');
    await refresh;

    expect(Database.getPrayerByDateString('2027-03-01')).not.toBeNull();
    expect(Database.getPrayerByDateString('2027-01-01')?.fajr).toBe(apiTimes(NEWER).fajr);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('lets a top-up that began earlier change nothing when it lands after a December refresh that began later', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T23:59:50Z') });
    // With 14 December stored the first sync only tops up next year, and after 00:00 the second finds nothing of
    // this year after 15 December, so it downloads both years
    installHolding(days('2026-11-24', 21), { 2026: true });
    const held = holdRequests();

    const topUp = sync();
    jest.setSystemTime(new Date('2026-12-15T00:00:10Z'));
    const refresh = sync();
    expect(held.map((request) => request.year)).toEqual([2027, 2026, 2027]);

    held[1]?.release();
    held[2]?.release('2027-03-01', NEWER);
    await refresh;
    const afterNewerSwap = everythingStored();

    // The top-up's older answer still has 1 March and older times, which must not come back
    held[0]?.release();
    await topUp;

    expect(everythingStored()).toEqual(afterNewerSwap);
  });

  it('drops every download that began before the newest stored one, not only the first to land after it', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    const held = holdRequests();

    const launch = sync();
    const resumed = sync();
    const background = sync();
    expect(held).toHaveLength(3);

    held[2]?.release('2026-10-01', NEWER);
    await background;
    const afterNewestSwap = everythingStored();

    // Both older answers still have 1 October and older times, and neither may bring them back
    held[0]?.release();
    await launch;
    held[1]?.release();
    await resumed;

    expect(everythingStored()).toEqual(afterNewestSwap);
  });

  it('lets a top-up that began later remove a next-year day an earlier December refresh stored', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T23:59:50Z') });
    // 14 December is missing and this year unmarked, so the first two syncs download both years. The second lands
    // first without next year, marking this year with 15 December stored, so after 00:00 the third only tops up
    // next year while the first is still on its way
    installHolding(decemberAroundHole, {});
    const held = holdRequests();

    const refresh = sync();
    const resumed = sync();
    held[2]?.release();
    held[3]?.fail();
    await resumed;

    jest.setSystemTime(new Date('2026-12-15T00:00:10Z'));
    const topUp = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027, 2027]);

    held[0]?.release();
    held[1]?.release();
    await refresh;
    // The newer answer no longer has 1 March, so the earlier copy must go with the rest of the old one
    held[4]?.release('2027-03-01', NEWER);
    await topUp;

    expect(Database.getPrayerByDateString('2027-03-01')).toBeNull();
    expect(Database.getPrayerByDateString('2027-01-01')?.fajr).toBe(apiTimes(NEWER).fajr);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('stores next year from a December refresh whose year a later refresh already stored without next year', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T23:59:50Z') });
    // 14 and 15 December are missing and this year is unmarked, so both syncs download both years
    installHolding(
      decemberAroundHole.filter((date) => date !== '2026-12-15'),
      {}
    );
    const held = holdRequests();

    const earlier = sync();
    jest.setSystemTime(new Date('2026-12-15T00:00:10Z'));
    const later = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027]);

    held[2]?.release();
    held[3]?.fail();
    await later;
    held[0]?.release();
    held[1]?.release();
    await earlier;

    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('keeps today when the download that began later lacks it and lands after one that has it', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    const held = holdRequests();

    const launch = sync();
    const resumed = sync();
    held[0]?.release();
    await launch;
    // An answer without today cannot be trusted to replace one that had it
    held[1]?.release(SEPTEMBER_HOLE, NEWER);
    await resumed;

    expect(Database.getPrayerByDateString(SEPTEMBER_HOLE)).not.toBeNull();
  });

  it('lets a download that has today swap in after one that began later but lacks it', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    const held = holdRequests();

    const launch = sync();
    const resumed = sync();
    held[1]?.release(SEPTEMBER_HOLE, NEWER);
    await resumed;
    held[0]?.release();
    await launch;

    expect(Database.getPrayerByDateString(SEPTEMBER_HOLE)).not.toBeNull();
  });

  it('on 1 January adds 31 December from a refresh that began the night before and lands after the new year swap', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T23:59:50Z') });
    // 31 December is stored but this year is unmarked, so the night before downloads both years. After
    // 00:00 the new year's refresh carries the stored 31 December across its swap, so nothing else fetches it
    installHolding(days('2026-12-01', 31), {});
    const held = holdRequests();

    const lastNight = sync();
    jest.setSystemTime(new Date('2027-01-01T00:00:05Z'));
    const newYear = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2027]);

    held[2]?.release();
    await newYear;
    held[0]?.release();
    held[1]?.release();
    await lastNight;

    // No download of last year began after it, so its 31 December replaces the older cached copy
    expect(Database.getPrayerByDateString('2026-12-31')?.fajr).toBe(apiTimes(DOWNLOADED).fajr);
    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it("on 1 January drops a 31 December refresh that lands after the new year's own request for 31 December", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T23:59:50Z') });
    installHolding(days('2026-12-01', 30), { 2026: true });
    const held = holdRequests();
    const heldDays = holdDays();

    const lastNight = sync();
    jest.setSystemTime(new Date('2027-01-01T00:00:05Z'));
    const newYear = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2027]);

    held[2]?.release();
    // Landing first, the new year's refresh finds 31 December missing and asks for that day alone
    for (let tick = 0; tick < 200 && heldDays.length < 1; tick++) await Promise.resolve();
    expect(heldDays.map((request) => request.date)).toEqual(['2026-12-31']);
    heldDays[0]?.release(NEWER);
    await newYear;
    await settle();

    // The night before's requests began first, so their answers must not replace the newer ones
    held[0]?.release();
    held[1]?.release();
    await lastNight;

    expect(held).toHaveLength(3);
    expect(Database.getPrayerByDateString('2026-12-31')?.fajr).toBe(apiTimes(NEWER).fajr);
    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    // One day is not a year, so last year stays unmarked
    expect(Database.getItem('fetched_years')).toEqual({ 2027: true });
  });

  it('on 1 January keeps the newer of two answers for 31 December when the one that began first lands last', async () => {
    jest.useFakeTimers({ now: new Date('2027-01-01T08:00:00Z') });
    // 1 January is stored and 31 December is not, so both syncs skip the refresh and ask for that day alone
    installHolding(days('2027-01-01', 30), { 2027: true });
    serveYears({});
    const heldDays = holdDays();

    const launch = sync();
    const resumed = sync();
    expect(heldDays.map((request) => request.date)).toEqual(['2026-12-31', '2026-12-31']);

    await Promise.all([launch, resumed]);
    heldDays[1]?.release(NEWER);
    await settle();
    // The launch's request began first, so its answer must not replace the newer 31 December
    heldDays[0]?.release(DOWNLOADED);
    await settle();

    expect(requestedYears()).toEqual([]);
    expect(Database.getPrayerByDateString('2026-12-31')?.fajr).toBe(apiTimes(NEWER).fajr);
    expect(Database.getItem('fetched_years')).toEqual({ 2027: true });
  });

  it("on 1 January keeps last year's newer 31 December when a second new year swap carries it", async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T23:59:50Z') });
    installHolding(days('2026-12-01', 30), { 2026: true });
    const held = holdRequests();
    const heldDays = holdDays();

    const lastNight = sync();
    jest.setSystemTime(new Date('2027-01-01T00:00:05Z'));
    const first = sync();
    const second = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2027, 2027]);

    held[2]?.release();
    // Landing first, the new year's refresh finds 31 December missing and asks for that day alone
    for (let tick = 0; tick < 200 && heldDays.length < 1; tick++) await Promise.resolve();
    expect(heldDays.map((request) => request.date)).toEqual(['2026-12-31']);
    expect(held).toHaveLength(4);
    heldDays[0]?.release(NEWER);
    await first;
    await settle();

    // The second swap carries that 31 December as yesterday, and must still know which download it came from
    held[3]?.release();
    await second;
    held[0]?.release();
    held[1]?.release();
    await lastNight;

    expect(Database.getPrayerByDateString('2026-12-31')?.fajr).toBe(apiTimes(NEWER).fajr);
    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
  });

  it('on 1 January swaps in a lone refresh from the night before, since last year needs no anchor day', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T23:59:50Z') });
    installHolding(days('2026-12-01', 30), { 2026: true });
    const held = holdRequests();

    const lastNight = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027]);
    // The answers arrive after midnight, when last year's download holds only 31 December and never today
    jest.setSystemTime(new Date('2027-01-01T00:00:05Z'));
    held[0]?.release();
    held[1]?.release();
    await lastNight;

    expect(storedPrayerDates()).toEqual(['2026-12-31', ...days('2027-01-01', 365)]);
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('lets a complete next year from an earlier December refresh store after a later top-up lacking 1 January', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-14T23:59:50Z') });
    // 14 December is missing and this year unmarked, so the first two syncs download both years. The second lands
    // first without next year, marking this year with 15 December stored, so after 00:00 the third only tops up
    // next year while the first is still on its way
    installHolding(decemberAroundHole, {});
    const held = holdRequests();

    const refresh = sync();
    const resumed = sync();
    held[2]?.release();
    held[3]?.fail();
    await resumed;

    jest.setSystemTime(new Date('2026-12-15T00:00:10Z'));
    const topUp = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027, 2027]);

    // An answer without 1 January cannot vouch for next year, so it must not block the complete one
    held[4]?.release('2027-01-01', NEWER);
    await topUp;
    held[0]?.release();
    held[1]?.release();
    await refresh;

    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
    expect(Database.getItem('fetched_years')).toEqual({ 2026: true, 2027: true });
  });

  it('keeps a download holding the only copy of its year after a swap for another year took that year', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-14T08:00:00Z') });
    installHolding(septemberAroundHole, {});
    const held = holdRequests();

    const launch = sync();
    const resumed = sync();
    held[1]?.release();
    await resumed;

    // A clock set a year ahead finds that day missing and swaps in that year, taking all of 2026
    jest.setSystemTime(new Date('2027-09-14T08:00:00Z'));
    const wrongClock = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2026, 2027]);
    held[2]?.release();
    await wrongClock;

    // Once the clock is right again, the launch's download is the only copy of 2026 left
    jest.setSystemTime(new Date('2026-09-14T08:00:30Z'));
    held[0]?.release();
    await launch;

    expect(storedPrayerDates().filter((date) => date.startsWith('2026-'))).toHaveLength(110);
  });

  it('adds last year from two refreshes of the night before without wiping again after the new year swap', async () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T23:59:50Z') });
    // This year is unmarked, so both syncs the night before download both years, and after 00:00 the
    // new year's refresh carries the stored 31 December across its swap
    installHolding(days('2026-12-01', 31), {});
    const held = holdRequests();

    const first = sync();
    jest.setSystemTime(new Date('2026-12-31T23:59:55Z'));
    const second = sync();
    jest.setSystemTime(new Date('2027-01-01T00:00:05Z'));
    const newYear = sync();
    expect(held.map((request) => request.year)).toEqual([2026, 2027, 2026, 2027, 2027]);

    held[4]?.release();
    await newYear;
    // On no keep-list and written after the swap, so it survives only if nothing wipes again
    Database.setItem('popup_update_last_check', 1);

    held[0]?.release();
    held[1]?.release();
    await first;
    held[2]?.release(undefined, NEWER);
    held[3]?.release();
    await second;

    expect(Database.getItem('popup_update_last_check')).toBe(1);
    expect(Database.getPrayerByDateString('2026-12-31')?.fajr).toBe(apiTimes(NEWER).fajr);
    expect(Database.getPrayerByDateString('2027-01-01')).not.toBeNull();
  });
});

/**
 * Unit tests for stores/sync.ts
 *
 * Tests app synchronization and data fetching:
 * - Main sync() entry point
 * - needsDataUpdate() decision logic
 * - updatePrayerData() fetch and save
 * - initializeAppState() sequence setup
 * - December prefetch and January 1st edge cases
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

// Mock TimeUtils
const mockCreateLondonDate = jest.fn();
const mockGetCurrentYear = jest.fn();
const mockIsDecember = jest.fn();
const mockIsJanuaryFirst = jest.fn();

jest.mock('@/shared/time', () => ({
  ...jest.requireActual('@/shared/time'),
  getTodayDateString: () => jest.requireActual('@/shared/time').formatDateShort(mockCreateLondonDate()),
  createInstant: () => mockCreateLondonDate(),
  getCurrentYear: () => mockGetCurrentYear(),
  isDecember: () => mockIsDecember(),
  isJanuaryFirst: (date: Date) => mockIsJanuaryFirst(date),
}));

// Mock Api
const mockFetchYear = jest.fn();
const mockFetchDay = jest.fn();

jest.mock('@/api/client', () => ({
  fetchYear: (year: number) => mockFetchYear(year),
  fetchDay: (date: string) => mockFetchDay(date),
}));

// Mock Database
const mockGetPrayerByDate = jest.fn();
const mockSaveAllPrayers = jest.fn();
const mockMarkYearAsFetched = jest.fn();
const mockClearAllExcept = jest.fn();
const mockGetItem = jest.fn();
const mockGetAllKeys = jest.fn();
const mockClearPrefix = jest.fn();

jest.mock('@/stores/database', () => ({
  database: { getAllKeys: () => mockGetAllKeys() },
  getPrayerByDate: (date: Date) => mockGetPrayerByDate(date),
  getPrayerByDateString: (date: string) => mockGetPrayerByDate(date),
  saveAllPrayers: (prayers: unknown) => mockSaveAllPrayers(prayers),
  markYearAsFetched: (year: number) => mockMarkYearAsFetched(year),
  clearAllExcept: (keys: string[]) => mockClearAllExcept(keys),
  getItem: (key: string) => mockGetItem(key),
  getAllWithPrefix: () => [],
  clearPrefix: (prefix: string) => mockClearPrefix(prefix),
}));

// Mock ScheduleStore
const mockSetSequence = jest.fn();
const mockRefreshSequence = jest.fn();

jest.mock('@/stores/schedule', () => ({
  setSequence: (type: unknown, date: Date) => mockSetSequence(type, date),
  refreshSequence: (type: unknown) => mockRefreshSequence(type),
}));

// Mock Countdown
const mockStartCountdowns = jest.fn();

jest.mock('@/stores/countdown', () => ({
  startCountdowns: () => mockStartCountdowns(),
}));

// Mock Widget store
const mockRefreshPrayerWidgets = jest.fn();

jest.mock('@/stores/widget', () => ({
  refreshPrayerWidgets: () => mockRefreshPrayerWidgets(),
}));

// Mock version store
const mockHandleAppUpgrade = jest.fn();

jest.mock('@/stores/version', () => ({
  handleAppUpgrade: () => mockHandleAppUpgrade(),
}));

// Mock the notification refresh gate
const mockResetStoredAtom = jest.fn();

jest.mock('@/stores/notifications', () => ({
  lastNotificationScheduleAtom: 'lastNotificationScheduleAtom',
}));

jest.mock('@/stores/storage', () => ({
  resetStoredAtom: (atom: unknown, key: string) => mockResetStoredAtom(atom, key),
}));

// Mock APP_CONFIG
jest.mock('@/shared/config', () => ({
  APP_CONFIG: {
    isDev: false,
  },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

import logger from '@/shared/logger';
import { type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';

// Import after mocks
import { getArmedDayChanges, sync, syncLoadable, triggerSyncLoadable } from '../sync';

// =============================================================================
// TEST HELPERS
// =============================================================================

const createMockPrayerData = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '06:15',
  sunrise: '07:50',
  dhuhr: '12:25',
  asr: '14:40',
  magrib: '17:00',
  isha: '18:45',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
});

/** A whole year of days, dated in UTC so the machine's timezone cannot shift them into the year before */
const createMockYearData = (year = 2026) => {
  const data: ISingleApiResponseTransformed[] = [];
  for (let i = 0; i < 365; i++) {
    const dateStr = new Date(Date.UTC(year, 0, i + 1)).toISOString().split('T')[0];
    data.push(createMockPrayerData(dateStr));
  }
  return data;
};

const actualTime = jest.requireActual<typeof import('@/shared/time')>('@/shared/time');

/** Reads every mocked clock helper from one instant, in London as the app does, whatever the machine's timezone */
const setClock = (instant: string) => {
  const now = new Date(instant);
  const today = actualTime.formatDateShort(now);
  mockCreateLondonDate.mockReturnValue(now);
  mockGetCurrentYear.mockReturnValue(Number(today.slice(0, 4)));
  mockIsDecember.mockReturnValue(today.slice(5, 7) === '12');
  mockIsJanuaryFirst.mockImplementation(actualTime.isJanuaryFirst);
  return now;
};

/** Prayer days that behave like MMKV: read by date or by instant, emptied by the wipe, filled by saves */
const storeHolding = (dates: string[]) => {
  const stored = new Map(dates.map((date) => [date, createMockPrayerData(date)]));
  mockGetPrayerByDate.mockImplementation(
    (date: unknown) => stored.get(typeof date === 'string' ? date : actualTime.formatDateShort(date as Date)) ?? null
  );
  mockClearAllExcept.mockImplementation(() => stored.clear());
  mockClearPrefix.mockImplementation((prefix: string) => {
    for (const date of [...stored.keys()]) if (`prayer_${date}`.startsWith(prefix)) stored.delete(date);
  });
  mockSaveAllPrayers.mockImplementation((records: ISingleApiResponseTransformed[]) => {
    for (const record of records) stored.set(record.date, record);
  });
  mockGetAllKeys.mockImplementation(() => [...stored.keys()].map((date) => `prayer_${date}`));
  return stored;
};

/** The date a device in that timezone shows at the instant */
const deviceDate = (timeZone: string, instant: Date) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant);

/** Lets a request nothing awaits land, and everything it sets off run */
const settle = () => new Promise((resolve) => setImmediate(resolve));

// =============================================================================
// RESET MOCKS BEFORE EACH TEST
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();

  // Default mock implementations
  mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));
  mockGetCurrentYear.mockReturnValue(2026);
  mockIsDecember.mockReturnValue(false);
  mockIsJanuaryFirst.mockReturnValue(false);
  mockGetItem.mockReturnValue({});
  mockGetAllKeys.mockReturnValue([]);
  mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-01-20'));
  mockFetchYear.mockImplementation(async (year: number) => createMockYearData(year));
  mockFetchDay.mockImplementation(async (date: string) => createMockPrayerData(date));
  mockHandleAppUpgrade.mockImplementation(() => {}); // Reset to noop
  mockSaveAllPrayers.mockImplementation(() => {});
  mockMarkYearAsFetched.mockImplementation(() => {});
  mockClearAllExcept.mockImplementation(() => {});
  mockSetSequence.mockImplementation(() => {});
  mockStartCountdowns.mockImplementation(() => {});
});

// =============================================================================
// syncLoadable TESTS
// =============================================================================

describe('syncLoadable', () => {
  it('is defined', () => {
    expect(syncLoadable).toBeDefined();
  });
});

// =============================================================================
// triggerSyncLoadable TESTS
// =============================================================================

describe('triggerSyncLoadable', () => {
  it('is a function', () => {
    expect(typeof triggerSyncLoadable).toBe('function');
  });
});

// =============================================================================
// sync() MAIN ENTRY POINT TESTS
// =============================================================================

describe('sync', () => {
  it('calls handleAppUpgrade first', async () => {
    await sync();

    expect(mockHandleAppUpgrade).toHaveBeenCalled();
  });

  it('checks if data update is needed', async () => {
    await sync();

    // If data exists and not dev mode, should skip update
    expect(mockGetPrayerByDate).toHaveBeenCalled();
  });

  it('initializes app state with current London date', async () => {
    const mockDate = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(mockDate);

    await sync();

    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, mockDate);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, mockDate);
  });

  it('starts countdowns after initialization', async () => {
    await sync();

    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('waits for the widget timeline push before sync resolves', async () => {
    let resolveRefresh: (() => void) | undefined;
    mockRefreshPrayerWidgets.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );

    let syncResolved = false;
    const syncPromise = sync().then(() => {
      syncResolved = true;
      return 'done';
    });

    // Flush every pending microtask: if initializeAppState were
    // fire-and-forget, sync() would already have resolved here
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(syncResolved).toBe(false);

    resolveRefresh?.();
    await expect(syncPromise).resolves.toBe('done');
  });

  it('throws on failure', async () => {
    const error = new Error('Network failure');
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });

    await expect(sync()).rejects.toThrow('Network failure');
  });
});

// =============================================================================
// needsDataUpdate() DECISION LOGIC TESTS
// =============================================================================

describe('needsDataUpdate behavior', () => {
  it('skips update when data exists and not dev mode', async () => {
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-01-20'));

    await sync();

    // Should not call fetchYear since data exists
    expect(mockFetchYear).not.toHaveBeenCalled();
  });

  it('triggers update when no data for today (fresh install)', async () => {
    mockGetPrayerByDate.mockReturnValue(null);

    await sync();

    expect(mockFetchYear).toHaveBeenCalled();
  });

  it('triggers update in December when next year not fetched', async () => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true }); // Current year fetched, not 2027

    await sync();

    expect(mockFetchYear).toHaveBeenCalled();
  });

  it('skips update in December when next year already fetched', async () => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true, 2027: true }); // Both years fetched
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-12-15'));

    await sync();

    // Should not fetch since both years are cached
    expect(mockFetchYear).not.toHaveBeenCalled();
  });

  // An unreadable day is still a stored day, and taking one for a missing day is what started finding 67's
  // re-download loop. With the client and the database both mocked here, any stored record is truthy whatever
  // its times, so only the real modules can show it: syncFetchBeforeWipe.test.ts, "stores a day that is still
  // unreadable at the source with that time unreadable, and never downloads again for it"

  // A day missing inside the payload shows as dashes (R7). Downloading again would bring the same answer on every
  // launch, and offline would put the error screen over the days that are readable. An answer that stops before
  // today was cut short, and only asking again can bring the rest
  describe('when today is missing', () => {
    beforeEach(() => {
      setClock('2026-01-20T10:00:00Z');
      mockGetPrayerByDate.mockReturnValue(null);
    });

    it('fetches nothing while this year is marked and a later day of it is stored, since today is a gap in its answer', async () => {
      mockGetItem.mockReturnValue({ 2026: true });
      mockGetAllKeys.mockReturnValue(['app_installed_version', 'prayer_2026-01-19', 'prayer_2026-01-21']);

      await expect(sync()).resolves.toBeUndefined();
      await expect(sync()).resolves.toBeUndefined();

      expect(mockFetchYear).not.toHaveBeenCalled();
      expect(mockClearAllExcept).not.toHaveBeenCalled();
      expect(mockSetSequence).toHaveBeenCalledTimes(4);
      expect(mockStartCountdowns).toHaveBeenCalledTimes(2);
    });

    it.each([
      { cache: 'is empty', marked: {}, keys: [] },
      { cache: 'holds only last year', marked: { 2025: true }, keys: ['prayer_2025-12-30', 'prayer_2025-12-31'] },
      {
        cache: 'marks this year without any of its days',
        marked: { 2025: true, 2026: true },
        keys: ['prayer_2025-12-31', 'prayer_max_english_width_standard'],
      },
      {
        cache: 'holds days of this year it never marked',
        marked: {},
        keys: ['prayer_2026-01-19', 'prayer_2026-01-21'],
      },
      {
        cache: 'marks this year but holds none of it after today, so its answer was cut short',
        marked: { 2026: true },
        keys: ['prayer_2026-01-18', 'prayer_2026-01-19', 'prayer_2027-01-05'],
      },
    ])('still downloads this year when the cache $cache', async ({ marked, keys }) => {
      mockGetItem.mockReturnValue(marked);
      mockGetAllKeys.mockReturnValue(keys);

      await sync();

      expect(mockFetchYear).toHaveBeenCalledWith(2026);
    });

    it('in December only adds next year while today is a gap in this year, leaving this year as it is', async () => {
      setClock('2026-12-14T09:00:00Z');
      mockGetItem.mockReturnValue({ 2026: true });
      mockGetAllKeys.mockReturnValue(['prayer_2026-12-13', 'prayer_2026-12-15']);

      await expect(sync()).resolves.toBeUndefined();

      expect(mockFetchYear).toHaveBeenCalledTimes(1);
      expect(mockFetchYear).toHaveBeenCalledWith(2027);
      expect(mockClearAllExcept).not.toHaveBeenCalled();
    });

    it('in December still downloads both years when this year stops before today', async () => {
      setClock('2026-12-14T09:00:00Z');
      mockGetItem.mockReturnValue({ 2026: true });
      mockGetAllKeys.mockReturnValue(['prayer_2026-12-12', 'prayer_2026-12-13']);

      await sync();

      expect(mockFetchYear).toHaveBeenCalledWith(2026);
      expect(mockFetchYear).toHaveBeenCalledWith(2027);
    });
  });
});

// =============================================================================
// updatePrayerData() FETCH AND SAVE TESTS
// =============================================================================

describe('updatePrayerData behavior', () => {
  beforeEach(() => {
    // Force data update by returning null
    mockGetPrayerByDate.mockReturnValue(null);
  });

  it('clears cache except app version, What\u2019s New tracker, and preferences only once the fetch has returned', async () => {
    let returnYear: ((year: ISingleApiResponseTransformed[]) => void) | undefined;
    mockFetchYear.mockImplementation(
      () =>
        new Promise<ISingleApiResponseTransformed[]>((resolve) => {
          returnYear = resolve;
        })
    );

    const syncing = sync();
    expect(mockClearAllExcept).not.toHaveBeenCalled();

    returnYear?.(createMockYearData());
    await syncing;

    expect(mockClearAllExcept).toHaveBeenCalledWith([
      'app_installed_version',
      'whats_new_shown_version',
      'cache_schema_version',
      'preference_',
      'prayer_max_english_width_',
      'scheduled_notifications_',
      'scheduled_reminders_',
    ]);
  });

  it('fetches current year data', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
  });

  it('saves fetched prayer data', async () => {
    const yearData = createMockYearData();
    mockFetchYear.mockResolvedValue(yearData);

    await sync();

    expect(mockSaveAllPrayers).toHaveBeenCalledWith(yearData);
  });

  it('marks year as fetched after saving', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
  });

  it('throws on API error', async () => {
    mockFetchYear.mockRejectedValue(new Error('API unavailable'));

    await expect(sync()).rejects.toThrow('API unavailable');
  });
});

// =============================================================================
// THE NOTIFICATION REFRESH GATE AFTER A DOWNLOAD
// =============================================================================

// A reschedule that ran before the download landed has stamped the gate over the days it could find
describe('reopening the notification refresh gate when a download is stored', () => {
  const GATE = ['lastNotificationScheduleAtom', 'preference_last_notification_schedule_check'];

  beforeEach(() => {
    setClock('2026-01-20T10:00:00Z');
  });

  it('reopens it once a swap has stored this year, after the days are saved', async () => {
    const stored = storeHolding(['2026-01-21']);

    await sync();

    expect(mockClearAllExcept).toHaveBeenCalled();
    expect(stored.has('2026-01-20')).toBe(true);
    expect(mockResetStoredAtom.mock.calls).toEqual([GATE]);
    const yearSaved = mockSaveAllPrayers.mock.calls.findIndex(([records]) => records.length === 365);
    expect(mockResetStoredAtom.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockSaveAllPrayers.mock.invocationCallOrder[yearSaved]
    );
  });

  it('reopens it when a download without today is added without a wipe', async () => {
    storeHolding(['2026-01-21']);
    mockFetchYear.mockImplementation(async (year: number) =>
      createMockYearData(year).filter((day) => day.date !== '2026-01-20')
    );

    await sync();

    expect(mockClearAllExcept).not.toHaveBeenCalled();
    expect(mockResetStoredAtom.mock.calls).toEqual([GATE]);
  });

  it('leaves it closed when the download fails', async () => {
    storeHolding(['2026-01-21']);
    mockFetchYear.mockRejectedValue(new TypeError('Network request failed'));

    // Tomorrow is stored, so the lists still show
    await expect(sync()).resolves.toBeUndefined();

    expect(mockResetStoredAtom).not.toHaveBeenCalled();
  });

  describe('only for a day from yesterday to today+2 the download changed', () => {
    const ARMED = ['2026-12-13', '2026-12-14', '2026-12-15', '2026-12-16'];

    beforeEach(() => {
      // This year unmarked with today stored, so December downloads both years and swaps this one in
      setClock('2026-12-14T09:00:00Z');
      storeHolding(ARMED);
    });

    const answering = (change: (day: ISingleApiResponseTransformed) => ISingleApiResponseTransformed | null) =>
      mockFetchYear.mockImplementation(async (year: number) =>
        createMockYearData(year).flatMap((day) => {
          const changed = change(day);
          return changed ? [changed] : [];
        })
      );

    it.each([
      { download: 'repeats every one of them', change: (day: ISingleApiResponseTransformed) => day, reopened: 0 },
      {
        download: 'changes only a day outside them',
        change: (day: ISingleApiResponseTransformed) => (day.date === '2026-12-17' ? { ...day, magrib: '17:01' } : day),
        reopened: 0,
      },
      {
        download: 'changes a time on one of them',
        change: (day: ISingleApiResponseTransformed) => (day.date === '2026-12-15' ? { ...day, magrib: '17:01' } : day),
        reopened: 1,
      },
      {
        download: 'no longer has one of them',
        change: (day: ISingleApiResponseTransformed) => (day.date === '2026-12-16' ? null : day),
        reopened: 1,
      },
    ])('after a swap whose download $download, reopens it $reopened times', async ({ change, reopened }) => {
      answering(change);
      const changesBefore = getArmedDayChanges();

      await sync();

      // The swap wiped every one of those days first, so they are compared with how they were before it
      expect(mockClearAllExcept).toHaveBeenCalled();
      expect(mockResetStoredAtom).toHaveBeenCalledTimes(reopened);
      expect(getArmedDayChanges()).toBe(changesBefore + reopened);
    });

    it('reopens it when the download brings a key a stored day lacked, as an edited backup can', async () => {
      const stored = storeHolding(ARMED);
      const edited = Object.fromEntries(
        Object.entries(createMockPrayerData('2026-12-15')).filter(([key]) => key !== 'isha')
      );
      stored.set('2026-12-15', edited as unknown as ISingleApiResponseTransformed);
      answering((day) => day);

      await sync();

      expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
    });

    it('stays closed on each sync that adds a year cut short before today again', async () => {
      setClock('2026-07-01T08:00:00Z');
      const firstHalf = createMockYearData(2026).slice(0, 181);
      expect(firstHalf.at(-1)?.date).toBe('2026-06-30');
      mockGetItem.mockReturnValue({ 2026: true });
      storeHolding(firstHalf.map((day) => day.date));
      mockFetchYear.mockResolvedValue(firstHalf);
      const changesBefore = getArmedDayChanges();

      await sync();
      await sync();

      expect(mockFetchYear.mock.calls).toEqual([[2026], [2026]]);
      expect(mockResetStoredAtom).not.toHaveBeenCalled();
      expect(getArmedDayChanges()).toBe(changesBefore);
    });
  });

  it('leaves it closed for a download dropped because one that began later is already stored', async () => {
    storeHolding(['2026-01-21']);
    const answers: ((year: ISingleApiResponseTransformed[]) => void)[] = [];
    mockFetchYear.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));

    const launch = sync();
    const resumed = sync();
    answers[1]?.(createMockYearData());
    await resumed;
    answers[0]?.(createMockYearData());
    await launch;

    expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
  });

  describe('in December', () => {
    beforeEach(() => {
      setClock('2026-12-14T09:00:00Z');
    });

    // Next year only reaches the alarms from 31 December, and an answer that has not changed reaches nothing
    it.each([
      { nextYear: 'complete', lacking: undefined, on: '2026-12-14', reopened: 0 },
      { nextYear: 'lacking 1 January', lacking: '2027-01-01', on: '2026-12-14', reopened: 0 },
      { nextYear: 'complete', lacking: undefined, on: '2026-12-31', reopened: 1 },
      { nextYear: 'lacking 1 January', lacking: '2027-01-01', on: '2026-12-31', reopened: 1 },
    ])(
      'adding next year $nextYear alone on $on, twice, reopens it $reopened times',
      async ({ lacking, on, reopened }) => {
        setClock(`${on}T09:00:00Z`);
        mockGetItem.mockReturnValue({ 2026: true });
        storeHolding([on]);
        mockFetchYear.mockImplementation(async (year: number) =>
          createMockYearData(year).filter((day) => day.date !== lacking)
        );

        await sync();
        await sync();

        expect(mockFetchYear.mock.calls).toEqual([[2027], [2027]]);
        expect(mockResetStoredAtom).toHaveBeenCalledTimes(reopened);
      }
    );

    it('leaves it closed while next year is not out yet', async () => {
      mockGetItem.mockReturnValue({ 2026: true });
      storeHolding(['2026-12-14']);
      mockFetchYear.mockRejectedValue(new Error('Incomplete data received'));

      await expect(sync()).resolves.toBeUndefined();

      expect(mockResetStoredAtom).not.toHaveBeenCalled();
    });

    it.each([
      { nextYear: 'stored', answer: async (year: number) => createMockYearData(year) },
      {
        nextYear: 'added without 1 January',
        answer: async (year: number) => createMockYearData(year).filter((day) => day.date !== '2027-01-01'),
      },
      {
        nextYear: 'not out yet',
        answer: async (year: number) => {
          if (year === 2027) throw new Error('Incomplete data received');
          return createMockYearData(year);
        },
      },
    ])(
      'reopens it once, for this year, when a refresh of both brings today, with next year $nextYear',
      async ({ answer }) => {
        storeHolding(['2026-12-13']);
        mockFetchYear.mockImplementation(answer);

        await sync();

        expect(mockClearAllExcept).toHaveBeenCalled();
        expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
      }
    );
  });
});

// =============================================================================
// A FAILED REFRESH WITH DAYS ALREADY STORED (DASHES-DESIGN §9)
// =============================================================================

// The error screen's Refresh wipes, so it may only cover a launch with nothing the lists can show
describe('a failed refresh', () => {
  beforeEach(() => {
    setClock('2026-09-14T08:00:00Z');
    mockFetchYear.mockRejectedValue(new TypeError('Network request failed'));
  });

  it.each([
    { stored: 'tomorrow', dates: ['2026-09-15'] },
    { stored: 'the day after tomorrow', dates: ['2026-09-16'] },
  ])('shows the lists when only $stored is stored, and asks again on the next sync', async ({ dates }) => {
    storeHolding(dates);

    await expect(sync()).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Refresh failed'), {
      error: expect.any(TypeError),
    });
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalledTimes(1);

    await expect(sync()).resolves.toBeUndefined();

    expect(mockFetchYear).toHaveBeenCalledTimes(2);
  });

  it.each([
    { stored: 'nothing', dates: [] },
    { stored: 'only yesterday', dates: ['2026-09-13'] },
    { stored: 'only the third day after today', dates: ['2026-09-17'] },
  ])('still rejects, setting no lists, when $stored is stored', async ({ dates }) => {
    storeHolding(dates);

    await expect(sync()).rejects.toThrow('Network request failed');

    expect(mockSetSequence).not.toHaveBeenCalled();
  });
});

// =============================================================================
// DECEMBER PREFETCH TESTS
// =============================================================================

describe('December prefetch behavior', () => {
  beforeEach(() => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true }); // Only current year fetched
    mockGetPrayerByDate.mockReturnValue(null); // Force update
  });

  it('fetches both current and next year in December', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
  });

  it('fetches years in parallel using Promise.all', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    // Track call order
    const callOrder: number[] = [];
    mockFetchYear.mockImplementation(async (year: number) => {
      callOrder.push(year);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return createMockYearData(year);
    });

    await sync();

    // Both should be called before either resolves (parallel)
    expect(callOrder).toContain(2026);
    expect(callOrder).toContain(2027);
  });

  it('saves both years of data', async () => {
    await sync();

    expect(mockSaveAllPrayers).toHaveBeenCalledTimes(2);
  });

  it('marks both years as fetched', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2027);
  });

  it('still saves current year when next year fetch fails (empty dataset)', async () => {
    mockGetCurrentYear.mockReturnValue(2026);
    mockFetchYear.mockImplementation(async (year: number) => {
      if (year === 2027) throw new Error('Incomplete data received');
      return createMockYearData();
    });

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
    expect(mockSaveAllPrayers).toHaveBeenCalledTimes(1);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
    expect(mockMarkYearAsFetched).not.toHaveBeenCalledWith(2027);
  });

  it('resolves and initializes app when only next year fails', async () => {
    mockFetchYear.mockImplementation(async (year: number) => {
      if (year === 2027) throw new Error('Incomplete data received');
      return createMockYearData();
    });

    await expect(sync()).resolves.toBeUndefined();
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('retries next year on subsequent sync until it succeeds', async () => {
    const yearData = createMockYearData();
    mockFetchYear.mockImplementation(async (year: number) => {
      if (year === 2027) throw new Error('Incomplete data received');
      return yearData;
    });

    // First sync: next year not yet populated on API
    await sync();
    expect(mockMarkYearAsFetched).not.toHaveBeenCalledWith(2027);

    // Second sync: API now populated
    mockFetchYear.mockImplementation(async (year: number) => createMockYearData(year));
    await sync();

    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2027);
    expect(mockFetchYear.mock.calls.filter(([year]) => year === 2027)).toHaveLength(2);
  });

  it('throws when both years fail', async () => {
    mockFetchYear.mockRejectedValue(new Error('API unavailable'));

    await expect(sync()).rejects.toThrow('API unavailable');
    expect(mockSaveAllPrayers).not.toHaveBeenCalled();
    expect(mockMarkYearAsFetched).not.toHaveBeenCalled();
  });

  it('fetches only next year when current year is already cached', async () => {
    mockGetCurrentYear.mockReturnValue(2026);
    mockGetItem.mockReturnValue({ 2026: true });
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-12-15'));
    mockFetchYear.mockImplementation(async (year: number) => createMockYearData(year));

    await sync();

    // Only next year fetched, cache not cleared or rewritten for current year
    expect(mockFetchYear).toHaveBeenCalledTimes(1);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
    expect(mockFetchYear).not.toHaveBeenCalledWith(2026);
    expect(mockClearAllExcept).not.toHaveBeenCalled();
    expect(mockSaveAllPrayers).toHaveBeenCalledTimes(1);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2027);
    expect(mockMarkYearAsFetched).not.toHaveBeenCalledWith(2026);
  });

  it('retries only next year on later December syncs while current year stays cached', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    // First sync: no cache - full refresh, next year not yet on API
    mockGetItem.mockReturnValue({});
    mockGetPrayerByDate.mockReturnValue(null);
    mockFetchYear.mockImplementation(async (year: number) => {
      if (year === 2027) throw new Error('Incomplete data received');
      return createMockYearData();
    });

    await sync();

    // Later sync: current year cached - only next year attempted, cache preserved
    mockGetItem.mockReturnValue({ 2026: true });
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-12-15'));
    mockFetchYear.mockClear();
    mockClearAllExcept.mockClear();
    mockSetSequence.mockClear();
    mockStartCountdowns.mockClear();
    mockFetchYear.mockRejectedValue(new Error('Incomplete data received'));

    await expect(sync()).resolves.toBeUndefined();

    expect(mockFetchYear).toHaveBeenCalledTimes(1);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
    expect(mockFetchYear).not.toHaveBeenCalledWith(2026);
    expect(mockClearAllExcept).not.toHaveBeenCalled();
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });
});

// =============================================================================
// 1 JANUARY WITHOUT 31 DECEMBER (R13)
// =============================================================================

describe('1 January without 31 December (R13)', () => {
  const DECEMBER_31 = '2026-12-31';
  let now: Date;
  let stored: Map<string, ISingleApiResponseTransformed>;

  beforeEach(() => {
    now = setClock('2027-01-01T10:00:00Z');
    mockGetItem.mockReturnValue({ 2027: true });
    stored = storeHolding(['2027-01-01']);
  });

  /** Both lists set once per sync, and set and refreshed once more each time 31 December lands */
  const expectTodayShown = (syncs = 1, rebuilds = 0) => {
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, now);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, now);
    expect(mockSetSequence).toHaveBeenCalledTimes(2 * (syncs + rebuilds));
    expect(mockRefreshSequence).toHaveBeenCalledTimes(2 * rebuilds);
    expect(mockStartCountdowns).toHaveBeenCalledTimes(syncs);
  };

  it('asks for 31 December alone, never the whole of last year', async () => {
    await expect(sync()).resolves.toBeUndefined();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(1);
    expect(mockFetchDay).toHaveBeenCalledWith(DECEMBER_31);
    expect(mockFetchYear).not.toHaveBeenCalled();
    expectTodayShown(1, 1);
  });

  it('sets today on screen before asking, then stores 31 December and rebuilds both lists from it', async () => {
    const events: string[] = [];
    const save = mockSaveAllPrayers.getMockImplementation();
    mockSaveAllPrayers.mockImplementation((records: ISingleApiResponseTransformed[]) => {
      events.push('save');
      save?.(records);
    });
    mockSetSequence.mockImplementation((type: ScheduleType) => events.push(`set ${type}`));
    mockRefreshSequence.mockImplementation((type: ScheduleType) => events.push(`refresh ${type}`));
    mockStartCountdowns.mockImplementation(() => events.push('countdowns'));
    mockFetchDay.mockImplementation(async (date: string) => {
      events.push(`ask ${date}`);
      return createMockPrayerData(date);
    });

    await sync();
    await settle();

    expect(events).toEqual([
      `set ${ScheduleType.Standard}`,
      `set ${ScheduleType.Extra}`,
      'countdowns',
      `ask ${DECEMBER_31}`,
      'save',
      `set ${ScheduleType.Standard}`,
      `refresh ${ScheduleType.Standard}`,
      `set ${ScheduleType.Extra}`,
      `refresh ${ScheduleType.Extra}`,
    ]);
    expect(mockSaveAllPrayers).toHaveBeenCalledWith([createMockPrayerData(DECEMBER_31)]);
    expect(stored.get(DECEMBER_31)).toEqual(createMockPrayerData(DECEMBER_31));
  });

  it('resolves with today on screen while the request for 31 December has not answered', async () => {
    let refuse: ((error: Error) => void) | undefined;
    mockFetchDay.mockReturnValue(
      new Promise<ISingleApiResponseTransformed>((_, reject) => {
        refuse = reject;
      })
    );

    await expect(sync()).resolves.toBeUndefined();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledWith(DECEMBER_31);
    expect(mockSaveAllPrayers).not.toHaveBeenCalled();
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expectTodayShown();

    // Answered at last, so no request is still on its way for the tests after this one
    refuse?.(new Error('HTTP error! status: 404'));
    await settle();
  });

  it('keeps one request for 31 December on its way however many syncs find the day missing, and asks again once it has failed', async () => {
    let refuse: ((error: Error) => void) | undefined;
    mockFetchDay.mockReturnValueOnce(
      new Promise<ISingleApiResponseTransformed>((_, reject) => {
        refuse = reject;
      })
    );

    await sync();
    await sync();
    await sync();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(1);

    refuse?.(new Error('HTTP error! status: 404'));
    await settle();
    await sync();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(2);
    expect(stored.has(DECEMBER_31)).toBe(true);
  });

  it('asks again once a request that landed could not be stored', async () => {
    mockSaveAllPrayers.mockImplementationOnce(() => {
      throw new Error('Database write failed');
    });

    await sync();
    await settle();
    await sync();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(2);
    expect(stored.has(DECEMBER_31)).toBe(true);
  });

  it('stores a 31 December that lands after sync resolved, rebuilding both lists at that moment and reopening the gate', async () => {
    let answer: ((day: ISingleApiResponseTransformed) => void) | undefined;
    mockFetchDay.mockReturnValue(
      new Promise<ISingleApiResponseTransformed>((resolve) => {
        answer = resolve;
      })
    );

    await sync();
    await settle();
    expect(mockSaveAllPrayers).not.toHaveBeenCalled();

    const later = setClock('2027-01-01T10:20:00Z');
    answer?.(createMockPrayerData(DECEMBER_31));
    await settle();

    expect(stored.get(DECEMBER_31)).toEqual(createMockPrayerData(DECEMBER_31));
    expect(mockSetSequence.mock.calls.slice(2)).toEqual([
      [ScheduleType.Standard, later],
      [ScheduleType.Extra, later],
    ]);
    expect(mockRefreshSequence.mock.calls).toEqual([[ScheduleType.Standard], [ScheduleType.Extra]]);
    expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
  });

  it('only logs a refusal that lands after sync resolved', async () => {
    let refuse: ((error: Error) => void) | undefined;
    mockFetchDay.mockReturnValue(
      new Promise<ISingleApiResponseTransformed>((_, reject) => {
        refuse = reject;
      })
    );

    await sync();
    const error = new Error('HTTP error! status: 404');
    refuse?.(error);
    await settle();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Dec 31'), { error });
    expect(logger.error).not.toHaveBeenCalled();
    expect(mockSaveAllPrayers).not.toHaveBeenCalled();
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expectTodayShown();
  });

  it('leaves last year unmarked, since one day is not a year', async () => {
    await sync();
    await settle();

    expect(mockSaveAllPrayers).toHaveBeenCalledTimes(1);
    expect(mockMarkYearAsFetched).not.toHaveBeenCalled();
  });

  it('reopens the notification refresh gate once 31 December is stored, so the night rows it gives can be armed', async () => {
    await sync();
    await settle();

    expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
    expect(mockResetStoredAtom).toHaveBeenCalledWith(
      'lastNotificationScheduleAtom',
      'preference_last_notification_schedule_check'
    );
    expect(mockResetStoredAtom.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockSaveAllPrayers.mock.invocationCallOrder[0]
    );
  });

  it('reopens the gate on the later sync that stores 31 December after the launch was refused it', async () => {
    mockFetchDay.mockRejectedValueOnce(new Error('HTTP error! status: 404'));

    await sync();
    await settle();
    expect(mockResetStoredAtom).not.toHaveBeenCalled();

    await sync();
    await settle();
    expect(stored.has(DECEMBER_31)).toBe(true);
    expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
  });

  it('still stores 31 December and shows today when the gate cannot be reopened', async () => {
    const error = new Error('MMKV remove failed');
    mockResetStoredAtom.mockImplementation(() => {
      throw error;
    });

    await expect(sync()).resolves.toBeUndefined();
    await settle();

    expect(stored.has(DECEMBER_31)).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('gate'), { error });
    expectTodayShown(1, 1);
  });

  it('still rejects on 1 January when the year download fails with nothing usable stored', async () => {
    stored.clear();
    mockGetItem.mockReturnValue({});
    mockFetchYear.mockRejectedValue(new TypeError('Network request failed'));

    await expect(sync()).rejects.toThrow('Network request failed');

    expect(mockFetchDay).not.toHaveBeenCalled();
    expect(mockSetSequence).not.toHaveBeenCalled();
  });

  it('asks nothing more once 31 December is stored', async () => {
    await sync();
    await settle();
    await sync();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(1);
    expectTodayShown(2, 1);
  });

  it.each([
    { failure: 'refuses the day', error: new Error('HTTP error! status: 404') },
    { failure: 'cannot be reached', error: new TypeError('Network request failed') },
  ])('still shows 1 January and asks again on the next sync when the endpoint $failure', async ({ error }) => {
    mockFetchDay.mockRejectedValue(error);

    await expect(sync()).resolves.toBeUndefined();
    await settle();

    expect(mockSaveAllPrayers).not.toHaveBeenCalled();
    expect(mockMarkYearAsFetched).not.toHaveBeenCalled();
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expect(stored.has(DECEMBER_31)).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Dec 31'), { error });
    expectTodayShown();

    await expect(sync()).resolves.toBeUndefined();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(2);
    expect(mockFetchDay).toHaveBeenNthCalledWith(2, DECEMBER_31);
    expect(mockFetchYear).not.toHaveBeenCalled();
    expectTodayShown(2);
  });

  it('only logs when 31 December arrives but cannot be written, since today is already on screen and nothing awaits the day', async () => {
    const error = new Error('Database write failed');
    mockSaveAllPrayers.mockImplementation(() => {
      throw error;
    });

    await expect(sync()).resolves.toBeUndefined();
    await settle();

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Dec 31'), { error });
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expectTodayShown();
  });

  it('fetches nothing when 31 December is already stored', async () => {
    stored.set(DECEMBER_31, createMockPrayerData(DECEMBER_31));

    await sync();

    expect(mockFetchDay).not.toHaveBeenCalled();
    expect(mockFetchYear).not.toHaveBeenCalled();
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expectTodayShown();
  });

  it.each([
    { when: '31 December at 23:59:59 London', instant: '2026-12-31T23:59:59Z', devices: [] },
    { when: '2 January at 00:00:00 London', instant: '2027-01-02T00:00:00Z', devices: [] },
    {
      when: '31 December in London while the device already reads 1 January',
      instant: '2026-12-31T15:30:00Z',
      devices: ['Asia/Tokyo', 'Pacific/Kiritimati'],
    },
  ])('fetches nothing on $when', async ({ instant, devices }) => {
    const at = setClock(instant);
    for (const timeZone of devices) expect(deviceDate(timeZone, at)).toBe('2027-01-01');
    // Only the day on screen is stored, so a wrong 1 January would find its 31 December missing and ask
    storeHolding([actualTime.formatDateShort(at)]);
    mockGetItem.mockReturnValue({ 2026: true, 2027: true });

    await sync();

    expect(mockFetchDay).not.toHaveBeenCalled();
    expect(mockFetchYear).not.toHaveBeenCalled();
  });

  it('asks on 1 January in London while the device still reads 31 December', async () => {
    const at = setClock('2027-01-01T04:30:00Z');
    for (const timeZone of ['America/New_York', 'Pacific/Pago_Pago']) {
      expect(deviceDate(timeZone, at)).toBe(DECEMBER_31);
    }

    await sync();
    await settle();

    expect(mockFetchDay).toHaveBeenCalledTimes(1);
    expect(mockFetchDay).toHaveBeenCalledWith(DECEMBER_31);
  });

  describe('when syncs find it missing while the request is on its way', () => {
    let answers: { resolve: (day: ISingleApiResponseTransformed) => void; reject: (error: Error) => void }[];

    beforeEach(() => {
      answers = [];
      mockFetchDay.mockImplementation(
        () => new Promise<ISingleApiResponseTransformed>((resolve, reject) => answers.push({ resolve, reject }))
      );
    });

    it('stores the one answer once, rebuilding both lists and reopening the gate once', async () => {
      await Promise.all([sync(), sync()]);
      expect(mockFetchDay).toHaveBeenCalledTimes(1);

      answers[0]?.resolve(createMockPrayerData(DECEMBER_31));
      await settle();

      expect(stored.get(DECEMBER_31)).toEqual(createMockPrayerData(DECEMBER_31));
      expect(mockSaveAllPrayers).toHaveBeenCalledTimes(1);
      expect(mockMarkYearAsFetched).not.toHaveBeenCalled();
      expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
      expectTodayShown(2, 1);
    });

    it('drops an answer landing after a download of last year that began later, as when the clock is set back a day', async () => {
      await sync();
      expect(mockFetchDay).toHaveBeenCalledTimes(1);

      // Back on 31 December, which is not stored and whose year is unmarked, December downloads both years
      setClock('2026-12-31T12:00:00Z');
      mockGetItem.mockReturnValue({});
      await sync();
      const fromYearDownload = stored.get(DECEMBER_31);
      expect(mockFetchYear).toHaveBeenCalledWith(2026);
      expect(fromYearDownload).toBeDefined();

      answers[0]?.resolve({ ...createMockPrayerData(DECEMBER_31), magrib: '16:01' });
      await settle();

      expect(stored.get(DECEMBER_31)).toBe(fromYearDownload);
      expect(mockRefreshSequence).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// initializeAppState() TESTS
// =============================================================================

describe('initializeAppState behavior', () => {
  it('sets both Standard and Extra sequences', async () => {
    const mockDate = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(mockDate);

    await sync();

    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, mockDate);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, mockDate);
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
  });

  it('calls startCountdowns after setting sequences', async () => {
    await sync();

    // Verify order: setSequence should be called before startCountdowns
    const setSequenceOrder = mockSetSequence.mock.invocationCallOrder[0];
    const startCountdownsOrder = mockStartCountdowns.mock.invocationCallOrder[0];

    expect(setSequenceOrder).toBeLessThan(startCountdownsOrder);
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('error handling', () => {
  it('throws when upgrade check fails', async () => {
    const error = new Error('Sync failed');
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });

    await expect(sync()).rejects.toThrow('Sync failed');
  });

  it('propagates API errors', async () => {
    mockGetPrayerByDate.mockReturnValue(null);
    mockFetchYear.mockRejectedValue(new Error('Network error'));

    await expect(sync()).rejects.toThrow('Network error');
  });

  it('throws database errors', async () => {
    mockGetPrayerByDate.mockReturnValue(null);
    mockSaveAllPrayers.mockImplementation(() => {
      throw new Error('Database write failed');
    });

    await expect(sync()).rejects.toThrow('Database write failed');
  });
});

// =============================================================================
// FLOW INTEGRATION TESTS
// =============================================================================

describe('sync flow integration', () => {
  it('completes full fresh install flow', async () => {
    mockGetPrayerByDate.mockReturnValue(null); // No cached data
    const yearData = createMockYearData();
    mockFetchYear.mockResolvedValue(yearData);

    await sync();

    // A first launch runs every step: upgrade check, fetch, clear, save, mark and init
    expect(mockHandleAppUpgrade).toHaveBeenCalled();
    expect(mockClearAllExcept).toHaveBeenCalled();
    expect(mockFetchYear).toHaveBeenCalled();
    expect(mockSaveAllPrayers).toHaveBeenCalled();
    expect(mockMarkYearAsFetched).toHaveBeenCalled();
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('completes cached data flow (no fetch)', async () => {
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-01-20'));

    await sync();

    // Cached flow: upgrade check -> skip fetch -> init
    expect(mockHandleAppUpgrade).toHaveBeenCalled();
    expect(mockFetchYear).not.toHaveBeenCalled();
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('completes December dual-year fetch flow', async () => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true });
    mockGetPrayerByDate.mockReturnValue(null);
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2027);
  });

  it('completes the 1 January flow with 31 December alone', async () => {
    setClock('2027-01-01T10:00:00Z');
    mockGetItem.mockReturnValue({ 2027: true });
    storeHolding(['2027-01-01']);

    await sync();
    await settle();

    // Upgrade check, no refresh, init, then the one day stored unmarked and both lists rebuilt from it
    expect(mockHandleAppUpgrade).toHaveBeenCalled();
    expect(mockFetchYear).not.toHaveBeenCalled();
    expect(mockFetchDay).toHaveBeenCalledWith('2026-12-31');
    expect(mockSaveAllPrayers).toHaveBeenCalledWith([createMockPrayerData('2026-12-31')]);
    expect(mockMarkYearAsFetched).not.toHaveBeenCalled();
    expect(mockSetSequence).toHaveBeenCalledTimes(4);
    expect(mockRefreshSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });
});

// =============================================================================
// YESTERDAY SURVIVES A DATA REFRESH (ISSUES #4)
// =============================================================================

describe('keeping yesterday through a data refresh (ISSUES #4)', () => {
  it("saves yesterday's record back straight after the cache wipe", async () => {
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00Z'));
    const yesterdayRecord = createMockPrayerData('2026-01-19');
    mockGetPrayerByDate.mockImplementation((date: unknown) => (date === '2026-01-19' ? yesterdayRecord : null));

    await sync();

    const restore = mockSaveAllPrayers.mock.calls.findIndex(([records]) => records[0] === yesterdayRecord);
    expect(restore).toBeGreaterThanOrEqual(0);
    expect(mockSaveAllPrayers.mock.invocationCallOrder[restore]).toBeGreaterThan(
      mockClearAllExcept.mock.invocationCallOrder[0]
    );
  });

  it('on 1 Jan keeps 31 Dec through the wipe, so last year is not downloaded again', async () => {
    mockIsJanuaryFirst.mockReturnValue(true);
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-01T10:00:00Z'));
    mockGetCurrentYear.mockReturnValue(2026);

    // A storage that behaves like MMKV: the wipe empties it, saves fill it
    const stored = new Map<string, ISingleApiResponseTransformed>([['2025-12-31', createMockPrayerData('2025-12-31')]]);
    mockGetPrayerByDate.mockImplementation((date: unknown) =>
      typeof date === 'string' ? (stored.get(date) ?? null) : null
    );
    mockClearAllExcept.mockImplementation(() => stored.clear());
    mockSaveAllPrayers.mockImplementation((records: ISingleApiResponseTransformed[]) => {
      for (const record of records) stored.set(record.date, record);
    });

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
    expect(mockFetchYear).not.toHaveBeenCalledWith(2025);
    expect(mockFetchDay).not.toHaveBeenCalled();
    expect(stored.has('2025-12-31')).toBe(true);
  });
});

/**
 * A stored value whose bytes will not parse reads as absent, never as a crash
 *
 * The XS capture (T-541): the production 2.43.1 build bricked on the "Oh no!"
 * screen within two seconds of every cold launch - no crash, no network attempt,
 * the API up and the same tree healthy on every fresh install. `sync`'s guarded
 * region only rejects with the error screen when no day among today..today+2
 * reads AND something throws, and every read of a stored day is a bare
 * `JSON.parse`: one torn MMKV record (a kill mid-`saveAllPrayers`) throws inside
 * `needsDataUpdate`, the guard calls `hasUsableDays` which reads the same torn
 * record and throws the same way, and the rejection is total. These tests pin
 * the whole class away: an unparseable value is data loss, not a launch
 * failure, and a lost day re-asks the API (the source of truth) rather than
 * being shown as a hole.
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

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

const mockFetchYear = jest.fn();
jest.mock('@/api/client', () => ({
  ...jest.requireActual('@/api/client'),
  fetchYear: (year: number) => mockFetchYear(year),
  fetchDay: jest.fn(),
}));

jest.mock('@/stores/schedule', () => ({ setSequence: jest.fn(), refreshSequence: jest.fn() }));
jest.mock('@/stores/countdown', () => ({ startCountdowns: jest.fn() }));
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/stores/version', () => ({ handleAppUpgrade: jest.fn() }));

import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';

import { sync } from '../sync';

// =============================================================================
// HELPERS
// =============================================================================

const DAY_MS = 86_400_000;

const dayAt = (offset: number): string => {
  const instant = Date.now() + offset * DAY_MS;
  return new Date(instant).toISOString().slice(0, 10);
};

const hhmm = (minutes: number) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
};

const readableDay = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: hhmm(290),
  sunrise: hhmm(390),
  dhuhr: hhmm(780),
  asr: hhmm(990),
  magrib: hhmm(1160),
  isha: hhmm(1240),
  suhoor: '04:30',
  duha: '06:50',
  istijaba: '18:20',
});

// Bytes JSON.parse refuses, standing in for a record torn by a kill mid-write
const TORN = '{"date":"2026-10-31","fajr":"06';

const seedInstall = () => {
  Database.database.clearAll();
  // A warm install: yesterday through the day after tomorrow stored, the year marked
  const days = [readableDay(dayAt(-1)), readableDay(dayAt(0)), readableDay(dayAt(1)), readableDay(dayAt(2))];
  Database.saveAllPrayers(days);
  Database.setItem('app_installed_version', '2.43.2');
  Database.setItem('cache_schema_version', 1);
};

const seedYearDownload = (edition = 0) => {
  const year = Number(dayAt(0).slice(0, 4));
  mockFetchYear.mockResolvedValue(
    [-1, 0, 1, 2].map((offset) => {
      const day = readableDay(dayAt(offset));
      day.fajr = hhmm(290 + edition);
      return day;
    })
  );
  return year;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// THE READS THEMSELVES
// =============================================================================

describe('an unparseable stored value', () => {
  beforeEach(() => {
    Database.database.clearAll();
  });

  it('reads as null through getItem rather than throwing', () => {
    Database.database.set('fetched_years', TORN);

    expect(() => Database.getItem('fetched_years')).not.toThrow();
    expect(Database.getItem('fetched_years')).toBeNull();
  });

  it('reads as null through getPrayerByDateString rather than throwing', () => {
    const today = dayAt(0);
    Database.database.set(`prayer_${today}`, TORN);

    expect(() => Database.getPrayerByDateString(today)).not.toThrow();
    expect(Database.getPrayerByDateString(today)).toBeNull();
  });
});

// =============================================================================
// THE LAUNCH: ONE TORN DAY NO LONGER BRICKS IT
// =============================================================================

describe('sync over an install holding a torn day record', () => {
  it('resolves, drops the torn record and re-asks the API for the year', async () => {
    seedInstall();
    const year = seedYearDownload(1);
    const today = dayAt(0);
    // The tear: today's bytes will not parse, while the year still claims itself fetched
    Database.database.set(`prayer_${today}`, TORN);

    await expect(sync({ deferWidgetRefresh: true })).resolves.toBeUndefined();

    expect(mockFetchYear).toHaveBeenCalledWith(year);

    // The day on screen is the download's, readable
    const stored = Database.getPrayerByDateString(today);
    expect(stored).not.toBeNull();
    expect(stored?.fajr).toBe(hhmm(291));
  });

  it('voids the year marker the torn day cannot vouch for, so the gap rule does not swallow the loss', () => {
    seedInstall();
    Database.setItem('fetched_years', { [Number(dayAt(0).slice(0, 4))]: true });
    // The gap condition in full: the year marked, later days stored, today torn
    Database.database.set(`prayer_${dayAt(0)}`, TORN);

    Database.getPrayerByDateString(dayAt(0));

    const years = Database.getItem('fetched_years');
    expect(years?.[Number(dayAt(0).slice(0, 4))]).toBeUndefined();
  });
});

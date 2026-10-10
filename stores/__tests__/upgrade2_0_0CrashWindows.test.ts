/**
 * The 2.0.0 upgrade's crash windows (stores/version.ts), one test per R18
 * crash-table row as corrected by its banner
 *
 * Each test seeds the disk state a kill at that row's point in the upgrade
 * leaves behind, then re-runs the launch path and asserts convergence: no
 * throw, and the same end state an uninterrupted upgrade reaches. The row-4
 * rewrite is the load-bearing one: the stamp is version-guarded on the
 * CAPTURED pre-overwrite version, never on the stored key or key absence, so a
 * death between the version write and the stamp leaves the language key absent
 * (the en default renders identically) instead of pinning a fresh-looking
 * install to English.
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
jest.mock('@/shared/logger', () => ({ __esModule: true, default: mockLogger }));

const mockStorage = new Map<string, string>();
jest.mock('@/stores/database', () => ({
  getItem: (key: string) => (mockStorage.has(key) ? JSON.parse(mockStorage.get(key) as string) : null),
  setItem: (key: string, value: unknown) => void mockStorage.set(key, JSON.stringify(value)),
  removeItem: (key: string) => void mockStorage.delete(key),
  clearAllExcept: (prefixes: string[]) => {
    for (const key of [...mockStorage.keys()]) {
      if (!prefixes.some((prefix) => key.startsWith(prefix))) mockStorage.delete(key);
    }
  },
}));

const mockMigrate = jest.fn();
jest.mock('@/stores/notifications', () => ({
  lastNotificationScheduleAtom: 'lastNotificationScheduleAtom',
  migrateIndexKeyedAlertPreferences: (storedVersion: string | null) => mockMigrate(storedVersion),
}));

const mockResetStoredAtom = jest.fn();
jest.mock('@/stores/storage', () => ({
  resetStoredAtom: (atom: unknown, key: string) => mockResetStoredAtom(atom, key),
}));

// =============================================================================
// FIXTURES
// =============================================================================

const INSTALLED = '2.0.0';
const DEAD_KEY = 'preference_show_arabic_names';
const LANGUAGE_KEY = 'preference_language';
const BOOKKEEPING_KEY = 'scheduled_notifications_standard_0_athan_standard_fajr_2026-01-19';

/** A launch with its own module state, since the upgrade check runs once per launch */
const launch = () => {
  let version!: typeof import('../version');
  jest.isolateModules(() => {
    const constants = require('expo-constants');
    constants.mockExpoConfig.version = INSTALLED;
    constants.mockExpoConfig.present = true;
    version = require('../version');
  });
  return version;
};

const seed = (entries: Record<string, unknown>) => {
  mockStorage.clear();
  for (const [key, value] of Object.entries(entries)) mockStorage.set(key, JSON.stringify(value));
};

const read = (key: string) => (mockStorage.has(key) ? JSON.parse(mockStorage.get(key) as string) : null);
const holds = (key: string) => mockStorage.has(key);

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// ROW 2: dies right after the width seed, mid-copy
// =============================================================================

describe('crash windows around the 2.0.0 upgrade', () => {
  it('converges when death lands mid width seed, one en key and one legacy key written', () => {
    seed({
      app_installed_version: '1.29.305',
      cache_schema_version: 1,
      // The ui seed's own per-key absence guard completes this copy at its next
      // module evaluation (covered by stores/__tests__/ui.test.ts); the upgrade
      // path's contribution is to leave both keys alone - no wipe runs
      prayer_max_english_width_en_standard: '150',
      prayer_max_english_width_extra: '87',
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    expect(read('app_installed_version')).toBe('2.0.0');
    expect(read('prayer_max_english_width_en_standard')).toBe('150');
    expect(read('prayer_max_english_width_extra')).toBe('87');
    expect(read(LANGUAGE_KEY)).toBe('en');
  });

  // =============================================================================
  // ROW 3: dies right after the gate reopen
  // =============================================================================

  it('converges when death lands after the gate reopen, before the version write', () => {
    seed({ app_installed_version: '1.29.305', cache_schema_version: 1, [DEAD_KEY]: false });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // wasAppUpgraded fires again off the still-old version key and every step
    // is idempotent: the gate reopens once more, the stamp runs exactly once
    expect(mockResetStoredAtom).toHaveBeenCalledTimes(1);
    expect(read('app_installed_version')).toBe('2.0.0');
    expect(read(LANGUAGE_KEY)).toBe('en');
    expect(holds(DEAD_KEY)).toBe(false);
  });

  // =============================================================================
  // ROW 4 (rewritten by the correction banner): dies between the version write
  // and the language stamp - the load-bearing one
  // =============================================================================

  it('converges when death lands between the version write and the stamp', () => {
    // The version key already reads 2.0.0 and the captured 1.x is lost; a guard
    // on key absence alone (the BLOCKER's original shape) would stamp this
    // relaunch exactly as it stamps a fresh install
    seed({ app_installed_version: '2.0.0', cache_schema_version: 1, [DEAD_KEY]: false });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // The stamp's idempotence guard read the CAPTURED value, not the stored
    // key: 2.0.0-on-disk is not below 2.0.0, so the key stays absent - which
    // renders the same en the uninterrupted upgrade would have stamped
    expect(holds(LANGUAGE_KEY)).toBe(false);
    expect(mockLogger.info).not.toHaveBeenCalledWith('VERSION: Stamped upgrade language to en');

    // The rest of the end state matches an uninterrupted upgrade
    expect(read('app_installed_version')).toBe('2.0.0');
    expect(holds(DEAD_KEY)).toBe(false);
  });

  // =============================================================================
  // ROW 5a: dies before the toggle delete
  // =============================================================================

  it('converges when death lands after the stamp, before the toggle delete', () => {
    seed({
      app_installed_version: '2.0.0',
      cache_schema_version: 1,
      [LANGUAGE_KEY]: 'en',
      [DEAD_KEY]: false,
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    expect(read(LANGUAGE_KEY)).toBe('en');
    expect(holds(DEAD_KEY)).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('VERSION: Removed the dead arabic-names toggle key');
  });

  // =============================================================================
  // ROW 5b: dies before the post-paint refresh
  // =============================================================================

  it('converges when death lands before the post-paint refresh, gate open and 1.x alarms armed', () => {
    seed({
      app_installed_version: '2.0.0',
      cache_schema_version: 1,
      [LANGUAGE_KEY]: 'en',
      [BOOKKEEPING_KEY]: { id: 'athan_standard_fajr_2026-01-19' },
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // Same version on a clean relaunch: no re-force, no wipe; the open gate and
    // the armed records are what the next foreground pass retries from
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expect(read(BOOKKEEPING_KEY)).toEqual({ id: 'athan_standard_fajr_2026-01-19' });
    expect(read(LANGUAGE_KEY)).toBe('en');
  });

  // =============================================================================
  // ROW 7, first: dies mid re-arm
  // =============================================================================

  it('converges when death lands mid re-arm, some ids replaced and the rest still 1.x-armed', () => {
    seed({
      app_installed_version: '2.0.0',
      cache_schema_version: 1,
      [LANGUAGE_KEY]: 'en',
      'scheduled_notifications_standard_0_athan_standard_fajr_2026-01-19': { id: 'athan_standard_fajr_2026-01-19' },
      'scheduled_notifications_standard_1_reminder_standard_fajr_2026-01-19_10': {
        id: 'reminder_standard_fajr_2026-01-19_10',
      },
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // The relaunch replaces nothing and deletes nothing: the records stay for
    // the foreground pass, so never zero alarms are armed
    expect(read('scheduled_notifications_standard_0_athan_standard_fajr_2026-01-19')).toEqual({
      id: 'athan_standard_fajr_2026-01-19',
    });
    expect(read('scheduled_notifications_standard_1_reminder_standard_fajr_2026-01-19_10')).toEqual({
      id: 'reminder_standard_fajr_2026-01-19_10',
    });
  });

  // =============================================================================
  // ROW 7, second: dies mid record rewrite
  // =============================================================================

  it('converges when death lands mid record rewrite, mixed records with and without arabicName', () => {
    seed({
      app_installed_version: '2.0.0',
      cache_schema_version: 1,
      [LANGUAGE_KEY]: 'en',
      [BOOKKEEPING_KEY]: { id: 'athan_standard_fajr_2026-01-19', arabicName: 'الفجر' },
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // The extra JSON field is ignored by the narrowed reader; nothing in the
    // relaunch needs it gone
    expect(read(BOOKKEEPING_KEY)).toEqual({ id: 'athan_standard_fajr_2026-01-19', arabicName: 'الفجر' });
  });

  // =============================================================================
  // ROW 7, third: dies mid sweep
  // =============================================================================

  it('converges when death lands mid sweep, some strays cancelled and some not', () => {
    seed({
      app_installed_version: '2.0.0',
      cache_schema_version: 1,
      [LANGUAGE_KEY]: 'en',
      [BOOKKEEPING_KEY]: { id: 'athan_standard_fajr_2026-01-19' },
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    expect(holds(BOOKKEEPING_KEY)).toBe(true);
    expect(read(LANGUAGE_KEY)).toBe('en');
  });

  // =============================================================================
  // ROW 7, fourth: the deferred widget push
  // =============================================================================

  it('converges when the widget push is deferred a cycle', () => {
    seed({ app_installed_version: '2.0.0', cache_schema_version: 1, [LANGUAGE_KEY]: 'en' });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // Widgets push again on the next foreground; the upgrade path holds no
    // widget state of its own to corrupt
    expect(read('app_installed_version')).toBe('2.0.0');
    expect(read(LANGUAGE_KEY)).toBe('en');
  });

  // =============================================================================
  // ROW 8: dies before the shown-version write
  // =============================================================================

  it("converges when death lands before the What's New shown-version write", () => {
    // A fresh install that died after the version and marker writes but before
    // the tracker was seeded
    seed({ app_installed_version: '2.0.0', cache_schema_version: 1 });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    // The relaunch is no longer fresh (the version key now exists), so the
    // tracker is recorded on display instead - the modal may show once more,
    // which is the row's whole stated impact
    expect(holds('whats_new_shown_version')).toBe(false);
    expect(holds(LANGUAGE_KEY)).toBe(false);
  });
});

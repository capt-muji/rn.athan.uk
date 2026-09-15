/**
 * The index-key migration against an Extras list that no longer matches the saved keys: every other setting still
 * lands on its prayer, and the prayer that cannot be placed is dropped instead of throwing inside the upgrade check
 */

type Constants = typeof import('@/shared/constants');

interface LoadedStore {
  database: typeof import('@/stores/database').database;
  migrate: typeof import('@/stores/notifications').migrateIndexKeyedAlertPreferences;
}

const KINDS = ['alert', 'reminder_alert', 'reminder_interval'] as const;

/**
 * Loads stores/notifications fresh over a copy of the constants whose Extras list is the one given
 *
 * The store builds its atoms from the list while it loads, so the list is in place first. The database comes from the
 * same fresh copy, so it starts empty and is the one the migration writes to.
 */
const loadWithExtras = (extrasEnglish: string[]): LoadedStore => {
  let loaded!: LoadedStore;

  jest.isolateModules(() => {
    // The guard defends against a prayer list the app does not ship, so the list is replaced before the store loads
    jest.doMock('@/shared/constants', () => ({
      ...jest.requireActual<Constants>('@/shared/constants'),
      EXTRAS_ENGLISH: extrasEnglish,
    }));
    loaded = {
      database: (require('@/stores/database') as typeof import('@/stores/database')).database,
      migrate: (require('@/stores/notifications') as typeof import('@/stores/notifications'))
        .migrateIndexKeyedAlertPreferences,
    };
  });

  return loaded;
};

/** Saves every kind of index key for a list: alert Silent, reminder Sound, and an interval that marks the position */
const saveIndexKeys = (database: LoadedStore['database'], written: string[]) => {
  written.forEach((_, index) => {
    database.set(`preference_alert_extra_${index}`, '1');
    database.set(`preference_reminder_alert_extra_${index}`, '2');
    database.set(`preference_reminder_interval_extra_${index}`, String(5 * (index + 1)));
  });
};

/** Every stored key with its value */
const storedKeys = (database: LoadedStore['database']) =>
  Object.fromEntries(
    database
      .getAllKeys()
      .sort()
      .map((key) => [key, database.getString(key)])
  );

/** What the name keys hold once the given prayers have landed, each with the interval of its written position */
const landedUnderNames = (landed: [string, number][]) =>
  Object.fromEntries(
    landed.flatMap(([name, position]) =>
      KINDS.map((kind, kindIndex) => [
        `preference_${kind}_extra_${name.toLowerCase()}`,
        ['1', '2', String(5 * (position + 1))][kindIndex],
      ])
    )
  );

// doMock registers its factory for the whole file, not only inside the isolated copy
afterEach(() => {
  jest.dontMock('@/shared/constants');
});

describe('the migration of index keys against a changed Extras list', () => {
  it('keeps every other pre-1.0.27 setting and drops only Duha when the Extras list no longer has it', () => {
    const store = loadWithExtras(['Midnight', 'Last Third', 'Suhoor', 'Istijaba']);
    saveIndexKeys(store.database, ['Last Third', 'Suhoor', 'Duha', 'Istijaba']);

    expect(() => store.migrate('1.0.26')).not.toThrow();

    expect(storedKeys(store.database)).toEqual(
      landedUnderNames([
        ['Last Third', 0],
        ['Suhoor', 1],
        ['Istijaba', 3],
      ])
    );
  });
});

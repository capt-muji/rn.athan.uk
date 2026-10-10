/**
 * Unit tests for stores/ui.ts
 *
 * Tests UI state management including:
 * - Settings toggle atoms and their default values
 * - Sheet modal management
 * - Layout measurement atoms and accessors
 */

import { createStore } from 'jotai';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

const createMockModal = () => ({
  present: mockPresent,
  dismiss: mockDismiss,
});

const mockStoreValues = new Map();
const mockDefaultStoreGet = jest.fn((atom) => mockStoreValues.get(atom));
const mockDefaultStoreSet = jest.fn((atom, value) => mockStoreValues.set(atom, value));

// The per-locale width tests flip these inside an isolated module load so the
// module under test gets the REAL storage factory and default store; every other
// test keeps the plain-atom mocks. The flags exist because a doMock cannot
// override a hoisted mock the outer imports have already instantiated.
const mockRealImplementations = { jotai: false, storage: false };
let mockCapturedRealStore: ReturnType<typeof import('jotai').getDefaultStore> | null = null;

jest.mock('jotai', () => {
  const actual = jest.requireActual('jotai');
  return {
    ...actual,
    getDefaultStore: () => {
      if (!mockRealImplementations.jotai) return { get: mockDefaultStoreGet, set: mockDefaultStoreSet };
      mockCapturedRealStore = actual.getDefaultStore();
      return mockCapturedRealStore;
    },
  };
});

jest.mock('../storage', () => {
  const actual = jest.requireActual('../storage');
  const { atom } = jest.requireActual('jotai');
  return {
    atomWithStorageBoolean: (key: string, defaultValue: boolean) =>
      mockRealImplementations.storage ? actual.atomWithStorageBoolean(key, defaultValue) : atom(defaultValue),
    atomWithStorageNumber: (key: string, defaultValue: number) =>
      mockRealImplementations.storage ? actual.atomWithStorageNumber(key, defaultValue) : atom(defaultValue),
    atomWithStorageString: (key: string, defaultValue: string) =>
      mockRealImplementations.storage ? actual.atomWithStorageString(key, defaultValue) : atom(defaultValue),
  };
});

// The per-locale width seed runs at module evaluation against raw MMKV keys, so
// these tests see the same storage the isolated module load will (the real
// storage factory is borrowed back inside each isolation)
const mockDatabaseValues = new Map<string, string | number | boolean>();
jest.mock('@/stores/database', () => ({
  database: {
    getString: (key: string) => {
      const value = mockDatabaseValues.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getBoolean: (key: string) => {
      const value = mockDatabaseValues.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    set: (key: string, value: string | number | boolean) => mockDatabaseValues.set(key, value),
    remove: (key: string) => mockDatabaseValues.delete(key),
  },
}));

import { ScheduleType } from '@/shared/types';

// Require (not import) after mocks - babel hoists ESM imports above the mock declarations
const {
  alertSheetModalAtom,
  alertSheetStateAtom,
  bottomSheetModalAtom,
  countdownBarColorAtom,
  countdownBarShownAtom,
  englishWidthExtraAtom,
  englishWidthStandardAtom,
  getMeasurementsList,
  getPopupUpdateLastCheck,
  hideSettingsSheet,
  hijriDateEnabledAtom,
  measurementsListAtom,
  playingSoundIndexAtom,
  popupHelpEnabledAtom,
  popupUpdateEnabledAtom,
  popupUpdateLastCheckAtom,
  resyncAtom,
  setAlertSheetModal,
  setBottomSheetModal,
  setEnglishWidth,
  setMeasurementsList,
  setPlayingSoundIndex,
  setPopupHelpEnabled,
  setPopupUpdateEnabled,
  setPopupUpdateLastCheck,
  setSettingsSheetModal,
  bumpResync,
  settingsSheetModalAtom,
  showAlertSheet,
  showSecondsAtom,
  showSettingsSheet,
  showSheet,
  showTimePassedAtom,
} = require('../ui');

// =============================================================================
// SETUP
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockStoreValues.clear();
  mockDatabaseValues.clear();
});

// =============================================================================
// SETTINGS ATOMS DEFAULT VALUES
// =============================================================================

describe('settings atoms default values', () => {
  it('has expected defaults for all settings toggles', () => {
    const store = createStore();

    expect(store.get(hijriDateEnabledAtom)).toBe(false);
    expect(store.get(showSecondsAtom)).toBe(false);
    expect(store.get(showTimePassedAtom)).toBe(true);
    expect(store.get(countdownBarShownAtom)).toBe(true);
  });

  it('countdownBarColorAtom has default hex color', () => {
    const store = createStore();
    expect(store.get(countdownBarColorAtom)).toBe('#00ff88');
  });
});

// =============================================================================
// LAYOUT MEASUREMENT ATOMS
// =============================================================================

describe('layout measurement atoms', () => {
  it('measurementsListAtom has empty coordinates by default', () => {
    const store = createStore();
    expect(store.get(measurementsListAtom)).toEqual({ pageX: 0, pageY: 0, width: 0, height: 0 });
  });

  it('measurementsListAtom can store coordinates', () => {
    const store = createStore();
    const coords = { pageX: 10, pageY: 20, width: 300, height: 400 };
    store.set(measurementsListAtom, coords);
    expect(store.get(measurementsListAtom)).toEqual(coords);
  });
});

// =============================================================================
// SHEET MODAL FUNCTIONS
// =============================================================================

describe('sheet modal functions', () => {
  it('showSheet calls present on modal when exists', () => {
    const mockModal = createMockModal();
    mockDefaultStoreGet.mockReturnValue(mockModal);

    showSheet();

    expect(mockPresent).toHaveBeenCalled();
  });

  it('showSheet does not throw when modal is null', () => {
    mockDefaultStoreGet.mockReturnValue(null);
    expect(() => showSheet()).not.toThrow();
  });

  it('showSettingsSheet calls present on modal', () => {
    const mockModal = createMockModal();
    mockDefaultStoreGet.mockReturnValue(mockModal);

    showSettingsSheet();

    expect(mockPresent).toHaveBeenCalled();
  });

  it('hideSettingsSheet calls dismiss on modal', () => {
    const mockModal = createMockModal();
    mockDefaultStoreGet.mockReturnValue(mockModal);

    hideSettingsSheet();

    expect(mockDismiss).toHaveBeenCalled();
  });
});

// =============================================================================
// MODAL SETTER FUNCTIONS
// =============================================================================

describe('modal setter functions', () => {
  it('setBottomSheetModal sets the atom', () => {
    const mockModal = createMockModal();
    setBottomSheetModal(mockModal as never);

    expect(mockDefaultStoreSet).toHaveBeenCalledWith(bottomSheetModalAtom, mockModal);
  });

  it('setSettingsSheetModal sets the atom', () => {
    const mockModal = createMockModal();
    setSettingsSheetModal(mockModal as never);

    expect(mockDefaultStoreSet).toHaveBeenCalledWith(settingsSheetModalAtom, mockModal);
  });

  it('setAlertSheetModal sets the atom', () => {
    const mockModal = createMockModal();
    setAlertSheetModal(mockModal as never);

    expect(mockDefaultStoreSet).toHaveBeenCalledWith(alertSheetModalAtom, mockModal);
  });
});

// =============================================================================
// ALERT SHEET STATE FUNCTIONS
// =============================================================================

describe('alert sheet state functions', () => {
  const mockAlertState = {
    type: ScheduleType.Standard,
    index: 0,
    prayerId: 'fajr',
    isUnavailable: false,
  };

  it('showAlertSheet sets state and calls present', () => {
    const mockModal = createMockModal();
    mockDefaultStoreGet.mockReturnValue(mockModal);

    showAlertSheet(mockAlertState);

    expect(mockDefaultStoreSet).toHaveBeenCalledWith(alertSheetStateAtom, mockAlertState);
    expect(mockPresent).toHaveBeenCalled();
  });
});

// =============================================================================
// PREFERENCE SETTER FUNCTIONS
// =============================================================================

describe('preference setter functions', () => {
  it('setPlayingSoundIndex sets to number', () => {
    setPlayingSoundIndex(5);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(playingSoundIndexAtom, 5);
  });

  it('setPlayingSoundIndex sets to null', () => {
    setPlayingSoundIndex(null);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(playingSoundIndexAtom, null);
  });

  it('setPlayingSoundIndex handles 0 (falsy but valid)', () => {
    setPlayingSoundIndex(0);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(playingSoundIndexAtom, 0);
  });

  it('bumpResync advances the counter', () => {
    bumpResync();
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(resyncAtom, expect.any(Function));
  });

  it('setPopupHelpEnabled sets boolean', () => {
    setPopupHelpEnabled(true);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(popupHelpEnabledAtom, true);
  });

  it('setPopupUpdateEnabled sets boolean', () => {
    setPopupUpdateEnabled(true);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(popupUpdateEnabledAtom, true);
  });

  it('setPopupUpdateLastCheck sets timestamp', () => {
    const timestamp = 1706382000000;
    setPopupUpdateLastCheck(timestamp);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(popupUpdateLastCheckAtom, timestamp);
  });

  it('getPopupUpdateLastCheck returns value', () => {
    const timestamp = 1706382000000;
    mockDefaultStoreGet.mockReturnValue(timestamp);
    expect(getPopupUpdateLastCheck()).toBe(timestamp);
  });
});

// =============================================================================
// MEASUREMENT FUNCTIONS
// =============================================================================

describe('measurement functions', () => {
  const mockCoordinates = { pageX: 100, pageY: 200, width: 300, height: 400 };

  // Jest auto-resets mock implementations between tests; re-establish the
  // Map-backed store at the top of each width test so the comparison path
  // reads and writes real (per-test) state
  const resetWidthStore = () => {
    mockStoreValues.clear();
    mockDefaultStoreGet.mockImplementation((atom) => mockStoreValues.get(atom));
    mockDefaultStoreSet.mockImplementation((atom, value) => mockStoreValues.set(atom, value));
    mockDefaultStoreSet.mockClear();
  };

  it('setEnglishWidth sets Standard atom', () => {
    resetWidthStore();
    setEnglishWidth(ScheduleType.Standard, 150);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(englishWidthStandardAtom, 150);
  });

  it('setEnglishWidth sets Extra atom', () => {
    resetWidthStore();
    setEnglishWidth(ScheduleType.Extra, 120);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(englishWidthExtraAtom, 120);
  });

  it('setEnglishWidth ignores zero and negative measurements', () => {
    resetWidthStore();
    setEnglishWidth(ScheduleType.Standard, 0);
    setEnglishWidth(ScheduleType.Standard, -5);
    expect(mockDefaultStoreSet).not.toHaveBeenCalled();
  });

  it('setEnglishWidth never narrows the cache (grow-toward-truth, ISSUES #22)', () => {
    resetWidthStore();
    setEnglishWidth(ScheduleType.Standard, 150);
    mockDefaultStoreSet.mockClear();

    // A narrower re-measure (e.g. fallback-font metrics) must not overwrite
    setEnglishWidth(ScheduleType.Standard, 90);
    expect(mockDefaultStoreSet).not.toHaveBeenCalled();

    // An equal re-measure is a no-op: correct values never rewrite (no churn)
    setEnglishWidth(ScheduleType.Standard, 150);
    expect(mockDefaultStoreSet).not.toHaveBeenCalled();
  });

  it('setEnglishWidth self-heals a too-narrow cached value on a wider measure', () => {
    resetWidthStore();
    setEnglishWidth(ScheduleType.Standard, 90);
    mockDefaultStoreSet.mockClear();

    setEnglishWidth(ScheduleType.Standard, 150);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(englishWidthStandardAtom, 150);
  });

  it('getMeasurementsList returns value', () => {
    mockDefaultStoreGet.mockReturnValue(mockCoordinates);
    expect(getMeasurementsList()).toBe(mockCoordinates);
  });

  it('setMeasurementsList sets value', () => {
    setMeasurementsList(mockCoordinates);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(measurementsListAtom, mockCoordinates);
  });
});

// =============================================================================
// PER-LOCALE WIDTH KEYS
// =============================================================================

describe('the per-locale width keys', () => {
  /** One module evaluation of stores/ui with the REAL storage factory and store,
   *  so the atoms below it read whatever the seed above them left on disk */
  const loadUiModule = () => {
    mockRealImplementations.jotai = true;
    mockRealImplementations.storage = true;
    let isolated!: typeof import('../ui');
    jest.isolateModules(() => {
      isolated = require('../ui');
    });
    mockRealImplementations.jotai = false;
    mockRealImplementations.storage = false;
    const store = mockCapturedRealStore;
    if (!store) throw new Error('the isolated load never reached getDefaultStore');
    return { isolated, store };
  };

  it('seeds the en width keys from the legacy keys and removes the legacy keys at module evaluation', () => {
    mockDatabaseValues.set('prayer_max_english_width_standard', '150');
    mockDatabaseValues.set('prayer_max_english_width_extra', '120');

    const { isolated, store } = loadUiModule();

    expect(store.get(isolated.englishWidthStandardAtom)).toBe(150);
    expect(store.get(isolated.englishWidthExtraAtom)).toBe(120);
    expect(mockDatabaseValues.get('prayer_max_english_width_en_standard')).toBe('150');
    expect(mockDatabaseValues.get('prayer_max_english_width_en_extra')).toBe('120');
    expect(mockDatabaseValues.has('prayer_max_english_width_standard')).toBe(false);
    expect(mockDatabaseValues.has('prayer_max_english_width_extra')).toBe(false);
  });

  it('keeps widen-only per key and never leaks across keys', () => {
    mockDatabaseValues.set('prayer_max_english_width_en_standard', '150');
    mockDatabaseValues.set('prayer_max_english_width_en_extra', '120');

    const { isolated, store } = loadUiModule();

    // A narrower re-measure and a zero measurement never write...
    isolated.setEnglishWidth(ScheduleType.Standard, 90);
    isolated.setEnglishWidth(ScheduleType.Standard, 0);
    isolated.setEnglishWidth(ScheduleType.Extra, 100);

    // ...and nothing a Standard measure does ever reaches the Extra key
    expect(store.get(isolated.englishWidthStandardAtom)).toBe(150);
    expect(store.get(isolated.englishWidthExtraAtom)).toBe(120);
    expect(mockDatabaseValues.get('prayer_max_english_width_en_standard')).toBe('150');
    expect(mockDatabaseValues.get('prayer_max_english_width_en_extra')).toBe('120');
  });
});

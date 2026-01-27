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

jest.mock('jotai', () => {
  const actual = jest.requireActual('jotai');
  return {
    ...actual,
    getDefaultStore: () => ({
      get: mockDefaultStoreGet,
      set: mockDefaultStoreSet,
    }),
  };
});

jest.mock('../storage', () => ({
  atomWithStorageBoolean: (key: string, defaultValue: boolean) => {
    const { atom } = jest.requireActual('jotai');
    return atom(defaultValue);
  },
  atomWithStorageNumber: (key: string, defaultValue: number) => {
    const { atom } = jest.requireActual('jotai');
    return atom(defaultValue);
  },
  atomWithStorageString: (key: string, defaultValue: string) => {
    const { atom } = jest.requireActual('jotai');
    return atom(defaultValue);
  },
}));

import {
  alertSheetStateAtom,
  alertSheetModalAtom,
  playingSoundIndexAtom,
  refreshUIAtom,
  popupUpdateEnabledAtom,
  popupUpdateLastCheckAtom,
  bottomSheetModalAtom,
  settingsSheetModalAtom,
  englishWidthStandardAtom,
  englishWidthExtraAtom,
  measurementsListAtom,
  measurementsDateAtom,
  countdownBarShownAtom,
  countdownBarColorAtom,
  hijriDateEnabledAtom,
  showSecondsAtom,
  showTimePassedAtom,
  showArabicNamesAtom,
  showSheet,
  showSettingsSheet,
  hideSettingsSheet,
  setBottomSheetModal,
  setSettingsSheetModal,
  setAlertSheetModal,
  showAlertSheet,
  hideAlertSheet,
  getAlertSheetState,
  setPlayingSoundIndex,
  setRefreshUI,
  setPopupUpdateEnabled,
  setPopupUpdateLastCheck,
  getPopupUpdateLastCheck,
  setEnglishWidth,
  getMeasurementsList,
  setMeasurementsList,
  getMeasurementsDate,
  setMeasurementsDate,
} from '../ui';

import { ScheduleType } from '@/shared/types';

// =============================================================================
// SETUP
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockStoreValues.clear();
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
    expect(store.get(showArabicNamesAtom)).toBe(true);
    expect(store.get(countdownBarShownAtom)).toBe(true);
  });

  it('countdownBarColorAtom has default hex color', () => {
    const store = createStore();
    expect(store.get(countdownBarColorAtom)).toBe('#ffd000');
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

  it('hideAlertSheet calls dismiss on modal', () => {
    const mockModal = createMockModal();
    mockDefaultStoreGet.mockReturnValue(mockModal);

    hideAlertSheet();

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
    prayerEnglish: 'Fajr',
    prayerArabic: 'الفجر',
  };

  it('showAlertSheet sets state and calls present', () => {
    const mockModal = createMockModal();
    mockDefaultStoreGet.mockReturnValue(mockModal);

    showAlertSheet(mockAlertState);

    expect(mockDefaultStoreSet).toHaveBeenCalledWith(alertSheetStateAtom, mockAlertState);
    expect(mockPresent).toHaveBeenCalled();
  });

  it('getAlertSheetState returns the state', () => {
    mockDefaultStoreGet.mockReturnValue(mockAlertState);

    const result = getAlertSheetState();

    expect(result).toBe(mockAlertState);
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

  it('setRefreshUI sets timestamp', () => {
    const timestamp = Date.now();
    setRefreshUI(timestamp);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(refreshUIAtom, timestamp);
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

  it('setEnglishWidth sets Standard atom', () => {
    setEnglishWidth(ScheduleType.Standard, 150);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(englishWidthStandardAtom, 150);
  });

  it('setEnglishWidth sets Extra atom', () => {
    setEnglishWidth(ScheduleType.Extra, 120);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(englishWidthExtraAtom, 120);
  });

  it('getMeasurementsList returns value', () => {
    mockDefaultStoreGet.mockReturnValue(mockCoordinates);
    expect(getMeasurementsList()).toBe(mockCoordinates);
  });

  it('setMeasurementsList sets value', () => {
    setMeasurementsList(mockCoordinates);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(measurementsListAtom, mockCoordinates);
  });

  it('getMeasurementsDate returns value', () => {
    mockDefaultStoreGet.mockReturnValue(mockCoordinates);
    expect(getMeasurementsDate()).toBe(mockCoordinates);
  });

  it('setMeasurementsDate sets value', () => {
    setMeasurementsDate(mockCoordinates);
    expect(mockDefaultStoreSet).toHaveBeenCalledWith(measurementsDateAtom, mockCoordinates);
  });
});

/**
 * Unit tests for stores/overlay.ts
 *
 * Tests the explicit open/close lifecycle, the armed close deadline, and the
 * millisecond open guard.
 */

import { ScheduleType } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

let mockOverlayState = {
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
};

const mockStoreGet = jest.fn();
const mockStoreSet = jest.fn();

const mockOverlayAtomSymbol = Symbol('overlayAtom');

jest.mock('jotai/vanilla', () => ({
  getDefaultStore: () => ({
    get: (atom: symbol) => mockStoreGet(atom),
    set: (atom: symbol, value: unknown) => mockStoreSet(atom, value),
  }),
}));

const mockGetNextPrayer = jest.fn();
jest.mock('@/stores/schedule', () => ({
  getNextPrayer: (type: ScheduleType) => mockGetNextPrayer(type),
}));

const mockArmOverlayBoundary = jest.fn();
const mockClearOverlayBoundary = jest.fn();
const mockWriteDisplayCountdown = jest.fn();
jest.mock('@/stores/countdown', () => ({
  armOverlayBoundary: (type: ScheduleType) => mockArmOverlayBoundary(type),
  clearOverlayBoundary: () => mockClearOverlayBoundary(),
  writeDisplayCountdown: (type: ScheduleType) => mockWriteDisplayCountdown(type),
}));

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: mockOverlayAtomSymbol,
}));

// Require (not import) after mocks - babel hoists ESM imports above the mock declarations
const { closeOverlay, openOverlay, toggleOverlay } = require('../overlay');

// =============================================================================
// TEST SETUP
// =============================================================================

const setNextPrayerIn = (ms: number) => {
  mockGetNextPrayer.mockReturnValue({ english: 'Dhuhr', datetime: new Date(Date.now() + ms) });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

  mockOverlayState = { isOn: false, selectedPrayerIndex: 0, scheduleType: ScheduleType.Standard };

  mockStoreGet.mockImplementation((atom: symbol) => {
    if (atom === mockOverlayAtomSymbol) return { ...mockOverlayState };
    return {};
  });
});

afterEach(() => {
  jest.useRealTimers();
});

// =============================================================================
// openOverlay
// =============================================================================

describe('openOverlay', () => {
  it('opens on the requested row, arms the deadline, and writes the display instantly', () => {
    setNextPrayerIn(60_000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).toHaveBeenCalledWith(
      mockOverlayAtomSymbol,
      expect.objectContaining({ isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Standard })
    );
    expect(mockArmOverlayBoundary).toHaveBeenCalledWith(ScheduleType.Standard);
    expect(mockWriteDisplayCountdown).toHaveBeenCalledWith(ScheduleType.Standard);
  });

  it('refuses when the next prayer is 2 seconds away', () => {
    setNextPrayerIn(2000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).not.toHaveBeenCalled();
    expect(mockArmOverlayBoundary).not.toHaveBeenCalled();
  });

  it('refuses when the next prayer is 1.5 seconds away', () => {
    setNextPrayerIn(1500);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).not.toHaveBeenCalled();
  });

  it('allows opening 2001ms before the next prayer (true-millisecond guard)', () => {
    setNextPrayerIn(2001);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
  });

  it('allows opening when all prayers have passed (no next prayer)', () => {
    mockGetNextPrayer.mockReturnValue(null);

    openOverlay(ScheduleType.Standard, 0);

    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
  });

  it('is a no-op when already open', () => {
    mockOverlayState.isOn = true;
    setNextPrayerIn(60_000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).not.toHaveBeenCalled();
  });
});

// =============================================================================
// closeOverlay
// =============================================================================

describe('closeOverlay', () => {
  it('closes, clears the deadline, and writes the display instantly', () => {
    mockOverlayState = { isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Standard };

    closeOverlay();

    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
    expect(mockClearOverlayBoundary).toHaveBeenCalled();
    expect(mockWriteDisplayCountdown).toHaveBeenCalledWith(ScheduleType.Standard);
  });

  it('is a no-op when already closed', () => {
    closeOverlay();

    expect(mockStoreSet).not.toHaveBeenCalled();
    expect(mockClearOverlayBoundary).not.toHaveBeenCalled();
  });
});

// =============================================================================
// toggleOverlay
// =============================================================================

describe('toggleOverlay', () => {
  it('opens the current selection when closed', () => {
    setNextPrayerIn(60_000);

    toggleOverlay();

    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
  });

  it('closes when open', () => {
    mockOverlayState.isOn = true;

    toggleOverlay();

    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
  });

  it('honours an explicit force', () => {
    setNextPrayerIn(60_000);
    toggleOverlay(true);
    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));

    mockOverlayState.isOn = true;
    toggleOverlay(false);
    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
  });
});

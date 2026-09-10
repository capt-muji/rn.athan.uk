/**
 * Unit tests for stores/overlay.ts
 *
 * Tests overlay state management including:
 * - toggleOverlay() - visibility control with the pre-boundary guard
 * - setSelectedPrayerIndex() - prayer selection with instant page-countdown write
 */

import { ScheduleType } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Store state holder
let mockOverlayState = {
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
};

let mockCountdownState = { timeLeft: 100, name: 'Fajr' };

const mockStoreGet = jest.fn();
const mockStoreSet = jest.fn();

// Track which atom is being accessed
const mockOverlayAtomSymbol = Symbol('overlayAtom');
const mockCountdownAtomSymbol = Symbol('countdownAtom');

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

const mockWriteDisplayCountdown = jest.fn();
jest.mock('@/stores/countdown', () => ({
  getCountdownAtom: () => mockCountdownAtomSymbol,
  writeDisplayCountdown: () => mockWriteDisplayCountdown(),
}));

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: mockOverlayAtomSymbol,
}));

// Require (not import) after mocks - babel hoists ESM imports above the mock declarations
const { setSelectedPrayerIndex, toggleOverlay } = require('../overlay');

// =============================================================================
// TEST SETUP
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Reset mock state
  mockOverlayState = {
    isOn: false,
    selectedPrayerIndex: 0,
    scheduleType: ScheduleType.Standard,
  };
  mockCountdownState = { timeLeft: 100, name: 'Fajr' };

  // Smart mock that returns different values based on atom
  mockStoreGet.mockImplementation((atom: symbol) => {
    if (atom === mockOverlayAtomSymbol) {
      return { ...mockOverlayState };
    }
    if (atom === mockCountdownAtomSymbol) {
      return { ...mockCountdownState };
    }
    return {};
  });

  mockGetNextPrayer.mockReturnValue({ english: 'Dhuhr', datetime: new Date() });
});

// =============================================================================
// toggleOverlay TESTS
// =============================================================================

describe('toggleOverlay', () => {
  describe('basic toggle behavior', () => {
    it('opens overlay when currently closed', () => {
      mockOverlayState.isOn = false;

      toggleOverlay();

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });

    it('closes overlay when currently open', () => {
      mockOverlayState.isOn = true;

      toggleOverlay();

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });

    it('writes the page countdown instantly on open and on close', () => {
      toggleOverlay(true);
      expect(mockWriteDisplayCountdown).toHaveBeenCalledTimes(1);

      mockOverlayState.isOn = true;
      toggleOverlay(false);
      expect(mockWriteDisplayCountdown).toHaveBeenCalledTimes(2);
    });
  });

  describe('force parameter', () => {
    it('forces overlay open when force=true', () => {
      mockOverlayState.isOn = false;

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });

    it('forces overlay closed when force=false', () => {
      mockOverlayState.isOn = true;

      toggleOverlay(false);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });

    it('keeps overlay open when force=true and already open', () => {
      mockOverlayState.isOn = true;

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });
  });

  describe('pre-boundary lock', () => {
    it('prevents opening when countdown is 2 seconds or less', () => {
      mockCountdownState.timeLeft = 2;

      toggleOverlay(true);

      expect(mockStoreSet).not.toHaveBeenCalled();
      expect(mockWriteDisplayCountdown).not.toHaveBeenCalled();
    });

    it('prevents opening at 1 second', () => {
      mockCountdownState.timeLeft = 1;

      toggleOverlay(true);

      expect(mockStoreSet).not.toHaveBeenCalled();
    });

    it('allows opening when countdown is above 2 seconds', () => {
      mockCountdownState.timeLeft = 3;

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });

    it('allows closing regardless of countdown', () => {
      mockOverlayState.isOn = true;
      mockCountdownState.timeLeft = 1;

      toggleOverlay(false);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });

    it('allows opening when all prayers have passed', () => {
      mockGetNextPrayer.mockReturnValue(null);

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });
  });
});

// =============================================================================
// setSelectedPrayerIndex TESTS
// =============================================================================

describe('setSelectedPrayerIndex', () => {
  describe('basic functionality', () => {
    it('updates selected prayer index', () => {
      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      expect(mockStoreSet).toHaveBeenCalledWith(
        mockOverlayAtomSymbol,
        expect.objectContaining({ selectedPrayerIndex: 3 })
      );
    });

    it('updates schedule type', () => {
      setSelectedPrayerIndex(ScheduleType.Extra, 1);

      expect(mockStoreSet).toHaveBeenCalledWith(
        mockOverlayAtomSymbol,
        expect.objectContaining({ scheduleType: ScheduleType.Extra })
      );
    });

    it('writes the page countdown after selection', () => {
      setSelectedPrayerIndex(ScheduleType.Standard, 2);

      expect(mockWriteDisplayCountdown).toHaveBeenCalled();
    });

    it('prevents selection when countdown is 2 seconds or less', () => {
      mockCountdownState.timeLeft = 1;

      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      expect(mockStoreSet).not.toHaveBeenCalled();
      expect(mockWriteDisplayCountdown).not.toHaveBeenCalled();
    });

    it('allows selection when countdown is above 2 seconds', () => {
      mockCountdownState.timeLeft = 10;

      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      expect(mockStoreSet).toHaveBeenCalled();
      expect(mockWriteDisplayCountdown).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles index 0', () => {
      setSelectedPrayerIndex(ScheduleType.Standard, 0);

      expect(mockStoreSet).toHaveBeenCalledWith(
        mockOverlayAtomSymbol,
        expect.objectContaining({ selectedPrayerIndex: 0 })
      );
    });

    it('preserves other overlay state properties', () => {
      mockOverlayState = {
        isOn: true,
        selectedPrayerIndex: 1,
        scheduleType: ScheduleType.Standard,
      };

      setSelectedPrayerIndex(ScheduleType.Extra, 4);

      expect(mockStoreSet).toHaveBeenCalledWith(
        mockOverlayAtomSymbol,
        expect.objectContaining({
          isOn: true,
          selectedPrayerIndex: 4,
          scheduleType: ScheduleType.Extra,
        })
      );
    });
  });
});

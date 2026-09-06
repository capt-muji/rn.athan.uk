/**
 * Unit tests for stores/overlay.ts
 *
 * Tests overlay state management including:
 * - toggleOverlay() - visibility control
 * - setSelectedPrayerIndex() - prayer selection with instant page-countdown write
 *
 * ADR-014: the ≤2s pre-boundary open lock is REMOVED — the overlay rides the
 * countdown-finish cascade via selection-follows-next-prayer (stores/countdown).
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

const mockStoreGet = jest.fn();
const mockStoreSet = jest.fn();

// Track which atom is being accessed
const mockOverlayAtomSymbol = Symbol('overlayAtom');

jest.mock('jotai/vanilla', () => ({
  getDefaultStore: () => ({
    get: (atom: symbol) => mockStoreGet(atom),
    set: (atom: symbol, value: unknown) => mockStoreSet(atom, value),
  }),
}));

const mockWriteDisplayCountdown = jest.fn();
jest.mock('@/stores/countdown', () => ({
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

  // Smart mock that returns different values based on atom
  mockStoreGet.mockImplementation((atom: symbol) => {
    if (atom === mockOverlayAtomSymbol) {
      return { ...mockOverlayState };
    }
    return {};
  });
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

  describe('pre-boundary lock removed (ADR-014)', () => {
    it('opens inside the final two seconds — no open-refusal', () => {
      mockOverlayState.isOn = false;

      toggleOverlay(true);

      // The old canShowOverlay guard (timeLeft > 2) is deleted: opening near
      // the boundary always succeeds; the overlay rides the cascade instead
      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
      expect(mockWriteDisplayCountdown).toHaveBeenCalled();
    });

    it('allows closing regardless of countdown', () => {
      mockOverlayState.isOn = true;

      toggleOverlay(false);

      expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });

    it('opens when all prayers have passed', () => {
      mockOverlayState.isOn = false;

      toggleOverlay(true);

      // The all-passed case was previously special-cased by canShowOverlay;
      // with the guard gone it opens for the same reason every open does
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

    it('selects inside the final two seconds — no selection guard', () => {
      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      // The old canShowOverlay guard on selection is deleted (ADR-014)
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

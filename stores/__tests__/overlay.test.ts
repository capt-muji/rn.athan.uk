/**
 * Unit tests for stores/overlay.ts
 *
 * Tests overlay state management including:
 * - toggleOverlay() - visibility control with guards
 * - setSelectedPrayerIndex() - prayer selection with countdown restart
 * - canShowOverlay() - guard logic for countdown protection
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

let mockCountdownState = { timeLeft: 100 };

const mockStoreGet = jest.fn();
const mockStoreSet = jest.fn();

// Track which atom is being accessed
const overlayAtomSymbol = Symbol('overlayAtom');
const countdownAtomSymbol = Symbol('countdownAtom');

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

const mockStartCountdownOverlay = jest.fn();
jest.mock('@/stores/countdown', () => ({
  startCountdownOverlay: () => mockStartCountdownOverlay(),
  getCountdownAtom: () => countdownAtomSymbol,
}));

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: overlayAtomSymbol,
}));

// Import after mocks
// eslint-disable-next-line import/order
import { toggleOverlay, setSelectedPrayerIndex } from '../overlay';

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
  mockCountdownState = { timeLeft: 100 };

  // Smart mock that returns different values based on atom
  mockStoreGet.mockImplementation((atom: symbol) => {
    if (atom === overlayAtomSymbol) {
      return { ...mockOverlayState };
    }
    if (atom === countdownAtomSymbol) {
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
      mockCountdownState.timeLeft = 100;

      toggleOverlay();

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });

    it('closes overlay when currently open', () => {
      mockOverlayState.isOn = true;

      toggleOverlay();

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });
  });

  describe('force parameter', () => {
    it('forces overlay open when force=true', () => {
      mockOverlayState.isOn = false;
      mockCountdownState.timeLeft = 100;

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });

    it('forces overlay closed when force=false', () => {
      mockOverlayState.isOn = true;

      toggleOverlay(false);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });

    it('keeps overlay open when force=true and already open', () => {
      mockOverlayState.isOn = true;
      mockCountdownState.timeLeft = 100;

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });
  });

  describe('countdown guard', () => {
    it('prevents opening when countdown <= 2 seconds', () => {
      mockOverlayState.isOn = false;
      mockCountdownState.timeLeft = 2;

      toggleOverlay(true);

      expect(mockStoreSet).not.toHaveBeenCalled();
    });

    it('prevents opening when countdown = 1 second', () => {
      mockOverlayState.isOn = false;
      mockCountdownState.timeLeft = 1;

      toggleOverlay(true);

      expect(mockStoreSet).not.toHaveBeenCalled();
    });

    it('allows opening when countdown > 2 seconds', () => {
      mockOverlayState.isOn = false;
      mockCountdownState.timeLeft = 3;

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalled();
    });

    it('allows closing regardless of countdown', () => {
      mockOverlayState.isOn = true;
      mockCountdownState.timeLeft = 1;

      toggleOverlay(false);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: false }));
    });
  });

  describe('all prayers passed', () => {
    it('allows opening when no next prayer (all prayers passed)', () => {
      mockOverlayState.isOn = false;
      mockGetNextPrayer.mockReturnValue(null);

      toggleOverlay(true);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ isOn: true }));
    });
  });
});

// =============================================================================
// setSelectedPrayerIndex TESTS
// =============================================================================

describe('setSelectedPrayerIndex', () => {
  describe('basic functionality', () => {
    it('updates selected prayer index', () => {
      mockCountdownState.timeLeft = 100;

      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ selectedPrayerIndex: 3 }));
    });

    it('updates schedule type', () => {
      mockCountdownState.timeLeft = 100;

      setSelectedPrayerIndex(ScheduleType.Extra, 1);

      expect(mockStoreSet).toHaveBeenCalledWith(
        overlayAtomSymbol,
        expect.objectContaining({ scheduleType: ScheduleType.Extra })
      );
    });

    it('starts countdown overlay after selection', () => {
      mockCountdownState.timeLeft = 100;

      setSelectedPrayerIndex(ScheduleType.Standard, 2);

      expect(mockStartCountdownOverlay).toHaveBeenCalled();
    });
  });

  describe('countdown guard', () => {
    it('prevents selection when countdown <= 2 seconds', () => {
      mockCountdownState.timeLeft = 1;

      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      expect(mockStoreSet).not.toHaveBeenCalled();
      expect(mockStartCountdownOverlay).not.toHaveBeenCalled();
    });

    it('allows selection when countdown > 2 seconds', () => {
      mockCountdownState.timeLeft = 10;

      setSelectedPrayerIndex(ScheduleType.Standard, 3);

      expect(mockStoreSet).toHaveBeenCalled();
      expect(mockStartCountdownOverlay).toHaveBeenCalled();
    });
  });

  describe('all prayers passed', () => {
    it('allows selection when no next prayer', () => {
      mockGetNextPrayer.mockReturnValue(null);

      setSelectedPrayerIndex(ScheduleType.Standard, 5);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ selectedPrayerIndex: 5 }));
    });
  });

  describe('edge cases', () => {
    it('handles index 0', () => {
      mockCountdownState.timeLeft = 100;

      setSelectedPrayerIndex(ScheduleType.Standard, 0);

      expect(mockStoreSet).toHaveBeenCalledWith(overlayAtomSymbol, expect.objectContaining({ selectedPrayerIndex: 0 }));
    });

    it('preserves other overlay state properties', () => {
      mockOverlayState = {
        isOn: true,
        selectedPrayerIndex: 1,
        scheduleType: ScheduleType.Standard,
      };
      mockCountdownState.timeLeft = 100;

      setSelectedPrayerIndex(ScheduleType.Extra, 4);

      expect(mockStoreSet).toHaveBeenCalledWith(
        overlayAtomSymbol,
        expect.objectContaining({
          isOn: true,
          selectedPrayerIndex: 4,
          scheduleType: ScheduleType.Extra,
        })
      );
    });
  });
});

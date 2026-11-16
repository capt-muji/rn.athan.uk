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
const mockFadeSettledAtomSymbol = Symbol('overlayFadeSettledAtom');
const mockPagerAtomSymbol = Symbol('pagerPageAtom');

/** The pager's page, as the store mock answers it: 0 Standard, 1 Extras */
let mockPagerPage = 0;

jest.mock('jotai/vanilla', () => ({
  // atom stays real: shared/i18n/locale builds the remount version atom from it
  ...jest.requireActual('jotai/vanilla'),
  getDefaultStore: () => ({
    get: (atom: symbol) => mockStoreGet(atom),
    set: (atom: symbol, value: unknown) => mockStoreSet(atom, value),
  }),
}));

const mockGetNextBoundary = jest.fn();
jest.mock('@/stores/schedule', () => ({
  getNextBoundary: (type: ScheduleType) => mockGetNextBoundary(type),
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
  // The generation functions stay real: the guard tests run the true counter
  ...jest.requireActual('@/stores/atoms/overlay'),
  overlayAtom: mockOverlayAtomSymbol,
  overlayFadeSettledAtom: mockFadeSettledAtomSymbol,
}));

jest.mock('@/stores/atoms/pager', () => ({
  // pageSchedule stays real: the guard maps the position through the true mapping
  ...jest.requireActual('@/stores/atoms/pager'),
  pagerPageAtom: mockPagerAtomSymbol,
}));

// Require (not import) after mocks - babel hoists ESM imports above the mock declarations
const { closeOverlay, markOverlayFadeSettled, openOverlay, toggleOverlay } = require('../overlay');
const { currentFadeGeneration } = require('@/stores/atoms/overlay');

// =============================================================================
// TEST SETUP
// =============================================================================

const setNextPrayerIn = (ms: number) => {
  mockGetNextBoundary.mockReturnValue(new Date(Date.now() + ms));
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

  mockOverlayState = { isOn: false, selectedPrayerIndex: 0, scheduleType: ScheduleType.Standard };
  mockPagerPage = 0;

  mockStoreGet.mockImplementation((atom: symbol) => {
    if (atom === mockOverlayAtomSymbol) return { ...mockOverlayState };
    if (atom === mockPagerAtomSymbol) return mockPagerPage;
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
    mockGetNextBoundary.mockReturnValue(null);

    openOverlay(ScheduleType.Standard, 0);

    expect(mockStoreSet).toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
  });

  it('is a no-op when already open', () => {
    mockOverlayState.isOn = true;
    setNextPrayerIn(60_000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).not.toHaveBeenCalled();
  });

  // A press whose page the pager no longer shows is a stale touch's echo, the
  // owner's tap-then-swipe interleave: the open lands after the swipe settled,
  // so the self-heal (which only closes an OPEN overlay) cannot see it and the
  // open itself must be refused, exactly like a boundary-adjacent open
  it('refuses a Standard open when the pager shows the Extras page', () => {
    mockPagerPage = 1;
    setNextPrayerIn(60_000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).not.toHaveBeenCalledWith(mockOverlayAtomSymbol, expect.objectContaining({ isOn: true }));
    expect(mockArmOverlayBoundary).not.toHaveBeenCalled();
    expect(mockWriteDisplayCountdown).not.toHaveBeenCalled();
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
// THE FADE-HOLD FLAG (one batched display flip for the whole overlay family)
// =============================================================================

describe('the fade-hold flag', () => {
  it('drops in the same store batch that opens, so every held subtree re-renders once', () => {
    setNextPrayerIn(60_000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).toHaveBeenCalledWith(mockFadeSettledAtomSymbol, false);
  });

  it('drops in the same store batch that closes', () => {
    mockOverlayState = { isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Standard };

    closeOverlay();

    expect(mockStoreSet).toHaveBeenCalledWith(mockFadeSettledAtomSymbol, false);
  });

  it('the already-open no-op leaves it untouched', () => {
    mockOverlayState.isOn = true;
    setNextPrayerIn(60_000);

    openOverlay(ScheduleType.Standard, 3);

    expect(mockStoreSet).not.toHaveBeenCalledWith(mockFadeSettledAtomSymbol, false);
  });

  it('the already-closed no-op leaves it untouched', () => {
    closeOverlay();

    expect(mockStoreSet).not.toHaveBeenCalledWith(mockFadeSettledAtomSymbol, false);
  });

  it('markOverlayFadeSettled raises it a microtask later, never mid-render', async () => {
    markOverlayFadeSettled(currentFadeGeneration());

    // The settle can fire from a render-phase animation mapper (Reanimated's
    // jest mock completes withTiming synchronously), so the write must not
    // land in that render
    expect(mockStoreSet).not.toHaveBeenCalledWith(mockFadeSettledAtomSymbol, true);

    await Promise.resolve();

    expect(mockStoreSet).toHaveBeenCalledWith(mockFadeSettledAtomSymbol, true);
  });
});

// =============================================================================
// THE STALE-SETTLE GUARD
// =============================================================================

describe('the stale-settle guard', () => {
  it('ignores a settle from a superseded fade, so it cannot raise the hold over the fade that replaced it', async () => {
    setNextPrayerIn(60_000);
    openOverlay(ScheduleType.Standard, 3);
    const openFadeGeneration = currentFadeGeneration();
    // The mock store does not follow writes, so the close reads an open state
    mockOverlayState = { isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Standard };

    // The close tap's handler runs while the open fade's finished settle is
    // already posted to the JS thread: the writer stamps a fresh generation,
    // and the stale settle lands only after it
    closeOverlay();
    markOverlayFadeSettled(openFadeGeneration);

    await Promise.resolve();

    expect(mockStoreSet).not.toHaveBeenCalledWith(mockFadeSettledAtomSymbol, true);
  });

  it('raises the hold for a settle that carries the live fade generation', async () => {
    mockOverlayState = { isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Standard };
    closeOverlay();
    markOverlayFadeSettled(currentFadeGeneration());

    await Promise.resolve();

    expect(mockStoreSet).toHaveBeenCalledWith(mockFadeSettledAtomSymbol, true);
  });
});

// =============================================================================
// toggleOverlay
// =============================================================================

describe('toggleOverlay', () => {
  it('closes when called bare', () => {
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

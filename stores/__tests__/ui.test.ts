/**
 * Unit tests for stores/ui.ts settings toggle atoms
 *
 * Tests the boolean preference atoms used in BottomSheetSettings:
 * - hijriDateEnabledAtom (default: false)
 * - showSecondsAtom (default: false)
 * - showTimePassedAtom (default: true)
 * - countdownBarShownAtom (default: true)
 *
 * Each atom is tested for default value, setting to true/false,
 * and toggle behavior.
 */

import { createStore } from 'jotai';

import { showTimePassedAtom, showSecondsAtom, hijriDateEnabledAtom, countdownBarShownAtom } from '../ui';

// =============================================================================
// SHOW TIME PASSED ATOM TESTS
// =============================================================================

describe('showTimePassedAtom', () => {
  it('exports the atom', () => {
    expect(showTimePassedAtom).toBeDefined();
  });

  it('has correct default value of true', () => {
    const store = createStore();
    const value = store.get(showTimePassedAtom);
    expect(value).toBe(true);
  });

  it('can be set to false', () => {
    const store = createStore();
    store.set(showTimePassedAtom, false);
    const value = store.get(showTimePassedAtom);
    expect(value).toBe(false);
  });

  it('can be set to true', () => {
    const store = createStore();
    store.set(showTimePassedAtom, false);
    store.set(showTimePassedAtom, true);
    const value = store.get(showTimePassedAtom);
    expect(value).toBe(true);
  });

  it('can toggle between true and false', () => {
    const store = createStore();

    // Default is true
    expect(store.get(showTimePassedAtom)).toBe(true);

    // Toggle to false
    store.set(showTimePassedAtom, false);
    expect(store.get(showTimePassedAtom)).toBe(false);

    // Toggle back to true
    store.set(showTimePassedAtom, true);
    expect(store.get(showTimePassedAtom)).toBe(true);
  });
});

// =============================================================================
// SHOW SECONDS ATOM TESTS
// =============================================================================

describe('showSecondsAtom', () => {
  it('exports the atom', () => {
    expect(showSecondsAtom).toBeDefined();
  });

  it('has correct default value of false', () => {
    const store = createStore();
    const value = store.get(showSecondsAtom);
    expect(value).toBe(false);
  });

  it('can be set to true', () => {
    const store = createStore();
    store.set(showSecondsAtom, true);
    const value = store.get(showSecondsAtom);
    expect(value).toBe(true);
  });

  it('can be set back to false', () => {
    const store = createStore();
    store.set(showSecondsAtom, true);
    store.set(showSecondsAtom, false);
    const value = store.get(showSecondsAtom);
    expect(value).toBe(false);
  });
});

// =============================================================================
// HIJRI DATE ENABLED ATOM TESTS
// =============================================================================

describe('hijriDateEnabledAtom', () => {
  it('exports the atom', () => {
    expect(hijriDateEnabledAtom).toBeDefined();
  });

  it('has correct default value of false', () => {
    const store = createStore();
    const value = store.get(hijriDateEnabledAtom);
    expect(value).toBe(false);
  });

  it('can be set to true', () => {
    const store = createStore();
    store.set(hijriDateEnabledAtom, true);
    const value = store.get(hijriDateEnabledAtom);
    expect(value).toBe(true);
  });

  it('can be set back to false', () => {
    const store = createStore();
    store.set(hijriDateEnabledAtom, true);
    store.set(hijriDateEnabledAtom, false);
    const value = store.get(hijriDateEnabledAtom);
    expect(value).toBe(false);
  });
});

// =============================================================================
// COUNTDOWN BAR SHOWN ATOM TESTS
// =============================================================================

describe('countdownBarShownAtom', () => {
  it('exports the atom', () => {
    expect(countdownBarShownAtom).toBeDefined();
  });

  it('has correct default value of true', () => {
    const store = createStore();
    const value = store.get(countdownBarShownAtom);
    expect(value).toBe(true);
  });

  it('can be set to false', () => {
    const store = createStore();
    store.set(countdownBarShownAtom, false);
    const value = store.get(countdownBarShownAtom);
    expect(value).toBe(false);
  });

  it('can be set back to true', () => {
    const store = createStore();
    store.set(countdownBarShownAtom, false);
    store.set(countdownBarShownAtom, true);
    const value = store.get(countdownBarShownAtom);
    expect(value).toBe(true);
  });
});

// =============================================================================
// SETTINGS ATOMS DEFAULT VALUES SUMMARY
// =============================================================================

describe('settings atoms default values', () => {
  it('has expected defaults for all settings toggles', () => {
    const store = createStore();

    // Document all settings defaults in one place
    expect(store.get(hijriDateEnabledAtom)).toBe(false);
    expect(store.get(showSecondsAtom)).toBe(false);
    expect(store.get(showTimePassedAtom)).toBe(true);
    expect(store.get(countdownBarShownAtom)).toBe(true);
  });
});

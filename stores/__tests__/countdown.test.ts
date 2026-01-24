/**
 * Unit tests for stores/countdown.ts
 *
 * Tests countdown store atoms and their initial state:
 * - standardCountdownAtom
 * - extraCountdownAtom
 * - overlayCountdownAtom
 */

import { createStore } from 'jotai';

import { standardCountdownAtom, extraCountdownAtom, overlayCountdownAtom } from '../countdown';

// =============================================================================
// COUNTDOWN ATOMS TESTS
// =============================================================================

describe('countdown atoms', () => {
  describe('standardCountdownAtom', () => {
    it('is defined', () => {
      expect(standardCountdownAtom).toBeDefined();
    });

    it('has correct initial structure', () => {
      const store = createStore();
      const value = store.get(standardCountdownAtom);

      expect(value).toHaveProperty('timeLeft');
      expect(value).toHaveProperty('name');
    });

    it('has initial timeLeft of 10', () => {
      const store = createStore();
      const value = store.get(standardCountdownAtom);
      expect(value.timeLeft).toBe(10);
    });

    it('has initial name of Fajr', () => {
      const store = createStore();
      const value = store.get(standardCountdownAtom);
      expect(value.name).toBe('Fajr');
    });

    it('can be updated with new countdown state', () => {
      const store = createStore();

      store.set(standardCountdownAtom, { timeLeft: 3600, name: 'Dhuhr' });

      const value = store.get(standardCountdownAtom);
      expect(value.timeLeft).toBe(3600);
      expect(value.name).toBe('Dhuhr');
    });
  });

  describe('extraCountdownAtom', () => {
    it('is defined', () => {
      expect(extraCountdownAtom).toBeDefined();
    });

    it('has correct initial structure', () => {
      const store = createStore();
      const value = store.get(extraCountdownAtom);

      expect(value).toHaveProperty('timeLeft');
      expect(value).toHaveProperty('name');
    });

    it('has initial timeLeft of 10', () => {
      const store = createStore();
      const value = store.get(extraCountdownAtom);
      expect(value.timeLeft).toBe(10);
    });

    it('has initial name of Fajr', () => {
      const store = createStore();
      const value = store.get(extraCountdownAtom);
      expect(value.name).toBe('Fajr');
    });

    it('can be updated with new countdown state', () => {
      const store = createStore();

      store.set(extraCountdownAtom, { timeLeft: 7200, name: 'Midnight' });

      const value = store.get(extraCountdownAtom);
      expect(value.timeLeft).toBe(7200);
      expect(value.name).toBe('Midnight');
    });
  });

  describe('overlayCountdownAtom', () => {
    it('is defined', () => {
      expect(overlayCountdownAtom).toBeDefined();
    });

    it('has correct initial structure', () => {
      const store = createStore();
      const value = store.get(overlayCountdownAtom);

      expect(value).toHaveProperty('timeLeft');
      expect(value).toHaveProperty('name');
    });

    it('has initial timeLeft of 10', () => {
      const store = createStore();
      const value = store.get(overlayCountdownAtom);
      expect(value.timeLeft).toBe(10);
    });

    it('has initial name of Fajr', () => {
      const store = createStore();
      const value = store.get(overlayCountdownAtom);
      expect(value.name).toBe('Fajr');
    });

    it('can be updated with new countdown state', () => {
      const store = createStore();

      store.set(overlayCountdownAtom, { timeLeft: 0, name: 'Prayer' });

      const value = store.get(overlayCountdownAtom);
      expect(value.timeLeft).toBe(0);
      expect(value.name).toBe('Prayer');
    });
  });
});

// =============================================================================
// COUNTDOWN STORE STRUCTURE TESTS
// =============================================================================

describe('countdown store structure', () => {
  it('all countdown atoms have same structure', () => {
    const store = createStore();

    const standard = store.get(standardCountdownAtom);
    const extra = store.get(extraCountdownAtom);
    const overlay = store.get(overlayCountdownAtom);

    // All should have the same keys
    expect(Object.keys(standard)).toEqual(['timeLeft', 'name']);
    expect(Object.keys(extra)).toEqual(['timeLeft', 'name']);
    expect(Object.keys(overlay)).toEqual(['timeLeft', 'name']);
  });

  it('countdown atoms are independent', () => {
    const store = createStore();

    // Update each atom independently
    store.set(standardCountdownAtom, { timeLeft: 100, name: 'Fajr' });
    store.set(extraCountdownAtom, { timeLeft: 200, name: 'Midnight' });
    store.set(overlayCountdownAtom, { timeLeft: 300, name: 'Dhuhr' });

    // Verify they are independent
    expect(store.get(standardCountdownAtom).timeLeft).toBe(100);
    expect(store.get(extraCountdownAtom).timeLeft).toBe(200);
    expect(store.get(overlayCountdownAtom).timeLeft).toBe(300);
  });

  it('timeLeft can be zero', () => {
    const store = createStore();

    store.set(standardCountdownAtom, { timeLeft: 0, name: 'Asr' });

    const value = store.get(standardCountdownAtom);
    expect(value.timeLeft).toBe(0);
  });

  it('timeLeft can be large values', () => {
    const store = createStore();

    // 24 hours in seconds
    store.set(standardCountdownAtom, { timeLeft: 86400, name: 'Isha' });

    const value = store.get(standardCountdownAtom);
    expect(value.timeLeft).toBe(86400);
  });
});

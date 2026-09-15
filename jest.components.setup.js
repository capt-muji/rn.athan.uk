// =============================================================================
// EVERY TEST STARTS FROM A FRESH INSTALL
// =============================================================================

// The app's store modules keep the jotai default store they got when they loaded, and a suite loads them once, so a
// new store per test cannot reach them. That one store is instead built over state containers that are emptied before
// each test; its identity never changes, so jotai's React hooks still find its internals
const mockResetAtomState = { current: () => {} };
jest.mock('jotai/vanilla', () => {
  const vanilla = jest.requireActual('jotai/vanilla');
  const { INTERNAL_buildStoreRev3: buildStore } = jest.requireActual('jotai/vanilla/internals');

  const weakMaps = [];
  const replaceableWeakMap = () => {
    const holder = { current: new WeakMap() };
    weakMaps.push(holder);
    return {
      get: (key) => holder.current.get(key),
      set(key, value) {
        holder.current.set(key, value);
        return this;
      },
      has: (key) => holder.current.has(key),
      delete: (key) => holder.current.delete(key),
    };
  };
  const sets = [new Set(), new Set(), new Set()];

  // atom states, mounted atoms and invalidated atoms, then the changed atoms and the mount and unmount callbacks
  const store = buildStore(replaceableWeakMap(), replaceableWeakMap(), replaceableWeakMap(), ...sets);

  mockResetAtomState.current = () => {
    for (const holder of weakMaps) holder.current = new WeakMap();
    for (const set of sets) set.clear();
  };

  return { ...vanilla, getDefaultStore: () => store };
});

// Every storage the app creates, so each can be emptied before a test
const mockStorages = [];
jest.mock('react-native-mmkv', () => {
  const mmkv = jest.requireActual('react-native-mmkv');
  const createMMKV = (...args) => {
    const storage = mmkv.createMMKV(...args);
    mockStorages.push(storage);
    return storage;
  };
  return { ...mmkv, createMMKV, MMKV: createMMKV };
});

beforeEach(() => {
  for (const storage of mockStorages) storage.clearAll();
  mockResetAtomState.current();
});

// A timer a test left pending would otherwise fire in the next test, on that test's clock, and a spy or a replaced
// property (onPlatform in the harness) would otherwise stay in place. Restoring touches only spies and replaced
// properties, never the jest functions the mocks below are built from
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// =============================================================================
// NATIVE LIBRARIES
// =============================================================================

// Expo's WinterCG layer swaps TextDecoder, URL, structuredClone and fetch for getters that require their polyfills on
// first use, which Jest 30 refuses once setup has finished. Node already has all of them, so the layer is left out
jest.mock('expo/src/winter', () => ({}));

// Expo's generated mocks of its native modules, from jest-expo's setup rather than its preset: the preset would replace
// this project's Jest 30 transform with its own Jest 29 one
require('jest-expo/src/preset/setup.js');

// Reanimated's mock loads Reanimated's own entry for its constants. That entry starts the worklets runtime and
// registers native CSS event handling, which the JavaScript implementation Reanimated picks under Jest throws on
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('./node_modules/react-native-reanimated/src/initializers', () => ({ initializeReanimatedModule: () => {} }));

// The native libraries' own published Jest mocks, so a rendered component runs against what each library says its
// JavaScript surface does rather than a stand-in written here
// The published mock builds a new shared value on every render, where the real hook keeps one for the component's
// life. Left as it is, every effect that depends on a shared value re-runs on every render, and a first-evaluation
// snap never ends, so "settled on the first frame, animated on a change" could not be tested at all
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  const { useState } = require('react');
  // The mock's own version calls no React hook: it builds a plain value, which this keeps for the component's life
  const createSharedValue = Reanimated.useSharedValue;
  const useSharedValue = (initialValue) => useState(() => createSharedValue(initialValue))[0];
  return { ...Reanimated, __esModule: Reanimated.__esModule, useSharedValue };
});
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
require('react-native-gesture-handler/jestSetup');

// expo-haptics calls a generated native mock that a test cannot read, so its calls are jest functions here, with its
// real enums, and a suite checks a haptic with `expect(Haptics.impactAsync).toHaveBeenCalledWith(...)`
jest.mock('expo-haptics', () => ({
  ...jest.requireActual('expo-haptics'),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
}));

// expo-audio patches its native AudioPlayer class as it loads and ships no Jest mock, and jest-expo's generated native
// mocks have no classes. These are the three calls the app makes, with the player fields it reads. Every render gets
// the same player, so a suite testing a change of preview must hand out a player with a new id per source, as the
// real hook does
jest.mock('expo-audio', () => {
  const player = { id: 'player', play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(() => Promise.resolve()) };
  const status = { id: player.id, playing: false, currentTime: 0, duration: 0 };
  return {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    useAudioPlayer: jest.fn(() => player),
    useAudioPlayerStatus: jest.fn(() => status),
  };
});

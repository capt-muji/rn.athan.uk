// Mock for react-native-mmkv with in-memory storage.
//
// Why this is hand-rolled and not the library's own mock: react-native-mmkv
// 4.3.2 does ship a faithful self-mock (createMMKV() returns createMockMMKV()
// whenever isTest() sees JEST_WORKER_ID), but it is unreachable from this
// suite. The package's main entry is lib/index.js, which is ESM, while
// jest.config.js transforms only ^.+\.tsx?$ and transformIgnorePatterns
// defaults to /node_modules/ — so requiring the real package fails with
// "Must use import to load ES Module". Verified by removing this file and
// running the suite. Deleting it therefore breaks every storage test rather
// than upgrading them, so it stays and is instead kept honest against the
// real v4 surface.
//
// Only the methods the app actually calls are mocked (getString, set, remove,
// getAllKeys) plus the read-side and bookkeeping helpers that v4 really has.
// Nothing here may exist unless react-native-mmkv 4.3.2 has it: a mocked
// method the device does not have passes every test and then throws in the
// user's hand, on an alarm clock.
const createStorage = () => {
  const storage: Record<string, string | number | boolean> = {};

  return {
    getString: (key: string) => {
      const value = storage[key];
      return typeof value === 'string' ? value : undefined;
    },
    getNumber: (key: string) => {
      const value = storage[key];
      return typeof value === 'number' ? value : undefined;
    },
    getBoolean: (key: string) => {
      const value = storage[key];
      return typeof value === 'boolean' ? value : undefined;
    },
    set: (key: string, value: string | number | boolean) => {
      // The real v4 set() rejects an empty key; a mock that accepts one hides
      // a caller that would throw on device
      if (key === '') throw new Error('Cannot set a value for an empty key!');
      storage[key] = value;
    },
    remove: (key: string) => {
      delete storage[key];
    },
    contains: (key: string) => key in storage,
    clearAll: () => {
      Object.keys(storage).forEach((key) => {
        delete storage[key];
      });
    },
    getAllKeys: () => Object.keys(storage),
  };
};

export const createMMKV = createStorage;
export const MMKV = createStorage;

// Mock for react-native-mmkv
export const createMMKV = () => ({
  getString: () => undefined,
  setString: () => {},
  getNumber: () => undefined,
  setNumber: () => {},
  getBoolean: () => undefined,
  setBoolean: () => {},
  delete: () => {},
  contains: () => false,
  clearAll: () => {},
  getAllKeys: () => [],
});

export const MMKV = createMMKV;

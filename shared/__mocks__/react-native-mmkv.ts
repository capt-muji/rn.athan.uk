// Mock for react-native-mmkv with in-memory storage
const createStorage = () => {
  const storage: Record<string, string | number | boolean> = {};

  return {
    getString: (key: string) => {
      const value = storage[key];
      return typeof value === 'string' ? value : undefined;
    },
    setString: (key: string, value: string) => {
      storage[key] = value;
    },
    getNumber: (key: string) => {
      const value = storage[key];
      return typeof value === 'number' ? value : undefined;
    },
    setNumber: (key: string, value: number) => {
      storage[key] = value;
    },
    getBoolean: (key: string) => {
      const value = storage[key];
      return typeof value === 'boolean' ? value : undefined;
    },
    setBoolean: (key: string, value: boolean) => {
      storage[key] = value;
    },
    set: (key: string, value: string | number | boolean) => {
      storage[key] = value;
    },
    delete: (key: string) => {
      delete storage[key];
    },
    remove: (key: string) => {
      delete storage[key];
    },
    contains: (key: string) => key in storage,
    clearAll: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
    getAllKeys: () => Object.keys(storage),
  };
};

export const createMMKV = createStorage;
export const MMKV = createStorage;

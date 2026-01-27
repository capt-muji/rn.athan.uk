/**
 * Unit tests for stores/storage.ts
 *
 * Tests the Jotai atom factories that provide MMKV persistence:
 * - atomWithStorageNumber
 * - atomWithStorageBoolean
 * - atomWithStorageString
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockDatabase = {
  getString: jest.fn(),
  getBoolean: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
};

jest.mock('@/stores/database', () => ({
  database: mockDatabase,
}));

// Mock Jotai's atomWithStorage to capture the storage interface
const mockAtomWithStorage = jest.fn();

jest.mock('jotai/utils', () => ({
  atomWithStorage: (...args: unknown[]) => mockAtomWithStorage(...args),
}));

// Import after mocks
import { atomWithStorageNumber, atomWithStorageBoolean, atomWithStorageString } from '../storage';

// =============================================================================
// RESET MOCKS
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockAtomWithStorage.mockReturnValue({ type: 'atom' });
});

// =============================================================================
// atomWithStorageNumber TESTS
// =============================================================================

describe('atomWithStorageNumber', () => {
  it('creates atom with correct key and initial value', () => {
    atomWithStorageNumber('test_key', 42);

    expect(mockAtomWithStorage).toHaveBeenCalledWith(
      'test_key',
      42,
      expect.any(Object),
      expect.objectContaining({ getOnInit: true })
    );
  });

  it('returns atom from atomWithStorage', () => {
    const result = atomWithStorageNumber('test_key', 0);

    expect(result).toEqual({ type: 'atom' });
  });

  describe('storage interface', () => {
    let storageInterface: {
      getItem: (key: string, initialValue: number) => number;
      setItem: (key: string, value: number) => void;
      removeItem: (key: string) => void;
    };

    beforeEach(() => {
      atomWithStorageNumber('test_key', 0);
      storageInterface = mockAtomWithStorage.mock.calls[0][2];
    });

    it('getItem returns initialValue when key not found', () => {
      mockDatabase.getString.mockReturnValue(undefined);

      const result = storageInterface.getItem('test_key', 100);

      expect(result).toBe(100);
    });

    it('getItem returns parsed number when key exists', () => {
      mockDatabase.getString.mockReturnValue('42');

      const result = storageInterface.getItem('test_key', 0);

      expect(result).toBe(42);
    });

    it('getItem handles float values', () => {
      mockDatabase.getString.mockReturnValue('3.14');

      const result = storageInterface.getItem('test_key', 0);

      expect(result).toBe(3.14);
    });

    it('getItem handles negative values', () => {
      mockDatabase.getString.mockReturnValue('-5');

      const result = storageInterface.getItem('test_key', 0);

      expect(result).toBe(-5);
    });

    it('setItem stores value as string', () => {
      storageInterface.setItem('test_key', 42);

      expect(mockDatabase.set).toHaveBeenCalledWith('test_key', '42');
    });

    it('removeItem calls database remove', () => {
      storageInterface.removeItem('test_key');

      expect(mockDatabase.remove).toHaveBeenCalledWith('test_key');
    });
  });
});

// =============================================================================
// atomWithStorageBoolean TESTS
// =============================================================================

describe('atomWithStorageBoolean', () => {
  it('creates atom with correct key and initial value', () => {
    atomWithStorageBoolean('bool_key', false);

    expect(mockAtomWithStorage).toHaveBeenCalledWith(
      'bool_key',
      false,
      expect.any(Object),
      expect.objectContaining({ getOnInit: true })
    );
  });

  describe('storage interface', () => {
    let storageInterface: {
      getItem: (key: string, initialValue: boolean) => boolean;
      setItem: (key: string, value: boolean) => void;
      removeItem: (key: string) => void;
    };

    beforeEach(() => {
      atomWithStorageBoolean('bool_key', false);
      storageInterface = mockAtomWithStorage.mock.calls[0][2];
    });

    it('getItem returns initialValue when key not found', () => {
      mockDatabase.getBoolean.mockReturnValue(undefined);

      const result = storageInterface.getItem('bool_key', true);

      expect(result).toBe(true);
    });

    it('getItem returns stored boolean when key exists', () => {
      mockDatabase.getBoolean.mockReturnValue(true);

      const result = storageInterface.getItem('bool_key', false);

      expect(result).toBe(true);
    });

    it('getItem returns false correctly', () => {
      mockDatabase.getBoolean.mockReturnValue(false);

      const result = storageInterface.getItem('bool_key', true);

      expect(result).toBe(false);
    });

    it('setItem stores boolean value', () => {
      storageInterface.setItem('bool_key', true);

      expect(mockDatabase.set).toHaveBeenCalledWith('bool_key', true);
    });

    it('removeItem calls database remove', () => {
      storageInterface.removeItem('bool_key');

      expect(mockDatabase.remove).toHaveBeenCalledWith('bool_key');
    });
  });
});

// =============================================================================
// atomWithStorageString TESTS
// =============================================================================

describe('atomWithStorageString', () => {
  it('creates atom with correct key and initial value', () => {
    atomWithStorageString('str_key', 'default');

    expect(mockAtomWithStorage).toHaveBeenCalledWith(
      'str_key',
      'default',
      expect.any(Object),
      expect.objectContaining({ getOnInit: true })
    );
  });

  describe('storage interface', () => {
    let storageInterface: {
      getItem: (key: string, initialValue: string) => string;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };

    beforeEach(() => {
      atomWithStorageString('str_key', '');
      storageInterface = mockAtomWithStorage.mock.calls[0][2];
    });

    it('getItem returns initialValue when key not found', () => {
      mockDatabase.getString.mockReturnValue(undefined);

      const result = storageInterface.getItem('str_key', 'default');

      expect(result).toBe('default');
    });

    it('getItem returns stored string when key exists', () => {
      mockDatabase.getString.mockReturnValue('stored_value');

      const result = storageInterface.getItem('str_key', 'default');

      expect(result).toBe('stored_value');
    });

    it('getItem handles empty string', () => {
      mockDatabase.getString.mockReturnValue('');

      const result = storageInterface.getItem('str_key', 'default');

      expect(result).toBe('');
    });

    it('setItem stores string value', () => {
      storageInterface.setItem('str_key', 'test_value');

      expect(mockDatabase.set).toHaveBeenCalledWith('str_key', 'test_value');
    });

    it('removeItem calls database remove', () => {
      storageInterface.removeItem('str_key');

      expect(mockDatabase.remove).toHaveBeenCalledWith('str_key');
    });
  });
});

// =============================================================================
// COMMON OPTIONS TESTS
// =============================================================================

describe('common options', () => {
  it('all atom factories use getOnInit: true', () => {
    atomWithStorageNumber('num', 0);
    atomWithStorageBoolean('bool', false);
    atomWithStorageString('str', '');

    expect(mockAtomWithStorage).toHaveBeenCalledTimes(3);

    mockAtomWithStorage.mock.calls.forEach((call) => {
      expect(call[3]).toEqual({ getOnInit: true });
    });
  });
});

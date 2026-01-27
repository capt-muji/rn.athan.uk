/**
 * Unit tests for shared/logger.ts
 *
 * Tests the application logger including:
 * - Logging level methods (info, warn, error, debug)
 * - Object vs primitive data formatting
 * - Environment-based logging control
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockPinoLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('pino', () => {
  return jest.fn(() => mockPinoLogger);
});

// Mock config functions
const mockIsProd = jest.fn();
const mockIsPreview = jest.fn();
const mockIsTest = jest.fn();

jest.mock('@/shared/config', () => ({
  isProd: () => mockIsProd(),
  isPreview: () => mockIsPreview(),
  isTest: () => mockIsTest(),
}));

// =============================================================================
// RESET MOCKS
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockIsProd.mockReturnValue(false);
  mockIsPreview.mockReturnValue(false);
  mockIsTest.mockReturnValue(true);
});

// =============================================================================
// LOGGER METHOD TESTS
// =============================================================================

describe('logger', () => {
  // Need to require after mocks are set up
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('../logger').default;

  describe('info', () => {
    it('logs message without data', () => {
      logger.info('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith('Test message');
    });

    it('logs message with object data', () => {
      logger.info('Test message', { key: 'value' });

      expect(mockPinoLogger.info).toHaveBeenCalledWith({ key: 'value' }, 'Test message');
    });

    it('logs message with primitive data using fallback key', () => {
      logger.info('Test message', 42);

      expect(mockPinoLogger.info).toHaveBeenCalledWith({ data: 42 }, 'Test message');
    });

    it('logs message with string data using fallback key', () => {
      logger.info('Test message', 'string data');

      expect(mockPinoLogger.info).toHaveBeenCalledWith({ data: 'string data' }, 'Test message');
    });

    it('logs message with null data as object', () => {
      logger.info('Test message', null);

      expect(mockPinoLogger.info).toHaveBeenCalledWith({ data: null }, 'Test message');
    });

    it('logs message with array data as object', () => {
      logger.info('Test message', [1, 2, 3]);

      expect(mockPinoLogger.info).toHaveBeenCalledWith([1, 2, 3], 'Test message');
    });
  });

  describe('warn', () => {
    it('logs message without data', () => {
      logger.warn('Warning message');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith('Warning message');
    });

    it('logs message with object data', () => {
      logger.warn('Warning message', { warning: true });

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({ warning: true }, 'Warning message');
    });

    it('logs message with primitive data', () => {
      logger.warn('Warning message', 'reason');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({ data: 'reason' }, 'Warning message');
    });
  });

  describe('error', () => {
    it('logs message without data', () => {
      logger.error('Error message');

      expect(mockPinoLogger.error).toHaveBeenCalledWith('Error message');
    });

    it('logs message with error object', () => {
      const error = new Error('Test error');
      logger.error('Error message', error);

      expect(mockPinoLogger.error).toHaveBeenCalledWith(error, 'Error message');
    });

    it('logs message with error details object', () => {
      logger.error('Error message', { code: 500, details: 'Server error' });

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ code: 500, details: 'Server error' }, 'Error message');
    });

    it('logs message with primitive error using fallback key', () => {
      logger.error('Error message', 'error string');

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ error: 'error string' }, 'Error message');
    });
  });

  describe('debug', () => {
    it('logs message without data', () => {
      logger.debug('Debug message');

      expect(mockPinoLogger.debug).toHaveBeenCalledWith('Debug message');
    });

    it('logs message with debug data', () => {
      logger.debug('Debug message', { state: 'active' });

      expect(mockPinoLogger.debug).toHaveBeenCalledWith({ state: 'active' }, 'Debug message');
    });
  });
});


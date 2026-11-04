/**
 * Mock logger for testing
 * Provides silent no-op implementations of all logger methods
 */

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export default logger;

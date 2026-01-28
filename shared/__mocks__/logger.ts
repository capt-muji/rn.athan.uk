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

// Re-export config functions as mocks
export const isProd = jest.fn().mockReturnValue(false);
export const isPreview = jest.fn().mockReturnValue(false);
export const isTest = jest.fn().mockReturnValue(true);

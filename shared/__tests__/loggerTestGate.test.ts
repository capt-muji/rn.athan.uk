/**
 * The test-run half of the logging gate in shared/logger.ts
 *
 * A jest run logs nothing unless DEBUG_TESTS is set (`yarn test:debug`), and DEBUG_TESTS cannot switch
 * logging on in a production or preview build. logger.test.ts forces isTest() false to reach the
 * production gate, so this half is loaded here with isTest() true.
 */

const mockIsProd = jest.fn();
const mockIsPreview = jest.fn();
const mockIsTest = jest.fn();

jest.mock('pino', () => jest.fn(() => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() })));

jest.mock('@/shared/config', () => ({
  isProd: () => mockIsProd(),
  isPreview: () => mockIsPreview(),
  isTest: () => mockIsTest(),
}));

const originalDebugTests = process.env.DEBUG_TESTS;

afterEach(() => {
  if (originalDebugTests === undefined) delete process.env.DEBUG_TESTS;
  else process.env.DEBUG_TESTS = originalDebugTests;
});

/**
 * `enabled` is fixed when pino is constructed at module load, so each case loads the logger into a
 * fresh registry and reads the options that load passed to pino
 */
const pinoEnabledOnFreshLoad = (): boolean => {
  const holder: { enabled?: boolean } = {};

  jest.isolateModules(() => {
    const pinoMock = require('pino') as jest.Mock;
    require('../logger');
    holder.enabled = (pinoMock.mock.calls[0][0] as { enabled: boolean }).enabled;
  });

  return holder.enabled as boolean;
};

describe('logging gate in a jest run', () => {
  it.each([
    { label: 'a plain jest run', prod: false, preview: false, debugTests: undefined, enabled: false },
    { label: 'yarn test:debug', prod: false, preview: false, debugTests: '1', enabled: true },
    { label: 'DEBUG_TESTS in a production build', prod: true, preview: false, debugTests: '1', enabled: false },
    { label: 'DEBUG_TESTS in a preview build', prod: false, preview: true, debugTests: '1', enabled: false },
  ])('gives pino enabled=$enabled for $label', ({ prod, preview, debugTests, enabled }) => {
    mockIsTest.mockReturnValue(true);
    mockIsProd.mockReturnValue(prod);
    mockIsPreview.mockReturnValue(preview);
    if (debugTests === undefined) delete process.env.DEBUG_TESTS;
    else process.env.DEBUG_TESTS = debugTests;

    expect(pinoEnabledOnFreshLoad()).toBe(enabled);
  });
});

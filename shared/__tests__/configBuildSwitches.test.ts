/**
 * The switches in shared/config.ts that config.test.ts does not reach
 *
 * - isTest(): the logger keeps a jest run silent on it, so it must be true under jest and false for
 *   every other NODE_ENV, including none at all
 * - whatsNewPreview and bgDebug: a debug path turns on only for the exact string '1', so a '0', a
 *   typo or an empty value left in an .env keeps it off
 */

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

const loadConfig = () => require('../config') as typeof import('../config');

/** Assigning undefined to process.env stores the string "undefined", so an unset variable is deleted */
const setVariable = (name: string, value: string | undefined) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

// =============================================================================
// isTest()
// =============================================================================

describe('isTest', () => {
  it('is true when NODE_ENV is test', () => {
    setVariable('NODE_ENV', 'test');

    expect(loadConfig().isTest()).toBe(true);
  });

  it.each([undefined, 'production', 'development', 'Test', ''])('is false when NODE_ENV is %p', (value) => {
    setVariable('NODE_ENV', value);

    expect(loadConfig().isTest()).toBe(false);
  });
});

// =============================================================================
// EXACT-'1' BUILD SWITCHES
// =============================================================================

describe.each([
  { key: 'whatsNewPreview', variable: 'EXPO_PUBLIC_WHATS_NEW_PREVIEW' },
  { key: 'bgDebug', variable: 'EXPO_PUBLIC_BG_DEBUG' },
] as const)('APP_CONFIG.$key', ({ key, variable }) => {
  it(`is on when ${variable} is exactly 1`, () => {
    setVariable(variable, '1');

    expect(loadConfig().APP_CONFIG[key]).toBe(true);
  });

  it.each([undefined, '0', '', 'true', 'yes', ' 1', '01'])(`is off when ${variable} is %p`, (value) => {
    setVariable(variable, value);

    expect(loadConfig().APP_CONFIG[key]).toBe(false);
  });
});

/**
 * Pins the ambient flag state every suite inherits to the SHIPPED value
 *
 * `jest.setup.js` used to set `EXPO_PUBLIC_WIDGETS = '1'` for all of
 * `setupFiles`, so the entire suite ran with widgets enabled — the opposite of
 * what ships. The widget-push early returns real users actually hit were
 * covered by one suite while every other suite exercised a code path no user
 * has. `shared/flags.ts` states its own fail direction as "mistakes disable,
 * never enable"; the harness inverted it.
 *
 * `flags.test.ts` covers the parsing rules by setting the variable itself.
 * This suite covers the thing that file cannot: what a suite inherits when it
 * sets nothing. The ambient value is captured at module scope — the moment
 * after `setupFiles` has run and before any test body can mutate it — so the
 * assertion is independent of test ordering.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Read once, at file evaluation, so no test body can have touched it yet */
const AMBIENT_WIDGETS = process.env.EXPO_PUBLIC_WIDGETS;

const ROOT = join(__dirname, '..', '..');

/** Suites that genuinely need the enabled path, and must therefore opt in */
const OPT_IN_SUITES = ['stores/__tests__/widgetIo.test.ts', 'stores/__tests__/widgetSettingsSync.test.ts'];

const loadFlagsFresh = () => {
  const holder: { flags?: typeof import('../flags') } = {};
  jest.isolateModules(() => {
    holder.flags = require('../flags');
  });
  return holder.flags as typeof import('../flags');
};

// =============================================================================
// THE INHERITED DEFAULT
// =============================================================================

describe('the ambient test environment', () => {
  it('leaves EXPO_PUBLIC_WIDGETS unset, as a release build does', () => {
    expect(AMBIENT_WIDGETS).toBeUndefined();
  });

  it('resolves FEATURE_FLAGS.widgets false without any opt-in', () => {
    expect(loadFlagsFresh().FEATURE_FLAGS.widgets).toBe(false);
  });

  it('is produced by a delete, not an assignment, so nothing leaks between files', () => {
    const setup = readFileSync(join(ROOT, 'jest.setup.js'), 'utf8');

    expect(setup).toContain('delete process.env.EXPO_PUBLIC_WIDGETS');
    expect(setup).not.toMatch(/process\.env\.EXPO_PUBLIC_WIDGETS\s*=/);
  });
});

// =============================================================================
// THE ENABLED-PATH SUITES OPT IN, AND DO IT THE ONLY WAY THAT WORKS
// =============================================================================

describe.each(OPT_IN_SUITES)('%s', (relativePath) => {
  const source = () => readFileSync(join(ROOT, relativePath), 'utf8');

  it('opts into the enabled widget path by mocking the flags module', () => {
    expect(source()).toContain("jest.mock('@/shared/flags', () => ({ FEATURE_FLAGS: { widgets: true } }));");
  });

  it('hoists the opt-in above its first import, or it would run too late', () => {
    const text = source();

    expect(text.indexOf("jest.mock('@/shared/flags'")).toBeLessThan(text.indexOf('\nimport '));
  });

  it('does not try to opt in through the environment, which cannot work', () => {
    // An assignment in the file body runs after the hoisted imports have
    // already evaluated flags.ts, so it would silently do nothing
    expect(source()).not.toMatch(/process\.env\.EXPO_PUBLIC_WIDGETS\s*=/);
  });
});

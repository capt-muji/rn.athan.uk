/**
 * Pins the logger's packages to the right half of package.json
 *
 * `shared/logger.ts` imports `pino` at module scope and 21 app modules import
 * the logger, so pino is in the production bundle on every build. It was
 * declared under `devDependencies`, which means any install that omits dev
 * dependencies leaves the Metro bundle unresolvable. It worked only because
 * EAS Build happens to install them.
 *
 * `pino-pretty` is the deliberate exception and stays a dev dependency: it is
 * named only as a transport target string, never imported. Metro's
 * `resolverMainFields` prefers `react-native` then `browser`, pino ships
 * `browser: "./browser.js"` with no `exports` field, and `pino/browser.js`
 * has no transport handling at all — so the transport block is inert on a
 * phone and pino-pretty is never bundled. Promoting it would ship a package
 * no build can reach.
 *
 * These tests derive the requirement from the source rather than restating it,
 * so a future runtime import added to the logger has to be declared too.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

type Manifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

const manifest = (): Manifest => JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/**
 * Bare package specifiers `shared/logger.ts` imports at runtime, reduced to the
 * package name: `@scope/name` keeps two segments, everything else keeps one,
 * so a subpath import like `jotai/utils` resolves to its declared package.
 */
const loggerRuntimePackages = (): string[] => {
  const source = readFileSync(join(ROOT, 'shared', 'logger.ts'), 'utf8');
  const specifiers = [...source.matchAll(/^import\s+[^;]*?from\s+'([^']+)'/gm)].map((match) => match[1]);

  return [
    ...new Set(
      specifiers
        .filter(
          (specifier) => !specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.startsWith('node:')
        )
        .map((specifier) =>
          specifier
            .split('/')
            .slice(0, specifier.startsWith('@') ? 2 : 1)
            .join('/')
        )
    ),
  ];
};

// =============================================================================
// THE LOGGER'S IMPORTS SHIP
// =============================================================================

describe('shared/logger.ts runtime imports', () => {
  it('imports at least one bare package, or this suite guards nothing', () => {
    expect(loggerRuntimePackages().length).toBeGreaterThan(0);
  });

  it('declares every one of them under dependencies', () => {
    const { dependencies, devDependencies } = manifest();

    for (const name of loggerRuntimePackages()) {
      expect(Object.keys(dependencies)).toContain(name);
      expect(Object.keys(devDependencies)).not.toContain(name);
    }
  });

  it('still imports pino, the package the finding is about', () => {
    expect(loggerRuntimePackages()).toContain('pino');
  });
});

// =============================================================================
// pino-pretty IS NEVER BUNDLED, SO IT STAYS A DEV DEPENDENCY
// =============================================================================

describe('pino-pretty', () => {
  it('is named only as a transport target, never imported', () => {
    const source = readFileSync(join(ROOT, 'shared', 'logger.ts'), 'utf8');

    expect(source).toContain("target: 'pino-pretty'");
    expect(loggerRuntimePackages()).not.toContain('pino-pretty');
  });

  it('stays under devDependencies', () => {
    const { dependencies, devDependencies } = manifest();

    expect(Object.keys(devDependencies)).toContain('pino-pretty');
    expect(Object.keys(dependencies)).not.toContain('pino-pretty');
  });
});

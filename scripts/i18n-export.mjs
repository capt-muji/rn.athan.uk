/**
 * The translation pipeline's export entry point: writes shared/i18n/dist/en.json through
 * the bridge test runner (the one mechanism, ARCH-14/A3). Same command as `yarn i18n:export`.
 */

import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'npx',
  ['jest', 'shared/__tests__/i18nBridge.test.ts', '--watchman=false', '--selectProjects=unit'],
  { stdio: 'inherit', env: { ...process.env, I18N_BRIDGE: 'export' } }
);

process.exit(result.status ?? 1);

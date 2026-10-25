/**
 * The translation pipeline's import entry point: reads shared/i18n/dist/<locale>.json and
 * asserts round-trip identity through the bridge test runner (ARCH-14/A3). The locale
 * defaults to en; set I18N_LOCALE to check another file. Same command as `yarn i18n:import`.
 */

import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'npx',
  ['jest', 'shared/__tests__/i18nBridge.test.ts', '--watchman=false', '--selectProjects=unit'],
  { stdio: 'inherit', env: { ...process.env, I18N_BRIDGE: 'import' } }
);

process.exit(result.status ?? 1);

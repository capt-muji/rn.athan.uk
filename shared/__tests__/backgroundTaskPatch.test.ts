/**
 * The patch that lets the daily background task run on an offline phone
 * (patches/expo-background-task+58.0.11.patch)
 *
 * `stores/notifications.ts` registers the task with `requiresNetworkConnectivity: false`, so the
 * window rolls without a network. Nothing else in the repository fails if the patch stops applying:
 * the option is silently ignored and the scheduler withholds the task on an offline phone
 * (ISSUES #37). These tests are what notice.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PKG = join(__dirname, '..', '..', 'node_modules', 'expo-background-task');

const KOTLIN = join(
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'backgroundtask',
  'BackgroundTaskScheduler.kt'
);
const SWIFT = join('ios', 'BackgroundTaskScheduler.swift');
const TYPES_SRC = join('src', 'BackgroundTask.types.ts');
const TYPES_BUILD = join('build', 'BackgroundTask.types.d.ts');

/** The installed package is the tree the patch produced, so it is read in place */
const read = (relative: string): string => readFileSync(join(PKG, relative), 'utf8');

/** Every file in the package holding a fixed string, empty when there is none */
const scan = (needle: string): string => {
  try {
    return execFileSync('grep', ['-r', '-F', '-l', needle, PKG], { encoding: 'utf8' });
  } catch (error) {
    const failure = error as { stdout?: string; status?: number };

    // grep exits 1 when it matched nothing, which is the clean package the last case wants
    if (failure.status === 1) return '';

    throw error;
  }
};

describe('the background-task offline patch', () => {
  it('declares the offline option in both TypeScript surfaces', () => {
    expect(read(TYPES_SRC)).toContain('requiresNetworkConnectivity?: boolean;');
    expect(read(TYPES_BUILD)).toContain('requiresNetworkConnectivity?: boolean;');
  });

  it('drops the network constraint when the task does not need one', () => {
    const constraint = 'if (requiresNetworkConnectivity) NetworkType.CONNECTED else NetworkType.NOT_REQUIRED';

    expect(read(KOTLIN)).toContain(constraint);
  });

  it('passes the option through to the iOS processing request', () => {
    expect(read(SWIFT)).toContain('request.requiresNetworkConnectivity = requiresNetworkConnectivity');
  });

  it('carries no test-only registration entry point', () => {
    expect(scan('didRegisterTaskForTesting')).toBe('');
  });

  it('removes the publication block so Gradle compiles the patched Kotlin', () => {
    expect(read('expo-module.config.json')).not.toContain('"publication"');
  });
});

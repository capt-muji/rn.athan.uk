/**
 * The CJK glyph lock (plan T-419 decision 8, grown by T-452): the bundled CJK subsets
 * (the zh pair, ja and ko) are cut over a
 * closed string set - every character of each CJK catalog, its native-strings row,
 * its widget-statics row, its endonym, and the What's New keys that resolve through
 * the catalog - and this gate recomputes that set from the committed files and diffs
 * it against the lock generated from the subsets' own cmaps. A catalog byte the
 * subsets miss fails here naming the character, and a byte the strings dropped
 * leaves a stale lock character named the same way, so the subsets and the strings
 * cannot drift apart silently. Regenerate with the command in the lock's _comment.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import lock from '@/shared/i18n/cjk-glyph-lock.json';
import { ja } from '@/shared/i18n/ja';
import { ko } from '@/shared/i18n/ko';
import { zhHans } from '@/shared/i18n/zh-Hans';
import { zhHant } from '@/shared/i18n/zh-Hant';
import { nativeLanguageName } from '@/shared/languageNames';

const NATIVE = JSON.parse(readFileSync(join(__dirname, '..', 'i18n', 'native-strings.json'), 'utf8')) as Record<
  string,
  {
    NSLocationWhenInUseUsageDescription: string;
    NSUserNotificationsUsageDescription: string;
    gallery: Record<string, string>;
  }
>;
const STATICS = JSON.parse(readFileSync(join(__dirname, '..', 'i18n', 'widget-statics.json'), 'utf8')) as Record<
  string,
  Record<string, string>
>;

const CATALOGS = { 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja, ko } as const;
type CjkLocale = keyof typeof CATALOGS;

/**
 * The closed string set's every character, newline excepted (no cmap maps it): the
 * exact list decision 8 pins, so the gate and the generator read the same set
 */
const closedChars = (locale: CjkLocale): Set<string> => {
  const strings = [
    ...Object.values(CATALOGS[locale]),
    NATIVE[locale].NSLocationWhenInUseUsageDescription,
    NATIVE[locale].NSUserNotificationsUsageDescription,
    ...Object.values(NATIVE[locale].gallery),
    ...Object.values(STATICS[locale]),
    nativeLanguageName(locale),
  ];
  return new Set(
    strings
      .join('')
      .split('')
      .filter((ch) => ch !== '\n')
  );
};

const codepointOf = (ch: string): string => `U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`;

describe('the CJK glyph lock', () => {
  it.each(['zh-Hans', 'zh-Hant', 'ja', 'ko'] as const)(
    '%s locks every character its closed string set carries',
    (locale) => {
      const locked = new Set(lock[locale].split(''));
      const failures: string[] = [];
      for (const ch of closedChars(locale)) {
        if (!locked.has(ch)) {
          failures.push(`${locale}: the lock lacks ${ch} ${codepointOf(ch)} - regenerate the subsets (lock _comment)`);
        }
      }
      expect(failures).toEqual([]);
    }
  );

  it.each(['zh-Hans', 'zh-Hant', 'ja', 'ko'] as const)('%s keeps no character the strings have dropped', (locale) => {
    const closed = closedChars(locale);
    const failures: string[] = [];
    for (const ch of lock[locale].split('')) {
      if (!closed.has(ch)) {
        failures.push(
          `${locale}: the lock still carries ${ch} ${codepointOf(ch)} the strings dropped - regenerate the subsets (lock _comment)`
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it('carries the regenerating command in its header, the machine-read JSON pattern', () => {
    expect(lock._comment).toContain('node scripts/cjk-subset.mjs');
  });

  it('binds the committed subset binaries to the lock by sha256', () => {
    // The cmap rows above tie the lock to the strings, not to the files: a
    // re-cut shipping stale binaries would pass every glyph row while zh
    // renders tofu. The hashes close that hole - regenerate covers them.
    const files = (lock as { files?: Record<string, string> }).files ?? {};
    const names = Object.keys(files);
    expect(names).not.toEqual([]);
    for (const name of names) {
      const digest = createHash('sha256')
        .update(readFileSync(join(__dirname, '..', '..', 'assets', 'fonts', name)))
        .digest('hex');
      expect(`${name}: ${digest}`).toBe(`${name}: ${files[name]}`);
    }
  });
});

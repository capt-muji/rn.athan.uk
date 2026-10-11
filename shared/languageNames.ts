/**
 * The D26 picker names: each language in its own name, sorted by codepoint,
 * so a reader scans for the name they know rather than an English gloss.
 * Latin before Arabic before Devanagari before Thai. Names data, not copy:
 * the scanner's data-module rule allows this module's `name` field.
 */

import type { LocaleId } from '@/shared/i18n/locale';

export const LANGUAGE_NAMES: ReadonlyArray<{ id: LocaleId; name: string }> = [
  { id: 'ms', name: 'Bahasa Melayu' },
  { id: 'en', name: 'English' },
  { id: 'so', name: 'Soomaali' },
  { id: 'ar', name: 'العربية' },
  { id: 'hi', name: 'हिन्दी' },
  { id: 'th', name: 'ไทย' },
];

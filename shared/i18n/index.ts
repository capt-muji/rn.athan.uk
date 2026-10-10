/**
 * The stage-one read surface: no locale, no fallback. A missing key is a compile error
 * (the parameter is the closed key union) and the parity test refuses an empty value.
 */

import type { PrayerId } from '@/shared/constants';

import type { TranslationKey } from './en';
import { currentCatalog, currentPrayerLabels } from './loader';

export type { TranslationKey } from './en';
export { en, PRAYER_LABELS } from './en';

/** The parameters a key's `{token}`s take; a key with no tokens takes none */
export type ParamsOf<K extends TranslationKey> = K extends 'notification.now'
  ? { name: string | number }
  : K extends 'notification.reminder'
    ? { name: string | number; n: number }
    : undefined;

const TOKEN = /\{(\w+)\}/g;

export const t = <K extends TranslationKey>(key: K, params?: ParamsOf<K>): string =>
  currentCatalog()[key].replace(TOKEN, (_match, token: string) => {
    const supplied = (params as Record<string, string | number> | undefined)?.[token];
    if (supplied === undefined) {
      throw new Error(`i18n: missing parameter '${token}' for key '${key}'`);
    }
    return String(supplied);
  });

export const prayerLabel = (id: PrayerId): string => currentPrayerLabels()[id];

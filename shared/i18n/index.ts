/**
 * The read surface: no fallback. A missing key is a compile error
 * (the parameter is the closed key union) and the parity test refuses an empty value.
 */

import type { PrayerId } from '@/shared/constants';
import { nativeLanguageName } from '@/shared/languageNames';

import type { Catalog, TranslationKey } from './en';
import { catalogFor, currentCatalog, currentPrayerLabels } from './loader';
import type { LocaleId } from './locale';

export type { TranslationKey } from './en';
export { en, PRAYER_LABELS } from './en';

/** The parameters a key's `{token}`s take; a key with no tokens takes none */
export type ParamsOf<K extends TranslationKey> = K extends 'notification.now'
  ? { name: string | number }
  : K extends 'notification.reminder' | 'channel.reminder'
    ? { name: string | number; n: number }
    : K extends 'stepper.value' | 'stepper.decrease' | 'stepper.increase'
      ? { value: number; unit: string }
      : K extends 'alert.reminder' | 'soundItem.athan' | 'channel.athan'
        ? { n: number }
        : K extends 'soundItem.preview' | 'soundItem.stopPreview'
          ? { name: string }
          : K extends 'countdown.progressA11y'
            ? { percent: number }
            : K extends 'whatsNew.platformNote'
              ? { platform: string }
              : K extends 'prayerAlert.notification'
                ? { name: string; state: string }
                : K extends 'time.now'
                  ? { name: string }
                  : K extends 'time.ago'
                    ? { name: string; duration: string }
                    : K extends 'language.changing'
                      ? { language: string }
                      : undefined;

const TOKEN = /\{(\w+)\}/g;

const compose = <K extends TranslationKey>(catalog: Catalog, key: K, params?: ParamsOf<K>): string =>
  catalog[key].replace(TOKEN, (_match, token: string) => {
    const supplied = (params as Record<string, string | number> | undefined)?.[token];
    if (supplied === undefined) {
      throw new Error(`i18n: missing parameter '${token}' for key '${key}'`);
    }
    const localized = String(supplied);
    return localized;
  });

export const t = <K extends TranslationKey>(key: K, params?: ParamsOf<K>): string =>
  compose(currentCatalog(), key, params);

/** The same read through a named locale's catalog: a surface about to switch speaks its target's words */
export const tIn = <K extends TranslationKey>(locale: LocaleId, key: K, params?: ParamsOf<K>): string =>
  compose(catalogFor(locale), key, params);

/** The line a language switch's face names the target language with: the loader's own composition, shared with the native cover */
export const languageChangingLine = (locale: LocaleId): string =>
  tIn(locale, 'language.changing', { language: nativeLanguageName(locale) });

export const prayerLabel = (id: PrayerId): string => currentPrayerLabels()[id];

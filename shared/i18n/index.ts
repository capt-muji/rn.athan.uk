/**
 * The stage-one read surface: no locale, no fallback. A missing key is a compile error
 * (the parameter is the closed key union) and the parity test refuses an empty value.
 */

import type { PrayerId } from '@/shared/constants';

import type { TranslationKey } from './en';
import { currentCatalog, currentPrayerLabels } from './loader';

export type { TranslationKey } from './en';
export { en, PRAYER_LABELS } from './en';

/** Stage one's only locale: the width keys and every locale-keyed surface carry it.
 * Row 39 makes it dynamic; the seed in stores/ui.ts reads it at module evaluation. */
export const CURRENT_LOCALE_ID = 'en';

/** The parameters a key's `{token}`s take; a key with no tokens takes none */
export type ParamsOf<K extends TranslationKey> = K extends 'notification.now'
  ? { name: string | number }
  : K extends 'notification.reminder'
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

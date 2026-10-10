/**
 * The stage-one read surface: no locale, no fallback. A missing key is a compile error
 * (the parameter is the closed key union) and the parity test refuses an empty value.
 */

import type { PrayerId } from '@/shared/constants';

import type { TranslationKey } from './en';
import { currentCatalog, currentPrayerLabels } from './loader';

export { en, PRAYER_LABELS } from './en';

export const t = (key: TranslationKey): string => currentCatalog()[key];

export const prayerLabel = (id: PrayerId): string => currentPrayerLabels()[id];

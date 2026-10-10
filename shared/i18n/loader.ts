/**
 * The loader indirection: the one module a locale switch or the JSON.parse experiment may
 * rewrite without touching a call site (R16, step 15's timing decision)
 */

import type { PrayerId } from '@/shared/constants';

import { type Catalog, en, PRAYER_LABELS } from './en';

export const currentCatalog = (): Catalog => en;

export const currentPrayerLabels = (): Record<PrayerId, string> => PRAYER_LABELS;

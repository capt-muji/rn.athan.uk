/**
 * The loader indirection: the one module a locale switch or the JSON.parse experiment may
 * rewrite without touching a call site (R16, step 15's timing decision)
 */

import type { PrayerId } from '@/shared/constants';
import { perfMark } from '@/shared/perf';

import type { Catalog } from './en';

// Brackets the catalog's one-time evaluation: pre-init the marks replay with
// true detail.at epochs, post-init the ring ts already is one - either way the
// require cost reads offline.
perfMark('catalog_require_start');
const catalogModule = require('./en') as typeof import('./en');
perfMark('catalog_require_end');

export const currentCatalog = (): Catalog => catalogModule.en;

export const currentPrayerLabels = (): Record<PrayerId, string> => catalogModule.PRAYER_LABELS;

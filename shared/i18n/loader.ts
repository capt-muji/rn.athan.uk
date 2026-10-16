/**
 * The loader indirection: the one module a locale switch or the JSON.parse experiment may
 * rewrite without touching a call site (R16, step 15's timing decision)
 */

import type { PrayerId } from '@/shared/constants';
import { perfMark } from '@/shared/perf';

import type { Catalog } from './en';
import { currentLocaleId, type LocaleId } from './locale';

// Brackets the catalogs' one-time evaluation: pre-init the marks replay with
// true detail.at epochs, post-init the ring ts already is one - either way the
// require cost reads offline.
perfMark('catalog_require_start');
const RAW = {
  en: require('./en') as typeof import('./en'),
  ar: require('./ar') as typeof import('./ar'),
  ms: require('./ms') as typeof import('./ms'),
  so: require('./so') as typeof import('./so'),
  hi: require('./hi') as typeof import('./hi'),
  th: require('./th') as typeof import('./th'),
} as const;
perfMark('catalog_require_end');

/** Every locale module normalised to one shape, so the lookups stay one-line calls */
interface CatalogModule {
  en: Catalog;
  PRAYER_LABELS: Record<PrayerId, string>;
}

// Each locale exports its catalog under its own name; the adapter reads that
// name into the shared `en` slot without copying the catalog
const MODULES: Record<LocaleId, CatalogModule> = {
  en: { en: RAW.en.en, PRAYER_LABELS: RAW.en.PRAYER_LABELS },
  ar: { en: RAW.ar.ar, PRAYER_LABELS: RAW.ar.PRAYER_LABELS },
  ms: { en: RAW.ms.ms, PRAYER_LABELS: RAW.ms.PRAYER_LABELS },
  so: { en: RAW.so.so, PRAYER_LABELS: RAW.so.PRAYER_LABELS },
  hi: { en: RAW.hi.hi, PRAYER_LABELS: RAW.hi.PRAYER_LABELS },
  th: { en: RAW.th.th, PRAYER_LABELS: RAW.th.PRAYER_LABELS },
};

export const currentCatalog = (): Catalog => MODULES[currentLocaleId()].en;

/** A named locale's catalog, so a surface can speak its target's words before the switch lands */
export const catalogFor = (locale: LocaleId): Catalog => MODULES[locale].en;

export const currentPrayerLabels = (): Record<PrayerId, string> => MODULES[currentLocaleId()].PRAYER_LABELS;

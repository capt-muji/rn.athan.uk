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
  id: require('./id') as typeof import('./id'),
  tr: require('./tr') as typeof import('./tr'),
  fr: require('./fr') as typeof import('./fr'),
  uz: require('./uz') as typeof import('./uz'),
  sw: require('./sw') as typeof import('./sw'),
  ha: require('./ha') as typeof import('./ha'),
  pt: require('./pt') as typeof import('./pt'),
  ur: require('./ur') as typeof import('./ur'),
  fa: require('./fa') as typeof import('./fa'),
  bn: require('./bn') as typeof import('./bn'),
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
  id: { en: RAW.id.id, PRAYER_LABELS: RAW.id.PRAYER_LABELS },
  tr: { en: RAW.tr.tr, PRAYER_LABELS: RAW.tr.PRAYER_LABELS },
  fr: { en: RAW.fr.fr, PRAYER_LABELS: RAW.fr.PRAYER_LABELS },
  uz: { en: RAW.uz.uz, PRAYER_LABELS: RAW.uz.PRAYER_LABELS },
  sw: { en: RAW.sw.sw, PRAYER_LABELS: RAW.sw.PRAYER_LABELS },
  ha: { en: RAW.ha.ha, PRAYER_LABELS: RAW.ha.PRAYER_LABELS },
  pt: { en: RAW.pt.pt, PRAYER_LABELS: RAW.pt.PRAYER_LABELS },
  ur: { en: RAW.ur.ur, PRAYER_LABELS: RAW.ur.PRAYER_LABELS },
  fa: { en: RAW.fa.fa, PRAYER_LABELS: RAW.fa.PRAYER_LABELS },
  bn: { en: RAW.bn.bn, PRAYER_LABELS: RAW.bn.PRAYER_LABELS },
};

export const currentCatalog = (): Catalog => MODULES[currentLocaleId()].en;

/** A named locale's catalog, so a surface can speak its target's words before the switch lands */
export const catalogFor = (locale: LocaleId): Catalog => MODULES[locale].en;

export const currentPrayerLabels = (): Record<PrayerId, string> => MODULES[currentLocaleId()].PRAYER_LABELS;

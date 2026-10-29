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
  ru: require('./ru') as typeof import('./ru'),
  az: require('./az') as typeof import('./az'),
  de: require('./de') as typeof import('./de'),
  sq: require('./sq') as typeof import('./sq'),
  bs: require('./bs') as typeof import('./bs'),
  ps: require('./ps') as typeof import('./ps'),
  ta: require('./ta') as typeof import('./ta'),
  ml: require('./ml') as typeof import('./ml'),
  'zh-Hans': require('./zh-Hans') as typeof import('./zh-Hans'),
  'zh-Hant': require('./zh-Hant') as typeof import('./zh-Hant'),
  es: require('./es') as typeof import('./es'),
  nl: require('./nl') as typeof import('./nl'),
  kk: require('./kk') as typeof import('./kk'),
  ky: require('./ky') as typeof import('./ky'),
  tg: require('./tg') as typeof import('./tg'),
  tk: require('./tk') as typeof import('./tk'),
  wo: require('./wo') as typeof import('./wo'),
  mr: require('./mr') as typeof import('./mr'),
  om: require('./om') as typeof import('./om'),
  bm: require('./bm') as typeof import('./bm'),
  tl: require('./tl') as typeof import('./tl'),
  ff: require('./ff') as typeof import('./ff'),
  te: require('./te') as typeof import('./te'),
  gu: require('./gu') as typeof import('./gu'),
  kn: require('./kn') as typeof import('./kn'),
  am: require('./am') as typeof import('./am'),
  'pa-Arab': require('./pa-Arab') as typeof import('./pa-Arab'),
  sd: require('./sd') as typeof import('./sd'),
  ug: require('./ug') as typeof import('./ug'),
  ckb: require('./ckb') as typeof import('./ckb'),
  ku: require('./ku') as typeof import('./ku'),
  yo: require('./yo') as typeof import('./yo'),
  jv: require('./jv') as typeof import('./jv'),
  su: require('./su') as typeof import('./su'),
  ja: require('./ja') as typeof import('./ja'),
  ko: require('./ko') as typeof import('./ko'),
  it: require('./it') as typeof import('./it'),
  pl: require('./pl') as typeof import('./pl'),
  ro: require('./ro') as typeof import('./ro'),
  ceb: require('./ceb') as typeof import('./ceb'),
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
  ru: { en: RAW.ru.ru, PRAYER_LABELS: RAW.ru.PRAYER_LABELS },
  az: { en: RAW.az.az, PRAYER_LABELS: RAW.az.PRAYER_LABELS },
  de: { en: RAW.de.de, PRAYER_LABELS: RAW.de.PRAYER_LABELS },
  sq: { en: RAW.sq.sq, PRAYER_LABELS: RAW.sq.PRAYER_LABELS },
  bs: { en: RAW.bs.bs, PRAYER_LABELS: RAW.bs.PRAYER_LABELS },
  ps: { en: RAW.ps.ps, PRAYER_LABELS: RAW.ps.PRAYER_LABELS },
  ta: { en: RAW.ta.ta, PRAYER_LABELS: RAW.ta.PRAYER_LABELS },
  ml: { en: RAW.ml.ml, PRAYER_LABELS: RAW.ml.PRAYER_LABELS },
  'zh-Hans': { en: RAW['zh-Hans'].zhHans, PRAYER_LABELS: RAW['zh-Hans'].PRAYER_LABELS },
  'zh-Hant': { en: RAW['zh-Hant'].zhHant, PRAYER_LABELS: RAW['zh-Hant'].PRAYER_LABELS },
  es: { en: RAW.es.es, PRAYER_LABELS: RAW.es.PRAYER_LABELS },
  nl: { en: RAW.nl.nl, PRAYER_LABELS: RAW.nl.PRAYER_LABELS },
  kk: { en: RAW.kk.kk, PRAYER_LABELS: RAW.kk.PRAYER_LABELS },
  ky: { en: RAW.ky.ky, PRAYER_LABELS: RAW.ky.PRAYER_LABELS },
  tg: { en: RAW.tg.tg, PRAYER_LABELS: RAW.tg.PRAYER_LABELS },
  tk: { en: RAW.tk.tk, PRAYER_LABELS: RAW.tk.PRAYER_LABELS },
  wo: { en: RAW.wo.wo, PRAYER_LABELS: RAW.wo.PRAYER_LABELS },
  mr: { en: RAW.mr.mr, PRAYER_LABELS: RAW.mr.PRAYER_LABELS },
  om: { en: RAW.om.om, PRAYER_LABELS: RAW.om.PRAYER_LABELS },
  bm: { en: RAW.bm.bm, PRAYER_LABELS: RAW.bm.PRAYER_LABELS },
  tl: { en: RAW.tl.tl, PRAYER_LABELS: RAW.tl.PRAYER_LABELS },
  ff: { en: RAW.ff.ff, PRAYER_LABELS: RAW.ff.PRAYER_LABELS },
  te: { en: RAW.te.te, PRAYER_LABELS: RAW.te.PRAYER_LABELS },
  gu: { en: RAW.gu.gu, PRAYER_LABELS: RAW.gu.PRAYER_LABELS },
  kn: { en: RAW.kn.kn, PRAYER_LABELS: RAW.kn.PRAYER_LABELS },
  am: { en: RAW.am.am, PRAYER_LABELS: RAW.am.PRAYER_LABELS },
  'pa-Arab': { en: RAW['pa-Arab'].paArab, PRAYER_LABELS: RAW['pa-Arab'].PRAYER_LABELS },
  sd: { en: RAW.sd.sd, PRAYER_LABELS: RAW.sd.PRAYER_LABELS },
  ug: { en: RAW.ug.ug, PRAYER_LABELS: RAW.ug.PRAYER_LABELS },
  ckb: { en: RAW.ckb.ckb, PRAYER_LABELS: RAW.ckb.PRAYER_LABELS },
  ku: { en: RAW.ku.ku, PRAYER_LABELS: RAW.ku.PRAYER_LABELS },
  yo: { en: RAW.yo.yo, PRAYER_LABELS: RAW.yo.PRAYER_LABELS },
  jv: { en: RAW.jv.jv, PRAYER_LABELS: RAW.jv.PRAYER_LABELS },
  su: { en: RAW.su.su, PRAYER_LABELS: RAW.su.PRAYER_LABELS },
  ja: { en: RAW.ja.ja, PRAYER_LABELS: RAW.ja.PRAYER_LABELS },
  ko: { en: RAW.ko.ko, PRAYER_LABELS: RAW.ko.PRAYER_LABELS },
  it: { en: RAW.it.it, PRAYER_LABELS: RAW.it.PRAYER_LABELS },
  pl: { en: RAW.pl.pl, PRAYER_LABELS: RAW.pl.PRAYER_LABELS },
  ro: { en: RAW.ro.ro, PRAYER_LABELS: RAW.ro.PRAYER_LABELS },
  ceb: { en: RAW.ceb.ceb, PRAYER_LABELS: RAW.ceb.PRAYER_LABELS },
};

export const currentCatalog = (): Catalog => MODULES[currentLocaleId()].en;

/** A named locale's catalog, so a surface can speak its target's words before the switch lands */
export const catalogFor = (locale: LocaleId): Catalog => MODULES[locale].en;

export const currentPrayerLabels = (): Record<PrayerId, string> => MODULES[currentLocaleId()].PRAYER_LABELS;

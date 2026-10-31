/**
 * The loader indirection: the one module a locale switch or the JSON.parse experiment may
 * rewrite without touching a call site (R16, step 15's timing decision).
 *
 * The table is thunks: a catalog module evaluates only when its locale is first
 * read, so the 74 locales the first frame never reads cost loader evaluation
 * nothing (all 75 ran at module scope before the table, inside the launch
 * window - digest 5117 A1).
 */

import type { PrayerId } from '@/shared/constants';
import { perfMark } from '@/shared/perf';

import type { Catalog } from './en';
import { currentLocaleId, type LocaleId } from './locale';

/** Every locale module normalised to one shape, so the lookups stay one-line calls */
interface CatalogModule {
  en: Catalog;
  PRAYER_LABELS: Record<PrayerId, string>;
}

// Each locale exports its catalog under its own name; each factory reads that
// name into the shared `en` slot without copying the catalog. The require sits
// inside the factory, so CommonJS laziness - not the inline-requires transform,
// which only defers requires referenced through a variable - keeps the module
// off the launch path.
const RAW: Record<LocaleId, () => CatalogModule> = {
  en: () => {
    const m = require('./en') as typeof import('./en');
    return { en: m.en, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ar: () => {
    const m = require('./ar') as typeof import('./ar');
    return { en: m.ar, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ms: () => {
    const m = require('./ms') as typeof import('./ms');
    return { en: m.ms, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  so: () => {
    const m = require('./so') as typeof import('./so');
    return { en: m.so, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  hi: () => {
    const m = require('./hi') as typeof import('./hi');
    return { en: m.hi, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  th: () => {
    const m = require('./th') as typeof import('./th');
    return { en: m.th, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  id: () => {
    const m = require('./id') as typeof import('./id');
    return { en: m.id, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  tr: () => {
    const m = require('./tr') as typeof import('./tr');
    return { en: m.tr, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  fr: () => {
    const m = require('./fr') as typeof import('./fr');
    return { en: m.fr, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  uz: () => {
    const m = require('./uz') as typeof import('./uz');
    return { en: m.uz, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  sw: () => {
    const m = require('./sw') as typeof import('./sw');
    return { en: m.sw, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ha: () => {
    const m = require('./ha') as typeof import('./ha');
    return { en: m.ha, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  pt: () => {
    const m = require('./pt') as typeof import('./pt');
    return { en: m.pt, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ur: () => {
    const m = require('./ur') as typeof import('./ur');
    return { en: m.ur, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  fa: () => {
    const m = require('./fa') as typeof import('./fa');
    return { en: m.fa, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  bn: () => {
    const m = require('./bn') as typeof import('./bn');
    return { en: m.bn, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ru: () => {
    const m = require('./ru') as typeof import('./ru');
    return { en: m.ru, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  az: () => {
    const m = require('./az') as typeof import('./az');
    return { en: m.az, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  de: () => {
    const m = require('./de') as typeof import('./de');
    return { en: m.de, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  sq: () => {
    const m = require('./sq') as typeof import('./sq');
    return { en: m.sq, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  bs: () => {
    const m = require('./bs') as typeof import('./bs');
    return { en: m.bs, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ps: () => {
    const m = require('./ps') as typeof import('./ps');
    return { en: m.ps, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ta: () => {
    const m = require('./ta') as typeof import('./ta');
    return { en: m.ta, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ml: () => {
    const m = require('./ml') as typeof import('./ml');
    return { en: m.ml, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  'zh-Hans': () => {
    const m = require('./zh-Hans') as typeof import('./zh-Hans');
    return { en: m.zhHans, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  es: () => {
    const m = require('./es') as typeof import('./es');
    return { en: m.es, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  nl: () => {
    const m = require('./nl') as typeof import('./nl');
    return { en: m.nl, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  kk: () => {
    const m = require('./kk') as typeof import('./kk');
    return { en: m.kk, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ky: () => {
    const m = require('./ky') as typeof import('./ky');
    return { en: m.ky, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  tg: () => {
    const m = require('./tg') as typeof import('./tg');
    return { en: m.tg, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  tk: () => {
    const m = require('./tk') as typeof import('./tk');
    return { en: m.tk, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  wo: () => {
    const m = require('./wo') as typeof import('./wo');
    return { en: m.wo, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  mr: () => {
    const m = require('./mr') as typeof import('./mr');
    return { en: m.mr, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  om: () => {
    const m = require('./om') as typeof import('./om');
    return { en: m.om, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  bm: () => {
    const m = require('./bm') as typeof import('./bm');
    return { en: m.bm, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  tl: () => {
    const m = require('./tl') as typeof import('./tl');
    return { en: m.tl, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ff: () => {
    const m = require('./ff') as typeof import('./ff');
    return { en: m.ff, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  te: () => {
    const m = require('./te') as typeof import('./te');
    return { en: m.te, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  gu: () => {
    const m = require('./gu') as typeof import('./gu');
    return { en: m.gu, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  kn: () => {
    const m = require('./kn') as typeof import('./kn');
    return { en: m.kn, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  am: () => {
    const m = require('./am') as typeof import('./am');
    return { en: m.am, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  'pa-Arab': () => {
    const m = require('./pa-Arab') as typeof import('./pa-Arab');
    return { en: m.paArab, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  sd: () => {
    const m = require('./sd') as typeof import('./sd');
    return { en: m.sd, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ug: () => {
    const m = require('./ug') as typeof import('./ug');
    return { en: m.ug, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ckb: () => {
    const m = require('./ckb') as typeof import('./ckb');
    return { en: m.ckb, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ku: () => {
    const m = require('./ku') as typeof import('./ku');
    return { en: m.ku, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  yo: () => {
    const m = require('./yo') as typeof import('./yo');
    return { en: m.yo, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  jv: () => {
    const m = require('./jv') as typeof import('./jv');
    return { en: m.jv, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  su: () => {
    const m = require('./su') as typeof import('./su');
    return { en: m.su, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  my: () => {
    const m = require('./my') as typeof import('./my');
    return { en: m.my, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  tt: () => {
    const m = require('./tt') as typeof import('./tt');
    return { en: m.tt, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  uk: () => {
    const m = require('./uk') as typeof import('./uk');
    return { en: m.uk, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  qu: () => {
    const m = require('./qu') as typeof import('./qu');
    return { en: m.qu, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  min: () => {
    const m = require('./min') as typeof import('./min');
    return { en: m.min, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  mad: () => {
    const m = require('./mad') as typeof import('./mad');
    return { en: m.mad, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  bug: () => {
    const m = require('./bug') as typeof import('./bug');
    return { en: m.bug, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ja: () => {
    const m = require('./ja') as typeof import('./ja');
    return { en: m.ja, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ko: () => {
    const m = require('./ko') as typeof import('./ko');
    return { en: m.ko, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  it: () => {
    const m = require('./it') as typeof import('./it');
    return { en: m.it, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  pl: () => {
    const m = require('./pl') as typeof import('./pl');
    return { en: m.pl, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ro: () => {
    const m = require('./ro') as typeof import('./ro');
    return { en: m.ro, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ceb: () => {
    const m = require('./ceb') as typeof import('./ceb');
    return { en: m.ceb, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ilo: () => {
    const m = require('./ilo') as typeof import('./ilo');
    return { en: m.ilo, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  vi: () => {
    const m = require('./vi') as typeof import('./vi');
    return { en: m.vi, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  skr: () => {
    const m = require('./skr') as typeof import('./skr');
    return { en: m.skr, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  bal: () => {
    const m = require('./bal') as typeof import('./bal');
    return { en: m.bal, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  kas: () => {
    const m = require('./kas') as typeof import('./kas');
    return { en: m.kas, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  mdh: () => {
    const m = require('./mdh') as typeof import('./mdh');
    return { en: m.mdh, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  kr: () => {
    const m = require('./kr') as typeof import('./kr');
    return { en: m.kr, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  hil: () => {
    const m = require('./hil') as typeof import('./hil');
    return { en: m.hil, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  bcl: () => {
    const m = require('./bcl') as typeof import('./bcl');
    return { en: m.bcl, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  war: () => {
    const m = require('./war') as typeof import('./war');
    return { en: m.war, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  mrw: () => {
    const m = require('./mrw') as typeof import('./mrw');
    return { en: m.mrw, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  mfa: () => {
    const m = require('./mfa') as typeof import('./mfa');
    return { en: m.mfa, PRAYER_LABELS: m.PRAYER_LABELS };
  },
  ti: () => {
    const m = require('./ti') as typeof import('./ti');
    return { en: m.ti, PRAYER_LABELS: m.PRAYER_LABELS };
  },
};

// Resolved once per locale: the first read pays that locale's factory, every
// later read the cached module
const RESOLVED: Partial<Record<LocaleId, CatalogModule>> = {};

const catalogModuleFor = (locale: LocaleId): CatalogModule => {
  const cached = RESOLVED[locale];
  if (cached !== undefined) return cached;

  // Brackets the catalog's one-time evaluation: pre-init the marks replay with
  // true detail.at epochs, post-init the ring ts already is one - either way
  // the require cost reads offline.
  perfMark('catalog_require_start', { locale });
  const module = RAW[locale]();
  perfMark('catalog_require_end', { locale });

  RESOLVED[locale] = module;
  return module;
};

export const currentCatalog = (): Catalog => catalogModuleFor(currentLocaleId()).en;

/** A named locale's catalog, so a surface can speak its target's words before the switch lands */
export const catalogFor = (locale: LocaleId): Catalog => catalogModuleFor(locale).en;

export const currentPrayerLabels = (): Record<PrayerId, string> => catalogModuleFor(currentLocaleId()).PRAYER_LABELS;

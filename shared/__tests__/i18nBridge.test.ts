/**
 * The flat-JSON bridge (RECONCILIATION, ARCH-14/A3): the transfer format is the catalog
 * itself, so the round trip is identity and no i18next shape ever enters the repository.
 *
 * Bare (CI): asserts only the parity invariants, zero new dependencies. With
 * I18N_BRIDGE=export it writes shared/i18n/dist/<I18N_LOCALE or en>.json from the landed
 * catalog of that locale; with I18N_BRIDGE=import it reads the same file back and asserts
 * round-trip identity against the landed catalog.
 */

import fs from 'node:fs';
import path from 'node:path';

import { type ParamsOf, t } from '@/shared/i18n';
import { am } from '@/shared/i18n/am';
import { ar } from '@/shared/i18n/ar';
import { az } from '@/shared/i18n/az';
import { bal } from '@/shared/i18n/bal';
import { bm } from '@/shared/i18n/bm';
import { bn } from '@/shared/i18n/bn';
import { bs } from '@/shared/i18n/bs';
import { ckb } from '@/shared/i18n/ckb';
import { de } from '@/shared/i18n/de';
import { dv } from '@/shared/i18n/dv';
import type { TranslationKey } from '@/shared/i18n/en';
import { type Catalog, en } from '@/shared/i18n/en';
import { es } from '@/shared/i18n/es';
import { fa } from '@/shared/i18n/fa';
import { ff } from '@/shared/i18n/ff';
import { fr } from '@/shared/i18n/fr';
import { gu } from '@/shared/i18n/gu';
import { ha } from '@/shared/i18n/ha';
import { hi } from '@/shared/i18n/hi';
import { id } from '@/shared/i18n/id';
import { jv } from '@/shared/i18n/jv';
import { kas } from '@/shared/i18n/kas';
import { kk } from '@/shared/i18n/kk';
import { kn } from '@/shared/i18n/kn';
import { ku } from '@/shared/i18n/ku';
import { ky } from '@/shared/i18n/ky';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ml } from '@/shared/i18n/ml';
import { mr } from '@/shared/i18n/mr';
import { ms } from '@/shared/i18n/ms';
import { nl } from '@/shared/i18n/nl';
import { om } from '@/shared/i18n/om';
import { paArab } from '@/shared/i18n/pa-Arab';
import { ps } from '@/shared/i18n/ps';
import { pt } from '@/shared/i18n/pt';
import { ru } from '@/shared/i18n/ru';
import { sd } from '@/shared/i18n/sd';
import { skr } from '@/shared/i18n/skr';
import { so } from '@/shared/i18n/so';
import { sq } from '@/shared/i18n/sq';
import { su } from '@/shared/i18n/su';
import { sw } from '@/shared/i18n/sw';
import { ta } from '@/shared/i18n/ta';
import { te } from '@/shared/i18n/te';
import { tg } from '@/shared/i18n/tg';
import { th } from '@/shared/i18n/th';
import { tk } from '@/shared/i18n/tk';
import { tl } from '@/shared/i18n/tl';
import { tr } from '@/shared/i18n/tr';
import { ug } from '@/shared/i18n/ug';
import { ur } from '@/shared/i18n/ur';
import { uz } from '@/shared/i18n/uz';
import { wo } from '@/shared/i18n/wo';
import { yo } from '@/shared/i18n/yo';
import { zhHans } from '@/shared/i18n/zh-Hans';
import { zhHant } from '@/shared/i18n/zh-Hant';

const CATALOGS: Record<string, Catalog> = {
  en,
  ar,
  ms,
  so,
  hi,
  th,
  id,
  tr,
  fr,
  uz,
  sw,
  ha,
  pt,
  ur,
  fa,
  bn,
  ru,
  az,
  de,
  sq,
  bs,
  ps,
  ta,
  ml,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  es,
  nl,
  kk,
  ky,
  tg,
  tk,
  wo,
  mr,
  om,
  bm,
  tl,
  ff,
  te,
  gu,
  kn,
  am,
  'pa-Arab': paArab,
  sd,
  ug,
  ckb,
  ku,
  yo,
  jv,
  su,
  skr,
  bal,
  kas,
  dv,
};

const DIST = path.join(__dirname, '../i18n/dist');
const TOKEN = /\{(\w+)\}/g;

const mode = process.env.I18N_BRIDGE;
const locale = process.env.I18N_LOCALE ?? 'en';
const catalog = CATALOGS[locale];

const exportTo = (cat: Catalog): Record<string, string> => JSON.parse(JSON.stringify(cat));

if (mode === 'export') {
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, `${locale}.json`), `${JSON.stringify(exportTo(catalog), null, 2)}\n`);
  process.exit(0);
}

if (mode === 'import') {
  const file = path.join(DIST, `${locale}.json`);
  const imported: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));

  describe('the flat-JSON bridge round trip', () => {
    it(`re-imports the exported ${locale} file to the same catalog`, () => {
      expect(imported).toEqual(exportTo(catalog));
    });
  });
}

describe('the catalog as its own transfer format', () => {
  it('replaces {name} and {n} and throws on a missing parameter', () => {
    expect(t('notification.now', { name: 'Fajr' })).toBe('Fajr now');
    expect(t('notification.reminder', { name: 'Fajr', n: 15 })).toBe('Fajr in 15');
    expect(t('notification.reminder', { name: 'Last Third', n: 30 })).toBe('Last Third in 30');
    expect(t('channel.reminder', { name: 'Fajr', n: 15 })).toBe('Fajr in 15m Reminder');

    // The runtime guard must hold even when a caller lies its way past the typing
    expect(() => t('notification.now', {} as unknown as ParamsOf<'notification.now'>)).toThrow(
      "i18n: missing parameter 'name' for key 'notification.now'"
    );
    expect(() => t('notification.reminder', { name: 'Fajr' } as ParamsOf<'notification.reminder'>)).toThrow(
      "i18n: missing parameter 'n' for key 'notification.reminder'"
    );
    expect(() => t('channel.reminder', { name: 'Fajr' } as ParamsOf<'channel.reminder'>)).toThrow(
      "i18n: missing parameter 'n' for key 'channel.reminder'"
    );
  });

  it('renders numeric parameter digits as Latin at substitution under ar and en', () => {
    try {
      setActiveLocale('ar');
      expect(t('channel.athan', { n: 3 })).toBe('أذان 3');
    } finally {
      setActiveLocale('en');
    }
    expect(t('channel.athan', { n: 3 })).toBe('Athan 3');
  });

  it('exports en to JSON that re-imports to a deep-equal object', () => {
    expect(JSON.parse(JSON.stringify(exportTo(en)))).toEqual(en);
  });

  it('holds flat strings only, no nested i18next shape', () => {
    for (const value of Object.values(exportTo(en))) {
      expect(typeof value).toBe('string');
      expect(value).not.toContain('{{');
      expect(value).not.toMatch(/_(one|other)\b/);
      expect(value).not.toContain('$t(');
    }
  });

  it('keys the file exactly as the TranslationKey union', () => {
    expect(Object.keys(exportTo(en)).sort()).toEqual([...(Object.keys(en) as TranslationKey[])].sort());
  });

  it('carries every catalog at en parity, flat strings only', () => {
    const enKeys = Object.keys(exportTo(en)).sort();
    expect(Object.keys(CATALOGS)).toHaveLength(54);
    for (const [id, cat] of Object.entries(CATALOGS)) {
      const exported = exportTo(cat);
      expect([id, Object.keys(exported).sort()]).toEqual([id, enKeys]);
      for (const value of Object.values(exported)) {
        expect(typeof value).toBe('string');
        expect(value).not.toContain('{{');
        expect(value).not.toMatch(/_(one|other)\b/);
        expect(value).not.toContain('$t(');
      }
    }
  });

  it('covers every {token} in a value with the key typed params', () => {
    const tokensByKey = new Map<string, string[]>();
    for (const [key, value] of Object.entries(exportTo(en))) {
      const tokens = [...String(value).matchAll(TOKEN)].map((match) => match[1]);
      if (tokens.length > 0) tokensByKey.set(key, tokens);
    }

    // The only tokened keys today; a new token family must extend ParamsOf first
    expect([...tokensByKey.keys()].sort()).toEqual([
      'alert.reminder',
      'channel.athan',
      'channel.reminder',
      'countdown.progressA11y',
      'language.changing',
      'notification.now',
      'notification.reminder',
      'prayerAlert.notification',
      'soundItem.athan',
      'soundItem.preview',
      'soundItem.stopPreview',
      'stepper.decrease',
      'stepper.increase',
      'stepper.value',
      'time.ago',
      'time.now',
      'whatsNew.platformNote',
    ]);
    expect(tokensByKey.get('notification.now')).toEqual(['name']);
    expect(tokensByKey.get('notification.reminder')).toEqual(['name', 'n']);
    expect(tokensByKey.get('alert.reminder')).toEqual(['n']);
    expect(tokensByKey.get('channel.athan')).toEqual(['n']);
    expect(tokensByKey.get('channel.reminder')).toEqual(['name', 'n']);
    expect(tokensByKey.get('countdown.progressA11y')).toEqual(['percent']);
    expect(tokensByKey.get('language.changing')).toEqual(['language']);
    expect(tokensByKey.get('prayerAlert.notification')).toEqual(['name', 'state']);
    expect(tokensByKey.get('soundItem.athan')).toEqual(['n']);
    expect(tokensByKey.get('soundItem.preview')).toEqual(['name']);
    expect(tokensByKey.get('soundItem.stopPreview')).toEqual(['name']);
    expect(tokensByKey.get('stepper.value')).toEqual(['value', 'unit']);
    expect(tokensByKey.get('stepper.decrease')).toEqual(['value', 'unit']);
    expect(tokensByKey.get('stepper.increase')).toEqual(['value', 'unit']);
    expect(tokensByKey.get('time.now')).toEqual(['name']);
    expect(tokensByKey.get('time.ago')).toEqual(['name', 'duration']);
    expect(tokensByKey.get('whatsNew.platformNote')).toEqual(['platform']);

    // ParamsOf matches the same map (compile-time pins: a wrong shape fails tsc here)
    const nowParams: ParamsOf<'notification.now'> = { name: 'Fajr' };
    const reminderParams: ParamsOf<'notification.reminder'> = { name: 'Fajr', n: 15 };
    const channelReminderParams: ParamsOf<'channel.reminder'> = { name: 'Fajr', n: 15 };
    const stepperParams: ParamsOf<'stepper.decrease'> = { value: 10, unit: 'min' };
    const platformParams: ParamsOf<'whatsNew.platformNote'> = { platform: 'iOS' };
    const agoParams: ParamsOf<'time.ago'> = { name: 'Fajr', duration: '2h 30m' };
    expect(nowParams.name).toBe('Fajr');
    expect(reminderParams.n).toBe(15);
    expect(channelReminderParams.n).toBe(15);
    expect(stepperParams.value).toBe(10);
    expect(platformParams.platform).toBe('iOS');
    expect(agoParams.duration).toBe('2h 30m');
    // @ts-expect-error a key with no tokens takes no params
    const none: ParamsOf<'settings.title'> = { name: 'x' };
    expect(none).toBeDefined();
  });
});

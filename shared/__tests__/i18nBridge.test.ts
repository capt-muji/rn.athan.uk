/**
 * The flat-JSON bridge (RECONCILIATION, ARCH-14/A3): the transfer format is the catalog
 * itself, so the round trip is identity and no i18next shape ever enters the repository.
 *
 * Bare (CI): asserts only the parity invariants, zero new dependencies. With
 * I18N_BRIDGE=export it writes shared/i18n/dist/en.json and exits 0; with
 * I18N_BRIDGE=import it reads shared/i18n/dist/<I18N_LOCALE or en>.json and asserts
 * round-trip identity against the imported catalog.
 */

import fs from 'node:fs';
import path from 'node:path';

import { type ParamsOf, t } from '@/shared/i18n';
import { type Catalog, en, type TranslationKey } from '@/shared/i18n/en';

const DIST = path.join(__dirname, '../i18n/dist');
const TOKEN = /\{(\w+)\}/g;

const mode = process.env.I18N_BRIDGE;
const locale = process.env.I18N_LOCALE ?? 'en';

const exportTo = (catalog: Catalog): Record<string, string> => JSON.parse(JSON.stringify(catalog));

if (mode === 'export') {
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'en.json'), `${JSON.stringify(exportTo(en), null, 2)}\n`);
  process.exit(0);
}

if (mode === 'import') {
  const file = path.join(DIST, `${locale}.json`);
  const imported: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));

  describe('the flat-JSON bridge round trip', () => {
    it('re-imports the exported file to the same catalog', () => {
      expect(imported).toEqual(exportTo(en));
    });
  });

  afterAll(() => {
    // Jest has done its work; the script contract is a clean exit
    process.exit(0);
  });
}

describe('the catalog as its own transfer format', () => {
  it('replaces {name} and {n} and throws on a missing parameter', () => {
    expect(t('notification.now', { name: 'Fajr' })).toBe('Fajr now');
    expect(t('notification.reminder', { name: 'Fajr', n: 15 })).toBe('Fajr in 15m');
    expect(t('notification.reminder', { name: 'Last Third', n: 30 })).toBe('Last Third in 30m');

    // The runtime guard must hold even when a caller lies its way past the typing
    expect(() => t('notification.now', {} as unknown as ParamsOf<'notification.now'>)).toThrow(
      "i18n: missing parameter 'name' for key 'notification.now'"
    );
    expect(() => t('notification.reminder', { name: 'Fajr' } as ParamsOf<'notification.reminder'>)).toThrow(
      "i18n: missing parameter 'n' for key 'notification.reminder'"
    );
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
      'countdown.progressA11y',
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
    expect(tokensByKey.get('countdown.progressA11y')).toEqual(['percent']);
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
    const stepperParams: ParamsOf<'stepper.decrease'> = { value: 10, unit: 'min' };
    const platformParams: ParamsOf<'whatsNew.platformNote'> = { platform: 'iOS' };
    const agoParams: ParamsOf<'time.ago'> = { name: 'Fajr', duration: '2h 30m' };
    expect(nowParams.name).toBe('Fajr');
    expect(reminderParams.n).toBe(15);
    expect(stepperParams.value).toBe(10);
    expect(platformParams.platform).toBe('iOS');
    expect(agoParams.duration).toBe('2h 30m');
    // @ts-expect-error a key with no tokens takes no params
    const none: ParamsOf<'settings.title'> = { name: 'x' };
    expect(none).toBeDefined();
  });
});

/**
 * The frozen 2026 identifier bytes: the prayer vocabulary, the keys and OS ids it derives,
 * the audio files it joins, and the legacy families it must keep reading.
 */

import fs from 'node:fs';
import path from 'node:path';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import { EXTRA_PRAYER_IDS, PRAYER_IDS, type PrayerId, STANDARD_PRAYER_IDS } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import {
  athanAndroidChannelId,
  atTimeAndroidChannelId,
  extrasAndroidChannelId,
  getReminderNotificationSound,
  isDailyPrayer,
  reminderAndroidChannelId,
} from '@/shared/notifications';
import { AlertType, ScheduleType } from '@/shared/types';
import { createPrayerAlertAtom, EXTRAS_ENGLISH_PRE_1_0_27 } from '@/stores/notifications';

const DATE = '2026-08-28';
const INTERVALS = [5, 10, 15, 20, 25, 30] as const;
const read = (rel: string) => fs.readFileSync(path.join(__dirname, '../..', rel), 'utf8');

describe('the prayer identifier contract, frozen 2026', () => {
  it('pins the eleven ids in canonical order, both arrays', () => {
    expect([...STANDARD_PRAYER_IDS, ...EXTRA_PRAYER_IDS]).toEqual([
      'fajr',
      'sunrise',
      'dhuhr',
      'asr',
      'magrib',
      'isha',
      'midnight',
      'last third',
      'suhoor',
      'duha',
      'istijaba',
    ]);
  });

  it('pins the four preference-key families including both reminder slots', () => {
    const ids = [...STANDARD_PRAYER_IDS, ...EXTRA_PRAYER_IDS];
    const derived = new Set<string>();
    for (const id of ids) {
      for (const type of ['standard', 'extra'] as const) {
        derived.add(`preference_alert_${type}_${id}`);
        derived.add(`preference_reminder_alert_${type}_${id}`);
        derived.add(`preference_reminder_alert_${type}_${id}_2`);
        derived.add(`preference_reminder_interval_${type}_${id}`);
        derived.add(`preference_reminder_interval_${type}_${id}_2`);
      }
    }

    // The factories themselves, pinned where they are built so a moved byte cannot hide behind
    // a test-side copy of the same template
    const storeSource = read('stores/notifications.ts');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(storeSource).toContain('`preference_alert_${type}_${id}`');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(storeSource).toContain('`preference_reminder_alert_${type}_${id}${reminderSlotSuffix(slot)}`');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(storeSource).toContain('`preference_reminder_interval_${type}_${id}${reminderSlotSuffix(slot)}`');

    for (const frozen of [
      'preference_alert_standard_fajr',
      'preference_alert_standard_magrib',
      'preference_alert_extra_istijaba',
      'preference_alert_extra_last third',
      'preference_reminder_alert_standard_isha',
      'preference_reminder_alert_extra_last third',
      'preference_reminder_alert_extra_last third_2',
      'preference_reminder_interval_standard_sunrise',
      'preference_reminder_interval_standard_dhuhr_2',
      'preference_reminder_interval_extra_istijaba_2',
    ]) {
      expect(derived.has(frozen)).toBe(true);
    }
    expect(derived.size).toBe(11 * 2 * 5);
  });

  it('pins both OS identifier builders with the space form', () => {
    expect(prayerNotificationIdentifier(ScheduleType.Extra, 'last third', DATE)).toBe(
      'athan_extra_last third_2026-08-28'
    );
    expect(reminderNotificationIdentifier(ScheduleType.Extra, 'last third', DATE, 15)).toBe(
      'reminder_extra_last third_2026-08-28_15'
    );
    expect(prayerNotificationIdentifier(ScheduleType.Standard, 'fajr', DATE)).toBe('athan_standard_fajr_2026-08-28');
    expect(reminderNotificationIdentifier(ScheduleType.Standard, 'fajr', DATE, 15)).toBe(
      'reminder_standard_fajr_2026-08-28_15'
    );
  });

  it('pins the Android channel ids including the underscore forms', () => {
    expect(reminderAndroidChannelId('last third', 15)).toBe('reminder_last_third_15_v3');
    expect(athanAndroidChannelId(0)).toBe('athan_1_v4');
    expect(extrasAndroidChannelId).toBe('extras_at_time_v3');
    expect(atTimeAndroidChannelId('sunrise', 3)).toBe('extras_at_time_v3');
    expect(atTimeAndroidChannelId('asr', 3)).toBe('athan_4_v4');
  });

  it('pins the channel-name formats in English', () => {
    const shared = read('shared/notifications.ts');
    const catalog = read('shared/i18n/en.ts');
    expect(shared).toContain("name: t('channel.athan', { n: soundIndex + 1 })");
    expect(shared).toContain("name: t('channel.extras')");
    expect(catalog).toContain("'channel.athan': 'Athan {n}'");
    expect(catalog).toContain("'channel.extras': 'Extra Times'");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(shared).toContain('`${prayerLabel(id)} in ${intervalMinutes}m Reminder`');
  });

  it('pins the daily-prayer truth table', () => {
    const table: Record<PrayerId, boolean> = {
      fajr: true,
      sunrise: false,
      dhuhr: true,
      asr: true,
      magrib: true,
      isha: true,
      midnight: false,
      'last third': false,
      suhoor: false,
      duha: false,
      istijaba: false,
    };

    for (const id of PRAYER_IDS) {
      expect(`${id}:${isDailyPrayer(id)}`).toBe(`${id}:${table[id]}`);
    }
  });

  it('pins one bookkeeping record key per family', () => {
    const stores = read('stores/database.ts');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(stores).toContain('`scheduled_notifications_${scheduleType}_${prayerIndex}_${notification.id}`');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: pins the source text of a template literal, it must not interpolate
    expect(stores).toContain('`scheduled_reminders_${scheduleType}_${prayerIndex}_${notification.id}`');
    const id = prayerNotificationIdentifier(ScheduleType.Standard, 'fajr', DATE);
    expect(`scheduled_notifications_standard_0_${id}`).toBe(
      'scheduled_notifications_standard_0_athan_standard_fajr_2026-08-28'
    );
  });

  it('pins the index-keyed legacy family and its migration map', () => {
    const stores = read('stores/notifications.ts');
    expect(stores).toContain('/^preference_(alert|reminder_alert|reminder_interval)_(standard|extra)_\\d+$/');
    expect([...EXTRAS_ENGLISH_PRE_1_0_27]).toEqual(['Last Third', 'Suhoor', 'Duha', 'Istijaba']);
  });

  it('joins every id and interval to an existing audio file, and the directory holds nothing unmapped', () => {
    const dir = fs.readdirSync(path.join(__dirname, '../../assets/audio/reminders'));
    expect(dir.length).toBe(67);

    for (const id of PRAYER_IDS) {
      for (const interval of INTERVALS) {
        const file = getReminderNotificationSound(AlertType.Sound, id, interval);
        expect(typeof file).toBe('string');
        expect(dir).toContain(file as string);
      }
    }

    const mapped = new Set<string>(['reminder.mp3']);
    for (const id of PRAYER_IDS) {
      for (const interval of INTERVALS) {
        const file = getReminderNotificationSound(AlertType.Sound, id, interval);
        if (typeof file === 'string') mapped.add(file);
      }
    }
    expect(dir.filter((entry) => !mapped.has(entry))).toEqual([]);
  });

  it('refuses a display string at every key builder', () => {
    // @ts-expect-error display strings never reach key builders
    prayerNotificationIdentifier(ScheduleType.Standard, prayerLabel('fajr'), DATE);
    // @ts-expect-error display strings never reach key builders
    createPrayerAlertAtom(ScheduleType.Standard, prayerLabel('fajr'));
    // @ts-expect-error display strings never reach key builders
    reminderAndroidChannelId(prayerLabel('fajr'), 15);
    // @ts-expect-error display strings never reach key builders
    getReminderNotificationSound(AlertType.Sound, prayerLabel('fajr'), 15);
    // @ts-expect-error display strings never reach key builders
    isDailyPrayer(prayerLabel('fajr'));
  });
});

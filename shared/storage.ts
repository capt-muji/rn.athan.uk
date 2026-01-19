/**
 * MMKV Serialization Utilities for Prayer-Centric Model
 *
 * JavaScript Date objects cannot be stored directly in MMKV.
 * These utilities convert between runtime Prayer objects and storable formats.
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { Prayer, PrayerSequence, StoredPrayer, StoredPrayerSequence } from '@/shared/types';

/**
 * Converts a Prayer object to StoredPrayer for MMKV storage
 * Date is converted to ISO string without 'Z' suffix (local time)
 *
 * @param prayer Prayer object with Date datetime
 * @returns StoredPrayer with string datetime
 *
 * @example
 * serializePrayer({ datetime: new Date("2026-01-18T06:12:00"), ... })
 * // Returns: { datetime: "2026-01-18T06:12:00", ... }
 */
export const serializePrayer = (prayer: Prayer): StoredPrayer => {
  // Format without 'Z' to preserve local time interpretation
  const year = prayer.datetime.getFullYear();
  const month = String(prayer.datetime.getMonth() + 1).padStart(2, '0');
  const day = String(prayer.datetime.getDate()).padStart(2, '0');
  const hours = String(prayer.datetime.getHours()).padStart(2, '0');
  const minutes = String(prayer.datetime.getMinutes()).padStart(2, '0');
  const seconds = String(prayer.datetime.getSeconds()).padStart(2, '0');

  const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

  return {
    ...prayer,
    datetime: localISOString,
  };
};

/**
 * Converts a StoredPrayer from MMKV storage to Prayer object
 * ISO string is parsed back to Date object
 *
 * @param stored StoredPrayer with string datetime
 * @returns Prayer object with Date datetime
 *
 * @example
 * deserializePrayer({ datetime: "2026-01-18T06:12:00", ... })
 * // Returns: { datetime: Date, ... }
 */
export const deserializePrayer = (stored: StoredPrayer): Prayer => {
  return {
    ...stored,
    datetime: new Date(stored.datetime),
  };
};

/**
 * Converts a PrayerSequence to StoredPrayerSequence for MMKV storage
 *
 * @param sequence PrayerSequence with Prayer objects
 * @returns StoredPrayerSequence with StoredPrayer objects
 *
 * @example
 * const stored = serializeSequence({ type: "standard", prayers: [...] });
 * database.set("sequence_standard", JSON.stringify(stored));
 */
export const serializeSequence = (sequence: PrayerSequence): StoredPrayerSequence => {
  return {
    type: sequence.type,
    prayers: sequence.prayers.map(serializePrayer),
  };
};

/**
 * Converts a StoredPrayerSequence from MMKV storage to PrayerSequence
 *
 * @param stored StoredPrayerSequence with StoredPrayer objects
 * @returns PrayerSequence with Prayer objects
 *
 * @example
 * const stored = JSON.parse(database.getString("sequence_standard"));
 * const sequence = deserializeSequence(stored);
 * // sequence.prayers[0].datetime is now a Date object
 */
export const deserializeSequence = (stored: StoredPrayerSequence): PrayerSequence => {
  return {
    type: stored.type,
    prayers: stored.prayers.map(deserializePrayer),
  };
};

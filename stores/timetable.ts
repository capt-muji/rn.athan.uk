/**
 * The timetable reader: serves every prayer day through the one choke point the
 * app has always read through (stores/database.ts getPrayerByDateString).
 *
 * Source of truth by build class: prod and preview read the baked London
 * Unified Prayer Timetable artifact (shared/timetableDecode.ts decodes it);
 * dev and test serve the launch-relative mock window, computed through the
 * same transform the API pipeline used. Both answer the same synchronous
 * question - a day record for a date string - so a v3 provider joins by
 * answering it too.
 *
 * The artifact bytes are staged once into a dedicated MMKV instance, because a
 * bundled binary asset is not synchronously readable on Android release builds
 * while MMKV's getBuffer is. The staged buffer is validated on every launch's
 * read (torn bytes read as absent, never as times) and keyed by the asset's
 * metro hash, so an update that ships corrected times restages before serving.
 * Day data has no write path at all outside that one staging copy.
 */

import { createMMKV } from 'react-native-mmkv';

import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import { isPreview, isProd } from '@/shared/config';
import { filterApiData, transformApiData } from '@/shared/prayer';
import * as TimetableDecode from '@/shared/timetableDecode';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import { artifactHash, loadArtifactBytes } from '@/stores/timetableAsset';

/** Own instance, so a torn stage or a wipe touches no other store */
const timetableStore = createMMKV({ id: 'athan-timetable' });

const ARTIFACT_KEY = 'artifact';
const ASSET_HASH_KEY = 'assetHash';

const servesBakedTimetable = (): boolean => isProd() || isPreview();

/** Validated artifact held for the process once staged; null until then */
let stagedArtifact: { bytes: Uint8Array; header: TimetableDecode.TimetableHeader } | null = null;

/** The dev window, built lazily on first read and dropped at each ensureTimetableReady */
let mockWindow: Map<string, ISingleApiResponseTransformed> | null = null;

/** Days installed by a test harness, served in any env until replaced */
let installedDays: Map<string, ISingleApiResponseTransformed> | null = null;

/**
 * Reads the staged buffer, validating it whole: a torn or foreign buffer is
 * absent, never decoded. The hash guard closes the OTA-staleness hole (an
 * update's asset differs from what the previous version staged).
 */
const readStagedArtifact = (): { bytes: Uint8Array; header: TimetableDecode.TimetableHeader } | null => {
  const staged = timetableStore.getBuffer(ARTIFACT_KEY);
  if (!(staged instanceof ArrayBuffer) || staged.byteLength === 0) return null;
  if (timetableStore.getString(ASSET_HASH_KEY) !== artifactHash()) return null;

  const bytes = new Uint8Array(staged);
  const header = TimetableDecode.decodeTimetableHeader(bytes);
  return header === null ? null : { bytes, header };
};

/**
 * The one-time removal of the API era's day cache lives with the keys it
 * guards (stores/database.ts) and runs from every sync until its flag is set
 */

/** Stages the artifact: buffer first, hash second, so a kill between the two leaves no half-committed stage */
const stageArtifact = async (): Promise<void> => {
  const bytes = await loadArtifactBytes();
  const header = TimetableDecode.decodeTimetableHeader(bytes);
  if (header === null) throw new Error('The bundled timetable artifact failed its own header validation');

  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  timetableStore.set(ARTIFACT_KEY, copy);
  timetableStore.set(ASSET_HASH_KEY, artifactHash());
  stagedArtifact = { bytes, header };
};

/** Resolves when the serving source is ready; rejects when a first-ever stage fails */
let readyPromise: Promise<void> | null = null;

export const ensureTimetableReady = (): Promise<void> => {
  Database.cleanLegacyDayCacheOnce();

  if (servesBakedTimetable()) {
    if (stagedArtifact !== null) return Promise.resolve();
    if (readyPromise === null) {
      readyPromise = stageArtifact()
        .then(() => {
          readyPromise = null;
        })
        .catch((error: unknown) => {
          readyPromise = null;
          throw error;
        });
    }
    return readyPromise;
  }

  // Dev and test reseed per sync run, matching the mock's old per-download reseed
  mockWindow = null;
  return Promise.resolve();
};

/** The mock window through the pipeline the API path used, so dev records are byte-identical */
const buildMockWindow = (): Map<string, ISingleApiResponseTransformed> => {
  const transformed = transformApiData(filterApiData(MOCK_DATA_SIMPLE));
  return new Map(transformed.map((day) => [day.date, day]));
};

const readBakedDay = (date: string): ISingleApiResponseTransformed | null => {
  const staged = stagedArtifact;
  if (staged === null) return null;

  const index = TimetableDecode.dayIndex(date);
  if (index === null) return null;

  const minutes = TimetableDecode.readDayMinutes(staged.bytes, staged.header, index);
  return TimetableDecode.minutesToRecord(date, {
    fajr: minutes[0],
    sunrise: minutes[1],
    dhuhr: minutes[2],
    asr: minutes[3],
    magrib: minutes[4],
    isha: minutes[5],
  });
};

const readMockDay = (date: string): ISingleApiResponseTransformed | null => {
  if (mockWindow === null) mockWindow = buildMockWindow();
  return mockWindow.get(date) ?? null;
};

/** A day's record, or null: before the artifact is staged, outside its span, or absent from the window */
export const getTimetableDay = (date: string): ISingleApiResponseTransformed | null => {
  if (installedDays !== null) return installedDays.get(date) ?? null;
  return servesBakedTimetable() ? readBakedDay(date) : readMockDay(date);
};

/** Test seam: serves exactly these days (a day absent from the list reads as null) until replaced */
export const __installTimetableDays = (days: ISingleApiResponseTransformed[]): void => {
  installedDays = new Map(days.map((day) => [day.date, day]));
};

/**
 * The launch read: staged bytes validated whole, synchronously, so a warm
 * launch never waits on the asset. Runs at import; exposed because a launch is
 * the only moment it runs on device, and the staging tests replay launches.
 */
export const readStagedArtifactAtLaunch = (): boolean => {
  if (!servesBakedTimetable()) return false;
  const staged = readStagedArtifact();
  if (staged === null) return false;
  stagedArtifact = staged;
  return true;
};

readStagedArtifactAtLaunch();

/** Test seam: back to the post-import state, so each staging test launches from a known point */
export const __resetTimetableForTest = (): void => {
  stagedArtifact = null;
  mockWindow = null;
  readyPromise = null;
  installedDays = null;
};

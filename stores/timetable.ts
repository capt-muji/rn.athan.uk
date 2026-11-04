/**
 * The timetable reader: serves every prayer day through the one choke point the
 * app has always read through (stores/database.ts getPrayerByDateString).
 *
 * Source of truth by build class: prod and preview read the baked London
 * Unified Prayer Timetable artifact (shared/timetableDecode.ts decodes it);
 * dev and test serve the launch-relative mock window, decoded through the same
 * minutesToRecord the artifact decodes through. Both answer the same
 * synchronous question - a day record for a date string - so a v3 provider
 * joins by answering it too.
 *
 * The artifact bytes are staged once into a dedicated MMKV instance, because a
 * bundled binary asset is not synchronously readable on Android release builds
 * while MMKV's getBuffer is. The staged buffer is validated on every launch's
 * read (torn bytes read as absent, never as times) and keyed by the asset's
 * metro hash, so an update that ships corrected times restages before serving.
 * Day data has no write path at all outside that one staging copy.
 */

import { createMMKV } from 'react-native-mmkv';

import { isPreview, isProd } from '@/shared/config';
import * as TimetableDecode from '@/shared/timetableDecode';
import type { DayRecord } from '@/shared/types';
import * as Database from '@/stores/database';
import { artifactHash, loadArtifactBytes } from '@/stores/timetableAsset';

/**
 * Own instance, so a torn stage or a wipe touches no other store. Opened on
 * first staged read or write: dev and test builds serve the mock window and
 * never stage, so they pay nothing for the native instance.
 */
let timetableStore: ReturnType<typeof createMMKV> | null = null;
const store = (): ReturnType<typeof createMMKV> => {
  if (timetableStore === null) timetableStore = createMMKV({ id: 'athan-timetable' });
  return timetableStore;
};

/**
 * The dev window's minutes, dev and test only. The env constants are read
 * directly - metro inlines them at build time, so the require (and with it all
 * of mocks/minutes.ts) leaves prod and preview bundles, the same fold
 * stores/widget.ts makes for the widget modules.
 */
const loadMockMinutes = (): Map<string, TimetableDecode.DayMinutes> => {
  if (process.env.EXPO_PUBLIC_ENV === 'prod' || process.env.EXPO_PUBLIC_ENV === 'preview') {
    throw new Error('The mock window was read on a build that serves the baked timetable');
  }
  const mock = require('@/mocks/minutes') as typeof import('@/mocks/minutes');
  return mock.mockMinutesSnapshot(new Date());
};

const ARTIFACT_KEY = 'artifact';
const ASSET_HASH_KEY = 'assetHash';

const servesBakedTimetable = (): boolean => isProd() || isPreview();

/** Validated artifact held for the process once staged; null until then */
let stagedArtifact: { bytes: Uint8Array; header: TimetableDecode.TimetableHeader } | null = null;

/** The dev window, built lazily on first read and dropped at each ensureTimetableReady */
let mockWindow: Map<string, DayRecord> | null = null;

/** Days installed by a test harness, served in any env until replaced */
let installedDays: Map<string, DayRecord> | null = null;

/**
 * Reads the staged buffer, validating it whole: a torn or foreign buffer is
 * absent, never decoded. The hash guard closes the OTA-staleness hole (an
 * update's asset differs from what the previous version staged).
 */
const readStagedArtifact = (): { bytes: Uint8Array; header: TimetableDecode.TimetableHeader } | null => {
  const staged = store().getBuffer(ARTIFACT_KEY);
  if (!(staged instanceof ArrayBuffer) || staged.byteLength === 0) return null;
  if (store().getString(ASSET_HASH_KEY) !== artifactHash()) return null;

  const bytes = new Uint8Array(staged);
  const header = TimetableDecode.decodeTimetableHeader(bytes);
  return header === null ? null : { bytes, header };
};

/** Stages the artifact: buffer first, hash second, so a kill between the two leaves no half-committed stage */
const stageArtifact = async (): Promise<void> => {
  const bytes = await loadArtifactBytes();
  const header = TimetableDecode.decodeTimetableHeader(bytes);
  if (header === null) throw new Error('The bundled timetable artifact failed its own header validation');

  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  store().set(ARTIFACT_KEY, copy);
  store().set(ASSET_HASH_KEY, artifactHash());
  stagedArtifact = { bytes, header };
};

/** Resolves when the serving source is ready; rejects when a first-ever stage fails */
let readyPromise: Promise<void> | null = null;

/**
 * The one-time removal of the API era's day cache lives with the keys it
 * guards (stores/database.ts) and runs from every sync until its flag is set
 */
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

  // Dev and test reseed per sync run, so the window follows the day the phone is on
  mockWindow = null;
  return Promise.resolve();
};

/** The dev window, decoded through the same producer the baked artifact decodes through */
const buildMockWindow = (): Map<string, DayRecord> => {
  const minutes = loadMockMinutes();
  return new Map([...minutes].map(([date, day]) => [date, TimetableDecode.minutesToRecord(date, day)]));
};

const readBakedDay = (date: string): DayRecord | null => {
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

const readMockDay = (date: string): DayRecord | null => {
  if (mockWindow === null) mockWindow = buildMockWindow();
  return mockWindow.get(date) ?? null;
};

/** A day's record, or null: before the artifact is staged, outside its span, or absent from the window */
export const getTimetableDay = (date: string): DayRecord | null => {
  if (installedDays !== null) return installedDays.get(date) ?? null;
  return servesBakedTimetable() ? readBakedDay(date) : readMockDay(date);
};

/** Test seam: serves exactly these days (a day absent from the list reads as null) until replaced */
export const __installTimetableDays = (days: DayRecord[]): void => {
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

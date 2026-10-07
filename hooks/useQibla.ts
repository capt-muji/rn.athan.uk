import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { readPlaceName, readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';
import { hasFusedHeading, watchFusedHeading, watchHeadingAccuracy } from '@/modules/qiblaheading';
import logger from '@/shared/logger';
import { alignmentOffset, isAligned, NO_HEADING, shouldTap } from '@/shared/qiblaAlignment';
import { unwrapHeading } from '@/shared/qiblaCompass';
import { type Coordinates, qiblaBearing } from '@/shared/qiblaGeometry';
import { CERTAINTY_CEILING_MS, isCertain, isWarmStream } from '@/shared/qiblaSettle';
import { advanceWave, hasWaved, WAVE_CEILING_MS, type Wave } from '@/shared/qiblaWaveGate';

export interface QiblaState {
  bearing: number | null;
  /** Whether the phone can currently say which way it points */
  hasHeading: boolean;
  permissionDenied: boolean;
  /** Where the bearing was computed FROM: undefined while the geocoder is still looking, null when it found nothing */
  place: string | null | undefined;
  /** Whether the compass arrived on a stream proven warm, so nothing was waited for and nothing arrived to announce */
  arrivedWarm: boolean;
}

/** Long enough to ride out the gaps a settling magnetometer leaves, short enough that a real loss still shows */
const HEADING_GRACE_MS = 1500;

/** What a phone on the fused sensor hands the open in place of a platform heading watch, which the open never starts */
const NOTHING_TO_STOP = (): void => {};

/**
 * How long a phone that reports the fused sensor is given to deliver a first sample before the visit stops waiting.
 *
 * A working phone delivers within half a second. One whose Play services is too old to carry the sensor still
 * reports it and then delivers nothing, and every wait on this screen is counted from a reading, so without this the
 * hint would never clear.
 */
const FUSED_SILENCE_MS = 3000;

/** Past this the qibla itself has moved half a degree, so the fix and the place are worth taking again */
const REPOSITION_METRES = 10_000;

const metresBetween = (a: Coordinates, b: Coordinates): number => {
  const rad = Math.PI / 180;
  const east = (b.longitude - a.longitude) * rad * Math.cos(((a.latitude + b.latitude) / 2) * rad);
  const north = (b.latitude - a.latitude) * rad;

  return Math.hypot(east, north) * 6_371_000;
};

export interface QiblaReadings {
  /** The heading as a continuous angle, so the face never spins the long way round past north */
  heading: SharedValue<number>;
  aligned: SharedValue<boolean>;
}

/**
 * The qibla sheet's whole behaviour: one position, a watched heading, and one tap per crossing onto the line.
 *
 * Nothing is read until `start`, because every sheet in this app mounts at launch and a watch armed at mount would run
 * the magnetometer for the life of the process.
 *
 * Each reading writes the angle to a shared value rather than to state, so the face turns on the UI thread and the
 * heading stream costs no React render.
 */
export const useQibla = (): QiblaState & QiblaReadings & { start: () => Promise<void>; stop: () => void } => {
  const [state, setState] = useState<QiblaState>({
    bearing: null,
    hasHeading: false,
    permissionDenied: false,
    place: undefined,
    arrivedWarm: false,
  });
  const heading = useSharedValue(0);
  const aligned = useSharedValue(false);
  const alignedRef = useRef(false);
  const activeRef = useRef(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const unwatchNativeRef = useRef<(() => void) | null>(null);
  const unwatchFallbackRef = useRef<(() => void) | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Moves on at every close, so a watch that finishes setting up late can tell that its visit is over
  const visitRef = useRef(0);
  const blankRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bearingRef = useRef<number | null>(null);
  const settledRef = useRef(false);
  const positionRef = useRef<Coordinates | null>(null);
  const placeRef = useRef<string | null | undefined>(undefined);
  // Outlives stop(), which is the whole point: it is what a reopen checks the fresh stream against
  const warmHeadingRef = useRef<number | null>(null);
  const confirmRef = useRef<number[]>([]);
  // The gate runs on the heading stream while the accuracy arrives on its own, so the latest reading is held here
  const accuracyRef = useRef<number | undefined>(undefined);
  // The ceiling is measured from the first reading of THIS stream, so a lost fix restarts it rather than firing at once
  const firstReadingAtRef = useRef<number | null>(null);
  // Whether Google's fused sensor is this visit's reader, which decides what the compass waits for
  const fusedRef = useRef(false);
  const waveRef = useRef<Wave | null>(null);

  const clearBlank = useCallback(() => {
    if (!blankRef.current) return;
    clearTimeout(blankRef.current);
    blankRef.current = null;
  }, []);

  const clearSilence = useCallback(() => {
    if (!silenceRef.current) return;
    clearTimeout(silenceRef.current);
    silenceRef.current = null;
  }, []);

  const blank = useCallback(() => {
    blankRef.current = null;
    // The stream is genuinely gone rather than blinking, so the fusion must prove itself again before it is drawn
    settledRef.current = false;
    warmHeadingRef.current = null;
    firstReadingAtRef.current = null;
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    visitRef.current += 1;
    alignedRef.current = false;
    aligned.value = false;
    settledRef.current = false;
    confirmRef.current = [];
    accuracyRef.current = undefined;
    firstReadingAtRef.current = null;
    waveRef.current = null;
    clearBlank();
    clearSilence();
    unwatchRef.current?.();
    unwatchRef.current = null;
    unwatchNativeRef.current?.();
    unwatchNativeRef.current = null;
    unwatchFallbackRef.current?.();
    unwatchFallbackRef.current = null;
    // Kept, the heading outlives the close and the next open paints ONE frame of compass before the gate can
    // shut it: the owner saw the dial flash, then the hint, then the dial. There is no live heading while the
    // watch is torn down, so reporting one would be a lie in any case
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));
  }, [aligned, clearBlank, clearSilence]);

  const processReading = useCallback(
    (trueHeading: number) => {
      if (trueHeading === NO_HEADING) {
        // The magnetometer drops the odd reading while it settles, and unmounting on one resizes the sheet
        alignedRef.current = false;
        aligned.value = false;
        // Stale readings from before the loss would otherwise confirm a warm stream, and the ceiling would fire the
        // instant the fix returned
        confirmRef.current = [];
        firstReadingAtRef.current = null;
        if (!blankRef.current) blankRef.current = setTimeout(blank, HEADING_GRACE_MS);
        return;
      }

      const nowMs = Date.now();
      // Started before the bearing exists, so the ceiling counts from the stream's real start rather than from
      // whenever the position read happened to return
      firstReadingAtRef.current ??= nowMs;

      const bearing = bearingRef.current;
      if (bearing === null) return;

      clearBlank();

      let arrivedWarm = false;

      // The gate LATCHES: once the compass is drawn every later reading reaches the dial, because re-testing per
      // reading would drop exactly the updates made while the user turns the phone
      if (!settledRef.current) {
        const waitedMs = nowMs - firstReadingAtRef.current;

        if (fusedRef.current) {
          // The fused sensor cannot say how sure it is, so the user is asked to wave the phone, and the ceiling
          // keeps one who cannot from being locked out. Every visit earns its own wave: nothing is carried over
          const waved = hasWaved(waveRef.current);
          if (!waved && waitedMs < WAVE_CEILING_MS) return;
          logger.info('QIBLA: compass drawn on the fused sensor', { waved, turns: waveRef.current?.turns, waitedMs });
        } else {
          const remembered = warmHeadingRef.current;
          confirmRef.current = [...confirmRef.current, trueHeading];
          // A reopen meeting the stream it left has already paid for this window once, so re-proving it is pure wait
          arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);

          // The phone is asked rather than timed, and the ceiling keeps one that never answers from locking the screen
          if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;
        }
        settledRef.current = true;
      }

      const nowAligned = isAligned(alignmentOffset(trueHeading, bearing), alignedRef.current);
      // The strongest impact the platform offers, because a blind user feels this instead of reading anything
      if (shouldTap(alignedRef.current, nowAligned)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      alignedRef.current = nowAligned;
      aligned.value = nowAligned;
      heading.value = unwrapHeading(heading.value, trueHeading);
      warmHeadingRef.current = trueHeading;
      setState((previous) => (previous.hasHeading ? previous : { ...previous, hasHeading: true, arrivedWarm }));
    },
    [aligned, blank, clearBlank, heading]
  );

  /**
   * Hands the visit to the platform heading, when the fused sensor reported itself and then delivered nothing.
   *
   * It is the reader of every phone without that sensor, so the visit runs on as one of those: the wave is no
   * longer asked for, and the shorter ceiling draws the compass.
   */
  const fallBack = useCallback(() => {
    logger.warn('QIBLA: the fused sensor delivered nothing, reading the platform heading instead');
    unwatchNativeRef.current?.();
    unwatchNativeRef.current = null;
    fusedRef.current = false;

    const visit = visitRef.current;
    watchHeading(({ trueHeading }) => processReading(trueHeading)).then((unwatch) => {
      // The sheet may have closed while the watch was being set up, and may have opened again since: whether it
      // is open NOW says nothing about whether this watch still belongs to it
      if (visitRef.current !== visit) {
        unwatch();
        return;
      }
      unwatchFallbackRef.current = unwatch;
    });
  }, [processReading]);

  const start = useCallback(async () => {
    activeRef.current = true;
    bearingRef.current = null;

    const granted = await requestQiblaPermission();
    if (!activeRef.current) return;
    if (!granted) {
      setState((previous) => ({ ...previous, permissionDenied: true }));
      return;
    }

    // The heading watch and the position warm up independently, so their startups run together: in series they are
    // what the sheet's blank seconds were
    let unwatchPromise = Promise.resolve(NOTHING_TO_STOP);

    // Where the fused sensor exists it is the ONLY reader of the heading, because a second reader beside the compass
    // degrades both. The native watch is held synchronously, so a close ends it whichever await the open is at
    fusedRef.current = hasFusedHeading();
    if (fusedRef.current) {
      // An open that overtook an earlier one must not strand what that one armed: its listener, or the platform
      // heading it had fallen back to, whether that watch is running or still being set up
      unwatchNativeRef.current?.();
      unwatchFallbackRef.current?.();
      unwatchFallbackRef.current = null;
      visitRef.current += 1;
      unwatchNativeRef.current = watchFusedHeading(({ headingDegrees, attitude }) => {
        clearSilence();
        // Counted before the reading is judged, and before the position is known, so no part of a wave is lost
        waveRef.current = advanceWave(waveRef.current, attitude);
        processReading(headingDegrees);
      });
      clearSilence();
      silenceRef.current = setTimeout(fallBack, FUSED_SILENCE_MS);
    } else {
      unwatchPromise = watchHeading(({ trueHeading }) => processReading(trueHeading));
      unwatchNativeRef.current = watchHeadingAccuracy((accuracyDegrees) => {
        accuracyRef.current = accuracyDegrees;
      });
    }

    // A position from an earlier open draws at once and the fresh read revalidates behind it, because the qibla
    // moves under half a degree across the sort of distance a phone crosses between two opens in one place
    const remembered = positionRef.current;
    if (remembered) {
      bearingRef.current = qiblaBearing(remembered);
      setState((previous) => ({
        ...previous,
        bearing: bearingRef.current,
        permissionDenied: false,
        place: placeRef.current ?? undefined,
      }));
    }

    const position = await readPosition();
    const unwatch = await unwatchPromise;
    // The watch can finish setting up after the sheet closed and its cleanup ran, which would leave the magnetometer
    // armed for the life of the process
    if (!activeRef.current) {
      unwatch();
      return;
    }
    unwatchRef.current = unwatch;

    const moved = !remembered || metresBetween(remembered, position) > REPOSITION_METRES;
    if (!moved) return;

    positionRef.current = position;
    placeRef.current = undefined;
    bearingRef.current = qiblaBearing(position);
    setState((previous) => ({ ...previous, bearing: bearingRef.current, permissionDenied: false, place: undefined }));

    // Not awaited: the geocoder is a network call, and the compass must never wait on a label to start turning
    readPlaceName(position).then((place) => {
      if (!activeRef.current) return;
      placeRef.current = place;
      setState((previous) => ({ ...previous, place }));
    });
  }, [clearSilence, fallBack, processReading]);

  useEffect(() => stop, [stop]);

  return { ...state, heading, aligned, start, stop };
};

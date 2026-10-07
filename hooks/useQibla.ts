import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { readPlaceName, readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';
import { hasFusedHeading, watchFusedHeading, watchHeadingAccuracy } from '@/modules/qiblaheading';
import logger from '@/shared/logger';
import { alignmentOffset, isAligned, NO_HEADING, shouldTap } from '@/shared/qiblaAlignment';
import { unwrapHeading } from '@/shared/qiblaCompass';
import { type Coordinates, qiblaBearing } from '@/shared/qiblaGeometry';
import { isCertain, isWarmStream, WARM_CONFIRM_READINGS } from '@/shared/qiblaSettle';
import { advanceWave, hasWaved, type Wave } from '@/shared/qiblaWaveGate';

export interface QiblaState {
  bearing: number | null;
  /** Whether the phone can currently say which way it points */
  hasHeading: boolean;
  permissionDenied: boolean;
  /** Where the bearing was computed FROM: undefined while the geocoder is still looking, null when it found nothing */
  place: string | null | undefined;
  /** Whether the compass arrived before the hint could be read, so nothing was waited for and nothing is announced */
  arrivedQuietly: boolean;
  /** Whether the phone has gone as long as a wave takes without finding north, so the user is told to try elsewhere */
  lost: boolean;
}

/** Long enough to ride out the gaps a settling magnetometer leaves, short enough that a real loss still shows */
const HEADING_GRACE_MS = 1500;

/** What a phone on the fused sensor hands the open in place of a platform heading watch, which the open never starts */
const NOTHING_TO_STOP = (): void => {};

/**
 * How long the hint must have been up for the compass's arrival to be announced by feel.
 *
 * Sooner than this the hint could not be read, so nothing was waited for and the tap would land as part of the sheet
 * opening. A wave is always announced, because its user is looking at the phone they are moving and not at its screen.
 */
const ARRIVAL_ANNOUNCE_MS = 1000;

/**
 * How long the phone may go without finding north before the user is told to try somewhere else.
 *
 * About the time it takes to notice the hint and wave the phone through it. Nothing reads a sensor to see that wave
 * on a phone without the fused one, so the time a wave takes is what is counted.
 */
const LOST_AFTER_MS = 5000;

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
    arrivedQuietly: false,
    lost: false,
  });
  const heading = useSharedValue(0);
  const aligned = useSharedValue(false);
  const alignedRef = useRef(false);
  const activeRef = useRef(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const unwatchNativeRef = useRef<(() => void) | null>(null);
  const lostRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportedLostRef = useRef(false);
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
  // When the hint last went up: once location is granted, and again when a drawn compass loses its heading
  const waitingSinceRef = useRef(0);
  // Whether Google's fused sensor is this visit's reader, which decides what the compass waits for
  const fusedRef = useRef(false);
  const waveRef = useRef<Wave | null>(null);

  const clearBlank = useCallback(() => {
    if (!blankRef.current) return;
    clearTimeout(blankRef.current);
    blankRef.current = null;
  }, []);

  /** Ends the wait for north, and answers whether the report had already gone up */
  const endLostWait = useCallback((): boolean => {
    const reported = reportedLostRef.current;
    reportedLostRef.current = false;
    if (lostRef.current) clearTimeout(lostRef.current);
    lostRef.current = null;

    return reported;
  }, []);

  /** Starts the wait after which a phone still showing the hint is told that north could not be found */
  const awaitNorth = useCallback(() => {
    endLostWait();
    waitingSinceRef.current = Date.now();
    lostRef.current = setTimeout(() => {
      reportedLostRef.current = true;
      setState((previous) => ({ ...previous, lost: true }));
    }, LOST_AFTER_MS);
  }, [endLostWait]);

  const blank = useCallback(() => {
    blankRef.current = null;
    // Only a compass that was drawn has a hint coming back. A stream that never gave a heading is still inside its
    // first wait, and restarting that on every gap would mean the phone with no north is never told so
    if (settledRef.current) awaitNorth();
    // The stream is genuinely gone rather than blinking, so the fusion must prove itself again before it is drawn
    settledRef.current = false;
    warmHeadingRef.current = null;
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));
  }, [awaitNorth]);

  const stop = useCallback(() => {
    activeRef.current = false;
    alignedRef.current = false;
    aligned.value = false;
    settledRef.current = false;
    confirmRef.current = [];
    accuracyRef.current = undefined;
    waveRef.current = null;
    clearBlank();
    endLostWait();
    unwatchRef.current?.();
    unwatchRef.current = null;
    unwatchNativeRef.current?.();
    unwatchNativeRef.current = null;
    // Kept, the heading outlives the close and the next open paints ONE frame of compass before the gate can
    // shut it: the owner saw the dial flash, then the hint, then the dial. There is no live heading while the
    // watch is torn down, so reporting one would be a lie in any case
    setState((previous) =>
      previous.hasHeading || previous.lost ? { ...previous, hasHeading: false, lost: false } : previous
    );
  }, [aligned, clearBlank, endLostWait]);

  const processReading = useCallback(
    (trueHeading: number) => {
      // A heading watch can outlive the close that should have ended it, when the open that started it was still
      // reading the position. Its readings must not draw, tap or start a wait behind a closed sheet
      if (!activeRef.current) return;

      if (trueHeading === NO_HEADING) {
        // The magnetometer drops the odd reading while it settles, and unmounting on one resizes the sheet
        alignedRef.current = false;
        aligned.value = false;
        // Stale readings from before the loss would otherwise confirm a warm stream
        confirmRef.current = [];
        if (!blankRef.current) blankRef.current = setTimeout(blank, HEADING_GRACE_MS);
        return;
      }

      const bearing = bearingRef.current;
      if (bearing === null) return;

      clearBlank();

      let arrivedQuietly = false;

      // A heading nothing has vouched for is NEVER drawn, however long it is waited on: a wrong qibla is worse than
      // none. The gate LATCHES all the same: once the compass is drawn every later reading reaches the dial, because
      // re-testing per reading would drop exactly the updates made while the user turns the phone
      if (!settledRef.current) {
        const waitedMs = Date.now() - waitingSinceRef.current;

        if (fusedRef.current) {
          // The fused sensor cannot say how sure it is, so the user's wave is what vouches for it. Every visit earns
          // its own wave: nothing is carried over
          if (!hasWaved(waveRef.current)) return;
          logger.info('QIBLA: compass drawn after a wave', { waitedMs });
        } else {
          const remembered = warmHeadingRef.current;
          // Only the latest few are ever read, and a phone that is never sure would otherwise grow this for ever
          confirmRef.current = [...confirmRef.current, trueHeading].slice(-WARM_CONFIRM_READINGS);
          // A reopen meeting the stream it left has already been vouched for, so re-proving it is pure wait
          const arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);

          // The phone is asked how sure it is, and one that never says it is sure enough is never drawn
          if (!arrivedWarm && !isCertain(accuracyRef.current)) return;
          arrivedQuietly = waitedMs < ARRIVAL_ANNOUNCE_MS;
        }
        settledRef.current = true;
        endLostWait();
      }

      const nowAligned = isAligned(alignmentOffset(trueHeading, bearing), alignedRef.current);
      // The strongest impact the platform offers, because a blind user feels this instead of reading anything
      if (shouldTap(alignedRef.current, nowAligned)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      alignedRef.current = nowAligned;
      aligned.value = nowAligned;
      heading.value = unwrapHeading(heading.value, trueHeading);
      warmHeadingRef.current = trueHeading;
      setState((previous) =>
        previous.hasHeading ? previous : { ...previous, hasHeading: true, arrivedQuietly, lost: false }
      );
    },
    [aligned, blank, clearBlank, endLostWait, heading]
  );

  const start = useCallback(async () => {
    activeRef.current = true;
    bearingRef.current = null;

    const granted = await requestQiblaPermission();
    if (!activeRef.current) return;
    if (!granted) {
      setState((previous) => ({ ...previous, permissionDenied: true }));
      return;
    }

    awaitNorth();

    // The heading watch and the position warm up independently, so their startups run together: in series they are
    // what the sheet's blank seconds were
    let unwatchPromise = Promise.resolve(NOTHING_TO_STOP);

    // Where the fused sensor exists it is the ONLY reader of the heading, because a second reader beside the compass
    // degrades both. The native watch is held synchronously, so a close ends it whichever await the open is at
    fusedRef.current = hasFusedHeading();
    if (fusedRef.current) {
      // An open that overtook an earlier one, while the permission prompt was up, must not strand its listener
      unwatchNativeRef.current?.();
      unwatchNativeRef.current = watchFusedHeading(({ headingDegrees, attitude }) => {
        // A sensor that is delivering has not lost north. All it lacks is the wave the hint is already asking for,
        // so the report is not owed, and is taken back if a slow first sample let it go up
        if (endLostWait()) setState((previous) => ({ ...previous, lost: false }));
        // Counted before the reading is judged, and before the position is known, so no part of a wave is lost
        waveRef.current = advanceWave(waveRef.current, attitude);
        processReading(headingDegrees);
      });
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
  }, [awaitNorth, endLostWait, processReading]);

  useEffect(() => stop, [stop]);

  return { ...state, heading, aligned, start, stop };
};

import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { readPlaceName, readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';
import { type QiblaDiagnostic, watchQiblaDiagnostic } from '@/modules/qiblaheading';
import { FEATURE_FLAGS } from '@/shared/flags';
import { alignmentOffset, isAligned, NO_HEADING, shouldTap } from '@/shared/qiblaAlignment';
import { unwrapHeading } from '@/shared/qiblaCompass';
import { type Coordinates, qiblaBearing } from '@/shared/qiblaGeometry';
import { type HeadingSample, hasSettled, isWarmStream, trailingWindow } from '@/shared/qiblaSettle';

export interface QiblaState {
  bearing: number | null;
  /** Whether the phone can currently say which way it points */
  hasHeading: boolean;
  permissionDenied: boolean;
  /** Where the bearing was computed FROM: undefined while the geocoder is still looking, null when it found nothing */
  place: string | null | undefined;
  /** What the platform says about its own heading, behind the diagnostic flag. Null until a reading arrives */
  diagnostic: QiblaDiagnostic | null;
  /** Whether the compass arrived on a stream proven warm, so nothing was waited for and nothing arrived to announce */
  arrivedWarm: boolean;
}

/** Long enough to ride out the gaps a settling magnetometer leaves, short enough that a real loss still shows */
const HEADING_GRACE_MS = 1500;

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
    diagnostic: null,
    arrivedWarm: false,
  });
  const heading = useSharedValue(0);
  const aligned = useSharedValue(false);
  const alignedRef = useRef(false);
  const activeRef = useRef(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const unwatchDiagnosticRef = useRef<(() => void) | null>(null);
  const blankRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bearingRef = useRef<number | null>(null);
  const samplesRef = useRef<HeadingSample[]>([]);
  const settledRef = useRef(false);
  const positionRef = useRef<Coordinates | null>(null);
  const placeRef = useRef<string | null | undefined>(undefined);
  // Outlives stop(), which is the whole point: it is what a reopen checks the fresh stream against
  const warmHeadingRef = useRef<number | null>(null);
  const confirmRef = useRef<number[]>([]);

  const clearBlank = useCallback(() => {
    if (!blankRef.current) return;
    clearTimeout(blankRef.current);
    blankRef.current = null;
  }, []);

  const blank = useCallback(() => {
    blankRef.current = null;
    // The stream is genuinely gone rather than blinking, so the fusion must prove itself again before it is drawn
    settledRef.current = false;
    warmHeadingRef.current = null;
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    alignedRef.current = false;
    aligned.value = false;
    samplesRef.current = [];
    settledRef.current = false;
    confirmRef.current = [];
    clearBlank();
    unwatchRef.current?.();
    unwatchRef.current = null;
    unwatchDiagnosticRef.current?.();
    unwatchDiagnosticRef.current = null;
    // Kept, the heading outlives the close and the next open paints ONE frame of compass before the gate can
    // shut it: the owner saw the dial flash, then the hint, then the dial. There is no live heading while the
    // watch is torn down, so reporting one would be a lie in any case
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false, arrivedWarm: false } : previous));
  }, [aligned, clearBlank]);

  const processReading = useCallback(
    (trueHeading: number) => {
      if (trueHeading === NO_HEADING) {
        // The magnetometer drops the odd reading while it settles, and unmounting on one resizes the sheet
        alignedRef.current = false;
        aligned.value = false;
        // A stale half-window would otherwise settle the moment the fix returns, on readings from before it was lost
        samplesRef.current = [];
        confirmRef.current = [];
        if (!blankRef.current) blankRef.current = setTimeout(blank, HEADING_GRACE_MS);
        return;
      }

      // Collected before the bearing exists, so the window fills while the position is still being read
      const nowMs = Date.now();
      const window = trailingWindow([...samplesRef.current, { degrees: trueHeading, atMs: nowMs }], nowMs);
      samplesRef.current = window;

      const bearing = bearingRef.current;
      if (bearing === null) return;

      clearBlank();

      let arrivedWarm = false;

      // The gate LATCHES: a cold fusion's first reading measured about 30 degrees out against 0.71 settled, so the
      // compass waits once for the stream to converge. Re-testing it per reading would drop every update made while
      // the user turns the phone, which is the one moment the dial has to follow.
      if (!settledRef.current) {
        const remembered = warmHeadingRef.current;
        confirmRef.current = [...confirmRef.current, trueHeading];
        // A reopen meeting the stream it left has already paid for this window once, so re-proving it is pure wait
        arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);

        if (!arrivedWarm && !hasSettled(window, nowMs)) return;
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
    const unwatchPromise = watchHeading(({ trueHeading }) => processReading(trueHeading));

    if (FEATURE_FLAGS.qiblaDiagnostic) {
      unwatchDiagnosticRef.current = watchQiblaDiagnostic((diagnostic) =>
        setState((previous) => ({ ...previous, diagnostic }))
      );
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
  }, [processReading]);

  useEffect(() => stop, [stop]);

  return { ...state, heading, aligned, start, stop };
};

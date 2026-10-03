import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { readPlaceName, readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';
import { type QiblaDiagnostic, watchQiblaDiagnostic } from '@/modules/qiblaheading';
import { alignmentOffset, isAligned, NO_HEADING, shouldTap } from '@/shared/qiblaAlignment';
import { unwrapHeading } from '@/shared/qiblaCompass';
import { type Coordinates, qiblaBearing } from '@/shared/qiblaGeometry';
import { CERTAINTY_CEILING_MS, isCertain, isWarmStream } from '@/shared/qiblaSettle';

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
  /** What opened the gate, so a prototype build can report whether the phone's own certainty or the ceiling did */
  openedBy: GateOpening;
}

/** Null until the compass is drawn, then which of the three paths drew it */
export type GateOpening = 'warm' | 'certainty' | 'ceiling' | null;

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
    openedBy: null,
  });
  const heading = useSharedValue(0);
  const aligned = useSharedValue(false);
  const alignedRef = useRef(false);
  const activeRef = useRef(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const unwatchDiagnosticRef = useRef<(() => void) | null>(null);
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
    firstReadingAtRef.current = null;
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    alignedRef.current = false;
    aligned.value = false;
    settledRef.current = false;
    confirmRef.current = [];
    accuracyRef.current = undefined;
    firstReadingAtRef.current = null;
    clearBlank();
    unwatchRef.current?.();
    unwatchRef.current = null;
    unwatchDiagnosticRef.current?.();
    unwatchDiagnosticRef.current = null;
    // Kept, the heading outlives the close and the next open paints ONE frame of compass before the gate can
    // shut it: the owner saw the dial flash, then the hint, then the dial. There is no live heading while the
    // watch is torn down, so reporting one would be a lie in any case
    setState((previous) =>
      previous.hasHeading ? { ...previous, hasHeading: false, arrivedWarm: false, openedBy: null } : previous
    );
  }, [aligned, clearBlank]);

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
      let openedBy: GateOpening = null;

      // The gate LATCHES: once the compass is drawn every later reading reaches the dial, because re-testing per
      // reading would drop exactly the updates made while the user turns the phone.
      //
      // It ASKS the phone rather than timing it. The old span check was a stopwatch: the owner's 20 trials across
      // both phones found the drift test already satisfied on the first reading, so the gate sat holding a correct
      // heading for 2700ms waiting for the clock. The phone reports its own uncertainty in degrees, so that is what
      // decides, and the ceiling is what keeps a phone that never reports one from locking the screen.
      if (!settledRef.current) {
        const remembered = warmHeadingRef.current;
        confirmRef.current = [...confirmRef.current, trueHeading];
        // A reopen meeting the stream it left has already paid for this window once, so re-proving it is pure wait
        arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);

        const waitedMs = nowMs - firstReadingAtRef.current;
        if (arrivedWarm) openedBy = 'warm';
        else if (isCertain(accuracyRef.current)) openedBy = 'certainty';
        else if (waitedMs >= CERTAINTY_CEILING_MS) openedBy = 'ceiling';

        if (openedBy === null) return;
        settledRef.current = true;
      }

      const nowAligned = isAligned(alignmentOffset(trueHeading, bearing), alignedRef.current);
      // The strongest impact the platform offers, because a blind user feels this instead of reading anything
      if (shouldTap(alignedRef.current, nowAligned)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      alignedRef.current = nowAligned;
      aligned.value = nowAligned;
      heading.value = unwrapHeading(heading.value, trueHeading);
      warmHeadingRef.current = trueHeading;
      setState((previous) =>
        previous.hasHeading ? previous : { ...previous, hasHeading: true, arrivedWarm, openedBy }
      );
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

    // Unconditional, because the gate now DECIDES on this reading rather than merely displaying it. Only the
    // readout stays behind the flag.
    unwatchDiagnosticRef.current = watchQiblaDiagnostic((diagnostic) => {
      // FOP attaches its cone to SOME samples only, so a silent sample must leave the last reading standing: taking
      // it as the new value would erase a good reading and strand the gate on the ceiling
      const reported = diagnostic.accuracyDegrees ?? diagnostic.fusedErrorDegrees;
      if (reported !== undefined) accuracyRef.current = reported;
      setState((previous) => ({ ...previous, diagnostic }));
    });

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

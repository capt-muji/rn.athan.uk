import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { readPlaceName, readPosition, requestQiblaPermission, watchHeading } from '@/device/qibla';
import { alignmentOffset, isAligned, NO_HEADING, shouldTap } from '@/shared/qiblaAlignment';
import { unwrapHeading } from '@/shared/qiblaCompass';
import { type Coordinates, qiblaBearing } from '@/shared/qiblaGeometry';

export interface QiblaState {
  bearing: number | null;
  /** Whether the phone can currently say which way it points */
  hasHeading: boolean;
  permissionDenied: boolean;
  /** Where the bearing was computed FROM: undefined while the geocoder is still looking, null when it found nothing */
  place: string | null | undefined;
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
 * Each reading writes the angle to a shared value rather than to state, so the face turns on the UI thread and a
 * twenty-a-second sensor stream costs no React render.
 */
export const useQibla = (): QiblaState & QiblaReadings & { start: () => Promise<void>; stop: () => void } => {
  const [state, setState] = useState<QiblaState>({
    bearing: null,
    hasHeading: false,
    permissionDenied: false,
    place: undefined,
  });
  const heading = useSharedValue(0);
  const aligned = useSharedValue(false);
  const alignedRef = useRef(false);
  const activeRef = useRef(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const blankRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bearingRef = useRef<number | null>(null);
  const heldRef = useRef<number | null>(null);
  const positionRef = useRef<Coordinates | null>(null);
  const placeRef = useRef<string | null | undefined>(undefined);

  const clearBlank = useCallback(() => {
    if (!blankRef.current) return;
    clearTimeout(blankRef.current);
    blankRef.current = null;
  }, []);

  const blank = useCallback(() => {
    blankRef.current = null;
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    alignedRef.current = false;
    aligned.value = false;
    clearBlank();
    unwatchRef.current?.();
    unwatchRef.current = null;
  }, [aligned, clearBlank]);

  const processReading = useCallback(
    (trueHeading: number) => {
      const bearing = bearingRef.current;

      // A reading with no bearing yet is held rather than dropped, so the compass appears the moment both exist
      if (bearing === null) {
        heldRef.current = trueHeading;
        return;
      }

      if (trueHeading === NO_HEADING) {
        // The magnetometer drops the odd reading while it settles, and unmounting on one resizes the sheet
        alignedRef.current = false;
        aligned.value = false;
        if (!blankRef.current) blankRef.current = setTimeout(blank, HEADING_GRACE_MS);
        return;
      }

      clearBlank();
      const nowAligned = isAligned(alignmentOffset(trueHeading, bearing), alignedRef.current);
      // The strongest impact the platform offers, because a blind user feels this instead of reading anything
      if (shouldTap(alignedRef.current, nowAligned)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      alignedRef.current = nowAligned;
      aligned.value = nowAligned;
      heading.value = unwrapHeading(heading.value, trueHeading);
      setState((previous) => (previous.hasHeading ? previous : { ...previous, hasHeading: true }));
    },
    [aligned, blank, clearBlank, heading]
  );

  const start = useCallback(async () => {
    activeRef.current = true;
    bearingRef.current = null;
    heldRef.current = null;

    const granted = await requestQiblaPermission();
    if (!activeRef.current) return;
    if (!granted) {
      setState((previous) => ({ ...previous, permissionDenied: true }));
      return;
    }

    // The magnetometer and the position warm up independently, so their startups run together: in series they are
    // what the sheet's blank seconds were
    const unwatchPromise = watchHeading(({ trueHeading }) => processReading(trueHeading));

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

    const held = heldRef.current;
    heldRef.current = null;
    if (held !== null && held !== NO_HEADING) processReading(held);

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

import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { readPlaceName, readPosition, requestQiblaPermission } from '@/device/qibla';
import { readDeclination } from '@/device/qiblaSensor';
import { alignmentOffset, isAligned, shouldTap } from '@/shared/qiblaAlignment';
import { unwrapHeading } from '@/shared/qiblaCompass';
import { type Coordinates, qiblaBearing } from '@/shared/qiblaGeometry';

export interface QiblaState {
  /** Whether the sheet is open, which is what arms the sensor: it must warm up alongside the fix, not behind it */
  active: boolean;
  bearing: number | null;
  /** Whether the phone can currently say which way it points */
  hasHeading: boolean;
  permissionDenied: boolean;
  /** Where the bearing was computed FROM: undefined while the geocoder is still looking, null when it found nothing */
  place: string | null | undefined;
  /** The angle from magnetic to true north, which Android's sensor needs and iOS has already applied */
  declination: number;
}

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
 * Nothing is read until `start`, because every sheet in this app mounts at launch and a sensor armed at mount would
 * run the gyroscope for the life of the process.
 *
 * Each reading writes the angle to a shared value rather than to state, so the face turns from the sensor's own
 * stream without a React render per reading.
 */
export const useQibla = (): QiblaState &
  QiblaReadings & {
    start: () => Promise<void>;
    stop: () => void;
    /** Fed by the sensor component, which is mounted only while the compass is on screen */
    onHeading: (heading: number) => void;
  } => {
  const [state, setState] = useState<QiblaState>({
    active: false,
    bearing: null,
    hasHeading: false,
    permissionDenied: false,
    place: undefined,
    declination: 0,
  });
  const heading = useSharedValue(0);
  const aligned = useSharedValue(false);
  const alignedRef = useRef(false);
  const activeRef = useRef(false);
  const bearingRef = useRef<number | null>(null);
  const heldRef = useRef<number | null>(null);
  const positionRef = useRef<Coordinates | null>(null);
  const placeRef = useRef<string | null | undefined>(undefined);

  // The sensor unregisters by UNMOUNTING, so the state that keeps it on screen is what has to be cleared here
  const stop = useCallback(() => {
    activeRef.current = false;
    alignedRef.current = false;
    aligned.value = false;
    bearingRef.current = null;
    heldRef.current = null;
    setState((previous) => ({ ...previous, active: false, bearing: null, hasHeading: false }));
  }, [aligned]);

  const processReading = useCallback(
    (trueHeading: number) => {
      const bearing = bearingRef.current;

      // A reading with no bearing yet is held rather than dropped, so the compass appears the moment both exist
      if (bearing === null) {
        heldRef.current = trueHeading;
        return;
      }

      const nowAligned = isAligned(alignmentOffset(trueHeading, bearing), alignedRef.current);
      // The strongest impact the platform offers, because a blind user feels this instead of reading anything
      if (shouldTap(alignedRef.current, nowAligned)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      alignedRef.current = nowAligned;
      aligned.value = nowAligned;
      heading.value = unwrapHeading(heading.value, trueHeading);
      setState((previous) => (previous.hasHeading ? previous : { ...previous, hasHeading: true }));
    },
    [aligned, heading]
  );

  const start = useCallback(async () => {
    activeRef.current = true;
    bearingRef.current = null;
    heldRef.current = null;
    // Armed before anything is awaited, so the gyroscope warms up DURING the permission and position reads rather
    // than after them: its first readings are held until the bearing lands, and the dial then draws already turned
    setState((previous) => ({ ...previous, active: true }));

    const granted = await requestQiblaPermission();
    if (!activeRef.current) return;
    if (!granted) {
      // Disarms the sensor the optimistic start armed: with no position there is no bearing its readings could mean
      setState((previous) => ({ ...previous, active: false, permissionDenied: true }));
      return;
    }

    // Never awaited: it waits on a gated magnetometer that a still phone can leave pending for seconds, and the
    // compass must not sit blank behind it. Until it lands the heading carries no declination, which is under a
    // degree in London and visibly better than no dial at all
    readDeclination().then((declination) => {
      if (!activeRef.current) return;
      setState((previous) => ({ ...previous, declination }));
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
    if (!activeRef.current) return;

    const moved = !remembered || metresBetween(remembered, position) > REPOSITION_METRES;
    if (!moved) return;

    positionRef.current = position;
    placeRef.current = undefined;
    bearingRef.current = qiblaBearing(position);
    setState((previous) => ({ ...previous, bearing: bearingRef.current, permissionDenied: false, place: undefined }));

    const held = heldRef.current;
    heldRef.current = null;
    if (held !== null) processReading(held);

    // Not awaited: the geocoder is a network call, and the compass must never wait on a label to start turning
    readPlaceName(position).then((place) => {
      if (!activeRef.current) return;
      placeRef.current = place;
      setState((previous) => ({ ...previous, place }));
    });
  }, [processReading]);

  useEffect(() => stop, [stop]);

  return { ...state, heading, aligned, start, stop, onHeading: processReading };
};

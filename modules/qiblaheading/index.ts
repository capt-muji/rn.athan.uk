/**
 * JS binding for the native heading module (modules/qiblaheading).
 *
 * `expo-location` reads both platforms' sensors and then keeps back what the qibla needs from them: on iOS it buckets
 * `CLHeading.headingAccuracy` from degrees into 0 to 3, and on Android it never offers Google's Fused Orientation
 * Provider. This module exposes both.
 *
 * Each platform's native side carries one of the two, so a caller asks what the phone HAS rather than which system
 * it runs. That also covers a build whose native side is missing: every export here is then inert.
 */

import type { EventSubscription } from 'expo-modules-core';

import type { Attitude } from '@/shared/qiblaWaveGate';

/** One sample of Google's Fused Orientation Provider, whose heading is the value Google states Google Maps draws */
export type FusedHeading = { headingDegrees: number; attitude: Attitude };

type Listen = (event: string, listener: (payload: never) => void) => EventSubscription;

/** The Android side. It answers false on a phone missing Play services or any of the three sensors Google fuses */
type FusedSide = {
  addListener: Listen;
  isFusedOrientationAvailable: () => boolean;
  startFusedOrientation: () => Promise<boolean>;
  stopFusedOrientation: () => Promise<void>;
  isHeadingAccuracyAvailable?: undefined;
};

/** The iOS side */
type AccuracySide = {
  addListener: Listen;
  isHeadingAccuracyAvailable: () => boolean;
  startHeadingAccuracy: () => Promise<boolean>;
  stopHeadingAccuracy: () => Promise<void>;
  isFusedOrientationAvailable?: undefined;
};

type NativeQiblaHeading = FusedSide | AccuracySide;

let nativeModule: NativeQiblaHeading | null | undefined;

const resolveNative = (): NativeQiblaHeading | null => {
  if (nativeModule === undefined) {
    // Lazy on purpose: an eager expo import would drag the whole barrel into every suite and the
    // launch path for a module only the qibla sheet reaches
    const expo = require('expo') as {
      requireOptionalNativeModule?: (name: string) => NativeQiblaHeading | null;
    };
    nativeModule = expo.requireOptionalNativeModule?.('ExpoQiblaHeading') ?? null;
  }

  return nativeModule;
};

const NOTHING_TO_STOP = (): void => {};

/**
 * Makes a stop function act once.
 *
 * The native stop ends whichever watch is running, so a cleanup that ran a second time would otherwise end a watch
 * that a later open had started.
 */
const once = (stop: () => void): (() => void) => {
  let stopped = false;

  return () => {
    if (stopped) return;
    stopped = true;
    stop();
  };
};

/** Whether this phone carries Google's fused sensor, which is then the only thing that reads its heading */
export const hasFusedHeading = (): boolean => resolveNative()?.isFusedOrientationAvailable?.() ?? false;

/**
 * Watches Google's fused sensor, on a phone that carries it, and answers the function that stops the watch.
 *
 * The returned function is synchronous while the native start is not, because the sheet's cleanup runs
 * synchronously and a watch that resolved afterwards would leave the sensors armed.
 */
export const watchFusedHeading = (onReading: (reading: FusedHeading) => void): (() => void) => {
  const native = resolveNative();
  if (!native?.isFusedOrientationAvailable?.()) return NOTHING_TO_STOP;

  // Subscribed before the sensor starts, so its first sample has somewhere to land
  const subscription = native.addListener('onFusedOrientation', onReading);
  native.startFusedOrientation();

  return once(() => {
    subscription.remove();
    native.stopFusedOrientation();
  });
};

/**
 * Watches how far the iPhone says its own heading may be out, in degrees, and answers the function that stops it.
 *
 * The value is passed on untouched, negatives included: Apple uses a negative for a heading it considers invalid.
 * Synchronous to stop for the reason the fused watch is.
 */
export const watchHeadingAccuracy = (onReading: (accuracyDegrees: number) => void): (() => void) => {
  const native = resolveNative();
  if (!native?.isHeadingAccuracyAvailable?.()) return NOTHING_TO_STOP;

  const subscription = native.addListener('onHeadingAccuracy', ({ accuracyDegrees }: { accuracyDegrees: number }) =>
    onReading(accuracyDegrees)
  );
  native.startHeadingAccuracy();

  return once(() => {
    subscription.remove();
    native.stopHeadingAccuracy();
  });
};

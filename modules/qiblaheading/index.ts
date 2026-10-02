/**
 * JS binding for the native heading diagnostic (modules/qiblaheading).
 *
 * `expo-location` reads both platforms' sensors faithfully and then discards how much to trust the
 * reading: iOS buckets `CLHeading.headingAccuracy` from degrees into 0 to 3, and Android never offers
 * Google's Fused Orientation Provider. This module exposes both.
 *
 * It ADDS a reading beside the one the compass draws and replaces nothing: Google states FOP returns
 * the AOSP Rotation Vector's values in certain cases, and that sensor was measured wrong by an amount
 * that varied with orientation, so the two are compared on a device before either is trusted.
 */

import type { EventSubscription } from 'expo-modules-core';

export type QiblaDiagnostic = {
  /** iOS: CLHeading.headingAccuracy in degrees. Negative means Apple considers the reading invalid */
  accuracyDegrees?: number;
  /** iOS: whether the system asked to show its calibration HUD */
  wantsCalibration?: boolean;
  /** Android: the Fused Orientation Provider heading, the value Google states Google Maps draws */
  fusedHeadingDegrees?: number;
  /** Android: FOP's own error cone, absent on a sample that does not carry one */
  fusedErrorDegrees?: number;
};

/** `headingErrorDegrees` is absent on a sample FOP did not attach a cone to */
type AndroidPayload = { headingDegrees: number; headingErrorDegrees?: number };
type ApplePayload = {
  trueHeading: number;
  magneticHeading: number;
  accuracyDegrees: number;
  wantsCalibration: boolean;
};

type NativeQiblaHeading = {
  addListener?: (event: string, listener: (payload: never) => void) => EventSubscription;
  isFusedOrientationAvailable?: () => boolean;
  startFusedOrientation?: () => Promise<boolean>;
  stopFusedOrientation?: () => Promise<void>;
  isHeadingAccuracyAvailable?: () => boolean;
  startHeadingAccuracy?: () => Promise<boolean>;
  stopHeadingAccuracy?: () => Promise<void>;
};

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

/**
 * Starts whichever diagnostic this platform carries and answers the function that stops it.
 *
 * The platform is chosen by what the module exposes rather than by `Platform.OS`, which also covers a
 * build whose native side is missing: the qibla path has held no platform branch since session 47.
 *
 * The returned function is synchronous while the native starts are not, because the sheet's cleanup
 * runs synchronously and a watch that resolved afterwards would leave the sensors armed.
 */
export const watchQiblaDiagnostic = (onReading: (reading: QiblaDiagnostic) => void): (() => void) => {
  const native = resolveNative();
  if (!native?.addListener) return () => {};

  let stopped = false;
  let subscription: EventSubscription | null = null;
  let stopNative: (() => Promise<void>) | undefined;

  if (native.isFusedOrientationAvailable?.()) {
    subscription = native.addListener('onFusedOrientation', (payload: AndroidPayload) =>
      onReading({ fusedHeadingDegrees: payload.headingDegrees, fusedErrorDegrees: payload.headingErrorDegrees })
    );
    stopNative = native.stopFusedOrientation;
    native.startFusedOrientation?.();
  } else if (native.isHeadingAccuracyAvailable?.()) {
    subscription = native.addListener('onHeadingAccuracy', (payload: ApplePayload) =>
      onReading({ accuracyDegrees: payload.accuracyDegrees, wantsCalibration: payload.wantsCalibration })
    );
    stopNative = native.stopHeadingAccuracy;
    native.startHeadingAccuracy?.();
  }

  return () => {
    if (stopped) return;
    stopped = true;
    subscription?.remove();
    stopNative?.();
  };
};

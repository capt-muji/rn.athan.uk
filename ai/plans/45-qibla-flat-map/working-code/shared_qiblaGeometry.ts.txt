/**
 * Where Makkah lies from where the user stands.
 *
 * Pure arithmetic: no React, no platform, no sensor.
 */

/** A position on the earth */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** The Kaaba, agreeing to 8 metres across five independent sources */
export const KAABA: Coordinates = { latitude: 21.4225, longitude: 39.8262 };

const DEGREES = Math.PI / 180;

/**
 * The great-circle initial bearing to the Kaaba, degrees clockwise from true north.
 *
 * A great circle rather than a flat-map straight line, which is the rhumb line and 71 degrees wrong in Los Angeles.
 */
export const qiblaBearing = (from: Coordinates): number => {
  const deltaLongitude = (KAABA.longitude - from.longitude) * DEGREES;
  const fromLatitude = from.latitude * DEGREES;
  const kaabaLatitude = KAABA.latitude * DEGREES;
  const y = Math.sin(deltaLongitude) * Math.cos(kaabaLatitude);
  const northward = Math.cos(fromLatitude) * Math.sin(kaabaLatitude);
  const sideways = Math.sin(fromLatitude) * Math.cos(kaabaLatitude) * Math.cos(deltaLongitude);
  const x = northward - sideways;

  return (Math.atan2(y, x) / DEGREES + 360) % 360;
};

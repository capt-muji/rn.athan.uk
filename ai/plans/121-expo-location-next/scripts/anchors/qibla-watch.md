/**
 * Starts the heading watch and returns the function that stops it.
 *
 * `trueHeading` is the platform's OWN fused, declination-corrected bearing, passed on untouched: it is the value
 * Google Maps and Apple Maps draw, measured against both on two handsets.
 *
 * It replaces Reanimated's `SensorType.ROTATION`, which was adopted for smoothness and proved inaccurate by an amount
 * that VARIES with orientation, 5 degrees in one attitude and 34 in another, so no constant could correct it.
 *
 * A phone that carries Google's fused sensor reads that instead and never starts this watch.
 */
export const watchHeading = async (onReading: (reading: HeadingReading) => void): Promise<() => void> => {
  const subscription = await Location.watchHeadingAsync(({ trueHeading }) => onReading({ trueHeading }));


/**
 * Whether the phone has reported an uncertainty tight enough to draw on.
 *
 * Absence is not certainty: until the phone has reported, nothing is known. A NEGATIVE value is Apple's sentinel for
 * a heading it considers invalid, which a bare `<=` would open on.
 */
export const isCertain = (accuracyDegrees: number | undefined): boolean =>
  accuracyDegrees !== undefined && accuracyDegrees >= 0 && accuracyDegrees <= CERTAINTY_THRESHOLD_DEGREES;

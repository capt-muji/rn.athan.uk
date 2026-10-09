/**
 * The user's position written the way a person would say it, so the compass can show what it is pointing FROM.
 *
 * A bearing is only trustworthy if the place it was computed for is right, and a user who has moved, or whose phone
 * handed back a stale fix, has no way to tell from a needle alone. The place name is that check.
 *
 * Pure, so every shape the platform can hand back is tested without a device.
 */

/** The parts of a reverse-geocoded address this app will name a place by, all optional as the platform returns them */
export interface PlaceParts {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  country?: string | null;
}

/** Collapses the runs of whitespace a platform sometimes pads its fields with, and drops a blank */
const tidy = (value: string | null | undefined): string | null => {
  const text = value?.replace(/\s+/g, ' ').trim();

  return text ? text : null;
};

/**
 * The place, as "city, country".
 *
 * The locality falls back through the platform's own widening fields, because the narrowest one is null in exactly
 * the places with the fewest landmarks: open country, small islands, and at sea. Each step out is still true, just
 * less precise, and a less precise name is worth far more than a blank.
 *
 * Returns null when nothing is known, so the screen can simply omit the line rather than print a placeholder that
 * would read like a failure.
 */
export const placeName = (parts: PlaceParts | null | undefined): string | null => {
  if (!parts) return null;

  const locality = tidy(parts.city) ?? tidy(parts.district) ?? tidy(parts.subregion) ?? tidy(parts.region);
  const country = tidy(parts.country);

  // A country on its own is a real answer at sea and in open desert; a locality on its own is what a city state gives
  if (!locality) return country;
  if (!country || locality === country) return locality;

  return `${locality}, ${country}`;
};

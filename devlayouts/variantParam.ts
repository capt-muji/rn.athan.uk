/**
 * The harness variant param (T-623): the one-based v query value the
 * screenshot pass deep-links with. Absent or unreadable values open the
 * first variant; out-of-range values clamp to the ends.
 */

export const harnessIndexFromParam = (value: string | string[] | undefined, count: number): number => {
  const first = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  const requested = Number.parseInt(first, 10);
  if (!Number.isFinite(requested)) return 0;
  return Math.min(Math.max(requested - 1, 0), count - 1);
};

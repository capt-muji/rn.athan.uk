/**
 * Version comparison utilities
 * Provides functions for comparing semantic version strings
 */

/**
 * Compares two version strings using semantic versioning rules
 * @param v1 - First version string (e.g. "1.0.33")
 * @param v2 - Second version string (e.g. "1.0.34")
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
};

/**
 * Checks if a remote version is newer than an installed version
 * @param installed - Installed version string (e.g. "1.0.33")
 * @param remote - Remote version string (e.g. "1.0.34")
 * @returns true if remote is newer than installed
 */
export const isNewerVersion = (installed: string, remote: string): boolean => {
  return compareVersions(remote, installed) > 0;
};

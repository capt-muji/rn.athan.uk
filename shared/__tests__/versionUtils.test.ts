import { compareVersions, isNewerVersion } from '../versionUtils';

// =============================================================================
// compareVersions TESTS
// =============================================================================

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('2.5.10', '2.5.10')).toBe(0);
  });

  it('returns 1 when first version is greater (major)', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('10.0.0', '9.0.0')).toBe(1);
  });

  it('returns 1 when first version is greater (minor)', () => {
    expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });

  it('returns 1 when first version is greater (patch)', () => {
    expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
    expect(compareVersions('1.0.34', '1.0.33')).toBe(1);
  });

  it('returns -1 when first version is lesser (major)', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('9.0.0', '10.0.0')).toBe(-1);
  });

  it('returns -1 when first version is lesser (minor)', () => {
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
    expect(compareVersions('1.9.0', '1.10.0')).toBe(-1);
  });

  it('returns -1 when first version is lesser (patch)', () => {
    expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
    expect(compareVersions('1.0.33', '1.0.34')).toBe(-1);
  });

  it('handles different version lengths', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0')).toBe(0);
    expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.0.1', '1.0')).toBe(1);
  });

  it('handles single digit versions', () => {
    expect(compareVersions('1', '2')).toBe(-1);
    expect(compareVersions('2', '1')).toBe(1);
    expect(compareVersions('1', '1')).toBe(0);
  });
});

// =============================================================================
// isNewerVersion TESTS
// =============================================================================

describe('isNewerVersion', () => {
  it('returns true when remote is newer', () => {
    expect(isNewerVersion('1.0.0', '1.0.1')).toBe(true);
    expect(isNewerVersion('1.0.33', '1.0.34')).toBe(true);
    expect(isNewerVersion('1.0.0', '2.0.0')).toBe(true);
  });

  it('returns false when remote is older', () => {
    expect(isNewerVersion('1.0.1', '1.0.0')).toBe(false);
    expect(isNewerVersion('1.0.34', '1.0.33')).toBe(false);
    expect(isNewerVersion('2.0.0', '1.0.0')).toBe(false);
  });

  it('returns false when versions are equal', () => {
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('2.5.10', '2.5.10')).toBe(false);
  });

  it('handles real-world version updates', () => {
    // App store update scenario
    expect(isNewerVersion('1.0.33', '1.0.34')).toBe(true);
    expect(isNewerVersion('1.0.34', '1.1.0')).toBe(true);
    expect(isNewerVersion('1.9.9', '2.0.0')).toBe(true);
  });
});

// =============================================================================
// MALFORMED INPUT TESTS
//
// compareVersions is fed whatever releases.json or the iTunes lookup returns, and
// the app controls neither. Number('v1') is NaN, and `NaN || 0` turned that into 0,
// so a `v` prefix did not merely degrade the comparison — it inverted it.
// =============================================================================

describe('compareVersions with malformed input', () => {
  it('treats a v prefix as the same version, not an older one', () => {
    expect(compareVersions('v1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.1', 'v1.0.0')).toBe(1);
    expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
  });

  it('reports a v-prefixed store version as newer', () => {
    expect(isNewerVersion('1.25.46', 'v1.26.0')).toBe(true);
  });

  it('reads a non-numeric segment as zero rather than inverting', () => {
    expect(compareVersions('1.x.0', '1.0.0')).toBe(0);
  });

  it('does not throw on an absent version', () => {
    expect(() => compareVersions(undefined as unknown as string, '1.0.0')).not.toThrow();
    expect(() => compareVersions('1.0.0', null as unknown as string)).not.toThrow();
  });
});

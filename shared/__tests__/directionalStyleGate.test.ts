/**
 * The gate that keeps physical directional styles out of app source: every left/right
 * edge, margin, padding, border and textAlign must use logical keys, so an RTL locale
 * mirrors the layout by direction alone. A site that is physical on purpose (window-space
 * geometry, canvas math) sits in scripts/directional-styles-allowlist.json with its
 * reason. This is the rule the app must keep, asserted here because no behavioural test
 * can see a style key.
 */

const scanner = jest.requireActual('../../scripts/check-directional-styles') as {
  ROOT: string;
  scanTree: (root?: string) => { file: string; line: number; text: string }[];
  applyAllowlist: (hits: { file: string; line: number; text: string }[]) => {
    remainder: { file: string; line: number; text: string }[];
    stale: { file: string; snippet: string; reason: string }[];
  };
};

describe('app source directional styles', () => {
  it('hold no physical directional style outside the allowlist', () => {
    const { remainder } = scanner.applyAllowlist(scanner.scanTree());

    expect(remainder).toEqual([]);
  });

  it('hold no allowlist entry whose line is gone', () => {
    const { stale } = scanner.applyAllowlist(scanner.scanTree());

    expect(stale).toEqual([]);
  });
});

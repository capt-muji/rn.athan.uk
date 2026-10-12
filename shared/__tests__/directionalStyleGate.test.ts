/**
 * The gate that keeps physical directional styles out of app source: every left/right
 * edge, margin, padding, border-edge and textAlign style in the eight directories the
 * scanner walks must use logical keys (widgets stay physical until 58b; symmetric corner
 * radii carry no direction), so an RTL locale mirrors the layout by direction alone. A
 * site that is physical on purpose (window-space geometry, canvas math) sits in
 * scripts/directional-styles-allowlist.json with its reason. This is the rule the app
 * must keep, asserted here because no behavioural test can see a style key.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const scanner = jest.requireActual('../../scripts/check-directional-styles') as {
  ROOT: string;
  scanTree: (root?: string) => { file: string; line: number; text: string }[];
  applyAllowlist: (
    hits: { file: string; line: number; text: string }[],
    entries?: { file: string; snippet: string; reason: string }[]
  ) => {
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

describe('the scanner', () => {
  it('finds banned lines in scanned source, skipping test files and absent directories', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'directional-gate-'));
    try {
      const components = path.join(root, 'components');
      fs.mkdirSync(components);
      fs.writeFileSync(path.join(components, 'Row.tsx'), 'const a = 1;\n  left: 0,\n');
      fs.writeFileSync(path.join(components, 'Row.test.tsx'), '  left: 0,\n');

      const hits = scanner.scanTree(root);

      expect(hits).toEqual([{ file: 'components/Row.tsx', line: 2, text: 'left: 0,' }]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the allowlist matcher', () => {
  const hit = { file: 'components/Row.tsx', line: 3, text: '  left: 0,' };
  const entry = { file: 'components/Row.tsx', snippet: 'left: 0', reason: 'fixture' };

  it('consumes a hit only when file and snippet both match', () => {
    const exact = scanner.applyAllowlist([hit], [entry]);
    expect(exact.remainder).toEqual([]);
    expect(exact.stale).toEqual([]);

    const otherFile = { ...hit, file: 'components/Other.tsx' };
    const byFileOnly = scanner.applyAllowlist([otherFile], [entry]);
    expect(byFileOnly.remainder).toEqual([otherFile]);
    expect(byFileOnly.stale).toEqual([entry]);

    const otherText = { ...hit, text: '  right: 8,' };
    const bySnippetOnly = scanner.applyAllowlist([otherText], [entry]);
    expect(bySnippetOnly.remainder).toEqual([otherText]);
    expect(bySnippetOnly.stale).toEqual([entry]);
  });

  it('lets each entry absorb exactly one hit, so a duplicated line stays visible', () => {
    const twin = { ...hit, line: 9 };

    const { remainder, stale } = scanner.applyAllowlist([hit, twin], [entry]);

    expect(remainder).toEqual([twin]);
    expect(stale).toEqual([]);
  });
});

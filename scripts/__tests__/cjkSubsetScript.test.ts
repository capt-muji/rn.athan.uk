// The subset script's job table is the shipped truth: after the owner's C3
// ruling (2026-11-01) the zh-Hans and ja pairs are dropped and only KR binds.
// This guard reddens if a candidate mode or a dropped-pair job ever returns:
// the default command must never write the deleted binaries back.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = readFileSync(join(__dirname, '..', 'cjk-subset.mjs'), 'utf8');

const jobBlock = SOURCE.match(/const job = \{([\s\S]*?)\};/)?.[1] ?? '';

describe('the subset script ships the pair-drop alone', () => {
  it('binds only the KR pair', () => {
    expect(jobBlock).toContain('KR: cutKr');
  });

  it('carries no SC or JP job and no candidate modes', () => {
    for (const banned of ['SC:', 'JP:', 'vfPair(', 'plex', 'shipped', 'c1', 'c2']) {
      expect(jobBlock).not.toContain(banned);
    }
  });

  it('takes no candidate argument', () => {
    expect(SOURCE).not.toMatch(/\[c1\|c2\|c3\]/);
    expect(SOURCE).not.toContain("?? 'shipped'");
    expect(SOURCE).not.toMatch(/c1\|c2/);
  });
});

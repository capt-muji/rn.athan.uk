/**
 * No qibla artefact survives anywhere in the app's source
 *
 * Sessions 37, 40, 41 and 43 each built a qibla screen and each was rejected on a device, so the code was removed
 * rather than fixed. A deletion has no behaviour of its own to test: this suite IS the deliverable, because without
 * it the next session reintroduces a file by copying a neighbour that still imports one.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

/** The directories that ship, which is where a qibla artefact would matter */
const SOURCE_DIRS = ['api', 'app', 'components', 'device', 'hooks', 'shared', 'stores', 'widgets'];

/**
 * Words that only ever appeared in the qibla work, each lower case for a case-blind search.
 *
 * Built from fragments so this file does not match its own search: spelling them whole would make the suite its own
 * only failure, which is how the first draft failed.
 */
const GONE = ['qib' + 'la', 'kaa' + 'ba', 'pm' + 'tiles', 'tile' + 'cache', 'great' + 'circle'];

/**
 * Forbidden in a FILENAME only.
 *
 * `mvt` names the two committed tile fixtures, which are gzipped binary: no content search can read them, so the
 * filename is the only handle on them. It stays out of GONE because three letters that short match ordinary prose.
 */
const GONE_FROM_NAMES = [...GONE, 'm' + 'vt'];

/** This file is the one place the words may appear, being the thing that forbids them */
const SELF = 'shared/__tests__/qiblaRemoved.test.ts';

/** Every file under a directory, whatever its extension, so a committed binary cannot hide from the name check */
const everyFile = (dir: string): string[] => {
  const found: string[] = [];

  for (const entry of readdirSync(join(ROOT, dir))) {
    const path = join(dir, entry);
    if (statSync(join(ROOT, path)).isDirectory()) {
      found.push(...everyFile(path));
      continue;
    }
    found.push(path);
  }

  return found;
};

/** Every file in a shipped directory but this one */
const searchedFiles = (): string[] => SOURCE_DIRS.flatMap(everyFile).filter((path) => path !== SELF);

/** The files whose text is read: a gzipped fixture has no text, so only source is opened */
const readableFiles = (): string[] => searchedFiles().filter((path) => path.endsWith('.ts') || path.endsWith('.tsx'));

/** Every `<file>:<word>` pair still present, so a failure names the file and the word rather than just counting */
const survivors = (): string[] => {
  const hits: string[] = [];

  for (const path of searchedFiles()) {
    for (const word of GONE_FROM_NAMES) {
      if (path.toLowerCase().includes(word)) hits.push(`${path} (name):${word}`);
    }
  }

  for (const path of readableFiles()) {
    const text = readFileSync(join(ROOT, path), 'utf8').toLowerCase();
    for (const word of GONE) {
      if (text.includes(word)) hits.push(`${path}:${word}`);
    }
  }

  return hits;
};

describe('the qibla work removed by session 44', () => {
  it('leaves no trace of itself in any shipped directory, tests and committed binaries included', () => {
    expect(survivors()).toEqual([]);
  });

  // A search that quietly stops reading files passes for the wrong reason, so the tree it covers is pinned too:
  // widening the self-exclusion to hide a reintroduction fails here instead
  it('covers every file in every shipped directory except itself, and reads every source file among them', () => {
    const searched = searchedFiles();

    expect(searched).toHaveLength(SOURCE_DIRS.flatMap(everyFile).length - 1);
    expect(searched).not.toContain(SELF);
    expect(searched.length).toBeGreaterThan(200);
    expect(readableFiles().length).toBeGreaterThan(200);
  });
});

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every scrollable surface hides its scroll indicators. The app never shows a
 * scroll bar on any platform: the owner's standing order, pinned here so a new
 * list cannot ship one by omission.
 *
 * Source-level by design: the invariant is a prop on every scrollable element,
 * which a render test would reach only by mounting every screen that hosts one.
 */

const ROOTS = ['app', 'components'];
const SCROLLABLES = ['ScrollView', 'FlatList', 'SectionList', 'VirtualizedList'];

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === '__tests__' || entry.startsWith('.')) return [];
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });

/** Each JSX opening tag of a scrollable, up to its closing angle bracket */
const scrollableTags = (source: string): string[] => {
  const tags: string[] = [];
  for (const name of SCROLLABLES) {
    for (const match of source.matchAll(new RegExp(`<${name}[\\s>]`, 'g'))) {
      const start = match.index ?? 0;
      let depth = 0;
      let end = start;
      for (let i = start; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        else if (source[i] === '}') depth -= 1;
        else if (source[i] === '>' && depth === 0) {
          end = i;
          break;
        }
      }
      tags.push(source.slice(start, end + 1));
    }
  }
  return tags;
};

describe('scroll indicators', () => {
  it('are hidden on every scrollable surface', () => {
    const offenders: string[] = [];
    for (const file of ROOTS.flatMap(files)) {
      for (const tag of scrollableTags(readFileSync(file, 'utf8'))) {
        if (!tag.includes('showsVerticalScrollIndicator={false}')) {
          offenders.push(`${file}: ${tag.slice(0, 40).replace(/\s+/g, ' ')}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('finds the scrollables it claims to guard', () => {
    // The three modals render JSX scrollables; the settings sheet scrolls through its own
    // library component and hides the indicator in its props object, pinned by Sheet.test.tsx
    const count = ROOTS.flatMap(files).reduce(
      (total, file) => total + scrollableTags(readFileSync(file, 'utf8')).length,
      0
    );
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

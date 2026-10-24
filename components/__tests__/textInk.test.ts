import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { REMINDER_CARD, SEGMENT_LABEL, STEPPER_INK } from '@/components/sheets/parts/dim';
import { COLORS } from '@/shared/constants';

/**
 * Text ink is solid: no Text or Animated.Text carries opacity in its own style or
 * animated style, and every colour it paints is solid, alpha exactly 1 - alpha-0 ink
 * is banned too, because Android paints it black rather than nothing. Translucent
 * glyph ink compounds where strokes overlap and invisible ink shows, so dim, fade
 * and hide ride an opaque face colour, never alpha - the owner's standing order,
 * pinned here so no new text can ship translucency or a transparent hide by omission.
 *
 * Source-level by design: the invariant lives in what each element declares (its own
 * style, the styles it names, the hooks its style consumes), which a render test would
 * reach only by mounting every screen. Ancestor opacity that dims a text subtree is
 * pinned by the component suites instead, which assert the colours those conversions
 * paint.
 */

const ROOTS = ['app', 'components'];

/** The hooks whose result is text ink; their colour endpoints are checked where they land on text */
const TEXT_INK_HOOKS = ['useDerivedColor', 'useDerivedVeiledColor'];

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === '__tests__' || entry.startsWith('.')) return [];
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });

/** The text of a balanced bracket run, from its opener to the matching closer */
const bracketBody = (source: string, openAt: number, open: string, close: string): string => {
  let depth = 0;
  for (let i = openAt; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    else if (source[i] === close) {
      depth -= 1;
      if (depth === 0) return source.slice(openAt, i + 1);
    }
  }
  return source.slice(openAt);
};

/** Each Text and Animated.Text opening tag, up to its closing angle bracket at brace depth zero */
const textTags = (source: string): string[] => {
  const tags: string[] = [];
  for (const match of source.matchAll(/<(?:Animated\.|Reanimated\.)?Text[\s>]/g)) {
    const start = match.index ?? 0;
    let depth = 0;
    for (let i = start; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') depth -= 1;
      else if (source[i] === '>' && depth === 0) {
        tags.push(source.slice(start, i + 1));
        break;
      }
    }
  }
  return tags;
};

/** The expression inside a tag's style={...} */
const styleExpressionOf = (tag: string): string | null => {
  const at = tag.search(/style=\{/);
  if (at < 0) return null;
  const body = bracketBody(tag, at + 'style={'.length - 1, '{', '}');
  return body.slice(1, -1);
};

/** Identifiers the file binds to `const name = hook(...)`, with the call's own text */
const hookBindings = (source: string, hook: string): Map<string, string> => {
  const bindings = new Map<string, string>();
  for (const match of source.matchAll(new RegExp(`const (\\w+) = ${hook}\\(`, 'g'))) {
    bindings.set(match[1], bracketBody(source, (match.index ?? 0) + match[0].length - 1, '(', ')'));
  }
  return bindings;
};

/** Identifiers the file binds to any same-line const initializer, so a computed ink (a ternary, a
 * flatten) resolves to the leaves its expression carries */
const colourConsts = (source: string): Map<string, string> => {
  const consts = new Map<string, string>();
  for (const match of source.matchAll(/const (\w+) = ([^\n]+)/g)) {
    consts.set(match[1], match[2]);
  }
  return consts;
};

/** Every style entry of the file's StyleSheet.create blocks, keyed by name */
const sheetEntries = (source: string): Map<string, string> => {
  const entries = new Map<string, string>();
  for (const create of source.matchAll(/StyleSheet\.create\(\{/g)) {
    const block = bracketBody(source, (create.index ?? 0) + create[0].length - 1, '{', '}');
    for (const entry of block.matchAll(/(\w+): \{/g)) {
      entries.set(entry[1], bracketBody(block, (entry.index ?? 0) + entry[0].length - 1, '{', '}'));
    }
  }
  return entries;
};

/** A property's value inside an object literal: runs to the next comma or closer at the value's own depth */
const propertyValue = (key: string, objectText: string): string | null => {
  const at = objectText.search(new RegExp(`(?:^|[,{])\\s*${key}\\s*:`));
  if (at < 0) return null;
  const start = objectText.indexOf(':', at + key.length) + 1;
  let depth = 0;
  for (let i = start; i < objectText.length; i += 1) {
    const char = objectText[i];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === '}' && depth === 0) return objectText.slice(start, i).trim();
    else if (char === ',' && depth === 0) return objectText.slice(start, i).trim();
  }
  return objectText.slice(start).trim();
};

/** A colour's alpha, or null when the value is opaque by kind or out of reach */
const alphaOf = (value: string): number | null => {
  const colour = value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .toLowerCase();
  if (colour === 'transparent') return 0;
  const functional = colour.match(/^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*([\d.]+)%?\s*)?\)$/);
  if (functional) return functional[1] === undefined ? 1 : Number(functional[1]);
  const hex = colour.match(/^#([0-9a-f]+)$/);
  if (hex) {
    const digits = hex[1];
    if (digits.length === 3 || digits.length === 6) return 1;
    if (digits.length === 4) return Number.parseInt(digits[3], 16) / 15;
    if (digits.length === 8) return Number.parseInt(digits.slice(6), 16) / 255;
  }
  return null;
};

/** Every value a dotted path reads out of COLORS, or null when the path leaves the object */
const colourAtPath = (path: string): unknown =>
  path
    .split('.')
    .slice(1)
    .reduce<unknown>((node, key) => {
      if (node !== null && typeof node === 'object' && key in (node as Record<string, unknown>)) {
        return (node as Record<string, unknown>)[key];
      }
      return null;
    }, COLORS);

/** The colour literals a value expression holds: strings, COLORS paths, and the expressions its
 * consts name, expanded once each so a computed ink resolves to the literals inside it */
const colourLeaves = (value: string, consts: Map<string, string>, seen: Set<string> = new Set()): string[] => {
  const leaves: string[] = [];
  for (const token of value.match(/'[^']*'|"[^"]*"|COLORS(?:\.\w+)+|\b[A-Za-z_$][\w$]*\b/g) ?? []) {
    if (token.startsWith("'") || token.startsWith('"') || token.startsWith('COLORS')) leaves.push(token);
    else if (consts.has(token) && !seen.has(token)) {
      seen.add(token);
      leaves.push(...colourLeaves(consts.get(token) as string, consts, seen));
    }
  }
  return leaves;
};

const alphaOfLeaf = (leaf: string): number | null => {
  if (leaf.startsWith('COLORS')) {
    const value = colourAtPath(leaf);
    return typeof value === 'string' ? alphaOf(value) : null;
  }
  return alphaOf(leaf);
};

interface FileFacts {
  consts: Map<string, string>;
  opacityHooks: Map<string, string>;
  inkHooks: Map<string, string>;
  animatedStyles: Map<string, string>;
  sheets: Map<string, string>;
}

const factsOf = (source: string): FileFacts => ({
  consts: colourConsts(source),
  opacityHooks: hookBindings(source, 'useDerivedOpacity'),
  inkHooks: new Map(TEXT_INK_HOOKS.flatMap((hook) => [...hookBindings(source, hook)])),
  animatedStyles: hookBindings(source, 'useAnimatedStyle'),
  sheets: sheetEntries(source),
});

/** The style entries a Text tag's style expression names, resolved from the file's StyleSheet */
const referencedEntries = (style: string, facts: FileFacts): string[] =>
  [...style.matchAll(/[sS]tyles\.(\w+)/g)].flatMap((ref) => {
    const entry = facts.sheets.get(ref[1]);
    return entry === undefined ? [] : [entry];
  });

interface Offence {
  file: string;
  detail: string;
}

/** The offences one source text carries; the file path only names them, so a plant can carry any name */
const sweepSource = (file: string, source: string): Offence[] => {
  const offences: Offence[] = [];
  const facts = factsOf(source);
  for (const tag of textTags(source)) {
    const style = styleExpressionOf(tag);
    if (style === null) continue;
    const where = `${file}: ${tag.slice(0, 60).replace(/\s+/g, ' ')}`;

    const styleSources = [style, ...referencedEntries(style, facts)];
    for (const text of styleSources) {
      if (/[{,]\s*opacity\s*:/.test(text)) {
        offences.push({ file, detail: `${where} declares opacity in a style it names` });
      }
    }

    const fillOpacity = tag.match(/fillOpacity=\{([^}]+)\}/);
    if (fillOpacity && fillOpacity[1].trim() !== '1') {
      offences.push({ file, detail: `${where} carries fillOpacity ${fillOpacity[1].trim()}` });
    }

    for (const [name] of facts.opacityHooks) {
      if (new RegExp(`\\b${name}\\b`).test(style)) {
        offences.push({ file, detail: `${where} carries the opacity style ${name}` });
      }
    }
    for (const [name, body] of facts.animatedStyles) {
      if (new RegExp(`\\b${name}\\b`).test(style) && /[{,]\s*opacity\s*:/.test(body)) {
        offences.push({ file, detail: `${where} carries ${name}, whose animated style sets opacity` });
      }
    }

    const colourSources = [style, ...referencedEntries(style, facts)];
    for (const text of colourSources) {
      const value = propertyValue('color', text);
      if (value === null) continue;
      for (const leaf of colourLeaves(value, facts.consts)) {
        const alpha = alphaOfLeaf(leaf);
        if (alpha !== null && alpha !== 1) {
          offences.push({ file, detail: `${where} paints ${leaf.trim()} at alpha ${alpha}` });
        }
      }
    }

    for (const [name, call] of facts.inkHooks) {
      if (!new RegExp(`\\b${name}\\b`).test(style)) continue;
      for (const key of ['fromColor', 'toColor', 'veilColor']) {
        const value = propertyValue(key, call);
        if (value === null) continue;
        for (const leaf of colourLeaves(value, facts.consts)) {
          const alpha = alphaOfLeaf(leaf);
          if (alpha !== null && alpha !== 1) {
            offences.push({ file, detail: `${where} tweens text ink through ${leaf.trim()} at alpha ${alpha}` });
          }
        }
      }
    }

    for (const [name, body] of facts.animatedStyles) {
      if (!new RegExp(`\\b${name}\\b`).test(style)) continue;
      if (!/(?:^|[{,(])\s*color\s*:/.test(body) || /[{,]\s*backgroundColor\s*:/.test(body)) continue;
      for (const interpolation of body.matchAll(/interpolateColor\([^,]+,\s*\[[^\]]*\],\s*\[([^\]]+)\]\)/g)) {
        for (const leaf of colourLeaves(interpolation[1], facts.consts)) {
          const alpha = alphaOfLeaf(leaf);
          if (alpha !== null && alpha !== 1) {
            offences.push({ file, detail: `${where} tweens text ink through ${leaf.trim()} at alpha ${alpha}` });
          }
        }
      }
    }
  }
  return offences;
};

const sweep = (root: string): Offence[] => files(root).flatMap((file) => sweepSource(file, readFileSync(file, 'utf8')));

/** Every string a role table holds, so a whole state matrix is alpha-checked in one call */
const stringsOf = (node: unknown): string[] =>
  typeof node === 'string' ? [node] : Object.values(node ?? {}).flatMap(stringsOf);

describe('text ink', () => {
  it('is carried by no Text or Animated.Text through opacity, and by no colour through alpha', () => {
    const offences = sweep('components').concat(sweep('app'));
    expect(offences.map((offence) => offence.detail)).toEqual([]);
  });

  // The defect shape ticket 322 found in the tree: a same-line const ternary hides a Text in alpha-0
  // ink. The resolver must reach inside the initializer, or the ban is vacuous for every computed ink
  it('reddens a same-line const ternary that hides a Text in alpha-0 ink', () => {
    const plant = [
      "const hiddenInk = !isCustom ? 'transparent' : isShown ? '#5b77a4' : '#1f3055';",
      'export const Row = () => <Text style={[styles.text, { color: hiddenInk }]}>Reset</Text>;',
    ].join('\n');

    const offences = sweepSource('plant.tsx', plant);

    expect(offences).toHaveLength(1);
    expect(offences[0].detail).toContain("'transparent'");
    expect(offences[0].detail).toContain('alpha 0');
  });

  it('finds the text elements it claims to guard', () => {
    const tags = ROOTS.flatMap(files).reduce((total, file) => total + textTags(readFileSync(file, 'utf8')).length, 0);
    expect(tags).toBeGreaterThanOrEqual(40);
  });

  it('reads a colour channel count of 3, 4, 6 and 8, and a functional alpha', () => {
    expect(alphaOf('#fff')).toBe(1);
    expect(alphaOf('#4800ff32')).toBeCloseTo(0.196);
    expect(alphaOf('#ffffff80')).toBeCloseTo(0.502);
    expect(alphaOf('rgba(1, 2, 3, 0.5)')).toBe(0.5);
    expect(alphaOf('rgb(1, 2, 3)')).toBe(1);
    expect(alphaOf('transparent')).toBe(0);
    expect(alphaOf('white')).toBeNull();
  });

  it('keeps every ruled text role solid, alpha exactly 1', () => {
    const roles = [
      ...Object.values(COLORS.text),
      COLORS.countdown.timeColon,
      COLORS.countdown.pastTimeColon,
      COLORS.countdown.nextTimeColon,
      COLORS.countdown.nextTimeColonExtras,
      COLORS.prayerAgo.text,
      COLORS.qibla.away.ink,
      COLORS.qibla.facing.ink,
      ...stringsOf(REMINDER_CARD.title),
      ...stringsOf(REMINDER_CARD.hint),
      ...stringsOf(REMINDER_CARD.optionLabel),
      ...stringsOf(SEGMENT_LABEL),
      ...stringsOf(STEPPER_INK),
    ];
    for (const role of roles) {
      expect(alphaOf(role)).toBe(1);
    }
  });

  it('keeps the veil ink at the overlay backdrop the prayer list sits on', () => {
    // The overlay gradient's midpoint #080011 plus the veil glow's band-average wash, the ink
    // hidden rows and the ago badge sink toward while the overlay is open (plan doc T-294)
    expect(COLORS.gradient.overlay.veil).toBe('#0b0016');
  });
});

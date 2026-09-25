/**
 * Renderer tests for the two Lock Screen day-list layouts (widgets/LockPrayerWidget.tsx)
 *
 * Layouts 4 and 5 carry the whole day as absolute times: one column for the
 * extras schedule, two columns for the standard one. Both register for
 * accessoryRectangular alone, so neither reads the widget family. This suite
 * evaluates the real module with the swift-ui globals mocked and expands
 * function components the way the widget runtime does, pinning the row tiers,
 * the split, the single text size per layout, the absence of anything ticking,
 * and the two states the builder actually emits (no props, and a terminal
 * stale entry).
 */

type MarkerNode = { marker: string; props: Record<string, unknown> };
type Element = { type: unknown; props: Record<string, unknown> };

const isElement = (node: unknown): node is Element =>
  node !== null && typeof node === 'object' && 'type' in node && 'props' in node;

const renderTree = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.flatMap((child) => renderTree(child));
  if (!isElement(node)) return node;

  if (typeof node.type === 'function') {
    const rendered = (node.type as (props: Record<string, unknown>) => unknown)(node.props);
    return renderTree(rendered);
  }

  const props = { ...node.props };
  if ('children' in props) props.children = renderTree(props.children);
  return { marker: (node.type as { marker?: string }).marker ?? String(node.type), props };
};

const marker = (name: string) => {
  const component = (props: Record<string, unknown>): MarkerNode => ({
    marker: name,
    props: { ...props, children: renderTree(props.children) },
  });
  return Object.assign(component, { marker: name });
};

const SWIFT_UI = {
  HStack: marker('HStack'),
  Image: marker('Image'),
  Spacer: marker('Spacer'),
  Text: marker('Text'),
  VStack: marker('VStack'),
};

const MODIFIERS = [
  'containerBackground',
  'containerRelativeFrame',
  'fixedSize',
  'font',
  'foregroundStyle',
  'frame',
  'lineLimit',
  'minimumScaleFactor',
  'monospacedDigit',
  'multilineTextAlignment',
  'padding',
].reduce((acc: Record<string, (value: unknown) => { modifier: string; value: unknown }>, name) => {
  acc[name] = (value: unknown) => ({ modifier: name, value });
  return acc;
}, {});

type WidgetModule = Record<string, (props: unknown, environment: unknown) => unknown>;

const loadLayouts = (): WidgetModule => {
  const captured: WidgetModule = {};
  jest.resetModules();
  jest.isolateModules(() => {
    jest.doMock('expo-widgets', () => ({
      createWidget: (name: string, layout: (props: unknown, environment: unknown) => unknown) => {
        captured[name] = layout;
        return {};
      },
    }));
    jest.doMock('@expo/ui/swift-ui', () => SWIFT_UI);
    jest.doMock('@expo/ui/swift-ui/modifiers', () => MODIFIERS);
    require('../../widgets/LockPrayerWidget');
  });
  return captured;
};

/** Every Text node's text, size, weight and colour, in render order */
type StyledText = {
  text: string;
  size?: number;
  weight?: string;
  colour?: unknown;
  modifiers: Array<{ modifier: string; value: unknown }>;
};

const styledTexts = (tree: unknown): StyledText[] => {
  const found: StyledText[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (node !== null && typeof node === 'object' && 'marker' in node) {
      const markerNode = node as MarkerNode;
      if (markerNode.marker === 'Text') {
        const modifiers = (markerNode.props.modifiers ?? []) as Array<{ modifier: string; value: unknown }>;
        const fontValue = modifiers.find((entry) => entry.modifier === 'font')?.value as
          | { size?: number; weight?: string }
          | undefined;
        const colour = modifiers.find((entry) => entry.modifier === 'foregroundStyle')?.value;
        // Array children: the fallback forms interpolate two values into one
        // Text, which arrives as an array and reads empty through a
        // string-only check.
        const children = markerNode.props.children;
        const parts = Array.isArray(children) ? children : [children];
        const label =
          markerNode.props.timerInterval !== undefined
            ? '<countdown>'
            : parts
                .map((part) => (typeof part === 'string' ? part : ''))
                .join('')
                .replace(/\s+/g, ' ')
                .trim();
        found.push({ text: label, size: fontValue?.size, weight: fontValue?.weight, colour, modifiers });
      }
      walk(markerNode.props.children);
    }
  };
  walk(tree);
  return found;
};

const textsOf = (tree: unknown): string[] =>
  styledTexts(tree)
    .map((node) => node.text)
    .filter((text) => text.length > 0);

const hasTimer = (tree: unknown): boolean => styledTexts(tree).some((node) => node.text === '<countdown>');

const STANDARD_ROWS = [
  { name: 'Fajr', time: '05:35' },
  { name: 'Sunrise', time: '06:58' },
  { name: 'Dhuhr', time: '12:52' },
  { name: 'Asr', time: '15:20' },
  { name: 'Magrib', time: '18:11' },
  { name: 'Isha', time: '19:29' },
];

const EXTRAS_ROWS = [
  { name: 'Midnight', time: '00:14' },
  { name: 'Last Third', time: '02:41' },
  { name: 'Suhoor', time: '05:15' },
  { name: 'Duha', time: '07:28' },
];

const FRIDAY_EXTRAS_ROWS = [...EXTRAS_ROWS, { name: 'Istijaba', time: '16:02' }];

// activeIndex 3 is Asr: three rows have passed and two are upcoming, so a
// passed tier cannot be mistaken for an absent one (index 0 could not tell).
const LIVE = {
  v: 5,
  schedule: 'standard',
  theme: 'light',
  nextName: 'Asr',
  nextTime: '15:20',
  nextEpochMs: Date.parse('2026-10-17T15:20:00'),
  prevEpochMs: Date.parse('2026-10-17T12:45:00'),
  dateLabel: 'Saturday, 17 October',
  prayers: STANDARD_ROWS,
  activeIndex: 3,
};

const SOLID = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.6)';
const FAINT = 'rgba(255, 255, 255, 0.35)';

describe('lock widget day-list renderers', () => {
  const layouts = loadLayouts();
  const column = (props: unknown): unknown => renderTree(layouts.ExtrasLockWidget4(props, {}));
  const split = (props: unknown): unknown => renderTree(layouts.PrayerLockWidget5(props, {}));

  it('renders every extras row as a name and an absolute time in one column', () => {
    const texts = textsOf(column({ ...LIVE, prayers: EXTRAS_ROWS, activeIndex: 1 }));

    expect(texts).toEqual(['Midnight', '00:14', 'Last Third', '02:41', 'Suhoor', '05:15', 'Duha', '07:28']);
  });

  it('renders the Friday extras list at five rows', () => {
    const texts = textsOf(column({ ...LIVE, prayers: FRIDAY_EXTRAS_ROWS, activeIndex: 4 }));

    expect(texts).toContain('Istijaba');
    expect(texts).toContain('16:02');
    expect(texts).toHaveLength(10);
  });

  it('splits the six standard rows three and three, first half left', () => {
    const tree = split(LIVE) as MarkerNode;
    const halves = (tree.props.children as MarkerNode[]).map((half) => textsOf(half));

    expect(halves[0]).toEqual(['Fajr', '05:35', 'Sunrise', '06:58', 'Dhuhr', '12:52']);
    expect(halves[1]).toEqual(['Asr', '15:20', 'Magrib', '18:11', 'Isha', '19:29']);
  });

  it('gives the odd row to the left column on a Friday extras list', () => {
    const tree = split({ ...LIVE, prayers: FRIDAY_EXTRAS_ROWS, activeIndex: 4 }) as MarkerNode;
    const halves = (tree.props.children as MarkerNode[]).map((half) => textsOf(half));

    expect(halves[0]).toEqual(['Midnight', '00:14', 'Last Third', '02:41', 'Suhoor', '05:15']);
    expect(halves[1]).toEqual(['Duha', '07:28', 'Istijaba', '16:02']);
  });

  it.each([
    ['one column', column],
    ['two columns', split],
  ])('marks only the active row on %s, and tiers passed against upcoming', (_label, renderPath) => {
    const texts = styledTexts(renderPath(LIVE));

    expect(texts.filter((node) => node.colour === SOLID).map((node) => node.text)).toEqual(['Asr', '15:20']);
    expect(texts.filter((node) => node.weight === 'bold').map((node) => node.text)).toEqual(['Asr', '15:20']);
    expect(texts.filter((node) => node.colour === MUTED).map((node) => node.text)).toEqual([
      'Fajr',
      '05:35',
      'Sunrise',
      '06:58',
      'Dhuhr',
      '12:52',
    ]);
    expect(texts.filter((node) => node.colour === FAINT).map((node) => node.text)).toEqual([
      'Magrib',
      '18:11',
      'Isha',
      '19:29',
    ]);
  });

  // Reads the times as well as the names: a names-only assertion passes while
  // a break inflates every time on the face.
  it.each([
    ['one column', column, 11],
    ['two columns', split, 14],
  ])('sizes every name AND every time on %s alike', (_label, renderPath, size) => {
    for (const node of styledTexts(renderPath(LIVE))) {
      expect(node.size).toBe(size);
    }
  });

  it.each([
    ['one column', column],
    ['two columns', split],
  ])('never ticks anything on %s: absolute times only', (_label, renderPath) => {
    expect(hasTimer(renderPath(LIVE))).toBe(false);
  });

  it.each([
    ['one column', column],
    ['two columns', split],
  ])('renders the gallery placeholder and the terminal card on %s', (_label, renderPath) => {
    expect(textsOf(renderPath(null))).toContain('Open to load times');
    expect(textsOf(renderPath({ ...LIVE, stale: true }))).toContain('Out of date');
    expect(textsOf(renderPath({ ...LIVE, prayers: undefined }))).toContain('Open to load times');
    expect(textsOf(renderPath({ ...LIVE, prayers: [] }))).toContain('Open to load times');
  });

  // -1 is the builder's own signal for a day on screen with no readable row
  // (widgetTimeline.test.ts pins runs of those entries); an absent activeIndex
  // is an entry written by an older app version, which `v` exists to tolerate.
  it.each([
    ['one column', column, -1],
    ['two columns', split, -1],
    ['one column', column, undefined],
    ['two columns', split, undefined],
  ])('lists a held day with no active row on %s, marking nothing', (_label, renderPath, activeIndex) => {
    const held = { ...LIVE, prayers: STANDARD_ROWS.map((row) => ({ ...row, time: '--:--' })), activeIndex };
    const texts = styledTexts(renderPath(held));

    expect(texts.map((node) => node.text)).toEqual([
      'Fajr',
      '--:--',
      'Sunrise',
      '--:--',
      'Dhuhr',
      '--:--',
      'Asr',
      '--:--',
      'Magrib',
      '--:--',
      'Isha',
      '--:--',
    ]);
    expect(texts.every((node) => node.colour === FAINT)).toBe(true);
    expect(texts.every((node) => node.weight === 'medium')).toBe(true);
  });
});

/**
 * Renderer tests for the Lock Screen widget layout (widgets/LockPrayerWidget.tsx)
 *
 * The lock layout renders iOS accessory families only (rectangular + inline)
 * against the swift-ui component globals. This suite evaluates the real
 * module with those globals mocked and expands function components the way
 * the widget runtime does, pinning every branch: live rectangular and
 * inline (with and without a precomputed label), the stale and
 * legacy-entry degradation per family, and the no-props placeholder per
 * family.
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

const textsOf = (tree: unknown): string[] => {
  const found: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (node !== null && typeof node === 'object' && 'marker' in node) {
      const markerNode = node as MarkerNode;
      if (markerNode.marker === 'Text') {
        const children = markerNode.props.children;
        const parts = Array.isArray(children) ? children : [children];
        found.push(
          parts
            .map((part) => {
              if (part === null || part === undefined || typeof part !== 'object') return String(part ?? '');
              const nested = (part as MarkerNode).props?.children;
              return typeof nested === 'string' ? nested : '';
            })
            .join('')
        );
      }
      walk(markerNode.props.children);
    }
  };
  walk(tree);
  return found.map((text) => text.replace(/\s+/g, ' ').trim()).filter((text) => text.length > 0);
};

const LIVE_PROPS = {
  v: 5,
  schedule: 'standard',
  theme: 'light',
  nextName: 'Asr',
  nextTime: '15:20',
  nextEpochMs: Date.parse('2026-10-17T15:20:00'),
  prevEpochMs: Date.parse('2026-10-17T12:45:00'),
  dateLabel: 'Saturday, 17 October',
};

describe('lock widget renderer', () => {
  const layouts = loadLayouts();
  const renderTreeFor = (props: unknown, family: string): unknown =>
    renderTree(layouts.PrayerLockWidget(props, { colorScheme: 'light', widgetFamily: family }));
  const renderTreeFor2 = (props: unknown, family: string): unknown =>
    renderTree(layouts.PrayerLockWidget2(props, { colorScheme: 'light', widgetFamily: family }));
  const renderTreeFor3 = (props: unknown, family: string): unknown =>
    renderTree(layouts.PrayerLockWidget3(props, { colorScheme: 'light', widgetFamily: family }));
  const renderTreeFor4 = (props: unknown, family: string): unknown =>
    renderTree(layouts.PrayerLockWidget4(props, { colorScheme: 'light', widgetFamily: family }));
  const render = (props: unknown, family: string): string[] => textsOf(renderTreeFor(props, family));

  /** Every Text node's font and colour, paired, for hierarchy assertions */
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
          const children = markerNode.props.children;
          const label =
            markerNode.props.timerInterval !== undefined
              ? '<countdown>'
              : typeof children === 'string'
                ? children.replace(/\s+/g, ' ').trim()
                : '';
          found.push({ text: label, size: fontValue?.size, weight: fontValue?.weight, colour, modifiers });
        }
        walk(markerNode.props.children);
      }
    };
    walk(tree);
    return found;
  };

  const MUTED = 'rgba(255, 255, 255, 0.6)';
  const SOLID = '#ffffff';

  /** The self-ticking countdown carries an interval instead of text */
  const tickingIntervalOf = (tree: unknown): unknown => {
    let found: unknown;
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }
      if (node !== null && typeof node === 'object' && 'marker' in node) {
        const markerNode = node as MarkerNode;
        if (markerNode.marker === 'Text' && markerNode.props.timerInterval !== undefined) {
          found = markerNode.props.timerInterval;
        }
        walk(markerNode.props.children);
      }
    };
    walk(tree);
    return found;
  };

  /** The modifiers of the self-ticking countdown Text */
  const collectTickingModifiers = (tree: unknown): Array<{ modifier: string; value: unknown }> => {
    let found: Array<{ modifier: string; value: unknown }> = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }
      if (node !== null && typeof node === 'object' && 'marker' in node) {
        const markerNode = node as MarkerNode;
        if (markerNode.marker === 'Text' && markerNode.props.timerInterval !== undefined) {
          found = (markerNode.props.modifiers ?? []) as Array<{ modifier: string; value: unknown }>;
        }
        walk(markerNode.props.children);
      }
    };
    walk(tree);
    return found;
  };

  it('stacks the name over the ticking countdown on layout 1, with no absolute time', () => {
    const tree = renderTreeFor(LIVE_PROPS, 'accessoryRectangular');
    const all = textsOf(tree);

    expect(all).toEqual(['Asr']);
    expect(tickingIntervalOf(tree)).toEqual({
      lower: new Date(LIVE_PROPS.prevEpochMs),
      upper: new Date(LIVE_PROPS.nextEpochMs),
    });
  });

  it('stacks the name over the absolute time on layout 2, with no countdown', () => {
    const tree = renderTreeFor2(LIVE_PROPS, 'accessoryRectangular');
    const all = textsOf(tree);

    expect(all).toEqual(['Asr', '15:20']);
    expect(tickingIntervalOf(tree)).toBeUndefined();
  });

  it('pairs the name with the ticking countdown on one line for layout 3', () => {
    const tree = renderTreeFor3(LIVE_PROPS, 'accessoryRectangular');

    expect(textsOf(tree)).toContain('Asr');
    expect(textsOf(tree)).not.toContain('15:20');
    expect(tickingIntervalOf(tree)).toEqual({
      lower: new Date(LIVE_PROPS.prevEpochMs),
      upper: new Date(LIVE_PROPS.nextEpochMs),
    });
  });

  it('lays out the centred one-liner as the name and the absolute time for layout 4', () => {
    const tree = renderTreeFor4(LIVE_PROPS, 'accessoryRectangular');
    const all = textsOf(tree);

    // No countdown and no dot in Layout 4 — the rectangular face carries the
    // name and absolute time, centred.
    expect(all).toContain('Asr');
    expect(all).toContain('15:20');
    expect(all).not.toContain('·');
    expect(tickingIntervalOf(tree)).toBeUndefined();
  });

  it('degrades layouts 3 and 4 to the same fallbacks per family', () => {
    for (const render of [renderTreeFor3, renderTreeFor4]) {
      expect(textsOf(render({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular'))).toContain('Out of date');
      expect(textsOf(render({ ...LIVE_PROPS, stale: true }, 'accessoryInline'))).toContain(
        'Athan — open to refresh times'
      );
      expect(textsOf(render(null, 'accessoryRectangular'))).toContain('Open to load times');
      expect(textsOf(render(null, 'accessoryInline'))).toContain('Athan — prayer times');
      const legacy = { ...LIVE_PROPS } as Record<string, unknown>;
      delete legacy.nextEpochMs;
      expect(textsOf(render(legacy, 'accessoryRectangular'))).toContain('Out of date');
      const poisoned: Record<string, unknown> = { ...LIVE_PROPS };
      Object.defineProperty(poisoned, 'nextName', {
        get(): string {
          throw new Error('boom');
        },
      });
      expect(textsOf(render(poisoned, 'accessoryRectangular'))).toContain('Open to load times');
    }
  });

  it('falls back to the absolute time on layouts 3 and 4 inline, which cannot tick', () => {
    for (const render of [renderTreeFor3, renderTreeFor4]) {
      const tree = render(LIVE_PROPS, 'accessoryInline');

      expect(textsOf(tree).join(' ')).toContain('Asr 15:20');
      expect(tickingIntervalOf(tree)).toBeUndefined();
    }
  });

  // The live faces read 17pt on layouts 3-4 and 16pt on layouts 1-2, each
  // floored at or above the old 14pt nominal, so weight and opacity
  // carry the tiers. What recedes is the SECOND reading, which is the
  // countdown beneath the name in layout 1, the time beneath it in layout 2,
  // the countdown beside the name in layout 3, and the time beside it in
  // layout 4. The name itself is bold on every layout.
  it.each([
    ['layout 1', (p: unknown) => renderTreeFor(p, 'accessoryRectangular'), ['<countdown>']],
    ['layout 2', (p: unknown) => renderTreeFor2(p, 'accessoryRectangular'), [LIVE_PROPS.nextTime]],
    ['layout 3', (p: unknown) => renderTreeFor3(p, 'accessoryRectangular'), ['<countdown>']],
    ['layout 4', (p: unknown) => renderTreeFor4(p, 'accessoryRectangular'), [LIVE_PROPS.nextTime]],
  ])('mutes only what recedes on %s and leaves the name bold', (_l, renderPath, muted) => {
    for (const node of styledTexts(renderPath(LIVE_PROPS))) {
      expect(node.colour).toBe(muted.includes(node.text) ? MUTED : SOLID);
      expect(node.weight).toBe(node.text === LIVE_PROPS.nextName ? 'bold' : 'medium');
    }
  });

  it('never mutes a fallback card, which has no absolute time to recede', () => {
    for (const renderPath of [renderTreeFor, renderTreeFor2, renderTreeFor3, renderTreeFor4]) {
      for (const props of [{ ...LIVE_PROPS, stale: true }, null]) {
        for (const node of styledTexts(renderPath(props, 'accessoryRectangular'))) {
          expect(node.colour).toBe(SOLID);
        }
      }
    }
  });

  it('leaves the countdown off the inline face, which cannot tick one', () => {
    const tree = renderTreeFor(LIVE_PROPS, 'accessoryInline');
    const tree2 = renderTreeFor2(LIVE_PROPS, 'accessoryInline');

    expect(textsOf(tree).join(' ')).toContain('Asr 15:20');
    expect(tickingIntervalOf(tree)).toBeUndefined();
    expect(textsOf(tree2).join(' ')).toContain('Asr 15:20');
    expect(tickingIntervalOf(tree2)).toBeUndefined();
  });

  it('degrades a stale entry to the refresh card per family', () => {
    expect(render({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular')).toContain('Out of date');
    expect(render({ ...LIVE_PROPS, stale: true }, 'accessoryInline')).toContain('Athan — open to refresh times');
  });

  it('degrades a legacy entry without segment bounds the same way', () => {
    const legacy = { ...LIVE_PROPS } as Record<string, unknown>;
    delete legacy.nextEpochMs;
    expect(render(legacy, 'accessoryRectangular')).toContain('Out of date');
  });

  it('renders the placeholder per family when props are absent', () => {
    expect(render(null, 'accessoryRectangular')).toContain('Open to load times');
    expect(render(null, 'accessoryInline')).toContain('Athan — prayer times');
  });

  it('degrades a rendering error to the neutral card', () => {
    const poisoned: Record<string, unknown> = { ...LIVE_PROPS };
    Object.defineProperty(poisoned, 'nextName', {
      get(): string {
        throw new Error('boom');
      },
    });
    expect(render(poisoned, 'accessoryRectangular')).toContain('Open to load times');
  });

  it('degrades the centred layout to the same fallbacks', () => {
    expect(textsOf(renderTreeFor2({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular'))).toContain('Out of date');
    expect(textsOf(renderTreeFor2({ ...LIVE_PROPS, stale: true }, 'accessoryInline'))).toContain(
      'Athan — open to refresh times'
    );
    expect(textsOf(renderTreeFor2(null, 'accessoryRectangular'))).toContain('Open to load times');
    expect(textsOf(renderTreeFor2(null, 'accessoryInline'))).toContain('Athan — prayer times');
    const legacy = { ...LIVE_PROPS } as Record<string, unknown>;
    delete legacy.nextEpochMs;
    expect(textsOf(renderTreeFor2(legacy, 'accessoryRectangular'))).toContain('Out of date');
    const poisoned: Record<string, unknown> = { ...LIVE_PROPS };
    Object.defineProperty(poisoned, 'nextName', {
      get(): string {
        throw new Error('boom');
      },
    });
    expect(textsOf(renderTreeFor2(poisoned, 'accessoryRectangular'))).toContain('Open to load times');
  });

  it.each([
    ['layout 1 live', () => renderTreeFor(LIVE_PROPS, 'accessoryRectangular')],
    ['layout 1 stale', () => renderTreeFor({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular')],
    ['layout 1 placeholder', () => renderTreeFor(null, 'accessoryRectangular')],
    ['layout 2 live', () => renderTreeFor2(LIVE_PROPS, 'accessoryRectangular')],
    ['layout 2 stale', () => renderTreeFor2({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular')],
    ['layout 2 placeholder', () => renderTreeFor2(null, 'accessoryRectangular')],
    ['layout 3 live', () => renderTreeFor3(LIVE_PROPS, 'accessoryRectangular')],
    ['layout 3 stale', () => renderTreeFor3({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular')],
    ['layout 3 placeholder', () => renderTreeFor3(null, 'accessoryRectangular')],
    ['layout 4 live', () => renderTreeFor4(LIVE_PROPS, 'accessoryRectangular')],
    ['layout 4 stale', () => renderTreeFor4({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular')],
    ['layout 4 placeholder', () => renderTreeFor4(null, 'accessoryRectangular')],
  ])('sizes %s to the widget container before filling the slot', (_label, renderPath) => {
    const tree = renderPath() as MarkerNode;
    const modifiers = (tree.props.modifiers ?? []) as Array<{ modifier: string; value: unknown }>;
    const relativeIndex = modifiers.findIndex((entry) => entry.modifier === 'containerRelativeFrame');
    const frameIndex = modifiers.findIndex((entry) => entry.modifier === 'frame');

    // The accessory slot proposes no width the root can stretch into, so the
    // root takes the widget container's own width FIRST (innermost modifier)
    // and the stack's default centring finally has room to act in.
    expect(relativeIndex).toBe(0);
    expect(frameIndex).toBeGreaterThan(relativeIndex);
    expect(modifiers[relativeIndex]?.value).toEqual({ axes: 'horizontal' });
  });

  it('keeps the container-width modifier off the inline faces and centres both live blocks', () => {
    for (const render of [renderTreeFor, renderTreeFor2, renderTreeFor3, renderTreeFor4]) {
      const inlineTree = render(LIVE_PROPS, 'accessoryInline') as MarkerNode;
      const inlineModifiers = JSON.stringify(inlineTree.props.modifiers ?? []);
      expect(inlineModifiers).not.toContain('containerRelativeFrame');

      // Centring is the stack default; a leading alignment would undo it.
      const liveRoot = render(LIVE_PROPS, 'accessoryRectangular') as MarkerNode;
      expect(liveRoot.props.alignment).toBeUndefined();
    }
  });

  it('centres the stacked countdown inside its reserved frame', () => {
    // Text(timerInterval:) reserves a worst-case width and parks its glyphs
    // against the leading edge of it (the home hero's §13d lesson); without
    // this modifier the countdown ink reads left-aligned on the glass. The
    // one-line pair anchors its halves at the seam instead, so only the
    // stacked countdown carries the centre alignment.
    const found = collectTickingModifiers(renderTreeFor(LIVE_PROPS, 'accessoryRectangular'));
    expect(found).toContainEqual({ modifier: 'multilineTextAlignment', value: 'center' });
    expect(found).toContainEqual({ modifier: 'monospacedDigit', value: undefined });
  });

  it.each([
    ['layout 3', (p: unknown) => renderTreeFor3(p, 'accessoryRectangular'), '<countdown>'],
    ['layout 4', (p: unknown) => renderTreeFor4(p, 'accessoryRectangular'), LIVE_PROPS.nextTime],
  ])('centres %s as one row rather than two half-anchored shares', (_label, renderPath, secondLabel) => {
    // A long name fills a half-anchored share from the slot's left edge, which
    // is what read as left-aligned in every Extra times row. The row is the
    // glyphs side by side, the stack centres it, and nothing here may take the
    // whole width: an infinity frame on either child puts the pair back on the
    // edge it came from.
    const texts = styledTexts(renderPath(LIVE_PROPS));
    for (const node of texts) {
      expect(node.modifiers.map((entry) => entry.modifier)).not.toContain('padding');
      expect(node.modifiers).not.toContainEqual({ modifier: 'frame', value: { maxWidth: Infinity } });
    }
    expect(texts.find((node) => node.text === secondLabel)?.modifiers).not.toContainEqual({
      modifier: 'frame',
      value: { maxWidth: Infinity, alignment: 'leading' },
    });
  });

  it('centres the stacked layouts line by line inside the slot', () => {
    // Long names overflow a shrink-wrapped stack from the left edge; a
    // full-width, centre-aligned line truncates inside the slot instead.
    for (const renderPath of [renderTreeFor, renderTreeFor2]) {
      for (const node of styledTexts(renderPath(LIVE_PROPS, 'accessoryRectangular'))) {
        expect(node.modifiers).toContainEqual({ modifier: 'multilineTextAlignment', value: 'center' });
        expect(node.modifiers).toContainEqual({
          modifier: 'frame',
          value: { maxWidth: Infinity, alignment: 'center' },
        });
      }
    }
  });

  // T-400: the raised lock type scale, pinned per layout and face. Every
  // raised nominal reads no smaller at its floor than today's nominal 14
  // (17 x 0.83 = 14.11, 16 x 0.88 = 14.08); the inline face stands at 14.
  const imagesOf = (tree: unknown): number[] => {
    const sizes: number[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }
      if (node !== null && typeof node === 'object' && 'marker' in node) {
        const markerNode = node as MarkerNode;
        if (markerNode.marker === 'Image') sizes.push(markerNode.props.size as number);
        walk(markerNode.props.children);
      }
    };
    walk(tree);
    return sizes;
  };

  it.each([
    [
      'layout 1',
      () => renderTreeFor(LIVE_PROPS, 'accessoryRectangular'),
      [
        { text: 'Asr', size: 16, weight: 'bold', floor: 0.88 },
        { text: '<countdown>', size: 16, weight: 'medium', floor: 0.88 },
      ],
    ],
    [
      'layout 2',
      () => renderTreeFor2(LIVE_PROPS, 'accessoryRectangular'),
      [
        { text: 'Asr', size: 16, weight: 'bold', floor: 0.88 },
        { text: '15:20', size: 16, weight: 'medium', floor: 0.88 },
      ],
    ],
    [
      'layout 3',
      () => renderTreeFor3(LIVE_PROPS, 'accessoryRectangular'),
      [
        { text: 'Asr', size: 17, weight: 'bold', floor: 0.6 },
        { text: '<countdown>', size: 17, weight: 'medium', floor: 0.83 },
      ],
    ],
    [
      'layout 4',
      () => renderTreeFor4(LIVE_PROPS, 'accessoryRectangular'),
      [
        { text: 'Asr', size: 17, weight: 'bold', floor: 0.6 },
        { text: '15:20', size: 17, weight: 'medium', floor: 0.83 },
      ],
    ],
  ] as const)('sizes the live %s readings at their raised nominals and floors', (_label, renderPath, pins) => {
    const texts = styledTexts(renderPath());
    expect(texts).toHaveLength(pins.length);
    for (const pin of pins) {
      const node = texts.find((entry) => entry.text === pin.text);
      expect(node?.size).toBe(pin.size);
      expect(node?.weight).toBe(pin.weight);
      expect(node?.modifiers).toContainEqual({ modifier: 'minimumScaleFactor', value: pin.floor });
    }
  });

  it('sizes the inline face at the system-chosen 14, unfloored, on every layout', () => {
    for (const render of [renderTreeFor, renderTreeFor2, renderTreeFor3, renderTreeFor4]) {
      for (const node of styledTexts(render(LIVE_PROPS, 'accessoryInline'))) {
        expect(node.size).toBe(14);
        expect(node.modifiers.map((entry) => entry.modifier)).not.toContain('minimumScaleFactor');
      }
    }
  });

  it('sizes the stale card one point up on every layout (slot 72pt, branch measured on the XS)', () => {
    for (const render of [renderTreeFor, renderTreeFor2, renderTreeFor3, renderTreeFor4]) {
      const tree = render({ ...LIVE_PROPS, stale: true }, 'accessoryRectangular');
      const texts = styledTexts(tree);
      expect(texts.find((node) => node.text === 'Out of date')?.size).toBe(18);
      expect(texts.find((node) => node.text === 'Open app to refresh')?.size).toBe(15);
      expect(imagesOf(tree)).toEqual([18]);
    }
  });

  it('sizes the neutral card one point up on every layout', () => {
    for (const render of [renderTreeFor, renderTreeFor2, renderTreeFor3, renderTreeFor4]) {
      const texts = styledTexts(render(null, 'accessoryRectangular'));
      expect(texts.find((node) => node.text === 'ATHAN')?.size).toBe(12);
      expect(texts.find((node) => node.text === 'Open to load times')?.size).toBe(18);
    }
  });

  it('never pins the layout 1 countdown to its reserved width', () => {
    // fixedSize holds a timer Text at the worst-case width it reserves, which
    // is the overflow that took its digits off the slot's trailing edge.
    const texts = styledTexts(renderTreeFor(LIVE_PROPS, 'accessoryRectangular'));
    const countdown = texts.find((node) => node.text === '<countdown>');

    expect(countdown?.modifiers.map((entry) => entry.modifier)).not.toContain('fixedSize');
  });
});

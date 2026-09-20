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
  'font',
  'foregroundStyle',
  'frame',
  'lineLimit',
  'minimumScaleFactor',
  'monospacedDigit',
  'multilineTextAlignment',
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
  const render = (props: unknown, family: string): string[] => textsOf(renderTreeFor(props, family));

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

  it('pairs the name with the absolute time and puts the ticking countdown below', () => {
    const tree = renderTreeFor(LIVE_PROPS, 'accessoryRectangular');

    expect(textsOf(tree)).toContain('Asr');
    expect(textsOf(tree)).toContain('15:20');
    expect(tickingIntervalOf(tree)).toEqual({
      lower: new Date(LIVE_PROPS.prevEpochMs),
      upper: new Date(LIVE_PROPS.nextEpochMs),
    });
  });

  it('lays out the centred one-liner as name, time, dot, countdown', () => {
    const tree = renderTreeFor2(LIVE_PROPS, 'accessoryRectangular');
    const all = textsOf(tree);

    expect(all).toContain('Asr');
    expect(all).toContain('15:20');
    expect(all).toContain('·');
    expect(tickingIntervalOf(tree)).toEqual({
      lower: new Date(LIVE_PROPS.prevEpochMs),
      upper: new Date(LIVE_PROPS.nextEpochMs),
    });
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
    for (const render of [renderTreeFor, renderTreeFor2]) {
      const inlineTree = render(LIVE_PROPS, 'accessoryInline') as MarkerNode;
      const inlineModifiers = JSON.stringify(inlineTree.props.modifiers ?? []);
      expect(inlineModifiers).not.toContain('containerRelativeFrame');
    }

    // Centring is the stack default; a leading alignment would undo it.
    const liveRoot = renderTreeFor(LIVE_PROPS, 'accessoryRectangular') as MarkerNode;
    const liveRoot2 = renderTreeFor2(LIVE_PROPS, 'accessoryRectangular') as MarkerNode;
    expect(liveRoot.props.alignment).toBeUndefined();
    expect(liveRoot2.props.alignment).toBeUndefined();
  });

  it('centres the ticking digits inside their reserved frame, both layouts', () => {
    // Text(timerInterval:) reserves a worst-case width and parks its glyphs
    // against the leading edge of it (the home hero's §13d lesson); without
    // this modifier the countdown ink reads left-aligned on the glass.
    for (const render of [renderTreeFor, renderTreeFor2]) {
      const tree = render(LIVE_PROPS, 'accessoryRectangular');
      const found = collectTickingModifiers(tree);
      expect(found).toContainEqual({ modifier: 'multilineTextAlignment', value: 'center' });
    }
  });
});

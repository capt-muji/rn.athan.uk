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
  Image: marker('Image'),
  Text: marker('Text'),
  VStack: marker('VStack'),
};

const MODIFIERS = ['font', 'foregroundStyle', 'frame', 'lineLimit', 'monospacedDigit'].reduce(
  (acc: Record<string, (value: unknown) => { modifier: string; value: unknown }>, name) => {
    acc[name] = (value: unknown) => ({ modifier: name, value });
    return acc;
  },
  {}
);

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
  v: 4,
  schedule: 'standard',
  theme: 'light',
  nextName: 'Asr',
  nextTime: '15:20',
  nextEpochMs: Date.parse('2026-10-17T15:20:00'),
  prevEpochMs: Date.parse('2026-10-17T12:45:00'),
  countdownLabel: '1h 12m',
  dateLabel: 'Saturday, 17 October',
};

describe('lock widget renderer', () => {
  const layouts = loadLayouts();
  const render = (props: unknown, family: string): string[] =>
    textsOf(renderTree(layouts.PrayerLockWidget(props, { colorScheme: 'light', widgetFamily: family })));

  it('renders the rectangular header as name plus label with the absolute time below', () => {
    const all = render(LIVE_PROPS, 'accessoryRectangular');
    expect(all).toContain('Asr · 1h 12m');
    expect(all).toContain('15:20');
  });

  it('drops to the bare name when the entry predates the label field', () => {
    const all = render({ ...LIVE_PROPS, countdownLabel: '' }, 'accessoryRectangular');
    expect(all).toContain('Asr');
    expect(all.some((text) => text.includes('·'))).toBe(false);
  });

  it('renders the inline line as name, time and label', () => {
    const all = render(LIVE_PROPS, 'accessoryInline');
    expect(all.join(' ')).toContain('Asr 15:20');
    expect(all.join(' ')).toContain('1h 12m');
  });

  it('hides the label segment inline when it is empty', () => {
    const all = render({ ...LIVE_PROPS, countdownLabel: '' }, 'accessoryInline');
    expect(all.join(' ')).toContain('Asr 15:20');
    expect(all.join(' ')).not.toContain('1h 12m');
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
});

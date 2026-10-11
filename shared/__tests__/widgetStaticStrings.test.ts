/**
 * The widget statics table (D44, R7.2): every neutral, stale and catch card
 * in both widget modules draws its copy from an inline six-language table
 * keyed by the device locale the widget process itself reads through the
 * runtime patch's __expoWidgetDeviceLocale global. This suite pins the
 * rendered bytes to the plan's table row for row, locale for locale, and the
 * unknown-locale fallback to en.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type MarkerNode = { marker: string; props: Record<string, unknown> };
type Element = { type: unknown; props: Record<string, unknown> };

const isElement = (node: unknown): node is Element =>
  node !== null && typeof node === 'object' && 'type' in node && 'props' in node;

/** Expands function components and their children into marker nodes */
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
  RoundedRectangle: marker('RoundedRectangle'),
  Spacer: marker('Spacer'),
  Text: marker('Text'),
  VStack: marker('VStack'),
  ZStack: marker('ZStack'),
};

const JETPACK = (android: boolean) => ({
  Box: android ? marker('Box') : undefined,
  Button: android ? marker('Button') : undefined,
  Column: android ? marker('Column') : undefined,
  Image: android ? marker('Image') : undefined,
  Row: android ? marker('Row') : undefined,
  Spacer: android ? marker('Spacer') : undefined,
  Text: android ? marker('Text') : undefined,
});

const SWIFT_MODIFIER_NAMES = [
  'containerBackground',
  'font',
  'foregroundStyle',
  'frame',
  'kerning',
  'lineLimit',
  'minimumScaleFactor',
  'monospacedDigit',
  'multilineTextAlignment',
  'offset',
  'padding',
  'shadow',
  'strokeBorder',
  'textCase',
];

const SWIFT_MODIFIERS = SWIFT_MODIFIER_NAMES.reduce(
  (acc: Record<string, (...args: unknown[]) => { modifier: string; value: unknown }>, name) => {
    acc[name] = (...args: unknown[]) => ({
      modifier: name,
      value: args.length === 0 ? undefined : args.length === 1 ? args[0] : args,
    });
    return acc;
  },
  {}
);

const ANDROID_MODIFIERS = ['fillMaxHeight', 'fillMaxSize', 'fillMaxWidth', 'height', 'padding', 'width'].reduce(
  (acc: Record<string, (...args: unknown[]) => { modifier: string; value: unknown }>, name) => {
    acc[name] = (...args: unknown[]) => ({
      modifier: name,
      value: args.length === 0 ? undefined : args.length === 1 ? args[0] : args,
    });
    return acc;
  },
  {}
);

type WidgetModule = Record<string, (props: unknown, environment: unknown) => unknown>;

const loadHome = (platform: 'ios' | 'android'): WidgetModule => {
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
    jest.doMock('@expo/ui/swift-ui/modifiers', () => SWIFT_MODIFIERS);
    jest.doMock('@expo/ui/jetpack-compose', () => JETPACK(platform === 'android'));
    jest.doMock('@expo/ui/jetpack-compose/modifiers', () => ANDROID_MODIFIERS);
    require('../../widgets/PrayerWidget');
  });
  return captured;
};

const loadLock = (): WidgetModule => {
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
    jest.doMock('@expo/ui/swift-ui/modifiers', () => {
      const modifiers: Record<string, (...args: unknown[]) => { modifier: string; value: unknown }> = {};
      for (const name of [
        'containerBackground',
        'containerRelativeFrame',
        'font',
        'foregroundStyle',
        'frame',
        'lineLimit',
        'minimumScaleFactor',
        'monospacedDigit',
        'multilineTextAlignment',
        'padding',
        'fixedSize',
      ]) {
        modifiers[name] = (...args: unknown[]) => ({
          modifier: name,
          value: args.length === 0 ? undefined : args.length === 1 ? args[0] : args,
        });
      }
      return modifiers;
    });
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
        found.push(parts.map((part) => (part === null || typeof part !== 'object' ? String(part ?? '') : '')).join(''));
      }
      walk(markerNode.props.children);
    }
  };
  walk(tree);
  return found.map((text) => text.replace(/\s+/g, ' ').trim()).filter((text) => text.length > 0);
};

/** The plan's table: the bytes every inline table must carry verbatim */
const TABLE = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'ai', 'plans', '39-localisation', 'catalogs', 'widget-statics.json'), 'utf8')
) as Record<string, Record<string, string>>;

const LOCALES = ['en', 'ar', 'ms', 'so', 'hi', 'th'] as const;

type LocaleRow = Record<(typeof LOCALES)[number], Record<string, string>>;

const row = (locale: string): Record<string, string> => TABLE[locale];

const staticsTable = (): LocaleRow => {
  const table = {} as LocaleRow;
  for (const locale of LOCALES) table[locale] = row(locale);
  return table;
};

/** Forces the global the runtime patch installs; the widget process's own locale */
const forceDeviceLocale = (locale: string | undefined): void => {
  (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale = locale;
};

describe('the widget statics table', () => {
  const homeIos = loadHome('ios');
  const homeAndroid = loadHome('android');
  const lock = loadLock();
  const table = staticsTable();

  afterEach(() => {
    delete (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale;
    jest.restoreAllMocks();
  });

  const HOME_STALE = {
    v: 7,
    schedule: 'standard' as const,
    theme: 'light' as const,
    nextName: 'Asr',
    nextTime: '15:20',
    nextEpochMs: 1,
    prevEpochMs: 1,
    dateLabel: 'Sat, 17 Oct 2026',
    stale: true,
  };

  const LOCK_STALE = { ...HOME_STALE, dateLabel: 'Sat, 17 Oct 2026' };

  /** A poisoned label forces the home body's catch fallback card */
  const poisonedEntry = (): Record<string, unknown> => {
    const entry: Record<string, unknown> = {
      v: 7,
      schedule: 'standard',
      theme: 'light',
      nextName: 'Asr',
      nextTime: '15:20',
      nextEpochMs: 200,
      prevEpochMs: 100,
      dateLabel: 'Sat, 17 Oct 2026',
    };
    Object.defineProperty(entry, 'dateLabel', {
      get(): string {
        throw new Error('boom');
      },
    });
    return entry;
  };

  it('renders every home and lock neutral site from its locale row', () => {
    for (const locale of LOCALES) {
      forceDeviceLocale(locale);
      const expected = table[locale];

      const androidNeutral = textsOf(renderTree(homeAndroid.PrayerWidget(null, { colorScheme: 'light' })));
      expect(androidNeutral).toEqual(['Athan', expected.subtitle]);

      const iosNeutral = textsOf(
        renderTree(homeIos.PrayerWidget(null, { colorScheme: 'light', widgetFamily: 'systemSmall' }))
      );
      expect(iosNeutral).toEqual(['Athan', expected.subtitle]);

      for (const [name, layout] of [
        ['countdown pair', lock.PrayerLockWidget],
        ['centred', lock.PrayerLockWidget2],
        ['stacked', lock.PrayerLockWidget3],
      ] as const) {
        const inline = textsOf(renderTree(layout(null, { colorScheme: 'light', widgetFamily: 'accessoryInline' })));
        expect(`${name} inline: ${inline.join('/')}`).toBe(`${name} inline: ${expected.inline}`);

        const rect = textsOf(renderTree(layout(null, { colorScheme: 'light', widgetFamily: 'accessoryRectangular' })));
        expect(`${name} rect: ${rect.join('/')}`).toBe(`${name} rect: ${expected.rectTitle}/${expected.rectSubtitle}`);
      }
    }
  });

  it('renders every stale and catch site from its locale row', () => {
    for (const locale of LOCALES) {
      forceDeviceLocale(locale);
      const expected = table[locale];

      const iosStaleSmall = textsOf(
        renderTree(homeIos.PrayerWidget(HOME_STALE, { colorScheme: 'light', widgetFamily: 'systemSmall' }))
      );
      expect(iosStaleSmall).toEqual([expected.staleTitle, expected.refreshLead, expected.refreshTail]);

      const iosStaleMedium = textsOf(
        renderTree(homeIos.PrayerWidget(HOME_STALE, { colorScheme: 'light', widgetFamily: 'systemMedium' }))
      );
      expect(iosStaleMedium).toEqual([expected.staleTitle, expected.refreshLine]);

      const caught = textsOf(
        renderTree(homeIos.PrayerWidget(poisonedEntry(), { colorScheme: 'light', widgetFamily: 'systemSmall' }))
      );
      expect(caught).toEqual(['Athan', expected.catchBody]);

      for (const [name, layout] of [
        ['countdown pair', lock.PrayerLockWidget],
        ['centred', lock.PrayerLockWidget2],
        ['stacked', lock.PrayerLockWidget3],
      ] as const) {
        const staleInline = textsOf(
          renderTree(layout(LOCK_STALE, { colorScheme: 'light', widgetFamily: 'accessoryInline' }))
        );
        expect(`${name} stale inline: ${staleInline.join('/')}`).toBe(`${name} stale inline: ${expected.staleInline}`);

        const staleRect = textsOf(
          renderTree(layout(LOCK_STALE, { colorScheme: 'light', widgetFamily: 'accessoryRectangular' }))
        );
        expect(`${name} stale rect: ${staleRect.join('/')}`).toBe(
          `${name} stale rect: ${expected.staleTitle}/${expected.staleBody}`
        );
      }
    }
  });

  it('renders the v1 Android strings fallback from its locale row', () => {
    // A v1 snapshot carries no strings, so the layout bakes its own copy
    const v1Snapshot = {
      v: 1,
      schedule: 'standard' as const,
      theme: 'light' as const,
      size: 'small' as const,
      days: [
        {
          dateLabel: 'Sat, 17 Oct 2026',
          startEpochMs: 0,
          rows: [{ name: 'Asr', time: '15:20', epochMs: 1 }],
        },
      ],
      horizonEpochMs: 2,
    };

    for (const locale of LOCALES) {
      forceDeviceLocale(locale);
      const expected = table[locale];
      jest.spyOn(Date, 'now').mockReturnValue(10);

      const small = textsOf(renderTree(homeAndroid.PrayerWidget(v1Snapshot, { colorScheme: 'light' })));
      expect(small).toEqual([expected.staleTitle, expected.refreshLead, expected.refreshTail]);

      const medium = textsOf(
        renderTree(homeAndroid.PrayerWidget({ ...v1Snapshot, size: 'medium' }, { colorScheme: 'light' }))
      );
      expect(medium).toEqual([expected.staleTitle, expected.refreshLine]);
    }

    jest.restoreAllMocks();
  });

  it('renders the en row for an unknown locale', () => {
    forceDeviceLocale('zz');
    const expected = table.en;

    const androidNeutral = textsOf(renderTree(homeAndroid.PrayerWidget(null, { colorScheme: 'light' })));
    expect(androidNeutral).toEqual(['Athan', expected.subtitle]);

    const lockInline = textsOf(
      renderTree(lock.PrayerLockWidget(null, { colorScheme: 'light', widgetFamily: 'accessoryInline' }))
    );
    expect(lockInline).toEqual([expected.inline]);

    const iosStale = textsOf(
      renderTree(homeIos.PrayerWidget(HOME_STALE, { colorScheme: 'light', widgetFamily: 'systemSmall' }))
    );
    expect(iosStale).toEqual([expected.staleTitle, expected.refreshLead, expected.refreshTail]);
  });
});

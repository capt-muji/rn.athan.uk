/**
 * Renderer tests for the home widget layout (widgets/PrayerWidget.tsx)
 *
 * The widget runtime evaluates the layout function against platform
 * component globals: @expo/ui/swift-ui on iOS, @expo/ui/jetpack-compose on
 * Android, with function components invoked during tree normalization. This
 * suite reproduces both environments over the REAL module (mocking only the
 * component sources and expo-widgets' createWidget capture), expands the
 * element tree the way the runtime does, and asserts the rendered content:
 *
 * - iOS: the precomputed countdown label from props renders in the swift-ui
 *   composition (regression guard for the Android additions)
 * - Android: the label, active row, day list and stale state are computed
 *   at render time from the snapshot epochs, stamped by props.size
 *
 * The Android label formula must equal formatCountdownMinutes in
 * shared/time.ts; boundary crossings advance the widget without a new push.
 */

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

/** A component whose invocation records its name and expands its children */
const marker = (name: string) => {
  const component = (props: Record<string, unknown>): MarkerNode => ({
    marker: name,
    props: { ...props, children: renderTree(props.children) },
  });
  return Object.assign(component, { marker: name });
};

const SWIFT_UI = {
  Circle: marker('Circle'),
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
  Column: android ? marker('Column') : undefined,
  Image: android ? marker('Image') : undefined,
  Row: android ? marker('Row') : undefined,
  Spacer: android ? marker('Spacer') : undefined,
  Text: android ? marker('Text') : undefined,
});

const MODIFIER_NAMES = [
  'blur',
  'containerBackground',
  'font',
  'foregroundStyle',
  'frame',
  'kerning',
  'lineLimit',
  'minimumScaleFactor',
  'monospacedDigit',
  'offset',
  'padding',
  'scaleEffect',
  'shadow',
  'strokeBorder',
  'textCase',
];

const SWIFT_MODIFIERS = MODIFIER_NAMES.reduce(
  (acc: Record<string, (value: unknown) => { modifier: string; value: unknown }>, name) => {
    acc[name] = (value: unknown) => ({ modifier: name, value });
    return acc;
  },
  {}
);

const ANDROID_MODIFIERS = ['fillMaxHeight', 'fillMaxSize', 'fillMaxWidth', 'height', 'padding', 'width'].reduce(
  (acc: Record<string, (value?: unknown) => { modifier: string; value: unknown }>, name) => {
    acc[name] = (value?: unknown) => ({ modifier: name, value });
    return acc;
  },
  {}
);

type WidgetModule = Record<string, (props: unknown, environment: unknown) => unknown>;

const loadLayouts = (platform: 'ios' | 'android'): WidgetModule => {
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
    // Relative path on purpose: the unit project maps '@/widgets/*' to the
    // push-layer mock; the renderer needs the real layout module, whose only
    // other import is a type-only one that the transform erases.
    require('../../widgets/PrayerWidget');
  });
  return captured;
};

const collect = (tree: unknown): MarkerNode[] => {
  const found: MarkerNode[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (node !== null && typeof node === 'object' && 'marker' in node) {
      found.push(node as MarkerNode);
      walk((node as MarkerNode).props.children);
    }
  };
  walk(tree);
  return found;
};

const textsOf = (tree: unknown): string[] =>
  collect(tree)
    .filter((node) => node.marker === 'Text')
    .map((node) => {
      const children = node.props.children;
      return String(Array.isArray(children) ? children.join('') : (children ?? ''));
    });

// =============================================================================
// FIXTURE: a two-day standard window with mid-window boundaries
// =============================================================================

import { createPrayerDatetime } from '@/shared/time';
import { type PrayerSequence, type ReadablePrayer, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetSnapshot } from '@/shared/widgetTimeline';
import type { PrayerWidgetAndroidProps, PrayerWidgetSettings } from '@/shared/widgetTypes';

const DAY_ONE = '2026-10-17';
const DAY_TWO = '2026-10-18';

const TIMES: [string, string][] = [
  ['Fajr', '05:30'],
  ['Sunrise', '07:10'],
  ['Dhuhr', '12:45'],
  ['Asr', '15:20'],
  ['Magrib', '18:05'],
  ['Isha', '19:40'],
];

const makePrayer = (date: string, time: string, english: string): ReadablePrayer => ({
  type: ScheduleType.Standard,
  english,
  arabic: '',
  datetime: createPrayerDatetime(date, time),
  time,
  belongsToDate: date,
});

const fixtureSequence = (): PrayerSequence => ({
  type: ScheduleType.Standard,
  prayers: TIMES.flatMap(([english, time]) => [makePrayer(DAY_ONE, time, english), makePrayer(DAY_TWO, time, english)]),
});

const SETTINGS: PrayerWidgetSettings = { hijriDate: false };

const androidProps = (over: Partial<PrayerWidgetAndroidProps>): PrayerWidgetAndroidProps => {
  const base = buildPrayerWidgetSnapshot(fixtureSequence(), SETTINGS);
  if (!base) throw new Error('fixture snapshot missing');
  return { ...base, theme: 'light', size: 'small', ...over } as PrayerWidgetAndroidProps;
};

const at = (date: string, time: string): number => createPrayerDatetime(date, time).getTime();

describe('home widget renderer', () => {
  const freezeNow = (epochMs: number): void => {
    jest.spyOn(Date, 'now').mockReturnValue(epochMs);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('iOS path (swift-ui globals)', () => {
    const layouts = loadLayouts('ios');
    const renderHome = (props: unknown, family: string): unknown =>
      renderTree(layouts.PrayerWidget(props, { colorScheme: 'light', widgetFamily: family }));
    const liveProps = () => ({
      v: 4,
      schedule: 'standard' as const,
      theme: 'light' as const,
      nextName: 'Asr',
      nextTime: '15:20',
      nextEpochMs: at(DAY_ONE, '15:20'),
      prevEpochMs: at(DAY_ONE, '12:45'),
      countdownLabel: '1h 12m',
      dateLabel: 'Saturday, 17 October',
      prayers: TIMES.map(([name, time]) => ({ name, time })),
      activeIndex: 3,
    });

    it('renders the precomputed countdown label from props in the swift-ui composition', () => {
      const tree = renderHome(liveProps(), 'systemSmall');

      const markers = new Set(collect(tree).map((node) => node.marker));
      expect(markers.has('VStack')).toBe(true);
      expect(markers.has('Column')).toBe(false);
      expect(textsOf(tree)).toContain('1h 12m');
      expect(textsOf(tree)).toContain('Asr');
      expect(textsOf(tree)).toContain('15:20');
      // Footer shortens the long label: "Saturday, 17 October" -> "Saturday · Lon"
      // (single-token day labels render whole; two-token ones shorten, below)
      expect(textsOf(tree)).toContain('Saturday · Lon');
    });

    it('hides the countdown when the entry predates the label field', () => {
      const tree = renderHome({ ...liveProps(), countdownLabel: '' }, 'systemSmall');
      const all = textsOf(tree);
      expect(all).toContain('Asr');
      expect(all).toContain('15:20');
      expect(all).not.toContain('1h 12m');
    });

    it('renders the medium day list with the active pill in the standard palette', () => {
      const tree = renderHome(liveProps(), 'systemMedium');
      const all = textsOf(tree);
      for (const [name, time] of TIMES) {
        expect(all).toContain(name);
        expect(all).toContain(time);
      }
      const pill = collect(tree).find((node) => node.marker === 'RoundedRectangle');
      expect(pill).toBeDefined();
      const styles = (pill?.props.modifiers as Array<{ modifier: string; value: unknown }>) ?? [];
      expect(styles.some((style) => style.modifier === 'foregroundStyle' && style.value === '#4f46e5')).toBe(true);
    });

    it('colors the extras medium pill rose', () => {
      const tree = renderHome({ ...liveProps(), schedule: 'extra' }, 'systemMedium');
      const pill = collect(tree).find((node) => node.marker === 'RoundedRectangle');
      const styles = (pill?.props.modifiers as Array<{ modifier: string; value: unknown }>) ?? [];
      expect(styles.some((style) => style.modifier === 'foregroundStyle' && style.value === '#db2777')).toBe(true);
    });

    it('falls back to the hero composition when the day list is not renderable', () => {
      const tree = renderHome({ ...liveProps(), activeIndex: -1 }, 'systemMedium');
      expect(collect(tree).some((node) => node.marker === 'RoundedRectangle')).toBe(false);
      expect(textsOf(tree)).toContain('1h 12m');
    });

    it('draws the blur orbs on dark and none on light', () => {
      const dark = renderHome({ ...liveProps(), theme: 'dark' }, 'systemSmall');
      const light = renderHome(liveProps(), 'systemSmall');
      expect(collect(dark).filter((node) => node.marker === 'Circle').length).toBe(4);
      expect(collect(light).filter((node) => node.marker === 'Circle').length).toBe(0);
    });

    it('draws the oversized medium orbs on a dark medium card', () => {
      const darkMedium = renderHome({ ...liveProps(), theme: 'dark' }, 'systemMedium');
      expect(collect(darkMedium).filter((node) => node.marker === 'Circle').length).toBe(4);
    });

    it('renders a legacy entry with no list fields as the hero alone and the bare city footer', () => {
      const legacy = {
        v: 4,
        schedule: 'standard' as const,
        theme: 'light' as const,
        nextName: 'Asr',
        nextTime: '15:20',
        nextEpochMs: at(DAY_ONE, '15:20'),
        prevEpochMs: at(DAY_ONE, '12:45'),
        countdownLabel: '1h 12m',
        dateLabel: '',
      };
      const tree = renderHome(legacy, 'systemMedium');
      const all = textsOf(tree);
      expect(all).toContain('1h 12m');
      expect(all).toContain('Lon');
      expect(collect(tree).some((node) => node.marker === 'RoundedRectangle')).toBe(false);
    });

    it('shortens a Hijri footer to the month prefix', () => {
      const tree = renderHome({ ...liveProps(), dateLabel: 'Rajab 1, 1448' }, 'systemSmall');
      expect(textsOf(tree)).toContain('Raj 1 · Lon');
    });

    it('renders the stale card per family', () => {
      const small = renderHome({ ...liveProps(), stale: true }, 'systemSmall');
      expect(textsOf(small)).toContain('Out of date');
      expect(textsOf(small)).toContain('Open Athan');
      expect(textsOf(small)).toContain('to refresh');

      const medium = renderHome({ ...liveProps(), stale: true }, 'systemMedium');
      expect(textsOf(medium)).toContain('Open Athan to refresh');
    });

    it('degrades a legacy entry without segment bounds to the stale card', () => {
      const legacy = { ...liveProps() } as Record<string, unknown>;
      delete legacy.nextEpochMs;
      expect(textsOf(renderHome(legacy, 'systemSmall'))).toContain('Out of date');
    });

    it('renders the neutral card without props and on a rendering error', () => {
      expect(textsOf(renderHome(null, 'systemSmall'))).toContain('Prayer times for London');

      const poisoned: Record<string, unknown> = { ...liveProps() };
      Object.defineProperty(poisoned, 'dateLabel', {
        get(): string {
          throw new Error('boom');
        },
      });
      expect(textsOf(renderHome(poisoned, 'systemSmall'))).toContain('Open the app to refresh');
    });
  });

  describe('Android path (jetpack globals)', () => {
    const layouts = loadLayouts('android');

    it('computes the label at render from the snapshot epochs', () => {
      // Frozen half a minute into a minute: the ceil rounding is observable
      freezeNow(at(DAY_ONE, '14:08') + 30_000);
      const tree = renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' }));

      const markers = new Set(collect(tree).map((node) => node.marker));
      expect(markers.has('Column')).toBe(true);
      expect(markers.has('VStack')).toBe(false);

      // 15:20 minus 14:08:30 is 71.5 minutes: ceil makes it "1h 12m"
      expect(textsOf(tree)).toContain('1h 12m');
      expect(textsOf(tree)).toContain('ASR');
      expect(textsOf(tree)).toContain('15:20');
    });

    it('advances across a boundary without a new push', () => {
      const props = androidProps({});

      freezeNow(at(DAY_ONE, '14:08'));
      expect(textsOf(renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' })))).toContain('ASR');

      // A prayer's own instant already belongs to the next segment: at
      // exactly 15:20 the widget counts down to Magrib, never to Asr
      freezeNow(at(DAY_ONE, '15:20'));
      expect(textsOf(renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' })))).toContain('MAGRIB');

      freezeNow(at(DAY_ONE, '16:00'));
      expect(textsOf(renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' })))).toContain('MAGRIB');
    });

    it('renders the stale card past the horizon', () => {
      freezeNow(androidProps({}).horizonEpochMs + 60_000);
      const all = textsOf(renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })));
      expect(all).toContain('Out of date');
      expect(all).toContain('Open Athan');
      expect(all).toContain('to refresh');
    });

    it('renders the one-line stale card at medium size', () => {
      freezeNow(androidProps({}).horizonEpochMs + 60_000);
      const all = textsOf(renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' })));
      expect(all).toContain('Open Athan to refresh');
    });

    it('picks the dark palette from the system scheme when props are absent', () => {
      const tree = renderTree(layouts.PrayerWidget(null, { colorScheme: 'dark' }));
      const images = collect(tree).filter((node) => node.marker === 'Image');
      const sources = images.map((node) => (node.props.source as { uri?: string })?.uri);
      expect(sources).toContain('athan_widget_card_dark_small');
    });

    it('renders the dark card under the android runtime', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(layouts.PrayerWidget(androidProps({ theme: 'dark' }), { colorScheme: 'light' }));
      const sources = collect(tree)
        .filter((node) => node.marker === 'Image')
        .map((node) => (node.props.source as { uri?: string })?.uri);
      expect(sources).toContain('athan_widget_card_dark_small');
    });

    it('falls back to the bare city footer when the day label is empty', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const blank = androidProps({});
      for (const day of blank.days) {
        day.dateLabel = '';
      }
      expect(textsOf(renderTree(layouts.PrayerWidget(blank, { colorScheme: 'light' })))).toContain('Lon');
    });

    it('stamps the composition from props.size, not widgetFamily', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const small = collect(
        renderTree(layouts.PrayerWidget(androidProps({ size: 'small' }), { colorScheme: 'light' }))
      );
      const mediumTree = renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' }));
      const medium = collect(mediumTree);

      expect(medium.some((node) => node.marker === 'Row')).toBe(true);
      expect(small.some((node) => node.marker === 'Row')).toBe(false);

      // The medium day list carries every row of the on-screen day and the
      // active pill image behind the Asr row
      const mediumTexts = textsOf(mediumTree);
      for (const [name, time] of TIMES) {
        expect(mediumTexts).toContain(name);
        expect(mediumTexts).toContain(time);
      }
      const pill = medium.find(
        (node) =>
          node.marker === 'Image' && (node.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_')
      );
      expect(pill).toBeDefined();
    });

    it('picks the day list containing the render instant', () => {
      freezeNow(at(DAY_TWO, '13:00'));
      const mediumTexts = textsOf(
        renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' }))
      );
      expect(mediumTexts).toContain('Dhuhr');
    });

    it('picks the new day before noon: a morning render shows the second day, never yesterday', () => {
      // Device-caught regression class (03:09 on the 3T): a noon-anchored
      // day boundary kept yesterday on screen through every morning
      freezeNow(at(DAY_TWO, '03:00'));
      const morning = textsOf(
        renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' }))
      );
      expect(morning).toContain('Dhuhr');
    });

    it('renders the neutral card without props', () => {
      const all = textsOf(renderTree(layouts.PrayerWidget(null, { colorScheme: 'light' })));
      expect(all).toContain('Athan');
      expect(all).toContain('Prayer times for London');
    });

    it('renders the neutral card for an iOS-shaped entry under the android runtime', () => {
      const all = textsOf(
        renderTree(
          layouts.PrayerWidget(
            { v: 4, schedule: 'standard', theme: 'light', nextName: 'Asr', nextTime: '15:20' },
            { colorScheme: 'light' }
          )
        )
      );
      expect(all).toContain('Athan');
      expect(all).toContain('Prayer times for London');
    });

    it('labels a sub-hour countdown without an hours segment', () => {
      freezeNow(at(DAY_ONE, '15:01'));
      expect(textsOf(renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })))).toContain('19m');
    });

    it('labels an exact-hour countdown without a minutes segment', () => {
      freezeNow(at(DAY_ONE, '14:20'));
      expect(textsOf(renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })))).toContain('1h');
    });

    it('shortens a two-token Hijri-style footer to the month prefix', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const hijri = androidProps({});
      const firstDay = hijri.days[0];
      if (!firstDay) throw new Error('fixture day missing');
      firstDay.dateLabel = 'Rajab 1, 1448';
      const nextDay = hijri.days.find((day) =>
        day.rows.some((row) => row === day.rows.find((r) => r.epochMs !== null && r.epochMs > at(DAY_ONE, '14:08')))
      );
      if (nextDay) nextDay.dateLabel = 'Rajab 1, 1448';
      expect(textsOf(renderTree(layouts.PrayerWidget(hijri, { colorScheme: 'light' })))).toContain('Raj 1 · Lon');
    });
  });
});

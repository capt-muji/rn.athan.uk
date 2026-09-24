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
 * - iOS: the segment renders as a self-ticking timer interval in the swift-ui
 *   composition (regression guard for the Android additions)
 * - Android: the label, active row, day list and stale state are computed
 *   at render time from the snapshot epochs, stamped by props.size
 *
 * Boundary crossings advance the Android widget without a new push.
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
  Button: android ? marker('Button') : undefined,
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
  'multilineTextAlignment',
  'offset',
  'padding',
  'scaleEffect',
  'shadow',
  'strokeBorder',
  'textCase',
];

// Positional captures: the Android composition calls the swift-ui padding
// through a positional cast (start, top, end, bottom), so multi-argument
// calls keep every value; single-object calls stay unwrapped
const SWIFT_MODIFIERS = MODIFIER_NAMES.reduce(
  (acc: Record<string, (value: unknown) => { modifier: string; value: unknown }>, name) => {
    acc[name] = (...args: unknown[]) => ({
      modifier: name,
      value: args.length === 0 ? undefined : args.length === 1 ? args[0] : args,
    });
    return acc;
  },
  {}
);

const ANDROID_MODIFIERS = ['fillMaxHeight', 'fillMaxSize', 'fillMaxWidth', 'height', 'padding', 'width'].reduce(
  (acc: Record<string, (value?: unknown) => { modifier: string; value: unknown }>, name) => {
    // Positional captures: padding(0, 0, 0, 16) must keep all four values,
    // single-argument calls stay unwrapped, zero-argument calls stay undefined
    acc[name] = (...args: unknown[]) => ({
      modifier: name,
      value: args.length === 0 ? undefined : args.length === 1 ? args[0] : args,
    });
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

/**
 * The self-ticking countdown: a Text carrying a timerInterval instead of a
 * string. iOS renders it in its own process, so it holds no text to read and
 * only its interval can be asserted.
 */
const tickingIntervalOf = (tree: unknown): { lower: Date; upper: Date } | undefined =>
  collect(tree).find((node) => node.marker === 'Text' && node.props.timerInterval !== undefined)?.props.timerInterval as
    | { lower: Date; upper: Date }
    | undefined;

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
      dateLabel: 'Saturday, 17 October',
      prayers: TIMES.map(([name, time]) => ({ name, time })),
      activeIndex: 3,
    });

    it('leaves the iOS composition untouched by the Android tap target', () => {
      for (const family of ['systemSmall', 'systemMedium']) {
        const tree = renderHome(liveProps(), family);
        expect(collect(tree).filter((node) => node.marker === 'Button')).toHaveLength(0);
      }
    });

    it('counts the segment down as a ticking interval in the swift-ui composition', () => {
      const tree = renderHome(liveProps(), 'systemSmall');

      const markers = new Set(collect(tree).map((node) => node.marker));
      expect(markers.has('VStack')).toBe(true);
      expect(markers.has('Column')).toBe(false);
      expect(textsOf(tree)).toContain('Asr');
      expect(textsOf(tree)).toContain('15:20');
      // Footer keeps only the day: "Saturday, 17 October" -> "Saturday"
      // (single-token day labels render whole; two-token ones shorten, below)
      expect(textsOf(tree)).toContain('Saturday');

      // The countdown is the segment itself, handed to iOS to tick
      expect(tickingIntervalOf(tree)).toEqual({
        lower: new Date(at(DAY_ONE, '12:45')),
        upper: new Date(at(DAY_ONE, '15:20')),
      });
    });

    it('centers the ticking countdown, which SwiftUI would otherwise leave leading', () => {
      // Text(timerInterval:) reserves a worst-case width and parks its glyphs
      // against the leading edge of it, which reads as an off-center hero
      const tree = renderHome(liveProps(), 'systemSmall');
      const timer = collect(tree).find((node) => node.marker === 'Text' && node.props.timerInterval !== undefined);
      const styles = (timer?.props.modifiers as Array<{ modifier: string; value: unknown }>) ?? [];

      expect(styles.some((style) => style.modifier === 'multilineTextAlignment' && style.value === 'center')).toBe(
        true
      );
      // A per-second redraw with proportional digits shuffles sideways
      expect(styles.some((style) => style.modifier === 'monospacedDigit')).toBe(true);
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

    // Owner ruling 2026-09-20 (replacing 2026-09-19): the pill is exactly
    // its row's height — uniform slots, like Android (its shadow stays on iOS)
    it('matches the medium pill to its 23dp row exactly, keeping its shadow', () => {
      const tree = renderHome(liveProps(), 'systemMedium');
      const pill = collect(tree).find((node) => node.marker === 'RoundedRectangle');
      expect(pill).toBeDefined();
      const styles = (pill?.props.modifiers as Array<{ modifier: string; value: unknown }>) ?? [];
      expect(
        styles.some((style) => style.modifier === 'frame' && (style.value as { height?: number }).height === 23)
      ).toBe(true);
      expect(styles.some((style) => style.modifier === 'offset' && (style.value as { y?: number }).y === 69)).toBe(
        true
      );
      expect(styles.some((style) => style.modifier === 'shadow')).toBe(true);
    });

    it('falls back to the hero composition when the day list is not renderable', () => {
      const tree = renderHome({ ...liveProps(), activeIndex: -1 }, 'systemMedium');
      expect(collect(tree).some((node) => node.marker === 'RoundedRectangle')).toBe(false);
      expect(tickingIntervalOf(tree)).toBeDefined();
      expect(textsOf(tree)).toContain('Asr');
    });

    it('draws no runtime orbs on any theme', () => {
      // Owner ruling 2026-09-20: the dark kinds go flat. The runtime blur
      // orbs cost the cold first render (the patch A/B's control isolated
      // them as the cause of the placement mask flash).
      for (const family of ['systemSmall', 'systemMedium'] as const) {
        const dark = renderHome({ ...liveProps(), theme: 'dark' }, family);
        const light = renderHome({ ...liveProps(), theme: 'light' }, family);
        expect(collect(dark).filter((node) => node.marker === 'Circle')).toHaveLength(0);
        expect(collect(light).filter((node) => node.marker === 'Circle')).toHaveLength(0);
      }
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
        dateLabel: '',
      };
      const tree = renderHome(legacy, 'systemMedium');
      const all = textsOf(tree);
      expect(tickingIntervalOf(tree)).toBeDefined();
      expect(all).not.toContain('·');
      expect(collect(tree).some((node) => node.marker === 'RoundedRectangle')).toBe(false);
    });

    it('shortens a Hijri footer to the month prefix', () => {
      const tree = renderHome({ ...liveProps(), dateLabel: 'Rajab 1, 1448' }, 'systemSmall');
      expect(textsOf(tree)).toContain('Raj 1');
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
      expect(textsOf(tree)).toContain('A\u200aS\u200aR');
      expect(textsOf(tree)).toContain('15:20');
    });

    it('advances across a boundary without a new push', () => {
      const props = androidProps({});

      freezeNow(at(DAY_ONE, '14:08'));
      expect(textsOf(renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' })))).toContain('A\u200aS\u200aR');

      // A prayer's own instant already belongs to the next segment: at
      // exactly 15:20 the widget counts down to Magrib, never to Asr
      freezeNow(at(DAY_ONE, '15:20'));
      expect(textsOf(renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' })))).toContain(
        'M\u200aA\u200aG\u200aR\u200aI\u200aB'
      );

      freezeNow(at(DAY_ONE, '16:00'));
      expect(textsOf(renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' })))).toContain(
        'M\u200aA\u200aG\u200aR\u200aI\u200aB'
      );
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

    it('renders an empty footer when the day label is empty', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const blank = androidProps({});
      for (const day of blank.days) {
        day.dateLabel = '';
      }
      expect(textsOf(renderTree(layouts.PrayerWidget(blank, { colorScheme: 'light' })))).toContain('');
    });

    it('stamps the composition from props.size, not widgetFamily', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const mediumTree = renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' }));
      const medium = collect(mediumTree);

      expect(medium.some((node) => node.marker === 'Row')).toBe(true);
      const pillIn = (tree: unknown): boolean =>
        collect(tree).some(
          (node) =>
            node.marker === 'Image' &&
            String((node.props.source as { uri?: string })?.uri ?? '').startsWith('athan_widget_pill_')
        );
      expect(pillIn(mediumTree)).toBe(true);
      const smallTree = renderTree(layouts.PrayerWidget(androidProps({ size: 'small' }), { colorScheme: 'light' }));
      expect(pillIn(smallTree)).toBe(false);

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
        day.rows.some((row) => row === day.rows.find((r) => r.epochMs > at(DAY_ONE, '14:08')))
      );
      if (nextDay) nextDay.dateLabel = 'Rajab 1, 1448';
      expect(textsOf(renderTree(layouts.PrayerWidget(hijri, { colorScheme: 'light' })))).toContain('Raj 1');
    });

    // Owner ruling 2026-09-19: one uniform lifted footer on all 8 kinds
    it('lifts the footer row 16dp above the card bottom on the small kinds', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      for (const theme of ['light', 'dark'] as const) {
        const tree = renderTree(layouts.PrayerWidget(androidProps({ theme }), { colorScheme: 'light' }));
        const footerRow = collect(tree).find(
          (node) =>
            node.marker === 'Row' &&
            (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
              (mod) => mod.modifier === 'padding' && JSON.stringify(mod.value) === '[0,0,0,16]'
            )
        );
        expect(footerRow).toBeDefined();
        // The footer is the day alone now — no separator, no city
        expect(textsOf(footerRow).join('')).not.toContain('·');
        // The row must be taller than its bottom padding, or the footer
        // text clips to nothing on device (owner finding 2026-09-19)
        expect(footerRow?.props.modifiers).toEqual(expect.arrayContaining([{ modifier: 'height', value: 34 }]));
      }
    });

    it('pads the medium composition 16dp at the bottom, both themes', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      for (const theme of ['light', 'dark'] as const) {
        const tree = renderTree(
          layouts.PrayerWidget(androidProps({ theme, size: 'medium' }), { colorScheme: 'light' })
        );
        const outerRow = collect(tree).find(
          (node) =>
            node.marker === 'Row' &&
            (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
              (mod) => mod.modifier === 'padding' && JSON.stringify(mod.value) === '[13,13,20,16]'
            )
        );
        expect(outerRow).toBeDefined();
      }
    });

    it('pads the active pill 2dp above and below its row', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' }));
      const nodes = collect(tree);
      const pill = nodes.find((node) => (node.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_'));
      expect(pill).toBeDefined();
      expect(pill?.props.modifiers).toEqual(
        expect.arrayContaining([{ modifier: 'fillMaxWidth' }, { modifier: 'height', value: 24 }])
      );
      // Asr is row 3: the pill sits 1dp above its row top (3*22 - 1)
      const spacerAbove = nodes.find(
        (node) =>
          node.marker === 'Spacer' &&
          (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
            (mod) => mod.modifier === 'height' && mod.value === 3 * 24
          )
      );
      expect(spacerAbove).toBeDefined();
    });

    it('bounds the active pill to the list column, not the card remainder', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(
        layouts.PrayerWidget(androidProps({ size: 'medium', grantedWidthDp: 380 }), { colorScheme: 'light' })
      );
      const nodes = collect(tree);
      const pill = nodes.find((node) => (node.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_'));
      expect(pill).toBeDefined();
      // The pill's ancestor column is the list's share of the granted width:
      // at full widget width the pill must not stretch across the dead space
      // right of the rows (owner finding 2026-09-19)
      const listColumn = nodes.find(
        (node) =>
          node.marker === 'Box' &&
          (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
            (mod) => mod.modifier === 'width' && mod.value === 177
          ) &&
          collect(node).some((inner) => (inner.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_'))
      );
      expect(listColumn).toBeDefined();
      // The pill WRAPS the row content with 12dp of air each side and no more:
      // it starts where the dead space to the left of the rows ends, so its
      // trailing edge lands 12dp past the times instead of at the column's own
      // edge (owner ruling 2026-09-24, replacing the 2026-09-19 full-column
      // pill). At a 380dp grant the list is 177dp and the name and time boxes
      // sum to 136dp, so the pill is 160dp and starts 17dp in.
      const pillColumn = collect(tree).find(
        (node) =>
          node.marker === 'Column' &&
          collect(node).some((inner) => (inner.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_'))
      );
      expect(pillColumn).toBeDefined();
      // Pixel-audited on the 3T, then owner-tuned: the pill sits 1dp low so
      // the digit ink band reads dead-center against its edges
      expect(pillColumn?.props.modifiers).toEqual(
        expect.arrayContaining([{ modifier: 'padding', value: [17, 1, 0, 0] }])
      );
      const rowsColumn = nodes.find(
        (node) =>
          node.marker === 'Column' &&
          (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
            (mod) => mod.modifier === 'padding' && JSON.stringify(mod.value) === '[29,0,0,0]'
          )
      );
      expect(rowsColumn).toBeDefined();
      // The list's fixed geometry: wider boxes give the 13sp rows air
      // between the names and the times without fill-based spacing
      const rowsRow = collect(tree).find(
        (node) =>
          node.marker === 'Row' &&
          (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
            (mod) => mod.modifier === 'height' && mod.value === 24
          ) &&
          textsOf(node).includes('Fajr')
      );
      expect(rowsRow).toBeDefined();
    });

    // The pill's leading inset and the rows' leading inset, read back from the
    // two sibling columns the medium list stacks
    const pillAndRowsLead = (grantedWidthDp: number): { pill: number; rows: number } => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(
        layouts.PrayerWidget(androidProps({ size: 'medium', grantedWidthDp }), { colorScheme: 'light' })
      );
      const leadOf = (node: unknown): number => {
        const mods = ((node as MarkerNode)?.props?.modifiers as { modifier: string; value: unknown }[]) ?? [];
        const found = mods.find((mod) => mod.modifier === 'padding');
        const value = (found?.value ?? []) as number[];
        return value[0] as number;
      };
      const pillColumn = collect(tree).find(
        (node) =>
          node.marker === 'Column' &&
          collect(node).some((inner) => (inner.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_'))
      );
      const rowsColumn = collect(tree).find((node) => node.marker === 'Column' && textsOf(node).includes('Fajr'));
      return { pill: leadOf(pillColumn), rows: leadOf(rowsColumn) };
    };

    it('gives the active pill equal air each side of the row text, at every grant', () => {
      // The owner saw the pill "perfectly aligned on the left, but on the right
      // side, it's extended even further out": it filled the list column while
      // the rows sat 12dp inside it, so every dp of slack landed right of the
      // times, 21dp of it at a 310dp grant and more as the screen widened. The
      // pill now wraps the text with the same 12dp the owner approved on the
      // left, and where a narrow grant cannot afford 12 it shrinks both sides
      // together rather than overflowing the column.
      for (const granted of [380, 360, 330, 310, 285, 258, 236, 220, 200]) {
        const { pill, rows } = pillAndRowsLead(granted);
        const { name, time } = rowBoxWidths(granted);
        const { list } = heroAndList(granted);
        const left = rows - pill;
        const right = list - (rows + name + time);

        expect(left).toBe(right);
        expect(left).toBeLessThanOrEqual(12);
        expect(left).toBeGreaterThan(0);
        // A margin taken as a flat 12dp stays symmetric on a narrow grant by
        // pushing the pill's own inset negative, which is a pill wider than the
        // column it sits in: the air has to come out of the margin instead
        expect(pill).toBeGreaterThanOrEqual(0);
        expect(rows + name + time).toBeLessThanOrEqual(list);
      }
    });

    // The medium's columns are shares of the width the launcher granted, so
    // the same helpers read them back at any grant
    const mediumBoxWidths = (grantedWidthDp?: number): number[] => {
      freezeNow(at(DAY_ONE, '14:08'));
      const props = grantedWidthDp === undefined ? { size: 'medium' } : { size: 'medium', grantedWidthDp };
      const tree = renderTree(
        layouts.PrayerWidget(androidProps(props as Partial<PrayerWidgetAndroidProps>), { colorScheme: 'light' })
      );
      return collect(tree).flatMap((node) =>
        node.marker !== 'Box'
          ? []
          : ((node.props.modifiers as { modifier: string; value: unknown }[] | undefined) ?? []).flatMap((mod) =>
              mod.modifier === 'width' && typeof mod.value === 'number' ? [mod.value] : []
            )
      );
    };

    // The list is the widest box the medium renders and the hero the next
    // widest: the name and time boxes are shares of the list
    const heroAndList = (grantedWidthDp?: number): { hero: number; list: number } => {
      const sorted = [...mediumBoxWidths(grantedWidthDp)].sort((a, b) => b - a);
      return { hero: sorted[1] as number, list: sorted[0] as number };
    };

    const rowNameFontSizes = (grantedWidthDp: number): number[] => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(
        layouts.PrayerWidget(androidProps({ size: 'medium', grantedWidthDp }), { colorScheme: 'light' })
      );
      return collect(tree).flatMap((node) => {
        if (node.marker !== 'Text') return [];
        const text = node.props.children;
        if (typeof text !== 'string' || !['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'].includes(text)) {
          return [];
        }
        const size = (node.props.style as { fontSize?: number } | undefined)?.fontSize;
        return typeof size === 'number' ? [size] : [];
      });
    };

    // The name box is the row's leading box: the widths a row renders are
    // the name box and the time box, in that order
    const rowBoxWidths = (grantedWidthDp: number): { name: number; time: number } => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(
        layouts.PrayerWidget(androidProps({ size: 'medium', grantedWidthDp }), { colorScheme: 'light' })
      );
      const fajrRow = collect(tree).find(
        (node) =>
          node.marker === 'Row' &&
          (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
            (mod) => mod.modifier === 'height' && mod.value === 24
          ) &&
          textsOf(node).includes('Fajr')
      );
      const widths = collect(fajrRow).flatMap((node) =>
        node.marker !== 'Box'
          ? []
          : ((node.props.modifiers as { modifier: string; value: unknown }[] | undefined) ?? []).flatMap((mod) =>
              mod.modifier === 'width' && typeof mod.value === 'number' ? [mod.value] : []
            )
      );
      return { name: widths[0] as number, time: widths[1] as number };
    };

    it('sizes the row name and time boxes from the granted width', () => {
      // The name box is what clipped on the X8, so it is pinned directly
      // rather than inferred from the list column
      expect(rowBoxWidths(380)).toEqual({ name: 82, time: 54 });
      expect(rowBoxWidths(310)).toEqual({ name: 65, time: 43 });
      expect(rowBoxWidths(258)).toEqual({ name: 53, time: 35 });
    });

    it('sizes the medium columns from the granted width', () => {
      // 360dp is the Find X8's grant under its 480 display-size override:
      // inner 327, so the hero's 170/347 share rounds to 160 and the list
      // takes the 167 remainder
      const { hero, list } = heroAndList(360);
      expect(hero).toBe(160);
      expect(list).toBe(167);
    });

    it('never lets the medium columns sum past the granted width', () => {
      // The invariant, across every grant both phones and a re-columned home
      // grid can produce: one dp of overflow is one clipped glyph in Glance
      for (const granted of [380, 360, 330, 310, 285, 258]) {
        const { hero, list } = heroAndList(granted);
        expect(hero + list).toBe(granted - 33);
      }
    });

    it('falls back to the declared minimum when the width is not stamped', () => {
      // A fresh JS push cannot know the grant, so the layout uses the
      // provider's declared 310dp until the next native tick stamps it
      const { hero, list } = heroAndList(undefined);
      expect(hero).toBe(136);
      expect(list).toBe(141);
    });

    it('shrinks the row text with the box so long names are not clipped', () => {
      // Glance cannot shrink text to fit, so a name box narrowed by a tight
      // grant would clip the longest names at a fixed 13sp
      const sizes = rowNameFontSizes(309);
      expect(sizes.length).toBeGreaterThan(0);
      expect(new Set(sizes)).toEqual(new Set([10]));
    });

    it('never shrinks the row text below its legible floor', () => {
      // The scale alone reaches 9sp at 286dp and 8sp at 258dp: below the
      // floor the rows stop being readable, so it clamps rather than follow
      expect(new Set(rowNameFontSizes(286))).toEqual(new Set([10]));
      expect(new Set(rowNameFontSizes(258))).toEqual(new Set([10]));
    });

    it('falls back to the declared minimum when the stamped width is not usable', () => {
      // The native tick stamps 0 for a kind it cannot measure; treating that
      // as a real grant would subtract the padding from nothing and drive
      // every column negative
      const { hero, list } = heroAndList(0);
      expect(hero).toBe(136);
      expect(list).toBe(141);
    });

    it('keeps the row text at 13sp when the grant is generous', () => {
      // The 3T's grant returns the approved look unchanged, and a grant
      // wider than the reference (a tablet, or a wide home grid) must not
      // grow the text past it: the look is settled, so the scale only shrinks
      expect(new Set(rowNameFontSizes(380))).toEqual(new Set([13]));
      expect(new Set(rowNameFontSizes(420))).toEqual(new Set([13]));
      expect(new Set(rowNameFontSizes(560))).toEqual(new Set([13]));
    });

    it("rolls the medium day list to the next prayer's day after the last row passes", () => {
      // 20:00 on DAY_ONE: Isha (19:40) has passed, next is DAY_TWO's Fajr —
      // the list must show DAY_TWO with Fajr active (owner finding
      // 2026-09-19), not fall back to the hero alone
      freezeNow(at(DAY_ONE, '20:00'));
      const tree = renderTree(layouts.PrayerWidget(androidProps({ size: 'medium' }), { colorScheme: 'light' }));
      const nodes = collect(tree);
      const pill = nodes.find((node) => (node.props.source as { uri?: string })?.uri?.startsWith('athan_widget_pill_'));
      expect(pill).toBeDefined();
      const spacerAbove = nodes.find(
        (node) =>
          node.marker === 'Spacer' &&
          (node.props.modifiers as { modifier: string; value: unknown }[] | undefined)?.some(
            (mod) => mod.modifier === 'height' && mod.value === 0
          )
      );
      expect(spacerAbove).toBeDefined();
      const texts = textsOf(tree);
      expect(texts).toContain('Fajr');
      expect(texts).toContain('05:30');
    });

    it('opens the app from a tap anywhere on the small card', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })) as MarkerNode;
      expect(tree.marker).toBe('Button');
      expect(tree.props.openApp).toBe(true);
    });

    it('opens the app from a tap anywhere on the medium card', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(
        layouts.PrayerWidget(androidProps({ size: 'medium', grantedWidthDp: 380 }), { colorScheme: 'light' })
      ) as MarkerNode;
      expect(tree.marker).toBe('Button');
      expect(tree.props.openApp).toBe(true);
    });

    it('stretches the tap target over the whole card', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      const tree = renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })) as MarkerNode;
      expect(tree.props.modifiers).toEqual([{ modifier: 'fillMaxSize', value: undefined }]);
    });

    it('opens the app from a tap on the out-of-date card', () => {
      freezeNow(androidProps({}).horizonEpochMs + 60_000);
      const tree = renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })) as MarkerNode;
      expect(tree.marker).toBe('Button');
      expect(tree.props.openApp).toBe(true);
      expect(textsOf(tree)).toContain('Out of date');
    });

    it('opens the app from a tap on the placeholder card', () => {
      const tree = renderTree(layouts.PrayerWidget(null, { colorScheme: 'light' })) as MarkerNode;
      expect(tree.marker).toBe('Button');
      expect(tree.props.openApp).toBe(true);
      expect(textsOf(tree)).toContain('Prayer times for London');
    });

    it('wraps each Android card in exactly one tap target', () => {
      freezeNow(at(DAY_ONE, '14:08'));
      for (const props of [androidProps({}), androidProps({ size: 'medium', grantedWidthDp: 380 }), null]) {
        const tree = renderTree(layouts.PrayerWidget(props, { colorScheme: 'light' }));
        expect(collect(tree).filter((node) => node.marker === 'Button')).toHaveLength(1);
      }
    });

    it('centers the stale card and the neutral card horizontally', () => {
      const centeredColumnWith = (tree: unknown, text: string): boolean =>
        collect(tree).some(
          (node) =>
            node.marker === 'Column' && node.props.horizontalAlignment === 'center' && textsOf(node).includes(text)
        );
      // Neutral: no props at all
      expect(centeredColumnWith(renderTree(layouts.PrayerWidget(null, { colorScheme: 'light' })), 'Athan')).toBe(true);
      // Stale: render instant past the carried horizon
      freezeNow(at(DAY_TWO, '23:59') + 14 * 24 * 3_600_000);
      expect(
        centeredColumnWith(renderTree(layouts.PrayerWidget(androidProps({}), { colorScheme: 'light' })), 'Out of date')
      ).toBe(true);
    });
  });
});

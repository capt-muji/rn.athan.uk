import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  containerRelativeFrame,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Lock Screen widget layouts (accessoryRectangular + accessoryInline).
 * Accessories render in vibrant monochrome, so every kind uses white with
 * opacity hierarchy and lets the system tint. Two compositions per
 * schedule: Layout 1 (name + absolute time, countdown beneath) and
 * Layout 2 (name, time, dot, countdown on one line) — both centre: the
 * accessory slot proposes no width a root could stretch into (a frame's
 * maxWidth cannot act there), so every rectangular root takes the widget
 * container's own width with containerRelativeFrame and lets the stack's
 * default centring place the block. iOS 16 renders leading (the modifier
 * needs 17), accepted on the three-year-old floor. A timer Text stops
 * ticking once concatenated, so the inline faces carry the name and
 * absolute time only, and every ticking element is its own Text. The
 * circular face stays unregistered since 1.14.1 (store builds carried it
 * for ~a day; the orphan freeze risk was accepted — see ai/AGENTS.md). All
 * helpers must live inside each function: the 'widget' directive
 * serializes the body alone, and @expo/ui identifiers resolve as globals
 * in the extension's JS runtime.
 */
const AthanLockWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Lock Screen accessories render in vibrant mode — stick to white with
  // opacity hierarchy and let the system tint the content.
  const WHITE = '#ffffff';
  const WHITE_SECONDARY = 'rgba(255, 255, 255, 0.6)';

  // Neutral fallbacks for states without renderable data: the gallery/jiggle
  // placeholder (iOS invokes the layout with no props) and any unexpected
  // rendering error (caught below). Text-only — no icons anywhere.
  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          Athan — prayer times
        </Text>
      );
    }

    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
          ATHAN
        </Text>
        <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open to load times
        </Text>
      </VStack>
    );
  };

  // Placeholder path: props are entirely absent (gallery preview, jiggle
  // mode, or a first-add before the app has ever pushed a timeline).
  if (props == null) {
    return neutralForFamily();
  }

  try {
    // Entries from an older app version missing segment bounds degrade to the
    // refresh card rather than rendering a broken countdown.
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text
            modifiers={[
              font({ size: 12, weight: 'medium' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              containerBackground('rgba(0, 0, 0, 0)', 'widget'),
            ]}>
            Athan — open to refresh times
          </Text>
        );
      }

      // accessoryRectangular — the moon-and-stars mark (the home widget's
      // stale-card icon, rendered here in the system's vibrant monochrome)
      // above the out-of-date title and refresh call
      return (
        <VStack
          spacing={1}
          modifiers={[
            containerRelativeFrame({ axes: 'horizontal' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          <Image systemName='moon.stars.fill' size={14} color={WHITE} />
          <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            Out of date
          </Text>
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
            Open app to refresh
          </Text>
        </VStack>
      );
    }

    // iOS ticks Text(timerInterval:) itself, every second, with no timeline
    // entry behind it. The swift-ui types only describe the string form, so
    // the timer props ride this cast.
    const TickingTextEl = Text as unknown as (elementProps: {
      timerInterval?: { lower: Date; upper: Date };
      countsDown?: boolean;
      modifiers?: unknown[];
    }) => ReactNode;

    const segment = { lower: new Date(props.prevEpochMs), upper: new Date(props.nextEpochMs) };

    // accessoryInline is a single system-rendered line and cannot hold a
    // ticking timer beside other text: SwiftUI stops updating a timer Text
    // the moment it is concatenated. The absolute time is the more useful
    // half in a slot this small, so inline carries that and no countdown.
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {props.nextName} {props.nextTime}
        </Text>
      );
    }

    // The timer is its own Text or it stops ticking.
    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <HStack spacing={4}>
          <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {props.nextName}
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: 'medium' }),
              monospacedDigit(),
              foregroundStyle(WHITE_SECONDARY),
              lineLimit(1),
            ]}>
            {props.nextTime}
          </Text>
        </HStack>
        <TickingTextEl
          timerInterval={segment}
          countsDown
          modifiers={[font({ size: 14, weight: 'bold' }), monospacedDigit(), foregroundStyle(WHITE), lineLimit(1)]}
        />
      </VStack>
    );
  } catch {
    // Never let a rendering error blank the Lock Surface.
    return neutralForFamily();
  }
};

// One layout, two kinds: identical rendering, different timelines — the
// standard pair and the extras pair (see widgets/PrayerWidget.tsx).
export const PrayerLockWidget = createWidget('PrayerLockWidget', AthanLockWidget);
export const ExtrasLockWidget = createWidget('ExtrasLockWidget', AthanLockWidget);

// A separate self-contained function: the 'widget' directive serializes
// each body alone, so nothing can be shared across the two layouts.
const AthanLockWidgetCentred = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_SECONDARY = 'rgba(255, 255, 255, 0.6)';

  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          Athan — prayer times
        </Text>
      );
    }

    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
          ATHAN
        </Text>
        <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open to load times
        </Text>
      </VStack>
    );
  };

  if (props == null) {
    return neutralForFamily();
  }

  try {
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text
            modifiers={[
              font({ size: 12, weight: 'medium' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              containerBackground('rgba(0, 0, 0, 0)', 'widget'),
            ]}>
            Athan — open to refresh times
          </Text>
        );
      }

      return (
        <VStack
          spacing={1}
          modifiers={[
            containerRelativeFrame({ axes: 'horizontal' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          <Image systemName='moon.stars.fill' size={14} color={WHITE} />
          <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            Out of date
          </Text>
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
            Open app to refresh
          </Text>
        </VStack>
      );
    }

    const TickingTextEl = Text as unknown as (elementProps: {
      timerInterval?: { lower: Date; upper: Date };
      countsDown?: boolean;
      modifiers?: unknown[];
    }) => ReactNode;

    const segment = { lower: new Date(props.prevEpochMs), upper: new Date(props.nextEpochMs) };

    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 12, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {props.nextName} {props.nextTime}
        </Text>
      );
    }

    // Centred because the rectangular face can span half the lock screen —
    // a left-anchored line would float off-balance in the wide slot. The
    // timer stays its own Text or it stops ticking.
    return (
      <VStack
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <HStack spacing={3}>
          <Text
            modifiers={[
              font({ size: 12, weight: 'bold' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              minimumScaleFactor(0.6),
            ]}>
            {props.nextName}
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: 'medium' }),
              monospacedDigit(),
              foregroundStyle(WHITE_SECONDARY),
              lineLimit(1),
              minimumScaleFactor(0.6),
            ]}>
            {props.nextTime}
          </Text>
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
            ·
          </Text>
          <TickingTextEl
            timerInterval={segment}
            countsDown
            modifiers={[
              font({ size: 12, weight: 'medium' }),
              monospacedDigit(),
              foregroundStyle(WHITE_SECONDARY),
              lineLimit(1),
              minimumScaleFactor(0.6),
            ]}
          />
        </HStack>
      </VStack>
    );
  } catch {
    return neutralForFamily();
  }
};

export const PrayerLockWidget2 = createWidget('PrayerLockWidget2', AthanLockWidgetCentred);
export const ExtrasLockWidget2 = createWidget('ExtrasLockWidget2', AthanLockWidgetCentred);

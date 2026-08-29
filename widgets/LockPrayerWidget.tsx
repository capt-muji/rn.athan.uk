import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, lineLimit, monospacedDigit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Lock Screen widget: live countdown to the next prayer, rendered in the
 * system's vibrant (monochrome) accessory style. All layout helpers must live
 * inside this function — the 'widget' directive serializes only this function
 * body into the widget extension's separate JS runtime, where @expo/ui
 * components and modifiers resolve as globals.
 */
const PrayerLockWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Lock Screen accessories render in vibrant mode — stick to white with
  // opacity hierarchy and let the system tint the content.
  const WHITE = '#ffffff';
  const WHITE_SECONDARY = 'rgba(255, 255, 255, 0.6)';

  // Neutral fallbacks for states without renderable data: the gallery/jiggle
  // placeholder (iOS invokes the layout with no props) and any unexpected
  // rendering error (caught below).
  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryCircular') {
      return <Image systemName='moon.stars.fill' color={WHITE} size={16} />;
    }

    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Athan — prayer times
        </Text>
      );
    }

    return (
      <VStack alignment='leading' spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
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
      if (environment.widgetFamily === 'accessoryCircular') {
        return <Image systemName='arrow.clockwise' color={WHITE} size={16} />;
      }

      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
            Athan — open to refresh times
          </Text>
        );
      }

      // accessoryRectangular
      return (
        <VStack alignment='leading' spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
          <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
            ATHAN
          </Text>
          <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            Times out of date
          </Text>
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
            Open app to refresh
          </Text>
        </VStack>
      );
    }

    // Props are JSON-serialized across the bridge — rebuild Dates from epoch ms
    const prevDate = new Date(props.prevEpochMs);
    const nextDate = new Date(props.nextEpochMs);
    const countdownInterval = { lower: prevDate, upper: nextDate };

    if (environment.widgetFamily === 'accessoryCircular') {
      // A timer-interval ProgressView renders its own ticking label next to the
      // ring even with labelsHidden, which double-renders in the tiny circular
      // area — so the circular family shows the bare live countdown instead.
      return (
        <Text
          timerInterval={countdownInterval}
          modifiers={[
            font({ size: 9, weight: 'semibold', design: 'rounded' }),
            monospacedDigit(),
            lineLimit(1),
            foregroundStyle(WHITE),
            frame({ width: 44, height: 44 }),
          ]}
        />
      );
    }

    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {props.nextName} {props.nextTime}
          <Text timerInterval={countdownInterval} modifiers={[monospacedDigit(), foregroundStyle(WHITE_SECONDARY)]} />
        </Text>
      );
    }

    // accessoryRectangular (default)
    return (
      <VStack alignment='leading' spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundStyle(WHITE_SECONDARY), lineLimit(1)]}>
          NEXT PRAYER
        </Text>
        <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {props.nextName} · {props.nextTime}
        </Text>
        <Text
          timerInterval={countdownInterval}
          modifiers={[font({ size: 11, weight: 'medium' }), monospacedDigit(), foregroundStyle(WHITE_SECONDARY)]}
        />
      </VStack>
    );
  } catch {
    // Never let a rendering error blank the Lock Surface.
    return neutralForFamily();
  }
};

export default createWidget('PrayerLockWidget', PrayerLockWidget);

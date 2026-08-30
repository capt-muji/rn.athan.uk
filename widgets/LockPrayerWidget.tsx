import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, lineLimit, monospacedDigit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Lock Screen widget: the next prayer with a minute-ceil countdown label,
 * rendered in the system's vibrant (monochrome) accessory style. All layout
 * helpers must live inside this function — the 'widget' directive serializes
 * only this function body into the widget extension's separate JS runtime,
 * where @expo/ui components and modifiers resolve as globals.
 */
const PrayerLockWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Lock Screen accessories render in vibrant mode — stick to white with
  // opacity hierarchy and let the system tint the content.
  const WHITE = '#ffffff';
  const WHITE_SECONDARY = 'rgba(255, 255, 255, 0.6)';

  // Neutral fallbacks for states without renderable data: the gallery/jiggle
  // placeholder (iOS invokes the layout with no props) and any unexpected
  // rendering error (caught below). Text-only — no icons anywhere.
  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryCircular') {
      return (
        <Text
          modifiers={[
            font({ size: 10, weight: 'semibold' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            frame({ width: 44, height: 44 }),
          ]}>
          Athan
        </Text>
      );
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
        return (
          <Text
            modifiers={[
              font({ size: 10, weight: 'semibold' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              frame({ width: 44, height: 44 }),
            ]}>
            Refresh
          </Text>
        );
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

    // Countdown as a minute-ceil label, precomputed per timeline entry.
    // Entries from a v1 app version lack the label — degrade to the absolute
    // time instead of a system timer (whose colon format we don't use).
    const hasCountdownLabel = typeof props.countdownLabel === 'string' && props.countdownLabel.length > 0;

    if (environment.widgetFamily === 'accessoryCircular') {
      // The circular face shows just the countdown ("2h", "9m").
      const circularModifiers = [
        font({ size: 9, weight: 'semibold', design: 'rounded' }),
        monospacedDigit(),
        lineLimit(1),
        foregroundStyle(WHITE),
        frame({ width: 44, height: 44 }),
      ];

      if (hasCountdownLabel) {
        return <Text modifiers={circularModifiers}>{props.countdownLabel}</Text>;
      }

      return <Text modifiers={circularModifiers}>{props.nextTime}</Text>;
    }

    if (environment.widgetFamily === 'accessoryInline') {
      const countdownModifiers = [monospacedDigit(), foregroundStyle(WHITE_SECONDARY)];

      return (
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {props.nextName} {props.nextTime}
          {hasCountdownLabel ? (
            <>
              {' '}
              · <Text modifiers={countdownModifiers}>{props.countdownLabel}</Text>
            </>
          ) : null}
        </Text>
      );
    }

    // accessoryRectangular (default): the prayer with its time and the
    // countdown below
    const rectangularModifiers = [
      font({ size: 11, weight: 'medium' }),
      monospacedDigit(),
      foregroundStyle(WHITE_SECONDARY),
    ];

    return (
      <VStack alignment='leading' spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {props.nextName} · {props.nextTime}
        </Text>
        {hasCountdownLabel ? <Text modifiers={rectangularModifiers}>{props.countdownLabel}</Text> : null}
      </VStack>
    );
  } catch {
    // Never let a rendering error blank the Lock Surface.
    return neutralForFamily();
  }
};

export default createWidget('PrayerLockWidget', PrayerLockWidget);

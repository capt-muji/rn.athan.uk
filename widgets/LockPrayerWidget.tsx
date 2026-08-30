import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, lineLimit, monospacedDigit, opacity } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Lock Screen widget (accessoryRectangular + accessoryInline; the circular
 * face is retired and renders blank — see the guard below). The rectangular
 * face pairs the countdown with the prayer name and puts the absolute HH:mm
 * below — the countdown reads once, beside the name. All layout helpers must
 * live inside this function — the 'widget' directive serializes only this
 * function body into the widget extension's separate JS runtime, where
 * @expo/ui components and modifiers resolve as globals.
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

  // The circular face is retired (it duplicated the rectangular countdown),
  // but iOS keeps user-placed circular instances alive even after the family
  // leaves supportedFamilies — orphaned placements freeze on their last
  // render. Keep the family registered and blank the layout instead: every
  // circular placement, past or future, renders nothing at all.
  if (environment.widgetFamily === 'accessoryCircular') {
    return (
      <Text modifiers={[font({ size: 9, weight: 'semibold' }), opacity(0), frame({ width: 44, height: 44 })]}> </Text>
    );
  }

  try {
    // Entries from an older app version missing segment bounds degrade to the
    // refresh card rather than rendering a broken countdown.
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
            Athan — open to refresh times
          </Text>
        );
      }

      // accessoryRectangular — the moon-and-stars mark (the home widget's
      // stale-card icon, rendered here in the system's vibrant monochrome)
      // above the out-of-date title and refresh call
      return (
        <VStack alignment='leading' spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
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

    // Countdown as a minute-ceil label, precomputed per timeline entry.
    // Entries from a v1 app version lack the label — degrade to the absolute
    // time instead of a system timer (whose colon format we don't use).
    const hasCountdownLabel = typeof props.countdownLabel === 'string' && props.countdownLabel.length > 0;

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

    // accessoryRectangular (default): the prayer with its countdown, the
    // absolute time below
    const rectangularModifiers = [
      font({ size: 11, weight: 'medium' }),
      monospacedDigit(),
      foregroundStyle(WHITE_SECONDARY),
    ];

    const header = hasCountdownLabel ? `${props.nextName} · ${props.countdownLabel}` : props.nextName;

    return (
      <VStack alignment='leading' spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>{header}</Text>
        <Text modifiers={rectangularModifiers}>{props.nextTime}</Text>
      </VStack>
    );
  } catch {
    // Never let a rendering error blank the Lock Surface.
    return neutralForFamily();
  }
};

export default createWidget('PrayerLockWidget', PrayerLockWidget);

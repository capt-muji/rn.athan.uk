import { Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  textCase,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Home screen widget (systemSmall): the next prayer only — the "Flat royal"
 * design: solid root-purple card, centered symmetric trio (prayer name,
 * minute-ceil countdown hero, absolute HH:mm) over the day · city footer.
 * The hero always renders the builder's precomputed label ("1h 12m", "2m",
 * "1m") — seconds never display; the app re-pushes at each minute flip
 * while it runs. All layout helpers must live inside this function — the
 * 'widget' directive serializes only this function body into the widget
 * extension's separate JS runtime, where @expo/ui components and modifiers
 * resolve as globals.
 */
const PrayerWidget = (props: PrayerWidgetProps, _environment: WidgetEnvironment) => {
  'widget';

  // Palette: solid COLORS.navigation.rootBackground card. The prayer name is
  // an uppercase periwinkle eyebrow (widget-only indigo lean so it fades into
  // the card, letter-spaced); the hero is the app's soft success-white
  // brightened a touch (#d5e8ff → #e6f0ff); the absolute time stays
  // COLORS.text.secondary; the footer sits just under the absolute time's
  // color (widget-only nudge toward secondary — must stay fainter than it).
  const CARD_BACKGROUND = '#2c1c77';
  const NAME_COLOR = 'rgba(163, 185, 252, 0.62)';
  const TEXT_PRIMARY = '#e6f0ff';
  const TEXT_SECONDARY = 'rgba(160, 200, 255, 0.54)';
  const TEXT_FOOTER = 'rgba(157, 188, 246, 0.48)';

  // Neutral card for states without renderable data: the gallery/jiggle
  // placeholder (iOS invokes the layout with no props — expo-widgets stores
  // no initial props) and any unexpected rendering error (caught below).
  const NeutralCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <ZStack modifiers={[containerBackground(CARD_BACKGROUND, 'widget')]}>
      <VStack spacing={5} modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(TEXT_PRIMARY)]}>{title}</Text>
        <Text modifiers={[font({ size: 12, weight: 'regular' }), foregroundStyle(TEXT_SECONDARY)]}>{subtitle}</Text>
      </VStack>
    </ZStack>
  );

  // Placeholder path: props are entirely absent (gallery preview, jiggle
  // mode, or a first-add before the app has ever pushed a timeline).
  if (props == null) {
    return <NeutralCard title='Athan' subtitle='Prayer times for London' />;
  }

  try {
    // Terminal state: every timeline entry has passed and the app has not
    // re-pushed — ask the user to open the app instead of showing stale times.
    // Tapping a widget opens the app by default, so the card is the button.
    // Entries from an older app version missing segment bounds degrade here too.
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      return <NeutralCard title='Times out of date' subtitle='Open Athan to refresh' />;
    }

    // Footer: three-letter day of the next prayer's date, then the city —
    // "Sat · London". Derived from the precomputed dateLabel ("Sat, 29 Aug
    // 2026" → "Sat"; Hijri labels yield the 3-letter month, e.g. "Raj").
    // Entries from a v1 app version without a dateLabel degrade to "London".
    const dayPart =
      typeof props.dateLabel === 'string' && props.dateLabel.length > 0
        ? props.dateLabel.split(',')[0].slice(0, 3)
        : '';
    const footer = dayPart ? `${dayPart} · London` : 'London';

    // Hero caps at the app's TEXT.sizeLarge so the worst-case label ("24h")
    // clears the card edges with room to spare.
    const heroModifiers = [
      font({ size: 26, weight: 'bold' }),
      monospacedDigit(),
      foregroundStyle(TEXT_PRIMARY),
      lineLimit(1),
      minimumScaleFactor(0.6),
    ];

    return (
      <ZStack modifiers={[containerBackground(CARD_BACKGROUND, 'widget')]}>
        <VStack spacing={0} modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
          <Spacer />
          <VStack spacing={6}>
            <Text
              modifiers={[
                font({ size: 11, weight: 'semibold' }),
                foregroundStyle(NAME_COLOR),
                textCase('uppercase'),
                kerning(1.2),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}>
              {props.nextName}
            </Text>
            {typeof props.countdownLabel === 'string' && props.countdownLabel.length > 0 ? (
              <Text modifiers={heroModifiers}>{props.countdownLabel}</Text>
            ) : null}
            <Text
              modifiers={[
                font({ size: 13, weight: 'regular' }),
                monospacedDigit(),
                foregroundStyle(TEXT_SECONDARY),
                lineLimit(1),
              ]}>
              {props.nextTime}
            </Text>
          </VStack>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 9, weight: 'medium' }),
              foregroundStyle(TEXT_FOOTER),
              kerning(0.4),
              lineLimit(1),
              minimumScaleFactor(0.6),
            ]}>
            {footer}
          </Text>
        </VStack>
      </ZStack>
    );
  } catch {
    // Never let a rendering error blank the widget: a minimal card beats a
    // dead surface the user cannot distinguish from a broken widget.
    return <NeutralCard title='Athan' subtitle='Open the app to refresh' />;
  }
};

export default createWidget('PrayerWidget', PrayerWidget);

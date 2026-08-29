import { Capsule, HStack, Image, ProgressView, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  monospacedDigit,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetDayPrayer, PrayerWidgetProps } from './types';

/**
 * Home screen widget: next prayer with a live countdown (systemSmall) plus
 * today's prayer list (systemMedium). All layout helpers must live inside
 * this function — the 'widget' directive serializes only this function body
 * into the widget extension's separate JS runtime, where @expo/ui components
 * and modifiers resolve as globals.
 */
const PrayerWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Palette mirrors COLORS in shared/constants.ts (app theme)
  const GRADIENT_START = '#031a4c';
  const GRADIENT_END = '#5b1eaa';
  const HIGHLIGHT = '#0847e5';
  const TEXT_PRIMARY = '#ffffff';
  const TEXT_SECONDARY = 'rgba(160, 200, 255, 0.54)';
  const TEXT_MUTED = 'rgba(138, 169, 214, 0.38)';
  const ICON_PRIMARY = '#a5b4fc';
  const TRACK = '#153569';
  const DIVIDER = 'rgba(255, 255, 255, 0.08)';

  const isFullColor = environment.widgetRenderingMode == null || environment.widgetRenderingMode === 'fullColor';

  // Props are JSON-serialized across the bridge — rebuild Dates from epoch ms
  const prevDate = new Date(props.prevEpochMs);
  const nextDate = new Date(props.nextEpochMs);
  const countdownInterval = { lower: prevDate, upper: nextDate };

  const NextHeader = () => (
    <HStack spacing={5}>
      <Image systemName='moon.stars.fill' size={11} color={ICON_PRIMARY} />
      <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(TEXT_SECONDARY)]}>NEXT PRAYER</Text>
    </HStack>
  );

  const NextPrayer = ({ nameSize, arabicSize }: { nameSize: number; arabicSize: number }) => (
    <VStack alignment='leading' spacing={1}>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: nameSize, weight: 'bold' }), foregroundStyle(TEXT_PRIMARY), lineLimit(1)]}>
          {props.nextName}
        </Text>
        {props.showArabic && (
          <Text
            modifiers={[font({ size: arabicSize, weight: 'medium' }), foregroundStyle(TEXT_SECONDARY), lineLimit(1)]}>
            {props.nextArabic}
          </Text>
        )}
      </HStack>
      <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(TEXT_SECONDARY)]}>
        at {props.nextTime}
      </Text>
    </VStack>
  );

  // Self-filling progress bar across the current prayer segment, tinted with
  // the user's countdown bar accent color. The system label is hidden — a
  // timer-interval ProgressView renders its own ticking text by default.
  const SegmentBar = () => (
    <ZStack modifiers={[frame({ maxWidth: Infinity, height: 5 })]}>
      <Capsule modifiers={[foregroundStyle(TRACK), frame({ maxWidth: Infinity, height: 5 })]} />
      <ProgressView
        timerInterval={countdownInterval}
        countsDown={false}
        modifiers={[tint(props.accentColor), labelsHidden(), frame({ maxWidth: Infinity })]}
      />
    </ZStack>
  );

  const Countdown = ({ size }: { size: number }) => (
    <Text
      timerInterval={countdownInterval}
      modifiers={[
        font({ size, weight: 'semibold', design: 'rounded' }),
        monospacedDigit(),
        foregroundStyle(TEXT_PRIMARY),
        frame({ maxWidth: Infinity }),
      ]}
    />
  );

  const DayRow = (row: PrayerWidgetDayPrayer) => {
    const isNext = row.state === 'next';
    const isPassed = row.state === 'passed';
    const rowColor = isPassed ? TEXT_MUTED : TEXT_PRIMARY;
    const highlightModifiers = isNext ? [background(HIGHLIGHT), clipShape('roundedRectangle', 6)] : [];

    return (
      <HStack
        key={row.name}
        spacing={8}
        modifiers={[padding({ horizontal: 7, vertical: 3 }), frame({ maxWidth: Infinity }), ...highlightModifiers]}>
        <Text
          modifiers={[
            font({ size: 13, weight: isNext ? 'semibold' : 'regular' }),
            foregroundStyle(rowColor),
            lineLimit(1),
          ]}>
          {row.name}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: 'regular' }), monospacedDigit(), foregroundStyle(rowColor)]}>
          {row.time}
        </Text>
      </HStack>
    );
  };

  const smallLayout = (
    <VStack
      alignment='leading'
      spacing={4}
      modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
      <NextHeader />
      <Spacer />
      <NextPrayer nameSize={22} arabicSize={15} />
      <Spacer />
      <Countdown size={30} />
      <SegmentBar />
    </VStack>
  );

  const mediumLayout = (
    <HStack spacing={10} modifiers={[padding({ all: 12 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
      <VStack alignment='leading' spacing={3} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <NextHeader />
        <Spacer />
        <NextPrayer nameSize={20} arabicSize={14} />
        <Spacer />
        <Countdown size={24} />
        <SegmentBar />
      </VStack>
      <Rectangle modifiers={[foregroundStyle(DIVIDER), frame({ width: 1, maxHeight: Infinity })]} />
      <VStack alignment='leading' spacing={1} modifiers={[frame({ width: 122, maxHeight: Infinity })]}>
        {props.dayPrayers.map((row) => DayRow(row))}
      </VStack>
    </HStack>
  );

  // Only paint the full-color gradient in fullColor mode; accented (tinted)
  // home screen widgets recolor everything anyway.
  return (
    <ZStack modifiers={[containerBackground(GRADIENT_START, 'widget')]}>
      {isFullColor && (
        <Rectangle
          modifiers={[
            foregroundStyle({
              type: 'linearGradient',
              colors: [GRADIENT_START, GRADIENT_END],
              startPoint: { x: 0, y: 0.25 },
              endPoint: { x: 1, y: 1 },
            }),
            clipShape('containerRelativeShape'),
          ]}
        />
      )}
      {environment.widgetFamily === 'systemMedium' ? mediumLayout : smallLayout}
    </ZStack>
  );
};

export default createWidget('PrayerWidget', PrayerWidget);

import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  containerRelativeFrame,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Lock Screen widget layouts (accessoryRectangular + accessoryInline).
 * Accessories render in vibrant monochrome, so the system tints whatever
 * these set. One size throughout; weight and opacity carry the hierarchy,
 * and the SECOND reading on a line is the muted one (owner 2026-09-25).
 * Three compositions per schedule, in gallery order: Layout 1 (name +
 * ticking countdown), Layout 2 (name + absolute time; no countdown and no
 * dot, owner ruling 2026-09-20) and Layout 3 (name + absolute time with the
 * countdown beneath). Layouts 1 and 2 split the slot into halves meeting at
 * its midline: a timer Text reports a worst-case width as its intrinsic
 * size, so a shrink-wrapped row measures a reservation rather than the
 * glyphs and centring it strands the name at the slot's edge. Anchoring each
 * half at the seam holds the name's last letter and the second reading's
 * first character in place whatever their lengths. Layout 3 stacks instead,
 * so it centres by shrink-wrapping as usual. iOS 16 renders
 * containerRelativeFrame leading (the modifier needs 17), accepted on the
 * three-year-old floor. A timer Text stops ticking once concatenated, so the
 * inline faces carry the name and absolute time only, and every ticking
 * element is its own Text. The circular face stays unregistered since 1.14.1
 * (store builds carried it for ~a day; the orphan freeze risk was accepted
 * — see ai/AGENTS.md).
 *
 * Layouts 4 and 5 carry the whole day's list as absolute times: one column
 * for the extras schedule, two columns for the standard one, whose six rows
 * would not be readable stacked. Both register for accessoryRectangular
 * alone, so neither reads the widget family: supportedFamilies compiles into
 * each widget's Swift struct, and iOS cannot ask a kind for a family it does
 * not declare. Their rows come from the builder (props.prayers and
 * props.activeIndex), so no layout here does date arithmetic.
 *
 * No layout catches its own render. A body reads JSON props and maps an
 * array, so nothing in it can throw, and a catch would only add a branch no
 * input reaches (owner 2026-09-25).
 *
 * All helpers must live inside each function: the 'widget' directive
 * serializes the body alone, and @expo/ui identifiers resolve as globals in
 * the extension's JS runtime.
 */
// Layout 1: the name beside a live countdown, no absolute time.
const AthanLockWidgetCountdownPair = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';

  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
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
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>ATHAN</Text>
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open to load times
        </Text>
      </VStack>
    );
  };

  if (props == null) {
    return neutralForFamily();
  }

  const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
  if (props.stale === true || !segmentValid) {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
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
        <Image systemName='moon.stars.fill' size={17} color={WHITE} />
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>Out of date</Text>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
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

  // Inline concatenates its content, which stops a timer Text ticking, so
  // this face falls back to the absolute time.
  if (environment.widgetFamily === 'accessoryInline') {
    return (
      <Text
        modifiers={[
          font({ size: 14, weight: 'medium' }),
          foregroundStyle(WHITE),
          lineLimit(1),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        {props.nextName} {props.nextTime}
      </Text>
    );
  }

  return (
    <VStack
      modifiers={[
        containerRelativeFrame({ axes: 'horizontal' }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground('rgba(0, 0, 0, 0)', 'widget'),
      ]}>
      {/* Two equal halves meeting at the slot's midline, because a timer Text
          reserves a worst-case width: a shrink-wrapped row measures that
          reservation rather than the glyphs, so centring the row leaves the
          name against the slot's edge. Anchoring each half to the midline
          instead makes the name's last letter and the countdown's first digit
          land in the same place whatever their lengths, which no centred row
          can do while one child misreports its width. */}
      <HStack spacing={0}>
        <Text
          modifiers={[
            font({ size: 14, weight: 'bold' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            minimumScaleFactor(0.6),
            frame({ maxWidth: Infinity, alignment: 'trailing' }),
            padding({ trailing: 3 }),
          ]}>
          {props.nextName}
        </Text>
        <TickingTextEl
          timerInterval={segment}
          countsDown
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            monospacedDigit(),
            foregroundStyle(WHITE_MUTED),
            lineLimit(1),
            minimumScaleFactor(0.6),
            frame({ maxWidth: Infinity, alignment: 'leading' }),
            padding({ leading: 3 }),
          ]}
        />
      </HStack>
    </VStack>
  );
};

export const PrayerLockWidget = createWidget('PrayerLockWidget', AthanLockWidgetCountdownPair);
export const ExtrasLockWidget = createWidget('ExtrasLockWidget', AthanLockWidgetCountdownPair);

// A separate self-contained function: the 'widget' directive serializes
// each body alone, so nothing can be shared across the layouts.
const AthanLockWidgetCentred = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';

  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
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
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>ATHAN</Text>
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open to load times
        </Text>
      </VStack>
    );
  };

  if (props == null) {
    return neutralForFamily();
  }

  const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
  if (props.stale === true || !segmentValid) {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
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
        <Image systemName='moon.stars.fill' size={17} color={WHITE} />
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>Out of date</Text>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open app to refresh
        </Text>
      </VStack>
    );
  }

  if (environment.widgetFamily === 'accessoryInline') {
    return (
      <Text
        modifiers={[
          font({ size: 14, weight: 'medium' }),
          foregroundStyle(WHITE),
          lineLimit(1),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        {props.nextName} {props.nextTime}
      </Text>
    );
  }

  // Centred because the rectangular face can span half the lock screen —
  // a left-anchored line would float off-balance in the wide slot. Just
  // the name and the absolute time (owner ruling 2026-09-20): the dot and
  // the countdown are gone from this layout.
  return (
    <VStack
      modifiers={[
        containerRelativeFrame({ axes: 'horizontal' }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground('rgba(0, 0, 0, 0)', 'widget'),
      ]}>
      {/* Halves anchored at the midline, as Layout 1 does: prayer names differ
          in length, so a shrink-wrapped row moves the whole pair with every
          name, while a fixed seam keeps the last letter and the first digit
          where they were. */}
      <HStack spacing={0}>
        <Text
          modifiers={[
            font({ size: 14, weight: 'bold' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            minimumScaleFactor(0.6),
            frame({ maxWidth: Infinity, alignment: 'trailing' }),
            padding({ trailing: 3 }),
          ]}>
          {props.nextName}
        </Text>
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            monospacedDigit(),
            foregroundStyle(WHITE_MUTED),
            lineLimit(1),
            minimumScaleFactor(0.6),
            frame({ maxWidth: Infinity, alignment: 'leading' }),
            padding({ leading: 3 }),
          ]}>
          {props.nextTime}
        </Text>
      </HStack>
    </VStack>
  );
};

export const PrayerLockWidget2 = createWidget('PrayerLockWidget2', AthanLockWidgetCentred);
export const ExtrasLockWidget2 = createWidget('ExtrasLockWidget2', AthanLockWidgetCentred);

const AthanLockWidgetStacked = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Only the absolute time recedes; the system tints both in vibrant mode.
  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';

  // The gallery/jiggle placeholder: iOS invokes the layout with no props.
  // Text-only — no icons anywhere.
  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
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
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>ATHAN</Text>
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
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

  // Entries from an older app version missing segment bounds degrade to the
  // refresh card rather than rendering a broken countdown.
  const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
  if (props.stale === true || !segmentValid) {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
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
        <Image systemName='moon.stars.fill' size={17} color={WHITE} />
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>Out of date</Text>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
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
          font({ size: 14, weight: 'medium' }),
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
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {props.nextName}
        </Text>
        <Text
          modifiers={[font({ size: 14, weight: 'medium' }), monospacedDigit(), foregroundStyle(WHITE), lineLimit(1)]}>
          {props.nextTime}
        </Text>
      </HStack>
      <TickingTextEl
        timerInterval={segment}
        countsDown
        modifiers={[
          font({ size: 14, weight: 'medium' }),
          monospacedDigit(),
          multilineTextAlignment('center'),
          foregroundStyle(WHITE_MUTED),
          lineLimit(1),
        ]}
      />
    </VStack>
  );
};

// One layout, two kinds: identical rendering, different timelines — the
// standard pair and the extras pair (see widgets/PrayerWidget.tsx).
export const PrayerLockWidget3 = createWidget('PrayerLockWidget3', AthanLockWidgetStacked);
export const ExtrasLockWidget3 = createWidget('ExtrasLockWidget3', AthanLockWidgetStacked);

// Layout 4: the whole day in one column. Extras only, where the list is four
// rows (five on Fridays).
const AthanLockWidgetDayColumn = (props: PrayerWidgetProps) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';
  const WHITE_FAINT = 'rgba(255, 255, 255, 0.35)';
  // One size for a row's name AND its time, so no edit can move only one.
  const ROW_SIZE = 11;

  const neutral = () => (
    <VStack
      spacing={1}
      modifiers={[
        containerRelativeFrame({ axes: 'horizontal' }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground('rgba(0, 0, 0, 0)', 'widget'),
      ]}>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>ATHAN</Text>
      <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
        Open to load times
      </Text>
    </VStack>
  );

  if (props == null) {
    return neutral();
  }

  if (props.stale === true) {
    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Image systemName='moon.stars.fill' size={17} color={WHITE} />
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>Out of date</Text>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open app to refresh
        </Text>
      </VStack>
    );
  }

  const rows = Array.isArray(props.prayers) ? props.prayers : [];
  if (rows.length === 0) {
    return neutral();
  }

  // -1 whenever the day on screen holds no readable row, which the builder
  // emits for hours at a time: those rows still belong on the face, and none
  // of them is next.
  const activeIndex = typeof props.activeIndex === 'number' ? props.activeIndex : -1;

  const DayRow = ({ name, time, index }: { name: string; time: string; index: number }) => {
    const colour = index === activeIndex ? WHITE : index < activeIndex ? WHITE_MUTED : WHITE_FAINT;
    const weight = index === activeIndex ? 'bold' : 'medium';

    return (
      <HStack spacing={0} modifiers={[frame({ maxWidth: Infinity })]}>
        <Text
          modifiers={[
            font({ size: ROW_SIZE, weight }),
            foregroundStyle(colour),
            lineLimit(1),
            minimumScaleFactor(0.6),
          ]}>
          {name}
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: ROW_SIZE, weight }),
            monospacedDigit(),
            foregroundStyle(colour),
            lineLimit(1),
            minimumScaleFactor(0.6),
          ]}>
          {time}
        </Text>
      </HStack>
    );
  };

  return (
    <VStack
      spacing={0}
      modifiers={[
        containerRelativeFrame({ axes: 'horizontal' }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground('rgba(0, 0, 0, 0)', 'widget'),
      ]}>
      {rows.map((row, index) => (
        <DayRow key={row.name} name={row.name} time={row.time} index={index} />
      ))}
    </VStack>
  );
};

export const ExtrasLockWidget4 = createWidget('ExtrasLockWidget4', AthanLockWidgetDayColumn);

// Layout 5: the day split into two columns, the first half left. Standard
// only, where six rows in one column would not be readable.
const AthanLockWidgetDaySplit = (props: PrayerWidgetProps) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';
  const WHITE_FAINT = 'rgba(255, 255, 255, 0.35)';
  const ROW_SIZE = 14;

  const neutral = () => (
    <VStack
      spacing={1}
      modifiers={[
        containerRelativeFrame({ axes: 'horizontal' }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground('rgba(0, 0, 0, 0)', 'widget'),
      ]}>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>ATHAN</Text>
      <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
        Open to load times
      </Text>
    </VStack>
  );

  if (props == null) {
    return neutral();
  }

  if (props.stale === true) {
    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Image systemName='moon.stars.fill' size={17} color={WHITE} />
        <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>Out of date</Text>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
          Open app to refresh
        </Text>
      </VStack>
    );
  }

  const rows = Array.isArray(props.prayers) ? props.prayers : [];
  if (rows.length === 0) {
    return neutral();
  }

  const activeIndex = typeof props.activeIndex === 'number' ? props.activeIndex : -1;
  // Ceil, so an odd row (Friday's fifth extra) goes to the left column.
  const splitAt = Math.ceil(rows.length / 2);

  const DayRow = ({ name, time, index }: { name: string; time: string; index: number }) => {
    const colour = index === activeIndex ? WHITE : index < activeIndex ? WHITE_MUTED : WHITE_FAINT;
    const weight = index === activeIndex ? 'bold' : 'medium';

    return (
      <HStack spacing={0} modifiers={[frame({ maxWidth: Infinity })]}>
        <Text
          modifiers={[
            font({ size: ROW_SIZE, weight }),
            foregroundStyle(colour),
            lineLimit(1),
            minimumScaleFactor(0.6),
          ]}>
          {name}
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: ROW_SIZE, weight }),
            monospacedDigit(),
            foregroundStyle(colour),
            lineLimit(1),
            minimumScaleFactor(0.6),
          ]}>
          {time}
        </Text>
      </HStack>
    );
  };

  // `from + offset` keeps each row's tier reading from its place in the whole
  // day rather than in its own half.
  const Half = ({ from, to }: { from: number; to: number }) => (
    <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
      {rows.slice(from, to).map((row, offset) => (
        <DayRow key={row.name} name={row.name} time={row.time} index={from + offset} />
      ))}
    </VStack>
  );

  return (
    <HStack
      spacing={8}
      modifiers={[
        containerRelativeFrame({ axes: 'horizontal' }),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground('rgba(0, 0, 0, 0)', 'widget'),
      ]}>
      <Half from={0} to={splitAt} />
      <Half from={splitAt} to={rows.length} />
    </HStack>
  );
};

export const PrayerLockWidget5 = createWidget('PrayerLockWidget5', AthanLockWidgetDaySplit);

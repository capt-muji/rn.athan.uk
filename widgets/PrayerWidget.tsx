import { Circle, HStack, Image, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  blur,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  offset,
  padding,
  shadow,
  strokeBorder,
  textCase,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Home screen widget layouts (systemSmall + systemMedium), registered twice
 * on one shared layout: 'PrayerWidget' renders the Standard schedule,
 * 'ExtrasWidget' the Extra schedule (Midnight, Last Third, Suhoor, Duha,
 * Friday Istijaba). The 'widget' directive serializes this single function
 * body into both kinds' app-group slots, so the two widgets can never drift
 * apart structurally — the ONLY rendered difference is the extras medium
 * pill's rose palette, branched on the entry's `schedule` prop.
 *
 * systemSmall — a translucent blue-grey pane with soft white orb glow,
 * centered symmetric trio (uppercase bold rose prayer name, minute-ceil
 * countdown hero, absolute HH:mm) over the day · city footer. Identical
 * for both schedules.
 *
 * systemMedium — the left half repeats the small trio verbatim; the right
 * half replicates the app's page list: the displayed day's prayers with the
 * active background on the next prayer, passed rows solid white, upcoming
 * rows muted. Standard lists the six prayers chronologically; extras list
 * in canonical order (Midnight, Last Third, Suhoor, Duha, Istijaba-last on
 * Fridays — 4 rows normally, 5 on Fridays) and center-anchor vertically so
 * the top/bottom insets stay symmetric as the list grows. No alert icons,
 * no countdown bar, no Arabic names. State changes snap between entries:
 * expo-widgets rebuilds its whole view tree per timeline entry with fresh
 * view identities, so SwiftUI animation cannot fire (2026-08-30 decision —
 * accepted; do not reintroduce animation modifiers here).
 *
 * The hero always renders the builder's precomputed label ("1h 12m", "2m",
 * "1m") — seconds never display; the app re-pushes at each minute flip
 * while it runs. All layout helpers must live inside this function — the
 * 'widget' directive serializes only this function body into the widget
 * extension's separate JS runtime, where @expo/ui components and modifiers
 * resolve as globals.
 */
const AthanHomeWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // The active row pill: indigo (#4f46e5, "Pill Indigo Full" from the
  // app's sound-picker selection) over pale pink text on the standard
  // widgets; rose (#db2777 — the widget family's own accent) with a
  // rose-tinted stroke and deep rose shadow on the extras widgets. The
  // pale pink row text is shared — it reads on both fills. Entries from
  // older app versions carry no `schedule` and render the standard trio.
  const CARD_BACKGROUND = 'rgba(234, 239, 246, 0.8)';
  const EYEBROW_TEXT = '#db2777';
  const TEXT_PRIMARY = '#1e1b2e';
  const TEXT_SECONDARY = 'rgba(42, 68, 130, 0.42)';
  const TEXT_FOOTER = 'rgba(42, 68, 130, 0.34)';

  const isExtra = props?.schedule === 'extra';
  const ACTIVE_BACKGROUND = isExtra ? '#db2777' : '#4f46e5';
  const ACTIVE_ROW_TEXT = '#fce7f3';
  const ACTIVE_SHADOW = isExtra ? 'rgba(61, 10, 38, 0.45)' : 'rgba(30, 27, 75, 0.45)';
  const ROW_PASSED = '#2f3d5c';
  const ROW_UPCOMING = 'rgba(42, 68, 130, 0.32)';

  const STALE_ICON = '#db2777';
  const STROKE_COLOR = isExtra ? 'rgba(219, 39, 119, 0.35)' : 'rgba(79, 70, 229, 0.35)';
  const STROKE_WIDTH = 1;

  // Bottom-left orb of the white glow lighting (see Blobs below).
  const BOTTOM_ORB_COLOR = 'rgba(255, 255, 255, 0.4)';

  // Medium list geometry: fixed row height so the floating pill's offset is
  // exact and the spacing never jumps (the app's rows are a fixed 57pt for
  // the same reason). Six rows of 22pt fill the systemMedium inner height
  // exactly on iPhone 16-class devices, so the standard list sits flush
  // with zero inset; the extras lists (4 rows, 5 on Fridays) center
  // vertically between equal Spacers — see the list column below. The 12pt
  // row text sits with ~3pt of air above and below inside each pill. The
  // corner radius keeps the app's pill-to-row proportion (8pt on a 57pt row
  // ≈ 4pt on a 22pt row). The list column is a fixed width — narrower than
  // its half of the card — so name and time sit close together and the
  // whole list leans left of the card's right edge.
  const ROW_HEIGHT = 22;
  const ROW_TEXT_SIZE = 12;
  const ROW_CORNER_RADIUS = 4;
  const LIST_WIDTH = 140;

  // Terminal state: every timeline entry has passed and the app has not
  // re-pushed — ask the user to open the app instead of showing stale times.
  // The 1.7.0 moon-and-stars mark sits above the title; the refresh call is
  // plain text — "Open Athan / to refresh" split over two lines on the
  // small card, one line on the medium card (the black ErrorScreen-button
  // look was tried and rejected 2026-08-30). Tapping the widget opens the
  // app by default, so the whole card is the button.
  const StaleCard = () => {
    const refreshLine = (line: string) => (
      <Text modifiers={[font({ size: 12, weight: 'regular' }), foregroundStyle(TEXT_SECONDARY), lineLimit(1)]}>
        {line}
      </Text>
    );

    return (
      <ZStack modifiers={[containerBackground(CARD_BACKGROUND, 'widget')]}>
        <VStack spacing={7} modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
          <Spacer />
          <Image systemName='moon.stars.fill' size={26} color={STALE_ICON} />
          <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(TEXT_PRIMARY)]}>Out of date</Text>
          {environment.widgetFamily === 'systemMedium' ? (
            refreshLine('Open Athan to refresh')
          ) : (
            <VStack spacing={1}>
              {refreshLine('Open Athan')}
              {refreshLine('to refresh')}
            </VStack>
          )}
          <Spacer />
        </VStack>
      </ZStack>
    );
  };

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
    // The top orb's anchor and blur differ per family: on the small card it
    // sits right of center with a wider blur (at medium blur its hotspot
    // pools too hot in the tighter card); on the medium card it tops the
    // hero near the horizontal center.
    const topOrbX = environment.widgetFamily === 'systemSmall' ? 30 : -5;
    const topOrbBlur = environment.widgetFamily === 'systemSmall' ? 38 : 33;
    const topOrbColor = '#ffffff';

    // The white glow lighting — three blurred orbs: a top orb above the
    // hero, a faint bottom-left orb, and a small centered orb rising
    // through the countdown.
    const Blobs = () => (
      <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Circle
          modifiers={[
            frame({ width: 85, height: 85 }),
            offset({ x: topOrbX, y: -38 }),
            foregroundStyle(topOrbColor),
            blur(topOrbBlur),
          ]}
        />
        <Circle
          modifiers={[
            frame({ width: 130, height: 130 }),
            offset({ x: -70, y: 60 }),
            foregroundStyle(BOTTOM_ORB_COLOR),
            blur(40),
          ]}
        />
        <Circle
          modifiers={[frame({ width: 34, height: 34 }), offset({ x: 0, y: 8 }), foregroundStyle(topOrbColor), blur(30)]}
        />
      </ZStack>
    );

    // Terminal state: every timeline entry has passed and the app has not
    // re-pushed — the moon-and-stars refresh card. Entries from an older
    // app version missing segment bounds degrade here too.
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      return <StaleCard />;
    }

    // Footer: the next prayer's date marker, then the short city. The
    // Gregorian setting yields the weekday — "Mon · Lon" (dateLabel "Mon,
    // 15 Jun 2026"). The Hijri setting yields the three-letter month plus
    // the day — "Raj 1 · Lon" (dateLabel "Rajab 1, 1447"; Intl's "Rabiʻ I
    // 12" drops the numeral — shared prefixes accepted for consistency).
    // Entries from a v1 app version without a dateLabel degrade to "Lon".
    const datePrefix =
      typeof props.dateLabel === 'string' && props.dateLabel.length > 0 ? props.dateLabel.split(',')[0] : '';
    // NOTE: plain string separator only — the widget extension's JS runtime
    // does not split on regex separators (/\s+/ silently returns the whole
    // string, which rendered "Rabiʻ II 18 · Lon" before this fix).
    const dateTokens = datePrefix.split(' ');
    let dayPart = '';
    if (dateTokens.length === 1) {
      dayPart = dateTokens[0];
    } else if (dateTokens.length > 1) {
      const monthPrefix = dateTokens[0].slice(0, 3);
      const dayNumber = dateTokens[dateTokens.length - 1];
      dayPart = `${monthPrefix} ${dayNumber}`;
    }
    const footer = dayPart ? `${dayPart} · Lon` : 'Lon';

    // The hero column — the small widget's centered trio plus the footer,
    // shared verbatim by both families so the countdown reads identically.
    const HeroColumn = () => (
      <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Spacer />
        <VStack spacing={6}>
          <Text
            modifiers={[
              font({ size: 12, weight: 'bold' }),
              foregroundStyle(EYEBROW_TEXT),
              textCase('uppercase'),
              kerning(0.5),
              lineLimit(1),
              minimumScaleFactor(0.6),
            ]}>
            {props.nextName}
          </Text>
          {typeof props.countdownLabel === 'string' && props.countdownLabel.length > 0 ? (
            <Text
              modifiers={[
                font({ size: 26, weight: 'bold' }),
                monospacedDigit(),
                foregroundStyle(TEXT_PRIMARY),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}>
              {props.countdownLabel}
            </Text>
          ) : null}{' '}
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
    );

    // The medium list is only renderable with a complete day snapshot:
    // entries from older app versions (props v2) or a malformed sequence
    // fall back to the hero-only composition instead of a broken list.
    const rows = Array.isArray(props.prayers) ? props.prayers : [];
    const activeIndex = typeof props.activeIndex === 'number' ? props.activeIndex : -1;
    const listValid = rows.length > 0 && activeIndex >= 0 && activeIndex < rows.length;

    if (environment.widgetFamily === 'systemMedium' && listValid) {
      // One row per prayer: name leading, time trailing (the app's row
      // anatomy), colored by state — passed and active rows solid, upcoming
      // rows muted (the app's isPassed || isNext → primary rule). Every
      // time is bold, every name regular (owner decision 2026-08-31). The
      // row block is inset a few points each side (on the list ZStack
      // below), so the pill sits narrower than the column with slight
      // padding left and right — which also brings the name and time
      // closer together.
      const Row = ({ name, time, index }: { name: string; time: string; index: number }) => {
        const rowColor = index === activeIndex ? ACTIVE_ROW_TEXT : index < activeIndex ? ROW_PASSED : ROW_UPCOMING;

        return (
          <HStack
            spacing={0}
            modifiers={[frame({ maxWidth: Infinity, height: ROW_HEIGHT }), padding({ leading: 10, trailing: 10 })]}>
            <Text
              modifiers={[
                font({ size: ROW_TEXT_SIZE, weight: 'regular' }),
                foregroundStyle(rowColor),
                lineLimit(1),
                minimumScaleFactor(0.8),
              ]}>
              {name}
            </Text>
            <Spacer />
            <Text
              modifiers={[
                font({ size: ROW_TEXT_SIZE, weight: 'bold' }),
                monospacedDigit(),
                foregroundStyle(rowColor),
                lineLimit(1),
              ]}>
              {time}
            </Text>
          </HStack>
        );
      };

      // The floating active background — the app's ActiveBackground
      // architecture: a native rounded-rectangle shape (a shape view fills
      // the width its stack proposes — an empty stack with a maxWidth frame
      // collapses to zero width in the widget runtime) positioned behind the
      // next prayer's row, with a deep shadow scaled to widget rows. The
      // pill anchors to the row BLOCK's top (activeIndex · rowHeight), so it
      // tracks the active row wherever the centered list below places it.
      const pillY = activeIndex * ROW_HEIGHT;

      const ActivePill = () => (
        <RoundedRectangle
          cornerRadius={ROW_CORNER_RADIUS}
          modifiers={[
            foregroundStyle(ACTIVE_BACKGROUND),
            strokeBorder({
              color: STROKE_COLOR,
              style: { lineWidth: STROKE_WIDTH },
              shape: 'roundedRectangle',
              cornerRadius: ROW_CORNER_RADIUS,
            }),
            shadow({ radius: 4, x: 1, y: 4, color: ACTIVE_SHADOW }),
            frame({ height: ROW_HEIGHT }),
            offset({ y: pillY }),
          ]}
        />
      );

      return (
        <ZStack modifiers={[containerBackground(CARD_BACKGROUND, 'widget')]}>
          <Blobs />
          <HStack
            spacing={14}
            modifiers={[
              padding({ leading: 13, trailing: 20, top: 13, bottom: 13 }),
              frame({ maxWidth: Infinity, maxHeight: Infinity }),
            ]}>
            <HeroColumn />
            {/* The list column: the row block (pill + rows) centers
                vertically between equal Spacers — the same centering
                pattern the hero column uses. The standard 6-row list fills
                the card's inner height exactly (insets are zero); the
                extras 4/5-row lists get symmetric top/bottom insets, so the
                spacing stays balanced when the Friday row grows the list.
                A fixed track height or a maxHeight frame cannot be used
                here: Infinity frames do not make stacks greedy in the
                widget runtime, and hardcoding the track would break on
                other card sizes. */}
            <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
              <Spacer />
              <ZStack alignment='top' modifiers={[frame({ width: LIST_WIDTH }), padding({ leading: 4, trailing: 4 })]}>
                <ActivePill />
                <VStack spacing={0} alignment='leading' modifiers={[frame({ maxWidth: Infinity })]}>
                  {rows.map((row, index) => (
                    <Row key={row.name} name={row.name} time={row.time} index={index} />
                  ))}
                </VStack>
              </ZStack>
              <Spacer />
            </VStack>
          </HStack>
        </ZStack>
      );
    }

    // systemSmall (or the medium fallback): the hero alone fills the card.
    return (
      <ZStack modifiers={[containerBackground(CARD_BACKGROUND, 'widget')]}>
        <Blobs />
        <VStack spacing={0} modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
          <HeroColumn />
        </VStack>
      </ZStack>
    );
  } catch {
    // Never let a rendering error blank the widget: a minimal card beats a
    // dead surface the user cannot distinguish from a broken widget.
    return <NeutralCard title='Athan' subtitle='Open the app to refresh' />;
  }
};

// One layout, two kinds: the same serialized function body is registered
// under both names — the standard pair and the extras pair differ only in
// which timeline stores/widget.ts pushes to them (and the entry's
// `schedule` prop, which the palette branch above reads).
export const PrayerWidget = createWidget('PrayerWidget', AthanHomeWidget);
export const ExtrasWidget = createWidget('ExtrasWidget', AthanHomeWidget);

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
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Home screen widget (systemSmall + systemMedium).
 *
 * systemSmall — the "Flat royal" design: solid root-purple card, centered
 * symmetric trio (prayer name, minute-ceil countdown hero, absolute HH:mm)
 * over the day · city footer.
 *
 * systemMedium — the left half repeats the small trio verbatim; the right
 * half replicates the app's Standard page list: the day's six prayers in
 * chronological order with the blue active background on the next prayer,
 * passed rows solid white, upcoming rows muted. No alert icons, no
 * countdown bar, no Arabic names. State changes snap between entries:
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
const PrayerWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // THEME 48 — FINAL v2: theme 47 with one change — the active row pill is
  // indigo (#4f46e5, exactly 44 Pill Indigo Full) instead of rose.
  const CARD_BACKGROUND = 'rgba(255, 250, 253, 0.55)';
  const EYEBROW_TEXT = '#db2777';
  const TEXT_PRIMARY = '#1e1b2e';
  const TEXT_SECONDARY = 'rgba(42, 68, 130, 0.42)';
  const TEXT_FOOTER = 'rgba(42, 68, 130, 0.34)';

  const ACTIVE_BACKGROUND = '#4f46e5';
  const ACTIVE_ROW_TEXT = '#fce7f3';
  const ACTIVE_SHADOW = 'rgba(30, 27, 75, 0.45)';
  const ROW_PASSED = '#2f3d5c';
  const ROW_UPCOMING = 'rgba(42, 68, 130, 0.32)';

  const STALE_ICON = '#db2777';
  const STROKE_COLOR = 'rgba(79, 70, 229, 0.35)';
  const STROKE_WIDTH = 1;

  // Blob lighting (theme 42's glow): three blurred orbs anchored to the
  // card's corners, colored per theme. Empty string = orb off.
  const BLOB_A = 'rgba(249, 168, 212, 0.5)';
  const BLOB_B = 'rgba(147, 197, 253, 0.42)';
  const BLOB_C = 'rgba(196, 181, 253, 0.4)';

  // Medium list geometry: fixed row height so the floating pill's offset is
  // exact and the spacing never jumps (the app's rows are a fixed 57pt for
  // the same reason). Six rows of 22pt fill the systemMedium inner height
  // (158pt card − 2×13pt padding = 132pt) exactly on iPhone 16-class
  // devices; the 12pt row text sits with ~3pt of air above and below inside
  // each pill. The corner radius keeps the app's pill-to-row proportion
  // (8pt on a 57pt row ≈ 4pt on a 22pt row). The list column is a fixed
  // width — narrower than its half of the card — so name and time sit close
  // together and the whole list leans left of the card's right edge.
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
    // The blob lighting layer — blurred orbs anchored to the card's
    // corners, colored by the theme's BLOB_* constants (empty = skipped).
    const Blobs = () => (
      <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Circle
          modifiers={[
            frame({ width: 170, height: 170 }),
            offset({ x: -55, y: -75 }),
            foregroundStyle(BLOB_A),
            blur(45),
          ]}
        />
        <Circle
          modifiers={[frame({ width: 160, height: 160 }), offset({ x: 65, y: 85 }), foregroundStyle(BLOB_B), blur(45)]}
        />
        <Circle
          modifiers={[frame({ width: 130, height: 130 }), offset({ x: -70, y: 60 }), foregroundStyle(BLOB_C), blur(40)]}
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

    // Footer: three-letter day of the next prayer's date, then the city —
    // "Sat · London". Derived from the precomputed dateLabel ("Sat, 29 Aug
    // 2026" → "Sat"; Hijri labels yield the 3-letter month, e.g. "Raj").
    // Entries from a v1 app version without a dateLabel degrade to "London".
    const dayPart =
      typeof props.dateLabel === 'string' && props.dateLabel.length > 0
        ? props.dateLabel.split(',')[0].slice(0, 3)
        : '';
    const footer = dayPart ? `${dayPart} · London` : 'London';

    // The hero column — the small widget's centered trio plus the footer,
    // shared verbatim by both families so the countdown reads identically.
    const HeroColumn = () => (
      <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Spacer />
        <VStack spacing={6}>
          <Text
            modifiers={[
              font({ size: 12, weight: 'semibold' }),
              foregroundStyle(EYEBROW_TEXT),
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
      // rows muted (the app's isPassed || isNext → primary rule). The row
      // block is inset a few points each side (on the list ZStack below), so
      // the pill sits narrower than the column with slight padding left and
      // right — which also brings the name and time closer together.
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
                font({ size: ROW_TEXT_SIZE, weight: 'regular' }),
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
      // next prayer's row, with the app's shadow (#081a76 at SHADOW.prayer's
      // 0.5 opacity) scaled to widget rows.
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
            shadow(
              ACTIVE_SHADOW
                ? { radius: 4, x: 1, y: 4, color: ACTIVE_SHADOW }
                : { radius: 0, x: 0, y: 0, color: ACTIVE_SHADOW }
            ),
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
            <ZStack alignment='top' modifiers={[frame({ width: LIST_WIDTH }), padding({ leading: 4, trailing: 4 })]}>
              <ActivePill />
              <VStack spacing={0} alignment='leading' modifiers={[frame({ maxWidth: Infinity })]}>
                {rows.map((row, index) => (
                  <Row key={row.name} name={row.name} time={row.time} index={index} />
                ))}
              </VStack>
            </ZStack>
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

export default createWidget('PrayerWidget', PrayerWidget);

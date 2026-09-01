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
 * Theming: the system color scheme drives the palette — light keeps the
 * blue-grey family above; dark re-tints every color to the app's own
 * screen palette (navy card, white hero, app secondary/muted tints, app
 * indigo/purple pills, periwinkle glow). Structure is identical in both
 * themes; only the palette constants branch.
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

  // Dual palette — the system color scheme themes the widget. Light keeps
  // the translucent blue-grey pane; dark mirrors the app's own screen.
  // WidgetKit re-renders the layout when the system appearance flips, so
  // no timeline re-push is needed for the theme itself.
  const isDark = environment.colorScheme === 'dark';
  const isExtra = props?.schedule === 'extra';

  // ── DARK PALETTE ("Violet Dusk", owner-approved 2026-09-01) ──────────────
  // Navy-violet card with violet/ultraviolet orb glow, pink eyebrow, and
  // pills that keep their light-mode geometry. The pill shadow is neutral
  // depth (a darker card tone — pink casts read as neon, black reads
  // harsh). Secondary/footer/upcoming tints are the light theme's blues
  // blended 23% toward pinkish-purple to match the theme.
  const CARD_BACKGROUND_DARK = 'rgba(26, 26, 92, 0.88)';
  const EYEBROW_TEXT_DARK = '#ff69b4';
  const TEXT_PRIMARY_DARK = '#ffffff';
  const TEXT_SECONDARY_DARK = 'rgba(173, 193, 254, 0.54)';
  const TEXT_FOOTER_DARK = 'rgba(156, 169, 222, 0.38)';
  const ACTIVE_BACKGROUND_DARK = isExtra ? '#a123aa' : '#0847e5';
  const ACTIVE_ROW_TEXT_DARK = '#ffffff';
  const SHADOW_COLOR_DARK = 'rgba(34, 26, 98, 0.45)';
  const SHADOW_RADIUS_DARK = 9;
  const SHADOW_X_DARK = 0;
  const SHADOW_Y_DARK = 2;
  const STROKE_COLOR_DARK = isExtra ? 'rgba(146, 0, 162, 0.35)' : 'rgba(8, 71, 229, 0.35)';
  const ROW_PASSED_DARK = '#ffffff';
  const ROW_UPCOMING_DARK = 'rgba(173, 193, 254, 0.6)';
  const STALE_ICON_DARK = '#ff69b4';
  // Small-card orbs: violet glows, the bottom-left one strongest.
  const TOP_ORB_COLOR_DARK = 'rgba(128, 0, 255, 0.25)';
  const BOTTOM_ORB_COLOR_DARK = 'rgba(128, 0, 255, 0.45)';
  const CENTER_ORB_COLOR_DARK = 'rgba(165, 180, 252, 0.3)';
  // Medium-card orbs: point-sized orbs cover a far smaller fraction of
  // the wide card, so they scale up (≤170pt, the proven safe ceiling) and
  // the base orb anchors near the left edge; the main orb rides high
  // (y −75) so it reads off-center like an ambient light, not a spot.
  const TOP_ORB_COLOR_MEDIUM_DARK = 'rgba(128, 0, 255, 0.25)';
  const BOTTOM_ORB_COLOR_MEDIUM_DARK = 'rgba(99, 15, 183, 0.55)';
  const CENTER_ORB_COLOR_MEDIUM_DARK = 'rgba(128, 0, 255, 0.3)';
  const TOP_ORB_SIZE_M_DARK = 110;
  const TOP_ORB_Y_M_DARK = -75;
  const BOTTOM_ORB_SIZE_M_DARK = 170;
  const BOTTOM_ORB_X_M_DARK = -130;
  const CENTER_ORB_SIZE_M_DARK = 44;
  // ── END DARK PALETTE ─────────────────────────────────────────────────────

  const CARD_BACKGROUND_LIGHT = 'rgba(234, 239, 246, 0.8)';
  const CARD_BACKGROUND = isDark ? CARD_BACKGROUND_DARK : CARD_BACKGROUND_LIGHT;

  const EYEBROW_TEXT = isDark ? EYEBROW_TEXT_DARK : '#db2777';

  const TEXT_PRIMARY = isDark ? TEXT_PRIMARY_DARK : '#1e1b2e';
  const TEXT_SECONDARY = isDark ? TEXT_SECONDARY_DARK : 'rgba(42, 68, 130, 0.42)';
  const TEXT_FOOTER = isDark ? TEXT_FOOTER_DARK : 'rgba(42, 68, 130, 0.34)';

  // The active row pill. Light: indigo (#4f46e5) over pale pink text on
  // the standard widgets, rose (#db2777) with a rose-tinted stroke and
  // deep rose shadow on the extras widgets. Dark: per the design knobs.
  // Entries from older app versions carry no `schedule` and render the
  // standard trio.
  const ACTIVE_BACKGROUND_LIGHT = isExtra ? '#db2777' : '#4f46e5';
  const ACTIVE_BACKGROUND = isDark ? ACTIVE_BACKGROUND_DARK : ACTIVE_BACKGROUND_LIGHT;

  const ACTIVE_ROW_TEXT = isDark ? ACTIVE_ROW_TEXT_DARK : '#fce7f3';

  const ACTIVE_SHADOW_LIGHT = isExtra ? 'rgba(61, 10, 38, 0.45)' : 'rgba(30, 27, 75, 0.45)';
  const ACTIVE_SHADOW = isDark ? SHADOW_COLOR_DARK : ACTIVE_SHADOW_LIGHT;

  const ROW_PASSED = isDark ? ROW_PASSED_DARK : '#2f3d5c';
  const ROW_UPCOMING = isDark ? ROW_UPCOMING_DARK : 'rgba(42, 68, 130, 0.32)';

  const STALE_ICON = isDark ? STALE_ICON_DARK : '#db2777';

  const STROKE_LIGHT = isExtra ? 'rgba(219, 39, 119, 0.35)' : 'rgba(79, 70, 229, 0.35)';
  const STROKE_COLOR = isDark ? STROKE_COLOR_DARK : STROKE_LIGHT;
  const STROKE_WIDTH = 1;

  // Shadow geometry: light keeps the lifted 4pt throw; dark geometry
  // follows the shadow-treatment knobs above.
  const SHADOW_RADIUS = isDark ? SHADOW_RADIUS_DARK : 4;
  const SHADOW_X = isDark ? SHADOW_X_DARK : 1;
  const SHADOW_Y = isDark ? SHADOW_Y_DARK : 4;

  const BOTTOM_ORB_COLOR = isDark ? BOTTOM_ORB_COLOR_DARK : 'rgba(255, 255, 255, 0.4)';

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
        <Blobs />
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

  // The glow lighting — three blurred orbs: a main orb above the hero
  // (high on the medium card), a bottom-left orb, and a small centered
  // orb rising through the countdown. White in light; violet and
  // ultraviolet in dark. Defined before the cards so the stale and
  // neutral states share the theme's lighting too.
  const topOrbX = environment.widgetFamily === 'systemSmall' ? 30 : -5;
  const topOrbBlur = environment.widgetFamily === 'systemSmall' ? 38 : 33;
  const topOrbColor = !isDark
    ? '#ffffff'
    : environment.widgetFamily === 'systemMedium'
      ? TOP_ORB_COLOR_MEDIUM_DARK
      : TOP_ORB_COLOR_DARK;
  const centerOrbColor = !isDark
    ? '#ffffff'
    : environment.widgetFamily === 'systemMedium'
      ? CENTER_ORB_COLOR_MEDIUM_DARK
      : CENTER_ORB_COLOR_DARK;
  const bottomOrbColor = !isDark
    ? BOTTOM_ORB_COLOR
    : environment.widgetFamily === 'systemMedium'
      ? BOTTOM_ORB_COLOR_MEDIUM_DARK
      : BOTTOM_ORB_COLOR_DARK;
  const isMedium = environment.widgetFamily === 'systemMedium';
  const topOrbSize = isDark && isMedium ? TOP_ORB_SIZE_M_DARK : 85;
  const topOrbY = isDark && isMedium ? TOP_ORB_Y_M_DARK : -38;
  const bottomOrbSize = isDark && isMedium ? BOTTOM_ORB_SIZE_M_DARK : 130;
  const bottomOrbX = isDark && isMedium ? BOTTOM_ORB_X_M_DARK : -70;
  const centerOrbSize = isDark && isMedium ? CENTER_ORB_SIZE_M_DARK : 34;

  const Blobs = () => (
    <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
      <Circle
        modifiers={[
          frame({ width: topOrbSize, height: topOrbSize }),
          offset({ x: topOrbX, y: topOrbY }),
          foregroundStyle(topOrbColor),
          blur(topOrbBlur),
        ]}
      />
      <Circle
        modifiers={[
          frame({ width: bottomOrbSize, height: bottomOrbSize }),
          offset({ x: bottomOrbX, y: 60 }),
          foregroundStyle(bottomOrbColor),
          blur(40),
        ]}
      />
      <Circle
        modifiers={[
          frame({ width: centerOrbSize, height: centerOrbSize }),
          offset({ x: 0, y: 8 }),
          foregroundStyle(centerOrbColor),
          blur(30),
        ]}
      />
    </ZStack>
  );

  try {
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
            shadow({ radius: SHADOW_RADIUS, x: SHADOW_X, y: SHADOW_Y, color: ACTIVE_SHADOW }),
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

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
  scaleEffect,
  shadow,
  strokeBorder,
  textCase,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Home screen widget layout (systemSmall + systemMedium), one shared
 * function registered under EIGHT kinds: for each schedule (PrayerWidget
 * = Standard, ExtrasWidget = Extra) and each theme (light, dark) there is
 * a small kind and a medium kind — size-exclusive kinds are what let the
 * gallery list all smalls before all mediums within each theme. The
 * 'widget' directive serializes this single function body into every
 * kind's app-group slot, so they can never drift structurally — the ONLY
 * rendered differences branch on the entry's props (`schedule` selects
 * the extras pill colors, `theme` selects the Light/Dark palette) and on
 * environment.widgetFamily. A widget's look is therefore fixed at
 * placement (the gallery's Light and Dark kinds) and never follows the
 * system appearance; only the props-less gallery placeholder falls back
 * to the system color scheme.
 *
 * systemSmall — a translucent card with soft orb glow, a centered trio
 * (bold prayer name, minute-ceil countdown hero, absolute HH:mm) over the
 * day · city footer. Identical for both schedules.
 *
 * systemMedium — the left half repeats the small trio; the right half
 * replicates the app's page list: the displayed day's prayers with a
 * floating active pill on the next prayer, passed rows solid, upcoming
 * rows muted. Standard lists the six prayers chronologically; extras list
 * in canonical order (Midnight, Last Third, Suhoor, Duha, Istijaba last
 * on Fridays — 4 rows normally, 5 on Fridays) and center-anchor
 * vertically. No alert icons, no countdown bar, no Arabic names.
 *
 * The hero always renders the builder's precomputed label ("1h 12m",
 * "2m", "1m") — seconds never display; the app re-pushes at each minute
 * flip while it runs. State changes snap between entries: expo-widgets
 * rebuilds its whole view tree per timeline entry with fresh view
 * identities, so SwiftUI animation cannot fire — do not reintroduce
 * animation modifiers here. All layout helpers must live inside this
 * function — the 'widget' directive serializes only this body into the
 * widget extension's separate JS runtime, where @expo/ui components and
 * modifiers resolve as globals.
 */
const AthanHomeWidget = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Theme and schedule arrive on the entry — each gallery kind receives
  // its own timeline, so the palette is fixed at placement. The props-less
  // gallery placeholder (and legacy entries without `theme`) falls back to
  // the system color scheme.
  const isExtra = props?.schedule === 'extra';
  const fallbackTheme = environment.colorScheme === 'dark' ? 'dark' : 'light';
  const theme = props?.theme ?? fallbackTheme;
  const isDark = theme === 'dark';
  const isMedium = environment.widgetFamily === 'systemMedium';

  // Two self-contained palettes: text colors and the active-pill
  // treatment. The orb lighting is DARK-only — the light cards sit on
  // their plain translucent background. Fixed-size orbs are capped at
  // 170pt — anything larger inflates the card ZStack past the system slot
  // and pushes the standard list's flush footer into the card's bottom
  // edge (verified at 185pt). The main orb rides high off-center
  // (ambient light, not a spot); the bottom-left orb anchors near the
  // left edge; the below-list orb sits centered under the day list to
  // fill the dark bottom-center. Small cards mirror their bottom-left
  // orb onto the bottom right at 75% strength to lift the dark corner.
  const LIGHT = {
    card: 'rgba(252, 252, 254, 0.92)',
    eyebrow: '#db2777',
    hero: '#1e1b2e',
    secondary: 'rgba(42, 68, 130, 0.42)',
    footer: 'rgba(42, 68, 130, 0.34)',
    staleIcon: '#db2777',
    rowPassed: '#2f3d5c',
    rowUpcoming: 'rgba(42, 68, 130, 0.32)',
    activeRowText: '#fce7f3',
    pillFill: isExtra ? '#db2777' : '#4f46e5',
    pillStroke: isExtra ? 'rgba(219, 39, 119, 0.35)' : 'rgba(79, 70, 229, 0.35)',
    // The app's own active-pill shadows: the pill's hue, not black — a
    // same-hue shadow reads as a soft glow while still lifting the pill.
    pillShadow: { color: isExtra ? 'rgba(110, 0, 107, 0.35)' : 'rgba(10, 42, 155, 0.4)', radius: 6, x: 0, y: 3 },
  };

  const DARK = {
    card: 'rgba(26, 26, 92, 0.88)',
    eyebrow: '#ff69b4',
    hero: '#ffffff',
    secondary: 'rgba(173, 193, 254, 0.54)',
    footer: 'rgba(156, 169, 222, 0.38)',
    staleIcon: '#ff69b4',
    rowPassed: '#ffffff',
    rowUpcoming: 'rgba(173, 193, 254, 0.6)',
    activeRowText: '#ffffff',
    pillFill: isExtra ? '#a123aa' : '#0847e5',
    pillStroke: isExtra ? 'rgba(146, 0, 162, 0.35)' : 'rgba(8, 71, 229, 0.35)',
    pillShadow: { color: 'rgba(34, 26, 98, 0.45)', radius: 9, x: 0, y: 2 },
    orbsSmall: {
      top: 'rgba(128, 0, 255, 0.25)',
      bottom: 'rgba(128, 0, 255, 0.45)',
      center: 'rgba(165, 180, 252, 0.3)',
      topSize: 85,
      topY: -38,
      bottomSize: 130,
      bottomX: -70,
      centerSize: 34,
      corner: { color: 'rgba(128, 0, 255, 0.34)', size: 130, x: 70, y: 60, blur: 40 },
    },
    orbsMedium: {
      top: 'rgba(128, 0, 255, 0.25)',
      bottom: 'rgba(99, 15, 183, 0.55)',
      center: 'rgba(128, 0, 255, 0.3)',
      topSize: 110,
      topY: -75,
      bottomSize: 170,
      bottomX: -130,
      centerSize: 44,
      corner: { color: 'rgba(128, 0, 255, 0.25)', size: 170, x: 75, y: 58, blur: 33 },
    },
  };

  const palette = isDark ? DARK : LIGHT;
  const orbs = isDark ? (isMedium ? DARK.orbsMedium : DARK.orbsSmall) : null;
  // The top orb's x and blur anchor to each family's absolute card coords —
  // center-relative offsets land it in the small card's corner on medium.
  const topOrbX = isMedium ? -5 : 30;
  const topOrbBlur = isMedium ? 33 : 38;

  // Fixed row height keeps the floating pill's offset exact and the
  // spacing static. Six 22pt rows fill the systemMedium inner height
  // exactly, so the standard list sits flush; the shorter extras lists
  // center between equal Spacers (see the list column below). The corner
  // radius keeps the app's pill-to-row proportion.
  const ROW_HEIGHT = 22;
  const ROW_TEXT_SIZE = 12;
  const ROW_CORNER_RADIUS = 4;
  const LIST_WIDTH = 140;

  // Terminal state: every timeline entry has passed and the app has not
  // re-pushed. Tapping the widget opens the app, so the whole card is the
  // refresh button.
  const StaleCard = () => {
    const refreshLine = (line: string) => (
      <Text modifiers={[font({ size: 12, weight: 'regular' }), foregroundStyle(palette.secondary), lineLimit(1)]}>
        {line}
      </Text>
    );

    return (
      <ZStack modifiers={[containerBackground(palette.card, 'widget')]}>
        <Blobs />
        <VStack spacing={7} modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
          <Spacer />
          <Image systemName='moon.stars.fill' size={26} color={palette.staleIcon} />
          <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(palette.hero)]}>Out of date</Text>
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
    <ZStack modifiers={[containerBackground(palette.card, 'widget')]}>
      <VStack spacing={5} modifiers={[padding({ all: 13 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(palette.hero)]}>{title}</Text>
        <Text modifiers={[font({ size: 12, weight: 'regular' }), foregroundStyle(palette.secondary)]}>{subtitle}</Text>
      </VStack>
    </ZStack>
  );

  if (props == null) {
    return <NeutralCard title='Athan' subtitle='Prayer times for London' />;
  }

  // The glow lighting — three blurred orbs: a main orb above the hero, a
  // bottom-left orb, and a small centered orb rising through the countdown.
  // An orb larger than the card's layout height inflates the card's content
  // area and pushes the footer toward the bottom edge — oversized orbs
  // (the medium 170s) therefore render from a 94pt layout frame scaled up
  // via scaleEffect, a visual transform that cannot affect layout; the
  // blur divides by the scale to land the same softness.
  const OVERSIZE_ORB_LAYOUT = 94;
  const orbLayoutSize = (size: number): number => (size > 155 ? OVERSIZE_ORB_LAYOUT : size);
  const orbScale = (size: number): number => size / orbLayoutSize(size);

  // The light theme renders no orbs — only the dark cards carry the blur.
  const Blobs = () => {
    if (!orbs) {
      return null;
    }
    const bottomLayoutSize = orbLayoutSize(orbs.bottomSize);
    const bottomScale = orbScale(orbs.bottomSize);
    const cornerLayoutSize = orbs.corner ? orbLayoutSize(orbs.corner.size) : 0;
    const cornerScale = orbs.corner ? orbScale(orbs.corner.size) : 1;

    return (
      <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Circle
          modifiers={[
            frame({ width: orbs.topSize, height: orbs.topSize }),
            offset({ x: topOrbX, y: orbs.topY }),
            foregroundStyle(orbs.top),
            blur(topOrbBlur),
          ]}
        />
        <Circle
          modifiers={[
            frame({ width: bottomLayoutSize, height: bottomLayoutSize }),
            scaleEffect(bottomScale),
            offset({ x: orbs.bottomX, y: 60 }),
            foregroundStyle(orbs.bottom),
            blur(40 / bottomScale),
          ]}
        />
        <Circle
          modifiers={[
            frame({ width: orbs.centerSize, height: orbs.centerSize }),
            offset({ x: 0, y: 8 }),
            foregroundStyle(orbs.center),
            blur(30),
          ]}
        />
        {orbs.corner ? (
          <Circle
            modifiers={[
              frame({ width: cornerLayoutSize, height: cornerLayoutSize }),
              scaleEffect(cornerScale),
              offset({ x: orbs.corner.x, y: orbs.corner.y }),
              foregroundStyle(orbs.corner.color),
              blur(orbs.corner.blur / cornerScale),
            ]}
          />
        ) : null}
      </ZStack>
    );
  };

  try {
    // Every timeline entry has passed, or an older app version wrote the
    // entry without segment bounds — both degrade to the refresh card.
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      return <StaleCard />;
    }

    // Footer: the next prayer's date marker, then the short city.
    // Gregorian yields "Mon · Lon"; Hijri yields "Raj 1 · Lon". NOTE: plain
    // string separator only — the extension's JS runtime does not split on
    // regex separators (/\s+/ silently returns the whole string).
    const datePrefix =
      typeof props.dateLabel === 'string' && props.dateLabel.length > 0 ? props.dateLabel.split(',')[0] : '';
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

    // The medium list is only renderable with a complete day snapshot:
    // entries from older app versions or a malformed sequence fall back to
    // the hero-only composition instead of a broken list.
    const rows = Array.isArray(props.prayers) ? props.prayers : [];
    const activeIndex = typeof props.activeIndex === 'number' ? props.activeIndex : -1;
    const listValid = rows.length > 0 && activeIndex >= 0 && activeIndex < rows.length;

    // minLength 0 on the list column's Spacers removes their default
    // minimum, which inflated the HStack's height and pushed the shared
    // hero column's footer past the card's 13pt inset. After that the
    // standard 6-row list still lays the hero column 1pt short of the
    // smalls' inset, so a half-point lift restores it (the runtime applies
    // the offset at double strength).
    const footerLift = isMedium && rows.length >= 6 ? 0.5 : 0;

    // The hero column — the small widget's centered trio plus the footer,
    // shared verbatim by both families so the countdown reads identically.
    const HeroColumn = () => (
      <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Spacer />
        <VStack spacing={6}>
          <Text
            modifiers={[
              font({ size: 12, weight: 'bold' }),
              foregroundStyle(palette.eyebrow),
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
                foregroundStyle(palette.hero),
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
              foregroundStyle(palette.secondary),
              lineLimit(1),
            ]}>
            {props.nextTime}
          </Text>
        </VStack>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 9, weight: 'medium' }),
            foregroundStyle(palette.footer),
            kerning(0.4),
            lineLimit(1),
            minimumScaleFactor(0.6),
            offset({ y: footerLift }),
          ]}>
          {footer}
        </Text>
      </VStack>
    );

    if (isMedium && listValid) {
      // One row per prayer: name leading, time trailing (the app's row
      // anatomy), colored by state — passed and active rows solid, upcoming
      // rows muted. Every time bold, every name regular (owner rule).
      const Row = ({ name, time, index }: { name: string; time: string; index: number }) => {
        const rowColor =
          index === activeIndex ? palette.activeRowText : index < activeIndex ? palette.rowPassed : palette.rowUpcoming;

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

      // The floating active background. A native shape view fills the
      // width its stack proposes — an empty stack with a maxWidth frame
      // collapses to zero width in the widget runtime. The pill anchors to
      // the row BLOCK's top (activeIndex · rowHeight), so it tracks the
      // active row wherever the centered list below places it.
      const pillY = activeIndex * ROW_HEIGHT;
      const pillShadow = palette.pillShadow;

      const ActivePill = () => (
        <RoundedRectangle
          cornerRadius={ROW_CORNER_RADIUS}
          modifiers={[
            foregroundStyle(palette.pillFill),
            strokeBorder({
              color: palette.pillStroke,
              style: { lineWidth: 1 },
              shape: 'roundedRectangle',
              cornerRadius: ROW_CORNER_RADIUS,
            }),
            shadow({ radius: pillShadow.radius, x: pillShadow.x, y: pillShadow.y, color: pillShadow.color }),
            frame({ height: ROW_HEIGHT }),
            offset({ y: pillY }),
          ]}
        />
      );

      return (
        <ZStack modifiers={[containerBackground(palette.card, 'widget')]}>
          <Blobs />
          <HStack
            spacing={14}
            modifiers={[
              padding({ leading: 13, trailing: 20, top: 13, bottom: 13 }),
              frame({ maxWidth: Infinity, maxHeight: Infinity }),
            ]}>
            <HeroColumn />
            {/* The list column: the row block (pill + rows) centers
                vertically between equal Spacers — Infinity frames do not
                make stacks greedy in the widget runtime, so Spacer-
                centering is the only reliable vertical centering. The
                standard 6-row list fills the card's inner height exactly;
                the extras 4/5-row lists get symmetric insets. */}
            <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
              <Spacer minLength={0} />
              <ZStack alignment='top' modifiers={[frame({ width: LIST_WIDTH }), padding({ leading: 4, trailing: 4 })]}>
                <ActivePill />
                <VStack spacing={0} alignment='leading' modifiers={[frame({ maxWidth: Infinity })]}>
                  {rows.map((row, index) => (
                    <Row key={row.name} name={row.name} time={row.time} index={index} />
                  ))}
                </VStack>
              </ZStack>
              <Spacer minLength={0} />
            </VStack>
          </HStack>
        </ZStack>
      );
    }

    // systemSmall (or the medium fallback): the hero alone fills the card.
    return (
      <ZStack modifiers={[containerBackground(palette.card, 'widget')]}>
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

// One layout, eight kinds: the same serialized function body backs the
// light pair, the dark pair, and each pair's small + medium kinds — the
// gallery lists one row per kind, and size-exclusive kinds are what make
// the smalls group before the mediums within each theme. stores/widget.ts
// pushes every kind its own schedule- and theme-stamped timeline; the
// entry props and environment.widgetFamily do the rest.
export const PrayerWidget = createWidget('PrayerWidget', AthanHomeWidget);
export const ExtrasWidget = createWidget('ExtrasWidget', AthanHomeWidget);
export const PrayerWidgetMedium = createWidget('PrayerWidgetMedium', AthanHomeWidget);
export const ExtrasWidgetMedium = createWidget('ExtrasWidgetMedium', AthanHomeWidget);
export const PrayerWidgetDark = createWidget('PrayerWidgetDark', AthanHomeWidget);
export const ExtrasWidgetDark = createWidget('ExtrasWidgetDark', AthanHomeWidget);
export const PrayerWidgetDarkMedium = createWidget('PrayerWidgetDarkMedium', AthanHomeWidget);
export const ExtrasWidgetDarkMedium = createWidget('ExtrasWidgetDarkMedium', AthanHomeWidget);

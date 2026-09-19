// Jetpack names enter unaliased on purpose: the Android widget runtime
// injects @expo/ui/jetpack-compose's exports as globals under their
// canonical names, and the serialized layout body's identifiers resolve
// against those globals — an alias like `Text as Text` compiles
// app-side but is undefined in the widget runtime (caught on the 3T).
// Text/Image/Spacer are shared spellings: the swift-ui globals answer
// them on iOS, the jetpack globals on Android, and the body never needs
// to know which.
import { Box, Column, Row } from '@expo/ui/jetpack-compose';
// Canonical modifier names, same rule as the components above: the Android
// runtime's globals answer these spellings. padding is the one collision
// with swift-ui's modifier of the same name, so the Android calls go
// through a local positional cast inside the widget body.
import {
  fillMaxHeight,
  fillMaxSize,
  fillMaxWidth,
  height,
  type ModifierConfig,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
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
import type { ReactNode } from 'react';

import type { PrayerWidgetAndroidProps, PrayerWidgetProps } from '@/shared/widgetTypes';

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
const AthanHomeWidget = (props: PrayerWidgetProps | PrayerWidgetAndroidProps, environment: WidgetEnvironment) => {
  'widget';

  // The two widget runtimes expose different component globals: iOS injects
  // @expo/ui/swift-ui (VStack...), Android injects @expo/ui/jetpack-compose
  // (Column...). The platform pick therefore rides an identifier that exists
  // on exactly one side, and the two compositions below stay native to their
  // runtime instead of sharing an abstraction that can drift both ways.
  const isAndroidRuntime = typeof Column !== 'undefined';
  const androidProps = props !== null && 'days' in props ? (props as PrayerWidgetAndroidProps) : null;

  // The Android composition spells Text/Image like iOS does (each runtime's
  // globals answer their own platform), but the app-side types come from
  // swift-ui alone, so the jetpack prop shapes ride these local casts.
  // Locals serialize with the body; only free identifiers would not.
  const ATextEl = Text as unknown as (elementProps: {
    color?: string;
    style?: { fontSize?: number; fontWeight?: 'normal' | 'bold' | '600' };
    maxLines?: number;
    children?: string;
  }) => ReactNode;
  const AImageEl = Image as unknown as (elementProps: {
    source?: { uri: string };
    contentScale?: 'fit' | 'fillBounds';
    modifiers?: unknown[];
  }) => ReactNode;
  const APad = padding as unknown as (start: number, top: number, end: number, bottom: number) => ModifierConfig;
  // The time column's Text spans the full list width and right-justifies via
  // textAlign (converter-supported); the cast carries the jetpack-only
  // textAlign prop past the swift-ui typing, like ATextEl/AImageEl
  const ATimeEl = Text as unknown as (elementProps: {
    color?: string;
    style?: { fontSize?: number; fontWeight?: 'normal' | 'bold' | '600' };
    maxLines?: number;
    textAlign?: 'end';
    modifiers?: ModifierConfig[];
    children?: string;
  }) => ReactNode;

  // Theme and schedule arrive on the entry — each gallery kind receives
  // its own timeline, so the palette is fixed at placement. The props-less
  // gallery placeholder (and legacy entries without `theme`) falls back to
  // the system color scheme.
  const isExtra = props?.schedule === 'extra';
  const fallbackTheme = environment.colorScheme === 'dark' ? 'dark' : 'light';
  const theme = props?.theme ?? fallbackTheme;
  const isDark = theme === 'dark';
  const isMedium = isAndroidRuntime ? androidProps?.size === 'medium' : environment.widgetFamily === 'systemMedium';
  // The iOS entries below read `entry`; Android data rides androidProps.
  const entry = props === null ? null : (props as PrayerWidgetProps);

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
    secondary: isMedium ? 'rgba(160, 182, 228, 0.54)' : 'rgba(173, 193, 254, 0.54)',
    footer: isMedium ? 'rgba(146, 164, 212, 0.38)' : 'rgba(156, 169, 222, 0.38)',
    staleIcon: '#ff69b4',
    rowPassed: '#ffffff',
    rowUpcoming: isMedium ? 'rgba(160, 182, 228, 0.6)' : 'rgba(173, 193, 254, 0.6)',
    activeRowText: isExtra ? '#ffeaf4' : '#e3eaff',
    pillFill: isExtra ? '#a123aa' : '#0847e5',
    pillStroke: isExtra ? 'rgba(146, 0, 162, 0.35)' : 'rgba(8, 71, 229, 0.35)',
    pillShadow: {
      color: isExtra ? 'rgba(95, 10, 115, 0.5)' : 'rgba(10, 30, 140, 0.5)',
      radius: 9,
      x: 0,
      y: 2,
    },
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
      top: 'rgba(155, 30, 255, 0.22)',
      bottom: 'rgba(128, 0, 255, 0.45)',
      center: 'rgba(130, 145, 240, 0.3)',
      topSize: 165,
      topY: -75,
      bottomSize: 195,
      bottomX: -110,
      centerSize: 44,
      corner: { color: 'rgba(55, 75, 235, 0.17)', size: 255, x: 95, y: 58, blur: 75 },
    },
  };

  const palette = isDark ? DARK : LIGHT;
  const orbs = isDark ? (isMedium ? DARK.orbsMedium : DARK.orbsSmall) : null;
  // The top orb's x and blur anchor to each family's absolute card coords —
  // center-relative offsets land it in the small card's corner on medium.
  const topOrbX = isMedium ? -5 : 30;
  const topOrbBlur = isMedium ? 60 : 38;
  const bottomOrbBlur = isMedium ? 82 : 40;

  // Fixed row height keeps the floating pill's offset exact and the
  // spacing static. Six 22pt rows fill the systemMedium inner height
  // exactly, so the standard list sits flush; the shorter extras lists
  // center between equal Spacers (see the list column below). The corner
  // radius keeps the app's pill-to-row proportion.
  const ROW_HEIGHT = 22;
  const ROW_TEXT_SIZE = 12;
  const ROW_CORNER_RADIUS = 4;
  const LIST_WIDTH = 148;
  // Uniform footer lift on every Android kind (owner ruling 2026-09-19):
  // one bottom offset, both sizes, both themes, both schedules.
  const FOOTER_BOTTOM_PAD = 16;
  // The active pill clears its row's text vertically (owner ruling
  // 2026-09-19): 2dp above and below the 22dp row.
  const PILL_VPAD = 2;
  // Fixed hero width: a fillMaxWidth fraction on the first Row child let
  // the hero take the full card and squeezed the day list to zero width in
  // Glance (caught on the 3T: the medium rendered hero-only, centered).
  // 132dp with the 148dp list splits the full-width medium roughly in half
  // and stays inside the 4-cell medium on clamping launchers.
  const HERO_WIDTH = 132;
  const ROW_NAME_WIDTH = 76;
  const ROW_TIME_WIDTH = 46;

  // ===== Android composition =====
  // The Android widget runtime (jetpack globals) computes everything at
  // render time from the snapshot: the label, the active row and the stale
  // state are derived from the carried epochs, so every render inside the
  // window is correct without a new push. iOS keeps its precomputed-entry
  // path below, byte-identical.
  const A_CARD_NAME = isDark
    ? isMedium
      ? 'athan_widget_card_dark_medium'
      : 'athan_widget_card_dark_small'
    : isMedium
      ? 'athan_widget_card_light_medium'
      : 'athan_widget_card_light_small';
  const A_MOON_NAME = isDark ? 'athan_widget_moon_dark' : 'athan_widget_moon_light';
  const A_PILL_NAME = `athan_widget_pill_${isExtra ? 'extra' : 'standard'}_${theme}`;

  const AText = (text: string, size: number, weight: 'normal' | 'bold' | '600', color: string) => (
    <ATextEl color={color} style={{ fontSize: size, fontWeight: weight }} maxLines={1}>
      {text}
    </ATextEl>
  );

  const ATimeText = (text: string, size: number, weight: 'normal' | 'bold' | '600', color: string) => (
    <ATimeEl color={color} style={{ fontSize: size, fontWeight: weight }} maxLines={1}>
      {text}
    </ATimeEl>
  );

  const ACard = (footer: string | null, content: ReactNode) => (
    <Box contentAlignment={footer === null ? 'center' : 'bottomCenter'} modifiers={[fillMaxSize()]}>
      <AImageEl source={{ uri: A_CARD_NAME }} contentScale='fillBounds' modifiers={[fillMaxSize()]} />
      <Box contentAlignment='center' modifiers={[fillMaxSize(), APad(13, 13, 13, FOOTER_BOTTOM_PAD + 18)]}>
        {content}
      </Box>
      {footer === null ? null : (
        <Row modifiers={[height(16), APad(0, 0, 0, FOOTER_BOTTOM_PAD)]} verticalAlignment='center'>
          {AText(footer, 9, 'normal', palette.footer)}
        </Row>
      )}
    </Box>
  );

  // The minute-ceil countdown, mirroring formatCountdownMinutes in
  // shared/time.ts: seconds never render, the value rounds up, and it never
  // reads below one minute.
  const ALabel = (targetEpochMs: number, nowMs: number): string => {
    const totalMinutes = Math.max(1, Math.ceil((targetEpochMs - nowMs) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // "Mon · Lon" from a Gregorian label, "Raj 1 · Lon" from a Hijri one —
  // the same token shortening the iOS footer performs.
  const AFooter = (label: string): string => {
    const datePrefix = typeof label === 'string' && label.length > 0 ? label.split(',')[0] : '';
    const dateTokens = datePrefix.split(' ');
    if (dateTokens.length === 1) return dateTokens[0] ? `${dateTokens[0]} · Lon` : 'Lon';
    const monthPrefix = dateTokens[0].slice(0, 3);
    const dayNumber = dateTokens[dateTokens.length - 1];
    return `${monthPrefix} ${dayNumber} · Lon`;
  };

  const ANeutral = () =>
    ACard(
      null,
      <Column horizontalAlignment='center'>
        {AText('Athan', 15, '600', palette.hero)}
        <Spacer modifiers={[height(5)]} />
        {AText('Prayer times for London', 12, 'normal', palette.secondary)}
      </Column>
    );

  const AStale = () =>
    ACard(
      null,
      <Column horizontalAlignment='center'>
        <AImageEl source={{ uri: A_MOON_NAME }} contentScale='fit' modifiers={[width(26), height(26)]} />
        <Spacer modifiers={[height(7)]} />
        {AText('Out of date', 14, '600', palette.hero)}
        <Spacer modifiers={[height(7)]} />
        {isMedium ? (
          AText('Open Athan to refresh', 12, 'normal', palette.secondary)
        ) : (
          <Column horizontalAlignment='center'>
            {AText('Open Athan', 12, 'normal', palette.secondary)}
            <Spacer modifiers={[height(1)]} />
            {AText('to refresh', 12, 'normal', palette.secondary)}
          </Column>
        )}
      </Column>
    );

  const androidRender = (input: PrayerWidgetAndroidProps) => {
    const nowMs = Date.now();

    type ARow = PrayerWidgetAndroidProps['days'][number]['rows'][number];
    let next: ARow | null = null;
    let nextEpoch: number | null = null;
    let nextDayLabel = '';
    for (const day of input.days) {
      for (const row of day.rows) {
        const epoch = row.epochMs;
        // 0 is the unavailable encoding; snapshots stored by older builds may still hold null
        if (!(epoch > nowMs)) continue;
        if (nextEpoch === null || epoch < nextEpoch) {
          next = row;
          nextEpoch = epoch;
          nextDayLabel = day.dateLabel;
        }
      }
    }

    if (nowMs > input.horizonEpochMs || next === null || !(next.epochMs > 0)) {
      return <AStale />;
    }

    const footer = AFooter(nextDayLabel);
    const trio = (
      <Column horizontalAlignment='center'>
        {AText(next.name.toUpperCase(), 12, 'bold', palette.eyebrow)}
        <Spacer modifiers={[height(6)]} />
        {AText(ALabel(next.epochMs, nowMs), 26, 'bold', palette.hero)}
        <Spacer modifiers={[height(6)]} />
        {AText(next.time, 13, 'normal', palette.secondary)}
      </Column>
    );

    // The on-screen day follows the NEXT prayer's day, not the calendar
    // day: after today's Isha the list rolls to tomorrow with Fajr active,
    // exactly when the countdown target rolls (the app's and iOS's rule).
    type ADay = PrayerWidgetAndroidProps['days'][number];
    const fallbackDay: ADay = { dateLabel: '', startEpochMs: 0, rows: [] };
    let onScreenDay = fallbackDay;
    for (const day of input.days) {
      if (day.rows.some((row) => row === next)) onScreenDay = day;
    }
    const dayRows = onScreenDay.rows;
    const activeIndex = dayRows.indexOf(next);
    const listValid = dayRows.length > 0 && activeIndex >= 0 && activeIndex < dayRows.length;

    if (!isMedium || !listValid) {
      return ACard(footer, trio);
    }

    // Names and times render as overlayed layers, not one Row: a
    // fillMaxWidth Spacer between them starves the trailing time to zero
    // width in Glance (same starvation class as the hero column). Times
    // right-justify via textAlign on a full-width Text.
    // One self-contained row: fixed-width name and time boxes with pure
    // alignment (topStart / topEnd). Every fill-based or overlay-based
    // two-column attempt mislaid the times in the Glance stack (three
    // device-caught failures); fixed boxes with small slack render exactly.
    const ARowLine = (row: ARow, index: number) => {
      const rowColor =
        index === activeIndex ? palette.activeRowText : index < activeIndex ? palette.rowPassed : palette.rowUpcoming;
      return (
        <Row verticalAlignment='center' modifiers={[height(ROW_HEIGHT), APad(8, 0, 8, 0)]}>
          <Box contentAlignment='centerStart' modifiers={[height(ROW_HEIGHT), width(ROW_NAME_WIDTH)]}>
            {AText(row.name, ROW_TEXT_SIZE, 'normal', rowColor)}
          </Box>
          <Box contentAlignment='centerEnd' modifiers={[height(ROW_HEIGHT), width(ROW_TIME_WIDTH)]}>
            {ATimeText(row.time, ROW_TEXT_SIZE, 'bold', rowColor)}
          </Box>
        </Row>
      );
    };

    return (
      <Box contentAlignment='topStart' modifiers={[fillMaxSize()]}>
        <AImageEl source={{ uri: A_CARD_NAME }} contentScale='fillBounds' modifiers={[fillMaxSize()]} />
        <Row modifiers={[fillMaxSize(), APad(13, 13, 20, FOOTER_BOTTOM_PAD)]}>
          <Box contentAlignment='bottomCenter' modifiers={[fillMaxHeight(), width(HERO_WIDTH)]}>
            <Box contentAlignment='center' modifiers={[fillMaxSize(), APad(0, 0, 0, 24)]}>
              {trio}
            </Box>
            {AText(footer, 9, 'normal', palette.footer)}
          </Box>
          <Box contentAlignment='centerEnd' modifiers={[fillMaxHeight(), fillMaxWidth()]}>
            <Box contentAlignment='topStart' modifiers={[width(LIST_WIDTH)]}>
              <Column>
                <Spacer modifiers={[height(Math.max(0, activeIndex * ROW_HEIGHT - PILL_VPAD))]} />
                <AImageEl
                  source={{ uri: A_PILL_NAME }}
                  contentScale='fillBounds'
                  modifiers={[fillMaxWidth(), height(ROW_HEIGHT + 2 * PILL_VPAD)]}
                />
              </Column>
              <Column>{dayRows.map((row, index) => ARowLine(row, index))}</Column>
            </Box>
          </Box>
        </Row>
      </Box>
    );
  };

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

  if (entry == null) {
    if (isAndroidRuntime) {
      return <ANeutral />;
    }
    return <NeutralCard title='Athan' subtitle='Prayer times for London' />;
  }

  if (isAndroidRuntime) {
    if (androidProps === null) {
      return <ANeutral />;
    }
    return androidRender(androidProps);
  }

  // The glow lighting — three blurred orbs: a main orb above the hero, a
  // bottom-left orb, and a small centered orb rising through the countdown.
  // An orb larger than the card's layout height inflates the card's content
  // area and pushes the footer toward the bottom edge — oversized orbs
  // (the medium 165s–195s) therefore render from a 94pt layout frame scaled up
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
    const topLayoutSize = orbLayoutSize(orbs.topSize);
    const topScale = orbScale(orbs.topSize);
    const cornerLayoutSize = orbLayoutSize(orbs.corner.size);
    const cornerScale = orbScale(orbs.corner.size);

    return (
      <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Circle
          modifiers={[
            frame({ width: topLayoutSize, height: topLayoutSize }),
            scaleEffect(topScale),
            offset({ x: topOrbX, y: orbs.topY }),
            foregroundStyle(orbs.top),
            blur(topOrbBlur / topScale),
          ]}
        />
        <Circle
          modifiers={[
            frame({ width: bottomLayoutSize, height: bottomLayoutSize }),
            scaleEffect(bottomScale),
            offset({ x: orbs.bottomX, y: 60 }),
            foregroundStyle(orbs.bottom),
            blur(bottomOrbBlur / bottomScale),
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
        <Circle
          modifiers={[
            frame({ width: cornerLayoutSize, height: cornerLayoutSize }),
            scaleEffect(cornerScale),
            offset({ x: orbs.corner.x, y: orbs.corner.y }),
            foregroundStyle(orbs.corner.color),
            blur(orbs.corner.blur / cornerScale),
          ]}
        />
      </ZStack>
    );
  };

  try {
    // Every timeline entry has passed, or an older app version wrote the
    // entry without segment bounds — both degrade to the refresh card.
    const segmentValid = typeof entry.nextEpochMs === 'number' && typeof entry.prevEpochMs === 'number';
    if (entry.stale === true || !segmentValid) {
      return <StaleCard />;
    }

    // Footer: the next prayer's date marker, then the short city.
    // Gregorian yields "Mon · Lon"; Hijri yields "Raj 1 · Lon". NOTE: plain
    // string separator only — the extension's JS runtime does not split on
    // regex separators (/\s+/ silently returns the whole string).
    const datePrefix =
      typeof entry.dateLabel === 'string' && entry.dateLabel.length > 0 ? entry.dateLabel.split(',')[0] : '';
    const dateTokens = datePrefix.split(' ');
    let dayPart = '';
    if (dateTokens.length === 1) {
      dayPart = dateTokens[0];
    } else {
      const monthPrefix = dateTokens[0].slice(0, 3);
      const dayNumber = dateTokens[dateTokens.length - 1];
      dayPart = `${monthPrefix} ${dayNumber}`;
    }
    const footer = dayPart ? `${dayPart} · Lon` : 'Lon';

    // The medium list is only renderable with a complete day snapshot:
    // entries from older app versions or a malformed sequence fall back to
    // the hero-only composition instead of a broken list.
    const rows = Array.isArray(entry.prayers) ? entry.prayers : [];
    const activeIndex = typeof entry.activeIndex === 'number' ? entry.activeIndex : -1;
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
            {entry.nextName}
          </Text>
          {typeof entry.countdownLabel === 'string' && entry.countdownLabel.length > 0 ? (
            <Text
              modifiers={[
                font({ size: 26, weight: 'bold' }),
                monospacedDigit(),
                foregroundStyle(palette.hero),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}>
              {entry.countdownLabel}
            </Text>
          ) : null}{' '}
          <Text
            modifiers={[
              font({ size: 13, weight: 'regular' }),
              monospacedDigit(),
              foregroundStyle(palette.secondary),
              lineLimit(1),
            ]}>
            {entry.nextTime}
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
            frame({ height: ROW_HEIGHT + 2 * PILL_VPAD }),
            offset({ y: pillY - PILL_VPAD }),
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
// entry entry and environment.widgetFamily do the rest.
export const PrayerWidget = createWidget('PrayerWidget', AthanHomeWidget);
export const ExtrasWidget = createWidget('ExtrasWidget', AthanHomeWidget);
export const PrayerWidgetMedium = createWidget('PrayerWidgetMedium', AthanHomeWidget);
export const ExtrasWidgetMedium = createWidget('ExtrasWidgetMedium', AthanHomeWidget);
export const PrayerWidgetDark = createWidget('PrayerWidgetDark', AthanHomeWidget);
export const ExtrasWidgetDark = createWidget('ExtrasWidgetDark', AthanHomeWidget);
export const PrayerWidgetDarkMedium = createWidget('PrayerWidgetDarkMedium', AthanHomeWidget);
export const ExtrasWidgetDarkMedium = createWidget('ExtrasWidgetDarkMedium', AthanHomeWidget);

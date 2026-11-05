/**
 * The round-9 Extra Schedule screen (T-623, surface A): the REAL extras page
 * - the app's own Countdown, Day, ActiveBackground and prayer rows over the
 * real sequence - with one addition: the design's automation indicator rides
 * an absolutely-positioned layer around the Suhoor row's alerts bell (the
 * real Alert component, untouched) whenever the selection is not Every day.
 * The row wrapper mirrors components/prayer/Prayer.tsx's own layout so the
 * list reads pixel-identical; the bells and times are the shipped components.
 * Dev-only: nothing shipped imports here.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Countdown } from '@/components/countdown';
import { Day } from '@/components/day';
import ActiveBackground from '@/components/prayer/ActiveBackground';
import Alert from '@/components/prayer/Alert';
import Time from '@/components/prayer/Time';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { COLORS, type PrayerId, RADIUS, SCREEN, SIZE, SPACING, STYLES, TEXT } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { honoredTopInset } from '@/shared/insets';
import { canonicalDisplayOrder } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import type { R2Selection } from '../r2/model';
import { R9_CATALOG, type R9CatalogRow, r9RowFor } from './catalog';
import { R9IndicatorLayer } from './indicators';
import { STRIP_LABEL_PREFIX } from './model';
import { r9DesignFromParam, r9Seed } from './seed';

const SUHOOR: PrayerId = 'suhoor';

export function ExtrasR9Screen() {
  const params = useLocalSearchParams<{
    r9?: string | string[];
    state?: string | string[];
    bare?: string | string[];
  }>();
  const design = r9DesignFromParam(params.r9) ?? 1;
  const row = r9RowFor(design);
  const selection = useMemo(() => r9Seed(params.state), [params.state]);
  const bare = firstParam(params.bare) === '1';

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <LinearGradient style={styles.screen} colors={[COLORS.gradient.screen.start, COLORS.gradient.screen.end]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: honoredTopInset(insets.top, width) + SCREEN.paddingTop,
            paddingBottom: insets.bottom,
            maxWidth: SIZE.contentMaxWidth,
          },
        ]}>
        <Countdown type={ScheduleType.Extra} />
        <Day type={ScheduleType.Extra} />
        <ExtrasList row={row} selection={selection} />
      </View>
      {!bare && <ExtrasStrip design={design} />}
    </LinearGradient>
  );
}

/** The extras rows in canonical order, the indicator spliced into Suhoor's bell anchor */
function ExtrasList({ row, selection }: { readonly row: R9CatalogRow; readonly selection: R2Selection }) {
  const { prayers, displayDate, isReady } = usePrayerSequence(ScheduleType.Extra);
  if (!isReady) return null;

  const todayPrayers = prayers.filter((prayer) => prayer.belongsToDate === displayDate);
  const displayOrder = canonicalDisplayOrder(todayPrayers, ScheduleType.Extra);

  return (
    <View style={styles.list}>
      <ActiveBackground type={ScheduleType.Extra} />
      {displayOrder.map((prayerIndex) => (
        <ExtrasRow
          key={prayerIndex}
          index={prayerIndex}
          isSuhoor={prayers[prayerIndex]?.id === SUHOOR}
          row={row}
          selection={selection}
        />
      ))}
    </View>
  );
}

/** The row wrapper: components/prayer/Prayer.tsx's layout, static ink */
function ExtrasRow({
  index,
  isSuhoor,
  row,
  selection,
}: {
  readonly index: number;
  readonly isSuhoor: boolean;
  readonly row: R9CatalogRow;
  readonly selection: R2Selection;
}) {
  const prayer = usePrayer(ScheduleType.Extra, index);
  const shownName = prayer.time === '' ? '' : prayerLabel(prayer.id);
  const ink = prayer.ui.initialColorPos === 1 ? COLORS.text.primary : COLORS.text.muted;

  return (
    <View style={styles.rowContainer}>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowText,
            styles.rowName,
            { width: prayer.ui.maxEnglishWidth + STYLES.prayer.padding.start, color: ink },
          ]}>
          {shownName}
        </Text>
        <Time index={index} type={ScheduleType.Extra} />
        <View style={styles.alertSlot}>
          <Alert index={index} type={ScheduleType.Extra} />
          {isSuhoor && <R9IndicatorLayer row={row} selection={selection} />}
        </View>
      </View>
    </View>
  );
}

/** The strip: design navigation only, hidden from bare frames */
function ExtrasStrip({ design }: { readonly design: number }) {
  const count = STRIP_TOTAL;
  return (
    <View style={styles.strip}>
      <Text style={styles.stripLabel}>{`${STRIP_LABEL_PREFIX} ${design} / ${count}`}</Text>
    </View>
  );
}

const STRIP_TOTAL = R9_CATALOG.length;

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  list: {
    marginHorizontal: SCREEN.paddingHorizontal,
    marginBottom: 34,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STYLES.prayer.height,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  rowText: {
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.size),
  },
  rowName: {
    paddingStart: STYLES.prayer.padding.start,
  },
  alertSlot: {
    position: 'relative',
  },
  strip: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stripLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    backgroundColor: 'rgba(10, 14, 30, 0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
});

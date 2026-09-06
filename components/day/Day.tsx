import { useAtomValue } from 'jotai';
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Masjid } from '@/components/ui';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { ANIMATION, COLORS, SCREEN, SPACING, TEXT } from '@/shared/constants';
import { formatDateLong, formatHijriDateLong } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { getOverlayActiveForTypeAtom, getOverlaySelectedIndexForTypeAtom } from '@/stores/atoms/overlay';
import { extraDisplayDateAtom, standardDisplayDateAtom } from '@/stores/schedule';
import { hijriDateEnabledAtom } from '@/stores/ui';

// Prop-less SVG — memoized so overlay toggles (which re-render Day) never
// re-render the icon's native views
const MemoizedMasjid = memo(Masjid);

interface Props {
  type: ScheduleType;
}

export default function Day({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  // NEW: Use sequence-based derived displayDate
  // See: ai/adr/005-timing-system-overhaul.md
  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;
  const date = useAtomValue(displayDateAtom) ?? '';
  const hijriEnabled = useAtomValue(hijriDateEnabledAtom);

  // Overlay-aware date (ADR-014): while the overlay highlights a prayer on
  // THIS schedule, the date shows that prayer's next occurrence (what the old
  // duplicated date copy displayed). The Day block otherwise stays EXACTLY as
  // the non-overlay visual (owner directive: dim location, WHITE date — no
  // recolor). Type-scoped derived atoms: the OTHER schedule's Day never
  // re-renders on toggle.
  const showOverlayDate = useAtomValue(useMemo(() => getOverlayActiveForTypeAtom(type), [type]));
  const overlaySelectedIndex = useAtomValue(useMemo(() => getOverlaySelectedIndexForTypeAtom(type), [type]));
  const OverlayPrayer = usePrayer(type, overlaySelectedIndex, true);
  const dateSource = showOverlayDate ? OverlayPrayer.date : date;

  // Per-element veil (ADR-014): the Masjid icon fades out with the overlay's
  // fade — the old overlay hid it under the opaque gradient
  const masjidOpacity = useAnimationOpacity(1);

  useEffect(() => {
    masjidOpacity.animate(showOverlayDate ? 0 : 1, { duration: ANIMATION.duration });
  }, [showOverlayDate, masjidOpacity.animate]);

  // Hijri formatting is expensive on the floor device (umalqura Intl) — memo
  // so overlay toggles never re-format an unchanged date string
  const formattedDate = useMemo(
    () => (hijriEnabled ? formatHijriDateLong(dateSource) : formatDateLong(dateSource)),
    [hijriEnabled, dateSource]
  );

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <Animated.View style={masjidOpacity.style}>
        <MemoizedMasjid />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SCREEN.paddingHorizontal + 2,
    paddingLeft: SCREEN.paddingHorizontal + 4,
  },
  location: {
    color: COLORS.text.secondary,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    marginBottom: SPACING.quart,
  },
  date: {
    fontFamily: TEXT.family.regular,
    color: COLORS.text.primary,
    fontSize: TEXT.size,
  },
});

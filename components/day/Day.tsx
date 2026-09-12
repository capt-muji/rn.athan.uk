import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Masjid } from '@/components/ui';
import { useDerivedOpacity } from '@/hooks/useAnimation';
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

  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;
  const date = useAtomValue(displayDateAtom);
  const hijriEnabled = useAtomValue(hijriDateEnabledAtom);

  // Overlay-aware date (ADR-014): while the overlay highlights a prayer on
  // THIS schedule, the date shows that prayer's next occurrence. Type-scoped
  // derived atoms: the OTHER schedule's Day never re-renders on toggle.
  const showOverlayDate = useAtomValue(useMemo(() => getOverlayActiveForTypeAtom(type), [type]));
  const overlaySelectedIndex = useAtomValue(useMemo(() => getOverlaySelectedIndexForTypeAtom(type), [type]));
  const OverlayPrayer = usePrayer(type, overlaySelectedIndex, true);
  const dateSource = showOverlayDate ? OverlayPrayer.date : date;

  const masjidOpacityStyle = useDerivedOpacity(showOverlayDate ? 0 : 1, { duration: ANIMATION.duration });

  // Hijri formatting is expensive on the floor device (umalqura Intl) — memo
  // so overlay toggles never re-format an unchanged date string
  const formattedDate = useMemo(() => {
    // Day is the only belongsToDate consumer with no isReady gate — List,
    // usePrayer and useSchedule all have one. Coercing a null date to '' sent
    // `''.split('-').map(Number)` into an Invalid Date, and date-fns `format`
    // throws on it; the Hijri branch is no safer, because it calls
    // formatDateLong from inside its own catch and throws again, uncaught.
    if (!dateSource) return '';
    return hijriEnabled ? formatHijriDateLong(dateSource) : formatDateLong(dateSource);
  }, [hijriEnabled, dateSource]);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <Animated.View style={masjidOpacityStyle}>
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

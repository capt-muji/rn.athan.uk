import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, Pressable, View, ViewStyle, Platform } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Countdown } from '@/components/countdown';
import { Prayer, PrayerExplanation } from '@/components/prayer';
import { Glow } from '@/components/ui';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import {
  OVERLAY,
  ANIMATION,
  SCREEN,
  STYLES,
  COLORS,
  TEXT,
  SHADOW,
  SPACING,
  EXTRAS_ENGLISH,
  EXTRAS_EXPLANATIONS,
  EXTRAS_EXPLANATIONS_ARABIC,
} from '@/shared/constants';
import { formatDateLong, formatHijriDateLong } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom, toggleOverlay } from '@/stores/overlay';
import { measurementsListAtom, measurementsDateAtom, hijriDateEnabledAtom } from '@/stores/ui';

/**
 * Full-screen overlay for focused prayer view
 *
 * Displays a selected prayer in an expanded view with:
 * - Large countdown timer at the top
 * - Selected prayer row with notification controls
 * - Prayer explanation tooltip (for extra prayers)
 * - Date display (Gregorian or Hijri)
 * - Gradient background with glow effect
 *
 * The overlay positions the prayer row to match its original location
 * in the schedule list for a seamless transition effect.
 */
export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);
  const selectedPrayer = usePrayer(overlay.scheduleType, overlay.selectedPrayerIndex, true);
  const backgroundOpacity = useAnimationOpacity(0);
  const dateOpacity = useAnimationOpacity(0);

  const listMeasurements = useAtomValue(measurementsListAtom);
  const dateMeasurements = useAtomValue(measurementsDateAtom);
  const hijriEnabled = useAtomValue(hijriDateEnabledAtom);

  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleOverlay();
  };

  useEffect(() => {
    if (overlay.isOn) {
      backgroundOpacity.animate(1, { duration: ANIMATION.duration });
      dateOpacity.animate(1, { duration: ANIMATION.duration });
    } else {
      backgroundOpacity.animate(0, { duration: ANIMATION.duration });
      dateOpacity.animate(0, { duration: ANIMATION.duration });
    }
  }, [overlay.isOn]);

  const computedStyleContainer: ViewStyle = {
    pointerEvents: overlay.isOn ? 'auto' : 'none',
  };

  const computedStyleCountdown: ViewStyle = {
    top: insets.top + SCREEN.paddingTop,
  };

  const computedStyleDate: ViewStyle = {
    top: (dateMeasurements?.pageY ?? 0) + (Platform.OS === 'android' ? insets.top : 0),
    left: dateMeasurements?.pageX ?? 0,
  };

  // Colors and shadows based on schedule type
  const isExtra = overlay.scheduleType === ScheduleType.Extra;
  const glowColor = isExtra ? COLORS.glow.overlayExtras : COLORS.glow.overlay;
  const activeBackgroundColor = isExtra ? COLORS.prayer.activeBackgroundExtras : COLORS.prayer.activeBackground;
  const shadowColor = isExtra ? COLORS.shadow.prayerExtras : COLORS.shadow.prayer;
  const shadowStyle = isExtra ? SHADOW.prayerExtras : SHADOW.prayer;

  const computedStylePrayer: ViewStyle = {
    top:
      (listMeasurements?.pageY ?? 0) +
      (Platform.OS === 'android' ? insets.top : 0) +
      overlay.selectedPrayerIndex * STYLES.prayer.height,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
    ...shadowStyle,
    shadowColor,
    ...(selectedPrayer.isNext && { backgroundColor: activeBackgroundColor }),
  };

  // First 3 items (indices 0, 1, 2) show info box below, rest show above
  const showInfoBoxAbove = overlay.selectedPrayerIndex >= 3;

  // Info box positioned below prayer row (for first 3 items)
  const computedStyleInfoBoxBelow: ViewStyle = {
    top:
      (listMeasurements?.pageY ?? 0) +
      (Platform.OS === 'android' ? insets.top : 0) +
      overlay.selectedPrayerIndex * STYLES.prayer.height +
      STYLES.prayer.height +
      SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
  };

  // Info box positioned above prayer row (for items 4+)
  const computedStyleInfoBoxAbove: ViewStyle = {
    bottom:
      window.height -
      (listMeasurements?.pageY ?? 0) -
      (Platform.OS === 'android' ? insets.top + insets.bottom : 0) -
      overlay.selectedPrayerIndex * STYLES.prayer.height +
      SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
  };

  const computedStyleInfoBox = showInfoBoxAbove ? computedStyleInfoBoxAbove : computedStyleInfoBoxBelow;

  const prayerName = isExtra ? EXTRAS_ENGLISH[overlay.selectedPrayerIndex] : null;
  const explanation = isExtra ? EXTRAS_EXPLANATIONS[overlay.selectedPrayerIndex] : null;
  const explanationArabic = isExtra ? EXTRAS_EXPLANATIONS_ARABIC[overlay.selectedPrayerIndex] : null;

  const formattedDate = hijriEnabled ? formatHijriDateLong(selectedPrayer.date) : formatDateLong(selectedPrayer.date);

  return (
    <Reanimated.View style={[styles.container, computedStyleContainer, backgroundOpacity.style]}>
      {/* Countdown */}
      <View style={[styles.countdown, computedStyleCountdown]}>
        <Countdown type={overlay.scheduleType} />
      </View>
      <Pressable style={{ flex: 1 }} onPress={handleClose} />

      {/* Date */}
      <Reanimated.Text style={[styles.date, computedStyleDate as object, dateOpacity.style]}>
        {formattedDate}
      </Reanimated.Text>

      {/* Prayer overlay */}
      <View style={[styles.prayer, computedStylePrayer]}>
        <Prayer index={overlay.selectedPrayerIndex} type={overlay.scheduleType} isOverlay />
      </View>

      {/* Prayer explanation box */}
      {isExtra && prayerName && explanation && explanationArabic && (
        <PrayerExplanation
          prayerName={prayerName}
          explanation={explanation}
          explanationArabic={explanationArabic}
          arrowPosition={showInfoBoxAbove ? 'bottom' : 'top'}
          style={computedStyleInfoBox}
        />
      )}

      {/* Gradient background */}
      <LinearGradient
        colors={[COLORS.gradient.overlay.start, COLORS.gradient.overlay.end]}
        style={[StyleSheet.absoluteFill, styles.gradientContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Glow
        color={glowColor}
        style={{
          top: -window.width / 1.25,
          left: -window.width / 2,
        }}
      />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
  },
  countdown: {
    position: 'absolute',
    pointerEvents: 'none',
    left: 0,
    right: 0,
  },
  date: {
    position: 'absolute',
    pointerEvents: 'none',
    color: COLORS.text.secondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  prayer: {
    ...STYLES.prayer.border,
    position: 'absolute',
    width: '100%',
    height: STYLES.prayer.height,
  },
  gradientContainer: {
    zIndex: -1,
  },
});

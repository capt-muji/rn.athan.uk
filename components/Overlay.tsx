import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, Pressable, View, ViewStyle, Dimensions, Platform } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Glow from '@/components/Glow';
import Prayer from '@/components/Prayer';
import Timer from '@/components/Timer';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { OVERLAY, ANIMATION, SCREEN, STYLES, COLORS, TEXT } from '@/shared/constants';
import { measurementsAtom, overlayAtom, toggleOverlay } from '@/stores/overlay';

export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);
  const selectedPrayer = usePrayer(overlay.scheduleType, overlay.selectedPrayerIndex, true);
  const backgroundOpacity = useAnimationOpacity(0);
  const dateOpacity = useAnimationOpacity(0);

  const measurements = useAtomValue(measurementsAtom);

  const insets = useSafeAreaInsets();

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

  const computedStyleTimer: ViewStyle = {
    top: insets.top + SCREEN.paddingHorizontal,
  };

  const computedStyleDate: ViewStyle = {
    top: (measurements.date?.pageY ?? 0) + (Platform.OS === 'android' ? insets.top : 0),
    left: measurements.date?.pageX ?? 0,
    width: measurements.date?.width ?? 0,
    height: measurements.date?.height ?? 0,
  };

  const computedStylePrayer: ViewStyle = {
    top:
      (measurements.list?.pageY ?? 0) +
      (Platform.OS === 'android' ? insets.top : 0) +
      overlay.selectedPrayerIndex * STYLES.prayer.height,
    left: measurements.list?.pageX ?? 0,
    width: measurements.list?.width ?? 0,
    ...(selectedPrayer.isNext && styles.activeBackground),
  };

  return (
    <Reanimated.View style={[styles.container, computedStyleContainer, backgroundOpacity.style]}>
      {/* Timer */}
      <View style={[styles.timer, computedStyleTimer]}>
        <Timer type={overlay.scheduleType} isOverlay />
      </View>
      <Pressable style={{ flex: 1 }} onPress={handleClose} />

      {/* Date */}
      <Reanimated.Text style={[styles.date, computedStyleDate, dateOpacity.style]}>
        {selectedPrayer.isPassed ? 'Tomorrow' : 'Today'}
      </Reanimated.Text>

      {/* Prayer overlay */}
      <View style={[styles.prayer, computedStylePrayer]}>
        <Prayer index={overlay.selectedPrayerIndex} type={overlay.scheduleType} isOverlay />
      </View>

      {/* Gradient background */}
      <LinearGradient
        colors={['#110022', 'black']}
        style={[StyleSheet.absoluteFill, styles.gradientContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Glow
        color={COLORS.glows.overlay}
        style={{
          top: -Dimensions.get('window').width / 1.25,
          left: -Dimensions.get('window').width / 2,
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
  timer: {
    position: 'absolute',
    pointerEvents: 'none',
    left: 0,
    right: 0,
  },
  date: {
    position: 'absolute',
    pointerEvents: 'none',
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  prayer: {
    ...STYLES.prayer.border,
    ...STYLES.prayer.shadow,
    position: 'absolute',
    width: '100%',
    height: STYLES.prayer.height,
    shadowColor: COLORS.standardActiveBackgroundShadow,
  },
  activeBackground: {
    backgroundColor: COLORS.activeBackground,
  },
  gradientContainer: {
    zIndex: -1,
  },
});

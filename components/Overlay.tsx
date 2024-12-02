import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { StyleSheet, Pressable, View, ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Countdown from '@/components/Countdown';
import Glow from '@/components/Glow';
import Prayer from '@/components/Prayer';
import { useAnimationOpacity } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { OVERLAY, ANIMATION, SCREEN, STYLES, COLORS, TEXT } from '@/shared/constants';
import { measurementsAtom, overlayAtom, toggleOverlay } from '@/stores/ui';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);
  const PrayerHook = usePrayer(overlay.selectedPrayerIndex, overlay.scheduleType);

  const backgroundOpacity = useAnimationOpacity(0);
  const dateOpacity = useAnimationOpacity(0);

  const measurements = useAtomValue(measurementsAtom);

  const insets = useSafeAreaInsets();

  const isPrayerNext = PrayerHook.schedule.nextIndex === overlay.selectedPrayerIndex;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    toggleOverlay();
  };

  if (overlay.isOn) {
    backgroundOpacity.animate(1, { duration: ANIMATION.duration });
    dateOpacity.animate(1, { duration: ANIMATION.duration, delay: ANIMATION.overlayDelay });
  } else {
    backgroundOpacity.animate(0, { duration: ANIMATION.duration });
    dateOpacity.animate(0, { duration: ANIMATION.duration });
  }

  const computedStyleContainer: ViewStyle = {
    pointerEvents: overlay.isOn ? 'auto' : 'none',
  };

  const computedStyleCountdown: ViewStyle = {
    top: insets.top + SCREEN.paddingHorizontal,
  };

  const computedStyleDate: ViewStyle = {
    top: measurements.date?.pageY ?? 0,
    left: measurements.date?.pageX ?? 0,
    width: measurements.date?.width ?? 0,
    height: measurements.date?.height ?? 0,
  };

  const computedStylePrayer: ViewStyle = {
    top: (measurements.list?.pageY ?? 0) + overlay.selectedPrayerIndex * STYLES.prayer.height,
    left: measurements.list?.pageX ?? 0,
    width: measurements.list?.width ?? 0,
    ...(isPrayerNext && styles.activeBackground),
  };

  return (
    <Reanimated.View style={[styles.container, computedStyleContainer, backgroundOpacity.style]}>
      <AnimatedBlur intensity={15} tint="dark" style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Countdown */}
        <View style={[styles.countdown, computedStyleCountdown]}>
          <Countdown type={overlay.scheduleType} />
        </View>

        {/* Date */}
        <Reanimated.Text style={[styles.date, computedStyleDate, dateOpacity.style]}>
          {overlay.selectedPrayerIndex >= 5 ? 'Tomorrow' : 'Today'}
        </Reanimated.Text>

        {/* Prayer overlay */}
        <View style={[styles.prayer, computedStylePrayer]}>
          <Prayer index={overlay.selectedPrayerIndex} type={overlay.scheduleType} />
        </View>
      </AnimatedBlur>
      <Glow />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
    backgroundColor: 'rgba(0,0,18,0.96)',
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
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
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
});

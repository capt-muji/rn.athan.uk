import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { StyleSheet, Pressable, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Countdown from '@/components/Countdown';
import Glow from '@/components/Glow';
import Prayer from '@/components/Prayer';
import { OVERLAY, ANIMATION, STYLES, COLORS, TEXT, SCREEN } from '@/shared/constants';
import { toggleOverlay } from '@/stores/actions';
import { overlayAtom, measurementsAtom } from '@/stores/store';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const overlay = useAtomValue(overlayAtom);
  const measurements = useAtomValue(measurementsAtom);
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleOverlay();
  };

  const backgroundOpacityShared = useSharedValue(0);
  const dateOpacityShared = useSharedValue(0);

  if (overlay.isOn) {
    backgroundOpacityShared.value = withTiming(1, { duration: ANIMATION.duration });
    dateOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
  } else {
    backgroundOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
    dateOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
  }

  const containerStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
    opacity: backgroundOpacityShared.value,
    pointerEvents: overlay.isOn ? 'auto' : 'none',
    backgroundColor: 'rgba(8,0,18,0.97)',
  }));

  const dateStyle = useAnimatedStyle(() => ({
    opacity: dateOpacityShared.value,
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
  }));

  return (
    <Reanimated.View style={containerStyle}>
      <AnimatedBlur intensity={10} tint="dark" style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Countdown - using insets */}
        {overlay.isOn && (
          <View style={[styles.countdownContainer, { top: insets.top + SCREEN.paddingHorizontal }]}>
            <Countdown type={overlay.scheduleType} />
          </View>
        )}

        {/* Date */}
        {overlay.isOn && measurements?.date && (
          <Reanimated.Text
            style={[
              dateStyle,
              {
                position: 'absolute',
                top: measurements.date.pageY,
                left: measurements.date.pageX,
                width: measurements.date.width,
                height: measurements.date.height,
              },
            ]}
          >
            {overlay.selectedPrayerIndex >= 5 ? 'Tomorrow' : 'Today'}
          </Reanimated.Text>
        )}

        {/* Prayer overlay */}
        {overlay.isOn && measurements?.list && (
          <View
            style={{
              position: 'absolute',
              top: measurements.list.pageY + overlay.selectedPrayerIndex * STYLES.prayer.height,
              left: measurements.list.pageX,
              width: measurements.list.width,
              height: STYLES.prayer.height,
            }}
          >
            <Prayer index={overlay.selectedPrayerIndex} type={overlay.scheduleType} />
          </View>
        )}
      </AnimatedBlur>
      <Glow />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  countdownContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

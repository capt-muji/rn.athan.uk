import { StyleSheet, Pressable, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAtom } from 'jotai';
import { LinearGradient } from 'expo-linear-gradient';
import {
  overlayVisibleAtom,
  selectedPrayerIndexAtom,
  absoluteDateMeasurementsAtom,
  absolutePrayerMeasurementsAtom,
  todaysPrayersAtom,
} from '@/store/store';
import { COLORS, TEXT, OVERLAY, ANIMATION, ENGLISH } from '@/constants';
import Prayer from './Prayer';
import RadialGlow from './RadialGlow';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [showActiveBackground, setShowActiveBackground] = useState(true);
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [dateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [prayerMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOverlayVisible(false);
  };

  const glowOpacityShared = useSharedValue(0);
  const backgroundOpacityShared = useSharedValue(0);
  const dateOpacityShared = useSharedValue(0);

  useEffect(() => {
    if (overlayVisible) {
      backgroundOpacityShared.value = withTiming(1, { duration: ANIMATION.duration });
      glowOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
      dateOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
    } else {
      backgroundOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
      glowOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
      dateOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
    }
  }, [overlayVisible]);

  const glowAnimateStyle = useAnimatedStyle(() => ({
    opacity: glowOpacityShared.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
    opacity: backgroundOpacityShared.value,
    pointerEvents: overlayVisible ? 'auto' : 'none',
  }));

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateOpacityShared.value,
  }));

  const prayer = todaysPrayers[selectedPrayerIndex];

  return (
    <>
      <Reanimated.View style={containerStyle}>
        <AnimatedBlur intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(25,0,40,0.5)', 'rgba(8,0,12,0.9)', 'rgba(2,0,4,0.95)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Close overlay anywhere on screen */}
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

          {/* Content layer */}
          {dateMeasurements && (
            <Reanimated.Text
              style={[
                styles.date,
                dateAnimatedStyle,
                {
                  position: 'absolute',
                  top: dateMeasurements.pageY,
                  left: dateMeasurements.pageX,
                  width: dateMeasurements.width,
                  height: dateMeasurements.height,
                }
              ]}
            >
              {prayer?.passed ? 'Tomorrow' : 'Today'}
            </Reanimated.Text>
          )}

          {/* Replace the ENGLISH.map with conditional rendering */}
          {prayerMeasurements[selectedPrayerIndex] && (
            <View
              style={{
                position: 'absolute',
                top: prayerMeasurements[selectedPrayerIndex]?.pageY,
                left: prayerMeasurements[selectedPrayerIndex]?.pageX,
                width: prayerMeasurements[selectedPrayerIndex]?.width,
                height: prayerMeasurements[selectedPrayerIndex]?.height,
                zIndex: OVERLAY.zindexes.on.prayerSelected,
              }}
            >
              <Prayer index={selectedPrayerIndex} isOverlay />
            </View>
          )}
        </AnimatedBlur>
      </Reanimated.View>
      <Reanimated.View style={[glowAnimateStyle, { pointerEvents: 'none' }]}>
        <RadialGlow baseOpacity={0.5} visible={overlayVisible} />
      </Reanimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  date: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
    pointerEvents: 'none',
  },
});
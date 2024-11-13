import { StyleSheet, Pressable, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAtom } from 'jotai';
import { LinearGradient } from 'expo-linear-gradient';
import {
  overlayVisibleToggleAtom,
  overlayContentAtom,
  selectedPrayerIndexAtom,
  absoluteDateMeasurementsAtom,
  absolutePrayerMeasurementsAtom,
  todaysPrayersAtom,
  nextPrayerIndexAtom,
  lastSelectedPrayerIndexAtom
} from '@/store/store';
import { COLORS, TEXT, OVERLAY, ANIMATION } from '@/constants';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import RadialGlow from './RadialGlow';
import { useEffect } from 'react';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [overlayVisibleToggle, setOverlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [selectedPrayerIndex, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [dateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [prayerMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [, setLastSelectedPrayerIndex] = useAtom(lastSelectedPrayerIndexAtom);

  const handleClose = () => {
    setLastSelectedPrayerIndex(selectedPrayerIndex);
    setOverlayVisibleToggle(false);
    setSelectedPrayerIndex(-1);
    setOverlayContent([]);
  };

  const glowOpacityShared = useSharedValue(0);
  const backgroundOpacityShared = useSharedValue(0);
  const dateOpacityShared = useSharedValue(0);

  useEffect(() => {
    if (overlayVisibleToggle) {
      backgroundOpacityShared.value = withTiming(1, { duration: ANIMATION.duration });
      glowOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
      dateOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
    } else {
      backgroundOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
      glowOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
      dateOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
    }
  }, [overlayVisibleToggle]);

  const glowAnimateStyle = useAnimatedStyle(() => ({
    opacity: glowOpacityShared.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
    opacity: backgroundOpacityShared.value,
  }));

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateOpacityShared.value,
  }));

  const prayer = todaysPrayers[selectedPrayerIndex];

  if (!overlayVisibleToggle) return null;

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
          <Pressable style={styles.overlay} onPress={handleClose}>
            {/* Timer will be zindexed here */}

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

            {selectedPrayerIndex === nextPrayerIndex && <ActiveBackground />}
            {prayerMeasurements[selectedPrayerIndex] && (
              <View
                style={{
                  position: 'absolute',
                  top: prayerMeasurements[selectedPrayerIndex].pageY,
                  left: prayerMeasurements[selectedPrayerIndex].pageX,
                  width: prayerMeasurements[selectedPrayerIndex].width,
                  height: prayerMeasurements[selectedPrayerIndex].height,
                }}
              >
                <Prayer index={selectedPrayerIndex} isOverlay={true} />
              </View>
            )}
          </Pressable>
        </AnimatedBlur>
      </Reanimated.View>
      <Reanimated.View style={glowAnimateStyle}>
        <RadialGlow baseOpacity={0.5} visible={overlayVisibleToggle} />
      </Reanimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00028419',
    zIndex: OVERLAY.zindexes.overlay,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
    pointerEvents: 'none',
  },
});
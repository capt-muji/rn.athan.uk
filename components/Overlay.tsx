import { StyleSheet, Pressable, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
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
  nextPrayerIndexAtom
} from '@/store/store';
import { COLORS, TEXT, OVERLAY } from '@/constants';
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

  const handleClose = () => {
    setOverlayVisibleToggle(false);
    setSelectedPrayerIndex(-1);
    setOverlayContent([]);
  };

  const glowSharedOpacity = useSharedValue(0);

  useEffect(() => {
    if (overlayVisibleToggle) {
      glowSharedOpacity.value = withDelay(150, withTiming(1, { duration: 500 }))
    } else {
      glowSharedOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [overlayVisibleToggle]);

  const glowAnimateStyle = useAnimatedStyle(() => ({
    opacity: glowSharedOpacity.value,
  }));

  const prayer = todaysPrayers[selectedPrayerIndex];

  if (!overlayVisibleToggle) return null;

  return (
    <>
      <Reanimated.View style={styles.container}>
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
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
  },
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
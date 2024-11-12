import { StyleSheet, Pressable, View, Dimensions, Text } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  overlayVisibleToggleAtom,
  overlayContentAtom,
  selectedPrayerIndexAtom,
  overlayStartOpeningAtom,
  overlayStartClosingAtom,
  overlayFinishedClosingAtom,
  overlayFinishedOpeningAtom,
  overlayControlsAtom,
  absoluteDateMeasurementsAtom,
  todaysPrayersAtom,
  absolutePrayerListMeasurementsAtom
} from '@/store/store';
import { useEffect, useCallback, useLayoutEffect, useState } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  useAnimatedStyle,
  runOnJS
} from 'react-native-reanimated';
import RadialGlow from './RadialGlow';
import { ANIMATION, COLORS, TEXT, ENGLISH } from '@/constants';
import Prayer from './Prayer';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [overlayVisibleToggle, setOverlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setOverlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [, setOverlayStartClosing] = useAtom(overlayStartClosingAtom);
  const [, setOverlayFinishedClosing] = useAtom(overlayFinishedClosingAtom);
  const [, setOverlayFinishedOpening] = useAtom(overlayFinishedOpeningAtom);
  const [, setOverlayControls] = useAtom(overlayControlsAtom);
  const [dateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [prayerListMeasurements] = useAtom(absolutePrayerListMeasurementsAtom);

  const intensity = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Helper functions for animation state management
  const handleOpenStart = () => {
    setOverlayStartOpening(true);
    setOverlayFinishedOpening(false);
  };

  const handleOpenComplete = () => {
    setOverlayStartOpening(false);
    setOverlayFinishedOpening(true);
  };

  const handleCloseStart = () => {
    setOverlayStartClosing(true);
    setOverlayFinishedClosing(false);
    // Update visibility immediately
    setOverlayVisibleToggle(false);
  };

  const handleCloseComplete = () => {
    setOverlayStartClosing(false);
    setOverlayFinishedClosing(true);
    setSelectedPrayerIndex(-1);
    setOverlayContent([]);
  };

  // Animation helpers
  const animateOpen = () => {
    // Update visibility immediately
    setOverlayVisibleToggle(true);
    handleOpenStart();

    opacity.value = withTiming(1, { duration: ANIMATION.duration }, (finished) => {
      if (finished) runOnJS(handleOpenComplete)();
    });

    intensity.value = withTiming(10, { duration: ANIMATION.duration });
  };

  const animateClose = () => {
    handleCloseStart();

    opacity.value = withTiming(0, { duration: ANIMATION.duration }, (finished) => {
      if (finished) runOnJS(handleCloseComplete)();
    });

    intensity.value = withTiming(0, { duration: ANIMATION.duration });
  };

  useEffect(() => {
    setOverlayControls({
      open: animateOpen,
      close: animateClose
    });
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  const handleClose = () => {
    animateClose();
  };

  const prayer = todaysPrayers[selectedPrayerIndex];

  if (!overlayVisibleToggle) return null;

  return (
    <Reanimated.View style={[StyleSheet.absoluteFillObject, containerStyle]}>
      <AnimatedBlur animatedProps={animatedProps} tint="dark" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(25,0,40,1)', 'rgba(8,0,12,0.9)', 'rgba(2,0,4,0.95)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <RadialGlow
          size={Dimensions.get('window').height / 3}
          style={styles.radialGradient}
        />
        <Pressable style={[styles.overlay, StyleSheet.absoluteFillObject]} onPress={handleClose}>
          {/* Timer will be zindexed here */}

          {dateMeasurements && (
            <Reanimated.Text
              style={[
                styles.overlayText,
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

          {prayerListMeasurements && (
            <View style={{
              position: 'absolute',
              top: prayerListMeasurements.pageY,
              left: prayerListMeasurements.pageX,
              width: prayerListMeasurements.width,
            }}>
              {ENGLISH.map((_, index) => (
                <Prayer key={index} index={index} isOverlay={true} />
              ))}
            </View>
          )}
        </Pressable>
      </AnimatedBlur>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  radialGradient: {
    position: 'absolute',
    top: -Dimensions.get('window').height / 2,
    left: -Dimensions.get('window').height / 10,
    width: Dimensions.get('window').height / 1,
    height: Dimensions.get('window').height / 1,
  },
  overlay: {
    backgroundColor: '#00028419'
  },
  overlayText: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
  },
});
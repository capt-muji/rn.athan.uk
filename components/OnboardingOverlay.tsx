// External imports
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-auto-ripple';
import Animated from 'react-native-reanimated';

// Internal imports
import MasjidIcon from '@/assets/icons/masjid.svg';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { OVERLAY } from '@/shared/constants';
import {
  measurementsMasjidAtom,
  onboardingCompletedAtom,
  setOnboardingCompleted,
  showSettingsSheet,
} from '@/stores/ui';

export default function OnboardingOverlay() {
  const completed = useAtomValue(onboardingCompletedAtom);
  const MasjidMeasurements = useAtomValue(measurementsMasjidAtom);
  const backgroundOpacity = useAnimationOpacity(0);

  const handleMasjidPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    backgroundOpacity.animate(0, {
      duration: 200,
      onFinish: () => {
        setOnboardingCompleted(true);
        showSettingsSheet();
      },
    });
  };

  useEffect(() => {
    if (!completed) {
      backgroundOpacity.animate(0.8, { duration: 200 });
    }
  }, [completed]);

  if (completed) return null;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.background, backgroundOpacity.style]} />

      <View
        style={[
          styles.container,
          {
            top: MasjidMeasurements.pageY,
            left: MasjidMeasurements.pageX,
          },
        ]}>
        <Ripple color="#6200ff16" diameter={280} duration={2800} rippleCount={4} speed={10} />

        <Pressable onPress={handleMasjidPress} style={styles.iconContainer}>
          <MasjidIcon width={55} height={55} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.onboarding,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  container: {
    position: 'absolute',
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
});

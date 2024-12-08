import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import { useAnimationColor, useAnimationFill } from '@/hooks/useAnimations';
import { ANIMATION, COLORS, TEXT } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';
import { soundPreferenceAtom, setSoundPreference } from '@/stores/notifications';

const SOUNDS = [
  'Athan 1',
  'Athan 2',
  'Athan 3',
  'Athan 4',
  'Athan 5',
  'Athan 6',
  'Athan 7',
  'Athan 8',
  'Athan 9',
  'Athan 10',
];

export default function ActionSheetSound() {
  const insets = useSafeAreaInsets();

  const selectedSound = useAtomValue(soundPreferenceAtom);
  const prevSelectedSound = useRef(selectedSound);

  // Create animation arrays for all sound options
  const textAnimations = SOUNDS.map((_, index) =>
    useAnimationColor(index === selectedSound ? 1 : 0, {
      toColor: 'white',
      fromColor: COLORS.textSecondary,
    })
  );

  const iconAnimations = SOUNDS.map((_, index) =>
    useAnimationFill(index === selectedSound ? 1 : 0, {
      toColor: 'white',
      fromColor: COLORS.textSecondary,
    })
  );

  // Animate previous selection to secondary color
  textAnimations[prevSelectedSound.current].animate(0, { duration: ANIMATION.duration });
  iconAnimations[prevSelectedSound.current].animate(0, { duration: ANIMATION.duration });

  // Animate new selection to white
  textAnimations[selectedSound].animate(1, { duration: ANIMATION.duration });
  iconAnimations[selectedSound].animate(1, { duration: ANIMATION.duration });

  const handleSoundSelection = (newSelectedSound: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSoundPreference(newSelectedSound);
    prevSelectedSound.current = selectedSound;
  };

  const computedStyle = {
    marginBottom: -insets.bottom,
    paddingBottom: insets.bottom,
  };

  return (
    <ActionSheet
      safeAreaInsets={insets}
      id="sound-sheet"
      gestureEnabled={true}
      containerStyle={styles.container}
      indicatorStyle={{ display: 'none' }}>
      <BlurView intensity={75} tint="dark" style={[styles.blurContainer, computedStyle]}>
        <View style={styles.indicator} />
        <Text style={[styles.text, styles.title]}>Select Athan</Text>

        {SOUNDS.map((sound, index) => (
          <Pressable key={sound} style={styles.option} onPress={() => handleSoundSelection(index)}>
            <Animated.Text style={[styles.text, textAnimations[index].style]}>{sound}</Animated.Text>
            <Pressable style={styles.icon}>
              <Icon type={AlertIcon.PLAY} size={22} animatedProps={iconAnimations[index].animatedProps} />
            </Pressable>
          </Pressable>
        ))}
      </BlurView>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    shadowColor: '#0d0021',
    shadowOffset: { width: 0, height: -100 },
    shadowOpacity: 0.25,
    shadowRadius: 100,
  },
  blurContainer: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    paddingTop: 25,
    backgroundColor: 'rgba(25,25,130,0.5)',
  },
  indicator: {
    backgroundColor: COLORS.textSecondary,
    width: 50,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 5,
  },
  title: {
    color: 'white',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  option: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  icon: {},
  selected: {
    color: 'white',
  },
});

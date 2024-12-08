import { BlurView } from 'expo-blur';
import { useAtom } from 'jotai';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import { COLORS, TEXT } from '@/shared/constants';
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
  const [selectedSound] = useAtom(soundPreferenceAtom);
  const insets = useSafeAreaInsets();

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
          <Pressable key={sound} style={styles.option} onPress={() => setSoundPreference(index)}>
            <Text style={[styles.text, index === selectedSound && styles.selected]}>{sound}</Text>
            <Pressable style={styles.icon}>
              <Icon type={AlertIcon.PLAY} size={22} color={index === selectedSound ? 'white' : COLORS.textSecondary} />
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

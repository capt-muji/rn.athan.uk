import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionSheetSoundItem from '@/components/ActionSheetSoundItem';
import { COLORS, TEXT } from '@/shared/constants';

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
  'Athan 11',
  'Athan 12',
  'Athan 13',
  'Athan 14',
];

export default function ActionSheetSound() {
  const insets = useSafeAreaInsets();

  const computedStyle = {
    marginBottom: -insets.bottom,
    paddingBottom: insets.bottom,
  };

  return (
    <ActionSheet
      id="sound-sheet"
      safeAreaInsets={insets}
      gestureEnabled={true}
      containerStyle={styles.container}
      indicatorStyle={{ display: 'none' }}>
      <BlurView intensity={75} tint="dark" style={[styles.blurContainer, computedStyle]}>
        <View style={styles.indicator} />
        <Text style={[styles.text, styles.title]}>Select Athan</Text>

        <ScrollView style={styles.scrollView}>
          {SOUNDS.map((_, index) => (
            <ActionSheetSoundItem key={index} index={index} />
          ))}
        </ScrollView>
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
  scrollView: {
    // maxHeight: '80%',
  },
});

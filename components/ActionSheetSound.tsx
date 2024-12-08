import { StyleSheet, Text, Pressable } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

import { COLORS, TEXT } from '@/shared/constants';
import { setSoundPreference } from '@/stores/notifications';

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
  return (
    <ActionSheet
      id="sound-sheet"
      gestureEnabled={true}
      containerStyle={styles.container}
      indicatorStyle={styles.indicator}>
      <Text style={[styles.text, styles.title]}>Select Athan</Text>

      {SOUNDS.map((sound, index) => (
        <Pressable key={sound} style={styles.option} onPress={() => setSoundPreference(index)}>
          <Text style={styles.text}>{sound}</Text>
        </Pressable>
      ))}
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0b1324',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 15,
  },
  indicator: {
    backgroundColor: COLORS.textSecondary,
    width: 50,
    height: 5,
  },
  title: {
    color: 'white',
    padding: 20,
  },
  option: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0d162a',
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
});

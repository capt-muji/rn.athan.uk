import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, ScrollView } from 'react-native';

import BottomSheetSoundItem from '@/components/BottomSheetSoundItem';
import { COLORS, TEXT } from '@/shared/constants';
import { setBottomSheetModal } from '@/stores/ui';

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

export default function BottomSheetSound() {
  return (
    <BottomSheetModal ref={(ref) => setBottomSheetModal(ref)} snapPoints={['80%']}>
      <BottomSheetView>
        <BlurView intensity={75} tint="dark" style={styles.blurContainer}>
          <Text style={[styles.text, styles.title]}>Select Athan</Text>

          <ScrollView style={styles.scrollView}>
            {SOUNDS.map((_, index) => (
              <BottomSheetSoundItem key={index} index={index} />
            ))}
          </ScrollView>
        </BlurView>
      </BottomSheetView>
    </BottomSheetModal>
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
    backgroundColor: 'rgba(25,25,130,0.5)',
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

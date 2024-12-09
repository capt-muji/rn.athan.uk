import { BottomSheetModal, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text } from 'react-native';

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

          <BottomSheetScrollView contentContainerStyle={styles.scrollView}>
            {SOUNDS.map((_, index) => (
              <BottomSheetSoundItem key={index} index={index} />
            ))}
          </BottomSheetScrollView>
        </BlurView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    backgroundColor: 'rgba(25,25,130,0.5)',
  },
  title: {
    color: 'white',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  scrollView: {},
});

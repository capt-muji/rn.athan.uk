import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useMemo, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { bottom } = useSafeAreaInsets();
  const data = useMemo(
    () =>
      SOUNDS.map((sound, index) => ({
        id: index.toString(),
        title: sound,
      })),
    []
  );

  const renderItem = useCallback(({ item }) => <BottomSheetSoundItem index={parseInt(item.id)} />, []);

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  return (
    <BottomSheetModal
      ref={(ref) => setBottomSheetModal(ref)}
      snapPoints={['80%']}
      enableDynamicSizing={false}
      style={styles.modal}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      backdropComponent={renderBackdrop}>
      <Text style={[styles.text, styles.title]}>Select Athan</Text>

      <BottomSheetFlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: bottom + 5 }}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingTop: 10,
  },
  background: {
    backgroundColor: '#1c1457',
    opacity: 0.98,
  },
  indicator: {
    backgroundColor: COLORS.textSecondary,
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
});

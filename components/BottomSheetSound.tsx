import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useMemo, useCallback } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetSoundItem from '@/components/BottomSheetSoundItem';
import Glow from '@/components/Glow';
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
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.9} />,
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
      <Glow
        color={'#2f045a'}
        baseOpacity={1}
        size={Dimensions.get('window').width * 2}
        style={{
          bottom: -Dimensions.get('window').width * 1.25,
          left: -Dimensions.get('window').width / 2,
        }}
      />
      <Text style={[styles.text, styles.title]}>Select Athan</Text>

      <BottomSheetFlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: bottom + 20 }}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingTop: 15,
  },
  background: {
    backgroundColor: '#05011c',
  },
  indicator: {
    backgroundColor: COLORS.textSecondary,
  },
  title: {
    color: 'white',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
});

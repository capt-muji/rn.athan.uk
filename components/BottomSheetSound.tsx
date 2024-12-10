import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { useMemo, useCallback } from 'react';
import { StyleSheet, Text, Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetSoundItem from '@/components/BottomSheetSoundItem';
import Glow from '@/components/Glow';
import { COLORS, TEXT } from '@/shared/constants';
import { setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

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

  const renderSheetBackground = useCallback(() => {
    const { width, height } = Dimensions.get('window');
    return (
      <Canvas style={StyleSheet.absoluteFill}>
        <RoundedRect x={0} y={0} width={width} height={height} r={24}>
          <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={['#0f0c34', '#04001b']} />
        </RoundedRect>
      </Canvas>
    );
  }, []);

  const renderItem = useCallback(({ item }) => <BottomSheetSoundItem index={parseInt(item.id)} />, []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.9}
        style={[styles.backdrop, props.style]}
      />
    ),
    []
  );

  const clearAudio = useCallback(() => setPlayingSoundIndex(null), []);

  return (
    <BottomSheetModal
      ref={(ref) => setBottomSheetModal(ref)}
      snapPoints={['80%']}
      enableDynamicSizing={false}
      onDismiss={clearAudio}
      onAnimate={clearAudio}
      style={styles.modal}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={styles.indicator}
      backdropComponent={renderBackdrop}>
      <View style={styles.container}>
        <Glow
          color={'#2f045a'}
          baseOpacity={1}
          size={Dimensions.get('window').width * 2}
          style={{
            bottom: -Dimensions.get('window').width,
            left: -Dimensions.get('window').width,
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
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingTop: 15,
  },
  container: {
    flex: 1,
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
  backdrop: {
    backgroundColor: '#000116',
  },
});

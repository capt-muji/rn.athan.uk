/* eslint-disable @typescript-eslint/no-require-imports */

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
  require('../assets/audio/athan1.wav'),
  require('../assets/audio/athan2.wav'),
  require('../assets/audio/athan3.wav'),
  require('../assets/audio/athan4.wav'),
  require('../assets/audio/athan5.wav'),
  require('../assets/audio/athan6.wav'),
  require('../assets/audio/athan7.wav'),
  require('../assets/audio/athan8.wav'),
  require('../assets/audio/athan9.wav'),
  require('../assets/audio/athan10.wav'),
  require('../assets/audio/athan11.wav'),
  require('../assets/audio/athan12.wav'),
  require('../assets/audio/athan13.wav'),
];

export default function BottomSheetSound() {
  const { bottom } = useSafeAreaInsets();

  const data = useMemo(() => SOUNDS.map((audio, index) => ({ id: index.toString(), audio })), []);

  const renderSheetBackground = useCallback(() => {
    const { width, height } = Dimensions.get('window');
    return (
      <Canvas style={StyleSheet.absoluteFill}>
        <RoundedRect x={0} y={0} width={width} height={height} r={24}>
          <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={['#0e0b32', '#090428']} />
        </RoundedRect>
      </Canvas>
    );
  }, []);

  const renderItem = useCallback(
    ({ item }) => <BottomSheetSoundItem index={parseInt(item.id)} audio={item.audio} />,
    []
  );

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
          color={'#28045b'}
          baseOpacity={1}
          size={Dimensions.get('window').width * 3}
          style={{
            bottom: -Dimensions.get('window').width * 1.5,
            left: -Dimensions.get('window').width * 1.25,
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

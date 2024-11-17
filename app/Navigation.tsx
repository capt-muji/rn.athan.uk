import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { COLORS, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import Prayers from '@/screens/Prayers';
import Settings from '@/screens/Settings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Navigation() {
  const { bottom } = useSafeAreaInsets();

  const position = useSharedValue(1);

  const handlePageScroll = (e: any) => {
    const { position: pos, offset } = e.nativeEvent;
    position.value = pos + offset;
  };

  const dotStyle = (index: number) => useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        Math.abs(position.value - index) < 0.5 ? 1 : 0.25,
        { duration: 200 }
      )
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        style={{ flex: 1 }}
        initialPage={1}
        overdrag={true}
        overScrollMode="never"
        onPageScroll={handlePageScroll}
      >
        <Settings key="1" />
        <Prayers key="2" list={PRAYERS_ENGLISH} />
        <Prayers key="3" list={EXTRAS_ENGLISH} />
      </PagerView>

      <View style={[styles.dotsContainer, { bottom: bottom + 5 }]}>
        {[0, 1, 2].map((index) => (
          <Animated.View key={index} style={[styles.dot, dotStyle(index)]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textPrimary,
  },
});
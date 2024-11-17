import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useState } from 'react';

import { COLORS, OVERLAY, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import Prayers from '@/screens/Prayers';
import Settings from '@/screens/Settings';

export default function Navigation() {
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
        <View key="1"><Settings /></View>
        <View key="2"><Prayers list={PRAYERS_ENGLISH} /></View>
        <View key="3"><Prayers list={EXTRAS_ENGLISH} /></View>
      </PagerView>
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[styles.dot, dotStyle(index)]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});
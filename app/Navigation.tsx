import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import { useState } from 'react';

import { COLORS, OVERLAY, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import Prayers from '@/screens/Prayers';
import Settings from '@/screens/Settings';

export default function Navigation() {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <PagerView
        style={styles.pager}
        initialPage={1}
        pageMargin={0}
        overdrag={false}
        layoutDirection="ltr"
        overScrollMode="never"
        onPageSelected={handlePageSelected}
      >
        <View key="1"><Settings /></View>
        <View key="2"><Prayers list={PRAYERS_ENGLISH} /></View>
        <View key="3"><Prayers list={EXTRAS_ENGLISH} /></View>
      </PagerView>
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { opacity: currentPage === index ? 1 : 0.5 }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY.zindexes.background
  },
  pager: {
    flex: 1,
  },
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
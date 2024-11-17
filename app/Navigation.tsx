import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import { useState } from 'react';

import { COLORS, OVERLAY } from '@/constants';
import Main from '@/components/Main';
import Settings from '@/components/Settings';
import { PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '../constants';

const { width } = Dimensions.get('window');

export default function Navigation() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageScroll = (e: any) => {
    if (isScrolling) {
      const newPage = e.nativeEvent.position;
      if (Math.abs(newPage - currentPage) > 1) {
        e.preventDefault();
      }
    }
  };

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
    setIsScrolling(false);
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
        overdragEnabled={false}
        scrollEnabled={!isScrolling}
        layoutDirection="ltr"
        overScrollMode="never"
        onPageScrollStateChanged={(state) => {
          setIsScrolling(state === 'dragging');
        }}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
      >
        <View key="1"><Settings /></View>
        <View key="2"><Main list={PRAYERS_ENGLISH} /></View>
        <View key="3"><Main list={EXTRAS_ENGLISH} /></View>
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
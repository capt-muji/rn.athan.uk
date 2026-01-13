import { Platform, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/app/Screen';
import BackgroundGradients from '@/components/BackgroundGradients';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setPagePosition, setPopupTimesExplained, getPopupTimesExplained, setScrollPosition } from '@/stores/ui';

export default function Navigation() {
  const { bottom } = useSafeAreaInsets();
  const dot0Animation = useAnimationOpacity(1);
  const dot1Animation = useAnimationOpacity(0.25);

  const handlePageScroll = (e: { nativeEvent: { position: number; offset: number } }) => {
    const { position, offset } = e.nativeEvent;
    setScrollPosition(position + offset);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;

    dot0Animation.animate(position === 0 ? 1 : 0.25, { duration: ANIMATION.duration });
    dot1Animation.animate(position === 1 ? 1 : 0.25, { duration: ANIMATION.duration });

    setPagePosition(position);

    if (position === 1 && getPopupTimesExplained() === 0) setPopupTimesExplained(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#5b1eaa' }}>
      <BackgroundGradients />

      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        overdrag={true}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}>
        <Screen type={ScheduleType.Standard} />
        <Screen type={ScheduleType.Extra} />
      </PagerView>

      <View style={[styles.dotsContainer, { bottom: bottom + 20 + (Platform.OS === 'android' ? 15 : 0) }]}>
        <Animated.View style={[styles.dot, dot0Animation.style]} />
        <Animated.View style={[styles.dot, dot1Animation.style]} />
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
    backgroundColor: 'white',
  },
});

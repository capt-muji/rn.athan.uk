import { StyleSheet, View } from 'react-native';
import PagerView, { PagerViewOnPageScrollEvent, PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '@/app/Screen';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setPagePosition, setPopupTimesExplained, getPopupTimesExplained } from '@/stores/ui';

export default function Navigation() {
  const { bottom } = useSafeAreaInsets();

  const dot0Animation = useAnimationOpacity(1);
  const dot1Animation = useAnimationOpacity(0.25);

  const handlePageScroll = (e: PagerViewOnPageScrollEvent) => {
    const { position: pos, offset } = e.nativeEvent;
    const currentPosition = pos + offset;

    dot0Animation.animate(currentPosition < 0.5 ? 1 : 0.25, { duration: ANIMATION.duration });
    dot1Animation.animate(currentPosition >= 0.5 ? 1 : 0.25, { duration: ANIMATION.duration });

    setPagePosition(currentPosition);
  };

  const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const position = e.nativeEvent.position;
    if (position === 1) {
      if (getPopupTimesExplained() === 0) setPopupTimesExplained(1);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        overdrag={true}
        overScrollMode="never"
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}>
        <Screen type={ScheduleType.Standard} />
        <Screen type={ScheduleType.Extra} />
      </PagerView>

      <View style={[styles.dotsContainer, { bottom: bottom + 20 }]}>
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

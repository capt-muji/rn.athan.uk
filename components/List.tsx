import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';

import ActiveBackground from '@/components/ActiveBackground';
import Prayer from '@/components/Prayer';
import { SCHEDULE_LENGTHS, SCREEN, TEXT, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import { getLongestPrayerNameIndex } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { setMeasurement } from '@/stores/overlay';
import { setEnglishWidth, englishWidthStandardAtom, englishWidthExtraAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;
  // Get the stored width for this schedule type (standard/extra)
  // Width is used to ensure consistent column alignment across prayers
  const storedWidth = useAtomValue(isStandard ? englishWidthStandardAtom : englishWidthExtraAtom);
  const listRef = useRef<View>(null);

  // Only calculate the longest prayer name if we don't have a stored width
  // This optimization prevents unnecessary calculations on subsequent renders
  let longestPrayer: string | null = null;
  if (storedWidth === 0) {
    const longestIndex = getLongestPrayerNameIndex(type);
    const prayers = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
    longestPrayer = prayers[longestIndex];
  }

  const handleHiddenLayout = (e: LayoutChangeEvent) => {
    if (storedWidth !== 0) return;

    const { width } = e.nativeEvent.layout;
    setEnglishWidth(type, width);
  };

  const handleLayout = () => {
    // Only measure 1st screen
    if (!listRef.current || !isStandard) return;

    listRef.current.measureInWindow((x, y, width, height) => {
      setMeasurement('list', { pageX: x, pageY: y, width, height });
    });
  };

  return (
    <>
      {/* Hidden text element only renders when we need to calculate the width */}
      {storedWidth === 0 && (
        <Text style={styles.hiddenText} onLayout={handleHiddenLayout}>
          {longestPrayer}
        </Text>
      )}

      {/* Main prayer list always renders */}
      <View ref={listRef} onLayout={handleLayout} style={[styles.container]}>
        <ActiveBackground type={type} />
        {Array.from({ length: SCHEDULE_LENGTHS[type] }).map((_, index) => (
          <Prayer key={index} index={index} type={type} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
  },
  hiddenText: {
    position: 'absolute',
    pointerEvents: 'none',
    opacity: 0,
    zIndex: -1000,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
    backgroundColor: 'green',
  },
});

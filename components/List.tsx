import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';

import ActiveBackground from '@/components/ActiveBackground';
import Prayer from '@/components/Prayer';
import { SCHEDULE_LENGTHS, SCREEN, TEXT, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import { getLongestPrayerNameIndex } from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { setMeasurement } from '@/stores/overlay';
import { dateAtom } from '@/stores/sync';
import { setEnglishWidth, englishWidthStandardAtom, englishWidthExtraAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  useAtomValue(dateAtom); // Add this to make component reactive to date changes

  const isStandard = type === ScheduleType.Standard;
  const storedWidth = useAtomValue(isStandard ? englishWidthStandardAtom : englishWidthExtraAtom);
  const listRef = useRef<View>(null);

  // Calculate schedule length dynamically based on current date
  const scheduleLength = isStandard
    ? SCHEDULE_LENGTHS.standard
    : TimeUtils.isFriday()
      ? SCHEDULE_LENGTHS.extra
      : SCHEDULE_LENGTHS.extra - 1;

  let longestPrayer: string | null = null;
  if (storedWidth === 0) {
    const longestIndex = getLongestPrayerNameIndex(type);
    const prayers = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
    longestPrayer = prayers[longestIndex];
  }

  /**
   * Measures the width of the longest prayer name to ensure consistent layout
   * This hidden text component runs once on initial render and saves the width
   * to persistent storage. The stored width is then used by all Prayer components
   * to maintain equal column widths across the app.
   */
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
        {Array.from({ length: scheduleLength }).map((_, index) => (
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

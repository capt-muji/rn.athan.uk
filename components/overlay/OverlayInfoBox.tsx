import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { getOverlayExplanation, getOverlayRow } from '@/components/overlay/overlayContent';
// Direct path, not the barrel: going through components/prayer would cycle back here via List
import PrayerExplanation from '@/components/prayer/Explanation';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ANIMATION, STYLES } from '@/shared/constants';
import type { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

interface Props {
  type: ScheduleType;
}

/** How far the arrow tip overlaps into the row band, so the card reads as part of its row */
const TIP_OVERLAP = 9;

/**
 * The Extras explanation card, anchored to the rows it explains.
 *
 * The rows render inside the native pager, whose content draws offset from its measured layout on
 * iOS (23.67pt on the XS, zero on Android), and no React Native measurement API can see that
 * offset: measureInWindow, onLayout and measureLayout all report the same pre-offset numbers. So
 * the card cannot be anchored from outside the pager through any measurement — it mounts inside
 * the list instead, positioned by row index in the list's own space, and whatever the pager does
 * to the rows happens to the card too. Nothing to measure, nothing to keep in step.
 */
export default function OverlayInfoBox({ type }: Props) {
  const overlay = useAtomValue(overlayAtom);
  const isOnThisList = overlay.isOn && overlay.scheduleType === type;

  const [visible, setVisible] = useState(isOnThisList);

  const layerOpacityStyle = useDerivedOpacity(isOnThisList ? 1 : 0, { duration: ANIMATION.duration });

  // Hold the card displayable through the close fade-out, then hide it
  useEffect(() => {
    if (isOnThisList) {
      setVisible(true);
      return;
    }

    const hideTimer = setTimeout(() => setVisible(false), ANIMATION.duration);
    return () => clearTimeout(hideTimer);
  }, [isOnThisList]);

  const selectedPrayer = usePrayer(type, overlay.selectedPrayerIndex, true);
  const { prayers, displayDate } = usePrayerSequence(type);
  const visualRowIndex = getOverlayRow(prayers, displayDate, type, overlay.selectedPrayerIndex);

  // The card flips above the row only when it would otherwise run past the last row of THIS list.
  // A fixed index cannot decide that: Extras lists 4 rows and 5 on Fridays
  const rowsOnThisList = prayers.filter((prayer) => prayer.belongsToDate === displayDate).length;
  const showInfoBoxAbove = visualRowIndex >= rowsOnThisList - 1 && rowsOnThisList > 1;

  // Row space: the row's own offset within this list, never a window measurement
  const rowTop = visualRowIndex * STYLES.prayer.height;

  // Hangs overlapping the row edge by 7pt, owner-ruled: the tip sits inside the row band so the
  // card visibly belongs to its row. Never given a height, so it is as tall as its own content;
  // the above-branch anchors at the row top and lifts itself clear by its own height
  const computedStyleInfoBox: ViewProps['style'] = showInfoBoxAbove
    ? { top: rowTop + TIP_OVERLAP, transform: [{ translateY: '-100%' }], left: 0, width: '100%' }
    : { top: rowTop + STYLES.prayer.height - TIP_OVERLAP, left: 0, width: '100%' };

  const { prayerName, explanation, explanationArabic } = getOverlayExplanation(type, selectedPrayer.english);

  if (!prayerName || !explanation || !explanationArabic) return null;

  return (
    <Reanimated.View
      testID='overlay-infobox'
      style={[styles.placer, { display: visible ? 'flex' : 'none' }, layerOpacityStyle]}
      pointerEvents='none'>
      <PrayerExplanation
        prayerName={prayerName}
        explanation={explanation}
        explanationArabic={explanationArabic}
        arrowPosition={showInfoBoxAbove ? 'bottom' : 'top'}
        style={computedStyleInfoBox}
      />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  placer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});

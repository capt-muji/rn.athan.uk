import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';

import { Prayer } from '@/components/prayer';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { SCREEN, SPACING } from '@/shared/constants';
import { canonicalDisplayOrder } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { countdownBarShownAtom, getMeasurementsList, setMeasurementsList } from '@/stores/ui';

import ActiveBackground from './ActiveBackground';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  // NEW: Use sequence-based prayers
  // See: ai/adr/005-timing-system-overhaul.md
  const { prayers, displayDate, isReady } = usePrayerSequence(type);
  const isStandard = type === ScheduleType.Standard;
  const listRef = useRef<View>(null);
  const isFirstRender = useRef(true);
  const countdownBarShown = useAtomValue(countdownBarShownAtom);

  // Filter prayers to current displayDate
  // This automatically handles Friday Istijaba logic via createPrayerSequence
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);

  // Extra page renders in canonical order (Istijaba last on Fridays); each row keeps
  // its sequence index so Prayer/overlay/countdown semantics are unchanged
  const displayOrder = canonicalDisplayOrder(todayPrayers, type);

  const measureList = () => {
    if (!listRef.current || !isStandard) return;

    listRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      setMeasurementsList(measurements);
    });
  };

  const handleLayout = () => {
    const cachedMeasurements = getMeasurementsList();
    if (cachedMeasurements.width > 0) return;

    measureList();
  };

  // Re-measure when countdown bar visibility changes (affects list position)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isStandard) return;

    // Wait for layout to settle after countdown bar is added/removed
    const handle = InteractionManager.runAfterInteractions(() => {
      measureList();
    });

    return () => handle.cancel();
  }, [countdownBarShown, isStandard]);

  // Show nothing if sequence not ready
  if (!isReady) return null;

  return (
    <View ref={listRef} onLayout={handleLayout} style={[styles.container]}>
      <ActiveBackground type={type} />
      {displayOrder.map((prayerIndex) => (
        <Prayer key={prayerIndex} index={prayerIndex} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    marginBottom: SPACING.xxxl,
  },
});

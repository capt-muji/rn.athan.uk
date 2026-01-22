import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import Masjid from '@/components/Masjid';
import { COLORS, SCREEN, TEXT } from '@/shared/constants';
import { formatDateLong, formatHijriDateLong } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { standardDisplayDateAtom, extraDisplayDateAtom } from '@/stores/schedule';
import {
  getMeasurementsDate,
  setMeasurementsDate,
  getMeasurementsMasjid,
  setMeasurementsMasjid,
  hijriDateEnabledAtom,
} from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Day({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  // NEW: Use sequence-based derived displayDate
  // See: ai/adr/005-timing-system-overhaul.md
  const displayDateAtom = isStandard ? standardDisplayDateAtom : extraDisplayDateAtom;
  const date = useAtomValue(displayDateAtom) ?? '';
  const dateRef = useRef<Animated.Text>(null);
  const masjidRef = useRef<View>(null);
  const hijriEnabled = useAtomValue(hijriDateEnabledAtom);

  const handleLayout = () => {
    if (!dateRef.current || !isStandard) return;

    const cachedMeasurements = getMeasurementsDate();
    if (cachedMeasurements.width > 0) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      setMeasurementsDate(measurements);
    });
  };

  const handleMasjidLayout = () => {
    if (!masjidRef.current || !isStandard) return;

    const cached = getMeasurementsMasjid();
    if (cached.width > 0) return; // Already measured

    masjidRef.current.measureInWindow((x, y, width, height) => {
      setMeasurementsMasjid({ pageX: x, pageY: y, width, height });
    });
  };

  const formattedDate = hijriEnabled ? formatHijriDateLong(date) : formatDateLong(date);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text ref={dateRef} onLayout={handleLayout} style={styles.date}>
          {formattedDate}
        </Animated.Text>
      </View>
      <View ref={masjidRef} onLayout={handleMasjidLayout}>
        <Masjid />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SCREEN.paddingHorizontal + 2,
    paddingLeft: SCREEN.paddingHorizontal + 4,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    marginBottom: 5,
  },
  date: {
    fontFamily: TEXT.family.regular,
    color: 'white',
    fontSize: TEXT.size,
  },
});

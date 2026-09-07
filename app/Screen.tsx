import { useAtomValue } from 'jotai';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Countdown } from '@/components/countdown';
import { Day } from '@/components/day';
import { List, PrayerAgo } from '@/components/prayer';
import { useChromeDeferred } from '@/hooks/useChromeDeferred';
import { SCREEN, SIZE } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { showTimePassedAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Screen({ type }: Props) {
  const insets = useSafeAreaInsets();
  const showTimePassed = useAtomValue(showTimePassedAtom);
  // The extras page renders off-screen at launch — its content defers past
  // the first content frame (launch chrome defer). The flip batches into the
  // same commit as the overlay's deferred mount, so the overlay's load-time
  // list measurement still finds the extras rows in place.
  const chromeDeferred = useChromeDeferred();
  const deferContent = type === ScheduleType.Extra && !chromeDeferred;

  const computedStyles: ViewStyle = {
    paddingTop: insets.top + SCREEN.paddingTop,
    paddingBottom: insets.bottom,
    maxWidth: SIZE.screenMaxWidth,
    width: '100%',
    alignSelf: 'center',
  };

  return (
    <View style={[{ flex: 1 }, computedStyles]}>
      {!deferContent && (
        <>
          <Countdown type={type} />
          <Day type={type} />
          <List type={type} />

          {showTimePassed && <PrayerAgo type={type} />}
        </>
      )}

      {/* Spacing */}
      <View style={{ flex: 1 }} />
    </View>
  );
}

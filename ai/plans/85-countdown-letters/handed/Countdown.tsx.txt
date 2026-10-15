import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useDerivedProgress } from '@/hooks/useAnimation';
import { useCountdown } from '@/hooks/useCountdown';
import { COLORS, COUNTDOWN_WAITING_NAME, SPACING, STYLES, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';
import { countdownBarShownAtom } from '@/stores/ui';

import Bar from './Bar';

interface Props {
  type: ScheduleType;
}

interface LetteredGroup {
  digits: string;
  letter: string;
  spent: boolean;
}

const UNIT_LETTERS = ['h', 'm', 's'];
const UNIT_LETTER_COLOR = 'rgba(160, 200, 255, 0.4)';
const COLON_DISPLAY = /^\d{2}(:\d{2}){1,2}$/;

// The display string is always hours-first, so a group's index names its unit
const letteredGroups = (displayTime: string): LetteredGroup[] | null => {
  if (!COLON_DISPLAY.test(displayTime)) return null;

  const values = displayTime.split(':').map(Number);
  return values.map((value, index) => {
    const isSeconds = index === 2;
    const largerAllZero = values.slice(0, index).every((larger) => larger === 0);
    return {
      digits: String(value),
      letter: UNIT_LETTERS[index],
      // 0S renders alone, so the row never empties
      spent: value === 0 && (!isSeconds || !largerAllZero),
    };
  });
};

export default function Countdown({ type }: Props) {
  // NEW: Use sequence-based countdown hook
  //
  // While the overlay is open on this schedule the page countdown atom itself
  // carries the selected prayer's countdown (ADR-014 countdown merge — the
  // sequence ticker writes the display target); no second subscription exists
  const { displayTime, prayerName, isReady } = useCountdown(type);

  const overlayIsOn = useAtomValue(overlayIsOnAtom);
  const countdownBarShown = useAtomValue(countdownBarShownAtom);

  const overlayProgress = useDerivedProgress(overlayIsOn ? 1 : 0, { defaultTiming: true });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + overlayProgress.value * 0.5 }, { translateY: overlayProgress.value * 5 }],
  }));

  // Show loading state if countdown not ready (sequence not initialized)
  if (!isReady && !overlayIsOn) {
    return null;
  }

  const groups = letteredGroups(displayTime);
  const liveGroups = groups?.filter((group) => !group.spent);
  const rowLabel = liveGroups?.map((group) => `${group.digits}${group.letter}`).join(' ');

  return (
    <Animated.View style={[styles.container]}>
      <View>
        <Text
          style={[styles.text]}
          // Read aloud, "..." says nothing, so a screen reader hears what the dots stand for; nothing on screen changes
          accessibilityLabel={prayerName === COUNTDOWN_WAITING_NAME ? t('countdown.waitingLabel') : undefined}>
          {prayerName}
        </Text>
        {groups === null ? (
          <Animated.Text style={[styles.countdown, animatedStyle]}>{displayTime}</Animated.Text>
        ) : (
          <Animated.View style={animatedStyle}>
            <View style={styles.timerRow} accessible accessibilityLabel={rowLabel}>
              {liveGroups?.map((group) => (
                <Text key={group.letter} style={styles.group}>
                  {group.digits}
                  <Text style={styles.gap}> </Text>
                  <Text style={styles.unitLetter}>{group.letter}</Text>
                </Text>
              ))}
            </View>
          </Animated.View>
        )}
        {countdownBarShown && <Bar type={type} />}
      </View>
    </Animated.View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    height: STYLES.countdown.height,
    marginBottom: 48,
    marginTop: 6,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontFamily: ty.wordFace ? ty.familyRegular : undefined,
    fontSize: ty.size(TEXT.sizeSmall) + 1,
    marginBottom: SPACING.xxs + 1,
    color: COLORS.text.secondary,
    transform: [{ translateY: -2 }],
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  countdown: {
    color: COLORS.text.primary,
    fontSize: ty.countdownSize,
    textAlign: 'center',
    fontFamily: ty.familyDigits,
    fontVariant: ['tabular-nums'],
    marginBottom: SPACING.lg,
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    direction: 'ltr',
  },
  group: {
    marginHorizontal: 6,
    color: COLORS.text.primary,
    fontSize: ty.countdownSize,
    fontFamily: ty.familyDigits,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  gap: {
    fontSize: 8,
  },
  unitLetter: {
    color: UNIT_LETTER_COLOR,
    fontSize: Math.round(ty.countdownSize * 0.55),
  },
});

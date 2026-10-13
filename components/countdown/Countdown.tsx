import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useDerivedColor, useDerivedProgress } from '@/hooks/useAnimation';
import { useCountdown } from '@/hooks/useCountdown';
import { ANIMATION, COLORS, COUNTDOWN_WAITING_NAME, SPACING, STYLES, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { splitColonSections } from '@/shared/time';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';
import { countdownBarShownAtom } from '@/stores/ui';

import Bar from './Bar';

interface Props {
  type: ScheduleType;
}

/** One digit group of the timer: bright above zero, dim at 00 (row 72 rule 3) */
function CountdownSectionText({ text, dim }: { text: string; dim: boolean }) {
  const colorStyle = useDerivedColor(dim ? 0 : 1, {
    fromColor: COLORS.countdown.dimDigit,
    toColor: COLORS.text.primary,
    duration: ANIMATION.durationSlow,
  });
  return <Animated.Text style={colorStyle}>{text}</Animated.Text>;
}

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

  const sections = splitColonSections(displayTime);

  return (
    <Animated.View style={[styles.container]}>
      <View>
        <Text
          style={[styles.text]}
          // Read aloud, "..." says nothing, so a screen reader hears what the dots stand for; nothing on screen changes
          accessibilityLabel={prayerName === COUNTDOWN_WAITING_NAME ? t('countdown.waitingLabel') : undefined}>
          {prayerName}
        </Text>
        {sections === null ? (
          <Animated.Text style={[styles.countdown, animatedStyle]}>{displayTime}</Animated.Text>
        ) : (
          <Animated.Text style={[styles.countdown, animatedStyle]}>
            {sections.map((section, index) =>
              section.colon ? (
                <Text
                  // biome-ignore lint/suspicious/noArrayIndexKey: the colon's slot is fixed by the string's shape, the list never reorders
                  key={`colon-${index}`}
                  style={styles.countdownColon}>
                  {'\u2009:\u2009'}
                </Text>
              ) : (
                <CountdownSectionText
                  // biome-ignore lint/suspicious/noArrayIndexKey: the group's slot is fixed by the string's shape, the list never reorders
                  key={`group-${index}`}
                  text={section.text}
                  dim={section.dim}
                />
              )
            )}
          </Animated.Text>
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
    marginBottom: SPACING.section,
    marginTop: 6,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontFamily: ty.arabic ? ty.familyRegular : undefined,
    fontSize: ty.size(TEXT.sizeSmall),
    marginBottom: SPACING.xxs + 1,
    color: COLORS.text.secondary,
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  countdown: {
    color: COLORS.text.primary,
    fontSize: ty.size(TEXT.sizeLarge),
    textAlign: 'center',
    fontFamily: ty.familyDigits,
    fontVariant: ['tabular-nums'],
    marginBottom: SPACING.lg,
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  countdownColon: {
    color: COLORS.countdown.colon,
  },
});

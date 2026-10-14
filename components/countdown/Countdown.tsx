import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, type EasingFunction, useAnimatedStyle } from 'react-native-reanimated';

import { useDerivedColor, useDerivedProgress } from '@/hooks/useAnimation';
import { useCountdown } from '@/hooks/useCountdown';
import { usePrevious } from '@/hooks/usePrevious';
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

interface FadeTiming {
  duration: number;
  easing?: EasingFunction;
}

type DigitSection = { text: ':'; colon: true } | { text: string; colon: false; dim: boolean; paddingZero: boolean };

/** One digit of the timer: bright above zero, dim at 00 or as a padding zero */
function CountdownDigit({ char, dim, fadeTiming }: { char: string; dim: boolean; fadeTiming: FadeTiming }) {
  const colorStyle = useDerivedColor(dim ? 0 : 1, {
    fromColor: COLORS.countdown.dimDigit,
    toColor: COLORS.text.primary,
    duration: fadeTiming.duration,
    easing: fadeTiming.easing,
  });
  return <Animated.Text style={[styles.sectionText, colorStyle]}>{char}</Animated.Text>;
}

/** One digit group of the timer: a padding zero dims only once every larger group is spent */
function CountdownSectionText({
  text,
  dim,
  paddingZero,
  fadeTiming,
}: {
  text: string;
  dim: boolean;
  paddingZero: boolean;
  fadeTiming: FadeTiming;
}) {
  return (
    <>
      <CountdownDigit char={text[0]} dim={dim || paddingZero} fadeTiming={fadeTiming} />
      <CountdownDigit char={text[1]} dim={dim} fadeTiming={fadeTiming} />
    </>
  );
}

export default function Countdown({ type }: Props) {
  // NEW: Use sequence-based countdown hook
  //
  // While the overlay is open on this schedule the page countdown atom itself
  // carries the selected prayer's countdown (ADR-014 countdown merge — the
  // sequence ticker writes the display target); no second subscription exists
  const { displayTime, prayerName, isReady } = useCountdown(type);

  const overlayIsOn = useAtomValue(overlayIsOnAtom);
  // Overlay swaps animate on the overlay layer's own duration; the countdown's digit flips take the fast one
  const previousOverlayIsOn = usePrevious(overlayIsOn);
  const isOverlaySwap = previousOverlayIsOn !== undefined && previousOverlayIsOn !== overlayIsOn;
  const digitFade: FadeTiming = isOverlaySwap
    ? { duration: ANIMATION.duration }
    : { duration: ANIMATION.durationFast, easing: Easing.linear };
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
  const digitSections: DigitSection[] | null =
    sections === null
      ? null
      : sections.map((section, index) => {
          if (section.colon) return { text: ':', colon: true } satisfies DigitSection;
          const spentBefore = sections.slice(0, index).every((prior) => prior.colon || prior.dim);
          return {
            text: section.text,
            colon: false,
            dim: section.dim,
            paddingZero: !section.dim && spentBefore && Number(section.text) < 10,
          } satisfies DigitSection;
        });

  return (
    <Animated.View style={[styles.container]}>
      <View>
        <Text
          style={[styles.text]}
          // Read aloud, "..." says nothing, so a screen reader hears what the dots stand for; nothing on screen changes
          accessibilityLabel={prayerName === COUNTDOWN_WAITING_NAME ? t('countdown.waitingLabel') : undefined}>
          {prayerName}
        </Text>
        {digitSections === null ? (
          <Animated.Text style={[styles.countdown, animatedStyle]}>{displayTime}</Animated.Text>
        ) : (
          <Animated.View style={animatedStyle}>
            <View style={styles.timerRow} accessible accessibilityLabel={displayTime}>
              {digitSections.map((section, index) =>
                section.colon ? (
                  <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: the colon's slot is fixed by the string's shape, the list never reorders
                    key={`colon-${index}`}
                    style={[
                      styles.colonDots,
                      {
                        marginLeft: digitSections[index - 1]?.text[1] === '1' ? 2.5 : 4.5,
                        marginRight: digitSections[index + 1]?.text[0] === '1' ? 2.5 : 4.5,
                      },
                    ]}>
                    <View style={styles.colonDot} />
                    <View style={styles.colonDot} />
                  </View>
                ) : (
                  <CountdownSectionText
                    // biome-ignore lint/suspicious/noArrayIndexKey: the group's slot is fixed by the string's shape, the list never reorders
                    key={`group-${index}`}
                    text={section.text}
                    dim={section.dim}
                    paddingZero={section.paddingZero}
                    fadeTiming={digitFade}
                  />
                )
              )}
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
  sectionText: {
    color: COLORS.text.primary,
    fontSize: ty.countdownSize,
    fontFamily: ty.familyDigits,
    fontVariant: ['tabular-nums'],
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
  colonDots: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    marginHorizontal: 4.5,
  },
  colonDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: COLORS.countdown.colon,
  },
});

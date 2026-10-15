import { useAtomValue } from 'jotai';
import { Fragment } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';

import { useDerivedBackgroundColor, useDerivedColor, useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayerAgo } from '@/hooks/usePrayerAgo';
import { ANIMATION, COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { splitAgoDuration } from '@/shared/time';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';

interface Props {
  type: ScheduleType;
}

/**
 * Displays time elapsed since the previous prayer
 *
 * Shows "now" for the first 60 seconds, then the lettered duration (Xh Ym) inside
 * the catalog sentence. Animates between normal and "recent" color states (≤5 mins).
 * Fades out when the overlay is open.
 *
 * @param type - Schedule type (Standard or Extra)
 */
export default function PrayerAgo({ type }: Props) {
  const { prayerAgo, minutesElapsed, isReady } = usePrayerAgo(type);

  // Mounted only once ready, so the colours' first-evaluation snap lands on real data
  if (!isReady) return null;

  return <PrayerAgoBadge prayerAgo={prayerAgo} minutesElapsed={minutesElapsed} />;
}

function PrayerAgoBadge({ prayerAgo, minutesElapsed }: { prayerAgo: string; minutesElapsed: number }) {
  const overlayIsOn = useAtomValue(overlayIsOnAtom);

  const isRecent = minutesElapsed <= 5 ? 1 : 0;
  const recentColorOptions = { duration: ANIMATION.durationMedium, easing: Easing.linear };
  const prayerAgoColorStyle = useDerivedColor(isRecent, {
    fromColor: COLORS.prayerAgo.text,
    toColor: COLORS.feedback.success,
    ...recentColorOptions,
  });
  const prayerAgoBackgroundStyle = useDerivedBackgroundColor(isRecent, {
    fromColor: COLORS.prayerAgo.gradient.start,
    toColor: COLORS.prayerAgo.gradient.end,
    ...recentColorOptions,
  });

  // Fade out when overlay opens (derived, so it cannot strand on resume)
  const prayerAgoOpacityStyle = useDerivedOpacity(overlayIsOn ? 0 : 1, { duration: ANIMATION.durationFade });

  const parts = splitAgoDuration(prayerAgo);

  return (
    <Animated.Text style={[styles.prayerAgo, prayerAgoOpacityStyle, prayerAgoColorStyle, prayerAgoBackgroundStyle]}>
      {parts === null ? (
        prayerAgo
      ) : (
        <>
          {parts.before}
          {parts.groups.map((group, index) => (
            <Fragment key={group.letter}>
              {index > 0 ? ' ' : null}
              {group.digits}
              <Text style={styles.gap}> </Text>
              <Text style={styles.unitLetter}>{group.letter}</Text>
            </Fragment>
          ))}
          {parts.after}
        </>
      )}
    </Animated.Text>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  prayerAgo: {
    textAlign: 'center',
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.py,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: -SPACING.xs,
  },
  gap: {
    fontSize: 8,
  },
  unitLetter: {
    fontSize: Math.round(ty.size(TEXT.sizeDetail) * 0.55),
    opacity: 0.4,
  },
});

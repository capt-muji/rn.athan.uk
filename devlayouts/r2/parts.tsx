/**
 * Shared round-2 primitives for the fasting layout variants (T-623 round 2).
 *
 * Dev-only: nothing shipped imports here. The provider holds the draft and
 * the saved set so the harness chrome's Save control and every variant read
 * one state; variants draw their own structures on top. Selected state rides
 * the app's segment purple. Every visible string is a hoisted literal here or
 * in the variant files; first frame settled, only value changes move.
 */

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import { nextR2Selection, type R2Key, type R2Selection, r2Description } from './model';

/** The Off/Silent/Sound track's own filled-segment purple (SEGMENT_PILL.rest) */
export const R2_PURPLE = '#5015b5';
export const R2_PURPLE_BORDER = '#672bcf';
export const R2_ON_INK = '#ffffff';

/** The titled card's name, the owner's spec word */
export const R2_CARD_TITLE = 'Fasting';

interface R2State {
  readonly selection: R2Selection;
  readonly saved: R2Selection;
  readonly tap: (key: R2Key) => void;
  readonly save: () => void;
}

const R2Context = createContext<R2State | null>(null);

interface R2ProviderProps {
  readonly seed: R2Selection;
  readonly children: ReactNode;
}

/**
 * One state above every variant: the seed opens both draft and saved set, a
 * variant switch re-seeds, Save commits the draft. Selection persists across
 * re-renders of the same variant.
 */
export function R2Provider({ seed, children }: R2ProviderProps) {
  const [selection, setSelection] = useState<R2Selection>(seed);
  const [saved, setSaved] = useState<R2Selection>(seed);

  useEffect(() => {
    setSelection(seed);
    setSaved(seed);
  }, [seed]);

  const state = useMemo<R2State>(
    () => ({
      selection,
      saved,
      tap: (key) => setSelection((current) => nextR2Selection(current, key)),
      save: () => setSaved(selection),
    }),
    [selection, saved]
  );

  return <R2Context.Provider value={state}>{children}</R2Context.Provider>;
}

export const useR2 = (): R2State => {
  const state = useContext(R2Context);
  if (!state) throw new Error('devlayouts r2: variant rendered outside R2Provider');
  return state;
};

/** The drawn switch: purple track when on, settled instantly */
export const R2Switch = ({ on, onPress }: { on: boolean; onPress: () => void }) => (
  <Pressable
    style={[switchStyles.track, on ? switchStyles.trackOn : null]}
    hitSlop={HIT_SLOP.md}
    onPress={onPress}
    accessibilityRole={'switch'}
    accessibilityState={{ checked: on }}>
    <View style={[switchStyles.thumb, on ? switchStyles.thumbOn : null]} />
  </Pressable>
);

/** The whole-selection sentence, drawn under the option set per the spec */
export const R2Description = ({ style }: { style?: object | object[] }) => {
  const { selection, saved } = useR2();
  return <Text style={[descriptionStyles.text, style]}>{r2Description(selection, saved)}</Text>;
};

/** The titled card: "Fasting" over a bordered container, for the layouts that use one */
export const R2Card = ({ children, style }: { children: ReactNode; style?: object | object[] }) => (
  <View style={[cardStyles.card, style]}>
    <Text style={cardStyles.title}>{R2_CARD_TITLE}</Text>
    {children}
  </View>
);

/** The small state dot: filled purple when its option is selected */
export const R2StateDot = ({ on }: { on: boolean }) => <View style={[dotStyles.dot, on ? dotStyles.dotOn : null]} />;

/** The letter medallion: the option's initial in a circle, purple when selected */
export const R2Medallion = ({ letter, on }: { letter: string; on: boolean }) => (
  <View style={[medallionStyles.badge, on ? medallionStyles.badgeOn : null]}>
    <Text style={[medallionStyles.letter, on ? medallionStyles.letterOn : null]}>{letter}</Text>
  </View>
);

const ty = typographyFor(currentLocaleId());

const switchStyles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    padding: 2,
  },
  trackOn: {
    backgroundColor: R2_PURPLE,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8ea0c9',
  },
  thumbOn: {
    backgroundColor: R2_ON_INK,
    alignSelf: 'flex-end',
  },
});

const descriptionStyles = StyleSheet.create({
  text: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: 'rgba(230, 233, 247, 0.85)',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.smd,
  },
  title: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.92)',
  },
});

const dotStyles = StyleSheet.create({
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
});

const medallionStyles = StyleSheet.create({
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  letter: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
});

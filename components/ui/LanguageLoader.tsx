import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS, OVERLAY, SIZE, SPACING, TEXT } from '@/shared/constants';
import { languageChangingLine, tIn } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';
import { languageCommitBusyAtom, pendingLanguageAtom } from '@/stores/language';

/** The line's cap: a longer sentence breaks onto two centred lines rather than one screen-wide line */
const LINE_MAX_WIDTH = 260;

/** The line's entrance, the owner's number: the one first frame this surface does not settle */
const LINE_FADE_MS = 200;

/**
 * The full-screen face a language pick runs behind: the launch face's purple, spinner
 * and line, with the line naming the language being set.
 *
 * Mounted by the root after the sheet layer. The pick's own sheet is closing from the
 * same tick, so the loader covers the screens while the surfaces converge and the app
 * relaunches where the pick crosses the layout direction.
 *
 * The cover and the spinner mount settled; the line's wrapper fades in once its words exist,
 * because the target's own name arrives with the pick. The whole face then lifts in one act:
 * the container returns null, one unmount, no stagger.
 */
export default function LanguageLoader() {
  const busy = useAtomValue(languageCommitBusyAtom);
  const pending = useAtomValue(pendingLanguageAtom);
  // The line speaks the TARGET's words from its first frame: a switch's loader composing through
  // the active catalog drew one frame in the old language around the target's name, then flipped.
  // The face keys off the target for the same reason: frame one is
  // already the target's family and box, never the old locale's.
  const line = pending === null ? '' : languageChangingLine(pending);
  const ty = typographyFor(pending ?? currentLocaleId());
  const lineOpacity = useSharedValue(0);

  useEffect(() => {
    // The line becomes available the moment the pick names its target: from there it fades in
    lineOpacity.value = 0;
    if (!busy || line === '') return;
    lineOpacity.value = withTiming(1, { duration: LINE_FADE_MS });
  }, [busy, line, lineOpacity]);

  const lineFade = useAnimatedStyle(() => ({ opacity: lineOpacity.value }), [lineOpacity]);

  if (!busy || pending === null) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole={'progressbar'}
      accessibilityLabel={tIn(pending, 'app.loadingLabel')}>
      <View style={styles.spinnerBox}>
        <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      </View>
      <View style={styles.lineBox}>
        {/* The fade rides the line's own wrapper: text ink is solid, never alpha (the standing order) */}
        <Animated.View style={lineFade}>
          <Text style={[styles.line, { fontSize: ty.size(TEXT.size), fontFamily: ty.familyRegular }]}>{line}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: COLORS.navigation.rootBackground,
    zIndex: OVERLAY.zindexes.popup,
  },
  // Dead centre, not the pair's block centre: a growing gap below must not drift the spinner up
  spinnerBox: {
    position: 'absolute',
    top: '50%',
    start: 0,
    end: 0,
    alignItems: 'center',
    transform: [{ translateY: -SIZE.activityIndicator / 2 }],
  },
  // Hung from the spinner's foot, so only the line answers a gap ruling
  lineBox: {
    position: 'absolute',
    top: '50%',
    start: 0,
    end: 0,
    alignItems: 'center',
    marginTop: SIZE.activityIndicator / 2 + SPACING.xxxl,
  },
  line: {
    maxWidth: LINE_MAX_WIDTH,
    textAlign: 'center',
    color: '#fff',
  },
});

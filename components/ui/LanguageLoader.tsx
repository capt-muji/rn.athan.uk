import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS, OVERLAY, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId, localeVersionAtom } from '@/shared/i18n/locale';
import { nativeLanguageName } from '@/shared/languageNames';
import { typographyFor } from '@/shared/typography';
import { languageCommitBusyAtom, pendingLanguageAtom } from '@/stores/language';

/** The line's cap: a longer sentence breaks onto two centred lines rather than one screen-wide line */
const LINE_MAX_WIDTH = 260;

/**
 * The full-screen face a language pick runs behind: the launch face's purple, spinner
 * and line, with the line naming the language being set.
 *
 * Mounted by the root after the sheet layer. The pick's own sheet is closing from the
 * same tick, so the loader covers the screens while the surfaces converge and the app
 * relaunches where the pick crosses the layout direction.
 */
export default function LanguageLoader() {
  const busy = useAtomValue(languageCommitBusyAtom);
  const pending = useAtomValue(pendingLanguageAtom);
  // The commit switches the locale before the surfaces converge, so the line re-derives
  // on the version bump and reads in the language being set
  const localeVersion = useAtomValue(localeVersionAtom);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the version bump is the deliberate re-derive trigger, though the callback reads no version value
  const line = useMemo(
    () => (pending === null ? '' : t('language.changing', { language: nativeLanguageName(pending) })),
    [pending, localeVersion]
  );

  if (!busy || pending === null) return null;

  return (
    <View style={styles.container} accessibilityRole={'progressbar'} accessibilityLabel={t('app.loadingLabel')}>
      <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.navigation.rootBackground,
    zIndex: OVERLAY.zindexes.popup,
  },
  line: {
    maxWidth: LINE_MAX_WIDTH,
    textAlign: 'center',
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyRegular,
    lineHeight: ty.blockLineHeight(ty.size(TEXT.size)),
    color: '#fff',
  },
});

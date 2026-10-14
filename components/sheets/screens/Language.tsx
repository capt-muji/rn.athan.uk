import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { commitLanguagePreference } from '@/stores/language';
import { hideLanguageSheet, setLanguageSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import { pickLanguage } from './languageSheet';

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_language';

/**
 * The D8 language sheet. A pick commits immediately and closes the sheet; the
 * root's full-screen loader covers the wait. There is no cancel control
 * (D18's no-cancel, kept by D47).
 */
export default function BottomSheetLanguage() {
  const active = currentLocaleId();

  return (
    <Sheet
      setRef={setLanguageSheetModal}
      title={t('settings.language')}
      // The pick commits immediately (D47), so there is no close-to-save line to say
      subtitle={null}
      icon={<IconView type={Icon.GLOBE} size={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['60%']}
      perfName={SHEET_PERF_NAME}
      stackBehavior={'push'}>
      <View style={styles.card}>
        {LANGUAGE_NAMES.map((entry) => (
          <Pressable
            key={entry.id}
            style={styles.option}
            onPress={() => pickLanguage(entry.id, active, commitLanguagePreference, hideLanguageSheet)}
            accessibilityRole={'radio'}
            // Which language is in force is carried only by this row's check, so
            // `selected` is the one thing a screen reader has to tell the rows apart
            accessibilityState={{ selected: entry.id === active }}
            accessibilityLabel={entry.name}>
            <Text style={styles.optionLabel}>{entry.name}</Text>
            {entry.id === active ? <IconView type={Icon.CHECK} size={18} color={COLORS.text.primary} /> : null}
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
  },

  // Rows
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingStart: SPACING.md,
    paddingEnd: SPACING.sm,
    gap: SPACING.sm,
  },
  optionLabel: {
    flex: 1,
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
});

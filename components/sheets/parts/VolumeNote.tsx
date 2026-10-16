import { Platform, StyleSheet, Text, View } from 'react-native';

import { InfoBadge } from '@/components/ui';
import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

/**
 * The volume footnote both sheets close on: the running platform's own volume
 * truth, centred under the body, its information glyph beside the copy.
 */
export default function SheetVolumeNote() {
  return (
    <View style={styles.foot}>
      <InfoBadge round size={20} glyph={12} color={COLORS.text.sheetSubtitle} />
      <Text style={styles.text}>{t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());
// D94: the ar note copy clears the list (the preview animation) above it
const compactArabic = currentLocaleId() === 'ar';

const styles = StyleSheet.create({
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: compactArabic ? 32 : SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  text: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: ty.size(TEXT.sizeDetail),
    // Rubik's win ink descends past its own line box at this size; the script box gives it room
    lineHeight: ty.scriptLineHeight?.(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    // The glyph keeps its distance: the start side faces it in either layout direction
    marginStart: SPACING.md,
  },
});

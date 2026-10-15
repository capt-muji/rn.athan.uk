import { Platform, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

/**
 * The volume footnote both sheets close on: the running platform's own volume
 * truth, centred under the body, its information glyph beside the copy.
 */
export default function SheetVolumeNote() {
  return (
    <View style={styles.foot}>
      <IconView type={Icon.INFO} size={12} color={COLORS.text.sheetSubtitle} />
      <Text style={styles.text}>{t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  text: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

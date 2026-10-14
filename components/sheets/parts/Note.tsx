import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

interface Props {
  text: string;
}

/**
 * The quiet footnote a sheet draws under its header, above its first card.
 *
 * The line box is pinned from the locale record, so a taller Arabic box cannot
 * push the sheet's content down.
 */
export default function SheetNote({ text }: Props) {
  return (
    <View style={styles.note}>
      <View style={styles.rule} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  note: {
    marginBottom: SPACING.lg,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.text.sheetSubtitle,
    opacity: 0.2,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    lineHeight: ty.blockLineHeight(ty.size(TEXT.sizeDetail)),
  },
});

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
 * The horizontal inset matches the header's, so the rule and the line run from
 * the title's edge to the icon's edge (owner ruling, 2026-10-14).
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
    // The header-to-rule space drops 30 percent of the header's 30, plus a little
    // more pull so the block reads higher under the subtitle (her dial, 2026-10-14)
    marginTop: -12,
    marginBottom: SPACING.quart,
    paddingHorizontal: SPACING.lg,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.text.sheetSubtitle,
    opacity: 0.2,
    marginBottom: SPACING.md,
  },
  text: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

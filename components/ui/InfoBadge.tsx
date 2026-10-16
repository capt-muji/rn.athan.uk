import { StyleSheet, View } from 'react-native';

import InfoBare from '@/assets/icons/svg/info-bare.svg';
import { COLORS } from '@/shared/constants';

interface Props {
  /** The chip's side; the glyph renders at its own per-surface size inside */
  size: number;
  glyph: number;
  color: string;
}

/** The one information mark: the bare i on its round chip, every surface matching the sheet footers */
export default function InfoBadge({ size, glyph, color }: Props) {
  const badge = [styles.chip, { width: size, height: size, borderRadius: size / 2 }];

  return (
    <View style={badge}>
      <InfoBare width={glyph} height={glyph} style={{ color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: COLORS.icon.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

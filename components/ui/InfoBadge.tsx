import { StyleSheet, View } from 'react-native';

import InfoBare from '@/assets/icons/svg/info-bare.svg';
import { COLORS } from '@/shared/constants';

interface Props {
  /** The chip's side; the glyph renders at its own per-surface size inside */
  size: number;
  glyph: number;
  color: string;
  /** Round chips serve the sheet footers; the info box keeps its square */
  round?: boolean;
}

/** The one information mark: the bare i on its chip, square or round by surface */
export default function InfoBadge({ size, glyph, color, round }: Props) {
  const badge = [
    styles.chip,
    { width: size, height: size, borderRadius: round ? size / 2 : Math.round((size * 8) / 26) },
  ];

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

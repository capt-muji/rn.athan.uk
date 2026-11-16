/**
 * The fasting identity marks (design 427): the plain filled dot every mode row
 * carries beside its name - Muhammad green, Dawood yellow, the white days
 * white, Every day reserving the slot invisibly - and the bordered cluster the
 * calendar cells (and the extras row) carry: every circle ringed in the deep
 * background shade, the circles forty percent into each other, the white
 * circle beneath at the left and the regimen on top at the right (owner
 * ruling 2026-11-06). Never three circles: the two regimens exclude each
 * other, so a cluster is one mark or a mark beside the white days.
 */

import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { FastingIdentity } from '@/shared/fastingSchedule';

const IDENTITY_RGB: Record<FastingIdentity, readonly [number, number, number]> = {
  green: [74, 222, 128],
  // Dawood's yellow at the owner's named hex (order 2026-11-06): #ffde05
  cyan: [255, 222, 5],
  white: [255, 255, 255],
};

const fastingIdentityColor = (identity: FastingIdentity): string => {
  const [r, g, b] = IDENTITY_RGB[identity];
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

/** The deep background shade sampled from behind the alerts icon: the rings' color */
const FASTING_DOT_BORDER = '#1B1967';

/** The extras row's bell cluster: its circle size, riding the Suhoor bell's corner */
export const FASTING_BELL_DOT = 8.5;

/** The bell cluster's ring weight: thick enough to separate the overlapping pair, solid ink,
 * no alpha, and not black - the deep background shade (owner order 2026-11-06) */
export const FASTING_BELL_RING = 1.5;

/** How far the bordered circles overlap: forty percent into each other */
const FASTING_RING_OVERLAP_STEP = 0.6;

/** One plain filled identity dot: the rows' mark, borderless */
export const FastingDot = ({ identity, size }: { identity: FastingIdentity; size: number }) => (
  <View
    style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fastingIdentityColor(identity) }}
  />
);

/** One bordered identity circle, drawn as an SVG circle so the ring stays perfectly round at
 * every fractional size (a bordered View's corners anti-alias squarish below ~10pt); the ring
 * is solid ink with no alpha, and straddles the path so the outer edge lands on `size` */
const FastingRingDot = ({ identity, size, ring }: { identity: FastingIdentity; size: number; ring: number }) => (
  <Svg width={size} height={size}>
    <Circle
      cx={size / 2}
      cy={size / 2}
      r={(size - ring) / 2}
      fill={fastingIdentityColor(identity)}
      stroke={FASTING_DOT_BORDER}
      strokeWidth={ring}
    />
  </Svg>
);

/**
 * The bordered cluster: circles forty percent into each other, rendered so the
 * regimen rides on top at the right and the white days sit beneath at the left
 * (owner ruling 2026-11-06, replacing 2026-11-05). A lone identity renders one
 * circle in the cluster's right slot, where a partner's front circle would sit;
 * the caller renders no cluster for a day with no regimen to name (an unarmed
 * day, or Ramadan's own subsumed fast).
 */
export const FastingRingCluster = ({
  identities,
  size,
  ring,
}: {
  identities: readonly [FastingIdentity, ...FastingIdentity[]];
  size: number;
  ring: number;
}) => {
  const step = size * FASTING_RING_OVERLAP_STEP;

  if (identities.length === 1) {
    return (
      <View style={{ width: size + step, height: size }}>
        <View style={{ position: 'absolute', left: step }}>
          <FastingRingDot identity={identities[0]} size={size} ring={ring} />
        </View>
      </View>
    );
  }

  const width = size + (identities.length - 1) * step;

  return (
    <View style={{ width, height: size }}>
      {identities.map((identity, index) => (
        <View key={identity} style={{ position: 'absolute', left: index * step }}>
          <FastingRingDot identity={identity} size={size} ring={ring} />
        </View>
      ))}
    </View>
  );
};

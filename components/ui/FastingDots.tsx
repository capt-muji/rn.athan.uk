/**
 * The fasting identity marks (design 427): the plain filled dot every mode row
 * carries beside its name - Muhammad green, Dawood cyan, the white days white,
 * Every day reserving the slot invisibly - the entries' plain overlap with the
 * punched seam, and the bordered cluster the calendar cells (and the extras
 * row) carry: every circle ringed in the deep background shade, the circles
 * forty percent into each other, the white circle right of its partner and on
 * top (owner ruling 2026-11-05). Never three circles: the two regimens exclude
 * each other, so a cluster is one mark or a mark beside the white days.
 */

import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Mask, Rect } from 'react-native-svg';

import type { FastingIdentity } from '@/shared/fastingSchedule';

const IDENTITY_RGB: Record<FastingIdentity, readonly [number, number, number]> = {
  green: [74, 222, 128],
  cyan: [34, 211, 238],
  white: [255, 255, 255],
};

const fastingIdentityColor = (identity: FastingIdentity): string => {
  const [r, g, b] = IDENTITY_RGB[identity];
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

/** The deep background shade sampled from behind the alerts icon: the rings' color */
export const FASTING_DOT_BORDER = '#1B1967';

/** The calendar cells' ring weight, one step under the bell's for the smaller circles */
export const FASTING_CELL_RING = 1.5;

/** How far the bordered circles overlap: forty percent into each other */
const FASTING_RING_OVERLAP_STEP = 0.6;

/** How far the plain entry dots overlap, and the punched seam's extra radius */
const BITE_STEP = 0.8;
const BITE_SEAM = 1.4;

/** One plain filled identity dot: the rows' mark, borderless */
export const FastingDot = ({ identity, size }: { identity: FastingIdentity; size: number }) => (
  <View
    style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fastingIdentityColor(identity) }}
  />
);

/** One bordered identity circle: the ring hugs the fill, no inner gap */
const FastingRingDot = ({ identity, size, ring }: { identity: FastingIdentity; size: number; ring: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: fastingIdentityColor(identity),
      borderWidth: ring,
      borderColor: FASTING_DOT_BORDER,
    }}
  />
);

/**
 * The entries' cluster: plain circles overlapped, the front (left) circle
 * cutting a bite out of the back one - the seam a real punched hole, so the
 * background shows between the circles. A day Ramadan subsumes carries no
 * regimen identity, so its entry renders no cluster at all.
 */
export const FastingBiteCluster = ({ identities, size }: { identities: readonly FastingIdentity[]; size: number }) => {
  const maskId = `fasting-bite-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (identities.length === 0) return null;
  if (identities.length === 1) return <FastingDot identity={identities[0]} size={size} />;

  const step = size * BITE_STEP;
  const width = size + (identities.length - 1) * step;
  const centre = size / 2;
  const front = identities[0];
  const back = identities.slice(1);

  return (
    <Svg width={width} height={size}>
      <Mask id={maskId} maskUnits={'userSpaceOnUse'} x={0} y={0} width={width} height={size}>
        <Rect x={0} y={0} width={width} height={size} fill={'white'} />
        {back.map((identity, index) => (
          <Circle key={identity} cx={centre + index * step} cy={centre} r={centre + BITE_SEAM} fill={'black'} />
        ))}
      </Mask>
      <G mask={maskId}>
        {back.map((identity, index) => (
          <Circle
            key={identity}
            cx={centre + (index + 1) * step}
            cy={centre}
            r={centre}
            fill={fastingIdentityColor(identity)}
          />
        ))}
      </G>
      <Circle cx={centre} cy={centre} r={centre} fill={fastingIdentityColor(front)} />
    </Svg>
  );
};

/**
 * The bordered cluster: circles forty percent into each other, rendered in
 * regimen order so the white days sit right of their partner and, drawn last,
 * on top of it. A lone identity renders one circle; the caller renders no
 * cluster for a day with no regimen to name (an unarmed day, or Ramadan's
 * own subsumed fast).
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
  if (identities.length === 1) return <FastingRingDot identity={identities[0]} size={size} ring={ring} />;

  const step = size * FASTING_RING_OVERLAP_STEP;
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

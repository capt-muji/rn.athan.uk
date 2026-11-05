/**
 * The round-10 mode identity dots (T-623): the small FILLED circles every
 * surface renders - the card's armed rows carry one beside the row name (an
 * invisible reservation keeps every row's spacing fixed), the Suhoor row's
 * bell corner carries the armed cluster, the notes' entries and the calendar
 * header repeat it. A combo overlaps its two circles about twenty percent
 * with the front circle cutting a bite out of the back one - the seam is a
 * real punched hole (an SVG mask), so the row background shows through with
 * no outlines and no strokes; never three circles. Dev-only: nothing shipped
 * imports here.
 */

import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Mask, Rect } from 'react-native-svg';

import type { R2Selection } from '../r2/model';
import { POINTER_NONE } from '../r9/model';
import type { R10Spot, R10Take } from './model';
import { type R10Identity, r10ArmedIdentities, r10IdentityColor } from './model';

/** How far one dot's centre sits from its neighbour's: twenty percent overlap */
const OVERLAP_STEP = 0.8;
/** The punched hole's extra radius: the background seam between the circles */
const BITE_SEAM = 1.4;

/** One filled identity dot */
export const R10ModeDot = ({ identity, size }: { identity: R10Identity; size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: r10IdentityColor(identity) }} />
);

/**
 * The armed identities as one cluster: dots left to right in regimen order,
 * the front (left) circle biting each circle behind it.
 */
export const R10DotCluster = ({ identities, size }: { identities: R10Identity[]; size: number }) => {
  const maskId = `r10-bite-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (identities.length === 0) return null;
  if (identities.length === 1) return <R10ModeDot identity={identities[0]!} size={size} />;

  const step = size * OVERLAP_STEP;
  const width = size + (identities.length - 1) * step;
  const centre = size / 2;
  const front = identities[0]!;
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
            fill={r10IdentityColor(identity)}
          />
        ))}
      </G>
      <Circle cx={centre} cy={centre} r={centre} fill={r10IdentityColor(front)} />
    </Svg>
  );
};

/**
 * The bell-corner cluster: the armed identities riding the Suhoor row's
 * alerts bell at the take's spot. The bell itself is untouched; the cluster
 * hides entirely on Every day. Coordinates are the bell anchor's: the bell
 * glyph spans x 13-33, y 18.5-38.5 inside a 53x57 anchor.
 */
export const R10BellCluster = ({ take, selection }: { take: R10Take; selection: R2Selection }) => {
  if (selection.mode === 'every') return null;
  const identities = r10ArmedIdentities(selection);
  if (identities.length === 0) return null;

  const size = 9;
  const width = size + (identities.length - 1) * size * OVERLAP_STEP;

  return (
    <View style={[s.layer, dyn.spot(take.spot, width)]} pointerEvents={POINTER_NONE}>
      <R10DotCluster identities={identities} size={size} />
    </View>
  );
};

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

const dyn = {
  spot: (spot: R10Spot, width: number): { top: number; left: number } => {
    if (spot === 'bell-top-right') return { top: 10, left: 25 };
    if (spot === 'bell-bottom-right') return { top: 38, left: 25 };
    return { top: 42, left: BELL_CENTRE_X - width / 2 };
  },
};

/** The bell glyph's centre x inside the anchor */
const BELL_CENTRE_X = 23;

/**
 * The round-11 identity clusters (T-623): the plain filled dots keep the
 * sheet's rows and entries (borderless, size unchanged, shown even when the
 * row is disabled), while the two cluster surfaces - the Suhoor bell and the
 * calendar cells - carry BORDERED circles: each fill ringed directly in the
 * deep background shade (#1B1967), the ring styled after the settings sheet's
 * reset-switch circle border but without its inner gap, replacing round 10's
 * punched apple-bite as the overlap separation, and living on these clusters
 * only - never on the sheet's dots. Position law: identities render left to
 * right in regimen order, so the white days always sit right of their paired
 * partner and a lone mode's circle stands alone. Dev-only: nothing shipped
 * imports here.
 */

import { View } from 'react-native';

import type { R2Selection } from '../r2/model';
import { POINTER_NONE } from '../r9/model';
import { type R10Identity, r10ArmedIdentities, r10IdentityColor } from '../r10/model';
import { R11_BELL_DOT, R11_BELL_RING, R11_BORDER, R11_OVERLAP_STEP } from './model';

/** One plain filled identity dot: the rows' and entries' mark, borderless */
export const R11ModeDot = ({ identity, size }: { identity: R10Identity; size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: r10IdentityColor(identity) }} />
);

/** One bordered identity circle: the ring hugs the fill, no inner gap */
export const R11RingDot = ({ identity, size, ring }: { identity: R10Identity; size: number; ring: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: r10IdentityColor(identity),
      borderWidth: ring,
      borderColor: R11_BORDER,
    }}
  />
);

/**
 * The bordered cluster: circles forty percent into each other, the right
 * circle (white days) rendering on top - the separation
 * work the bite did. A lone identity renders one circle; never three.
 */
export const R11Cluster = ({ identities, size, ring }: { identities: R10Identity[]; size: number; ring: number }) => {
  if (identities.length === 0) return null;
  if (identities.length === 1) return <R11RingDot identity={identities[0]!} size={size} ring={ring} />;

  const step = size * R11_OVERLAP_STEP;
  const width = size + (identities.length - 1) * step;

  return (
    <View style={{ width, height: size }}>
      {identities
        .slice()
        .reverse()
        .map((identity, index) => {
          const position = index;
          return (
            <View key={identity} style={{ position: 'absolute', left: position * step }}>
              <R11RingDot identity={identity} size={size} ring={ring} />
            </View>
          );
        })}
    </View>
  );
};

/**
 * The bell-corner cluster: the armed identities riding the Suhoor row's
 * alerts bell's top-right corner at round 11's settled size - five percent
 * under round 10's - the bell itself untouched, the cluster hiding entirely
 * on Every day. Coordinates are the bell anchor's: the bell glyph spans
 * x 13-33, y 18.5-38.5 inside a 53x57 anchor.
 */
export const R11BellCluster = ({ selection }: { selection: R2Selection }) => {
  if (selection.mode === 'every') return null;
  const identities = r10ArmedIdentities(selection);
  if (identities.length === 0) return null;

  return (
    <View style={s.layer} pointerEvents={POINTER_NONE}>
      <R11Cluster identities={identities} size={R11_BELL_DOT} ring={R11_BELL_RING} />
    </View>
  );
};

const s = {
  layer: {
    position: 'absolute' as const,
    top: 10,
    left: 25,
  },
};

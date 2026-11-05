/**
 * The round-9 automation indicators (T-623, surface A): what rides around the
 * Extra Schedule's Suhoor row's alerts bell when the selection is not Every
 * day - the bell itself untouched, the indicator an absolutely-positioned
 * layer in the row's own bell anchor. Twenty archetypes; a per-mode design
 * speaks once per armed regimen (filled for Muhammad, a ring for Dawood, a
 * donut for the white days), a shared design speaks once for the selection.
 * The same module builds the fasting-list echo: each armed row of the locked
 * card carries a small mark in the design's motif shape. Dev-only: nothing
 * shipped imports here.
 */

import type { ReactElement } from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import type { R2Selection } from '../r2/model';
import type { R9CatalogRow } from './catalog';
import { type R9Ink, r9Ink } from './hues';
import { MARK_DAWOOD, MARK_MUHAMMAD, MARK_WHITE, POINTER_NONE, type R9Armed, r9ArmedFor, r9JoinedMark } from './model';

const BELL_X = 21; // the bell's centre inside the anchor (11 pad + 10)
const BELL_RIGHT = 20; // the anchor's right padding
const ROW_H = 57;

interface MarkSpec {
  /** Muhammad fills, Dawood rings, the white days go donut */
  readonly variant: 'fill' | 'ring' | 'donut';
  /** The mark's letter when the archetype carries text */
  readonly letter: string;
}

/** The armed regimens in marker order, the per-mode designs' sequence */
const marksFor = (armed: R9Armed): MarkSpec[] => {
  const marks: MarkSpec[] = [];
  if (armed.muhammad) marks.push({ variant: 'fill', letter: MARK_MUHAMMAD });
  if (armed.dawood) marks.push({ variant: 'ring', letter: MARK_DAWOOD });
  if (armed.white) marks.push({ variant: 'donut', letter: MARK_WHITE });
  return marks;
};

/** The bell anchor's absolute layer: every indicator renders inside one */
export const R9IndicatorLayer = ({ row, selection }: { row: R9CatalogRow; selection: R2Selection }) => {
  if (selection.mode === 'every') return null;
  const ink = r9Ink(row.hue);
  const armed = r9ArmedFor(selection);
  const marks = row.perMode ? marksFor(armed) : [{ variant: 'fill' as const, letter: r9JoinedMark(armed) }];

  return (
    <View style={s.layer} pointerEvents={POINTER_NONE}>
      {marks.map((mark, index) => (
        <View key={mark.variant + mark.letter} style={dyn.perModeSlot(index, marks.length)}>
          {indicatorBody(row.indicator, ink, armed, mark, index, row.perMode)}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// The fasting-list echo: the motif's small mark per armed row
// ---------------------------------------------------------------------------

type EchoShape = 'dot' | 'pill' | 'ring' | 'line' | 'tri';

const ECHO_SHAPES: Record<string, EchoShape> = {
  'dot-side': 'dot',
  'twin-dots': 'dot',
  'crown-dot': 'dot',
  'orbit-dots': 'dot',
  'badge-top': 'pill',
  'pill-below': 'pill',
  'tag-notch': 'pill',
  'counter-chip': 'pill',
  monogram: 'pill',
  'tab-top': 'pill',
  'ring-around': 'ring',
  'arc-progress': 'ring',
  halo: 'ring',
  'underline-glow': 'line',
  'stripe-end': 'line',
  bracket: 'line',
  'corner-tri': 'tri',
  'mini-icon': 'dot',
  'tick-pair': 'line',
  'side-ribbon': 'pill',
};

/** The echo mark for the locked card's armed rows, the design's own motif */
export const R9EchoMark = ({ row }: { row: R9CatalogRow }) => {
  const ink = r9Ink(row.hue);
  const shape = ECHO_SHAPES[row.indicator] ?? 'dot';
  if (shape === 'pill') {
    return (
      <View style={dyn.echoPill(ink)}>
        <View style={dyn.echoPillCore(ink)} />
      </View>
    );
  }
  if (shape === 'ring') return <View style={dyn.echoRing(ink)} />;
  if (shape === 'line') return <View style={dyn.echoLine(ink)} />;
  if (shape === 'tri') return <View style={[dyn.echoTri(ink), s.echoTriTilt]} />;
  return <View style={dyn.echoDot(ink)} />;
};

// ---------------------------------------------------------------------------
// The twenty archetype bodies
// ---------------------------------------------------------------------------

const indicatorBody = (
  kind: string,
  ink: R9Ink,
  armed: R9Armed,
  mark: MarkSpec,
  slot: number,
  perMode: boolean
): ReactElement => {
  switch (kind) {
    case 'badge-top':
      return <Tag ink={ink} mark={mark} top />;
    case 'pill-below':
      return <Tag ink={ink} mark={mark} pill below />;
    case 'dot-side':
      return <View style={dyn.modeDot(ink, mark.variant, 6, 0)} />;
    case 'ring-around':
      return <View style={dyn.ringAround(ink, mark.variant)} />;
    case 'corner-tri':
      return <View style={dyn.cornerTri(ink)} />;
    case 'counter-chip':
      return <CounterChip ink={ink} mark={mark} count={perMode ? null : armedCountOf(armed)} />;
    case 'underline-glow':
      return <View style={dyn.underline(ink)} />;
    case 'mini-icon':
      return <MiniIcon ink={ink} />;
    case 'monogram':
      return <Monogram ink={ink} mark={mark} />;
    case 'stripe-end':
      return <View style={dyn.stripe(ink, slot)} />;
    case 'tab-top':
      return <TabTop ink={ink} mark={mark} />;
    case 'bracket':
      return <Bracket ink={ink} />;
    case 'halo':
      return <View style={dyn.halo(ink)} />;
    case 'tick-pair':
      return <TickPair ink={ink} />;
    case 'orbit-dots':
      return <OrbitDots ink={ink} slot={slot} />;
    case 'crown-dot':
      return <View style={dyn.crownDot(ink, mark.variant)} />;
    case 'side-ribbon':
      return <SideRibbon ink={ink} mark={mark} />;
    case 'twin-dots':
      return <View style={dyn.modeDot(ink, mark.variant, 5, slot * 7)} />;
    case 'arc-progress':
      return <ArcProgress ink={ink} />;
    case 'tag-notch':
      return <TagNotch ink={ink} mark={mark} />;
    default:
      return <View style={dyn.modeDot(ink, mark.variant, 6, 0)} />;
  }
};

const armedCountOf = (armed: R9Armed): number => Number(armed.muhammad) + Number(armed.dawood) + Number(armed.white);

const Label = ({ ink, children, size = 7 }: { ink: R9Ink; children: string; size?: number }) => (
  <Text style={dyn.label(ink.onFill, size)}>{children}</Text>
);

const Tag = ({
  ink,
  mark,
  pill,
  below,
}: {
  ink: R9Ink;
  mark: MarkSpec;
  pill?: boolean;
  below?: boolean;
  top?: boolean;
}) => (
  <View style={[dyn.tagBase(ink), pill ? s.tagPill : null, below ? dyn.tagBelow : null]}>
    <Label ink={ink}>{mark.letter}</Label>
  </View>
);

const CounterChip = ({ ink, mark, count }: { ink: R9Ink; mark: MarkSpec; count: number | null }) => (
  <View style={dyn.counterChip(ink)}>
    {count !== null ? (
      <Label ink={ink} size={8}>
        {String(count)}
      </Label>
    ) : (
      <Label ink={ink}>{mark.letter}</Label>
    )}
  </View>
);

const MiniIcon = ({ ink }: { ink: R9Ink }) => (
  <View style={dyn.miniIcon(ink)}>
    <View style={s.miniIconCore} />
  </View>
);

const Monogram = ({ ink, mark }: { ink: R9Ink; mark: MarkSpec }) => (
  <View style={dyn.monogram(ink)}>
    <Label ink={ink}>{mark.letter}</Label>
  </View>
);

const TabTop = ({ ink, mark }: { ink: R9Ink; mark: MarkSpec }) => (
  <View style={dyn.tab(ink)}>
    <Label ink={ink}>{mark.letter}</Label>
  </View>
);

const Bracket = ({ ink }: { ink: R9Ink }) => (
  <View style={s.bracketWrap}>
    <View style={dyn.bracketBar(ink)} />
    <View style={[dyn.bracketBar(ink), s.bracketBarEnd]} />
  </View>
);

const TickPair = ({ ink }: { ink: R9Ink }) => (
  <View style={s.tickWrap}>
    <View style={[dyn.tick(ink), s.tickLeft]} />
    <View style={dyn.tick(ink)} />
  </View>
);

const OrbitDots = ({ ink, slot }: { ink: R9Ink; slot: number }) => (
  <View style={s.orbitWrap}>
    <View style={dyn.orbitDot(ink, slot * 4)} />
    <View style={[dyn.orbitDot(ink, slot * 4), s.orbitMid]} />
    <View style={[dyn.orbitDot(ink, slot * 4), s.orbitRight]} />
  </View>
);

const SideRibbon = ({ ink, mark }: { ink: R9Ink; mark: MarkSpec }) => (
  <View style={dyn.ribbon(ink)}>
    <Label ink={ink} size={6}>
      {mark.letter}
    </Label>
  </View>
);

const ArcProgress = ({ ink }: { ink: R9Ink }) => (
  <View style={dyn.arc(ink)}>
    <View style={dyn.arcHead(ink)} />
  </View>
);

const TagNotch = ({ ink, mark }: { ink: R9Ink; mark: MarkSpec }) => (
  <View style={s.tagWrap}>
    <View style={dyn.tagNotch(ink)} />
    <View style={[dyn.tagBase(ink), s.tagPill]}>
      <Label ink={ink}>{mark.letter}</Label>
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Layout: static sheets and per-ink factories
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 51,
    height: ROW_H,
  },
  tagPill: {
    borderRadius: 999,
  },
  tagBelow: {
    top: undefined,
    bottom: 6,
  },
  miniIconCore: {
    width: 3,
    height: 3,
    borderRadius: 2,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bracketWrap: {
    position: 'absolute',
    top: ROW_H / 2 - 14,
    left: BELL_X - 16,
    width: 32,
    height: 28,
  },
  bracketBarEnd: {
    left: undefined,
    right: 0,
  },
  tickWrap: {
    position: 'absolute',
    top: ROW_H / 2 - 18,
    right: BELL_RIGHT - 6,
    width: 16,
    height: 10,
  },
  tickLeft: {
    right: 6,
    transform: [{ rotate: '-20deg' }],
  },
  orbitWrap: {
    position: 'absolute',
    top: ROW_H / 2 - 18,
    left: BELL_X - 14,
    width: 28,
    height: 10,
  },
  orbitMid: {
    left: 12,
    top: 0,
  },
  orbitRight: {
    left: 22,
    top: 4,
  },
  tagWrap: {
    position: 'absolute',
    top: ROW_H / 2 - 8,
    right: BELL_RIGHT + 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  echoTriTilt: {
    transform: [{ rotate: '12deg' }],
  },
});

const dyn = {
  label: (ink: string, size: number): TextStyle => ({
    fontSize: size,
    lineHeight: size + 2,
    fontWeight: '700',
    color: ink,
    textAlign: 'center',
  }),
  tagBase: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: 4,
    right: BELL_RIGHT - 6,
    minHeight: 11,
    paddingHorizontal: 4,
    borderRadius: 3,
    backgroundColor: ink.solid,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }),
  tagBelow: {
    top: undefined,
    bottom: 6,
  } as ViewStyle,
  perModeSlot: (index: number, total: number): ViewStyle => {
    const step = total > 2 ? 13 : 15;
    return { position: 'absolute', top: 0, right: index * step, width: 30, height: ROW_H };
  },
  modeDot: (ink: R9Ink, variant: MarkSpec['variant'], size: number, offset: number): ViewStyle => ({
    position: 'absolute',
    top: (ROW_H - size) / 2 - offset,
    right: BELL_RIGHT - 2 + offset,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: variant === 'fill' ? ink.solid : 'transparent',
    borderWidth: variant === 'fill' ? 0 : 1.5,
    borderStyle: variant === 'donut' ? 'dotted' : 'solid',
    borderColor: ink.solid,
  }),
  ringAround: (ink: R9Ink, variant: MarkSpec['variant']): ViewStyle => ({
    position: 'absolute',
    top: (ROW_H - 30) / 2,
    left: BELL_X - 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: variant === 'ring' ? 2.5 : 1.5,
    borderStyle: variant === 'donut' ? 'dotted' : 'solid',
    borderColor: ink.solid,
  }),
  cornerTri: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 - 16,
    right: BELL_RIGHT - 4,
    width: 8,
    height: 8,
    backgroundColor: ink.solid,
    borderBottomLeftRadius: 8,
  }),
  counterChip: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 - 18,
    right: BELL_RIGHT - 4,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: ink.solid,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  underline: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 + 14,
    left: BELL_X - 11,
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: ink.solid,
  }),
  miniIcon: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 - 5,
    right: BELL_RIGHT - 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: ink.solid,
    backgroundColor: ink.fill,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  monogram: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 - 15,
    right: BELL_RIGHT - 2,
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ink.border,
    backgroundColor: ink.fill,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  stripe: (ink: R9Ink, slot: number): ViewStyle => ({
    position: 'absolute',
    top: 10 + slot * 14,
    bottom: 10,
    right: slot * 4,
    width: 3,
    borderRadius: 2,
    backgroundColor: ink.solid,
  }),
  tab: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: 8,
    right: BELL_RIGHT - 4,
    minWidth: 14,
    paddingHorizontal: 3,
    height: 9,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: ink.solid,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  bracketBar: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1.5,
    height: 28,
    borderRadius: 1,
    backgroundColor: ink.mid,
  }),
  halo: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: (ROW_H - 36) / 2,
    left: BELL_X - 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ink.fill,
  }),
  tick: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: 2,
    right: 0,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: ink.solid,
    transform: [{ rotate: '30deg' }],
  }),
  orbitDot: (ink: R9Ink, offset: number): ViewStyle => ({
    position: 'absolute',
    top: 4 + offset,
    left: 2,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: ink.solid,
  }),
  crownDot: (ink: R9Ink, variant: MarkSpec['variant']): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 - 16,
    left: BELL_X - 3.5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: variant === 'fill' ? ink.solid : 'transparent',
    borderWidth: variant === 'fill' ? 0 : 1.5,
    borderStyle: variant === 'donut' ? 'dotted' : 'solid',
    borderColor: ink.solid,
  }),
  ribbon: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: ROW_H / 2 - 9,
    left: BELL_X - 17,
    width: 10,
    height: 18,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 5,
    backgroundColor: ink.solid,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  arc: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: (ROW_H - 30) / 2,
    left: BELL_X - 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: ink.mid,
  }),
  arcHead: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: -3,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ink.solid,
  }),
  tagNotch: (ink: R9Ink): ViewStyle => ({
    width: 6,
    height: 10,
    backgroundColor: ink.solid,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  }),
  echoPill: (ink: R9Ink): ViewStyle => ({
    width: 12,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ink.border,
    backgroundColor: ink.fill,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  echoPillCore: (ink: R9Ink): ViewStyle => ({
    width: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: ink.solid,
    borderColor: ink.border,
  }),
  echoRing: (ink: R9Ink): ViewStyle => ({
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: ink.solid,
  }),
  echoLine: (ink: R9Ink): ViewStyle => ({
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: ink.solid,
  }),
  echoTri: (ink: R9Ink): ViewStyle => ({
    width: 8,
    height: 8,
    backgroundColor: ink.solid,
    borderBottomLeftRadius: 8,
  }),
  echoDot: (ink: R9Ink): ViewStyle => ({
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ink.solid,
  }),
};

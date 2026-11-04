/**
 * The round-3 layout engine (T-623 round 3): one spec-driven renderer behind
 * the seventeen round-3 families. A spec names the structural axes - the
 * split, the container, the density, the disclosure, the indicators - and
 * r3Variant binds one spec to one catalog component. Every spec keeps the
 * parent family's mechanism: rows and groups around the four shared options
 * read through useR2, one whole-selection description on every frame, the
 * selection always the segment purple. Dev-only: nothing shipped imports
 * here. First frame settled; every visible string is a hoisted literal.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { FastingMode } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { BUTTON_ROLE, CheckGlyph, ModeGlyph } from '../parts';
import { R2_OPTIONS, type R2Key, type R2Option, type R2Selection } from '../r2/model';
import {
  R2_ON_INK,
  R2_PURPLE,
  R2_PURPLE_BORDER,
  R2Card,
  R2Description,
  R2Medallion,
  R2StateDot,
  R2Switch,
  useR2,
} from '../r2/parts';
import type { FastingVariantComponent } from '../registry';

// hoisted key values: the string scanner reads call-argument literals as display sinks
const K_WHITE: R2Key = 'white';

export type R3Split = 'stack' | 'grid' | 'tracks' | 'railLeft' | 'railRight';
export type R3Container = 'bare' | 'card' | 'titled' | 'each';
export type R3Density = 'compact' | 'regular' | 'tall';
export type R3ShowSub = 'always' | 'selected' | 'never';
export type R3Indicator = 'none' | 'switch' | 'dot' | 'medallion' | 'check' | 'glyph';

export interface R3Spec {
  readonly split: R3Split;
  readonly container: R3Container;
  readonly density: R3Density;
  readonly showSub: R3ShowSub;
  readonly indicator: R3Indicator;
  /** A second indicator rides the opposite side of the row */
  readonly indicator2?: R3Indicator;
  readonly indicatorSide?: 'left' | 'right';
  readonly fill?: boolean;
  readonly separators?: boolean;
  readonly descAt?: 'footer' | 'header';
  readonly pill?: boolean;
}

const INK = 'rgba(230, 233, 247, 0.92)';
const INK_SUB = 'rgba(230, 233, 247, 0.7)';
const INK_ON_SUB = 'rgba(255, 255, 255, 0.85)';
const HAIRLINE = 'rgba(99, 102, 241, 0.22)';
const SURFACE = 'rgba(99, 102, 241, 0.05)';
const GLYPH_INK_OFF = 'rgba(99, 102, 241, 0.5)';

const TRACK_MODES = 'Mode';
const TRACK_EXTRAS = 'Extras';

const MONOGRAM_LETTERS: Record<R2Key, string> = {
  every: 'E',
  muhammad: 'M',
  dawood: 'D',
  white: 'W',
};

const GLYPH_MODES: Record<R2Key, FastingMode> = {
  every: 'everyDay',
  muhammad: 'muhammad',
  dawood: 'dawood',
  white: 'whiteDays',
};

const OPTION_BY_KEY: Record<R2Key, R2Option> = {
  every: R2_OPTIONS[0],
  muhammad: R2_OPTIONS[1],
  dawood: R2_OPTIONS[2],
  white: R2_OPTIONS[3],
};

const MODE_KEYS: readonly R2Key[] = ['every', 'muhammad', 'dawood'];

const TRACKS: readonly {
  readonly label: string;
  readonly keys: readonly R2Key[];
}[] = [
  { label: TRACK_MODES, keys: MODE_KEYS },
  { label: TRACK_EXTRAS, keys: [K_WHITE] },
];

/** The option's selected read: modes off the selection's mode, white off its flag */
const isOn = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

/** The pane reads the mode option; a modeless set is the white days alone */
const paneKey = (selection: R2Selection): R2Option => OPTION_BY_KEY[selection.mode ?? K_WHITE];

const subFor = (selection: R2Selection, option: R2Option, showSub: R3ShowSub): boolean =>
  showSub === 'always' || (showSub === 'selected' && isOn(selection, option.key));

const ty = typographyFor(currentLocaleId());

const DENSITY_ROW: Record<R3Density, number> = {
  compact: 32,
  regular: 46,
  tall: 62,
};
const DENSITY_CELL: Record<R3Density, number> = {
  compact: 52,
  regular: 74,
  tall: 94,
};
const DENSITY_RAIL: Record<R3Density, number> = {
  compact: 46,
  regular: 66,
  tall: 88,
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  stackGapSm: { gap: SPACING.xs },
  stackGapMd: { gap: SPACING.smd },
  stackGapLg: { gap: SPACING.md },
  group: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.smd,
  },
  trackBox: {
    gap: SPACING.smd,
  },
  trackLabel: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: INK_SUB,
  },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.md,
  },
  rowPill: {
    borderRadius: 23,
    paddingHorizontal: SPACING.lg,
  },
  rowFill: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
    borderWidth: 1,
  },
  rowBareOutline: {
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  rowRule: {
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    borderRadius: 0,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: INK,
  },
  titleOn: {
    color: R2_ON_INK,
  },
  titleSel: {
    color: R2_PURPLE,
  },
  sub: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyRegular,
    color: INK_SUB,
  },
  subOn: {
    color: INK_ON_SUB,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.smd,
    alignSelf: 'stretch',
  },
  cell: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.smd,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    paddingHorizontal: SPACING.smd,
  },
  cellTexts: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  railSplit: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignSelf: 'stretch',
  },
  railSplitMirrored: {
    flexDirection: 'row-reverse',
  },
  railSlots: {
    gap: SPACING.smd,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
  },
  slotOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  pane: {
    flex: 1,
    gap: SPACING.smd,
  },
  paneTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: INK,
  },
  paneSub: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyRegular,
    color: INK_SUB,
  },
  paneRule: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: HAIRLINE,
  },
  descFoot: {
    marginTop: SPACING.md,
  },
  descHead: {
    marginBottom: SPACING.smd,
  },
});

const Indicator = ({
  kind,
  on,
  option,
  tap,
  onInk,
}: {
  kind: R3Indicator;
  on: boolean;
  option: R2Option;
  tap: (key: R2Key) => void;
  /** The glyph's selected ink; white inside the rail's purple-filled slots */
  onInk?: string;
}) => {
  if (kind === 'switch') return <R2Switch on={on} onPress={() => tap(option.key)} />;
  if (kind === 'dot') return <R2StateDot on={on} />;
  if (kind === 'medallion') return <R2Medallion letter={MONOGRAM_LETTERS[option.key]} on={on} />;
  if (kind === 'check') return <CheckGlyph on={on} />;
  if (kind === 'glyph')
    return <ModeGlyph mode={GLYPH_MODES[option.key]} ink={on ? (onInk ?? R2_PURPLE) : GLYPH_INK_OFF} />;
  return null;
};

const OptionRow = ({
  option,
  spec,
  selection,
  tap,
  last,
}: {
  option: R2Option;
  spec: R3Spec;
  selection: R2Selection;
  tap: (key: R2Key) => void;
  last: boolean;
}) => {
  const on = isOn(selection, option.key);
  const height = DENSITY_ROW[spec.density];
  const leftKind = spec.indicatorSide === 'left' ? spec.indicator : (spec.indicator2 ?? 'none');
  const rightKind = spec.indicatorSide === 'left' ? (spec.indicator2 ?? 'none') : spec.indicator;
  return (
    <Pressable
      style={[
        styles.row,
        { height, paddingHorizontal: spec.pill ? SPACING.lg : SPACING.md },
        spec.pill ? styles.rowPill : null,
        spec.container === 'each' ? styles.rowCard : null,
        spec.fill && !on ? styles.rowBareOutline : null,
        spec.fill && on ? styles.rowFill : null,
        spec.separators && !last ? styles.rowRule : null,
      ]}
      hitSlop={HIT_SLOP.md}
      onPress={() => tap(option.key)}
      accessibilityRole={BUTTON_ROLE}
      accessibilityState={{ selected: on }}>
      <Indicator kind={leftKind} on={on} option={option} tap={tap} />
      <View style={styles.texts}>
        <Text style={[styles.title, spec.fill && on ? styles.titleOn : null]} numberOfLines={1}>
          {option.title}
        </Text>
        {subFor(selection, option, spec.showSub) && (
          <Text style={[styles.sub, spec.fill && on ? styles.subOn : null]} numberOfLines={1}>
            {option.subtitle}
          </Text>
        )}
      </View>
      <Indicator kind={rightKind} on={on} option={option} tap={tap} />
    </Pressable>
  );
};

const StackBody = ({ spec, selection, tap }: { spec: R3Spec; selection: R2Selection; tap: (key: R2Key) => void }) => {
  const gap =
    spec.density === 'compact' ? styles.stackGapSm : spec.density === 'tall' ? styles.stackGapLg : styles.stackGapMd;
  const rows = R2_OPTIONS.map((option, position) => (
    <OptionRow
      key={option.key}
      option={option}
      spec={spec}
      selection={selection}
      tap={tap}
      last={position === R2_OPTIONS.length - 1}
    />
  ));
  if (spec.container === 'each') return <View style={gap}>{rows}</View>;
  if (spec.container === 'card') return <View style={[styles.group, gap]}>{rows}</View>;
  if (spec.container === 'titled') {
    return (
      <R2Card>
        <View style={gap}>{rows}</View>
      </R2Card>
    );
  }
  return <View style={gap}>{rows}</View>;
};

const TrackBody = ({ spec, selection, tap }: { spec: R3Spec; selection: R2Selection; tap: (key: R2Key) => void }) => {
  const gap =
    spec.density === 'compact' ? styles.stackGapSm : spec.density === 'tall' ? styles.stackGapLg : styles.stackGapMd;
  const boxes = TRACKS.map((track) => {
    const rows = track.keys.map((key, position) => (
      <OptionRow
        key={key}
        option={OPTION_BY_KEY[key]}
        spec={spec}
        selection={selection}
        tap={tap}
        last={position === track.keys.length - 1}
      />
    ));
    return (
      <View key={track.label} style={styles.trackBox}>
        <Text style={styles.trackLabel}>{track.label}</Text>
        {spec.container === 'bare' ? <View style={gap}>{rows}</View> : <View style={[styles.group, gap]}>{rows}</View>}
      </View>
    );
  });
  return <View style={styles.stackGapMd}>{boxes}</View>;
};

const GridBody = ({ spec, selection, tap }: { spec: R3Spec; selection: R2Selection; tap: (key: R2Key) => void }) => {
  const cells = R2_OPTIONS.map((option) => {
    const on = isOn(selection, option.key);
    return (
      <Pressable
        key={option.key}
        style={[
          styles.cell,
          { height: DENSITY_CELL[spec.density] },
          on && spec.indicator === 'none' ? styles.rowFill : null,
        ]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(option.key)}
        accessibilityRole={BUTTON_ROLE}
        accessibilityState={{ selected: on }}>
        <View style={styles.cellTexts}>
          <Text
            style={[styles.title, on ? (spec.indicator === 'none' ? styles.titleOn : styles.titleSel) : null]}
            numberOfLines={1}>
            {option.title}
          </Text>
          {subFor(selection, option, spec.showSub) && (
            <Text style={[styles.sub, on && spec.indicator === 'none' ? styles.subOn : null]} numberOfLines={1}>
              {option.subtitle}
            </Text>
          )}
        </View>
        {spec.indicator !== 'none' && <Indicator kind={spec.indicator} on={on} option={option} tap={tap} />}
      </Pressable>
    );
  });
  const grid = <View style={styles.gridRow}>{cells}</View>;
  if (spec.container === 'card') return <View style={styles.group}>{grid}</View>;
  if (spec.container === 'titled') {
    return <R2Card>{grid}</R2Card>;
  }
  return grid;
};

const RailBody = ({
  spec,
  mirrored,
  selection,
  tap,
}: {
  spec: R3Spec;
  mirrored: boolean;
  selection: R2Selection;
  tap: (key: R2Key) => void;
}) => {
  const pane = paneKey(selection);
  const slotSide = Math.round(DENSITY_RAIL[spec.density] * 0.6);
  return (
    <View style={[styles.railSplit, mirrored ? styles.railSplitMirrored : null]}>
      <View style={[styles.railSlots, { width: DENSITY_RAIL[spec.density] }]}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[styles.slot, { height: slotSide }, on ? styles.slotOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}
              accessibilityRole={BUTTON_ROLE}
              accessibilityState={{ selected: on }}>
              <Indicator kind={spec.indicator} on={on} option={option} tap={tap} onInk={R2_ON_INK} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.pane}>
        <Text style={styles.paneTitle} numberOfLines={1}>
          {pane.title}
        </Text>
        <Text style={styles.paneSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={styles.paneRule} />
        <R2Description />
      </View>
    </View>
  );
};

const R3Options = ({ spec }: { spec: R3Spec }) => {
  const { selection, tap } = useR2();
  const body =
    spec.split === 'railLeft' || spec.split === 'railRight' ? (
      <RailBody spec={spec} mirrored={spec.split === 'railRight'} selection={selection} tap={tap} />
    ) : spec.split === 'grid' ? (
      <GridBody spec={spec} selection={selection} tap={tap} />
    ) : spec.split === 'tracks' ? (
      <TrackBody spec={spec} selection={selection} tap={tap} />
    ) : (
      <StackBody spec={spec} selection={selection} tap={tap} />
    );
  // the rail's pane carries the description itself; the other splits draw it
  // above or below the structure
  if (spec.split === 'railLeft' || spec.split === 'railRight') return <View style={styles.wrap}>{body}</View>;
  return (
    <View style={styles.wrap}>
      {spec.descAt === 'header' ? <R2Description style={styles.descHead} /> : null}
      {body}
      {spec.descAt === 'footer' ? <R2Description style={styles.descFoot} /> : null}
    </View>
  );
};

/** One spec, one variant component: the generator's binding for the round-3 rows */
export const r3Variant =
  (spec: R3Spec): FastingVariantComponent =>
  () => <R3Options spec={spec} />;

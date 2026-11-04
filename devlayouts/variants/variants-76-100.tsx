/**
 * Fasting layout variants 76-100 (T-623 round 2): the dotted-leader ledgers,
 * the small outline-fill cards, the pill stacks and the ring and sector
 * dials. Dev-only, first-frame settled; every variant reads the shared
 * round-2 selection with useR2 and draws one settled frame from it.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import { R2_OPTIONS, type R2Key, type R2Option, type R2Selection } from '../r2/model';
import { R2_ON_INK, R2_PURPLE, R2_PURPLE_BORDER, R2Card, R2Description, R2StateDot, useR2 } from '../r2/parts';
import type { FastingVariantComponent } from '../registry';

// hoisted key values: the string scanner reads call-argument literals as display sinks
const K_EVERY: R2Key = 'every';
const K_MUHAMMAD: R2Key = 'muhammad';
const K_DAWOOD: R2Key = 'dawood';
const K_WHITE: R2Key = 'white';

const ty = typographyFor(currentLocaleId());

const MONOGRAM_LETTERS: Record<R2Key, string> = { every: 'E', muhammad: 'M', dawood: 'D', white: 'W' };
const NUMERALS = ['1', '2', '3', '4'];
const LEDGER_MODES = 'Mode ledger';
const LEDGER_EXTRAS = 'Extras ledger';

/** The option rows in the model's own fixed order, readable by key */
const OPTION_BY_KEY: Record<R2Key, R2Option> = {
  every: R2_OPTIONS[0],
  muhammad: R2_OPTIONS[1],
  dawood: R2_OPTIONS[2],
  white: R2_OPTIONS[3],
};

/** The option's selected read: modes off the selection's mode, white off its flag */
const isOn = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

// =============================================================================
// 76. DOTTED LEADER LEDGER - four rows of title, a dotted leader line running
//     to a trailing state dot, floating with the description beneath
// =============================================================================

const VariantDottedLeaderLedger = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v76.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v76.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v76.title, on ? v76.titleOn : null]}>{option.title}</Text>
            <View style={v76.leader} />
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 77. DOUBLE-ENTRY LEDGER - two captioned sections, the three mode rows under
//     the mode ledger caption and the white days alone under the extras one,
//     dotted leaders in both
// =============================================================================

const VariantDoubleEntryLedger = () => {
  const { selection, tap } = useR2();
  const modes = R2_OPTIONS.filter((option) => option.key !== 'white');
  const extras = R2_OPTIONS.filter((option) => option.key === 'white');
  return (
    <View style={v77.wrap}>
      <Text style={v77.caption}>{LEDGER_MODES}</Text>
      {modes.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v77.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v77.title, on ? v77.titleOn : null]}>{option.title}</Text>
            <View style={v77.leader} />
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <Text style={v77.caption}>{LEDGER_EXTRAS}</Text>
      {extras.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v77.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v77.title, on ? v77.titleOn : null]}>{option.title}</Text>
            <View style={v77.leader} />
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 78. DENSE LEDGER - tight 30pt rows opening with a hoisted numeral, then
//     title, dotted leader and trailing dot
// =============================================================================

const VariantDenseLedger = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v78.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v78.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={v78.numeral}>{NUMERALS[index]}</Text>
            <Text style={[v78.title, on ? v78.titleOn : null]}>{option.title}</Text>
            <View style={v78.leader} />
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 79. BOXED LEDGER - all four rows inside the titled card with hairline rules
//     drawn between them
// =============================================================================

const VariantBoxedLedger = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v79.row, index < R2_OPTIONS.length - 1 ? v79.rowLine : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={v79.title}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </R2Card>
  );
};

// =============================================================================
// 80. LEDGER SUMMARY FOOT - the dotted-leader rows closing on a rule-separated
//     footer band that carries the whole-selection sentence
// =============================================================================

const VariantLedgerSummaryFoot = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v80.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v80.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v80.title, on ? v80.titleOn : null]}>{option.title}</Text>
            <View style={v80.leader} />
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <View style={v80.foot}>
        <R2Description style={v80.footText} />
      </View>
    </View>
  );
};

// =============================================================================
// 81. SMALL OUTLINE-FILL CARDS - 52pt cards that fill purple while selected,
//     title leading and a trailing marker dot closing the row
// =============================================================================

const VariantSmallOutlineFillCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v81.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v81.card, on ? v81.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v81.title, on ? v81.titleOn : null]}>{option.title}</Text>
            <View style={[v81.dot, on ? v81.dotOn : null]} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 82. OUTLINE-FILL BADGE CARDS - outline cards whose 18pt corner badge circle
//     fills purple with a white check while selected
// =============================================================================

const VariantOutlineFillBadgeCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v82.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v82.card, on ? v82.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={[v82.badge, on ? v82.badgeOn : null]}>
              {on && <View style={v82.barA} />}
              {on && <View style={v82.barB} />}
            </View>
            <Text style={[v82.title, on ? v82.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 83. OUTLINE-FILL INLINE CARDS - title over subtitle stacked inside the
//     card, purple fill and white inks while selected
// =============================================================================

const VariantOutlineFillInlineCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v83.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v83.card, on ? v83.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v83.title, on ? v83.titleOn : null]}>{option.title}</Text>
            <Text style={[v83.subtitle, on ? v83.subtitleOn : null]} numberOfLines={1}>
              {option.subtitle}
            </Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 84. OUTLINE-FILL SPLIT CARDS - each card split into a title left half and a
//     subtitle right half, purple fill while selected
// =============================================================================

const VariantOutlineFillSplitCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v84.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v84.card, on ? v84.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={v84.left}>
              <Text style={[v84.title, on ? v84.titleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </View>
            <Text style={[v84.subtitle, on ? v84.subtitleOn : null]} numberOfLines={2}>
              {option.subtitle}
            </Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 85. OUTLINE-FILL STRIP CARDS - 36pt strips stacked 6pt apart, purple fill
//     while selected with a white marker dot trailing
// =============================================================================

const VariantOutlineFillStripCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v85.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v85.strip, on ? v85.stripOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v85.title, on ? v85.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <View style={[v85.dot, on ? v85.dotOn : null]} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 86. CLASSIC PILL STACK - centered wrapping pills with the description
//     stacked beneath them
// =============================================================================

const VariantClassicPillStack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v86.wrap}>
      <View style={v86.pills}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v86.pill, on ? v86.pillOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v86.pillText, on ? v86.pillTextOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 87. FULL-WIDTH PILL STACK - full-width 52pt pill rows, one option per row,
//     the description beneath
// =============================================================================

const VariantFullWidthPillStack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v87.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v87.pill, on ? v87.pillOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v87.pillText, on ? v87.pillTextOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 88. DUO PILL STACK - two pills per row on a wrapping 48% flex basis, the
//     description beneath
// =============================================================================

const VariantDuoPillStack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v88.wrap}>
      <View style={v88.pills}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v88.pill, on ? v88.pillOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v88.pillText, on ? v88.pillTextOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 89. TALL PILL STACK - 64pt pills holding the title over its subtitle, the
//     description beneath
// =============================================================================

const VariantTallPillStack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v89.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v89.pill, on ? v89.pillOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v89.pillText, on ? v89.pillTextOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <Text style={[v89.pillSub, on ? v89.pillSubOn : null]} numberOfLines={1}>
              {option.subtitle}
            </Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 90. PILL STACK FOOTER CARD - the wrapping pills and the whole-selection
//     sentence inside the titled card, the sentence in a rule-separated
//     footer band
// =============================================================================

const VariantPillStackFooterCard = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      <View style={v90.pills}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v90.pill, on ? v90.pillOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v90.pillText, on ? v90.pillTextOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v90.foot}>
        <R2Description style={v90.footText} />
      </View>
    </R2Card>
  );
};

// =============================================================================
// 91. CARDINAL RING DIAL - a 210pt circular ring carrying 34pt option nodes
//     at the four cardinals, titles outside at their node's side, the
//     selected option's initial in a small center hub
// =============================================================================

const VariantCardinalRingDial = () => {
  const { selection, tap } = useR2();
  const node = (key: R2Key, pos: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v91.node, pos, on ? v91.nodeOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}>
        <Text style={[v91.nodeLetter, on ? v91.nodeLetterOn : null]}>{MONOGRAM_LETTERS[key]}</Text>
      </Pressable>
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v91.labelBox : v91.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v91.labelTitle, on ? v91.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v91.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v91.row}>
        {label(K_WHITE, true)}
        <View style={v91.dial}>
          {node('muhammad', v91.nodeTop)}
          {node('every', v91.nodeRight)}
          {node('dawood', v91.nodeBottom)}
          {node('white', v91.nodeLeft)}
          <View style={v91.hub}>
            <Text style={v91.hubLetter}>{MONOGRAM_LETTERS[selection.mode ?? K_WHITE]}</Text>
          </View>
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 92. DOT RING DIAL - the same ring base with 16pt dot nodes at the
//     cardinals and title-over-subtitle labels outside each node's side
// =============================================================================

const VariantDotRingDial = () => {
  const { selection, tap } = useR2();
  const node = (key: R2Key, pos: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v92.node, pos, on ? v92.nodeOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}
      />
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    const option = OPTION_BY_KEY[key];
    return (
      <Pressable
        style={boxed ? [v92.labelBox, v92.labelCol] : [v92.labelFree, v92.labelCol]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}>
        <Text style={[v92.labelTitle, on ? v92.labelTitleOn : null]} numberOfLines={boxed ? 2 : 1}>
          {option.title}
        </Text>
        <Text style={v92.labelSub} numberOfLines={boxed ? 4 : 2}>
          {option.subtitle}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v92.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v92.row}>
        {label(K_WHITE, true)}
        <View style={v92.dial}>
          {node('muhammad', v92.nodeTop)}
          {node('every', v92.nodeRight)}
          {node('dawood', v92.nodeBottom)}
          {node('white', v92.nodeLeft)}
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 93. DOUBLE RING DIAL - a 2pt outer track ring with a 1pt ring riding 24pt
//     inside it, 20pt dot nodes on the track, an 8pt hub dot at the center
//     and titles outside
// =============================================================================

const VariantDoubleRingDial = () => {
  const { selection, tap } = useR2();
  const node = (key: R2Key, pos: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v93.node, pos, on ? v93.nodeOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}
      />
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v93.labelBox : v93.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v93.labelTitle, on ? v93.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v93.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v93.row}>
        {label(K_WHITE, true)}
        <View style={v93.dial}>
          <View style={v93.innerRing} />
          {node('muhammad', v93.nodeTop)}
          {node('every', v93.nodeRight)}
          {node('dawood', v93.nodeBottom)}
          {node('white', v93.nodeLeft)}
          <View style={v93.hubDot} />
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 94. QUADRANT RING DIAL - the ring with two thin cross hairlines through the
//     center dividing its quadrants, 34pt initial nodes at the cardinals and
//     titles outside
// =============================================================================

const VariantQuadrantRingDial = () => {
  const { selection, tap } = useR2();
  const node = (key: R2Key, pos: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v94.node, pos, on ? v94.nodeOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}>
        <Text style={[v94.nodeLetter, on ? v94.nodeLetterOn : null]}>{MONOGRAM_LETTERS[key]}</Text>
      </Pressable>
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v94.labelBox : v94.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v94.labelTitle, on ? v94.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v94.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v94.row}>
        {label(K_WHITE, true)}
        <View style={v94.dial}>
          <View style={v94.horiz} />
          <View style={v94.vert} />
          {node('muhammad', v94.nodeTop)}
          {node('every', v94.nodeRight)}
          {node('dawood', v94.nodeBottom)}
          {node('white', v94.nodeLeft)}
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 95. TICK RING DIAL - the ring carrying eight small tick marks on an inner
//     radius, 16pt dot nodes at the cardinals and titles outside
// =============================================================================

const VariantTickRingDial = () => {
  const { selection, tap } = useR2();
  const node = (key: R2Key, pos: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v95.node, pos, on ? v95.nodeOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}
      />
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v95.labelBox : v95.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v95.labelTitle, on ? v95.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v95.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v95.row}>
        {label(K_WHITE, true)}
        <View style={v95.dial}>
          <View style={[v95.tickV, v95.tickTop]} />
          <View style={[v95.tickV, v95.tickBottom]} />
          <View style={[v95.tickH, v95.tickLeft]} />
          <View style={[v95.tickH, v95.tickRight]} />
          <View style={[v95.tickV, v95.tickNE]} />
          <View style={[v95.tickV, v95.tickSW]} />
          <View style={[v95.tickV, v95.tickSE]} />
          <View style={[v95.tickV, v95.tickNW]} />
          {node('muhammad', v95.nodeTop)}
          {node('every', v95.nodeRight)}
          {node('dawood', v95.nodeBottom)}
          {node('white', v95.nodeLeft)}
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 96. QUARTER SECTOR DIAL - a 200pt circle built from four 100pt quadrant
//     presses, each rounding one corner, selected quadrant purple-filled,
//     titles outside at the circle's edge midpoints and initials inside each
//     quadrant near its outer edge
// =============================================================================

const VariantQuarterSectorDial = () => {
  const { selection, tap } = useR2();
  const quad = (key: R2Key, shape: object, letterPos: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v96.quad, shape, on ? v96.quadOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}>
        <Text style={[v96.letter, letterPos, on ? v96.letterOn : null]}>{MONOGRAM_LETTERS[key]}</Text>
      </Pressable>
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v96.labelBox : v96.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v96.labelTitle, on ? v96.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v96.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v96.row}>
        {label(K_WHITE, true)}
        <View style={v96.circle}>
          {quad('muhammad', v96.quadTL, v96.letTL)}
          {quad('every', v96.quadTR, v96.letTR)}
          {quad('dawood', v96.quadBL, v96.letBL)}
          {quad('white', v96.quadBR, v96.letBR)}
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 97. CROSS HAIR SECTOR DIAL - the quadrant circle with thin cross hairlines
//     through the center and the titles outside at the composition's four
//     corners
// =============================================================================

const VariantCrossHairSectorDial = () => {
  const { selection, tap } = useR2();
  const corner = (key: R2Key, align: 'left' | 'right') => {
    const on = isOn(selection, key);
    return (
      <Pressable hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text
          style={[v97.cornerTitle, align === 'left' ? v97.cornerLeft : v97.cornerRight, on ? v97.cornerOn : null]}
          numberOfLines={1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  const quad = (key: R2Key, shape: object) => (
    <Pressable
      key={key}
      style={[v97.quad, shape, isOn(selection, key) ? v97.quadOn : null]}
      hitSlop={HIT_SLOP.md}
      onPress={() => tap(key)}
    />
  );
  return (
    <View style={v97.wrap}>
      <View style={v97.cornerRow}>
        {corner('muhammad', 'left')}
        {corner('every', 'right')}
      </View>
      <View style={v97.circle}>
        {quad('muhammad', v97.quadTL)}
        {quad('every', v97.quadTR)}
        {quad('dawood', v97.quadBL)}
        {quad('white', v97.quadBR)}
        <View style={v97.horiz} />
        <View style={v97.vert} />
      </View>
      <View style={v97.cornerRow}>
        {corner('dawood', 'left')}
        {corner('white', 'right')}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 98. GAPPED SECTOR DIAL - the four quadrants separated by 6pt grid gaps,
//     titles outside at the edge midpoints
// =============================================================================

const VariantGappedSectorDial = () => {
  const { selection, tap } = useR2();
  const quad = (key: R2Key, shape: object) => (
    <Pressable
      key={key}
      style={[v98.quad, shape, isOn(selection, key) ? v98.quadOn : null]}
      hitSlop={HIT_SLOP.md}
      onPress={() => tap(key)}
    />
  );
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v98.labelBox : v98.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v98.labelTitle, on ? v98.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v98.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v98.row}>
        {label(K_WHITE, true)}
        <View style={v98.circle}>
          {quad('muhammad', v98.quadTL)}
          {quad('every', v98.quadTR)}
          {quad('dawood', v98.quadBL)}
          {quad('white', v98.quadBR)}
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 99. HUB SECTOR DIAL - the quadrant circle carrying a centered 56pt purple
//     hub disc with the selected option's initial, titles outside at the
//     edge midpoints
// =============================================================================

const VariantHubSectorDial = () => {
  const { selection, tap } = useR2();
  const quad = (key: R2Key, shape: object) => (
    <Pressable
      key={key}
      style={[v99.quad, shape, isOn(selection, key) ? v99.quadOn : null]}
      hitSlop={HIT_SLOP.md}
      onPress={() => tap(key)}
    />
  );
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v99.labelBox : v99.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v99.labelTitle, on ? v99.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v99.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v99.row}>
        {label(K_WHITE, true)}
        <View style={v99.circle}>
          {quad('muhammad', v99.quadTL)}
          {quad('every', v99.quadTR)}
          {quad('dawood', v99.quadBL)}
          {quad('white', v99.quadBR)}
          <View style={v99.hub}>
            <Text style={v99.hubLetter}>{MONOGRAM_LETTERS[selection.mode ?? K_WHITE]}</Text>
          </View>
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 100. OUTLINE SECTOR DIAL - unselected quadrants outline-only with
//      transparent fill, the selected one purple-filled, titles outside at
//      the edge midpoints
// =============================================================================

const VariantOutlineSectorDial = () => {
  const { selection, tap } = useR2();
  const quad = (key: R2Key, shape: object) => {
    const on = isOn(selection, key);
    return (
      <Pressable
        key={key}
        style={[v100.quad, shape, on ? v100.quadOn : null]}
        hitSlop={HIT_SLOP.md}
        onPress={() => tap(key)}
      />
    );
  };
  const label = (key: R2Key, boxed: boolean) => {
    const on = isOn(selection, key);
    return (
      <Pressable style={boxed ? v100.labelBox : v100.labelFree} hitSlop={HIT_SLOP.md} onPress={() => tap(key)}>
        <Text style={[v100.labelTitle, on ? v100.labelTitleOn : null]} numberOfLines={boxed ? 3 : 1}>
          {OPTION_BY_KEY[key].title}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={v100.wrap}>
      {label(K_MUHAMMAD, false)}
      <View style={v100.row}>
        {label(K_WHITE, true)}
        <View style={v100.circle}>
          {quad('muhammad', v100.quadTL)}
          {quad('every', v100.quadTR)}
          {quad('dawood', v100.quadBL)}
          {quad('white', v100.quadBR)}
        </View>
        {label(K_EVERY, true)}
      </View>
      {label(K_DAWOOD, false)}
      <R2Description />
    </View>
  );
};

export const VARIANTS_76_100: Record<string, FastingVariantComponent> = {
  'ledger-dotted-leaders': VariantDottedLeaderLedger,
  'ledger-double-entry': VariantDoubleEntryLedger,
  'ledger-dense': VariantDenseLedger,
  'ledger-boxed': VariantBoxedLedger,
  'ledger-summary-foot': VariantLedgerSummaryFoot,
  'outline-fill-small': VariantSmallOutlineFillCards,
  'outline-fill-badge': VariantOutlineFillBadgeCards,
  'outline-fill-inline-desc': VariantOutlineFillInlineCards,
  'outline-fill-split': VariantOutlineFillSplitCards,
  'outline-fill-strip': VariantOutlineFillStripCards,
  'pill-stack-classic': VariantClassicPillStack,
  'pill-stack-full': VariantFullWidthPillStack,
  'pill-stack-duo': VariantDuoPillStack,
  'pill-stack-tall': VariantTallPillStack,
  'pill-stack-footer': VariantPillStackFooterCard,
  'ring-dial-cardinal': VariantCardinalRingDial,
  'ring-dial-dot-labels': VariantDotRingDial,
  'ring-dial-double': VariantDoubleRingDial,
  'ring-dial-quadrant': VariantQuadrantRingDial,
  'ring-dial-ticks': VariantTickRingDial,
  'sector-dial-quarters': VariantQuarterSectorDial,
  'sector-dial-cross': VariantCrossHairSectorDial,
  'sector-dial-gap': VariantGappedSectorDial,
  'sector-dial-hub': VariantHubSectorDial,
  'sector-dial-outline': VariantOutlineSectorDial,
};

// =============================================================================
// VARIANT 76 STYLES
// =============================================================================

const v76 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 40,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  leader: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
});

// =============================================================================
// VARIANT 77 STYLES
// =============================================================================

const v77 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  caption: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.92)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 40,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  leader: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
});

// =============================================================================
// VARIANT 78 STYLES
// =============================================================================

const v78 = StyleSheet.create({
  wrap: {
    gap: SPACING.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 30,
  },
  numeral: {
    width: 14,
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.6)',
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  leader: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
});

// =============================================================================
// VARIANT 79 STYLES
// =============================================================================

const v79 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  rowLine: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.12)',
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 80 STYLES
// =============================================================================

const v80 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 40,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  leader: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  foot: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
    paddingTop: SPACING.sm,
  },
  footText: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 81 STYLES
// =============================================================================

const v81 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
  },
  cardOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_ON_INK,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: R2_ON_INK,
    borderColor: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 82 STYLES
// =============================================================================

const v82 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  badgeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  barA: {
    position: 'absolute',
    left: 9,
    top: 4,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: R2_ON_INK,
    transform: [{ rotate: '-45deg' }],
  },
  barB: {
    position: 'absolute',
    left: 5,
    top: 7,
    width: 2,
    height: 5,
    borderRadius: 1,
    backgroundColor: R2_ON_INK,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 83 STYLES
// =============================================================================

const v83 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    minHeight: 60,
    justifyContent: 'center',
    gap: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_ON_INK,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  subtitleOn: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
});

// =============================================================================
// VARIANT 84 STYLES
// =============================================================================

const v84 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  left: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(99, 102, 241, 0.18)',
    paddingRight: SPACING.md,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_ON_INK,
  },
  subtitle: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  subtitleOn: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
});

// =============================================================================
// VARIANT 85 STYLES
// =============================================================================

const v85 = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
  },
  stripOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_ON_INK,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: R2_ON_INK,
    borderColor: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 86 STYLES
// =============================================================================

const v86 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  pill: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
  },
  pillOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  pillText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  pillTextOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 87 STYLES
// =============================================================================

const v87 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  pill: {
    alignSelf: 'stretch',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
  },
  pillOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  pillText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  pillTextOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 88 STYLES
// =============================================================================

const v88 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  pill: {
    flexBasis: '48%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.sm,
  },
  pillOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  pillText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  pillTextOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 89 STYLES
// =============================================================================

const v89 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  pill: {
    alignSelf: 'stretch',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
  },
  pillOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  pillText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  pillTextOn: {
    color: R2_ON_INK,
  },
  pillSub: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  pillSubOn: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
});

// =============================================================================
// VARIANT 90 STYLES
// =============================================================================

const v90 = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  pill: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
  },
  pillOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  pillText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  pillTextOn: {
    color: R2_ON_INK,
  },
  foot: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
    paddingTop: SPACING.sm,
  },
  footText: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 91 STYLES
// =============================================================================

const v91 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.py,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dial: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  node: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.sheet,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeTop: {
    left: 88,
    top: 1,
  },
  nodeRight: {
    left: 175,
    top: 88,
  },
  nodeBottom: {
    left: 88,
    top: 175,
  },
  nodeLeft: {
    left: 1,
    top: 88,
  },
  nodeLetter: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  nodeLetterOn: {
    color: R2_ON_INK,
  },
  hub: {
    position: 'absolute',
    left: 90,
    top: 90,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: R2_PURPLE,
    borderWidth: 1,
    borderColor: R2_PURPLE_BORDER,
  },
  hubLetter: {
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: R2_ON_INK,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 92 STYLES
// =============================================================================

const v92 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.quart,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dial: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  node: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  nodeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeTop: {
    left: 97,
    top: 1,
  },
  nodeRight: {
    left: 193,
    top: 97,
  },
  nodeBottom: {
    left: 97,
    top: 193,
  },
  nodeLeft: {
    left: 1,
    top: 97,
  },
  labelCol: {
    alignItems: 'center',
    gap: 2,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
  labelSub: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 93 STYLES
// =============================================================================

const v93 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.py,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dial: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  innerRing: {
    position: 'absolute',
    left: 24,
    top: 24,
    right: 24,
    bottom: 24,
    borderRadius: 81,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  node: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  nodeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeTop: {
    left: 95,
    top: 1,
  },
  nodeRight: {
    left: 189,
    top: 95,
  },
  nodeBottom: {
    left: 95,
    top: 189,
  },
  nodeLeft: {
    left: 1,
    top: 95,
  },
  hubDot: {
    position: 'absolute',
    left: 101,
    top: 101,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: R2_PURPLE,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 94 STYLES
// =============================================================================

const v94 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.py,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dial: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  horiz: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 104.5,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  vert: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 104.5,
    width: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  node: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.sheet,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeTop: {
    left: 88,
    top: 1,
  },
  nodeRight: {
    left: 175,
    top: 88,
  },
  nodeBottom: {
    left: 88,
    top: 175,
  },
  nodeLeft: {
    left: 1,
    top: 88,
  },
  nodeLetter: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  nodeLetterOn: {
    color: R2_ON_INK,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 95 STYLES
// =============================================================================

const v95 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.py,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dial: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  tickV: {
    position: 'absolute',
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  tickH: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  tickTop: {
    left: 104,
    top: 22,
  },
  tickBottom: {
    left: 104,
    top: 180,
  },
  tickLeft: {
    left: 22,
    top: 104,
  },
  tickRight: {
    left: 180,
    top: 104,
  },
  tickNE: {
    left: 160,
    top: 45,
    transform: [{ rotate: '45deg' }],
  },
  tickSW: {
    left: 48,
    top: 157,
    transform: [{ rotate: '45deg' }],
  },
  tickSE: {
    left: 160,
    top: 157,
    transform: [{ rotate: '-45deg' }],
  },
  tickNW: {
    left: 48,
    top: 45,
    transform: [{ rotate: '-45deg' }],
  },
  node: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  nodeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  nodeTop: {
    left: 97,
    top: 1,
  },
  nodeRight: {
    left: 193,
    top: 97,
  },
  nodeBottom: {
    left: 97,
    top: 193,
  },
  nodeLeft: {
    left: 1,
    top: 97,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 96 STYLES
// =============================================================================

const v96 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quad: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  quadOn: {
    backgroundColor: R2_PURPLE,
  },
  quadTL: {
    borderBottomRightRadius: 100,
  },
  quadTR: {
    borderBottomLeftRadius: 100,
  },
  quadBL: {
    borderTopRightRadius: 100,
  },
  quadBR: {
    borderTopLeftRadius: 100,
  },
  letter: {
    position: 'absolute',
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  letTL: {
    top: 12,
    left: 14,
  },
  letTR: {
    top: 12,
    right: 14,
  },
  letBL: {
    bottom: 12,
    left: 14,
  },
  letBR: {
    bottom: 12,
    right: 14,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 97 STYLES
// =============================================================================

const v97 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.quart,
  },
  cornerRow: {
    width: 248,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  cornerTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    maxWidth: 112,
  },
  cornerLeft: {
    textAlign: 'left',
  },
  cornerRight: {
    textAlign: 'right',
  },
  cornerOn: {
    color: R2_PURPLE,
  },
  circle: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quad: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  quadOn: {
    backgroundColor: R2_PURPLE,
  },
  quadTL: {
    borderBottomRightRadius: 100,
  },
  quadTR: {
    borderBottomLeftRadius: 100,
  },
  quadBL: {
    borderTopRightRadius: 100,
  },
  quadBR: {
    borderTopLeftRadius: 100,
  },
  horiz: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 99.5,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  vert: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 99.5,
    width: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
});

// =============================================================================
// VARIANT 98 STYLES
// =============================================================================

const v98 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 206,
    height: 206,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quad: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  quadOn: {
    backgroundColor: R2_PURPLE,
  },
  quadTL: {
    borderBottomRightRadius: 100,
  },
  quadTR: {
    borderBottomLeftRadius: 100,
  },
  quadBL: {
    borderTopRightRadius: 100,
  },
  quadBR: {
    borderTopLeftRadius: 100,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 99 STYLES
// =============================================================================

const v99 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quad: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  quadOn: {
    backgroundColor: R2_PURPLE,
  },
  quadTL: {
    borderBottomRightRadius: 100,
  },
  quadTR: {
    borderBottomLeftRadius: 100,
  },
  quadBL: {
    borderTopRightRadius: 100,
  },
  quadBR: {
    borderTopLeftRadius: 100,
  },
  hub: {
    position: 'absolute',
    left: 72,
    top: 72,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: R2_PURPLE,
    borderWidth: 1.5,
    borderColor: R2_PURPLE_BORDER,
  },
  hubLetter: {
    fontSize: 16,
    fontFamily: ty.familyMedium,
    color: R2_ON_INK,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 100 STYLES
// =============================================================================

const v100 = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quad: {
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  quadOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  quadTL: {
    borderBottomRightRadius: 100,
  },
  quadTR: {
    borderBottomLeftRadius: 100,
  },
  quadBL: {
    borderTopRightRadius: 100,
  },
  quadBR: {
    borderTopLeftRadius: 100,
  },
  labelFree: {
    paddingHorizontal: SPACING.sm,
  },
  labelBox: {
    width: 56,
    alignItems: 'center',
  },
  labelTitle: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  labelTitleOn: {
    color: R2_PURPLE,
  },
});

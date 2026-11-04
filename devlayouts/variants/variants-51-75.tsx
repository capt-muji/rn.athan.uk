/**
 * Fasting layout variants 51-75 (T-623 round 2): the switch-row family, the
 * every-day hero family, the monogram medallions, the rail timelines and the
 * ghost numeral cards. Dev-only, first-frame settled; every variant reads the
 * shared round-2 selection with useR2 and draws one settled frame from it.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import { R2_OPTIONS, type R2Key, type R2Selection } from '../r2/model';
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

const ty = typographyFor(currentLocaleId());

const MONOGRAM_LETTERS: Record<R2Key, string> = { every: 'E', muhammad: 'M', dawood: 'D', white: 'W' };
const GROUP_MODES = 'Modes';
const GROUP_EXTRAS = 'Extras';
const HERO_BADGE = 'Default';
const GHOSTS = ['01', '02', '03', '04'];
const NUMERALS = ['1', '2', '3', '4'];

/** The option's selected read: modes off the selection's mode, white off its flag */
const isOn = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

// =============================================================================
// 53's drawn switch: a 32x18 track with a 14pt thumb, the compact sibling of
// the shared R2Switch
// =============================================================================

const MiniSwitch = ({ on, onPress }: { on: boolean; onPress: () => void }) => (
  <Pressable style={[v53.track, on ? v53.trackOn : null]} hitSlop={HIT_SLOP.md} onPress={onPress}>
    <View style={[v53.thumb, on ? v53.thumbOn : null]} />
  </Pressable>
);

// =============================================================================
// 51. PLAIN SWITCH ROWS - four titles with a switch on each row's right
//     edge, hairline dividers between the rows, all inside the titled card
// =============================================================================

const VariantPlainSwitchRows = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      {R2_OPTIONS.map((option, index) => (
        <View key={option.key} style={[v51.row, index < R2_OPTIONS.length - 1 ? v51.rowLine : null]}>
          <Text style={v51.title}>{option.title}</Text>
          <R2Switch on={isOn(selection, option.key)} onPress={() => tap(option.key)} />
        </View>
      ))}
      <R2Description />
    </R2Card>
  );
};

// =============================================================================
// 52. MONOGRAM SWITCH ROWS - each row opens with the option's initial in a
//     medallion, the title beside it and the switch trailing
// =============================================================================

const VariantMonogramSwitchRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v52.wrap}>
      {R2_OPTIONS.map((option) => (
        <View key={option.key} style={v52.row}>
          <R2Medallion letter={MONOGRAM_LETTERS[option.key]} on={isOn(selection, option.key)} />
          <Text style={v52.title}>{option.title}</Text>
          <R2Switch on={isOn(selection, option.key)} onPress={() => tap(option.key)} />
        </View>
      ))}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 53. COMPACT SWITCH ROWS - tight 40pt rows with the small drawn switch,
//     no dividers anywhere
// =============================================================================

const VariantCompactSwitchRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v53.wrap}>
      {R2_OPTIONS.map((option) => (
        <View key={option.key} style={v53.row}>
          <Text style={v53.title}>{option.title}</Text>
          <MiniSwitch on={isOn(selection, option.key)} onPress={() => tap(option.key)} />
        </View>
      ))}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 54. GROUPED SWITCH ROWS - two inset bordered boxes, the three mode rows
//     under the Modes caption and the white days alone under Extras
// =============================================================================

const VariantGroupedSwitchRows = () => {
  const { selection, tap } = useR2();
  const modes = R2_OPTIONS.filter((option) => option.key !== 'white');
  const extras = R2_OPTIONS.filter((option) => option.key === 'white');
  return (
    <View style={v54.wrap}>
      <View style={v54.group}>
        <Text style={v54.caption}>{GROUP_MODES}</Text>
        {modes.map((option) => (
          <View key={option.key} style={v54.row}>
            <Text style={v54.title}>{option.title}</Text>
            <R2Switch on={isOn(selection, option.key)} onPress={() => tap(option.key)} />
          </View>
        ))}
      </View>
      <View style={v54.group}>
        <Text style={v54.caption}>{GROUP_EXTRAS}</Text>
        {extras.map((option) => (
          <View key={option.key} style={v54.row}>
            <Text style={v54.title}>{option.title}</Text>
            <R2Switch on={isOn(selection, option.key)} onPress={() => tap(option.key)} />
          </View>
        ))}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 55. CAPTIONED SWITCH ROWS - two-line rows, the title over its subtitle
//     from the option set, the switch trailing
// =============================================================================

const VariantCaptionedSwitchRows = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      {R2_OPTIONS.map((option) => (
        <View key={option.key} style={v55.row}>
          <View style={v55.text}>
            <Text style={v55.title}>{option.title}</Text>
            <Text style={v55.subtitle} numberOfLines={1}>
              {option.subtitle}
            </Text>
          </View>
          <R2Switch on={isOn(selection, option.key)} onPress={() => tap(option.key)} />
        </View>
      ))}
      <R2Description />
    </R2Card>
  );
};

// =============================================================================
// 56. HERO EVERY-DAY TOP - the Every day option as a filled hero card at the
//     top, three compact tap rows beneath it for the other keys
// =============================================================================

const VariantHeroEverydayTop = () => {
  const { selection, tap } = useR2();
  const heroes = R2_OPTIONS.filter((option) => option.key === 'every');
  const others = R2_OPTIONS.filter((option) => option.key !== 'every');
  return (
    <View style={v56.wrap}>
      {heroes.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v56.hero, on ? v56.heroOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v56.heroTitle, on ? v56.heroTitleOn : null]}>{option.title}</Text>
            <R2Switch on={on} onPress={() => tap(option.key)} />
          </Pressable>
        );
      })}
      {others.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v56.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v56.title, on ? v56.titleOn : null]}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 57. HERO EVERY-DAY BOTTOM - the same pieces with the compact tap rows on
//     top and the hero card closing the set
// =============================================================================

const VariantHeroEverydayBottom = () => {
  const { selection, tap } = useR2();
  const heroes = R2_OPTIONS.filter((option) => option.key === 'every');
  const others = R2_OPTIONS.filter((option) => option.key !== 'every');
  return (
    <View style={v57.wrap}>
      {others.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v57.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v57.title, on ? v57.titleOn : null]}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      {heroes.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v57.hero, on ? v57.heroOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v57.heroTitle, on ? v57.heroTitleOn : null]}>{option.title}</Text>
            <R2Switch on={on} onPress={() => tap(option.key)} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 58. HERO RING - the hero card drawn as an outline ring: a 2.5pt purple
//     border and purple title ink while Every day is selected, secondary
//     tap rows below
// =============================================================================

const VariantHeroRing = () => {
  const { selection, tap } = useR2();
  const heroes = R2_OPTIONS.filter((option) => option.key === 'every');
  const others = R2_OPTIONS.filter((option) => option.key !== 'every');
  return (
    <View style={v58.wrap}>
      {heroes.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v58.hero, on ? v58.heroOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v58.heroTitle, on ? v58.heroTitleOn : null]}>{option.title}</Text>
            <R2Switch on={on} onPress={() => tap(option.key)} />
          </Pressable>
        );
      })}
      {others.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v58.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v58.title, on ? v58.titleOn : null]}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 59. HERO BANNER SWITCH - a full-width 72pt hero bar carrying the Every day
//     switch, the other three keys in a hairline strip beneath
// =============================================================================

const VariantHeroBannerSwitch = () => {
  const { selection, tap } = useR2();
  const heroes = R2_OPTIONS.filter((option) => option.key === 'every');
  const others = R2_OPTIONS.filter((option) => option.key !== 'every');
  return (
    <View style={v59.wrap}>
      {heroes.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v59.bar, on ? v59.barOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v59.barTitle, on ? v59.barTitleOn : null]}>{option.title}</Text>
            <R2Switch on={on} onPress={() => tap(option.key)} />
          </Pressable>
        );
      })}
      <View style={v59.strip}>
        {others.map((option, index) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v59.row, index < others.length - 1 ? v59.rowLine : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v59.title, on ? v59.titleOn : null]}>{option.title}</Text>
              <R2StateDot on={on} />
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 60. HERO CORNER BADGE - the hero card wears a small Default badge in its
//     corner only while Every day is selected, secondary rows below
// =============================================================================

const VariantHeroCornerBadge = () => {
  const { selection, tap } = useR2();
  const heroes = R2_OPTIONS.filter((option) => option.key === 'every');
  const others = R2_OPTIONS.filter((option) => option.key !== 'every');
  return (
    <View style={v60.wrap}>
      {heroes.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v60.hero, on ? v60.heroOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            {on && (
              <View style={v60.badge}>
                <Text style={v60.badgeText}>{HERO_BADGE}</Text>
              </View>
            )}
            <Text style={[v60.heroTitle, on ? v60.heroTitleOn : null]}>{option.title}</Text>
            <R2Switch on={on} onPress={() => tap(option.key)} />
          </Pressable>
        );
      })}
      {others.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v60.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v60.title, on ? v60.titleOn : null]}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 61. CIRCLE MONOGRAM ROWS - filled medallions lead the rows, titles follow
//     and a state dot closes each row, all inside the titled card
// =============================================================================

const VariantCircleMonogramRows = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v61.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <R2Medallion letter={MONOGRAM_LETTERS[option.key]} on={on} />
            <Text style={v61.title}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </R2Card>
  );
};

// =============================================================================
// 62. OUTLINE MONOGRAM ROWS - the medallions stay hollow, gaining a purple
//     border and purple letter while their option is selected
// =============================================================================

const VariantOutlineMonogramRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v62.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v62.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={[v62.medallion, on ? v62.medallionOn : null]}>
              <Text style={[v62.letter, on ? v62.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
            </View>
            <Text style={v62.title}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 63. COMPACT MONOGRAM ROWS - 34pt dense rows with 24pt filled medallions
//     and no trailing affordance
// =============================================================================

const VariantCompactMonogramRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v63.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v63.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={[v63.medallion, on ? v63.medallionOn : null]}>
              <Text style={[v63.letter, on ? v63.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
            </View>
            <Text style={v63.title}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 64. TWO-LINE MONOGRAM ROWS - medallion, a title-over-subtitle block and a
//     trailing dot, inside the titled card
// =============================================================================

const VariantTwoLineMonogramRows = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v64.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <R2Medallion letter={MONOGRAM_LETTERS[option.key]} on={on} />
            <View style={v64.text}>
              <Text style={v64.title}>{option.title}</Text>
              <Text style={v64.subtitle} numberOfLines={1}>
                {option.subtitle}
              </Text>
            </View>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </R2Card>
  );
};

// =============================================================================
// 65. MONOGRAM RAIL - a 1.5pt rail runs down the left edge and the
//     medallions hang on it, titles beside
// =============================================================================

const VariantMonogramRail = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v65.wrap}>
      <View style={v65.rail} />
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v65.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <R2Medallion letter={MONOGRAM_LETTERS[option.key]} on={on} />
            <Text style={[v65.title, on ? v65.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 66. LEFT RAIL DOTS - the 1.5pt rail carries a 12pt node dot per row,
//     purple while selected, titles to the right
// =============================================================================

const VariantLeftRailDots = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v66.wrap}>
      <View style={v66.rail} />
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v66.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={[v66.node, on ? v66.nodeOn : null]} />
            <Text style={[v66.title, on ? v66.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 67. CENTER RING RAIL - a 4pt spine runs down the middle with ring nodes
//     sat on it, one content column hanging to the right
// =============================================================================

const VariantCenterRingRail = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v67.wrap}>
      <View style={v67.spine} />
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v67.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={v67.half} />
            <View style={[v67.ring, on ? v67.ringOn : null]} />
            <Text style={[v67.title, on ? v67.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 68. THICK RAIL SEGMENTS - the rail drawn as a 6pt segment per row, purple
//     while its option is selected and faint otherwise, dot trailing
// =============================================================================

const VariantThickRailSegments = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v68.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v68.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={[v68.segment, on ? v68.segmentOn : null]} />
            <Text style={v68.title}>{option.title}</Text>
            <R2StateDot on={on} />
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 69. NUMBERED RAIL - the rail's nodes are 20pt circles carrying hoisted
//     numerals one through four, filling purple while selected
// =============================================================================

const VariantNumberedRail = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v69.wrap}>
      <View style={v69.rail} />
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v69.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={[v69.circle, on ? v69.circleOn : null]}>
              <Text style={[v69.numeral, on ? v69.numeralOn : null]}>{NUMERALS[index]}</Text>
            </View>
            <Text style={[v69.title, on ? v69.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 70. CARD RAIL NODES - 28pt mini-cards on the rail hold each option's
//     initial, the title and subtitle read to their right
// =============================================================================

const VariantCardRailNodes = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v70.wrap}>
      <View style={v70.rail} />
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v70.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={[v70.nodeCard, on ? v70.nodeCardOn : null]}>
              <Text style={[v70.letter, on ? v70.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
            </View>
            <View style={v70.text}>
              <Text style={v70.title}>{option.title}</Text>
              <Text style={v70.subtitle} numberOfLines={1}>
                {option.subtitle}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 71. GHOST NUMERAL CARDS - bordered cards with oversized 01-04 numerals at
//     12% opacity behind the titles
// =============================================================================

const VariantGhostNumeralCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v71.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v71.card, on ? v71.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={v71.ghost}>{GHOSTS[index]}</Text>
            <Text style={[v71.title, on ? v71.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 72. GHOST NUMERAL FILL - the same cards, filling solid purple while
//     selected with the numeral dropping to white at 25% opacity
// =============================================================================

const VariantGhostNumeralFill = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v72.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v72.card, on ? v72.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v72.ghost, on ? v72.ghostOn : null]}>{GHOSTS[index]}</Text>
            <Text style={[v72.title, on ? v72.titleOn : null]}>{option.title}</Text>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 73. GHOST NUMERAL STACK - a denser 10pt stack of cards showing title and
//     subtitle with the numerals at 30pt behind
// =============================================================================

const VariantGhostNumeralStack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v73.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v73.card, on ? v73.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={v73.ghost}>{GHOSTS[index]}</Text>
            <Text style={[v73.title, on ? v73.titleOn : null]}>{option.title}</Text>
            <Text style={v73.subtitle} numberOfLines={1}>
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
// 74. SIDE NUMERAL CARDS - each card opens with its ghost numeral column on
//     the left edge, title and subtitle reading to the right
// =============================================================================

const VariantSideNumeralCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v74.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v74.card, on ? v74.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={v74.ghost}>{GHOSTS[index]}</Text>
            <View style={v74.text}>
              <Text style={[v74.title, on ? v74.titleOn : null]}>{option.title}</Text>
              <Text style={v74.subtitle} numberOfLines={1}>
                {option.subtitle}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 75. GHOST NUMERAL FOOTER - cards whose subtitle sits in a hairline footer
//     band with the ghost numeral parked top-right
// =============================================================================

const VariantGhostNumeralFooter = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v75.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v75.card, on ? v75.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={v75.ghost}>{GHOSTS[index]}</Text>
            <Text style={[v75.title, on ? v75.titleOn : null]}>{option.title}</Text>
            <View style={v75.footer}>
              <Text style={v75.subtitle} numberOfLines={1}>
                {option.subtitle}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

export const VARIANTS_51_75: Record<string, FastingVariantComponent> = {
  'switch-rows-plain': VariantPlainSwitchRows,
  'switch-rows-monogram': VariantMonogramSwitchRows,
  'switch-rows-compact': VariantCompactSwitchRows,
  'switch-rows-grouped': VariantGroupedSwitchRows,
  'switch-rows-captioned': VariantCaptionedSwitchRows,
  'hero-everyday-top': VariantHeroEverydayTop,
  'hero-everyday-bottom': VariantHeroEverydayBottom,
  'hero-ring': VariantHeroRing,
  'hero-bar': VariantHeroBannerSwitch,
  'hero-badge': VariantHeroCornerBadge,
  'monogram-circle-rows': VariantCircleMonogramRows,
  'monogram-outline-rows': VariantOutlineMonogramRows,
  'monogram-compact': VariantCompactMonogramRows,
  'monogram-two-line': VariantTwoLineMonogramRows,
  'monogram-rail': VariantMonogramRail,
  'rail-left-dots': VariantLeftRailDots,
  'rail-center-ring': VariantCenterRingRail,
  'rail-thick-segments': VariantThickRailSegments,
  'rail-numbered': VariantNumberedRail,
  'rail-card-nodes': VariantCardRailNodes,
  'ghost-numerals': VariantGhostNumeralCards,
  'ghost-fill-numerals': VariantGhostNumeralFill,
  'ghost-stack-numerals': VariantGhostNumeralStack,
  'ghost-side-numerals': VariantSideNumeralCards,
  'ghost-footer-numerals': VariantGhostNumeralFooter,
};

// =============================================================================
// VARIANT 51 STYLES
// =============================================================================

const v51 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  rowLine: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  title: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 52 STYLES
// =============================================================================

const v52 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  title: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 53 STYLES
// =============================================================================

const v53 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 40,
  },
  title: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  track: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    padding: 2,
  },
  trackOn: {
    backgroundColor: R2_PURPLE,
  },
  thumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8ea0c9',
  },
  thumbOn: {
    backgroundColor: R2_ON_INK,
    alignSelf: 'flex-end',
  },
});

// =============================================================================
// VARIANT 54 STYLES
// =============================================================================

const v54 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  group: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
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
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 55 STYLES
// =============================================================================

const v55 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 56 STYLES
// =============================================================================

const v56 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },
  heroOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  heroTitle: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  heroTitleOn: {
    color: R2_ON_INK,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

// =============================================================================
// VARIANT 57 STYLES
// =============================================================================

const v57 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },
  heroOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  heroTitle: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  heroTitleOn: {
    color: R2_ON_INK,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

// =============================================================================
// VARIANT 58 STYLES
// =============================================================================

const v58 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },
  heroOn: {
    borderWidth: 2.5,
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  heroTitle: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  heroTitleOn: {
    color: R2_PURPLE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

// =============================================================================
// VARIANT 59 STYLES
// =============================================================================

const v59 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    height: 72,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
  },
  barOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  barTitle: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  barTitleOn: {
    color: R2_ON_INK,
  },
  strip: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    minHeight: 40,
  },
  rowLine: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
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
// VARIANT 60 STYLES
// =============================================================================

const v60 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },
  heroOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: R2_PURPLE,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: R2_ON_INK,
  },
  heroTitle: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  heroTitleOn: {
    color: R2_PURPLE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

// =============================================================================
// VARIANT 61 STYLES
// =============================================================================

const v61 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  title: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 62 STYLES
// =============================================================================

const v62 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  medallion: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionOn: {
    borderColor: R2_PURPLE,
  },
  letter: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_PURPLE,
  },
  title: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 63 STYLES
// =============================================================================

const v63 = StyleSheet.create({
  wrap: {
    gap: SPACING.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 34,
  },
  medallion: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  letter: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 64 STYLES
// =============================================================================

const v64 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 65 STYLES
// =============================================================================

const v65 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  rail: {
    position: 'absolute',
    left: 14.25,
    width: 1.5,
    top: 22,
    bottom: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
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
// VARIANT 66 STYLES
// =============================================================================

const v66 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  rail: {
    position: 'absolute',
    left: 5.25,
    width: 1.5,
    top: 22,
    bottom: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  node: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  nodeOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
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
// VARIANT 67 STYLES
// =============================================================================

const v67 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  spine: {
    position: 'absolute',
    left: '50%',
    width: 4,
    marginLeft: -2,
    top: 22,
    bottom: 22,
    borderRadius: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  half: {
    width: '50%',
  },
  ring: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginLeft: -8,
  },
  ringOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.15)',
  },
  title: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 68 STYLES
// =============================================================================

const v68 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  segment: {
    width: 6,
    alignSelf: 'stretch',
    marginVertical: SPACING.py,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  segmentOn: {
    backgroundColor: R2_PURPLE,
  },
  title: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 69 STYLES
// =============================================================================

const v69 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  rail: {
    position: 'absolute',
    left: 9.25,
    width: 1.5,
    top: 22,
    bottom: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  numeral: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  numeralOn: {
    color: R2_ON_INK,
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
// VARIANT 70 STYLES
// =============================================================================

const v70 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  rail: {
    position: 'absolute',
    left: 13.25,
    width: 1.5,
    top: 22,
    bottom: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  nodeCard: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCardOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  letter: {
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 71 STYLES
// =============================================================================

const v71 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  ghost: {
    position: 'absolute',
    top: 2,
    right: 12,
    fontSize: 44,
    lineHeight: 44,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    opacity: 0.12,
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
// VARIANT 72 STYLES
// =============================================================================

const v72 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  ghost: {
    position: 'absolute',
    top: 2,
    right: 12,
    fontSize: 44,
    lineHeight: 44,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    opacity: 0.12,
  },
  ghostOn: {
    color: R2_ON_INK,
    opacity: 0.25,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 73 STYLES
// =============================================================================

const v73 = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  card: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.py,
    gap: 2,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  ghost: {
    position: 'absolute',
    top: 4,
    right: 12,
    fontSize: 30,
    lineHeight: 30,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    opacity: 0.12,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 74 STYLES
// =============================================================================

const v74 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  ghost: {
    width: 44,
    fontSize: 30,
    lineHeight: 30,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    opacity: 0.12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 75 STYLES
// =============================================================================

const v75 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    minHeight: 56,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.py,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  ghost: {
    position: 'absolute',
    top: 4,
    right: 12,
    fontSize: 30,
    lineHeight: 30,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    opacity: 0.12,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
    marginTop: SPACING.xs,
    paddingVertical: SPACING.py,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

/**
 * Fasting layout variants 101-125 (T-623 round 2): the dashed ticket stubs,
 * the bracket frames, the duo-column compare splits, the key grids and the
 * vertical drums. Dev-only, first-frame settled; every variant reads the
 * shared round-2 selection with useR2 and draws one settled frame from it.
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
const K_WHITE: R2Key = 'white';

const ty = typographyFor(currentLocaleId());

const MONOGRAM_LETTERS: Record<R2Key, string> = { every: 'E', muhammad: 'M', dawood: 'D', white: 'W' };
const NUMERALS = ['1', '2', '3', '4'];

const OPTION_BY_KEY: Record<R2Key, R2Option> = {
  every: R2_OPTIONS[0],
  muhammad: R2_OPTIONS[1],
  dawood: R2_OPTIONS[2],
  white: R2_OPTIONS[3],
};

/** The option's selected read: modes off the selection's mode, white off its flag */
const isOn = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

/** The detail panes read the mode option; a modeless set is the white days alone */
const detailKey = (selection: R2Selection): R2Key => selection.mode ?? K_WHITE;

// =============================================================================
// 101. DASHED-EDGE TICKETS - cards with a 3pt dashed left edge and a hollow
//     12pt ring punched over it, purple edge and ring while selected
// =============================================================================

const VariantDashedEdgeTickets = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v101.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v101.card, on ? v101.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={[v101.notch, on ? v101.notchOn : null]} />
            <View style={v101.text}>
              <Text style={[v101.title, on ? v101.titleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
              <Text style={v101.subtitle} numberOfLines={1}>
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
// 102. RIGHT-NOTCH TICKETS - the ticket family mirrored: dashed edge and
//     punched ring on the right, text block reading from the left
// =============================================================================

const VariantRightNotchTickets = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v102.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v102.card, on ? v102.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={[v102.notch, on ? v102.notchOn : null]} />
            <View style={v102.text}>
              <Text style={[v102.title, on ? v102.titleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
              <Text style={v102.subtitle} numberOfLines={1}>
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
// 103. NUMBERED TICKETS - a 40pt stub column carries the hoisted numeral, a
//     dashed vertical divider perforates the stub from the title
// =============================================================================

const VariantNumberedTickets = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v103.wrap}>
      {R2_OPTIONS.map((option, index) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v103.card, on ? v103.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={v103.stub}>
              <Text style={[v103.numeral, on ? v103.numeralOn : null]}>{NUMERALS[index]}</Text>
            </View>
            <View style={v103.perf} />
            <Text style={[v103.title, on ? v103.titleOn : null]} numberOfLines={1}>
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
// 104. WIDE TICKET STUBS - wide 56pt tickets holding the title over its
//     subtitle, the dashed stub edge on the left of each
// =============================================================================

const VariantWideTicketStubs = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v104.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v104.card, on ? v104.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v104.title, on ? v104.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <Text style={v104.subtitle} numberOfLines={1}>
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
// 105. PERFORATED ROW TICKETS - tickets whose dashed rule runs horizontally
//     inside, separating the title band from the subtitle band
// =============================================================================

const VariantPerforatedRowTickets = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v105.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v105.card, on ? v105.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v105.title, on ? v105.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <View style={v105.perf} />
            <Text style={v105.subtitle} numberOfLines={1}>
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
// 106. LEFT BRACKET CARDS - each row framed by a drawn left square bracket:
//     a 2.5pt spine with 10pt horizontal arms at its top and bottom
// =============================================================================

const VariantLeftBracketCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v106.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v106.card} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={v106.bracket}>
              <View style={[v106.barTop, on ? v106.barOn : null]} />
              <View style={[v106.barSpine, on ? v106.barOn : null]} />
              <View style={[v106.barBottom, on ? v106.barOn : null]} />
            </View>
            <View style={v106.text}>
              <Text style={[v106.title, on ? v106.titleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
              <Text style={v106.subtitle} numberOfLines={1}>
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
// 107. FULL-FRAME BRACKET CARDS - four corner L-brackets drawn around each
//     card, the whole frame turning purple while selected
// =============================================================================

const VariantFullFrameBracketCards = () => {
  const { selection, tap } = useR2();
  const frame = (on: boolean) => (
    <>
      <View style={[v107.armTL, on ? v107.barOn : null]} />
      <View style={[v107.sideTL, on ? v107.barOn : null]} />
      <View style={[v107.armTR, on ? v107.barOn : null]} />
      <View style={[v107.sideTR, on ? v107.barOn : null]} />
      <View style={[v107.armBL, on ? v107.barOn : null]} />
      <View style={[v107.sideBL, on ? v107.barOn : null]} />
      <View style={[v107.armBR, on ? v107.barOn : null]} />
      <View style={[v107.sideBR, on ? v107.barOn : null]} />
    </>
  );
  return (
    <View style={v107.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v107.card} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            {frame(on)}
            <Text style={[v107.title, on ? v107.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <Text style={v107.subtitle} numberOfLines={1}>
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
// 108. THIN BRACKET ROWS - the left bracket drawn 1pt on dense 38pt rows
//     carrying the title alone
// =============================================================================

const VariantThinBracketRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v108.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v108.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={v108.bracket}>
              <View style={[v108.barTop, on ? v108.barOn : null]} />
              <View style={[v108.barSpine, on ? v108.barOn : null]} />
              <View style={[v108.barBottom, on ? v108.barOn : null]} />
            </View>
            <Text style={[v108.title, on ? v108.titleOn : null]} numberOfLines={1}>
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
// 109. CORNER MARK CARDS - minimal cards carrying only four 8pt corner
//     ticks, purple while selected, over a centered title
// =============================================================================

const VariantCornerMarkCards = () => {
  const { selection, tap } = useR2();
  const marks = (on: boolean) => (
    <>
      <View style={[v109.armTL, on ? v109.barOn : null]} />
      <View style={[v109.sideTL, on ? v109.barOn : null]} />
      <View style={[v109.armTR, on ? v109.barOn : null]} />
      <View style={[v109.sideTR, on ? v109.barOn : null]} />
      <View style={[v109.armBL, on ? v109.barOn : null]} />
      <View style={[v109.sideBL, on ? v109.barOn : null]} />
      <View style={[v109.armBR, on ? v109.barOn : null]} />
      <View style={[v109.sideBR, on ? v109.barOn : null]} />
    </>
  );
  return (
    <View style={v109.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v109.card} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            {marks(on)}
            <Text style={[v109.title, on ? v109.titleOn : null]} numberOfLines={1}>
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
// 110. INLINE BRACKET ROWS - drawn bracket pairs flanking the title text in
//     one centered row per option
// =============================================================================

const VariantInlineBracketRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v110.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v110.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <View style={v110.bracketL}>
              <View style={[v110.hTopL, on ? v110.barOn : null]} />
              <View style={[v110.spineL, on ? v110.barOn : null]} />
              <View style={[v110.hBotL, on ? v110.barOn : null]} />
            </View>
            <Text style={[v110.title, on ? v110.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <View style={v110.bracketR}>
              <View style={[v110.hTopR, on ? v110.barOn : null]} />
              <View style={[v110.spineR, on ? v110.barOn : null]} />
              <View style={[v110.hBotR, on ? v110.barOn : null]} />
            </View>
          </Pressable>
        );
      })}
      <R2Description />
    </View>
  );
};

// =============================================================================
// 111. TILES + DETAIL PANE - a 2x2 grid of compact tiles on the left, a
//     bordered detail pane on the right echoing the selected option and
//     carrying the whole-selection sentence
// =============================================================================

const VariantTilesDetailPane = () => {
  const { selection, tap } = useR2();
  const pane = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v111.split}>
      <View style={v111.tiles}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v111.tile, on ? v111.tileOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v111.letter, on ? v111.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
              <Text style={[v111.tileTitle, on ? v111.tileTitleOn : null]} numberOfLines={2}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v111.pane}>
        <Text style={v111.paneTitle} numberOfLines={1}>
          {pane.title}
        </Text>
        <Text style={v111.paneSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={v111.paneRule} />
        <R2Description style={v111.paneDesc} />
      </View>
    </View>
  );
};

// =============================================================================
// 112. LIST + DETAIL PANE - a compact tap list of four rows on the left, a
//     bordered panel holding the whole-selection sentence on the right
// =============================================================================

const VariantListDetailPane = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v112.split}>
      <View style={v112.list}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v112.row, on ? v112.rowOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v112.title, on ? v112.titleOn : null]} numberOfLines={2}>
                {option.title}
              </Text>
              <R2StateDot on={on} />
            </Pressable>
          );
        })}
      </View>
      <View style={v112.pane}>
        <R2Description style={v112.paneText} />
      </View>
    </View>
  );
};

// =============================================================================
// 113. TOP OPTIONS + SIDE NOTES - four compact accent rows in a top band,
//     the selected row's 3pt band edge purple, the description pane below
// =============================================================================

const VariantTopOptionsSideNotes = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v113.wrap}>
      <View style={v113.band}>
        {R2_OPTIONS.map((option, index) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v113.row, index < R2_OPTIONS.length - 1 ? v113.rowLine : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <View style={[v113.accent, on ? v113.accentOn : null]} />
              <Text style={[v113.title, on ? v113.titleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
              <R2StateDot on={on} />
            </Pressable>
          );
        })}
      </View>
      <View style={v113.pane}>
        <View style={v113.paneAccent} />
        <R2Description style={v113.paneText} />
      </View>
    </View>
  );
};

// =============================================================================
// 114. RAIL + DETAIL SPLIT - four dots on a 1.5pt mini rail at the left, the
//     selected option's title at 20pt and the sentence at the right
// =============================================================================

const VariantRailDetailSplit = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v114.split}>
      <View style={v114.rail}>
        <View style={v114.line} />
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v114.slot} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <View style={[v114.dot, on ? v114.dotOn : null]} />
            </Pressable>
          );
        })}
      </View>
      <View style={v114.detail}>
        <Text style={v114.detailTitle} numberOfLines={1}>
          {OPTION_BY_KEY[detailKey(selection)].title}
        </Text>
        <R2Description />
      </View>
    </View>
  );
};

// =============================================================================
// 115. HERO + DETAIL SPLIT - the selected option's title at 22pt over its
//     subtitle on the left, four stacked mini chips on the right
// =============================================================================

const VariantHeroDetailSplit = () => {
  const { selection, tap } = useR2();
  const hero = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v115.wrap}>
      <View style={v115.split}>
        <View style={v115.hero}>
          <Text style={v115.heroTitle} numberOfLines={2}>
            {hero.title}
          </Text>
          <Text style={v115.heroSub} numberOfLines={2}>
            {hero.subtitle}
          </Text>
        </View>
        <View style={v115.chips}>
          {R2_OPTIONS.map((option) => {
            const on = isOn(selection, option.key);
            return (
              <Pressable
                key={option.key}
                style={[v115.chip, on ? v115.chipOn : null]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(option.key)}>
                <Text style={[v115.chipText, on ? v115.chipTextOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 116. BIG KEY GRID - 2x2 keycaps of 82pt carrying a 26pt initial over the
//     option title, filling purple while selected
// =============================================================================

const VariantBigKeyGrid = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v116.wrap}>
      <View style={v116.grid}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v116.key, on ? v116.keyOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v116.letter, on ? v116.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
              <Text style={[v116.keyTitle, on ? v116.keyTitleOn : null]} numberOfLines={1}>
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
// 117. SMALL KEY GRID - compact 60pt keycaps in a 2x2, the whole-selection
//     sentence below the grid
// =============================================================================

const VariantSmallKeyGrid = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v117.wrap}>
      <View style={v117.grid}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v117.key, on ? v117.keyOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v117.letter, on ? v117.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
              <Text style={[v117.keyTitle, on ? v117.keyTitleOn : null]} numberOfLines={2}>
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
// 118. WIDE KEY PAIRS - two rows of two half-width keys, each carrying the
//     initial and the title inline
// =============================================================================

const VariantWideKeyPairs = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v118.wrap}>
      <View style={v118.grid}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v118.key, on ? v118.keyOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v118.letter, on ? v118.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
              <Text style={[v118.keyTitle, on ? v118.keyTitleOn : null]} numberOfLines={1}>
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
// 119. ROUND KEY GRID - circular 60pt keys carrying initials in a 2x2, the
//     selected key filling purple inside a purple ring, titles beneath
// =============================================================================

const VariantRoundKeyGrid = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v119.wrap}>
      <View style={v119.grid}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <View key={option.key} style={v119.cell}>
              <Pressable
                style={[v119.key, on ? v119.keyOn : null]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(option.key)}>
                <Text style={[v119.letter, on ? v119.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
              </Pressable>
              <Text style={[v119.keyTitle, on ? v119.keyTitleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </View>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 120. KEYS + DESCRIPTION BAR - the 2x2 key grid closing on a full-width
//     bordered bar that carries the whole-selection sentence
// =============================================================================

const VariantKeysDescriptionBar = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v120.wrap}>
      <View style={v120.grid}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v120.key, on ? v120.keyOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v120.letter, on ? v120.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
              <Text style={[v120.keyTitle, on ? v120.keyTitleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v120.bar}>
        <R2Description style={v120.barText} />
      </View>
    </View>
  );
};

// =============================================================================
// 121. SHADED VERTICAL DRUM - four stacked rows in a banded group, the
//     selected row large and purple while its neighbours dim, hairline band
//     rules above and below the group
// =============================================================================

const VariantShadedVerticalDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v121.wrap}>
      <View style={v121.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v121.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <Text style={[v121.title, on ? v121.titleOn : v121.titleOff]} numberOfLines={1}>
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
// 122. RAIL-BAND VERTICAL DRUM - the selected row framed between two 2pt
//     purple rails, its neighbours scaled down and dimmed
// =============================================================================

const VariantRailBandVerticalDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v122.wrap}>
      <View style={v122.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v122.row, on ? v122.rowOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v122.title, on ? v122.titleOn : v122.titleOff]} numberOfLines={1}>
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
// 123. CENTER-PILL VERTICAL DRUM - the selected row drawn as a full-width
//     purple pill carrying the white title, its neighbours plain dimmed text
// =============================================================================

const VariantCenterPillVerticalDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v123.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v123.row, on ? v123.rowOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v123.title, on ? v123.titleOn : v123.titleOff]} numberOfLines={1}>
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
// 124. RULER VERTICAL DRUM - a left ruler column of tick marks beside the
//     band, the selected row enlarged and its neighbours dimmed
// =============================================================================

const VariantRulerVerticalDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v124.wrap}>
      <View style={v124.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v124.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <View style={v124.tickSlot}>
                <View style={[v124.tick, on ? v124.tickOn : null]} />
              </View>
              <Text style={[v124.title, on ? v124.titleOn : v124.titleOff]} numberOfLines={1}>
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
// 125. CARD DRUM VERTICAL - the drum inside the titled card, the selected
//     row enlarging and reading its subtitle under the title
// =============================================================================

const VariantCardDrumVertical = () => {
  const { selection, tap } = useR2();
  return (
    <R2Card>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable key={option.key} style={v125.row} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
            <Text style={[v125.title, on ? v125.titleOn : v125.titleOff]} numberOfLines={1}>
              {option.title}
            </Text>
            {on && (
              <Text style={v125.subtitle} numberOfLines={1}>
                {option.subtitle}
              </Text>
            )}
          </Pressable>
        );
      })}
      <R2Description />
    </R2Card>
  );
};

export const VARIANTS_101_125: Record<string, FastingVariantComponent> = {
  'ticket-dashed-left': VariantDashedEdgeTickets,
  'ticket-dashed-right': VariantRightNotchTickets,
  'ticket-stub-numbers': VariantNumberedTickets,
  'ticket-wide-stubs': VariantWideTicketStubs,
  'ticket-stub-perf-row': VariantPerforatedRowTickets,
  'bracket-left-cards': VariantLeftBracketCards,
  'bracket-full-frame': VariantFullFrameBracketCards,
  'bracket-thin-rows': VariantThinBracketRows,
  'bracket-corner-marks': VariantCornerMarkCards,
  'bracket-title-inline': VariantInlineBracketRows,
  'duo-tiles-detail': VariantTilesDetailPane,
  'duo-list-detail': VariantListDetailPane,
  'duo-top-side': VariantTopOptionsSideNotes,
  'duo-rail-detail': VariantRailDetailSplit,
  'duo-hero-detail': VariantHeroDetailSplit,
  'keypad-big-keys': VariantBigKeyGrid,
  'keypad-small-keys': VariantSmallKeyGrid,
  'keypad-wide-keys': VariantWideKeyPairs,
  'keypad-round-keys': VariantRoundKeyGrid,
  'keypad-key-desc': VariantKeysDescriptionBar,
  'drum-vertical-shaded': VariantShadedVerticalDrum,
  'drum-vertical-rails': VariantRailBandVerticalDrum,
  'drum-vertical-pill': VariantCenterPillVerticalDrum,
  'drum-vertical-ruler': VariantRulerVerticalDrum,
  'drum-vertical-card': VariantCardDrumVertical,
};

// =============================================================================
// VARIANT 101 STYLES
// =============================================================================

const v101 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  notch: {
    position: 'absolute',
    left: -4.5,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: COLORS.surface.sheet,
  },
  notchOn: {
    borderColor: R2_PURPLE,
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
// VARIANT 102 STYLES
// =============================================================================

const v102 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderRightWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  notch: {
    position: 'absolute',
    right: -4.5,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: COLORS.surface.sheet,
  },
  notchOn: {
    borderColor: R2_PURPLE,
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
// VARIANT 103 STYLES
// =============================================================================

const v103 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    overflow: 'hidden',
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  stub: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeral: {
    fontSize: 16,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.7)',
  },
  numeralOn: {
    color: R2_PURPLE,
  },
  perf: {
    width: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  title: {
    flex: 1,
    alignSelf: 'center',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.lg,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 104 STYLES
// =============================================================================

const v104 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    justifyContent: 'center',
    gap: 2,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.lg,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
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
// VARIANT 105 STYLES
// =============================================================================

const v105 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    overflow: 'hidden',
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    paddingHorizontal: SPACING.lg,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  perf: {
    height: 0,
    marginTop: SPACING.py,
    marginBottom: SPACING.py,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  subtitle: {
    paddingHorizontal: SPACING.lg,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 106 STYLES
// =============================================================================

const v106 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.md,
    minHeight: 52,
    paddingLeft: SPACING.quart,
    paddingRight: SPACING.md,
  },
  bracket: {
    width: 10,
  },
  barTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 10,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 10,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barOn: {
    backgroundColor: R2_PURPLE,
  },
  text: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.sm,
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
// VARIANT 107 STYLES
// =============================================================================

const v107 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 54,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.smd,
  },
  armTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2.5,
    height: 12,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  armTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 2.5,
    height: 12,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  armBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 12,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 2.5,
    height: 12,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  armBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 2.5,
    height: 12,
    borderRadius: 1.25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barOn: {
    backgroundColor: R2_PURPLE,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 108 STYLES
// =============================================================================

const v108 = StyleSheet.create({
  wrap: {
    gap: SPACING.quart,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.smd,
    minHeight: 38,
    paddingLeft: SPACING.quart,
    paddingRight: SPACING.md,
  },
  bracket: {
    width: 8,
  },
  barTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barOn: {
    backgroundColor: R2_PURPLE,
  },
  title: {
    flex: 1,
    alignSelf: 'center',
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 109 STYLES
// =============================================================================

const v109 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: SPACING.xl,
  },
  armTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  armTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  armBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 8,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  armBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  sideBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barOn: {
    backgroundColor: R2_PURPLE,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 110 STYLES
// =============================================================================

const v110 = StyleSheet.create({
  wrap: {
    gap: SPACING.quart,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 36,
  },
  bracketL: {
    width: 7,
    height: 18,
  },
  hTopL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 7,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  spineL: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  hBotL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 7,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  bracketR: {
    width: 7,
    height: 18,
  },
  hTopR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  spineR: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  hBotR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 7,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
  },
  barOn: {
    backgroundColor: R2_PURPLE,
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
// VARIANT 111 STYLES
// =============================================================================

const v111 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  tiles: {
    width: 154,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tile: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  tileOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 18,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  tileTitle: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  tileTitleOn: {
    color: R2_ON_INK,
  },
  pane: {
    flex: 1,
    gap: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: SPACING.smd,
  },
  paneTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  paneSub: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  paneRule: {
    height: 0,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
  },
  paneDesc: {
    fontSize: 12,
  },
});

// =============================================================================
// VARIANT 112 STYLES
// =============================================================================

const v112 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  list: {
    width: 150,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: SPACING.smd,
  },
  rowOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  pane: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: SPACING.smd,
  },
  paneText: {
    fontSize: 12,
  },
});

// =============================================================================
// VARIANT 113 STYLES
// =============================================================================

const v113 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },
  rowLine: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  accentOn: {
    backgroundColor: R2_PURPLE,
  },
  title: {
    flex: 1,
    paddingLeft: SPACING.md,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  pane: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    overflow: 'hidden',
  },
  paneAccent: {
    width: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  paneText: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.smd,
  },
});

// =============================================================================
// VARIANT 114 STYLES
// =============================================================================

const v114 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rail: {
    width: 30,
  },
  line: {
    position: 'absolute',
    left: '50%',
    marginLeft: -0.75,
    width: 1.5,
    top: 14,
    bottom: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  slot: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: COLORS.surface.sheet,
  },
  dotOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  detail: {
    flex: 1,
    gap: SPACING.sm,
  },
  detailTitle: {
    fontSize: 20,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 115 STYLES
// =============================================================================

const v115 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.smd,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  heroSub: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  chips: {
    width: 132,
    justifyContent: 'center',
    gap: 6,
  },
  chip: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.sm,
  },
  chipOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  chipText: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  chipTextOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 116 STYLES
// =============================================================================

const v116 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  grid: {
    width: 172,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  keyOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 26,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  keyTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  keyTitleOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 117 STYLES
// =============================================================================

const v117 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  grid: {
    width: 128,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.quart,
  },
  keyOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 18,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  keyTitle: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  keyTitleOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 118 STYLES
// =============================================================================

const v118 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  keyOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 16,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  keyTitle: {
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  keyTitleOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 119 STYLES
// =============================================================================

const v119 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '50%',
    alignItems: 'center',
    gap: 4,
  },
  key: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  keyOn: {
    borderWidth: 2,
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 20,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  keyTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  keyTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 120 STYLES
// =============================================================================

const v120 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  grid: {
    width: 136,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.quart,
  },
  keyOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 16,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  keyTitle: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  keyTitleOn: {
    color: R2_ON_INK,
  },
  bar: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.smd,
  },
  barText: {
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 121 STYLES
// =============================================================================

const v121 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
    borderBottomColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    fontSize: 18,
    color: R2_PURPLE,
  },
  titleOff: {
    fontSize: 13,
    fontFamily: ty.familyRegular,
    opacity: 0.4,
  },
});

// =============================================================================
// VARIANT 122 STYLES
// =============================================================================

const v122 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
  },
  row: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  rowOn: {
    borderTopColor: R2_PURPLE,
    borderBottomColor: R2_PURPLE,
  },
  title: {
    fontSize: 15,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    fontSize: 18,
    color: R2_PURPLE,
  },
  titleOff: {
    opacity: 0.4,
    transform: [{ scale: 0.88 }],
  },
});

// =============================================================================
// VARIANT 123 STYLES
// =============================================================================

const v123 = StyleSheet.create({
  wrap: {
    gap: 2,
  },
  row: {
    alignSelf: 'stretch',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  rowOn: {
    backgroundColor: R2_PURPLE,
  },
  title: {
    fontSize: 14,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    fontSize: 16,
    color: R2_ON_INK,
  },
  titleOff: {
    opacity: 0.45,
  },
});

// =============================================================================
// VARIANT 124 STYLES
// =============================================================================

const v124 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
    borderBottomColor: 'rgba(99, 102, 241, 0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
  },
  tickSlot: {
    width: 22,
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingRight: 6,
  },
  tick: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  tickOn: {
    width: 14,
    backgroundColor: R2_PURPLE,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    fontSize: 18,
    color: R2_PURPLE,
  },
  titleOff: {
    fontSize: 13,
    fontFamily: ty.familyRegular,
    opacity: 0.4,
  },
});

// =============================================================================
// VARIANT 125 STYLES
// =============================================================================

const v125 = StyleSheet.create({
  row: {
    alignItems: 'center',
    minHeight: 26,
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    fontSize: 16,
    color: R2_PURPLE,
  },
  titleOff: {
    fontSize: 13,
    fontFamily: ty.familyRegular,
    opacity: 0.4,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

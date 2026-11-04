/**
 * Fasting layout variants 126-150 (T-623 round 2): the sidebar navigations,
 * the horizontal drums, the notification cards, the folder tabs and the
 * two-track groups. Dev-only, first-frame settled; every variant reads the
 * shared round-2 selection with useR2 and draws one settled frame from it.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { FastingMode } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { ModeGlyph } from '../parts';
import { R2_OPTIONS, type R2Key, type R2Option, type R2Selection } from '../r2/model';
import {
  R2_ON_INK,
  R2_PURPLE,
  R2_PURPLE_BORDER,
  R2Card,
  R2Description,
  R2StateDot,
  R2Switch,
  useR2,
} from '../r2/parts';
import type { FastingVariantComponent } from '../registry';

// hoisted key values: the string scanner reads call-argument literals as display sinks
const K_WHITE: R2Key = 'white';

const ty = typographyFor(currentLocaleId());

const MONOGRAM_LETTERS: Record<R2Key, string> = { every: 'E', muhammad: 'M', dawood: 'D', white: 'W' };

const GLYPH_MODES: Record<R2Key, FastingMode> = {
  every: 'everyDay',
  muhammad: 'muhammad',
  dawood: 'dawood',
  white: 'whiteDays',
};

const GLYPH_INK_OFF = 'rgba(99, 102, 241, 0.5)';

const OPTION_BY_KEY: Record<R2Key, R2Option> = {
  every: R2_OPTIONS[0],
  muhammad: R2_OPTIONS[1],
  dawood: R2_OPTIONS[2],
  white: R2_OPTIONS[3],
};

const MODE_KEYS: readonly R2Key[] = ['every', 'muhammad', 'dawood'];

const TRACK_MODES = 'Mode';
const TRACK_EXTRAS = 'Extras';

const RULER_TICKS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/** The option's selected read: modes off the selection's mode, white off its flag */
const isOn = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

/** The detail panes read the mode option; a modeless set is the white days alone */
const detailKey = (selection: R2Selection): R2Key => selection.mode ?? K_WHITE;

// =============================================================================
// 126. SIDEBAR HERO - a left rail of four 40pt letter slots, the selected
//     one filling purple, beside a pane carrying the selected title,
//     subtitle and the whole-selection sentence
// =============================================================================

const VariantSidebarHero = () => {
  const { selection, tap } = useR2();
  const pane = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v126.split}>
      <View style={v126.slots}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v126.slot, on ? v126.slotOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v126.letter, on ? v126.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v126.pane}>
        <Text style={v126.paneTitle} numberOfLines={1}>
          {pane.title}
        </Text>
        <Text style={v126.paneSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={v126.paneRule} />
        <R2Description style={v126.paneDesc} />
      </View>
    </View>
  );
};

// =============================================================================
// 127. SIDEBAR MARK SLOTS - the rail's slots carry round-1's geometric mode
//     glyphs, the ink turning purple while selected, over a content pane
// =============================================================================

const VariantSidebarMarkSlots = () => {
  const { selection, tap } = useR2();
  const pane = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v127.split}>
      <View style={v127.slots}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v127.slot, on ? v127.slotOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <ModeGlyph mode={GLYPH_MODES[option.key]} ink={on ? R2_PURPLE : GLYPH_INK_OFF} />
            </Pressable>
          );
        })}
      </View>
      <View style={v127.pane}>
        <Text style={v127.paneTitle} numberOfLines={1}>
          {pane.title}
        </Text>
        <Text style={v127.paneSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={v127.paneRule} />
        <R2Description style={v127.paneDesc} />
      </View>
    </View>
  );
};

// =============================================================================
// 128. RIGHT SIDEBAR - the sidebar family mirrored: the letter-slot rail on
//     the right, the content pane reading on the left
// =============================================================================

const VariantRightSidebar = () => {
  const { selection, tap } = useR2();
  const pane = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v128.split}>
      <View style={v128.pane}>
        <Text style={v128.paneTitle} numberOfLines={1}>
          {pane.title}
        </Text>
        <Text style={v128.paneSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={v128.paneRule} />
        <R2Description style={v128.paneDesc} />
      </View>
      <View style={v128.slots}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v128.slot, on ? v128.slotOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v128.letter, on ? v128.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// =============================================================================
// 129. WIDE SIDEBAR SLOTS - a 116pt rail of wide slots holding the option
//     titles themselves, the selected filling purple, over a full-width
//     hero pane with the selected title and the sentence
// =============================================================================

const VariantWideSidebarSlots = () => {
  const { selection, tap } = useR2();
  const hero = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v129.wrap}>
      <View style={v129.slots}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v129.slot, on ? v129.slotOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v129.slotTitle, on ? v129.slotTitleOn : null]} numberOfLines={2}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v129.hero}>
        <Text style={v129.heroTitle} numberOfLines={1}>
          {hero.title}
        </Text>
        <R2Description />
      </View>
    </View>
  );
};

// =============================================================================
// 130. SIDEBAR DOT COLUMN - the narrow slot rail with a trailing state-dot
//     column between the slots and the content pane, one dot per slot row
// =============================================================================

const VariantSidebarDotColumn = () => {
  const { selection, tap } = useR2();
  const pane = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v130.split}>
      <View style={v130.slots}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v130.slot, on ? v130.slotOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v130.letter, on ? v130.letterOn : null]}>{MONOGRAM_LETTERS[option.key]}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v130.dots}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <View key={option.key} style={v130.dotRow}>
              <R2StateDot on={on} />
            </View>
          );
        })}
      </View>
      <View style={v130.pane}>
        <Text style={v130.paneTitle} numberOfLines={1}>
          {pane.title}
        </Text>
        <Text style={v130.paneSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={v130.paneRule} />
        <R2Description style={v130.paneDesc} />
      </View>
    </View>
  );
};

// =============================================================================
// 131. COLUMN DRUM - a real wheel: a hairline-banded row of four equal
//     columns, the selected one filling purple full-height with white ink
//     while its three neighbours dim, titles at each column's base
// =============================================================================

const VariantColumnDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v131.wrap}>
      <View style={v131.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v131.col, on ? v131.colOn : v131.colOff]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v131.title, on ? v131.titleOn : null]} numberOfLines={2}>
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
// 132. SCALED COLUMN DRUM - the drum wheel carried by scale: the selected
//     column grows to 1.06 inside a 2pt purple ring while its neighbours
//     shrink to 0.85 and dim
// =============================================================================

const VariantScaledColumnDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v132.wrap}>
      <View style={v132.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v132.col, on ? v132.colOn : v132.colOff]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v132.title, on ? v132.titleOn : null]} numberOfLines={2}>
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
// 133. MARKER COLUMN DRUM - a hairline pointer ticks the band's top edge,
//     a purple under-pill sits beneath the selected column's title and the
//     neighbours dim
// =============================================================================

const VariantMarkerColumnDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v133.wrap}>
      <View style={v133.marker} />
      <View style={v133.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v133.col, on ? v133.colOn : v133.colOff]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v133.title, on ? v133.titleOn : null]} numberOfLines={2}>
                {option.title}
              </Text>
              <View style={[v133.underPill, on ? v133.underPillOn : null]} />
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 134. PILL COLUMN DRUM - four vertical pills of title over subtitle, the
//     selected pill purple-filled and expanded while its neighbours stay
//     dimmed outline pills
// =============================================================================

const VariantPillColumnDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v134.wrap}>
      <View style={v134.band}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v134.pill, on ? v134.pillOn : v134.pillOff]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v134.title, on ? v134.titleOn : null]} numberOfLines={2}>
                {option.title}
              </Text>
              <Text style={[v134.sub, on ? v134.subOn : null]} numberOfLines={3}>
                {option.subtitle}
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
// 135. RULER COLUMN DRUM - the drum band inside the titled card with a tick
//     ruler along its bottom, the selected column filling purple
// =============================================================================

const VariantRulerColumnDrum = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v135.wrap}>
      <R2Card>
        <View style={v135.band}>
          {R2_OPTIONS.map((option) => {
            const on = isOn(selection, option.key);
            return (
              <Pressable
                key={option.key}
                style={[v135.col, on ? v135.colOn : v135.colOff]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(option.key)}>
                <Text style={[v135.title, on ? v135.titleOn : null]} numberOfLines={2}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={v135.ruler}>
          {RULER_TICKS.map((tick) => (
            <View key={tick} style={tick % 2 === 0 ? v135.tickMajor : v135.tickMinor} />
          ))}
        </View>
      </R2Card>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 136. COMPACT NOTIFICATION CARDS - 48pt rounded cards of a leading 8pt dot,
//     a medium title and a one-line subtitle; the selected card carries a
//     purple-tinted border and a purple dot
// =============================================================================

const VariantCompactNotificationCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v136.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v136.card, on ? v136.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={[v136.dot, on ? v136.dotOn : null]} />
            <View style={v136.text}>
              <Text style={v136.title} numberOfLines={1}>
                {option.title}
              </Text>
              <Text style={v136.subtitle} numberOfLines={1}>
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
// 137. BOLD-TITLE NOTIFICATION CARDS - the same card anatomy with the titles
//     at 15pt medium and the subtitles drawn lighter beneath
// =============================================================================

const VariantBoldTitleNotificationCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v137.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v137.card, on ? v137.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={[v137.dot, on ? v137.dotOn : null]} />
            <View style={v137.text}>
              <Text style={v137.title} numberOfLines={1}>
                {option.title}
              </Text>
              <Text style={v137.subtitle} numberOfLines={1}>
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
// 138. MARKED NOTIFICATION CARDS - a leading 14pt mark circle on each card,
//     outlined while resting and purple-filled while selected, the title
//     and subtitle reading to its right
// =============================================================================

const VariantMarkedNotificationCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v138.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v138.card, on ? v138.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <View style={v138.markCol}>
              <View style={[v138.mark, on ? v138.markOn : null]} />
            </View>
            <View style={v138.text}>
              <Text style={v138.title} numberOfLines={1}>
                {option.title}
              </Text>
              <Text style={v138.subtitle} numberOfLines={1}>
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
// 139. TIGHT NOTIFICATION STACK - the card family at its densest: 6pt gaps
//     and 40pt compact cards of title over a one-line subtitle
// =============================================================================

const VariantTightNotificationStack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v139.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v139.card, on ? v139.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v139.title, on ? v139.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <Text style={v139.subtitle} numberOfLines={1}>
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
// 140. NOTIFICATION CARDS + FOOTER - the plain card stack closing on the
//     whole-selection sentence drawn inside a footer chip below
// =============================================================================

const VariantNotificationCardsFooter = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v140.wrap}>
      {R2_OPTIONS.map((option) => {
        const on = isOn(selection, option.key);
        return (
          <Pressable
            key={option.key}
            style={[v140.card, on ? v140.cardOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(option.key)}>
            <Text style={[v140.title, on ? v140.titleOn : null]} numberOfLines={1}>
              {option.title}
            </Text>
            <Text style={v140.subtitle} numberOfLines={1}>
              {option.subtitle}
            </Text>
          </Pressable>
        );
      })}
      <View style={v140.footer}>
        <R2Description />
      </View>
    </View>
  );
};

// =============================================================================
// 141. LEFT FOLDER TAB CARDS - each card wears a tab notch at its top-left,
//     the tab filling purple while selected and the stacked cards joining
//     through the card's negative bottom margin
// =============================================================================

const VariantLeftFolderTabCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v141.wrap}>
      <View style={v141.units}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v141.unit} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <View style={[v141.tab, on ? v141.tabOn : null]} />
              <View style={[v141.card, on ? v141.cardOn : null]}>
                <Text style={[v141.title, on ? v141.titleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 142. CENTER TAB CARDS - the folder family centered: each card's notch tab
//     sits at the horizontal middle, purple-filled while selected
// =============================================================================

const VariantCenterTabCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v142.wrap}>
      <View style={v142.units}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v142.unit} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <View style={[v142.tab, on ? v142.tabOn : null]} />
              <View style={[v142.card, on ? v142.cardOn : null]}>
                <Text style={[v142.title, on ? v142.titleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 143. ROW OF TABS - four folder tabs in one row joined onto a shared card,
//     the selected tab purple, the card showing the selected option's
//     subtitle and the whole-selection sentence
// =============================================================================

const VariantRowOfTabs = () => {
  const { selection, tap } = useR2();
  const pane = OPTION_BY_KEY[detailKey(selection)];
  return (
    <View style={v143.wrap}>
      <View style={v143.tabs}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable
              key={option.key}
              style={[v143.tab, on ? v143.tabOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(option.key)}>
              <Text style={[v143.tabTitle, on ? v143.tabTitleOn : null]} numberOfLines={1} adjustsFontSizeToFit>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v143.card}>
        <Text style={v143.cardSub} numberOfLines={2}>
          {pane.subtitle}
        </Text>
        <View style={v143.rule} />
        <R2Description />
      </View>
    </View>
  );
};

// =============================================================================
// 144. DEEP TAB CARDS - the folder stack with 18pt deep tabs, each card
//     carrying its subtitle inside under the title
// =============================================================================

const VariantDeepTabCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v144.wrap}>
      <View style={v144.units}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v144.unit} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <View style={[v144.tab, on ? v144.tabOn : null]} />
              <View style={[v144.card, on ? v144.cardOn : null]}>
                <Text style={[v144.title, on ? v144.titleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
                <Text style={v144.subtitle} numberOfLines={1}>
                  {option.subtitle}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 145. THIN TAB CARDS - the folder stack at its thinnest: 10pt tabs over
//     dense 44pt cards of title and one-line subtitle
// =============================================================================

const VariantThinTabCards = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v145.wrap}>
      <View style={v145.units}>
        {R2_OPTIONS.map((option) => {
          const on = isOn(selection, option.key);
          return (
            <Pressable key={option.key} style={v145.unit} hitSlop={HIT_SLOP.md} onPress={() => tap(option.key)}>
              <View style={[v145.tab, on ? v145.tabOn : null]} />
              <View style={[v145.card, on ? v145.cardOn : null]}>
                <Text style={[v145.title, on ? v145.titleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
                <Text style={v145.subtitle} numberOfLines={1}>
                  {option.subtitle}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 146. MODE TRACK + EXTRAS TRACK - one titled card carrying both tracks: a
//     three-slot mode segment up top and a full-width white-days bar with a
//     drawn switch below, each under its own caption
// =============================================================================

const VariantModeTrackExtrasTrack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v146.wrap}>
      <R2Card>
        <Text style={v146.caption}>{TRACK_MODES}</Text>
        <View style={v146.track}>
          {MODE_KEYS.map((key) => {
            const option = OPTION_BY_KEY[key];
            const on = isOn(selection, key);
            return (
              <Pressable
                key={key}
                style={[v146.seg, on ? v146.segOn : null]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(key)}>
                <Text style={[v146.segTitle, on ? v146.segTitleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={v146.caption}>{TRACK_EXTRAS}</Text>
        <View style={[v146.bar, selection.white ? v146.barOn : null]}>
          <Text style={[v146.barTitle, selection.white ? v146.barTitleOn : null]} numberOfLines={1}>
            {OPTION_BY_KEY[K_WHITE].title}
          </Text>
          <R2Switch on={selection.white} onPress={() => tap(K_WHITE)} />
        </View>
      </R2Card>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 147. STACKED GROUP PANELS - the two tracks as separate bordered panels:
//     the mode panel with its segment row stacked over the extras panel
//     with its white-days bar
// =============================================================================

const VariantStackedGroupPanels = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v147.wrap}>
      <View style={v147.panel}>
        <Text style={v147.caption}>{TRACK_MODES}</Text>
        <View style={v147.track}>
          {MODE_KEYS.map((key) => {
            const option = OPTION_BY_KEY[key];
            const on = isOn(selection, key);
            return (
              <Pressable
                key={key}
                style={[v147.seg, on ? v147.segOn : null]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(key)}>
                <Text style={[v147.segTitle, on ? v147.segTitleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[v147.panel, selection.white ? v147.panelOn : null]}>
        <Text style={v147.caption}>{TRACK_EXTRAS}</Text>
        <View style={v147.bar}>
          <Text style={v147.barTitle} numberOfLines={1}>
            {OPTION_BY_KEY[K_WHITE].title}
          </Text>
          <R2Switch on={selection.white} onPress={() => tap(K_WHITE)} />
        </View>
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 148. INLINE GROUP ROWS - each track reads as one row: the caption in a
//     76pt left column and the options inline in a wrapped row to its right
// =============================================================================

const VariantInlineGroupRows = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v148.wrap}>
      <View style={v148.group}>
        <Text style={v148.caption}>{TRACK_MODES}</Text>
        <View style={v148.options}>
          {MODE_KEYS.map((key) => {
            const option = OPTION_BY_KEY[key];
            const on = isOn(selection, key);
            return (
              <Pressable
                key={key}
                style={[v148.chip, on ? v148.chipOn : null]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(key)}>
                <Text style={[v148.chipTitle, on ? v148.chipTitleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={v148.group}>
        <Text style={v148.caption}>{TRACK_EXTRAS}</Text>
        <View style={v148.options}>
          <Pressable
            style={[v148.chip, selection.white ? v148.chipOn : null]}
            hitSlop={HIT_SLOP.md}
            onPress={() => tap(K_WHITE)}>
            <Text style={[v148.chipTitle, selection.white ? v148.chipTitleOn : null]} numberOfLines={1}>
              {OPTION_BY_KEY[K_WHITE].title}
            </Text>
          </Pressable>
        </View>
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 149. WIDE EXTRAS PANEL - a compact three-slot mode track up top and a
//     taller extras panel holding the white-days title, subtitle and switch
// =============================================================================

const VariantWideExtrasPanel = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v149.wrap}>
      <View style={v149.track}>
        {MODE_KEYS.map((key) => {
          const option = OPTION_BY_KEY[key];
          const on = isOn(selection, key);
          return (
            <Pressable
              key={key}
              style={[v149.seg, on ? v149.segOn : null]}
              hitSlop={HIT_SLOP.md}
              onPress={() => tap(key)}>
              <Text style={[v149.segTitle, on ? v149.segTitleOn : null]} numberOfLines={1}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[v149.panel, selection.white ? v149.panelOn : null]}>
        <View style={v149.panelText}>
          <Text style={v149.panelTitle} numberOfLines={1}>
            {OPTION_BY_KEY[K_WHITE].title}
          </Text>
          <Text style={v149.panelSub} numberOfLines={2}>
            {OPTION_BY_KEY[K_WHITE].subtitle}
          </Text>
        </View>
        <R2Switch on={selection.white} onPress={() => tap(K_WHITE)} />
      </View>
      <R2Description />
    </View>
  );
};

// =============================================================================
// 150. COMPACT TWO-TRACK - the two tracks at their tightest: hairline group
//     boxes of minimal padding, the mode segment and the white-days bar
//     stacked with tiny captions
// =============================================================================

const VariantCompactTwoTrack = () => {
  const { selection, tap } = useR2();
  return (
    <View style={v150.wrap}>
      <View style={v150.box}>
        <Text style={v150.caption}>{TRACK_MODES}</Text>
        <View style={v150.track}>
          {MODE_KEYS.map((key) => {
            const option = OPTION_BY_KEY[key];
            const on = isOn(selection, key);
            return (
              <Pressable
                key={key}
                style={[v150.seg, on ? v150.segOn : null]}
                hitSlop={HIT_SLOP.md}
                onPress={() => tap(key)}>
                <Text style={[v150.segTitle, on ? v150.segTitleOn : null]} numberOfLines={1}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[v150.box, selection.white ? v150.boxOn : null]}>
        <Text style={v150.caption}>{TRACK_EXTRAS}</Text>
        <View style={v150.bar}>
          <Text style={v150.barTitle} numberOfLines={1}>
            {OPTION_BY_KEY[K_WHITE].title}
          </Text>
          <R2Switch on={selection.white} onPress={() => tap(K_WHITE)} />
        </View>
      </View>
      <R2Description />
    </View>
  );
};

export const VARIANTS_126_150: Record<string, FastingVariantComponent> = {
  'sidebar-left-hero': VariantSidebarHero,
  'sidebar-mark-slots': VariantSidebarMarkSlots,
  'sidebar-right': VariantRightSidebar,
  'sidebar-wide-slots': VariantWideSidebarSlots,
  'sidebar-dot-column': VariantSidebarDotColumn,
  'drum-horizontal-columns': VariantColumnDrum,
  'drum-horizontal-scale': VariantScaledColumnDrum,
  'drum-horizontal-marker': VariantMarkerColumnDrum,
  'drum-horizontal-pills': VariantPillColumnDrum,
  'drum-horizontal-ruler': VariantRulerColumnDrum,
  'notify-compact-cards': VariantCompactNotificationCards,
  'notify-bold-title': VariantBoldTitleNotificationCards,
  'notify-leading-mark': VariantMarkedNotificationCards,
  'notify-stack-tight': VariantTightNotificationStack,
  'notify-card-desc': VariantNotificationCardsFooter,
  'folder-tab-left': VariantLeftFolderTabCards,
  'folder-tab-center': VariantCenterTabCards,
  'folder-tab-row-tabs': VariantRowOfTabs,
  'folder-tab-deep': VariantDeepTabCards,
  'folder-tab-thin': VariantThinTabCards,
  'two-track-mode-extras': VariantModeTrackExtrasTrack,
  'two-track-stacked-panels': VariantStackedGroupPanels,
  'two-track-inline-groups': VariantInlineGroupRows,
  'two-track-wide-extras': VariantWideExtrasPanel,
  'two-track-compact': VariantCompactTwoTrack,
};

// =============================================================================
// VARIANT 126 STYLES
// =============================================================================

const v126 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  slots: {
    width: 84,
    alignItems: 'center',
    gap: 8,
  },
  slot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  slotOn: {
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
    fontSize: 15,
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
// VARIANT 127 STYLES
// =============================================================================

const v127 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  slots: {
    width: 84,
    gap: 8,
  },
  slot: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  slotOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: 'rgba(80, 21, 181, 0.1)',
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
    fontSize: 15,
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
// VARIANT 128 STYLES
// =============================================================================

const v128 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
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
    fontSize: 15,
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
  slots: {
    width: 84,
    alignItems: 'center',
    gap: 8,
  },
  slot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  slotOn: {
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
});

// =============================================================================
// VARIANT 129 STYLES
// =============================================================================

const v129 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  slots: {
    width: 116,
    gap: 8,
  },
  slot: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.sm,
  },
  slotOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  slotTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  slotTitleOn: {
    color: R2_ON_INK,
  },
  hero: {
    alignSelf: 'stretch',
    gap: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 130 STYLES
// =============================================================================

const v130 = StyleSheet.create({
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  slots: {
    width: 48,
    alignItems: 'center',
    gap: 8,
  },
  slot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  slotOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  letter: {
    fontSize: 14,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.85)',
  },
  letterOn: {
    color: R2_ON_INK,
  },
  dots: {
    width: 16,
    gap: 8,
  },
  dotRow: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
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
// VARIANT 131 STYLES
// =============================================================================

const v131 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
    borderBottomColor: 'rgba(99, 102, 241, 0.18)',
  },
  col: {
    flex: 1,
    height: 96,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  colOn: {
    backgroundColor: R2_PURPLE,
  },
  colOff: {
    opacity: 0.4,
  },
  title: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  titleOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 132 STYLES
// =============================================================================

const v132 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  col: {
    flex: 1,
    height: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  colOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: 'rgba(80, 21, 181, 0.1)',
    transform: [{ scale: 1.06 }],
  },
  colOff: {
    opacity: 0.4,
    transform: [{ scale: 0.85 }],
  },
  title: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 133 STYLES
// =============================================================================

const v133 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  marker: {
    alignSelf: 'center',
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.55)',
    marginBottom: -1,
  },
  band: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
    borderBottomColor: 'rgba(99, 102, 241, 0.18)',
  },
  col: {
    flex: 1,
    height: 84,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    gap: 6,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  colOn: {
    backgroundColor: 'rgba(80, 21, 181, 0.1)',
  },
  colOff: {
    opacity: 0.45,
  },
  title: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  underPill: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  underPillOn: {
    backgroundColor: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 134 STYLES
// =============================================================================

const v134 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flex: 1,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: 6,
  },
  pillOn: {
    height: 104,
    borderWidth: 1.5,
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  pillOff: {
    opacity: 0.4,
  },
  title: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  titleOn: {
    color: R2_ON_INK,
  },
  sub: {
    fontSize: 9,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
  },
  subOn: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

// =============================================================================
// VARIANT 135 STYLES
// =============================================================================

const v135 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  band: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  col: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  colOn: {
    backgroundColor: R2_PURPLE,
  },
  colOff: {
    opacity: 0.4,
  },
  title: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  titleOn: {
    color: R2_ON_INK,
  },
  ruler: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 10,
  },
  tickMajor: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  tickMinor: {
    width: 2,
    height: 5,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
});

// =============================================================================
// VARIANT 136 STYLES
// =============================================================================

const v136 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: 6,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 137 STYLES
// =============================================================================

const v137 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: 6,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: 'rgba(230, 233, 247, 0.6)',
  },
});

// =============================================================================
// VARIANT 138 STYLES
// =============================================================================

const v138 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
    minHeight: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: 6,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  markCol: {
    width: 18,
    alignItems: 'center',
  },
  mark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  markOn: {
    backgroundColor: R2_PURPLE,
    borderColor: R2_PURPLE_BORDER,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 139 STYLES
// =============================================================================

const v139 = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  card: {
    minHeight: 40,
    justifyContent: 'center',
    gap: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: 4,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 140 STYLES
// =============================================================================

const v140 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  card: {
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: 6,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  footer: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: SPACING.sm,
  },
});

// =============================================================================
// VARIANT 141 STYLES
// =============================================================================

const v141 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  units: {
    alignSelf: 'stretch',
  },
  unit: {
    alignSelf: 'stretch',
  },
  tab: {
    width: 28,
    height: 16,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  tabOn: {
    borderColor: R2_PURPLE,
    backgroundColor: R2_PURPLE,
  },
  card: {
    justifyContent: 'center',
    minHeight: 48,
    borderTopLeftRadius: 2,
    borderTopRightRadius: RADIUS.md,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    marginBottom: -1,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 142 STYLES
// =============================================================================

const v142 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  units: {
    alignSelf: 'stretch',
  },
  unit: {
    alignSelf: 'stretch',
  },
  tab: {
    alignSelf: 'center',
    width: 36,
    height: 16,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  tabOn: {
    borderColor: R2_PURPLE,
    backgroundColor: R2_PURPLE,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    marginBottom: -1,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  titleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 143 STYLES
// =============================================================================

const v143 = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  tabs: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: 2,
  },
  tabOn: {
    borderColor: R2_PURPLE,
    backgroundColor: R2_PURPLE,
  },
  tabTitle: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  tabTitleOn: {
    color: R2_ON_INK,
  },
  card: {
    alignSelf: 'stretch',
    gap: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: SPACING.smd,
  },
  cardSub: {
    fontSize: 13,
    fontFamily: ty.familyRegular,
    color: COLORS.text.primary,
  },
  rule: {
    height: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
  },
});

// =============================================================================
// VARIANT 144 STYLES
// =============================================================================

const v144 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  units: {
    alignSelf: 'stretch',
  },
  unit: {
    alignSelf: 'stretch',
  },
  tab: {
    width: 32,
    height: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  tabOn: {
    borderColor: R2_PURPLE,
    backgroundColor: R2_PURPLE,
  },
  card: {
    gap: 2,
    minHeight: 54,
    justifyContent: 'center',
    borderTopLeftRadius: 2,
    borderTopRightRadius: RADIUS.md,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    paddingVertical: 6,
    marginBottom: -1,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 145 STYLES
// =============================================================================

const v145 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  units: {
    alignSelf: 'stretch',
  },
  unit: {
    alignSelf: 'stretch',
  },
  tab: {
    width: 24,
    height: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  tabOn: {
    borderColor: R2_PURPLE,
    backgroundColor: R2_PURPLE,
  },
  card: {
    gap: 1,
    height: 44,
    justifyContent: 'center',
    borderTopLeftRadius: 2,
    borderTopRightRadius: RADIUS.md,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
    marginBottom: -1,
  },
  cardOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  title: {
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  titleOn: {
    color: R2_PURPLE,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 146 STYLES
// =============================================================================

const v146 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  caption: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.7)',
  },
  track: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  segOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  segTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  segTitleOn: {
    color: R2_ON_INK,
  },
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: SPACING.smd,
  },
  barOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  barTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  barTitleOn: {
    color: R2_PURPLE,
  },
});

// =============================================================================
// VARIANT 147 STYLES
// =============================================================================

const v147 = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  panel: {
    alignSelf: 'stretch',
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: SPACING.smd,
  },
  panelOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  caption: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.7)',
  },
  track: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  segOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  segTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  segTitleOn: {
    color: R2_ON_INK,
  },
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
  },
  barTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 148 STYLES
// =============================================================================

const v148 = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  group: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
  },
  caption: {
    width: 76,
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.7)',
  },
  options: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    paddingHorizontal: SPACING.smd,
  },
  chipOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  chipTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  chipTitleOn: {
    color: R2_ON_INK,
  },
});

// =============================================================================
// VARIANT 149 STYLES
// =============================================================================

const v149 = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  track: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  segOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  segTitle: {
    fontSize: 11,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  segTitleOn: {
    color: R2_ON_INK,
  },
  panel: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.smd,
    minHeight: 64,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: SPACING.smd,
  },
  panelOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  panelText: {
    flex: 1,
    gap: 3,
  },
  panelTitle: {
    fontSize: 14,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  panelSub: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 150 STYLES
// =============================================================================

const v150 = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  box: {
    alignSelf: 'stretch',
    gap: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.16)',
    padding: SPACING.sm,
  },
  boxOn: {
    borderColor: R2_PURPLE,
    backgroundColor: 'rgba(80, 21, 181, 0.08)',
  },
  caption: {
    fontSize: 9,
    fontFamily: ty.familyMedium,
    color: 'rgba(230, 233, 247, 0.6)',
  },
  track: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 5,
  },
  seg: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  segOn: {
    borderColor: R2_PURPLE_BORDER,
    backgroundColor: R2_PURPLE,
  },
  segTitle: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  segTitleOn: {
    color: R2_ON_INK,
  },
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  barTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

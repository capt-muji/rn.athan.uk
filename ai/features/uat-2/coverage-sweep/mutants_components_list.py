#!/usr/bin/env python3
"""Mutation pass for the prayer-list component tests: python3 ai/features/uat-2/coverage-sweep/mutants_components_list.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

OVERLAY = 'components/overlay/overlayContent.ts'
PILL = 'components/prayer/activePill.ts'
DAY = 'components/day/shownDate.ts'
PRESS = 'components/prayer/rowPress.ts'

mutate.MUTATIONS[:] = [
    # --- the overlay's row and explanation ---
    (OVERLAY, 'return displayRow >= 0 ? displayRow : selectedPrayerIndex;', 'return selectedPrayerIndex;', 'overlay row read as the sequence index'),
    (OVERLAY, 'canonicalDisplayOrder(todayPrayers, type)', 'canonicalDisplayOrder(todayPrayers, ScheduleType.Standard)', 'Extras overlay row in sequence order'),
    (OVERLAY, 'prayers.filter((p) => p.belongsToDate === displayDate)', 'prayers', 'overlay row from the whole sequence'),
    (OVERLAY, 'displayRow >= 0 ? displayRow : selectedPrayerIndex', 'displayRow >= 0 ? displayRow : 0', 'row gone from the list falls to row 0'),
    (OVERLAY, 'displayRow >= 0 ?', 'displayRow > 0 ?', 'first drawn row read as missing'),
    (OVERLAY, 'EXTRAS_ENGLISH.indexOf(english)', 'EXTRAS_ENGLISH.indexOf(english) + 1', "the next prayer's explanation"),
    (OVERLAY, 'EXTRAS_EXPLANATIONS_ARABIC[explanationIndex]', 'EXTRAS_EXPLANATIONS_ARABIC[0]', "Midnight's Arabic explanation for every row"),
    (OVERLAY, 'prayerName: isExtra ? english : null', 'prayerName: english', 'Standard box given a name'),
    (OVERLAY, 'const isExtra = type === ScheduleType.Extra;', 'const isExtra = true;', 'Standard given an explanation'),

    # --- the active pill ---
    (PILL, 'canonicalDisplayOrder(todayPrayers, type).indexOf(nextPrayerIndex)', 'nextPrayerIndex', 'pill row read as the sequence index'),
    (PILL, 'prayers.filter((p) => p.belongsToDate === displayDate)', 'prayers', 'pill row from the whole sequence'),
    (PILL, 'todayPrayers.findIndex((p) => p.isNext)', 'todayPrayers.findIndex((p) => !p.isPassed)', 'pill on the first row not passed'),
    (PILL, 'overlay.isOn && overlay.scheduleType', 'overlay.scheduleType', 'a closed overlay still hides the pill'),
    (PILL, ' && overlay.scheduleType === type', '', "the other page's overlay hides the pill"),
    (PILL, 'overlay.selectedPrayerIndex !== nextPrayerIndex', 'overlay.selectedPrayerIndex !== canonicalDisplayOrder(prayers.filter((p) => p.belongsToDate === displayDate), type).indexOf(nextPrayerIndex)', 'selection compared with the drawn row'),
    (PILL, 'getPillRow(nextPrayerVisualRow, heldRow)', 'getPillRow(nextPrayerVisualRow, 0)', 'faded pill jumps to row 0'),
    (PILL, 'getPillOpacity(nextPrayerIndex, isHiddenByOverlay)', 'getPillOpacity(nextPrayerIndex, false)', 'overlay never hides the pill'),

    # --- the date on the Day header ---
    (DAY, '(showOverlayDate ? overlayDate : displayDate)', '(displayDate)', "overlay shows the list's date, not the occurrence's"),
    (DAY, '(showOverlayDate ? overlayDate : displayDate)', '(overlayDate || displayDate)', "closed overlay shows row 0's occurrence date"),
    (DAY, 'if (!dateSource) return', 'if (dateSource === null) return', 'an empty date reaches the formatter'),
    (DAY, "  if (!dateSource) return '';\n", '', 'no list day reaches the formatter'),
    (DAY, 'hijriEnabled ? formatHijriDateLong(dateSource) : formatDateLong(dateSource)', 'formatDateLong(dateSource)', 'Hijri setting ignored'),
    (DAY, 'hijriEnabled ? formatHijriDateLong(dateSource) : formatDateLong(dateSource)', 'formatHijriDateLong(dateSource)', 'Hijri shown whatever the setting'),

    # --- a tap on a prayer row ---
    (PRESS, "english === 'Istijaba'", "english === 'Duha'", 'guard on the wrong prayer'),
    (PRESS, ' && isPassed) return', ') return', 'an Istijaba still to come will not open'),
    (PRESS, "isSelectedForOverlay ? 'close' : 'open'", "isSelectedForOverlay ? 'open' : 'close'", 'close and open swapped'),
    (PRESS, "return 'none';", "return 'open';", 'a passed Istijaba opens'),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])

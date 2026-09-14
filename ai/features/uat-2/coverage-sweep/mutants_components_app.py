#!/usr/bin/env python3
"""Mutation pass for the sheets, modals, ui and app tests: python3 ai/features/uat-2/coverage-sweep/mutants_components_app.py"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mutate', os.path.join(HERE, '..', 'mutate.py'))
mutate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mutate)

mutate.MUTATIONS[:] = [
    # --- components/sheets/screens/alertDraft.ts ---
    ('components/sheets/screens/alertDraft.ts', 'storedReminder === AlertType.Sound ? AlertType.Sound : AlertType.Silent', 'storedReminder === AlertType.Silent ? AlertType.Silent : AlertType.Sound', 'an Off reminder opens on the sound'),
    ('components/sheets/screens/alertDraft.ts', '? AlertType.Sound : AlertType.Silent', '? AlertType.Sound : storedReminder', 'an Off reminder opens on Off'),
    ('components/sheets/screens/alertDraft.ts', 'validateReminderInterval(storedInterval) ?', 'storedInterval ?', 'any non-zero stored interval kept'),
    ('components/sheets/screens/alertDraft.ts', ': DEFAULT_REMINDER_INTERVAL;', ': (15 as ReminderInterval);', 'a stale interval opens on 15, not the default'),
    ('components/sheets/screens/alertDraft.ts', 'selected !== AlertType.Off && atTimeAlert === AlertType.Off', 'selected !== AlertType.Off', 'asks on every pick that can fire'),
    ('components/sheets/screens/alertDraft.ts', 'selected !== AlertType.Off && atTimeAlert === AlertType.Off', 'atTimeAlert === AlertType.Off', 'asks when Off is picked from Off'),
    ('components/sheets/screens/alertDraft.ts', '  if (!canEnableReminder) return null;\n', '', 'reminder toggles while the athan is Off'),
    ('components/sheets/screens/alertDraft.ts', 'isReminderOn ? AlertType.Off : reminderType', 'isReminderOn ? AlertType.Off : AlertType.Silent', 'switching on forgets the chosen sound'),
    ('components/sheets/screens/alertDraft.ts', 'isReminderOn ? AlertType.Off : reminderType', 'isReminderOn ? reminderType : AlertType.Off', 'toggle inverted'),

    # --- components/sheets/parts/reminderStep.ts ---
    ('components/sheets/parts/reminderStep.ts', 'index <= 0', 'index < 0', 'minus live at the first interval'),
    ('components/sheets/parts/reminderStep.ts', 'index >= REMINDER_INTERVALS.length - 1', 'index > REMINDER_INTERVALS.length - 1', 'plus live at the last interval'),
    ('components/sheets/parts/reminderStep.ts', 'step < 0 ?', 'step > 0 ?', 'each arrow checks the other end'),
    ('components/sheets/parts/reminderStep.ts', 'REMINDER_INTERVALS[index + step]', 'REMINDER_INTERVALS[index - step]', 'arrows move the wrong way'),
    ('components/sheets/parts/reminderStep.ts', 'REMINDER_INTERVALS[index + step]', 'REMINDER_INTERVALS[index + step * 2]', 'a press skips an interval'),
    ('components/sheets/parts/reminderStep.ts', 'if (atEnd) return null;', 'if (atEnd || index < 0) return null;', 'an off-list value is stuck'),

    # --- shared/launchGate.ts ---
    ('shared/launchGate.ts', "!sequenceReady && syncState === 'loading'", "!sequenceReady || syncState === 'loading'", 'a warm launch shows the spinner while sync loads'),
    ('shared/launchGate.ts', "syncState === 'loading'", "syncState !== 'hasData'", 'a failed cold sync keeps the spinner up'),
    ('shared/launchGate.ts', '!coldLaunch && contentExists', 'contentExists', 'a cold launch waits for the launch art'),
    ('shared/launchGate.ts', '!coldLaunch && contentExists', '!coldLaunch', 'a warm launch reveals before content'),
    ('shared/launchGate.ts', 'contentExists && masjidIconLoaded', 'contentExists', 'reveal without the Masjid icon'),
    ('shared/launchGate.ts', '(!decorationsExpected || decorationsLoaded)', 'decorationsLoaded', 'waits for decorations that never render'),
    ('shared/launchGate.ts', ' && (!decorationsExpected || decorationsLoaded)', '', 'reveal before Ramadan decorations load'),

    # --- components/sheets/screens/soundSheet.ts: selection ---
    ('components/sheets/screens/soundSheet.ts', 'draft ?? saved', 'draft || saved', 'a pick of Athan 1 highlights the saved athan'),
    ('components/sheets/screens/soundSheet.ts', 'draft ?? saved', 'saved', 'a tapped row is never highlighted'),
    ('components/sheets/screens/soundSheet.ts', 'draft !== null', 'Boolean(draft)', 'a pick of Athan 1 is never saved'),
    ('components/sheets/screens/soundSheet.ts', 'draft !== null', 'draft === null', 'commit decision inverted'),

    # --- components/sheets/screens/soundSheet.ts: preview player ---
    ('components/sheets/screens/soundSheet.ts', 'if (playingIndex === null || statusId !== playerId) return false;', 'if (playingIndex === null) return false;', "released player's status ends a new preview"),
    ('components/sheets/screens/soundSheet.ts', 'currentTime >= duration - 0.1', 'currentTime >= duration', 'no tolerance at the end of the clip'),
    ('components/sheets/screens/soundSheet.ts', 'currentTime >= duration - 0.1', 'currentTime >= duration - 0.5', 'a pause near the end ends the preview'),
    ('components/sheets/screens/soundSheet.ts', 'return !playing && currentTime > 0', 'return currentTime > 0', 'a preview still playing is ended'),
    ('components/sheets/screens/soundSheet.ts', 'currentTime > 0 && duration > 0 && currentTime', 'currentTime > 0 && currentTime', 'a player with no length yet is ended'),
    ('components/sheets/screens/soundSheet.ts', '!playing && currentTime > 0 && duration > 0', '!playing && duration > 0', 'a player that has not moved is ended'),
    ('components/sheets/screens/soundSheet.ts', '  if (playingIndex === null) return 0;\n', '', 'a count shown with nothing playing'),
    ('components/sheets/screens/soundSheet.ts', 'statusId === playerId && duration > 0', 'duration > 0', "released player's leftover seconds shown"),
    ('components/sheets/screens/soundSheet.ts', 'statusId === playerId && duration > 0', 'statusId === playerId', 'an unreported length shows 0 instead of the table'),
    ('components/sheets/screens/soundSheet.ts', 'Math.round(duration - currentTime)', 'Math.floor(duration - currentTime)', 'countdown floored, one second low'),
    ('components/sheets/screens/soundSheet.ts', 'Math.max(0, Math.round(duration - currentTime))', 'Math.round(duration - currentTime)', 'negative count on overshoot'),
    ('components/sheets/screens/soundSheet.ts', 'tabulatedSeconds[playingIndex]', 'tabulatedSeconds[playingIndex + 1]', "the next row's tabulated seconds"),
]

if __name__ == '__main__':
    mutate.main(sys.argv[1:])

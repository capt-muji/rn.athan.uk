/**
 * Help content - the answers to "why did I not hear the athan?"
 *
 * Every cause here is an OS setting no code can change, so the app names WHAT to turn on and never
 * how to get there: a navigation path is version-specific and goes stale (owner, 2026-09-27, after
 * following the old iOS steps and finding they led to the wrong screen). Nothing explains how the
 * app works internally either; a user only needs the fix.
 *
 * Every claim was measured: session 27 for the mute switch and the 30 second cap, session 25 for the
 * alarm volume.
 *
 * The app is never named, because it may be renamed (owner, 2026-09-27).
 *
 * @see ai/plans/27-silent-mode-bypass/FINDINGS.md
 */

import { type TranslationKey, t } from '@/shared/i18n';

/**
 * A settings screen an answer can offer to open
 *
 * Only Do Not Disturb access, because it is the one screen a deep link reaches reliably. Every other
 * fix names the setting to change instead (owner, 2026-09-27), so there is no generic settings link.
 */
export type HelpAction = 'dndAccess';

interface HelpAnswerKeys {
  text: TranslationKey;
  /** What to turn on or off, one per line. Never a route to it */
  steps?: readonly TranslationKey[];
  action?: HelpAction;
}

interface HelpEntryKeys {
  question: TranslationKey;
  ios: HelpAnswerKeys | null;
  android: HelpAnswerKeys | null;
}

/** One question as one platform sees it */
export interface HelpTopic {
  question: string;
  text: string;
  steps?: string[];
  action?: HelpAction;
}

export const HELP_ACTION_LABELS: Record<HelpAction, string> = {
  dndAccess: t('help.action.dndAccess'),
};

/** Ordered by how often each one turns out to be the cause */
const HELP_ENTRIES: readonly HelpEntryKeys[] = [
  // Nothing arrives at all: permission first, then the two things that stop new ones being set
  {
    question: 'help.q.none',
    ios: {
      text: 'help.a.none',
      steps: ['help.step.allowNotificationsIos'],
    },
    android: {
      text: 'help.a.none',
      steps: ['help.step.allowNotificationsAndroid', 'help.step.leaveAthanCategories'],
    },
  },
  {
    question: 'help.q.stopAfterDays',
    ios: {
      text: 'help.a.stopAfterDays.ios',
      steps: ['help.step.backgroundRefresh', 'help.step.lowPowerMode'],
    },
    android: {
      text: 'help.a.stopAfterDays.android',
      steps: ['help.step.batteryUnrestricted', 'help.step.batterySaver'],
    },
  },
  {
    question: 'help.q.stopAfterRestart',
    ios: {
      text: 'help.a.stopAfterRestart',
      steps: ['help.step.openAfterReboot'],
    },
    android: {
      text: 'help.a.stopAfterRestart',
      steps: ['help.step.openAfterReboot'],
    },
  },

  // They arrive, but the phone silences them
  {
    question: 'help.q.noSound',
    ios: {
      text: 'help.a.noSound',
      steps: ['help.step.silentMode'],
    },
    android: {
      text: 'help.a.noSound',
      steps: ['help.step.silentMode'],
    },
  },
  {
    question: 'help.q.dndTimes',
    ios: {
      text: 'help.a.dndTimes.ios',
      steps: ['help.step.timeSensitive', 'help.step.focusAllow'],
    },
    android: {
      text: 'help.a.dndTimes.android',
      steps: ['help.step.dndAccess'],
      action: 'dndAccess',
    },
  },
  {
    question: 'help.q.quiet',
    ios: null,
    android: {
      text: 'help.a.quiet',
      steps: ['help.step.alarmVolume'],
    },
  },

  // The sound itself, which no setting changes
  {
    question: 'help.q.cutoff',
    ios: {
      text: 'help.a.cutoff',
    },
    android: {
      text: 'help.a.cutoff',
    },
  },
];

/**
 * The questions one platform answers, in order
 *
 * @param os The platform the app is running on
 * @returns Every topic that platform has an answer for
 */
export const getHelpTopics = (os: 'ios' | 'android'): HelpTopic[] =>
  HELP_ENTRIES.flatMap((entry) => {
    const answer = os === 'ios' ? entry.ios : entry.android;
    if (!answer) return [];

    const steps = answer.steps?.map((step) => t(step));
    return [{ question: t(entry.question), text: t(answer.text), steps, action: answer.action }];
  });

/**
 * Help content - the answers to "why did I not hear the athan?" and to support questions
 *
 * Every cause here is an OS setting no code can change, and a support question carries no steps,
 * so the app names WHAT to turn on and never how to get there: a navigation path is
 * version-specific and goes stale. Nothing explains how the app works internally
 * either; a user only needs the fix.
 *
 * Every claim was measured on device: the mute switch, the 30 second cap, the
 * alarm volume.
 *
 * The app is never named, because it may be renamed.
 *
 * @see ai/plans/27-silent-mode-bypass/FINDINGS.md
 */

import { type TranslationKey, t } from '@/shared/i18n';

/**
 * A settings screen an answer can offer to open
 *
 * Only Do Not Disturb access, because it is the one screen a deep link reaches reliably. Every other
 * fix names the setting to change instead, so there is no generic settings link.
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
  ios: HelpAnswerKeys;
  android: HelpAnswerKeys;
}

/** One question as one platform sees it */
export interface HelpTopic {
  question: string;
  text: string;
  steps?: string[];
  action?: HelpAction;
}

/** The pinned Latin platform labels a widget answer line opens with, in every shipped locale (D142.11) */
const PLATFORM_LABEL = /^(iOS|Android): /;

/**
 * One answer line split into its platform label run and its sentence, or null when the line
 * carries no label. The labels are Latin in every catalog, so the split happens here at render
 * time and the byte-pinned copy and its hash lock stay as they are.
 */
export const splitPlatformLine = (line: string): { label: string; rest: string } | null => {
  const match = line.match(PLATFORM_LABEL);
  return match ? { label: match[0], rest: line.slice(match[0].length) } : null;
};

/** The label of each action a settings screen can offer, resolved at call time (R1.3) */
export const getHelpActionLabels = (): Record<HelpAction, string> => ({
  dndAccess: t('help.action.dndAccess'),
});

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
    question: 'help.q.volume',
    ios: {
      text: 'help.a.volume.ios',
    },
    android: {
      text: 'help.a.volume.android',
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

  // A support question, not a cause, so it goes last and names nothing to change
  {
    question: 'help.q.widgets',
    ios: {
      text: 'help.a.widgets',
    },
    android: {
      text: 'help.a.widgets',
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
    const steps = answer.steps?.map((step) => t(step));
    return [{ question: t(entry.question), text: t(answer.text), steps, action: answer.action }];
  });

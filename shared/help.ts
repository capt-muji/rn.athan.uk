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

/**
 * A settings screen an answer can offer to open
 *
 * Only Do Not Disturb access, because it is the one screen a deep link reaches reliably. Every other
 * fix names the setting to change instead (owner, 2026-09-27), so there is no generic settings link.
 */
export type HelpAction = 'dndAccess';

interface HelpAnswer {
  text: string;
  /** What to turn on or off, one per line. Never a route to it */
  steps?: string[];
  action?: HelpAction;
}

interface HelpEntry {
  question: string;
  ios: HelpAnswer | null;
  android: HelpAnswer | null;
}

/** One question as one platform sees it */
export interface HelpTopic {
  question: string;
  text: string;
  steps?: string[];
  action?: HelpAction;
}

export const HELP_ACTION_LABELS: Record<HelpAction, string> = {
  dndAccess: 'Grant Do Not Disturb access',
};

/** Ordered by how often each one turns out to be the cause */
const HELP_ENTRIES: HelpEntry[] = [
  // Nothing arrives at all: permission first, then the two things that stop new ones being set
  {
    question: "Why don't I get any notifications?",
    ios: {
      text: 'Without permission, notifications cannot be shown.',
      steps: ['Turn on Allow Notifications in the app settings'],
    },
    android: {
      text: 'Without permission, notifications cannot be shown.',
      steps: ['Turn on notifications in the app settings', 'Leave the athan categories on'],
    },
  },
  {
    question: 'Why did notifications stop after a few days?',
    ios: {
      text: 'Two settings stop new notifications being sent.',
      steps: ['Turn on Background App Refresh in the app settings', 'Turn off Low Power Mode'],
    },
    android: {
      text: 'Battery optimisation stops new notifications being sent.',
      steps: ['Set battery usage to Unrestricted in the app settings', 'Turn off Battery Saver'],
    },
  },
  {
    question: 'Why did notifications stop after a restart?',
    ios: {
      text: 'After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.',
      steps: ['Open this app after rebooting the phone'],
    },
    android: {
      text: 'After rebooting the phone, the app is terminated.\nThis stops new notifications being sent.',
      steps: ['Open this app after rebooting the phone'],
    },
  },

  // They arrive, but the phone silences them
  {
    question: 'Why does a notification show but play no sound?',
    ios: {
      text: 'A silent phone mutes notification sound.',
      steps: ['Take the phone out of silent mode'],
    },
    android: {
      text: 'A silent phone mutes notification sound.',
      steps: ['Take the phone out of silent mode'],
    },
  },
  {
    question: 'Why are notifications silenced at certain times?',
    ios: {
      text: 'Focus and Do Not Disturb modes silence notifications until this app is allowed through.',
      steps: ['Allow Time Sensitive Notifications in the app settings', 'Allow this app in each Focus you use'],
    },
    android: {
      text: 'Do Not Disturb mode silences notifications until this app is allowed through.',
      steps: ['Allow Do Not Disturb access'],
      action: 'dndAccess',
    },
  },
  {
    question: 'Why is the athan so quiet?',
    ios: null,
    android: {
      text: 'It plays at alarm volume, not ring volume.',
      steps: ['Raise the Alarm volume in your sound settings'],
    },
  },

  // The sound itself, which no setting changes
  {
    question: 'Why does the athan cut off early?',
    ios: {
      text: 'Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.',
    },
    android: {
      text: 'Notification sounds are limited to 30 seconds.\nEvery athan is trimmed to fit.',
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

    return [{ question: entry.question, text: answer.text, steps: answer.steps, action: answer.action }];
  });

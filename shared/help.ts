/**
 * Help content - the answers to "why did I not hear the athan?"
 *
 * Three of the causes are OS settings no code can change, so the app explains
 * them instead of trying to work around them (owner, 2026-09-27). Every claim
 * here was measured: session 27 for the mute switch, Do Not Disturb and the
 * 30 second sound cap, session 25 for the alarm volume.
 *
 * The app is never named, because it may be renamed (owner, 2026-09-27).
 *
 * @see ai/plans/27-silent-mode-bypass/FINDINGS.md
 */

/** A settings screen an answer can offer to open */
export type HelpAction = 'appSettings' | 'dndAccess';

interface HelpAnswer {
  text: string;
  /** Ordered instructions, rendered as a numbered list */
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
  appSettings: 'Open Settings',
  dndAccess: 'Grant Do Not Disturb access',
};

/** Ordered by how often each one turns out to be the cause */
const HELP_ENTRIES: HelpEntry[] = [
  {
    question: 'Notifications are turned off',
    ios: {
      text: 'Without permission this app cannot alert you at all.',
      steps: ['Open Settings below', 'Turn on Allow Notifications', 'Leave Sounds on'],
      action: 'appSettings',
    },
    android: {
      text: 'Without permission this app cannot alert you at all.',
      steps: ['Open Settings below', 'Turn notifications on', 'Leave the athan categories on'],
      action: 'appSettings',
    },
  },
  {
    question: 'Background activity is off',
    ios: {
      text: 'Alerts are topped up in the background. Turned off, the ones already set still play and no new ones are added.',
      steps: ['Open Settings below', 'Turn on Background App Refresh', 'Turn off Low Power Mode'],
      action: 'appSettings',
    },
    android: {
      text: 'Alerts are topped up in the background. Battery saving can stop that, so no new ones are added.',
      steps: ['Open Settings below', 'Allow background activity', 'Set battery use to unrestricted'],
      action: 'appSettings',
    },
  },
  {
    question: 'The silence switch is on',
    ios: {
      text: 'It mutes notification sound before any app is asked. No app can play through it.',
      steps: ['Flick the switch on the side of your phone', 'Or turn Silent off in Control Centre'],
    },
    android: {
      text: 'Silent mode mutes notification sound before any app is asked. No app can play through it.',
      steps: ['Press the volume up key', 'Or turn Silent off in quick settings'],
    },
  },
  {
    question: 'Do Not Disturb is on',
    ios: {
      text: 'It holds notifications back unless this app is allowed through.',
      steps: ['Open Settings, then Focus', 'Pick the mode you use', 'Under Apps, add this app'],
    },
    android: {
      text: 'It silences notifications until you allow this app through.',
      steps: ['Open the screen below', 'Allow Do Not Disturb access'],
      action: 'dndAccess',
    },
  },
  {
    question: 'The athan stops before it finishes',
    ios: {
      text: 'Phones play 30 seconds of a notification sound, then fall back to the default tone. Every athan is trimmed to fit.',
    },
    android: {
      text: 'Phones play 30 seconds of a notification sound, then fall back to the default tone. Every athan is trimmed to fit.',
    },
  },
  {
    question: 'Nothing played after a restart',
    ios: null,
    android: {
      text: 'A restart clears every alarm, and some phones block them being set again.',
      steps: ['Open this app once after a restart'],
    },
  },
  {
    question: 'The athan is too quiet',
    ios: null,
    android: {
      text: 'It plays at alarm volume, not ring volume.',
      steps: ['Raise Alarm volume in your sound settings'],
    },
  },
  {
    question: 'Changing the athan sound',
    ios: {
      text: 'Open Settings, then Change athan, and pick the one you want.',
    },
    android: {
      text: 'Open Settings, then Change athan, and pick the one you want.',
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

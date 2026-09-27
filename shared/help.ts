/**
 * Help content - the answers to "why did I not hear the athan?"
 *
 * Three of the causes are OS settings no code can change, so the app explains
 * them instead of trying to work around them (owner, 2026-09-27). Every claim
 * here was measured: session 27 for the mute switch, Do Not Disturb and the
 * 30 second sound cap, session 28 for how far ahead alerts are set, session 20
 * for the widget horizon.
 *
 * @see ai/plans/27-silent-mode-bypass/FINDINGS.md
 */

/** A settings screen an answer can offer to open */
export type HelpAction = 'appSettings' | 'dndAccess';

interface HelpAnswer {
  text: string;
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
  action?: HelpAction;
}

export const HELP_ACTION_LABELS: Record<HelpAction, string> = {
  appSettings: 'Open Settings',
  dndAccess: 'Grant Do Not Disturb access',
};

/** Ordered by how often each one turns out to be the cause */
const HELP_ENTRIES: HelpEntry[] = [
  {
    question: 'Are notifications turned on for Athan?',
    ios: {
      text: 'Athan cannot alert you without notification permission. Open Settings, then turn Allow Notifications on, and leave Sounds on with it.',
      action: 'appSettings',
    },
    android: {
      text: 'Athan cannot alert you without notification permission. Open Settings, then turn notifications on for Athan.',
      action: 'appSettings',
    },
  },
  {
    question: 'Is background activity allowed?',
    ios: {
      text: 'Athan sets the next days of alerts while you are not using it. With Background App Refresh off, the alerts already set still fire, and no new ones are added. Low Power Mode switches it off as well.',
      action: 'appSettings',
    },
    android: {
      text: 'Athan sets the next days of alerts while you are not using it. Battery saving can stop that, so the alerts already set still fire and no new ones are added. Allow background activity for Athan.',
      action: 'appSettings',
    },
  },
  {
    question: 'Is the silent switch on?',
    ios: {
      text: 'The mute switch silences notification sound before any app is consulted, so the alert arrives without a sound. No app setting can play through it. Turn the switch off to hear the athan.',
    },
    android: {
      text: 'Silent mode silences notification sound before any app is consulted, so the alert arrives without a sound. No app setting can play through it. Turn silent mode off to hear the athan.',
    },
  },
  {
    question: 'Is Do Not Disturb or a Focus on?',
    ios: {
      text: 'A Focus holds notifications back unless Athan is allowed through it. Open Settings, then Focus, then the mode you use, then Apps, and add Athan.',
    },
    android: {
      text: 'Do Not Disturb silences notifications by policy. Athan asks to be allowed through, and Android grants that only once you give it Do Not Disturb access.',
      action: 'dndAccess',
    },
  },
  {
    question: 'Why does the athan stop before it finishes?',
    ios: {
      text: 'iOS plays 30 seconds of a notification sound and falls back to the default tone for anything longer, so every athan is trimmed to fit.',
    },
    android: {
      text: 'Android plays 30 seconds of a notification sound and falls back to the default tone for anything longer, so every athan is trimmed to fit.',
    },
  },
  {
    question: 'How far ahead are alerts set?',
    ios: {
      text: 'Athan fills the days ahead with as many alerts as iOS lets one app hold. The fewer prayers you switch on, the further ahead it reaches. Opening the app tops it up.',
    },
    android: {
      text: 'Athan fills the days ahead with as many alerts as it may hold at once. The fewer prayers you switch on, the further ahead it reaches. Opening the app tops it up.',
    },
  },
  {
    question: 'I restarted my phone and heard nothing.',
    ios: null,
    android: {
      text: 'Android clears every alarm when the phone restarts, and some phones stop Athan setting them again on its own. Open Athan once after a restart.',
    },
  },
  {
    question: 'The athan plays too quietly.',
    ios: null,
    android: {
      text: 'The athan plays at your alarm volume rather than your ringer volume. Raise the alarm volume in your phone sound settings.',
    },
  },
  {
    question: 'My widget shows an old time.',
    ios: {
      text: 'A widget redraws on the schedule iOS gives it, so it can sit a while behind. Open Athan to refresh it. After three days with no refresh a widget reads Out of date rather than showing a time that may be wrong.',
    },
    android: {
      text: 'A widget redraws on the schedule Android gives it, so it can sit a while behind. Open Athan to refresh it. After three days with no refresh a widget reads Out of date rather than showing a time that may be wrong.',
    },
  },
  {
    question: 'Can I change the athan sound?',
    ios: {
      text: 'Yes. Open Settings from the mosque button, then Change athan, and pick the one you want.',
    },
    android: {
      text: 'Yes. Open Settings from the mosque button, then Change athan, and pick the one you want.',
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

    return [{ question: entry.question, text: answer.text, action: answer.action }];
  });

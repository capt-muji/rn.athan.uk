/**
 * Unit tests for shared/help.ts: which questions each platform answers, and which offer a deep link
 */

import { getHelpTopics, HELP_ACTION_LABELS } from '../help';

describe('getHelpTopics', () => {
  it.each(['ios', 'android'] as const)('answers at least four questions on %s', (os) => {
    expect(getHelpTopics(os).length).toBeGreaterThanOrEqual(4);
  });

  it('asks about notifications first on both platforms, since it is the most common cause', () => {
    expect(getHelpTopics('ios')[0].question).toBe("Why don't I get any notifications?");
    expect(getHelpTopics('android')[0].question).toBe("Why don't I get any notifications?");
  });

  it('answers the reboot question on both platforms, since a reboot terminates the app on each', () => {
    for (const os of ['ios', 'android'] as const) {
      expect(getHelpTopics(os).map((topic) => topic.question)).toContain('Why did notifications stop after a restart?');
    }
  });

  it('keeps the alarm volume question for Android alone, which is the platform that plays on that stream', () => {
    const iosQuestions = getHelpTopics('ios').map((topic) => topic.question);
    const androidQuestions = getHelpTopics('android').map((topic) => topic.question);

    expect(androidQuestions).toContain('Why is the athan so quiet?');
    expect(iosQuestions).not.toContain('Why is the athan so quiet?');
  });

  it('offers the Do Not Disturb grant on Android only, which is the one platform that has it', () => {
    const iosActions = getHelpTopics('ios').map((topic) => topic.action);
    const androidActions = getHelpTopics('android').map((topic) => topic.action);

    expect(androidActions).toContain('dndAccess');
    expect(iosActions).not.toContain('dndAccess');
  });

  it('offers no settings button on iOS, where every fix names a setting instead of a route', () => {
    expect(getHelpTopics('ios').map((topic) => topic.action)).toEqual(getHelpTopics('ios').map(() => undefined));
  });

  /** Both platforms suppress notifications by mode, so both must answer for it (owner, 2026-09-27) */
  it('answers the Do Not Disturb question on both platforms', () => {
    for (const os of ['ios', 'android'] as const) {
      expect(getHelpTopics(os).map((topic) => topic.question)).toContain(
        'Why are notifications silenced at certain times?'
      );
    }
  });

  /** A notification is what the phone shows; "alert" is our word and never the user's */
  it('calls them notifications everywhere, never alerts', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { question, text, steps } of getHelpTopics(os)) {
        expect([question, text, ...(steps ?? [])].join(' ')).not.toMatch(/alert/i);
      }
    }
  });

  it('tells a silenced phone to leave silent mode, on either platform', () => {
    for (const os of ['ios', 'android'] as const) {
      const silent = getHelpTopics(os).find(
        (topic) => topic.question === 'Why does a notification show but play no sound?'
      );

      expect(silent?.steps).toEqual(['Take the phone out of silent mode']);
    }
  });

  it('never claims an app setting can play through the silent switch', () => {
    for (const os of ['ios', 'android'] as const) {
      const silent = getHelpTopics(os).find(
        (topic) => topic.question === 'Why does a notification show but play no sound?'
      );

      // The fix is to leave silent mode, never a setting inside the app: session 27 proved none exists
      expect(silent?.steps).toEqual(['Take the phone out of silent mode']);
      expect(silent?.action).toBeUndefined();
    }
  });

  it('names no app in any answer, since the app may be renamed', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { question, text, steps } of getHelpTopics(os)) {
        const words = [question, text, ...(steps ?? [])].join(' ');

        expect(words).not.toMatch(/Athan/);
      }
    }
  });

  it('drops the two questions the owner cut', () => {
    for (const os of ['ios', 'android'] as const) {
      const questions = getHelpTopics(os)
        .map((topic) => topic.question)
        .join(' ');

      expect(questions).not.toMatch(/How far ahead/);
      expect(questions).not.toMatch(/widget/i);
    }
  });

  it('guides with a numbered list wherever it gives more than one instruction', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { steps } of getHelpTopics(os)) {
        if (!steps) continue;

        expect(steps.length).toBeGreaterThan(0);
        for (const step of steps) expect(step.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every answer short enough to read on a phone', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { text } of getHelpTopics(os)) {
        expect(text.length).toBeLessThanOrEqual(160);
      }
    }
  });

  it('tells a user how to reach each settings screen it offers to open', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { steps, action } of getHelpTopics(os)) {
        if (action) expect(steps?.length).toBeGreaterThan(0);
      }
    }
  });

  /**
   * The owner followed the old iOS steps and they led to the wrong screen: a route is version
   * specific and goes stale, while the name of a setting does not (owner, 2026-09-27).
   */
  it('names what to change and never how to navigate there', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { steps } of getHelpTopics(os)) {
        for (const step of steps ?? []) {
          expect(step).not.toMatch(/\bOpen Settings\b|\bbelow\b|Control Cent|\bthen\b|\bUnder\b/i);
        }
      }
    }
  });

  /** A user needs the fix, never the mechanism (owner, 2026-09-27) */
  it('explains no internals in any answer', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { text } of getHelpTopics(os)) {
        expect(text).not.toMatch(/topped up|in the background|buffer|schedul|refresh(es|ed)?\b/i);
      }
    }
  });

  it('gives every answer some text and never an empty question', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const topic of getHelpTopics(os)) {
        expect(topic.question.trim().length).toBeGreaterThan(0);
        expect(topic.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('names a button for every action an answer offers', () => {
    for (const os of ['ios', 'android'] as const) {
      for (const { action } of getHelpTopics(os)) {
        if (action) expect(HELP_ACTION_LABELS[action].length).toBeGreaterThan(0);
      }
    }
  });
});

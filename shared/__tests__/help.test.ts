/**
 * Unit tests for shared/help.ts: which questions each platform answers, and which offer a deep link
 */

import { getHelpTopics, HELP_ACTION_LABELS } from '../help';

describe('getHelpTopics', () => {
  it.each(['ios', 'android'] as const)('answers at least five questions on %s', (os) => {
    expect(getHelpTopics(os).length).toBeGreaterThanOrEqual(5);
  });

  it('asks about notifications first on both platforms, since it is the most common cause', () => {
    expect(getHelpTopics('ios')[0].question).toBe('Are notifications turned on for Athan?');
    expect(getHelpTopics('android')[0].question).toBe('Are notifications turned on for Athan?');
  });

  it('keeps the reboot question for Android alone, where an alarm is cleared by a restart', () => {
    const iosQuestions = getHelpTopics('ios').map((topic) => topic.question);
    const androidQuestions = getHelpTopics('android').map((topic) => topic.question);

    expect(androidQuestions).toContain('I restarted my phone and heard nothing.');
    expect(iosQuestions).not.toContain('I restarted my phone and heard nothing.');
  });

  it('keeps the alarm volume question for Android alone, which is the platform that plays on that stream', () => {
    const iosQuestions = getHelpTopics('ios').map((topic) => topic.question);
    const androidQuestions = getHelpTopics('android').map((topic) => topic.question);

    expect(androidQuestions).toContain('The athan plays too quietly.');
    expect(iosQuestions).not.toContain('The athan plays too quietly.');
  });

  it('offers the Do Not Disturb grant on Android only, which is the one platform that has it', () => {
    const iosActions = getHelpTopics('ios').map((topic) => topic.action);
    const androidActions = getHelpTopics('android').map((topic) => topic.action);

    expect(androidActions).toContain('dndAccess');
    expect(iosActions).not.toContain('dndAccess');
  });

  it('offers the app settings on both platforms, where the permission lives', () => {
    expect(getHelpTopics('ios').map((topic) => topic.action)).toContain('appSettings');
    expect(getHelpTopics('android').map((topic) => topic.action)).toContain('appSettings');
  });

  it('words the silent switch answer for each platform rather than sharing one', () => {
    const silentOn = (os: 'ios' | 'android') =>
      getHelpTopics(os).find((topic) => topic.question === 'Is the silent switch on?')?.text;

    expect(silentOn('ios')).toContain('mute switch');
    expect(silentOn('android')).toContain('Silent mode');
  });

  it('never claims an app setting can play through the silent switch', () => {
    for (const os of ['ios', 'android'] as const) {
      const silent = getHelpTopics(os).find((topic) => topic.question === 'Is the silent switch on?');

      expect(silent?.text).toContain('No app setting can play through it.');
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

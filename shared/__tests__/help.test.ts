/**
 * Unit tests for shared/help.ts: which questions each platform answers, and which offer a deep link
 */

import { getHelpTopics, HELP_ACTION_LABELS } from '../help';

describe('getHelpTopics', () => {
  it.each(['ios', 'android'] as const)('answers at least five questions on %s', (os) => {
    expect(getHelpTopics(os).length).toBeGreaterThanOrEqual(5);
  });

  it('asks about notifications first on both platforms, since it is the most common cause', () => {
    expect(getHelpTopics('ios')[0].question).toBe('Notifications are turned off');
    expect(getHelpTopics('android')[0].question).toBe('Notifications are turned off');
  });

  it('keeps the reboot question for Android alone, where an alarm is cleared by a restart', () => {
    const iosQuestions = getHelpTopics('ios').map((topic) => topic.question);
    const androidQuestions = getHelpTopics('android').map((topic) => topic.question);

    expect(androidQuestions).toContain('Nothing played after a restart');
    expect(iosQuestions).not.toContain('Nothing played after a restart');
  });

  it('keeps the alarm volume question for Android alone, which is the platform that plays on that stream', () => {
    const iosQuestions = getHelpTopics('ios').map((topic) => topic.question);
    const androidQuestions = getHelpTopics('android').map((topic) => topic.question);

    expect(androidQuestions).toContain('The athan is too quiet');
    expect(iosQuestions).not.toContain('The athan is too quiet');
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
      getHelpTopics(os).find((topic) => topic.question === 'The silence switch is on')?.text;

    expect(silentOn('ios')).toContain('mutes notification sound');
    expect(silentOn('android')).toContain('Silent mode');
  });

  it('never claims an app setting can play through the silent switch', () => {
    for (const os of ['ios', 'android'] as const) {
      const silent = getHelpTopics(os).find((topic) => topic.question === 'The silence switch is on');

      expect(silent?.text).toContain('No app can play through it.');
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

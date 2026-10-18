/**
 * The chevron sweep: every chevronFor() glyph renders inside a Text whose
 * paragraph is pinned ltr, because Android resolves a lone neutral glyph
 * against the RTL layout direction and mirrors it (ticket 136)
 */

import type { LocaleId } from '@/shared/i18n/locale';

// The probes require the testing library inside isolateModules, mid-test,
// where its import-time cleanup-hook registration is a jest-circus error
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';

// The Help action row opens a settings screen, so opening it is observed
jest.mock('@/device/notifications', () => ({
  openDndAccessSettings: jest.fn(() => Promise.resolve(true)),
}));
// The chevron's platform leg renders Android's action row; the back handling
// exists for Android, so the hardware back press runs through Android's own
// implementation, as in Help.test.tsx
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

// The What's New row's chevron site must be asserted, so the release is
// visible whatever the current stamp carries (Settings.test.tsx's pattern)
let mockVisibleWhatsNew: { version: string; items: never[] } | null = null;
jest.mock('@/shared/whatsNew', () => ({
  currentVisibleWhatsNew: () => mockVisibleWhatsNew,
}));

const settingsChevronStylesUnder = async (locale: LocaleId): Promise<unknown[]> => {
  mockVisibleWhatsNew = { version: '2.0.1013', items: [] };
  let styles: unknown[] = [];
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const SettingsSheet = require('../sheets/screens/Settings').default;
    await rntl.render(<SettingsSheet />);
    const glyph = locale === 'ar' ? '\u2039' : '\u203A';
    styles = rntl.screen
      .getAllByText(glyph)
      .map((element: { props: { style: unknown } }) => StyleSheet.flatten(element.props.style));
  });
  return styles;
};

const helpChevronStylesUnder = async (locale: LocaleId): Promise<unknown[]> => {
  let styles: unknown[] = [];
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    require('@/__tests__/harness').onPlatform('android');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const ModalHelp = require('../modals/Help').default;
    await rntl.render(<ModalHelp visible={true} onClose={jest.fn()} />);
    const { getHelpTopics } = require('@/shared/help');
    const question = getHelpTopics('android').find((topic: { action?: string }) => topic.action)!.question;
    await rntl.fireEvent.press(rntl.screen.getByRole('button', { name: question }));
    const glyph = locale === 'ar' ? '\u2039' : '\u203A';
    styles = rntl.screen
      .getAllByText(glyph)
      .map((element: { props: { style: unknown } }) => StyleSheet.flatten(element.props.style));
  });
  return styles;
};

it.each(['en', 'ar'] as const)('pins every settings-sheet chevron paragraph under %s', async (locale) => {
  const styles = await settingsChevronStylesUnder(locale);

  // The authored codepoint is the locale's own (the JS half lives in
  // locale.test.ts); six sites: five rows plus the colour-picker row
  expect(styles).toHaveLength(6);
  // A rule the app must keep (the __tests__ README's named exception):
  // Android mirrors this glyph inside an RTL paragraph, so the chevron's
  // own paragraph is pinned ltr and the codepoint carries the direction
  for (const style of styles) {
    expect((style as Record<string, unknown>).direction).toBe('ltr');
  }
});

it.each(['en', 'ar'] as const)('pins the help action chevron paragraph under %s', async (locale) => {
  const styles = await helpChevronStylesUnder(locale);

  expect(styles).toHaveLength(1);
  expect((styles[0] as Record<string, unknown>).direction).toBe('ltr');
});

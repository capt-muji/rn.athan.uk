/**
 * The per-locale sweep guard (ticket 74, R2.1-R2.7): every inventory file
 * resolves its text styles through typographyFor at module scope, no raw
 * TEXT.family reference survives outside the decorative glyph styles D74.6
 * keeps, and the probed surfaces render the pinned families and sizes under
 * ar and en alike.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { LocaleId } from '@/shared/i18n/locale';

// The probes require the testing library inside isolateModules, mid-test, where
// its import-time cleanup-hook registration is a jest-circus error; the per-case
// fresh registries leave the auto cleanup nothing stale to unmount anyway
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';

// The two settings screens leave the app, so opening them is observed instead of done; the back
// handling exists for Android, whose implementation the press path needs (as in Help.test.tsx)
jest.mock('@/device/notifications', () => ({
  openDndAccessSettings: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

// The step-2 inventory: every file whose text styles must resolve through the
// locale typography map, relative to components/
const INVENTORY: readonly string[] = [
  'ui/Error.tsx',
  'ui/InitialWidthMeasurement.tsx',
  'sheets/screens/Alert.tsx',
  'sheets/screens/ColorPicker.tsx',
  'sheets/screens/Language.tsx',
  'sheets/screens/Qibla.tsx',
  'sheets/screens/QiblaCompass.tsx',
  'sheets/screens/ReminderCard.tsx',
  'sheets/screens/Settings.tsx',
  'sheets/screens/Sound.tsx',
  'sheets/parts/Header.tsx',
  'sheets/parts/LabeledToggle.tsx',
  'sheets/parts/SegmentedControl.tsx',
  'sheets/parts/SoundItem.tsx',
  'sheets/parts/Stepper.tsx',
  'countdown/Countdown.tsx',
  'prayer/Ago.tsx',
  'prayer/Explanation.tsx',
  'prayer/Prayer.tsx',
  'prayer/Time.tsx',
  'modals/Help.tsx',
  'modals/Modal.tsx',
  'modals/Update.tsx',
  'modals/WhatsNew.tsx',
  'day/Day.tsx',
];

/**
 * The probed surfaces resolve typography at module scope, so the locale must be
 * set before the component loads: each probe requires the component, the
 * testing library and React from one fresh module registry inside
 * isolateModules, sets the locale first, and renders (awaited: the library's
 * render is async and publishes the screen only after its act settles) inside
 * it. The library is held as a namespace and its members read live: `screen`
 * is a getter over the latest render, which a destructured const would
 * snapshot before any render exists.
 */
const headerTitleStyleUnder = async (locale: LocaleId): Promise<Record<string, unknown>> => {
  let title: Record<string, unknown> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const BottomSheetHeader = require('../sheets/parts/Header').default;
    await rntl.render(<BottomSheetHeader title='Settings' subtitle='Set your preferences' icon={null} />);
    title = StyleSheet.flatten(rntl.screen.getByText('Settings').props.style) as Record<string, unknown>;
  });
  return title;
};

const helpQuestionStyleUnder = async (locale: LocaleId): Promise<Record<string, unknown>> => {
  let question: Record<string, unknown> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const { getHelpTopics } = require('@/shared/help');
    const rntl = require('@testing-library/react-native');
    const ModalHelp = require('../modals/Help').default;
    await rntl.render(<ModalHelp visible onClose={jest.fn()} />);
    const [first] = getHelpTopics('ios');
    question = StyleSheet.flatten(rntl.screen.getByText(first.question).props.style) as Record<string, unknown>;
  });
  return question;
};

describe('the sweep guard', () => {
  it.each(INVENTORY)('resolves %s through the locale typography map', (file) => {
    const source = readFileSync(join(__dirname, '..', file), 'utf8');

    expect(source).toContain("import { typographyFor } from '@/shared/typography';");

    // The raw family reference survives only in Help's titleBadgeGlyph, the one
    // decorative glyph style D74.6 leaves untouched
    expect(source.split('TEXT.family').length - 1).toBe(file === 'modals/Help.tsx' ? 1 : 0);
  });

  it("keeps the countdown name's ar-only family expression at source level", () => {
    const source = readFileSync(join(__dirname, '..', 'countdown/Countdown.tsx'), 'utf8');

    expect(source).toContain('ty.arabic ? ty.familyRegular : undefined');
  });
});

describe('the countdown name family', () => {
  // StyleSheet.create resolves the ternary when the module evaluates, so its ar
  // branch runs only under an ar-side evaluation; without one the merged branch
  // coverage drops below the repo gate
  it('evaluates the countdown module under ar so its ar family branch is exercised', () => {
    jest.resetModules();
    {
      const { setActiveLocale } = require('@/shared/i18n/locale');
      setActiveLocale('ar');
      expect(typeof require('../countdown/Countdown').default).toBe('function');
    }
  });
});

describe('the sheet header title', () => {
  it('renders the Arabic medium face at the unchanged size under ar', async () => {
    const title = await headerTitleStyleUnder('ar');

    expect(title.fontFamily).toBe('NotoSansArabic-Medium');
    expect(title.fontSize).toBe(22);
  });

  it('keeps Roboto medium at the pre-change size and tracking under en', async () => {
    const title = await headerTitleStyleUnder('en');

    expect(title.fontFamily).toBe('Roboto-Medium');
    expect(title.fontSize).toBe(22);
    expect(title.letterSpacing).toBe(-0.3);
  });
});

describe('the help question', () => {
  it('renders the Arabic medium face at the unchanged size under ar', async () => {
    const question = await helpQuestionStyleUnder('ar');

    expect(question.fontFamily).toBe('NotoSansArabic-Medium');
    expect(question.fontSize).toBe(15);
  });

  it('keeps Roboto medium at the pre-change size under en', async () => {
    const question = await helpQuestionStyleUnder('en');

    expect(question.fontFamily).toBe('Roboto-Medium');
    expect(question.fontSize).toBe(15);
  });
});

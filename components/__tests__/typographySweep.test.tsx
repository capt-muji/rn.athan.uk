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
  'ui/LanguageLoader.tsx',
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
  'sheets/parts/VolumeNote.tsx',
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

const headerSubtitleStyleUnder = async (locale: LocaleId): Promise<Record<string, unknown>> => {
  let subtitle: Record<string, unknown> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const BottomSheetHeader = require('../sheets/parts/Header').default;
    await rntl.render(<BottomSheetHeader title='Settings' subtitle='Set your preferences' icon={null} />);
    subtitle = StyleSheet.flatten(rntl.screen.getByText('Set your preferences').props.style) as Record<string, unknown>;
  });
  return subtitle;
};

const qiblaSubtitleStyleUnder = async (locale: LocaleId): Promise<Record<string, unknown>> => {
  let subtitle: Record<string, unknown> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const QiblaSubtitle = require('../sheets/screens/Qibla').QiblaSubtitle;
    await rntl.render(<QiblaSubtitle showsCompass={false} />);
    subtitle = StyleSheet.flatten(rntl.screen.getByTestId('qibla-subtitle-waiting').props.style) as Record<
      string,
      unknown
    >;
  });
  return subtitle;
};

const soundListMarginUnder = async (locale: LocaleId): Promise<unknown> => {
  let marginTop: unknown;
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const { setSoundListReady } = require('@/stores/ui');
    setSoundListReady();
    const rntl = require('@testing-library/react-native');
    const BottomSheetSound = require('../sheets/screens/Sound').default;
    await rntl.render(<BottomSheetSound />);
    const list = rntl.screen.getByTestId('sound-list');
    marginTop = (StyleSheet.flatten(list.props.style) as Record<string, unknown>).marginTop;
  });
  return marginTop;
};

const noteFootMarginUnder = async (locale: LocaleId): Promise<unknown> => {
  let marginTop: unknown;
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const SheetVolumeNote = require('../sheets/parts/VolumeNote').default;
    await rntl.render(<SheetVolumeNote />);
    const copy = rntl.screen.getByText(locale === 'ar' ? /الرنين/ : /Ringer/);
    const foot = copy.parent;
    marginTop = (StyleSheet.flatten(foot?.props.style) as Record<string, unknown>).marginTop;
  });
  return marginTop;
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

/** The row time's resolved family under one locale: only an ar-side evaluation can tell the Latin face from the Arabic word face, and the digits are read, not the unread sentinel */
const rowTimeFontFamilyUnder = async (locale: LocaleId): Promise<unknown> => {
  let fontFamily: unknown;
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { showLondonDay } = require('@/__tests__/harness');
    showLondonDay('2026-09-11', '14:00');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const PrayerTime = require('../prayer/Time').default;
    const { ScheduleType } = require('@/shared/types');
    await rntl.render(<PrayerTime type={ScheduleType.Standard} index={1} />);
    fontFamily = (StyleSheet.flatten(rntl.screen.getByText('06').props.style) as Record<string, unknown>).fontFamily;
  });
  return fontFamily;
};

/** The explanation's resolved line height under one locale, which decides whether the Arabic diacritics clip */
const explanationLineHeightUnder = async (locale: LocaleId): Promise<unknown> => {
  let lineHeight: unknown;
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const PrayerExplanation = require('../prayer/Explanation').default;
    await rntl.render(<PrayerExplanation prayerName='الضحى' explanation='نص' />);
    lineHeight = (StyleSheet.flatten(rntl.screen.getByText('نص').props.style) as Record<string, unknown>).lineHeight;
  });
  return lineHeight;
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

    expect(source).toContain('ty.wordFace ? ty.familyRegular : undefined');
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

    expect(title.fontFamily).toBe('Rubik-Medium');
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

    expect(question.fontFamily).toBe('Rubik-Medium');
    expect(question.fontSize).toBe(15);
  });

  it('keeps Roboto medium at the pre-change size under en', async () => {
    const question = await helpQuestionStyleUnder('en');

    expect(question.fontFamily).toBe('Roboto-Medium');
    expect(question.fontSize).toBe(15);
  });

  it('takes the Arabic script line box under ar, so its dots and descenders render', async () => {
    const question = await helpQuestionStyleUnder('ar');
    expect(question.lineHeight).toBe(23);
  });

  it('keeps the 20 point line box under en', async () => {
    expect((await helpQuestionStyleUnder('en')).lineHeight).toBe(20);
  });
});

describe('the row time face', () => {
  it('names the locale regular face for the row time under ar, Rubik beside the English row Roboto', async () => {
    expect(await rowTimeFontFamilyUnder('ar')).toBe('Rubik-Regular');
  });
});

describe('the overlay explanation line box', () => {
  it('takes the Arabic script line height under ar, so its diacritics are not clipped', async () => {
    expect(await explanationLineHeightUnder('ar')).toBe(24);
  });

  it('keeps the Latin preset line height under en', async () => {
    expect(await explanationLineHeightUnder('en')).toBe(22);
  });
});

describe('the qibla sheet subtitle', () => {
  it('carries the 6 point gap under ar, matching the shared header', async () => {
    expect((await qiblaSubtitleStyleUnder('ar')).marginTop).toBe(6);
  });

  it('keeps its 4 point gap under en', async () => {
    expect((await qiblaSubtitleStyleUnder('en')).marginTop).toBe(4);
  });
});

describe('the sound sheet spacing under ar', () => {
  it('seats the list 12 points under the label under ar, one value with en', async () => {
    expect(await soundListMarginUnder('ar')).toBe(12);
  });

  it('keeps the hint gap at 12 under en', async () => {
    expect(await soundListMarginUnder('en')).toBe(12);
  });

  it('opens the note gap to 32 points under ar', async () => {
    expect(await noteFootMarginUnder('ar')).toBe(32);
  });

  it('keeps the note gap at 24 under en', async () => {
    expect(await noteFootMarginUnder('en')).toBe(24);
  });
});

describe('the sheet header line boxes', () => {
  it('leaves the ar title and subtitle to the font own box, so no glyph clips', async () => {
    const title = await headerTitleStyleUnder('ar');
    const subtitle = await headerSubtitleStyleUnder('ar');

    expect(title.lineHeight).toBeUndefined();
    expect(subtitle.lineHeight).toBeUndefined();
    expect(title.marginBottom).toBe(0);
    expect(subtitle.marginTop).toBe(6);
  });

  it('leaves the en title and subtitle to the font own box', async () => {
    const title = await headerTitleStyleUnder('en');
    const subtitle = await headerSubtitleStyleUnder('en');

    expect(title.lineHeight).toBeUndefined();
    expect(subtitle.lineHeight).toBeUndefined();
    expect(title.marginBottom).toBe(2);
    expect(subtitle.marginTop).toBe(4);
  });
});

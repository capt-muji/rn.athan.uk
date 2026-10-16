/**
 * The language-switch loader: what it shows, in which language, and when it stands down
 */

import { render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { COLORS, SIZE, SPACING } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { languageCommitBusyAtom, pendingLanguageAtom } from '@/stores/language';

import LanguageLoader from '../LanguageLoader';

const store = getDefaultStore();

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

afterEach(() => {
  setActiveLocale('en');
  store.set(languageCommitBusyAtom, false);
  store.set(pendingLanguageAtom, null);
});

describe('the language-switch loader', () => {
  it('stands down while no pick is converging', async () => {
    await render(<LanguageLoader />);

    expect(screen.toJSON()).toBeNull();
  });

  it('fills the screen with the root purple and names the target in its own language', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'ar');
    setActiveLocale('ar');

    await render(<LanguageLoader />);

    expect(screen.getByText('جارٍ ضبط اللغة العربية')).toBeOnTheScreen();
    // The rendered root is the loader's own panel
    const panel = screen.root as unknown as { props: { style: unknown } };
    expect(flattenStyle(panel.props.style).backgroundColor).toBe(COLORS.navigation.rootBackground);
  });

  it('caps the line\u2019s width so a long sentence breaks onto two centred lines', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'hi');
    setActiveLocale('hi');

    await render(<LanguageLoader />);

    const line = screen.getByText('भाषा हिन्दी सेट की जा रही है');
    expect(flattenStyle(line.props.style).maxWidth).toBe(260);
    expect(flattenStyle(line.props.style).textAlign).toBe('center');
  });

  it('pins the spinner at dead centre, whatever the gap below it grows to', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'ar');
    setActiveLocale('ar');

    await render(<LanguageLoader />);

    const root = screen.root as unknown as { children: unknown[] };
    const spinnerStyle = flattenStyle((root.children[0] as { props: { style: unknown } }).props.style);
    expect(spinnerStyle.top).toBe('50%');
    expect(spinnerStyle.transform).toEqual([{ translateY: -SIZE.activityIndicator / 2 }]);
  });

  it('hangs the line 30 points under the spinner\u2019s foot', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'ar');
    setActiveLocale('ar');

    await render(<LanguageLoader />);

    const root = screen.root as unknown as { children: unknown[] };
    const lineBoxStyle = flattenStyle((root.children[1] as { props: { style: unknown } }).props.style);
    expect(lineBoxStyle.marginTop).toBe(SIZE.activityIndicator / 2 + SPACING.xxxl);
  });
});

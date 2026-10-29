/**
 * The language-switch loader: what it shows, in which language, and when it stands down
 */

import { render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { act } from 'react';
import * as Reanimated from 'react-native-reanimated';

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

  it('speaks the target\u2019s words and face from its first frame, before the switch lands', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'ar');
    setActiveLocale('en');

    await render(<LanguageLoader />);

    // The active locale is still en; the line and its face are the target's already
    const line = screen.getByText('جارٍ ضبط اللغة العربية');
    expect(flattenStyle(line.props.style).fontFamily).toBe('Rubik-Regular');
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

describe('the loader’s choreography at the commit boundary', () => {
  const showPick = (locale: 'ar' | 'hi' = 'ar') => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, locale);
    setActiveLocale(locale);
  };

  it('fades the changing line in over the owner’s 200ms once it is available', async () => {
    const timing = jest.spyOn(Reanimated, 'withTiming');
    showPick();

    await render(<LanguageLoader />);

    expect(timing).toHaveBeenCalledWith(1, { duration: 200 });
    // The ink stays the solid white: the fade is one opacity value on the line's wrapper, never an
    // alpha on the text itself
    const line = flattenStyle(screen.getByText('جارٍ ضبط اللغة العربية').props.style);
    expect(line.color).toBe('#fff');
    expect(line.opacity).toBeUndefined();
  });

  it('starts the line transparent, so it fades rather than snapping in', async () => {
    showPick();

    await render(<LanguageLoader />);

    const wrapper = screen.getByText('جارٍ ضبط اللغة العربية').parent;

    expect(flattenStyle(wrapper?.props.style).opacity).toBe(0);
  });

  it('fades nothing while no pick is converging', async () => {
    const timing = jest.spyOn(Reanimated, 'withTiming');

    await render(<LanguageLoader />);

    expect(timing).not.toHaveBeenCalled();
  });

  it('stands down with no line when a pick has no target yet', async () => {
    const timing = jest.spyOn(Reanimated, 'withTiming');
    store.set(languageCommitBusyAtom, true);

    await render(<LanguageLoader />);

    expect(screen.toJSON()).toBeNull();
    expect(timing).not.toHaveBeenCalled();
  });

  it('fades the line again for the next pick', async () => {
    const timing = jest.spyOn(Reanimated, 'withTiming');
    showPick('ar');
    await render(<LanguageLoader />);
    expect(timing).toHaveBeenCalledTimes(1);

    await act(async () => {
      store.set(pendingLanguageAtom, 'hi');
    });

    expect(timing).toHaveBeenCalledTimes(2);
  });

  it('lifts the cover, the spinner and the line in one act when the commit settles', async () => {
    showPick();
    await render(<LanguageLoader />);
    expect(screen.toJSON()).not.toBeNull();

    await act(async () => {
      store.set(languageCommitBusyAtom, false);
    });

    expect(screen.toJSON()).toBeNull();
  });
});

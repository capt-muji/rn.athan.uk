/**
 * The language sheet (D8, D26, D51): six native names in codepoint order, a pick that
 * blocks the sheet behind the in-sheet progress row until the surfaces converge, and a
 * dismiss on both settle paths because convergence is forward-only (D34)
 */

import { act, fireEvent, type RenderResult, render, screen, waitFor } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import { london } from '@/__tests__/harness';
import { t } from '@/shared/i18n';
import { setActiveLocale } from '@/shared/i18n/locale';
import * as LanguageStore from '@/stores/language';
import { rescheduleAllForLanguageChange } from '@/stores/notifications';
import { languageSheetModalAtom } from '@/stores/ui';

import LanguageSheet from '../screens/Language';

// The convergence driver is the seam the suite freezes: a hanging driver holds the real
// commit's promise unsettled, which is the state the progress face covers
jest.mock('@/stores/notifications', () => ({
  ...jest.requireActual('@/stores/notifications'),
  rescheduleAllForLanguageChange: jest.fn(),
}));

const store = getDefaultStore();
const driverMock = jest.mocked(rescheduleAllForLanguageChange);

/** The modal a sheet handed the store when it rendered */
const renderedSheet = () => {
  const sheet = store.get(languageSheetModalAtom);
  if (!sheet) throw new Error('The sheet has not rendered');
  return sheet;
};

const SIX_NAMES = ['Bahasa Melayu', 'English', 'Soomaali', 'العربية', 'हिन्दी', 'ไทย'] as const;

// The hanging driver's release valve, armed by the busy test and fired here even
// when one of its assertions throws
let release: () => void = () => {};

// The spinner carries no role, label or text of its own, so it is counted in the
// serialized tree, the one shape every renderer agrees on
const spinnerCount = (node: ReactTestRendererJSON): number => {
  const own = node.type === 'ActivityIndicator' ? 1 : 0;
  const children = (node.children ?? []).filter((child): child is ReactTestRendererJSON => typeof child === 'object');
  return own + children.reduce((total, child) => total + spinnerCount(child), 0);
};

afterEach(async () => {
  setActiveLocale('en');
  driverMock.mockReset();
  // A failed assertion throws past the test's own release, and the hanging driver
  // would hold the scheduling queue for every test after it
  release();
  await act(async () => {});
});

describe('the language sheet, Friday 11 September 2026 at 14:00', () => {
  it('renders the six native names in codepoint order with a check on the active locale', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    await render(<LanguageSheet />);

    // Reading each row's label from its props: the order is the assertion, and no
    // per-row query can express which came first
    const labels = screen.getAllByRole('radio').map((row) => row.props.accessibilityLabel);
    expect(labels).toEqual([...SIX_NAMES]);
    expect(screen.getByTestId('svg:check', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('blocks the sheet behind the progress row while the commit runs', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    // The driver hangs exactly while the assertions run; the afterEach releases it
    driverMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    const rendered: RenderResult = await render(<LanguageSheet />);

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    expect(commitSpy).toHaveBeenCalledWith('ar');
    for (const name of SIX_NAMES) {
      expect(screen.getByRole('radio', { name })).toBeDisabled();
    }
    // The UI switched with the pick (R3.1), so the applying line already reads the new locale
    expect(screen.getByText(t('language.applying'))).toBeOnTheScreen();
    const tree = rendered.toJSON();
    expect(tree ? spinnerCount(tree) : 0).toBe(1);
  });

  it('dismisses once the commit resolves', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    driverMock.mockResolvedValue(true);
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    await waitFor(() => expect(dismiss).toHaveBeenCalledTimes(1));
  });

  it('dismisses when the commit rejects too: the UI already switched, there is no failure face', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    jest.spyOn(LanguageStore, 'commitLanguagePreference').mockRejectedValueOnce(new Error('refused'));
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'ไทย' }));

    await waitFor(() => expect(dismiss).toHaveBeenCalledTimes(1));
  });

  it('closes without committing when the active locale is tapped', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    expect(commitSpy).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

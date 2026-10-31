/**
 * Unit tests for components/warmup/SheetWarmup.tsx
 *
 * The warm copy's contracts: it mounts the two likely sheet bodies hidden off-screen at the width the sheets' own
 * column gives them, it never presents a sheet nor fires the settings sheet's own sound-list warming, and the
 * measurements its copies take land in the cached-geometry store through the ladder's settle-tick seal — the same
 * write a real sheet's settle makes — so the first real open renders from measured geometry.
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai/vanilla';
import { StyleSheet } from 'react-native';

import SheetWarmup, { warmupEnsurePermissions } from '@/components/warmup/SheetWarmup';
import { SIZE, SPACING } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { bumpSheetSettleTick, measuredGeometryAtomFor } from '@/stores/geometry';
import { getPrayerAlertAtom } from '@/stores/notifications';
import { alertSheetStateAtom, soundListReadyAtom } from '@/stores/ui';

jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));

/** The sheet column's own content width, from the same constants parts/Sheet.tsx sizes it with */
const columnContentWidth = (windowWidth: number) => Math.min(windowWidth, SIZE.contentMaxWidth) - 2 * SPACING.xl;

describe("the idle ladder's warm sheet bodies", () => {
  it('mounts the settings and alert bodies off-screen, untouchable and unreadable, at the sheet column width', async () => {
    const view = await render(<SheetWarmup />);

    const host = view.root;
    expect(host).not.toBeNull();
    const style = StyleSheet.flatten(host!.props.style) as { top?: number; width?: number };
    expect(style.top).toBe(-10000);
    // The same sheet-column arithmetic parts/Sheet.tsx applies, so a copy measures what the real sheet measures
    expect(style.width).toBe(columnContentWidth(1080));
    expect(host!.props.pointerEvents).toBe('none');
    expect(host!.props.accessibilityElementsHidden).toBe(true);
    expect(host!.props.importantForAccessibility).toBe('no-hide-descendants');
    // Both bodies are present under the host
    expect(screen.getAllByTestId('reminder-measurer', { includeHiddenElements: true }).length).toBeGreaterThan(0);
  });

  it("never presents a sheet, never fires the settings sheet's sound-list warming, and no press reaches it", async () => {
    const store = getDefaultStore();

    await render(<SheetWarmup />);

    expect(store.get(alertSheetStateAtom)).toBeNull();
    expect(store.get(soundListReadyAtom)).toBe(false);

    // A press into the warm copy reaches nothing: the testing library refuses
    // to dispatch into a pointerEvents-none subtree, the same refusal a
    // finger gets, so no control's handler can ever run
    const savedBefore = store.get(getPrayerAlertAtom(ScheduleType.Standard, 0));
    const silentOption = screen.getAllByRole('radio', { name: 'Silent', includeHiddenElements: true })[0];
    await fireEvent.press(silentOption);
    await act(async () => {});

    expect(
      screen.getAllByRole('radio', { name: 'Silent', includeHiddenElements: true })[0].props.accessibilityState
    ).toMatchObject({ selected: false });
    expect(store.get(alertSheetStateAtom)).toBeNull();
    expect(store.get(getPrayerAlertAtom(ScheduleType.Standard, 0))).toStrictEqual(savedBefore);

    // The permission stand-in the copy hands the body: permissive, and the
    // only path a control could ever have taken through it
    await expect(warmupEnsurePermissions()).resolves.toBe(true);
  });

  it('seals its measured geometry into the cache on the settle tick, the same write a real sheet settle makes', async () => {
    const store = getDefaultStore();
    expect(store.get(measuredGeometryAtomFor('reminder_baseline_text'))).toBe(0);

    await render(<SheetWarmup />);
    const measurer = screen.getAllByTestId('reminder-baseline-silent', { includeHiddenElements: true })[0];
    expect(measurer).toBeTruthy();

    // The copy's hidden text reports the width the real measurer would
    fireEvent(measurer, 'onTextLayout', { nativeEvent: { lines: [{ width: 214 }] } });
    expect(store.get(measuredGeometryAtomFor('reminder_baseline_text'))).toBe(0);

    // The ladder's stage-three seal: the one sanctioned write moment
    await act(async () => {
      bumpSheetSettleTick();
    });
    expect(store.get(measuredGeometryAtomFor('reminder_baseline_text'))).toBe(214);
  });
});

/**
 * The What's New modal: its version-group sections, each item and its platform note, Close,
 * and Android's back press
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler, DeviceEventEmitter, StyleSheet } from 'react-native';

import { SPACING } from '@/shared/constants';
import type { WhatsNewItem } from '@/shared/whatsNew';

import ModalWhatsNew from '../WhatsNew';

// Jest resolves React Native for iOS, whose BackHandler never fires. The back handling exists for Android, so the
// hardware back press runs through React Native's own Android implementation
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

const pressBack = () =>
  act(() => {
    DeviceEventEmitter.emit('hardwareBackPress');
  });

// Items of its own rather than the shipped archive, whose content changes with every release
const TABLETS: WhatsNewItem = { title: 'Tablet support', body: 'Athan now supported on tablets', version: '1.27.140' };
const SOUNDS: WhatsNewItem = { title: 'Athan sounds', body: 'New Athan sounds added', version: '1.27.140' };
const LEGACY: WhatsNewItem = { title: 'Widgets', body: 'Add prayer times to your Home Screen', version: '1.24.9' };
const ANCIENT: WhatsNewItem = { title: 'Qibla compass', body: 'Find the qibla anywhere in London', version: '1.7.0' };

// The separators are plain Views carrying no text, so the dots are told by their style the
// same way the scroll bound is
const dotNodes = () =>
  (screen.root?.queryAll(() => true) ?? []).filter((node) => {
    const style = StyleSheet.flatten(node.props.style);
    return style?.width === 2 && style?.height === 2 && style?.borderRadius === 1;
  });

/** Every literal a Text renders, in render order: pins section order without test ids */
const textsInOrder = (): string[] =>
  (screen.root?.queryAll(() => true) ?? []).flatMap((node) => {
    const children = node.props.children;
    return typeof children === 'string' ? [children] : [];
  });

/** The item rows: flexDirection row carrying the breathing gap, the only style so shaped */
const itemRows = () =>
  (screen.root?.queryAll(() => true) ?? []).filter((node) => {
    const style = StyleSheet.flatten(node.props.style);
    return style?.flexDirection === 'row' && style?.marginBottom === SPACING.md;
  });

describe("the What's New modal after an update", () => {
  it('shows nothing while it is not visible', async () => {
    await render(<ModalWhatsNew visible={false} items={[TABLETS]} onClose={jest.fn()} />);

    expect(screen.queryByText("What's New")).toBeNull();
  });

  it('carries no version line under the heading: each group carries its own', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS]} onClose={jest.fn()} />);

    expect(screen.getByText("What's New")).toBeOnTheScreen();
    expect(screen.queryByText('v1.27.140')).toBeNull();
  });

  it('heads each version group with its pill, newest group first', async () => {
    await render(<ModalWhatsNew visible={true} items={[LEGACY, TABLETS]} onClose={jest.fn()} />);

    expect(screen.getByText('v1.27')).toBeOnTheScreen();
    expect(screen.getByText('v1.24')).toBeOnTheScreen();

    const texts = textsInOrder();
    expect(texts.indexOf('v1.27')).toBeLessThan(texts.indexOf('v1.24'));
  });

  it('parts groups with a centred three-dot separator, and none after the last group', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS, LEGACY, ANCIENT]} onClose={jest.fn()} />);

    const dots = dotNodes();
    expect(dots).toHaveLength(6);

    for (const dot of dots) {
      const style = StyleSheet.flatten(dot.parent?.props.style);
      expect(style?.justifyContent).toBe('center');
      expect(dot.parent?.children).toHaveLength(3);
    }
  });

  it('draws no separator when there is only one group', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS, SOUNDS]} onClose={jest.fn()} />);

    expect(dotNodes()).toHaveLength(0);
  });

  it('seats the platform glyphs at each row right edge, beside the title text', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS]} onClose={jest.fn()} />);

    const apple = screen.getByTestId('svg:apple', { includeHiddenElements: true });
    const android = screen.getByTestId('svg:android', { includeHiddenElements: true });
    // The owner's 20 percent reduction on the iOS glyph; Android renders exactly as before
    expect(apple.props.width).toBe(10);
    expect(apple.props.height).toBe(10);
    expect(android.props.width).toBe(13);
    expect(android.props.height).toBe(13);

    const [row] = itemRows();
    expect(row).toBeDefined();

    const rowChildren = (row?.children ?? []).filter(
      (child): child is NonNullable<typeof row> => typeof child !== 'string'
    );
    // The text block leads and the glyphs trail: the badges sit at the row right edge
    expect(rowChildren[0]?.queryAll(() => true).some((node) => node.props.children === 'Tablet support')).toBe(true);
    expect(rowChildren[0]?.queryAll(() => true).some((node) => node.props.testID === 'svg:apple')).toBe(false);
    expect(
      rowChildren[rowChildren.length - 1]?.queryAll(() => true).some((node) => node.props.testID === 'svg:apple')
    ).toBe(true);
  });

  // A style is read because it is a rule the app keeps: the approved design breathes
  // between a group's item rows, so the gap rides on every row and the header carries none
  it('breathes below every item row', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS, SOUNDS]} onClose={jest.fn()} />);

    expect(itemRows()).toHaveLength(2);
  });

  it('lists every item by title and body, with no platform note on an item available everywhere', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS, SOUNDS]} onClose={jest.fn()} />);

    expect(screen.getByText('Tablet support')).toBeOnTheScreen();
    expect(screen.getByText('Athan now supported on tablets')).toBeOnTheScreen();
    expect(screen.getByText('Athan sounds')).toBeOnTheScreen();
    expect(screen.getByText('New Athan sounds added')).toBeOnTheScreen();
  });

  // Columns: the platform an item is exclusive to, and the name its note gives that platform
  it.each([
    ['ios', 'iOS'],
    ['android', 'Android'],
  ] as const)('notes an item exclusive to %s as %s only', async (platform, platformName) => {
    const item: WhatsNewItem = {
      title: 'Widgets',
      body: 'Add prayer times to your Home Screen',
      platform,
      version: '1.27.140',
    };
    await render(<ModalWhatsNew visible={true} items={[item]} onClose={jest.fn()} />);

    expect(screen.getByText(`Add prayer times to your Home Screen (${platformName} only)`)).toBeOnTheScreen();
  });

  // The badges pin what is drawn rather than what a screen reader reaches, so hidden elements are included
  // Columns: the platform an item is exclusive to, the glyph it is badged with, and the glyph it is not
  it.each([
    ['ios', 'svg:apple', 'svg:android'],
    ['android', 'svg:android', 'svg:apple'],
  ] as const)('badges an item exclusive to %s with %s alone', async (platform, badge, otherBadge) => {
    const item: WhatsNewItem = {
      title: 'Widgets',
      body: 'Add prayer times to your Home Screen',
      platform,
      version: '1.27.140',
    };

    await render(<ModalWhatsNew visible={true} items={[item]} onClose={jest.fn()} />);

    expect(screen.getByTestId(badge, { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByTestId(otherBadge, { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('badges an item available everywhere with both glyphs', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS]} onClose={jest.fn()} />);

    expect(screen.getByTestId('svg:apple', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByTestId('svg:android', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  // A style is read because it is a rule the app keeps: the release list grows with every
  // release, and an unbounded list grows the compact card past the screen
  it('scrolls its items rather than growing past the screen', async () => {
    await render(<ModalWhatsNew visible={true} items={[TABLETS, SOUNDS]} onClose={jest.fn()} />);

    // The scroller carries no role, label or text, so it is reached by its host type
    const scroller = screen.root?.queryAll((node) => node.type === 'RCTScrollView')[0];

    expect(StyleSheet.flatten(scroller?.props.style).maxHeight).toBeGreaterThan(0);
    expect(scroller?.props.showsVerticalScrollIndicator).toBe(false);
  });

  it('reports Close when it is pressed', async () => {
    const onClose = jest.fn();
    await render(<ModalWhatsNew visible={true} items={[TABLETS]} onClose={onClose} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when Android\u2019s back button is pressed, rather than leaving the app', async () => {
    const onClose = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(<ModalWhatsNew visible={true} items={[TABLETS]} onClose={onClose} />);

    await pressBack();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });
});

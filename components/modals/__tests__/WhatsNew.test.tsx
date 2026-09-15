/**
 * The What's New modal: the version it is headed with, each item and its platform note, and Continue
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { WhatsNewItem } from '@/shared/whatsNew';

import ModalWhatsNew from '../WhatsNew';

// Items of its own rather than the shipped archive, whose content changes with every release
const TABLETS: WhatsNewItem = { title: 'Tablet support', body: 'Athan now supported on tablets', version: '1.27.140' };
const SOUNDS: WhatsNewItem = { title: 'Athan sounds', body: 'New Athan sounds added', version: '1.27.140' };

describe("the What's New modal after an update to 1.27.140", () => {
  it('shows nothing while it is not visible', async () => {
    await render(<ModalWhatsNew visible={false} version='1.27.140' items={[TABLETS]} onContinue={jest.fn()} />);

    expect(screen.queryByText("What's New")).toBeNull();
  });

  it('heads the list with the installed version', async () => {
    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[TABLETS]} onContinue={jest.fn()} />);

    expect(screen.getByText('v1.27.140')).toBeOnTheScreen();
  });

  it('lists every item by title and body, with no platform note on an item available everywhere', async () => {
    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[TABLETS, SOUNDS]} onContinue={jest.fn()} />);

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
    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[item]} onContinue={jest.fn()} />);

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

    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[item]} onContinue={jest.fn()} />);

    expect(screen.getByTestId(badge, { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByTestId(otherBadge, { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('badges an item available everywhere with both glyphs', async () => {
    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[TABLETS]} onContinue={jest.fn()} />);

    expect(screen.getByTestId('svg:apple', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByTestId('svg:android', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('reports Continue when it is pressed', async () => {
    const onContinue = jest.fn();
    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[TABLETS]} onContinue={onContinue} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

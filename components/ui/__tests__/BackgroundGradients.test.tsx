/**
 * The screen's background gradient, which has no behaviour of its own beyond filling the screen
 */

import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DESIGN } from '@/shared/design';

import BackgroundGradients from '../BackgroundGradients';

jest.mock('@/shared/design', () => ({
  DESIGN: { bgStart: '#010203', bgEnd: '#040506', bgTail: null as string | null },
}));

const setTail = (bgTail: string | null) => {
  // DESIGN's shipped shape has no tail field; the prototype reads one optionally
  (DESIGN as unknown as { bgTail: string | null }).bgTail = bgTail;
};

// the native gradient receives packed ARGB numbers, so the assertions do too
const argb = (hex: string) => 0xff000000 + Number.parseInt(hex.slice(1), 16);

describe('the background gradient behind the pager', () => {
  // Filling the screen is a layout rule the app keeps, not a design value
  it('fills the whole screen, visibly, with nothing on it to read or press', async () => {
    await render(<BackgroundGradients />);

    expect(screen.root).toBeVisible();
    expect(screen.root).toHaveStyle(StyleSheet.absoluteFill);
    expect(screen.root).toBeEmptyElement();
  });

  // The original two-stop diagonal is what every design without a tail renders
  it('ramps from the dark stop to the bright stop when the design carries no tail', async () => {
    setTail(null);
    const tree = await render(<BackgroundGradients />);
    const gradient = tree.root as NonNullable<typeof tree.root>;

    expect(gradient.props.colors).toEqual([argb('#010203'), argb('#040506')]);
    expect(gradient.props.locations).toEqual([0, 1]);
  });

  // The prototype's purple hint eases in over the lower journey in two stages:
  // start, journey end, the halfway blend, then the tail at the bottom corner
  it('eases the tail colour in over the lower journey when the design carries one', async () => {
    setTail('#3d1577');
    const tree = await render(<BackgroundGradients />);
    const gradient = tree.root as NonNullable<typeof tree.root>;

    // (4,5,6) and (61,21,119) meet in the middle at (33,13,63)
    expect(gradient.props.colors).toEqual([argb('#010203'), argb('#040506'), argb('#210d3f'), argb('#3d1577')]);
    expect(gradient.props.locations).toEqual([0, 0.7, 0.87, 1]);
  });
});

/**
 * The compass face: how large it is drawn, which way it starts, and that the needle never re-records its tree
 */

import { act, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { SIZE, SPACING } from '@/shared/constants';

import Dial from '../Dial';

const LONDON_QIBLA = 119;

const resizeWindow = (width: number) =>
  act(() => Dimensions.set({ window: { width, height: 1000, scale: 3, fontScale: 1 } }));

/** The layer the needle rotates, and the drawing it holds, neither of which carries a role or text of its own */
const layer = () => screen.getByTestId('qibla-face');
const face = () => layer().children[0] as ReturnType<typeof screen.getByTestId>;

const headingOf = (value: number) => ({ value }) as ReturnType<typeof Reanimated.useSharedValue<number>>;

describe('the qibla dial', () => {
  it('fills the width it is given, inside the sheet padding', async () => {
    await resizeWindow(360);

    await render(<Dial bearing={LONDON_QIBLA} heading={headingOf(0)} />);

    expect(face()).toHaveProp('width', 360 - SPACING.xl * 2);
  });

  it('stops at the content column on a window wider than it', async () => {
    await resizeWindow(1024);

    await render(<Dial bearing={LONDON_QIBLA} heading={headingOf(0)} />);

    expect(face()).toHaveProp('width', SIZE.contentMaxWidth - SPACING.xl * 2);
  });

  it('is square, so the face is a circle rather than an ellipse', async () => {
    await resizeWindow(360);

    await render(<Dial bearing={LONDON_QIBLA} heading={headingOf(0)} />);

    expect(face()).toHaveProp('height', face().props.width);
  });

  // ai/AGENTS.md: no mount-time visual settling. A face that animated from north would spin on every open
  it('draws at the phone heading on the first frame rather than turning to it', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await resizeWindow(360);

    await render(<Dial bearing={LONDON_QIBLA} heading={headingOf(200)} />);

    expect(withTiming).not.toHaveBeenCalled();
  });

  // The face turns against the phone, so a phone pointing east puts east under the fixed mark
  it('turns the face opposite the heading', async () => {
    await resizeWindow(360);

    await render(<Dial bearing={LONDON_QIBLA} heading={headingOf(90)} />);

    expect(layer()).toHaveStyle({ transform: [{ rotate: '-90deg' }] });
  });

  // The whole 60fps architecture: the needle moves by rotating one recorded layer, never by redrawing the tree
  it('animates the turn as a rotation once the first frame has passed', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await resizeWindow(360);
    const heading = headingOf(0);
    await render(<Dial bearing={LONDON_QIBLA} heading={heading} />);

    heading.value = 90;
    await screen.rerender(<Dial bearing={LONDON_QIBLA} heading={heading} />);

    expect(withTiming).toHaveBeenCalledWith(-90, expect.anything());
  });
});

/**
 * The radial glow: how large it is drawn on a phone, on a window wider than the content column, and at a set size
 */

import { act, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { GLOW, SIZE } from '@/shared/constants';

import Glow from '../Glow';

// The window as the platform reports it; only its width decides the glow
const resizeWindow = (width: number) =>
  act(() => Dimensions.set({ window: { width, height: 1000, scale: 3, fontScale: 1 } }));

// The glow has no role, label or text to be found by, so it is read as the root of what it renders

describe('the radial glow', () => {
  it('spans a multiple of the window width on a phone', async () => {
    await resizeWindow(390);

    await render(<Glow color='#8000ff' style={{}} />);

    expect(screen.root).toHaveProp('width', 390 * GLOW.sizeFactor);
    expect(screen.root).toHaveProp('height', 390 * GLOW.sizeFactor);
  });

  it('spans the same multiple of the content column on a window wider than the column', async () => {
    await resizeWindow(1024);

    await render(<Glow color='#8000ff' style={{}} />);

    expect(screen.root).toHaveProp('width', SIZE.contentMaxWidth * GLOW.sizeFactor);
    expect(screen.root).toHaveProp('height', SIZE.contentMaxWidth * GLOW.sizeFactor);
  });

  it('draws at the size its caller sets, whatever the window', async () => {
    await resizeWindow(1024);

    await render(<Glow color='#8000ff' style={{}} size={200} />);

    expect(screen.root).toHaveProp('width', 200);
    expect(screen.root).toHaveProp('height', 200);
  });
});

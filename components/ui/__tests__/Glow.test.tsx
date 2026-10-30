/**
 * The radial glow: how large it is drawn on a phone, on a window wider than the content column, and at a set size
 */

import { act, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { Stop } from 'react-native-svg';

import { GLOW, SIZE } from '@/shared/constants';

import Glow from '../Glow';

// Stop renders null (its data rides the gradient), so the falloff is read at the call site
jest.mock('react-native-svg', () => ({
  __esModule: true,
  ...jest.requireActual<typeof import('react-native-svg')>('react-native-svg'),
  Stop: jest.fn(() => null),
}));

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

  // The rim must sink into the veil: a sparse stop table banding into grey at the edges was
  // the owner's 2026-10-30 reading, so the falloff is pinned stop by stop
  it('fades on a dense accelerating curve that reaches nothing at the rim', async () => {
    await resizeWindow(390);

    await render(<Glow color='#8000ff' style={{}} baseOpacity={1} />);

    const calls = (Stop as unknown as jest.Mock).mock.calls.map(([{ offset, stopOpacity }]) => [offset, stopOpacity]);

    expect(calls).toEqual([
      ['0%', 0.75],
      ['12%', 0.62],
      ['25%', 0.48],
      ['40%', 0.34],
      ['55%', 0.22],
      ['70%', 0.12],
      ['82%', 0.055],
      ['92%', 0.018],
      ['100%', 0],
    ]);
  });
});

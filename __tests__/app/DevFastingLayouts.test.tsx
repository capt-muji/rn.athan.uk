/**
 * The dev harness route (T-623): nothing in release, the fasting-layout screen
 * behind __DEV__. The release branch is measured coverage (the route sits under
 * app/), so both branches render here.
 */

import { render, screen } from '@testing-library/react-native';

import DevFastingLayoutsRoute from '../../app/dev/fasting-layouts';

const setDev = (value: boolean) => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = value;
};

afterEach(() => {
  setDev(true);
});

describe('the fasting-layouts dev route', () => {
  it('renders nothing when not in dev', async () => {
    setDev(false);
    const tree = await render(<DevFastingLayoutsRoute />);
    expect(tree.toJSON()).toBeNull();
  });

  it('renders the harness screen with the first variant named in dev', async () => {
    setDev(true);
    await render(<DevFastingLayoutsRoute />);
    expect(screen.getByText(/Aligned Radio Rows/)).toBeOnTheScreen();
  });
});

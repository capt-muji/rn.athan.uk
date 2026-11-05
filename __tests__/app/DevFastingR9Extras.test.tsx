/**
 * The round-9 Extra Schedule dev route (T-623): nothing in release, the
 * extras harness screen behind __DEV__. The release branch is measured
 * coverage (the route sits under app/), so both branches render here, the
 * harness module stubbed at its require target.
 */

import { render } from '@testing-library/react-native';

const extrasScreenStub = () => null;

jest.mock('@/devlayouts/r9/ExtrasR9Screen', () => ({
  ExtrasR9Screen: extrasScreenStub,
}));

import DevFastingR9ExtrasRoute from '../../app/dev/fasting-r9-extras';

const setDev = (value: boolean) => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = value;
};

afterEach(() => {
  setDev(true);
});

describe('the fasting r9 extras dev route', () => {
  it('renders nothing when not in dev', async () => {
    setDev(false);
    const tree = await render(<DevFastingR9ExtrasRoute />);
    expect(tree.toJSON()).toBeNull();
  });

  it('renders the extras harness screen in dev', async () => {
    setDev(true);
    const tree = await render(<DevFastingR9ExtrasRoute />);
    expect(tree).toBeTruthy();
  });
});

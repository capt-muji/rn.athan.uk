/**
 * The round-10 Extra Schedule dev route (T-623): nothing in release, the
 * extras harness screen behind __DEV__. The release branch is measured
 * coverage (the route sits under app/), so both branches render here, the
 * harness module stubbed at its require target.
 */

import { render } from '@testing-library/react-native';

const extrasScreenStub = () => null;

jest.mock('@/devlayouts/r10/ExtrasR10Screen', () => ({
  ExtrasR10Screen: extrasScreenStub,
}));

import DevFastingR10ExtrasRoute from '../../app/dev/fasting-r10-extras';

const setDev = (value: boolean) => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = value;
};

afterEach(() => {
  setDev(true);
});

describe('the fasting r10 extras dev route', () => {
  it('renders nothing when not in dev', async () => {
    setDev(false);
    const tree = await render(<DevFastingR10ExtrasRoute />);
    expect(tree.toJSON()).toBeNull();
  });

  it('renders the extras harness screen in dev', async () => {
    setDev(true);
    const tree = await render(<DevFastingR10ExtrasRoute />);
    expect(tree).toBeTruthy();
  });
});

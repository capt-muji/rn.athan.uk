/**
 * The deep-linked variant (T-623): the route with a v param opens the harness
 * at that variant's strip position, so the screenshot pass mounts each variant
 * directly instead of tapping through fifty sheets.
 */

import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ v: '7' }),
}));

import DevFastingLayoutsRoute from '../../app/dev/fasting-layouts';

describe('the fasting-layouts deep link', () => {
  it('opens the variant the v param names', async () => {
    await render(<DevFastingLayoutsRoute />);
    expect(screen.getByText(/7 \/ 320/)).toBeOnTheScreen();
  });
});

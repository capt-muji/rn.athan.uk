/**
 * The screen's background gradient, which has no behaviour of its own beyond filling the screen
 */

import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import BackgroundGradients from '../BackgroundGradients';

describe('the background gradient behind the pager', () => {
  // Filling the screen is a layout rule the app keeps, not a design value
  it('fills the whole screen, visibly, with nothing on it to read or press', async () => {
    await render(<BackgroundGradients />);

    expect(screen.root).toBeVisible();
    expect(screen.root).toHaveStyle(StyleSheet.absoluteFill);
    expect(screen.root).toBeEmptyElement();
  });
});

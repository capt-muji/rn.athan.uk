/**
 * A sheet's header: the title, subtitle and icon every bottom sheet opens with
 */

import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import Header from '../Header';

describe('the settings sheet header', () => {
  it('shows the title, the subtitle and the icon it is given', async () => {
    // A text stands in for the icon, since an SVG icon draws nothing under Jest
    await render(<Header title='Settings' subtitle='Set your preferences' icon={<Text>icon</Text>} />);

    expect(screen.getByText('Settings')).toBeOnTheScreen();
    expect(screen.getByText('Set your preferences')).toBeOnTheScreen();
    expect(screen.getByText('icon')).toBeOnTheScreen();
  });
});

/**
 * The Help modal: the questions it lists on each platform, the settings screens its buttons open, and Close
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { onPlatform } from '@/__tests__/harness';
import { openAppSettings, openDndAccessSettings } from '@/device/notifications';
import { getHelpTopics } from '@/shared/help';

import ModalHelp from '../Help';

// The two settings screens leave the app, so opening them is observed instead of done
jest.mock('@/device/notifications', () => ({
  openAppSettings: jest.fn(() => Promise.resolve(true)),
  openDndAccessSettings: jest.fn(() => Promise.resolve(true)),
}));

describe('the Help modal', () => {
  it('shows nothing while it is not visible', async () => {
    await render(<ModalHelp visible={false} onClose={jest.fn()} />);

    expect(screen.queryByText('Help')).toBeNull();
  });

  it('answers the question a silent phone raises first', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.getByText('Are notifications turned on for Athan?')).toBeOnTheScreen();
  });

  it('lists every question its platform answers', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    for (const { question } of getHelpTopics('ios')) {
      expect(screen.getByText(question)).toBeOnTheScreen();
    }
  });

  it('opens the app settings when the notification answer offers it', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    await fireEvent.press(screen.getAllByRole('button', { name: 'Open Settings' })[0]);

    expect(openAppSettings).toHaveBeenCalledTimes(1);
  });

  it('renders one button for each answer that offers a settings screen, plus Close', async () => {
    const offered = getHelpTopics('ios').filter((topic) => topic.action).length;
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(offered + 1);
  });

  it('offers no Do Not Disturb grant on iOS, which has none to give', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Grant Do Not Disturb access' })).not.toBeOnTheScreen();
  });

  it('reports Close when it is pressed', async () => {
    const onClose = jest.fn();
    await render(<ModalHelp visible={true} onClose={onClose} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // A style is read because it is a rule the app keeps: the answers must scroll, or ten of them push Close off screen
  it('scrolls its answers rather than growing past the screen', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    // The scroller carries no role, label or text, so it is reached by its host type
    const scroller = screen.root?.queryAll((node) => node.type === 'RCTScrollView')[0];

    expect(StyleSheet.flatten(scroller?.props.style).maxHeight).toBeGreaterThan(0);
  });
});

describe('the Help modal on Android', () => {
  it('opens the Do Not Disturb access screen from its own answer', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Grant Do Not Disturb access' }));

    expect(openDndAccessSettings).toHaveBeenCalledTimes(1);
    expect(openAppSettings).not.toHaveBeenCalled();
  });

  it('answers the restart question, which iOS never asks', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.getByText('I restarted my phone and heard nothing.')).toBeOnTheScreen();
  });
});

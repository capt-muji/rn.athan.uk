/**
 * The Help modal: the questions it lists on each platform, the settings screens its buttons open, and Close
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { onPlatform } from '@/__tests__/harness';
import { openAppSettings, openDndAccessSettings } from '@/device/notifications';
import { SIZE } from '@/shared/constants';
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

    expect(screen.getByText("Why don't I get any notifications?")).toBeOnTheScreen();
  });

  it('lists every question its platform answers', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    for (const { question } of getHelpTopics('ios')) {
      expect(screen.getByText(question)).toBeOnTheScreen();
    }
  });

  it('offers no settings button, because every answer names a setting rather than a route', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Open Settings' })).not.toBeOnTheScreen();
    expect(openAppSettings).not.toHaveBeenCalled();
  });

  it('shows every question closed, so the page opens as a list rather than a wall of text', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    for (const { question, text } of getHelpTopics('ios')) {
      expect(screen.getByText(question)).toBeOnTheScreen();
      expect(screen.queryByText(text)).not.toBeOnTheScreen();
    }
  });

  it('reveals one answer when its question is tapped, and hides it again', async () => {
    const [first] = getHelpTopics('ios');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: first.question }));
    expect(screen.getByText(first.text)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: first.question }));
    expect(screen.queryByText(first.text)).not.toBeOnTheScreen();
  });

  // One answer at a time, so the list never grows into the wall of text it replaced (owner, 2026-09-27)
  it('closes the open question when another is opened', async () => {
    const [first, second] = getHelpTopics('ios');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: first.question }));
    await fireEvent.press(screen.getByRole('button', { name: second.question }));

    expect(screen.queryByText(first.text)).not.toBeOnTheScreen();
    expect(screen.getByText(second.text)).toBeOnTheScreen();
  });

  // Each question is its own trigger, so a closed page carries one button per question plus Close
  it('makes every question a button, and adds Close', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(getHelpTopics('ios').length + 1);
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

  /**
   * A number would read as a route to follow, and a tick as something already done. Neither is true, so the
   * marker carries no meaning of its own (owner, 2026-09-27).
   */
  /**
   * The cut-off answer names a limit rather than a fix, so it carries no list. The panel must render
   * without one, which is the branch an all-answers-have-steps suite would never reach.
   */
  it('opens an answer that has nothing to change, and shows no list', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Why does the athan cut off early?' }));

    expect(screen.getByText(/Notification sounds are limited to 30 seconds/)).toBeOnTheScreen();
    expect(screen.queryByText('\u00bb')).not.toBeOnTheScreen();
  });

  it('numbers nothing it lists, so no item reads as a step or as done', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Why did notifications stop after a few days?' }));

    expect(screen.getByText('Turn on Background App Refresh in the app settings')).toBeOnTheScreen();
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
    expect(screen.queryByText('\u2713')).not.toBeOnTheScreen();
  });

  // The three modals share one compact Close button, so Help's must not drift wide again (owner, 2026-09-27)
  it('closes with the same compact button the other modals use', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const close = StyleSheet.flatten(screen.getByRole('button', { name: 'Close' }).props.style);

    expect(close.width).toBe(SIZE.modal.buttonWidth);
  });

  it('names the setting to change rather than the screen to find it on', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: "Why don't I get any notifications?" }));

    expect(screen.getByText('Turn on Allow Notifications in the app settings')).toBeOnTheScreen();
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
    await fireEvent.press(screen.getByRole('button', { name: 'Why are notifications silenced at certain times?' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Grant Do Not Disturb access' }));

    expect(openDndAccessSettings).toHaveBeenCalledTimes(1);
    expect(openAppSettings).not.toHaveBeenCalled();
  });

  it('answers the restart question, which both platforms ask', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.getByText('Why did notifications stop after a restart?')).toBeOnTheScreen();
  });
});

describe("the Help modal's chevron", () => {
  /** Every chevron drawn, which is one per question */
  const chevrons = () => screen.root?.queryAll((node) => node.props.children === '\u2304') ?? [];

  it('turns about its own centre, so it never swings sideways as it opens', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const style = StyleSheet.flatten(chevrons()[0].props.style);

    expect(style.textAlign).toBe('center');
    expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
  });

  it('keeps its squash while it turns, which a replaced transform array would drop', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const transform = StyleSheet.flatten(chevrons()[0].props.style).transform as Record<string, unknown>[];

    // Squashed then turned: applied right to left, so the squash rides with the glyph
    expect(transform).toEqual([{ rotate: '0deg' }, { scaleY: 0.6 }]);
  });

  it('turns upside down once its answer is open, and back when it closes', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    const rotation = () => (StyleSheet.flatten(chevrons()[0].props.style).transform as { rotate: string }[])[0].rotate;

    await fireEvent.press(screen.getByRole('button', { name: "Why don't I get any notifications?" }));
    expect(rotation()).toBe('-180deg');

    await fireEvent.press(screen.getByRole('button', { name: "Why don't I get any notifications?" }));
    expect(rotation()).toBe('0deg');
  });
});

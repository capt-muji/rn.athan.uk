/**
 * The Help modal: the questions it lists on each platform, the settings screens its buttons open, Close, and
 * Android's back press
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler, DeviceEventEmitter, StyleSheet } from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import type { TestInstance } from 'test-renderer';

import { onPlatform } from '@/__tests__/harness';
import { openDndAccessSettings } from '@/device/notifications';
import { COLORS, SIZE } from '@/shared/constants';
import { getHelpTopics } from '@/shared/help';
import { setActiveLocale } from '@/shared/i18n/locale';

import ModalHelp from '../Help';
import { scrollReveal } from '../helpReveal';

// The two settings screens leave the app, so opening them is observed instead of done
jest.mock('@/device/notifications', () => ({
  openDndAccessSettings: jest.fn(() => Promise.resolve(true)),
}));
// The reveal's scroll is observed at its own seam, which the renderer has no native host for
jest.mock('../helpReveal', () => ({ ...jest.requireActual('../helpReveal'), scrollReveal: jest.fn() }));
// Jest resolves React Native for iOS, whose BackHandler never fires. The back handling exists for Android, so the
// hardware back press runs through React Native's own Android implementation
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

const pressBack = () =>
  act(() => {
    DeviceEventEmitter.emit('hardwareBackPress');
  });

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

  // One answer at a time, so the list never grows into the wall of text it replaced
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

  it('answers the volume question with the ringer answer this platform plays by', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Which volume controls the sound level?' }));

    expect(
      screen.getByText('The athan plays at your ringer volume, and the Ring/Silent switch and Focus silence it.')
    ).toBeOnTheScreen();
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
   * marker carries no meaning of its own.
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

  // The three modals share one compact Close button, so Help's must not drift wide again
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
  });

  it('answers the volume question with the alarm volume it plays on', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Which volume controls the sound level?' }));

    expect(
      screen.getByText('The athan plays at alarm volume, not ring volume. Raise Alarm in your sound settings.')
    ).toBeOnTheScreen();
  });

  it('answers the restart question, which both platforms ask', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    expect(screen.getByText('Why did notifications stop after a restart?')).toBeOnTheScreen();
  });

  /**
   * The row the 3T never opened (comment 2169): the rendering proof that the press path itself is
   * sound, which separates a JS defect from native hit-testing before any fix is guessed at.
   */
  it('expands the widgets question when the row is pressed', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    const widgets = getHelpTopics('android').at(-1);

    await fireEvent.press(screen.getByRole('button', { name: widgets?.question }));

    expect(screen.getByText(widgets?.text ?? '')).toBeOnTheScreen();
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

  it('closes when Android\u2019s back button is pressed, rather than leaving the app', async () => {
    const onClose = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(<ModalHelp visible={true} onClose={onClose} />);

    await pressBack();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });
});

describe("the Help modal's fold reveal", () => {
  // The 3T defect (comment 2169): the list already overflows its viewport closed, so the last
  // row's answer opened wholly below the fold and read as a row that never expands
  const reportLayout = async (node: TestInstance, y: number, height: number) => {
    await fireEvent(node, 'layout', { nativeEvent: { layout: { x: 0, y, width: 1016, height } } });
  };
  const scroller = () => screen.root?.queryAll((node) => node.type === 'RCTScrollView')[0] as TestInstance;

  it('scrolls the minimum distance when an answer opens below the fold', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await reportLayout(scroller(), 0, 1190);
    const widgets = screen.getByRole('button', { name: 'Are widgets supported?' });
    await reportLayout(widgets, 1104, 127);

    await fireEvent.press(widgets);
    expect(jest.mocked(scrollReveal)).not.toHaveBeenCalled();

    await reportLayout(widgets, 1104, 281);
    expect(jest.mocked(scrollReveal)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(scrollReveal).mock.calls[0]?.[1]).toBe(195);
  });

  it('never moves the list for an answer that already fits the viewport', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await reportLayout(scroller(), 0, 1190);
    const first = screen.getByRole('button', { name: "Why don't I get any notifications?" });
    await reportLayout(first, 0, 128);

    await fireEvent.press(first);
    await reportLayout(first, 0, 300);

    expect(jest.mocked(scrollReveal)).not.toHaveBeenCalled();
  });

  it('holds the list still for an answer that fits wherever the list is scrolled', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    const list = scroller();
    await reportLayout(list, 0, 1190);
    await fireEvent(list, 'scroll', { nativeEvent: { contentOffset: { y: 300 } } });
    const widgets = screen.getByRole('button', { name: 'Are widgets supported?' });

    await fireEvent.press(widgets);
    await reportLayout(widgets, 1104, 200);

    expect(jest.mocked(scrollReveal)).not.toHaveBeenCalled();
  });

  it('reveals nothing before the list has measured its own viewport', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    const widgets = screen.getByRole('button', { name: 'Are widgets supported?' });

    await fireEvent.press(widgets);
    await reportLayout(widgets, 1104, 281);

    expect(jest.mocked(scrollReveal)).not.toHaveBeenCalled();
  });

  it('ignores the layout of rows that are not the open one', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);
    await reportLayout(scroller(), 0, 1190);
    const first = screen.getByRole('button', { name: "Why don't I get any notifications?" });
    const widgets = screen.getByRole('button', { name: 'Are widgets supported?' });
    await reportLayout(first, 0, 128);

    await fireEvent.press(first);
    await reportLayout(widgets, 1104, 281);

    expect(jest.mocked(scrollReveal)).not.toHaveBeenCalled();
  });
});

describe("the Help modal's Close row entrance", () => {
  // The row must join the modal container's entrance fade, never an ancestor's slide:
  // the nearest entering ancestor of Close is read.
  const enteringAncestorOf = (node: TestInstance): TestInstance | null => {
    let current: TestInstance | null = node.parent;
    while (current && !current.props?.entering) current = current.parent;
    return current;
  };
  const closeRow = () => enteringAncestorOf(screen.getByRole('button', { name: 'Close' }));
  // The coat is the row's only child with an entering of its own; text children arrive as strings
  const coatOf = (row: TestInstance | null): TestInstance | undefined =>
    (row?.children ?? []).find((child): child is TestInstance => typeof child !== 'string' && !!child.props?.entering);
  // Bareness is not identity alone: a modifier-cloned builder would still be a FadeIn, so the recorded
  // delay and duration are read as absent too
  const expectBareFadeIn = (entering: unknown) => {
    expect(entering).toBe(FadeIn);
    expect((entering as { delayV?: number }).delayV).toBeUndefined();
    expect((entering as { durationV?: number }).durationV).toBeUndefined();
  };

  it('fades in with the card on the modal container entrance fade', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const row = closeRow();

    expect(row?.props.entering).toBe(FadeIn);
  });

  /**
   * Over the card's still-fading white a second white composites ahead of the card (the strip reads
   * 1-(1-c)(1-rc) against the card's c), so Android paints the strip's white as a coat child that
   * waits out the container's fade instead of as the row's own background. The row itself carries
   * neither the white nor an opacity pin, which a later layout frame would clone back.
   */
  it('paints the strip white through a coat that waits out the entrance on Android', async () => {
    onPlatform('android');
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const row = closeRow();
    const coat = coatOf(row);

    expectBareFadeIn(row?.props.entering);
    expect(row?.props.layout).toBeDefined();
    expect(StyleSheet.flatten(row?.props.style).opacity).toBeUndefined();
    expect(StyleSheet.flatten(row?.props.style).backgroundColor).toBeUndefined();
    expect(coat).toBeDefined();
    expect(StyleSheet.flatten(coat?.props.style)).toEqual(
      expect.objectContaining({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.light.background,
      })
    );
    // 300ms is the modal container's bare FadeIn duration, the fade the coat waits out (Modal's suite pins it)
    expect(coat?.props.entering?.delayV).toBe(300);
  });

  it('enters on iOS with the style it carries today, its own white and no coat', async () => {
    await render(<ModalHelp visible={true} onClose={jest.fn()} />);

    const row = closeRow();

    expectBareFadeIn(row?.props.entering);
    expect(row?.props.layout).toBeDefined();
    expect(StyleSheet.flatten(row?.props.style).opacity).toBeUndefined();
    expect(StyleSheet.flatten(row?.props.style).backgroundColor).toBe(COLORS.light.background);
    expect(coatOf(row)).toBeUndefined();
  });
});

describe('the Help modal under ar', () => {
  it('renders every answer with the catalog bytes and Latin digits', async () => {
    setActiveLocale('ar');
    try {
      const topics = getHelpTopics('ios');
      await render(<ModalHelp visible={true} onClose={jest.fn()} />);

      for (const topic of topics) {
        await fireEvent.press(screen.getByRole('button', { name: topic.question }));
        const shown = screen.getByText(topic.text);
        expect(shown.props.children).toBe(topic.text);
        expect(shown.props.children).not.toMatch(/[\u0660-\u0669]/);
      }
    } finally {
      setActiveLocale('en');
    }
  });
});

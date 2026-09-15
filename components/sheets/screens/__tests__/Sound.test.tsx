/**
 * The athan sheet: when its rows are built, how a preview starts, counts down and stops, where its highlight sits, and
 * what closing it saves
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { type AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { showLondonDay } from '@/__tests__/harness';
import { ATHAN_AUDIOS } from '@/assets/audio';
import { getSoundPreference, setSoundPreference } from '@/stores/notifications';
import { setPlayingSoundIndex, setSoundListReady } from '@/stores/ui';

import SoundSheet from '../Sound';

interface PreviewPlayer {
  id: string;
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
}

interface PlayerStatus {
  id: string;
  playing: boolean;
  currentTime: number;
  duration: number;
}

// expo-audio's hook releases its player and makes a new one whenever the source changes, and its status hook keeps
// the last payload it had until the new player reports. The ISSUES #25 guard depends on both, so every test in this
// suite gets a player per source change and a status that outlives the player it came from
let preview: { source: AudioSource | undefined; player: PreviewPlayer | undefined; made: number };
let lastStatus: PlayerStatus;

jest.mocked(useAudioPlayer).mockImplementation((source) => {
  if (!preview.player || source !== preview.source) {
    preview.made += 1;
    preview.player = {
      id: `player ${preview.made}`,
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn(() => Promise.resolve()),
    };
    preview.source = source;
  }
  return preview.player as never;
});
jest.mocked(useAudioPlayerStatus).mockImplementation(() => lastStatus as never);

beforeEach(() => {
  preview = { source: undefined, player: undefined, made: 0 };
  lastStatus = { id: 'no player yet', playing: false, currentTime: 0, duration: 0 };
});

/** The player the sheet holds now */
const currentPlayer = () => preview.player as PreviewPlayer;

/** A status payload from the player the sheet holds now, which re-renders the sheet as the real hook's update does */
const reportFromCurrentPlayer = async (status: Omit<PlayerStatus, 'id'>, rerender: () => Promise<void>) => {
  lastStatus = { id: currentPlayer().id, ...status };
  await rerender();
};

// A row's play button has neither a label nor a role, so it is found where it sits: after the countdown, beside the
// row's name
const playButtonOf = (athan: number) => {
  const row = screen.getByText(`Athan ${athan}`).parent;
  const controls = row?.children[1];
  if (!controls || typeof controls === 'string') throw new Error(`Athan ${athan} has no controls`);
  const button = controls.children[1];
  if (!button || typeof button === 'string') throw new Error(`Athan ${athan} has no play button`);
  return button;
};

/** Closes the sheet as the bottom sheet library reports it, once the close has finished */
const closeSheet = () => fireEvent(screen.getByText('Select Athan'), 'dismiss');

/** Lets the save, which waits on scheduling, run to its end */
const settle = () => act(() => jest.runAllTimersAsync());

/** The first row reporting its height, which is what the highlight takes its size and spacing from */
const layOutFirstRow = (height: number) =>
  fireEvent(screen.getByText('Athan 1'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height } } });

// The highlight has neither a label nor a role: it is the first thing in the list, behind the rows. Reanimated's mock
// works an animated style out only when the sheet renders, so a test renders again before reading where it now sits
const highlight = () => {
  const indicator = screen.getByText('Athan 1').parent?.parent?.children[0];
  if (!indicator || typeof indicator === 'string') throw new Error('The list has no highlight');
  const style = StyleSheet.flatten(indicator.props.style) as {
    opacity?: number;
    height?: number;
    transform?: { translateY: number }[];
  };
  return { isShown: style.opacity === 1, height: style.height, offset: style.transform?.[0]?.translateY ?? 0 };
};

describe('the athan sheet, Friday 11 September 2026 at 14:00', () => {
  it('builds no rows until the settings sheet has fully opened', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<SoundSheet />);
    expect(screen.queryByText('Athan 1')).not.toBeOnTheScreen();

    await act(() => setSoundListReady());

    expect(screen.getAllByText(/^Athan \d+$/)).toHaveLength(ATHAN_AUDIOS.length);
  });

  it('builds its rows on its own first full open when the settings sheet did not', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<SoundSheet />);

    await fireEvent(screen.getByText('Select Athan'), 'change', 0);

    expect(screen.getAllByText(/^Athan \d+$/)).toHaveLength(ATHAN_AUDIOS.length);
  });

  it('plays the clip of a row from its start when its play button is pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);

    await fireEvent.press(playButtonOf(3));

    expect(useAudioPlayer).toHaveBeenLastCalledWith(ATHAN_AUDIOS[2]);
    expect(currentPlayer().seekTo).toHaveBeenCalledWith(0);
    expect(currentPlayer().play).toHaveBeenCalledTimes(1);
    const [seekedAt] = currentPlayer().seekTo.mock.invocationCallOrder;
    const [playedAt] = currentPlayer().play.mock.invocationCallOrder;
    expect(seekedAt).toBeLessThan(playedAt);
  });

  it('pauses and releases the clip when the playing row is pressed again', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);
    await fireEvent.press(playButtonOf(3));
    const playing = currentPlayer();

    await fireEvent.press(playButtonOf(3));

    expect(playing.pause).toHaveBeenCalledTimes(1);
    expect(useAudioPlayer).toHaveBeenLastCalledWith(null);
  });

  it('counts down the tabulated length of a clip whose player has not reported yet', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);

    await fireEvent.press(playButtonOf(2));

    expect(screen.getByText('0:30')).toBeOnTheScreen();
  });

  it('counts down what the playing clip reports once its player gives a duration', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    const { rerender } = await render(<SoundSheet />);
    await fireEvent.press(playButtonOf(2));

    await reportFromCurrentPlayer({ playing: true, currentTime: 10.2, duration: 30.4 }, () => rerender(<SoundSheet />));

    expect(screen.getByText('0:20')).toBeOnTheScreen();
  });

  it('releases the clip when its own player reports it finished', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    const { rerender } = await render(<SoundSheet />);
    await fireEvent.press(playButtonOf(1));

    await reportFromCurrentPlayer({ playing: false, currentTime: 28, duration: 28 }, () => rerender(<SoundSheet />));

    expect(useAudioPlayer).toHaveBeenLastCalledWith(null);
  });

  it('keeps a new row playing while the released player last reported its own clip finished', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    const { rerender } = await render(<SoundSheet />);
    await fireEvent.press(playButtonOf(1));
    await reportFromCurrentPlayer({ playing: false, currentTime: 28, duration: 28 }, () => rerender(<SoundSheet />));

    await fireEvent.press(playButtonOf(2));

    expect(useAudioPlayer).toHaveBeenLastCalledWith(ATHAN_AUDIOS[1]);
    expect(currentPlayer().play).toHaveBeenCalledTimes(1);
    expect(screen.getByText('0:30')).toBeOnTheScreen();
  });

  it('releases the clip as soon as the sheet starts to move', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);
    await fireEvent.press(playButtonOf(2));

    await fireEvent(screen.getByText('Select Athan'), 'animate', 0, -1);

    expect(useAudioPlayer).toHaveBeenLastCalledWith(null);
  });

  it('releases the clip when the sheet closes', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);
    await fireEvent.press(playButtonOf(2));

    await closeSheet();
    await settle();

    expect(useAudioPlayer).toHaveBeenLastCalledWith(null);
  });

  // row pressed, athan saved
  it.each([
    ['Athan 1', 0],
    ['Athan 12', 11],
  ])('saves %s when it is chosen and the sheet closes', async (row, athan) => {
    showLondonDay('2026-09-11', '14:00');
    setSoundPreference(5);
    setSoundListReady();
    await render(<SoundSheet />);
    await fireEvent.press(screen.getByText(row));

    await closeSheet();
    await settle();

    expect(getSoundPreference()).toBe(athan);
  });

  it('keeps the saved athan when the sheet closes with no row chosen', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundPreference(5);
    setSoundListReady();
    await render(<SoundSheet />);

    await closeSheet();
    await settle();

    expect(getSoundPreference()).toBe(5);
  });

  it('forgets a choice that failed to save, so the next close does not save it', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundPreference(5);
    setSoundListReady();
    await render(<SoundSheet />);
    await fireEvent.press(screen.getByText('Athan 7'));
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValueOnce(
      new Error('scheduler unavailable')
    );
    await closeSheet();
    await settle();

    await closeSheet();
    await settle();

    expect(getSoundPreference()).toBe(5);
  });

  it('starts no clip for a row marked playing before any play button in the sheet was pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    setPlayingSoundIndex(2);

    await render(<SoundSheet />);

    expect(currentPlayer().play).not.toHaveBeenCalled();
  });

  it('shows the highlight only once the first row has been measured', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);
    // A style is read because it is a rule the app keeps: a highlight drawn before the first row is measured has no
    // height, so it stays invisible until then
    expect(highlight().isShown).toBe(false);

    await layOutFirstRow(40);

    // The same rule: once the row is measured, the highlight shows
    expect(highlight().isShown).toBe(true);
  });

  it('keeps the height it first measured when the first row is laid out again at another height', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();
    await render(<SoundSheet />);
    await layOutFirstRow(40);

    await layOutFirstRow(60);

    // A style is read because it is a rule the app keeps: the highlight takes the first row's measured height once, so
    // a later layout cannot resize it away from the rows it sits behind
    expect(highlight().height).toBe(40);
  });

  it('places the highlight on the saved athan, then on the row chosen', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundPreference(2);
    setSoundListReady();
    const { rerender } = await render(<SoundSheet />);
    await layOutFirstRow(40);
    await rerender(<SoundSheet />);
    const onAthan3 = highlight().offset;

    await fireEvent.press(screen.getByText('Athan 7'));
    await rerender(<SoundSheet />);

    // The highlight is how the sheet shows which athan is chosen. Rows are evenly spaced, so the seventh row sits
    // three times as far down the list as the third
    expect(onAthan3).toBeGreaterThan(0);
    expect(highlight().offset).toBe(onAthan3 * 3);
  });

  it('sets the highlight on the saved athan without sliding, and slides it to a row chosen', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundPreference(2);
    setSoundListReady();
    const timing = jest.spyOn(Reanimated, 'withTiming');
    const { rerender } = await render(<SoundSheet />);
    await layOutFirstRow(40);
    await rerender(<SoundSheet />);
    // The sheet must open with the highlight already on the saved athan, not slide it in from the top
    expect(timing).not.toHaveBeenCalledWith(highlight().offset, expect.anything());

    await fireEvent.press(screen.getByText('Athan 7'));
    await rerender(<SoundSheet />);

    expect(timing).toHaveBeenCalledWith(highlight().offset, expect.anything());
  });
});

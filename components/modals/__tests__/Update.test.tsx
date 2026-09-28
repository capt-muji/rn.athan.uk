/**
 * The update prompt: what it asks, which choice each of its buttons reports, and Android's back press
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler, DeviceEventEmitter } from 'react-native';

import ModalUpdate from '../Update';

// Jest resolves React Native for iOS, whose BackHandler never fires. The back handling exists for Android, so the
// hardware back press runs through React Native's own Android implementation
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

const pressBack = () =>
  act(() => {
    DeviceEventEmitter.emit('hardwareBackPress');
  });

describe('the update prompt', () => {
  it('shows nothing while it is not visible', async () => {
    await render(<ModalUpdate visible={false} onClose={jest.fn()} onUpdate={jest.fn()} />);

    expect(screen.queryByText('Update Available!')).toBeNull();
  });

  it('asks whether to update now while visible', async () => {
    await render(<ModalUpdate visible={true} onClose={jest.fn()} onUpdate={jest.fn()} />);

    expect(screen.getByText('Update Available!')).toBeOnTheScreen();
    expect(screen.getByText('A new version is available. Would you like to update now?')).toBeOnTheScreen();
  });

  it('reports Later as closing the prompt without updating', async () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    await render(<ModalUpdate visible={true} onClose={onClose} onUpdate={onUpdate} />);

    await fireEvent.press(screen.getByText('Later'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('reports Update as updating without closing', async () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    await render(<ModalUpdate visible={true} onClose={onClose} onUpdate={onUpdate} />);

    await fireEvent.press(screen.getByText('Update'));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  // Both buttons are text with no role of their own, so a screen reader announces neither as pressable
  // [the button's name]
  it.each([['Later'], ['Update']])('offers %s to a screen reader as a button', async (name) => {
    await render(<ModalUpdate visible={true} onClose={jest.fn()} onUpdate={jest.fn()} />);

    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  });

  // The back press must mean Later, never Update: an accidental gesture must not start a download
  it('closes without updating when Android\u2019s back button is pressed', async () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(<ModalUpdate visible={true} onClose={onClose} onUpdate={onUpdate} />);

    await pressBack();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });
});

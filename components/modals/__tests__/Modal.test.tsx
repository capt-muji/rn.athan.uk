/**
 * The modal card the update prompt and What's New open in: shown only while visible, with its title above its
 * content, and closed by Android's back press
 */

import { act, render, screen } from '@testing-library/react-native';
import { BackHandler, DeviceEventEmitter, StyleSheet, Text } from 'react-native';

import Modal from '../Modal';

// Jest resolves React Native for iOS, whose BackHandler never fires. The modal's back handling exists for Android, so
// the hardware back press runs through React Native's own Android implementation
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

const pressBack = () =>
  act(() => {
    DeviceEventEmitter.emit('hardwareBackPress');
  });

describe('the modal card', () => {
  it('shows nothing while it is not visible', async () => {
    await render(
      <Modal visible={false} title="What's New">
        <Text>Tablet support</Text>
      </Modal>
    );

    expect(screen.queryByText("What's New")).toBeNull();
    expect(screen.queryByText('Tablet support')).toBeNull();
  });

  // A style is read because it is a rule the app keeps: the update prompt and What's New are compact cards, and only
  // a modal that asks for the wide one gets it
  it('stays a compact card, and rules nothing off, unless asked', async () => {
    await render(
      <Modal visible={true} title="What's New">
        <Text>Tablet support</Text>
      </Modal>
    );

    const card = screen.root?.queryAll((node) => node.type === 'View' && !!StyleSheet.flatten(node.props.style)?.width);

    expect(StyleSheet.flatten(card?.[0]?.props.style).width).toBe('85%');
  });

  it('shows its title and the content it is given while visible', async () => {
    await render(
      <Modal visible={true} title="What's New">
        <Text>Tablet support</Text>
      </Modal>
    );

    expect(screen.getByText("What's New")).toBeOnTheScreen();
    expect(screen.getByText('Tablet support')).toBeOnTheScreen();
  });
});

describe("Android's back button and a modal", () => {
  it('closes the modal while it is open, and keeps the app from going back', async () => {
    const onRequestClose = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(
      <Modal visible={true} title="What's New" onRequestClose={onRequestClose}>
        <Text>Tablet support</Text>
      </Modal>
    );

    await pressBack();

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('leaves the press to the app while the modal is not visible', async () => {
    const onRequestClose = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(
      <Modal visible={false} title="What's New" onRequestClose={onRequestClose}>
        <Text>Tablet support</Text>
      </Modal>
    );

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it('leaves the press to the app again once the modal has closed', async () => {
    const onRequestClose = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    const { rerender } = await render(
      <Modal visible={true} title="What's New" onRequestClose={onRequestClose}>
        <Text>Tablet support</Text>
      </Modal>
    );
    await rerender(
      <Modal visible={false} title="What's New" onRequestClose={onRequestClose}>
        <Text>Tablet support</Text>
      </Modal>
    );

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  // The three modals all pass one, but the prop is optional, so a modal without one must not swallow the press
  it('leaves the press to the app when no close handler is given', async () => {
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(
      <Modal visible={true} title="What's New">
        <Text>Tablet support</Text>
      </Modal>
    );

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
  });
});

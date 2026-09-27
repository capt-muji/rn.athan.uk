/**
 * The modal card the update prompt and What's New open in: shown only while visible, with its title above its content
 */

import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import Modal from '../Modal';

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

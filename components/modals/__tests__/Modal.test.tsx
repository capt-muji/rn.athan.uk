/**
 * The modal card the update prompt and What's New open in: shown only while visible, with its title above its content
 */

import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

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

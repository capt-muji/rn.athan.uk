/**
 * The update prompt: what it asks, and which choice each of its buttons reports
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import ModalUpdate from '../Update';

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
});

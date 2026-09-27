/**
 * The reminder interval stepper: what a screen reader hears of the value and each arrow, and which presses count
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import type { ReminderInterval } from '@/shared/types';

import Stepper from '../Stepper';

type Handler = 'onDecrement' | 'onIncrement';

describe('the reminder stepper at 15 min', () => {
  it('names the value and what each arrow moves it to, both arrows usable', async () => {
    await render(<Stepper value={15} onDecrement={jest.fn()} onIncrement={jest.fn()} />);

    expect(screen.getByLabelText('15 min')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Decrease to 10 min' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Increase to 20 min' })).toBeEnabled();
  });

  it('names the value and both arrows with the unit it is given', async () => {
    await render(<Stepper value={15} unit='minutes' onDecrement={jest.fn()} onIncrement={jest.fn()} />);

    expect(screen.getByLabelText('15 minutes')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Decrease to 10 minutes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Increase to 20 minutes' })).toBeOnTheScreen();
  });

  // Columns: the arrow pressed, the handler it calls, the handler it leaves alone
  it.each<[string, Handler, Handler]>([
    ['Decrease to 10 min', 'onDecrement', 'onIncrement'],
    ['Increase to 20 min', 'onIncrement', 'onDecrement'],
  ])('gives a light haptic when %s is pressed and calls %s only', async (name, called, untouched) => {
    const handlers = { onDecrement: jest.fn(), onIncrement: jest.fn() };
    await render(<Stepper value={15} {...handlers} />);

    await fireEvent.press(screen.getByRole('button', { name }));

    expect(handlers[called]).toHaveBeenCalledTimes(1);
    expect(handlers[untouched]).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});

describe('the reminder stepper at either end of the intervals', () => {
  // A dead arrow names the value it is already on, because there is nothing beyond it to name.
  // Columns: the value shown, its dead arrow, its live arrow
  it.each<[ReminderInterval, string, string]>([
    [5, 'Decrease to 5 min', 'Increase to 10 min'],
    [30, 'Increase to 30 min', 'Decrease to 25 min'],
  ])('at %i min, tells a screen reader %s is disabled and %s is not', async (value, dead, live) => {
    await render(<Stepper value={value} onDecrement={jest.fn()} onIncrement={jest.fn()} />);

    expect(screen.getByRole('button', { name: dead })).toBeDisabled();
    expect(screen.getByRole('button', { name: live })).toBeEnabled();
  });

  // Columns: the value shown, its dead arrow, the handler that arrow would call
  it.each<[ReminderInterval, string, Handler]>([
    [5, 'Decrease to 5 min', 'onDecrement'],
    [30, 'Increase to 30 min', 'onIncrement'],
  ])('at %i min, ignores a press on %s, with no haptic', async (value, dead, handler) => {
    const handlers = { onDecrement: jest.fn(), onIncrement: jest.fn() };
    await render(<Stepper value={value} {...handlers} />);

    await fireEvent.press(screen.getByRole('button', { name: dead }));

    expect(handlers[handler]).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('the reminder stepper beside the other reminder', () => {
  // The minute the other reminder holds is stepped OVER, so the two can never land together
  // and the user is never told why: there is nothing to tell, the value simply is not offered.
  // Columns: the value shown, the taken minute, the arrow's new name
  it.each<[ReminderInterval, number, string]>([
    [15, 10, 'Decrease to 5 min'],
    [15, 20, 'Increase to 25 min'],
    [10, 5, 'Decrease to 10 min'],
    [25, 30, 'Increase to 25 min'],
  ])('at %i min with %i taken, names the arrow %s', async (value, taken, name) => {
    await render(<Stepper value={value} taken={taken} onDecrement={jest.fn()} onIncrement={jest.fn()} />);

    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  });

  // The owner's two cases: a neighbour at the end of the list kills the arrow exactly as the
  // list's own end does, with no error and no special styling
  it.each<[ReminderInterval, number, string]>([
    [10, 5, 'Decrease to 10 min'],
    [25, 30, 'Increase to 25 min'],
  ])('at %i min with %i taken, disables the arrow that has nothing left to reach', async (value, taken, dead) => {
    await render(<Stepper value={value} taken={taken} onDecrement={jest.fn()} onIncrement={jest.fn()} />);

    expect(screen.getByRole('button', { name: dead })).toBeDisabled();
  });

  it('steps over the taken minute rather than refusing the press', async () => {
    const handlers = { onDecrement: jest.fn(), onIncrement: jest.fn() };
    await render(<Stepper value={15} taken={10} {...handlers} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Decrease to 5 min' }));

    expect(handlers.onDecrement).toHaveBeenCalledTimes(1);
  });

  it('offers every minute again once the other reminder is off', async () => {
    await render(<Stepper value={15} taken={null} onDecrement={jest.fn()} onIncrement={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Decrease to 10 min' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Increase to 20 min' })).toBeEnabled();
  });
});

describe('the reminder stepper at 15 min while the reminder is off', () => {
  it('tells a screen reader both arrows are disabled', async () => {
    await render(<Stepper value={15} onDecrement={jest.fn()} onIncrement={jest.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'Decrease to 10 min' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase to 20 min' })).toBeDisabled();
  });

  it('ignores presses on both arrows, with no haptic', async () => {
    const handlers = { onDecrement: jest.fn(), onIncrement: jest.fn() };
    await render(<Stepper value={15} {...handlers} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'Decrease to 10 min' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Increase to 20 min' }));

    expect(handlers.onDecrement).not.toHaveBeenCalled();
    expect(handlers.onIncrement).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

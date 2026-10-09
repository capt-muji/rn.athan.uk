/**
 * The icon the sheets and modals draw: the size and colour its caller asks for, and an animated icon that stays mounted
 */

import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';
import Animated from 'react-native-reanimated';

import ICONS from '@/assets/icons/svg';
import { Icon as IconType } from '@/shared/types';

import Icon from '../Icon';

// An icon has no role, label or text to be found by, so it is read as the root of what it renders

describe('an icon drawn without an animation', () => {
  it('draws at the size and in the colour its caller passes', async () => {
    await render(<Icon type={IconType.BELL_RING} size={16} color='rgba(165, 180, 252, 0.8)' />);

    expect(screen.root).toHaveProp('width', 16);
    expect(screen.root).toHaveProp('height', 16);
    expect(screen.root).toHaveStyle({ color: 'rgba(165, 180, 252, 0.8)' });
  });
});

// Animated icons are built once per icon type for as long as the module lives, so each test animates a type no
// earlier test has. A build's argument pins that a type drawn for the first time is built, rather than handed another
// type's cached build
describe('an icon driven by an animation', () => {
  it('builds the animated icon for its type and draws it with the style its animation drives', async () => {
    const build = jest.spyOn(Animated, 'createAnimatedComponent');

    await render(<Icon type={IconType.PLAY} size={22} animatedStyle={{ opacity: 0.5 }} />);

    expect(build).toHaveBeenCalledWith(ICONS[IconType.PLAY]);
    expect(screen.root).toHaveStyle({ opacity: 0.5 });
    build.mockRestore();
  });

  it('builds the animated icon for its type once, and keeps it mounted when its animation restyles it', async () => {
    // Reanimated's mock returns the component it is given, so every build looks like one type. The real library returns
    // a new type from every call, and React remounts an icon whose type changes, so that is what the mock returns once
    const buildNewType = (Drawn: ComponentType<object>) => (props: object) => <Drawn {...props} />;
    const build = jest
      .spyOn(Animated, 'createAnimatedComponent')
      .mockImplementationOnce(buildNewType as unknown as typeof Animated.createAnimatedComponent);
    await render(<Icon type={IconType.PAUSE} size={22} animatedStyle={{ opacity: 1 }} />);
    const drawn = screen.root;

    await screen.rerender(<Icon type={IconType.PAUSE} size={22} animatedStyle={{ opacity: 0.5 }} />);

    expect(build).toHaveBeenCalledWith(ICONS[IconType.PAUSE]);
    expect(screen.root).toBe(drawn);
    build.mockRestore();
  });
});

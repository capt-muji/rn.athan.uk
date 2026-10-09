/**
 * The surface and the backdrop every bottom sheet hands to the sheet library
 */

import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { render, screen } from '@testing-library/react-native';

import { renderBackdrop, renderSheetBackground } from '../Shared';

// What the library passes a backdrop: the sheet's animated position, and the style it animates the backdrop with
const LIBRARY_PROPS = {
  animatedIndex: { value: -1 },
  animatedPosition: { value: 0 },
  style: { opacity: 0 },
} as unknown as BottomSheetBackdropProps;

describe('the surface behind a sheet', () => {
  it('draws an empty surface, with nothing on it to read or press', async () => {
    await render(renderSheetBackground());

    expect(screen.root).toBeEmptyElement();
  });
});

describe('the backdrop behind a sheet', () => {
  it('appears once the sheet reaches its first snap point and is gone once the sheet has closed', () => {
    const backdrop = renderBackdrop(LIBRARY_PROPS);

    expect(backdrop.props).toMatchObject({ appearsOnIndex: 0, disappearsOnIndex: -1 });
  });

  it('keeps the style the library animates it with, so it fades with the sheet', () => {
    const backdrop = renderBackdrop(LIBRARY_PROPS);

    expect(backdrop.props.style).toContain(LIBRARY_PROPS.style);
  });
});

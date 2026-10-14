/**
 * The sheet footnote: one muted line under a hairline rule
 */

import { render, screen } from '@testing-library/react-native';

import { COLORS } from '@/shared/constants';

import SheetNote from '../Note';

const nodes = () => screen.root?.queryAll((node) => node.props.style !== undefined, { includeSelf: true }) ?? [];

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

describe('the sheet footnote', () => {
  it('draws its line above a hairline rule', async () => {
    await render(<SheetNote text='Plays at alarm volume, not ring volume.' />);

    expect(screen.getByText('Plays at alarm volume, not ring volume.')).toBeOnTheScreen();
    // The rule is the only node wearing the subtitle ink as a background; it carries no text to find it by
    const rule = nodes().find((node) => flattenStyle(node.props.style).backgroundColor === COLORS.text.sheetSubtitle);
    expect(rule).toBeDefined();
    expect(flattenStyle(rule?.props.style).opacity).toBe(0.2);
  });
});

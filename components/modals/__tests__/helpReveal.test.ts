/**
 * The fold reveal's native boundary: one scroll call, tolerant of a list that never mounted
 */

import { revealTarget, scrollReveal } from '../helpReveal';

describe('scrollReveal', () => {
  it('scrolls the list to the offset it was given, animated', () => {
    const scrollTo = jest.fn();
    const list = { scrollTo } as unknown as Parameters<typeof scrollReveal>[0];

    scrollReveal(list, 195);

    expect(scrollTo).toHaveBeenCalledWith({ y: 195, animated: true });
  });

  it('tolerates a list that never mounted', () => {
    expect(() => scrollReveal(null, 195)).not.toThrow();
  });
});

describe('revealTarget', () => {
  const row = (y: number, height: number) => ({ y, height });

  it('returns the least offset that shows a bottom opening below the fold at rest', () => {
    expect(revealTarget(row(1104, 281), 1190, 0)).toBe(195);
  });

  it('returns null when the bottom already fits the window it sits in', () => {
    expect(revealTarget(row(0, 300), 1190, 0)).toBeNull();
  });

  it('never scrolls backward for a bottom that fits the window at a live offset', () => {
    // Scrolled to 300, the window reaches 1490: a bottom at 1304 is already on glass
    expect(revealTarget(row(1104, 200), 1190, 300)).toBeNull();
  });

  it('targets the least offset showing the bottom from wherever the list sits', () => {
    expect(revealTarget(row(1400, 400), 1190, 300)).toBe(610);
  });

  it('returns null before any viewport height is measured', () => {
    expect(revealTarget(row(1104, 281), 0, 0)).toBeNull();
  });
});

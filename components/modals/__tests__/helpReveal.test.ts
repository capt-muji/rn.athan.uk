/**
 * The fold reveal's native boundary: one scroll call, tolerant of a list that never mounted
 */

import { scrollReveal } from '../helpReveal';

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

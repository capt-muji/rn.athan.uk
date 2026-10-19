/**
 * The one native boundary the fold reveal crosses: scroll the list by the offset an opened
 * row's layout asked for. Extracted so the modal's tests can intercept the scroll without a
 * native scroll host, which the renderer never provides.
 */
export const scrollReveal = (
  list: { scrollTo: (options: { y: number; animated: boolean }) => void } | null,
  y: number
): void => {
  list?.scrollTo({ y, animated: true });
};

/**
 * The least scroll offset that shows a grown row's bottom, or null when it already fits the
 * window it sits in: the window is the live offset plus the viewport, so a list that sits
 * scrolled stills for any answer already on glass.
 */
export const revealTarget = (
  row: { y: number; height: number },
  viewportHeight: number,
  scrollY: number
): number | null => {
  const bottom = row.y + row.height;
  if (viewportHeight <= 0) return null;
  if (bottom <= scrollY + viewportHeight) return null;
  return bottom - viewportHeight;
};

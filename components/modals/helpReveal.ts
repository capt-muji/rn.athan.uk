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

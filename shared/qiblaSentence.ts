/**
 * What the qibla screen says, in words
 *
 * The sentence names a street rather than a bearing, because a user can check a street and cannot check a
 * number. It is never read alone: a street is a line with two directions, so the turn is ambiguous without
 * the drawn map beside it, which has only one orientation.
 */

import type { QiblaFromStreet } from '@/shared/qiblaStreet';

/** Under this the turn is noise against the map's own alignment error, so naming it would imply a precision the picture cannot support */
const ALONG_THE_STREET_DEGREES = 5;

/**
 * The sentence for a street and its turn
 *
 * @param answer The street and the turn from it
 * @returns The line the user reads under the map
 */
export const qiblaSentence = (answer: QiblaFromStreet): string => {
  const rounded = Math.round(answer.turn);
  if (rounded < ALONG_THE_STREET_DEGREES) return `The qibla runs along ${answer.street.name}.`;

  return `Stand along ${answer.street.name}, then turn ${rounded} degrees to the ${answer.side}.`;
};

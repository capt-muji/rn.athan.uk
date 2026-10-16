/**
 * The colon's colour endpoints, pure so the pair per row state is testable without a renderer
 * (the same split as components/prayer/tipGeometry.ts).
 *
 * The animated style owns the colon permanently: a static ink swapped into the style array
 * after an animated one leaves it does not land on Fabric, which keeps the last value the
 * UI thread applied - the dim colour an upcoming row faded from (owner report, 2026-10-16).
 */

import { COLORS } from '@/shared/constants';

/** Which row the pair is for */
export interface ColonInkRow {
  isNext: boolean;
  isPassed: boolean;
  isSelected: boolean;
  isStandard: boolean;
}

export const colonInkPair = ({
  isNext,
  isPassed,
  isSelected,
  isStandard,
}: ColonInkRow): {
  from: string;
  to: string;
} => {
  if (isNext) {
    return {
      from: COLORS.countdown.timeColon,
      to: isStandard ? COLORS.countdown.nextTimeColon : COLORS.countdown.nextTimeColonExtras,
    };
  }
  if (isPassed) {
    return { from: COLORS.countdown.timeColon, to: COLORS.countdown.pastTimeColon };
  }
  // An upcoming row rests on the dim ink; selection is the only path to its bright ink
  return {
    from: COLORS.countdown.timeColon,
    to: isSelected ? COLORS.text.primary : COLORS.countdown.timeColon,
  };
};

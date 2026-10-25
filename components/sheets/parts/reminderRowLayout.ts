/**
 * The reminder rows' control width, pure so it can be tested without a renderer (same split as
 * reminderStep.ts).
 *
 * A wide-glyph locale's option labels must not eat the centered breathing room today's English layout shows, so the
 * rows hold their control at a minimum width: the width whose every option carries exactly English's own per-side
 * slack. The algebra collapses to growth of exactly twice the content's excess over English, and English itself asks
 * for exactly the width it already has, so no locale narrower than English ever moves a pixel.
 */

import { SPACING } from '@/shared/constants';

/** The fixed label column left of every reminder control (ReminderCard's optionLabel width) */
export const OPTION_LABEL_WIDTH = 100;
/** The wash container's padding, each side (SegmentedControl's container padding) */
export const SEGMENT_WASH_PADDING = 3;
/** The icon slot every option carries beside its label (SegmentedControl's iconContainer) */
export const SEGMENT_ICON_SIZE = 13;

/**
 * One option's content width: its icon, the icon-label gap, and the measured label text.
 *
 * @param labelTextWidth The option's label at its widest line
 * @returns The width the option centers inside its half of the control
 */
export const segmentContentWidth = (labelTextWidth: number): number => SEGMENT_ICON_SIZE + SPACING.sm + labelTextWidth;

/**
 * The control width the reminder rows must not render below.
 *
 * @param rowWidth The option row's own measured width
 * @param baselineContentWidth The English pair's widest option, in English typography: the slack this
 *   function floors every other locale at
 * @param contentWidth The active locale's widest option, in its own typography
 * @returns The minimum control width, or 0 while any measurement is still missing, which is no minimum at
 *   all and so keeps today's layout on the first frame
 */
export const requiredControlWidth = ({
  rowWidth,
  baselineContentWidth,
  contentWidth,
}: {
  rowWidth: number;
  baselineContentWidth: number;
  contentWidth: number;
}): number => {
  if (rowWidth <= 0 || baselineContentWidth <= 0 || contentWidth <= 0) return 0;

  const available = rowWidth - OPTION_LABEL_WIDTH - SPACING.md;
  const optionToday = (available - SEGMENT_WASH_PADDING * 2) / 2;
  // English's own per-side slack, halved because the option centers its content; clamped because a
  // device narrow enough that English itself has none is content-fit already
  const floor = Math.max(0, optionToday - baselineContentWidth) / 2;

  return (contentWidth + floor * 2) * 2 + SEGMENT_WASH_PADDING * 2;
};

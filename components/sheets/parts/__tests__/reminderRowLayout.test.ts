/**
 * The reminder rows' control width. The floor is the per-side slack today's English layout shows, so a wide-glyph
 * locale grows the control by exactly what its content needs and English never moves a pixel.
 */

import { requiredControlWidth, segmentContentWidth } from '../reminderRowLayout';

// The comfortable geometry the row carries on the owner's phones: the row is 303 wide, the label column 100 and the
// row gap 12 leave 191 available, and the wash container's 3pt padding each side leaves 92.5 per option. English's
// own pair is 61 of content (icon 13 + gap 8 + the wider label's 40), so today's per-side slack is 15.75
const ROW_WIDTH = 303;
const AVAILABLE = 191;
const OPTION_TODAY = 92.5;
const BASELINE_CONTENT = 61;
const FLOOR = 15.75;

describe('segmentContentWidth', () => {
  it('sizes an option by its icon, the icon-label gap and the label text', () => {
    // 13 + 8 + the text
    expect(segmentContentWidth(40)).toBe(61);
    expect(segmentContentWidth(28)).toBe(49);
    expect(segmentContentWidth(0)).toBe(21);
  });
});

describe('requiredControlWidth', () => {
  it('asks for exactly the available width when the content is the English baseline', () => {
    expect(
      requiredControlWidth({
        rowWidth: ROW_WIDTH,
        baselineContentWidth: BASELINE_CONTENT,
        contentWidth: BASELINE_CONTENT,
      })
    ).toBe(AVAILABLE);
  });

  it('grows by exactly twice the content excess', () => {
    // 191 + 2 * (73 - 61)
    expect(
      requiredControlWidth({ rowWidth: ROW_WIDTH, baselineContentWidth: BASELINE_CONTENT, contentWidth: 73 })
    ).toBe(215);
    // 191 + 2 * (69 - 61): the Somali pair's own 48-wide label
    expect(
      requiredControlWidth({ rowWidth: ROW_WIDTH, baselineContentWidth: BASELINE_CONTENT, contentWidth: 69 })
    ).toBe(207);
  });

  it('leaves each option exactly the floor of per-side slack while growing', () => {
    // The minimum binds, so each option is (215 - 6) / 2 = 104.5 wide: (104.5 - 73) / 2 = 15.75
    const optionAtMinimum =
      (requiredControlWidth({ rowWidth: ROW_WIDTH, baselineContentWidth: BASELINE_CONTENT, contentWidth: 73 }) - 6) / 2;
    expect((optionAtMinimum - 73) / 2).toBe(FLOOR);
  });

  it('never binds when the content is narrower than English', () => {
    // (40 + 31.5) * 2 + 6: below today's width, so the row keeps the width it already had
    const required = requiredControlWidth({
      rowWidth: ROW_WIDTH,
      baselineContentWidth: BASELINE_CONTENT,
      contentWidth: 40,
    });
    expect(required).toBe(149);
    expect(required).toBeLessThan(AVAILABLE);
    // At the width the row does keep, the slack is (92.5 - 40) / 2 = 26.25, above the floor
    expect((OPTION_TODAY - 40) / 2).toBeGreaterThan(FLOOR);
  });

  it('floors at 0 on a device too narrow for English itself to have slack', () => {
    // 150 - 100 - 12 = 38 available, 16 per option: below the 61 baseline, so the floor clamps and the
    // control fits its content alone
    expect(
      requiredControlWidth({ rowWidth: 150, baselineContentWidth: BASELINE_CONTENT, contentWidth: BASELINE_CONTENT })
    ).toBe(128);
    expect(requiredControlWidth({ rowWidth: 150, baselineContentWidth: BASELINE_CONTENT, contentWidth: 73 })).toBe(152);
  });

  it('answers 0 before the row has been laid out', () => {
    expect(
      requiredControlWidth({ rowWidth: 0, baselineContentWidth: BASELINE_CONTENT, contentWidth: BASELINE_CONTENT })
    ).toBe(0);
  });

  it('answers 0 before the English pair has been measured', () => {
    expect(requiredControlWidth({ rowWidth: ROW_WIDTH, baselineContentWidth: 0, contentWidth: BASELINE_CONTENT })).toBe(
      0
    );
  });

  it('answers 0 before the active pair has been measured', () => {
    expect(requiredControlWidth({ rowWidth: ROW_WIDTH, baselineContentWidth: BASELINE_CONTENT, contentWidth: 0 })).toBe(
      0
    );
  });
});

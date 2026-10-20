/**
 * shared/insets.ts against the T-264 phantom-inset fence and the T-280 tall canvas
 *
 * At or below the largest top inset any iPhone delivers the clamp is the identity, so every phone
 * geometry renders bit-identically to the day before it. Above it the inset cannot name a phone:
 * it is either the tall Duo canvas's real hazard inset, honored because a window wider than the
 * app's own content column is a panel-class canvas whose hazards sit inside it, or a scaled
 * letterbox window's phantom, zeroed because the system letterboxes that window precisely so the
 * panel's hazards sit outside it. The two carry the same measured number (82), so the window's
 * width, never the inset's value, tells them apart.
 */

import { SIZE } from '@/shared/constants';
import { honoredTopInset } from '@/shared/insets';

describe('the honored top inset', () => {
  it.each([
    [0, 393, 0],
    [20, 430, 20],
    [47, 402, 47],
    [62, 440, 62],
  ])('honors the phone-class inset %i on a %ipt window', (top, width, honored) => {
    expect(honoredTopInset(top, width)).toBe(honored);
  });

  it.each([
    [63, 440],
    [80, 393],
  ])("clamps a phone window's %ipt inset to zero", (top, width) => {
    expect(honoredTopInset(top, width)).toBe(0);
  });

  it.each([
    [82, 669, 82],
    [63, 951, 63],
  ])("honors the tall canvas's real %ipt inset on a %ipt window", (top, width, honored) => {
    expect(honoredTopInset(top, width)).toBe(honored);
  });

  it.each([
    [82, 469],
    [63, 466],
  ])("clamps the letterbox window's phantom %ipt inset on a %ipt window to zero", (top, width) => {
    expect(honoredTopInset(top, width)).toBe(0);
  });

  it('splits the fence at the content column, not a device', () => {
    expect(honoredTopInset(82, SIZE.contentMaxWidth + 1)).toBe(82);
    expect(honoredTopInset(82, SIZE.contentMaxWidth)).toBe(0);
  });
});

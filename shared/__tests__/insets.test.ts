/**
 * shared/insets.ts against the T-264 phantom-inset fence
 *
 * At or below the largest top inset any iPhone delivers the clamp is the identity, so every phone
 * geometry renders bit-identically to the day before it. Above it the inset cannot name a phone:
 * it names a compat-scaled window, and zero is the true inset for that geometry because the system
 * letterboxes the window precisely so the panel's hazards sit outside it.
 */

import { honoredTopInset } from '@/shared/insets';

describe('the honored top inset', () => {
  it.each([
    [0, 0],
    [20, 20],
    [47, 47],
    [62, 62],
  ])('honors the phone-class inset %i', (top, honored) => {
    expect(honoredTopInset(top)).toBe(honored);
  });

  it.each([63, 80, 100])("clamps the scaled window's %ipt inset to zero", (top) => {
    expect(honoredTopInset(top)).toBe(0);
  });
});

/**
 * Unit tests for the persisted shapes in shared/types.ts
 *
 * These pin storage contracts rather than behaviour. An enum whose numbers are
 * written into MMKV cannot be reordered or have a member inserted without
 * re-reading every existing user's stored choice as a different one, and a
 * symbol-to-symbol assertion stays true through exactly that change.
 */

import { AlertType, ScheduleType } from '../types';

// =============================================================================
// AlertType STORAGE CONTRACT TESTS
// =============================================================================

describe('AlertType storage contract', () => {
  it('pins the three persisted integers by value, not by symbol', () => {
    expect([AlertType.Off, AlertType.Silent, AlertType.Sound]).toEqual([0, 1, 2]);
  });

  it('keeps Off at zero, which the falsy checks and the default both rely on', () => {
    expect(AlertType.Off).toBe(0);
  });

  it('has exactly three members, so an inserted one has to come here first', () => {
    const numericValues = Object.values(AlertType).filter((value) => typeof value === 'number');

    expect(numericValues).toEqual([0, 1, 2]);
  });
});

// =============================================================================
// ScheduleType STORAGE CONTRACT TESTS
// =============================================================================

describe('ScheduleType storage contract', () => {
  it('pins the string values, which appear inside MMKV key names', () => {
    expect(ScheduleType.Standard).toBe('standard');
    expect(ScheduleType.Extra).toBe('extra');
  });
});

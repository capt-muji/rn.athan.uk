import { buildLockCardContent } from '../lockCard';
import type { AndroidWidgetDay } from '../widgetTypes';

const NOW = Date.parse('2026-09-25T12:00:00Z');
const MINUTE = 60_000;

const day = (rows: AndroidWidgetDay['rows']): AndroidWidgetDay => ({
  dateLabel: '25 Sept',
  startEpochMs: Date.parse('2026-09-25T00:00:00Z'),
  rows,
});

// =============================================================================
// BUILD LOCK CARD CONTENT TESTS
// =============================================================================

describe('buildLockCardContent', () => {
  it('picks the earliest prayer still ahead, skipping those already passed', () => {
    const snapshot = {
      days: [
        day([
          { name: 'Fajr', time: '05:12', epochMs: NOW - 60 * MINUTE },
          { name: 'Magrib', time: '18:42', epochMs: NOW + 368 * MINUTE },
          { name: 'Isha', time: '20:10', epochMs: NOW + 490 * MINUTE },
        ]),
      ],
    };

    expect(buildLockCardContent(snapshot, NOW)).toEqual({
      name: 'Magrib',
      time: '18:42',
      countdown: '6h 8m',
    });
  });

  it('searches across days, not just the first', () => {
    const snapshot = {
      days: [
        day([{ name: 'Isha', time: '20:10', epochMs: NOW - MINUTE }]),
        day([{ name: 'Fajr', time: '05:12', epochMs: NOW + 90 * MINUTE }]),
      ],
    };

    expect(buildLockCardContent(snapshot, NOW)?.name).toBe('Fajr');
  });

  it('picks the earliest ahead even when the rows are not in time order', () => {
    const snapshot = {
      days: [
        day([
          { name: 'Isha', time: '20:10', epochMs: NOW + 490 * MINUTE },
          { name: 'Magrib', time: '18:42', epochMs: NOW + 368 * MINUTE },
        ]),
      ],
    };

    expect(buildLockCardContent(snapshot, NOW)?.name).toBe('Magrib');
  });

  it('drops the hours part below an hour', () => {
    const snapshot = { days: [day([{ name: 'Asr', time: '15:30', epochMs: NOW + 12 * MINUTE }])] };

    expect(buildLockCardContent(snapshot, NOW)?.countdown).toBe('12m');
  });

  it('drops the minutes part on a whole hour', () => {
    const snapshot = { days: [day([{ name: 'Asr', time: '15:30', epochMs: NOW + 120 * MINUTE }])] };

    expect(buildLockCardContent(snapshot, NOW)?.countdown).toBe('2h');
  });

  it('ceils a part minute, so the label never reads a minute not yet reached', () => {
    const snapshot = { days: [day([{ name: 'Asr', time: '15:30', epochMs: NOW + MINUTE + 1 }])] };

    expect(buildLockCardContent(snapshot, NOW)?.countdown).toBe('2m');
  });

  it('ignores unreadable rows, which carry epoch 0', () => {
    const snapshot = {
      days: [
        day([
          { name: 'Duha', time: '--:--', epochMs: 0 },
          { name: 'Magrib', time: '18:42', epochMs: NOW + 30 * MINUTE },
        ]),
      ],
    };

    expect(buildLockCardContent(snapshot, NOW)?.name).toBe('Magrib');
  });

  it('answers null when nothing readable is still ahead', () => {
    const snapshot = { days: [day([{ name: 'Isha', time: '20:10', epochMs: NOW - MINUTE }])] };

    expect(buildLockCardContent(snapshot, NOW)).toBeNull();
  });

  it('answers null on an empty window', () => {
    expect(buildLockCardContent({ days: [] }, NOW)).toBeNull();
  });

  it('treats a prayer exactly at the instant as passed', () => {
    const snapshot = { days: [day([{ name: 'Isha', time: '20:10', epochMs: NOW }])] };

    expect(buildLockCardContent(snapshot, NOW)).toBeNull();
  });
});

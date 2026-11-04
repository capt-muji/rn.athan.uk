import fs from 'node:fs';
import path from 'node:path';

import { transformApiData } from '@/shared/prayer';
import {
  COLUMNS,
  DAY_COUNT,
  dayIndex,
  decodeTimetableHeader,
  EPOCH_DAY,
  HEADER_BYTES,
  minutesToRecord,
  NULL_MINUTE,
  readDayMinutes,
} from '@/shared/timetableDecode';
import type { ISingleApiResponseTransformed } from '@/shared/types';

/** A minimal well-formed artifact: header plus dayCount days of six minutes each */
const buildArtifact = (overrides: { bytes?: Buffer; header?: Partial<Buffer> } = {}): Uint8Array => {
  const buffer = Buffer.alloc(HEADER_BYTES + DAY_COUNT * COLUMNS.length * 2);
  buffer.write('LUPT', 0, 'ascii');
  buffer.writeUInt16LE(1, 4);
  buffer.writeUInt16LE(EPOCH_DAY, 6);
  buffer.writeUInt16LE(DAY_COUNT, 8);
  buffer.writeUInt16LE(COLUMNS.length, 10);
  for (let day = 0; day < DAY_COUNT; day += 1) {
    for (let column = 0; column < COLUMNS.length; column += 1) {
      buffer.writeUInt16LE(300 + day + column, HEADER_BYTES + (day * COLUMNS.length + column) * 2);
    }
  }
  Object.assign(buffer, overrides.header ?? {});
  return new Uint8Array(overrides.bytes ?? buffer);
};

describe('timetableDecode header validation', () => {
  it('accepts a well-formed header and reports its counts', () => {
    expect(decodeTimetableHeader(buildArtifact())).toEqual({
      epochDay: EPOCH_DAY,
      dayCount: DAY_COUNT,
      columns: COLUMNS.length,
    });
  });

  it('rejects a wrong magic', () => {
    const bytes = buildArtifact();
    bytes[0] = 'X'.charCodeAt(0);
    expect(decodeTimetableHeader(bytes)).toBeNull();
  });

  it('rejects an unknown format version', () => {
    const bytes = buildArtifact();
    bytes[4] = 2;
    expect(decodeTimetableHeader(bytes)).toBeNull();
  });

  it('rejects a truncated buffer', () => {
    const bytes = buildArtifact().slice(0, HEADER_BYTES + 40);
    expect(decodeTimetableHeader(bytes)).toBeNull();
  });

  it('rejects a buffer shorter than the header itself', () => {
    expect(decodeTimetableHeader(buildArtifact().slice(0, HEADER_BYTES - 1))).toBeNull();
    expect(decodeTimetableHeader(new Uint8Array(0))).toBeNull();
  });

  it('rejects a buffer whose length disagrees with its own counts', () => {
    const buffer = Buffer.from(buildArtifact());
    buffer.writeUInt16LE(DAY_COUNT - 1, 8);
    expect(decodeTimetableHeader(new Uint8Array(buffer))).toBeNull();
  });

  it('rejects a header for a different column count than this build expects', () => {
    const buffer = Buffer.from(buildArtifact());
    buffer.writeUInt16LE(COLUMNS.length + 1, 10);
    expect(decodeTimetableHeader(new Uint8Array(buffer))).toBeNull();
  });

  it('rejects a header for a different span than this build expects', () => {
    const buffer = Buffer.from(buildArtifact());
    buffer.writeUInt16LE(EPOCH_DAY + 1, 6);
    buffer.writeUInt16LE(DAY_COUNT, 8);
    // Length stays consistent, so only the constant check can catch it
    const padded = Buffer.concat([buffer, Buffer.alloc(2 * COLUMNS.length)]);
    expect(decodeTimetableHeader(new Uint8Array(padded))).toBeNull();
  });
});

describe('timetableDecode date arithmetic', () => {
  it('indexes the first day as 0 and the last as dayCount - 1', () => {
    expect(dayIndex('2026-01-01')).toBe(0);
    expect(dayIndex('2076-12-31')).toBe(DAY_COUNT - 1);
  });

  it('returns null outside the span', () => {
    expect(dayIndex('2025-12-31')).toBeNull();
    expect(dayIndex('2077-01-01')).toBeNull();
  });

  it('returns null for a date that does not exist', () => {
    // Date.UTC auto-rolls 2027-02-29 to 2027-03-01; the round-trip check must catch it
    expect(dayIndex('2027-02-29')).toBeNull();
    expect(dayIndex('2026-13-01')).toBeNull();
    expect(dayIndex('not-a-date')).toBeNull();
    expect(dayIndex('9999-99-99')).toBeNull();
  });

  it('counts leap days inside the span', () => {
    expect(dayIndex('2028-02-29')).toBe(dayIndex('2028-02-28')! + 1);
    expect(dayIndex('2027-03-01')).toBe(dayIndex('2027-02-28')! + 1);
  });
});

describe('timetableDecode row reading', () => {
  /** The full-size artifact with day 0's row replaced by the given minutes */
  const artifactWithFirstRow = (minutes: number[]): Uint8Array => {
    const bytes = buildArtifact();
    minutes.forEach((minute, i) => {
      bytes.set([minute & 0xff, minute >> 8], HEADER_BYTES + i * 2);
    });
    return bytes;
  };

  it('reads the six minutes of a day in canonical order', () => {
    const minutes = [386, 483, 729, 827, 965, 1062];
    const bytes = artifactWithFirstRow(minutes);
    const header = decodeTimetableHeader(bytes)!;
    expect(readDayMinutes(bytes, header, 0)).toEqual(minutes);
  });

  it('reads the null sentinel as null, never as a time', () => {
    const bytes = artifactWithFirstRow([386, NULL_MINUTE, 729, 827, 965, 1062]);
    const header = decodeTimetableHeader(bytes)!;
    expect(readDayMinutes(bytes, header, 0)).toEqual([386, null, 729, 827, 965, 1062]);
  });
});

describe('timetableDecode record building', () => {
  it('builds the same record the download pipeline built, derived times included', () => {
    const minutes = { fajr: 386, sunrise: 483, dhuhr: 729, asr: 827, magrib: 965, isha: 1062 };
    const record = minutesToRecord('2027-01-01', minutes);

    const [fromPipeline] = transformApiData({
      city: 'london',
      times: {
        '2027-01-01': { fajr: '06:26', sunrise: '08:03', dhuhr: '12:09', asr: '13:47', magrib: '16:05', isha: '17:42' },
      },
    });

    expect(record).toEqual(fromPipeline);
  });

  it('carries a null time into its derived time', () => {
    const record = minutesToRecord('2027-06-01', {
      fajr: null,
      sunrise: 300,
      dhuhr: 729,
      asr: 827,
      magrib: 965,
      isha: 1062,
    });
    expect(record.fajr).toBeNull();
    expect(record.suhoor).toBeNull();
    expect(record.sunrise).toBe('05:00');
    expect(record.duha).toBe('05:20');
  });

  it('reads each null leg the sentinel can stand in', () => {
    const allNull = minutesToRecord('2027-06-02', {
      fajr: null,
      sunrise: null,
      dhuhr: null,
      asr: null,
      magrib: null,
      isha: null,
    });
    expect(allNull).toEqual({
      date: '2027-06-02',
      fajr: null,
      sunrise: null,
      dhuhr: null,
      asr: null,
      magrib: null,
      isha: null,
      suhoor: null,
      duha: null,
      istijaba: null,
    });

    const magribNull = minutesToRecord('2027-06-03', {
      fajr: 386,
      sunrise: 483,
      dhuhr: 729,
      asr: 827,
      magrib: null,
      isha: 1062,
    });
    expect(magribNull.magrib).toBeNull();
    expect(magribNull.istijaba).toBeNull();
    expect(magribNull.isha).toBe('17:42');
  });

  it('wraps a derived time past midnight like adjustTime does', () => {
    const record = minutesToRecord('2027-04-01', {
      fajr: 10,
      sunrise: 300,
      dhuhr: 729,
      asr: 827,
      magrib: 965,
      isha: 1062,
    });
    expect(record.fajr).toBe('00:10');
    expect(record.suhoor).toBe('23:50');
  });
});

describe('the committed artifact', () => {
  const artifact = new Uint8Array(fs.readFileSync(path.resolve(__dirname, '../../assets/data/london-2026-2076.bin')));

  it('carries a valid header for this build', () => {
    expect(decodeTimetableHeader(artifact)).toEqual({
      epochDay: EPOCH_DAY,
      dayCount: DAY_COUNT,
      columns: COLUMNS.length,
    });
  });

  it('holds the banked triple-verified 2027-01-01 times', () => {
    const header = decodeTimetableHeader(artifact)!;
    const index = dayIndex('2027-01-01')!;
    const minutes = readDayMinutes(artifact, header, index)!;
    expect(
      minutesToRecord('2027-01-01', {
        fajr: minutes[0],
        sunrise: minutes[1],
        dhuhr: minutes[2],
        asr: minutes[3],
        magrib: minutes[4],
        isha: minutes[5],
      })
    ).toEqual({
      date: '2027-01-01',
      fajr: '06:26',
      sunrise: '08:03',
      dhuhr: '12:09',
      asr: '13:47',
      magrib: '16:05',
      isha: '17:42',
      suhoor: '06:06',
      duha: '08:23',
      istijaba: '15:05',
    } satisfies ISingleApiResponseTransformed);
  });

  it('holds the captured API payload value for 2026-11-03', () => {
    const header = decodeTimetableHeader(artifact)!;
    const index = dayIndex('2026-11-03')!;
    const minutes = readDayMinutes(artifact, header, index)!;
    const record = minutesToRecord('2026-11-03', {
      fajr: minutes[0],
      sunrise: minutes[1],
      dhuhr: minutes[2],
      asr: minutes[3],
      magrib: minutes[4],
      isha: minutes[5],
    });
    expect([record.fajr, record.sunrise, record.dhuhr, record.asr, record.magrib, record.isha]).toEqual([
      '05:18',
      '06:55',
      '11:49',
      '14:04',
      '16:33',
      '18:02',
    ]);
  });
});

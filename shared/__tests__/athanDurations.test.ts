import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import getDuration from 'mp3-duration';

const AUDIO_DIR = join(__dirname, '..', '..', 'assets', 'audio');
const ATHANS_DIR = join(AUDIO_DIR, 'athans');

/**
 * Pins ATHAN_DURATION_SECONDS (the sound sheet's instant countdown values)
 * to the actual bundled mp3s, so replacing an audio file without
 * regenerating the table fails validation instead of silently drifting the
 * first displayed second.
 */
function readDurationTable(): number[] {
  const source = readFileSync(join(AUDIO_DIR, 'index.ts'), 'utf8');
  const match = source.match(/ATHAN_DURATION_SECONDS\s*=\s*\[([^\]]*)\]/);
  if (!match) {
    throw new Error('ATHAN_DURATION_SECONDS array not found in assets/audio/index.ts');
  }
  return match[1]
    .split(',')
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

function listAthanFiles(): string[] {
  return readdirSync(ATHANS_DIR)
    .filter((name) => name.endsWith('.mp3'))
    .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));
}

describe('ATHAN_DURATION_SECONDS', () => {
  test('matches the rounded durations of the bundled athan mp3s', async () => {
    const table = readDurationTable();
    const files = listAthanFiles();

    expect(table).toHaveLength(files.length);

    const roundedDurations: number[] = [];
    for (const file of files) {
      const buffer = readFileSync(join(ATHANS_DIR, file));
      const duration = await getDuration(buffer);
      roundedDurations.push(Math.round(duration));
    }

    expect(roundedDurations).toEqual(table);
  });
});

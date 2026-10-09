import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import getDuration from 'mp3-duration';

const AUDIO_DIR = join(__dirname, '..', '..', 'assets', 'audio');
const ATHANS_DIR = join(AUDIO_DIR, 'athans');

/**
 * iOS refuses a notification sound of 30 seconds or longer and substitutes the
 * default alert tone with no error anywhere, so an athan that crosses the line
 * simply stops being an athan. The tightest file has about 25 ms of room, which
 * is why this is asserted rather than trusted.
 */
const IOS_NOTIFICATION_SOUND_LIMIT_SECONDS = 30;

/** MPEG-1 Layer III carries 1152 samples in every frame. */
const SAMPLES_PER_FRAME = 1152;

/** Sample rates addressed by the 2-bit field in an MPEG-1 frame header. */
const MPEG1_SAMPLE_RATES = [44100, 48000, 32000];

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

/**
 * Locates the first MPEG audio frame and reports its sample rate. ID3v2 is
 * skipped by its syncsafe length rather than by scanning, because tag bytes can
 * contain a byte pair that looks exactly like a frame sync.
 */
function readFirstFrameHeader(buffer: Buffer): { offset: number; sampleRate: number } {
  let start = 0;
  if (buffer.toString('ascii', 0, 3) === 'ID3') {
    const size =
      ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f);
    start = 10 + size;
  }

  for (let i = start; i < buffer.length - 4; i++) {
    // Frame sync is eleven set bits; the two bits after it select the MPEG
    // version, and 0b11 is MPEG-1, the only version these assets use.
    if (buffer[i] !== 0xff || (buffer[i + 1] & 0xe0) !== 0xe0) continue;
    if ((buffer[i + 1] & 0x18) !== 0x18) continue;

    const sampleRate = MPEG1_SAMPLE_RATES[(buffer[i + 2] & 0x0c) >> 2];
    if (sampleRate === undefined) continue;

    return { offset: i, sampleRate };
  }

  throw new Error('No MPEG-1 frame header found');
}

/**
 * Reads the encoder delay and end padding LAME records in its Xing/Info tag.
 *
 * This exists because `mp3-duration` is the wrong instrument for a 25 ms
 * margin. It sums whole MPEG frames and counts the Xing header frame as if it
 * were audio, so on these files it reports 52-76 ms more than actually plays —
 * three times the clearance being checked, which would put four athans over an
 * imaginary cliff. Every gapless-aware decoder trims the delay and the padding,
 * and subtracting them along with the header frame recovers the length that
 * really reaches the speaker. Cross-checked against `ffprobe` on all 32 athans:
 * the two agree to within 0.5 ms, which is `mp3-duration`'s own rounding to
 * three decimal places.
 */
function readGaplessTrimSamples(buffer: Buffer, frameOffset: number): number {
  const tagIndex = buffer.indexOf('Xing', frameOffset, 'ascii');
  const infoIndex = buffer.indexOf('Info', frameOffset, 'ascii');
  const xingAt = tagIndex === -1 ? infoIndex : tagIndex;
  if (xingAt === -1) throw new Error('No Xing/Info tag: gapless trim cannot be read');

  // The flags word says which optional fields follow, and each one shifts the
  // LAME extension further along.
  const flags = buffer.readUInt32BE(xingAt + 4);
  let lameAt = xingAt + 8;
  if (flags & 0x1) lameAt += 4; // frame count
  if (flags & 0x2) lameAt += 4; // byte count
  if (flags & 0x4) lameAt += 100; // seek table
  if (flags & 0x8) lameAt += 4; // quality

  // Three bytes hold two 12-bit fields: delay first, then padding.
  const packed = (buffer[lameAt + 21] << 16) | (buffer[lameAt + 22] << 8) | buffer[lameAt + 23];
  return (packed >> 12) + (packed & 0xfff);
}

/** The audio that actually plays, with the header frame and the gapless padding removed. */
async function measurePlayableSeconds(file: string): Promise<number> {
  const buffer = readFileSync(join(ATHANS_DIR, file));
  const frameSum = await getDuration(buffer);
  const { offset, sampleRate } = readFirstFrameHeader(buffer);
  const trimmed = SAMPLES_PER_FRAME + readGaplessTrimSamples(buffer, offset);

  return frameSum - trimmed / sampleRate;
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

describe('iOS notification-sound limit', () => {
  /**
   * Every file, not a sample: the margin is different on each one and the
   * tightest is only 25 ms, so checking a representative athan would prove
   * nothing about the one that is actually closest to the edge.
   */
  test('every bundled athan plays for less than 30 seconds', async () => {
    const files = listAthanFiles();
    expect(files.length).toBeGreaterThan(0);

    const overLimit: string[] = [];
    for (const file of files) {
      const seconds = await measurePlayableSeconds(file);
      if (seconds >= IOS_NOTIFICATION_SOUND_LIMIT_SECONDS) {
        overLimit.push(`${file} ${seconds.toFixed(3)}s`);
      }
    }

    // Named rather than counted, because the fix is per file: whoever re-encodes
    // one needs to know which one iOS has stopped playing.
    expect(overLimit).toEqual([]);
  });

  /**
   * The margin itself is the finding. Recording it means a re-encode that eats
   * the remaining milliseconds is visible here before it is audible on a phone,
   * rather than only once a file has already crossed the line.
   */
  test('reports how little room the tightest athan has left', async () => {
    const files = listAthanFiles();

    let tightestFile = '';
    let smallestHeadroomMs = Number.POSITIVE_INFINITY;
    for (const file of files) {
      const headroomMs = (IOS_NOTIFICATION_SOUND_LIMIT_SECONDS - (await measurePlayableSeconds(file))) * 1000;
      if (headroomMs < smallestHeadroomMs) {
        smallestHeadroomMs = headroomMs;
        tightestFile = file;
      }
    }

    expect(tightestFile).toBe('athan15.mp3');
    expect(smallestHeadroomMs).toBeGreaterThan(0);
    expect(smallestHeadroomMs).toBeLessThan(30);
  });
});

/**
 * The figure of eight the calibration hint traces: that it is an eight, that it closes, and that its path
 * follows the same arithmetic the travelling phone does
 */

import { phoneBody, phoneScreen, WAVE, waveLean, wavePath, wavePoint, waveRoll, waveTrail } from '@/shared/qiblaWave';

/** The size the hint is drawn at on a phone, so a px figure here means a px the user sees */
const WIDTH = 160;
const HEIGHT = 84;

/** Every coordinate pair in an SVG path, as numbers */
const pointsOf = (path: string): { x: number; y: number }[] =>
  [...path.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));

describe('a point on the wave', () => {
  // The curve crosses its own centre twice per lap, which is what makes the two lobes one gesture rather than
  // two circles: a shape that missed the middle would teach the user to trace an O
  it.each([
    [0, 0, 0],
    [0.5, 0, 0],
    [1, 0, 0],
  ])('passes through the centre at a progress of %p', (progress, x, y) => {
    const at = wavePoint(progress, WIDTH, HEIGHT);

    expect(at.x).toBeCloseTo(x, 6);
    expect(at.y).toBeCloseTo(y, 6);
  });

  it('reaches each side at its own quarter, so the lobes are drawn one after the other', () => {
    expect(wavePoint(0.25, WIDTH, HEIGHT).x).toBeCloseTo(WIDTH / 2, 6);
    expect(wavePoint(0.75, WIDTH, HEIGHT).x).toBeCloseTo(-WIDTH / 2, 6);
  });

  // The canvas is sized from the width and height passed in, so a curve reaching past either is clipped and one
  // falling short leaves the hint smaller than the space reserved for it
  it('fills the box it is given exactly, in both directions', () => {
    const lap = Array.from({ length: 400 }, (_, step) => wavePoint(step / 400, WIDTH, HEIGHT));

    expect(Math.max(...lap.map(({ x }) => Math.abs(x)))).toBeCloseTo(WIDTH / 2, 6);
    expect(Math.max(...lap.map(({ y }) => Math.abs(y)))).toBeCloseTo(HEIGHT / 2, 6);
  });

  // An eight is traced by one continuous wave: a progress that jumped would show the dot teleporting
  it('moves continuously, never jumping between consecutive samples', () => {
    const steps = 400;
    let previous = wavePoint(0, WIDTH, HEIGHT);

    for (let step = 1; step <= steps; step++) {
      const at = wavePoint(step / steps, WIDTH, HEIGHT);

      expect(Math.hypot(at.x - previous.x, at.y - previous.y)).toBeLessThan(WIDTH / 20);
      previous = at;
    }
  });

  // A lap must end exactly where it started, or the looping animation restarts with a visible snap
  it('closes on itself, so the loop has no seam', () => {
    const start = wavePoint(0, WIDTH, HEIGHT);
    const end = wavePoint(1, WIDTH, HEIGHT);

    expect(end.x).toBeCloseTo(start.x, 6);
    expect(end.y).toBeCloseTo(start.y, 6);
  });

  it('crosses from one lobe to the other, rather than tracing one side twice', () => {
    expect(wavePoint(0.125, WIDTH, HEIGHT).y).toBeGreaterThan(0);
    expect(wavePoint(0.375, WIDTH, HEIGHT).y).toBeLessThan(0);
  });
});

describe('the wave as a drawn path', () => {
  it('samples every segment it declares and closes the shape', () => {
    const path = wavePath(WIDTH, HEIGHT);

    expect(pointsOf(path)).toHaveLength(WAVE.segments);
    expect(path.endsWith('Z')).toBe(true);
  });

  // The dot is placed by wavePoint and the line is drawn by wavePath: sampled apart, the dot would run beside
  // the line it is meant to be running along
  it('draws the line through the same points the dot travels', () => {
    const drawn = pointsOf(wavePath(WIDTH, HEIGHT));

    drawn.forEach((at, index) => {
      const travelled = wavePoint(index / WAVE.segments, WIDTH, HEIGHT);

      expect(at.x).toBeCloseTo(travelled.x, 2);
      expect(at.y).toBeCloseTo(travelled.y, 2);
    });
  });

  it('scales with the box it is given rather than holding a fixed size', () => {
    const small = pointsOf(wavePath(WIDTH, HEIGHT));
    const large = pointsOf(wavePath(WIDTH * 2, HEIGHT * 2));

    expect(Math.max(...large.map(({ x }) => x))).toBeCloseTo(Math.max(...small.map(({ x }) => x)) * 2, 1);
  });
});

describe('the proportions the hint is built from', () => {
  // The hint shares the stage the compass fills, so a figure as big as the dial would read as the instrument
  it('keeps the figure well inside the stage, and flatter than it is wide', () => {
    expect(WAVE.width).toBeLessThan(1);
    expect(WAVE.height).toBeLessThan(WAVE.width);
  });

  it('draws the phone taller than it is wide, which is the only way it reads as a phone', () => {
    expect(WAVE.phone.height).toBeGreaterThan(WAVE.phone.width);
  });

  it('keeps the phone small enough beside the figure that the path stays the subject', () => {
    expect(WAVE.phone.height).toBeLessThan(WAVE.height);
  });

  // Too few segments and the curve reads as a polygon at the size it is drawn
  it('samples the curve finely enough that no segment reads as straight', () => {
    expect(WAVE.segments).toBeGreaterThanOrEqual(24);
  });
});

describe('waveLean, the roll the phone carries through the figure', () => {
  // A phone held rigid sweeps one plane and calibrates nothing, so the lean is the instruction
  it('leans both ways across a pass, so the wrist is shown rolling rather than held', () => {
    const leans = Array.from({ length: 48 }, (_, index) => waveLean(index / 48));

    expect(Math.max(...leans)).toBeGreaterThan(0);
    expect(Math.min(...leans)).toBeLessThan(0);
  });

  it('never leans past the limit the proportions declare', () => {
    const leans = Array.from({ length: 96 }, (_, index) => Math.abs(waveLean(index / 96)));

    expect(Math.max(...leans)).toBeLessThanOrEqual(WAVE.lean);
  });

  it('returns to where it started, so a looping pass has no jump at its seam', () => {
    expect(waveLean(1)).toBeCloseTo(waveLean(0), 5);
  });
});

describe('waveRoll, the bank that shows the phone turning out of the screen', () => {
  // A flat drawing cannot rotate about the vertical, so it narrows instead. Passing through zero is what makes
  // the phone read as banking like an aircraft rather than sliding flat through one plane
  it('turns the phone through edge-on rather than keeping one face to the user', () => {
    const rolls = Array.from({ length: 96 }, (_, index) => waveRoll(index / 96));

    expect(Math.min(...rolls.map(Math.abs))).toBeLessThan(0.1);
  });

  it('shows both faces across one pass, so the turn reads as a roll rather than a squeeze', () => {
    const rolls = Array.from({ length: 96 }, (_, index) => waveRoll(index / 96));

    expect(Math.max(...rolls)).toBeGreaterThan(0.9);
    expect(Math.min(...rolls)).toBeLessThan(-0.9);
  });

  it('never scales past full width, which would read as the phone growing', () => {
    const rolls = Array.from({ length: 192 }, (_, index) => Math.abs(waveRoll(index / 192)));

    expect(Math.max(...rolls)).toBeLessThanOrEqual(1);
  });

  it('returns to where it started, so a looping pass has no jump at its seam', () => {
    expect(waveRoll(1)).toBeCloseTo(waveRoll(0), 5);
  });

  // Face-on at the ends of each lobe and edge-on where the path is steepest, which is the moment the wrist turns
  it('is edge-on where the figure crosses its own centre', () => {
    expect(Math.abs(waveRoll(0.125))).toBeLessThan(0.01);
  });
});

describe('waveTrail, the comet tail behind the phone', () => {
  it('ends exactly where the phone stands, so the tail is never detached from it', () => {
    const points = pointsOf(waveTrail(0.3, WIDTH, HEIGHT));
    const at = wavePoint(0.3, WIDTH, HEIGHT);
    const last = points[points.length - 1];

    expect(last.x).toBeCloseTo(at.x, 1);
    expect(last.y).toBeCloseTo(at.y, 1);
  });

  // A literal, not WAVE.trail.samples: reading the constant on both sides makes the test follow whatever the
  // constant says and catch nothing, which is how a coarse tail would ship looking tested
  it('samples the tail finely enough that no segment reads as straight', () => {
    const points = pointsOf(waveTrail(0.4, WIDTH, HEIGHT));

    expect(points.length).toBeGreaterThanOrEqual(16);
    const gaps = points
      .slice(1)
      .map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
    expect(Math.max(...gaps)).toBeLessThan(WIDTH * 0.1);
  });

  it('reaches back along the path the phone came from, not ahead of it', () => {
    const points = pointsOf(waveTrail(0.25, WIDTH, HEIGHT));
    const behind = wavePoint(0.25 - WAVE.trail.span, WIDTH, HEIGHT);

    expect(points[0].x).toBeCloseTo(behind.x, 1);
    expect(points[0].y).toBeCloseTo(behind.y, 1);
  });

  // The tail reaches back past 0 for the first part of every loop, where a negative progress would place it
  // off the curve entirely
  it('stays on the figure when the tail reaches back past the start of the loop', () => {
    const points = pointsOf(waveTrail(0.05, WIDTH, HEIGHT));

    for (const point of points) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(WIDTH / 2 + 0.01);
      expect(Math.abs(point.y)).toBeLessThanOrEqual(HEIGHT / 2 + 0.01);
    }
  });

  it('is an open path, because a closed one would draw the whole figure at once', () => {
    expect(waveTrail(0.5, WIDTH, HEIGHT)).not.toContain('Z');
  });

  it('scales with the box it is given rather than holding a fixed size', () => {
    const small = pointsOf(waveTrail(0.3, WIDTH, HEIGHT));
    const large = pointsOf(waveTrail(0.3, WIDTH * 2, HEIGHT * 2));

    expect(large[0].x).toBeCloseTo(small[0].x * 2, 1);
    expect(large[0].y).toBeCloseTo(small[0].y * 2, 1);
  });
});

describe('the phone the figure carries', () => {
  it('insets the screen inside the body on every side', () => {
    const body = phoneBody(300);
    const screen = phoneScreen(300);

    expect(screen.width).toBeLessThan(body.width);
    expect(screen.height).toBeLessThan(body.height);
  });

  it('scales with the stage it is drawn in', () => {
    expect(phoneBody(600).width).toBeCloseTo(phoneBody(300).width * 2, 5);
  });

  // A radius wider than the box it rounds draws an arc that folds back on itself
  it('never gives the screen a negative corner', () => {
    expect(phoneScreen(40).radius).toBeGreaterThanOrEqual(0);
  });
});

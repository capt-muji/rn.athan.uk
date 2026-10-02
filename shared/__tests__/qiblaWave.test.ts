/**
 * The figure of eight the calibration hint traces: that it is an eight, that it closes, and that its path
 * follows the same arithmetic the travelling phone does
 */

import {
  phoneBody,
  phoneMarks,
  phoneScreen,
  WAVE,
  waveHeading,
  wavePath,
  wavePoint,
  waveTrail,
} from '@/shared/qiblaWave';

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

describe('waveHeading, which way the phone points as it travels', () => {
  const WIDTH_ = WIDTH;
  const HEIGHT_ = HEIGHT;
  const heading = (progress: number) => waveHeading(progress, WIDTH_, HEIGHT_);

  /** Where the phone's own foot points at a progress, as a unit vector in screen space */
  const footDirection = (progress: number) => {
    const radians = (heading(progress) * Math.PI) / 180;

    // The phone is drawn pointing up, so its foot points the opposite way once the whole body is turned
    return { x: -Math.sin(radians), y: Math.cos(radians) };
  };

  /** The direction the phone has just come FROM, which is where the trail runs back along */
  const behind = (progress: number) => {
    const at = wavePoint(progress, WIDTH_, HEIGHT_);
    const just = wavePoint(progress - 0.004, WIDTH_, HEIGHT_);
    const dx = just.x - at.x;
    const dy = just.y - at.y;
    const length = Math.hypot(dx, dy);

    return { x: dx / length, y: dy / length };
  };

  // THE OWNER'S REQUIREMENT: the trail must leave the BOTTOM of the phone the whole way round, so the phone
  // faces along the curve and its foot points back down the path it has just travelled
  it.each([0.03, 0.17, 0.3, 0.45, 0.62, 0.8, 0.94])('points its foot back along the path at %p', (progress) => {
    const foot = footDirection(progress);
    const tail = behind(progress);

    // The dot product of two unit vectors is 1 when they agree exactly
    expect(foot.x * tail.x + foot.y * tail.y).toBeCloseTo(1, 1);
  });

  it('turns through a whole circle across one pass, which is what a phone going round does', () => {
    const headings = Array.from({ length: 240 }, (_, index) => heading(index / 240));

    expect(Math.max(...headings)).toBeGreaterThan(90);
    expect(Math.min(...headings)).toBeLessThan(-90);
  });

  it('returns to where it started, so a looping pass has no jump at its seam', () => {
    expect(heading(1)).toBeCloseTo(heading(0), 5);
  });

  // The figure is wider than it is tall, so a heading computed without both would be wrong everywhere but the
  // four points where the curve happens to run straight
  it('follows the shape of the box it is drawn in, rather than assuming a square', () => {
    expect(waveHeading(0.17, WIDTH_, HEIGHT_)).not.toBeCloseTo(waveHeading(0.17, WIDTH_, WIDTH_), 1);
  });
});

describe('the marks that name the shape as a phone', () => {
  // The owner's own words about the version without them: "I can't really tell it's a phone. It looks like a
  // car." A bare rounded rectangle is a card; the camera and the button are what make it a device
  it('leaves room above and below the screen for both marks to sit in', () => {
    const body = phoneBody(300);
    const screen = phoneScreen(300);
    const marks = phoneMarks(300);

    expect(body.height - screen.height).toBeGreaterThan(marks.camera * 2);
  });

  it('draws both marks large enough to be seen at the size the hint is drawn', () => {
    const body = phoneBody(300);
    const marks = phoneMarks(300);

    expect(marks.camera).toBeGreaterThan(body.width * 0.1);
    expect(marks.button).toBeGreaterThan(marks.camera);
  });

  it('keeps both marks inside the phone they are drawn on', () => {
    const body = phoneBody(300);
    const marks = phoneMarks(300);

    expect(marks.button).toBeLessThan(body.width);
    expect(marks.camera).toBeLessThan(body.width);
  });

  it('scales with the stage, so no mark is a fixed size on a larger screen', () => {
    expect(phoneMarks(600).camera).toBeCloseTo(phoneMarks(300).camera * 2, 5);
    expect(phoneMarks(600).button).toBeCloseTo(phoneMarks(300).button * 2, 5);
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

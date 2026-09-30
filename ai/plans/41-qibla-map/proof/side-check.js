'use strict';
// Is the 'side' flip in qiblaFromStreet correct? A street is a line, so when the qibla is
// more than 90 degrees from the direction the segment happens to be DIGITISED in, the
// answer must be reported against the OPPOSITE direction of the same line.
//
// Verify by brute force against the definition: for a street line of bearing B, the user
// may face either B or B+180. The correct answer is the (turn, side) pair that, applied
// to the facing that makes the turn acute, lands on the qibla.

const norm = (a) => ((a % 360) + 360) % 360;

function candidate(qibla, bearing) {
  const clockwise = norm(qibla - bearing);
  const isRight = clockwise <= 180;
  const magnitude = isRight ? clockwise : 360 - clockwise;
  if (magnitude > 90) return { turn: 180 - magnitude, side: isRight ? 'left' : 'right' };
  return { turn: magnitude, side: isRight ? 'right' : 'left' };
}

// Ground truth: try both facings along the line, both sides, find what reaches the qibla.
function truth(qibla, bearing) {
  const out = [];
  for (const facing of [bearing, norm(bearing + 180)]) {
    for (const side of ['left', 'right']) {
      for (let turn = 0; turn <= 90; turn += 0.5) {
        const delivered = side === 'right' ? norm(facing + turn) : norm(facing - turn);
        if (Math.abs(norm(delivered - qibla)) < 1e-6 || Math.abs(norm(delivered - qibla) - 360) < 1e-6) {
          out.push({ facing, side, turn });
        }
      }
    }
  }
  return out;
}

let bad = 0;
let checked = 0;
for (let bearing = 0; bearing < 360; bearing += 7) {
  for (let qibla = 0; qibla < 360; qibla += 7) {
    const got = candidate(qibla, bearing);
    const valid = truth(qibla, bearing);
    checked++;
    // the returned pair must appear in the ground-truth set, at either facing
    const ok = valid.some((v) => v.side === got.side && Math.abs(v.turn - got.turn) < 0.51);
    if (!ok) {
      if (bad < 12)
        console.log(
          `MISMATCH street=${bearing} qibla=${qibla} -> got ${got.turn.toFixed(1)} ${got.side}; valid: ${valid
            .map((v) => `${v.turn}${v.side[0]}@${v.facing}`)
            .join(' ')}`
        );
      bad++;
    }
  }
}
console.log(`\n${checked - bad}/${checked} correct, ${bad} mismatches`);

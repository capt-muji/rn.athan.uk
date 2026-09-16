#!/usr/bin/env python3
"""Session 6b on the 3T: did a forced refusal put the whole alert sheet change back?

  refusal_proof.py <logcat file>

The file is what `devcheck.py logs <label>` saved while Magrib was switched off on the throwaway build whose first
at-time cancel is refused (`device-patches/refuse-once`). The app writes every line this looks for.

Prints one line:
  REFUSAL PROOF AS EXPECTED                     the phone refused, the change was put back, and nothing stayed marked
  REFUSAL PROOF NOT AS EXPECTED: <what is wrong>

Exit 0 either way, so the executor reads the line rather than a status code.
"""

import sys
from pathlib import Path

# Each is (the line the app writes, what it means), in the order the app writes them
MUST_HOLD = [
    ('FORCED REFUSAL: refusing to cancel', 'the patched build did not refuse anything'),
    ('NOTIFICATION SYSTEM: Failed to cancel notification:', 'the device layer did not report the refusal'),
    (
        'NOTIFICATION: The phone refused part of the alert change, putting the prayer back',
        'the commit did not put the change back',
    ),
]

# The undo itself must have landed: these say it did not
MUST_NOT_HOLD = [
    (
        'NOTIFICATION: The phone refused part of putting the prayer back',
        'the undo was refused as well, so the prayer is still marked',
    ),
    ('NOTIFICATION: Putting the prayer back failed', 'the undo failed outright'),
]


def main() -> int:
    if len(sys.argv) != 2:
        print('REFUSAL PROOF NOT AS EXPECTED: usage: refusal_proof.py <logcat file>')
        return 0

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f'REFUSAL PROOF NOT AS EXPECTED: {path} is not a file')
        return 0

    text = path.read_text(errors='replace')

    for needle, complaint in MUST_HOLD:
        if needle not in text:
            print(f'REFUSAL PROOF NOT AS EXPECTED: {complaint} (no line holding "{needle}")')
            return 0

    for needle, complaint in MUST_NOT_HOLD:
        if needle in text:
            print(f'REFUSAL PROOF NOT AS EXPECTED: {complaint} (a line holds "{needle}")')
            return 0

    print('REFUSAL PROOF AS EXPECTED')
    return 0


if __name__ == '__main__':
    sys.exit(main())

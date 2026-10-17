/**
 * Pins the protocol sentences this ticket ships, so a future edit cannot
 * silently delete a guard that only exists as workflow text.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

const read = (relative: string): string => readFileSync(join(ROOT, relative), 'utf8');

describe('protocol lines', () => {
  it('the lane protocol forbids ending a turn parked on a lock or a live shell', () => {
    expect(read('.opencode/agents/athan-lane.md')).toContain(
      'Never end a turn holding a lock or with a live background shell'
    );
  });

  it('the reviewer refuses a dispatch that names no commit range', () => {
    expect(read('.opencode/agents/athan-reviewer.md')).toContain('MALFORMED_DISPATCH: no commit range named');
  });

  it('the lead skill gates the DONE commit on the audit check', () => {
    expect(read('.agents/skills/athan-lead/SKILL.md')).toContain('must print AUDIT OK before the DONE commit');
  });

  it('the lead state read names held lane locks', () => {
    expect(read('.agents/skills/athan-lead/SKILL.md')).toContain('Lane locks held');
  });
});

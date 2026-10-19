/**
 * Pins the workflow sentences that only exist as text, so a future edit cannot
 * silently delete a guard nobody would notice.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

const read = (relative: string): string => readFileSync(join(ROOT, relative), 'utf8');

describe('board protocol lines', () => {
  it('the shared skill fixes the board as the queue and the column by state type', () => {
    const skill = read('.agents/skills/board-workflow/SKILL.md');
    expect(skill).toContain('Pick and move a column by its `stateType`, never by its name.');
    expect(skill).toContain('A subtask is a plan step. It never gets a lane of its own.');
  });

  it('a lane never ends its turn with a ticket mid-flight', () => {
    expect(read('.opencode/agents/athan-lane.md')).toContain(
      'Never leave a ticket in a started column at the end of your turn.'
    );
  });

  it('an executor never pushes and never rewrites the plan', () => {
    const executor = read('.opencode/agents/athan-executor.md');
    expect(executor).toContain('- Never push.');
    expect(executor).toContain('- Never change the plan.');
  });

  it('a reviewer posts one comment per ticket and keeps it actionable', () => {
    expect(read('.opencode/agents/athan-reviewer.md')).toContain('One comment per ticket, not one per finding.');
  });

  it('a griller reports no finding without a fix', () => {
    expect(read('.opencode/agents/athan-plan-griller.md')).toContain(
      'Every finding is one line, and every finding names the fix.'
    );
  });

  it('the lead closes a run with the snapshot', () => {
    expect(read('.agents/skills/athan-lead/SKILL.md')).toContain('board/snapshot.sh');
  });
});

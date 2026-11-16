/**
 * Pins the workflow sentences that only exist as text, so a future edit cannot
 * silently delete a guard nobody would notice.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

const read = (relative: string): string => readFileSync(join(ROOT, relative), 'utf8');

describe('board protocol lines', () => {
  it('the board is Multica and the official CLI skill is the driver', () => {
    const agents = read('AGENTS.md');
    expect(agents).toContain("the owner's self-hosted Multica");
    expect(agents).toContain('`multica` CLI');
    expect(agents).toContain('.agents/skills/multica-cli/SKILL.md');
  });

  it('the companion fixes the columns, the key scar and the workspaces', () => {
    const board = read('.agents/skills/multica-cli/BOARD-ATHAN.md');
    expect(board).toContain('| 3 | Planning | `planning_2` | `planning` |');
    expect(board).toContain('The `planning_2` key is a scar, not a mistake');
    expect(board).toContain('Research tickets never go');
  });

  it('the official skill file ships verbatim with its side-effect guards', () => {
    const skill = read('.agents/skills/multica-cli/SKILL.md');
    expect(skill).toContain('backlog | todo | in_progress | in_review | done | blocked | cancelled');
    expect(skill).toContain('Suppressing Agent Runs with `--no-start`');
  });

  it('the retired itsaplan machinery is gone', () => {
    expect(existsSync(join(ROOT, '.agents/skills/board-workflow'))).toBe(false);
    expect(existsSync(join(ROOT, '.agents/skills/athan-lead'))).toBe(false);
    expect(existsSync(join(ROOT, '.opencode/agents'))).toBe(false);
    expect(read('opencode.json')).not.toContain('itsaplan');
  });

  it('athan-next runs every phase itself and stops at DONE', () => {
    const skill = read('.agents/skills/athan-next/SKILL.md');
    expect(skill).toContain('**You do every phase yourself, in this session.**');
    expect(skill).toContain('The row becomes DONE, the branch pushes');
  });
});

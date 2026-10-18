import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { desiredState, STATUS_TO_COLOR, STATUS_TO_COLUMN } from '../mapping.mjs';

const queueMarkdown = `# Plans

## The queue

| Order | Ticket | Status |
| --- | --- | --- |
| 1 | First done ticket | DONE |
| 2 | Second done ticket | DONE |
| 3 | Third done ticket | DONE |

| Order | Ticket | Brief and plan | Status | Needs first |
| --- | --- | --- | --- | --- |
| 10 | Alpha ticket | The alpha brief. | NOT PLANNED | nothing |
| 11 | Beta ticket with a name far past the one hundred and twentieth character so the title cap has something to bite on and the golden file proves it | The beta brief. | PLANNING step 2 | nothing |
| 12 | Gamma ticket | The gamma brief. | READY | 10, 11 |
| 13 | Delta ticket | The delta brief. | IN PROGRESS step 1 | nothing |
| 14 | Echo ticket | The echo brief. | EXECUTED | nothing |
| 15 | Foxtrot ticket | Blocked by a ghost reference. | NOT PLANNED | 99 |
| 16 | Golf ticket | The parent. | READY | nothing |
| 17 | Hotel ticket | The child. | READY | nothing |
| 18 | India ticket | Needs a settled ticket, which counts as met. | NOT PLANNED | 19 |
| 19 | Juliet ticket | The settled row. | CANCELLED, never re-queue | nothing |
| 20 | Kilo ticket | A done row with its brief kept. | DONE | nothing |
| 21 | Lima ticket | An unmapped status word. | FOLDED away | nothing |
| 22 | Broken row |
`;

function makeRepo() {
  const repo = mkdtempSync(path.join(tmpdir(), 'kanboard-mapping-'));
  const plans = path.join(repo, 'ai', 'plans');
  mkdirSync(plans, { recursive: true });
  writeFileSync(path.join(plans, 'README.md'), queueMarkdown);
  mkdirSync(path.join(repo, 'board'), { recursive: true });
  writeFileSync(path.join(repo, 'board', 'config.json'), '{"doneColumnCount": 2}\n');

  const delta = path.join(plans, '13-demo');
  const deltaSteps = path.join(delta, 'steps');
  mkdirSync(deltaSteps, { recursive: true });
  writeFileSync(
    path.join(delta, 'PLAN.md'),
    [
      '## Plan',
      '',
      '| Parent | none |',
      '| Group | none |',
      '',
      '- [ ] Step 1: land the formatters',
      '- [x] Step 2: ship the copy',
      '- [ ] Step 3: device proof',
      '',
    ].join('\n')
  );
  writeFileSync(path.join(deltaSteps, '01-formatters.md'), '## Files\n\n- `android/Foo.kt`\n- `shared/x.ts`\n');

  const gamma = path.join(plans, '12-demo');
  mkdirSync(gamma, { recursive: true });
  writeFileSync(
    path.join(gamma, 'PLAN.md'),
    ['## Plan', '', '| Parent | none |', '| Group | the shared layer |', '', '- [x] Step 1: only step', ''].join('\n')
  );

  const hotel = path.join(plans, '17-demo');
  mkdirSync(hotel, { recursive: true });
  writeFileSync(path.join(hotel, 'PLAN.md'), ['## Plan', '', '| Parent | 16 |', '| Group | none |', ''].join('\n'));

  return repo;
}

test('desiredState maps the queue onto the Kanboard shape, byte-deterministic', () => {
  const repo = makeRepo();
  try {
    const first = desiredState(queueMarkdown, repo);
    const second = desiredState(queueMarkdown, repo);
    assert.deepStrictEqual(second, first);

    assert.deepStrictEqual(first.columns, [
      'Backlog',
      'Planning',
      'Ready',
      'In progress',
      'Blocked',
      'Audit',
      'Owner-led',
      'Deferred',
      'Upstream',
      'Done',
    ]);

    const byRef = new Map(first.tasks.map((task) => [task.reference, task]));
    assert.deepStrictEqual(
      [...byRef.keys()].sort((a, b) => Number(a) - Number(b)),
      ['3', '10', '11', '12', '13', '14', '15', '16', '17', '18', '20', '21']
    );

    const alpha = byRef.get('10');
    assert.equal(alpha.title, '#10 Alpha ticket');
    assert.equal(alpha.columnName, 'Backlog');
    assert.equal(alpha.colorId, 'grey');
    assert.deepStrictEqual(alpha.tags, ['NOT PLANNED']);
    assert.deepStrictEqual(alpha.links, []);
    assert.deepStrictEqual(alpha.subtasks, []);
    assert.ok(alpha.description.includes('The alpha brief.'));

    const beta = byRef.get('11');
    assert.equal(beta.title.length <= 122, true);
    assert.equal(beta.title.startsWith('#11 Beta ticket'), true);
    assert.equal(beta.columnName, 'Planning');
    assert.equal(beta.colorId, 'blue');

    const gamma = byRef.get('12');
    assert.equal(gamma.columnName, 'Blocked');
    assert.equal(gamma.colorId, 'cyan');
    assert.deepStrictEqual(gamma.tags, ['READY', 'group:the shared layer', 'unmet-needs']);
    assert.deepStrictEqual(
      gamma.links.map((link) => [link.oppositeReference, link.linkId]),
      [
        ['10', 3],
        ['11', 3],
      ]
    );
    assert.deepStrictEqual(gamma.subtasks, [{ title: 'Step 1: only step', status: 2 }]);

    const delta = byRef.get('13');
    assert.equal(delta.columnName, 'In progress');
    assert.equal(delta.colorId, 'amber');
    assert.deepStrictEqual(delta.tags, ['IN PROGRESS', 'platform:Both']);
    assert.deepStrictEqual(delta.subtasks, [
      { title: 'Step 1: land the formatters', status: 1 },
      { title: 'Step 2: ship the copy', status: 2 },
      { title: 'Step 3: device proof', status: 0 },
    ]);

    assert.equal(byRef.get('14').columnName, 'Audit');

    const foxtrot = byRef.get('15');
    assert.equal(foxtrot.columnName, 'Blocked');
    assert.deepStrictEqual(foxtrot.tags, ['NOT PLANNED', 'unmet-needs', 'dangling-need']);
    assert.deepStrictEqual(foxtrot.links, []);

    const hotel = byRef.get('17');
    assert.deepStrictEqual(hotel.links, [{ oppositeReference: '16', linkId: 6 }]);

    const india = byRef.get('18');
    assert.equal(india.columnName, 'Backlog');
    assert.deepStrictEqual(india.tags, ['NOT PLANNED']);
    assert.deepStrictEqual(india.links, []);

    assert.equal(byRef.has('19'), false);

    const kilo = byRef.get('20');
    assert.equal(kilo.columnName, 'Done');
    assert.equal(kilo.colorId, 'dark_grey');
    assert.ok(kilo.description.includes('A done row with its brief kept.'));

    assert.equal(byRef.has('1'), false);
    assert.equal(byRef.has('2'), false);
    assert.equal(byRef.get('3').columnName, 'Done');

    const lima = byRef.get('21');
    assert.equal(lima.columnName, 'Deferred');
    assert.equal(lima.colorId, 'yellow');
    assert.deepStrictEqual(lima.tags, ['FOLDED', 'unmapped-status']);

    assert.deepStrictEqual(first.unparseable, { count: 1, orders: [22] });
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('the status tables cover every mapped column and color slot', () => {
  assert.equal(STATUS_TO_COLUMN['IN PROGRESS'], 'In progress');
  assert.equal(STATUS_TO_COLUMN['OWNER-BLOCKED'], 'Blocked');
  assert.equal(STATUS_TO_COLOR.UPSTREAM, 'teal');
  assert.equal(STATUS_TO_COLOR['OWNER-LED'], 'purple');
  assert.equal(STATUS_TO_COLOR.DEFERRED, 'yellow');
  assert.equal(STATUS_TO_COLOR.EXECUTED, 'orange');
});

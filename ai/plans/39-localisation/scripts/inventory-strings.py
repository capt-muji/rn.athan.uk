"""Every user-facing string literal in production source, with its file and line.

Excludes tests, mocks, logger calls and the directories that hold no shipped copy.
"""
import os, re, json, collections

SKIP_DIRS = {'node_modules', '.git', 'ios', 'android', '.expo', 'coverage',
             '.claude', 'e2e', 'scripts', 'ai', 'mocks', 'patches', '.agents',
             'assets', '__tests__', '__mocks__'}
LITERAL = re.compile(r"""(['"])([A-Z][A-Za-z0-9 ,.'\-!?%:()/&]{2,80})\1""")

rows = []
for dirpath, dirnames, filenames in os.walk('.'):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
    for name in filenames:
        if not name.endswith(('.ts', '.tsx')):
            continue
        if '.test.' in name or '.d.ts' in name:
            continue
        path = os.path.join(dirpath, name)
        for lineno, line in enumerate(open(path, encoding='utf-8'), 1):
            if 'logger.' in line or 'console.' in line:
                continue
            for match in LITERAL.finditer(line):
                rows.append({'file': path[2:], 'line': lineno, 'text': match.group(2)})

by_file = collections.Counter(r['file'] for r in rows)
print(f'TOTAL {len(rows)} literals across {len(by_file)} files\n')
for path, count in by_file.most_common():
    print(f'{count:4d}  {path}')
json.dump(rows, open('ai/plans/39-localisation/research/string-inventory.json', 'w'), indent=1)

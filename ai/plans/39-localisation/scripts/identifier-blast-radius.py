"""Every site where an English prayer name acts as an IDENTIFIER, not a label.

A label is translated. An identifier is a storage key, a comparison, an index
lookup, a filename slug or an audio resource name, and translating it corrupts
the user's data. The migration must split the two, so this counts the second set.
"""
import os, re, collections

SKIP_DIRS = {'node_modules', '.git', 'ios', 'android', '.expo', 'coverage',
             '.claude', 'e2e', '.agents', 'assets', 'patches'}

PATTERNS = {
    'storage key built from name': re.compile(r'`[^`]*\$\{[^}]*[Nn]ame[^}]*\}[^`]*`'),
    'name compared with === or !==': re.compile(r'(english|englishName|\.english)\s*[!=]==\s*[\'"]'),
    'name compared against literal': re.compile(r'[\'"](Fajr|Sunrise|Dhuhr|Asr|Magrib|Isha|Midnight|Last Third|Suhoor|Duha|Istijaba)[\'"]'),
    'indexOf on a name array': re.compile(r'(PRAYERS_ENGLISH|EXTRAS_ENGLISH)\.indexOf'),
    'includes on a name array': re.compile(r'(PRAYERS_ENGLISH|EXTRAS_ENGLISH|NIGHT_PRAYER_NAMES|MIDNIGHT_CROSSING_PRAYERS)\.includes'),
    'name lowercased into a slug': re.compile(r'[Nn]ame\.toLowerCase\(\)'),
}

hits = collections.defaultdict(list)
for dirpath, dirnames, filenames in os.walk('.'):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
    for name in filenames:
        if not name.endswith(('.ts', '.tsx')):
            continue
        path = os.path.join(dirpath, name)[2:]
        is_test = '__tests__' in path or '__mocks__' in path or '.test.' in path
        for lineno, line in enumerate(open(path, encoding='utf-8'), 1):
            for label, pattern in PATTERNS.items():
                if pattern.search(line):
                    hits[label].append((path, lineno, is_test, line.strip()[:110]))

for label, found in hits.items():
    prod = [h for h in found if not h[2]]
    print(f'\n### {label}: {len(prod)} production, {len(found) - len(prod)} test')
    for path, lineno, _, text in prod[:14]:
        print(f'  {path}:{lineno}  {text}')

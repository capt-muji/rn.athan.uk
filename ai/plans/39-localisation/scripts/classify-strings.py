"""Split the 194 literals into what a translator touches and what must never move.

A DISPLAY string is drawn for a person and gets translated. An IDENTIFIER is a
wire key, a storage key, a filename, an enum value or a format pattern, and
translating it corrupts data or breaks a lookup.
"""
import json, re, collections

rows = json.load(open('ai/plans/39-localisation/research/string-inventory.json'))

IDENTIFIER_FILES = {'app.config.ts', 'shared/logger.ts', 'shared/perf.ts',
                    'modules/widgetrefresh/index.ts', 'stores/countdown.ts'}
IDENTIFIER_TEXT = re.compile(
    r'^(GET|POST|SPEAKER|PLAY|PAUSE|INFO|QUESTION|CHECK|CLOSE|WIDGET|APPLE|ANDROID|'
    r'MUSIC_NOTE|Europe/London|Roboto-\w+|Standard|Extras|Cache-Control.*|'
    r'EEE.*|Please adopt containerBackground API)$')
DOC_EXAMPLE = re.compile(r'^(Fri, 20 Nov 2024|Rajab 1, 1447|N seconds remaining|Xh Ym|'
                         r'Fajr now|Dhuhr 10h 15m ago|Asr 2h 30m ago|Incomplete data received)$')
PRAYER_NAME = re.compile(r'^(Fajr|Sunrise|Dhuhr|Asr|Magrib|Isha|Midnight|Last Third|Suhoor|Duha|Istijaba|London)$')

buckets = collections.defaultdict(list)
for row in rows:
    text, path = row['text'], row['file']
    if path in IDENTIFIER_FILES or IDENTIFIER_TEXT.match(text):
        buckets['identifier, never translated'].append(row)
    elif PRAYER_NAME.match(text):
        buckets['prayer name used as identifier'].append(row)
    elif DOC_EXAMPLE.match(text) or path.endswith('types.ts') or path.endswith('widgetTypes.ts'):
        buckets['doc example or type comment'].append(row)
    elif path.startswith('widgets/'):
        buckets['widget copy, baked into props'].append(row)
    else:
        buckets['display copy, translated'].append(row)

total = sum(len(v) for v in buckets.values())
print(f'{total} literals classified\n')
for label, found in sorted(buckets.items(), key=lambda kv: -len(kv[1])):
    files = collections.Counter(r['file'] for r in found)
    print(f'{len(found):4d}  {label}   ({len(files)} files)')
print('\n--- display copy by file ---')
display = collections.Counter(r['file'] for r in buckets['display copy, translated'])
for path, count in display.most_common():
    print(f'{count:4d}  {path}')

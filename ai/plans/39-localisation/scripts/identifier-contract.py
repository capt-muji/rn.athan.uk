"""Proof that the English prayer name reaches four independent systems.

38.1 splits identifier from label. This enumerates exactly what the split must
cover, so the step can be specified rather than described.
"""
import re, os, collections

TARGETS = {
    'MMKV preference key': (
        'stores/notifications.ts',
        re.compile(r'`preference_[a-z_]*\$\{[^`]*\}`')),
    'OS notification id': (
        'device/notifications.ts',
        re.compile(r'`(athan|reminder)_\$\{[^`]*\}`')),
    'audio resource slug': (
        'shared/notifications.ts',
        re.compile(r'(prayerNameSlug|reminder_\$\{slug\}|athan\$\{)')),
    'ordering and day rules': (
        'shared/prayer.ts',
        re.compile(r'(EXTRAS_ENGLISH\.indexOf|NIGHT_PRAYER_NAMES\.includes|MIDNIGHT_CROSSING_PRAYERS\.includes)')),
}

print('Each system below keys on the English name. Translating it breaks each differently.\n')
for label, (path, pattern) in TARGETS.items():
    if not os.path.exists(path):
        print(f'{label}: {path} MISSING'); continue
    hits = [(n, l.strip()[:96]) for n, l in enumerate(open(path), 1) if pattern.search(l)]
    print(f'### {label}  ({path}, {len(hits)} sites)')
    for n, text in hits[:6]:
        print(f'    {n:5d}  {text}')
    print()

# The audio files are the hardest constraint: they exist on disk with fixed names.
audio = sorted(os.listdir('assets/audio/reminders')) if os.path.isdir('assets/audio/reminders') else []
slugs = sorted({f.split('_')[1] for f in audio if f.startswith('reminder_') and '_' in f})
print(f'### audio filenames on disk: {len(audio)} files, {len(slugs)} prayer slugs')
print(f'    {slugs}')
print('\n    Android res/raw allows [a-z0-9_] only, so these slugs can never be translated.')

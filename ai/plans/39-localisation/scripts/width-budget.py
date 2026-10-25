"""How wide may a prayer name be before the row breaks?

SELF-REVIEW section 3 found the plan asserted names were too long without ever
deriving the budget. This derives it from the row's real composition.
"""
import subprocess, json

SIZE = 18                # TEXT.size
PADDING_LEFT = 20        # STYLES.prayer.padding.left
PADDING_RIGHT = 20       # STYLES.prayer.padding.right
BELL = 20                # SIZE.icon.md, the alert glyph
SPACING_LG = 24          # Time's marginLeft is SPACING.lg - 1
CONTENT_MAX = 500        # SIZE.contentMaxWidth, the tablet cap

SCREENS = {
    'iPhone SE / small Android': 320,
    'iPhone 12 mini': 360,
    'iPhone 15': 393,
    'OnePlus 3T (floor device)': 360,
    'tablet, capped by contentMaxWidth': CONTENT_MAX,
}

def width(strings):
    r = subprocess.run(['swift', 'ai/plans/39-localisation/scripts/measure-widths.swift'],
                       input=json.dumps(strings).encode(), capture_output=True)
    return json.loads(r.stdout.decode())

time_width = max(width(['23:59', '--:--']))

print(f'A row holds: [left pad {PADDING_LEFT}] [NAME] [second name] [time {time_width:.0f}]'
      f' [bell {BELL}] [right pad {PADDING_RIGHT}]\n')
print(f"{'screen':34} {'usable':>8} {'budget, no 2nd name':>21} {'budget with 2nd':>17}")
for label, screen in SCREENS.items():
    usable = min(screen, CONTENT_MAX) - PADDING_LEFT - PADDING_RIGHT
    fixed = time_width + BELL + SPACING_LG
    solo = usable - fixed
    # With a second name the two columns share what is left; the second needs at
    # least as much as Arabic requires, measured at 68pt for the widest extras name.
    shared = solo - 68
    print(f'{label:34} {usable:>7.0f}p {solo:>20.0f}p {shared:>16.0f}p')

floor = min(SCREENS.values())
usable = floor - PADDING_LEFT - PADDING_RIGHT
budget = usable - time_width - BELL - SPACING_LG - 68
print(f'\nBUDGET on the narrowest screen ({floor}dp), second name shown: {budget:.0f}pt')
print('Measured longest names against that budget:')
for tag, name, w in [('en', 'Last Third', 79.8), ('ar', 'نصف الليل', 68.1),
                     ('ur', 'رات کا آخری تہائی', 119.9), ('hi', 'रात का अंतिम तिहाई', 131.2),
                     ('tr', 'Gecenin Son Üçte Biri', 171.8), ('de', 'Letztes Drittel der Nacht', 193.6),
                     ('id', 'Sepertiga Malam Terakhir', 205.0), ('sw', 'Theluthi ya Mwisho ya Usiku', 226.3)]:
    verdict = 'fits' if w <= budget else f'OVER by {w - budget:.0f}pt'
    print(f'  {tag:4} {w:>7.1f}p  {verdict:<18} {name}')

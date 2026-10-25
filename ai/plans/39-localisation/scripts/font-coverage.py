"""Which scripts the bundled Roboto can actually draw.

The app sets `fontFamily: 'Roboto-Regular'` on essentially every Text node, so a
codepoint Roboto lacks is the app's first silent localisation failure.
"""
from fontTools.ttLib import TTFont

FONTS = ['assets/fonts/Roboto-Regular.ttf', 'assets/fonts/Roboto-Medium.ttf']

# One representative prayer-related word per script the top-20 languages use.
SAMPLES = [
    ('Arabic', 'ar', 'الفجر'), ('Urdu (Nastaliq)', 'ur', 'نمازِ فجر'),
    ('Persian', 'fa', 'نماز صبح'), ('Devanagari (Hindi)', 'hi', 'नमाज़ फ़ज्र'),
    ('Bengali', 'bn', 'ফজর নামাজ'), ('Telugu', 'te', 'నమాజ్'),
    ('Tamil', 'ta', 'தொழுகை'), ('Gujarati', 'gu', 'નમાજ'),
    ('Gurmukhi (Punjabi)', 'pa', 'ਨਮਾਜ਼'), ('Marathi', 'mr', 'नमाज'),
    ('Han (Chinese)', 'zh', '晨礼 日出'), ('Japanese', 'ja', '礼拝 日の出'),
    ('Korean', 'ko', '기도 일출'), ('Thai', 'th', 'ละหมาด'),
    ('Cyrillic (Russian)', 'ru', 'Фаджр намаз'), ('Greek', 'el', 'Ανατολή'),
    ('Hebrew', 'he', 'תפילה'), ('Vietnamese', 'vi', 'Bình minh Rạng đông'),
    ('Turkish', 'tr', 'Sabah İmsak Güneş'), ('Indonesian', 'id', 'Subuh Terbit'),
    ('Javanese', 'jv', 'Subuh'), ('Swahili', 'sw', 'Alfajiri'),
    ('Hausa', 'ha', 'Sallar Asuba'), ('Amharic', 'am', 'ሶላት'),
    ('Arabic-Indic digits', 'ar', '٠١٢٣٤٥٦٧٨٩'),
    ('Bidi isolates FSI/PDI', '--', '\u2068\u2069\u200e\u200f'),
]

for path in FONTS:
    font = TTFont(path)
    covered = set()
    for table in font['cmap'].tables:
        covered |= set(table.cmap.keys())
    print(f'\n{path}: {len(covered)} codepoints')
    print(f"  {'script':24} {'tag':4} {'missing':>8}  characters the font cannot draw")
    for label, tag, text in SAMPLES:
        missing = sorted({c for c in text if c != ' ' and ord(c) not in covered})
        verdict = ''.join(missing) if missing else 'none'
        print(f'  {label:24} {tag:4} {len(missing):>8}  {verdict}')

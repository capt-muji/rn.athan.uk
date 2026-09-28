"""Does a translated prayer name break the fixed first column?

The column is the pixel width of the longest English name in that schedule, so the
question is how much wider the longest TRANSLATED name is. Widths here are advance
widths read from the real font at the real size, not character counts: a Devanagari
conjunct is one glyph cluster but several codepoints, so counting characters
overstates it and counting UTF-8 bytes overstates it more.

Roboto has no glyph for most of these scripts, so a system font stands in. The
fallback is measured with CoreText, which is what iOS itself uses to draw them.
"""
import subprocess, json, sys

SIZE = 18  # TEXT.size

STANDARD = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']
EXTRAS = ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']

# Sourced in round 2; these are the working set for the width question.
LOCALES = {
    'en': (STANDARD, EXTRAS),
    'ar': (['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
           ['نصف الليل', 'آخر ثلث', 'السحور', 'الضحى', 'استجابة']),
    'id': (['Subuh', 'Terbit', 'Zuhur', 'Asar', 'Maghrib', 'Isya'],
           ['Tengah Malam', 'Sepertiga Malam Terakhir', 'Sahur', 'Duha', 'Istijabah']),
    'tr': (['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'],
           ['Gece Yarısı', 'Gecenin Son Üçte Biri', 'Sahur', 'Kuşluk', 'İcabet Saati']),
    'ur': (['فجر', 'طلوع آفتاب', 'ظہر', 'عصر', 'مغرب', 'عشاء'],
           ['نصف شب', 'رات کا آخری تہائی', 'سحری', 'چاشت', 'استجابہ']),
    'bn': (['ফজর', 'সূর্যোদয়', 'যোহর', 'আসর', 'মাগরিব', 'এশা'],
           ['মধ্যরাত', 'রাতের শেষ তৃতীয়াংশ', 'সেহরি', 'দুহা', 'ইস্তিজাবা']),
    'hi': (['फ़ज्र', 'सूर्योदय', 'ज़ुहर', 'अस्र', 'मग़रिब', 'इशा'],
           ['आधी रात', 'रात का अंतिम तिहाई', 'सहरी', 'दुहा', 'इस्तिजाबा']),
    'ru': (['Фаджр', 'Восход', 'Зухр', 'Аср', 'Магриб', 'Иша'],
           ['Полночь', 'Последняя треть ночи', 'Сухур', 'Духа', 'Истиджаба']),
    'th': (['ฟัจร์', 'ตะวันขึ้น', 'ซุฮ์ริ', 'อัสร์', 'มัฆริบ', 'อิชาอ์'],
           ['เที่ยงคืน', 'หนึ่งในสามสุดท้ายของคืน', 'ซะฮูร', 'ฎุฮา', 'อิสติญาบะฮ์']),
    'zh': (['晨礼', '日出', '晌礼', '晡礼', '昏礼', '宵礼'],
           ['午夜', '后夜三分之一', '封斋饭', '都哈', '应答时刻']),
    'fr': (['Fajr', 'Lever du soleil', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
           ['Minuit', 'Dernier tiers de la nuit', 'Suhoor', 'Duha', 'Istijaba']),
    'de': (['Fadschr', 'Sonnenaufgang', 'Dhuhr', 'Asr', 'Maghrib', 'Ischa'],
           ['Mitternacht', 'Letztes Drittel der Nacht', 'Suhur', 'Duha', 'Istidschaba']),
    'es': (['Fayr', 'Amanecer', 'Duhr', 'Asr', 'Magrib', 'Isha'],
           ['Medianoche', 'Último tercio de la noche', 'Suhur', 'Duha', 'Istiyaba']),
    'sw': (['Alfajiri', 'Macheo', 'Adhuhuri', 'Alasiri', 'Magharibi', 'Isha'],
           ['Usiku wa Manane', 'Theluthi ya Mwisho ya Usiku', 'Daku', 'Dhuha', 'Istijaba']),
    'ms': (['Subuh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak'],
           ['Tengah Malam', 'Sepertiga Malam Terakhir', 'Sahur', 'Dhuha', 'Istijabah']),
}

SWIFT_SRC = """
import Foundation
import CoreText
import AppKit

let size: CGFloat = %d
let input = FileHandle.standardInput.readDataToEndOfFile()
let strings = (try! JSONSerialization.jsonObject(with: input)) as! [String]
var out: [Double] = []
for s in strings {
    let base = NSFont(name: "Roboto-Regular", size: size) ?? NSFont.systemFont(ofSize: size)
    let attr = NSAttributedString(string: s, attributes: [.font: base])
    let line = CTLineCreateWithAttributedString(attr)
    out.append(Double(CTLineGetTypographicBounds(line, nil, nil, nil)))
}
print(String(data: try! JSONSerialization.data(withJSONObject: out), encoding: .utf8)!)
""" % SIZE

SWIFT_FILE = '/tmp/opencode/measure-widths.swift'
open(SWIFT_FILE, 'w').write(SWIFT_SRC)


def widths(strings):
    """Advance width in points of each string, via the same shaper iOS draws with."""
    result = subprocess.run(['swift', SWIFT_FILE], input=json.dumps(strings).encode(),
                            capture_output=True)
    if result.returncode != 0:
        print('swift failed:', result.stderr.decode()[:400])
        sys.exit(1)
    return json.loads(result.stdout.decode())


print(f'Advance widths at fontSize {SIZE}, Roboto with CoreText system fallback\n')
rows = []
for tag, (std, ext) in LOCALES.items():
    ws, we = widths(std), widths(ext)
    rows.append((tag, max(ws), std[ws.index(max(ws))], max(we), ext[we.index(max(we))]))

base_std = next(r[1] for r in rows if r[0] == 'en')
base_ext = next(r[3] for r in rows if r[0] == 'en')
print(f"{'loc':5} {'standard':>9} {'x en':>6}  {'longest':<14} {'extras':>9} {'x en':>6}  longest")
for tag, s, sn, e, en_ in sorted(rows, key=lambda r: -r[3]):
    print(f'{tag:5} {s:>8.1f}p {s/base_std:>5.2f}x  {sn:<14} {e:>8.1f}p {e/base_ext:>5.2f}x  {en_}')

print(f'\nEnglish today: standard {base_std:.1f}pt ("Sunrise"), extras {base_ext:.1f}pt ("Last Third")')
worst = max(rows, key=lambda r: r[3])
print(f'Worst extras: {worst[0]} at {worst[3]:.1f}pt, {worst[3]/base_ext:.2f}x English, "{worst[4]}"')
SCREEN = 360  # dp, a conservative small-phone width
print(f'\nA {SCREEN}dp screen minus 20dp padding leaves {SCREEN-40}dp for name + time + bell.')
print(f'Worst name alone takes {worst[3]/ (SCREEN-40) * 100:.0f}% of that.')

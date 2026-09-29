"""How much a translated widget payload grows, from the real props shape.

Every entry carries nextName plus a rows[] of name/time pairs. Translating a
widget means each of those names becomes a longer, non-ASCII string, and
JSON.stringify escapes nothing for UTF-8 but the byte length grows.
"""
import json

# Measured shape: 23 entries for a 3-day standard horizon (widgetTimeline.test.ts
# comment), each carrying 6 day-list rows plus a nextName.
ENTRIES_3DAY = 23
ROWS_PER_ENTRY = 6

NAMES = {
    'English (today)': ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'],
    'Arabic': ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
    'Hindi': ['फ़ज्र', 'सूर्योदय', 'ज़ुहर', 'अस्र', 'मग़रिब', 'इशा'],
    'Bengali': ['ফজর', 'সূর্যোদয়', 'যোহর', 'আসর', 'মাগরিব', 'এশা'],
    'Turkish': ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'],
    'Indonesian': ['Subuh', 'Terbit', 'Zuhur', 'Asar', 'Maghrib', 'Isya'],
    'Russian': ['Фаджр', 'Восход', 'Зухр', 'Аср', 'Магриб', 'Иша'],
    'Thai': ['ฟัจร์', 'ตะวันขึ้น', 'ซุฮ์ริ', 'อัสร์', 'มัฆริบ', 'อิชาอ์'],
    'Chinese': ['晨礼', '日出', '晌礼', '晡礼', '昏礼', '宵礼'],
}

print(f"{'locale':18} {'utf8 bytes/name':>16} {'entry rows':>11} {'3-day payload':>15} {'vs English':>11}")
base = None
for label, names in NAMES.items():
    per_name = sum(len(n.encode('utf-8')) for n in names) / len(names)
    # Each entry: nextName + ROWS_PER_ENTRY names. Time strings and numbers are
    # locale-independent, so only the name bytes move.
    name_bytes = (ROWS_PER_ENTRY + 1) * per_name * ENTRIES_3DAY
    if base is None:
        base = name_bytes
    print(f'{label:18} {per_name:>16.1f} {ROWS_PER_ENTRY:>11} {name_bytes:>13.0f} B {name_bytes/base:>10.2f}x')

print(f'\nMeasured whole-payload baseline (widgetTimeline.test.ts): ~9,800 B for 23 entries')
print(f'Guard in that test: 200,000 B')
print(f'Headroom: {200000/9800:.1f}x')
worst = max(sum(len(n.encode("utf-8")) for n in v)/len(v) for v in NAMES.values())
eng = sum(len(n.encode("utf-8")) for n in NAMES['English (today)'])/6
growth = (ROWS_PER_ENTRY+1) * (worst-eng) * ENTRIES_3DAY
print(f'Worst-case name-byte growth over English: +{growth:.0f} B, giving ~{9800+growth:.0f} B total')
print(f'That is {(9800+growth)/200000*100:.1f}% of the 200KB guard.')

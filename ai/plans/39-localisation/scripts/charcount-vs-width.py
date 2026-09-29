"""Character count picks the wrong name. Measured, not argued."""
import subprocess, json

CASES = {
 'ar extras': ['نصف الليل', 'آخر ثلث', 'السحور', 'الضحى', 'استجابة'],
 'ur standard': ['فجر', 'طلوع آفتاب', 'ظہر', 'عصر', 'مغرب', 'عشاء'],
 'hi standard': ['फ़ज्र', 'सूर्योदय', 'ज़ुहर', 'अस्र', 'मग़रिब', 'इशा'],
 'th standard': ['ฟัจร์', 'ตะวันขึ้น', 'ซุฮ์ริ', 'อัสร์', 'มัฆริบ', 'อิชาอ์'],
 'zh standard': ['晨礼', '日出', '晌礼', '晡礼', '昏礼', '宵礼'],
 'en standard': ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'],
}

def widths(strings):
    r = subprocess.run(['swift', '/tmp/opencode/measure-widths.swift'],
                       input=json.dumps(strings).encode(), capture_output=True)
    return json.loads(r.stdout.decode())

print(f"{'case':14} {'by chars':<14} {'by width':<14} agree?")
for label, names in CASES.items():
    w = widths(names)
    by_chars = max(names, key=len)
    by_width = names[w.index(max(w))]
    mark = 'yes' if by_chars == by_width else 'NO'
    print(f'{label:14} {by_chars:<14} {by_width:<14} {mark}')

"""Al-Azan's shipped names, measured against the 123pt budget.

An independent cross-check of the working set in WIDTH-EVIDENCE.md, taken from a
production Islamic app's own res/values-* catalogs (AGPL, used as a cross-check
only, never copied).
"""
import subprocess, json

STANDARD = {
 'en': ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'],
 'ar': ['الفجر','شروق الشمس','الظهر','العصر','المغرب','العشاء'],
 'tr': ['İmsak','Güneş','Öğle','İkindi','Akşam','Yatsı'],
 'id': ['Subuh','Terbit','Dzuhur','Ashar','Maghrib',"Isya'"],
 'ur': ['فجر','طلوع آفتاب','ظہر','عصر','مغرب','عشاء'],
 'bn': ['ফজর','সূর্যোদয়','যোহর','আসর','মাগরিব','ইশা'],
 'hi': ['फज्र','सूर्योदय','ज़ुहर','असर','मग़रिब','ईशा'],
 'sw': ['Fajr','Macheo','Dhuhr','Asr','Magharibi','Isha'],
 'fr': ['Fajr','Lever du soleil','Dhuhr','Asr','Maghrib','Isha'],
 'de': ['Fadschr','Sonnenaufgang','Zuhr','Nachmittagsgebet','Abendgebet','Ischa'],
}
MIDNIGHT = {
 'en':'Midnight','ar':'منتصف الليل','tr':'Gece yarısı','id':'Tengah malam',
 'ur':'آدھی رات','bn':'মধ্যরাত','hi':'मध्यरात्रि','sw':'Katikati ya usiku',
 'fr':'Minuit','de':'Mitternacht',
}
BUDGET = 123.0

def w(strings):
    r = subprocess.run(['swift','ai/plans/39-localisation/scripts/measure-widths.swift'],
                       input=json.dumps(strings).encode(), capture_output=True)
    return json.loads(r.stdout.decode())

print(f'Al-Azan shipped names, measured. Budget {BUDGET:.0f}pt\n')
print(f"{'loc':5} {'longest standard':<22} {'pt':>7} {'':3} {'midnight':<20} {'pt':>7}")
for tag, names in STANDARD.items():
    ws = w(names)
    longest = names[ws.index(max(ws))]
    mw = w([MIDNIGHT[tag]])[0]
    flag = '' if max(ws) <= BUDGET else 'OVER'
    mflag = '' if mw <= BUDGET else 'OVER'
    print(f'{tag:5} {longest:<22} {max(ws):>6.1f} {flag:3} {MIDNIGHT[tag]:<20} {mw:>6.1f} {mflag}')

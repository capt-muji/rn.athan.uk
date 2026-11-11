import json, os, re, html, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, 'captures')
DATA = os.path.join(ROOT, 'data')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

tenants = {o['id']: o for o in json.load(open(os.path.join(DATA, 'tenants.json')))}

# selection: id -> reason tag
SEL = {}
def pick(country, city, n, tag):
    got = [o for o in tenants.values() if o['country'] == country and o['city'] == city]
    for o in got[:n]:
        SEL[o['id']] = tag

pick('لبنان', 'رأس-بيروت', 4, 'LB-beirut')
pick('لبنان', 'صيدا', 3, 'LB-sidon')
pick('لبنان', 'طرابلس', 3, 'LB-tripoli')
pick('المملكة العربية السعودية', 'الدمام', 2, 'SA')
pick('المملكة العربية السعودية', 'مكة-المكرمة', 2, 'SA')
pick('المملكة العربية السعودية', 'جدة', 2, 'SA')
pick('المملكة العربية السعودية', 'الرياض', 2, 'SA')
pick('المملكة العربية السعودية', 'المدينة-المنورة', 1, 'SA')
pick('المملكة العربية السعودية', 'أبها', 1, 'SA')
pick('الجزائر', 'الجزائر', 1, 'DZ')
pick('الجزائر', 'وهران', 1, 'DZ')
pick('الجزائر', 'قسنطينة', 1, 'DZ')
pick('الجزائر', 'الجلفة', 1, 'DZ')
pick('الجزائر', 'ورقلة', 1, 'DZ')
pick('الجزائر', 'تلمسان', 1, 'DZ')
pick('الجزائر', 'بشار', 1, 'DZ')
pick('الجزائر', 'بسكرة', 1, 'DZ')
for c in ['Jakarta-Pusat', 'Jakarta-Selatan', 'Bogor', 'Semarang', 'Makassar', 'Padang', 'Pekanbaru', 'Kabupaten-Malang']:
    pick('أندونيسيا', c, 1, 'ID')
pick('عمان', 'مسقط', 2, 'OM')
pick('عمان', 'صلالة', 1, 'OM')
pick('عمان', 'صحار', 1, 'OM')
pick('عمان', 'سمائل', 1, 'OM')
pick('عمان', 'بركاء', 1, 'OM')
pick('الأردن', 'عمان', 3, 'JO')
pick('الأردن', 'إربد', 2, 'JO')
pick('الأردن', 'الزرقاء', 1, 'JO')
pick('المغرب', 'الدار-البيضاء', 1, 'MA')
pick('المغرب', 'الرباط', 1, 'MA')
pick('المغرب', 'طنجة', 1, 'MA')
pick('المغرب', 'مراكش', 1, 'MA')
pick('المغرب', 'وجدة-أنجاد', 1, 'MA')
pick('المغرب', 'الجديدة', 1, 'MA')
for c, n in [('سوريا', 2), ('تونس', 2), ('مصر', 2), ('ماليزيا', 2), ('العراق', 2), ('الكويت', 2),
             ('فلسطين', 2), ('قطر', 1), ('البحرين', 1), ('ليبيا', 1), ('تركيا', 1), ('المملكة المتحدة', 1),
             ('الولايات المتحدة', 1), ('كندا', 1), ('ألمانيا', 1), ('السويد', 1), ('النرويج', 1),
             ('بلجيكا', 1), ('إيطاليا', 1), ('إسبانيا', 1), ('رومانيا', 1), ('البوسنة والهرسك', 1),
             ('روسيا', 1), ('الهند', 1), ('باكستان', 1), ('أستراليا', 1)]:
    got = [o for o in tenants.values() if o['country'] == c]
    for o in got[:n]:
        SEL[o['id']] = c

def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return open(path, encoding='utf-8', errors='replace').read()
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        body = r.read().decode('utf-8', 'replace')
    open(path, 'w', encoding='utf-8').write(body)
    return body

def config_of(body):
    m = re.search(r'<masjidi-data data="(.*?)"></masjidi-data>', body, re.S)
    if not m:
        return None
    return json.loads(html.unescape(m.group(1)))['configuration']

rows = []
for tid, tag in SEL.items():
    body = fetch(f'https://tv.masjidi.app/{tid}', os.path.join(CAP, f'screen_{tid}.html'))
    c = config_of(body)
    if not c:
        rows.append({'id': tid, 'tag': tag, 'error': 'no config'})
        continue
    td = c.get('templateData', {})
    timings = c.get('timings', {})
    url = timings.get('url', '')
    m = re.search(r'region_json_(\d+)\.json', url)
    prayers = []
    for p in c.get('prayers', []):
        prayers.append({
            'key': p.get('key'),
            'iqamaWaitDuration': p.get('iqamaWaitDuration'),
            'timeOffset': p.get('timeOffset'),
            'dateOverrides': p.get('dateOverrides'),
        })
    rows.append({
        'id': tid, 'tag': tag, 'name': td.get('masjidName'), 'city': td.get('masjidCity'),
        'country': td.get('masjidCountry'), 'address': td.get('masjidAddress'),
        'timezone': c.get('timezone'), 'timingsType': timings.get('type'),
        'tableId': int(m.group(1)) if m else None, 'prayers': prayers,
    })
    print(tid, tag, rows[-1]['timingsType'], rows[-1]['tableId'], td.get('masjidName'))

json.dump(rows, open(os.path.join(DATA, 'sample_configs.json'), 'w'), ensure_ascii=False, indent=1)
tables = sorted({r['tableId'] for r in rows if r.get('tableId')})
print('distinct tables', len(tables), tables)
for n in tables:
    fetch(f'https://tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_{n}.json',
          os.path.join(CAP, f'table_region_{n}.json'))
print('tenants fetched', len(rows))

#!/usr/bin/env python3
"""Normalise CDUM city year pages (12 month tables per page) into dated rows."""
import re, os, json, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(ROOT, 'captures', 'cdum')
MONTHS = {'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4, 'май': 5, 'июнь': 6,
          'июль': 7, 'август': 8, 'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12}
LABELS = {
    'Chelyabinsk_Chelyabinsk2015.php': 'Челябинск', 'Kazan_Kazan.php': 'Казань',
    'Kurgan_Kurgan.php': 'Курган', 'Moskva_index.php': 'Москва',
    'Rostov-na-Dony_Rostov.php': 'Ростов-на-Дону', 'Spb.php': 'Санкт-Петербург',
    'Surgut_Surgut2015.php': 'Салехард', 'Ulyanovsk_Ulyanovsk2015.php': 'Ульяновск',
    'astrakhan_Astrakhan.php': 'Астрахань', 'cheboksary_Cheboksary.php': 'Чебоксары',
    'ekb_Ekb2015.php': 'Екатеринбург', 'izhevsk_Izhevsk2015.php': 'Ижевск',
    'khabarovsk_Habarovsk2015.php': 'Хабаровск', 'orenburg_Orenburg2015.php': 'Оренбург',
    'samara_Samara2015.php': 'Самара', 'ufa2014_Ufa2015.php': 'Уфа',
    'yoshkar-ola_Yoshkar-Ola2015.php': 'Йошкар-Ола', 'Волгоград_Volgograd.php': 'Волгоград',
    'Киров_Kirov.php': 'Киров', 'Пенза_Penza2015.php': 'Пенза', 'Пермь_Perm.php': 'Пермь',
}
CELL = re.compile(r'<t[dh][^>]*>(.*?)</t[dh]>', re.S)
WEEKDAY = {'пн': 0, 'вт': 1, 'ср': 2, 'чт': 3, 'пт': 4, 'сб': 5, 'вс': 6}
# The tables carry no month header, so the month is recovered from the printed
# weekday of day 1 against the 2026 calendar (each month has a distinct weekday
# for its first day, which makes the mapping unambiguous).
FIRST_WEEKDAY = {m: __import__('datetime').date(2026, m, 1).weekday() for m in range(1, 13)}


def clock(s):
    s = s.strip()
    m = re.match(r'^(\d{1,2})[:.](\d{2})$', s)
    if not m:
        return None
    return int(m.group(1)) * 60 + int(m.group(2))


def text(cell):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', cell)).strip()


out = {}
for path in sorted(glob.glob(os.path.join(CAP, '*.html'))):
    key = os.path.basename(path).replace('_2026-11-11.html', '')
    city = LABELS.get(key, key)
    h = open(path, encoding='utf-8', errors='replace').read()
    h = re.sub(r'<script.*?</script>', '', h, flags=re.S)
    rows = {}
    used_months = set()
    for table in re.findall(r'<table.*?</table>', h, re.S):
        trs = re.findall(r'<tr.*?</tr>', table, re.S)
        if len(trs) < 20:
            continue
        parsed = []
        for tr in trs[1:]:
            cells = [text(c) for c in CELL.findall(tr)]
            if len(cells) < 7:
                continue
            m = re.match(r'^(\d{1,2})\b\s*(\S+)?', cells[0])
            if not m:
                continue
            day = int(m.group(1))
            vals = [clock(c) for c in cells[1:7]]
            if any(v is None for v in vals):
                continue
            wd = WEEKDAY.get((m.group(2) or '').strip().lower()[:2])
            parsed.append((day, wd, vals))
        if not parsed:
            continue
        ndays = max(p[0] for p in parsed)
        wd1 = parsed[0][1]
        month = None
        for cand in range(1, 13):
            if cand in used_months:
                continue
            import calendar
            if calendar.monthrange(2026, cand)[1] != ndays:
                continue
            if wd1 is not None and wd1 != FIRST_WEEKDAY[cand]:
                continue
            month = cand
            break
        if month is None:
            continue
        used_months.add(month)
        for day, _, vals in parsed:
            iso = f"2026-{month:02d}-{day:02d}"
            rows[iso] = dict(zip(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], vals))
    out[city] = {'file': key, 'rows': rows, 'months': sorted({int(k[5:7]) for k in rows})}
    print(city, len(rows), 'rows', len(out[city]['months']), 'months')

json.dump(out, open(os.path.join(ROOT, 'data', 'cdum_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False)

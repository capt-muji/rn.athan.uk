"""Fetch the norislam national grid for 30 prefecture-level cities.

The grid takes arbitrary coordinates through run.asp, so each city is captured at the
portal's own gazetteer point (its county list), never at a point of ours. That keeps the
comparison with the 29 provincial capitals exact.
"""
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).parent
CAP = ROOT / "captures"
DATA = ROOT / "data"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

CITIES = {
    '大连': 'dalian', '青岛': 'qingdao', '宁波': 'ningbo', '厦门': 'xiamen',
    '深圳': 'shenzhen', '洛阳': 'luoyang', '泉州': 'quanzhou', '苏州': 'suzhou',
    '包头': 'baotou', '大同': 'datong', '宝鸡': 'baoji', '吐鲁番': 'turpan',
    '伊宁': 'yining', '临夏': 'linxia', '天水': 'tianshui', '固原': 'guyuan',
    '吴忠': 'wuzhong', '昌吉': 'changji', '库尔勒': 'korla', '阿克苏': 'aksu',
    '和田': 'hotan', '张掖': 'zhangye', '平凉': 'pingliang', '沧州': 'cangzhou',
    '开封': 'kaifeng', '南阳': 'nanyang', '邵阳': 'shaoyang', '桂林': 'guilin',
    '齐齐哈尔': 'qiqihar', '牡丹江': 'mudanjiang',
}

PROVINCES = ['北京市', '上海市', '天津市', '重庆市', '海南省', '广东省', '福建省', '浙江省',
             '江苏省', '山东省', '辽宁省', '吉林省', '黑龙江', '内蒙古', '河北省', '山西省',
             '陕西省', '河南省', '安徽省', '湖北省', '江西省', '湖南省', '云南省', '贵州省',
             '四川省', '青海省', '甘肃省', '宁夏自治区', '新疆自治区', '西藏自治区',
             '广西自治区', '港澳台']


def load_js_array(src, name):
    m = re.search(r'var\s+' + name + r'\s*=\s*(\[.*?\])\s*;', src, re.S)
    body = m.group(1).replace(' ', '').replace('\n', '').replace('\r', '')
    body = re.sub(r',(\s*])', ']', body).replace('??', '')
    return json.loads(body)


def gazetteer():
    src = (CAP / 'norislam_selectin_live.html').read_bytes().decode('gb18030', 'replace')
    cities = load_js_array(src, 'city')
    lons = load_js_array(src, 'jingdu')
    lats = load_js_array(src, 'weidu')
    out = {}
    for i, cs in enumerate(cities):
        for j, name in enumerate(cs):
            if name in CITIES:
                out[CITIES[name]] = {'city': name, 'province': PROVINCES[i],
                                     'lon': lons[i][j], 'lat': lats[i][j],
                                     'province_index': i, 'name_index': j}
    return out


def fetch(slug, lon, lat):
    out = CAP / f'grid_{slug}.html'
    cmd = ['curl', '-sS', '-L', '-o', str(out), '-w', '%{http_code}',
           '-A', UA, '-H', 'Referer: https://www.norislam.com/tool/lb/lbskbsy.htm',
           '-H', 'Content-Type: application/x-www-form-urlencoded',
           '--data', f'province=&city=&longt={lon}&latit={lat}&bianzhi=%B1%E0%D6%C6',
           '--max-time', '150', 'https://www.norislam.com/tool/lb/run.asp']
    code = subprocess.run(cmd, capture_output=True, text=True).stdout.strip()
    return code, out.stat().st_size if out.exists() else 0


def cell_text(h):
    return re.sub(r'<[^>]*>', '', h).replace('&nbsp;', ' ').strip()


def parse(path):
    src = path.read_bytes().decode('gb2312', 'replace')
    rows = []
    for tr in re.findall(r'<tr\b.*?</tr>', src, re.S | re.I):
        cells = [cell_text(c) for c in re.findall(r'<td\b.*?</td>', tr, re.S | re.I)]
        if len(cells) < 16:
            continue
        for off in range(0, len(cells) - 7, 8):
            blk = cells[off:off + 8]
            if not re.fullmatch(r'\d{1,2}', blk[0] or '') or \
               not re.fullmatch(r'\d{1,2}', blk[1] or ''):
                continue
            month, day = int(blk[0]), int(blk[1])
            if not (1 <= month <= 12 and 1 <= day <= 31):
                continue
            vals = [v.rstrip(':') for v in blk[2:]]
            if not all(re.fullmatch(r'\d{1,2}:\d{2}', v) for v in vals):
                continue
            keys = ['fajr', 'sunrise', 'noon', 'asr', 'sunset', 'isha']
            rows.append({'month': month, 'day': day, **dict(zip(keys, vals))})
    seen, uniq = set(), []
    for r in rows:
        k = (r['month'], r['day'])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return uniq


def main():
    gaz = gazetteer()
    (DATA / 'grid-points-pref.json').write_text(json.dumps(gaz, ensure_ascii=False, indent=1))
    print('gazetteer hits:', len(gaz), 'missing:', [CITIES[k] for k in CITIES
                                                   if CITIES[k] not in gaz])
    log = {}
    for slug, g in gaz.items():
        code, size = fetch(slug, g['lon'], g['lat'])
        rows = parse(CAP / f'grid_{slug}.html')
        (DATA / f'grid_{slug}.json').write_text(json.dumps(
            {'city': g['city'], 'slug': slug, 'lon': g['lon'], 'lat': g['lat'],
             'province': g['province'], 'source': 'norislam.com/tool/lb/run.asp',
             'class': 'calculator (computed, no year; 2004 declination table)',
             'rows': rows}, ensure_ascii=False, indent=1))
        log[slug] = {'status': code, 'bytes': size, 'rows': len(rows),
                     'lon': g['lon'], 'lat': g['lat']}
        print(f"{slug:12s} {g['lon']:>7s}/{g['lat']:>6s} http={code} bytes={size:>7d} rows={len(rows)}")
        (DATA / 'grid-fetch-log-pref.json').write_text(
            json.dumps(log, ensure_ascii=False, indent=1))
        time.sleep(2)


if __name__ == '__main__':
    main()

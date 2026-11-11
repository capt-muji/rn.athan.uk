"""Fetch the norislam national grid for every provincial capital.

The grid takes arbitrary 经度/纬度 through run.asp; the portal's own county list
supplies each capital's reference point, so the capture is grounded in the
publisher's gazetteer rather than ours.
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
CAP = ROOT / "captures"
DATA = ROOT / "data"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

PROVINCES = ['北京市', '上海市', '天津市', '重庆市', '海南省', '广东省', '福建省', '浙江省',
             '江苏省', '山东省', '辽宁省', '吉林省', '黑龙江', '内蒙古', '河北省', '山西省',
             '陕西省', '河南省', '安徽省', '湖北省', '江西省', '湖南省', '云南省', '贵州省',
             '四川省', '青海省', '甘肃省', '宁夏自治区', '新疆自治区', '西藏自治区',
             '广西自治区', '港澳台']

CAPITALS = {
    '北京市': '北京', '上海市': '上海', '天津市': '天津', '重庆市': '重庆',
    '广东省': '广州', '云南省': '昆明', '新疆自治区': '乌鲁木齐', '宁夏自治区': '银川',
    '甘肃省': '兰州', '青海省': '西宁', '陕西省': '西安', '河南省': '郑州',
    '山东省': '济南', '辽宁省': '沈阳', '吉林省': '长春', '黑龙江': '哈尔滨',
    '内蒙古': '呼和浩特', '四川省': '成都', '湖北省': '武汉', '湖南省': '长沙',
    '江苏省': '南京', '浙江省': '杭州', '福建省': '福州', '广西自治区': '南宁',
    '贵州省': '贵阳', '安徽省': '合肥', '河北省': '石家庄', '山西省': '太原',
    '西藏自治区': '拉萨',
}

SLUG = {
    '北京': 'beijing', '上海': 'shanghai', '天津': 'tianjin', '重庆': 'chongqing',
    '广州': 'guangzhou', '昆明': 'kunming', '乌鲁木齐': 'urumqi', '银川': 'yinchuan',
    '兰州': 'lanzhou', '西宁': 'xining', '西安': "xian", '郑州': 'zhengzhou',
    '济南': 'jinan', '沈阳': 'shenyang', '长春': 'changchun', '哈尔滨': 'harbin',
    '呼和浩特': 'hohhot', '成都': 'chengdu', '武汉': 'wuhan', '长沙': 'changsha',
    '南京': 'nanjing', '杭州': 'hangzhou', '福州': 'fuzhou', '南宁': 'nanning',
    '贵阳': 'guiyang', '合肥': 'hefei', '石家庄': 'shijiazhuang', '太原': 'taiyuan',
    '拉萨': 'lhasa',
}


def load_js_array(src: str, name: str):
    m = re.search(r'var\s+' + name + r'\s*=\s*(\[.*?\])\s*;', src, re.S)
    body = m.group(1).replace(' ', '').replace('\n', '').replace('\r', '')
    body = re.sub(r',(\s*])', ']', body).replace('??', '')
    return json.loads(body)


def gazetteer():
    src = (CAP / 'norislam_selectin_live.html').read_bytes().decode('gb18030', 'replace')
    cities = load_js_array(src, 'city')
    lons = load_js_array(src, 'jingdu')
    lats = load_js_array(src, 'weidu')
    assert len(cities) == len(lons) == len(lats) == len(PROVINCES)
    out = {}
    for i, prov in enumerate(PROVINCES):
        want = CAPITALS.get(prov)
        if not want:
            continue
        try:
            j = cities[i].index(want)
        except ValueError:
            continue
        out[want] = {'province': prov, 'province_index': i,
                     'lon': lons[i][j], 'lat': lats[i][j],
                     'grid_name': want, 'name_index': j}
    return out


def fetch(name, lon, lat):
    out = CAP / f'grid_{SLUG[name]}.html'
    cmd = ['curl', '-sS', '-L', '-o', str(out), '-w', '%{http_code}',
           '-A', UA, '-H', 'Referer: https://www.norislam.com/tool/lb/lbskbsy.htm',
           '-H', 'Content-Type: application/x-www-form-urlencoded',
           '--data', f'province=&city=&longt={lon}&latit={lat}&bianzhi=%B1%E0%D6%C6',
           '--max-time', '150', 'https://www.norislam.com/tool/lb/run.asp']
    code = subprocess.run(cmd, capture_output=True, text=True).stdout.strip()
    return code, out.stat().st_size


def cell_text(h: str) -> str:
    return re.sub(r'<[^>]*>', '', h).replace('&nbsp;', ' ').strip()


def parse(path: Path):
    src = path.read_bytes().decode('gb2312', 'replace')
    rows = []
    for tr in re.findall(r'<tr\b.*?</tr>', src, re.S | re.I):
        cells = [cell_text(c) for c in re.findall(r'<td\b.*?</td>', tr, re.S | re.I)]
        if len(cells) < 16:
            continue
        for off in range(0, len(cells) - 7, 8):
            blk = cells[off:off + 8]
            if not re.fullmatch(r'\d{1,2}', blk[0] or '') or not re.fullmatch(r'\d{1,2}', blk[1] or ''):
                continue
            month, day = int(blk[0]), int(blk[1])
            if not (1 <= month <= 12 and 1 <= day <= 31):
                continue
            vals = [v.rstrip(':') for v in blk[2:]]
            if not all(re.fullmatch(r'\d{1,2}:\d{2}', v) for v in vals):
                continue
            keys = ['fajr', 'sunrise', 'noon', 'asr', 'sunset', 'isha']
            row = {'month': month, 'day': day}
            row.update(dict(zip(keys, vals)))
            rows.append(row)
    # de-duplicate, keep printed order
    seen, uniq = set(), []
    for r in rows:
        k = (r['month'], r['day'])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return uniq


def main():
    gaz = gazetteer()
    (DATA / 'grid-points.json').write_text(json.dumps(gaz, ensure_ascii=False, indent=1))
    log = {}
    for name, g in gaz.items():
        code, size = fetch(name, g['lon'], g['lat'])
        rows = parse(CAP / f'grid_{SLUG[name]}.html')
        (DATA / f'grid_{SLUG[name]}.json').write_text(json.dumps(
            {'city': name, 'slug': SLUG[name], 'lon': g['lon'], 'lat': g['lat'],
             'province': g['province'], 'source': 'norislam.com/tool/lb/run.asp',
             'class': 'calculator (computed, no year; 2004 declination table)', 'rows': rows},
            ensure_ascii=False, indent=1))
        log[name] = {'status': code, 'bytes': size, 'rows': len(rows),
                     'lon': g['lon'], 'lat': g['lat']}
        print(f"{name:6s} {g['lon']:>7s}/{g['lat']:>6s}  http={code} bytes={size:>7d} rows={len(rows)}")
        time.sleep(2)
    (DATA / 'grid-fetch-log.json').write_text(json.dumps(log, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()

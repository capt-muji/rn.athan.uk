import json, math, os, urllib.request, urllib.parse, time, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 athan-census/1.0'
coords = json.load(open('data/ba_coords.json'))
os.makedirs('captures/elev', exist_ok=True)

def query(points, tag):
    path = 'captures/elev/%s.json' % tag
    if os.path.exists(path):
        return json.load(open(path))['results']
    locs = '|'.join('%.5f,%.5f' % p for p in points)
    url = 'https://api.opentopodata.org/v1/srtm90m?locations=' + urllib.parse.quote(locs, safe='|,')
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                d = json.loads(r.read().decode())
            json.dump(d, open(path, 'w'))
            time.sleep(1.1)
            return d['results']
        except Exception as e:
            print('retry', tag, e, file=sys.stderr)
            time.sleep(6)
    raise SystemExit('elevation fetch failed ' + tag)

# 1) city points
ids = sorted(int(k) for k in coords)
pts = [(coords[str(i)]['lat'], coords[str(i)]['lon']) for i in ids]
res = []
for k in range(0, len(pts), 100):
    res += query(pts[k:k + 100], 'city_%02d' % (k // 100))
city_elev = {}
for i, r in zip(ids, res):
    city_elev[i] = r['elevation']

# 2) terrain horizon rings: 16 azimuths x 3 radii
RADII = [3.0, 6.0, 10.0]
AZ = list(range(0, 360, 22))
ring = []
keys = []
for i in ids:
    lat0, lon0 = coords[str(i)]['lat'], coords[str(i)]['lon']
    for r in RADII:
        for a in AZ:
            dlat = (r / 111.32) * math.cos(math.radians(a))
            dlon = (r / (111.32 * math.cos(math.radians(lat0)))) * math.sin(math.radians(a))
            ring.append((lat0 + dlat, lon0 + dlon))
            keys.append((i, r, a))
horizon = {i: 0.0 for i in ids}
res2 = []
for k in range(0, len(ring), 100):
    res2 += query(ring[k:k + 100], 'ring_%02d' % (k // 100))
assert len(res2) == len(ring), (len(res2), len(ring))
per_az = {i: {} for i in ids}
for (i, r, a), rr in zip(keys, res2):
    h = rr['elevation']
    if h is None:
        continue
    lat0, lon0 = coords[str(i)]['lat'], coords[str(i)]['lon']
    dlat = (r / 111.32) * math.cos(math.radians(a))
    dlon = (r / (111.32 * math.cos(math.radians(lat0)))) * math.sin(math.radians(a))
    elev_ref = city_elev[i]
    ang = math.degrees(math.atan2(h - elev_ref, r * 1000.0))
    per_az[i][(a, r)] = {**rr, 'angle': ang}

out = {}
for i in ids:
    az_max = {}
    for (a, r), v in per_az[i].items():
        if v['angle'] > az_max.get(a, {'angle': -99})['angle']:
            az_max[a] = v
    # eastern horizon governs sunrise, western governs sunset
    east = [az_max[a]['angle'] for a in az_max if 45 <= a <= 135]
    west = [az_max[a]['angle'] for a in az_max if 225 <= a <= 315]
    out[i] = {'cityElevationM': city_elev[i],
              'horizonEastDeg': round(max(east), 3) if east else None,
              'horizonWestDeg': round(max(west), 3) if west else None,
              'horizonAllDeg': round(max(v['angle'] for v in az_max.values()), 3),
              'ringMaxTerrainM': max(v['elevation'] for v in per_az[i].values() if v['elevation'] is not None)}
json.dump(out, open('data/ba_elev.json', 'w'), indent=1)
for i in ids[:6]:
    print(i, out[i])

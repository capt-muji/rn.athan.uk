import json, re, html, sys

src, out = sys.argv[1], sys.argv[2]
t = open(src, encoding='utf-8', errors='replace').read()
# rows print as "Sunday, November 1, 2026| |05:16| |06:33| ..."
body = re.sub(r'<script.*?</script>|<style.*?</style>', '', t, flags=re.S)
x = html.unescape(re.sub(r'<[^>]+>', '|', body))
cells = [c.strip() for c in re.split(r'\|+', x)]
rows = {}
i = 0
while i < len(cells):
    m = re.fullmatch(r'(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (\w+) (\d+), (\d{4})', cells[i])
    if m:
        mon = ['January','February','March','April','May','June','July','August','September','October','November','December'].index(m.group(2)) + 1
        vals = []
        j = i + 1
        while j < len(cells) and len(vals) < 6:
            if re.fullmatch(r'\d\d:\d\d', cells[j]):
                vals.append(cells[j])
            elif re.fullmatch(r'(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),.*', cells[j]):
                break
            j += 1
        if len(vals) == 6:
            key = f'{m.group(4)}-{mon:02d}-{int(m.group(3)):02d}'
            rows[key] = {'fajr': vals[0], 'sunrise': vals[1], 'dhuhr': vals[2],
                         'asr': vals[3], 'maghrib': vals[4], 'isha': vals[5]}
        i = j
    else:
        i += 1
json.dump(rows, open(out, 'w'), indent=1, sort_keys=True)
print(out, len(rows), min(rows) if rows else '-', max(rows) if rows else '-')

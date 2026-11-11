import re, json, html, sys

h = open(sys.argv[1], encoding='utf8', errors='replace').read()
rows = []

blocks = re.split(r'(<section[^>]*class="country-section"[^>]*>)', h)
for i in range(1, len(blocks), 2):
    head, body = blocks[i], (blocks[i + 1] if i + 1 < len(blocks) else '')
    m = re.search(r'data-country="([^"]*)"', head)
    country = html.unescape(m.group(1)) if m else ''
    parts = re.split(r'(<section[^>]*class="city-section"[^>]*>)', body)
    for j in range(1, len(parts), 2):
        chead, cbody = parts[j], (parts[j + 1] if j + 1 < len(parts) else '')
        cm = re.search(r'id="city-([^"]*)"', cbody)
        city = html.unescape(cm.group(1)) if cm else ''
        for card in re.findall(r'<a[^>]*class="masjid-card"[^>]*>', cbody):
            def g(k):
                mm = re.search(k + r'="([^"]*)"', card)
                return html.unescape(mm.group(1)) if mm else ''
            rows.append({'id': g('data-id'), 'name': g('data-name'),
                         'address': g('data-address'), 'country': country, 'city': city})

print(json.dumps(rows, ensure_ascii=False))

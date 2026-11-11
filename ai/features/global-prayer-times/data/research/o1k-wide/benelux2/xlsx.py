"""Minimal XLSX reader: returns rows of cell values (shared strings resolved, numbers as-is)."""
import zipfile, re
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

def col_index(ref):
    m = re.match(r'([A-Z]+)', ref)
    n = 0
    for ch in m.group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1

def read(path, sheet='xl/worksheets/sheet1.xml'):
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(NS + 'si'):
            shared.append(''.join(t.text or '' for t in si.iter(NS + 't')))
    rows = []
    for r in ET.fromstring(z.read(sheet)).iter(NS + 'row'):
        cells = {}
        for c in r.findall(NS + 'c'):
            v = c.find(NS + 'v')
            if v is None:
                continue
            val = v.text
            if c.get('t') == 's':
                val = shared[int(val)]
            cells[col_index(c.get('r'))] = val
        rows.append([cells.get(i) for i in range(max(cells) + 1)] if cells else [])
    return rows

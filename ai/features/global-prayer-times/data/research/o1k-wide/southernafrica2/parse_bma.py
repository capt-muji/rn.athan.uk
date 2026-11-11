"""Parse BMA prayer-times town/month tables from a page DOM into normalized rows."""
import json, re, sys, calendar, html as htmllib


def parse_tables(html):
    """Return {(town, month): {'columns': [...], 'rows': [(day, *times)]}}."""
    out = {}
    # each table sits in <div id="<Town>-<month>" class="... calender" ...> ... <table ...> ... </table>
    for m in re.finditer(r'<div[^>]*id="([A-Za-z0-9]+)-([a-z]+)"[^>]*class="[^"]*calender[^"]*"[^>]*>(.*?)(?=<div[^>]*id="[A-Za-z0-9]+-[a-z]+"[^>]*class="[^"]*calender|<script|$)', html, re.S):
        town, month, seg = m.group(1), m.group(2), m.group(3)
        tbl = re.search(r'<table[^>]*>(.*?)</table>', seg, re.S)
        if not tbl:
            continue
        heads = [htmllib.unescape(re.sub(r'<[^>]+>', '', c)).strip()
                 for c in re.findall(r'<th[^>]*>(.*?)</th>', tbl.group(1), re.S)]
        rows = []
        for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', tbl.group(1), re.S):
            cells = [htmllib.unescape(re.sub(r'<[^>]+>', '', c)).replace('\xa0', ' ').strip()
                     for c in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
            if cells and cells[0].isdigit():
                rows.append(cells)
        out[(town, month)] = {'columns': heads, 'rows': rows}
    return out


if __name__ == '__main__':
    tables = parse_tables(open(sys.argv[1]).read())
    print(len(tables), 'tables')
    k = ('Bobonong', 'december')
    print(k in tables and (tables[k]['columns'], len(tables[k]['rows']), tables[k]['rows'][:2]))

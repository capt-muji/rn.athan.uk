#!/usr/bin/env python3
"""Print each HTML table's header + first rows, for eyeballing table shapes."""
import re, sys


def clean(x):
    x = re.sub(r"<[^>]+>", " ", x)
    return re.sub(r"\s+", " ", x).strip()


for path in sys.argv[1:]:
    h = open(path, encoding="utf-8", errors="replace").read()
    h = re.sub(r"<script.*?</script>", "", h, flags=re.S)
    print(f"\n===== {path.split('/')[-1]}")
    for i, tb in enumerate(re.findall(r"<table.*?</table>", h, re.S)):
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S)
        print(f"  table[{i}] rows={len(rows)}")
        for r in rows[:4]:
            cells = [clean(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S)]
            if cells:
                print("    ", cells[:14])

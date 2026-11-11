#!/usr/bin/env python3
"""Harvest the Jerusalem Awqaf homepage snapshots from the Wayback Machine.

The homepage renders one dated table server-side, so a snapshot is one day of
official data. Parse the seven azan slots and the civil/Hijri date printed beside
them; the date on the page is the date of the reading, never the capture clock.
"""
import json
import os
import re
import sys
import time
import urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

MONTHS = {"كانون الثاني": 1, "شباط": 2, "آذار": 3, "اذار": 3, "نيسان": 4,
          "أيار": 5, "ايار": 5, "حزيران": 6, "تموز": 7, "آب": 8, "اب": 8,
          "أيلول": 9, "ايلول": 9, "تشرين الأول": 10, "تشرين الاول": 10,
          "تشرين الثاني": 11, "تشرين الثاني": 11, "كانون الأول": 12,
          "كانون الاول": 12,
          "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4, "مايو": 5,
          "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8, "سبتمبر": 9,
          "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12}

SLOTS = [("athanAwl", "first"), ("fajr", "fajr"), ("shurook", "sunrise"),
         ("thuhr", "dhuhr"), ("asr", "asr"), ("magreb", "maghrib"),
         ("ishaa", "isha")]

EN_MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"], start=1)}


def fetch(ts, url):
    u = f"https://web.archive.org/web/{ts}id_/{url}"
    req = urllib.request.Request(u, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode("utf-8", "replace")


def parse(html):
    out = {}
    for dom, key in SLOTS:
        m = re.search(r'id="%s"[^>]*>.*?azan-value"?>?\s*([0-9]{1,2}:[0-9]{2})' % dom, html, re.S)
        if not m:
            m = re.search(r'id="%s"[^>]*>\s*<span[^>]*>[^<]*</span>\s*<span[^>]*>\s*([0-9]{1,2}:[0-9]{2})' % dom, html, re.S)
        if m:
            out[key] = m.group(1)
    m = re.search(r'<div class="milady">\s*([0-9]{1,2})\s+([^<]+?)\s+([0-9]{4})', html)
    if m:
        day, name, year = int(m.group(1)), m.group(2).strip(), int(m.group(3))
        mon = MONTHS.get(name) or EN_MONTHS.get(name.lower())
        if mon:
            out["date"] = f"{year:04d}-{mon:02d}-{day:02d}"
    m = re.search(r'<div class="hijri">\s*([0-9]{1,2})\s+([^<]+?)\s*([0-9]{4})', html)
    if m:
        out["hijri"] = " ".join(m.groups())
    return out


def main(cdx_file):
    rows = {}
    snaps = [l.split() for l in open(cdx_file) if l.strip()]
    os.makedirs("captures/awqaf-wb", exist_ok=True)
    for ts, url, status, *_ in snaps:
        if status != "200":
            continue
        raw = f"captures/awqaf-wb/{ts}-{url.split('//')[1].replace('/','_') or 'root'}.html"
        if os.path.exists(raw):
            html = open(raw, encoding="utf-8", errors="replace").read()
        else:
            try:
                html = fetch(ts, url)
            except Exception as e:
                print(ts, "ERR", e, flush=True)
                time.sleep(2)
                continue
            with open(raw, "w", encoding="utf-8") as f:
                f.write(html)
        p = parse(html)
        if p.get("date") and "fajr" in p:
            p["snapshot"] = ts
            p["source"] = url
            prev = rows.get(p["date"])
            if prev is None:
                rows[p["date"]] = p
                print(p["date"], ts, p["fajr"], p["maghrib"], flush=True)
            else:
                same = all(prev.get(k) == p.get(k) for _, k in SLOTS if k != "first")
                print(p["date"], ts, "DUPLICATE", "same" if same else "CONFLICT", flush=True)
        else:
            print(ts, "NOPARSE", len(html), flush=True)
        time.sleep(1.2)
    with open("data/jerusalem-awqaf-wayback.json", "w", encoding="utf-8") as f:
        json.dump(dict(sorted(rows.items())), f, ensure_ascii=False, indent=1)
    print("days", len(rows))


if __name__ == "__main__":
    main(sys.argv[1])

import json, re, sys, html, urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def get(u, timeout=30):
    req = urllib.request.Request(u, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf8", "replace")


def config(h):
    """The screen page embeds its whole config as an HTML-escaped JSON attribute."""
    m = re.search(r'data-page="([^"]*)"', h)
    if m:
        return json.loads(html.unescape(m.group(1)))
    for m in re.finditer(r'&quot;(\w+)&quot;:\s*&quot;([^&]*)&quot;', h):
        pass
    return None


if __name__ == "__main__":
    for tid in sys.argv[1:]:
        try:
            h = get(f"https://tv.masjidi.app/{tid}")
        except Exception as e:
            print(tid, "ERR", e)
            continue
        refs = sorted(set(re.findall(r"prayer_times_region_json_\d+\.json", h)))
        # coordinates / timezone / method appear in the escaped config
        flat = html.unescape(h)
        lat = re.findall(r'&quot;lat&quot;:\s*([-\d.]+)', h)
        lng = re.findall(r'&quot;lng&quot;:\s*([-\d.]+)', h)
        tz = re.findall(r'&quot;timeZone&quot;:\s*&quot;([^&]*)&quot;', h)
        name = re.findall(r'<title>([^<]*)</title>', h)
        print(json.dumps({"id": tid, "refs": refs, "lat": lat[:3], "lng": lng[:3],
                          "tz": tz[:2], "title": name[:1]}, ensure_ascii=False))

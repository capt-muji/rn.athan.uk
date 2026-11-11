#!/usr/bin/env python3
"""Capture a mawaqit mosque page: raw HTML + extracted config JSON."""
import json, os, re, subprocess, sys

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")
HERE = os.path.dirname(os.path.abspath(__file__))


def fetch(url):
    r = subprocess.run(["curl", "-sL", "--max-time", "45", "-A", UA, url],
                       capture_output=True, text=True)
    return r.stdout


def grab_json(html, key):
    i = html.find('"%s"' % key)
    if i < 0:
        return None
    dec = json.JSONDecoder()
    rest = html[i + len(key) + 2:].lstrip()
    if not rest.startswith(":"):
        return None
    try:
        obj, _ = dec.raw_decode(rest[1:].lstrip())
        return obj
    except Exception:
        return None


def grab_var(html, var):
    m = re.search(r"(?:let|var|const)\s+%s\s*=\s*([^;]+);" % var, html)
    return m.group(1).strip() if m else None


def main(slug, tag):
    url = "https://mawaqit.net/en/m/" + slug
    html = fetch(url)
    raw = os.path.join(HERE, "captures", "mawaqit-%s.html" % tag)
    with open(raw, "w") as f:
        f.write(html)
    out = {"tag": tag, "url": url, "bytes": len(html)}
    if len(html) < 5000:
        out["error"] = "short html"
        print(json.dumps(out))
        return
    title = re.search(r"<title>([^<]+)</title>", html)
    cal = grab_json(html, "calendar")
    out.update({
        "name": title.group(1).strip() if title else None,
        "latitude": grab_var(html, "latitude"),
        "longitude": grab_var(html, "longitude"),
        "times": grab_json(html, "times"),
        "shuruq": grab_json(html, "shuruq"),
        "iqama": grab_json(html, "iqamaDelay"),
        "jumua": grab_json(html, "jumua"),
        "calendar_months": len(cal) if cal else 0,
        "calendar": cal,
        "iqama_calendar": grab_json(html, "calendarIqama") or grab_json(html, "calendarIqamah"),
    })
    with open(os.path.join(HERE, "data", "mawaqit-%s.json" % tag), "w") as f:
        json.dump(out, f, indent=1)
    print(json.dumps({k: v for k, v in out.items() if k not in ("calendar", "iqama_calendar")}))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

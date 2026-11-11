import http.cookiejar
import html as htmllib
import re
import sys
import urllib.parse
import urllib.request

BASE = "https://www.awqaf.gov.jo/ar/Pages/PrayerTime"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


def opener():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [("User-Agent", UA), ("Accept-Language", "ar,en;q=0.8"), ("Referer", BASE)]
    return op


def get_hidden(html):
    out = {}
    for name in ("__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION", "__VIEWSTATEENCRYPTED"):
        m = re.search(r'name="%s"[^>]*value="([^"]*)"' % re.escape(name), html)
        if m:
            out[name] = m.group(1)
    return out


def parse_rows(html):
    rows = []
    m = re.search(r'<table[^>]*id="MainContent_gvWebparts"[\s\S]*?</table>', html)
    if not m:
        return rows
    for tr in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", m.group(0)):
        tds = [htmllib.unescape(re.sub(r"<[^>]+>", "", x)).strip()
               for x in re.findall(r"<td[^>]*>([\s\S]*?)</td>", tr)]
        if len(tds) == 7 and re.match(r"^\d+/\d+/\d{4}$", tds[0]):
            rows.append(tds)
    return rows


city = sys.argv[1]          # DropCompany value
label = sys.argv[2]         # filename stem
out_html = sys.argv[3]

op = opener()
page = op.open(BASE, timeout=120).read().decode("utf-8", "replace")
hidden = get_hidden(page)
fields = dict(hidden)
fields.update({
    "__EVENTTARGET": "ctl00$MainContent$DropCompany",
    "__EVENTARGUMENT": "",
    "ctl00$MainContent$txtFromDate": "",
    "ctl00$MainContent$txtToDate": "",
    "ctl00$MainContent$DropCompany": city,
    "ctl00$MainContent$btn_search": "ابحث",
})
data = urllib.parse.urlencode(fields).encode()
req = urllib.request.Request(BASE, data=data,
                            headers={"Content-Type": "application/x-www-form-urlencoded"})
res = op.open(req, timeout=120)
body = res.read().decode("utf-8", "replace")
with open(out_html, "w", encoding="utf-8") as f:
    f.write(body)
rows = parse_rows(body)
print(label, "city=" + city, "rows=" + str(len(rows)))
for r in rows[:3]:
    print("   ", r)
selected = re.search(r'<option selected="selected" value="(\d+)">([^<]*)</option>', body)
print("   selected option:", selected.group(1) + " " + selected.group(2) if selected else "none")

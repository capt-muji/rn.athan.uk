import re, html, sys

def text(path):
    h = open(path, encoding="utf-8", errors="replace").read()
    h = re.sub(r'(?is)<script.*?</script>', ' ', h)
    h = re.sub(r'(?is)<style.*?</style>', ' ', h)
    t = re.sub(r'(?s)<[^>]+>', ' ', h)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
    for p in sys.argv[2:]:
        t = text(p)
        print("=" * 25, p, len(t))
        print(t[:n])

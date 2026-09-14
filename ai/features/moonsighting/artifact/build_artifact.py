import json, os

HOME = os.path.expanduser('~')
cd = json.load(open(f'{HOME}/athan-research/artifact/chart-data.json'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'moonsighting-findings.html')

MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def frame(W, H, L, R, T, B, ymin, ymax, ticks, zero=None):
    pw, ph = W - L - R, H - T - B
    X = lambda i: L + i * pw / 365
    Y = lambda v: T + (ymax - v) * ph / (ymax - ymin)
    out = []
    for s in MONTH_STARTS:
        out.append(f'<line class="gm" x1="{X(s):.1f}" x2="{X(s):.1f}" y1="{T}" y2="{H-B}"/>')
    for m, s in zip(MONTHS, MONTH_STARTS):
        out.append(f'<text class="axl" x="{X(s+15):.1f}" y="{H-B+20}" text-anchor="middle">{m}</text>')
    for v in ticks:
        cls = 'g0' if v == zero else 'g'
        out.append(f'<line class="{cls}" x1="{L}" x2="{W-R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}"/>')
        label = f'+{v}' if (zero is not None and v > 0) else ('−' + str(-v) if v < 0 else str(v))
        out.append(f'<text class="axl" x="{L-8}" y="{Y(v)+4:.1f}" text-anchor="end">{label}</text>')
    return X, Y, out


def step(vals, X, Y):
    d = f'M{X(0):.1f},{Y(vals[0]):.1f}'
    prev = vals[0]
    for i in range(1, len(vals)):
        if vals[i] != prev:
            d += f'H{X(i):.1f}V{Y(vals[i]):.1f}'
            prev = vals[i]
    d += f'H{X(len(vals)):.1f}'
    return d


def chart_intervals():
    W, H, L, R, T, B = 720, 340, 46, 14, 14, 36
    X, Y, out = frame(W, H, L, R, T, B, 45, 130, [50, 60, 70, 80, 90, 100, 110, 120, 130])
    out.append(f'<path class="s-fajr" d="{step(cd["fajr_london"], X, Y)}"/>')
    out.append(f'<path class="s-book" d="{step(cd["isha_book"], X, Y)}"/>')
    out.append(f'<path class="s-london" d="{step(cd["isha_london"], X, Y)}"/>')
    for i in range(365):
        if cd['isha_book'][i] != cd['isha_london'][i]:
            out.append(f'<circle class="mk" cx="{X(i+0.5):.1f}" cy="{Y(cd["isha_london"][i]):.1f}" r="2.8"/>')
    out.append(f'<line class="lead" x1="{X(126):.1f}" y1="{Y(59):.1f}" x2="{X(140):.1f}" y2="{Y(53.5):.1f}"/>')
    out.append(f'<text class="ann" x="{X(142):.1f}" y="{Y(52):.1f}">1–12 May: the book dips to 60, London holds 74</text>')
    return (f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Daily Fajr and Isha intervals for London in 2026: '
            f'Fajr follows Miftahi Table 5 on every day; Isha follows Table 6 except on 20 edited days.">' + ''.join(out) + '</svg>')


def chart_deltas():
    W, H, L, R, T, B = 720, 270, 46, 14, 14, 36
    X, Y, out = frame(W, H, L, R, T, B, -9, 13, [-5, 0, 5, 10], zero=0)
    out.append(f'<path class="s-fajr thin" d="{step(cd["fajr_delta"], X, Y)}"/>')
    out.append(f'<path class="s-london thin" d="{step(cd["isha_delta"], X, Y)}"/>')
    return (f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="London API minus moonsighting.com method 0, daily in 2026: '
            f'Fajr from minus 7 to plus 6 minutes, Isha from minus 4 to plus 11 minutes.">' + ''.join(out) + '</svg>')


html = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artifact_template.html')).read()
html = html.replace('{{CHART_INTERVALS}}', chart_intervals()).replace('{{CHART_DELTAS}}', chart_deltas())
open(OUT, 'w').write(html)
print('wrote', OUT, len(html), 'bytes')

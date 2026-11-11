"""Centro Cultural Andalusí de Málaga, November 2026 poster, transcribed from the published image."""
import json, sys
from datetime import date
sys.path.insert(0, "$HOME/athan-gitree/census/o1k-wide/benelux2")
import solar
from analyze_pt import mins, dst_shift

ROWS = """
1 6:15 7:41 13:03 15:58 18:22 19:44
2 6:16 7:42 13:03 15:57 18:21 19:43
3 6:17 7:43 13:03 15:56 18:20 19:42
4 6:17 7:44 13:03 15:56 18:19 19:41
5 6:18 7:45 13:03 15:55 18:18 19:40
6 6:19 7:46 13:03 15:54 18:17 19:39
7 6:20 7:47 13:03 15:53 18:17 19:39
8 6:21 7:48 13:03 15:53 18:16 19:38
9 6:22 7:49 13:03 15:52 18:15 19:37
10 6:23 7:50 13:03 15:51 18:14 19:36
11 6:24 7:51 13:03 15:51 18:13 19:36
12 6:25 7:52 13:03 15:50 18:12 19:35
13 6:25 7:53 13:03 15:50 18:12 19:34
14 6:26 7:54 13:04 15:49 18:11 19:34
15 6:27 7:55 13:04 15:48 18:10 19:33
16 6:28 7:56 13:04 15:48 18:09 19:33
17 6:29 7:57 13:04 15:47 18:09 19:32
18 6:30 7:58 13:04 15:47 18:08 19:32
19 6:31 7:59 13:05 15:47 18:08 19:31
20 6:32 8:00 13:05 15:46 18:07 19:31
21 6:32 8:01 13:05 15:46 18:07 19:31
22 6:33 8:02 13:05 15:45 18:06 19:30
23 6:34 8:03 13:06 15:45 18:06 19:30
24 6:35 8:04 13:06 15:45 18:05 19:30
25 6:36 8:05 13:06 15:45 18:05 19:29
26 6:37 8:06 13:06 15:44 18:05 19:29
27 6:37 8:07 13:07 15:44 18:04 19:29
28 6:38 8:08 13:07 15:44 18:04 19:29
29 6:39 8:09 13:07 15:44 18:04 19:29
30 6:40 8:10 13:08 15:44 18:03 19:29
"""
LAT, LON = 36.7213, -4.4214   # C/ Ingeniero de la Torre Acosta, Málaga


def rows():
    out = {}
    for line in ROWS.strip().splitlines():
        p = line.split()
        out[f"2026-11-{int(p[0]):02d}"] = dict(zip(
            ("fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"), p[1:]))
    return out


def check():
    stats = {}
    for k, v in rows().items():
        d = date.fromisoformat(k)
        s = dst_shift(d) + 60
        noon = solar.transit_minutes(d, LON) + s
        sr = solar.sunrise_sunset(d, LAT, LON)[0] + s
        ss = solar.sunrise_sunset(d, LAT, LON)[1] + s
        cand = {"dhuhr": mins(v["dhuhr"]) - noon, "sunrise": mins(v["sunrise"]) - sr,
                "magrib": mins(v["magrib"]) - ss, "asr": mins(v["asr"]) - solar.asr(d, LAT, LON) - s,
                "isha_int": mins(v["isha"]) - mins(v["magrib"])}
        for a in (15.0, 16.0, 17.0, 18.0, 18.5, 19.0, 20.0):
            cand[f"fajr_{a}"] = mins(v["fajr"]) - solar.time_at_angle(d, LAT, LON, a, True) - s
            cand[f"isha_{a}"] = mins(v["isha"]) - solar.time_at_angle(d, LAT, LON, a, False) - s
        for n, x in cand.items():
            stats.setdefault(n, []).append(x)
    for n in sorted(stats):
        xs = sorted(stats[n])
        mean = sum(xs) / len(xs)
        sd = (sum((x - mean) ** 2 for x in xs) / len(xs)) ** 0.5
        print(f"   {n:10s} med={xs[len(xs)//2]:7.2f} mean={mean:7.2f} sd={sd:5.2f}")


if __name__ == "__main__":
    json.dump(rows(), open("data/es-malaga-2026-11.json", "w"), indent=1, sort_keys=True)
    print("wrote data/es-malaga-2026-11.json", len(rows()), "rows")
    check()

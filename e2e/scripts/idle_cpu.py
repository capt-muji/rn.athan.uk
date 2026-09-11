"""Per-thread CPU from /proc samples written by idle-cpu.sh.

Each stat_N.txt holds /proc/uptime followed by /proc/<pid>/task/*/stat. CPU% is
100 = one full core (the same scale as `top`'s per-process column).
"""

import glob
import os
import re
import statistics
import sys

HZ = 100.0  # Android USER_HZ


def load(path):
    lines = [line for line in open(path).read().splitlines() if line.strip()]
    uptime = float(lines[0].split()[0])
    threads = {}
    for line in lines[1:]:
        lp, rp = line.find("("), line.rfind(")")
        if lp < 0 or rp < 0:
            continue
        rest = line[rp + 2 :].split()  # rest[0] is stat field 3 (state)
        threads[int(line[:lp].strip())] = (line[lp + 1 : rp], int(rest[11]) + int(rest[12]))  # utime + stime
    return uptime, threads


def main(d):
    files = sorted(glob.glob(os.path.join(d, "stat_*.txt")), key=lambda p: int(re.search(r"stat_(\d+)", p).group(1)))
    samples = [load(f) for f in files]
    if len(samples) < 2:
        sys.exit(f"only {len(samples)} samples in {d}")
    per_interval = []
    for (u0, t0), (u1, t1) in zip(samples, samples[1:]):
        ticks = sum(t1[k][1] - t0[k][1] for k in t1 if k in t0)
        per_interval.append(100.0 * ticks / HZ / (u1 - u0))
    (u0, t0), (u1, t1) = samples[0], samples[-1]
    window = u1 - u0
    by_comm = {}
    for k, (comm, ticks) in t1.items():
        if k in t0:
            by_comm[comm] = by_comm.get(comm, 0) + ticks - t0[k][1]
    print(f"idle CPU over {window:.1f}s: median {statistics.median(per_interval):.1f}% "
          f"(intervals: {', '.join(f'{x:.1f}' for x in per_interval)})")
    for comm, ticks in sorted(by_comm.items(), key=lambda kv: -kv[1])[:6]:
        print(f"  {comm:22s} {100.0 * ticks / HZ / window:6.1f}%")


if __name__ == "__main__":
    main(sys.argv[1])

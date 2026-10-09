"""Per-thread CPU from /proc samples written by idle-cpu.sh.

Each stat_N.txt holds /proc/uptime followed by /proc/<pid>/task/*/stat for every
process of the package. CPU% is 100 = one full core (the same scale as `top`'s
per-process column).

Two rules this file exists to keep:

A sample with no thread lines is a FAILURE, never 0.0%. Summing an empty
generator yields zero, and zero is the most believable number this tool can
print: a bad pid, a revoked adb session or a process that exited between the
pidof and the sample all produce it, and every one of them reads as a
beautifully idle app. Nothing downstream can tell that reading from a real one,
so it must not be produced.

A thread absent from the earlier sample was CREATED during the interval, so all
of its CPU belongs to that interval. Counting only the threads present in both
samples drops exactly the short-lived render, animation and Choreographer
threads an idle-CPU hunt is looking for. Threads that vanish are unrecoverable
— their last counter died with them — so they are counted and reported, and the
figure is honest about being a lower bound.
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


def interval_ticks(t0, threads):
    """Ticks burned between two samples, counting threads born in between.

    A tid missing from t0 did not exist then, so its whole counter accrued
    inside the interval. A counter that went backwards means the tid was
    recycled onto a new thread, which is the same case.
    """
    total = 0
    for tid, (_, end) in threads.items():
        start = t0[tid][1] if tid in t0 else 0
        total += end - start if end >= start else end
    return total


def main(d):
    files = sorted(glob.glob(os.path.join(d, "stat_*.txt")), key=lambda p: int(re.search(r"stat_(\d+)", p).group(1)))
    samples = [load(f) for f in files]
    if len(samples) < 2:
        sys.exit(f"only {len(samples)} samples in {d}")

    # Refuse to report on samples that hold no threads. Reaching the arithmetic
    # below with these would print 0.0% and exit 0.
    blank = [os.path.basename(f) for f, (_, threads) in zip(files, samples) if not threads]
    if blank:
        sys.exit(
            f"MEASUREMENT FAILED: no thread lines in {', '.join(blank)} of {len(files)} samples in {d}\n"
            "  /proc yielded nothing for the pids sampled — a pid that names no process, a process\n"
            "  that exited, or an adb read that failed. Nothing was measured; there is no idle figure."
        )

    per_interval = []
    died = set()
    for (u0, t0), (u1, t1) in zip(samples, samples[1:]):
        per_interval.append(100.0 * interval_ticks(t0, t1) / HZ / (u1 - u0))
        died.update(tid for tid in t0 if tid not in t1)

    (u0, t0), (u1, t1) = samples[0], samples[-1]
    window = u1 - u0
    by_comm = {}
    for k, (comm, ticks) in t1.items():
        start = t0[k][1] if k in t0 else 0
        by_comm[comm] = by_comm.get(comm, 0) + (ticks - start if ticks >= start else ticks)
    print(f"idle CPU over {window:.1f}s: median {statistics.median(per_interval):.1f}% "
          f"(intervals: {', '.join(f'{x:.1f}' for x in per_interval)})")
    for comm, ticks in sorted(by_comm.items(), key=lambda kv: -kv[1])[:6]:
        print(f"  {comm:22s} {100.0 * ticks / HZ / window:6.1f}%")
    if died:
        print(f"  NOTE: {len(died)} thread(s) exited mid-window; their final CPU died with them, "
              "so the figure above is a lower bound")


if __name__ == "__main__":
    main(sys.argv[1])

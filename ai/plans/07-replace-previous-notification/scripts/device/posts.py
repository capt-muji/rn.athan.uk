#!/usr/bin/env python3
"""Counts what Android's NotificationService did with the app's posts, from a saved logcat.

Usage: posts.py <logcat-file>
Prints "POSTS <n>" (enqueue lines for the package), "MUTED <n>" ("Muting recently noisy" lines
for the package) and "REFUSED <n>" (the cap line from finding 73), then each matching line.

A post enqueued by the system reads, verbatim from the 3T (Android 9):
  enqueueNotificationInternal: pkg=com.mugtaba.athan id=0 ...
A muted second post reads: ... Muting recently noisy com.mugtaba.athan/10186 by 1000ms
"""

import re
import sys

PKG = "com.mugtaba.athan"


def main():
    if len(sys.argv) != 2:
        print("usage: posts.py <logcat-file>", file=sys.stderr)
        return 2
    with open(sys.argv[1], encoding="utf-8", errors="replace") as source:
        lines = source.read().splitlines()

    matching = [line for line in lines if "NotificationService" in line and PKG in line]
    posts = [line for line in matching if "enqueueNotificationInternal" in line]
    muted = [line for line in matching if "Muting recently noisy" in line]
    refused = [line for line in matching if "Not showing more" in line]

    print(f"POSTS {len(posts)}")
    print(f"MUTED {len(muted)}")
    print(f"REFUSED {len(refused)}")
    for line in matching:
        print(line[:220])
    return 0


if __name__ == "__main__":
    sys.exit(main())

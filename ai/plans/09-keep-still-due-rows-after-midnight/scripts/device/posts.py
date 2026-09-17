#!/usr/bin/env python3
"""Counts what Android's NotificationService did with the app's posts, from a saved logcat
holding both the system and the events buffers (`logcat -d -b system,events`).

Usage: posts.py <logcat-file> <window-start> <window-end>
Both window bounds are device-clock stamps in logcat's own fixed-width "MM-DD HH:MM:SS"
form, compared as plain strings, inclusively. The window is required: the events buffer
survives `logcat -c` and holds entries from every clock epoch the proof drove, and a
real-epoch stamp (09-17) sorts above a mock-epoch window (09-13), so only a two-sided
window keeps older epochs out of the count.
Exits 2 on a wrong argument count or a window bound that is not an MM-DD HH:MM:SS stamp;
0 otherwise.

Prints "POSTS <n>" (notification_enqueue events for the package inside the window),
"MUTED <n>" ("Muting recently noisy" system lines inside the window; this device drops
those DEBUG lines from its buffers, so the number records 0 and proves nothing), and
"REFUSED <n>" (the cap line from finding 73), then each matching line.

A post enqueued by the system reads, verbatim from the 3T (Android 9):
  09-12 16:42:30.095  1391  1391 I notification_enqueue: [10186,21055,com.mugtaba.athan,0,athan-notification,0,Notification(channel=expo_notifications_fallback_notification_channel ...
"""

import re
import sys

PKG = "com.mugtaba.athan"
STAMP = re.compile(r"\d{2}-\d{2} \d{2}:\d{2}:\d{2}")


def main():
    if len(sys.argv) != 4:
        print("usage: posts.py <logcat-file> <window-start> <window-end>", file=sys.stderr)
        return 2
    path, start, end = sys.argv[1], sys.argv[2], sys.argv[3]
    if not (STAMP.fullmatch(start) and STAMP.fullmatch(end)):
        print("window bounds must be logcat stamps: MM-DD HH:MM:SS", file=sys.stderr)
        return 2
    with open(path, encoding="utf-8", errors="replace") as source:
        lines = source.read().splitlines()

    def in_window(line):
        stamp = STAMP.match(line)
        return stamp is not None and start <= stamp.group(0) <= end

    posts = [ln for ln in lines if in_window(ln) and PKG in ln and "notification_enqueue" in ln]
    muted = [ln for ln in lines if in_window(ln) and PKG in ln and "Muting recently noisy" in ln]
    refused = [ln for ln in lines if in_window(ln) and PKG in ln and "Not showing more" in ln]

    print(f"POSTS {len(posts)}")
    print(f"MUTED {len(muted)}")
    print(f"REFUSED {len(refused)}")
    for line in posts + muted + refused:
        print(line[:220])
    return 0


if __name__ == "__main__":
    sys.exit(main())

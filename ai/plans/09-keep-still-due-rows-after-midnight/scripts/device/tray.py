#!/usr/bin/env python3
"""Reads what the notification tray holds for the app, from `dumpsys notification`.

Usage: tray.py <save-path>
Prints one line "TRAY <n>" followed by one line per showing notification,
"NOTIFY tag=<tag> channel=<channel>", and exits 0. Only the "Notification List:"
section counts: mArchive below it holds notifications already dismissed or replaced,
and the archive names every notification the app ever posted.

The record line this parses, verbatim from the 3T (Android 9):
  NotificationRecord(0x0359e969: pkg=com.mugtaba.athan user=UserHandle{0} id=0 tag=athan_standard_magrib_2026-09-17 importance=4 key=0|com.mugtaba.athan|0|athan_standard_magrib_2026-09-17|10186appImportanceLocked=false: Notification(channel=expo_notifications_fallback_notification_channel pri=2 ...
"""

import re
import subprocess
import sys

SERIAL = "8f7ada76"
PKG = "com.mugtaba.athan"

record = re.compile(
    r"NotificationRecord\(0x[0-9a-f]+: pkg=" + re.escape(PKG) + r".*? tag=([^ ]*) .*?Notification\(channel=([^ ]*)"
)


def main():
    if len(sys.argv) != 2:
        print("usage: tray.py <save-path>", file=sys.stderr)
        return 2
    dump = subprocess.run(
        ["adb", "-s", SERIAL, "shell", "dumpsys", "notification"],
        capture_output=True,
        text=True,
        timeout=60,
    ).stdout
    with open(sys.argv[1], "w") as save:
        save.write(dump)

    section = dump.split("Notification List:", 1)
    showing = record.findall(section[1].split("mArchive=", 1)[0]) if len(section) == 2 else []

    print(f"TRAY {len(showing)}")
    for tag, channel in showing:
        print(f"NOTIFY tag={tag} channel={channel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

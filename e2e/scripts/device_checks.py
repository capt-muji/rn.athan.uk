"""Parse `dumpsys alarm` for one package and report what it has armed.

Called by device-checks.sh. Android 9 and newer print each alarm as a block
anchored by a line containing `Alarm{<hash> type <n> when <epoch> <package>}`,
followed by indented `tag=`, `when=<YYYY-MM-DD HH:MM:SS.mmm>` and, for alarm
clocks, a `triggerTime=` line. The package name only appears on the anchor line,
so membership is decided there and the fields are read from the lines that
follow, up to the next anchor.

Usage: device_checks.py <alarm-dump> <package> <device-now> [expected-times.json]

<device-now> is "YYYY-MM-DD HH:MM:SS" read from the device itself — never the
Mac's clock, which can differ.

expected-times.json is a JSON list of "YYYY-MM-DD HH:MM" strings. When given,
every future alarm must match one to the minute, and every expected time that
falls inside the armed window must be covered by an alarm.

Exit status: 0 when everything checks out, 1 on any failure.
"""

import json
import re
import sys
from datetime import datetime

ANCHOR = re.compile(r"Alarm\{[^}]*\}")
WHEN = re.compile(r"when=(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})")
TRIGGER = re.compile(r"triggerTime=(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})")
TAG = re.compile(r"tag=(\S+)")


def parse_alarms(lines, package):
    """Every alarm block belonging to the package, in file order."""
    alarms = []
    current = None
    for line in lines:
        anchor = ANCHOR.search(line)
        if anchor:
            # A new block starts: keep the previous one if it was ours
            if current is not None:
                alarms.append(current)
            current = {"tag": None, "when": None, "trigger": None} if package in anchor.group(0) else None
            continue
        if current is None:
            continue
        if (found := TAG.search(line)) and current["tag"] is None:
            current["tag"] = found.group(1)
        if (found := WHEN.search(line)) and current["when"] is None:
            current["when"] = found.group(1)
        if (found := TRIGGER.search(line)) and current["trigger"] is None:
            current["trigger"] = found.group(1)
    if current is not None:
        alarms.append(current)
    return alarms


def fires_at(alarm):
    """The moment an alarm goes off: triggerTime when present, else when."""
    stamp = alarm["trigger"] or alarm["when"]
    return datetime.strptime(stamp, "%Y-%m-%d %H:%M:%S") if stamp else None


def main():
    if len(sys.argv) < 4:
        print("  FAIL  device_checks.py needs <alarm-dump> <package> <device-now> [expected.json]")
        return 1

    dump_path, package, now_text = sys.argv[1], sys.argv[2], sys.argv[3]
    expected_path = sys.argv[4] if len(sys.argv) > 4 else None
    now = datetime.strptime(now_text, "%Y-%m-%d %H:%M:%S")

    alarms = parse_alarms(open(dump_path, errors="ignore").read().splitlines(), package)
    dated = [(fires_at(a), a) for a in alarms if fires_at(a) is not None]
    future = sorted((m, a) for m, a in dated if m > now)
    past = [(m, a) for m, a in dated if m <= now]

    failed = False
    if not alarms:
        print(f"  FAIL  no alarms armed for {package} — nothing will fire")
        print("        open the app once; notifications are scheduled ~1.5s after first content")
        return 1

    if not future:
        print(f"  FAIL  {len(alarms)} alarm(s) armed but none in the future — the app has stopped rescheduling")
        failed = True
    else:
        print(f"  PASS  {len(future)} future alarm(s) armed ({len(past)} already fired)")

    for moment, alarm in future[:12]:
        delta = moment - now
        hours, seconds = divmod(int(delta.total_seconds()), 3600)
        tag = (alarm["tag"] or "").split(":")[-1]
        print(f"        {moment:%Y-%m-%d %H:%M}  in {hours}h {seconds // 60:02d}m   {tag}")
    if len(future) > 12:
        print(f"        … and {len(future) - 12} more")

    if expected_path:
        expected = {datetime.strptime(t, "%Y-%m-%d %H:%M") for t in json.load(open(expected_path))}
        armed = {m.replace(second=0) for m, _ in future}
        if not armed:
            # Never PASS an empty set: "0 checked" reads as reassurance while
            # nothing was verified at all
            print("  ..    no future alarms to compare against the expected times")
        else:
            stray = sorted(armed - expected)
            if stray:
                failed = True
                print(f"  FAIL  {len(stray)} alarm(s) do not match any expected prayer time:")
                for moment in stray[:8]:
                    print(f"        {moment:%Y-%m-%d %H:%M}")
            else:
                print(f"  PASS  every future alarm matches an expected prayer time ({len(armed)} checked)")

        # Only judge expected times inside the window the app has actually armed
        window = sorted(armed)
        if window:
            missing = sorted(t for t in expected if window[0] <= t <= window[-1] and t not in armed)
            if missing:
                failed = True
                print(f"  FAIL  {len(missing)} expected time(s) inside the armed window have no alarm:")
                for moment in missing[:8]:
                    print(f"        {moment:%Y-%m-%d %H:%M}")
            else:
                print("  PASS  no gaps inside the armed window")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

"""Parse `dumpsys alarm` for one package and report what it has armed.

Called by device-checks.sh. Android 9 and newer print each alarm as a block
anchored by a line containing `Alarm{<hash> type <n> when <epoch> <package>}`,
followed by indented `tag=`, `when=<YYYY-MM-DD HH:MM:SS.mmm>` and, for alarm
clocks, a `triggerTime=` line. The package name only appears on the anchor line,
so membership is decided there and the fields are read from the lines that
follow, up to the next anchor. An anchor counts only when it carries a queue
position (`RTC_WAKEUP #0: Alarm{...}`), which is what makes it a batch entry;
the dump also restates alarms in summary lines such as `Next wake from idle:`,
and those are the same physical alarm seen twice.

Usage: device_checks.py <alarm-dump> <package> <device-now> [expected-times.json]

<device-now> is "YYYY-MM-DD HH:MM:SS" read from the device itself — never the
Mac's clock, which can differ.

expected-times.json is a JSON list of "YYYY-MM-DD HH:MM" strings. When given,
every future NOTIFICATION alarm must match one to the minute.

Two things this deliberately does not do, both learned from running it against a
real device:

- It judges only the app's own notification alarms (tagged
  expo.modules.notifications.NOTIFICATION_EVENT). Android arms others against
  the package — ACTION_FORCE_STOP_RESCHEDULE, ten years out — and treating those
  as prayer times reported a failure that was not one.
- It does not check that every expected time HAS an alarm. Which prayers are
  armed is a user preference: with only Fajr enabled, every other prayer time is
  legitimately absent, and demanding one alarm per timetable entry produced
  eleven false failures. A check that cries wolf is worse than no check.

Exit status: 0 when everything checks out, 1 on any failure.
"""

import json
import re
import sys
from datetime import datetime

ANCHOR = re.compile(r"Alarm\{[^}]*\}")
# Only a batch entry is a real armed alarm. Those carry the queue position,
# `RTC_WAKEUP #0: Alarm{...}`, while summary lines such as
# `Next wake from idle: Alarm{...}` restate an alarm that is already in a batch,
# or has already fired, and counting one is double counting.
ENTRY = re.compile(r"#\d+: Alarm\{")
# The package is the last field of the anchor: Alarm{<hash> type <n> when <epoch> <package>}.
# Reading it out and comparing it whole is what keeps a side-by-side install
# (com.mugtaba.athan.fleettest) from counting as the store app's alarms.
OWNER = re.compile(r"Alarm\{\S+ type \d+ when -?\d+ (\S+)\}")
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
            owner = OWNER.search(line)
            ours = ENTRY.search(line) and owner and owner.group(1) == package
            current = {"tag": None, "when": None, "trigger": None} if ours else None
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
    # Sort on the moment alone. Two alarms can share a minute — a reminder for one
    # prayer and the at-time alert for another — and falling through to compare the
    # alarm dicts raises TypeError.
    future = sorted(((m, a) for m, a in dated if m > now), key=lambda pair: pair[0])
    past = [(m, a) for m, a in dated if m <= now]

    failed = False
    if not alarms:
        print(f"  FAIL  no alarms armed for {package} — nothing will fire")
        print("        open the app once; notifications are scheduled ~1.5s after first content")
        return 1

    # Only the app's own notification alarms are prayer alerts; Android arms
    # others against the package (e.g. ACTION_FORCE_STOP_RESCHEDULE)
    is_alert = lambda alarm: "expo.modules.notifications" in (alarm["tag"] or "")
    alerts = [(m, a) for m, a in future if is_alert(a)]
    others = [(m, a) for m, a in future if not is_alert(a)]

    def describe(moment, alarm):
        hours, seconds = divmod(int((moment - now).total_seconds()), 3600)
        tag = (alarm["tag"] or "").split(":")[-1]
        return f"        {moment:%Y-%m-%d %H:%M}  in {hours}h {seconds // 60:02d}m   {tag}"

    if not alerts:
        print(f"  FAIL  no future prayer alerts armed ({len(past)} already fired) — nothing will fire")
        print("        if alerts are switched on, the app has stopped rescheduling")
        failed = True
    else:
        print(f"  PASS  {len(alerts)} future prayer alert(s) armed ({len(past)} already fired)")

    for moment, alarm in alerts[:12]:
        print(describe(moment, alarm))
    if len(alerts) > 12:
        print(f"        … and {len(alerts) - 12} more")

    for moment, alarm in others[:4]:
        print(describe(moment, alarm).replace("        ", "  ..    ", 1))

    if expected_path:
        expected = {datetime.strptime(t, "%Y-%m-%d %H:%M") for t in json.load(open(expected_path))}
        armed = {m.replace(second=0) for m, _ in alerts}
        if not armed:
            # Never PASS an empty set: "0 checked" reads as reassurance while
            # nothing was verified at all
            print("  ..    no future prayer alerts to compare against the expected times")
        else:
            stray = sorted(armed - expected)
            if stray:
                failed = True
                print(f"  FAIL  {len(stray)} alert(s) do not fire at a prayer time:")
                for moment in stray[:8]:
                    print(f"        {moment:%Y-%m-%d %H:%M}")
            else:
                print(f"  PASS  every armed alert fires at a prayer time ({len(armed)} checked)")

        # Deliberately no "missing times" check: which prayers are armed is a
        # user preference the timetable cannot express. See the module docstring.
        print(f"  ..    {len(expected)} expected time(s) supplied; only armed alerts are judged")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

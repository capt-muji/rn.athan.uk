#!/usr/bin/env python3
"""Session 6 on the 3T: what Isha's alarms should be, checked against two `dumpsys alarm` readings

  isha_alarms.py <before dump> <after dump> <on|off> <reminder minutes>

The times come from the provider's saved 2026 London payload (~/athan-device-sweep/api/2026.json), read with Python's
zoneinfo, not by the app. "now" is the RTC time the after dump prints (`nowRTC=`). The app's alarms are the
`Alarm{... when <epoch ms> com.mugtaba.athan}` entries whose next line carries
`expo.modules.notifications.NOTIFICATION_EVENT`.

Expected after "on": the before alarms still to come, plus Isha today and tomorrow where still to come, plus each
reminder the given minutes earlier where it is at least 30 seconds away (REMINDER_BUFFER_SECONDS). Expected after
"off": the before alarms still to come, with none of those Isha instants.
Prints "ISHA ALARMS AS EXPECTED" and exit 0; "ISHA ALARMS NOT AS EXPECTED" with missing and extra instants and exit 1;
or "ISHA TOO CLOSE" and exit 2 when an Isha alarm or reminder is due within 30 minutes of now.
"""
import datetime
import json
import re
import sys
import zoneinfo
from pathlib import Path

LONDON = zoneinfo.ZoneInfo('Europe/London')
PAYLOAD = Path.home() / 'athan-device-sweep/api/2026.json'
BUFFER_SECONDS = 30
# Closer than this, an alarm could fire or change between the commit and the dump
TOO_CLOSE_MS = 30 * 60_000


def app_alarms(dump):
    lines = dump.splitlines()
    found = set()
    for index, line in enumerate(lines):
        match = re.search(r'Alarm\{\S+ type \d+ when (\d+) com\.mugtaba\.athan\}', line)
        if match and index + 1 < len(lines) and 'expo.modules.notifications.NOTIFICATION_EVENT' in lines[index + 1]:
            found.add(int(match.group(1)))
    return found


def now_ms(dump):
    match = re.search(r'nowRTC=(\d+)', dump)
    if not match:
        sys.exit('ISHA ALARMS FAILED: the after dump has no nowRTC')
    return int(match.group(1))


def isha_instants(now, minutes):
    times = json.loads(PAYLOAD.read_text())['times']
    today = datetime.datetime.fromtimestamp(now / 1000, LONDON).date()
    at_time, reminders = set(), set()
    for offset in (0, 1):
        day = today + datetime.timedelta(days=offset)
        hours, mins = map(int, times[day.isoformat()]['isha'].split(':'))
        moment = datetime.datetime(day.year, day.month, day.day, hours, mins, tzinfo=LONDON)
        epoch = int(moment.timestamp() * 1000)
        if epoch > now:
            at_time.add(epoch)
        reminder = epoch - minutes * 60_000
        if reminder - now >= BUFFER_SECONDS * 1000:
            reminders.add(reminder)
    return at_time, reminders


def main():
    if len(sys.argv) != 5 or sys.argv[3] not in ('on', 'off'):
        sys.exit('usage: isha_alarms.py <before dump> <after dump> <on|off> <reminder minutes>')
    before_dump = Path(sys.argv[1]).read_text()
    after_dump = Path(sys.argv[2]).read_text()
    state, minutes = sys.argv[3], int(sys.argv[4])
    now = now_ms(after_dump)
    at_time, reminders = isha_instants(now, minutes)
    close = [epoch for epoch in at_time | reminders if epoch - now < TOO_CLOSE_MS]
    if close:
        # Five minutes after the last alarm that is too close, so it has fired and left the dump
        wait_until = max(close) // 1000 + 300
        stamp = datetime.datetime.fromtimestamp(wait_until, LONDON).strftime('%H:%M:%S')
        print(f'ISHA TOO CLOSE: wait until {wait_until} ({stamp} London) with: until [ "$(date +%s)" -gt {wait_until} ]; do sleep 15; done')
        sys.exit(2)
    kept = {epoch for epoch in app_alarms(before_dump) if epoch > now} - at_time - reminders
    expected = kept | at_time | reminders if state == 'on' else kept
    actual = app_alarms(after_dump)
    london = lambda epoch: datetime.datetime.fromtimestamp(epoch / 1000, LONDON).strftime('%Y-%m-%d %H:%M:%S')
    print(f'now {london(now)}; isha at-time {sorted(map(london, at_time))}; reminders {sorted(map(london, reminders))}')
    missing, extra = sorted(expected - actual), sorted(actual - expected)
    if not missing and not extra:
        print(f'ISHA ALARMS AS EXPECTED ({state}): {len(actual)} app alarms')
        return
    print(f'ISHA ALARMS NOT AS EXPECTED ({state}): missing {[london(e) for e in missing]} extra {[london(e) for e in extra]}')
    sys.exit(1)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Session 6, finding 80 on the 3T: a timed cold launch of a forced-throw Ramadan mock build

The forced-throw mocks file (scripts/mocks/force-sync-throw.ts.txt) answers a download normally in the first half of a
minute and, in the second half, deletes today to day 2 and throws. So:
  launch80.py seed <label>    starts the launch while the device clock reads second 0 to 10: the download stores days
  launch80.py throw <label>   starts the launch while the device clock reads second 30 to 38: the launch draws the
                              stored lists first, then sync fails
Each launch is HOME, am kill, then the launcher activity (never force-stop), then 25 seconds of settling in steps of
15 seconds or less, then a screenshot and the React Native log lines, saved as
~/athan-device-sweep/session6/80-<label>.png and 80-<label>.logcat.txt. It prints one summary line starting "LAUNCH80".
"""
import re
import subprocess
import sys
import time
from pathlib import Path

SERIAL = '8f7ada76'
PKG = 'com.mugtaba.athan'
OUT = Path.home() / 'athan-device-sweep/session6'
WINDOWS = {'seed': (0, 10), 'throw': (30, 38)}


def adb(*args, timeout=25, binary=False):
    try:
        result = subprocess.run(['adb', '-s', SERIAL, *args], capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        sys.exit(f'LAUNCH80 FAILED: adb {" ".join(args)} timed out after {timeout}s')
    if result.returncode != 0:
        sys.exit(f'LAUNCH80 FAILED: adb {" ".join(args)} exited {result.returncode}: {result.stderr[:200]!r}')
    return result.stdout if binary else result.stdout.decode(errors='replace')


def device_second():
    return int(adb('shell', 'date +%S', timeout=10).strip())


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in WINDOWS:
        sys.exit('usage: launch80.py seed|throw <label>')
    kind, label = sys.argv[1], sys.argv[2]
    low, high = WINDOWS[kind]
    OUT.mkdir(parents=True, exist_ok=True)

    adb('logcat', '-c', timeout=15)
    adb('shell', 'input keyevent 3', timeout=10)
    # Waits for the window in steps of one second, checking the device clock every time
    for _ in range(120):
        if low <= device_second() <= high:
            break
        time.sleep(1)
    else:
        sys.exit(f'LAUNCH80 FAILED: the device clock never reached second {low} to {high}')

    adb('shell', f'am kill {PKG}', timeout=10)
    started = adb('shell', 'date "+%H:%M:%S"', timeout=10).strip()
    adb('shell', f'am start -n {PKG}/.MainActivity', timeout=15)
    for _ in range(5):
        time.sleep(5)

    png = OUT / f'80-{label}.png'
    data = adb('exec-out', 'screencap -p', timeout=25, binary=True)
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        sys.exit('LAUNCH80 FAILED: the screenshot is not a PNG')
    png.write_bytes(data)

    log = adb('logcat', '-d', '-v', 'time', 'ReactNativeJS:V', 'ReactNative:W', 'AndroidRuntime:E', '*:S', timeout=30)
    (OUT / f'80-{label}.logcat.txt').write_text(log)
    throws = len(re.findall(r'SESSION6 FORCED SYNC THROW', log))
    crashes = len(re.findall(r'FATAL EXCEPTION', log))
    print(f'LAUNCH80 {kind} {label} started {started} forced-throw-lines {throws} fatal {crashes} screenshot {png}')


if __name__ == '__main__':
    main()

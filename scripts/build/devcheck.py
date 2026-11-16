#!/usr/bin/env python3
"""Session 5 mock-build check on the 3T: launches, reopens and clock moves, each read back from the screen

Every adb call has a hard timeout, since long adb runs have hung the 3T. The app is never force-stopped: a cold launch
is HOME, then `am kill`, then the launcher activity. Screenshots go to the given path for the checker's own eyes only.

Usage: devcheck.py <step> [args]
  state                       version, automatic time, device clock, the app's armed alarms
  install <apk>               adb install -r, then state
  cold <label>                HOME, am kill, launch, settle, read the screen
  resume <label>              bring the app forward (return from the background), settle, read the screen
  read <label>                read the screen as it is
  key <home|back>             press a key
  tap <x> <y>                 tap
  wait <seconds>              sleep
  clock <YYYY-MM-DD HH:MM:SS> automatic time off, clock set to that London wall time
  auto                        automatic time back on
  shot <path.png>             screenshot
  logs <label>                save React Native and crash lines from logcat, then clear it
"""
import datetime
import re
import subprocess
import sys
import time
import zoneinfo
from pathlib import Path

SERIAL = '3T_SERIAL'
PKG = '${ATHAN_BUNDLE_ID}'
OUT = Path.home() / 'athan-gitree/sessions/mockcheck'
LONDON = zoneinfo.ZoneInfo('Europe/London')


def log(message):
    print(f"{time.strftime('%H:%M:%S')} {message}", flush=True)


def adb(*args, timeout=25, binary=False):
    """Runs one adb command; returns its output, or None when it failed or hung"""
    try:
        result = subprocess.run(['adb', '-s', SERIAL, *args], capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        log(f"TIMEOUT after {timeout}s: adb {' '.join(args)}")
        return None
    if result.returncode != 0:
        log(f"FAILED ({result.returncode}): adb {' '.join(args)}: {result.stderr[:300]!r}")
        return None
    return result.stdout if binary else result.stdout.decode(errors='replace')


def device_now():
    out = adb('shell', 'date "+%F %T %Z"', timeout=10)
    return out.strip() if out else '?'


def state():
    package = adb('shell', f'dumpsys package {PKG}', timeout=20) or ''
    version = re.findall(r'versionName=(\S+)', package)
    updated = re.findall(r'lastUpdateTime=([^\n]+)', package)
    auto = (adb('shell', 'settings get global auto_time', timeout=10) or '?').strip()
    alarms = adb('shell', 'dumpsys alarm', timeout=30) or ''
    armed = len(re.findall(rf'\*walarm\*:[^\n]*|{re.escape(PKG)}', alarms))
    log(f"state: version {version} updated {updated} auto_time {auto} device {device_now()} alarm-dump lines naming the app {armed}")


def read(label):
    """uiautomator dump, saved, with its texts, descriptions and image count printed"""
    # A failed dump can still exit 0 and leave an earlier dump's file behind, so that file goes first and the command
    # must report that it dumped
    adb('shell', 'rm -f /sdcard/athan-ui.xml', timeout=10)
    result = adb('shell', 'uiautomator dump /sdcard/athan-ui.xml', timeout=40)
    if not result or 'dumped' not in result:
        log(f"{label}: DUMP FAILED at device {device_now()}: {result!r}")
        return
    xml = adb('shell', 'cat /sdcard/athan-ui.xml', timeout=15) or ''
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{label}.xml').write_text(xml)
    texts = [t for t in re.findall(r' text="([^"]*)"', xml) if t]
    descs = [d for d in re.findall(r'content-desc="([^"]*)"', xml) if d]
    images = len(re.findall(r'class="android.widget.ImageView"', xml))
    summary = f"{label}: device {device_now()} | images {images} | texts {texts} | descs {descs}"
    (OUT / f'{label}.txt').write_text(summary + '\n')
    log(summary)


def cold(label, settle=15):
    adb('shell', 'input keyevent 3', timeout=10)
    time.sleep(1.5)
    adb('shell', f'am kill {PKG}', timeout=10)
    time.sleep(1.5)
    log(f"launching cold at device {device_now()}")
    adb('shell', f'am start -n {PKG}/.MainActivity', timeout=15)
    time.sleep(settle)
    read(label)


def resume(label, settle=6):
    log(f"resuming at device {device_now()}")
    adb('shell', f'am start -n {PKG}/.MainActivity', timeout=15)
    time.sleep(settle)
    read(label)


def london_ms(wall):
    moment = datetime.datetime.strptime(wall, '%Y-%m-%d %H:%M:%S').replace(tzinfo=LONDON)
    return int(moment.timestamp() * 1000)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    step, args = sys.argv[1], sys.argv[2:]
    if step == 'state':
        state()
    elif step == 'install':
        log(f"install -r {args[0]}")
        out = adb('install', '-r', args[0], timeout=240)
        log(f"install output: {out.strip() if out else None}")
        state()
    elif step == 'cold':
        cold(args[0])
    elif step == 'resume':
        resume(args[0])
    elif step == 'read':
        read(args[0])
    elif step == 'key':
        adb('shell', f"input keyevent {3 if args[0] == 'home' else 4}", timeout=10)
        log(f"pressed {args[0]}")
    elif step == 'tap':
        adb('shell', f'input tap {args[0]} {args[1]}', timeout=10)
        log(f"tapped {args[0]},{args[1]}")
    elif step == 'wait':
        time.sleep(float(args[0]))
        log(f"waited {args[0]}s, device {device_now()}")
    elif step == 'clock':
        wall = ' '.join(args)
        adb('shell', 'settings put global auto_time 0', timeout=10)
        adb('shell', f'service call alarm 2 i64 {london_ms(wall)}', timeout=10)
        log(f"clock set to {wall}, device reads {device_now()}")
    elif step == 'auto':
        adb('shell', 'settings put global auto_time 1', timeout=10)
        time.sleep(8)
        log(f"auto_time {(adb('shell', 'settings get global auto_time', timeout=10) or '?').strip()}, device {device_now()}")
    elif step == 'shot':
        data = adb('exec-out', 'screencap -p', timeout=25, binary=True)
        if data and data[:8] == b'\x89PNG\r\n\x1a\n':
            Path(args[0]).write_bytes(data)
            log(f"shot {args[0]} ({len(data)} bytes)")
        else:
            log('SHOT FAILED')
    elif step == 'logs':
        out = adb('logcat', '-d', '-v', 'time', 'ReactNativeJS:V', 'ReactNative:W', 'AndroidRuntime:E', '*:F', '*:S',
                  timeout=30) or ''
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / f'{args[0]}.logcat.txt').write_text(out)
        errors = [line for line in out.splitlines() if re.search(r'\bE/|FATAL|Error|Exception', line)]
        log(f"logs {args[0]}: {len(out.splitlines())} lines, {len(errors)} error-like: {errors[:8]}")
        adb('logcat', '-c', timeout=15)
    else:
        sys.exit(f'unknown step {step}')


if __name__ == '__main__':
    main()

"""Variant B only: applies the harness's threadIdentifier to the notification content.

expo-notifications 57.0.18 parses a threadIdentifier field off the JS content
into its NotificationContentRecord but never copies it onto
UNMutableNotificationContent (NotificationRecords.swift,
toUNMutableNotificationContent). These two lines are the entire gap. The edit
targets the Pods copy inside the study worktree, never node_modules.
"""
import sys

path = sys.argv[1]
with open(path) as handle:
    src = handle.read()

old = (
    "    if let interruptionLevel = interruptionLevel {\n"
    "      content.interruptionLevel = interruptionLevel.toUNNotificationInterruptionLevel()\n"
    "    }\n"
)
new = (
    "    if let threadIdentifier = threadIdentifier {\n"
    "      content.threadIdentifier = threadIdentifier\n"
    "    }\n"
    "\n" + old
)

count = src.count(old)
if count != 1:
    sys.exit(f"POD SPLICE FAILED: anchor count {count}")

with open(path, "w") as handle:
    handle.write(src.replace(old, new))
print("POD SPLICE OK")

"""Replaces the real notification initialization with the study harness.

Worktree-only: the file it edits is never committed. Three effects, each
anchored so a drifted app/index.tsx stops the build:
1. drop the useNotification import and its call (its permission request would
   show the system dialog the study must never trigger);
2. replace initializeListeners with the harness (initializeListeners would run
   initializeNotifications on every resume, the same dialog again);
3. drop the delayed initializeNotifications call (same reason).

The app keeps everything else: sync, the splash gate, the update check. They
are harmless in a throwaway install and keep the launch close to the real one.
"""
import sys

path = sys.argv[1]
with open(path) as handle:
    src = handle.read()


def sub(old: str, new: str) -> None:
    global src
    count = src.count(old)
    if count != 1:
        sys.exit(f"INDEX SPLICE FAILED: anchor count {count} for {old[:60]!r}")
    src = src.replace(old, new)


sub("import { initializeListeners } from '@/device/listeners';\n", "import { runNotifyStudy } from '@/device/notifyStudy';\n")
sub("import { useNotification } from '@/hooks/useNotification';\n", "")
sub("  const { checkInitialPermissions } = useNotification();\n", "")
sub(
    "    initializeListeners(checkInitialPermissions);",
    "    runNotifyStudy();",
)
sub(
    "      initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask).catch((error) =>\n"
    "        logger.error('Failed to initialize notifications:', error)\n"
    "      );\n\n",
    "",
)

with open(path, "w") as handle:
    handle.write(src)
print("INDEX SPLICE OK")

"""Repoints the study build at its own bundle id and display name.

Worktree-only: the file it edits is never committed. Fails loudly if any
anchor is not found exactly once, so a drifted app.json stops the build
instead of shipping a wrong identity.
"""
import sys

path = sys.argv[1]
with open(path) as handle:
    src = handle.read()


def sub(old: str, new: str) -> None:
    global src
    count = src.count(old)
    if count != 1:
        sys.exit(f"APPJSON SPLICE FAILED: anchor count {count} for {old[:60]!r}")
    src = src.replace(old, new)


sub('"name": "Athan",', '"name": "Athan Lab",')
sub('"bundleIdentifier": "com.mugtaba.athan",', '"bundleIdentifier": "com.mugtaba.athan.experiments",')
sub('"CFBundleDisplayName": "Athan",', '"CFBundleDisplayName": "Athan Lab",')

with open(path, "w") as handle:
    handle.write(src)
print("APPJSON SPLICE OK")

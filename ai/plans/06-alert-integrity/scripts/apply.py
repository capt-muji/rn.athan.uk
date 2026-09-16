"""Replaces one anchor with its change in a source file, refusing unless the anchor occurs exactly once

Usage, from the repository root: python3 ai/plans/06-alert-integrity/scripts/apply.py <source file> <anchor file> <change file>
Prints APPLIED on success. Prints ANCHOR COUNT <n> and exits 1 otherwise, leaving the source file untouched.
"""
import sys

source, anchor_path, change_path = sys.argv[1:4]
anchor = open(anchor_path).read()
change = open(change_path).read()
text = open(source).read()
count = text.count(anchor)
if count != 1:
    print(f"ANCHOR COUNT {count}: {anchor_path} in {source}")
    sys.exit(1)
open(source, 'w').write(text.replace(anchor, change))
print(f"APPLIED {anchor_path} to {source}")

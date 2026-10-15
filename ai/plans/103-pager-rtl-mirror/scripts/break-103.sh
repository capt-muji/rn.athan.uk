#!/usr/bin/env bash
# Break script for plan 103 step 1: prove the two red tests bite.
# Renames only the layoutDirection prop (the file stays parseable),
# runs the two new cases, expects both to fail, then restores the file
# from the backup copy. Run from the repository root.
set -u
file="app/Navigation.tsx"
cp "$file" "$file.break-103-backup" || exit 1

perl -pi -e 's/^(\s*)layoutDirection=\{direction\}/$1break103Direction={direction}/' "$file"

if cmp -s "$file" "$file.break-103-backup"; then
  echo "BREAK FAILED: perl matched nothing (line moved?)"
  mv "$file.break-103-backup" "$file"
  exit 1
fi

npx jest __tests__/app/Navigation.test.tsx --watchman=false -t "layoutDirection" 2>&1 | tail -20
status=${PIPESTATUS[0]}

mv "$file.break-103-backup" "$file"

if [ "$status" = "0" ]; then
  echo "BREAK FAILED: tests still green with the prop renamed away"
  exit 1
fi
echo "BREAK OK"

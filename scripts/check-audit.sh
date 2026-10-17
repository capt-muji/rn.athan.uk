#!/usr/bin/env bash
# Structural gate for an audit record. An audit that dispatched reviewers is
# not closed until this prints AUDIT OK.
# Usage: bash scripts/check-audit.sh <plan-folder>
# bash 3.2 compatible (macOS): no assoc arrays, no mapfile, no NUL tricks in
# BSD awk, so the file is walked as a line state machine.
set -u
folder="${1:?usage: check-audit.sh <plan-folder>}"
fail=0
n=0
reasons=""

reason() {
  n=$((n + 1))
  reasons="${reasons}$n. $1
"
  fail=1
}

# Validates the pass section accumulated in the three globals below.
check_pass() {
  [ "$pass_open" = "1" ] || return 0
  if [ -z "$pass_range" ]; then
    reason "$pass_head: no Range line naming the commit range"
  elif ! printf '%s' "$pass_range" | grep -q '\.\.'; then
    reason "$pass_head: Range line carries no a..b range: $pass_range"
  fi
  if [ -z "$pass_findings" ]; then
    reason "$pass_head: no Findings line naming the findings file"
  else
    path="$pass_findings"
    case "$pass_findings" in
      /*) ;;
      *) path="$folder/$pass_findings" ;;
    esac
    if [ ! -f "$path" ]; then
      reason "$pass_head: findings file does not exist: $path"
    elif [ ! -s "$path" ]; then
      reason "$pass_head: findings file is empty: $path"
    fi
  fi
}

audit="$folder/AUDIT.md"
if [ ! -f "$audit" ]; then
  echo "AUDIT CHECK FAILED"
  echo "- no AUDIT.md in $folder"
  exit 1
fi

pass_open=0
pass_head=""
pass_range=""
pass_findings=""
pass_count=0

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    "## Pass"*)
      check_pass
      pass_open=1
      pass_count=$((pass_count + 1))
      pass_head="$line"
      pass_range=""
      pass_findings=""
      ;;
    "## "*)
      check_pass
      pass_open=0
      ;;
    "Range:"*)
      [ "$pass_open" = "1" ] && pass_range="${line#Range: }"
      ;;
    "Findings:"*)
      [ "$pass_open" = "1" ] && pass_findings="${line#Findings: }"
      ;;
  esac
done < "$audit"
check_pass

if [ "$pass_count" -lt 2 ]; then
  reason "fewer than two recorded passes (found $pass_count)"
fi

if [ "$fail" = "0" ]; then
  echo "AUDIT OK"
  exit 0
fi
echo "AUDIT CHECK FAILED"
printf '%s' "$reasons"
exit 1

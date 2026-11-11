#!/bin/zsh
# probe.sh <name> <url> [extra curl args...]
# Saves raw body to captures/<name>.bin, appends one TSV line to probes.tsv.
set -u
DIR="$HOME/athan-gitree/census/o1l-city/watches-eu"
NAME="$1"; URL="$2"; shift 2
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
OUT="$DIR/captures/$NAME.bin"
META=$(curl -sS -L --max-time 45 -A "$UA" -o "$OUT" -w '%{http_code}\t%{size_download}\t%{content_type}' "$@" "$URL" 2>"$DIR/captures/$NAME.err")
CODE=$(print -r -- "$META" | cut -f1)
SIZE=$(print -r -- "$META" | cut -f2)
CTYPE=$(print -r -- "$META" | cut -f3)
FIRST=$(head -c 220 "$OUT" 2>/dev/null | tr '\n\t' '  ')
print -r -- "$TS\t$NAME\t$URL\t$CODE\t$SIZE\t$CTYPE\t$FIRST" >> "$DIR/probes.tsv"
print -r -- "$TS | $NAME | HTTP $CODE | $SIZE B | $CTYPE"
print -r -- "  first: $FIRST"

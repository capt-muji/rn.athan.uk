#!/usr/bin/env bash
# Ticket 82 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp shared/i18n/index.ts $TMPDIR/break82-step2.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/i18n/index.ts')
s = p.read_text()
# Re-map the interpolation's digits: the ar reminder title pin must fail, proving the
# t() pins guard the Latin-digit rule.
old = """    const localized = String(supplied);
    return localized;"""
new = """    const ARABIC = { '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤', '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩' };
    const localized = String(supplied).replace(/[0-9]/g, (digit) => ARABIC[digit]);
    return localized;"""
assert s.count(old) == 1, "break substitution not found once (the t() interpolation return)"
p.write_text(s.replace(old, new))
print("break applied: the interpolation maps digits again")
EOF

fails=0
npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break82-step2.log 2>&1
grep -qF 'Expected: "العصر بعد 15"' $TMPDIR/break82-step2.log && grep -qF 'Received: "العصر بعد ١٥"' $TMPDIR/break82-step2.log && echo "caught: the ar reminder title carries Arabic-Indic digits again" && fails=$((fails+1))

cp $TMPDIR/break82-step2.ts.bak shared/i18n/index.ts
rm $TMPDIR/break82-step2.ts.bak
git diff --quiet -- shared/i18n/index.ts || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 1 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 1 catches fired)"
  exit 1
fi

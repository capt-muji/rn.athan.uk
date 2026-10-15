# Step 2 — the en reminder title drops its unit letter

Requirements: R2.1, R2.2, R2.3
Weight: 2

Anchor check first: a07 in `shared/i18n/en.ts`, a11 in
`shared/__tests__/i18nBridge.test.ts`, a12 in
`shared/__tests__/notifications.test.ts`. A count other than 1 is `STOP:`.

Goal: the en catalog value for `notification.reminder` loses its trailing
`m`, so the armed reminder title reads `Fajr in 15` and never
`Fajr in 15m`. The five translated values, every channel label and all
scheduling stay untouched.

Branch: `git checkout -b ticket/88-step2 lane/88`.

Files: `shared/i18n/en.ts`, `shared/__tests__/i18nBridge.test.ts`,
`shared/__tests__/notifications.test.ts`.

## Red tests

Write these first. Run with
`npx jest shared/__tests__/i18nBridge.test.ts shared/__tests__/notifications.test.ts --watchman=false --selectProjects=shared`.
Both must fail on the flipped lines; a flipped test that passes is `STOP:`.

1. `shared/__tests__/i18nBridge.test.ts` (a11):
   `expect(t('notification.reminder', { name: 'Fajr', n: 15 })).toBe('Fajr in 15m')`
   becomes `...toBe('Fajr in 15')`, and
   `expect(t('notification.reminder', { name: 'Last Third', n: 30 })).toBe('Last Third in 30m')`
   becomes `...toBe('Last Third in 30')`. The `channel.reminder` line on the
   next row keeps `'Fajr in 15m Reminder'` byte-identical (R2.3).
   Red today: the received values are `'Fajr in 15m'` and
   `'Last Third in 30m'`.
2. `shared/__tests__/notifications.test.ts` (a12): in
   `genReminderNotificationContent`, `'Fajr in 15m'` becomes
   `'Fajr in 15'`; in the intervals test `'Dhuhr in 5m'` becomes
   `'Dhuhr in 5'` and `'Asr in 30m'` becomes `'Asr in 30'`.
   Red today: the received values carry the `m`.

## Change contract

`shared/i18n/en.ts` (a07): `'notification.reminder': '{name} in {n}m',`
becomes `'notification.reminder': '{name} in {n}',`. Nothing else in any
catalog changes. The tokens stay `{name}` and `{n}`, so `ParamsOf` and the
token-parity test hold without edits.

## Green run

1. The named jest run exits 0.
2. `npx jest shared/__tests__/catalogLock.test.ts shared/__tests__/prayerIdContract.test.ts --watchman=false --selectProjects=shared` exits 0 (the five translated catalogs and the channel bytes prove unchanged: R2.2, R2.3).
3. `npx tsc --noEmit` exits 0.
4. `npx biome check . --error-on-warnings` exits 0.

## Break script

`scripts/break-88-step2.sh`, run from the lane root:

```bash
#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../../../.." || exit 1
python3 - <<'EOF'
path = 'shared/i18n/en.ts'
text = open(path).read()
old = "'notification.reminder': '{name} in {n}',"
new = "'notification.reminder': '{name} in {n}m',"
if text.count(old) != 1:
    print(f"BREAK NOT APPLIED: {old!r} counts {text.count(old)}")
    raise SystemExit(1)
open(path, 'w').write(text.replace(old, new))
EOF
[ $? -ne 0 ] && exit 1
if npx jest shared/__tests__/i18nBridge.test.ts shared/__tests__/notifications.test.ts --watchman=false --selectProjects=shared > $TMPDIR/break-88-2.log 2>&1; then
  echo "BREAK NOT CAUGHT: the title tests passed with the m restored"
  git checkout -- shared/i18n/en.ts
  exit 1
fi
echo "break en-title: tests red as expected"
git checkout -- shared/i18n/en.ts
echo "ALL ASPECTED: 1"
```

After the script, `git status --porcelain` lists only this step's files and
the plan files. The last line must be `ALL ASPECTED: 1`.

## Version and commit

Under the version lock, the next patch after the lane's `package.json`
(expected 2.0.743; take the printed value), `app.json` first.

Commit message: `<VERSION> - feat(notifications): the en reminder title
drops its unit letter, Fajr in 5 (row 88 rider)`. Add the three files by
name plus the plan files. The hook's `Tests:` line and the four `100%`
coverage lines must be in the log.

## Review

Read `git show <sha>` cold: exactly one catalog byte changed; the channel
line and the five translated values byte-identical; no scheduling file, no
identifier, no channel id in the diff. Shipped classes: the title string is
data baked at arm time; no lifecycle, thread or rule surface moves.

## Merge

`git checkout lane/88 && git merge --no-ff ticket/88-step2 -m "<VERSION> -
merge step 2: the en reminder title drops its unit letter"` then
`git branch -d ticket/88-step2` and `rmdir $HOME/athan-gitree/version.lock`.

## Done when

Both jest runs, `tsc` and Biome exit 0; the lock and contract runs exit 0;
the break script ends `ALL ASPECTED: 1`; the merge is on `lane/88`; the
section 6 box is ticked; the `LOG.md` entry carries the `session:` line.
After this step the executor runs Finishing: the findings text into
`LOG.md`, the queue row to EXECUTED, the executed docs commit
(`docs/executed-88-<date>` off `lane/88`, merged `--no-ff` into `lane/88`),
no push.

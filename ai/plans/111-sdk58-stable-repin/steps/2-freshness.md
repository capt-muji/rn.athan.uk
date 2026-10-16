# Step 2: the non-SDK freshness batch

Requirements: R2.1
Weight: 2

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them (the anchored
bytes are the pre-re-pin pins and patch files).

## Goal

Five stale packages move to their latest, one commit each, each green through
the hook (D111.9). Nothing else rides.

## Branch

One branch off uat: `dep/111-freshness`. Five commits on it, merged once.

## Files

`package.json`, `yarn.lock`, plus whatever the bump forces (expected: none;
Biome may flag new rules, fixed in its own commit below).

## Red tests

No behavioural red exists for version pins; the guard is the graph and the
suite. Before each commit:

```bash
yarn install --frozen-lockfile 2>&1 | tail -2
```

Expected: `Done in ...s` with no lock drift (yarn 1: `--frozen-lockfile`; the
Berry-only `--immutable` does not exist here). A drift means `package.json` and
`yarn.lock` disagree: STOP, fix by reinstalling, never by hand-editing the lock.

## Change contracts

One package per commit, in this order (lowest blast first):

1. jotai `3.0.0` to `3.0.1`
2. pino `10.3.1` to `10.4.0`
3. pino-pretty `13.1.3` to `13.2.0`
4. @testing-library/react-native `14.0.1` to `14.1.0`
5. @biomejs/biome `2.5.14` to `2.5.15`

Each commit: edit the pin, `yarn install`, `yarn validate`, version bump in
the three places, commit
`<VERSION> - dep: <package> <old> to <new>`. A new Biome rule that flags
existing code is fixed inside Biome's own commit, code-style only, no behaviour
change; a rule that would force a behavioural change is a STOP (section 2.2,
new work this plan does not name).

## Green run

After the fifth commit:

```bash
for p in jotai pino pino-pretty @biomejs/biome @testing-library/react-native; do node -e "console.log('$p', require('$p/package.json').version)"; done
yarn validate
```

Expected: `jotai 3.0.1`, `pino 10.4.0`, `pino-pretty 13.2.0`,
`@biomejs/biome 2.5.15`, `@testing-library/react-native 14.1.0`; validate
green at 100 percent (R2.1).

## Break script

```bash
git checkout uat -- package.json yarn.lock && yarn install --ignore-engines
node -e "console.log('jotai', require('jotai/package.json').version)"
git checkout dep/111-freshness -- package.json yarn.lock && yarn install --ignore-engines
node -e "console.log('jotai', require('jotai/package.json').version)"
```

Expected: the first print reads `jotai 3.0.0` (uat's pin resolved) and the
second reads `jotai 3.0.1` (the branch's pin resolved), proving the lock pins
what package.json names and the suite guarded the difference.

## Version and commit

Five commits, each `<VERSION> - dep: <package> <old> to <new>`.

## Review

The reviewer checks: five commits, one package each, no unrelated hunks in any
diff, jest and tsc green through every hook.

## Merge

`git checkout uat && git merge --no-ff dep/111-freshness -m "<VERSION> - merge dep/111-freshness"`

## Done when

R2.1 holds on uat and the ledger lists the five commits with their versions.

## Restore

`git checkout uat -- package.json yarn.lock && yarn install --ignore-engines`.

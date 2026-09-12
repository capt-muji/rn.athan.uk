# Next Session: Upgrade research → ranked plan (session 1 of 4)

Read `ai/AGENTS.md` first, act as Orchestrator. This is session 1 of an owner-ordered
4-session chain: (1) upgrade research → plan, (2) upgrade execution, (3) code-audit
findings, (4) code-audit changes. **At session end, hand the owner the paste-block for
session 2.**

**This session writes ONE document and changes no application code.** No `yarn add`, no
`yarn upgrade`, no lockfile edits, no `npx expo install`. If you find yourself editing
`package.json` dependencies, you are in the wrong session.

## Read first, in this order

1. `ai/features/upgrades-2026-09/BRIEF.md` — the programme brief, the owner's
   instructions, and which older constraints they supersede.
2. `e2e/README.md` §Gotchas — **before any build or device work.** Three of its entries
   cost a full device run on 2026-09-12 because the list was not read first.
3. `ai/ISSUES.md` #34 — the most recent fix, and its process notes.
4. `ai/AGENTS.md` §2 (Stack & Versions — already drifted), §7 (Boundaries; note the
   owner's git override in the brief), §9 (Loop discipline).

## Repo state

- Branch `uat-2` @ **1.24.34**, clean, in sync with `origin/uat-2`. Work on a branch cut
  from `uat-2`; merge back with `--no-ff`. **`uat` is off limits** — the owner has
  deliberately deferred that merge.
- OnePlus 3T (`3T_SERIAL`) has **1.24.33** installed with a real alert armed for the next
  Fajr. No device work is required this session; leave it as it is.
- **All device testing in this programme is on the 3T and nothing else** (owner,
  2026-09-12). The iPhone XS has been deliberately disconnected so test time does not
  double. The 3T is the baseline *and* the most sensitive device: #34 only reproduces
  because it is slow enough for the post-paint refresh to beat the API fetch. Do not ask
  for other devices; the fleet is deferred.

## Owner's plan (2026-09-12, authoritative — verbatim)

> "react 19.3 has just been released a couple days ago. So there are 2 links I want to
> give you for you to explore into React. We talked about Expo modules 2.0. It talks
> about a lot of things that perhaps can actually be very beneficial for us. And of
> course, I want you to audit as well the change log of all the new, all the updated
> packages. So like look at what current version do we have and then look at the latest
> version of each package and see the change log for it and see if any of it benefits
> us, which it probably does. Because this sounds like a good time to upgrade packages."

The two links:

- https://react.dev/blog/2026/09/09/react-19-3#changelog
- https://thisweekinreact.com/newsletter/296

## Procedure

1. **Read both links in full.** For each item, answer one question and write the answer
   down: *does this app actually use the thing being changed?* This codebase is a
   single-screen prayer timetable using expo-router, Jotai, Reanimated and MMKV. Most
   React release-note items will not apply. Say so explicitly rather than listing
   features nobody will use — a plan that recommends everything recommends nothing.

2. **Expo Modules 2.0.** Find the authoritative source (Expo's own changelog/blog, not
   a summary), establish what it actually is, whether it lands in SDK 57 or a later SDK,
   and what it would mean for this app's own native module `modules/tls13` (a
   manifest-merged ContentProvider that MUST keep running before `Application.onCreate`
   — see ISSUES #21/#32; a JS-side install fixes debug and fails release).

3. **Inventory.** `npx expo install --check` and `yarn outdated`. Record installed vs
   latest for every dependency and devDependency. Expect `react-native-reanimated`
   4.6.0 and `react-native-worklets` 0.12.2 to be flagged "ahead of expected" against
   `bundledNativeModules.json` — that is a deliberate, already-completed upgrade, not a
   problem.

4. **Changelogs.** For each package materially behind, read the changelog between the
   installed version and the latest. Group findings as:
   - **Fixes a bug we actually have** (cite the ISSUES entry or the code)
   - **Fixes a bug we could plausibly hit** (say why)
   - **New capability we would use** (say where)
   - **Irrelevant to us** (one line, no detail)
   - **Risk** — native code, breaking change, peer-dependency chain

5. **Rank** by benefit against risk, with the alarm-clock bar in mind: anything touching
   notification scheduling, timers, dates or background execution is high-stakes
   regardless of how small the diff looks.

6. **Write `ai/features/upgrades-2026-09/PLAN.md`**: the ranked list, each entry with
   installed → target version, the evidence for doing it, the risk, how it will be
   verified, and an explicit ordering for session 2 (safest and most independent first;
   anything requiring a native rebuild grouped so the device work batches).
   State plainly where you are guessing.

7. **Also note** any package that should *not* move, and why. "If it works, it works"
   is no longer a blanket rule, but it remains a valid verdict per package.

8. `yarn validate` green, version bump, commit, push, merge into `uat-2` with `--no-ff`.

## Constraints

- **Never commit the API key.**
- No application-code changes and no dependency changes this session.
- Sleep ≤ 15 s in any shell command (AGENTS.md §7) — poll in short cycles.
- Version bump in `app.json` + `package.json` every commit, prefix `X.Y.Z - `; keep
  `android/app/build.gradle` `versionName` in step.
- Git writes (commit/push/merge into `uat-2`) are owner-authorised for this chain.

## Session end

1. Update `ai/features/upgrades-2026-09/BRIEF.md` §Update log with what was decided.
2. Report: what applies to us, what does not, and the ranked plan — with the honest
   split between evidence and guess.
3. Hand the owner this paste-block for session 2, filled in with the real first target:

```
Read ai/AGENTS.md and act as Orchestrator. Then read
ai/features/upgrades-2026-09/BRIEF.md and ai/features/upgrades-2026-09/PLAN.md — the
plan is authoritative and ordered. Read e2e/README.md §Gotchas BEFORE any build.

Session 2 of 4: execute the upgrade plan, ONE package at a time, on a branch cut from
uat-2. After each: yarn validate green, then a device check on the 3T (3T_SERIAL) for
anything touching native code, timers, dates, notifications or background execution.
Any build for device verification must be a prod build (EXPO_PUBLIC_ENV=prod) or it
serves mock data; delete index.android.bundle and verify the new bundle by md5 before
trusting the APK. Never commit the API key. Version bump every commit; merge into
uat-2 with --no-ff; NEVER touch uat. Stop and report if any upgrade changes a prayer
time, an alarm time, or the background schedule.
```

## Tracker

| Step | Status |
|---|---|
| React 19.3 release notes read, applicability judged | ⏳ |
| This Week in React #296 read, applicability judged | ⏳ |
| Expo Modules 2.0 researched (incl. impact on `modules/tls13`) | ⏳ |
| Full dependency inventory (installed vs latest) | ⏳ |
| Changelogs read and grouped | ⏳ |
| `PLAN.md` written and ranked | ⏳ |
| Session 2 paste-block handed to owner | ⏳ |

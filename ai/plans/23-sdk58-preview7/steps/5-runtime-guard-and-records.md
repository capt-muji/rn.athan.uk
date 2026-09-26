# Step 5: the guard that loads the widget runtime, and the records

This step is `(specified)`: build it from the contracts below.

Step 4 fixed the pin. This step makes the defect class impossible to ship silently again. The suite was 170 suites
and 4662 tests green on the exact commit whose build put a blank widget on the phone, because not one test loads
the artefact where the defect lives.

0. **Anchor check:** none. This step adds a new file and appends to two documents.

1. **Goal:** a test in the `unit` project fails if the installed `expo-widgets` and `@expo/ui` produce a widget
   runtime bundle that throws at load, on either platform, and `ai/AGENTS.md` records the invariant.

2. **Branch:** `git checkout -b test/widget-runtime-loads uat-2`

3. **Files:**
   - `shared/__tests__/widgetRuntimeLoads.test.ts` (new)
   - `ai/AGENTS.md`
   - `ai/plans/README.md`
   - `app.json`, `package.json` (version only)
   - this folder's `PLAN.md` and `LOG.md`

4. **Tests first (red).** The new suite IS this step's work, so its red is proven against the broken pin rather
   than against today's tree. Run it with `package.json` temporarily holding `"expo-widgets": "58.0.7"` and
   `"@expo/ui": "58.0.7"` and a matching install: that is exactly what the break script in part 7 automates, so the
   red is demonstrated there rather than by hand.

   `shared/__tests__/widgetRuntimeLoads.test.ts`, new, in the `unit` project. Three tests:

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `the android widget runtime bundle loads` | The Android bundle evaluates without throwing, which is the exact failure that blanked every card | The installed `expo-widgets` and `@expo/ui`, built for `android` | `loadBundle('android')` returns `{ ok: true }`; on failure the message is included so the report names the missing global |
   | `the ios widget runtime bundle loads` | The same for iOS, which breaks one version earlier through a different module | The same, built for `ios` | `loadBundle('ios')` returns `{ ok: true }` |
   | `pins both widget packages to an exact version` | The pin cannot drift back into the broken range through a range prefix | `package.json`'s `dependencies` | `@expo/ui` and `expo-widgets` both match `/^\d+\.\d+\.\d+$/`, with no `~` or `^` |

   The third test is what the break script's `pin-range` case drives, and it is the cheap guard: it fails in
   milliseconds if someone reintroduces a tilde, without waiting for a bundle build.

5. **Change.** Write `shared/__tests__/widgetRuntimeLoads.test.ts` to this contract.

   **`loadBundle(platform: 'android' | 'ios'): { ok: boolean; message: string }`**
   - Answers whether the widget runtime bundle for that platform builds and then evaluates without throwing.
   - Builds with `node_modules/expo-widgets/scripts/build-bundle.mjs`, passing the repository root, the platform,
     and an output path inside `fs.mkdtempSync(join(tmpdir(), 'widget-runtime-'))`. Never writes inside the
     repository.
   - Evaluates the built file with `vm.runInThisContext`, in a `try`/`catch`.
   - Returns `{ ok: true, message: '' }` when it evaluates, and `{ ok: false, message }` when either the build or
     the evaluation fails, with the build's stderr or the thrown `Error.message` as `message`.
   - Must never throw itself: a build failure and a load throw are both reported through the return value, so the
     test's own failure output names which happened.
   - Removes its temporary directory in a `finally`.
   - Writes no log line: this is a test helper, not app code.

   **Why the bundle is built rather than read.** `node_modules/expo-widgets/bundle/build/` is a build artefact that
   may be absent, stale, or built for the other platform. Building inside the test is what makes the assertion
   about the INSTALLED packages rather than about whatever a previous command left behind.

   **Timeouts.** A bundle build takes a few seconds. Give each of the two bundle tests an explicit timeout of
   `120_000` as jest's third argument, so a slow machine reports a real failure rather than a timeout.

   **Coverage.** This suite exercises a helper defined inside the test file, so it adds no uncovered production
   lines. Nothing under `shared/` changes.

   **Then append to `ai/AGENTS.md`**, in the "Widget architecture invariants (expo-widgets)" list, as a new bullet.
   Use this text exactly:

   ```markdown
   - **The widget runtime is not React, and a reachable module-scope `React.memo` call blanks every widget
     (2026-09-26, session 23).** `expo-widgets` evaluates layouts in a cut-down runtime whose React is
     `bundle/react-stub.ts`, which exports exactly five names: `Fragment`, `Children`, `isValidElement`,
     `createContext`, `useContext`. `bundle/ui-globals.<platform>.ts` re-exports the whole `@expo/ui` platform
     entry, so EVERY module reachable from that entry is evaluated when the bundle loads, whether a layout uses it
     or not. `@expo/ui@58.0.7` added `recycling/useRecycledRows.js`, reached via `LazyColumn` then `LazyItems`,
     which calls `memo(...)` at module scope: the bundle throws `(0, n.memo) is not a function` before any layout
     runs, and every Android card renders `undefined is not a function`. iOS breaks one version EARLIER, at
     58.0.6, through `swift-ui/List/DataListForEach.js` calling the same `memo`. **Both packages are therefore
     pinned to an exact `58.0.5`**, the last version where both platforms load; a `~` range admits the broken
     ones. They move together because `expo-widgets` declares `@expo/ui` at its own minor, so pinning `@expo/ui`
     alone installs a NESTED copy that the bundle resolves while the flat pin looks correct, and yarn does not
     prune that nested copy on a later install (`rm -rf node_modules/expo-widgets/node_modules`, then reinstall).
     DURABLE LESSON: **a missing-name check is the wrong guard.** `useRef`, `useEffect`, `useMemo`, `useCallback`,
     `useLayoutEffect`, `useState` and `createElement` are all imported from `react` by reachable modules in EVERY
     version including the working ones, and never throw, because they are only called inside component bodies the
     widget runtime never invokes. Only a module-scope call breaks, so the only honest guard is to build the
     bundle and load it, which `shared/__tests__/widgetRuntimeLoads.test.ts` does for both platforms. Retry a
     newer version by running that suite against it; do not patch the stub, because an upstream regression is
     upstream's to fix.
   ```

6. **Green.**

   ```bash
   npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: `Tests: 3 passed, 3 total`. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both
   exiting 0.

7. **Breaks.** Run the script given in `steps/4-pin-widget-packages.md` part 7, saved as `$TMPDIR/breaks-23-4.sh`,
   with `bash`, from the repository root.

   Expected, exactly:

   ```
   caught: pin-range
   caught: pin-version
   caught 2 of 2
   ALL AS EXPECTED: 1
   ```

   Both breaks edit `package.json`, which is text this plan itself fixes, so neither can print
   `BREAK NOT APPLIED` unless the pin was written differently from part 1 of step 4. If it does, STOP
   (`PLAN.md` section 2.2, item 3).

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files.

8. **Version and commit.**

   ```bash
   node -p "const v=require('./package.json').version.split('.'); v[2]=+v[2]+1; v.join('.')"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
   `shared/__tests__/widgetRuntimeLoads.test.ts`, `ai/AGENTS.md`, `ai/plans/README.md`, `app.json`,
   `package.json`, and this folder's `PLAN.md` and `LOG.md`.

   Commit message, in `$TMPDIR/msg-5.txt`:

   ```
   <VERSION> - test(widgets): load the widget runtime bundle, both platforms

   170 suites and 4662 tests were green on the commit whose build showed a blank
   widget on the 3T, because not one test loads the artefact the defect lives in.
   Every widget suite runs against mocked @expo/ui globals or against source text.

   This builds the real widget runtime bundle for android and ios with
   expo-widgets' own build-bundle.mjs, then evaluates each with
   vm.runInThisContext. A module-scope call to a global the react-stub does not
   export throws there and nowhere else.

   A third test pins the pin: both packages must carry an exact version, because
   a ~ range admits 58.0.6 and 58.0.7, the two broken ones. It fails in
   milliseconds, without a bundle build.

   A missing-name check was tried first and rejected: useRef, useEffect, useMemo,
   useCallback, useLayoutEffect, useState and createElement are imported from
   react by reachable modules in EVERY version, including the ones that work.
   They never throw because they are only called inside component bodies the
   widget runtime never invokes. Only a module-scope call breaks, so loading the
   bundle is the only guard that tells the versions apart.

   AGENTS.md records the invariant, the nested-copy trap, and how to retry a
   newer version.
   ```

9. **Review.** Read `git show <sha>` back cold, as a stranger, and check:
   - the new suite builds its bundles into a temp directory and never writes inside the repository;
   - `loadBundle` cannot throw: a build failure and a load throw both return `{ ok: false }` with a message;
   - the two bundle tests carry an explicit timeout;
   - the third test would fail on `~58.0.5`, not merely on a different number;
   - the `ai/AGENTS.md` bullet matches the text in part 5 exactly, and sits in the widget invariants list;
   - the comments explain WHY only, are one line where one line does, and none restates what the code shows;
   - the three version numbers match.

   A clean read is all seven true. Handle a finding as `EXECUTOR-BRIEF.md` section 4, item 8 says.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff test/widget-runtime-loads \
      -m "Merge test/widget-runtime-loads into uat-2: the widget runtime bundle is loaded by the suite"
    ```

11. **Done when:**
    - `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit` prints
      `Tests: 3 passed, 3 total`;
    - `bash $TMPDIR/breaks-23-4.sh` ends `ALL AS EXPECTED: 1`;
    - `ai/AGENTS.md` contains the new bullet;
    - the commit's hook log ends with a `Tests:` line reading `passed, <n> total` and four `100%` coverage lines;
    - the step is ticked in `PLAN.md` section 6 as `- [x] Step 5: DONE in <sha>`.

## Records

**`ai/plans/README.md` row 26.** Replace the whole Status cell with:

```
DONE 2026-09-26. Steps 1 to 3 rode the beta to preview.7, React 19.3.0, RN 0.88.0-rc.2 and Reanimated 4.7.0. Step 4 then fixed the Android widget blanking those steps exposed, and the cause was neither the SDK nor React, RN or Reanimated, all of which the bisect cleared: **`@expo/ui@58.0.7` calls `React.memo` at MODULE scope** in `recycling/useRecycledRows.js`, reached from the platform entry via `LazyColumn` then `LazyItems`. The widget runtime's React is `expo-widgets`' own five-name `react-stub.ts`, which has no `memo`, so the bundle throws `(0, n.memo) is not a function` at LOAD, before any layout runs, and every card renders `undefined is not a function`. **iOS breaks one version earlier, at 58.0.6**, through `swift-ui/List/DataListForEach.js` calling the same `memo`; nobody had tested iOS, and the planned phone ladder could never have found it, because the 3T is Android and the ladder would have stopped at 58.0.6 and shipped a broken iOS bundle. Both packages are pinned to an exact `58.0.5`, the last version where both platforms load, and they move together because `expo-widgets` declares `@expo/ui` at its own minor: pinning `@expo/ui` alone installs a NESTED 58.0.7 that the bundle resolves while the flat pin reads correct. Everything else stays at preview.7. Step 5 added `shared/__tests__/widgetRuntimeLoads.test.ts`, which builds the real runtime bundle for both platforms and evaluates each, closing the gap that let 170 green suites coexist with a blank widget. **Durable lesson: a missing-name guard is the wrong tool.** Seven React names are imported by reachable modules in every version including the working ones and never throw, because they are only called inside component bodies the runtime never invokes; only a module-scope call breaks, so the bundle must actually be loaded. The whole diagnosis ran on this Mac in about 40 seconds per version, against five production builds of 6 to 7 minutes each that the ladder would have cost
```

Set "Planned at" to `430fbfd6`.

**Docs commit.** After the two merges, make an `executed` docs commit as `EXECUTOR-BRIEF.md` section 4b says, with
the message:

```
<VERSION> - docs(plans): session 23 executed, the widget packages pinned to 58.0.5
```

## Report to the owner

Start with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`. Then a few plain sentences: what
the root cause was, that it was neither the SDK nor React, RN or Reanimated, that iOS was breaking too and nobody
had noticed, where the pin landed and why, and what now guards it. Then the progress table
(`EXECUTOR-BRIEF.md` section 6), and the four-line handoff from the `athan-next` skill, section 8.

# Step 8: `jotai` 2.20.3 to 3.0.0, with the `loadable` replacement and the Jest ESM fix

0. **Anchor check.** Run, from the repository root, and each must print `1`:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/8-1.txt stores/sync.ts
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/8-2.txt stores/sync.ts
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/8-3.txt jest.config.js
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/8-4.txt jest.config.js
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/8-5.txt jest.components.setup.js
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/21-bump-everything-latest/scripts/anchors/8-6.txt jest.components.setup.js
   ```

   Any count other than `1` means NEEDS REPLAN (section 2.2, item 1).

1. **Goal:** jotai runs at 3.0.0, with `syncLoadable` built on `unwrap` instead of the deleted `loadable`, and both
   Jest projects able to load jotai's ESM.

2. **Branch:** `git checkout -b chore/bump-jotai-3 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `stores/sync.ts`, `jest.config.js`, `jest.components.setup.js`,
   `app.json`. Nothing else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** This step writes NO new test file. Its red is the existing suite failing under jotai 3,
   which is what proves the migration is needed rather than cosmetic. Install jotai 3 first:

   ```bash
   yarn add jotai@3.0.0 && npx tsc --noEmit
   ```

   `tsc` must print exactly this line, and the command must exit non-zero:

   ```
   stores/sync.ts(9,10): error TS2305: Module '"jotai/utils"' has no exported member 'loadable'.
   ```

   Then run the two suites that cover the launch sync, path first:

   ```bash
   npx jest stores/__tests__/sync.test.ts --watchman=false --selectProjects=unit
   ```

   It must fail to run, with this line naming jotai's own file:

   ```
   Must use import to load ES Module: <repo>/node_modules/jotai/dist/index.js
   ```

   If `tsc` passes, or the suite runs, STOP: jotai 3 no longer has these two breaking changes and the plan is stale.

   **Existing tests that must keep passing unchanged, and why they are the acceptance for this step:**

   | Suite | What it proves about this change |
   | --- | --- |
   | `stores/__tests__/syncLoadable.test.ts` | The three states through `store.get(syncLoadable)`: `hasData` with `data: undefined`, and `hasError` carrying the offline error. This is the invariant |
   | `stores/__tests__/sync.test.ts` | The whole sync flow, 99 tests, including that `syncLoadable` is defined |
   | `__tests__/app/index.test.tsx` | The launch screen switching on `state` |

   No existing test is edited in this step. If one needs editing to pass, STOP.

5. **Change.** This is a `(specified)` step: build it from the contracts below.

   **5a. `stores/sync.ts`.** Replace the `loadable` import and the `syncLoadable` line.

   The import line becomes exactly:

   ```ts
   import { type Atom, atom } from 'jotai';
   import { unwrap } from 'jotai/utils';
   ```

   Add one local type and one local function, above `// --- Atoms ---`. Contract:

   - **`Loadable<Value>`**, a type, not exported. It is the union
     `{ state: 'loading' } | { state: 'hasError'; error: unknown } | { state: 'hasData'; data: Awaited<Value> }`.
     It must match jotai 2's `Loadable` exactly, because `app/index.tsx` switches on `state` and
     `syncLoadable.test.ts` asserts the whole object.
   - **`loadable<Value>(anAtom: Atom<Value>): Atom<Loadable<Value>>`**, not exported, because `stores/sync.ts` is the
     only call site. It answers: an atom reporting the wrapped async atom's state as one of the three shapes. It must
     never throw: a rejection is reported as `{ state: 'hasError', error }`, never propagated. It writes no log line.
     It must compare the loading sentinel by IDENTITY, not by value, because a resolved value may itself be
     `undefined` and only identity separates "still loading" from "resolved to nothing".

   The code, verbatim, because the identity comparison and the `as never` are terms whose every part matters:

   ```ts
   /** The three states a consumer reads off `syncLoadable`, as jotai 2's `loadable` reported them */
   type Loadable<Value> =
     | { state: 'loading' }
     | { state: 'hasError'; error: unknown }
     | { state: 'hasData'; data: Awaited<Value> };

   // jotai 3 deleted `loadable` in favour of this wrapper over `unwrap`, which the
   // library's own deprecation notice spells out (pmndrs/jotai#3217). The sentinel
   // has to be compared by identity: a resolved value could itself be undefined,
   // and only the identity check tells "still loading" from "resolved to nothing".
   const loadable = <Value>(anAtom: Atom<Value>): Atom<Loadable<Value>> => {
     const LOADING: Loadable<Value> = { state: 'loading' };
     const unwrapped = unwrap(anAtom, () => LOADING as never);

     return atom((get) => {
       try {
         const data = get(unwrapped);
         return data === LOADING ? LOADING : { state: 'hasData', data: data as Awaited<Value> };
       } catch (error) {
         return { state: 'hasError', error };
       }
     });
   };
   ```

   Then the `syncLoadable` line keeps its existing form, and its comment loses the two paragraphs about the
   deprecation, because they described a migration this step has now done:

   ```ts
   // --- Atoms ---
   // Startup defers the widget timeline push past first content (see sync options)
   export const syncLoadable = loadable(atom(async () => sync({ deferWidgetRefresh: true })));
   ```

   **5b. `jest.config.js`.** Both projects need jotai's ESM transformed to CJS.

   In the `unit` project, the `transform` line widens from `.tsx?` to `.[jt]sx?` and a
   `transformIgnorePatterns` is added directly beneath it:

   ```js
         // jotai 3 ships ESM only, so its own .js files need the CJS transform too
         transform: { '^.+\\.[jt]sx?$': appTransform },
         transformIgnorePatterns: ['/node_modules/(?!jotai)'],
   ```

   In the `components` project, `jotai` is appended to the existing allow-list, and the comment gains its reason:

   ```js
         // jest-expo's list of packages that ship untranspiled code, plus this app's other native libraries, plus
         // jotai, which ships ESM only from v3
         transformIgnorePatterns: [
           '/node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|standard-navigation|@gorhom|reanimated-color-picker|jotai))',
         ],
   ```

   Do NOT add `--experimental-vm-modules` to any command. It was tried in the spike and it fixes the `unit` project
   only: Jest 30's native `require(esm)` is also gated on `canResolveSync()`, which the `components` project fails
   because it sets a custom resolver.

   **5c. `jest.components.setup.js`.** This is the third blocker, and it only appears once 5a and 5b are done: 30
   component suites then fail with `TypeError: buildStore is not a function`. The setup builds ONE jotai store over
   replaceable state containers so every component test starts from a fresh install, and it reaches jotai's
   `INTERNAL_` API to do it. jotai 3 renamed `INTERNAL_buildStoreRev3` to `INTERNAL_buildStoreRev4` and changed its
   signature from six positional arguments to a single `Partial<BuildingBlocks>` object.

   Take the whole internals module, rather than destructuring one name from it, because the keys are needed too:

   ```js
     const internals = jest.requireActual('jotai/vanilla/internals');
     const { INTERNAL_buildStoreRev4: buildStore } = internals;
   ```

   Then build the store from the keyed object. The keys are read from the library, never written out as literals: in
   jotai 3 they are single letters (`KEY_atomStateMap` is `'a'`, `KEY_mountedMap` is `'m'`,
   `KEY_invalidatedAtoms` is `'i'`, `KEY_changedAtoms` is `'c'`, `KEY_mountCallbacks` is `'q'`,
   `KEY_unmountCallbacks` is `'Q'`), and a literal would silently break on the next rename instead of failing loudly.
   The three WeakMaps keep their `replaceableWeakMap()` calls and the three Sets keep their order, because
   `mockResetAtomState` empties exactly those containers between tests:

   ```js
     // Keys come from the library because they are single letters ('a', 'm'), meaningless written out here
     const store = buildStore({
       [internals.INTERNAL_KEY_atomStateMap]: replaceableWeakMap(),
       [internals.INTERNAL_KEY_mountedMap]: replaceableWeakMap(),
       [internals.INTERNAL_KEY_invalidatedAtoms]: replaceableWeakMap(),
       [internals.INTERNAL_KEY_changedAtoms]: sets[0],
       [internals.INTERNAL_KEY_mountCallbacks]: sets[1],
       [internals.INTERNAL_KEY_unmountCallbacks]: sets[2],
     });
   ```

   The comment above the old positional call described what the six arguments were. It goes: the keyed object now
   says that itself, and a comment restating it would be a WHAT.

6. **Green.**

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage
   ```

   `tsc` and Biome exit 0. The suite prints:

   ```
   Test Suites: 170 passed, 170 total
   Tests:       2 skipped, 4647 passed, 4649 total
   ```

   and four `100%` coverage lines. If any suite fails, STOP (section 2.2, item 2).

7. **Breaks.** In `scripts/breaks-7.sh`, given in full. It ends `ALL AS EXPECTED: 1`.

8. **Version and commit.**

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
   `package.json`, `yarn.lock`, `stores/sync.ts`, `jest.config.js`, `jest.components.setup.js`, `app.json`, and
   `ai/plans/README.md` plus this
   folder's `PLAN.md` and `LOG.md`. Commit message, in a heredoc:

   ```
   <VERSION> - chore(deps): jotai 3.0.0, replacing the deleted loadable

   jotai 3 is ESM-only and deletes `loadable`, which the launch sync used to
   report its three states to the launch screen. Both are handled here rather
   than pinned around.

   `stores/sync.ts` gains the wrapper jotai's own deprecation notice specifies
   (pmndrs/jotai#3217): `unwrap` with a loading sentinel compared by identity,
   because a resolved value may itself be undefined and only identity separates
   "still loading" from "resolved to nothing". It is local and unexported,
   because this is the only call site.

   Both Jest projects now transform jotai's own ESM to CJS: the `unit` project
   widens its transform to .js and gains a transformIgnorePatterns, and the
   `components` project appends jotai to the list it already had.
   `--experimental-vm-modules` was tried and rejected: Jest 30's native
   require(esm) is also gated on canResolveSync(), which the `components`
   project fails because it sets a custom resolver, so the flag fixes one
   project and not the other.

   jest.components.setup.js follows the internals rename: buildStoreRev3 became
   buildStoreRev4, and its six positional building blocks became one keyed
   object. The keys are read from the library rather than written out, because
   in jotai 3 they are single letters.

   Before: 82 of 170 suites failed. After: 170 passed, 4647 tests, 100% on all
   four coverage measures.
   ```

9. **Review.** No subagent (section 11). The session reviews its own diff against this step's contracts, and records
   the review in `LOG.md`: every name and signature as specified, the identity comparison present, the internals keys
   read from the library rather than written as literals, no existing test edited, and nothing beyond these five
   files changed.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/bump-jotai-3 -m "Merge chore/bump-jotai-3 into uat-2: jotai 3.0.0 with the loadable replacement"
    ```

11. **Done when:**
    - `node -p "require('./node_modules/jotai/package.json').version"` prints `3.0.0`;
    - `grep -c "loadable" stores/sync.ts` prints a non-zero count and `grep -c "from 'jotai/utils'" stores/sync.ts`
      prints `1`;
    - `npx jest --silent --coverage` prints `Test Suites: 170 passed, 170 total`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.

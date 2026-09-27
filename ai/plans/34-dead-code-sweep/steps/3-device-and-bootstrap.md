# Step 3: Delete three dead symbols in `device/` and `stores/bootstrap.ts`

0. **Anchor check:** run `bash $TMPDIR/preflight-34.sh 3`. Anchors `3-1`, `3-2` and `3-3` must each
   print `1`. Any other count, or `EMPTY ANCHOR`, means NEEDS REPLAN.

1. **Goal:** `openAppSettings` leaves the tree, and the two exports whose INITIALISER does the work
   keep the work and lose the name.

2. **Branch:** `git checkout -b chore/34-device-and-bootstrap uat-2`

3. **Files:**
   - `device/notifications.ts`, `device/tls13.ts`, `stores/bootstrap.ts`
   - `device/__tests__/androidChannelUpdate.test.ts`, `device/__tests__/tls13.test.ts`,
     `components/modals/__tests__/Help.test.tsx`, `stores/__tests__/bootstrap.test.ts`

   `components/modals/Help.tsx` and `shared/help.ts` are NOT changed by this step. The break script
   touches `Help.tsx` and restores it, because that is where the action's press path lives.
   - `app.json`, `package.json`
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

4. **Tests first (red).** Make the production edits of part 5 first, then run:

   ```bash
   npx tsc --noEmit
   ```

   **Expected, exactly these lines:**

   ```
   components/modals/__tests__/Help.test.tsx(9,10): error TS2305: Module '"@/device/notifications"' has no exported member 'openAppSettings'.
   device/__tests__/androidChannelUpdate.test.ts(12,10): error TS2305: Module '"@/device/notifications"' has no exported member 'openAppSettings'.
   ```

   `tls13FirstProvider` and `didBootstrapFromCache` produce no `tsc` error, because their suites read
   them off a `require`d module object rather than a typed import. Their red is the test run below.

   If `tsc` names a file this plan does not list, STOP (`PLAN.md` section 2.2, item 3).

   | Suite | Change | What it proves after |
   | --- | --- | --- |
   | `device/__tests__/androidChannelUpdate.test.ts` | remove `openAppSettings` from the import clause, and delete its whole `describe` block | unchanged for `openDndAccessSettings` and `updateAndroidChannel` |
   | `components/modals/__tests__/Help.test.tsx` | remove `openAppSettings` from the import clause, remove its line from the `@/device/notifications` mock factory, and delete the two `expect(openAppSettings).not.toHaveBeenCalled();` lines | every `openDndAccessSettings` assertion is untouched, so the page's one action button is still pinned |
   | `device/__tests__/tls13.test.ts` | asserts the log line the module now writes, rather than a returned string | the same four cases, by the same names: the provider Android reports, the two failures, and iOS not asking |
   | `stores/__tests__/bootstrap.test.ts` | the 10 `expect(mod.didBootstrapFromCache).toBe(...)` assertions go, and `const mod = requireFreshBootstrap();` becomes `requireFreshBootstrap();` | each test still proves the same thing through `mockSetSequence` and `mockStartCountdowns`, which sit beside every one of those assertions |

   **`device/__tests__/tls13.test.ts`, the exact edits.** Its `LoadedTls13` interface becomes:

   ```ts
   interface LoadedTls13 {
     requireNativeModule: jest.Mock;
     info: jest.Mock;
     warn: jest.Mock;
   }
   ```

   Inside `loadOn`, replace the `let provider!: string;` declaration with `let info!: jest.Mock;`,
   replace the two lines that read the provider and the logger with:

   ```ts
       require('@/device/tls13');
       const logger = (require('@/shared/logger') as { default: { info: jest.Mock; warn: jest.Mock } }).default;
       info = logger.info;
       warn = logger.warn;
   ```

   and return `{ requireNativeModule, info, warn }`.

   Then the three assertions change to these, each keeping its own test's name:

   | Test | Old assertion | New assertion |
   | --- | --- | --- |
   | reports the first security provider… | `expect(loaded.provider).toBe('GmsCore_OpenSSL');` | `expect(loaded.info).toHaveBeenCalledWith('TLS13: first security provider', { provider: 'GmsCore_OpenSSL' });` |
   | reports unavailable, and warns… | `expect(loaded.provider).toBe('unavailable');` | `expect(loaded.info).not.toHaveBeenCalledWith('TLS13: first security provider', expect.anything());` |
   | reports unavailable on iOS… | `expect(loaded.provider).toBe('unavailable');` | `expect(loaded.info).not.toHaveBeenCalled();` |

   The suite's doc comment's first line becomes:

   ```
    * The TLS 1.3 status read as the app loads: the provider Android reports, or the warning when it cannot
   ```

   Run:

   ```bash
   npx jest device/__tests__/androidChannelUpdate.test.ts device/__tests__/tls13.test.ts stores/__tests__/bootstrap.test.ts --watchman=false --selectProjects=unit
   npx jest components/modals/__tests__/Help.test.tsx --watchman=false --selectProjects=components
   ```

   Expected after the edits: every suite passes. `tls13.test.ts` reports `Tests: 4 passed, 4 total`
   and `bootstrap.test.ts` reports `Tests: 13 passed, 13 total`.

   Tests that must NOT change: every other `describe` in all four suites.

5. **Change.** This is a `(specified)` step.

   **Anchor `3-1`, `device/notifications.ts`:** delete the `openAppSettings` doc comment and its
   whole `export const`, and the blank line after it. Then check whether `Linking` is still used in
   the file; it is, by `openDndAccessSettings`, so its import stays.

   **Anchor `3-2`, `device/tls13.ts`.** This module's WORK is the native call at import time; the
   export only reported the answer. Keep the call and log the answer instead. Replace the anchored
   block verbatim with:

   ```ts
   if (Platform.OS === 'android') {
     try {
       logger.info('TLS13: first security provider', { provider: requireNativeModule('Tls13').status() as string });
     } catch (error) {
       logger.warn('TLS13: module unavailable', { error });
     }
   }
   ```

   Contract for the log line, which the test asserts and which is therefore the plan's, not the
   executor's:

   - on Android, when the native module answers: `logger.info` with the message
     `TLS13: first security provider` and the object `{ provider: <the status string> }`;
   - on Android, when it throws: `logger.warn` with `TLS13: module unavailable` and `{ error }`,
     unchanged from today;
   - on iOS: nothing is logged and the native module is never asked.

   The module keeps its file-level doc comment, whose last line already says it "only reports the
   resulting first security provider". That stays true.

   **Anchor `3-3`, `stores/bootstrap.ts`:** replace the anchored two lines verbatim with:

   ```ts
   // Runs at import, before React renders: app/_layout.tsx imports this module for the side effect
   bootstrapFromCache();
   ```

   **This is the trap in this step.** `app/_layout.tsx` has `import '@/stores/bootstrap';` with no
   binding, so the hydration happens purely as an import side effect. Deleting the `export const`
   without keeping the call would stop every warm-cache launch from hydrating, and no test would
   necessarily catch it. The call must remain, at the same place in the file.

   `bootstrapFromCache` keeps its own name and signature: it stays a module-private
   `const bootstrapFromCache = (): boolean => {`, because its `return true` / `return false` paths
   are what its tests exercise through the mocks.

   **The invariant this step keeps:** every exported symbol is reachable by an import, or is
   allow-listed, AND both side-effect modules run exactly the work they ran before, in the same
   order, at the same point in the import graph.

6. **Green.**

   ```bash
   npx jest device/__tests__/androidChannelUpdate.test.ts device/__tests__/tls13.test.ts stores/__tests__/bootstrap.test.ts --watchman=false --selectProjects=unit
   npx jest components/modals/__tests__/Help.test.tsx __tests__/app/_layout.test.tsx --watchman=false --selectProjects=components
   ```

   All pass. `__tests__/app/_layout.test.tsx` is run here deliberately: it renders the root layout,
   so it exercises both side-effect imports and is the check that the two kept calls still run.

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0. If Biome names an unused import or symbol this step does not list, STOP
   (`PLAN.md` section 2.2, item 6).

   ```bash
   python3 scripts/find-unused-exports.py | head -2
   ```

   prints `NEVER reachable from production code: 20`.

7. **Breaks.** Save as `$TMPDIR/breaks-34-3.sh` and run `bash $TMPDIR/breaks-34-3.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Step 3 breaks: the kept side effects must still happen, and the new log line must be exact.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   caught=0
   total=0

   try() { # try <label> <file> <perl> <suites> <project> <expected>
     total=$((total + 1))
     cp "$2" "$2.bak"
     perl -pi -e "$3" "$2"
     if cmp -s "$2" "$2.bak"; then
       echo "BREAK NOT APPLIED: $1"
       mv "$2.bak" "$2"
       return
     fi
     if npx jest $4 --watchman=false --selectProjects=$5 --silent > "$TMPDIR/b34-3.log" 2>&1; then
       echo "NOT CAUGHT: $1 (expected $6 to fail)"
     else
       echo "caught: $1 (expected $6)"
       caught=$((caught + 1))
     fi
     mv "$2.bak" "$2"
   }

   # The TLS provider must still be read and logged
   try "tls13 logs nothing" device/tls13.ts \
     "s/^    logger\.info\('TLS13: first security provider'.*\$/    \/\/ broken/" \
     "device/__tests__/tls13.test.ts" unit \
     "reports the first security provider the Tls13 native module names on Android"

   # The message text is a contract the test reads
   try "tls13 message text changed" device/tls13.ts \
     "s/TLS13: first security provider/TLS13: provider/" \
     "device/__tests__/tls13.test.ts" unit \
     "reports the first security provider the Tls13 native module names on Android"

   # The android gate must stay, or iOS would ask for the native module
   try "tls13 asks on every platform" device/tls13.ts \
     "s/^if \(Platform\.OS === 'android'\) \{\$/if (true) {/" \
     "device/__tests__/tls13.test.ts" unit \
     "reports unavailable on iOS without asking for the native module"

   # The bootstrap CALL is the whole point of keeping it
   try "bootstrap never runs" stores/bootstrap.ts \
     "s/^bootstrapFromCache\(\);\$/\/\/ broken/" \
     "stores/__tests__/bootstrap.test.ts" unit \
     "hydrates on an ordinary version bump, where the cache is deliberately kept"

   # The hydration itself must still reach setSequence
   try "bootstrap hydrates nothing" stores/bootstrap.ts \
     "s/^  setSequence\(ScheduleType\.Standard, now\);\$/  \/\/ broken/" \
     "stores/__tests__/bootstrap.test.ts" unit \
     "hydrates on an ordinary version bump, where the cache is deliberately kept"

   # Help's own action button must still fire. The suite MOCKS @/device/notifications, so a
   # break inside openDndAccessSettings proves nothing: the press path in Help.tsx is the target.
   try "Help never calls its action" components/modals/Help.tsx \
     "s/onPress=\{\(\) => openDndAccessSettings\(\)\}/onPress={() => undefined}/" \
     "components/modals/__tests__/Help.test.tsx" components \
     "opens the Do Not Disturb access screen from its own answer"

   echo "caught $caught of $total"
   [ "$caught" = "6" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail |
   | --- | --- |
   | tls13 logs nothing | the Android provider test |
   | tls13 message text changed | the Android provider test |
   | tls13 asks on every platform | the iOS test |
   | bootstrap never runs | `hydrates on an ordinary version bump, where the cache is deliberately kept` |
   | bootstrap hydrates nothing | the same test |
   | Help never calls its action | `opens the Do Not Disturb access screen from its own answer` |

   Ends `ALL AS EXPECTED: 1`. All six were run while planning and all six failed their named test.
   Every search text is a line the plan itself fixes: the log message, the platform gate, the kept
   call, `setSequence`'s Standard line, and `Help.tsx`'s `onPress`.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files,
   and no `.bak` file may remain.

8. **Version and commit.** Version command as step 1. Add by name:

   ```
   device/notifications.ts
   device/tls13.ts
   stores/bootstrap.ts
   device/__tests__/androidChannelUpdate.test.ts
   device/__tests__/tls13.test.ts
   components/modals/__tests__/Help.test.tsx
   stores/__tests__/bootstrap.test.ts
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-3.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - chore(device, bootstrap): delete three exports nothing reaches

   openAppSettings had no caller: session 33 rewrote Help to name a setting rather
   than route to one, and the page's only action is openDndAccessSettings. Its
   tests go with it, including two assertions that it stays uncalled.

   tls13FirstProvider and didBootstrapFromCache are a different shape, and the
   reason this is its own commit. Both are exports whose INITIALISER does the work:
   app/_layout.tsx imports each module with no binding, purely for the side effect,
   so deleting the export naively deletes the call. tls13 now logs the provider it
   reads, which is the observation its own file comment promises, and bootstrap
   keeps its call with the reason it runs at import.

   The bootstrap tests lose 10 boolean assertions and prove exactly what they did
   before: every one sat beside a setSequence or startCountdowns assertion that
   already decided the same question. The tls13 tests assert the log line instead
   of a returned string, same four cases, same names.
   ```

9. **Review.** Read `git show <sha>` back cold against this list:

   - `app/_layout.tsx` is NOT in the diff, and both its side-effect imports are unchanged;
   - `bootstrapFromCache();` is present in `stores/bootstrap.ts`, at the same place the export was,
     with the one-line why-comment above it;
   - `device/tls13.ts` still calls `requireNativeModule('Tls13').status()` inside the Android gate
     and inside the `try`;
   - the log message is exactly `TLS13: first security provider` with `{ provider: … }`;
   - the `openDndAccessSettings` export and every one of its tests are untouched;
   - `Linking` is still imported in `device/notifications.ts`, because `openDndAccessSettings` uses it;
   - `__tests__/app/_layout.test.tsx` passes without being edited;
   - no deleted symbol's name survives in a comment;
   - no test was weakened: each changed assertion decides the same question as the one it replaced;
   - the version is bumped in both files and they match;
   - nothing beyond part 3's files changed.

   A clean read is: one export deleted with its tests, two exports turned into the plain side effects
   they always were, and four suites asserting the same facts by a different route.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/34-device-and-bootstrap -m "Merge chore/34-device-and-bootstrap into uat-2: three dead exports removed, the two side effects kept, reviewed"
    ```

11. **Done when:**

    - `python3 scripts/find-unused-exports.py | head -2` prints
      `NEVER reachable from production code: 20`;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `grep -rn 'openAppSettings\|tls13FirstProvider\|didBootstrapFromCache' app/ components/ device/ stores/ shared/ hooks/` prints nothing;
    - `grep -c 'bootstrapFromCache();' stores/bootstrap.ts` prints `1`.

    Tick the step in `PLAN.md` section 6, and append to `LOG.md` as step 1 part 11 says.

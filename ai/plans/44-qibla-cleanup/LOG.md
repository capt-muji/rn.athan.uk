# Execution log: Session 44

## Step 1: the whole feature, in one cut

Branch `chore/44-delete-the-qibla`. 32 files deleted, 14 edited, two copied from `files/`.

**The nested-copy trap fired, exactly as `ai/AGENTS.md` predicts of ANY install.** `yarn remove
expo-location fflate` succeeded and then `widgetRuntimeLoads.test.ts` failed 2 of 3: the install had
re-resolved the tree and put `@expo/ui@58.0.7` under `node_modules/expo-widgets/node_modules/` while
the flat pin still read `58.0.5`. Confirmed by reading both versions rather than assuming. Fixed by
the documented remedy, `rm -rf node_modules/expo-widgets/node_modules && yarn install
--frozen-lockfile`, after which the nested directory is absent and the suite passes 3 of 3. The
plan predicted this and gave the command, so it cost one step rather than a diagnosis.

**The plan's predicted test count was 2 low, and the reason is benign.** It said 4784; the run
reports 4786. `audioMatrix.test.ts` gates two assertions on the prebuilt `android/` and `ios/`
folders, which the scratch worktree the plan was proven in does not have, so it skipped them there
and runs them here. Both step files and `PLAN.md` are corrected to 4786, with the reason recorded so
the next reader does not re-derive it.

`yarn.lock` lost 12 lines, only the two packages and what was theirs alone.

## Step 2: the invariant that keeps it gone

Branch `test/44-qibla-stays-deleted`. One file added, copied byte for byte from `files/`.

Red as the plan predicted, and caught twice over: the planted `shared/qiblaReborn.ts` is reported by
BOTH the filename check and the content check, printing
`shared/qiblaReborn.ts (name):qibla` and `shared/qiblaReborn.ts:qibla`. Green once removed.

Breaks 5 of 5 caught, `ALL AS EXPECTED: 1`, including the two the plan exists to prove: a restored
BINARY tile fixture, which no content search can read, and the guard's own self-exclusion widened to
every test file, which the first draft SURVIVED.

# Step 5: records and the handover

Requirements: R7.1
Weight: 1

## Anchor check

`bash ai/plans/81-greenbuild-refinements/scripts/preflight-81.sh 5`. It must
end `PREFLIGHT OK`.

## Goal

The records land and Metro is verified serving the merged uat to the owner's
dev build. No source file changes. No interaction with the phone: the owner
tests, per her instruction.

## Branch

```
git checkout -b docs/81-handover uat
```

## Files

- `ai/plans/README.md` (ticket 81 reads `IN PROGRESS, step 5`)
- This plan folder's `LOG.md`
- Version files

## Commands

1. Metro has served since ticket 79's delivery. Verify it answers on this Mac
   (the server, never the phone):

```
mkdir -p $HOME/athan-gitree/sessions/81
code=$(curl -s -o $HOME/athan-gitree/sessions/81/metro-status.txt -w "%{http_code}" http://localhost:8081/status)
echo "metro status $code"
```

   Expected output: `metro status 200`. Anything else: restart it detached
   with `nohup npx expo start >
   $HOME/athan-gitree/sessions/81/metro.log 2>&1 &`, wait 15 seconds, and
   re-read; a second failure is a `STOP:` quoting both status lines.

2. The merged `uat` the steps produced is the tree Metro watches; nothing
   rebuilds and nothing installs in this step.

## Version and commit

The version command prints `2.0.245` (step 4), so the step version is
`2.0.246`. Set it in the three files. Commit, adding by name:
`ai/plans/README.md`, this plan folder's `PLAN.md`, `LOG.md` and
`steps/5-handover.md`, `app.json`, `package.json`. Message:

```
2.0.246 - docs(81): the refinements handed to the owner's dev build, Metro serving
```

## Merge

```
git checkout uat && git merge --no-ff docs/81-handover -m "2.0.246 - merge docs/81-handover: step 5, ticket 81"
```

## Finishing

Then run the executor Finishing: the records text from `PLAN.md` section 8
into `LOG.md`, the ticket set to `EXECUTED` in `ai/plans/README.md`, the
executed docs commit on branch `docs/executed-81-$(date +%Y-%m-%d)` at the
next free version (`2.0.247`, verify with the version command), plan files and
queue added by name, message
`<VERSION> - docs(plans): ticket 81 executed: the green-build refinements`,
merge `--no-ff`, no push, every scratch branch deleted.

## Done when

Metro answers 200, the LOG entries carry the ledger headings and session
lines, the ticket reads `EXECUTED`, the merges are on uat, and the tree is
clean. The owner's read of her dev build is the acceptance bar and arrives on
her schedule.
# LOG 111

## Planning (2026-10-16)

- Session opened on her go. Queue row 111 set PLANNING; row 116 (iPhone Duo)
  created by her order, NOT PLANNED.
- Fact pack verified and written into PLAN.md section 4: stable pins, RN
  0.88.0-rc.3 to 0.88.0 delta (11 commits), all four upstream PRs open
  (#50581, #51290, #51291, #51292), Babel 8 blocked (both presets on Babel 7),
  changelog items, patches inventory, Xcode 27.0 with iOS 27.0 SDK, XS connected,
  no Duo simulator runtime installed.
- The widgets patch carries a second, local-only feature (device-locale
  injection). UPSTREAM-PRS.md understates it; refresh planned.
- Next: scratch-worktree re-pin measurement, interview round 1, draft.
- Interview rounds 1 to 3: D111.5 Release-build-first XS loop; D111.6 locale hunk
  stays local; D111.7 enableRemoteNotifications false claimed; D111.8 rows 117,
  118, 119 created; D111.10 rows 120, 121 created. All NOT PLANNED, her go.
- Scratch measurement (worktree plan-111, uat 810010eb): install 62s, zero peer
  warnings, tsc 0 errors on the stable set with location+widgets pristine.
  Patch status on stable: background-task applies with warning (regenerate only);
  location rejects ONLY expo-module.config.json (Kotlin+Swift hunks clean);
  widgets rejects ONLY ExpoWidgetEmittableTree.kt (other four files clean).
  openApp's TS surface is app-owned (widgets/PrayerWidget.tsx:350), so tsc never
  depended on the widgets patch. Jest full suite running.
- Full draft written: PLAN.md sections 1 to 12, five step files, preflight and
  anchor scripts, 10 anchors each counting 1 at c15b06eb.
- Grill (one athan-plan-griller pass, cold): 8 musts, 5 shoulds, 1 nice.
  Applied: anchors run once at step 1 start via the full path and steps 2 to 5
  carry "None" with the reason; yarn 1 --frozen-lockfile replaces the Berry-only
  --immutable; the step 2 break script rewritten with a real checkout dance and
  true expected prints; the phantom devcheck prebuild step deleted from step 3
  (build-prod.zsh prebuilds itself); the Metro env re-verify now diffs entry-
  chunk md5s and greps the mock marker in named output dirs instead of the
  meaningless app.config bytes; step 4 gained `npx expo prebuild -p ios
  --no-install` before run:ios (expo run:ios never re-syncs an existing ios/
  folder, so enableRemoteNotifications would never have reached the XS build);
  the API key file named ($HOME/.config/athan/.api_key, never printed); checks
  7 and 8 gained R4.7 and R4.8 with the midnight wait bounded; step 5 targets
  README.md line 75 and the programme section 16 (the ai/AGENTS.md stack tables
  died in the owner's compaction at b2096c4a and stay gone); the preflight
  gained the behind-origin check and the annotation-tolerant status pattern.
  REJECTED on evidence: the claim that `NOTIFICATION: Refresh complete` does
  not exist - it sits at stores/notifications.ts:1813, verified by grep; the
  line stays, with `NOTIFICATION: Starting refreshNotifications` (:61) added as
  the second capture target.
- Gate: bash scripts/check-plan.sh -> PLAN OK; anchors-check.sh -> ANCHORS OK.
- Ticket set READY at 2.0.855.

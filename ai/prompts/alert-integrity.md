# Session 6: an alert always does what its bell shows (findings 80 to 82, and 79 if approved)

**Status: queued 2026-09-15 at the owner's request, after session 5 (`coverage-100.md`); the owner left the split
to the assistant. Finding 79 is in scope only if the owner approves it after session 5's explanation.** The four
findings are written up
under "Session 4 of the queue" in `ai/features/uat-2/AUDIT-FINDINGS.md`, with their probes in
`.claude/coverage-sweep/review-artifacts/` (local).

## The owner's rule, 2026-09-15

> If I, as a user, see that the alert is the bell icon with a slash, then I know I'm not going to get notifications.
> If I have the bell icon, then I'm going to get notifications. If I have the sound icon, then I'm going to get
> notifications. It's as simple as that. If I turn it off, I expect it to turn off.

- **Off:** no notification of any kind for that prayer. **Silent:** notifications, silent. **Sound:** notifications
  with sound. No exception, and never out of sync with what the bell shows.
- No error shown to the user for any of this; the app must simply work as intended.
- Rare cases still matter: "a lot of edge cases do happen in production when you have a lot of users."
- Waiting for "the next refresh" to heal a wrong state is not acceptable.
- Minimise every chance of an error, including finding 80's.

## The four findings

- **79:** when notifications are refused, the app offers to open the phone's notification settings. If that screen
  cannot be opened, or reading the permission afterwards fails, `ensurePermissions` never settles, so the bell tap does
  nothing. The permission is also read as the settings screen opens, not when the user comes back.
- **80:** during Ramadan, an exception in `sync()` on a warm launch leaves the splash over the error screen; a traced
  worse case in `stores/bootstrap.ts` could keep it there on every launch in the decoration window.
- **81 (Android):** switching a prayer Off when the OS refuses one cancel rolls the sheet back to on, while the prayer's
  other alarms and every reminder are already cancelled; the 12-hour gate stops them coming back on resume.
- **82 (Android):** one refused cancel rejects the reschedule and frees the scheduling lock while other prayers are
  still arming, so a later commit can leave an Off prayer armed until the next refresh.

## How to run it

- Session 5 explains 79 and 80 simply to the owner first; read those answers, and the owner's decision on 79, before
  starting.
- This is notification scheduling logic. Write the design first: every concurrent caller (launch sync, resume
  listener, background task, post-sync and post-paint refreshes, the alert sheet commit, midnight, a stalled network),
  the invariant "what fires always equals what the bell shows", and how a refused cancel is retried or recorded so the
  state converges without waiting for a refresh. Put it through an independent design review before building.
- One finding, one branch, 100% coverage of the change (the session 5 gate), red before green, a mutation pass, an
  independent Code Reviewer, and proof on the OnePlus 3T with a local production build.

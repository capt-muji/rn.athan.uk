# Session: find a way on iOS for each notification to replace the one before it

**Status: NOT STARTED. Queued by the owner on 2026-09-13 as session 7. Research first, and build
only what the owner chooses from what the research proves.**

## The ask

The same as session 6 (`replace-previous-notification.md`), on iOS: the newest notification the app
produces is the only one left showing. Session 1 argued from Apple's documentation that iOS may not
allow this for notifications scheduled on the phone. The owner does not accept that without proof:

> *"For iOS, you said it's not possible. I don't know if I believe you. So add it as a point for
> future sessions to investigate further."*

## Where session 1 stopped

- The app's notifications are local and scheduled days ahead, each under its own identifier
  (`device/notifications.ts:33-46`).
- Apple, on `UNNotificationRequest.identifier`: *"If you use the same identifier when scheduling a
  new notification, the system removes the previously scheduled notification with that identifier
  and replaces it with the new one."* It does not say whether that includes a notification already
  delivered. For remote notifications the identifier is the `apns-collapse-id`, which Apple
  documents as merging notifications into one. Item 1 below tests the local case.
- Apple documents app code running as a notification arrives in two places:
  `userNotificationCenter(_:willPresent:withCompletionHandler:)` while the app is in the foreground,
  and a notification service extension, which it documents for remote notifications.

None of that was tried on a device. Treat all of it as unproven.

## Investigate, and prove each answer on the iPhone XS

Read what the code and the documentation say, never memory: expo-notifications' iOS source through
the `opensrc` CLI, and Apple's and Expo's documentation through `docs-mcp-server` (`ai/AGENTS.md`,
AI Tooling), as the owner asked. That server is opencode-only, so in Claude Code read the same pages
with WebFetch, and record which was used. Then try each of these on the phone:

1. A request added under the identifier of a notification that has already been delivered: is the
   delivered one replaced, and does that need the app to be running?
2. A notification arriving while the app is in the foreground: can the handler expo-notifications
   runs then clear the earlier delivered ones?
3. Any extension, background task or system feature that can run at or near a local notification's
   delivery and clear the ones before it.
4. Grouping by `threadIdentifier`, and what it does to the stack the user has to clear.
5. Clearing delivered notifications whenever the app does run (launch, foreground, background
   refresh), and how close that gets to the ask.
6. Anything in the iOS version on the phone that the reading above missed.

## Deliverable

A finding that states what iOS can and cannot do, each point proven on the device, with the best
achievable behaviour and what it costs, for the owner to choose from. Nothing is built until the
owner chooses.

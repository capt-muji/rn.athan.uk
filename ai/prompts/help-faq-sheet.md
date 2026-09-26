# Help: one page that answers "why did I not hear the athan?"

Owner's instruction, 2026-09-27. Four separate causes of a silent phone have each been chased as their own
defect across several sessions (session 27 alone spent a whole session on two of them). Three of the four cannot
be fixed in code at all: they are OS settings only the user can change. So the app stops trying to fix them
silently and explains them instead, in one place the user can reach.

## Why this is the right shape

Session 27 established the boundary and the owner accepted it: `NotificationManagerService` gates channel sound
on ringer mode before it ever reads the channel, so no configuration sounds through the mute switch; and iOS
needs Critical Alerts, which Apple refuses for this category. A self-played audio path was investigated and
DECLINED, because it means two systems that must stay in sync across re-arm, reboot, force-stop and OEM kill,
and `ai/AGENTS.md` [2026-09-23] already records a user's 8T going silent from exactly that divergence.

That leaves telling the user. A support answer inside the app costs nothing at runtime and closes every one of
these as a "bug" report.

## Where it lives

- **Rename the Settings "About" card to "Other"** (`components/sheets/screens/Settings.tsx`, the card currently
  gated on `VISIBLE_WHATS_NEW`). Note the gate: today the whole card disappears on a silent release, and Help
  must NOT disappear with it, so the gate moves to the What's new row alone.
- **A Help row beneath What's new**, same row shape, with a `?` icon in place of the info icon.
- **It opens a second bottom sheet, not a popup.** Consistency decides this: the alert sheet and the sound sheet
  are both sheets opened from a sheet, and `Sound.tsx` already sets `stackBehavior='push'` for exactly this,
  presenting on top without dismissing the one beneath. A popup would be the only modal of its kind in the app,
  and the content is long enough to scroll, which a popup handles badly.

## What it must answer

Five questions, in this order, because it is the order of how often each one is the cause:

1. **Notifications are turned off for Athan.** The app's own permission. Deep-link to the app's notification
   settings; `Linking.openSettings()` is already used by `showSettingsDialog` in `hooks/useNotification.ts`.
2. **Background App Refresh / battery optimisation is off.** This is what keeps the rolling window rolling while
   the app is closed; without it the alarms stop being renewed. `ai/AGENTS.md` [2026-09-23] has the worked
   example of a user's 8T going silent this way for 18 app opens.
3. **The phone's silent switch is on.** Explain plainly that the OS mutes notification sound at the system
   level, before the app is consulted. Say what DOES still work: the alarm-stream channels mean Android still
   plays through the switch in most cases since 1.28.47, and every alert still vibrates and still appears.
4. **Do Not Disturb, or a Focus mode.** Different mechanism from the switch, and the two are constantly
   confused. Android needs the app added under Do Not Disturb access; iOS needs it allowed in the Focus's list.
   The Android grant screen can already be opened: `openDndAccessSettings` in `device/notifications.ts`.
5. **Why the athan is under 30 seconds.** The owner's specific request. Both platforms cap a notification sound
   at 30 seconds and silently fall back to the default tone above it, so every athan is trimmed to fit. This is
   a platform limit, not a choice, and it is the single most common "the athan is cut off" report. Evidence for
   the cap and the measuring trap is in `ai/AGENTS.md` [2026-09-09]: mp3-duration OVERCOUNTS by 50 to 70ms of
   encoder padding, so a file that measures 30.041s decodes to 29.975s and is fine.

## Rules for the writing

- The owner's writing style in `ai/AGENTS.md` section 8 applies to every word the user sees: no em dashes, no
  arrows, no exclamation marks, no emoji, short full sentences.
- Never blame the user and never blame the platform in a sulk. State what the setting does, then what to do.
- Each answer is short enough to read on a phone without scrolling past the question it answers.
- Where a deep link exists, the answer ends in a button that opens it. Where one does not, name the exact
  Settings path for that platform instead of describing it vaguely.

## Care

- **iOS and Android differ on every one of the five**, so the copy is platform-aware. Do not write one set of
  words and hope.
- **This page cannot lie.** Every claim in it was measured in session 27 or session 25; anything new it wants to
  say has to be measured first, on the 3T and the XS.
- Accessibility: the rows are buttons with labels, and the sheet is reachable by screen reader in the order it
  reads.
- `VISIBLE_WHATS_NEW` being null must not hide Help.

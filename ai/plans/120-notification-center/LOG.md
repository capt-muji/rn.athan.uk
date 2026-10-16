# LOG: ticket 120

## Planning (2026-10-16)

Anchors extracted and verified (each counts 1) at `d1ce39d9` (uat 2.0.924). Library facts
verified from the installed `node_modules/expo-notifications@58.1.5`: JS export
`src/index.ts:20`, iOS native route to `removeAllDeliveredNotifications`
(`PresentationModule.swift:19-21,37-39`), Android route to `cancelAll`
(`ExpoPresentationDelegate.kt:275-278`, the reason the iOS gate is mandatory). Jest project
name for the suite is `unit` (jest.config.js). The house fake-timer pattern sits in
`device/__tests__/notificationNativeTimeout.test.ts`. Lane 111's step-3 file
(`ai/plans/111-sdk58-stable-repin/steps/3-xs-loop.md`) supplied the iOS build-and-proof
vehicle: the env flags, the inline team, the throwaway launch, the unified-log delivery line.

Decisions D120.0 through D120.7 recorded in PLAN.md section 2.1. No open questions remain:
the frontier is empty.

## Ticket 120

### Step 01 — pending

session:

# Step 10: wave 3, the app tree, the device strings and the duration labels

The last non-widget surfaces: `app/**` screens, `device/qibla.ts`'s `Alert.alert` copy,
`hooks/usePrayerAgo.ts` display templates (now `t('time.now', {name})`,
`t('time.ago', {name, duration})` with byte-identical shapes), the update/error copy in
`device/updates.ts` and `components/ui/Error.tsx` if any remain, and `shared/time.ts`'s
duration unit labels. After this step the only display literals left in the tree are the
widget layouts' (step 13) and the catalog files'.

Requirements: R3.2, R5.1
Weight: 2

- Branch: `feat/38-10-wave3`
- Anchors: `ago-text` (post-step-06: the templates read `prayerLabel(prevPrayer.id)`),
  `plan-key` (post-step-06: keyed by `id`), `content-builders`, `reminder-content`
  (post-steps-06/07: the titles come from `t()`; only channel-name literals can remain)
- Files: `app/index.tsx`, `app/_layout.tsx` (the error-boundary strings), `device/qibla.ts`,
  `hooks/usePrayerAgo.ts`, `shared/time.ts`, `shared/notifications.ts` (if any display literal
  survived step 07 - the channel-name formats `Athan ${n}` and `'Extra Times'` become
  `t('channel.athan', {n})` and `t('channel.extras')`, byte-identical), `shared/i18n/en.ts`,
  and the suites: `__tests__/app/*`, `device/__tests__/qibla*`, `hooks/__tests__/usePrayerAgo.test.ts`,
  `shared/__tests__/time.test.ts`, `shared/__tests__/notifications.test.ts`
- The scanner's ROOTS grow: pass `widgets` as a second scan root for the census only (the
  guard still excludes `widgets/` until step 13, via the allowlist carrying `widgets/*` until
  then - the allowlist is the single source of what is left)

## `shared/time.ts` DurationLabels

`formatTime` and `formatTimeAgo` take an optional final parameter
`labels: DurationLabels = durationLabels()` where `DurationLabels = { h: string; m: string; s: string; now: string }`
and `durationLabels()` reads `t('duration.h')` (`'h'`), `t('duration.m')`, `t('duration.s')`,
`t('duration.now')` (`'now'`). The defaults reproduce today's exact output, so every existing
JSDoc-pinned test passes unchanged (deepseek-arch's design, adopted). The templates
`{name} now` and `{name} {duration} ago` in `usePrayerAgo` route through
`t('time.since', …)`/`t('time.now', …)` with interpolation.

## Red

1. Guard with `app/`, `device/`, `hooks/`, `shared/` files off the allowlist: fails listing
   them (the worklist).
2. `shared/__tests__/time.test.ts`: add `it('labels durations from the catalog')` -
   `formatTime(3725, { h: 'H', m: 'M', s: 'S', now: 'NOW' })` renders `'1H 1M 5S'`. Fails
   before (no parameter).

## Change

Same mechanical migration as wave 2, plus the DurationLabels contract above. The `Alert.alert`
copy in `device/qibla.ts` moves to `t()` with byte-identical buttons; no `Alert.alert` call
site changes its arity.

## Green

Guard green for every root except `widgets/`; app suites green with unchanged pins; tsc,
Biome clean.

## Break script

1. Hardcode `'Enable Location'` back in `device/qibla.ts`. Guard fails naming it. Restore.
2. Change `duration.h` to `'hour'`. The time suite's default-output pins fail. Restore.
3. Call `formatTime(0)` with a labels object missing `now` (type error forced with `as any`):
   the suite's type edge - this break instead drops the default parameter and calls bare
   `formatTime(60)`: the existing pin `'1m'` fails if the labels default was wired wrong.
   Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): app, device and hook surfaces through the catalog; duration labels`

## Review checklist

`app/_layout.tsx`'s error boundary still renders its exact strings in the fixture suite. No
template literal kept a display word it could interpolate. Shipped classes: Residue, Rule
(notification titles and channel names byte-identical - the pinned suites prove it).

## Done when

Guard green excluding widgets, wave-3 suites green, break `ALL AS EXPECTED: 1`, hook lines as
step 01, merged `--no-ff`.

## Restore

`git checkout --` each changed file; restore the allowlist.

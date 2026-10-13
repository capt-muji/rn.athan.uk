# Step 2: The section render — colours, dim colons, gaps

Requirements: R1.4, R1.5, R2.4, R3.1, R3.2, R3.3, R3.4, R3.5, R4.1, R4.2, R4.3, R4.4, R5.1
Weight: 2

## Anchor check

Save `scripts/preflight-72.sh` to `$TMPDIR` and run
`bash $TMPDIR/preflight-72.sh display-atom hero-render ago-render cascade-pair
derived-color hero-pin screen-pin` with the repository root as the working directory. These
are this step's anchors; a count other than 1 is a STOP.

## Goal

The hero countdown renders its string's sections as nested text nodes under the five
non-en locales — bright groups, dim zero groups, dim gapped colons — and keeps the exact
single-node render under `en` and for every string the splitters reject. The ago badge
renders its single colon as a gapped node under non-en and keeps the single-node render
under `en`. This step adds the section and gap tests on top of step 1's string rewrites.

## Branch

`git checkout -b feat/72-render uat`

## Files

- `components/countdown/Countdown.tsx` (change)
- `components/prayer/Ago.tsx` (change)
- `components/countdown/__tests__/Countdown.test.tsx` (the ar and section tests only)
- `components/prayer/__tests__/Ago.test.tsx` (the ar tests only)
- `__tests__/app/Screen.test.tsx` (no edit this step; it appears here because the step
  proves it green with the sources changed)

## Red tests

Step 1 already moved every `en` string rewrite into its own commit, so this step rewrites
one existing line and adds tests. Against the merged step 1 code the new section and gap
cases must fail (no section nodes, no gap node, no split exists yet); the held-display ar
case and the now-badge ar case are guard pins that pass at red and stay green.

`components/countdown/__tests__/Countdown.test.tsx`:

- Extend the `@/stores/ui` import with `showSecondsAtom`, add
  `import { COLORS } from '@/shared/constants';`, and define
  `const GAP_COLON = '\u2009:\u2009';` beside `MAGRIB`.
- The step 1 ar hero pin `screen.getByText('٠٢:٢٩')` is replaced by the section assertions
  below: retitle `it('counts down in native digits under ar')` to
  `renders fixed-width sections with gapped colons under ar` and replace that expectation
  line with four assertions:

```tsx
      expect(screen.getByText('٠٢')).toBeOnTheScreen();
      expect(screen.getByText('٢٩')).toBeOnTheScreen();
      expect(screen.getByText(GAP_COLON)).toBeOnTheScreen();
      expect(screen.queryByText('٢:٢٩')).toBeNull();
```

  At red this fails on `getByText('٠٢')`: the whole string renders as one node today.

- Add, inside the same describe:

```tsx
  it('renders three sections under ar while the seconds preference is on', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    getDefaultStore().set(showSecondsAtom, true);
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('٠٢')).toBeOnTheScreen();
      expect(screen.getAllByText(GAP_COLON)).toHaveLength(2);
    } finally {
      setActiveLocale('en');
      getDefaultStore().set(showSecondsAtom, false);
    }
  });

  it('renders the held display as one node under ar, with no sections', async () => {
    showLondonDay('2026-09-11', '21:00', { '2026-09-12': 'not stored' });
    setActiveLocale('ar');
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      expect(screen.getByText('--:--')).toBeOnTheScreen();
      expect(screen.queryByText(GAP_COLON)).toBeNull();
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders the colon nodes dim', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      startCountdowns();
      await render(<Countdown type={ScheduleType.Standard} />);

      const colon = screen.getByText(GAP_COLON);
      const style = Array.isArray(colon.props.style)
        ? Object.assign({}, ...colon.props.style)
        : colon.props.style;
      expect(style.color).toBe(COLORS.text.muted);
    } finally {
      setActiveLocale('en');
    }
  });
```

  The three-sections and colon-dim tests fail at red (`getByText('٠٢')` and
  `getByText(GAP_COLON)` find nothing). The held-display test passes at red and green: it
  pins the fall-through (R4.3).

`components/prayer/__tests__/Ago.test.tsx`:

- Add `import { setActiveLocale } from '@/shared/i18n/locale';` (the file has none today)
  and define `const GAP_COLON = '\u2009:\u2009';` beside `ASR`.
- Add, inside the first describe:

```tsx
  it('splits the duration colon with thin-space gaps under ar', async () => {
    showLondonDay('2026-09-11', '14:00');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText(GAP_COLON)).toBeOnTheScreen();
    } finally {
      setActiveLocale('en');
    }
  });

  it('renders the now badge as one node under ar, with no gap node', async () => {
    showLondonDay('2026-09-11', '13:02');
    setActiveLocale('ar');
    try {
      await render(<PrayerAgo type={ScheduleType.Standard} />);

      expect(screen.getByText('الآن', { exact: false })).toBeOnTheScreen();
      expect(screen.queryByText(GAP_COLON)).toBeNull();
    } finally {
      setActiveLocale('en');
    }
  });
```

  The gap test fails at red (no gap node exists); the now-badge test passes at red and
  green: `{name} الآن` carries no colon, so it pins the fall-through (R4.4).

Run, from the repository root:

```
npx jest components/countdown/__tests__/Countdown.test.tsx components/prayer/__tests__/Ago.test.tsx __tests__/app/Screen.test.tsx --watchman=false --selectProjects=components
```

Expected at red: the four section and gap cases fail with their `getByText` unable to find
the nodes, the held-display and now-badge cases pass, and no case outside this step's
additions fails. If a test the plan did not name fails, STOP.

## Change contracts

In `components/countdown/Countdown.tsx`:

1. Extend the animation import to
   `import { useDerivedColor, useDerivedProgress } from '@/hooks/useAnimation';`, extend
   the constants import with `ANIMATION`, and add
   `import { currentLocaleId } from '@/shared/i18n/locale';` and
   `import { splitColonSections } from '@/shared/time';`.
2. Above the default export, add:

```tsx
/** One digit group of the non-English timer: bright above zero, dim at 00 (row 72 rule 3) */
function CountdownSectionText({ text, dim }: { text: string; dim: boolean }) {
  const colorStyle = useDerivedColor(dim ? 0 : 1, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    duration: ANIMATION.durationSlow,
  });
  return <Text style={colorStyle}>{text}</Text>;
}
```

3. Inside the component, before the return, add
   `const sections = currentLocaleId() === 'en' ? null : splitColonSections(displayTime);`
4. Replace the `<Animated.Text style={[styles.countdown, animatedStyle]}>
   {displayTime}</Animated.Text>` element with:

```tsx
        {sections === null ? (
          <Animated.Text style={[styles.countdown, animatedStyle]}>{displayTime}</Animated.Text>
        ) : (
          <Animated.Text style={[styles.countdown, animatedStyle]}>
            {sections.map((section, index) =>
              section.colon ? (
                <Text key={`colon-${index}`} style={styles.countdownColon}>
                  {'\u2009:\u2009'}
                </Text>
              ) : (
                <CountdownSectionText key={`group-${index}`} text={section.text} dim={section.dim} />
              )
            )}
          </Animated.Text>
        )}
```

The `sections === null` branch is byte-identical to today's element (R1.4, R4.3).

5. Add to `styles`:

```ts
  countdownColon: {
    color: COLORS.text.muted,
  },
```

In `components/prayer/Ago.tsx`:

6. Extend the react-native import to `import { StyleSheet, Text } from 'react-native';`,
   and add `import { currentLocaleId } from '@/shared/i18n/locale';` and
   `import { splitSingleColon } from '@/shared/time';`.
7. Inside `PrayerAgoBadge`, before the return, add
   `const parts = currentLocaleId() === 'en' ? null : splitSingleColon(prayerAgo);`
8. Replace the `{prayerAgo}` child of the pill's `Animated.Text` with:

```tsx
      {parts === null ? (
        prayerAgo
      ) : (
        <>
          {parts[0]}
          <Text>{'\u2009:\u2009'}</Text>
          {parts[1]}
        </>
      )}
```

The pill's own styles, colour hooks and opacity hooks are untouched (R1.5 keeps the en
render byte-identical; R4.2 adds only the gap node under non-en).

What the contracts must never do: change the en branches' rendered element; introduce a
row or sibling layout for the timer; change a colour token, a fade duration or the pill's
styles; touch `hooks/useCountdown.ts`, `hooks/usePrayerAgo.ts` or the display atoms.

## Green run

The command from the red section, all passing, then `npx tsc --noEmit` and
`npx biome check . --error-on-warnings`, both exit 0.

## Break script

`bash scripts/break-step2.sh` from this folder, copied to `$TMPDIR` and run from the
repository root against the merged step. It recolours the timer's colon node bright and
empties the badge's gap node, runs the component suites, expects the named failures
(`renders the colon nodes dim` and `splits the duration colon with thin-space gaps under
ar`), restores both files, and ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it
in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add the four
changed files by name (`Screen.test.tsx` carries no diff this step) plus
`ai/plans/README.md` (status `IN PROGRESS, step 2`) and this folder's `PLAN.md` and
`LOG.md`. Message:

```
<VERSION> - feat(countdown): fixed-width sections, dim zero groups and gapped colons under non-en

Countdown.tsx renders the display string's sections as nested text nodes under the five
non-en locales: bright groups, dim zero groups, always-dim colons carrying the thin-space
gap; en and held strings keep the single-node render. Ago.tsx splits its single colon into
the gap node under non-en. R1.4, R1.5, R3.1-R3.5, R4.1-R4.4.
```

## Review checklist

- The diff touches only the files the Files list names plus plan and queue files.
- The `sections === null` and `parts === null` branches render exactly the prior elements.
- No style value changed outside the added `countdownColon`; the pill's styles are untouched.
- The section colour pair equals the cascade pair (`muted`/`primary`) with
  `ANIMATION.durationSlow`.
- Hooks sit only in `CountdownSectionText` and the existing hooks' sites; nothing new runs
  inside a map.

## Merge

`git checkout uat && git merge --no-ff feat/72-render -m "<VERSION> - merge feat/72-render:
step 2, section render"`. A conflict aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the step heading, commit sha, hook lines, break
line and `session:` line.

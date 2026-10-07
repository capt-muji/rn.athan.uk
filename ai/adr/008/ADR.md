# ADR-008: Multi-location expansion by scraping mosque websites

**Status:** Superseded. Never built.
**Current as of:** 2026-10-07 (1.29.265)

## What it decided (2026-02-16)

Serve any UK mosque's own timetable. A backend would find the nearest mosque from the phone's position, drive a browser agent to the mosque's prayer times page, extract the times with a language model, validate them and commit them to a public data repository that the app read through a CDN. The mosque's website was the only source, with no calculated fallback.

## What replaced it

1. ADR-009, written the same day, found that only prayer start times were wanted, not congregation times, so scraping was unnecessary.
2. The worldwide research of 2026-09-30 (queue row 42, awaiting owner decisions) recommends showing what a named authority published and never promising a mosque's own times. It measured nine central London mosques disagreeing by 26 minutes on Fajr.

## Where the current design is recorded

`ai/features/global-prayer-times/`: read `RESUME-FROM.md` first, then `RECOMMENDATION.md`. Nothing there depends on this ADR. The app itself still serves London only, from one API (`api/config.ts`).

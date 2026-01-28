# Prayer Ago Feature

## Overview

Add a visual component inside Countdown.tsx showing how long ago the previous prayer was.

## Format

- Under 60s: "Fajr now"
- Over 60s: "Fajr 1m ago", "Fajr 10h 15m ago"

## Requirements

- Single instance in Countdown.tsx
- Updates every 60 seconds (throttled)
- Uses react memo to prevent spam rerenders
- Calculate previous prayer (Fajr uses yesterday's last prayer)
- Inline component (no separate file)

## Success Criteria

- Prayer ago text displays correctly
- Format matches specification
- Updates every 60 seconds
- No visual glitches

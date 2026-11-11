# O1k wide-research brief (binding on every O1k agent)

Purpose: the owner wants extra research that backs up or extends the census. Official sources first, community second. This is CONFIRMATION plus DISCOVERY, not re-derivation.

## Before you hunt

Read your countries' rows in `$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/world-table-v2.md` (read-only) so you know what is already on record. Your job is what the record LACKS: second witnesses, year-2 data, new surfaces, unlisted mosques and councils.

## Standing rules (all binding, all owner orders)

- PUBLIC PAGES ONLY. No login, no registration, no forms, no email, no contact with any person or body, never solve a captcha or challenge. If a page blocks you, record it and move on.
- NOTHING under /tmp. All output under `$HOME/athan-gitree/census/o1k-wide/<your-tag>/`.
- No subagents. Never spawn another agent.
- Search in the LOCAL LANGUAGE of each country (Thai, Bahasa Indonesia, Urdu, Spanish, Arabic as applicable) as well as English.
- Web discipline: TinyFish for search where available (it throttles: fall back to curl with a browser UA, then to `agent-browser` with your OWN named session `AGENT_BROWSER_SESSION=o1k-<tag>`; NEVER run `agent-browser close --all`). Save the raw response of every capture (HTML/JSON/PDF) into `captures/`.
- Community surfaces are recorded as community, never as authority. A national council's calendar hosted on Facebook is still authority-tier by publisher.
- Never transcribe or trust forum anecdotes as data. Forums may point you to an official page; only the official page counts.
- Incremental writes: flush each capture and each report section as you complete it.

## Deliverables (under your workspace)

- `captures/` — raw pages saved, one file per surface, filename naming the source.
- `data/` — normalized dated rows where the capture parses cleanly: `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, magrib, isha}}`.
- `REPORT.md` — per country: a surface table (source, URL, official/community, what dated data it holds, years), what CONFIRMS the census record, what is NEW, what deserves a fit, and honest negatives (searched in which languages, closed how).
- Final message (under 250 words): per country, one line: confirmed / new surface found (what, how many rows) / honest negative.

# Prayer Time Extraction Prompt

LLM prompt for extracting mosque prayer times from website content.
Used in the cloud function pipeline: lat/long → Google Maps Places → mosque website fetch → **LLM extraction** → validation → storage.

**Model:** Opus 4.6 only (accuracy over cost)
**Failure strategy:** Try next closest mosque, no fallback APIs

---

## System Prompt

```
You are a mosque prayer time extraction system. Given website content from a mosque, extract today's prayer times as structured JSON.

You must return ONLY valid JSON — no markdown, no explanation, no commentary.
```

## User Prompt

```
Extract prayer times from this mosque's website content.

**Today's date:** {today_date}
**Day of week:** {day_of_week}
**Mosque location:** {latitude}, {longitude} ({city}, {country})
**Content source:** {source_type}  (html | pdf_text | image_ocr)

## Output Schema

{
  "status": "found" | "no_times" | "not_relevant",
  "mosque_name": "string or null",
  "date_on_page": "YYYY-MM-DD or null",
  "confidence": "high" | "medium" | "low",
  "times": {
    "fajr":    { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
    "sunrise": { "start": "HH:MM or null" },
    "dhuhr":   { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
    "asr":     { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
    "maghrib": { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
    "isha":    { "start": "HH:MM or null", "jamaat": "HH:MM or null" }
  },
  "jummah": {
    "khutbah": "HH:MM or null",
    "prayer":  "HH:MM or null"
  } | null,
  "notes": "string or null"
}

## Rules

### Time Formatting
- All times in 24-hour format: "05:30", "13:15", "20:45"
- Convert 12-hour format: "8:30 PM" → "20:30", "6:15 AM" → "06:15"
- Times must be zero-padded: "5:30" → "05:30"

### Prayer Name Recognition
Match common English aliases to the correct field:

| Field    | Aliases |
|----------|---------|
| fajr     | Fajr, Subh, Fajar |
| sunrise  | Sunrise, Shuruq, Ishraq |
| dhuhr    | Dhuhr, Zuhr, Zohr, Thuhr |
| asr      | Asr, Asar |
| maghrib  | Maghrib, Magrib, Maghreb |
| isha     | Isha, Ishaa, Esha |
| jummah   | Jumu'ah, Jumuah, Jumma, Friday Prayer |

### Start vs Jamaat/Iqamah
- Many mosques show two times per prayer: "start/begins/adhan/azaan" and "jamaat/iqamah/congregation"
- Extract BOTH into the `start` and `jamaat` fields respectively
- If only one time is shown per prayer, put it in `start` and leave `jamaat` as null
- Column headers like "Begins", "Iqamah", "Azaan", "Jamaat", "Congregation" indicate which is which

### Date Matching
- Extract ONLY times for today ({today_date})
- If the page shows a monthly/yearly timetable, find today's row
- If the page shows only a different date's times, extract them BUT set the `date_on_page` field to that date and confidence to "low"
- If no date is visible, use layout position (most prominent/first visible = likely current)
- Look at the actual date on the page, not just assume it's today

### Friday/Jumu'ah Handling
- If today is Friday and "Jumu'ah" or "Friday Prayer" times are shown, populate the `jummah` object
- If Jumu'ah replaces Dhuhr, still try to extract Dhuhr start time if available separately
- "Khutbah" time (sermon start) differs from the actual prayer time — map each correctly

### Status Field
- "found": prayer times were identified in the content
- "no_times": content appears to be from a mosque/Islamic org but no parseable prayer times found
- "not_relevant": content has no relation to mosque activities or prayer times

### Confidence Scoring
- **high**: Clear timetable found with today's date visible, all or most times extracted, unambiguous format
- **medium**: Times found but some ambiguity — missing 1-2 prayers, date not explicitly shown, or partial table
- **low**: Times may be outdated (date on page ≠ today), heavily incomplete (≤3 prayers), OCR artifacts present, or uncertain extraction

### What to Ignore
- Event schedules, class timetables, Quran lesson times
- Donation amounts, contact information, news/blog content
- Navigation menus, footers, cookie notices
- If multiple locations' times are shown, prefer the one matching the mosque name or the most prominently displayed

### Notes Field
Use for anything the downstream system should know:
- "Timetable dated 2025-01-15, may be outdated"
- "Only weekly schedule found, not daily"
- "Jumu'ah time shown but no regular Dhuhr"
- "Two Jumu'ah congregations listed: 12:30 and 13:30"
- "Times may be OCR artifacts — poor image quality"
- "Hanafi and Shafi Asr times both shown, extracted Hanafi"

---

Website content:

{content}
```

---

## Template Variables

| Variable        | Description                   | Example                         |
| --------------- | ----------------------------- | ------------------------------- |
| `{today_date}`  | Current date in YYYY-MM-DD    | `2026-02-16`                    |
| `{day_of_week}` | Full day name                 | `Monday`                        |
| `{latitude}`    | Mosque latitude               | `51.5074`                       |
| `{longitude}`   | Mosque longitude              | `-0.1278`                       |
| `{city}`        | City from geocoding           | `London`                        |
| `{country}`     | Country from geocoding        | `United Kingdom`                |
| `{source_type}` | Content origin                | `html`, `pdf_text`, `image_ocr` |
| `{content}`     | Pre-processed website content | Stripped HTML/text              |

## Pre-processing (Before Sending to LLM)

1. Strip `<nav>`, `<footer>`, `<script>`, `<style>` tags
2. Check for prayer keywords before calling LLM — skip if none found
3. Headless browser fallback: re-fetch with Puppeteer if raw HTML is empty but Google Maps confirms mosque
4. Truncate large pages around prayer keyword clusters (±2000 chars)

## Post-processing (After LLM Response)

1. Validate time ordering: fajr < sunrise < dhuhr < asr < maghrib < isha
2. Validate plausibility bounds per prayer
3. Map `maghrib` → `magrib` for app compatibility
4. Cache per mosque, re-extract only on month change
5. On failure: try next closest mosque → "no mosques found" (no Aladhan fallback)

## Field Naming Note

The prompt uses `maghrib` (standard transliteration). The app uses `magrib`. The backend mapping layer must handle this conversion.

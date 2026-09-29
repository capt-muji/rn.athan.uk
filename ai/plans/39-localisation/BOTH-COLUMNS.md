# Keeping both columns: the measurement that changes the answer

🐋  "I really, really, really do want to have both column names, the English and the second
language, like we currently do with the English and Arabic. I just don't know what the best way to
do it is. If a name isn't long enough, do we shrink it? Is there a way to detect if either of the
two names is broken onto separate lines? Then does that mean we reduce the text size? But if we
reduce the text size of one row, the other rows will be unequal, and the font size won't equal the
font size of the time. So then do we reduce the font size of the time? Also the overlay, etc."

Every one of those worries is correct as a chain of consequences. The good news is that the chain
never starts, because the premise it rests on was my own measurement error.

---

## The error: the 123pt budget was the wrong test

I measured whether the FIRST column fits 123pt. That is not the constraint. The row is:

```
[pad 20] [FIRST name] [flexible gap] [SECOND name] [time 45] [bell 20] [pad 20]
```

The second column is `flex: 1`, so it **absorbs the slack**. There is no fixed share the first
column must fit inside. The real question is whether the whole row exceeds the screen.

Fixed overhead is 129pt (two pads, the bell, the gap, and `23:59` at 45pt). The Arabic column needs
46pt for the standard names and 68pt for the extras.

## Re-measured properly: both columns, 12 locales, both schedules

| Locale | Standard total | Extras total | 320dp | 360dp | 393dp |
| --- | --- | --- | --- | --- | --- |
| English | 235pt | 277pt | fits | fits | fits |
| Arabic | 175pt | 197pt | fits | fits | fits |
| Indonesian | 241pt | **317pt** | fits | fits | fits |
| Urdu | 245pt | 272pt | fits | fits | fits |
| Bengali | 227pt | 294pt | fits | fits | fits |
| Turkish | 231pt | 290pt | fits | fits | fits |
| French | 290pt | **329pt** | **+9pt** | fits | fits |
| German | 301pt | 308pt | fits | fits | fits |
| Persian | 245pt | 294pt | fits | fits | fits |
| Hindi | 224pt | 312pt | fits | fits | fits |
| Swahili | 255pt | **421pt** | +101 | +61 | +28 |
| Malay | 241pt | **377pt** | +57 | +17 | fits |

**21 of 24 combinations fit on the smallest phone. 23 of 24 fit on a normal one.**

The three that overflow are all the extras column, and two of them (Swahili, Malay) are not in the
launch set. **The only launch-set overflow is French extras, by 9pt, on a 320dp screen alone.**

So the answer to the owner's question is: **keep both columns, change nothing structural.** The
feature the owner really wants is already affordable.

---

## The owner's mechanical questions, answered in order

### "If a name isn't long enough, do we shrink it?"

No. Shrinking is the last resort and it is not needed for the launch set.

### "Is there a way to detect if either name is broken onto separate lines?"

Yes, and the app already has the machinery. `onTextLayout` reports `nativeEvent.lines`, so
`lines.length > 1` is the exact detection. `components/ui/InitialWidthMeasurement.tsx` already
mounts invisible Text nodes and reads `onLayout`, so the pattern exists.

But detection at RUNTIME is the wrong place for it. Detecting a wrap on a user's phone means the
bad layout already shipped. The same measurement belongs in **CI**, where a test measures every
locale's names against every supported screen width and fails the build. That is the width guard,
and it turns a runtime problem into a build-time one.

### "If we reduce the text size of one row, the other rows will be unequal"

Correct, and this is the decisive objection. `adjustsFontSizeToFit` shrinks **per Text node**, so
one long name would render at 15pt while its neighbours sit at 18pt. A prayer list with five rows
at one size and one at another looks broken rather than adaptive.

**So per-row shrinking is rejected**, on the owner's own reasoning.

### "The font size won't equal the font size of the time. So do we reduce the font size of the time?"

This is the chain that makes shrinking untenable, and the owner followed it correctly. Confirmed in
the code: `Prayer.tsx:108` and `Time.tsx:69` both set `fontSize: TEXT.size`. They are the same
size by construction, and a name at 15pt beside a time at 18pt would be visibly wrong.

Following the chain honestly: shrink the name, so shrink the time to match, so shrink the second
name, so the whole row is smaller than the rows above it, so shrink every row, so the whole list
shrinks for one long word in one language. That is a bad trade and it is why the answer is not
shrinking.

**If a size change is ever needed, it is PER LOCALE and applies to the whole list**, not per row.
One constant in the locale's catalog, every row and every time at that size, so the list stays
internally consistent. That keeps the owner's "all rows equal" rule intact.

### "Also the overlay, etc."

Right to raise it. The overlay draws the same names much larger and positions the explanation box
from measured absolute coordinates, which is the machinery row 36 exercised. A per-row font change
would desynchronise the overlay's measurements from the list's.

A per-locale size does not, because the overlay reads the same constant. This is another argument
for per-locale over per-row.

---

## The recommendation

**Four layers, and the launch set never reaches layer 2.**

| Layer | What | When it applies |
| --- | --- | --- |
| 1 | Source a terser term from the authority's own timetable | A term genuinely overflows |
| 2 | Per-locale font size, whole list and time together | No correct short term exists |
| 3 | Hide the second name for that locale by default | The pair cannot fit at any reasonable size |
| 4 | Two-line row for that locale | Never, without the owner |

Layer 1 covers French: `Minuit` is 50pt against `Minuit islamique` at 132pt, and it is correct
French for midnight. That resolves the only launch-set overflow.

Layers 2 and 3 exist for Swahili and Malay when they ship. Layer 4 changes `STYLES.prayer.height`
and the overlay anchors, so it is owner territory.

## The guard that makes this safe

A test, running in CI, that for every shipped locale and every supported screen width asserts:

```
firstColumn + secondColumn + 129pt <= screenWidth
```

Failing with the locale, the schedule, the term, the width and the overage. Three properties make
it the right guard:

- It catches the problem at build time, never on a user's phone.
- It tests the PAIR, which is what the owner wants to keep, rather than one column in isolation.
- When a 21st language is added by someone who has not read any of this, the build tells them
  exactly which term to shorten and by how much.

## What this settles

The owner can have both columns, on every launch locale, at one font size, with no per-row
shrinking, no two-line rows, and no changes to the overlay. The earlier width alarm was real for
the first column in isolation and does not survive measuring the row as it is actually laid out.

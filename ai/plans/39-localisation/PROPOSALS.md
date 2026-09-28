# Proposals for the owner

Everything here is a recommendation with its reasoning and its cost. Nothing here was built. The
owner asked for proposals at the end rather than questions during the work:

🐋  "Brainstorm with yourself and propose me ideas at the very end after your assumptions."

🐋  "If you have other alternatives, just tell me, don't implement them."

Read P1 first. The rest follow from it.

---

## P1. The two-language deadlock: two settings, not one

### The problem in one line

One setting is being asked to do two unrelated jobs, which is why every configuration collides.

### The proposal

| Setting | Controls | Default |
| --- | --- | --- |
| **App language** | Settings, every sheet, every modal, Help, What's New, notification copy, widget chrome | From the device locale, falling back to English |
| **Prayer names** | The prayer list's name columns and the explanation text | Primary follows the app language; secondary is Arabic, and can be turned off |

Two independent settings make every configuration the owner listed expressible, and none of them
collide:

| User | App language | Prayer names | What they see |
| --- | --- | --- | --- |
| English speaker, London (today's default) | English | English + Arabic | Exactly what ships now. Nothing changes on upgrade |
| Arabic speaker | Arabic | Arabic + off | One Arabic name, Arabic interface, Arabic notifications |
| Indonesian who wants Arabic names | Indonesian | Indonesian + Arabic | "Subuh" then "الفجر", Indonesian interface |
| Turkish, no second name | Turkish | Turkish + off | "İmsak" alone, Turkish interface |
| English speaker who likes Arabic names | English | English + Arabic | English notifications, Arabic second column. **This is the configuration the one-setting model made unreachable** |

That last row is the owner's own objection, and it is the proof the split is right: under one
setting, choosing Arabic names forced Arabic notifications on an English speaker.

### The naming

The owner proposed "primary language / secondary language". I recommend against it, for one
concrete reason: it describes the two NAME SLOTS, not the two SETTINGS, so it cannot name the app
language at all. It is also used by other apps for fallback ordering, which is a different concept.

Recommended labels, which say what they do:

- **App language** with the current language's endonym as the value, in the settings sheet.
- **Prayer names** as a second row, showing the current pair, opening its own screen with the
  primary and secondary choices inside it.

Wikipedia's app uses exactly this split ("App language" versus "Wikipedia languages"), and it is
the vocabulary the industry has converged on. R7 is surveying this and may sharpen it.

### Migration, which is non-negotiable

An existing user has `preference_show_arabic_names` set true or false. On upgrade:

- App language: whatever the device locale negotiates, which for the existing base is English.
- Prayer names primary: English. Secondary: Arabic, shown if the old toggle was true, hidden if
  false.

So nobody's app changes appearance on upgrade. A silent visual change is a defect, and this repo
already has the `migrate(oldKey, newKey, atom)` helper for exactly this
(`stores/notifications.ts:575`).

### Rejected alternatives

| Alternative | Why not |
| --- | --- |
| One setting, as originally framed | The deadlock. Some configurations are unreachable |
| Three settings (interface, primary name, secondary name) | Honest but it reads as a form. The two name slots belong together on one screen |
| Follow the OS language only, no in-app picker (R5's recommendation) | The floor device is Android 9, which has no per-app language screen, so those users could only change the app by changing the whole phone. It also hides the setting from a user who cannot read the OS language |

---

## P2. The first column: does it follow the app language?

This is the sharpest open question and the one where I am least confident I have read the owner
correctly.

His words were:

🐋  "The English prayer names, they will stay. On the prayer list itself, only the Arabic names will
change to what the user has selected."

That can be read two ways.

**Reading A, literal: the first column is always English, forever.** An Indonesian user sees
"Fajr" then whatever they chose. Simple, and it matches the sentence exactly.

**Reading B: the first column is the app's language, which today is English.** An Indonesian user
sees "Subuh" then "الفجر".

**I recommend B**, and I have built the plan for B, for three reasons:

1. An Indonesian user with an Indonesian interface seeing an English prayer name is the app leaking
   an implementation detail. The English name is the internal identifier, and identifiers should
   not be visible.
2. Muslim-majority languages mostly keep the Arabic loanword anyway, so for the launch set the
   visible difference is small: Indonesian "Subuh", Turkish "İmsak", Urdu "فجر". It is not a
   dramatic change.
3. Under reading A, an Arabic user would see "Fajr الفجر", English first, in an app that is
   otherwise entirely Arabic. That is hard to defend.

**But reading A is cheaper and lower risk**, and if the owner meant it literally, the plan changes
in exactly one place: the first slot is pinned to English instead of following the app language.
Everything else stands.

---

## P3. Notifications: one language, and it is the app language

### The recommendation

A notification reads entirely in the **app language**. "الفجر الآن" for an Arabic user, "Subuh
sekarang" for an Indonesian one.

Not the prayer-name setting, because a notification contains interface copy ("now", "in 5m") as
well as a name, and interface copy belongs to the interface language.

### Why not bilingual

The owner raised this and suspected it himself:

🐋  "Maybe we just include both languages in the notification. I don't know, but that can become
really messy real quick."

The measurements say he was right:

- iOS draws a **"Time Sensitive" label** above the notification that the app cannot hide while
  keeping the interruption level. Session 27 fought to get that level, so giving it up is not an
  option.
- The app ships **title only, no body**, deliberately, recorded twice in `shared/notifications.ts`.
- So the whole budget is one short line under a system label. "Fajr / الفجر now" truncates on a
  narrow phone, and truncation loses the end of the string.

The one real merit is a household where two people read different languages off the same phone.
That is a genuine case, and the honest answer is that the phone has one owner and one language
setting, so it is out of scope.

### The cost, stated plainly

Because notification copy is frozen at schedule time on both platforms (verified in the
`expo-notifications` Swift source), a language change must re-arm the whole plan, up to 64 requests.

The good news is that this is cheaper than it sounds:
- No cancel pass is needed. Identifiers are deterministic, so a reschedule replaces in place.
- The repo already has the exact pattern in `commitSoundSelection`, which changes a value baked
  into every armed request and re-arms under `withSchedulingLock` with a rollback.
- Android channel names can be renamed in place, so no new channel ids and nobody's hand-tuned
  channel settings are lost.

---

## P4. The RTL alternatives, reported and not built

The owner ruled the layout never mirrors, and asked for alternatives to be reported anyway. Here
they are, cheapest first.

### What I have built the plan to do, which is his ruling plus one refinement

Pin the layout LTR. Never mirror. **But align RTL text to the right inside its LTR box**, which is
what the app's Arabic second column already does today (`flex: 1, textAlign: 'right'`).

This is a refinement of his ruling rather than a departure from it, and I want to be clear about
why I did not simply take "left align everything" literally:

- R3 found named precedent: **Bluesky filed and fixed exactly this rendering as a bug** in July
  2026. Reddit users describe left-aligned Arabic as "very hard to read". Material Design 3 says
  applying LTR directionality to RTL content "can create cognitive overload and negatively impact
  user sentiment and trust".
- The severity is not uniform. A single-word prayer name left-aligned is mild. The **multi-line
  Arabic explanation text** the app already ships is the bad case, and `shared/help.ts` is about to
  add 27 more strings of the longest prose in the app.
- It costs nothing. The boxes stay LTR, the 63 directional style props stay untouched, and the
  30 absolute-positioning call sites are not involved.

So the owner gets the layout simplicity he wanted, and the first column behaves like the second
column already does.

### The alternatives, and what each would cost

| Option | What it is | Cost | Verdict |
| --- | --- | --- | --- |
| **Full mirroring** (`I18nManager.forceRTL`) | The whole layout flips for RTL languages | Under Fabric, direction is a **launch-time constant**, so the app must RESTART on every language change. Plus a sweep of 63 directional props, 32 absolute views and 30 measurement sites, including the overlay and explanation box that row 36 exercised | **Not recommended.** The owner's instinct was right, and the cost is worse than he assumed |
| **Per-subtree `direction: 'rtl'`** | Flip only specific containers | Real and supported. Lets the explanation overlay and Help modal read correctly without touching the prayer list | **Recommended for the prose surfaces only**, which is what the plan does |
| **Mirror later, behind a flag** | Ship LTR now, add mirroring as an opt-in | The repo has a flag pattern (`shared/flags.ts`) | Possible, but it doubles the layout surface to test forever |

### The one thing that cannot be avoided either way

The Unicode bidirectional algorithm runs inside every `Text` node regardless of layout direction.
`الفجر 05:42` puts the time on the wrong side; a trailing colon lands where an Arabic reader
starts. The fix is string-level: wrap RTL content in isolate characters (`U+2067`, `U+2069`). This
is required under the owner's ruling, under full mirroring, and under every option in the table.

---

## P5. Smaller proposals

| # | Proposal | Reason |
| --- | --- | --- |
| P5.1 | Use Material Symbols `translate` (Apache 2.0), not the Google Translate glyph | Google's brand guidance forbids imitating its product icons. The owner's own alternative suggestion was a globe, which is also safe |
| P5.2 | Rename `showArabicNamesAtom` and the `arabic` field on `PrayerRow` | They are named for a language that will not always be there. Migrate the storage key so no preference is lost |
| P5.3 | Make the Arabic-Indic digit mapping locale-driven | The Maghreb and UAE use Western digits per CLDR. The app maps unconditionally today, which is already wrong for those users |
| P5.4 | Localise month names, but keep the date FORMAT | Row 39 says dates are not touched, which I read as a format ruling. An English month name inside an Arabic interface looks broken. **Lowest-confidence assumption in the session**, flagged as A9 |
| P5.5 | Add a "report a translation mistake" row | The only review that scales for a solo owner who speaks none of the languages. Al-Azan and Mihrab both run translation fixes from GitHub issues at this scale |
| P5.6 | Ship 8 languages at launch, not 20 | R4's set, ranked by Muslim-population overlap: `en ar id ur bn tr fr de`. The architecture supports unlimited; the launch set is a separate decision, and 8 is the size where the picker needs no search field |
| P5.7 | Author shorter names where a language allows it | Swahili's "Theluthi ya Mwisho ya Usiku" is 2.83x the English width and takes 71% of a small phone's row. The catalog is authored, so this is a data fix rather than a layout fix |

---

## P6. What I would do differently if starting over

One honest note. The biggest risk in this feature is not translation and not RTL. It is that
**the English prayer name is a load-bearing identifier** in 27 storage keys, 67 audio filenames,
the notification ids and the display order, and every failure from translating it is silent.

If that split is done first, in the cheap scaffolding row, everything after it is ordinary work. If
it is done after catalogs exist, it becomes a storage migration of every user's preferences.

That is why the plan puts it in row 38 rather than row 39, and why I would treat row 38 as the
careful one rather than the quick one.

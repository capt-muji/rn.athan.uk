# One language or two? The owner's open question, answered honestly

🐋  "I'm honestly still not sure how to handle notifications, having two settings, because I want to
make it as simple as possible for the user. I don't want multiple settings. It's really against my
workflow, the simplicity. I love customisation. But do people really need 2 languages? Maybe we
should enforce. No, I don't know. Just thoughts. Still open questions about whether to have one
language in general or to support two languages."

This is the right question and it deserves a straight answer rather than a defence of the earlier
recommendation. The recommendation was correct about the MECHANISM and possibly wrong about the
SETTINGS COUNT, which are separable.

## First, the part that is not negotiable

**The bilingual ROW is the app's identity and should not be lost.** Every prayer row today shows
the English name and the Arabic name, and a London mosque board does the same thing. That is not a
customisation feature, it is what the app looks like.

So the question is not "one language or two languages". It is:

> Does the user need a SETTING to control the second one, or can the app decide?

That reframing is what makes the simple answer available.

## The proposal: ONE setting, and the second name follows automatically

| Setting | Values | What the user sees |
| --- | --- | --- |
| **App language** | Any shipped language | Everything: chrome, notifications, widgets, and the prayer row's first name |

And the second name is **derived, not chosen**:

```
second name = Arabic, unless the app language IS Arabic, in which case none
```

That is the whole rule. It produces the right answer for every real user:

| App language | Row reads | Correct? |
| --- | --- | --- |
| English | Fajr, الفجر | Exactly today's app |
| Indonesian | Subuh, الفجر | The mosque-board pairing, local name plus liturgical Arabic |
| Turkish | İmsak, الفجر | Same |
| Arabic | الفجر | One name, no duplicate |

**One setting. No second picker. No deadlock**, because notifications follow the only language
there is.

## Why Arabic is the right constant, and not a compromise

The second column is not "a second language the user might like". It is **the liturgical name**.
Every Muslim, in every country, prays using Arabic terms, and the Arabic name is the one that is
the same on every mosque board on earth. It is the thing the local name is a rendering OF.

So pinning it to Arabic is not a limitation. It is what the column is FOR. Making it selectable
implies it is a preference, which is what created the owner's deadlock in the first place.

## What this costs, stated honestly

Three users lose something, and all three are edge cases:

1. **A user who wants the second name OFF.** Today that toggle exists
   (`preference_show_arabic_names`). Removing it is a regression for whoever uses it.
2. **A user who wants a second name that is not Arabic.** For example an Indonesian who wants
   English alongside. Real, but rare, and not a case any comparator supports either.
3. **A user who wants their interface in English and the prayer names in Indonesian.** Under one
   setting that is unreachable.

Case 1 is the only one worth keeping, and it costs a toggle rather than a picker:

| Control | Type |
| --- | --- |
| App language | Picker, opens a sheet |
| Show Arabic names | **Toggle, which already exists today** |

That is **one new control**, not two. The toggle is already in the Display card and already has its
storage key, so the migration is nothing: existing users keep their current value.

## The comparison, so the owner can see the trade

| | Two pickers (earlier proposal) | One picker plus the existing toggle (this) |
| --- | --- | --- |
| New controls | 2 | **1** |
| Settings the user must understand | 2 | 1, plus a toggle they already have |
| Deadlock possible | No | No |
| Today's default preserved | Yes | Yes |
| Migration | New atom, new key, migrate the old toggle | **Nothing. The toggle stays as it is** |
| Indonesian with Arabic names | Yes | Yes, automatically |
| English interface with Indonesian names | Yes | **No** |
| Second name in a third language | Yes | **No** |
| Implementation | A second picker, a None value, a duplicate guard | A derived value |

The two rows this loses are the two nobody has asked for, including the owner.

## The recommendation, changed

**Ship one picker and keep the existing toggle.** The earlier two-setting proposal solved the
deadlock correctly but bought flexibility the owner does not want and users will not use. The
owner's instinct here is better than my recommendation was.

The deadlock is still solved, because the cause was never the count of settings. It was that ONE
setting was driving both the interface and the notifications through an unrelated display choice.
Deriving the second name removes that coupling just as cleanly as splitting the setting did, and it
removes a control instead of adding one.

## What this does NOT change

Everything structural stands, because none of it depended on the settings count:

- The English name stays the domain identifier (27 storage keys, 67 audio files).
- Notification copy follows the app language, one language, no bilingual titles.
- The re-arm on language change, with deterministic identifiers and in-place channel renames.
- The width budget, D15's transliteration rule and D16's one-word rule.
- The RTL policy and the bidi isolates.

Only the settings surface changes, and it gets smaller.

## The one thing to decide later, not now

If the owner ever wants case 3 (interface in one language, prayer names in another), the second
picker can be added without breaking anything: the derived value becomes a stored value with the
same default. So this is a reversible simplification rather than a door closing.

That is the strongest argument for shipping the simple version first: it is the cheaper half of the
same design, and the expensive half can arrive later if users ask for it. They probably will not.

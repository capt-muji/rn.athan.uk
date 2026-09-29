# Which 20 languages, and what goes in the file

Three questions from the owner, 2026-09-29. Answered with the data already sourced.

🐋  "We want 25 languages perhaps, what is 2520? Find the 20 most spoken languages in the world,
maybe those are the ones we should cover. Should we hard code them, fix them, because 20 is good
and it will cover the whole world, right?"

🐋  "Should we have a fixed adjacent file of 20 languages with a translation or transliteration of
every single object? But I feel like that's the wrong approach. What will we be covering in that
file? Just the 3, midnight sunrise and last third? Or the entire app, the settings, the list,
everything?"

---

## Question 1: is "the top 20 most spoken" the right list?

**No, and the data says so clearly.** The global ranking and this app's actual audience overlap by
roughly half.

Ethnologue 2026's top 20 by total speakers, against what R6 already sourced:

| # | Language | Total (M) | Sourced? |
| --- | --- | --- | --- |
| 1 | English | 1,493 | yes |
| 2 | Mandarin Chinese | 1,183 | yes |
| 3 | Hindi | 611 | yes |
| 4 | Spanish | 561 | yes |
| 5 | Arabic (MSA) | 335 | yes |
| 6 | French | 334 | yes |
| 7 | Bengali | 274 | yes |
| 8 | **Portuguese** | 269 | no |
| 9 | Indonesian | 255 | yes |
| 10 | Urdu | 246 | yes |
| 11 | Russian | 210 | yes |
| 12 | German | 133 | yes |
| 13 | **Japanese** | 126 | no |
| 14 | **Nigerian Pidgin** | 121 | no |
| 15 | **Egyptian Arabic** | 118 | no (covered by `ar`) |
| 16 | **Marathi** | 99 | no |
| 17 | **Vietnamese** | 97 | no |
| 18 | **Telugu** | 96 | no |
| 19 | Swahili | 95 | yes |
| 20 | Hausa | 94 | yes |
| 20= | Turkish | 94 | yes |

Now the same exercise ranked by **Muslim population reachable** (Pew 2025):

| Language | Muslims (M) | Anchor |
| --- | --- | --- |
| Arabic | 400+ | Egypt, Algeria, Iraq, Sudan, Morocco, Saudi, Yemen |
| Urdu | 280 | Pakistan 233M, plus India and the UK diaspora |
| Indonesian | 218 | Indonesia, 249.8M Muslims, the largest on earth |
| Hindi | 200 | India, 200M Muslims |
| Bengali | 160 | Bangladesh 150.8M |
| Persian | 110 | Iran 85.7M, Afghanistan |
| Turkish | 85 | Turkey 81.2M, Germany 5.6M |
| Hausa | 70 | Northern Nigeria, Niger |
| Pashto | 50 | Afghanistan, Pakistan KPK |
| Swahili, Kurdish | 30 each | East Africa; Turkey, Iran, Iraq |
| Uzbek | 27 | Uzbekistan |
| Malay | 25 | Malaysia, Brunei, Singapore |
| Somali, Russian | 20 each | Horn of Africa and the UK diaspora; Central Asia |
| Azerbaijani | 15 | Azerbaijan, northern Iran |
| Tamil, Malayalam | 10 each | Sri Lanka, Singapore; Kerala and the Gulf |

**The two lists disagree on ten of twenty.**

- In the global top 20 but NOT the Muslim one: Portuguese, Japanese, Nigerian Pidgin, Egyptian
  Arabic, Marathi, Vietnamese, Telugu, Spanish, German, Mandarin.
- In the Muslim top 20 but NOT the global one: Persian, Pashto, Malay, Uzbek, Somali, Kurdish,
  Azerbaijani, Tamil, Malayalam.

**Persian is the clearest case.** It is not in the global top 20, and it reaches 110M Muslims,
more than Turkish. Shipping Japanese before Persian would be a mistake for a prayer app.

### The recommendation

Ship a set weighted to the audience, not the globe. R6 already sourced **28 locales**, which is more
than 20, so this is a matter of choosing rather than researching:

**The 20:** `ar ur id hi bn fa tr ha ps sw ku uz ms so ru az ta ml en fr`

That is the Muslim-reach ranking with English (the current app, and the fallback) included. Every
one of the 20 is already sourced with all six daily prayer names complete.

The eight R6 sourced beyond that (`de es nl sq bs th zh-Hans zh-Hant`) stay in the file as data.
They cost nothing to keep and they are there when wanted.

---

## Question 2: hard code 20, or keep it open?

🐋  "Should we hard code them, fix them, because 20 is good and it will cover the whole world?"

**Fix the SHIPPED LIST at 20. Never fix the ARCHITECTURE at 20.** Those are different decisions and
only the first one should be made now.

| | Fixed shipped list | Fixed architecture |
| --- | --- | --- |
| What it means | Exactly 20 locales in the picker today | The code can only ever hold 20 |
| Cost of adding a 21st | Add a catalog file, one line in a list | A refactor |
| Recommendation | **Yes, do this** | **No, never do this** |

The architecture is already a map from locale tag to catalog, so "unlimited" is the default and
capping it would be extra work for a worse result. The owner's own instruction from the start still
holds: adding a language is a data decision, not a code change.

So: 20 in the picker, 28 in the file, and the 21st is a pull request rather than a project.

---

## Question 3: what goes in the file? The whole app, or just the three?

🐋  "Will we have just a translation for these 3, midnight sunrise and last third? Or will it be
translation for the entire app, the settings, the list, everything?"

**The entire app. And the owner's instinct that a single giant file is "the wrong approach" is
correct, which is why it is not one file.**

Here is what is actually being translated, measured:

| Content | Count | Where it comes from | File |
| --- | --- | --- | --- |
| The 11 prayer names | 11 per locale | **Sourced** from national authorities, never machine translated | `locales/<tag>.ts`, `prayers` section |
| The 5 explanations | 5 per locale | **Sourced**, same track | same file, `explanations` section |
| The rest of the app's copy | 113 per locale | Machine translated, then gated | same file, the remaining sections |

So per locale it is **129 strings**, of which **16 are the sourced religious vocabulary** and 113
are ordinary UI ("Settings", "Close", "Change athan", "A new version is available").

### Why not just the three, or just the eleven

Because the app language setting changes the whole interface. If the file held only the prayer
names, an Indonesian user would get Indonesian prayer names inside an English settings sheet, an
English Help modal and English notifications. That is not a translated app; it is an English app
with translated labels.

The owner already ruled this, D6: "It will also change the settings, all the bottom sheets, all the
modals."

### The file layout, which answers the "wrong approach" worry

**One file per locale, not one file for everything:**

```
shared/i18n/
  locales/
    en.ts      113 UI strings + 11 names + 5 explanations
    ar.ts
    id.ts
    ...        one per shipped locale
  glossary.ts  the 16 sourced terms with their provenance
  t.ts         the lookup function
```

Three properties make this right rather than a 20-language megafile:

1. **Only the active locale loads.** A lazy `require` per locale means a user with the app in
   Indonesian never evaluates the other 27 catalogs. Measured: about 5.3KB per locale, so 20
   locales is 104KB of source but only one is ever parsed.
2. **A locale is one file, so adding or fixing one touches one file.** A translation correction is a
   one-file diff that a reviewer can read.
3. **The 16 sourced terms carry provenance** (`source`, `confidence`, `date`), because they are
   evidence rather than opinion. The 113 UI strings do not need it.

The catalogs are TypeScript rather than JSON, which gives compile-time key safety for free and
loads faster on Hermes than a runtime `JSON.parse` would.

---

## On the width problem, which the owner correctly says this does not solve

🐋  "That still doesn't resolve our transliteration and the width, because some names are quite
long, especially Indonesian and French."

Right, and the status after the D16 correction is narrower than it looked:

| Locale | Term | Width | Status |
| --- | --- | --- | --- |
| French | `Minuit islamique` | 132.3pt | Over. `Minuit` at 50.2pt is correct French for midnight, and the qualifier is what the explanation is for |
| German | `Sonnenaufgang` | 125.9pt | Over by 3pt. **No correct shorter German word exists** |
| Indonesian | `Tengah malam` | 119.1pt | **Fits.** This was the one wrongly cut to `Tengah` |
| Indonesian | `Sepertiga akhir` | 120.3pt | **Fits** |

So across the launch set it is **two terms**, one of which has a clean answer and one of which
(German Sunrise, 3pt over) needs a layout remedy rather than a word change. The budget also rises
from 123pt to 191pt whenever the second name is hidden, which the existing toggle already does.

The wider set will surface more, and the guard is what catches them: a test that fails the build
when any catalog term exceeds its locale's budget, naming the locale, the term, its width and the
overage. That turns each one into a sourcing question at the moment it appears, rather than a
surprise on a user's phone.

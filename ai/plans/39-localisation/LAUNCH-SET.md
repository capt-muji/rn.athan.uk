# The launch set, revised by what R6 could actually source

R4 recommended eight languages on audience grounds: `en ar id ur bn tr fr de`. R6 then tried to
source all 28 and graded what it found. The two do not fully agree, and the sourcing wins, because
a language with unsourced religious vocabulary cannot ship to an owner who cannot read it.

## What R6 can and cannot vouch for

| Tier | Languages | Meaning |
| --- | --- | --- |
| National authority, full standard set | `ar tr id ms uz sq bn` | Diyanet, Kemenag, JAKIM, MUIS, KMSH, islom.uz |
| One strong source, complete standard set | `ur fa sw ru hi zh-Hans zh-Hant bs az ta ml th so` | Shippable |
| **Needs a native speaker even for the standard set** | `fr de es nl ku ps ha` | Orthographic forks, not missing data |

**Two of R4's eight are in the third tier: French and German.**

The reason is not that R6 found nothing. It is that European languages fork on whether to
transliterate or translate, and both forms are attested: `Fajr` against `Fadschr`, `Maghrib`
against `Maghreb`, `Asr` against `Nachmittagsgebet`. That fork is also what
`CATALOG-EVIDENCE.md` measured as the width problem, since the translated forms are the long ones.

So French and German need one decision each, not a research programme: transliterate or translate.
That is a decision the owner can take without speaking either language, because it is a convention
choice rather than a linguistic one, and the evidence says transliterate (shorter, and what
Muslim-majority languages do naturally).

## The revised recommendation

**Launch set of six, all first or second tier:**

`en` `ar` `id` `ur` `bn` `tr`

Every one has a complete standard set, five of the six from a national authority, and all six fit
the column budget. Together they cover the largest Muslim populations on earth: Indonesia,
Pakistan, Bangladesh, Turkey and the Arab world, plus the app's existing English base.

**Then, once the owner rules on transliterate-versus-translate:** `fr` `de`.

That ruling is one question covering both, and it unblocks Spanish and Dutch later on the same
answer.

**Available beyond that, already sourced and fitting the budget:** `fa ms uz sq th hi bn ta ml az
bs ur`, which is most of R4's full set.

## The `Istijaba` problem, which is bigger than expected

`Istijaba` is **null in 24 of 28 locales**. R6's explanation: almost no prayer timetable in any
language publishes it, so there is nothing to source.

| Term | Null in |
| --- | --- |
| Istijaba | 24 of 28 |
| Duha | 15 of 28 |
| Last Third | 9 of 28 |
| Suhoor | 8 of 28 |
| Midnight | 7 of 28 |

R6 would ship `Istijaba` only in `ar` and `tr`, and `Duha` only in `ms id uz bn tr fa ml`.

This confirms the owner's instinct exactly:

🐋  "Istijaba, the prayer that appears only on Fridays, doesn't actually have a direct
translation."

**The design answer, which the app already uses:** the label is transliterated and the explanation
carries the meaning. `Istijaba` stays `Istijaba` in Latin-script languages and is transliterated
into the local script elsewhere, while the explanation string ("1 hour before Magrib, Fridays
only") does the work of saying what it is. R6 sourced the explanations far better than the labels,
which is the right way round for this.

So a null on `Istijaba` is not a launch blocker. It is a signal to transliterate rather than
translate, and the plan states that rule explicitly so a later session does not read the null as
missing work.

## What this changes in the assumptions

`ASSUMPTIONS.md` A7 assumed R4's eight. Revised: **six at launch**, with French and German behind
one owner decision. A7b said a locale ships only when its 11 names are non-null; revised to: a
locale ships when its **six standard names** are non-null and its extras either resolve or
transliterate.

That is a weaker bar and the right one, because the extras are a Friday-only row and two night
times, not the six prayers everyone opens the app for.

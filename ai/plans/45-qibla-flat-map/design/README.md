# The chosen design: "Plain Line". LOCKED IN 2026-09-30

The owner chose this after **188 designs across eight rounds**. His words, on seeing it:

🐋  "Perfect, perfect, perfect. We're going with option number 1. Option number 1 has been locked in.
Plain line turned away, plain line fixed in Mecca, those two, amazing, amazing, amazing, perfect."

**Nothing in this folder is app code. It is the design's specification, preserved so the next session
can build it without rediscovering anything.** The owner's stated fear was losing the design between
sessions, so it is committed to the repository rather than left in scratch space.

## What is here

| File | What it is |
| --- | --- |
| `CHOSEN-design1.mjs.txt` | The generator that draws the chosen design, verbatim |
| `lib.mjs.txt` | The helper library it imports (`pt`, `rub`, `ticks`, `kaaba`, `cardinals`, `R`, `BEARING`) |
| `render-one.mjs.txt` | The harness that turns a design file into the two SVGs |
| `out/d01-off.svg`, `out/d01-off.png` | The design turned away from Makkah |
| `out/d01-on.svg`, `out/d01-on.png` | The design facing Makkah, the whole instrument gold |

**Verified**: copying the three `.txt` files into an empty directory, renaming them to `.mjs`, and
running `node render-one.mjs d1.mjs out` reproduces `out/d01-off.svg` **byte for byte**. The design
cannot be lost.

## The design, described

A round instrument on a faintly violet near-black ground. Reading from the centre outward:

| Element | Specification |
| --- | --- |
| Centre dot | A solid gold disc, `0.034R`, the pivot the line grows from |
| The jewel | A tiny Rub el Hizb OUTLINE, two squares at 45 degrees, about `0.125R` |
| The line | ONE closed path, shaft and arrowhead together, no seam. Shaft half-width `0.0125R` to `0.0110R`, a 12% taper felt as weight rather than seen as a shape |
| The arrowhead | Barbs land exactly on the inner circle at `0.600R`, notch vertex `0.648R`, tip `0.715R`, barb half-width `0.046R`, included angle 43.6 degrees |
| The inner circle | `0.6R`, the ring the arrowhead's barbs sit on |
| The letters | N E S W at `0.760R`, **dimmed to about 0.5 alpha, always plain ink, NEVER gold** |
| The ticks | Session 17's dial verbatim: every 15 degrees, three weights, majors at 90, mids at 45, from `0.905R` inward |
| The rim | A disc at `0.985R` and ONE ring at `0.945R`. Nothing else |
| The Kaaba | On the dial's EDGE at about `0.88R`, size `0.116R`, drawn with `-heading`, band in the accent, edge in soft grey |
| The qibla arc | `±6.5` degrees at `0.9815R` on the rim, round caps, in the accent |
| Above the dial | **NOTHING.** No fixed marker. The owner removed it deliberately |

### The two states

**Turned away**: violet-tinted near-black ground, grey-violet structure, one true-gold accent.

**Facing Makkah**: **the WHOLE instrument turns gold** — ground, ticks, rings, letters, star, line,
arrow and Kaaba band all warm together. This is the owner's favourite single idea in the whole
programme and it replaces the green state every earlier round used.

### The palettes

| Role | Turned away | Facing Makkah |
| --- | --- | --- |
| Sheet | `#0a0812` | `#12100a` |
| Face | `rgba(18,16,30,1)` | `rgba(30,25,12,1)` |
| Medallion | `rgba(28,26,44,1)` | `rgba(44,36,17,1)` |
| Structure | `rgba(176,178,208,0.9)` and its alphas | `rgba(212,178,102,0.72)` |
| Accent | `rgba(218,179,95,1)` | brighter gold |
| Letter ink | ~0.5 alpha, plain | ~0.47 alpha, plain |

## The behaviour it represents

**The gold state and the haptic fire together, inside a 3 degree window**: one degree either side of
the qibla plus the exact bearing (🐋  "one degree on the left, one degree in the middle perfectly, one
degree on the right, that's when the haptic feedback is triggered, and it should be golden").

**This changes the shipped constants.** The code currently on the phone uses `ALIGNMENT_ENTER_DEGREES`
4 and `ALIGNMENT_EXIT_DEGREES` 8. The new window is **±1.5 degrees to enter**, and the exit threshold
must stay wider than the enter threshold or the haptic buzzes continuously: session 43 measured a
single threshold firing **49 taps in 100 samples** of 0.3-degree jitter. A sensible pair is enter 1.5,
exit 3, and **the ratio, not the absolute value, is what prevents the buzz.** The planning session
must decide it and say why.

## Why the owner rejected the fixed marker, in his own words

🐋  "The diamond that sits outside, on the outside of the compass, like an arrow on the top. Honestly I
feel like that one should be leaving. It's just confusing. What does it mean? Do we even need it?
What's the purpose of it? Because if the Kaaba is spinning on the outside on its own, and the arrow is
showing where I'm facing, then eventually they're going to meet up. So what's the point of it?"

He is right, and it is a real simplification: two moving parts meeting is the whole interaction, and a
third fixed part added nothing but a question.

## What the eight rounds settled, so nothing is re-litigated

| Ruling | Why |
| --- | --- |
| No compass rose, no pointed radiating rays | 🐋  "it looks like a Christian Catholic sort of thing" |
| No hexagram, no filled 8-point star | A filled star read as another faith's emblem. The OUTLINE is explicitly approved |
| No swastika-adjacent form, no square Kufic | A C4 pinwheel of L-blocks rendered as a swastika. Any modular motif needs full D4 mirror symmetry |
| The letters are never gold | His only correction after round 6, given by name |
| Not ornate, not bare | Round 1 was "way too complex"; round 2's minimal roses were "so basic, so boring" |
| The glow is optional polish | He flagged the Android cost. The design must read without it |

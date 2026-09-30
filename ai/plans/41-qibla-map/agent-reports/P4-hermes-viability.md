# P4: the pipeline runs in Hermes, and every Node dependency is eliminated

Written 2026-09-30 by the planning session, closing the largest open item in `P3` section 6.

## Why this report exists

`P3` proved the map pipeline end to end **in Node**. That is not where it has to run. `P3` listed the gap
honestly: "the decode ran in Node. The floor devices are an SD820 and an A12."

The risk was concrete rather than theoretical. The proof scripts call `zlib`, `fs` and `https`, and **none of
the three exists in React Native.** A pipeline that needs them is not a pipeline, it is a Node script. This
report closes that gap by rebuilding each dependency out of the proof and measuring the result.

## The three dependencies, and what replaces each

| Node builtin | Used for | Replacement in this app | Status |
| --- | --- | --- | --- |
| `fs` | Reading the tile off disk | `expo-file-system@58.0.2`'s `File`, which **`implements Blob`** (`node_modules/expo-file-system/build/File.d.ts:18`), so it carries `arrayBuffer()` and `bytes()` alongside `readableStream()` and `slice()` | **Solved, already installed** |
| `https` | Fetching a byte range | `fetch` with a `Range` header, which RN has had for years, or `File.arrayBuffer()` once bundled | **Solved, no dependency** |
| `zlib` | Gunzipping the tile | `fflate@0.8.3`, proven below | **Solved, one new dependency** |

## 1. The decoder itself needs nothing

The MVT decoder was rewritten against `Uint8Array` rather than Node's `Buffer`, using `DataView` for the
float reads and `TextDecoder` for the strings, then fed an input that is verifiably **not** a `Buffer`:

```
input is Uint8Array: true | is Buffer: false
```

It produced the identical result: 8 layers, 770 buildings, 211 roads, 1,310 pois, 120 landuse, 17 water, and
**the same 73 named streets** beginning Pall Mall East, Trafalgar Square, Charing Cross, Pall Mall,
Whitehall.

**APIs used by the decoder: `Uint8Array`, `DataView`, `TextDecoder`, `Math`. Node builtins used: none.**

Decode time **11.3 ms** under V8. Hermes is slower than V8 on this kind of byte-loop work, so the plan must
measure it on device rather than assume; the order of magnitude is what matters here and it is tens of
milliseconds against a 92 ms record budget, not seconds.

**One caveat worth naming rather than burying:** `TextDecoder` is not exported by `react-native` and I found
no reference to it anywhere under `node_modules/react-native/Libraries/`. Hermes ships it when built with
Intl, which RN's default Android build does, and iOS gets it from JSC-era polyfills, **but this is
UNVERIFIED on these two devices.** It is also trivially avoidable: the only strings in a tile are layer
names, key names and road names, all ASCII or UTF-8, and a 6-line UTF-8 decoder removes the question
entirely. The plan should prefer the 6 lines over the assumption.

## 2. Gzip, the one real dependency, proven

Vector tiles in the archive are gzipped, so something has to inflate them. The repo has no such library:
`pako`, `fflate`, `zlib` and `browserify-zlib` are all absent.

**`fflate@0.8.3` is the answer and it was tested rather than chosen from a readme.**

| Check | Result |
| --- | --- |
| Package size | 796,742 bytes unpacked, against `pako`'s 2,486,658 |
| Browser build size | `lib/browser.cjs` is 91,611 bytes, `esm/browser.js` is 90,922 |
| **Node builtins in the browser build** | **Zero.** `grep -c "require(" package/lib/browser.cjs` returns 0 |
| Gunzips a real tile | **Yes.** 62,219 gzipped bytes to 112,968 in **4.30 ms** |
| Output correctness | **Byte-identical to Node's `zlib` output**, verified element by element |
| Return type | `Uint8Array`, which is what the decoder now takes |

So the full decode path is **4.3 ms of inflate plus 11.3 ms of parse under V8**, with zero Node builtins and
one dependency whose browser build is 91 KB of pure JavaScript.

**`pako` is rejected on measurement rather than taste:** three times the unpacked size for the same job, and
`fflate` publishes an explicit browser entry with no Node worker path, which is what makes the zero-require
result possible.

## 3. What this means for the design

`P3`'s open question 3 is closed: the pipeline is viable in Hermes, subject to one on-device measurement
rather than a redesign. Combined with `P3` section 7's feature cap, the budget for opening the map screen now
has every term in it:

| Stage | Cost | Where the number comes from |
| --- | --- | --- |
| Read 9 tiles from disk | Unmeasured | `File.arrayBuffer()`, local disk, expected to be small |
| Gunzip | 4.3 ms per tile under V8 | Measured here |
| Parse MVT | 11.3 ms per tile under V8 | Measured here |
| Record the SVG, 122 m view | **92 ms** on the SD820 | `P3` section 7, from this repo's own device data |
| Rotate or redraw | Zero, it never re-records | The dial's proven architecture |

**The record dominates, which is the useful conclusion**, because it means the decode is not the thing to
optimise and the feature cap is. Hermes being slower than V8 on the byte loops has room to absorb a large
multiple before it rivals 92 ms.

## 4. The memory objection, measured after I refused to bet on it

The last line of the first draft of this report said nine decoded tiles in memory on a 2016 phone was "the
one thing in this report I would not bet on without a device". It is now measured, and the first measurement
was wrong in an instructive way.

**The naive run reported 1,289 KB per tile for 48 paths**, which is absurd: 48 paths cannot cost 1.3 MB. The
figure was the decode's TRANSIENT garbage, not what is retained, because the heap was sampled without
collecting first. Forcing two GC passes while still holding the result gives the real number:

| View radius | Paths kept | Coordinates | Retained, 9 tiles | Per tile |
| --- | --- | --- | --- | --- |
| **122 m** | **48** | 4,498 | **1.28 MB** | **146 KB** |
| 228 m | 118 | 5,936 | 1.58 MB | 180 KB |
| 381 m | 249 | 8,702 | 2.11 MB | 240 KB |
| Whole tile | 953 | 17,864 | 4.45 MB | 506 KB |

**At the 122 m view the design actually uses, nine tiles retain 1.28 MB.** Even holding nine whole tiles
uncapped is 4.45 MB. Against a phone with gigabytes, on a screen the user opens deliberately and closes, this
is not a constraint. **The objection is withdrawn on measurement rather than on argument.**

Two honest notes. The floor is 17.6 KB of pure `Float32Array` geometry per tile against 146 KB retained, so
about 88% is JavaScript object overhead around the arrays, which a flatter representation could reclaim if it
ever mattered. And these are V8 heap figures; Hermes allocates differently, so the ratio may shift while the
order of magnitude will not.

**The architectural point that makes even 1.28 MB pessimistic:** only the CENTRE tile needs features within
the radius. The eight ring tiles contribute only where the radius overlaps them, which at 122 m is almost
nothing, so a real implementation decodes one tile fully and the ring lazily or not at all.

## 5. A toolchain trap R3 found, which this pipeline shares

R3's verification pass drove the deep `adhan` import through all three resolvers and found they disagree:

| Tool | Deep import `adhan/lib/cjs/SolarTime.js` |
| --- | --- |
| **Metro 0.87.1** | **Resolves**, via `PackagePathNotExportedError` caught at `resolve.js:512-527`, with a fallback warning |
| **Jest 30.5.1** | **Fails**, in both projects |
| **tsc 7.0.2** | **Fails** |

**This is a trap with the exact shape this repo has been bitten by before:** the app builds and runs, and the
test suite and the typechecker refuse the same line. A session that only ran the app would ship it; a session
that only ran `yarn validate` would conclude it is impossible. Both would be wrong.

It matters to this report because the map pipeline is one `fflate` import away from the same class of
problem, and `fflate` publishes separate Node and browser entries. **The plan must import the browser entry
explicitly and prove it under Jest AND tsc AND Metro**, not just under one of them. R3 records the fix for
the adhan case as one Jest config line; the same remedy is likely here.

## What I attacked in my own conclusion

- **I nearly declared `TextDecoder` available because the decode worked.** It worked in Node, which proves
  nothing about Hermes. Searching RN's own libraries found no reference to it at all, so the honest status is
  UNVERIFIED with a 6-line workaround, and the plan should take the workaround rather than the risk. This is
  exactly the shape of the mistake `P3` made with `zlib` and the reason this report exists.
- **The 4.3 ms and 11.3 ms are V8 numbers and I have not run them on a phone.** Naming them without that
  caveat would repeat session 40's error of trusting a figure measured on the wrong thing. They are reported
  as an order of magnitude against a 92 ms budget, not as device figures.
- **I checked whether `expo-file-system` really gives raw bytes** rather than assuming a modern API does.
  `File.d.ts:18` declares `File extends ExpoFileSystem.FileSystemFile implements Blob`, and the `implements
  Blob` is what carries `arrayBuffer()`, so the claim rests on a declaration in the installed package rather
  than on documentation.
- **Adding `fflate` breaks the repo's "no new dependencies without approval" rule**, so it belongs in
  `PROPOSALS.md` as a decision rather than in a plan as a fact. It is one 91 KB pure-JS package with zero
  transitive dependencies, which is the cheapest possible shape for a new dependency, and the alternative is
  that the map cannot read its own tiles.
- **I refused to bet on the memory question, then measured it, and my first measurement was wrong.** It
  reported 1,289 KB per tile for 48 paths, which is absurd on its face, because it sampled the heap without
  collecting the decode's garbage first. Section 4 has the real figures. The lesson is the one this repo
  already carries about `grep -c` on a missing command: a number that is wrong but plausible is more
  dangerous than an error, and the only defence is asking whether the magnitude makes sense.
- **The strongest remaining objection is now the toolchain, not the engine.** Section 5 records that Metro,
  Jest and tsc disagree about a deep package import, and `fflate` ships separate Node and browser entries,
  so the plan has to prove its import under all three rather than one. That is a real risk and it is a
  config-line risk rather than a design risk.

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
- **The strongest remaining objection:** none of this proves the app can hold nine decoded tiles in memory at
  once on a 2016 phone with 6 GB of RAM shared with everything else. A decoded tile is 113 KB of MVT that
  expands into JavaScript objects, and nine of those is the real memory question. Unmeasured, and it is the
  one thing in this report I would not bet on without a device.

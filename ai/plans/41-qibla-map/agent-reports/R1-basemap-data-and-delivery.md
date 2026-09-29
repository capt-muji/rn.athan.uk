# R1: the offline basemap data itself, and how it would be delivered

Research agent R1, 2026-09-29 to 2026-09-30. Answers brief questions 1 and 6, with the measurements the
other questions lean on.

## Method, stated up front

Every size below is either measured from the real Protomaps planet archive or published by the vendor. The
key technique: I read the actual `20260929.pmtiles` planet build over HTTP range requests, decoded its
directories with `node` (throwaway scripts in the session temp directory, since deleted; the decoding
logic is the spec's own appendix A.2), and computed per-zoom and per-region byte costs from the archive's
own tile entries. That gives extract sizes without downloading 138 GB.

Sources: TinyFish search and `tinyfish.fetch_content` for pages, `curl -I`/`curl -r` for file headers and
byte ranges, `node` for arithmetic, the docs-mcp-server for Expo SDK 58 docs. Web pages came through
TinyFish unless a command is quoted.

## Summary table: what a map costs

Measured from Protomaps build `20260929.pmtiles` (v4.15.2), the real daily planet build, unless the row
names another source.

| What | Size | What the user gets | Source |
| --- | --- | --- | --- |
| Full planet, z0 to z15 | **138.45 GB** | Everything, every street and building | `curl -I`, below |
| Planet z0 to z6 | **45 MB** | Countries, cities, motorways only | Measured, below |
| Planet z0 to z7 | **188 MB** | Adds trunk roads, town labels | Measured |
| Planet z0 to z8 | **556 MB** | Adds primary roads in cities | Measured |
| Planet z0 to z10 | **3.77 GB** | Adds secondary roads, villages | Measured |
| Planet z0 to z12 | **17.7 GB** | Adds residential streets, rail | Measured |
| Planet z0 to z14 | **68.5 GB** | Adds buildings, footpaths | Measured |
| Greater London bbox, z0 to z14 | **60.1 MB** | Streets, no building footprints | Measured |
| Greater London bbox, z0 to z15 | **141 MB** | Adds building footprints | Measured |
| UK bbox, z0 to z13 | **719 MB** | Streets to z13 | Measured |
| Makkah bbox, z0 to z15 | **6.1 MB** | Full detail for the holy city | Measured |
| Natural Earth, all themes, 1:10m | **576 MB** (SHP) | No streets at all, no buildings | naturalearthdata.com |
| Natural Earth, 1:10m cultural only | **373 MB** | Admin borders, cities, land use | naturalearthdata.com |
| Natural Earth, 1:110m cultural only | **1.4 MB** | Country shapes only | naturalearthdata.com |
| Geofabrik Greater London, raw | **120 MB** (.osm.pbf) | Every OSM object, unrendered | geofabrik page |
| Geofabrik Great Britain, raw | **2.0 GB** (.osm.pbf) | Every OSM object, unrendered | geofabrik page |

**Reading of the table.** A whole-world map at useful detail is 138 GB and fits nothing. A whole-world map
at recognisable-my-street detail does not exist at any size on a phone. A region at useful detail is tens
of megabytes and fits the app. The rows below give the derivation.

---

## 1. PMTiles: what it is, the spec, how it is read, and the local-file answer

### 1.1 What it is

PMTiles is a single-file archive format for tiled map data. One file holds a whole tile pyramid: header,
directories, metadata, and the tile blobs. The official description: "PMTiles is a single-file archive
format for tiled data", recommended MIME type `application/vnd.pmtiles`
(https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md).

### 1.2 The exact spec version

**Version 3.** The spec lives at `spec/v3/spec.md` in the `protomaps/PMTiles` repository; a `v2` folder
sits beside it and is historical. The archive's own header confirmed this on the wire: byte 7 of
`20260929.pmtiles` is `0x03`. The version byte is defined as "a fixed 1-byte field whose value is always
3".

Spec: https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md (fetched through TinyFish, full text
in the research notes).

### 1.3 How an archive is read

The format's whole design goal is random access with two reads:

1. **Read 1**: bytes 0 to 127, the fixed header. It gives the offsets and lengths of the root directory,
   metadata, leaf directories and tile data, plus min/max zoom, bounds, compression, tile type.
2. **Read 2**: the root directory, which the spec pins inside the first 16 KiB ("the header plus the
   compressed size of the root directory MUST NOT exceed 16384 bytes"), so a latency-optimised client can
   fetch it in one request.
3. A directory entry lookup finds either the tile's offset and length directly (root directory hit) or a
   pointer to a leaf directory holding it, which costs one more read.

The header I parsed from the live planet file (this is the actual archive, not documentation):

```
magic: PMTiles, version: 3
root dir: offset 127, len 15,559 (2,917 entries, all pointers to leaf directories)
metadata: offset 138,095,619,473, len 1,179
leaf dirs: offset 138,095,620,652, len 352,429,504 (2,917 leaves)
tile data: offset 16,384, len 138,095,603,089
addressed tiles: 1,431,655,765
tile entries: 178,006,398
tile contents: 136,108,674
clustered: 1, internal compression gzip, tile compression gzip, tile type MVT
minzoom: 0, maxzoom: 15
bounds: -180, -85.0511288 to 180, 85.0511288 (the whole world)
```

Over HTTP, those reads are range requests, and the file never needs to be downloaded whole. Over a local
file, they are `pread`s.

### 1.4 Does a LOCAL file work with no server?

**Yes, on the renderer this app would use.** MapLibre Native (the engine under
`@maplibre/maplibre-react-native`, question 2's subject) reads PMTiles natively from 11.7.0, and supports
two local forms, quoted from the MapLibre Android docs:

> Starting MapLibre Android 11.7.0, PMTiles archives are supported as tile sources. Prefix any tile source
> URL with `pmtiles://` to read from a PMTiles archive:
>
> * `pmtiles://https://` for streaming tiles from a remote file
> * `pmtiles://file://` to read a file from device storage (use `getExternalFilesDir` or `filesDir` for
>   the path)

And for bundled assets: "Files in `src/main/assets/` load the same way with
`pmtiles://asset://<name>.pmtiles` or `pmtiles://file:///android_asset/<name>.pmtiles`."

Source: https://www.maplibre.org/maplibre-native/android/examples/data/PMTiles/ (TinyFish).

So a `.pmtiles` file shipped inside the APK or downloaded into app storage is read by the map engine with
no server, no HTTP, and no network at any point. The Flutter docs state the same capability and add the
caveat that matters: "A hosted `.pmtiles` archive is still read over the network... For a map that works
with no connection, bundle the `.pmtiles` file as a Flutter asset and reference it with a local path"
(https://maplibre.org/flutter-maplibre-gl/advanced/pmtiles/, TinyFish).

One caveat for R2: "PMTiles sources do not support offline pack downloads or caching" (same Android page).
That line is about MapLibre's own offline-pack subsystem, which is irrelevant once the file itself is
local. But it means you cannot mix a remote PMTiles source with MapLibre's offline region downloads; the
file must be local from the start.

### 1.5 Reference implementations

| Implementation | Language | Role | Source |
| --- | --- | --- | --- |
| `protomaps/go-pmtiles` | Go | The `pmtiles` CLI, single binary, current v1.31.2 (22 Jul) | github.com/protomaps/go-pmtiles (TinyFish) |
| `pmtiles` npm package (`js` folder of `protomaps/PMTiles`) | TypeScript | Browser/JS reader, the MapLibre GL JS plugin's engine | repo tree, `js/` |
| C++ reader | C++ | `cpp/pmtiles.hpp`, single-header, for native embedding | repo tree, `cpp/` |
| Python | Python | `python/` folder | repo tree, `python/` |
| GDAL/OGR driver | C++ | Reads PMTiles as a vector dataset | https://gdal.org/en/stable/drivers/vector/pmtiles.html (search snippet) |
| MapLibre Native | C++/Kotlin/Swift | Renderer-level support from 11.7.0 | MapLibre docs above |

---

## 2. Protomaps: the free daily planet builds, with the real numbers

### 2.1 Where the builds live

- Download page: https://maps.protomaps.com/builds/ (a JS app; its data comes from
  `https://build-metadata.protomaps.dev/builds.json`, found by reading the page's bundled script)
- Files: `https://build.protomaps.com/<YYYYMMDD>.pmtiles`, one per daily build
- Docs: https://docs.protomaps.com/basemaps/downloads

The docs' own headline figure: "A full planet file is roughly **120 gigabytes**, including zoom levels
from 0 to 15." That is stale; today's build is larger, and the true number is below.

### 2.2 The real size, measured today

`curl -sI https://build.protomaps.com/20260929.pmtiles` returns `content-length: 138448050156`, which is
**138.45 GB (128.9 GiB)**. The build metadata JSON agrees: `size: 138448050156` for `20260929.pmtiles`,
tileset `v4.15.2`.

Size history from the same metadata (selected):

| Build | Size | Version |
| --- | --- | --- |
| 20230918 (first listed) | 114.68 GB | v0.0.0 |
| 20240115 | 118.08 GB | v3.1.0 |
| 20241007 | 126.40 GB | v4.0.0 |
| 20250317 | 128.59 GB | v4.7.1 |
| 20260206 | 133.53 GB | v4.13.6 |
| 20260722 | 136.95 GB | v4.15.0 |
| **20260929 (latest)** | **138.45 GB** | **v4.15.2** |

The "weekly" framing in the brief is slightly off: builds are **daily**, and the bucket "retains all
builds for the past week, plus the latest build for each patch version"
(docs.protomaps.com/basemaps/downloads). There is no zoom-cap choice on the download page; every build is
z0 to z15, and cutting a zoom range is the CLI's job (section 3).

### 2.3 What each zoom level costs, measured from the real archive

This is the brief's own question: "what does each extra zoom level cost in bytes (it roughly quadruples
per level: verify this and give the real numbers)".

Method. The archive is clustered (data ordered by tile ID), so the tile-data extent at each zoom boundary
is exactly the bytes needed for all zooms below it. I walked all 963 leaf directories below the z15
boundary (110 MB of downloads), reconstructed every entry's offset and length, and recorded the running
extent at each zoom boundary. Directory bytes are added at the archive's own 1.98 bytes per entry.

Measured planet extract sizes, zooms 0 to N:

| Max zoom | Tile data | Dirs and header | Total | What appears at this zoom |
| --- | --- | --- | --- | --- |
| z0 | 0.14 MB | 0.02 MB | **~0.2 MB** | One world tile |
| z1 | 0.30 MB | 0.02 MB | **~0.3 MB** | Countries visible |
| z2 | 0.86 MB | 0.02 MB | **~0.9 MB** |  |
| z3 | 2.43 MB | 0.02 MB | **~2.4 MB** | Motorways first appear (roads layer minzoom 3) |
| z4 | 6.03 MB | 0.02 MB | **~6.0 MB** |  |
| z5 | 15.03 MB | 0.02 MB | **~15.0 MB** |  |
| z6 | 44.98 MB | 0.02 MB | **~45.0 MB** | Trunk roads appear |
| z7 | 188.39 MB | 0.03 MB | **~188 MB** | Town labels, landuse polygons |
| z8 | 555.95 MB | 0.07 MB | **~556 MB** | Primary roads in dense areas |
| z9 | 1,570.94 MB | 0.4 MB | **~1.57 GB** | Runways, secondary roads begin |
| z10 | 3,766.32 MB | 1.3 MB | **~3.77 GB** | Villages, macrohood labels |
| z11 | 7,979.34 MB | 4.1 MB | **~7.98 GB** | **Buildings first appear** (buildings layer minzoom 11) |
| z12 | 17,646.22 MB | 12.5 MB | **~17.7 GB** | Rail, residential streets begin |
| z13 | 35,714.35 MB | 38.2 MB | **~35.7 GB** |  |
| z14 | 68,409.12 MB | 116.3 MB | **~68.4 GB** | Full street detail, footpaths |
| z15 | (rest of the 138 GB) |  | ~138.4 GB | Individual OSM buildings (merged before) |

Per-level increments (new blob bytes first referenced at that zoom):

| Zoom | Increment | Ratio to previous |
| --- | --- | --- |
| z6 | +29.9 MB | 3.3x |
| z7 | +143.4 MB | 4.8x |
| z8 | +367.6 MB | 2.6x |
| z9 | +1,015 MB | 2.8x |
| z10 | +2,195 MB | 2.2x |
| z11 | +4,213 MB | 1.9x |
| z12 | +9,667 MB | 2.3x |
| z13 | +18,068 MB | 1.9x |
| z14 | +32,695 MB | 1.8x |

**The "roughly quadruples" claim is false for the levels that matter.** From z8 upward each level costs
about **2x the previous one, not 4x**. The 4x figure describes tile COUNT (each zoom has 4 times as many
tiles), not stored bytes: Protomaps merges and deduplicates geometry across zooms, and vector tiles at
higher zooms cover smaller areas with less data each. The doubling is why z14 land is 68 GB rather than
hundreds. The doubling also means the docs' own guidance, "Each additional zoom level roughly doubles the
size of the file" (docs.protomaps.com/basemaps/downloads), is the correct rule of thumb, and it matches
the measurement to within 10 to 20 percent per level.

Cross-check on z6: the Protomaps getting-started guide itself says a z0 to z6 planet extract is "~60 MB"
(docs.protomaps.com/guide/getting-started). My measurement says 45 MB of tile data plus directories. Both
figures are honest; the guide's includes more overhead or a different build. Either way the order is
right: a whole-world z6 map is tens of megabytes.

---

## 3. Extraction: the CLI, exact commands, and measured weights

### 3.1 The tool

`pmtiles`, a single static binary from `protomaps/go-pmtiles` releases (current v1.31.2, released 22 Jul).
Docs: https://docs.protomaps.com/pmtiles/cli. It was not installed on this machine, so every command below
is quoted from the official docs; the SIZES are my own measurements from the same archive the command
would read.

The one command that matters for this feature:

```sh
# a region, full detail
pmtiles extract https://build.protomaps.com/20260929.pmtiles my_area.pmtiles \
  --bbox=MIN_LON,MIN_LAT,MAX_LON,MAX_LAT

# a region, capped at a zoom
pmtiles extract https://build.protomaps.com/20260929.pmtiles my_area.pmtiles \
  --bbox=... --maxzoom=14

# the whole planet, capped at a zoom
pmtiles extract https://build.protomaps.com/20260929.pmtiles planet_z6.pmtiles --maxzoom=6

# a region by polygon instead of box
pmtiles extract https://build.protomaps.com/20260929.pmtiles my_area.pmtiles --region=REGION.geojson
```

Options, from the docs: `--maxzoom` ("Extract only a subset of zoom levels. Extracting a full sub-pyramid
from 0 to maxzoom is always an efficient operation that makes minimal I/O or network requests"),
`--minzoom` (partial sub-pyramid, more requests), `--region` (GeoJSON Polygon, Multipolygon, Feature or
FeatureCollection), `--download-threads`, `--overfetch`. The source must be clustered, which the planet
build is.

So yes: **"zoom 0 to 8 for the whole planet" is one command**, and so is any other cap.

### 3.2 What each whole-planet cap weighs

From section 2.3's measured table:

| Command | Output size |
| --- | --- |
| `--maxzoom=6` | **45 MB** |
| `--maxzoom=7` | **188 MB** |
| `--maxzoom=8` | **556 MB** |
| `--maxzoom=10` | **3.77 GB** |
| `--maxzoom=12` | **17.7 GB** |
| `--maxzoom=14` | **68.4 GB** |
| (no cap, z15) | **138.4 GB** |

The brief asked specifically for 0-6, 0-8 and 0-10: **45 MB, 556 MB, 3.77 GB**.

### 3.3 What a REGION weighs, measured the same way

I summed the unique tile blob bytes for every tile intersecting each bounding box, per zoom, which is what
`extract --bbox --maxzoom` writes. This is the table the feature decision turns on.

**Greater London** (bbox -0.55, 51.28, 0.35, 51.72, about 60 x 49 km):

| Max zoom | Tiles | Blob bytes | Cumulative |
| --- | --- | --- | --- |
| z10 | 9 | 1.43 MB | 3.91 MB |
| z11 | 30 | 3.01 MB | 6.92 MB |
| z12 | 99 | 6.56 MB | 13.48 MB |
| z13 | 357 | 14.52 MB | 28.00 MB |
| **z14** | **1,386** | **32.12 MB** | **60.12 MB** |
| **z15** | **5,395** | **80.93 MB** | **141.06 MB** |

(z0 to z9 adds 2.48 MB; every zoom below 10 is noise.)

**United Kingdom** (bbox -8.2, 49.9, 1.8, 60.9):

| Max zoom | Tiles | Blob bytes | Cumulative |
| --- | --- | --- | --- |
| z11 | 6,496 | 86.36 MB | 144.14 MB |
| z12 | 25,645 | 191.57 MB | 335.71 MB |
| **z13** | **101,460** | **383.24 MB** | **718.95 MB** |

**Makkah** (bbox 39.5, 21.2, 40.3, 21.7, about 80 x 55 km): **6.12 MB cumulative to z15**, of which
z15 alone is 2.36 MB. The holy city is desert; its tiles are cheap.

The London and Makkah numbers carry the decision, and both were measured tile by tile from the live
archive, not estimated.

### 3.4 Other extraction tools

- `pmtiles convert INPUT.mbtiles OUTPUT.pmtiles`: MBTiles to PMTiles, one command (docs).
- `pmtiles merge`: combines disjoint archives (docs, and protomaps.com/blog/pmtiles-merge-part-1).
- Building from source instead of extracting: `protomaps/basemaps` with Planetiler; "It can be run for
  your local city or country in minutes" from a Geofabrik `.osm.pbf`
  (docs.protomaps.com/basemaps/build). A custom build is how you would produce, say, a UK-wide extract
  with only the layers the qibla needs, which `extract` cannot do: it cuts by area and zoom only, never
  by layer (open feature request protomaps/go-pmtiles#164).

---

## 4. What is IN a basemap at each zoom

This decides whether the user can recognise their own surroundings. Two sources agree: the archive's own
JSON metadata (layer minzooms, fetched and parsed from the file), and the actual London tiles at every
zoom, which I fetched and decoded layer by layer.

### 4.1 Layer minzooms, from the archive's own metadata

| Layer | minzoom | maxzoom | Content |
| --- | --- | --- | --- |
| boundaries | 0 | 15 | Country and region borders |
| earth | 0 | 15 | Land polygons |
| landcover | 0 | 7 | Forest, glacier, urban area (from Daylight) |
| landuse | 2 | 15 | Parks, hospitals, schools, pitches |
| places | 1 | 15 | City and town labels |
| pois | 5 | 15 | Points of interest |
| roads | 3 | 15 | Everything from motorways to footpaths |
| water | 0 | 15 | Ocean, lakes, rivers |
| **buildings** | **11** | 15 | Building footprints and address points |

### 4.2 What a London tile contains at each zoom

Decoded from the live tiles at the Charing Cross tile coordinates:

| Zoom | Layers present (feature counts) | Verdict for "can I see my street" |
| --- | --- | --- |
| z0 to z2 | boundaries, earth, landcover, water, places | Continents and countries |
| z3 to z5 | + roads (motorway only) | Motorway corridors, city labels |
| z6 | + trunk roads | City-to-city roads |
| z7 | + landuse polygons (1,102 features), town labels | Town shapes, still no local streets |
| z8 | + primary roads in dense areas (97 road features) | Arterial roads of a city |
| z9 | + runways, secondary roads begin | Main road network |
| z10 | + villages, quarter labels, more road classes | Neighbourhood level |
| **z11** | **+ buildings layer appears (5 features)** | First building footprints, rail |
| z12 | + residential streets begin (5 residential, 3 unclassified) | Some local streets |
| z13 | + service roads, footpaths, cycleways | Most streets |
| **z14** | 121 residential, 33 unclassified, 41 service, 44 sidewalks | **Every street, individually** |
| z15 | 770 buildings, all path types | Full detail, individual OSM buildings |

The roads layer's `kind` values by zoom tell the same story precisely. London z8 carries
`highway(motorway)`, `major_road(trunk)` and `major_road(primary)`. Z10 adds 170 `primary` features. Z12
is the first zoom with `minor_road(residential)`. Z13 adds `minor_road(service)` and the path family
(footway, cycleway, steps). Z14 has every class including `path(sidewalk)` and `path(corridor)`.

### 4.3 The precise answers

- **Individual streets: first shown at z12** (`minor_road` classes appear), common at z13, complete at
  z14.
- **Building footprints: first shown at z11** (the buildings layer's own minzoom, confirmed in metadata
  and in the tile), but z11 has only merged, coarse footprints (5 features in central London). The docs
  say "z0-14 contains merged buildings, even disconnected ones. z15+ contains individual OSM equivalent
  buildings". **Individual, recognisable buildings are z15.**
- **At z8 you get NO streets a local would recognise.** You get coastlines, borders, cities, motorways and
  trunk roads. A user standing on their road cannot identify it at z8. This kills any plan that stops at
  z8 for the recognition use case.

**Consequence for this feature.** The minimum zoom for "the user recognises their own surroundings" is
z13, and z14 is the comfortable one. Section 3.3's London row says that costs 28 MB at z13 and 60 MB at
z14 for the whole of Greater London. Z15, which shows the building the user is standing next to as its own
footprint, costs 141 MB for the same box.

One more wrinkle, from the docs' buildings note: to show individual buildings the archive must reach z15,
and z15 is the last zoom in the build. There is no z16 to buy.

---

## 5. Alternatives to PMTiles for offline vector data

### 5.1 MBTiles

An open Mapbox specification storing a tile pyramid in a single SQLite database; raster or vector tiles
(https://github.com/mapbox/mbtiles-spec, https://docs.mapbox.com/help/glossary/mbtiles/). MapLibre reads
it. `pmtiles convert` turns one into a PMTiles file, so it is a source format rather than a competing
delivery mechanism. For this project PMTiles dominates it: smaller (deduplication and gzip directories),
simpler (no SQLite dependency in the renderer), and read natively by MapLibre Native from a plain file. No
published size advantage exists; the same tiles weigh the same, minus PMTiles' deduplication.

### 5.2 GeoPackage

An OGC standard (geopackage.org) storing vector features, tile matrices, or both in SQLite. It can hold
raw geometry (not tiles), which is interesting in principle, but no renderer in this app's reach draws a
basemap from a GeoPackage's raw features: MapLibre consumes tiles. Its role here would be as a data
source for a custom build, not a delivery format.

### 5.3 Raw shapefiles and Natural Earth

Natural Earth's own download page (naturalearthdata.com/downloads) publishes the totals:

| Package | Size |
| --- | --- |
| All vector themes, all scales, SHP | **576 MB** |
| All vector themes, SQLite | 423 MB |
| All vector themes, GeoPackage | 436 MB |
| 1:10m cultural themes only | 372.69 MB |
| 1:10m physical themes only | 49.99 MB |
| 1:110m cultural themes | 1.4 MB |
| 1:110m countries alone | 210 KB |

Natural Earth contains **no streets and no building footprints at any scale**. Its most detailed road
theme (1:10m roads, 8.66 MB) is a nationwide highway network at 1:10,000,000 scale. For the qibla use
case, where the user must recognise their own road, Natural Earth is useless as the basemap. Its one
honest role is the far-zoom fallback: a 210 KB countries file plus a 1.98 MB rivers file draws the
z0 to z4 world for almost nothing, if a hybrid design wants world context under a regional extract.

### 5.4 OpenStreetMap extracts (Geofabrik)

Published sizes, from the Geofabrik pages themselves:

| Region | File | Size |
| --- | --- | --- |
| Greater London | `.osm.pbf` | **120 MB** |
| Greater London | `.shp.zip` | 194 MB |
| Greater London | `.gpkg.zip` | 199 MB |
| Great Britain | `.osm.pbf` | **2.0 GB** |
| England | `.osm.pbf` | 1.6 GB |
| Germany | `.osm.pbf` | 4.5 GB |

Note the Greater London history: 30 MB in 2014, 120 MB today, quadrupling in 12 years. Raw OSM grows
about 8 percent a year, so any shipped snapshot ages.

These are raw geometry, not tiles. Nothing renders them directly; they feed a tile builder (Planetiler,
`protomaps/basemaps`, minutes for a city per docs.protomaps.com/basemaps/build). Compared with extracting
from the finished planet (section 3.3), building from raw costs a build pipeline and buys layer control
and freshness.

### 5.5 On-device renderers drawing raw geometry

For completeness: no maintained React Native library renders a basemap from raw geometry on device. The
real options are all tile-based: MapLibre Native (MVT tiles from PMTiles/MBTiles), or raster. A "draw the
one street we care about" idea does not need a basemap at all: given a position, a handful of street
polylines could be fetched from a tiny bundled dataset and drawn with `react-native-svg`, which this repo
already ships (15.15.5). That path is question 3's territory, but the data cost is worth recording: the
500 nearest street segments around a point, as SVG path data, is tens of kilobytes, not megabytes.

---

## 6. Delivery: the hard limits Google and Apple publish

### 6.1 Android App Bundle and asset packs

From Google Play's official size-limits page
(support.google.com/googleplay/android-developer/answer/9859372), all sizes **compressed download size**:

| Component | Limit |
| --- | --- |
| Base module | 500 MB |
| Individual feature module | 500 MB |
| Individual asset pack | 1.5 GB |
| Cumulative, all modules + install-time asset packs | 4 GB |
| Cumulative, on-demand and fast-follow asset packs | 30 GB |
| **Total maximum compressed download size** | **34 GB** |
| Max asset packs per bundle | 100 |
| Apps over 1 GB | must target API 21+ |

Delivery modes (developer.android.com/guide/playcore/asset-delivery):

- **install-time**: delivered with the app, served as split APKs, "you can use these packs immediately at
  app launch", count against the 4 GB cumulative and the store-listed size.
- **fast-follow**: "downloaded automatically as soon as the app is installed; the user does not have to
  open the app", does not count toward the listed size.
- **on-demand**: downloaded while the app runs, does not count toward the listed size.

Cellular: "If your app is above 200MB in size, users on a mobile data connection will see a non-blocking
dialog when installing the app" (same page). Not a block, a warning. Legacy APK publishing keeps a 100 MB
hard cap, which is why the current 66 MB APK is fine but cannot grow past 100 MB as an APK.

### 6.2 iOS

From Apple's official pages.

**App bundle size** (developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes/):
maximum uncompressed app size **4 GB** for iOS 9.0+ targets; maximum executable `__TEXT` 500 MB.

**On-Demand Resources** (developer.apple.com/help/app-store-connect/reference/app-uploads/on-demand-resources-size-limits/),
per deployment target, sizes after thinning:

| Item | Below iOS 18 | iOS 18+ |
| --- | --- | --- |
| App bundle | 2 GB | 4 GB |
| Asset pack | 512 MB | 8 GB |
| Asset pack count | 1000 | 1000 |
| Initial install + prefetched tags | 4 GB | No limit |
| In-use on-demand resources | 2 GB | No limit |
| Hosted on-demand resources | 20 GB | 70 GB |

**Does ODR need a network at first use?** Yes, by design: on-demand packs are "app contents that are
hosted on the App Store and are separate from the related app bundle that you download". An on-demand pack
is fetched over the network when the app asks for it. Only packs tagged **initial install** are guaranteed
present at first launch, and even those ride the App Store download.

**ODR is deprecated.** Apple's own page carries this note: "on-demand resources has been deprecated on
Apple platforms as of iOS 27, iPadOS 27, tvOS 27, and visionOS 27, and support will be removed in future
releases. Migrating to Background Assets is recommended." The replacement, Background Assets, hosts up to
200 GB of packs, but its managed tier requires **iOS 26.0 minimum deployment target**. This app's floor
device is an iPhone XS, which iOS 26 dropped (ai/AGENTS.md). On the XS, only ODR or plain bundling exist.

**Cellular download limit:** iOS 13 removed the hard cap. The App Store setting is now a three-way choice
(Ask Over 200 MB / Always Ask / Always Allow); "Always Allow" permits any size over cellular. Sources:
9to5mac.com/2019/06/03/ios-13-removes-200-mb-file-size-limit-for-app-downloads-over-cellular/ and Apple's
Settings documentation. So a large iOS download no longer breaks on cellular, but the default still asks.

### 6.3 Plain bundling in the binary

A file in the APK's `assets/` or the iOS bundle counts against the base module (500 MB compressed,
Android) or the app bundle (4 GB uncompressed, iOS) directly. The 66 MB APK baseline plus a 60 MB London
extract is a 126 MB APK, inside every limit, no asset pack needed. The same extract at z15 (141 MB) takes
the APK to 207 MB, past the point where Play shows the mobile-data dialog, and past the 100 MB legacy APK
cap that would matter if the app ever republished as APK.

### 6.4 Expo's story in SDK 58

From the Expo SDK 58 docs (docs-mcp-server, indexed `expo` v58):

**`expo-asset`** bundles files at build time through its config plugin: "assets": ["path/to/file.png",
"path/to/directory"], with supported types listed as images (`.png`, `.jpg`, `.gif`), media (`.mp4`,
`.mp3`, `.lottie`, `.riv`), SQLite `.db`, and 3D `.glb`. A `.pmtiles` file is none of these, so it needs
either a Metro `assetExts` addition (the docs' own pointer: "For other file types... see how to add a file
extension to assetExts in metro config") or a config-plugin path. This is a solved but real step: the file
must reach `android/app/src/main/assets/` and the iOS bundle root, and MapLibre then addresses it as
`pmtiles://asset://london.pmtiles` (Android) or a bundle-path URL (iOS).

**`expo-file-system`** in SDK 58 has the piece a downloaded map needs: the new `FileHandle` API provides
"low-level, random-access read and write operations" with an `offset` property to seek, and the docs'
example is literally reading a header then seeking to byte 100. That is the exact access pattern PMTiles
requires, so a file downloaded into `Paths.document` can be read by a JS-side PMTiles implementation
without loading it into memory. The docs also state the read cap: "The maximum number of bytes that can be
read in a single call is limited by the platform's ArrayBuffer size: 2 GB (signed 32-bit max) on Android,
and the 64-bit limit on iOS." Directory tiles are kilobytes, so the cap is irrelevant in practice.
Downloads land through `File.downloadFileAsync(url, destination)`.

**What Expo does not give you:** asset packs and ODR are store-level mechanisms beneath Expo's abstraction.
Expo CNG (this repo) regenerates `android/` and `ios/` at prebuild; an asset pack is a Gradle module and an
ODR pack is an Xcode target, both of which a prebuild would wipe unless a config plugin writes them. That
is the real cost of the pack routes in this repo, and it is why plain bundling or first-run download are
the only Expo-shaped options.

### 6.5 The delivery verdict against the offline rule

| Route | Fits the offline rule? | Fits a small app? | Expo-shaped? |
| --- | --- | --- | --- |
| Bundle in APK/IPA (z14 London, 60 MB) | Yes, fully offline at install | 126 MB APK, within all limits | Yes, with `assetExts` |
| Install-time asset pack | Yes, present at launch | Same bytes, separate accounting | No, needs a config plugin writing Gradle config |
| Fast-follow / on-demand pack | **No**: downloads after install, needs the store |  | No |
| ODR on iOS | No for on-demand packs; yes for initial-install tags |  | No; and deprecated, and the XS floor blocks the replacement |
| First-run download from a CDN | **No**: needs network before first use | Keeps the store size tiny | Yes, `expo-file-system` |
| Ship region fixed at build time (London) | Yes | Yes | Yes |

The owner's rule, "no network for the feature to work", admits exactly one of these for a user who
installs and flies: **the map must be inside the installed app**. That fixes the region choice at build
time, which section 7 returns to.

---

## 7. The killer question: can a usable whole-world map ship offline?

**No. The arithmetic, using only the measured numbers above:**

The user must recognise their own surroundings (brief section 1: "a map gives them streets, buildings and
the shape of their own road"). Section 4 establishes that needs z13 minimum, z14 comfortably, z15 for
individual buildings. Section 2.3 measures the whole planet at those caps:

| Whole planet to | Size | Verdict |
| --- | --- | --- |
| z13 | 35.7 GB | 10x the 4 GB Android cumulative install cap |
| z14 | 68.4 GB | 17x the cap, 2x the 34 GB absolute Play maximum |
| z15 | 138.4 GB | 4x the absolute Play maximum |

Android's largest possible offline install, using every pack mechanism at maximum, is 34 GB total
compressed download, and even that requires on-demand packs that download after install (breaking the
offline rule). The install-time-only ceiling is **4 GB**. A z13 planet at 35.7 GB does not fit 4 GB by a
factor of 9. A z12 planet at 17.7 GB does not fit by a factor of 4.4, and z12 is the zoom where
residential streets first appear, still too coarse to recognise a road. iOS is no better: 4 GB app bundle
plus at most 4 GB of initial-install ODR on the old-target tier this app's floor device requires.

There is no compression trick left: the archive is already gzip-compressed MVT with cross-zoom
deduplication, and the 138 GB IS the compressed size.

**So the honest verdict is: only a region, or a two-tier design.**

### 7.1 What a region costs

From section 3.3, measured:

| Region | z13 | z14 | z15 |
| --- | --- | --- | --- |
| Greater London | 28 MB | 60 MB | 141 MB |
| United Kingdom | 719 MB | (not measured; the doubling rule extrapolates to ~1.5 GB) |  |
| Makkah city | 3.8 MB |  | 6.1 MB |

A single city at z14 is four times the 15 MB audio folder. Against the 66 MB baseline, a 60 MB London
map makes a 126 MB APK. Against what the user gets, the brief's own framing, it buys the streets of
exactly one city.

### 7.2 How a region could be chosen without a network

This is the trap in the region plan, and it has three honest answers:

1. **Fixed at build time.** The app ships London because the app is London (`ai/AGENTS.md`: "London-only
   for now"). This needs no network and no choice, and matches the product's stated scope. The qibla
   feature works fully offline for every user in the shipped region, and for no user outside it.
2. **Chosen at first run, before offline mode begins.** The app already fetches prayer data on first
   sync; the same online moment could fetch the region around the user's position. This respects
   "works offline after first sync", the app's own documented behaviour (ai/AGENTS.md invariant), but it
   breaks "no network for the feature to work" read strictly. It is the owner's ruling to make
   (ASSUMPTIONS.md B3 flags exactly this).
3. **Derived from the position at install.** A z6 planet (45 MB, all countries, motorways) bundled for
   everyone, plus a high-zoom city pack fetched when the user's position first resolves. The z6 tier is
   the fallback that always works; the detail tier is the part that needs one network moment. This
   hybrid is the only design that gives every user something while giving most users everything.

There is no fourth answer. A phone with no network and no shipped region cannot know what is beyond the
region, and no on-device dataset smaller than gigabytes contains the world's streets.

### 7.3 The one-sentence answer for the plan

A whole-world offline map at recognition detail is 35 to 138 GB against a 4 GB install ceiling: it does
not ship, on either platform, under any delivery mechanism Google or Apple publish. A single-region map
at z14 is 60 MB measured for London, fits plain bundling with no asset packs, and satisfies the offline
rule only if the region is fixed at build time, which the London-only product scope already is.

---

## What I attacked in my own conclusion

I tried to break each finding from a different angle. What survived and what did not:

- **"The 4x per zoom claim is false."** I attacked my own measurement by re-deriving sizes a second way:
  the archive's total (138.45 GB from `content-length`) against my extent walk's z15 boundary plus the
  z15 increment. The header's tile-data length is 138,095,603,089 bytes and my walk accounted for
  68,409,118,611 bytes through z14, leaving 69.69 GB for z15 alone, a 2.13x ratio to z14's own increment.
  A second cross-check on tile counts: the header says 1,431,655,765 addressed tiles, which is exactly
  the full z0 to z15 pyramid count ((4^16 minus 1) / 3). My walk's per-zoom run-length sums to
  361,256,018 for z0 to z14 against the pyramid's 357,913,941, a 0.9 percent overcount explained by
  entries whose run length crosses the z15 boundary being attributed to their starting zoom. The byte
  ratios (1.8x to 2.8x from z9 up) also match Protomaps' own published "roughly doubles" guidance. The
  4x intuition survives only for tile COUNT, which the arithmetic proves exactly: each zoom holds
  precisely 4 times the tiles of the previous. **Survived.**

- **"The extent method is wrong for non-clustered archives."** It would be, but the header says
  `clustered: 1` and the docs require extract sources to be clustered. I also sanity-checked the first
  leaf directory decoded against the z0 entry (tileId 0, offset 0, length 66,795) and it matched the
  tile I fetched directly. **Survived, for this archive.**

- **"Directory bytes are unbounded overhead at high zoom."** I added them at the archive's measured 1.98
  bytes per entry; even at z14 they are 116 MB of 68.4 GB, 0.2 percent. **Irrelevant, survived.**

- **"Region sizes might be double-counted through deduplication."** My region sums count each unique
  blob offset once (a Set keyed on offset), which is what a real extract writes, since extract preserves
  the archive's deduplication. If a future CLI version rewrote without dedup, sizes would grow. The
  London z14 60 MB figure could be checked against a real `pmtiles extract` run, which I could not do
  without installing the binary; **flagged as the one number a five-minute CLI run should confirm
  before the plan cites it.**

- **"Maybe a raster basemap is smaller."** I did not measure raster tiles, and OpenMapTiles-style raster
  at z14 for London would be gigabytes (PNG tiles per z14 tile at ~10 to 40 KB times 1,386 tiles is
  14 to 55 MB for the top zoom alone, but every raster pyramid needs all lower zooms fully painted, and
  raster cannot drop layers). Vector dominates raster at every zoom for this use case; the comparison is
  safe by construction. **Survived without measurement, on the structure of the formats.**

- **"The delivery limits might have changed."** Every limit above is quoted from the live official pages
  fetched during this session (Play Console Help, developer.android.com, developer.apple.com), dated
  where the page carries a date. The one soft spot: Apple's ODR page is the current one but ODR is
  deprecated from iOS 27, so any plan relying on ODR is building on a removal path. I recorded that
  rather than choosing it. **Survived with the deprecation caveat attached.**

- **"London is unrepresentative."** True, and that is why Makkah is in the table: 6.1 MB to z15 against
  London's 141 MB. Region cost varies by two orders of magnitude with population density. Any plan
  quoting "60 MB" for a region must name the region. **Survived, with the variance stated.**

- **The biggest thing I could not verify: the actual on-device read performance of a bundled PMTiles
  through MapLibre React Native on the 3T.** Sizes and limits are settled; whether a 60 MB archive opens
  and renders in acceptable time on the floor device is question 2's to answer, and no amount of archive
  measurement substitutes for it.

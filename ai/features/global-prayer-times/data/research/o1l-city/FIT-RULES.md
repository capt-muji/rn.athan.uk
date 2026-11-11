# O1l fit rules (carried forward from O1k, owner order 2026-11-10, still binding)

Binding on every agent that fits anything this round. Fits now run INSIDE the wave that captures
the data; there is no separate fit phase unless the parent dispatches one.

1. FIT ALL YEARS HELD. Every fitting job uses the FULL span of dated data in hand, not one year.
   One recipe across the whole span, then the per-year breakdown underneath: exact/within-1/worst
   per year, and the between-year stability verdict (parameters frozen vs shifted). Confidence
   comes from the span.
2. HARVEST THE FUTURE where a surface serves it, then fit across it. Known far-horizon surfaces:
   - Kazakhstan muftyat.kz: serves any year (probes render to 2100).
   - Muhammadiyah KHGT API (Indonesia): 2025-2035 any coordinate.
   - Saudi umqserv: Hijri years to 1500H (~Nov 2076).
   - Kyrgyzstan muftiyat.kg JSON API: any two-month window in any year.
   - Tajikistan /tj/namaz/ntime: archive 2014-12 to present (endpoint intermittent; score what
     you actually bank).
   - Tunisia meteo.tn dated archive: 2019-10-31 back to, one day per request.
   - Oman calendar_page2.asp: 2021-2031.
   - Niger BUTIN portal: currentYear-1..+6 per region.
3. Latitude framing the owner set: near-equator surfaces change little year to year; high-latitude
   surfaces swing most. Report each fit's seasonal amplitude (Jan vs Jul fajr span) beside its
   between-year stability, so confidence reads in both dimensions.
4. Deliverable per fit: the one recipe, per-year scores, the stability verdict, the seasonal
   amplitude, and the span covered in days. State the engine used (adhan 4.4.6 vs own solar
   engine) — where a platform table reproduces on a PrayTimes-v2-family engine at zero margins,
   record that engine with the fit and say so.

Grading vocabulary (owner ruling T-667 #6943, frozen-generation precedent T-668 #6986):
A = 2-3+ distinct fitted years on one recipe; provisional = one published cycle; community =
fitted non-authority surface; candidate = dated data, no fit; F = structurally closed;
FALLBACK = no surface. Byte-identical relabelled editions are ONE computed generation and never
lift provisional to A. Recomputed years (Algeria class) are a genuine multi-year test.

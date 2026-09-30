# Primary PDFs and images: fetched, measured, not committed

Every measurement in `R9` and `R5` reads the EXTRACTED text beside it (`*.tsv`, `*.txt`), never the original
binary, so the originals are re-downloadable evidence rather than inputs. They are left out to keep the research
tree small. Re-fetch any of them from the URL below if a figure needs re-deriving from the source.

| File not committed | Size | Source URL | What was extracted from it, and committed |
| --- | --- | --- | --- |
| `mr-imsakia-1446.pdf` | 6.4 MB | Mauritania, Ministry of Islamic Affairs and Original Education, per-city Ramadan imsakia | `mr-p4.txt` (Nema), `mr-p9.txt` (Rosso), `mr-p11.txt` (Nouadhibou), read by `measure-mauritania.mjs` |
| `dz-alger-1448.pdf` | 3.5 MB | Algeria, `marw.gov.dz`, the ministry's own annual Algiers calendar | `dz-alger-p1.tsv` through `dz-alger-p7.tsv`, 135 days |
| `be-emb-2026.pdf` | 1.4 MB | Belgium, Executief van de Moslims van België, `horaire_priere_emb_2026.pdf` | `be-emb-2026.tsv` and `be-emb-2026.txt`, read by `measure-belgium.mjs` |
| `lk-colombo-sep.jpg` | 660 KB | Sri Lanka, ACJU monthly district-group timetable | read directly in the report; ACJU publishes images, not data |
| `az-baki-2026-09.webp` | 655 KB | Azerbaijan, Caucasus Muslims Board, Baku September 2026 | OCR'd locally with macOS Vision; the recovered values are in `R5` |

The two OCR'd sources are the weakest links in the programme's evidence chain and are flagged as such in
`ASSUMPTIONS.md` (A23). The three PDFs are machine-extracted and are not.

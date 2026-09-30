// Local OCR helper for R5: reads a scanned/rendered prayer timetable image with the
// macOS Vision framework. Used where an authority publishes its table only as an image
// (Azerbaijan's Caucasus Muslims Board). Nothing is installed; Vision ships with macOS.
import Foundation
import Vision
import AppKit

let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  FileHandle.standardError.write("cannot read image\n".data(using: .utf8)!); exit(1)
}
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
req.recognitionLanguages = ["en-US"]
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
var lines: [(CGFloat, CGFloat, String)] = []
for obs in (req.results ?? []) {
  guard let c = obs.topCandidates(1).first else { continue }
  lines.append((obs.boundingBox.midY, obs.boundingBox.midX, c.string))
}
// group into rows by y, then order left to right
lines.sort { $0.0 > $1.0 }
var rows: [[(CGFloat, String)]] = []
var cur: [(CGFloat, String)] = []
var lastY: CGFloat = -1
for (y, x, s) in lines {
  if lastY < 0 || abs(y - lastY) < 0.006 { cur.append((x, s)) }
  else { rows.append(cur); cur = [(x, s)] }
  lastY = y
}
if !cur.isEmpty { rows.append(cur) }
for r in rows { print(r.sorted { $0.0 < $1.0 }.map { $0.1 }.joined(separator: "\t")) }

// Local PDF reader for R9. Tries PDFKit's embedded text layer first; where the page
// is a scanned image (Algeria's ministry calendar is), it renders the page and runs
// the macOS Vision OCR over it. Nothing is installed; PDFKit and Vision ship with macOS.
//
// usage: swift pdfocr.swift <file.pdf> [pageIndex] [--ocr] [--scale N]
import Foundation
import PDFKit
import Vision
import AppKit

let args = CommandLine.arguments
let path = args[1]
let page = args.count > 2 && Int(args[2]) != nil ? Int(args[2])! : 0
let forceOCR = args.contains("--ocr")
var scale: CGFloat = 3
if let i = args.firstIndex(of: "--scale"), i + 1 < args.count, let s = Double(args[i + 1]) { scale = CGFloat(s) }

guard let doc = PDFDocument(url: URL(fileURLWithPath: path)) else {
  FileHandle.standardError.write("cannot open pdf\n".data(using: .utf8)!); exit(1)
}
FileHandle.standardError.write("pages=\(doc.pageCount)\n".data(using: .utf8)!)
guard let p = doc.page(at: page) else {
  FileHandle.standardError.write("no such page\n".data(using: .utf8)!); exit(1)
}

if !forceOCR, let s = p.string, s.trimmingCharacters(in: .whitespacesAndNewlines).count > 40 {
  print(s); exit(0)
}

let box = p.bounds(for: .mediaBox)
let w = Int(box.width * scale), h = Int(box.height * scale)
guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { exit(1) }
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.scaleBy(x: scale, y: scale)
ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
p.draw(with: .mediaBox, to: ctx)
guard let cg = ctx.makeImage() else { exit(1) }

let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
req.recognitionLanguages = ["en-US"]
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
var items: [(CGFloat, CGFloat, String)] = []
for obs in (req.results ?? []) {
  guard let c = obs.topCandidates(1).first else { continue }
  items.append((obs.boundingBox.midY, obs.boundingBox.midX, c.string))
}
items.sort { $0.0 > $1.0 }
var rows: [[(CGFloat, String)]] = []
var cur: [(CGFloat, String)] = []
var lastY: CGFloat = -1
for (y, x, s) in items {
  if lastY < 0 || abs(y - lastY) < 0.005 { cur.append((x, s)) }
  else { rows.append(cur); cur = [(x, s)] }
  lastY = y
}
if !cur.isEmpty { rows.append(cur) }
for r in rows { print(r.sorted { $0.0 < $1.0 }.map { $0.1 }.joined(separator: "\t")) }

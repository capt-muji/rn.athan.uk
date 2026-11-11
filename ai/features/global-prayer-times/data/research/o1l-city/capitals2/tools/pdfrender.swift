import Foundation
import PDFKit
import AppKit
import Vision

let args = CommandLine.arguments
guard args.count >= 4 else { print("usage: pdfrender <pdf> <outdir> <prefix> [ocr]"); exit(1) }
let pdfURL = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
let prefix = args[3]
let doOCR = args.count > 4 && args[4] == "ocr"
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
guard let doc = PDFDocument(url: pdfURL) else { print("cannot open"); exit(1) }
for i in 0..<doc.pageCount {
    guard let page = doc.page(at: i) else { continue }
    let box = page.bounds(for: .mediaBox)
    let scale: CGFloat = 2.5
    let w = Int(box.width * scale), h = Int(box.height * scale)
    guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.scaleBy(x: scale, y: scale)
    ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
    page.draw(with: .mediaBox, to: ctx)
    guard let cg = ctx.makeImage() else { continue }
    let rep = NSBitmapImageRep(cgImage: cg)
    if let png = rep.representation(using: .png, properties: [:]) {
        let f = outDir.appendingPathComponent("\(prefix)-p\(i+1).png")
        try? png.write(to: f)
        print("wrote \(f.path)")
    }
    if doOCR {
        let req = VNRecognizeTextRequest()
        req.recognitionLevel = .accurate
        req.usesLanguageCorrection = false
        req.recognitionLanguages = ["en-US", "ne-Devanagari"]
        let handler = VNImageRequestHandler(cgImage: cg, options: [:])
        try? handler.perform([req])
        let txt = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " | ")
        let tf = outDir.appendingPathComponent("\(prefix)-p\(i+1).ocr.txt")
        try? txt.write(to: tf, atomically: true, encoding: .utf8)
        print("ocr p\(i+1): \(txt.prefix(400))")
    }
}

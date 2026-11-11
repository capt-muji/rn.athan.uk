import Foundation
import Vision
import AppKit

// OCR every image given on the command line. Output: one JSON array per image on stdout,
// preceded by a "=== <path>" line. Boxes are normalised, origin bottom-left.
for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path),
          let tiff = img.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let cg = rep.cgImage else {
        FileHandle.standardError.write("cannot load \(path)\n".data(using: .utf8)!)
        continue
    }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    var level = "accurate"
    do {
        try handler.perform([req])
    } catch {
        req.recognitionLevel = .fast
        level = "fast"
        do { try handler.perform([req]) } catch {
            FileHandle.standardError.write("ocr failed \(path): \(error)\n".data(using: .utf8)!)
            continue
        }
    }
    var items: [[String]] = []
    for obs in (req.results ?? []) {
        guard let top = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        items.append([String(format: "%.5f", b.origin.x), String(format: "%.5f", b.origin.y),
                      String(format: "%.5f", b.size.width), String(format: "%.5f", b.size.height),
                      String(format: "%.3f", top.confidence), top.string])
    }
    print("=== \(path)")
    print("LEVEL \(level)")
    for it in items {
        print(it.joined(separator: "\t"))
    }
}

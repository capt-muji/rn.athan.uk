import Foundation
import Vision
import AppKit

// Emits one line per recognised text observation: x y w h confidence text
// Boxes are in normalised image coordinates with origin at bottom-left.
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
    req.recognitionLanguages = ["en-US"]
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do { try handler.perform([req]) } catch {
        FileHandle.standardError.write("ocr failed \(path): \(error)\n".data(using: .utf8)!)
        continue
    }
    print("=== \(path)")
    for obs in (req.results ?? []) {
        guard let top = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        print(String(format: "%.4f %.4f %.4f %.4f %.3f\t%@",
                     b.origin.x, b.origin.y, b.size.width, b.size.height,
                     top.confidence, top.string))
    }
}

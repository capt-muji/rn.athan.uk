import Foundation
import PDFKit
import AppKit

// usage: render <pdf> <pageno 1-based> <out.png> [scale] [fx0 fy0 fx1 fy1]
// fx/fy are fractions of the page measured from the TOP-LEFT corner.
func die(_ m: String) -> Never {
    FileHandle.standardError.write((m + "\n").data(using: .utf8)!)
    exit(1)
}

let args = CommandLine.arguments
guard args.count >= 4 else { die("usage: render <pdf> <page> <out.png> [scale] [fx0 fy0 fx1 fy1]") }
let url = URL(fileURLWithPath: args[1])
let pageNo = Int(args[2]) ?? 1
let out = args[3]
let scale = args.count > 4 ? (Double(args[4]) ?? 3.0) : 3.0

guard let doc = PDFDocument(url: url), let page = doc.page(at: pageNo - 1) else { die("cannot open page") }
let box = page.bounds(for: .mediaBox)

var crop = box
if args.count >= 9 {
    let fx0 = Double(args[5]) ?? 0, fy0 = Double(args[6]) ?? 0
    let fx1 = Double(args[7]) ?? 1, fy1 = Double(args[8]) ?? 1
    crop = CGRect(x: box.minX + CGFloat(fx0) * box.width,
                  y: box.minY + CGFloat(1 - fy1) * box.height,
                  width: CGFloat(fx1 - fx0) * box.width,
                  height: CGFloat(fy1 - fy0) * box.height)
}

let w = Int(crop.width * scale), h = Int(crop.height * scale)
guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { die("ctx") }
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.scaleBy(x: scale, y: scale)
ctx.translateBy(x: -crop.minX, y: -crop.minY)
page.draw(with: .mediaBox, to: ctx)
guard let img = ctx.makeImage() else { die("img") }
let rep = NSBitmapImageRep(cgImage: img)
guard let png = rep.representation(using: .png, properties: [:]) else { die("png") }
try png.write(to: URL(fileURLWithPath: out))
print("wrote \(out) \(w)x\(h)")

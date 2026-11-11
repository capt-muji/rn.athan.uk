import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// usage: render <pdf> <outprefix> <dpi> [firstPage] [lastPage]
let args = CommandLine.arguments
guard args.count >= 4 else { print("usage: render pdf outprefix dpi [first] [last]"); exit(1) }
let url = URL(fileURLWithPath: args[1])
let prefix = args[2]
let dpi = Double(args[3]) ?? 300
let first = args.count > 4 ? Int(args[4])! : 1
let last = args.count > 5 ? Int(args[5])! : Int.max

guard let doc = CGPDFDocument(url as CFURL) else { print("cannot open"); exit(2) }
let n = doc.numberOfPages
print("pages \(n)")
let scale = dpi / 72.0
for i in first...min(last, n) {
    guard let page = doc.page(at: i) else { continue }
    let box = page.getBoxRect(.mediaBox)
    let w = Int(box.width * scale), h = Int(box.height * scale)
    let cs = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                              space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { continue }
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.scaleBy(x: scale, y: scale)
    ctx.drawPDFPage(page)
    guard let img = ctx.makeImage() else { continue }
    let out = URL(fileURLWithPath: String(format: "%@-p%02d.png", prefix, i))
    guard let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.png.identifier as CFString, 1, nil) else { continue }
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
    print("wrote \(out.lastPathComponent) \(w)x\(h)")
}

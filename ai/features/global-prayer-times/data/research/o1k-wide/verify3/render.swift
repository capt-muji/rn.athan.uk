import Foundation
import PDFKit
import AppKit

// verify3 renderer: render <pdf> <page1based> <out.png> <scale> [fx0 fy0 fx1 fy1] (fractions from top-left)
let a = CommandLine.arguments
guard a.count >= 5 else { exit(2) }
guard let doc = PDFDocument(url: URL(fileURLWithPath: a[1])), let page = doc.page(at: Int(a[2])! - 1) else { exit(3) }
let scale = Double(a[4]) ?? 2
var box = page.bounds(for: .mediaBox)
if a.count >= 9 {
  let fx0 = Double(a[5])!, fy0 = Double(a[6])!, fx1 = Double(a[7])!, fy1 = Double(a[8])!
  box = CGRect(x: box.minX + CGFloat(fx0) * box.width,
               y: box.minY + CGFloat(1 - fy1) * box.height,
               width: CGFloat(fx1 - fx0) * box.width,
               height: CGFloat(fy1 - fy0) * box.height)
}
let w = Int(box.width * scale), h = Int(box.height * scale)
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.scaleBy(x: scale, y: scale)
ctx.translateBy(x: -box.minX, y: -box.minY)
page.draw(with: .mediaBox, to: ctx)
let img = ctx.makeImage()!
let rep = NSBitmapImageRep(cgImage: img)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[3]))
print("ok \(w)x\(h)")


import Foundation
import CoreText
import AppKit

let size: CGFloat = 18
let input = FileHandle.standardInput.readDataToEndOfFile()
let strings = (try! JSONSerialization.jsonObject(with: input)) as! [String]
var out: [Double] = []
for s in strings {
    let base = NSFont(name: "Roboto-Regular", size: size) ?? NSFont.systemFont(ofSize: size)
    let attr = NSAttributedString(string: s, attributes: [.font: base])
    let line = CTLineCreateWithAttributedString(attr)
    out.append(Double(CTLineGetTypographicBounds(line, nil, nil, nil)))
}
print(String(data: try! JSONSerialization.data(withJSONObject: out), encoding: .utf8)!)

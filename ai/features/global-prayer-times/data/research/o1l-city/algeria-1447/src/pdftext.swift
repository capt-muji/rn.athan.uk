import Foundation
import PDFKit
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let doc = PDFDocument(url: url)!
for i in 0..<doc.pageCount {
  let s = doc.page(at: i)?.string ?? ""
  print("PAGE \(i+1) chars=\(s.count)")
  if !s.isEmpty { print(s.prefix(300)) }
}

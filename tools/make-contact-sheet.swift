import AppKit
import Foundation

let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else {
    fputs("usage: make-contact-sheet.swift output.png image...\n", stderr)
    exit(2)
}

let output = URL(fileURLWithPath: args[0])
let imagePaths = args.dropFirst().map { URL(fileURLWithPath: $0) }
let cellW: CGFloat = 180
let cellH: CGFloat = 230
let labelH: CGFloat = 34
let columns = 5
let rows = Int(ceil(Double(imagePaths.count) / Double(columns)))
let size = NSSize(width: CGFloat(columns) * cellW, height: CGFloat(rows) * cellH)

let canvas = NSImage(size: size)
canvas.lockFocus()
NSColor(calibratedWhite: 0.08, alpha: 1).setFill()
NSRect(origin: .zero, size: size).fill()

let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center
paragraph.lineBreakMode = .byTruncatingMiddle
let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 10),
    .foregroundColor: NSColor.white,
    .paragraphStyle: paragraph
]

for (i, url) in imagePaths.enumerated() {
    guard let image = NSImage(contentsOf: url) else { continue }
    let col = i % columns
    let row = rows - 1 - (i / columns)
    let x = CGFloat(col) * cellW
    let y = CGFloat(row) * cellH
    NSColor(calibratedWhite: 0.14, alpha: 1).setFill()
    NSRect(x: x + 5, y: y + 5, width: cellW - 10, height: cellH - 10).fill()

    let maxW = cellW - 24
    let maxH = cellH - labelH - 22
    let scale = min(maxW / image.size.width, maxH / image.size.height)
    let drawW = image.size.width * scale
    let drawH = image.size.height * scale
    let drawRect = NSRect(x: x + (cellW - drawW) / 2, y: y + labelH + (maxH - drawH) / 2, width: drawW, height: drawH)
    image.draw(in: drawRect, from: .zero, operation: .sourceOver, fraction: 1)

    let label = url.pathComponents.suffix(3).joined(separator: "/")
    label.draw(in: NSRect(x: x + 8, y: y + 9, width: cellW - 16, height: labelH - 8), withAttributes: attrs)
}

canvas.unlockFocus()
guard
    let tiff = canvas.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
else {
    fputs("failed to render contact sheet\n", stderr)
    exit(1)
}
try png.write(to: output)

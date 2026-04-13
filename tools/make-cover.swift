import AppKit
import Foundation

func image(_ path: String) -> NSImage {
    let url = URL(fileURLWithPath: path)
    guard let image = NSImage(contentsOf: url) else {
        fatalError("Missing image: \(path)")
    }
    return image
}

func drawAspectFill(_ image: NSImage, in rect: NSRect, alpha: CGFloat = 1) {
    let srcSize = image.size
    let scale = max(rect.width / srcSize.width, rect.height / srcSize.height)
    let srcW = rect.width / scale
    let srcH = rect.height / scale
    let src = NSRect(
        x: (srcSize.width - srcW) / 2,
        y: (srcSize.height - srcH) / 2,
        width: srcW,
        height: srcH
    )
    image.draw(in: rect, from: src, operation: .sourceOver, fraction: alpha)
}

func drawAspectFit(_ image: NSImage, in rect: NSRect, alpha: CGFloat = 1) {
    let scale = min(rect.width / image.size.width, rect.height / image.size.height)
    let w = image.size.width * scale
    let h = image.size.height * scale
    let target = NSRect(x: rect.midX - w / 2, y: rect.midY - h / 2, width: w, height: h)
    image.draw(in: target, from: .zero, operation: .sourceOver, fraction: alpha)
}

func drawText(_ text: String, in rect: NSRect, font: NSFont, color: NSColor, alignment: NSTextAlignment = .left, stroke: CGFloat = 0) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    paragraph.lineBreakMode = .byWordWrapping
    let shadow = NSShadow()
    shadow.shadowColor = NSColor.black.withAlphaComponent(0.75)
    shadow.shadowOffset = NSSize(width: 0, height: -5)
    shadow.shadowBlurRadius = 9
    var attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .paragraphStyle: paragraph,
        .kern: 2,
        .shadow: shadow
    ]
    if stroke > 0 {
        attrs[.strokeColor] = NSColor.black.withAlphaComponent(0.75)
        attrs[.strokeWidth] = -stroke
    }
    NSString(string: text).draw(in: rect, withAttributes: attrs)
}

let output = CommandLine.arguments.dropFirst().first ?? "games/cover/56203040.jpg"
let size = NSSize(width: 1200, height: 630)
let canvas = NSImage(size: size)

let police = image("db/pic/room/88070078.jpg")
let dungeon = image("db/pic/room/38586040.jpg")
let street = image("db/pic/room/60598295.jpg")
let hero = image("db/pic/char/37537573.gif")
let wing = image("db/pic/char/38749728.gif")
let red = image("db/pic/char2/43315630.gif")
let potion = image("db/pic/item/29763779.gif")
let cloth = image("db/pic/item/55084350.png")

canvas.lockFocus()

drawAspectFill(police, in: NSRect(origin: .zero, size: size), alpha: 1)

NSGradient(colors: [
    NSColor(calibratedRed: 0.02, green: 0.03, blue: 0.08, alpha: 0.86),
    NSColor(calibratedRed: 0.12, green: 0.02, blue: 0.03, alpha: 0.34),
    NSColor(calibratedRed: 0.96, green: 0.38, blue: 0.08, alpha: 0.26)
])!.draw(in: NSRect(origin: .zero, size: size), angle: 0)

drawAspectFill(street, in: NSRect(x: 0, y: 0, width: 1200, height: 630), alpha: 0.18)
drawAspectFill(dungeon, in: NSRect(x: 0, y: 0, width: 520, height: 630), alpha: 0.52)

NSColor.black.withAlphaComponent(0.52).setFill()
NSBezierPath(rect: NSRect(x: 0, y: 0, width: 1200, height: 160)).fill()

NSColor(calibratedRed: 0.99, green: 0.76, blue: 0.18, alpha: 0.9).setFill()
NSBezierPath(rect: NSRect(x: 0, y: 154, width: 1200, height: 6)).fill()
NSColor(calibratedRed: 0.78, green: 0.05, blue: 0.08, alpha: 0.9).setFill()
NSBezierPath(rect: NSRect(x: 0, y: 142, width: 1200, height: 8)).fill()

drawAspectFit(red, in: NSRect(x: 55, y: 90, width: 300, height: 500), alpha: 0.94)
drawAspectFit(hero, in: NSRect(x: 360, y: 60, width: 320, height: 540), alpha: 0.98)
drawAspectFit(wing, in: NSRect(x: 745, y: 110, width: 395, height: 405), alpha: 0.96)
drawAspectFit(potion, in: NSRect(x: 1020, y: 70, width: 120, height: 120), alpha: 0.88)
drawAspectFit(cloth, in: NSRect(x: 925, y: 55, width: 112, height: 112), alpha: 0.88)

let titleFont = NSFont(name: "PingFangTC-Semibold", size: 78) ?? NSFont.boldSystemFont(ofSize: 78)
let subtitleFont = NSFont(name: "PingFangTC-Medium", size: 28) ?? NSFont.systemFont(ofSize: 28, weight: .medium)
let tagFont = NSFont(name: "PingFangTC-Medium", size: 22) ?? NSFont.systemFont(ofSize: 22, weight: .medium)

drawText("銀行逃犯逃脫記", in: NSRect(x: 58, y: 462, width: 760, height: 106), font: titleFont, color: NSColor.white, stroke: 4)
drawText("完成版", in: NSRect(x: 72, y: 418, width: 260, height: 46), font: subtitleFont, color: NSColor(calibratedRed: 1.0, green: 0.83, blue: 0.28, alpha: 1), stroke: 2)
drawText("搶案之後，出口只會留給做對選擇的人。", in: NSRect(x: 58, y: 54, width: 780, height: 50), font: tagFont, color: NSColor.white.withAlphaComponent(0.94), stroke: 1.5)

NSColor(calibratedRed: 0.82, green: 0.06, blue: 0.09, alpha: 0.95).setFill()
let badge = NSBezierPath(roundedRect: NSRect(x: 930, y: 500, width: 210, height: 58), xRadius: 8, yRadius: 8)
badge.fill()
drawText("GOOD END", in: NSRect(x: 948, y: 513, width: 176, height: 32), font: tagFont, color: NSColor.white, alignment: .center, stroke: 0.5)

canvas.unlockFocus()

guard
    let tiff = canvas.tiffRepresentation,
    let rep = NSBitmapImageRep(data: tiff),
    let jpg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.92])
else {
    fatalError("Failed to render cover")
}

try jpg.write(to: URL(fileURLWithPath: output))
print(output)

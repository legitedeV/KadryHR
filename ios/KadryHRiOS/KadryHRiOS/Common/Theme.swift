import SwiftUI

enum KadryTheme {
  static let background = Color(red: 0.07, green: 0.08, blue: 0.12)
  static let surface = Color(red: 0.12, green: 0.13, blue: 0.18)
  static let accent = Color(red: 0.39, green: 0.58, blue: 0.98)
  static let textPrimary = Color.white
  static let textSecondary = Color(red: 0.73, green: 0.75, blue: 0.82)
  static let destructive = Color(red: 0.96, green: 0.35, blue: 0.35)
}

struct KadryTextStyle: ViewModifier {
  let size: CGFloat
  let weight: Font.Weight
  let color: Color

  func body(content: Content) -> some View {
    content
      .font(.system(size: size, weight: weight))
      .foregroundStyle(color)
  }
}

extension View {
  func kadryText(size: CGFloat, weight: Font.Weight = .regular, color: Color = KadryTheme.textPrimary) -> some View {
    modifier(KadryTextStyle(size: size, weight: weight, color: color))
  }
}

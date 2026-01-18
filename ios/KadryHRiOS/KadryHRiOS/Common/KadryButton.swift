import SwiftUI

struct KadryPrimaryButtonStyle: ButtonStyle {
  var isLoading: Bool = false

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
      .background(KadryTheme.accent)
      .foregroundStyle(Color.white)
      .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
      .opacity(configuration.isPressed || isLoading ? 0.7 : 1.0)
  }
}

struct KadrySecondaryButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
      .background(KadryTheme.surface)
      .foregroundStyle(KadryTheme.textPrimary)
      .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
      .opacity(configuration.isPressed ? 0.7 : 1.0)
  }
}

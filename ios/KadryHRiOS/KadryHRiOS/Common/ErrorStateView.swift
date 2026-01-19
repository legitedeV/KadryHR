import SwiftUI

struct ErrorStateView: View {
  let title: String
  let message: String
  let actionTitle: String
  let action: () -> Void

  var body: some View {
    VStack(spacing: 12) {
      Text(title)
        .kadryText(size: 18, weight: .semibold)
      Text(message)
        .kadryText(size: 14, color: KadryTheme.textSecondary)
        .multilineTextAlignment(.center)
      Button(actionTitle, action: action)
        .buttonStyle(KadrySecondaryButtonStyle())
    }
    .padding(24)
    .frame(maxWidth: .infinity)
  }
}

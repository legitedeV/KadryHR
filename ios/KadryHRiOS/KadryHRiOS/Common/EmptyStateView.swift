import SwiftUI

struct EmptyStateView: View {
  let title: String
  let message: String

  var body: some View {
    VStack(spacing: 12) {
      Text(title)
        .kadryText(size: 18, weight: .semibold)
      Text(message)
        .kadryText(size: 14, color: KadryTheme.textSecondary)
        .multilineTextAlignment(.center)
    }
    .padding(24)
    .frame(maxWidth: .infinity)
  }
}

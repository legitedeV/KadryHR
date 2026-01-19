import SwiftUI

struct LoadingOverlay: View {
  let text: String

  var body: some View {
    ZStack {
      Color.black.opacity(0.4).ignoresSafeArea()
      VStack(spacing: 12) {
        ProgressView()
          .progressViewStyle(CircularProgressViewStyle(tint: .white))
        Text(text)
          .kadryText(size: 14, weight: .medium, color: KadryTheme.textSecondary)
      }
      .padding(24)
      .background(KadryTheme.surface)
      .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
  }
}

import SwiftUI

struct NotificationsView: View {
  @StateObject private var viewModel: NotificationsViewModel

  init(apiClient: APIClient) {
    _viewModel = StateObject(wrappedValue: NotificationsViewModel(apiClient: apiClient))
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          Text("Powiadomienia")
            .kadryText(size: 22, weight: .bold)

          switch viewModel.state {
          case .idle, .loading:
            ProgressView()
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
          case .empty:
            EmptyStateView(title: "Brak powiadomień", message: "Wszystko jest na bieżąco.")
          case .error(let message):
            ErrorStateView(title: "Błąd", message: message, actionTitle: "Odśwież") {
              Task { await viewModel.loadNotifications() }
            }
          case .loaded(let notifications):
            VStack(spacing: 8) {
              ForEach(notifications) { notification in
                Button {
                  Task { await viewModel.markRead(id: notification.id) }
                } label: {
                  VStack(alignment: .leading, spacing: 6) {
                    Text(notification.title)
                      .kadryText(size: 14, weight: .semibold)
                    Text(notification.message)
                      .kadryText(size: 12, color: KadryTheme.textSecondary)
                    Text(notification.createdAt.formatted(date: .abbreviated, time: .shortened))
                      .kadryText(size: 11, color: KadryTheme.textSecondary)
                  }
                  .padding()
                  .frame(maxWidth: .infinity, alignment: .leading)
                  .background(notification.isRead ? KadryTheme.surface : KadryTheme.surface.opacity(0.8))
                  .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
              }
            }
          }
        }
        .padding(24)
      }
    }
    .task { await viewModel.loadNotifications() }
  }
}

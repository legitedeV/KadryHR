import SwiftUI

struct ProfileView: View {
  @StateObject private var viewModel: ProfileViewModel
  @ObservedObject var sessionManager: SessionManager

  init(apiClient: APIClient, sessionManager: SessionManager) {
    _viewModel = StateObject(wrappedValue: ProfileViewModel(apiClient: apiClient))
    self.sessionManager = sessionManager
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          Text("Profil")
            .kadryText(size: 22, weight: .bold)

          switch viewModel.state {
          case .idle, .loading:
            ProgressView()
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
          case .empty:
            EmptyStateView(title: "Brak profilu", message: "Nie udało się wczytać danych.")
          case .error(let message):
            ErrorStateView(title: "Błąd", message: message, actionTitle: "Odśwież") {
              Task { await viewModel.loadProfile() }
            }
          case .loaded(let user):
            profileCard(for: user)
          }

          environmentCard

          NavigationLink(destination: NotificationsView(apiClient: sessionManager.apiClient)) {
            HStack {
              Text("Powiadomienia")
                .kadryText(size: 14, weight: .semibold)
              Spacer()
              Image(systemName: "chevron.right")
            }
            .padding()
            .background(KadryTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
          }

          Button("Wyloguj") {
            Task { await sessionManager.logout() }
          }
          .buttonStyle(KadrySecondaryButtonStyle())
        }
        .padding(24)
      }
    }
    .task { await viewModel.loadProfile() }
  }

  private func profileCard(for user: User) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(user.fullName)
        .kadryText(size: 18, weight: .semibold)
      Text(user.email)
        .kadryText(size: 13, color: KadryTheme.textSecondary)
      Text(user.role.capitalized)
        .kadryText(size: 12, color: KadryTheme.textSecondary)
      if let organisation = user.organisation {
        Text(organisation.name)
          .kadryText(size: 12, color: KadryTheme.textSecondary)
      }
    }
    .padding()
    .background(KadryTheme.surface)
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
  }

  private var environmentCard: some View {
    let config = BuildConfiguration.current
    return VStack(alignment: .leading, spacing: 6) {
      Text("Środowisko")
        .kadryText(size: 14, weight: .semibold)
      Text(config.environmentName)
        .kadryText(size: 12, color: KadryTheme.textSecondary)
      Text("Wersja \(config.appVersion)")
        .kadryText(size: 12, color: KadryTheme.textSecondary)
    }
    .padding()
    .background(KadryTheme.surface)
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
  }
}

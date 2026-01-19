import SwiftUI

struct TeamView: View {
  @StateObject private var viewModel: TeamViewModel

  init(apiClient: APIClient) {
    _viewModel = StateObject(wrappedValue: TeamViewModel(apiClient: apiClient))
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          Text("Zespół")
            .kadryText(size: 22, weight: .bold)

          switch viewModel.state {
          case .idle, .loading:
            ProgressView()
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
          case .empty:
            EmptyStateView(title: "Brak pracowników", message: "W organizacji nie ma pracowników.")
          case .error(let message):
            ErrorStateView(title: "Błąd", message: message, actionTitle: "Odśwież") {
              Task { await viewModel.loadTeam() }
            }
          case .loaded(let members):
            VStack(spacing: 8) {
              ForEach(members) { member in
                VStack(alignment: .leading, spacing: 6) {
                  Text(member.displayName)
                    .kadryText(size: 14, weight: .semibold)
                  if let email = member.email {
                    Text(email)
                      .kadryText(size: 12, color: KadryTheme.textSecondary)
                  }
                }
                .padding()
                .background(KadryTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
              }
            }
          }
        }
        .padding(24)
      }
    }
    .task { await viewModel.loadTeam() }
  }
}

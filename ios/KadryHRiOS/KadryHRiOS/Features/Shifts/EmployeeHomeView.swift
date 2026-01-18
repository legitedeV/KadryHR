import SwiftUI

struct EmployeeHomeView: View {
  @StateObject private var viewModel: ShiftsViewModel

  init(apiClient: APIClient) {
    _viewModel = StateObject(wrappedValue: ShiftsViewModel(apiClient: apiClient))
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          Text("Twoje nadchodzące zmiany")
            .kadryText(size: 22, weight: .bold)

          switch viewModel.state {
          case .idle, .loading:
            ProgressView()
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
          case .empty:
            EmptyStateView(title: "Brak zmian", message: "Nie masz zaplanowanych zmian.")
          case .error(let message):
            ErrorStateView(title: "Błąd", message: message, actionTitle: "Odśwież") {
              Task { await loadUpcoming() }
            }
          case .loaded(let shifts):
            VStack(spacing: 8) {
              ForEach(shifts) { shift in
                ShiftRow(shift: shift)
              }
            }
          }
        }
        .padding(24)
      }
    }
    .task { await loadUpcoming() }
  }

  private func loadUpcoming() async {
    let calendar = Calendar.current
    let start = calendar.startOfDay(for: Date())
    let end = calendar.date(byAdding: .hour, value: 23, to: start) ?? start
    await viewModel.loadShifts(from: start, to: end)
  }
}

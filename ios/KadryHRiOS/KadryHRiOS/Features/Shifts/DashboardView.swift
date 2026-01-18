import SwiftUI

struct DashboardView: View {
  @StateObject private var viewModel: DashboardViewModel

  init(apiClient: APIClient) {
    _viewModel = StateObject(wrappedValue: DashboardViewModel(apiClient: apiClient))
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          Text("Dzisiejszy przegląd")
            .kadryText(size: 22, weight: .bold)

          summarySection
          shiftsSection
        }
        .padding(24)
      }
    }
    .task {
      await viewModel.loadDashboard()
    }
  }

  private var summarySection: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Zespół dzisiaj")
        .kadryText(size: 16, weight: .semibold)

      switch viewModel.summaryState {
      case .idle, .loading:
        ProgressView()
          .progressViewStyle(CircularProgressViewStyle(tint: .white))
      case .empty:
        EmptyStateView(title: "Brak zaplanowanych zmian", message: "Brak zmian w zespole na dziś.")
      case .error(let message):
        ErrorStateView(title: "Błąd", message: message, actionTitle: "Spróbuj ponownie") {
          Task { await viewModel.loadDashboard() }
        }
      case .loaded(let summary):
        VStack(spacing: 8) {
          ForEach(summary) { item in
            HStack {
              Text(item.employeeName)
                .kadryText(size: 14)
              Spacer()
              Text("\(item.hours, specifier: "%.1f") h")
                .kadryText(size: 14, weight: .semibold)
            }
            .padding()
            .background(KadryTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
          }
        }
      }
    }
  }

  private var shiftsSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Dzisiejsze zmiany")
        .kadryText(size: 16, weight: .semibold)

      switch viewModel.shiftsState {
      case .idle, .loading:
        ProgressView()
          .progressViewStyle(CircularProgressViewStyle(tint: .white))
      case .empty:
        EmptyStateView(title: "Brak zmian", message: "Nie masz zaplanowanych zmian na dziś.")
      case .error(let message):
        ErrorStateView(title: "Błąd", message: message, actionTitle: "Spróbuj ponownie") {
          Task { await viewModel.loadDashboard() }
        }
      case .loaded(let shifts):
        VStack(spacing: 8) {
          ForEach(shifts) { shift in
            ShiftRow(shift: shift)
          }
        }
      }
    }
  }
}

struct ShiftRow: View {
  let shift: Shift

  var body: some View {
    HStack(alignment: .top, spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        Text(shift.employee?.displayName ?? "Zmiana")
          .kadryText(size: 14, weight: .semibold)
        Text("\(shift.startsAt.formatted(date: .omitted, time: .shortened)) - \(shift.endsAt.formatted(date: .omitted, time: .shortened))")
          .kadryText(size: 12, color: KadryTheme.textSecondary)
      }
      Spacer()
      if let location = shift.location?.name {
        Text(location)
          .kadryText(size: 12, color: KadryTheme.textSecondary)
      }
    }
    .padding()
    .background(KadryTheme.surface)
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
  }
}

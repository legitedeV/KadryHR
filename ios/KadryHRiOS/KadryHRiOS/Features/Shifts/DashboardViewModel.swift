import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
  @Published private(set) var shiftsState: ViewState<[Shift]> = .idle
  @Published private(set) var summaryState: ViewState<[ShiftSummary]> = .idle

  private let apiClient: APIClient

  init(apiClient: APIClient) {
    self.apiClient = apiClient
  }

  func loadDashboard() async {
    let calendar = Calendar.current
    let start = calendar.startOfDay(for: Date())
    let end = calendar.date(byAdding: .hour, value: 23, to: start) ?? start

    await loadSummary(from: start, to: end)
    await loadTodayShifts(from: start, to: end)
  }

  private func loadSummary(from: Date, to: Date) async {
    summaryState = .loading
    let formatter = ISO8601DateFormatter()
    let queryItems = [
      URLQueryItem(name: "from", value: formatter.string(from: from)),
      URLQueryItem(name: "to", value: formatter.string(from: to))
    ]

    do {
      let summary: [ShiftSummary] = try await apiClient.request(.get("/api/shifts/summary", queryItems: queryItems))
      summaryState = summary.isEmpty ? .empty : .loaded(summary)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać podsumowania."
      summaryState = .error(message)
    }
  }

  private func loadTodayShifts(from: Date, to: Date) async {
    shiftsState = .loading
    let formatter = ISO8601DateFormatter()
    let queryItems = [
      URLQueryItem(name: "from", value: formatter.string(from: from)),
      URLQueryItem(name: "to", value: formatter.string(from: to))
    ]

    do {
      let shifts: [Shift] = try await apiClient.request(.get("/api/shifts", queryItems: queryItems))
      shiftsState = shifts.isEmpty ? .empty : .loaded(shifts)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać zmian."
      shiftsState = .error(message)
    }
  }
}

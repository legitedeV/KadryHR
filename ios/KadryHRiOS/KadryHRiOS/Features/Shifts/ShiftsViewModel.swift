import Foundation

@MainActor
final class ShiftsViewModel: ObservableObject {
  @Published private(set) var state: ViewState<[Shift]> = .idle

  private let apiClient: APIClient

  init(apiClient: APIClient) {
    self.apiClient = apiClient
  }

  func loadShifts(from: Date, to: Date) async {
    state = .loading
    let formatter = ISO8601DateFormatter()
    let queryItems = [
      URLQueryItem(name: "from", value: formatter.string(from: from)),
      URLQueryItem(name: "to", value: formatter.string(from: to))
    ]

    do {
      let shifts: [Shift] = try await apiClient.request(.get("/api/shifts", queryItems: queryItems))
      if shifts.isEmpty {
        state = .empty
      } else {
        state = .loaded(shifts)
      }
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać zmian."
      state = .error(message)
    }
  }
}

import Foundation

@MainActor
final class TeamViewModel: ObservableObject {
  @Published private(set) var state: ViewState<[EmployeeDirectoryEntry]> = .idle

  private let apiClient: APIClient

  init(apiClient: APIClient) {
    self.apiClient = apiClient
  }

  func loadTeam() async {
    state = .loading
    let queryItems = [URLQueryItem(name: "pageSize", value: "50")]

    do {
      let response: EmployeeDirectoryResponse = try await apiClient.request(.get("/api/employees", queryItems: queryItems))
      state = response.data.isEmpty ? .empty : .loaded(response.data)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać zespołu."
      state = .error(message)
    }
  }
}

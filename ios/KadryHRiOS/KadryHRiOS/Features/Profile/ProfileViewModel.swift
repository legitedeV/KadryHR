import Foundation

@MainActor
final class ProfileViewModel: ObservableObject {
  @Published private(set) var state: ViewState<User> = .idle

  private let apiClient: APIClient

  init(apiClient: APIClient) {
    self.apiClient = apiClient
  }

  func loadProfile() async {
    state = .loading
    do {
      let user: User = try await apiClient.request(.get("/api/users/profile"))
      apiClient.cacheUser(user)
      state = .loaded(user)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać profilu."
      state = .error(message)
    }
  }
}

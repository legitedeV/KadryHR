import Foundation

@MainActor
final class NotificationsViewModel: ObservableObject {
  @Published private(set) var state: ViewState<[AppNotification]> = .idle

  private let apiClient: APIClient

  init(apiClient: APIClient) {
    self.apiClient = apiClient
  }

  func loadNotifications() async {
    state = .loading
    do {
      let response: NotificationListResponse = try await apiClient.request(.get("/api/notifications", queryItems: [URLQueryItem(name: "pageSize", value: "20")]))
      state = response.data.isEmpty ? .empty : .loaded(response.data)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać powiadomień."
      state = .error(message)
    }
  }

  func markRead(id: String) async {
    do {
      let request = try APIRequest.patch("/api/notifications/\(id)/read", body: EmptyBody())
      try await apiClient.requestNoResponse(request)
      await loadNotifications()
    } catch {
      // ignore for now
    }
  }
}

private struct EmptyBody: Encodable {}

import Foundation

protocol SessionManaging {
  func login(email: String, password: String) async throws
}

@MainActor
final class SessionManager: ObservableObject, SessionManaging {
  enum State {
    case loading
    case authenticated(User)
    case unauthenticated
  }

  @Published private(set) var state: State = .loading

  let apiClient: APIClient
  private let analytics: AnalyticsTracking
  private let tokenStore: TokenStoring

  init(apiClient: APIClient = APIClient(), analytics: AnalyticsTracking = AnalyticsTracker(), tokenStore: TokenStoring = TokenStore()) {
    self.apiClient = apiClient
    self.analytics = analytics
    self.tokenStore = tokenStore

    Task {
      await apiClient.setUnauthorizedHandler { [weak self] in
        Task { await self?.logout() }
      }
    }

    Task {
      await loadSession()
    }
  }

  func loadSession() async {
    if let cachedUser = tokenStore.cachedUser(), tokenStore.readAccessToken() != nil {
      state = .authenticated(cachedUser)
    }

    do {
      let user: User = try await apiClient.request(.get("/api/auth/me"))
      apiClient.cacheUser(user)
      state = .authenticated(user)
    } catch {
      state = .unauthenticated
    }
  }

  func login(email: String, password: String) async throws {
    struct LoginBody: Encodable {
      let email: String
      let password: String
    }
    let request = try APIRequest.post("/api/auth/login", body: LoginBody(email: email, password: password))
    let response: AuthResponse = try await apiClient.request(request)
    let refreshToken = tokenStore.readRefreshToken()
    try await apiClient.updateTokens(accessToken: response.accessToken, refreshToken: refreshToken)
    apiClient.cacheUser(response.user)
    analytics.track(event: "login.success", properties: ["role": response.user.role])
    state = .authenticated(response.user)
  }

  func logout() async {
    do {
      try await apiClient.requestNoResponse(.post("/api/auth/logout", body: EmptyBody()))
    } catch {
      // ignore logout errors
    }
    apiClient.clearTokens()
    analytics.track(event: "logout", properties: [:])
    state = .unauthenticated
  }
}

private struct EmptyBody: Encodable {}

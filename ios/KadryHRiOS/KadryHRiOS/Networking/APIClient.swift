import Foundation

actor APIClient {
  private let baseURL: URL
  private let session: URLSession
  private let tokenStore: TokenStoring
  private let decoder: JSONDecoder
  private var onUnauthorized: (@Sendable () -> Void)?

  init(baseURL: URL = BuildConfiguration.current.apiBaseURL, session: URLSession = .shared, tokenStore: TokenStoring = TokenStore()) {
    self.baseURL = baseURL
    self.session = session
    self.tokenStore = tokenStore
    self.decoder = JSONDecoder()
    self.decoder.dateDecodingStrategy = .iso8601
  }

  func request<T: Decodable>(_ apiRequest: APIRequest, retryOnUnauthorized: Bool = true) async throws -> T {
    let request = try buildRequest(apiRequest)
    let (data, response) = try await session.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
      throw APIError.invalidResponse
    }

    if httpResponse.statusCode == 401, retryOnUnauthorized {
      let refreshed = try await refreshTokenIfNeeded()
      if refreshed {
        return try await self.request(apiRequest, retryOnUnauthorized: false)
      }
      await notifyUnauthorized()
      throw APIError.unauthorized
    }

    guard (200...299).contains(httpResponse.statusCode) else {
      let message = decodeErrorMessage(from: data)
      throw APIError.serverError(message: message)
    }

    if let refreshToken = extractRefreshToken(from: httpResponse) {
      try? tokenStore.saveRefreshToken(refreshToken)
    }

    if T.self == EmptyResponse.self {
      return EmptyResponse() as! T
    }

    do {
      return try decoder.decode(T.self, from: data)
    } catch {
      throw APIError.decodingError
    }
  }

  func requestNoResponse(_ apiRequest: APIRequest, retryOnUnauthorized: Bool = true) async throws {
    let _: EmptyResponse = try await request(apiRequest, retryOnUnauthorized: retryOnUnauthorized)
  }

  func updateTokens(accessToken: String, refreshToken: String?) async throws {
    try tokenStore.saveAccessToken(accessToken)
    if let refreshToken {
      try tokenStore.saveRefreshToken(refreshToken)
    }
  }

  func clearTokens() {
    tokenStore.clear()
  }

  func setUnauthorizedHandler(_ handler: @escaping @Sendable () -> Void) {
    onUnauthorized = handler
  }

  func cachedUser() -> User? {
    tokenStore.cachedUser()
  }

  func cacheUser(_ user: User) {
    tokenStore.cacheUser(user)
  }

  private func buildRequest(_ apiRequest: APIRequest) throws -> URLRequest {
    let trimmedPath = apiRequest.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard var components = URLComponents(url: baseURL.appendingPathComponent(trimmedPath), resolvingAgainstBaseURL: false) else {
      throw APIError.invalidURL
    }
    if !apiRequest.queryItems.isEmpty {
      components.queryItems = apiRequest.queryItems
    }
    guard let url = components.url else {
      throw APIError.invalidURL
    }

    var request = URLRequest(url: url)
    request.httpMethod = apiRequest.method
    request.httpBody = apiRequest.body
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    if let token = tokenStore.readAccessToken() {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    return request
  }

  private func refreshTokenIfNeeded() async throws -> Bool {
    guard let refreshToken = tokenStore.readRefreshToken() else { return false }
    struct RefreshBody: Encodable { let refreshToken: String }
    let apiRequest = try APIRequest.post("/api/auth/refresh", body: RefreshBody(refreshToken: refreshToken))
    let request = try buildRequest(apiRequest)
    let (data, response) = try await session.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
      throw APIError.invalidResponse
    }

    guard (200...299).contains(httpResponse.statusCode) else {
      return false
    }

    let refreshTokenFromCookie = extractRefreshToken(from: httpResponse)
    let authResponse = try decoder.decode(AuthResponse.self, from: data)
    try updateTokens(accessToken: authResponse.accessToken, refreshToken: refreshTokenFromCookie ?? refreshToken)
    cacheUser(authResponse.user)
    return true
  }

  private func notifyUnauthorized() async {
    guard let handler = onUnauthorized else { return }
    Task { @MainActor in handler() }
  }

  private func decodeErrorMessage(from data: Data) -> String {
    if let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data) {
      return errorResponse.message
    }
    return "Wystąpił błąd serwera."
  }

  private func extractRefreshToken(from response: HTTPURLResponse) -> String? {
    guard let header = response.allHeaderFields["Set-Cookie"] as? String else { return nil }
    let cookies = header.split(separator: ";")
    for cookie in cookies {
      let parts = cookie.split(separator: "=")
      if parts.count == 2, parts[0].trimmingCharacters(in: .whitespaces) == "refreshToken" {
        return String(parts[1])
      }
    }
    return nil
  }
}

struct EmptyResponse: Decodable {}

struct APIErrorResponse: Decodable {
  let message: String
}

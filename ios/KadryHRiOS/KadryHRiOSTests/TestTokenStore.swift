import Foundation

final class TestTokenStore: TokenStoring {
  var accessToken: String?
  var refreshToken: String?
  var cached: User?

  func saveAccessToken(_ token: String) throws {
    accessToken = token
  }

  func saveRefreshToken(_ token: String) throws {
    refreshToken = token
  }

  func readAccessToken() -> String? {
    accessToken
  }

  func readRefreshToken() -> String? {
    refreshToken
  }

  func clear() {
    accessToken = nil
    refreshToken = nil
    cached = nil
  }

  func cacheUser(_ user: User) {
    cached = user
  }

  func cachedUser() -> User? {
    cached
  }
}

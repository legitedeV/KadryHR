import Foundation

protocol TokenStoring {
  func saveAccessToken(_ token: String) throws
  func saveRefreshToken(_ token: String) throws
  func readAccessToken() -> String?
  func readRefreshToken() -> String?
  func clear()
  func cacheUser(_ user: User)
  func cachedUser() -> User?
}

struct TokenStore: TokenStoring {
  private let service = "KadryHR"
  private let accessAccount = "accessToken"
  private let refreshAccount = "refreshToken"
  private let userDefaultsKey = "cachedUser"

  func saveAccessToken(_ token: String) throws {
    try KeychainHelper.save(Data(token.utf8), service: service, account: accessAccount)
  }

  func saveRefreshToken(_ token: String) throws {
    try KeychainHelper.save(Data(token.utf8), service: service, account: refreshAccount)
  }

  func readAccessToken() -> String? {
    guard let data = KeychainHelper.read(service: service, account: accessAccount) else { return nil }
    return String(data: data, encoding: .utf8)
  }

  func readRefreshToken() -> String? {
    guard let data = KeychainHelper.read(service: service, account: refreshAccount) else { return nil }
    return String(data: data, encoding: .utf8)
  }

  func clear() {
    KeychainHelper.delete(service: service, account: accessAccount)
    KeychainHelper.delete(service: service, account: refreshAccount)
    UserDefaults.standard.removeObject(forKey: userDefaultsKey)
  }

  func cacheUser(_ user: User) {
    if let data = try? JSONEncoder().encode(user) {
      UserDefaults.standard.set(data, forKey: userDefaultsKey)
    }
  }

  func cachedUser() -> User? {
    guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else { return nil }
    return try? JSONDecoder().decode(User.self, from: data)
  }
}

import Foundation

@MainActor
final class LoginViewModel: ObservableObject {
  @Published var email: String = ""
  @Published var password: String = ""
  @Published var isLoading: Bool = false
  @Published var errorMessage: String?

  private let sessionManager: SessionManaging

  init(sessionManager: SessionManaging) {
    self.sessionManager = sessionManager
  }

  var isValid: Bool {
    !email.isEmpty && email.contains("@") && password.count >= 6
  }

  func login() async {
    guard isValid else {
      errorMessage = "Wprowadź poprawny adres e-mail i hasło."
      return
    }

    isLoading = true
    errorMessage = nil

    do {
      try await sessionManager.login(email: email, password: password)
    } catch {
      errorMessage = (error as? APIError)?.errorDescription ?? "Logowanie nie powiodło się."
    }

    isLoading = false
  }
}

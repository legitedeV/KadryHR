import XCTest

final class LoginViewModelTests: XCTestCase {
  func testValidationFailsForInvalidEmail() async {
    let session = FakeSessionManager()
    let viewModel = await MainActor.run { LoginViewModel(sessionManager: session) }

    await MainActor.run {
      viewModel.email = "invalid"
      viewModel.password = "123"
    }

    await viewModel.login()

    await MainActor.run {
      XCTAssertEqual(viewModel.errorMessage, "Wprowadź poprawny adres e-mail i hasło.")
    }
  }
}

final class FakeSessionManager: SessionManaging {
  func login(email: String, password: String) async throws {}
}

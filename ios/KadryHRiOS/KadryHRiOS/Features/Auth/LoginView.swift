import SwiftUI

struct LoginView: View {
  @StateObject private var viewModel: LoginViewModel

  init(sessionManager: SessionManager) {
    _viewModel = StateObject(wrappedValue: LoginViewModel(sessionManager: sessionManager))
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      VStack(spacing: 20) {
        VStack(alignment: .leading, spacing: 8) {
          Text("KadryHR")
            .kadryText(size: 28, weight: .bold)
          Text("Zaloguj się, aby zarządzać zmianami i urlopami.")
            .kadryText(size: 14, color: KadryTheme.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        VStack(spacing: 12) {
          TextField("Email", text: $viewModel.email)
            .textInputAutocapitalization(.never)
            .keyboardType(.emailAddress)
            .autocorrectionDisabled()
            .padding()
            .background(KadryTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .accessibilityIdentifier("login.email")

          SecureField("Hasło", text: $viewModel.password)
            .padding()
            .background(KadryTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .accessibilityIdentifier("login.password")
        }

        if let errorMessage = viewModel.errorMessage {
          Text(errorMessage)
            .kadryText(size: 13, color: KadryTheme.destructive)
            .frame(maxWidth: .infinity, alignment: .leading)
        }

        Button("Zaloguj się") {
          Task { await viewModel.login() }
        }
        .buttonStyle(KadryPrimaryButtonStyle(isLoading: viewModel.isLoading))
        .disabled(!viewModel.isValid || viewModel.isLoading)
        .accessibilityIdentifier("login.submit")

        Spacer()
      }
      .padding(24)
      if viewModel.isLoading {
        LoadingOverlay(text: "Logowanie…")
      }
    }
  }
}

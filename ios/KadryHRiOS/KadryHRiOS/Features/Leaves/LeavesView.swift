import SwiftUI

struct LeavesView: View {
  @StateObject private var viewModel: LeavesViewModel
  @State private var showForm = false

  let mode: LeavesMode

  init(apiClient: APIClient, mode: LeavesMode) {
    _viewModel = StateObject(wrappedValue: LeavesViewModel(apiClient: apiClient, mode: mode))
    self.mode = mode
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          header

          switch viewModel.requestsState {
          case .idle, .loading:
            ProgressView()
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
          case .empty:
            EmptyStateView(title: "Brak wniosków", message: "Nie masz aktualnie wniosków urlopowych.")
          case .error(let message):
            ErrorStateView(title: "Błąd", message: message, actionTitle: "Odśwież") {
              Task { await viewModel.load() }
            }
          case .loaded(let requests):
            VStack(spacing: 8) {
              ForEach(requests) { request in
                LeaveRequestRow(request: request, mode: mode) {
                  Task { await viewModel.approve(requestId: request.id) }
                } rejectAction: {
                  Task { await viewModel.reject(requestId: request.id) }
                }
              }
            }
          }
        }
        .padding(24)
      }

      if let message = viewModel.actionMessage {
        ToastView(message: message)
          .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
              viewModel.actionMessage = nil
            }
          }
      }
    }
    .task { await viewModel.load() }
    .sheet(isPresented: $showForm) {
      LeaveRequestFormView(viewModel: viewModel)
    }
  }

  private var header: some View {
    HStack {
      Text(mode == .employee ? "Twoje urlopy" : "Wnioski do akceptacji")
        .kadryText(size: 22, weight: .bold)
      Spacer()
      if mode == .employee {
        Button(action: { showForm = true }) {
          Label("Nowy", systemImage: "plus")
        }
        .buttonStyle(KadrySecondaryButtonStyle())
      }
    }
  }
}

struct LeaveRequestRow: View {
  let request: LeaveRequest
  let mode: LeavesMode
  let approveAction: () -> Void
  let rejectAction: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text(request.leaveType?.name ?? "Urlop")
          .kadryText(size: 14, weight: .semibold)
        Spacer()
        Text(request.status.capitalized)
          .kadryText(size: 12, color: KadryTheme.textSecondary)
      }

      Text("\(request.startsAt.formatted(date: .abbreviated, time: .omitted)) - \(request.endsAt.formatted(date: .abbreviated, time: .omitted))")
        .kadryText(size: 12, color: KadryTheme.textSecondary)

      if let employee = request.employee {
        Text(employee.displayName)
          .kadryText(size: 12, color: KadryTheme.textSecondary)
      }

      if mode == .manager && request.status.uppercased() == "PENDING" {
        HStack(spacing: 12) {
          Button("Zatwierdź", action: approveAction)
            .buttonStyle(KadryPrimaryButtonStyle())
          Button("Odrzuć", action: rejectAction)
            .buttonStyle(KadrySecondaryButtonStyle())
        }
      }
    }
    .padding()
    .background(KadryTheme.surface)
    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
  }
}

struct ToastView: View {
  let message: String

  var body: some View {
    VStack {
      Spacer()
      Text(message)
        .kadryText(size: 13)
        .padding(12)
        .background(KadryTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .padding(.bottom, 24)
    }
    .transition(.opacity)
  }
}

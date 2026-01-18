import Foundation

enum LeavesMode {
  case employee
  case manager
}

@MainActor
final class LeavesViewModel: ObservableObject {
  @Published private(set) var requestsState: ViewState<[LeaveRequest]> = .idle
  @Published private(set) var leaveTypesState: ViewState<[LeaveType]> = .idle
  @Published private(set) var actionMessage: String?

  private let apiClient: APIClient
  private let mode: LeavesMode

  init(apiClient: APIClient, mode: LeavesMode) {
    self.apiClient = apiClient
    self.mode = mode
  }

  func load() async {
    await loadLeaveTypes()
    await loadRequests()
  }

  func loadRequests() async {
    requestsState = .loading
    var items: [URLQueryItem] = [URLQueryItem(name: "pageSize", value: "50")]
    if mode == .manager {
      items.append(URLQueryItem(name: "status", value: "PENDING"))
    }

    do {
      let requests: [LeaveRequest] = try await apiClient.request(.get("/api/leave-requests", queryItems: items))
      requestsState = requests.isEmpty ? .empty : .loaded(requests)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać wniosków urlopowych."
      requestsState = .error(message)
    }
  }

  func loadLeaveTypes() async {
    leaveTypesState = .loading
    do {
      let types: [LeaveType] = try await apiClient.request(.get("/api/leave-types"))
      leaveTypesState = types.isEmpty ? .empty : .loaded(types)
    } catch {
      let message = (error as? APIError)?.errorDescription ?? "Nie udało się wczytać typów urlopów."
      leaveTypesState = .error(message)
    }
  }

  func createRequest(form: LeaveRequestForm) async {
    do {
      let request = try APIRequest.post("/api/leave-requests", body: form)
      let _: LeaveRequest = try await apiClient.request(request)
      actionMessage = "Wniosek został wysłany."
      await loadRequests()
    } catch {
      actionMessage = (error as? APIError)?.errorDescription ?? "Nie udało się utworzyć wniosku."
    }
  }

  func approve(requestId: String) async {
    await updateStatus(requestId: requestId, status: "APPROVED")
  }

  func reject(requestId: String) async {
    await updateStatus(requestId: requestId, status: "REJECTED")
  }

  private func updateStatus(requestId: String, status: String) async {
    do {
      let body = UpdateLeaveStatusForm(status: status)
      let request = try APIRequest.patch("/api/leave-requests/\(requestId)/status", body: body)
      let _: LeaveRequest = try await apiClient.request(request)
      actionMessage = status == "APPROVED" ? "Wniosek zatwierdzony." : "Wniosek odrzucony."
      await loadRequests()
    } catch {
      actionMessage = (error as? APIError)?.errorDescription ?? "Nie udało się zaktualizować wniosku."
    }
  }
}

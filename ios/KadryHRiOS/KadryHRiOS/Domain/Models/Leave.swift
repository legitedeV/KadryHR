import Foundation

struct LeaveRequest: Codable, Identifiable {
  let id: String
  let status: String
  let startsAt: Date
  let endsAt: Date
  let comment: String?
  let leaveType: LeaveType?
  let employee: Employee?
}

struct LeaveType: Codable, Identifiable {
  let id: String
  let name: String
  let category: String
}

struct LeaveRequestForm: Encodable {
  let startsAt: String
  let endsAt: String
  let leaveTypeId: String
  let comment: String?
  let employeeId: String?
}

struct UpdateLeaveStatusForm: Encodable {
  let status: String
}

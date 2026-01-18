import Foundation

struct Shift: Codable, Identifiable {
  let id: String
  let startsAt: Date
  let endsAt: Date
  let position: String?
  let notes: String?
  let employee: Employee?
  let location: Location?

  var durationHours: Double {
    let diff = endsAt.timeIntervalSince(startsAt) / 3600
    return max(diff, 0)
  }
}

struct Employee: Codable, Identifiable {
  let id: String
  let firstName: String?
  let lastName: String?
  let email: String?

  var displayName: String {
    let name = [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    return name.isEmpty ? (email ?? "Pracownik") : name
  }
}

struct Location: Codable, Identifiable {
  let id: String
  let name: String
}

struct ShiftSummary: Codable, Identifiable {
  let employeeId: String
  let employeeName: String
  let hours: Double

  var id: String { employeeId }
}

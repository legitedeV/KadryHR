import Foundation

struct EmployeeDirectoryResponse: Codable {
  let data: [EmployeeDirectoryEntry]
  let total: Int
  let skip: Int
  let take: Int
}

struct EmployeeDirectoryEntry: Codable, Identifiable {
  let id: String
  let firstName: String?
  let lastName: String?
  let email: String?
  let isActive: Bool
  let role: String?

  var displayName: String {
    let name = [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    return name.isEmpty ? (email ?? "Pracownik") : name
  }
}

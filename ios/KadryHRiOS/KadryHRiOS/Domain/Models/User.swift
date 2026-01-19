import Foundation

struct User: Codable, Identifiable {
  let id: String
  let email: String
  let role: String
  let organisationId: String
  let firstName: String?
  let lastName: String?
  let organisation: Organisation?
  let permissions: [String]?

  var fullName: String {
    let name = [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    return name.isEmpty ? email : name
  }
}

struct Organisation: Codable {
  let id: String
  let name: String
}

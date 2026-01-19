import Foundation

struct AuditLog: Codable, Identifiable {
  let id: String
  let action: String
  let entityType: String
  let entityId: String?
  let createdAt: Date
}

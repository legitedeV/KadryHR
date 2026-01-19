import Foundation

struct AuthResponse: Decodable {
  let accessToken: String
  let user: User
}

import Foundation

struct APIRequest {
  let method: String
  let path: String
  var queryItems: [URLQueryItem] = []
  var body: Data? = nil

  static func get(_ path: String, queryItems: [URLQueryItem] = []) -> APIRequest {
    APIRequest(method: "GET", path: path, queryItems: queryItems, body: nil)
  }

  static func post<T: Encodable>(_ path: String, body: T) throws -> APIRequest {
    let data = try JSONEncoder().encode(body)
    return APIRequest(method: "POST", path: path, queryItems: [], body: data)
  }

  static func patch<T: Encodable>(_ path: String, body: T) throws -> APIRequest {
    let data = try JSONEncoder().encode(body)
    return APIRequest(method: "PATCH", path: path, queryItems: [], body: data)
  }
}

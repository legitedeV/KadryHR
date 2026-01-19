import XCTest

final class APIClientTests: XCTestCase {
  func testRequestSuccess() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: config)
    let tokenStore = TestTokenStore()
    let client = APIClient(baseURL: URL(string: "https://example.com")!, session: session, tokenStore: tokenStore)

    let user = User(id: "1", email: "test@example.com", role: "EMPLOYEE", organisationId: "org", firstName: "Test", lastName: "User", organisation: nil, permissions: nil)
    let responseData = try JSONEncoder().encode(user)

    MockURLProtocol.requestHandler = { request in
      XCTAssertEqual(request.url?.path, "/api/auth/me")
      let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
      return (response, responseData)
    }

    let response: User = try await client.request(.get("/api/auth/me"))
    XCTAssertEqual(response.email, "test@example.com")
  }

  func testRefreshOnUnauthorized() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: config)
    let tokenStore = TestTokenStore()
    tokenStore.accessToken = "expired"
    tokenStore.refreshToken = "refresh"
    let client = APIClient(baseURL: URL(string: "https://example.com")!, session: session, tokenStore: tokenStore)

    let user = User(id: "1", email: "test@example.com", role: "EMPLOYEE", organisationId: "org", firstName: "Test", lastName: "User", organisation: nil, permissions: nil)
    let authResponse = AuthResponse(accessToken: "new-token", user: user)
    let authData = try JSONEncoder().encode(authResponse)
    let shiftsData = try JSONEncoder().encode([Shift(id: "s1", startsAt: Date(), endsAt: Date().addingTimeInterval(3600), position: nil, notes: nil, employee: nil, location: nil)])

    var callCount = 0

    MockURLProtocol.requestHandler = { request in
      callCount += 1
      if request.url?.path == "/api/shifts" {
        if callCount == 1 {
          let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
          return (response, Data())
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
        return (response, shiftsData)
      }

      if request.url?.path == "/api/auth/refresh" {
        let headers = ["Set-Cookie": "refreshToken=new-refresh; Path=/api/auth"]
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: headers)!
        return (response, authData)
      }

      let response = HTTPURLResponse(url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil)!
      return (response, Data())
    }

    let shifts: [Shift] = try await client.request(.get("/api/shifts"))
    XCTAssertEqual(shifts.count, 1)
    XCTAssertEqual(tokenStore.accessToken, "new-token")
    XCTAssertEqual(tokenStore.refreshToken, "new-refresh")
  }
}

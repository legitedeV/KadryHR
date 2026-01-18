import SwiftUI

@main
struct KadryHRiOSApp: App {
  @StateObject private var sessionManager = SessionManager()

  var body: some Scene {
    WindowGroup {
      RootView(sessionManager: sessionManager)
    }
  }
}

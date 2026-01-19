import Foundation

protocol AnalyticsTracking {
  func track(event: String, properties: [String: String])
}

struct AnalyticsTracker: AnalyticsTracking {
  func track(event: String, properties: [String: String] = [:]) {
    #if DEBUG
    print("[Analytics] \(event) \(properties)")
    #endif
  }
}

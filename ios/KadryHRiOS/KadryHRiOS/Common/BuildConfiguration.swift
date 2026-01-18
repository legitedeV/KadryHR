import Foundation

struct BuildConfiguration {
  let apiBaseURL: URL
  let environmentName: String
  let appVersion: String

  static let current: BuildConfiguration = {
    let bundle = Bundle.main
    let apiBaseURLString = bundle.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? ""
    let environmentName = bundle.object(forInfoDictionaryKey: "ENVIRONMENT_NAME") as? String ?? "Unknown"
    let appVersion = bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"

    guard let apiBaseURL = URL(string: apiBaseURLString) else {
      return BuildConfiguration(
        apiBaseURL: URL(string: "http://localhost")!,
        environmentName: environmentName,
        appVersion: appVersion
      )
    }

    return BuildConfiguration(apiBaseURL: apiBaseURL, environmentName: environmentName, appVersion: appVersion)
  }()
}

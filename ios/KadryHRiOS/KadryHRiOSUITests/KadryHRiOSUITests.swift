import XCTest

final class KadryHRiOSUITests: XCTestCase {
  func testLoginAndOpenScheduleTab() {
    let app = XCUIApplication()
    app.launchEnvironment["UITEST_EMAIL"] = "employee@example.com"
    app.launchEnvironment["UITEST_PASSWORD"] = "Password123"
    app.launch()

    let emailField = app.textFields["login.email"]
    XCTAssertTrue(emailField.waitForExistence(timeout: 5))
    emailField.tap()
    emailField.typeText(app.launchEnvironment["UITEST_EMAIL"] ?? "")

    let passwordField = app.secureTextFields["login.password"]
    passwordField.tap()
    passwordField.typeText(app.launchEnvironment["UITEST_PASSWORD"] ?? "")

    app.buttons["login.submit"].tap()

    let scheduleTab = app.tabBars.buttons["Schedule"]
    XCTAssertTrue(scheduleTab.waitForExistence(timeout: 10))
    scheduleTab.tap()
  }
}

import SwiftUI

struct RootView: View {
  @ObservedObject var sessionManager: SessionManager

  var body: some View {
    switch sessionManager.state {
    case .loading:
      ZStack {
        KadryTheme.background.ignoresSafeArea()
        ProgressView()
          .progressViewStyle(CircularProgressViewStyle(tint: .white))
      }
    case .unauthenticated:
      LoginView(sessionManager: sessionManager)
    case .authenticated(let user):
      AppTabView(sessionManager: sessionManager, user: user)
    }
  }
}

struct AppTabView: View {
  @ObservedObject var sessionManager: SessionManager
  let user: User

  var body: some View {
    TabView {
      if user.role.lowercased() == "employee" {
        NavigationStack {
          EmployeeHomeView(apiClient: sessionManager.apiClient)
        }
        .tabItem {
          Label("Home", systemImage: "house")
        }

        NavigationStack {
          ScheduleView(apiClient: sessionManager.apiClient)
        }
        .tabItem {
          Label("Schedule", systemImage: "calendar")
        }

        NavigationStack {
          LeavesView(apiClient: sessionManager.apiClient, mode: .employee)
        }
        .tabItem {
          Label("Leaves", systemImage: "doc.text")
        }

        NavigationStack {
          ProfileView(apiClient: sessionManager.apiClient, sessionManager: sessionManager)
        }
        .tabItem {
          Label("Profile", systemImage: "person.crop.circle")
        }
      } else {
        NavigationStack {
          DashboardView(apiClient: sessionManager.apiClient)
        }
        .tabItem {
          Label("Dashboard", systemImage: "chart.bar")
        }

        NavigationStack {
          ScheduleView(apiClient: sessionManager.apiClient)
        }
        .tabItem {
          Label("Schedule", systemImage: "calendar")
        }

        NavigationStack {
          LeavesView(apiClient: sessionManager.apiClient, mode: .manager)
        }
        .tabItem {
          Label("Requests", systemImage: "checkmark.seal")
        }

        NavigationStack {
          TeamView(apiClient: sessionManager.apiClient)
        }
        .tabItem {
          Label("Team", systemImage: "person.3")
        }

        NavigationStack {
          ProfileView(apiClient: sessionManager.apiClient, sessionManager: sessionManager)
        }
        .tabItem {
          Label("Profile", systemImage: "person.crop.circle")
        }
      }
    }
    .tint(KadryTheme.accent)
  }
}

import SwiftUI

struct ScheduleView: View {
  @StateObject private var viewModel: ShiftsViewModel
  @State private var currentMonth: Date = Date()

  init(apiClient: APIClient) {
    _viewModel = StateObject(wrappedValue: ShiftsViewModel(apiClient: apiClient))
  }

  var body: some View {
    ZStack {
      KadryTheme.background.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          header
          calendarGrid
          shiftList
        }
        .padding(24)
      }
    }
    .task { await loadMonth() }
  }

  private var header: some View {
    HStack {
      Button(action: { moveMonth(by: -1) }) {
        Image(systemName: "chevron.left")
      }
      .foregroundStyle(KadryTheme.textPrimary)

      Spacer()
      Text(currentMonth.formatted(.dateTime.year().month()))
        .kadryText(size: 18, weight: .semibold)
      Spacer()

      Button(action: { moveMonth(by: 1) }) {
        Image(systemName: "chevron.right")
      }
      .foregroundStyle(KadryTheme.textPrimary)
    }
  }

  private var calendarGrid: some View {
    let shifts = (viewModel.state.value ?? [])
    let days = CalendarGrid.days(for: currentMonth, shifts: shifts)
    return LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
      ForEach(days) { day in
        VStack(spacing: 6) {
          Text(day.label)
            .kadryText(size: 12, weight: day.isCurrentMonth ? .semibold : .regular, color: day.isCurrentMonth ? KadryTheme.textPrimary : KadryTheme.textSecondary)
          if let count = day.shiftCount {
            Text("\(count)")
              .kadryText(size: 10, weight: .semibold, color: KadryTheme.accent)
          }
        }
        .frame(maxWidth: .infinity, minHeight: 44)
        .padding(4)
        .background(KadryTheme.surface.opacity(day.isToday ? 0.9 : 0.6))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
      }
    }
  }

  private var shiftList: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Zmiany w miesiącu")
        .kadryText(size: 16, weight: .semibold)

      switch viewModel.state {
      case .idle, .loading:
        ProgressView()
          .progressViewStyle(CircularProgressViewStyle(tint: .white))
      case .empty:
        EmptyStateView(title: "Brak zmian", message: "Brak zmian w wybranym miesiącu.")
      case .error(let message):
        ErrorStateView(title: "Błąd", message: message, actionTitle: "Odśwież") {
          Task { await loadMonth() }
        }
      case .loaded(let shifts):
        VStack(spacing: 8) {
          ForEach(shifts) { shift in
            ShiftRow(shift: shift)
          }
        }
      }
    }
  }

  private func moveMonth(by value: Int) {
    guard let next = Calendar.current.date(byAdding: .month, value: value, to: currentMonth) else { return }
    currentMonth = next
    Task { await loadMonth() }
  }

  private func loadMonth() async {
    let range = Calendar.current.dateInterval(of: .month, for: currentMonth)
    let start = range?.start ?? currentMonth
    let end = range?.end ?? currentMonth
    await viewModel.loadShifts(from: start, to: end)
  }
}

struct CalendarDay: Identifiable {
  let id = UUID()
  let date: Date
  let label: String
  let isCurrentMonth: Bool
  let isToday: Bool
  let shiftCount: Int?
}

enum CalendarGrid {
  static func days(for month: Date, shifts: [Shift]) -> [CalendarDay] {
    let calendar = Calendar.current
    guard let monthInterval = calendar.dateInterval(of: .month, for: month) else { return [] }
    let start = monthInterval.start
    let range = calendar.range(of: .day, in: .month, for: month) ?? 1..<1

    let firstWeekday = calendar.component(.weekday, from: start)
    let leadingDays = (firstWeekday + 6) % 7

    var days: [Date] = []
    for offset in 0..<leadingDays {
      if let date = calendar.date(byAdding: .day, value: -leadingDays + offset, to: start) {
        days.append(date)
      }
    }

    for day in range {
      if let date = calendar.date(byAdding: .day, value: day - 1, to: start) {
        days.append(date)
      }
    }

    while days.count % 7 != 0 {
      if let date = calendar.date(byAdding: .day, value: days.count - range.count - leadingDays, to: monthInterval.end) {
        days.append(date)
      }
    }

    let grouped = Dictionary(grouping: shifts) { shift in
      calendar.startOfDay(for: shift.startsAt)
    }

    return days.map { date in
      let count = grouped[calendar.startOfDay(for: date)]?.count
      CalendarDay(
        date: date,
        label: String(calendar.component(.day, from: date)),
        isCurrentMonth: calendar.isDate(date, equalTo: month, toGranularity: .month),
        isToday: calendar.isDateInToday(date),
        shiftCount: count
      )
    }
  }
}

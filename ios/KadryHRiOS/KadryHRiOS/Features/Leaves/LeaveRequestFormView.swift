import SwiftUI

struct LeaveRequestFormView: View {
  @Environment(\.dismiss) private var dismiss
  @ObservedObject var viewModel: LeavesViewModel

  @State private var selectedType: LeaveType?
  @State private var startDate = Date()
  @State private var endDate = Date()
  @State private var comment = ""

  var body: some View {
    NavigationStack {
      ZStack {
        KadryTheme.background.ignoresSafeArea()
        VStack(alignment: .leading, spacing: 16) {
          if case .loaded(let types) = viewModel.leaveTypesState {
            Picker("Typ urlopu", selection: $selectedType) {
              ForEach(types) { type in
                Text(type.name).tag(Optional(type))
              }
            }
            .pickerStyle(.menu)
          } else {
            Text("Wczytywanie typów urlopów…")
              .kadryText(size: 14, color: KadryTheme.textSecondary)
          }

          DatePicker("Od", selection: $startDate, displayedComponents: .date)
            .datePickerStyle(.compact)
          DatePicker("Do", selection: $endDate, displayedComponents: .date)
            .datePickerStyle(.compact)

          TextField("Komentarz", text: $comment, axis: .vertical)
            .padding()
            .background(KadryTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

          Button("Wyślij wniosek") {
            Task { await submit() }
          }
          .buttonStyle(KadryPrimaryButtonStyle())
          .disabled(selectedType == nil)

          Spacer()
        }
        .padding(24)
      }
      .navigationTitle("Nowy wniosek")
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Button("Zamknij") { dismiss() }
            .foregroundStyle(KadryTheme.textPrimary)
        }
      }
    }
  }

  private func submit() async {
    guard let type = selectedType else { return }
    let formatter = ISO8601DateFormatter()
    let form = LeaveRequestForm(
      startsAt: formatter.string(from: startDate),
      endsAt: formatter.string(from: endDate),
      leaveTypeId: type.id,
      comment: comment.isEmpty ? nil : comment,
      employeeId: nil
    )

    await viewModel.createRequest(form: form)
    dismiss()
  }
}

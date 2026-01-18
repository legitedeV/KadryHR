import Foundation

enum ViewState<T> {
  case idle
  case loading
  case loaded(T)
  case empty
  case error(String)

  var value: T? {
    switch self {
    case .loaded(let data):
      return data
    default:
      return nil
    }
  }
}

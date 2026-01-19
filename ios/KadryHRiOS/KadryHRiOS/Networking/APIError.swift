import Foundation

enum APIError: LocalizedError {
  case invalidURL
  case invalidResponse
  case decodingError
  case unauthorized
  case serverError(message: String)
  case networkError(Error)

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Nieprawidłowy adres serwera."
    case .invalidResponse:
      return "Nie udało się przetworzyć odpowiedzi serwera."
    case .decodingError:
      return "Wystąpił problem z danymi z serwera."
    case .unauthorized:
      return "Sesja wygasła. Zaloguj się ponownie."
    case .serverError(let message):
      return message
    case .networkError:
      return "Brak połączenia z serwerem."
    }
  }
}

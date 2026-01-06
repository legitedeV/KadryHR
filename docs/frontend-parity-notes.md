# Frontend parity notes – redesign recovery

- Przywrócono pełną nawigację panelu: linki do powiadomień (inbox, wysyłka, historia), subskrybentów newslettera oraz audytu są widoczne w sidebarze.
- Moduł pracowników ponownie umożliwia dodawanie, edycję i ponowne wysyłanie zaproszeń zgodnie z backendem (formularz w modalach, wybór lokalizacji).
- Grafiki odzyskały pełny CRUD: dodawanie, edycja i usuwanie zmian z potwierdzeniem, przypisanie pracownika/lokalizacji oraz publikacja tygodnia z powiadomieniami.
- Braki pozostające po redesignie:
  - Widok audytu wymaga publicznego endpointu listującego logi; obecnie wyświetla komunikat o braku danych (backlog).

Code review findings
====================

Krytyczne / wysoki priorytet
----------------------------
- Domyślne sekrety JWT (``changeme-*``) są wypisane w konfiguracji i używane, gdy brakuje zmiennych środowiskowych. Pozwala to na uruchomienie produkcji z publicznie znanymi kluczami podpisującymi tokeny, co umożliwia fałszowanie tokenów JWT oraz odczyt refresh tokenów. Wymagane jest wymuszenie ustawienia sekretów lub blokada startu przy domyślnych wartościach.

- Odmowa zgody marketingowej w newsletterze jest ignorowana, gdy subskrybent już istnieje. Pole ``marketingConsent`` jest aktualizowane operatorem ``||``, więc przekazanie ``false`` nie nadpisze poprzedniego ``true`` i użytkownik nie może odwołać zgody. Trzeba użyć wartości z DTO bez shortcutu lub zastosować ``input.marketingConsent ?? existing.marketingConsent``.

Średni priorytet
----------------
- ``QueueService`` sprawdza dostępność Redisa tylko raz podczas konstrukcji (``checkQueueAvailability``). Jeśli broker był chwilowo niedostępny przy starcie, ``queueAvailable`` pozostaje ``false`` na zawsze i wszystkie zadania e-mailowe są pomijane nawet po odzyskaniu połączenia. Brakuje ponawiania probe lub przełączenia w tryb synchronizacji wysyłki.

Pozostałe uwagi
---------------
- Repozytorium zawierało ``legacy/root-frontend/node_modules/`` w kontroli wersji roboczej; usunięto artefakty, ale warto dodać ochronę (np. ``.gitignore`` lub sprawdzenie CI), aby podobne pliki nie trafiały do repo.

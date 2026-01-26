4. Moduł „Lokalizacje” (Locations)

PROMPT 4 – locations module

Cel: pełny moduł zarządzania lokalizacjami w organizacji.

API

Utwórz LocationsModule w apps/api/src/locations:

locations.module.ts, locations.service.ts, locations.controller.ts, DTO.

Endpointy:

GET /locations

zwraca listę lokalizacji bieżącej organizacji.

POST /locations

tworzy nową lokalizację w bieżącej organizacji.

GET /locations/:id

PATCH /locations/:id

DELETE /locations/:id (miękkie usunięcie – np. archivedAt).

Walidacja:

name wymagane, min 2 znaki.

code – opcjonalny, ale unikalny w ramach organizacji.

wymagana kontrola organizationId z JWT vs rekord.

Frontend

Strony:

/panel/lokalizacje – lista:

tabela lokalizacji (nazwa, kod, miasto).

przycisk „Dodaj lokalizację”.

/panel/lokalizacje/[id] – edycja szczegółów.

UX:

formularz w modalu lub osobnej stronie:

nazwa, kod, adres, miasto, strefa czasowa.

obsługa loading/error state’ów, puste listy („Brak lokalizacji – dodaj pierwszą”).

Wszystko spięte przez react-query, z refetch po mutacjach.

5. Moduł „Pracownicy” (Employees)

PROMPT 5 – employees module

Cel: enterprise’owy moduł „Pracownicy”, nie dziecinny CRUD.

API

EmployeesModule w apps/api/src/employees:

employees.controller.ts, employees.service.ts, DTO.

Endpointy:

GET /employees

filtry: locationId, status (aktywny/nieaktywny), search (imię/nazwisko/email/kod).

POST /employees

tworzy pracownika w bieżącej organizacji.

GET /employees/:id

PATCH /employees/:id

DELETE /employees/:id (ustaw active=false zamiast hard delete).

Dodaj możliwość powiązania Employee z User (w przyszłości dla portalu pracownika):

pole userId? w modelu.

Frontend

Strona /panel/pracownicy:

tabela z kolumnami:

Imię, Nazwisko, Lokalizacja, Typ zatrudnienia, Aktywny, Kod.

filtry:

dropdown Lokalizacja,

dropdown Aktywność,

searchbox (imię/nazwisko/email/kod).

przycisk „Dodaj pracownika”.

Formularz dodawania/edycji:

imię, nazwisko, email, telefon, lokalizacja, typ zatrudnienia, kod.

walidacja, wyraźne komunikaty błędów.

Po stronie UI zadbaj o czytelną tabelę, sticky header kolumn, spójne odstępy.

6. Moduł „Grafik” – podstawowy builder zmian

PROMPT 6 – schedule / shift builder v1

Cel: realny grafik, który można pokazać managerowi sklepu:

widok tydzień x pracownicy

tworzenie/edycja zmian.

API

Rozszerz model Shift (jeśli potrzeba) o:

publishedAt? (data publikacji grafiku),

createdByUserId.

Endpointy:

GET /shifts

filtry: from, to, locationId, employeeId.

POST /shifts

tworzy zmianę; waliduje:

start < end,

brak nakładania się zmian dla danego pracownika (w tej samej organizacji).

PATCH /shifts/:id

DELETE /shifts/:id

POST /shifts/publish

przyjmuje zakres dat + locationId,

ustawia status="PUBLISHED" dla objętych zmian i publishedAt=now().

Frontend

Strona /panel/grafik:

widok tygodniowy:

oś X: dni tygodnia (Pon–Ndz),

oś Y: pracownicy (np. z wybranej lokalizacji).

każdy „slot” dnia-pracownika wyświetla listę zmian (godziny) w formie pill’ów.

Interakcje:

wybór lokalizacji + tygodnia (date picker).

przycisk „Dodaj zmianę” → modal:

wybierz pracownika, lokalizację, datę, start/end, przerwa.

przycisk „Opublikuj grafik” → wywołuje POST /shifts/publish.

Tu chodzi o funkcjonalność – UI może być prosty, ale profesjonalny.

7. Moduł „RCP / Rejestracja czasu pracy”

PROMPT 7 – time & attendance (RCP)

Cel: baza pod RCP online:

logi wejścia/wyjścia,

podgląd dzienny i miesięczny,

porównanie z grafikiem.

API

Rozszerz TimeEntry:

locationId?

shiftId?

Endpointy:

POST /rcp/clock

body:

employeeId

type (CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END)

opcjonalnie locationId

walidacja podstawowa (np. kolejność eventów).

GET /rcp/day

parametry: date, locationId?, employeeId?

zwraca listę TimeEntry + powiązane Shift.

GET /rcp/month

parametry: month, year, employeeId

agreguje łączny czas pracy vs plan (jeśli shift istnieje).

Frontend

Strona /panel/rcp:

widok tabelkowy:

filtry: lokalizacja, data.

kolumny: Pracownik, Pierwsze wejście, Ostatnie wyjście, Łącznie, Odchylenie vs grafik.

Prosty ekran „kiosku RCP”:

np. /panel/rcp/kiosk:

input kodu pracownika (externalCode) + przycisk „Wejście/Wyjście”.

Po wpisaniu kodu i kliknięciu – wywołuje POST /rcp/clock z odpowiednim typem, determinowanym przez ostatni event.

Wszystko spięte z auth/multi-tenant.

8. Moduł „Urlopy i nieobecności”

PROMPT 8 – leaves / absences

Cel: obsługa wniosków urlopowych i innych nieobecności.

API

Dodaj model Absence w Prisma:

id, createdAt, updatedAt

organizationId, employeeId

type enum: VACATION, SICK_LEAVE, UNPAID, OTHER

startDate, endDate

status enum: PENDING, APPROVED, REJECTED

reason?, managerComment?, createdByUserId, approvedByUserId?

Endpointy:

POST /absences

tworzy wniosek (domyślnie PENDING).

GET /absences

filtry: status, employeeId, zakres dat.

PATCH /absences/:id/approve

PATCH /absences/:id/reject

Frontend

Strony:

/panel/urlopy – dla managera:

lista wniosków z filtrami.

akcje zatwierdź/odrzuć.

/panel/urlopy/moje – dla pracownika (później, na razie wersja managerska może być pierwsza).

Po zatwierdzeniu wniosku:

wyświetl prosty komunikat typu toast,

w przyszłości można blokować planowanie zmian w tym okresie (na razie tylko dane).

9. Role i uprawnienia

PROMPT 9 – roles & permissions

Cel: twarde rozdzielenie ról:

OWNER, ADMIN, MANAGER, EMPLOYEE.

W warstwie API dodaj prosty system autoryzacji:

dekorator @Roles(...) – przyjmuje listę ról.

guard, który:

pobiera membership z DB po userId i organizationId z JWT,

sprawdza, czy rola znajduje się na liście wymaganych.

Przypisz role do endpointów:

OWNER / ADMIN:

zarządzanie organizacją, billingiem, globalnymi ustawieniami.

ADMIN / MANAGER:

lokalizacje, pracownicy, grafik, RCP, urlopy.

EMPLOYEE:

dostęp tylko do „swoich” danych (później portal pracownika, na razie minimalnie do odczytu).

Po stronie frontu:

ukrywaj elementy nawigacji, jeśli user nie ma odpowiednich ról.

możesz dodać małą odznakę roli przy nazwisku użytkownika.

10. Raporty i dashboardy

PROMPT 10 – reports & KPIs

Cel: mieć coś, co da się pokazać zarządowi – sensowne raporty.

API:

dodaj moduł reports z endpointami:

GET /reports/summary?from=...&to=...

zwraca:

liczba przepracowanych godzin vs zaplanowanych,

liczba nadgodzin,

absencje wg typu,

frekwencja (procent obecności vs plan).

GET /reports/locations?from=...&to=...

agregacja per lokalizacja.

Front:

/panel/raporty:

filtry: zakres dat, lokalizacja.

kafelki KPI + tabele.

wykres (np. prosty line/bar chart) – możesz dobrać lekką bibliotekę lub zrobić prosty wykres słupkowy w CSS, byle nie placeholder.

Zadbaj o czytelne labelki, opis po polsku.

11. Ustawienia organizacji + użytkownik

PROMPT 11 – settings

Cel: miejsce, gdzie OWNER/ADMIN ogarnia konfigurację.

API:

PATCH /organizations/current

aktualizacja nazwy, strefy czasowej, tygodnia startowego itd.

GET /organizations/current

PATCH /me

aktualizacja danych użytkownika: imię, nazwisko, język UI.

Front:

/panel/ustawienia/organizacja:

formularz ustawień organizacji.

/panel/ustawienia/profil:

formularz profilu użytkownika.

Walidacja, komunikaty sukcesu i błędów.

12. Billing / plany (bez integracji płatności na razie)

PROMPT 12 – plans & billing (bez bramki płatniczej)

Cel: mieć działający system planów i limitów, nawet jeśli opłaty będą ręcznie.

Model Plan i Subscription:

Plan:

id, name, code (START, STANDARD, PREMIUM),

limity: maxEmployees, maxLocations (nullable = brak limitu),

pricePerEmployee (decimal).

Subscription:

id, organizationId, planId,

status (ACTIVE, CANCELLED, TRIAL),

validUntil.

Endpointy:

GET /billing/plans – lista planów (publiczna).

GET /billing/subscription – subskrypcja bieżącej organizacji.

POST /billing/subscription/change-plan – zmiana planu (OWNER/ADMIN).

Walidacja limitów:

przy tworzeniu pracownika / lokalizacji – sprawdzaj, czy nie przekraczasz limitów planu; jeśli tak, zwracaj sensowny błąd („Limit pracowników w planie Standard został osiągnięty...”).

Front:

/panel/billing:

info o obecnym planie, limitach i zużyciu.

lista dostępnych planów z CTA „Zmień plan”.

Integrację z operatorami płatności (Stripe/Przelewy) zostawiamy na osobny etap, ale cała logika po stronie panelu i bazy ma działać.

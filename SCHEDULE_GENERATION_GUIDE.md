# Kadromierz - Przewodnik po Zaawansowanym Generowaniu Grafików

## 📋 Spis Treści

1. [Przegląd Funkcji](#przegląd-funkcji)
2. [Nowe Modele Danych](#nowe-modele-danych)
3. [API Endpoints](#api-endpoints)
4. [Przykłady Użycia](#przykłady-użycia)
5. [Zgodność z Kodeksem Pracy](#zgodność-z-kodeksem-pracy)
6. [Optymalizacja Kosztów](#optymalizacja-kosztów)
7. [Integracja z Aplikacją Mobilną](#integracja-z-aplikacją-mobilną)

---

## 🎯 Przegląd Funkcji

Kadromierz został rozszerzony o zaawansowane funkcje generowania grafików, które obejmują:

### ✨ Główne Funkcjonalności

- **Inteligentne Generowanie Grafików** - AI-podobny algorytm uwzględniający wiele czynników
- **Walidacja Kodeksu Pracy** - Automatyczne sprawdzanie zgodności z przepisami
- **Optymalizacja Kosztów** - Minimalizacja kosztów przy zachowaniu wymagań
- **Prognozowanie** - Przewidywanie kosztów na podstawie danych historycznych
- **Zarządzanie Dostępnością** - Pracownicy mogą zgłaszać swoją dyspozycyjność
- **Szablony Zmian** - Wielokrotnego użytku wzorce zmian
- **Wykrywanie Konfliktów** - Automatyczne wykrywanie naruszeń i konfliktów

---

## 📊 Nowe Modele Danych

### 1. EmployeeAvailability (Dostępność Pracownika)

Model pozwalający pracownikom zgłaszać swoją dyspozycyjność.

```javascript
{
  employee: ObjectId,           // Referencja do pracownika
  startDate: Date,              // Początek okresu dostępności
  endDate: Date,                // Koniec okresu dostępności
  daysOfWeek: [Number],         // Dni tygodnia (0-6)
  preferredStartTime: String,   // Preferowana godzina rozpoczęcia
  preferredEndTime: String,     // Preferowana godzina zakończenia
  maxHoursPerDay: Number,       // Maksymalne godziny dziennie
  maxHoursPerWeek: Number,      // Maksymalne godziny tygodniowo
  type: String,                 // 'available', 'preferred', 'unavailable', 'limited'
  notes: String,                // Notatki
  status: String,               // 'pending', 'approved', 'rejected'
  approvedBy: ObjectId          // Kto zatwierdził
}
```

### 2. ShiftTemplate (Szablon Zmiany)

Wielokrotnego użytku wzorce zmian dla pracy zmianowej.

```javascript
{
  companyId: ObjectId,
  name: String,                 // Nazwa szablonu
  description: String,
  shiftType: String,            // 'morning', 'afternoon', 'night', 'full-day', 'custom'
  startTime: String,            // Format "HH:MM"
  endTime: String,              // Format "HH:MM"
  breaks: [{                    // Przerwy w trakcie zmiany
    startTime: String,
    endTime: String,
    type: String                // 'meal', 'rest', 'other'
  }],
  requiredStaff: Number,        // Wymagana liczba pracowników
  requiredSkills: [String],     // Wymagane umiejętności
  color: String,                // Kolor dla wizualizacji
  isActive: Boolean,
  additionalCostMultiplier: Number  // Mnożnik kosztów (np. 1.2 dla nocnej)
}
```

### 3. ScheduleConstraint (Ograniczenia Grafiku)

Reguły i ograniczenia dla generowania grafików.

```javascript
{
  companyId: ObjectId,
  name: String,
  description: String,
  type: String,                 // 'labor_law', 'company_policy', 'budget', 'staffing', 'custom'
  category: String,             // 'rest_period', 'max_hours', 'overtime', etc.
  rule: Object,                 // Reguła w formacie JSON
  severity: String,             // 'error', 'warning', 'info'
  isActive: Boolean,
  canOverride: Boolean,
  priority: Number              // 1-10
}
```

### 4. Rozszerzony Model Employee

Dodano nowe pola do modelu pracownika:

```javascript
{
  // ... istniejące pola ...
  skills: [String],             // Umiejętności pracownika
  maxHoursPerDay: Number,       // Maksymalne godziny dziennie
  maxHoursPerWeek: Number,      // Maksymalne godziny tygodniowo
  preferredShifts: [String],    // Preferowane typy zmian
  canWorkNights: Boolean,       // Czy może pracować w nocy
  canWorkWeekends: Boolean,     // Czy może pracować w weekendy
  schedulingPriority: Number,   // Priorytet przy przydzielaniu (1-10)
  user: ObjectId                // Powiązanie z kontem użytkownika
}
```

---

## 🔌 API Endpoints

### Grafiki (Schedule)

#### POST `/api/schedule/generate-intelligent`
Inteligentne generowanie grafiku z optymalizacją.

**Request Body:**
```json
{
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "employeeIds": ["emp1", "emp2"],
  "shiftTemplateIds": ["template1", "template2"],
  "constraints": {
    "minStaffPerShift": 1,
    "maxStaffPerShift": 3,
    "preferredStaffPerShift": 2,
    "allowOvertime": false,
    "allowNightShifts": true,
    "allowWeekendWork": true,
    "prioritizeAvailability": true,
    "prioritizeCostOptimization": false
  },
  "forecastData": {
    "daily": {
      "2025-02-14": { "requiredStaff": 3 }
    },
    "byDayOfWeek": {
      "6": { "requiredStaff": 3 },
      "0": { "requiredStaff": 3 }
    }
  },
  "budget": 50000,
  "autoSave": false
}
```

**Response:**
```json
{
  "schedule": [...],
  "validation": {
    "isValid": true,
    "violations": [],
    "summary": {
      "total": 0,
      "errors": 0,
      "warnings": 0
    }
  },
  "costs": {
    "totalCost": 45000,
    "totalHours": 1600,
    "totalOvertimeHours": 0,
    "averageCostPerHour": 28.13,
    "employeeCosts": [...]
  },
  "budgetStatus": {
    "budget": 50000,
    "actualCost": 45000,
    "withinBudget": true,
    "difference": 5000
  },
  "metadata": {
    "totalShifts": 200,
    "dateRange": {...},
    "generatedAt": "2025-12-22T10:00:00Z"
  }
}
```

#### GET `/api/schedule/validate-compliance`
Walidacja zgodności grafiku z Kodeksem Pracy.

**Query Parameters:**
- `employeeId` (required) - ID pracownika
- `from` (optional) - Data początkowa
- `to` (optional) - Data końcowa

**Response:**
```json
{
  "employeeId": "emp1",
  "period": { "from": "2025-02-01", "to": "2025-02-28" },
  "shiftsCount": 20,
  "isValid": false,
  "violations": [
    {
      "valid": false,
      "severity": "error",
      "message": "Naruszenie minimalnego odpoczynku dobowego. Wymagane: 11h, faktyczne: 9.5h",
      "article": "Art. 132 KP"
    }
  ],
  "summary": {
    "total": 1,
    "errors": 1,
    "warnings": 0
  }
}
```

#### GET `/api/schedule/conflicts`
Wykrywanie konfliktów w grafiku.

**Query Parameters:**
- `from` (required) - Data początkowa
- `to` (required) - Data końcowa

**Response:**
```json
{
  "period": { "from": "2025-02-01", "to": "2025-02-28" },
  "totalShifts": 200,
  "employeesChecked": 10,
  "conflictsFound": 2,
  "conflicts": [
    {
      "employeeId": "emp1",
      "employeeName": "Jan Kowalski",
      "violations": [...]
    }
  ]
}
```

#### GET `/api/schedule/costs/analyze`
Analiza kosztów grafiku.

**Query Parameters:**
- `from` (required) - Data początkowa
- `to` (required) - Data końcowa
- `employeeIds` (optional) - Lista ID pracowników (oddzielone przecinkami)

**Response:**
```json
{
  "period": { "from": "2025-02-01", "to": "2025-02-28" },
  "totalCost": 45000,
  "totalHours": 1600,
  "totalOvertimeHours": 50,
  "averageCostPerHour": 28.13,
  "employeeCosts": [
    {
      "employeeId": "emp1",
      "employeeName": "Jan Kowalski",
      "totalCost": 4500,
      "totalHours": 160,
      "overtimeHours": 5,
      "shifts": 20
    }
  ]
}
```

#### POST `/api/schedule/costs/optimize`
Optymalizacja kosztów grafiku.

**Request Body:**
```json
{
  "from": "2025-02-01",
  "to": "2025-02-28",
  "budget": 40000
}
```

**Response:**
```json
{
  "needsOptimization": true,
  "currentCost": 45000,
  "budget": 40000,
  "overBudget": 5000,
  "suggestions": [
    {
      "type": "reduce_overtime",
      "priority": "high",
      "message": "Zredukuj nadgodziny o 50 godzin",
      "potentialSavings": 2250
    }
  ]
}
```

#### GET `/api/schedule/costs/forecast`
Prognoza kosztów na podstawie danych historycznych.

**Query Parameters:**
- `historicalDays` (optional, default: 30) - Liczba dni historycznych
- `forecastDays` (optional, default: 30) - Liczba dni prognozy

**Response:**
```json
{
  "forecastedCost": 45000,
  "dailyAverage": 1500,
  "confidence": "high",
  "basedOnDays": 30,
  "forecastPeriodDays": 30
}
```

### Dostępność (Availability)

#### GET `/api/availability`
Pobranie dostępności pracowników.

#### POST `/api/availability`
Utworzenie nowej dostępności.

#### PUT `/api/availability/:id`
Aktualizacja dostępności.

#### PATCH `/api/availability/:id/status`
Zatwierdzenie/odrzucenie dostępności (tylko admin).

#### DELETE `/api/availability/:id`
Usunięcie dostępności.

### Szablony Zmian (Shift Templates)

#### GET `/api/shift-templates`
Pobranie szablonów zmian.

#### POST `/api/shift-templates`
Utworzenie nowego szablonu (tylko admin).

#### PUT `/api/shift-templates/:id`
Aktualizacja szablonu (tylko admin).

#### DELETE `/api/shift-templates/:id`
Usunięcie szablonu (tylko admin).

---

## 💡 Przykłady Użycia

### Przykład 1: Utworzenie Szablonu Zmiany

```javascript
// POST /api/shift-templates
{
  "name": "Zmiana poranna - sklep",
  "description": "Standardowa zmiana poranna dla sklepu",
  "shiftType": "morning",
  "startTime": "08:00",
  "endTime": "16:00",
  "breaks": [
    {
      "startTime": "12:00",
      "endTime": "12:30",
      "type": "meal"
    }
  ],
  "requiredStaff": 2,
  "requiredSkills": ["kasjer", "obsługa"],
  "color": "#3b82f6"
}
```

### Przykład 2: Zgłoszenie Dostępności przez Pracownika

```javascript
// POST /api/availability
{
  "employeeId": "emp123",
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "daysOfWeek": [1, 2, 3, 4, 5],  // Pon-Pt
  "preferredStartTime": "08:00",
  "preferredEndTime": "16:00",
  "maxHoursPerDay": 8,
  "maxHoursPerWeek": 40,
  "type": "preferred",
  "notes": "Preferuję zmiany poranne"
}
```

### Przykład 3: Inteligentne Generowanie Grafiku

```javascript
// POST /api/schedule/generate-intelligent
{
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "constraints": {
    "preferredStaffPerShift": 2,
    "allowOvertime": false,
    "prioritizeAvailability": true,
    "prioritizeCostOptimization": true
  },
  "budget": 50000,
  "autoSave": false  // Najpierw podgląd, potem zapis
}
```

### Przykład 4: Walidacja Grafiku

```javascript
// GET /api/schedule/validate-compliance?employeeId=emp123&from=2025-02-01&to=2025-02-28

// Odpowiedź pokazuje wszystkie naruszenia Kodeksu Pracy
```

---

## ⚖️ Zgodność z Kodeksem Pracy

System automatycznie sprawdza zgodność z następującymi przepisami:

### Art. 132 KP - Minimalny Odpoczynek Dobowy
- **Wymaganie:** 11 godzin nieprzerwanie między zmianami
- **Walidacja:** Automatyczne sprawdzanie odstępu między końcem jednej zmiany a początkiem następnej
- **Poziom:** ERROR

### Art. 129 KP - Maksymalny Czas Pracy
- **Wymaganie:** 8 godzin dziennie, 40 godzin tygodniowo (średnio)
- **Walidacja:** Sprawdzanie długości zmian i sumy godzin tygodniowych
- **Poziom:** WARNING (może być przekroczone w systemie czasu pracy)

### Art. 151 KP - Nadgodziny
- **Wymaganie:** Maksymalnie 150h/rok, 48h/miesiąc
- **Walidacja:** Sumowanie nadgodzin w okresie
- **Poziom:** ERROR przy przekroczeniu limitów

### Art. 151^7 KP - Praca Nocna
- **Definicja:** Praca w godzinach 22:00-06:00
- **Wymaganie:** Maksymalnie 8 godzin na dobę
- **Walidacja:** Sprawdzanie długości zmian nocnych
- **Poziom:** ERROR

### Art. 133 KP - Odpoczynek Tygodniowy
- **Wymaganie:** 35 godzin nieprzerwanie w tygodniu (zawierające niedzielę)
- **Walidacja:** Sprawdzanie serii kolejnych dni pracy
- **Poziom:** ERROR przy więcej niż 6 kolejnych dni

---

## 💰 Optymalizacja Kosztów

System oferuje zaawansowane funkcje optymalizacji kosztów:

### Kalkulacja Kosztów

Uwzględnia:
- Stawkę godzinową pracownika
- Nadgodziny (150% stawki)
- Dodatek nocny (120% stawki)
- Dodatek weekendowy (150% stawki)
- Dodatek świąteczny (200% stawki)

### Sugestie Optymalizacji

System automatycznie sugeruje:
1. **Redukcję nadgodzin** - Najwyższy priorytet
2. **Optymalizację zmian nocnych** - Średni priorytet
3. **Wykorzystanie tańszych pracowników** - Średni priorytet
4. **Równomierne rozłożenie pracy** - Niski priorytet

### Prognozowanie

Na podstawie danych historycznych system przewiduje:
- Koszty na przyszłe okresy
- Średnie dzienne koszty
- Poziom pewności prognozy (low/medium/high)

---

## 📱 Integracja z Aplikacją Mobilną

### Funkcje dla Pracownika (Kadromierz Pracownik)

1. **Zgłaszanie Dostępności**
   - Pracownik może zgłosić swoją dyspozycyjność przez aplikację
   - Status: pending → wymaga zatwierdzenia przez managera

2. **Powiadomienia**
   - Automatyczne powiadomienia o zmianach w grafiku
   - Powiadomienia o zatwierdzeniu/odrzuceniu dostępności

3. **Dostęp do Grafiku**
   - Przeglądanie swojego grafiku
   - Informacje o nadgodzinach i dodatkach

### Funkcje dla Managera

1. **Zatwierdzanie Dostępności**
   - Przegląd zgłoszeń dostępności
   - Zatwierdzanie/odrzucanie wniosków

2. **Generowanie Grafików**
   - Inteligentne generowanie z uwzględnieniem dostępności
   - Podgląd przed zapisem

3. **Monitorowanie Zgodności**
   - Automatyczne ostrzeżenia o naruszeniach
   - Raporty zgodności z prawem pracy

---

## 🔧 Konfiguracja

### Zmienne Środowiskowe

Brak dodatkowych zmiennych - system wykorzystuje istniejącą konfigurację.

### Domyślne Wartości

```javascript
// Ograniczenia
maxHoursPerDay: 8
maxHoursPerWeek: 40
minRestHours: 11

// Mnożniki kosztów
overtimeMultiplier: 1.5    // 150%
nightShiftMultiplier: 1.2  // 120%
weekendMultiplier: 1.5     // 150%
holidayMultiplier: 2.0     // 200%

// Praca nocna
nightShiftStart: "22:00"
nightShiftEnd: "06:00"
```

---

## 🧪 Testowanie

### Uruchomienie Testów

```bash
cd backend
node test-schedule-generation.js
```

### Testy Obejmują

1. ✅ Walidacja zgodności z Kodeksem Pracy
2. ✅ Obliczanie długości zmian
3. ✅ Wykrywanie zmian nocnych
4. ✅ Kalkulacja kosztów grafiku
5. ✅ Optymalizacja kosztów
6. ✅ Prognozowanie kosztów
7. ✅ Inteligentne generowanie grafików

---

## 📈 Roadmap

### Planowane Funkcje

- [ ] Geo-fencing dla rejestracji czasu pracy
- [ ] Integracja z systemami płacowymi (Comarch, Enova)
- [ ] Eksport do Excel z zaawansowanymi raportami
- [ ] Machine Learning dla lepszych prognoz
- [ ] Automatyczne rozpoznawanie wzorców sprzedaży
- [ ] Integracja z kalendarzem Google/Outlook
- [ ] Powiadomienia push w aplikacji mobilnej
- [ ] Dashboard analityczny dla managera

---

## 🆘 Wsparcie

W razie problemów:

1. Sprawdź logi backendu: `pm2 logs kadryhr-backend`
2. Sprawdź logi przeglądarki (DevTools → Console)
3. Uruchom testy: `node test-schedule-generation.js`
4. Sprawdź dokumentację API powyżej

---

## 📝 Changelog

### v2.0.0 (2025-12-22)

**Nowe Funkcje:**
- ✨ Inteligentne generowanie grafików
- ✨ Walidacja zgodności z Kodeksem Pracy
- ✨ Optymalizacja kosztów
- ✨ Prognozowanie kosztów
- ✨ Zarządzanie dostępnością pracowników
- ✨ Szablony zmian
- ✨ Wykrywanie konfliktów

**Nowe Modele:**
- EmployeeAvailability
- ShiftTemplate
- ScheduleConstraint
- Rozszerzony Employee

**Nowe API Endpoints:**
- POST /api/schedule/generate-intelligent
- GET /api/schedule/validate-compliance
- GET /api/schedule/conflicts
- GET /api/schedule/costs/analyze
- POST /api/schedule/costs/optimize
- GET /api/schedule/costs/forecast
- CRUD /api/availability
- CRUD /api/shift-templates

**Utilities:**
- laborLawValidator.js
- costCalculator.js
- scheduleOptimizer.js

---

## 📄 Licencja

Kadromierz © 2025. Wszystkie prawa zastrzeżone.

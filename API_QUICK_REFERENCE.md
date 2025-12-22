# Kadromierz - API Quick Reference

## 🔐 Autoryzacja

Wszystkie endpointy wymagają autoryzacji:
```
Authorization: Bearer YOUR_JWT_TOKEN
```
lub cookie `token` (automatycznie po zalogowaniu).

---

## 📅 Schedule Endpoints

### Inteligentne Generowanie Grafiku
```http
POST /api/schedule/generate-intelligent
Content-Type: application/json

{
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "employeeIds": ["emp1", "emp2"],        // opcjonalne
  "shiftTemplateIds": ["tpl1", "tpl2"],   // opcjonalne
  "constraints": {
    "preferredStaffPerShift": 2,
    "allowOvertime": false,
    "allowNightShifts": true,
    "allowWeekendWork": true,
    "prioritizeAvailability": true,
    "prioritizeCostOptimization": false
  },
  "budget": 50000,                        // opcjonalne
  "autoSave": false                       // true = zapisz od razu
}
```

### Walidacja Zgodności z Kodeksem Pracy
```http
GET /api/schedule/validate-compliance?employeeId=emp123&from=2025-02-01&to=2025-02-28
```

### Wykrywanie Konfliktów
```http
GET /api/schedule/conflicts?from=2025-02-01&to=2025-02-28
```

### Analiza Kosztów
```http
GET /api/schedule/costs/analyze?from=2025-02-01&to=2025-02-28&employeeIds=emp1,emp2
```

### Optymalizacja Kosztów
```http
POST /api/schedule/costs/optimize
Content-Type: application/json

{
  "from": "2025-02-01",
  "to": "2025-02-28",
  "budget": 40000
}
```

### Prognoza Kosztów
```http
GET /api/schedule/costs/forecast?historicalDays=30&forecastDays=30
```

### Optymalizacja Istniejącego Grafiku
```http
POST /api/schedule/optimize
Content-Type: application/json

{
  "from": "2025-02-01",
  "to": "2025-02-28",
  "constraints": {
    "budget": 45000
  }
}
```

---

## 👥 Availability Endpoints

### Lista Dostępności
```http
GET /api/availability?employeeId=emp123&status=approved&from=2025-02-01&to=2025-02-28
```

### Utworzenie Dostępności
```http
POST /api/availability
Content-Type: application/json

{
  "employeeId": "emp123",
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "daysOfWeek": [1, 2, 3, 4, 5],          // 0=niedziela, 6=sobota
  "preferredStartTime": "08:00",
  "preferredEndTime": "16:00",
  "maxHoursPerDay": 8,
  "maxHoursPerWeek": 40,
  "type": "preferred",                     // available, preferred, unavailable, limited
  "notes": "Preferuję zmiany poranne"
}
```

### Aktualizacja Dostępności
```http
PUT /api/availability/:id
Content-Type: application/json

{
  "type": "available",
  "notes": "Zaktualizowane preferencje"
}
```

### Zatwierdzenie/Odrzucenie (Admin)
```http
PATCH /api/availability/:id/status
Content-Type: application/json

{
  "status": "approved"  // lub "rejected"
}
```

### Usunięcie Dostępności
```http
DELETE /api/availability/:id
```

---

## 🔄 Shift Template Endpoints

### Lista Szablonów
```http
GET /api/shift-templates?isActive=true&shiftType=morning
```

### Pojedynczy Szablon
```http
GET /api/shift-templates/:id
```

### Utworzenie Szablonu (Admin)
```http
POST /api/shift-templates
Content-Type: application/json

{
  "name": "Zmiana poranna",
  "description": "Standardowa zmiana poranna",
  "shiftType": "morning",                  // morning, afternoon, night, full-day, custom
  "startTime": "08:00",
  "endTime": "16:00",
  "breaks": [
    {
      "startTime": "12:00",
      "endTime": "12:30",
      "type": "meal"                       // meal, rest, other
    }
  ],
  "requiredStaff": 2,
  "requiredSkills": ["kasjer", "obsługa"],
  "color": "#3b82f6",
  "additionalCostMultiplier": 1.0
}
```

### Aktualizacja Szablonu (Admin)
```http
PUT /api/shift-templates/:id
Content-Type: application/json

{
  "name": "Zmiana poranna - zaktualizowana",
  "requiredStaff": 3
}
```

### Usunięcie Szablonu (Admin)
```http
DELETE /api/shift-templates/:id
```

---

## 📊 Response Examples

### Sukces - Inteligentne Generowanie
```json
{
  "schedule": [
    {
      "employee": "emp1",
      "date": "2025-02-01T00:00:00.000Z",
      "startTime": "08:00",
      "endTime": "16:00",
      "type": "regular",
      "notes": "Auto-generowane (Zmiana poranna)"
    }
  ],
  "validation": {
    "isValid": true,
    "violations": [],
    "summary": { "total": 0, "errors": 0, "warnings": 0 }
  },
  "costs": {
    "totalCost": 45000,
    "totalHours": 1600,
    "totalOvertimeHours": 0,
    "averageCostPerHour": 28.13
  },
  "budgetStatus": {
    "budget": 50000,
    "actualCost": 45000,
    "withinBudget": true,
    "difference": 5000
  },
  "metadata": {
    "totalShifts": 200,
    "generatedAt": "2025-12-22T10:00:00Z"
  }
}
```

### Sukces - Walidacja Zgodności
```json
{
  "employeeId": "emp123",
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
  "summary": { "total": 1, "errors": 1, "warnings": 0 }
}
```

### Sukces - Analiza Kosztów
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

### Błąd - Brak Autoryzacji
```json
{
  "message": "Brak tokenu autoryzacyjnego"
}
```
Status: 401

### Błąd - Brak Uprawnień
```json
{
  "message": "Tylko administrator może generować grafik."
}
```
Status: 403

### Błąd - Walidacja
```json
{
  "message": "Wymagane pola: startDate, endDate"
}
```
Status: 400

---

## 🔑 Kody Statusu HTTP

- `200` - OK (sukces)
- `201` - Created (utworzono zasób)
- `400` - Bad Request (błędne dane)
- `401` - Unauthorized (brak autoryzacji)
- `403` - Forbidden (brak uprawnień)
- `404` - Not Found (nie znaleziono)
- `500` - Internal Server Error (błąd serwera)

---

## 📝 Notatki

### Typy Zmian (shiftType)
- `morning` - Zmiana poranna
- `afternoon` - Zmiana popołudniowa
- `night` - Zmiana nocna (22:00-06:00)
- `full-day` - Cały dzień
- `custom` - Niestandardowa

### Typy Dostępności (type)
- `available` - Dostępny
- `preferred` - Preferowany
- `unavailable` - Niedostępny
- `limited` - Ograniczona dostępność

### Statusy
- `pending` - Oczekuje na zatwierdzenie
- `approved` - Zatwierdzony
- `rejected` - Odrzucony

### Dni Tygodnia (daysOfWeek)
- `0` - Niedziela
- `1` - Poniedziałek
- `2` - Wtorek
- `3` - Środa
- `4` - Czwartek
- `5` - Piątek
- `6` - Sobota

---

## 🧪 Przykłady cURL

### Generowanie Grafiku
```bash
curl -X POST http://localhost:5000/api/schedule/generate-intelligent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "startDate": "2025-02-01",
    "endDate": "2025-02-07",
    "constraints": {
      "preferredStaffPerShift": 2,
      "allowOvertime": false
    },
    "budget": 10000,
    "autoSave": false
  }'
```

### Walidacja Grafiku
```bash
curl "http://localhost:5000/api/schedule/validate-compliance?employeeId=emp123&from=2025-02-01&to=2025-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Utworzenie Szablonu
```bash
curl -X POST http://localhost:5000/api/shift-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Zmiana poranna",
    "shiftType": "morning",
    "startTime": "08:00",
    "endTime": "16:00",
    "requiredStaff": 2
  }'
```

### Zgłoszenie Dostępności
```bash
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "emp123",
    "startDate": "2025-02-01",
    "endDate": "2025-02-28",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "preferredStartTime": "08:00",
    "preferredEndTime": "16:00",
    "type": "preferred"
  }'
```

---

**Kadromierz API v2.0.0**  
Ostatnia aktualizacja: 2025-12-22

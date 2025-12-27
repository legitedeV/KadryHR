# KadryHR - Next Development Steps

## 🎯 Current Status

✅ **Completed in this PR:**
- Product analysis comparing with industry leaders
- Code consolidation (removed duplicate schedule builders)
- Fixed quick templates anti-pattern
- Improved modal UX (scrolling, layout, body lock)
- Multi-tenant infrastructure (withTenant middleware)
- Service layer for business logic
- Validation layer with Zod
- Code quality tools (ESLint, Prettier)
- CI/CD pipeline with GitHub Actions

## 🚀 Recommended Next Steps

### Phase 1: Complete Schedule Workflow (1-2 weeks)

#### 1.1 Implement Publish Schedule UI
**Goal**: Allow managers to publish schedules and track changes

**Tasks:**
- Add status badge to schedule header (Draft/Published/Archived)
- Add "Publish Schedule" button with confirmation dialog
- Show "Last published" timestamp and user
- Mark shifts edited after publish with indicator
- Add "Unpublish" option for corrections

**Prompt for AI:**
```
Zaimplementuj pełny workflow publikacji grafiku w KadryHR:

1. Dodaj status badge w nagłówku grafiku (Draft/Published/Archived)
2. Dodaj przycisk "Opublikuj grafik" z dialogiem potwierdzenia
3. Po publikacji:
   - Pokaż timestamp i użytkownika który opublikował
   - Oznacz zmiany edytowane po publikacji
   - Dodaj opcję "Cofnij publikację"
4. Użyj istniejącego scheduleService.publishSchedule()
5. Dodaj endpoint POST /api/schedules/:id/publish
6. Dodaj powiadomienia dla pracowników (opcjonalne)

Zachowaj istniejący dark theme i UX patterns.
```

#### 1.2 Add Conflict Detection UI
**Goal**: Show warnings for overlapping shifts and leave conflicts

**Tasks:**
- Add conflict check when creating/editing shift
- Show warning icon in grid cell for conflicts
- Display conflict details in tooltip
- Add "Override" option for managers
- Integrate with leave requests module

**Prompt for AI:**
```
Dodaj detekcję konfliktów w grafiku KadryHR:

1. Użyj scheduleService.checkConflicts() przy zapisie zmiany
2. Pokaż ikonę ostrzeżenia w komórce siatki dla konfliktów
3. Tooltip z detalami konfliktu:
   - Nakładające się zmiany (godziny)
   - Konflikty z urlopami
   - Przekroczenie limitu godzin
4. Dialog potwierdzenia dla managerów: "Zapisać mimo konfliktu?"
5. Dodaj endpoint POST /api/schedules/check-conflicts
6. Wizualne oznaczenie (czerwona ramka, ikonka)

Zachowaj istniejący design system.
```

#### 1.3 Connect Leave Requests with Schedule
**Goal**: Prevent scheduling shifts on approved leaves

**Tasks:**
- Block shift creation on approved leave days
- Show leave info in schedule grid
- Add "View Leave Details" link
- Auto-mark days with leaves
- Add filter to show/hide leave days

**Prompt for AI:**
```
Zintegruj moduł wniosków urlopowych z grafikiem w KadryHR:

1. Blokuj tworzenie zmian w dniach z zatwierdzonym urlopem
2. Pokaż informację o urlopie w komórce siatki:
   - Typ urlopu (urlop, L4, wolne)
   - Status (zatwierdzony, oczekujący)
   - Kolor tła odpowiedni do typu
3. Dodaj link "Zobacz szczegóły wniosku"
4. Dodaj filtr "Pokaż/Ukryj urlopy"
5. Użyj istniejącego modelu Leave
6. Zaktualizuj scheduleService.checkConflicts()

Zachowaj spójność z istniejącym UI.
```

### Phase 2: Bulk Operations & Advanced Features (2-3 weeks)

#### 2.1 Implement Bulk Operations UI
**Goal**: Allow managers to perform mass operations efficiently

**Tasks:**
- Copy week to another week
- Apply template to multiple days/employees
- Mass delete with confirmation
- Multi-select in grid (checkboxes)
- Bulk actions toolbar

**Prompt for AI:**
```
Zaimplementuj operacje masowe w grafiku KadryHR:

1. Dodaj tryb zaznaczania (checkboxy w siatce):
   - Zaznacz cały tydzień pracownika
   - Zaznacz zakres dni
   - Zaznacz wszystkie zmiany pracownika
2. Toolbar z akcjami:
   - "Kopiuj tydzień" → wybierz tydzień docelowy
   - "Zastosuj szablon" → wybierz szablon i dni
   - "Usuń zaznaczone" → potwierdzenie
3. Użyj scheduleService.copyWeek(), applyTemplate(), deleteRange()
4. Dodaj endpointy:
   - POST /api/schedules/bulk/copy-week
   - POST /api/schedules/bulk/apply-template
   - POST /api/schedules/bulk/delete-range
5. Progress indicator dla długich operacji

Zachowaj istniejący design i UX patterns.
```

#### 2.2 Improve Drag & Drop
**Goal**: Make schedule editing more intuitive

**Tasks:**
- Drag shift to different day
- Drag shift to different employee
- Copy shift with Ctrl+drag
- Visual feedback during drag
- Conflict warnings on drop

**Prompt for AI:**
```
Ulepsz drag & drop w grafiku KadryHR:

1. Przeciąganie zmiany na inny dzień:
   - Visual feedback (ghost element)
   - Sprawdź konflikty przed drop
   - Pokaż ostrzeżenie jeśli konflikt
2. Przeciąganie zmiany na innego pracownika:
   - Zmień employeeId
   - Zachowaj datę i godziny
3. Kopiowanie z Ctrl+drag:
   - Utwórz nową zmianę
   - Nie usuń oryginalnej
4. Użyj HTML5 Drag & Drop API lub react-dnd
5. Integracja z scheduleService.checkConflicts()

Zachowaj responsywność i accessibility.
```

#### 2.3 Integration with Time Tracking
**Goal**: Show planned vs actual hours

**Tasks:**
- Display actual hours next to planned
- Highlight discrepancies (late, early, missing)
- Add "View Time Entries" link
- Calculate overtime automatically
- Export comparison report

**Prompt for AI:**
```
Zintegruj grafik z modułem czasu pracy w KadryHR:

1. W komórce siatki pokaż:
   - Planowane godziny (z grafiku)
   - Rzeczywiste godziny (z time tracking)
   - Różnica (kolor: zielony/czerwony)
2. Oznacz problemy:
   - Spóźnienie (czerwona kropka)
   - Brak odbicia (żółta kropka)
   - Nadgodziny (niebieska kropka)
3. Dodaj tooltip z detalami:
   - Planowane: 08:00 - 16:00
   - Rzeczywiste: 08:15 - 16:30
   - Różnica: +0.25h
4. Link "Zobacz wpisy czasu"
5. Użyj istniejącego modelu TimeEntry
6. Dodaj endpoint GET /api/schedules/:id/time-comparison

Zachowaj czytelność i nie przeciążaj UI.
```

### Phase 3: Advanced Features (3-4 weeks)

#### 3.1 Auto-Scheduling
**Goal**: Automatically generate schedules based on rules

**Tasks:**
- Define scheduling rules (min/max hours, skills, availability)
- Algorithm to assign shifts
- Preview before applying
- Manual adjustments after auto-schedule
- Save as template

**Prompt for AI:**
```
Zaimplementuj auto-scheduling w KadryHR:

1. Kreator reguł:
   - Minimalne/maksymalne godziny na pracownika
   - Wymagane umiejętności
   - Dostępność pracowników
   - Równomierne rozłożenie zmian
2. Algorytm:
   - Przypisz zmiany na podstawie reguł
   - Unikaj konfliktów
   - Optymalizuj pokrycie
3. Podgląd przed zastosowaniem:
   - Pokaż wygenerowany grafik
   - Pozwól na ręczne poprawki
   - Zapisz jako szablon
4. Dodaj endpoint POST /api/schedules/auto-generate
5. Użyj scheduleService do walidacji

Inspiruj się Deputy i When I Work.
```

#### 3.2 Shift Swap/Trade Workflow
**Goal**: Allow employees to swap shifts with approval

**Tasks:**
- Employee requests shift swap
- Find eligible employees
- Manager approval workflow
- Notifications
- History of swaps

**Prompt for AI:**
```
Zaimplementuj system zamiany zmian w KadryHR:

1. Pracownik inicjuje zamianę:
   - Wybiera swoją zmianę
   - System pokazuje uprawnionych pracowników
   - Wysyła prośbę
2. Drugi pracownik:
   - Otrzymuje powiadomienie
   - Akceptuje lub odrzuca
3. Manager:
   - Otrzymuje prośbę o zatwierdzenie
   - Sprawdza konflikty
   - Zatwierdza lub odrzuca
4. Dodaj model SwapRequest (już istnieje)
5. Endpointy:
   - POST /api/swaps/request
   - POST /api/swaps/:id/accept
   - POST /api/swaps/:id/approve
6. Powiadomienia email/push

Zachowaj prosty UX dla pracowników.
```

#### 3.3 Open Shifts
**Goal**: Allow unassigned shifts that employees can claim

**Tasks:**
- Create shift without employee
- Mark as "Open"
- Employees can claim
- First-come-first-served or manager approval
- Notifications

**Prompt for AI:**
```
Dodaj system otwartych zmian w KadryHR:

1. Tworzenie otwartej zmiany:
   - Bez przypisanego pracownika
   - Status: "open"
   - Wymagane umiejętności (opcjonalnie)
2. Widok dla pracowników:
   - Lista dostępnych zmian
   - Filtrowanie po dacie, lokalizacji
   - Przycisk "Zgłoś się"
3. Przypisanie:
   - Automatyczne (pierwszy zgłoszony)
   - Lub wymaga zatwierdzenia managera
4. Powiadomienia:
   - Nowa otwarta zmiana
   - Zmiana przypisana
5. Dodaj pole status do ShiftAssignment: "open" | "claimed" | "assigned"
6. Endpointy:
   - GET /api/shifts/open
   - POST /api/shifts/:id/claim

Inspiruj się Homebase i Deputy.
```

#### 3.4 Budget Tracking
**Goal**: Track labor costs vs budget

**Tasks:**
- Set budget for period
- Calculate actual costs (hours × rate)
- Show budget vs actual
- Warnings when over budget
- Export reports

**Prompt for AI:**
```
Dodaj śledzenie budżetu w grafiku KadryHR:

1. Ustawienia budżetu:
   - Budżet na miesiąc/tydzień
   - Stawki godzinowe pracowników
   - Limity nadgodzin
2. Kalkulacja kosztów:
   - Planowane: suma (godziny × stawka)
   - Rzeczywiste: z time tracking
   - Różnica i procent
3. Wizualizacja:
   - Progress bar (budżet wykorzystany)
   - Kolor: zielony/żółty/czerwony
   - Wykres trendów
4. Ostrzeżenia:
   - Przekroczenie budżetu
   - Zbliżanie się do limitu
5. Dodaj model Budget
6. Endpoint GET /api/schedules/:id/budget-summary

Zachowaj przejrzystość danych finansowych.
```

### Phase 4: Testing & Polish (1-2 weeks)

#### 4.1 Unit Tests
**Goal**: Ensure code reliability

**Tasks:**
- Service layer tests (scheduleService)
- Validator tests (shiftValidators)
- Middleware tests (withTenant)
- Controller tests
- Integration tests

**Prompt for AI:**
```
Dodaj testy jednostkowe do KadryHR:

1. Testy dla scheduleService:
   - checkConflicts() - różne scenariusze
   - publishSchedule() - happy path i błędy
   - copyWeek() - walidacja danych
   - applyTemplate() - edge cases
2. Testy dla shiftValidators:
   - Poprawne dane
   - Niepoprawne dane
   - Edge cases (overnight shifts)
3. Testy dla withTenant:
   - Filtrowanie po organizacji
   - Brak organizacji
4. Użyj Jest + Supertest
5. Dodaj npm script: "test"
6. Cel: 80%+ code coverage

Zachowaj TDD best practices.
```

#### 4.2 E2E Tests
**Goal**: Test critical user flows

**Tasks:**
- Create schedule
- Assign shifts
- Publish schedule
- Bulk operations
- Conflict detection

**Prompt for AI:**
```
Dodaj testy E2E dla grafiku w KadryHR:

1. Scenariusze testowe:
   - Tworzenie nowego grafiku
   - Przypisywanie zmian pracownikom
   - Publikacja grafiku
   - Kopiowanie tygodnia
   - Detekcja konfliktów
2. Użyj Playwright lub Cypress
3. Testy na różnych rozdzielczościach
4. Testy dark mode
5. Dodaj do CI/CD pipeline
6. Screenshoty przy błędach

Zachowaj szybkość wykonania testów.
```

#### 4.3 Performance Optimization
**Goal**: Ensure fast loading and smooth UX

**Tasks:**
- Optimize schedule grid rendering
- Lazy load employees/templates
- Cache frequently used data
- Debounce search/filters
- Optimize database queries

**Prompt for AI:**
```
Zoptymalizuj wydajność grafiku w KadryHR:

1. Frontend:
   - Wirtualizacja siatki (react-window)
   - Memoizacja komponentów
   - Debounce dla filtrów
   - Lazy loading dla dużych list
2. Backend:
   - Indeksy w MongoDB
   - Agregacje zamiast multiple queries
   - Caching z Redis (opcjonalnie)
   - Pagination dla dużych zbiorów
3. Pomiary:
   - Lighthouse score > 90
   - Time to Interactive < 3s
   - First Contentful Paint < 1.5s
4. Monitoring:
   - Dodaj performance metrics
   - Log slow queries

Zachowaj UX bez zmian.
```

## 📋 Prompt Template for Next Task

```
Jesteś senior full-stack developerem SaaS multi-tenant. Pracujesz w projekcie KadryHR.

KONTEKST:
- Właśnie zakończono refaktor schedule buildera (PR #XXX)
- Dodano service layer, validation, multi-tenant middleware
- Naprawiono anti-patterns i UX issues
- Kod jest production-ready

ZADANIE:
[Wybierz jedno z powyższych zadań, np. "Implement Publish Schedule UI"]

WYMAGANIA:
1. Użyj istniejących patterns (service layer, validators, withTenant)
2. Zachowaj dark theme i design system
3. Dodaj testy dla nowej funkcjonalności
4. Zaktualizuj dokumentację
5. Stwórz Pull Request z opisem

PROCES:
1. Przeanalizuj istniejący kod
2. Zaproponuj plan implementacji
3. Wykonaj zmiany
4. Przetestuj (build, lint, funkcjonalnie)
5. Utwórz PR

Działaj jak doświadczony dev produktu, NIE chatbot.
```

## 🎯 Success Metrics

### Code Quality
- [ ] ESLint score: 0 errors, < 10 warnings
- [ ] Test coverage: > 80%
- [ ] Build time: < 30s
- [ ] Bundle size: < 500KB (gzipped)

### Performance
- [ ] Lighthouse score: > 90
- [ ] Time to Interactive: < 3s
- [ ] First Contentful Paint: < 1.5s
- [ ] Schedule grid renders < 1s for 100 employees

### User Experience
- [ ] No console errors
- [ ] Smooth animations (60fps)
- [ ] Responsive on all devices
- [ ] Accessible (WCAG 2.1 AA)

### Business Impact
- [ ] Reduce schedule creation time by 50%
- [ ] Reduce conflicts by 80%
- [ ] Increase employee satisfaction
- [ ] Enable self-service for employees

## 📚 Resources

### Documentation
- [Product Analysis](docs/product-analysis.md)
- [Service Layer](backend/services/scheduleService.js)
- [Validators](backend/validators/shiftValidators.js)
- [Multi-Tenant Middleware](backend/middleware/withTenant.js)

### Industry References
- [Deputy API Docs](https://developer.deputy.com/)
- [When I Work API](https://apidocs.wheniwork.com/)
- [Planday Developer](https://developer.planday.com/)

### Tech Stack
- Frontend: React 18, Vite, TailwindCSS, TanStack Query
- Backend: Node.js, Express, MongoDB, Mongoose
- Tools: ESLint, Prettier, Zod, Winston
- CI/CD: GitHub Actions

## 🚀 Getting Started with Next Task

1. **Choose a task** from Phase 1 (highest priority)
2. **Copy the prompt** for that task
3. **Paste into AI** (Blackbox, ChatGPT, Claude)
4. **Review the plan** before implementation
5. **Test thoroughly** before creating PR
6. **Update this document** with progress

---

**Last Updated**: December 27, 2025  
**Current Phase**: Phase 1 - Complete Schedule Workflow  
**Next Task**: Implement Publish Schedule UI

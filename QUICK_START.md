# System Szablonów Grafików - Quick Start

## 🚀 Szybki Start

### 1. Uruchom System
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2. Otwórz Aplikację
```
http://localhost:5173
```

### 3. Przejdź do Grafików
```
Menu → Grafiki → Kalendarz grafików
```

---

## 📋 Podstawowe Operacje

### Zapisz Szablon
1. Utwórz grafik z zmianami
2. Kliknij **"Szablony"**
3. Wpisz nazwę szablonu
4. Kliknij **"Zapisz szablon"**

### Zastosuj Szablon
1. Otwórz grafik docelowy
2. Kliknij **"Szablony"**
3. Wybierz szablon z listy
4. Wybierz tryb (nadpisz/scal)
5. Kliknij **"Zastosuj szablon"**

### Drag & Drop
1. Kliknij i przytrzymaj zmianę
2. Przeciągnij na inną komórkę
3. Upuść

### Szybkie Szablony
1. Kliknij pustą komórkę
2. Kliknij przycisk szybkiego szablonu (I zmiana, II zmiana, Dostawa)
3. Kliknij **"Zapisz"**

---

## 🔑 Kluczowe Funkcje

| Funkcja | Skrót/Akcja |
|---------|-------------|
| Dodaj zmianę | Kliknij pustą komórkę |
| Edytuj zmianę | Kliknij istniejącą zmianę |
| Przenieś zmianę | Przeciągnij zmianę |
| Zamień zmiany | Przeciągnij na inną zmianę |
| Zapisz szablon | Przycisk "Szablony" → Zapisz |
| Zastosuj szablon | Przycisk "Szablony" → Zastosuj |
| Filtruj pracowników | Panel filtry → Status |
| Szukaj pracownika | Panel filtry → Wpisz imię |

---

## 🎨 Kolorowe Notatki

| Typ | Kolor | Użycie |
|-----|-------|--------|
| Informacja | 🔵 Niebieski | Ogólne informacje |
| Pilne | 🔴 Czerwony | Ważne sprawy |
| Dostawa | 🟠 Pomarańczowy | Dostawy |

---

## 🔧 Tryby Zastosowania Szablonu

| Tryb | Opis | Kiedy używać |
|------|------|--------------|
| **Nadpisz** | Usuwa obecne zmiany i zastępuje je szablonem | Nowy grafik, pełna zmiana |
| **Scal** | Dodaje zmiany z szablonu, zachowuje istniejące | Uzupełnienie grafiku |

---

## 📊 Panel Podsumowania

- **Zmian**: Liczba wszystkich przypisań
- **Pracowników**: Liczba unikalnych pracowników
- **Godzin**: Suma godzin pracy
- **Naruszeń**: Liczba naruszeń Kodeksu Pracy

---

## ⚠️ Najczęstsze Problemy

### Problem: Nie mogę zapisać szablonu
**Rozwiązanie:** Upewnij się, że grafik zawiera przynajmniej jedną zmianę.

### Problem: Szablon nie zastosował się
**Rozwiązanie:** Sprawdź, czy wybrałeś właściwy grafik docelowy i miesiąc.

### Problem: Drag & Drop nie działa
**Rozwiązanie:** Upewnij się, że używasz nowoczesnej przeglądarki (Chrome, Firefox, Edge).

### Problem: Nie widzę przycisku "Szablony"
**Rozwiązanie:** Musisz najpierw wybrać lub utworzyć grafik.

---

## 🎯 Przykładowy Workflow

### Scenariusz: Kopiowanie grafiku na kolejny miesiąc

1. **Styczeń 2025** - Utwórz grafik
   - Dodaj zmiany dla wszystkich pracowników
   - Kliknij "Szablony"
   - Zapisz jako "Szablon Styczeń 2025"

2. **Luty 2025** - Utwórz nowy grafik
   - Kliknij "Nowy grafik"
   - Wybierz luty 2025
   - Kliknij "Szablony"
   - Wybierz "Szablon Styczeń 2025"
   - Tryb: "Nadpisz"
   - Kliknij "Zastosuj szablon"

3. **Gotowe!** Grafik na luty jest skopiowany ze stycznia

---

## 💡 Wskazówki

- **Zapisuj szablony regularnie** - łatwiej będzie tworzyć kolejne grafiki
- **Używaj opisowych nazw** - np. "Grafik Styczeń 2025 - Zmiana I"
- **Tryb Scal** - przydatny do dodawania zmian weekendowych
- **Drag & Drop** - szybsze niż edycja przez modal
- **Szybkie szablony** - oszczędzają czas przy powtarzalnych zmianach

---

## 📞 Pomoc

Jeśli masz problemy:
1. Sprawdź dokumentację: `TEST_TEMPLATE_SYSTEM.md`
2. Sprawdź logi backendu
3. Sprawdź console przeglądarki (F12)
4. Sprawdź Network tab (F12 → Network)

---

## 🎉 Gotowe!

System jest gotowy do użycia. Miłej pracy z grafikami! 🚀

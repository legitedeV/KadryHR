# KadryHR V2 - Next.js Application

Nowa wersja aplikacji webowej KadryHR zbudowana w Next.js 16 z TypeScript i Tailwind CSS.

## Technologie

- **Next.js 16** - Framework React z App Router
- **TypeScript** - Typowanie statyczne
- **Tailwind CSS 4** - Stylowanie
- **React 19** - Biblioteka UI

## Struktura

```
apps/web/
├── app/
│   ├── health/          # Endpoint statusu systemu
│   ├── login/           # Strona logowania (placeholder)
│   ├── schedule-builder/ # Kreator grafików (placeholder)
│   ├── layout.tsx       # Layout główny
│   ├── page.tsx         # Strona główna
│   └── globals.css      # Style globalne
├── public/              # Pliki statyczne
└── package.json
```

## Uruchomienie

### Development
```bash
npm run dev
```
Aplikacja będzie dostępna pod adresem: http://localhost:3001

### Full dev stack (API + web + legacy)

Użyj `docker-compose.dev.yml`, aby jednocześnie uruchomić Postgresa, API V2, Next.js (WEB V2) i legacy Vite za reverse proxy na porcie 8080:

```bash
docker compose -f ../../docker-compose.dev.yml up --build
```

- `http://localhost:8080/schedule-builder` — WEB V2 (domyślny kreator)
- `http://localhost:8080/schedule-builder/legacy` — awaryjny dostęp do legacy Vite
- `http://localhost:8080/api/v2/health` — health-check API V2

### Build
```bash
npm run build
```

### Production
```bash
npm run start
```

## Strony

- `/` - Strona główna z nawigacją
- `/health` - Status systemu i usług
- `/login` - Formularz logowania (bez integracji z API)
- `/schedule-builder` - Kreator grafików (layout bez logiki)

## Stylowanie

Aplikacja używa tego samego systemu kolorów i motywu co legacy app:
- Zmienne CSS dla kolorów i motywów
- Wsparcie dla trybu ciemnego
- Komponenty zgodne z istniejącym designem
- Font: Manrope

## Integracja z API

Aplikacja jest przygotowana do integracji z API V2. Obecnie wszystkie strony używają danych testowych i placeholderów.

## Następne kroki

1. Integracja z API V2
2. Implementacja autentykacji
3. Dodanie pełnej funkcjonalności kreatora grafików
4. Rozbudowa o kolejne moduły systemu

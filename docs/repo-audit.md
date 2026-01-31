# Repo audit (KadryHR)

## Wykonane komendy

```
pnpm -r install
pnpm -r lint
pnpm -r typecheck
pnpm -r test
pnpm --filter frontend-v2 build
```

## Wyniki

### pnpm -r install
- Błąd `ERR_PNPM_FETCH_403` podczas pobierania `@tailwindcss/postcss` z rejestru `https://registry.npmjs.org/` (brak autoryzacji). Instalacja nie została dokończona.

### pnpm -r lint
- `frontend-v2`: brak pakietu `eslint` (wynik uboczny nieudanej instalacji).
- `backend-v2`: brak pakietu `@eslint/js` (wynik uboczny nieudanej instalacji).

### pnpm -r typecheck
- `frontend-v2`: masowe błędy TypeScript dotyczące brakujących paczek (`react`, `next`, `@types/*`).
  - Główna przyczyna: brak zależności po nieudanym `pnpm install`.

### pnpm -r test
- `backend-v2`: `jest` nie znaleziony (brak zależności).
- `frontend-v2`: testy uruchamiane, ale środowisko niekompletne bez `node_modules`.

### pnpm --filter frontend-v2 build
- `next: not found` (brak zależności po nieudanym `pnpm install`).

## Naprawione w ramach feature
- Usunięto możliwość ustawiania avatar URL w profilu użytkownika i dodano upload multipart do VPS (backend + frontend).
- Dodano ścieżki avatarów po stronie bazy (`avatarPath`) oraz mapowanie `avatarUrl` w API.
- Dodano CTA „Zaloguj / Zarejestruj” na landing page.

## Problemy pozostające
- Nieudana instalacja `pnpm` z powodu 403 (brak auth do registry). Bez tego lint/typecheck/test/build nie przechodzą.

## Rekomendacje
- Ustawić prawidłowe poświadczenia do npm registry lub użyć standardowego `npm install` w `frontend-v2` i `backend-v2`.
- Po instalacji zależności ponowić lint/typecheck/test/build.

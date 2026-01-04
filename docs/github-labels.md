# GitHub labels (KadryHR)

Use consistent labels on Issues and PRs to keep the workflow predictable. Apply at least one `type:*` and one `area:*` label to every Issue/PR, plus priority/status as needed.

## Recommended labels

### Typ
| Nazwa | Opis | Kolor | Kiedy używać |
| --- | --- | --- | --- |
| `type:feature` | Nowa funkcjonalność dla użytkowników | `#0E8A16` | Gdy PR/Issue dodaje nowe możliwości lub ekrany |
| `type:bug` | Poprawa błędu produkcyjnego/testowego | `#D73A4A` | Gdy naprawiamy zgłoszony problem | 
| `type:refactor` | Zmiana wewnętrzna bez wpływu na funkcje | `#A371F7` | Porządki kodu, poprawa architektury |
| `type:chore` | Utrzymanie / proces / narzędzia | `#6A737D` | CI/CD, automatyzacje, skrypty, meta-prace |
| `type:docs` | Dokumentacja tylko | `#1D76DB` | Aktualizacje wyłącznie w docs |

### Obszar
| Nazwa | Opis | Kolor | Kiedy używać |
| --- | --- | --- | --- |
| `area:backend` | Backend (NestJS/Prisma, kolejki) | `#5319E7` | Zmiany w backend-v2 | 
| `area:frontend` | Frontend (Next.js) | `#0052CC` | Zmiany w frontend-v2 |
| `area:auth` | Uwierzytelnianie / SSO / zaproszenia | `#FBCA04` | Flows logowania, zaproszenia, reset hasła |
| `area:grafik` | Grafiki / harmonogramy | `#0B5FFF` | Feature'y dot. grafików | 
| `area:notifications` | Powiadomienia / e-maile / kolejki | `#E99695` | Kanały powiadomień i kolejki |
| `area:admin-panel` | Panel operatora KadryHR | `#BFD4F2` | Funkcje wewnętrzne dla operatorów |
| `area:meta` | Repo meta, proces, tooling | `#C2E0C6` | Szablony, skrypty, konfiguracja |

### Priorytet
| Nazwa | Opis | Kolor | Kiedy używać |
| --- | --- | --- | --- |
| `priority:high` | Krytyczne, blokuje wydanie | `#B60205` | Sytuacje produkcyjne lub twardy termin |
| `priority:medium` | Ważne, ale nie blokuje | `#D4C5F9` | Planowane na bieżący sprint |
| `priority:low` | Nice-to-have | `#C5DEF5` | Może poczekać, prace porządkowe |

### Status
| Nazwa | Opis | Kolor | Kiedy używać |
| --- | --- | --- | --- |
| `status:ready-for-dev` | Gotowe do implementacji | `#0E8A16` | Akceptowane wymagania, można zacząć | 
| `status:in-progress` | W trakcie pracy | `#F9D0C4` | PR/Issue jest realizowany |
| `status:blocked` | Zablokowane | `#D93F0B` | Brak decyzji/dostępów, zależności |
| `status:needs-design` | Wymaga decyzji UX/UI | `#5319E7` | Potrzebne makiety / copy |

## Tworzenie labeli

Automatyzacja: uruchom jednorazowo skrypt `scripts/create-github-labels.ts` z tokenem osobistym z uprawnieniem `repo`.

```
# Prerekwizyty: node 18+, pnpm/npm z ts-node lub npx ts-node
export GITHUB_TOKEN=<token_z_uprawnieniem_repo>
export GITHUB_REPO="owner/nazwa-repo"  # np. KadryHR/KadryHR
npx ts-node scripts/create-github-labels.ts
```

Jeżeli API nie jest dostępne, utwórz etykiety ręcznie w ustawieniach GitHub, używając nazw/kolorów z tabeli.

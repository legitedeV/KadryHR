# KadryHR Changelog

Każdy PR powinien dopisać krótką pozycję do listy poniżej. Format wpisu: `- [#PR] Krótkie podsumowanie (type:..., area:...)` z datą w formacie `YYYY-MM-DD`. Utrzymuj sekcję `Unreleased` dla zmian oczekujących na wydanie.

## [Unreleased]

- (tu dopisujemy elementy z PR przed wydaniem)
- [#XXX] 2026-01-05 – Frontend stabilization: build fixed, routes verified (see PR #XXX) (type:fix, area:frontend)
- [#PR] 2026-01-20 Naprawa przepływów e-mail: newsletter subscribe/confirm, ponowne zaproszenia pracowników oraz rejestracja właściciela (type:fix, area:email/auth)
- [#PR] 2026-01-12 Fix employee invitation + resend flow, add missing Organisation.preventShiftOnApprovedLeave migration, harden error handling (type:fix, area:auth/employees)
- [#PR] 2026-01-15 Udokumentowano aktualne problemy z przepływami e-mail (newsletter, rejestracja ownera, ponowne zaproszenia) i ich status w macierzy funkcji, aby ułatwić dalsze śledzenie regresji (type:docs, area:email)

## 2026-01-04

- [#XXX] Setup repo workflow: PR template, prompt library, labels guide, initial changelog (type:chore, area:meta)

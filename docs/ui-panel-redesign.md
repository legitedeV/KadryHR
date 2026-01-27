# UI Panel Redesign (Square Light)

## Cel
Nowa baza wizualna dla `/panel`: jasny ecru, off-white powierzchnie, ciepłe obramowania, brak glass/blur/glow, maksymalny radius 8px.

## Tokeny (CSS variables)
- **Tło panelu:** `--panel-bg: #F7F2E8` (ecru)
- **Powierzchnie:** `--panel-card-bg: #FFFDF7`
- **Border:** `--panel-card-border: #E6DED2`
- **Tekst bazowy:** `--body-text: #1F2937`
- **Akcent (sage/zieleń):** `--color-brand-*` / `--color-accent-*`

## Radius
- **Maksymalny radius:** `8px` (`--radius-xl`, `--radius-2xl`, `--radius-panel` = `0.5rem`).
- **Zakazy:** `rounded-2xl`, `rounded-3xl`, `rounded-full` jako domyślne w `/panel`.
- **Pills:** brak domyślnego „pill” — używamy `rounded-md/rounded-lg`.

## Cienie
- **Minimalne:** preferuj border; cienie tylko subtelne `0 1px 2px`.
- **Zakazy:** glow, duże drop shadow, “elevated” look.

## Glass / Blur
- **Zakaz:** glassmorphism i `backdrop-blur` w `/panel`.
- **Zastępuj:** solidne tła + ciepły border.

## Komponenty bazowe (przykłady)
- **Karty:** `.panel-card` / `.panel-card-soft` → tło `--panel-card-bg`, border `--panel-card-border`, radius ≤ 8px, bez blur.
- **Układ strony:** `.panel-page` → solid background, subtelny border, brak gradientów.
- **Inputy i przyciski:** `rounded-md/rounded-lg`, bez pill.

## Zakazy (do code review)
- `rounded-2xl`, `rounded-3xl`, `rounded-full` w `/panel`.
- `backdrop-blur`, `.glass-panel`, `shadow-glow`.
- gradienty tła w panelu (chyba że uzasadnione w konkretnym komponencie).

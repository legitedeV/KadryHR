# KadryHR branding

## Logo variants

- **Full logo** (`/brand/kadryhr-logo-full-light.svg`, `/brand/kadryhr-logo-full-dark.svg`)
  - Use on marketing navigation bars, hero sections, and anywhere the full "KadryHR.pl" wordmark with tagline is appropriate.
- **Compact logo** (`/brand/kadryhr-logo-compact-light.svg`, `/brand/kadryhr-logo-compact-dark.svg`)
  - Use inside the authenticated panel sidebar/topbar and on auth forms when space is constrained. Shows the KadryHR wordmark without the `.pl` suffix.
- **Icon / mark** (`/brand/kadryhr-logo-mark.svg`)
  - Use for collapsed navigation, favicon, app icons, and very small placements.

All assets live under `frontend-v2/public/brand` and should be supplied as SVG for crisp rendering on retina screens. PNG fallbacks for favicons are generated under `frontend-v2/public`.

## Component usage

Use the shared logo component from `frontend-v2/components/brand/Logo.tsx`. It renders light/dark assets with `next/image` and
switches automatically via Tailwind's `dark` classes:

```tsx
<Logo variant="full" size="md" showTagline />
<Logo variant="compact" size="sm" />
<LogoMark size="sm" ariaLabel="KadryHR" />
```

Props:
- `variant`: `"full" | "compact" | "icon"`
- `size`: `"sm" | "md" | "lg"` (centralized sizing)
- `showTagline`: adds the "Kadry i płace bez tajemnic" tagline next to the mark
- `asLink`: wraps the logo in a link target (e.g., `/` or `/panel/dashboard`)
 - `align`: `"row" | "column"` for stacking in constrained layouts
 - `priority`: forward to `next/image` when the logo is above the fold
 - `alt`/`label`: customize accessible text (defaults include the tagline when `showTagline` is true)

## Placement & spacing

- Minimum logo height in navbars: `2.5rem` (`size="sm"` fits).
- Keep at least `0.75rem` horizontal padding around the logo to avoid crowding nearby nav items.
- On dark backgrounds, the component shows the `*dark.svg` variant automatically via `dark:` classes (no `picture` tag required).

## Favicons & metadata

- Favicon mark: `/favicon.svg`, `/favicon-32x32.png`, `/favicon-16x16.png`
- Apple touch icon: `/apple-touch-icon.png`
- Manifest: `/site.webmanifest`

These are wired in `app/layout.tsx` metadata so replacements only require swapping the files in `public/`.

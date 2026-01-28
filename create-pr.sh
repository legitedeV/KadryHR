#!/bin/bash

# Script to create Pull Request using GitHub CLI
# Run this after authenticating with: gh auth login

REPO="legitedeV/KadryHR"
BRANCH="feature/enterprise-landing-redesign"
BASE="main"
TITLE="feat: Enterprise landing redesign with dark premium theme"

BODY=$(cat <<'EOF'
## 📝 Opis

Pełna przebudowa landing page na dark, premium, enterprise theme zgodny ze stylem panelu KadryHR.

![Landing Preview](https://github.com/user-attachments/assets/809cb90c-c00e-452a-9814-e43207ec9e2c)

### ✅ Co zostało zrobione

#### Rebuild wszystkich komponentów landing
- **Topbar**: Dark theme, link do panelu
- **Navbar**: Sticky navbar, brand gradient logo "KadryHR"
- **Hero**: Full-width hero z gradient accent "grafikami", inline SVG
- **Services**: 4 karty funkcji z inline SVG icons
- **About**: Features z checkmark icons
- **Contact**: Dark formularz kontaktowy
- **Footer**: 4 kolumny, social links

#### Usunięcie starych komponentów
- ❌ TestimonialsSection.tsx
- ❌ TrustSection.tsx
- ❌ 6x SVG illustrations (replaced with inline SVG)

#### Tech Stack
- Tailwind v4 tokens (@theme)
- Dark surface-950 background
- Brand/accent gradients
- Responsive: desktop + mobile
- Inline SVG (no external images)

### ✅ Testy
- [x] `npm run build` - PASSED (21 routes)
- [x] `npm run lint` - OK
- [x] Screenshots: desktop (1440x900) + mobile (390x844)
- [x] Brak regresji w /panel

### 📸 Screenshots
- Desktop: `frontend-v2/docs/screenshots/landing-desktop.png`
- Mobile: `frontend-v2/docs/screenshots/landing-mobile.png`

### 📊 Changes
- Modified: 8 components
- Deleted: 10 files (2 components + 8 assets)
- Added: 3 files (2 screenshots + 1 script)
- Net: +383 / -207 lines

---
**Ready for review and merge to main**
EOF
)

echo "Creating Pull Request..."
echo "Repo: $REPO"
echo "Branch: $BRANCH -> $BASE"
echo ""

# Create PR using gh CLI
gh pr create \
  --repo "$REPO" \
  --base "$BASE" \
  --head "$BRANCH" \
  --title "$TITLE" \
  --body "$BODY" \
  --label "enhancement" \
  --label "frontend"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Pull Request created successfully!"
  echo ""
  echo "View PR: gh pr view --web"
else
  echo ""
  echo "❌ Failed to create Pull Request"
  echo "Please ensure you're authenticated: gh auth login"
  exit 1
fi

#!/usr/bin/env bash
set -euo pipefail

# Download RealFaviconGenerator assets for the Next.js app.
# Source: https://realfavicongenerator.net/

cd "$(dirname "$0")/.."

mkdir -p app
mkdir -p public

curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/icon1.png" -o "app/icon1.png"
curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/icon0.svg" -o "app/icon0.svg"
curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/favicon.ico" -o "app/favicon.ico"
curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/apple-icon.png" -o "app/apple-icon.png"
curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/manifest.json" -o "app/manifest.json"

curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/web-app-manifest-192x192.png" -o "public/web-app-manifest-192x192.png"
curl -fSL "https://realfavicongenerator.net/files/9728493b-f7a7-41ce-8c98-c67543bc053b/web-app-manifest-512x512.png" -o "public/web-app-manifest-512x512.png"

# Deploy (CI/CD)

## Workflowy

- **CI**: `.github/workflows/ci.yml`
  - lint, typecheck, test, build
  - `pnpm audit` dla bezpieczeństwa
- **Deploy**: `.github/workflows/deploy.yml`
  - wdraża na VPS po push do `main`
- **PR Automation**: `.github/workflows/create-pr.yml`
  - tworzy PR z gałęzi feature do `main`

## Sekrety GitHub

Wymagane sekrety dla deploy:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

Dla automatycznego PR:
- `PR_GITHUB_TOKEN` (token z uprawnieniami do repo)

## VPS Deploy

Workflow deploy robi:
```
git fetch --all
git reset --hard origin/main
docker compose pull
docker compose up -d --force-recreate
```

Jeśli nie używasz registry, workflow przełączy się na `docker compose build`.

## Instrukcja ręczna

```
ssh $VPS_USER@$VPS_HOST
cd /opt/kadryhr
git pull
docker compose up -d --force-recreate
```

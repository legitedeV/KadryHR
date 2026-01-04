/**
 * Sync KadryHR labels via GitHub API.
 * Usage:
 *   export GITHUB_TOKEN=<token with repo scope>
 *   export GITHUB_REPO="owner/name"  // e.g., KadryHR/KadryHR
 *   npx ts-node scripts/create-github-labels.ts
 */

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPO;

if (!token || !repo) {
  console.error("GITHUB_TOKEN and GITHUB_REPO are required.");
  process.exit(1);
}

const labels = [
  // Type
  { name: "type:feature", color: "0E8A16", description: "Nowa funkcjonalność dla użytkowników" },
  { name: "type:bug", color: "D73A4A", description: "Poprawa błędu produkcyjnego/testowego" },
  { name: "type:refactor", color: "A371F7", description: "Zmiana wewnętrzna bez wpływu na funkcje" },
  { name: "type:chore", color: "6A737D", description: "Utrzymanie / proces / narzędzia" },
  { name: "type:docs", color: "1D76DB", description: "Zmiany tylko w dokumentacji" },
  // Area
  { name: "area:backend", color: "5319E7", description: "Backend (NestJS/Prisma, kolejki)" },
  { name: "area:frontend", color: "0052CC", description: "Frontend (Next.js)" },
  { name: "area:auth", color: "FBCA04", description: "Uwierzytelnianie / zaproszenia" },
  { name: "area:grafik", color: "0B5FFF", description: "Grafiki / harmonogramy" },
  { name: "area:notifications", color: "E99695", description: "Powiadomienia / e-maile / kolejki" },
  { name: "area:admin-panel", color: "BFD4F2", description: "Panel operatora KadryHR" },
  { name: "area:meta", color: "C2E0C6", description: "Repo meta, proces, tooling" },
  // Priority
  { name: "priority:high", color: "B60205", description: "Krytyczne, blokuje wydanie" },
  { name: "priority:medium", color: "D4C5F9", description: "Ważne, ale nie blokuje" },
  { name: "priority:low", color: "C5DEF5", description: "Nice-to-have" },
  // Status
  { name: "status:ready-for-dev", color: "0E8A16", description: "Gotowe do implementacji" },
  { name: "status:in-progress", color: "F9D0C4", description: "W trakcie pracy" },
  { name: "status:blocked", color: "D93F0B", description: "Zablokowane" },
  { name: "status:needs-design", color: "5319E7", description: "Wymaga decyzji UX/UI" },
];

const api = "https://api.github.com";

async function createOrUpdateLabel(label: { name: string; color: string; description: string }) {
  const url = `${api}/repos/${repo}/labels`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "kadryhr-label-sync",
    },
    body: JSON.stringify(label),
  });

  if (res.status === 201) {
    console.log(`Created label: ${label.name}`);
    return;
  }

  if (res.status === 422) {
    const patchUrl = `${api}/repos/${repo}/labels/${encodeURIComponent(label.name)}`;
    const patch = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "kadryhr-label-sync",
      },
      body: JSON.stringify(label),
    });
    if (patch.ok) {
      console.log(`Updated label: ${label.name}`);
    } else {
      console.error(`Failed to update ${label.name}: ${patch.status} ${patch.statusText}`);
    }
    return;
  }

  console.error(`Failed to create ${label.name}: ${res.status} ${res.statusText}`);
  const body = await res.text();
  console.error(body);
}

async function main() {
  for (const label of labels) {
    await createOrUpdateLabel(label);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

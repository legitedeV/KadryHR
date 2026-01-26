const labels = [
  // === type:* ===
  {
    name: "type:feature",
    description: "Nowa funkcjonalność dla użytkowników",
    color: "0E8A16",
  },
  {
    name: "type:bug",
    description: "Poprawa błędu produkcyjnego/testowego",
    color: "D73A4A",
  },
  {
    name: "type:refactor",
    description: "Zmiana wewnętrzna bez wpływu na funkcje",
    color: "A371F7",
  },
  {
    name: "type:chore",
    description: "Utrzymanie / proces / narzędzia",
    color: "6A737D",
  },
  {
    name: "type:docs",
    description: "Zmiany wyłącznie w dokumentacji",
    color: "1D76DB",
  },

  // === area:* ===
  {
    name: "area:backend",
    description: "Backend (NestJS/Prisma, kolejki)",
    color: "5319E7",
  },
  {
    name: "area:frontend",
    description: "Frontend (Next.js)",
    color: "0052CC",
  },
  {
    name: "area:auth",
    description: "Uwierzytelnianie / SSO / zaproszenia",
    color: "FBCA04",
  },
  {
    name: "area:grafik",
    description: "Grafiki / harmonogramy",
    color: "0B5FFF",
  },
  {
    name: "area:notifications",
    description: "Powiadomienia / e-maile / kolejki",
    color: "E99695",
  },
  {
    name: "area:admin-panel",
    description: "Panel operatora KadryHR",
    color: "BFD4F2",
  },
  {
    name: "area:meta",
    description: "Repo meta, proces, tooling",
    color: "C2E0C6",
  },

  // === priority:* ===
  {
    name: "priority:high",
    description: "Krytyczne, blokuje wydanie",
    color: "B60205",
  },
  {
    name: "priority:medium",
    description: "Ważne, ale nie blokuje",
    color: "D4C5F9",
  },
  {
    name: "priority:low",
    description: "Nice-to-have",
    color: "C5DEF5",
  },

  // === status:* ===
  {
    name: "status:ready-for-dev",
    description: "Gotowe do implementacji",
    color: "0E8A16",
  },
  {
    name: "status:in-progress",
    description: "W trakcie pracy",
    color: "F9D0C4",
  },
  {
    name: "status:blocked",
    description: "Zablokowane (brak decyzji / zależności)",
    color: "D93F0B",
  },
  {
    name: "status:needs-design",
    description: "Wymaga decyzji UX/UI",
    color: "5319E7",
  },
];

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function upsertLabel(owner, repo, label) {
  const token = getEnv("GITHUB_TOKEN");

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "kadryhr-label-script",
  };

  const encodedName = encodeURIComponent(label.name);
  const getUrl = `https://api.github.com/repos/${owner}/${repo}/labels/${encodedName}`;
  const createUrl = `https://api.github.com/repos/${owner}/${repo}/labels`;

  const getRes = await fetch(getUrl, { headers });

  if (getRes.status === 404) {
    console.log(`Creating label: ${label.name}`);
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: label.name,
        description: label.description,
        color: label.color,
      }),
    });

    if (!createRes.ok) {
      const body = await createRes.text();
      throw new Error(
        `Failed to create label ${label.name}: ${createRes.status} ${body}`,
      );
    }
  } else if (getRes.ok) {
    console.log(`Updating label: ${label.name}`);
    const updateRes = await fetch(getUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: label.name,
        description: label.description,
        color: label.color,
      }),
    });

    if (!updateRes.ok) {
      const body = await updateRes.text();
      throw new Error(
        `Failed to update label ${label.name}: ${updateRes.status} ${body}`,
      );
    }
  } else {
    const body = await getRes.text();
    throw new Error(
      `Failed to get label ${label.name}: ${getRes.status} ${body}`,
    );
  }
}

async function main() {
  const repoEnv = getEnv("GITHUB_REPO"); // np. "legitedeV/KadryHR"
  const [owner, repo] = repoEnv.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPO value: ${repoEnv}`);
  }

  console.log(`Syncing labels for repo ${owner}/${repo}...`);

  for (const label of labels) {
    await upsertLabel(owner, repo, label);
  }

  console.log("Done. Labels synced.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

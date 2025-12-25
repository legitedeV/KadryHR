const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');

const tryRequire = (moduleName) => {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(moduleName);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn(`[backend-shim] Optional dependency missing: ${moduleName}.`);
      return null;
    }
    throw error;
  }
};

const findFirstExisting = (candidates) => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { found: candidate, tried: candidates };
    }
  }
  return { found: null, tried: candidates };
};

const loadEnvironment = () => {
  const envCandidates = [
    path.join(__dirname, '.env'),
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, 'apps', 'legacy-api', '.env'),
    path.join(ROOT_DIR, 'apps', 'api', '.env'),
  ];

  const { found, tried } = findFirstExisting(envCandidates);
  if (!found) {
    console.warn(`[backend-shim] No .env file found. Checked:\n${tried.join('\n')}`);
    return;
  }

  const dotenv = tryRequire('dotenv');
  if (dotenv) {
    dotenv.config({ path: found });
    console.info(`[backend-shim] Loaded environment from ${found}`);
  } else {
    console.warn(`[backend-shim] Skipping .env load because dotenv is not installed. Checked:\n${tried.join('\n')}`);
  }
};

const attachModulePaths = (baseDir) => {
  const extraPaths = [
    path.join(baseDir, 'node_modules'),
    path.join(ROOT_DIR, 'node_modules'),
  ];

  for (const candidate of extraPaths) {
    if (fs.existsSync(candidate) && !module.paths.includes(candidate)) {
      module.paths.push(candidate);
    }
  }
};

const resolveEntrypoint = () => {
  const entryCandidates = [
    {
      label: 'Legacy Express API (source)',
      path: path.join(ROOT_DIR, 'apps', 'legacy-api', 'server.js'),
    },
    {
      label: 'Legacy Express API (built)',
      path: path.join(ROOT_DIR, 'apps', 'legacy-api', 'dist', 'server.js'),
    },
    {
      label: 'NestJS API (dist)',
      path: path.join(ROOT_DIR, 'apps', 'api', 'dist', 'main.js'),
    },
  ];

  const { found, tried } = findFirstExisting(entryCandidates.map((item) => item.path));
  if (!found) {
    const errorDetails = tried.map((candidate) => ` - ${candidate}`).join('\n');
    throw new Error(`Backend entrypoint not found. Checked:\n${errorDetails}`);
  }

  const selected = entryCandidates.find((item) => item.path === found);
  console.info(`[backend-shim] Starting: ${selected.label} (${selected.path})`);
  return selected.path;
};

loadEnvironment();

const entrypoint = resolveEntrypoint();
const entryDir = path.dirname(entrypoint);

if (process.cwd() !== entryDir) {
  process.chdir(entryDir);
}

attachModulePaths(entryDir);

try {
  // Start the selected backend entrypoint (CommonJS only)
  // eslint-disable-next-line import/no-dynamic-require, global-require
  require(entrypoint);
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    const moduleName = error.message?.match(/Cannot find module '([^']+)'/);
    const missing = moduleName ? moduleName[1] : 'unknown module';
    const hint = `Missing dependency (${missing}). Ensure `
      + `npm install --omit=dev is run in the API directory before starting PM2.`;
    console.error(`[backend-shim] ${hint}`);
  }
  throw error;
}

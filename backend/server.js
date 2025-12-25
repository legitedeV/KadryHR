const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load the first available .env file to keep compatibility with existing deployments
const envCandidates = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', 'apps', 'legacy-api', '.env'),
  path.join(__dirname, '..', 'apps', 'api', '.env'),
];

const envPath = envCandidates.find(fs.existsSync);
if (envPath) {
  dotenv.config({ path: envPath });
}

const entryCandidates = [
  // Legacy Express API
  path.join(__dirname, '..', 'apps', 'legacy-api', 'server.js'),
  path.join(__dirname, '..', 'apps', 'legacy-api', 'dist', 'server.js'),
  // New NestJS API build output
  path.join(__dirname, '..', 'apps', 'api', 'dist', 'main.js'),
];

const entrypoint = entryCandidates.find(fs.existsSync);
if (!entrypoint) {
  const errorDetails = entryCandidates.map((candidate) => ` - ${candidate}`).join('\n');
  throw new Error(`Backend entrypoint not found. Checked:\n${errorDetails}`);
}

const entryDir = path.dirname(entrypoint);
if (process.cwd() !== entryDir) {
  process.chdir(entryDir);
}

// Start the selected backend entrypoint (CommonJS only)
require(entrypoint);

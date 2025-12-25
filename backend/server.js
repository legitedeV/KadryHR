const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from common locations to stay backward compatible
const envCandidates = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', 'apps', 'legacy-api', '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const legacyApiDir = path.join(__dirname, '..', 'apps', 'legacy-api');
const legacyEntrypoint = path.join(legacyApiDir, 'server.js');

if (!fs.existsSync(legacyEntrypoint)) {
  throw new Error(`Legacy API entrypoint not found at ${legacyEntrypoint}`);
}

// Ensure process.cwd matches the legacy API location for relative assets and logging
process.chdir(legacyApiDir);

// Start the legacy Express server
require(legacyEntrypoint);

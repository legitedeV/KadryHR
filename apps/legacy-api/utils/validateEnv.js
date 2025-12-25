const logger = require('./logger');

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'MONGO_URI',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'FRONTEND_URL',
  'CLIENT_URL',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    const message = `Brak wymaganych zmiennych środowiskowych: ${missing.join(', ')}`;
    if (logger && typeof logger.error === 'function') {
      logger.error(message);
    }
    throw new Error(message);
  }
}

module.exports = { validateEnv };

// utils/logger.js
// Kolorowe, strukturalne logowanie

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Kolory tekstu
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Kolory tła
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const logger = {
  info: (message, data = null) => {
    console.log(
      `${colors.cyan}ℹ️  INFO${colors.reset} [${getTimestamp()}] ${message}`,
      data ? `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}` : ''
    );
  },

  success: (message, data = null) => {
    console.log(
      `${colors.green}✅ SUCCESS${colors.reset} [${getTimestamp()}] ${message}`,
      data ? `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}` : ''
    );
  },

  warn: (message, data = null) => {
    console.warn(
      `${colors.yellow}⚠️  WARNING${colors.reset} [${getTimestamp()}] ${message}`,
      data ? `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}` : ''
    );
  },

  error: (message, error = null) => {
    console.error(
      `${colors.red}❌ ERROR${colors.reset} [${getTimestamp()}] ${message}`,
      error ? `\n${colors.red}${error.stack || error}${colors.reset}` : ''
    );
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.magenta}🔍 DEBUG${colors.reset} [${getTimestamp()}] ${message}`,
        data ? `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}` : ''
      );
    }
  },

  request: (req) => {
    const method = req.method;
    const path = req.path;
    const ip = req.ip;
    const requestId = req.requestId ? `[#${req.requestId}] ` : '';
    
    let methodColor = colors.cyan;
    if (method === 'POST') methodColor = colors.green;
    if (method === 'PUT' || method === 'PATCH') methodColor = colors.yellow;
    if (method === 'DELETE') methodColor = colors.red;

    console.log(
      `${requestId}${methodColor}${method}${colors.reset} ${path} ${colors.dim}from ${ip}${colors.reset}`
    );
  },

  response: (req, res, duration) => {
    const status = res.statusCode;
    let statusColor = colors.green;
    const requestId = req.requestId ? `[#${req.requestId}] ` : '';
    
    if (status >= 400 && status < 500) statusColor = colors.yellow;
    if (status >= 500) statusColor = colors.red;

    console.log(
      `${requestId}${statusColor}${status}${colors.reset} ${req.method} ${req.path} ${colors.dim}${duration.toFixed(1)}ms${colors.reset}`
    );
  },

  database: (operation, collection, data = null) => {
    console.log(
      `${colors.blue}💾 DB${colors.reset} [${operation}] ${collection}`,
      data ? `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}` : ''
    );
  },

  auth: (action, user) => {
    console.log(
      `${colors.magenta}🔐 AUTH${colors.reset} [${action}] ${user.email || user.id || 'unknown'}`,
      user.role ? `${colors.dim}(${user.role})${colors.reset}` : ''
    );
  },

  performance: (label, duration) => {
    let color = colors.green;
    if (duration > 1000) color = colors.red;
    else if (duration > 500) color = colors.yellow;
    
    console.log(
      `${color}⚡ PERF${colors.reset} [${label}] ${duration}ms`
    );
  },

  cache: (action, key, details = '') => {
    const actionColors = {
      HIT: colors.green,
      MISS: colors.yellow,
      SET: colors.cyan,
      CLEAR: colors.red,
    };
    
    const color = actionColors[action] || colors.white;
    console.log(
      `${color}💾 CACHE${colors.reset} [${action}] ${key} ${colors.dim}${details}${colors.reset}`
    );
  },

  startup: (message) => {
    console.log(
      `\n${colors.bright}${colors.green}🚀 ${message}${colors.reset}\n`
    );
  },

  separator: () => {
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
  },
};

module.exports = logger;

const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

/**
 * Adds per-request correlation ID and structured response logging.
 * - Sets X-Request-Id header so the frontend/ops can correlate logs.
 * - Attaches requestId to req for downstream handlers and error responses.
 * - Logs response status with duration after the request finishes.
 */
module.exports = (req, res, next) => {
  const requestId = randomUUID();
  const startTime = process.hrtime.bigint();

  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Number(durationNs) / 1e6;
    logger.response(req, res, durationMs);
  });

  next();
};

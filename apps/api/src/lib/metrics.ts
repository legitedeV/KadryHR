import client from 'prom-client';
import { FastifyInstance } from 'fastify';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'kadryhr_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const httpRequestErrors = new client.Counter({
  name: 'kadryhr_http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestErrors);

export async function registerMetricsRoute(fastify: FastifyInstance) {
  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
  });
}

export { register as metricsRegistry };

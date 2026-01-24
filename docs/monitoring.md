# Monitoring & Logging

## Logowanie (JSON)

Backend używa wbudowanego loggera Fastify (Pino) z identyfikatorem żądania i polami:
- `requestId`
- `userId` (jeśli uwierzytelniony)
- `tenantId` (jeśli uwierzytelniony)

Zalecenie dla VPS: skonfigurować rotację logów Dockera (log-driver `json-file` + `max-size`, `max-file`).

## Metryki Prometheus

Backend udostępnia:
```
GET /metrics
```

Metryki:
- `kadryhr_http_request_duration_seconds`
- `kadryhr_http_request_errors_total`
- plus standardowe metryki Node.js (CPU, pamięć)

## Prometheus + Grafana (opcjonalnie)

W `infra/monitoring/` znajdziesz przykładowy stack:
- Prometheus
- Grafana

Start:
```
docker compose -f infra/monitoring/docker-compose.yml up -d
```

Grafana domyślnie słucha na `http://localhost:3000`.

## Alerting

Do alertów możesz użyć:
- Grafana Cloud (email/Slack)
- Alertmanager + webhooki

Utwórz reguły na bazie:
- `kadryhr_http_request_errors_total`
- latency > X sekund
